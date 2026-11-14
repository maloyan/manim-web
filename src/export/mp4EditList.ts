/**
 * Add an edit list (`edts`/`elst`) to the audio track of a finished mp4.
 *
 * An AAC encoder puts priming samples (encoder delay) in front of the real
 * audio. A player skips them only when the container says so, with an edit
 * list whose `media_time` is the delay. mp4-muxer (5.x) writes no edit list
 * and accepts no negative timestamps, so the exporter adds the box to the
 * finished file here. Every source sample stays in the file; the edit list
 * only tells the player where the presentation starts and how long it lasts.
 *
 * The function handles the layout mp4-muxer writes (`ftyp`, `moov`, `mdat`,
 * with `moov` before or after `mdat`, not fragmented) and leaves any other
 * file unchanged.
 */

/** Size of the `edts` box this module inserts (edts header + elst with one entry). */
const EDTS_SIZE = 8 + 8 + 4 + 4 + 12;

interface Box {
  type: string;
  start: number;
  /** Offset of the box payload (after the size/type header). */
  body: number;
  end: number;
}

function readBoxes(view: DataView, from: number, to: number): Box[] | null {
  const boxes: Box[] = [];
  let pos = from;
  while (pos + 8 <= to) {
    let size = view.getUint32(pos);
    const type = String.fromCharCode(
      view.getUint8(pos + 4),
      view.getUint8(pos + 5),
      view.getUint8(pos + 6),
      view.getUint8(pos + 7),
    );
    let body = pos + 8;
    if (size === 1) {
      if (pos + 16 > to) return null;
      size = view.getUint32(pos + 8) * 2 ** 32 + view.getUint32(pos + 12);
      body = pos + 16;
    } else if (size === 0) {
      size = to - pos;
    }
    if (size < body - pos || pos + size > to) return null;
    boxes.push({ type, start: pos, body, end: pos + size });
    pos += size;
  }
  return pos === to ? boxes : null;
}

function child(view: DataView, parent: Box, type: string): Box | null {
  const boxes = readBoxes(view, parent.body, parent.end);
  return boxes?.find((b) => b.type === type) ?? null;
}

function path(view: DataView, parent: Box, types: string[]): Box | null {
  let box: Box | null = parent;
  for (const type of types) {
    if (!box) return null;
    box = child(view, box, type);
  }
  return box;
}

/**
 * Byte offset (from the box payload) and width of the timescale and duration
 * fields, per ISO/IEC 14496-12. All three are full boxes (version + flags).
 * - mvhd, mdhd v0: creation u32, modification u32, timescale u32, duration u32
 * - mvhd, mdhd v1: creation u64, modification u64, timescale u32, duration u64
 * - tkhd v0: creation u32, modification u32, track_ID u32, reserved u32, duration u32
 * - tkhd v1: creation u64, modification u64, track_ID u32, reserved u32, duration u64
 */
interface HeaderLayout {
  timescale: number | null;
  duration: number;
  wide: boolean;
}

/** The field layout of an `mvhd`, `mdhd` or `tkhd` box, or null for an unknown version. */
function headerLayout(view: DataView, box: Box): HeaderLayout | null {
  if (box.end <= box.body) return null;
  const version = view.getUint8(box.body);
  if (version > 1) return null;
  const wide = version === 1;
  const layout =
    box.type === 'tkhd'
      ? { timescale: null, duration: wide ? 28 : 20, wide }
      : { timescale: wide ? 20 : 12, duration: wide ? 24 : 16, wide };
  // A truncated payload does not hold the duration field: unsupported.
  return box.body + layout.duration + (wide ? 8 : 4) <= box.end ? layout : null;
}

function readTimescale(view: DataView, box: Box): number {
  const layout = headerLayout(view, box);
  return layout?.timescale ? view.getUint32(box.body + layout.timescale) : 0;
}

function readDuration(view: DataView, box: Box): number {
  const layout = headerLayout(view, box);
  if (!layout) return 0;
  const at = box.body + layout.duration;
  return layout.wide ? view.getUint32(at) * 2 ** 32 + view.getUint32(at + 4) : view.getUint32(at);
}

/** @pre the value fits the field (checked by the caller's preflight) */
function writeDuration(view: DataView, box: Box, value: number): void {
  const layout = headerLayout(view, box);
  if (!layout) return;
  const at = box.body + layout.duration;
  if (layout.wide) {
    view.setUint32(at, Math.floor(value / 2 ** 32));
    view.setUint32(at + 4, value >>> 0);
  } else {
    view.setUint32(at, value);
  }
}

/** Whether `value` fits the duration field of `box`. */
function durationFits(view: DataView, box: Box, value: number): boolean {
  const layout = headerLayout(view, box);
  return !!layout && value <= (layout.wide ? Number.MAX_SAFE_INTEGER : U32_MAX);
}

const U32_MAX = 0xffffffff;

/** Every chunk-offset table (`stco` / `co64`) under `stbl`. */
function chunkOffsetTables(view: DataView, stbl: Box): Box[] {
  return (readBoxes(view, stbl.body, stbl.end) ?? []).filter(
    (b) => b.type === 'stco' || b.type === 'co64',
  );
}

function readOffset(view: DataView, table: Box, i: number): number {
  if (table.type === 'stco') return view.getUint32(table.body + 8 + i * 4);
  const at = table.body + 8 + i * 8;
  return view.getUint32(at) * 2 ** 32 + view.getUint32(at + 4);
}

/** Whether every offset at or after `from` still fits its table after `+ delta`. */
function offsetsFit(view: DataView, table: Box, from: number, delta: number): boolean {
  if (table.body + 8 > table.end) return false; // version+flags, entry_count
  const count = view.getUint32(table.body + 4);
  const width = table.type === 'stco' ? 4 : 8;
  if (table.body + 8 + count * width > table.end) return false;
  const max = table.type === 'stco' ? U32_MAX : Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < count; i++) {
    const value = readOffset(view, table, i);
    if (value >= from && value + delta > max) return false;
  }
  return true;
}

/** Add `delta` to every chunk offset at or after `from`. @pre offsetsFit(...) */
function shiftOffsets(view: DataView, table: Box, from: number, delta: number): void {
  const count = view.getUint32(table.body + 4);
  for (let i = 0; i < count; i++) {
    const value = readOffset(view, table, i);
    if (value < from) continue;
    const next = value + delta;
    if (table.type === 'stco') {
      view.setUint32(table.body + 8 + i * 4, next);
    } else {
      const at = table.body + 8 + i * 8;
      view.setUint32(at, Math.floor(next / 2 ** 32));
      view.setUint32(at + 4, next >>> 0);
    }
  }
}

function isAudioTrak(view: DataView, trak: Box): boolean {
  const hdlr = path(view, trak, ['mdia', 'hdlr']);
  // hdlr payload: version+flags (4), pre_defined (4), handler_type (4).
  if (!hdlr || hdlr.end - hdlr.body < 12) return false;
  const at = hdlr.body + 8;
  return (
    String.fromCharCode(
      view.getUint8(at),
      view.getUint8(at + 1),
      view.getUint8(at + 2),
      view.getUint8(at + 3),
    ) === 'soun'
  );
}

interface AudioLayout {
  moov: Box;
  mvhd: Box;
  traks: Box[];
  trak: Box;
  tkhd: Box;
}

/** Boxes that only a fragmented (or indexed) mp4 carries. */
const FRAGMENT_BOXES = new Set(['moof', 'mfra', 'sidx', 'styp', 'ssix']);

/** Check the one audio trak; returns its tkhd, or why it cannot be patched. */
function audioTkhd(view: DataView, trak: Box): Box | string {
  const tkhd = child(view, trak, 'tkhd');
  const mdhd = path(view, trak, ['mdia', 'mdhd']);
  if (trak.body !== trak.start + 8) return 'the audio trak has a 64-bit size';
  if (!tkhd || !headerLayout(view, tkhd)) return 'no usable tkhd box';
  if (!mdhd || readTimescale(view, mdhd) <= 0) return 'no usable mdhd box';
  if (child(view, trak, 'edts')) return 'the audio track already has an edit list';
  return tkhd;
}

/** Find the boxes to patch, or the reason the layout is not supported. */
function locateAudioTrack(view: DataView): AudioLayout | string {
  const top = readBoxes(view, 0, view.byteLength);
  if (!top) return 'the file is not a well-formed mp4';
  if (top.some((b) => FRAGMENT_BOXES.has(b.type))) return 'the mp4 is fragmented';
  const moov = top.find((b) => b.type === 'moov');
  if (!moov || moov.body !== moov.start + 8) return 'no moov box with a 32-bit size';
  if (child(view, moov, 'mvex')) return 'the mp4 is fragmented';
  const mvhd = child(view, moov, 'mvhd');
  const traks = (readBoxes(view, moov.body, moov.end) ?? []).filter((b) => b.type === 'trak');
  const audio = traks.filter((t) => isAudioTrak(view, t));
  if (!mvhd || readTimescale(view, mvhd) <= 0) return 'no usable mvhd box';
  if (audio.length !== 1) return `${audio.length} audio tracks (expected 1)`;
  const tkhd = audioTkhd(view, audio[0]);
  if (typeof tkhd === 'string') return tkhd;
  return { moov, mvhd, traks, trak: audio[0], tkhd };
}

/** The edts box: one version-0 edit that starts at `mediaTime` and lasts `segment`. */
function buildEdts(segment: number, mediaTime: number): Uint8Array {
  const edts = new Uint8Array(EDTS_SIZE);
  const e = new DataView(edts.buffer);
  e.setUint32(0, EDTS_SIZE);
  edts.set([0x65, 0x64, 0x74, 0x73], 4); // 'edts'
  e.setUint32(8, EDTS_SIZE - 8);
  edts.set([0x65, 0x6c, 0x73, 0x74], 12); // 'elst'
  e.setUint32(16, 0); // version 0, flags 0
  e.setUint32(20, 1); // entry_count
  e.setUint32(24, segment); // segment_duration u32 (movie timescale)
  e.setInt32(28, mediaTime); // media_time i32 (media timescale)
  e.setInt16(32, 1); // media_rate_integer
  e.setInt16(34, 0); // media_rate_fraction
  return edts;
}

/** The result of {@link addAudioEditList}. */
export type EditListResult = { file: Uint8Array<ArrayBuffer> } | { skipped: string };

/**
 * Insert an edit list into the audio track of `file`, so a player skips
 * `skipSamples` priming samples and presents `durationSeconds` of audio.
 * The audio `tkhd` duration becomes the edit length and the `mvhd` duration
 * the longest track; `mdhd` keeps the media length (priming included).
 *
 * Nothing is changed when the file is fragmented, has an unknown layout, or
 * when any shifted chunk offset or written field would not fit its width.
 *
 * @param file - A complete mp4 as written by mp4-muxer
 * @param skipSamples - Encoder delay, in samples of the audio track timescale
 * @param durationSeconds - Length of the presented audio
 * @pre Number.isInteger(skipSamples) && skipSamples >= 0
 * @post 'file' in result => result.file.byteLength === file.byteLength + 36
 */
export function addAudioEditList(
  file: Uint8Array,
  skipSamples: number,
  durationSeconds: number,
): EditListResult {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const layout = locateAudioTrack(view);
  if (typeof layout === 'string') return { skipped: layout };
  const { moov, mvhd, traks, trak, tkhd } = layout;
  const segment = Math.round(durationSeconds * readTimescale(view, mvhd));

  // Preflight: every value this function writes must fit its field.
  if (!(segment >= 0 && segment <= U32_MAX)) return { skipped: 'the edit length overflows elst' };
  if (skipSamples > 0x7fffffff) return { skipped: 'the priming overflows elst media_time' };
  if (moov.end - moov.start + EDTS_SIZE > U32_MAX) return { skipped: 'moov would exceed 4 GiB' };
  const tables: Box[] = [];
  let longest = segment;
  for (const t of traks) {
    const stbl = path(view, t, ['mdia', 'minf', 'stbl']);
    if (stbl) tables.push(...chunkOffsetTables(view, stbl));
    const th = t === trak ? null : child(view, t, 'tkhd');
    if (th) longest = Math.max(longest, readDuration(view, th));
  }
  if (!tables.every((table) => offsetsFit(view, table, moov.end, EDTS_SIZE))) {
    return { skipped: 'a chunk offset would overflow its table' };
  }
  if (!durationFits(view, tkhd, segment) || !durationFits(view, mvhd, longest)) {
    return { skipped: 'a duration would overflow its field' };
  }

  // Patch a copy. Boxes after the insertion point move by EDTS_SIZE.
  const at = (b: Box): Box =>
    b.start >= tkhd.end
      ? { ...b, start: b.start + EDTS_SIZE, body: b.body + EDTS_SIZE, end: b.end + EDTS_SIZE }
      : b;
  const out = new Uint8Array(file.byteLength + EDTS_SIZE);
  out.set(file.subarray(0, tkhd.end), 0);
  out.set(buildEdts(segment, skipSamples), tkhd.end);
  out.set(file.subarray(tkhd.end), tkhd.end + EDTS_SIZE);
  const o = new DataView(out.buffer);
  o.setUint32(moov.start, moov.end - moov.start + EDTS_SIZE);
  o.setUint32(trak.start, trak.end - trak.start + EDTS_SIZE);
  writeDuration(o, tkhd, segment);
  writeDuration(o, at(mvhd), longest);
  // mdat moves only when it follows moov; offsets before moov stay.
  for (const table of tables) shiftOffsets(o, at(table), moov.end, EDTS_SIZE);
  return { file: out };
}
