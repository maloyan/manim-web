/* eslint-disable max-lines */
import { evalCubicBezier, lerpPoint as lerpPoint3D, signedArea2DFromStride } from '../utils/math';

export interface CompoundAlignmentResult {
  srcAlignedPoints: number[][];
  tgtAlignedPoints: number[][];
  alignedSubpathLengths: number[];
}

/** Split a flat point array into subpath chunks based on lengths metadata. */
function splitBySubpathLengths(points3D: number[][], lengths: number[]): number[][][] {
  const chunks: number[][][] = [];
  let offset = 0;
  for (const len of lengths) {
    chunks.push(points3D.slice(offset, offset + len));
    offset += len;
  }
  return chunks;
}

/** Build a degenerate subpath (all points equal) with point count matching reference. */
function makeNullSubpathFromReference(
  referenceSubpath: number[][],
  anchorPoint: number[],
): number[][] {
  const anchor = [anchorPoint[0], anchorPoint[1], anchorPoint[2] ?? 0];
  return referenceSubpath.map(() => [...anchor]);
}

/**
 * Resample a 3D point list to `targetCount`.
 *
 * For cubic-Bezier-chain inputs whose target count fits the cubic stride
 * (`(n-1) % 3 === 0`), uses De Casteljau-style subdivision via
 * `remapBezierCurveCount` to preserve curve fidelity; otherwise falls back
 * to piecewise-linear interpolation.
 */
export function resamplePointList3D(points: number[][], targetCount: number): number[][] {
  if (targetCount <= 0) return [];

  if (points.length === 0) {
    throw new Error('resamplePointList3D: empty point list is a metadata bug');
  }

  if (targetCount === 1) {
    return [[...(points[0] ?? [0, 0, 0])]];
  }

  if (points.length === 1) {
    return Array.from({ length: targetCount }, () => [...points[0]]);
  }

  if (isCubicBezierChain(points) && targetCount >= 4 && (targetCount - 1) % 3 === 0) {
    // Always re-parameterise cubic chains to arc-length-uniform anchors,
    // including when targetCount === points.length. Without this the
    // pairing in `Transform` keeps whatever non-uniform anchor distribution
    // the input data happened to have (e.g. MathJax bezier output puts
    // more anchors near corners), so anchor `i` of source and anchor `i`
    // of target correspond to different fractions of perimeter, and
    // mid-frames lerp non-corresponding features into chimeric shapes.
    const targetCurveCount = (targetCount - 1) / 3;
    const remapped = arcLengthResampleCubicChain(points, targetCurveCount);
    if (remapped.length === targetCount) {
      return remapped;
    }
  }

  if (points.length === targetCount) {
    return points.map((p) => [...p]);
  }

  // Fallback for non-cubic or malformed point arrays.
  const result: number[][] = [];
  const ratio = (points.length - 1) / (targetCount - 1);

  for (let i = 0; i < targetCount; i++) {
    const t = i * ratio;
    const index = Math.floor(t);
    const frac = t - index;

    if (index >= points.length - 1) {
      result.push([...points[points.length - 1]]);
    } else {
      result.push(lerpPoint3D(points[index], points[index + 1], frac));
    }
  }

  return result;
}

function isCubicBezierChain(points: number[][]): boolean {
  return points.length >= 4 && (points.length - 1) % 3 === 0;
}

function evalCubicDerivative(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number,
): number[] {
  const s = 1 - t;
  const out: number[] = [];
  const dim = Math.max(p0.length, p1.length, p2.length, p3.length);
  for (let k = 0; k < dim; k++) {
    const a = p0[k] ?? 0;
    const b = p1[k] ?? 0;
    const c = p2[k] ?? 0;
    const d = p3[k] ?? 0;
    out.push(3 * s * s * (b - a) + 6 * s * t * (c - b) + 3 * t * t * (d - c));
  }
  return out;
}

/**
 * Cumulative chord-length table sampling a single cubic Bezier curve.
 * `samples` chord segments → arrays of length `samples + 1`.
 */
function buildArcLengthTable(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  samples: number,
): { ts: number[]; ls: number[]; total: number } {
  const ts = new Array<number>(samples + 1);
  const ls = new Array<number>(samples + 1);
  ts[0] = 0;
  ls[0] = 0;
  let prev = p0;
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    ts[i] = t;
    const cur = evalCubicBezier(p0, p1, p2, p3, t);
    const dx = (cur[0] ?? 0) - (prev[0] ?? 0);
    const dy = (cur[1] ?? 0) - (prev[1] ?? 0);
    const dz = (cur[2] ?? 0) - (prev[2] ?? 0);
    ls[i] = ls[i - 1] + Math.sqrt(dx * dx + dy * dy + dz * dz);
    prev = cur;
  }
  return { ts, ls, total: ls[samples] };
}

/**
 * Solve for `t ∈ [0, 1]` such that the arc length from `0` to `t` on the
 * cubic Bezier equals `targetLen`. Linear interpolation between sampled
 * cumulative-length entries is precise enough for path-morph correspondence.
 */
function tForArcLength(
  table: { ts: number[]; ls: number[]; total: number },
  targetLen: number,
): number {
  const { ts, ls, total } = table;
  if (total <= 0 || targetLen <= 0) return 0;
  if (targetLen >= total) return 1;
  // Binary search for k with ls[k] <= targetLen < ls[k+1].
  let lo = 0;
  let hi = ls.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ls[mid] < targetLen) lo = mid + 1;
    else hi = mid;
  }
  const k = Math.max(0, lo - 1);
  const seg = ls[k + 1] - ls[k];
  const frac = seg > 0 ? (targetLen - ls[k]) / seg : 0;
  return ts[k] + frac * (ts[k + 1] - ts[k]);
}

/**
 * Resample a cubic Bezier chain to `newCurveCount` cubics whose anchor
 * positions lie at arc-length-uniform fractions of the original chain's
 * total perimeter. Works at any count (including same-as-input).
 *
 * Why this matters: the `Transform` lerps anchor i of source with anchor
 * i of target. If anchor i represents a meaningful path-fraction of each
 * shape (e.g. "~30% around the perimeter"), the lerp pairs corresponding
 * features and the morph blends smoothly. Without arc-length
 * re-parameterisation, anchor i represents whatever fraction the upstream
 * source data (e.g. MathJax) chose to place anchor i at, so anchor i of
 * "2" might be at the top of the glyph while anchor i of "3" might be at
 * the side, and the lerp creates a chimeric mid-frame.
 *
 * Where new sub-cubics fall entirely within a single original cubic the
 * result is exact (de Casteljau hodograph subdivision). Where a new
 * sub-cubic spans multiple original cubics, we approximate via the
 * standard chord-length-tangent cubic (start/end positions and unit
 * tangents, handles at chord/3). This approximation is close to the
 * original path for typical glyph shapes and preserves G1 continuity at
 * each new anchor.
 */
interface ChainArcInfo {
  curves: number[][][];
  tables: ReturnType<typeof buildArcLengthTable>[];
  cumulative: number[];
  totalLen: number;
}

/** Build per-curve arc-length tables and chain-wide cumulative table. */
function buildChainArcInfo(points: number[][]): ChainArcInfo {
  const curves: number[][][] = [];
  const tables: ReturnType<typeof buildArcLengthTable>[] = [];
  const cumulative: number[] = [0];
  let totalLen = 0;
  for (let i = 0; i + 3 < points.length; i += 3) {
    const curve: number[][] = [points[i], points[i + 1], points[i + 2], points[i + 3]];
    curves.push(curve);
    const table = buildArcLengthTable(curve[0], curve[1], curve[2], curve[3], 32);
    tables.push(table);
    totalLen += table.total;
    cumulative.push(totalLen);
  }
  return { curves, tables, cumulative, totalLen };
}

/** Locate `(curveIdx, localT)` for an absolute arc-length on a chain. */
function locateOnChain(info: ChainArcInfo, arc: number): { curveIdx: number; t: number } {
  if (arc <= 0) return { curveIdx: 0, t: 0 };
  if (arc >= info.totalLen) return { curveIdx: info.curves.length - 1, t: 1 };
  let lo = 0;
  let hi = info.cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (info.cumulative[mid] < arc) lo = mid + 1;
    else hi = mid;
  }
  const curveIdx = Math.max(0, lo - 1);
  const localArc = arc - info.cumulative[curveIdx];
  return { curveIdx, t: tForArcLength(info.tables[curveIdx], localArc) };
}

/** Build a degenerate cubic chain consisting of `newCurveCount` zero-length pieces. */
function makeDegenerateChain(point: number[], newCurveCount: number): number[][] {
  const out: number[][] = [[...point]];
  for (let i = 0; i < newCurveCount; i++) out.push([...point], [...point], [...point]);
  return out;
}

/** Compute unit tangent at `(curveIdx, t)` of an original chain. */
function unitTangentAt(curve: number[][], t: number): number[] {
  const d = evalCubicDerivative(curve[0], curve[1], curve[2], curve[3], t);
  const dlen = Math.hypot(d[0] ?? 0, d[1] ?? 0, d[2] ?? 0);
  if (dlen < 1e-12) return d.map(() => 0);
  return d.map((v) => v / dlen);
}

/**
 * Build one new sub-cubic between adjacent anchors. Exact (de Casteljau
 * hodograph) when the sub-cubic falls entirely within one original cubic;
 * chord-tangent approximation when it spans original cubic boundaries.
 */
function buildSubCubic(
  info: ChainArcInfo,
  startAnchor: number[],
  endAnchor: number[],
  startTangent: number[],
  endTangent: number[],
  sLoc: { curveIdx: number; t: number },
  eLoc: { curveIdx: number; t: number },
): { h1: number[]; h2: number[] } {
  if (sLoc.curveIdx === eLoc.curveIdx) {
    const c = info.curves[sLoc.curveIdx];
    const dt = eLoc.t - sLoc.t;
    const d0 = evalCubicDerivative(c[0], c[1], c[2], c[3], sLoc.t);
    const d1 = evalCubicDerivative(c[0], c[1], c[2], c[3], eLoc.t);
    return {
      h1: startAnchor.map((v, k) => v + (dt / 3) * (d0[k] ?? 0)),
      h2: endAnchor.map((v, k) => v - (dt / 3) * (d1[k] ?? 0)),
    };
  }
  const dx = (endAnchor[0] ?? 0) - (startAnchor[0] ?? 0);
  const dy = (endAnchor[1] ?? 0) - (startAnchor[1] ?? 0);
  const dz = (endAnchor[2] ?? 0) - (startAnchor[2] ?? 0);
  const k = Math.sqrt(dx * dx + dy * dy + dz * dz) / 3;
  return {
    h1: startAnchor.map((v, j) => v + k * (startTangent[j] ?? 0)),
    h2: endAnchor.map((v, j) => v - k * (endTangent[j] ?? 0)),
  };
}

function arcLengthResampleCubicChain(points: number[][], newCurveCount: number): number[][] {
  const currentCurveCount = (points.length - 1) / 3;
  if (!Number.isInteger(currentCurveCount) || currentCurveCount <= 0 || newCurveCount <= 0) {
    return points.map((p) => [...p]);
  }

  const info = buildChainArcInfo(points);
  // A degenerate "all points coincide" chain has total perimeter zero in
  // exact arithmetic; under floating point it picks up ULP noise (~1e-14)
  // from evaluating the polynomial at non-zero `t`, so we use a small
  // epsilon to guarantee we return an exact constant chain rather than
  // walk the noise through arc-length sampling and re-emit slightly
  // different points at each anchor.
  if (info.totalLen < 1e-9) return makeDegenerateChain(points[0], newCurveCount);

  // Anchor positions and unit tangents at each new arc-length-uniform anchor.
  const anchors: number[][] = [];
  const tangents: number[][] = [];
  for (let i = 0; i <= newCurveCount; i++) {
    const arcAt = (i / newCurveCount) * info.totalLen;
    const loc = locateOnChain(info, arcAt);
    const c = info.curves[loc.curveIdx];
    anchors.push(evalCubicBezier(c[0], c[1], c[2], c[3], loc.t));
    tangents.push(unitTangentAt(c, loc.t));
  }

  const out: number[][] = [[...anchors[0]]];
  for (let i = 0; i < newCurveCount; i++) {
    const sLoc = locateOnChain(info, (i / newCurveCount) * info.totalLen);
    const eLoc = locateOnChain(info, ((i + 1) / newCurveCount) * info.totalLen);
    const { h1, h2 } = buildSubCubic(
      info,
      anchors[i],
      anchors[i + 1],
      tangents[i],
      tangents[i + 1],
      sLoc,
      eLoc,
    );
    out.push(h1, h2, [...anchors[i + 1]]);
  }

  return out;
}

/** @internal Check if point list is closed (first ≈ last). */
function isClosedSubpathForRotation(points: number[][]): boolean {
  if (points.length < 2) return false;
  const a = points[0];
  const b = points[points.length - 1];
  const eps = 1e-6;
  return (
    Math.abs((a[0] ?? 0) - (b[0] ?? 0)) < eps &&
    Math.abs((a[1] ?? 0) - (b[1] ?? 0)) < eps &&
    Math.abs((a[2] ?? 0) - (b[2] ?? 0)) < eps
  );
}

function clonePoints(points: number[][]): number[][] {
  return points.map((p) => [...p]);
}

function isStrideClosedCubicSubpath(points: number[][], stride: number): boolean {
  const openLen = points.length - 1;
  return isClosedSubpathForRotation(points) && openLen > 0 && openLen % stride === 0;
}

/**
 * Apply a cyclic stride-aligned rotation to a closed cubic-bezier subpath.
 * The "open" portion (length n - 1) is rotated by `shift` (multiple of
 * `stride`); the closing duplicate of the first point is re-appended.
 */
function rotateClosedSubpath(subpath: number[][], shift: number, openLen: number): number[][] {
  if (shift === 0) return clonePoints(subpath);
  const rotatedOpen: number[][] = [];
  for (let i = 0; i < openLen; i++) {
    rotatedOpen.push([...(subpath[(i + shift) % openLen] ?? [0, 0, 0])]);
  }
  rotatedOpen.push([...rotatedOpen[0]]);
  return rotatedOpen;
}

/**
 * Total squared per-anchor distance between two equal-length point chains
 * for a given stride-aligned cyclic rotation of the second chain. Anchors
 * are the points at positions `0, stride, 2·stride, ...`; we ignore the
 * intermediate handle points so handle pair-up doesn't dominate the score.
 */
function ssdForRotation(
  src: number[][],
  tgt: number[][],
  shift: number,
  openLen: number,
  stride: number,
): number {
  let sum = 0;
  for (let i = 0; i < openLen; i += stride) {
    const sp = src[i];
    const tp = tgt[(i + shift) % openLen];
    const dx = (sp[0] ?? 0) - (tp[0] ?? 0);
    const dy = (sp[1] ?? 0) - (tp[1] ?? 0);
    const dz = (sp[2] ?? 0) - (tp[2] ?? 0);
    sum += dx * dx + dy * dy + dz * dz;
  }
  return sum;
}

/**
 * Rotate a closed cubic-bezier target subpath so the per-anchor squared
 * displacement to source is globally minimised over every stride-aligned
 * cyclic rotation.
 *
 * Orientation is NOT searched here: callers (specifically
 * `alignChunkListsByLength`) bucket subpaths by signed area (CW vs CCW)
 * before pairing, so within a pair both subpaths already share an
 * orientation. Searching reversed orientations on top of that can pick a
 * pairing that minimises raw SSD by zig-zagging anchors against the path
 * direction — which renders as an "inside out" twist mid-Transform.
 *
 * Whole-path SSD is meaningful here ONLY because both subpaths were
 * resampled to a shared arc-length parameterisation upstream; otherwise
 * anchor index `i` is not a meaningful path-fraction.
 */
function rotateClosedTargetForBestAlignment(
  srcSubpath: number[][],
  tgtSubpath: number[][],
): number[][] {
  const stride = 3;
  if (!isStrideClosedCubicSubpath(srcSubpath, stride)) return clonePoints(tgtSubpath);
  if (!isStrideClosedCubicSubpath(tgtSubpath, stride)) return clonePoints(tgtSubpath);
  if (srcSubpath.length !== tgtSubpath.length) return clonePoints(tgtSubpath);

  const openLen = tgtSubpath.length - 1;
  const anchorCount = openLen / stride;
  if (anchorCount <= 1) return clonePoints(tgtSubpath);

  let bestShift = 0;
  let bestSsd = Infinity;

  for (let ai = 0; ai < anchorCount; ai++) {
    const shift = ai * stride;
    const ssd = ssdForRotation(srcSubpath, tgtSubpath, shift, openLen, stride);
    if (ssd < bestSsd) {
      bestSsd = ssd;
      bestShift = shift;
    }
  }

  return rotateClosedSubpath(tgtSubpath, bestShift, openLen);
}

/**
 * Resample a cubic Bezier chain so its anchor positions land at the
 * specified arc-length values (instead of arc-length-uniform). Used to
 * realise an "OT-warped" target: each new anchor sits where the optimal
 * monotonic correspondence places it relative to the source. Adjacent
 * anchors that map to the same arc position produce a degenerate
 * zero-length sub-cubic, which renders as nothing — that's the natural
 * way DTW expresses "this source anchor doesn't have a corresponding
 * target anchor moving with it".
 */
function resampleCubicChainAtArcs(points: number[][], arcPositions: number[]): number[][] {
  if (arcPositions.length < 2) return points.map((p) => [...p]);
  const newCurveCount = arcPositions.length - 1;
  const currentCurveCount = (points.length - 1) / 3;
  if (!Number.isInteger(currentCurveCount) || currentCurveCount <= 0) {
    return points.map((p) => [...p]);
  }
  const info = buildChainArcInfo(points);
  if (info.totalLen <= 0) return makeDegenerateChain(points[0], newCurveCount);

  const anchors: number[][] = [];
  const tangents: number[][] = [];
  const locs: { curveIdx: number; t: number }[] = [];
  for (const arc of arcPositions) {
    const loc = locateOnChain(info, Math.max(0, Math.min(info.totalLen, arc)));
    locs.push(loc);
    const c = info.curves[loc.curveIdx];
    anchors.push(evalCubicBezier(c[0], c[1], c[2], c[3], loc.t));
    tangents.push(unitTangentAt(c, loc.t));
  }

  const out: number[][] = [[...anchors[0]]];
  for (let i = 0; i < newCurveCount; i++) {
    const { h1, h2 } = buildSubCubic(
      info,
      anchors[i],
      anchors[i + 1],
      tangents[i],
      tangents[i + 1],
      locs[i],
      locs[i + 1],
    );
    out.push(h1, h2, [...anchors[i + 1]]);
  }
  return out;
}

/**
 * Run cyclic Dynamic-Time-Warping on two equal-length anchor sequences.
 * For each cyclic shift `s` of the target, finds the monotonic warping
 * path between source and shifted target that minimises total squared
 * distance, then picks the best shift. Returns, for each source anchor
 * index, the (possibly warped) target anchor index it pairs with.
 *
 * Why DTW over plain rotation: rotation is equivalent to choosing a
 * single cyclic offset and then forcing a 1:1 monotonic bijection. DTW
 * keeps the monotonic constraint but lets some source anchors "linger"
 * on the same target index (or vice versa) — i.e. it stretches and
 * compresses regions of one path against the other to align corresponding
 * features. For glyph pairs whose features don't naturally fall at the
 * same arc-length fractions (e.g. MathTex `2` vs `3`), this gives a
 * substantially smoother visual morph than pure rotation.
 */
// eslint-disable-next-line complexity
function dtwCyclicCorrespondence(srcAnchors: number[][], tgtAnchors: number[][]): number[] {
  const N = srcAnchors.length;
  const M = tgtAnchors.length;
  if (N === 0 || M === 0) return [];
  if (N === 1) return [0];

  let bestCost = Infinity;
  let bestSrcToTgt = new Array<number>(N).fill(0);

  // O(N) per shift × O(N·M) DP per shift × O(N) shifts = O(N²·M).
  // Acceptable at Transform begin for typical N, M ≤ ~60.
  // Use Float64Array DP table reused across shifts to limit allocation.
  const dp = new Float64Array((N + 1) * (M + 1));
  const back = new Uint8Array((N + 1) * (M + 1));
  const idx = (i: number, j: number) => i * (M + 1) + j;

  for (let shift = 0; shift < M; shift++) {
    dp.fill(Infinity);
    dp[idx(0, 0)] = 0;
    for (let i = 1; i <= N; i++) {
      const sp = srcAnchors[i - 1];
      for (let j = 1; j <= M; j++) {
        const tp = tgtAnchors[(j - 1 + shift) % M];
        const dx = sp[0] - tp[0];
        const dy = sp[1] - tp[1];
        const dz = (sp[2] ?? 0) - (tp[2] ?? 0);
        const cost = dx * dx + dy * dy + dz * dz;
        const a = dp[idx(i - 1, j - 1)];
        const b = dp[idx(i - 1, j)];
        const c = dp[idx(i, j - 1)];
        let mv = a;
        let mi: 0 | 1 | 2 = 0;
        if (b < mv) {
          mv = b;
          mi = 1;
        }
        if (c < mv) {
          mv = c;
          mi = 2;
        }
        dp[idx(i, j)] = cost + mv;
        back[idx(i, j)] = mi;
      }
    }

    const total = dp[idx(N, M)];
    if (total >= bestCost) continue;

    // Backtrack: collect (i, j) pairs.
    const pairs: [number, number][] = [];
    let i = N;
    let j = M;
    while (i > 0 && j > 0) {
      pairs.push([i - 1, (j - 1 + shift) % M]);
      const dir = back[idx(i, j)];
      if (dir === 0) {
        i--;
        j--;
      } else if (dir === 1) {
        i--;
      } else {
        j--;
      }
    }
    pairs.reverse();

    // Collapse pairs to a per-source target index using the median tgt
    // among all tgts paired with each src — preserves monotonicity since
    // DTW pairs are monotone, and the median of a monotonic-prefix is
    // monotone in src.
    const buckets: number[][] = Array.from({ length: N }, () => []);
    for (const [si, ti] of pairs) buckets[si].push(ti);
    const srcToTgt = buckets.map((b, s) => {
      if (b.length === 0) return s % M;
      b.sort((p, q) => p - q);
      return b[(b.length - 1) >> 1];
    });

    bestCost = total;
    bestSrcToTgt = srcToTgt;
  }

  return bestSrcToTgt;
}

/**
 * Pair two cubic-Bezier subpaths by:
 *   1. Resampling each side to a shared arc-length-uniform anchor count.
 *   2. Running cyclic DTW between the two anchor sequences to find the
 *      monotonic correspondence that minimises total per-anchor displacement.
 *   3. Re-resampling the target chain with anchors placed at the warped
 *      arc-length positions chosen by DTW.
 *
 * Result: equal-length cubic chains whose anchor `i` pairs source feature
 * `i` with the target feature DTW judged most similar — instead of forcing
 * a single uniform cyclic offset across the whole shape.
 */
// eslint-disable-next-line complexity
function alignSubpathPairPoints(
  srcSubpath: number[][],
  tgtSubpath: number[][],
): { srcAligned: number[][]; tgtAligned: number[][] } {
  const maxCount = Math.max(srcSubpath.length, tgtSubpath.length);

  // Resample both sides to the same uniform arc-length parameterisation.
  const srcAligned =
    srcSubpath.length < maxCount
      ? resamplePointList3D(srcSubpath, maxCount)
      : resamplePointList3D(srcSubpath, srcSubpath.length);
  const tgtUniform =
    tgtSubpath.length < maxCount
      ? resamplePointList3D(tgtSubpath, maxCount)
      : resamplePointList3D(tgtSubpath, tgtSubpath.length);

  // Only meaningful for stride-3 closed cubic chains. For anything else
  // fall back to rotation-only alignment.
  const stride = 3;
  if (
    !isStrideClosedCubicSubpath(srcAligned, stride) ||
    !isStrideClosedCubicSubpath(tgtUniform, stride) ||
    srcAligned.length !== tgtUniform.length
  ) {
    return {
      srcAligned,
      tgtAligned: rotateClosedTargetForBestAlignment(srcAligned, tgtUniform),
    };
  }

  const openLen = srcAligned.length - 1;
  const anchorCount = openLen / stride;
  if (anchorCount < 4) {
    return {
      srcAligned,
      tgtAligned: rotateClosedTargetForBestAlignment(srcAligned, tgtUniform),
    };
  }

  // Extract just the anchors (every stride-th point) from both sides.
  const srcAnchors: number[][] = [];
  const tgtAnchors: number[][] = [];
  for (let i = 0; i < openLen; i += stride) {
    srcAnchors.push(srcAligned[i]);
    tgtAnchors.push(tgtUniform[i]);
  }

  // DTW correspondence: for each src anchor i, the warped tgt anchor.
  const srcToTgt = dtwCyclicCorrespondence(srcAnchors, tgtAnchors);

  // Compute total target perimeter so we can express the warped tgt
  // anchors as arc-length positions on the original target chain. The
  // threshold is `1e-9`, not exactly zero, because evaluating a chain of
  // degenerate (zero-length) cubics through floating-point math
  // accumulates noise that comes out as ~1e-14 instead of 0; treating
  // that noise as a non-degenerate perimeter would re-sample a synthetic
  // null subpath into points that drift off the centroid by a few ulps,
  // breaking the "synthetic = constant" invariant downstream callers rely
  // on (placeholder fades, hole-collapse rendering, etc.).
  const tgtInfo = buildChainArcInfo(tgtSubpath);
  if (tgtInfo.totalLen < 1e-9) {
    return {
      srcAligned,
      tgtAligned: rotateClosedTargetForBestAlignment(srcAligned, tgtUniform),
    };
  }

  // Warped arc positions. Anchor 0 is whatever DTW picked; we walk the
  // target perimeter monotonically and unwrap cyclic wraparounds (i.e. if
  // the next chosen index wraps under the previous one, we treat it as
  // "+M after" instead of "before").
  const warpedAnchorArcs: number[] = [];
  let prevIdx = srcToTgt[0];
  let cumulativeIdx = prevIdx;
  warpedAnchorArcs.push((prevIdx / anchorCount) * tgtInfo.totalLen);
  for (let i = 1; i < anchorCount; i++) {
    const cur = srcToTgt[i];
    let unwrap = cur;
    while (unwrap < prevIdx) unwrap += anchorCount;
    cumulativeIdx += unwrap - prevIdx;
    warpedAnchorArcs.push((cumulativeIdx / anchorCount) * tgtInfo.totalLen);
    prevIdx = unwrap % anchorCount;
  }
  // Close the loop by returning to anchor 0 + one full perimeter.
  warpedAnchorArcs.push(warpedAnchorArcs[0] + tgtInfo.totalLen);

  // Each consecutive arc position must remain within [first, first+L]; if
  // total drift exceeded one full loop we collapse extras (defensive).
  for (let i = 1; i < warpedAnchorArcs.length; i++) {
    if (warpedAnchorArcs[i] < warpedAnchorArcs[i - 1]) {
      warpedAnchorArcs[i] = warpedAnchorArcs[i - 1];
    }
  }
  const span = warpedAnchorArcs[warpedAnchorArcs.length - 1] - warpedAnchorArcs[0];
  if (span > 1.5 * tgtInfo.totalLen || span < 0.5 * tgtInfo.totalLen) {
    // DTW produced a degenerate warping (more than one full loop or less
    // than half a loop). Fall back to rotation-only alignment, which is
    // always sensible for closed curves.
    return {
      srcAligned,
      tgtAligned: rotateClosedTargetForBestAlignment(srcAligned, tgtUniform),
    };
  }

  // Re-resample tgt with anchors placed at the warped arc positions.
  // We work modulo the target perimeter so wraparound positions land on
  // the actual chain.
  const wrappedArcs = warpedAnchorArcs.map((a) => {
    let v = a % tgtInfo.totalLen;
    if (v < 0) v += tgtInfo.totalLen;
    return v;
  });
  // For monotonic resample we need positions in non-decreasing order.
  // Re-cumulate after the wrap so the resampler can interpret them as a
  // single sweep around the loop, possibly across the seam.
  const splitArcs = unwrapArcCycle(wrappedArcs, tgtInfo.totalLen);
  const tgtWarped = resampleCubicChainAtArcs(tgtSubpath, splitArcs);

  if (tgtWarped.length !== srcAligned.length) {
    return {
      srcAligned,
      tgtAligned: rotateClosedTargetForBestAlignment(srcAligned, tgtUniform),
    };
  }

  return { srcAligned, tgtAligned: tgtWarped };
}

/**
 * Unwrap a cyclic sequence of arc positions into a monotonic non-decreasing
 * one by adding the perimeter length wherever the next position appears to
 * have looped back.
 */
function unwrapArcCycle(arcs: number[], perimeter: number): number[] {
  const out = arcs.slice();
  for (let i = 1; i < out.length; i++) {
    while (out[i] < out[i - 1]) out[i] += perimeter;
  }
  return out;
}

/** Compute center of all points in array. */
function computeCenter(points3D: number[][]): number[] {
  if (points3D.length === 0) return [0, 0, 0];
  const sum = [0, 0, 0];
  for (const p of points3D) {
    sum[0] += p[0] ?? 0;
    sum[1] += p[1] ?? 0;
    sum[2] += p[2] ?? 0;
  }
  return [sum[0] / points3D.length, sum[1] / points3D.length, sum[2] / points3D.length];
}

/** Validate subpath lengths match point counts; throw on mismatch. */
function validateSubpathLengths(points3D: number[][], lengths: number[], label: string): void {
  const total = lengths.reduce((sum, len) => sum + len, 0);
  if (total !== points3D.length) {
    throw new Error(
      `alignCompoundPathsForTransform: ${label} subpath lengths sum (${total}) does not match ${label} point count (${points3D.length})`,
    );
  }
}

interface SignedSubpathChunk {
  chunk: number[][];
  len: number;
  sign: 1 | -1;
}

function inferSign(chunk: number[][]): 1 | -1 {
  // Intentional simplification: keep binary orientation bucketing only.
  // Near-zero/degenerate area is treated as +1 instead of introducing a
  // neutral/tri-state branch, to keep transform pairing logic simpler.
  return signedArea2DFromStride(chunk, 3) < 0 ? -1 : 1;
}

function makeSignedChunks(
  points3D: number[][],
  lengths: number[],
  signs?: Array<1 | -1>,
): SignedSubpathChunk[] {
  const chunks = splitBySubpathLengths(points3D, lengths);
  return chunks.map((chunk, i) => ({
    chunk,
    len: lengths[i],
    sign: signs?.[i] ?? inferSign(chunk),
  }));
}

/**
 * Align two lists of subpaths (within a single CW/CCW orientation bucket)
 * by descending length. When one side has more subpaths than the other,
 * the leftover subpath has no real partner. We synthesise a placeholder
 * for the missing side as a degenerate ring (every point equal) anchored
 * at the LEFTOVER SUBPATH'S OWN CENTROID.
 *
 * Why the leftover's own centroid (and not, say, the side's overall
 * centroid or a point on the other side's outer boundary):
 *
 * - It's the natural shrink-to / grow-from point. lerp(real_subpath,
 *   degenerate_at_own_centroid, alpha) is the original subpath scaled
 *   down by `1-alpha` toward its own centre. The feature appears to
 *   grow/shrink in place at its real location instead of travelling.
 * - For typical glyphs the leftover's centroid is well INSIDE the other
 *   side's outer (e.g. inner-of-6's centroid is inside "5"; inner-of-4's
 *   centroid is inside "5"), so the synthetic ring sits inside the
 *   morphing outer at every alpha. That keeps the fill-geometry hole
 *   classification stable.
 * - It introduces no boundary numerics. An earlier version anchored the
 *   placeholder on the OTHER side's outer boundary; for points on or
 *   near the boundary, any per-frame point-in-polygon test trips on
 *   floating-point fuzz, so the same subpath flips between "hole of
 *   outer X" and "separate outer", which makes the rendered fill split
 *   into disjoint pieces frame-to-frame (visible flicker).
 */
function alignChunkListsByLength(
  srcChunks: Array<{ chunk: number[][]; len: number }>,
  tgtChunks: Array<{ chunk: number[][]; len: number }>,
  srcAlignedAll: number[][],
  tgtAlignedAll: number[][],
  alignedLengths: number[],
): void {
  const srcSorted = [...srcChunks].sort((a, b) => b.len - a.len);
  const tgtSorted = [...tgtChunks].sort((a, b) => b.len - a.len);
  const maxSubpaths = Math.max(srcSorted.length, tgtSorted.length);

  for (let i = 0; i < maxSubpaths; i++) {
    const src = srcSorted[i]?.chunk;
    const tgt = tgtSorted[i]?.chunk;

    let srcSub: number[][];
    let tgtSub: number[][];

    if (src && tgt) {
      srcSub = src;
      tgtSub = tgt;
    } else if (tgt && !src) {
      // Source-side leftover (e.g. inner of "6" when src is "5"):
      // synthesise a degenerate src at tgt's own centroid so the
      // feature grows in place at its target location.
      srcSub = makeNullSubpathFromReference(tgt, computeCenter(tgt));
      tgtSub = tgt;
    } else {
      // Target-side leftover (e.g. inner of "4" when tgt is "5"):
      // synthesise a degenerate tgt at src's own centroid so the
      // feature shrinks in place at its source location.
      srcSub = src!;
      tgtSub = makeNullSubpathFromReference(src!, computeCenter(src!));
    }

    const { srcAligned, tgtAligned } = alignSubpathPairPoints(srcSub, tgtSub);
    srcAlignedAll.push(...srcAligned);
    tgtAlignedAll.push(...tgtAligned);
    alignedLengths.push(srcAligned.length);
  }
}

/**
 * Align compound paths by orientation buckets, then by descending subpath length.
 * CW (-1) and CCW (+1) buckets are aligned independently.
 */
export function alignCompoundPathsForTransform(
  srcPoints3D: number[][],
  srcLengths: number[] | undefined,
  tgtPoints3D: number[][],
  tgtLengths: number[] | undefined,
  srcSigns?: Array<1 | -1>,
  tgtSigns?: Array<1 | -1>,
): CompoundAlignmentResult | null {
  // Validate first, then early-return on trivial cases
  if (srcLengths) validateSubpathLengths(srcPoints3D, srcLengths, 'source');
  if (tgtLengths) validateSubpathLengths(tgtPoints3D, tgtLengths, 'target');
  if (srcSigns && srcLengths && srcSigns.length !== srcLengths.length) {
    throw new Error(
      `alignCompoundPathsForTransform: srcSigns length (${srcSigns.length}) must match srcLengths length (${srcLengths.length})`,
    );
  }
  if (tgtSigns && tgtLengths && tgtSigns.length !== tgtLengths.length) {
    throw new Error(
      `alignCompoundPathsForTransform: tgtSigns length (${tgtSigns.length}) must match tgtLengths length (${tgtLengths.length})`,
    );
  }

  if (!srcLengths || !tgtLengths || (srcLengths.length <= 1 && tgtLengths.length <= 1)) {
    return null;
  }

  const srcAlignedAll: number[][] = [];
  const tgtAlignedAll: number[][] = [];
  const alignedLengths: number[] = [];

  const srcChunks = makeSignedChunks(srcPoints3D, srcLengths, srcSigns);
  const tgtChunks = makeSignedChunks(tgtPoints3D, tgtLengths, tgtSigns);

  alignChunkListsByLength(
    srcChunks.filter((c) => c.sign === -1),
    tgtChunks.filter((c) => c.sign === -1),
    srcAlignedAll,
    tgtAlignedAll,
    alignedLengths,
  );
  alignChunkListsByLength(
    srcChunks.filter((c) => c.sign === 1),
    tgtChunks.filter((c) => c.sign === 1),
    srcAlignedAll,
    tgtAlignedAll,
    alignedLengths,
  );

  return {
    srcAlignedPoints: srcAlignedAll,
    tgtAlignedPoints: tgtAlignedAll,
    alignedSubpathLengths: alignedLengths,
  };
}
