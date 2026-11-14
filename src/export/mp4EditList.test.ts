import { describe, it, expect } from 'vitest';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { addAudioEditList } from './mp4EditList';

// ---------------------------------------------------------------------------
// An independent mp4 reader, written from ISO/IEC 14496-12 (not shared with
// the code under test).
// ---------------------------------------------------------------------------

interface TBox {
  type: string;
  start: number;
  body: number;
  end: number;
}

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts']);

function walk(file: Uint8Array, from = 0, to = file.length, out: TBox[] = []): TBox[] {
  const v = new DataView(file.buffer, file.byteOffset, file.byteLength);
  for (let pos = from; pos + 8 <= to;) {
    const size = v.getUint32(pos);
    const type = String.fromCharCode(...file.subarray(pos + 4, pos + 8));
    const box = { type, start: pos, body: pos + 8, end: pos + (size || to - pos) };
    out.push(box);
    if (CONTAINERS.has(type)) walk(file, box.body, box.end, out);
    pos = box.end;
  }
  return out;
}

const u64 = (v: DataView, at: number) => v.getUint32(at) * 2 ** 32 + v.getUint32(at + 4);

/** Read {timescale, duration} of mvhd/mdhd, or {duration} of tkhd, by version. */
function header(file: Uint8Array, box: TBox) {
  const v = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const wide = v.getUint8(box.body) === 1;
  const b = box.body + 4; // after version + flags
  if (box.type === 'tkhd') {
    // creation, modification, track_ID u32, reserved u32, duration
    return { duration: wide ? u64(v, b + 16 + 8) : v.getUint32(b + 16) };
  }
  // creation, modification, timescale u32, duration
  return wide
    ? { timescale: v.getUint32(b + 16), duration: u64(v, b + 20) }
    : { timescale: v.getUint32(b + 8), duration: v.getUint32(b + 12) };
}

/** Per track: handler, tkhd duration, mdhd timescale/duration, elst entries, chunk offsets. */
function tracks(file: Uint8Array) {
  const v = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const all = walk(file);
  return all
    .filter((b) => b.type === 'trak')
    .map((trak) => {
      const inside = all.filter((b) => b.start >= trak.start && b.end <= trak.end);
      const get = (t: string) => inside.find((b) => b.type === t)!;
      const hdlr = get('hdlr');
      const elst = inside.find((b) => b.type === 'elst');
      const stco = get('stco');
      const count = v.getUint32(stco.body + 4);
      return {
        handler: String.fromCharCode(...file.subarray(hdlr.body + 8, hdlr.body + 12)),
        tkhd: header(file, get('tkhd')).duration,
        mdhd: header(file, get('mdhd')),
        elst: elst
          ? Array.from({ length: v.getUint32(elst.body + 4) }, (_, i) => ({
              segment: v.getUint32(elst.body + 8 + i * 12),
              mediaTime: v.getInt32(elst.body + 12 + i * 12),
            }))
          : [],
        offsets: Array.from({ length: count }, (_, i) => v.getUint32(stco.body + 8 + i * 4)),
      };
    });
}

function movie(file: Uint8Array) {
  return header(
    file,
    walk(file).find((b) => b.type === 'mvhd')!,
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** A real mp4-muxer file: 1 s of video (10 frames) and 1 s + 2112 priming of AAC packets. */
function muxerMp4(fastStart: 'in-memory' | 'fragmented' = 'in-memory'): Uint8Array {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: 16, height: 16, frameRate: 10 },
    audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 48_000 },
    fastStart,
    firstTimestampBehavior: 'offset',
  });
  const avcC = new Uint8Array([1, 0x42, 0, 0x1e, 0xff, 0xe0, 0, 0xe1, 0]);
  for (let i = 0; i < 10; i++) {
    muxer.addVideoChunkRaw(new Uint8Array([i, 1, 2, 3]), i === 0 ? 'key' : 'delta', i * 1e5, 1e5, {
      decoderConfig: { codec: 'avc1.42001e', description: avcC },
    });
  }
  const packets = Math.ceil((48_000 + 2112) / 1024);
  for (let i = 0; i < packets; i++) {
    muxer.addAudioChunkRaw(
      new Uint8Array([0xaa, i & 0xff]),
      'key',
      (i * 1024 * 1e6) / 48_000,
      (1024 * 1e6) / 48_000,
      {
        decoderConfig: {
          codec: 'mp4a.40.2',
          numberOfChannels: 2,
          sampleRate: 48_000,
          description: new Uint8Array([0x11, 0x90]),
        },
      },
    );
  }
  muxer.finalize();
  return new Uint8Array(target.buffer);
}

function box(type: string, ...parts: Uint8Array[]): Uint8Array {
  const size = 8 + parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(size);
  new DataView(out.buffer).setUint32(0, size);
  out.set(
    [...type].map((c) => c.charCodeAt(0)),
    4,
  );
  let at = 8;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** Big-endian fields: [width in bytes, value]. */
function fields(...list: Array<[number, number]>): Uint8Array {
  const out = new Uint8Array(list.reduce((n, [w]) => n + w, 0));
  const v = new DataView(out.buffer);
  let at = 0;
  for (const [w, value] of list) {
    if (w === 8) {
      v.setUint32(at, Math.floor(value / 2 ** 32));
      v.setUint32(at + 4, value >>> 0);
    } else if (w === 4) v.setUint32(at, value);
    else if (w === 2) v.setUint16(at, value);
    else v.setUint8(at, value);
    at += w;
  }
  return out;
}

/**
 * A hand-built audio-only mp4 with version-1 mvhd/tkhd/mdhd and one stco
 * entry. `offset` overrides the chunk offset (default: the mdat payload).
 */
function version1Mp4(offset?: number, empty?: string): Uint8Array {
  const zeros = (n: number) => new Uint8Array(n);
  // `empty` replaces that box with a header-only box (a truncated layout).
  const cut = (b: Uint8Array) => {
    const type = String.fromCharCode(...b.subarray(4, 8));
    return type === empty ? box(type) : b;
  };
  const build = (chunk: number) => {
    const mvhd = box(
      'mvhd',
      fields([4, 0x01000000], [8, 0], [8, 0], [4, 1000], [8, 1045]),
      zeros(80),
    );
    const tkhd = box(
      'tkhd',
      fields([4, 0x01000003], [8, 0], [8, 0], [4, 1], [4, 0], [8, 1045]),
      zeros(60),
    );
    const mdhd = box(
      'mdhd',
      fields([4, 0x01000000], [8, 0], [8, 0], [4, 48_000], [8, 50_176], [2, 0x55c4], [2, 0]),
    );
    const hdlr = box('hdlr', fields([4, 0], [4, 0]), new TextEncoder().encode('soun'), zeros(13));
    const stco = box('stco', fields([4, 0], [4, 1], [4, chunk]));
    const moov = box(
      'moov',
      cut(mvhd),
      box(
        'trak',
        cut(tkhd),
        box('mdia', cut(mdhd), cut(hdlr), box('minf', box('stbl', cut(stco)))),
      ),
    );
    const ftyp = box('ftyp', new TextEncoder().encode('isom'), zeros(4));
    return { ftyp, moov, mdat: box('mdat', new Uint8Array([0xde, 0xad, 0xbe, 0xef])) };
  };
  const first = build(0);
  const payload = first.ftyp.length + first.moov.length + 8;
  const { ftyp, moov, mdat } = build(offset ?? payload);
  const out = new Uint8Array(ftyp.length + moov.length + mdat.length);
  out.set(ftyp, 0);
  out.set(moov, ftyp.length);
  out.set(mdat, ftyp.length + moov.length);
  return out;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('addAudioEditList', () => {
  // MIGRATION: example for the property
  //   ∀ mp4 m from mp4-muxer with one audio track, ∀ delay d, length s:
  //   after addAudioEditList(m, d, s) the audio tkhd duration === round(s *
  //   movieTimescale), the elst is [{segment: that, mediaTime: d}], the mdhd
  //   and the other tracks are unchanged, mvhd === max of the tkhd durations,
  //   and every chunk offset points at the same sample bytes.
  // Replace with a property test once the suite lands.
  it('patches durations and offsets of a real mp4-muxer file', () => {
    const file = muxerMp4();
    const result = addAudioEditList(file, 2112, 1);
    expect('file' in result).toBe(true);
    const out = (result as { file: Uint8Array }).file;

    const [videoBefore, audioBefore] = tracks(file);
    const [video, audio] = tracks(out);
    expect(audio.handler).toBe('soun');
    expect(audioBefore.tkhd).toBe(1045); // priming + padding, before the patch
    expect(audio.tkhd).toBe(1000);
    expect(audio.elst).toEqual([{ segment: 1000, mediaTime: 2112 }]);
    expect(audio.mdhd).toEqual(audioBefore.mdhd);
    expect(video.tkhd).toBe(videoBefore.tkhd);
    expect(video.elst).toEqual([]);
    expect(movie(out)).toEqual({ timescale: 1000, duration: 1000 });
    for (const [before, after] of [
      [videoBefore, video],
      [audioBefore, audio],
    ]) {
      after.offsets.forEach((o, i) => {
        const a = before.offsets[i];
        expect(Array.from(out.subarray(o, o + 2))).toEqual(Array.from(file.subarray(a, a + 2)));
      });
    }
  });

  // MIGRATION: example for the property
  //   ∀ version-1 headers, the 64-bit duration fields are read and written whole.
  // Replace with a property test once the suite lands.
  it('writes the 64-bit tkhd and mvhd durations of version-1 headers', () => {
    const file = version1Mp4();
    const out = (addAudioEditList(file, 2112, 1) as { file: Uint8Array }).file;

    const [audio] = tracks(out);
    expect(audio.tkhd).toBe(1000);
    expect(audio.mdhd).toEqual({ timescale: 48_000, duration: 50_176 });
    expect(movie(out)).toEqual({ timescale: 1000, duration: 1000 });
    expect(Array.from(out.subarray(audio.offsets[0], audio.offsets[0] + 4))).toEqual([
      0xde, 0xad, 0xbe, 0xef,
    ]);
  });

  // MIGRATION: example for the property
  //   ∀ input the function cannot patch safely (fragmented, offset or field
  //   overflow, not an mp4), the result is { skipped } and the input is unchanged.
  // Replace with a property test once the suite lands.
  it('leaves fragmented, overflowing and unknown files unchanged', () => {
    const cases: Array<[Uint8Array, RegExp]> = [
      [muxerMp4('fragmented'), /fragmented/],
      [version1Mp4(0xfffffff0), /chunk offset/],
      [new Uint8Array(8), /mp4|moov/],
    ];
    for (const [file, reason] of cases) {
      const copy = file.slice();
      const result = addAudioEditList(file, 2112, 1);
      expect('skipped' in result && result.skipped).toMatch(reason);
      expect(file).toEqual(copy);
    }
    const huge = addAudioEditList(muxerMp4(), 2112, 2 ** 33);
    expect('skipped' in huge && huge.skipped).toMatch(/elst/);
  });
});

describe('addAudioEditList on truncated boxes', () => {
  // MIGRATION: example for the property
  //   ∀ mp4 whose mvhd, tkhd, mdhd, hdlr or stco payload is shorter than its
  //   fields, addAudioEditList returns { skipped } and never throws.
  // Replace with a property test once the suite lands.
  it('skips a file with an empty header or table box instead of throwing', () => {
    for (const empty of ['mvhd', 'tkhd', 'mdhd', 'hdlr', 'stco']) {
      const file = version1Mp4(undefined, empty);
      const copy = file.slice();
      const result = addAudioEditList(file, 2112, 1);
      expect('skipped' in result, empty).toBe(true);
      expect(file).toEqual(copy);
    }
  });
});
