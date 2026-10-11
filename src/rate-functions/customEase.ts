/**
 * Custom and parametric easing rate functions.
 *
 * - cubicBezier: a CSS cubic-bezier easing, solved with Newton then bisection.
 * - named CSS eases built on cubicBezier.
 * - steps: the CSS steps() timing function.
 */

import type { RateFunction } from './index';

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 1e-3;
const SUBDIVISION_EPSILON = 1e-7;
const SUBDIVISION_MAX_ITERATIONS = 32;

/**
 * Evaluate one axis of the cubic bezier with control values c1 and c2.
 * The axis runs from 0 (at u = 0) to 1 (at u = 1).
 */
const bezierAxis = (u: number, c1: number, c2: number): number => {
  const a = 1 - 3 * c2 + 3 * c1;
  const b = 3 * c2 - 6 * c1;
  const c = 3 * c1;
  return ((a * u + b) * u + c) * u;
};

/**
 * Derivative of bezierAxis with respect to u.
 */
const bezierAxisSlope = (u: number, c1: number, c2: number): number => {
  const a = 1 - 3 * c2 + 3 * c1;
  const b = 3 * c2 - 6 * c1;
  const c = 3 * c1;
  return (3 * a * u + 2 * b) * u + c;
};

/**
 * Solve bezierAxis(u, x1, x2) = x for u, with x in [0, 1].
 */
const solveForU = (x: number, x1: number, x2: number): number => {
  let u = x;
  // Newton-Raphson first: fast when the slope is large enough.
  for (let i = 0; i < NEWTON_ITERATIONS; i++) {
    const slope = bezierAxisSlope(u, x1, x2);
    if (slope < NEWTON_MIN_SLOPE) break;
    const error = bezierAxis(u, x1, x2) - x;
    u -= error / slope;
  }

  // Bisection fallback guarantees convergence when the slope is tiny.
  let low = 0;
  let high = 1;
  u = clamp01(u);
  let current = bezierAxis(u, x1, x2);
  if (Math.abs(current - x) <= SUBDIVISION_EPSILON) return u;

  for (let i = 0; i < SUBDIVISION_MAX_ITERATIONS; i++) {
    if (current < x) {
      low = u;
    } else {
      high = u;
    }
    u = (low + high) / 2;
    current = bezierAxis(u, x1, x2);
    if (Math.abs(current - x) <= SUBDIVISION_EPSILON) break;
  }
  return u;
};

/**
 * Create a CSS cubic-bezier easing.
 *
 * Control points are P0 = (0, 0), P1 = (x1, y1), P2 = (x2, y2), P3 = (1, 1).
 * x1 and x2 are clamped to [0, 1] so the x axis stays monotonic, as CSS
 * requires. y1 and y2 are free, so the curve may overshoot.
 *
 * @example
 * const ease = cubicBezier(0.25, 0.1, 0.25, 1);
 * ease(0); // 0
 * ease(1); // 1
 */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number): RateFunction => {
  const cx1 = clamp01(x1);
  const cx2 = clamp01(x2);
  // Control points on the diagonal give the identity easing y = x.
  const isIdentity = cx1 === y1 && cx2 === y2;

  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    if (isIdentity) return t;
    const u = solveForU(t, cx1, cx2);
    return bezierAxis(u, y1, y2);
  };
};

// --- Named CSS eases built on cubicBezier ---

/** CSS `ease`: slow start, fast middle, slow end. */
export const ease: RateFunction = cubicBezier(0.25, 0.1, 0.25, 1);

/** CSS `ease-in`: slow start. */
export const easeInBezier: RateFunction = cubicBezier(0.42, 0, 1, 1);

/** CSS `ease-out`: slow end. */
export const easeOutBezier: RateFunction = cubicBezier(0, 0, 0.58, 1);

/** CSS `ease-in-out`: slow start and end. */
export const easeInOutBezier: RateFunction = cubicBezier(0.42, 0, 0.58, 1);

// --- CSS steps() timing function ---

/** Where a step jumps: at the start or the end of each interval. */
export type StepPosition = 'start' | 'end';

/**
 * Create a CSS steps() timing function with n steps.
 *
 * - 'end' (default) holds then jumps at the end of each interval.
 * - 'start' jumps at the start of each interval.
 *
 * Both start at 0 at t = 0 and reach 1 at t = 1.
 *
 * @example
 * const quantized = steps(4);
 * quantized(0); // 0
 * quantized(1); // 1
 */
export const steps = (n: number, position: StepPosition = 'end'): RateFunction => {
  const count = Math.max(1, Math.floor(n));
  return (t: number): number => {
    const clamped = clamp01(t);
    const raw = position === 'start' ? Math.ceil(clamped * count) : Math.floor(clamped * count);
    return clamp01(raw / count);
  };
};
