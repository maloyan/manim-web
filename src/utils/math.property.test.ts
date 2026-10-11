/**
 * Property-based tests for the pure math helpers in `./math` and the `linspace`
 * helper in `./vectors`.
 *
 * `lerp` uses the `a + (b - a) * t` form, which is exact at `t = 0` but only
 * float-close at `t = 1`. `smoothstep` and `evalCubicBezier` use polynomial
 * forms with exact endpoints. Coordinate mapping is an affine bijection, so it
 * round trips for non-degenerate ranges.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { lerp, lerpPoint, smoothstep, evalCubicBezier, coordsToPoint, pointToCoords } from './math';
import { linspace } from './vectors';

const EPS = 1e-9;
const EPS_COMPOUND = 1e-6;

/** Equal up to signed zero (`-0 === +0` is true, but `toBe` distinguishes them). */
const exactEq = (a: number, b: number): void => {
  expect(a === b, `${a} === ${b}`).toBe(true);
};

const scalar = fc.double({ min: -100, max: 100, noNaN: true });
const unit = fc.double({ min: 0, max: 1, noNaN: true });
const point3 = fc.tuple(scalar, scalar, scalar).map(([x, y, z]) => [x, y, z]);

describe('lerp properties', () => {
  it('lerp(a, b, 0) === a (exact) and lerp(a, b, 1) ~= b', () => {
    fc.assert(
      fc.property(scalar, scalar, (a, b) => {
        exactEq(lerp(a, b, 0), a);
        expect(Math.abs(lerp(a, b, 1) - b)).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(b)));
      }),
      { numRuns: 300 },
    );
  });

  it('lerp stays within [min(a,b), max(a,b)] for t in [0,1]', () => {
    fc.assert(
      fc.property(scalar, scalar, unit, (a, b, t) => {
        const v = lerp(a, b, t);
        expect(v).toBeGreaterThanOrEqual(Math.min(a, b) - EPS_COMPOUND);
        expect(v).toBeLessThanOrEqual(Math.max(a, b) + EPS_COMPOUND);
      }),
      { numRuns: 300 },
    );
  });

  it('lerpPoint keeps the endpoints component-wise', () => {
    fc.assert(
      fc.property(point3, point3, (a, b) => {
        const start = lerpPoint(a, b, 0);
        const end = lerpPoint(a, b, 1);
        for (let d = 0; d < 3; d++) {
          exactEq(start[d], a[d]);
          expect(Math.abs(end[d] - b[d])).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(b[d])));
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe('smoothstep properties', () => {
  it('smoothstep fixes the endpoints: smoothstep(0) = 0, smoothstep(1) = 1', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
  });

  it('smoothstep maps [0,1] into [0,1] and is non-decreasing', () => {
    fc.assert(
      fc.property(unit, unit, (a, b) => {
        const t1 = Math.min(a, b);
        const t2 = Math.max(a, b);
        const y1 = smoothstep(t1);
        const y2 = smoothstep(t2);
        expect(y1).toBeGreaterThanOrEqual(-EPS);
        expect(y1).toBeLessThanOrEqual(1 + EPS);
        expect(y2).toBeGreaterThanOrEqual(y1 - EPS);
      }),
      { numRuns: 400 },
    );
  });
});

describe('evalCubicBezier properties', () => {
  it('a cubic Bézier starts at p0 and ends at p3 (exact)', () => {
    fc.assert(
      fc.property(point3, point3, point3, point3, (p0, p1, p2, p3) => {
        const atZero = evalCubicBezier(p0, p1, p2, p3, 0);
        const atOne = evalCubicBezier(p0, p1, p2, p3, 1);
        for (let d = 0; d < 3; d++) {
          exactEq(atZero[d], p0[d]);
          exactEq(atOne[d], p3[d]);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe('coordinate mapping properties', () => {
  it('coordsToPoint and pointToCoords are inverse for non-degenerate ranges', () => {
    const finite = fc.double({ min: -20, max: 20, noNaN: true });
    const span = fc.double({ min: 0.5, max: 20, noNaN: true });
    const lengthArb = fc.double({ min: 0.5, max: 20, noNaN: true });
    fc.assert(
      fc.property(
        finite,
        finite,
        finite,
        span,
        finite,
        span,
        lengthArb,
        lengthArb,
        (x, y, xMin, xSpan, yMin, ySpan, xLength, yLength) => {
          const xRange: [number, number] = [xMin, xMin + xSpan];
          const yRange: [number, number] = [yMin, yMin + ySpan];
          const point = coordsToPoint(x, y, xRange, yRange, xLength, yLength);
          const [bx, by] = pointToCoords(point, xRange, yRange, xLength, yLength);
          expect(Math.abs(bx - x)).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(x)));
          expect(Math.abs(by - y)).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(y)));
        },
      ),
      { numRuns: 400 },
    );
  });
});

describe('linspace properties', () => {
  it('linspace(start, stop, n) has length n, starts at start and ends at stop', () => {
    fc.assert(
      fc.property(scalar, scalar, fc.integer({ min: 2, max: 50 }), (start, stop, n) => {
        const arr = linspace(start, stop, n);
        expect(arr).toHaveLength(n);
        exactEq(arr[0], start);
        expect(Math.abs(arr[n - 1] - stop)).toBeLessThanOrEqual(
          EPS_COMPOUND * (1 + Math.abs(stop)),
        );
      }),
      { numRuns: 300 },
    );
  });

  it('linspace values are monotonic in the direction from start to stop', () => {
    fc.assert(
      fc.property(scalar, scalar, fc.integer({ min: 2, max: 50 }), (start, stop, n) => {
        const arr = linspace(start, stop, n);
        for (let i = 1; i < arr.length; i++) {
          if (stop >= start) {
            expect(arr[i]).toBeGreaterThanOrEqual(arr[i - 1] - EPS);
          } else {
            expect(arr[i]).toBeLessThanOrEqual(arr[i - 1] + EPS);
          }
        }
      }),
      { numRuns: 300 },
    );
  });
});
