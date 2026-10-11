/**
 * Public Bézier curve utilities, ported from Manim CE 0.22.0 `manim/utils/bezier.py`.
 *
 * The functions keep Manim CE names and semantics so scenes ported from Python
 * read the same. Where manim-web already has a canonical implementation of a
 * routine (in `src/core/VMobjectCurveMath.ts`), this module re-exports it under
 * the Manim CE name instead of forking a second copy.
 *
 * Numeric conventions:
 *   - Scalar control values are `number[]`; point control values are `number[][]`.
 *   - `interpolate`, `mid` and `inverse_interpolate` accept scalars or points
 *     (component-wise), matching the numpy broadcasting Manim CE relies on.
 */

import { lerp } from './math';
import {
  integerInterpolate,
  partialBezierPoints,
  smoothHandlePoints,
} from '../core/VMobjectCurveMath';

// ---------------------------------------------------------------------------
// Re-exports of canonical manim-web implementations under Manim CE names
// ---------------------------------------------------------------------------

/**
 * Control points of the portion of a Bézier curve between parameters `a` and `b`.
 * Canonical implementation lives in `VMobjectCurveMath` (Manim CE `partial_bezier_points`).
 */
export { partialBezierPoints };

/**
 * Integer-and-residue split of `alpha` over the range `[start, end)`.
 * Canonical implementation lives in `VMobjectCurveMath` (Manim CE `integer_interpolate`).
 */
export { integerInterpolate };

/**
 * Smooth cubic-Bézier handles for a sequence of anchors (Manim CE
 * `get_smooth_cubic_bezier_handle_points`).
 *
 * manim-web smooths every spline as an open spline (the `get_smooth_open_cubic_bezier_handle_points`
 * case in Manim CE), so closed loops are not periodic-smooth at the seam. The
 * return value is `{ h1, h2 }`, not the `(H1, H2)` tuple Manim CE returns.
 */
export { smoothHandlePoints as getSmoothCubicBezierHandlePoints };

// ---------------------------------------------------------------------------
// Linear interpolation variants
// ---------------------------------------------------------------------------

/** Linearly interpolate between two scalars. Returns `(1 - alpha) * start + alpha * end`. */
export function interpolate(start: number, end: number, alpha: number): number;
/** Linearly interpolate between two points, component-wise. */
export function interpolate(start: number[], end: number[], alpha: number): number[];
export function interpolate(
  start: number | number[],
  end: number | number[],
  alpha: number,
): number | number[] {
  if (Array.isArray(start) && Array.isArray(end)) {
    return start.map((s, i) => (1 - alpha) * s + alpha * end[i]);
  }
  if (typeof start === 'number' && typeof end === 'number') {
    return (1 - alpha) * start + alpha * end;
  }
  throw new Error('interpolate: start and end must both be numbers or both be arrays');
}

/** Midpoint of two scalars. */
export function mid(start: number, end: number): number;
/** Midpoint of two points, component-wise. */
export function mid(start: number[], end: number[]): number[];
export function mid(start: number | number[], end: number | number[]): number | number[] {
  if (Array.isArray(start) && Array.isArray(end)) {
    return start.map((s, i) => (s + end[i]) / 2);
  }
  if (typeof start === 'number' && typeof end === 'number') {
    return (start + end) / 2;
  }
  throw new Error('mid: start and end must both be numbers or both be arrays');
}

/** Inverse interpolation: the `alpha` such that `interpolate(start, end, alpha) === value`. */
function inverseInterpolate(start: number, end: number, value: number): number;
/** Inverse interpolation between two points, component-wise. */
function inverseInterpolate(start: number[], end: number[], value: number[]): number[];
function inverseInterpolate(
  start: number | number[],
  end: number | number[],
  value: number | number[],
): number | number[] {
  if (Array.isArray(start) && Array.isArray(end) && Array.isArray(value)) {
    return start.map((s, i) => (value[i] - s) / (end[i] - s));
  }
  if (typeof start === 'number' && typeof end === 'number' && typeof value === 'number') {
    return (value - start) / (end - start);
  }
  throw new Error('inverse_interpolate: start, end and value must all be numbers or all be arrays');
}

/**
 * Map a value from an old range onto a new range, preserving its relative
 * position: `interpolate(newStart, newEnd, inverse_interpolate(oldStart, oldEnd, oldValue))`.
 */
function matchInterpolate(
  newStart: number,
  newEnd: number,
  oldStart: number,
  oldEnd: number,
  oldValue: number,
): number;
/** {@link matchInterpolate} with a point `oldValue`, mapped component-wise. */
function matchInterpolate(
  newStart: number,
  newEnd: number,
  oldStart: number,
  oldEnd: number,
  oldValue: number[],
): number[];
function matchInterpolate(
  newStart: number,
  newEnd: number,
  oldStart: number,
  oldEnd: number,
  oldValue: number | number[],
): number | number[] {
  const span = oldEnd - oldStart;
  if (Array.isArray(oldValue)) {
    return oldValue.map((v) => {
      const a = (v - oldStart) / span;
      return (1 - a) * newStart + a * newEnd;
    });
  }
  const alpha = (oldValue - oldStart) / span;
  return (1 - alpha) * newStart + alpha * newEnd;
}

// ---------------------------------------------------------------------------
// Bézier curve evaluation
// ---------------------------------------------------------------------------

/** de Casteljau evaluation of scalar control values at parameter `t`. */
function deCasteljauScalar(controls: number[], t: number): number {
  if (controls.length === 0) return 0;
  let vals = controls.slice();
  while (vals.length > 1) {
    const next: number[] = [];
    for (let i = 0; i < vals.length - 1; i++) {
      next.push(lerp(vals[i], vals[i + 1], t));
    }
    vals = next;
  }
  return vals[0];
}

/** de Casteljau evaluation of point control values at parameter `t` (any dimension). */
function deCasteljauPoint(controls: number[][], t: number): number[] {
  if (controls.length === 0) return [];
  let pts = controls.map((p) => p.slice());
  while (pts.length > 1) {
    const next: number[][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      next.push(pts[i].map((v, d) => v + t * (pts[i + 1][d] - v)));
    }
    pts = next;
  }
  return pts[0];
}

/** Build the evaluator of a Bézier curve defined by scalar control values. */
export function bezier(points: number[]): (t: number) => number;
/** Build the evaluator of a Bézier curve defined by point control values. */
export function bezier(points: number[][]): (t: number) => number[];
export function bezier(
  points: number[] | number[][],
): ((t: number) => number) | ((t: number) => number[]) {
  if (points.length > 0 && Array.isArray(points[0])) {
    const pts = points.filter((p): p is number[] => Array.isArray(p));
    return (t: number): number[] => deCasteljauPoint(pts, t);
  }
  const scal = points.filter((p): p is number => typeof p === 'number');
  return (t: number): number => deCasteljauScalar(scal, t);
}

// ---------------------------------------------------------------------------
// Splitting and subdividing
// ---------------------------------------------------------------------------

/**
 * Split a Bézier curve at parameter `t` into two curves of the same degree.
 *
 * @returns `2 * N` control points: the first `N` are the curve over `[0, t]`,
 *          the last `N` are the curve over `[t, 1]`.
 */
function splitBezier(points: number[][], t: number): number[][] {
  const N = points.length;
  const arr1 = points.map((p) => p.slice());
  const arr0: number[][] = new Array<number[]>(N);
  arr0[0] = points[0].slice();
  for (let i = 1; i < N; i++) {
    for (let j = 0; j < N - i; j++) {
      arr1[j] = arr1[j].map((v, d) => v + t * (arr1[j + 1][d] - v));
    }
    arr0[i] = arr1[0].slice();
  }
  return [...arr0, ...arr1];
}

/**
 * Subdivide a Bézier curve into `n_divisions` subcurves of the same degree and
 * equal parameter spans, split at `t = i / n_divisions`.
 *
 * Each subcurve is the portion over `[i / n, (i + 1) / n]`, which is what Manim
 * CE's memoized subdivision matrices compute for curves of degree up to 3 (the
 * only degrees manim-web produces). Manim CE's higher-degree fallback uses a
 * different successive-split schedule; this equal-interval form is the correct
 * subdivision for every degree.
 *
 * @returns `n_divisions * N` control points, the subcurves concatenated in order.
 */
function subdivideBezier(points: number[][], nDivisions: number): number[][] {
  if (nDivisions <= 1) return points.map((p) => p.slice());
  const result: number[][] = [];
  for (let i = 0; i < nDivisions; i++) {
    const piece = partialBezierPoints(points, i / nDivisions, (i + 1) / nDivisions);
    for (const p of piece) result.push(p);
  }
  return result;
}

/**
 * Subdivide each curve in `bezierTuples` until the total reaches
 * `newNumberOfCurves`, matching Manim CE's `bezier_remap`.
 *
 * @param bezierTuples - Curves as `(currentNumberOfCurves, nppc, dim)`.
 * @param newNumberOfCurves - Target number of curves (>= current).
 */
function bezierRemap(bezierTuples: number[][][], newNumberOfCurves: number): number[][][] {
  const current = bezierTuples.length;
  if (current === 0) return [];
  const nppc = bezierTuples[0].length;

  const repeatIndices: number[] = [];
  for (let k = 0; k < newNumberOfCurves; k++) {
    repeatIndices.push(Math.floor((k * current) / newNumberOfCurves));
  }
  const splitFactors = new Array<number>(current).fill(0);
  for (const idx of repeatIndices) splitFactors[idx] += 1;

  const newTuples: number[][][] = [];
  for (let c = 0; c < current; c++) {
    const sf = splitFactors[c];
    if (sf <= 0) continue;
    const sub = subdivideBezier(bezierTuples[c], sf);
    for (let s = 0; s < sf; s++) {
      newTuples.push(sub.slice(s * nppc, s * nppc + nppc));
    }
  }
  return newTuples;
}

// ---------------------------------------------------------------------------
// Closed-spline test and point membership
// ---------------------------------------------------------------------------

/**
 * Whether the spline is closed: its first and last points are close enough to
 * be the same, using Manim CE's `rtol = 1e-5`, `atol = 1e-8` over 3 coordinates.
 */
function isClosed(points: number[][]): boolean {
  const start = points[0];
  const end = points[points.length - 1];
  const rtol = 1e-5;
  const atol = 1e-8;
  for (let d = 0; d < 3; d++) {
    const s = start[d] ?? 0;
    const e = end[d] ?? 0;
    const tolerance = atol + rtol * Math.abs(s);
    if (Math.abs(e - s) > tolerance) return false;
  }
  return true;
}

interface Complex {
  re: number;
  im: number;
}

function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function csub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

function cmul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function cdiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / denom, im: (a.im * b.re - a.re * b.im) / denom };
}

/** Evaluate a polynomial (coefficients low-to-high) at a complex point via Horner. */
function polyEval(coeffs: number[], x: Complex): Complex {
  let r: Complex = { re: coeffs[coeffs.length - 1], im: 0 };
  for (let k = coeffs.length - 2; k >= 0; k--) {
    r = cadd(cmul(r, x), { re: coeffs[k], im: 0 });
  }
  return r;
}

/**
 * Complex roots of a polynomial (coefficients low-to-high) via the
 * Durand-Kerner (Weierstrass) iteration. Returns one root per degree.
 */
function polyRoots(coeffs: number[]): Complex[] {
  const c = coeffs.slice();
  while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-14) c.pop();
  const degree = c.length - 1;
  if (degree <= 0) return [];
  const lead = c[degree];
  const monic = c.map((v) => v / lead);

  const roots: Complex[] = [];
  const seed: Complex = { re: 0.4, im: 0.9 };
  let cur: Complex = { re: 1, im: 0 };
  for (let i = 0; i < degree; i++) {
    roots.push({ re: cur.re, im: cur.im });
    cur = cmul(cur, seed);
  }

  for (let iter = 0; iter < 200; iter++) {
    let maxDelta = 0;
    for (let i = 0; i < degree; i++) {
      const num = polyEval(monic, roots[i]);
      let den: Complex = { re: 1, im: 0 };
      for (let j = 0; j < degree; j++) {
        if (j === i) continue;
        den = cmul(den, csub(roots[i], roots[j]));
      }
      const delta = cdiv(num, den);
      roots[i] = csub(roots[i], delta);
      const mag = Math.hypot(delta.re, delta.im);
      if (mag > maxDelta) maxDelta = mag;
    }
    if (maxDelta < 1e-12) break;
  }
  return roots;
}

/** Binomial coefficient C(n, k). */
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

function roundToDecimals(x: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(x * factor) / factor;
}

function intersectRounded(a: number[], b: number[], decimals: number): number[] {
  const eps = 0.5 * 10 ** -decimals;
  const out: number[] = [];
  for (const x of a) {
    if (b.some((y) => Math.abs(x - y) <= eps) && !out.some((y) => Math.abs(x - y) <= eps)) {
      out.push(x);
    }
  }
  return out;
}

/**
 * Parameters `t` in `[0, 1]` at which the Bézier curve defined by
 * `controlPoints` passes through `point`. Usually one or zero values; a point
 * at the seam of a closed loop can yield more. Port of Manim CE's
 * `proportions_along_bezier_curve_for_point`.
 *
 * @throws Error when `point` and the control points have different shapes.
 */
function proportionsAlongBezierCurveForPoint(
  point: number[],
  controlPoints: number[][],
  roundTo = 1e-6,
): number[] {
  for (const cp of controlPoints) {
    if (cp.length !== point.length) {
      throw new Error(
        'proportions_along_bezier_curve_for_point: point and control points have different shapes',
      );
    }
  }

  const n = controlPoints.length - 1;
  const decimals = Math.round(Math.log10(1 / roundTo));
  const rootsPerDim: number[][] = [];

  for (let dim = 0; dim < point.length; dim++) {
    const coord = point[dim];
    const controlCoords = controlPoints.map((cp) => cp[dim]);
    const terms: number[] = [];
    for (let termPower = n; termPower >= 0; termPower--) {
      const outer = choose(n, termPower);
      let sign = 1;
      let termSum = 0;
      for (let sub = termPower; sub >= 0; sub--) {
        const inner = choose(termPower, sub) * sign;
        let subterm = inner * controlCoords[sub];
        if (termPower === 0) subterm -= coord;
        termSum += subterm;
        sign *= -1;
      }
      terms.push(outer * termSum);
    }
    if (terms.every((t) => t === 0)) continue;
    const coeffsLowToHigh = terms.slice().reverse();
    const realRoots = polyRoots(coeffsLowToHigh)
      .filter((r) => Math.abs(r.im) < 1e-9)
      .map((r) => roundToDecimals(r.re, decimals));
    rootsPerDim.push(realRoots);
  }

  if (rootsPerDim.length === 0) return [];
  let common = rootsPerDim[0];
  for (let i = 1; i < rootsPerDim.length; i++) {
    common = intersectRounded(common, rootsPerDim[i], decimals);
  }
  return common.filter((r) => r >= 0 && r <= 1);
}

/**
 * Whether `point` lies on the Bézier curve defined by `controlPoints`
 * (Manim CE `point_lies_on_bezier`). The point lies on the curve when the
 * Bézier polynomial has at least one real root in `[0, 1]`.
 *
 * @throws Error when `point` and the control points have different shapes.
 */
function pointLiesOnBezier(point: number[], controlPoints: number[][], roundTo = 1e-6): boolean {
  return proportionsAlongBezierCurveForPoint(point, controlPoints, roundTo).length > 0;
}

// ---------------------------------------------------------------------------
// Public exports for the functions declared above (camelCase, Manim CE parity)
// ---------------------------------------------------------------------------

export {
  inverseInterpolate,
  matchInterpolate,
  splitBezier,
  subdivideBezier,
  bezierRemap,
  isClosed,
  proportionsAlongBezierCurveForPoint,
  pointLiesOnBezier,
};
