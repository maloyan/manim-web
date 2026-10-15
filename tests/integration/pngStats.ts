// Dependency-free PNG reader for e2e render checks.
//
// Playwright screenshots composite the real pixels (SVG scenes and WebGL
// canvases alike), so decoding the screenshot is more reliable than reading a
// WebGL drawing buffer, which is cleared unless preserveDrawingBuffer is set.
// Only the 8-bit, non-interlaced, RGB/RGBA PNGs that Playwright emits are
// supported, which is all this suite needs.
import zlib from 'zlib';

export interface PixelStats {
  /** Total pixels. */
  total: number;
  /** Pixels brighter than near-black (max channel > 18). */
  nonBlack: number;
  /** Pixels with real hue (max-min channel spread > 20). */
  colored: number;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function pngStats(buf: Buffer): PixelStats {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
      const interlace = data.readUInt8(12);
      if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(
          `unsupported PNG: depth=${bitDepth} color=${colorType} interlace=${interlace}`,
        );
      }
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowIn = y * (stride + 1) + 1;
    const rowOut = y * stride;
    for (let x = 0; x < stride; x++) {
      const v = raw[rowIn + x];
      const a = x >= channels ? out[rowOut + x - channels] : 0;
      const b = y > 0 ? out[rowOut - stride + x] : 0;
      const c = y > 0 && x >= channels ? out[rowOut - stride + x - channels] : 0;
      let val: number;
      switch (filter) {
        case 0:
          val = v;
          break;
        case 1:
          val = v + a;
          break;
        case 2:
          val = v + b;
          break;
        case 3:
          val = v + ((a + b) >> 1);
          break;
        case 4:
          val = v + paeth(a, b, c);
          break;
        default:
          throw new Error(`bad filter ${filter}`);
      }
      out[rowOut + x] = val & 0xff;
    }
  }

  let nonBlack = 0;
  let colored = 0;
  const total = width * height;
  for (let i = 0; i < total; i++) {
    const o = i * channels;
    const r = out[o];
    const g = out[o + 1];
    const bl = out[o + 2];
    const max = Math.max(r, g, bl);
    const min = Math.min(r, g, bl);
    if (max > 18) nonBlack++;
    if (max - min > 20) colored++;
  }
  return { total, nonBlack, colored };
}
