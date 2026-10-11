/**
 * Property-based tests for the pure rate (easing) functions in `./index`,
 * `./spring` and `./customEase`.
 *
 * A normalized rate function maps 0 -> ~0 and 1 -> ~1. The non-overshooting
 * families are also monotonic non-decreasing and stay in [0, 1]. The
 * overshooting families (back, elastic, bounce) keep only the endpoint
 * invariant. `spring`, `cubicBezier` and `steps` pin their endpoints exactly.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { RateFunction } from './index';
import {
  linear,
  smooth,
  easeIn,
  easeOut,
  easeInOut,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,
  easeInSine,
  easeOutSine,
  easeInOutSine,
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,
  smoothstep,
  smootherstep,
  smoothererstep,
  slowInto,
  easeInBack,
  easeOutBack,
  easeInOutBack,
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,
  easeOutBounce,
  easeInBounce,
  easeInOutBounce,
  thereAndBack,
  reverse,
} from './index';
import { spring } from './spring';
import { cubicBezier, steps } from './customEase';

const EPS = 1e-9;
const EPS_ENDPOINT = 1e-9;

const unit = fc.double({ min: 0, max: 1, noNaN: true });

type NamedRate = readonly [string, RateFunction];

/** Non-overshooting eases: monotonic non-decreasing and bounded in [0, 1]. */
const MONOTONIC: readonly NamedRate[] = [
  ['linear', linear],
  ['smooth', smooth],
  ['easeIn', easeIn],
  ['easeOut', easeOut],
  ['easeInOut', easeInOut],
  ['easeInQuad', easeInQuad],
  ['easeOutQuad', easeOutQuad],
  ['easeInOutQuad', easeInOutQuad],
  ['easeInQuart', easeInQuart],
  ['easeOutQuart', easeOutQuart],
  ['easeInOutQuart', easeInOutQuart],
  ['easeInQuint', easeInQuint],
  ['easeOutQuint', easeOutQuint],
  ['easeInOutQuint', easeInOutQuint],
  ['easeInExpo', easeInExpo],
  ['easeOutExpo', easeOutExpo],
  ['easeInOutExpo', easeInOutExpo],
  ['easeInSine', easeInSine],
  ['easeOutSine', easeOutSine],
  ['easeInOutSine', easeInOutSine],
  ['easeInCirc', easeInCirc],
  ['easeOutCirc', easeOutCirc],
  ['easeInOutCirc', easeInOutCirc],
  ['smoothstep', smoothstep],
  ['smootherstep', smootherstep],
  ['smoothererstep', smoothererstep],
  ['slowInto', slowInto],
];

/** Overshooting eases: only the endpoints are pinned. */
const OVERSHOOT: readonly NamedRate[] = [
  ['easeInBack', easeInBack],
  ['easeOutBack', easeOutBack],
  ['easeInOutBack', easeInOutBack],
  ['easeInElastic', easeInElastic],
  ['easeOutElastic', easeOutElastic],
  ['easeInOutElastic', easeInOutElastic],
  ['easeOutBounce', easeOutBounce],
  ['easeInBounce', easeInBounce],
  ['easeInOutBounce', easeInOutBounce],
];

const NORMALIZED: readonly NamedRate[] = [...MONOTONIC, ...OVERSHOOT];

describe('rate function endpoint properties', () => {
  it('every normalized rate function maps 0 -> ~0 and 1 -> ~1', () => {
    fc.assert(
      fc.property(fc.constantFrom(...NORMALIZED), ([name, fn]) => {
        expect(Math.abs(fn(0)), `${name}(0)`).toBeLessThanOrEqual(EPS_ENDPOINT);
        expect(Math.abs(fn(1) - 1), `${name}(1)`).toBeLessThanOrEqual(EPS_ENDPOINT);
      }),
      { numRuns: 100 },
    );
  });
});

describe('monotonic rate function properties', () => {
  it('monotonic eases are non-decreasing on [0, 1]', () => {
    fc.assert(
      fc.property(fc.constantFrom(...MONOTONIC), unit, unit, ([name, fn], a, b) => {
        const t1 = Math.min(a, b);
        const t2 = Math.max(a, b);
        expect(fn(t2) + 1e-9, `${name} monotonic`).toBeGreaterThanOrEqual(fn(t1));
      }),
      { numRuns: 1000 },
    );
  });

  it('monotonic eases stay within [0, 1] on [0, 1]', () => {
    fc.assert(
      fc.property(fc.constantFrom(...MONOTONIC), unit, ([name, fn], t) => {
        const y = fn(t);
        expect(y, `${name} lower`).toBeGreaterThanOrEqual(-EPS);
        expect(y, `${name} upper`).toBeLessThanOrEqual(1 + EPS);
      }),
      { numRuns: 1000 },
    );
  });
});

describe('structural rate function properties', () => {
  it('smooth is symmetric about (0.5, 0.5): smooth(t) + smooth(1 - t) ~= 1', () => {
    fc.assert(
      fc.property(unit, (t) => {
        expect(Math.abs(smooth(t) + smooth(1 - t) - 1)).toBeLessThanOrEqual(EPS);
      }),
      { numRuns: 400 },
    );
  });

  it('reverse is an involution: reverse(reverse(f)) ~= f', () => {
    const funcs: readonly RateFunction[] = [smooth, easeInOut, easeIn, easeOut, slowInto];
    fc.assert(
      fc.property(fc.constantFrom(...funcs), unit, (fn, t) => {
        const back = reverse(reverse(fn));
        expect(Math.abs(back(t) - fn(t))).toBeLessThanOrEqual(EPS);
      }),
      { numRuns: 500 },
    );
  });

  it('reverse matches its definition 1 - f(1 - t)', () => {
    fc.assert(
      fc.property(fc.constantFrom(smooth, easeIn, easeOut), unit, (fn, t) => {
        expect(reverse(fn)(t)).toBe(1 - fn(1 - t));
      }),
      { numRuns: 400 },
    );
  });

  it('thereAndBack returns to 0 at the ends and peaks at the middle', () => {
    expect(Math.abs(thereAndBack(0))).toBeLessThanOrEqual(EPS);
    expect(Math.abs(thereAndBack(1))).toBeLessThanOrEqual(EPS);
    expect(Math.abs(thereAndBack(0.5) - 1)).toBeLessThanOrEqual(EPS);
  });
});

describe('cubicBezier properties', () => {
  const ctrl = fc.double({ min: -1, max: 2, noNaN: true });

  it('cubicBezier pins the endpoints exactly for any control points', () => {
    fc.assert(
      fc.property(ctrl, ctrl, ctrl, ctrl, (x1, y1, x2, y2) => {
        const fn = cubicBezier(x1, y1, x2, y2);
        expect(fn(0)).toBe(0);
        expect(fn(1)).toBe(1);
      }),
      { numRuns: 400 },
    );
  });

  it('cubicBezier with y controls in [0,1] stays within [0,1] (convex hull)', () => {
    const in01 = fc.double({ min: 0, max: 1, noNaN: true });
    fc.assert(
      fc.property(in01, in01, in01, in01, unit, (x1, y1, x2, y2, t) => {
        const y = cubicBezier(x1, y1, x2, y2)(t);
        expect(y).toBeGreaterThanOrEqual(-EPS);
        expect(y).toBeLessThanOrEqual(1 + EPS);
      }),
      { numRuns: 600 },
    );
  });
});

describe('spring properties', () => {
  // Damping is kept strictly positive. With `damping: 0` the spring is
  // undamped: its decay rate is 0, so the internal settle time is Infinity and
  // the function returns NaN for t in (0, 1). That is a degenerate physical
  // input (a frictionless spring never settles), documented in the PR; real
  // springs have positive damping.
  const physical = fc.record({
    stiffness: fc.double({ min: 1, max: 500, noNaN: true }),
    damping: fc.double({ min: 0.5, max: 100, noNaN: true }),
    mass: fc.double({ min: 0.1, max: 10, noNaN: true }),
  });
  const bouncy = fc.record({ bounce: fc.double({ min: 0, max: 0.99, noNaN: true }) });

  it('spring pins its endpoints exactly: spring(opts)(0) = 0, spring(opts)(1) = 1', () => {
    fc.assert(
      fc.property(fc.oneof(physical, bouncy), (opts) => {
        const fn = spring(opts);
        expect(fn(0)).toBe(0);
        expect(fn(1)).toBe(1);
      }),
      { numRuns: 400 },
    );
  });

  it('spring stays finite for every t in [0, 1]', () => {
    fc.assert(
      fc.property(fc.oneof(physical, bouncy), unit, (opts, t) => {
        expect(Number.isFinite(spring(opts)(t))).toBe(true);
      }),
      { numRuns: 600 },
    );
  });
});

describe('steps properties', () => {
  const n = fc.integer({ min: 1, max: 20 });
  const position = fc.constantFrom('start' as const, 'end' as const);

  it('steps pins its endpoints: steps(n)(0) = 0, steps(n)(1) = 1', () => {
    fc.assert(
      fc.property(n, position, (count, pos) => {
        const fn = steps(count, pos);
        expect(fn(0)).toBe(0);
        expect(fn(1)).toBe(1);
      }),
      { numRuns: 200 },
    );
  });

  it('steps output lies in [0, 1] and is non-decreasing', () => {
    fc.assert(
      fc.property(n, position, unit, unit, (count, pos, a, b) => {
        const fn = steps(count, pos);
        const t1 = Math.min(a, b);
        const t2 = Math.max(a, b);
        const y1 = fn(t1);
        const y2 = fn(t2);
        expect(y1).toBeGreaterThanOrEqual(0);
        expect(y1).toBeLessThanOrEqual(1);
        expect(y2).toBeGreaterThanOrEqual(y1);
      }),
      { numRuns: 600 },
    );
  });
});
