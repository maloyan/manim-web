import { evalCubicBezier, lerpPoint as lerpPoint3D } from '../utils/math';

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
 * Resample a 3D point list to a target count using linear interpolation.
 *
 * This mirrors VMobject._interpolatePointList3D behavior and is used for
 * compound-path pairing so the shorter subpath is resampled to match the
 * longer subpath's point count.
 */
function resamplePointList3D(points: number[][], targetCount: number): number[][] {
  if (targetCount <= 0) return [];

  if (points.length === 0) {
    return Array.from({ length: targetCount }, () => [0, 0, 0]);
  }

  if (targetCount === 1) {
    return [[...(points[0] ?? [0, 0, 0])]];
  }

  if (points.length === targetCount) {
    return points.map((p) => [...p]);
  }

  if (points.length === 1) {
    return Array.from({ length: targetCount }, () => [...points[0]]);
  }

  if (isCubicBezierChain(points) && targetCount >= 4 && (targetCount - 1) % 3 === 0) {
    const currentCurveCount = (points.length - 1) / 3;
    const targetCurveCount = (targetCount - 1) / 3;
    if (targetCurveCount >= currentCurveCount) {
      const remapped = remapBezierCurveCount(points, targetCurveCount);
      if (remapped.length === targetCount) {
        return remapped;
      }
    }
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

function subdivideCubicCurve(curve: number[][], parts: number): number[][][] {
  const p0 = curve[0];
  const p1 = curve[1];
  const p2 = curve[2];
  const p3 = curve[3];

  if (parts <= 1) {
    return [[[...p0], [...p1], [...p2], [...p3]]];
  }

  const out: number[][][] = [];
  for (let i = 0; i < parts; i++) {
    const t0 = i / parts;
    const t1 = (i + 1) / parts;
    const dt = t1 - t0;

    const q0 = evalCubicBezier(p0, p1, p2, p3, t0);
    const q3 = evalCubicBezier(p0, p1, p2, p3, t1);
    const d0 = evalCubicDerivative(p0, p1, p2, p3, t0);
    const d1 = evalCubicDerivative(p0, p1, p2, p3, t1);

    const q1 = q0.map((v, k) => v + (dt / 3) * (d0[k] ?? 0));
    const q2 = q3.map((v, k) => v - (dt / 3) * (d1[k] ?? 0));

    out.push([q0, q1, q2, q3]);
  }

  return out;
}

function remapBezierCurveCount(points: number[][], newCurveCount: number): number[][] {
  const currentCurveCount = (points.length - 1) / 3;
  if (!Number.isInteger(currentCurveCount) || currentCurveCount <= 0) {
    return points.map((p) => [...p]);
  }
  if (newCurveCount <= currentCurveCount) {
    return points.map((p) => [...p]);
  }

  const curves: number[][][] = [];
  for (let i = 0; i + 3 < points.length; i += 3) {
    curves.push([points[i], points[i + 1], points[i + 2], points[i + 3]]);
  }

  const splitFactors = new Array<number>(currentCurveCount).fill(0);
  for (let i = 0; i < newCurveCount; i++) {
    const idx = Math.floor((i * currentCurveCount) / newCurveCount);
    splitFactors[idx] += 1;
  }

  const out: number[][] = [];
  for (let i = 0; i < curves.length; i++) {
    const pieces = subdivideCubicCurve(curves[i], splitFactors[i]);
    for (let j = 0; j < pieces.length; j++) {
      const piece = pieces[j];
      if (out.length === 0) out.push([...piece[0]]);
      out.push([...piece[1]], [...piece[2]], [...piece[3]]);
    }
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

function pickClosestAnchorShift(src0: number[], tgtSubpath: number[][], stride: number): number {
  const openLen = tgtSubpath.length - 1;
  const anchorCount = openLen / stride;
  let bestAnchor = 0;
  let bestDist2 = Infinity;

  for (let ai = 0; ai < anchorCount; ai++) {
    const p = tgtSubpath[ai * stride];
    const dx = (p[0] ?? 0) - (src0[0] ?? 0);
    const dy = (p[1] ?? 0) - (src0[1] ?? 0);
    const dz = (p[2] ?? 0) - (src0[2] ?? 0);
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < bestDist2) {
      bestDist2 = d2;
      bestAnchor = ai;
    }
  }

  return bestAnchor * stride;
}

/**
 * Rotate closed cubic-bezier target subpath so its first anchor is the closest
 * anchor to the source first anchor. Rotation is done by stride=3 to preserve
 * [anchor, handle, handle, anchor, ...] structure.
 */
function rotateClosedTargetToClosestSourceAnchor(
  srcSubpath: number[][],
  tgtSubpath: number[][],
): number[][] {
  const stride = 3;
  if (!isStrideClosedCubicSubpath(srcSubpath, stride)) return clonePoints(tgtSubpath);
  if (!isStrideClosedCubicSubpath(tgtSubpath, stride)) return clonePoints(tgtSubpath);

  const openLen = tgtSubpath.length - 1;
  const shift = pickClosestAnchorShift(srcSubpath[0], tgtSubpath, stride);
  if (shift === 0) return clonePoints(tgtSubpath);

  const rotatedOpen: number[][] = [];
  for (let i = 0; i < openLen; i++) {
    rotatedOpen.push([...(tgtSubpath[(i + shift) % openLen] ?? [0, 0, 0])]);
  }
  rotatedOpen.push([...rotatedOpen[0]]);
  return rotatedOpen;
}

/** Equalize point counts by resampling the shorter subpath only. */
function alignSubpathPairPoints(
  srcSubpath: number[][],
  tgtSubpath: number[][],
): { srcAligned: number[][]; tgtAligned: number[][] } {
  const maxCount = Math.max(srcSubpath.length, tgtSubpath.length);
  const srcAligned =
    srcSubpath.length < maxCount
      ? resamplePointList3D(srcSubpath, maxCount)
      : srcSubpath.map((p) => [...p]);
  const tgtAlignedRaw =
    tgtSubpath.length < maxCount
      ? resamplePointList3D(tgtSubpath, maxCount)
      : tgtSubpath.map((p) => [...p]);

  const tgtAligned = rotateClosedTargetToClosestSourceAnchor(srcAligned, tgtAlignedRaw);

  return { srcAligned, tgtAligned };
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

function signedArea2D(pts: number[][]): number {
  const anchors: number[][] = [];
  for (let i = 0; i < pts.length; i += 3) anchors.push(pts[i]);
  if (anchors.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < anchors.length; i++) {
    const j = (i + 1) % anchors.length;
    area += anchors[i][0] * anchors[j][1] - anchors[j][0] * anchors[i][1];
  }
  return area / 2;
}

function inferSign(chunk: number[][]): 1 | -1 {
  return signedArea2D(chunk) < 0 ? -1 : 1;
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

function alignChunkListsByLength(
  srcChunks: Array<{ chunk: number[][]; len: number }>,
  tgtChunks: Array<{ chunk: number[][]; len: number }>,
  srcCenter: number[],
  tgtCenter: number[],
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

    const srcSub = src ?? makeNullSubpathFromReference(tgt!, tgtCenter);
    const tgtSub = tgt ?? makeNullSubpathFromReference(src!, srcCenter);

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
  if (!srcLengths || !tgtLengths || (srcLengths.length <= 1 && tgtLengths.length <= 1)) {
    return null;
  }

  validateSubpathLengths(srcPoints3D, srcLengths, 'source');
  validateSubpathLengths(tgtPoints3D, tgtLengths, 'target');

  const srcCenter = computeCenter(srcPoints3D);
  const tgtCenter = computeCenter(tgtPoints3D);

  const srcAlignedAll: number[][] = [];
  const tgtAlignedAll: number[][] = [];
  const alignedLengths: number[] = [];

  const srcChunks = makeSignedChunks(srcPoints3D, srcLengths, srcSigns);
  const tgtChunks = makeSignedChunks(tgtPoints3D, tgtLengths, tgtSigns);

  const sameSignPairs =
    Math.min(
      srcChunks.filter((c) => c.sign === -1).length,
      tgtChunks.filter((c) => c.sign === -1).length,
    ) +
    Math.min(
      srcChunks.filter((c) => c.sign === 1).length,
      tgtChunks.filter((c) => c.sign === 1).length,
    );

  if (sameSignPairs === 0) {
    alignChunkListsByLength(
      srcChunks,
      tgtChunks,
      srcCenter,
      tgtCenter,
      srcAlignedAll,
      tgtAlignedAll,
      alignedLengths,
    );
  } else {
    alignChunkListsByLength(
      srcChunks.filter((c) => c.sign === -1),
      tgtChunks.filter((c) => c.sign === -1),
      srcCenter,
      tgtCenter,
      srcAlignedAll,
      tgtAlignedAll,
      alignedLengths,
    );
    alignChunkListsByLength(
      srcChunks.filter((c) => c.sign === 1),
      tgtChunks.filter((c) => c.sign === 1),
      srcCenter,
      tgtCenter,
      srcAlignedAll,
      tgtAlignedAll,
      alignedLengths,
    );
  }

  return {
    srcAlignedPoints: srcAlignedAll,
    tgtAlignedPoints: tgtAlignedAll,
    alignedSubpathLengths: alignedLengths,
  };
}
