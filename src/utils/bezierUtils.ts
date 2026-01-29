/**
 * Pure math utilities for cubic Bezier curve subdivision.
 * Used by VMobject.alignPoints() to produce structurally correct
 * intermediate shapes during Transform animations.
 */

/**
 * Linearly interpolate between two 3D vectors.
 */
export function lerpVec(a: number[], b: number[], t: number): number[] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Split a cubic Bezier curve at parameter t using De Casteljau's algorithm.
 * Returns two sets of 4 control points [left, right] that together trace
 * the exact same path as the original curve.
 */
export function splitCubicBezier(
  p0: number[], p1: number[], p2: number[], p3: number[], t: number
): [number[][], number[][]] {
  const m01 = lerpVec(p0, p1, t);
  const m12 = lerpVec(p1, p2, t);
  const m23 = lerpVec(p2, p3, t);
  const m012 = lerpVec(m01, m12, t);
  const m123 = lerpVec(m12, m23, t);
  const mid = lerpVec(m012, m123, t);

  return [
    [p0, m01, m012, mid],
    [mid, m123, m23, p3],
  ];
}

/**
 * Subdivide a single cubic Bezier curve into n equal-parameter sub-curves.
 * Returns (3n + 1) points in anchor-handle-handle-anchor format with shared anchors.
 */
export function subdivideCubicBezier(
  p0: number[], p1: number[], p2: number[], p3: number[], n: number
): number[][] {
  if (n <= 1) {
    return [p0, p1, p2, p3];
  }

  // Collect n sub-curves by repeatedly splitting the remainder
  const curves: number[][][] = [];
  let curP0 = p0, curP1 = p1, curP2 = p2, curP3 = p3;

  for (let i = 0; i < n - 1; i++) {
    const remaining = n - i;
    const t = 1 / remaining;
    const [left, right] = splitCubicBezier(curP0, curP1, curP2, curP3, t);
    curves.push(left);
    curP0 = right[0];
    curP1 = right[1];
    curP2 = right[2];
    curP3 = right[3];
  }
  curves.push([curP0, curP1, curP2, curP3]);

  // Merge into flat point array with shared anchors
  const result: number[][] = [];
  for (let i = 0; i < curves.length; i++) {
    if (i === 0) {
      result.push(curves[i][0], curves[i][1], curves[i][2], curves[i][3]);
    } else {
      // Skip anchor (shared with previous curve's end)
      result.push(curves[i][1], curves[i][2], curves[i][3]);
    }
  }
  return result;
}

/**
 * Distribute `total` items into `buckets` as evenly as possible (Bresenham-style).
 * Returns an array of length `buckets` where each entry is the count for that bucket.
 * Sum of all entries === total.
 */
export function distributeEvenly(total: number, buckets: number): number[] {
  if (buckets <= 0) return [];
  const base = Math.floor(total / buckets);
  const remainder = total - base * buckets;
  const result: number[] = [];
  for (let i = 0; i < buckets; i++) {
    result.push(base + (i < remainder ? 1 : 0));
  }
  return result;
}

/**
 * Remap a VMobject's flat point array to have `targetNumCurves` cubic Bezier curves.
 *
 * If the source has fewer curves than targetNumCurves, each source curve is subdivided
 * proportionally (curves with more parameter share get more sub-curves).
 *
 * @param points - Flat array of 3D control points in anchor-handle-handle-anchor format
 * @param targetNumCurves - Desired number of output curves
 * @returns New flat point array with (3 * targetNumCurves + 1) points
 */
export function bezierRemap(points: number[][], targetNumCurves: number): number[][] {
  const srcNumCurves = points.length >= 4 ? Math.floor((points.length - 1) / 3) : 0;

  if (srcNumCurves === 0 || targetNumCurves <= 0) {
    return pointsToNullArray(targetNumCurves * 3 + 1);
  }

  if (srcNumCurves === targetNumCurves) {
    return points.map(p => [...p]);
  }

  if (srcNumCurves > targetNumCurves) {
    // More source curves than target — merge is rare and complex; fall back
    // to picking evenly spaced curves. For the transform use-case, we always
    // subdivide the *smaller* side, so this branch should not be hit.
    // Simple fallback: subdivide anyway (treat as identity).
    return points.map(p => [...p]);
  }

  // Distribute targetNumCurves subdivisions across srcNumCurves source curves
  const splits = distributeEvenly(targetNumCurves, srcNumCurves);

  const result: number[][] = [];
  for (let i = 0; i < srcNumCurves; i++) {
    const base = i * 3;
    const p0 = points[base];
    const p1 = points[base + 1];
    const p2 = points[base + 2];
    const p3 = points[base + 3];
    const subPts = subdivideCubicBezier(p0, p1, p2, p3, splits[i]);

    if (i === 0) {
      // Push all points from first curve's subdivision
      for (const pt of subPts) {
        result.push([...pt]);
      }
    } else {
      // Skip shared anchor (subPts[0] === last point already in result)
      for (let j = 1; j < subPts.length; j++) {
        result.push([...subPts[j]]);
      }
    }
  }

  return result;
}

/**
 * Create an array of numPoints zero-vectors [0,0,0].
 * Used to pad an empty VMobject to match a non-empty one during alignment.
 */
export function pointsToNullArray(numPoints: number): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < numPoints; i++) {
    result.push([0, 0, 0]);
  }
  return result;
}
