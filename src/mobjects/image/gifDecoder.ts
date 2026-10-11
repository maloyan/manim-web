/**
 * GIF decoding seam for {@link AnimatedImageMobject}.
 *
 * The browser decodes a multi-frame GIF to an array of fully composited RGBA
 * frames plus per-frame delays. Decoding is done with the small, well
 * maintained `gifuct-js` library, which is LAZY-LOADED through a dynamic
 * `import()`. The static module graph never references `gifuct-js`, so the base
 * bundle stays small and SSR / Node never pull the decoder in for users who do
 * not touch animated GIFs. The dynamic import specifier is a literal, so
 * bundlers emit a separate chunk and static analysers (knip) still see the
 * dependency as used.
 *
 * Tests inject a mock decoder through `AnimatedImageMobject.setGifDecoder`,
 * which bypasses the dynamic import and the network entirely.
 */

/** One decoded GIF frame: a full-canvas RGBA buffer and its display delay. */
export interface DecodedGifFrame {
  /** Row-major RGBA pixels for the whole canvas (length = width * height * 4). */
  data: Uint8ClampedArray;
  /** How long this frame stays on screen, in milliseconds. */
  delay: number;
}

/** A decoded animated GIF: canvas size and the composited frames. */
export interface DecodedGif {
  /** Canvas width in pixels. */
  width: number;
  /** Canvas height in pixels. */
  height: number;
  /** Composited frames in play order. */
  frames: DecodedGifFrame[];
}

/**
 * A function that decodes a GIF source (URL or data URI) to {@link DecodedGif}.
 * This is the dependency-injection seam: tests set a mock decoder so the real
 * `gifuct-js` decoder and the network are never used.
 */
export type GifDecoder = (source: string) => Promise<DecodedGif>;

/** Frame delay used when a GIF reports 0 ms, matching browser behaviour. */
const DEFAULT_FRAME_DELAY_MS = 100;

/** Disposal method: restore the frame region to background (clear it). */
const DISPOSAL_RESTORE_BACKGROUND = 2;
/** Disposal method: restore the canvas to its state before this frame. */
const DISPOSAL_RESTORE_PREVIOUS = 3;

/** Minimal shape of the `gifuct-js` frame data this module consumes. */
interface GifuctFrame {
  dims: { width: number; height: number; top: number; left: number };
  patch: Uint8ClampedArray;
  delay: number;
  disposalType: number;
}

/**
 * Composite `gifuct-js` patches into full-canvas RGBA frames.
 *
 * Each GIF frame is a patch at an offset, and may ask to restore the region to
 * background or to the previous canvas afterwards. This walk honours those
 * disposal methods, so every output frame is a complete, directly displayable
 * image.
 */
function compositeGifFrames(
  frames: GifuctFrame[],
  width: number,
  height: number,
): DecodedGifFrame[] {
  const out: DecodedGifFrame[] = [];
  let canvas = new Uint8ClampedArray(width * height * 4);

  for (const frame of frames) {
    const { dims, patch, disposalType } = frame;
    const previous = disposalType === DISPOSAL_RESTORE_PREVIOUS ? canvas.slice() : null;

    for (let y = 0; y < dims.height; y++) {
      for (let x = 0; x < dims.width; x++) {
        const src = (y * dims.width + x) * 4;
        if (patch[src + 3] === 0) continue; // transparent: keep the pixel below
        const cx = dims.left + x;
        const cy = dims.top + y;
        if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
        const dst = (cy * width + cx) * 4;
        canvas[dst] = patch[src];
        canvas[dst + 1] = patch[src + 1];
        canvas[dst + 2] = patch[src + 2];
        canvas[dst + 3] = patch[src + 3];
      }
    }

    const delay = frame.delay > 0 ? frame.delay : DEFAULT_FRAME_DELAY_MS;
    out.push({ data: canvas.slice(), delay });

    if (disposalType === DISPOSAL_RESTORE_BACKGROUND) {
      clearRegion(canvas, width, height, dims);
    } else if (previous) {
      canvas = previous;
    }
  }

  return out;
}

/** Clear a rectangular region of the canvas to transparent background. */
function clearRegion(
  canvas: Uint8ClampedArray,
  width: number,
  height: number,
  dims: { width: number; height: number; top: number; left: number },
): void {
  for (let y = 0; y < dims.height; y++) {
    for (let x = 0; x < dims.width; x++) {
      const cx = dims.left + x;
      const cy = dims.top + y;
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      const dst = (cy * width + cx) * 4;
      canvas[dst] = 0;
      canvas[dst + 1] = 0;
      canvas[dst + 2] = 0;
      canvas[dst + 3] = 0;
    }
  }
}

/**
 * Default browser GIF decoder: fetch the bytes, then decode with `gifuct-js`.
 *
 * Node/SSR-safe: it refuses when there is no DOM instead of throwing at import
 * time. The decode itself is pure data work, but requiring a browser keeps this
 * a browser-only feature and makes the Node path fail fast and deterministically.
 */
export const defaultGifDecoder: GifDecoder = async (source: string): Promise<DecodedGif> => {
  if (typeof document === 'undefined') {
    throw new Error('AnimatedImageMobject: GIF decoding needs a browser (document is unavailable)');
  }
  if (typeof fetch === 'undefined') {
    throw new Error('AnimatedImageMobject: GIF decoding needs fetch (fetch is unavailable)');
  }

  const response = await fetch(source);
  const buffer = await response.arrayBuffer();

  const { parseGIF, decompressFrames } = await import('gifuct-js');
  const parsed = parseGIF(buffer);
  const frames = decompressFrames(parsed, true);

  const width = parsed.lsd.width;
  const height = parsed.lsd.height;
  return { width, height, frames: compositeGifFrames(frames, width, height) };
};
