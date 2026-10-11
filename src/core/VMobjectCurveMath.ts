/**
 * Pure math helpers for VMobject cubic-Bezier curve operations.
 *
 * This module contains only pure functions over point arrays (`number[][]`).
 * It never constructs VMobject instances, so it has no import cycle with
 * VMobject.ts. The VMobject class imports these helpers and wraps them as
 * methods, which keeps VMobject.ts smaller and the math independently testable.
 *
 * Point layout (shared-anchor cubic Bezier chain, matching VMobject):
 *   [A0, H1, H2, A1, H3, H4, A2, ...]
 * Each cubic segment c uses points[3c .. 3c+3]; consecutive segments share
 * an anchor. A chain of n cubics has 3n+1 points and n+1 anchors.
 */

import { evalCubicBezier, lerpPoint } from '../utils/math';
import { getNumCurvesFromPoints } from './VMobjectCurves';

/** Euclidean distance between two 3D points (z defaults to 0). */
function distance3(a: number[], b: number[]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = (a[2] ?? 0) - (b[2] ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ---------------------------------------------------------------------------
// Item 5: arc-length parametrization
// ---------------------------------------------------------------------------

/**
 * Sampled arc length of every cubic segment in a point chain, plus the total.
 *
 * Each segment is sampled at `samplesPerSegment + 1` points and the polyline
 * length between samples is summed. This matches Manim CE's
 * `get_curve_functions_with_lengths` sampling strategy.
 *
 * @param points - Shared-anchor cubic Bezier point chain
 * @param samplesPerSegment - Samples per cubic segment (default 10)
 * @returns Per-segment lengths and their sum
 */
function pathArcLengthTable(
  points: number[][],
  samplesPerSegment = 10,
): { lengths: number[]; total: number } {
  const numCurves = getNumCurvesFromPoints(points);
  const lengths: number[] = [];
  let total = 0;
  for (let c = 0; c < numCurves; c++) {
    const i = c * 3;
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];
    let segLen = 0;
    let prev = evalCubicBezier(p0, p1, p2, p3, 0);
    for (let s = 1; s <= samplesPerSegment; s++) {
      const curr = evalCubicBezier(p0, p1, p2, p3, s / samplesPerSegment);
      segLen += distance3(prev, curr);
      prev = curr;
    }
    lengths.push(segLen);
    total += segLen;
  }
  return { lengths, total };
}

/**
 * Point at arc-length proportion `alpha` along a cubic Bezier point chain.
 *
 * `alpha` is measured by cumulative arc length, not by segment index, so a
 * proportion of 0.5 is the geometric midpoint of the whole path. Matches
 * Manim CE's `point_from_proportion`.
 *
 * @param points - Shared-anchor cubic Bezier point chain
 * @param alpha - Proportion in [0, 1]
 * @param samplesPerSegment - Samples per cubic segment for length estimation
 * @returns Point as [x, y, z]
 * @throws Error when the chain has no points
 */
export function pointFromProportionOnPath(
  points: number[][],
  alpha: number,
  samplesPerSegment = 10,
): [number, number, number] {
  if (points.length === 0) {
    throw new Error('pointFromProportionOnPath: empty point chain');
  }
  const numCurves = getNumCurvesFromPoints(points);
  const first = points[0];
  const last = points[points.length - 1];
  if (numCurves === 0 || alpha <= 0) return [first[0], first[1], first[2] ?? 0];
  if (alpha >= 1) return [last[0], last[1], last[2] ?? 0];

  const { lengths, total } = pathArcLengthTable(points, samplesPerSegment);
  if (total === 0) return [first[0], first[1], first[2] ?? 0];

  const targetLength = alpha * total;
  let accumulated = 0;
  for (let c = 0; c < numCurves; c++) {
    const segLen = lengths[c];
    if (accumulated + segLen >= targetLength) {
      const residue = segLen !== 0 ? (targetLength - accumulated) / segLen : 0;
      const i = c * 3;
      const p = evalCubicBezier(points[i], points[i + 1], points[i + 2], points[i + 3], residue);
      return [p[0], p[1], p[2]];
    }
    accumulated += segLen;
  }
  return [last[0], last[1], last[2] ?? 0];
}

/**
 * Arc-length proportion of the point on the chain nearest to `point`.
 *
 * Samples the whole path, finds the nearest sample, and returns its cumulative
 * arc length divided by the total. This is a monotone inverse of
 * {@link pointFromProportionOnPath} that round-trips to sample resolution.
 *
 * @param points - Shared-anchor cubic Bezier point chain
 * @param point - Query point [x, y, z]
 * @param samplesPerSegment - Samples per cubic segment
 * @returns Proportion in [0, 1]
 */
export function proportionFromPointOnPath(
  points: number[][],
  point: number[],
  samplesPerSegment = 10,
): number {
  const numCurves = getNumCurvesFromPoints(points);
  if (points.length === 0 || numCurves === 0) return 0;

  let cumulative = 0;
  let bestDistance = distance3(points[0], point);
  let bestCumulative = 0;

  for (let c = 0; c < numCurves; c++) {
    const i = c * 3;
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];
    let prev = evalCubicBezier(p0, p1, p2, p3, 0);
    for (let s = 1; s <= samplesPerSegment; s++) {
      const curr = evalCubicBezier(p0, p1, p2, p3, s / samplesPerSegment);
      cumulative += distance3(prev, curr);
      const d = distance3(curr, point);
      if (d < bestDistance) {
        bestDistance = d;
        bestCumulative = cumulative;
      }
      prev = curr;
    }
  }

  return cumulative === 0 ? 0 : bestCumulative / cumulative;
}

// ---------------------------------------------------------------------------
// Item 7: partial curves
// ---------------------------------------------------------------------------

/**
 * Evaluate a Bezier curve of any degree at parameter t via de Casteljau.
 * @param controls - Control points (degree = controls.length - 1)
 * @param t - Parameter in [0, 1]
 */
function bezierEval(controls: number[][], t: number): number[] {
  let pts = controls.map((p) => [p[0], p[1], p[2] ?? 0]);
  while (pts.length > 1) {
    const next: number[][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      next.push(lerpPoint(pts[i], pts[i + 1], t));
    }
    pts = next;
  }
  return pts[0];
}

/**
 * Control points of the portion of a Bezier curve between parameters a and b.
 *
 * Direct port of Manim CE's `partial_bezier_points`. Works for any degree; the
 * result has the same number of control points as the input.
 *
 * @param controls - Control points of the full curve
 * @param a - Start parameter in [0, 1]
 * @param b - End parameter in [0, 1], b >= a
 */
export function partialBezierPoints(controls: number[][], a: number, b: number): number[][] {
  const n = controls.length;
  if (a === 1) {
    const lastPt = controls[n - 1];
    return controls.map(() => [lastPt[0], lastPt[1], lastPt[2] ?? 0]);
  }
  const aTo1: number[][] = [];
  for (let i = 0; i < n; i++) {
    aTo1.push(bezierEval(controls.slice(i), a));
  }
  const endProp = (b - a) / (1 - a);
  const result: number[][] = [];
  for (let i = 0; i < n; i++) {
    result.push(bezierEval(aTo1.slice(0, i + 1), endProp));
  }
  return result;
}

/**
 * Integer-and-residue split of `alpha` over the range [start, end).
 * Port of Manim CE's `integer_interpolate`.
 *
 * @returns [integer index, fractional residue in [0, 1]]
 */
export function integerInterpolate(start: number, end: number, alpha: number): [number, number] {
  if (alpha >= 1) return [end - 1, 1];
  if (alpha <= 0) return [start, 0];
  const value = Math.floor(start + (end - start) * alpha);
  const residue = ((end - start) * alpha) % 1;
  return [value, residue];
}

/**
 * Build the shared-anchor point chain for the partial path of `points`
 * between arc-index proportions a and b.
 *
 * Port of Manim CE's `pointwise_become_partial`, adapted to the shared-anchor
 * layout (each appended cubic after the first contributes only its last three
 * points, dropping the duplicated start anchor).
 *
 * @param points - Source shared-anchor cubic Bezier point chain
 * @param a - Start proportion in [0, 1]
 * @param b - End proportion in [0, 1]
 * @returns New point chain for the partial path
 */
export function partialPathPoints(points: number[][], a: number, b: number): number[][] {
  if (a <= 0 && b >= 1) return points.map((p) => [...p]);
  const numCubics = getNumCurvesFromPoints(points);
  if (numCubics === 0) return [];

  const quad = (index: number): number[][] => points.slice(index * 3, index * 3 + 4);
  const [lowerIndex, lowerResidue] = integerInterpolate(0, numCubics, a);
  const [upperIndex, upperResidue] = integerInterpolate(0, numCubics, b);

  const result: number[][] = [];
  const appendQuad = (segment: number[][]): void => {
    const startAt = result.length === 0 ? 0 : 1;
    for (let i = startAt; i < segment.length; i++) {
      result.push([segment[i][0], segment[i][1], segment[i][2] ?? 0]);
    }
  };

  if (lowerIndex === upperIndex) {
    appendQuad(partialBezierPoints(quad(lowerIndex), lowerResidue, upperResidue));
  } else {
    appendQuad(partialBezierPoints(quad(lowerIndex), lowerResidue, 1));
    for (let i = lowerIndex + 1; i < upperIndex; i++) {
      appendQuad(quad(i));
    }
    appendQuad(partialBezierPoints(quad(upperIndex), 0, upperResidue));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Item 10: smooth / jagged handles
// ---------------------------------------------------------------------------

/**
 * Anchor points of a shared-anchor cubic Bezier chain.
 * A chain of n cubics has anchors at points[0], points[3], ..., points[3n].
 */
export function anchorsFromPoints(points: number[][]): number[][] {
  const numCurves = getNumCurvesFromPoints(points);
  if (numCurves === 0) return points.map((p) => [p[0], p[1], p[2] ?? 0]);
  const anchors: number[][] = [];
  for (let c = 0; c <= numCurves; c++) {
    const p = points[c * 3];
    anchors.push([p[0], p[1], p[2] ?? 0]);
  }
  return anchors;
}

/**
 * Smooth cubic-Bezier handles for a sequence of anchors (open spline).
 *
 * Solves the tridiagonal system for a C1-continuous spline through the anchors
 * (the classic "smooth bezier spline" formulation that Manim CE's
 * `get_smooth_handle_points` computes). For each internal anchor the incoming
 * second handle and outgoing first handle are reflections through the anchor,
 * giving tangent continuity.
 *
 * Closed paths are smoothed as an open spline over the repeated-endpoint
 * anchor list, so the seam is not periodic-smooth.
 *
 * @param anchors - Anchor points (length n+1 for n segments)
 * @returns First and second handles, one each per segment (length n)
 */
export function smoothHandlePoints(anchors: number[][]): { h1: number[][]; h2: number[][] } {
  const n = anchors.length - 1;
  if (n < 1) return { h1: [], h2: [] };
  if (n === 1) {
    return {
      h1: [lerpPoint(anchors[0], anchors[1], 1 / 3)],
      h2: [lerpPoint(anchors[0], anchors[1], 2 / 3)],
    };
  }

  const h1: number[][] = Array.from({ length: n }, () => [0, 0, 0]);
  const h2: number[][] = Array.from({ length: n }, () => [0, 0, 0]);

  for (let d = 0; d < 3; d++) {
    const K = anchors.map((p) => p[d] ?? 0);
    const sub = new Array<number>(n).fill(0);
    const diag = new Array<number>(n).fill(0);
    const sup = new Array<number>(n).fill(0);
    const rhs = new Array<number>(n).fill(0);

    diag[0] = 2;
    sup[0] = 1;
    rhs[0] = K[0] + 2 * K[1];
    for (let i = 1; i < n - 1; i++) {
      sub[i] = 1;
      diag[i] = 4;
      sup[i] = 1;
      rhs[i] = 4 * K[i] + 2 * K[i + 1];
    }
    sub[n - 1] = 2;
    diag[n - 1] = 7;
    rhs[n - 1] = 8 * K[n - 1] + K[n];

    // Thomas algorithm (forward elimination, back substitution).
    for (let i = 1; i < n; i++) {
      const m = sub[i] / diag[i - 1];
      diag[i] -= m * sup[i - 1];
      rhs[i] -= m * rhs[i - 1];
    }
    const P1 = new Array<number>(n);
    P1[n - 1] = rhs[n - 1] / diag[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      P1[i] = (rhs[i] - sup[i] * P1[i + 1]) / diag[i];
    }
    const P2 = new Array<number>(n);
    for (let i = 0; i < n - 1; i++) {
      P2[i] = 2 * K[i + 1] - P1[i + 1];
    }
    P2[n - 1] = (K[n] + P1[n - 1]) / 2;

    for (let i = 0; i < n; i++) {
      h1[i][d] = P1[i];
      h2[i][d] = P2[i];
    }
  }
  return { h1, h2 };
}

// ---------------------------------------------------------------------------
// Point-list building: append points and insert curves
// ---------------------------------------------------------------------------

/** Copy a point, defaulting the z coordinate to 0. */
function copyPoint(p: number[]): number[] {
  return [p[0], p[1], p[2] ?? 0];
}

/**
 * Append `newPoints` to a shared-anchor cubic chain, returning the joined chain.
 *
 * Port of Manim CE's `append_points`, adapted to the shared-anchor layout. CE
 * stores each cubic as four independent points and concatenates raw, so the
 * join anchor appears twice. Here consecutive cubics share their boundary
 * anchor, so when the existing chain is non-empty the first appended anchor
 * continues from the last existing anchor and is dropped. With `existing` of
 * 3k+1 points and `newPoints` of 3m+1 points the result has 3(k+m)+1 points.
 *
 * @param existing - Current shared-anchor chain (may be empty)
 * @param newPoints - Points to append (a shared-anchor chain on its own)
 * @returns New joined chain; `existing` and `newPoints` are not mutated
 */
export function appendPointsToPointList(existing: number[][], newPoints: number[][]): number[][] {
  if (newPoints.length === 0) return existing.map(copyPoint);
  if (existing.length === 0) return newPoints.map(copyPoint);
  return existing.map(copyPoint).concat(newPoints.slice(1).map(copyPoint));
}

/** Split factors that `bezier_remap` assigns to each source curve. */
function remapSplitFactors(currentCurves: number, newCurves: number): number[] {
  const factors = new Array<number>(currentCurves).fill(0);
  for (let k = 0; k < newCurves; k++) {
    factors[Math.floor((k * currentCurves) / newCurves)] += 1;
  }
  return factors;
}

/**
 * Subdivide a shared-anchor chain so it contains exactly `n` more cubics.
 *
 * Port of Manim CE's `insert_n_curves_to_point_list`. Each existing cubic is
 * split into as many equal-parameter sub-cubics as `bezier_remap` requires, so
 * the sampled curve is unchanged and the curve count rises by exactly `n`.
 *
 * @param n - Number of cubics to add (<= 0 returns a copy)
 * @param points - Source shared-anchor cubic chain
 * @returns New chain with `numCurves + n` cubics
 */
export function insertNCurvesToPointList(n: number, points: number[][]): number[][] {
  if (n <= 0) return points.map(copyPoint);
  if (points.length === 1) {
    return Array.from({ length: 3 * n + 1 }, () => copyPoint(points[0]));
  }
  const numCurves = getNumCurvesFromPoints(points);
  if (numCurves === 0) return points.map(copyPoint);

  const splitFactors = remapSplitFactors(numCurves, numCurves + n);
  const result: number[][] = [];
  for (let c = 0; c < numCurves; c++) {
    const quad = points.slice(c * 3, c * 3 + 4);
    const sf = splitFactors[c];
    for (let i = 0; i < sf; i++) {
      const piece = partialBezierPoints(quad, i / sf, (i + 1) / sf);
      const startAt = result.length === 0 ? 0 : 1;
      for (let j = startAt; j < piece.length; j++) result.push(copyPoint(piece[j]));
    }
  }
  return result;
}

/**
 * Assemble a shared-anchor point chain from anchors and per-segment handles.
 */
export function chainFromAnchorsAndHandles(
  anchors: number[][],
  h1: number[][],
  h2: number[][],
): number[][] {
  const pts: number[][] = [[anchors[0][0], anchors[0][1], anchors[0][2] ?? 0]];
  for (let i = 0; i < h1.length; i++) {
    pts.push(
      [...h1[i]],
      [...h2[i]],
      [anchors[i + 1][0], anchors[i + 1][1], anchors[i + 1][2] ?? 0],
    );
  }
  return pts;
}
