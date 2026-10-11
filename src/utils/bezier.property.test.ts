/**
 * Property-based tests for the pure Bézier utilities in `./bezier`.
 *
 * These assert algebraic invariants that must hold for every input, rather
 * than fixed example values. Interpolation that uses the `(1 - a) * s + a * e`
 * form is exact at the endpoints; de Casteljau evaluation uses the
 * `v + t * (next - v)` form, which is exact at `t = 0` but only
 * floating-point close at `t = 1`, so endpoint checks there use an epsilon.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  interpolate,
  mid,
  bezier,
  splitBezier,
  subdivideBezier,
  inverseInterpolate,
  matchInterpolate,
} from './bezier';

const EPS = 1e-9;
const EPS_COMPOUND = 1e-6;

/**
 * Assert two numbers are equal up to signed zero. Interpolation that uses the
 * `(1 - a) * s + a * e` form is mathematically exact at the endpoints; the only
 * deviation is `-0` vs `+0`, which `===` treats as equal but `toBe` does not.
 */
const exactEq = (a: number, b: number): void => {
  expect(a === b, `${a} === ${b}`).toBe(true);
};

/** A finite scalar in a bounded range (keeps float error predictable). */
const scalar = fc.double({ min: -100, max: 100, noNaN: true });
/** A parameter value in the closed unit interval. */
const unit = fc.double({ min: 0, max: 1, noNaN: true });
/** A 3D point. */
const point3 = fc.tuple(scalar, scalar, scalar).map(([x, y, z]) => [x, y, z]);
/** A list of 2..6 control points (every curve manim-web produces fits here). */
const controlPoints = fc.array(point3, { minLength: 2, maxLength: 6 });

describe('bezier interpolation properties', () => {
  it('interpolate(a, b, 0) === a and interpolate(a, b, 1) === b (scalar, exact)', () => {
    fc.assert(
      fc.property(scalar, scalar, (a, b) => {
        exactEq(interpolate(a, b, 0), a);
        exactEq(interpolate(a, b, 1), b);
      }),
      { numRuns: 200 },
    );
  });

  it('interpolate endpoints are exact component-wise for points', () => {
    fc.assert(
      fc.property(point3, point3, (a, b) => {
        const atZero = interpolate(a, b, 0);
        const atOne = interpolate(a, b, 1);
        for (let d = 0; d < 3; d++) {
          exactEq(atZero[d], a[d]);
          exactEq(atOne[d], b[d]);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('interpolate(a, b, alpha) stays within [min(a,b), max(a,b)] for alpha in [0,1]', () => {
    fc.assert(
      fc.property(scalar, scalar, unit, (a, b, alpha) => {
        const v = interpolate(a, b, alpha);
        expect(v).toBeGreaterThanOrEqual(Math.min(a, b) - EPS);
        expect(v).toBeLessThanOrEqual(Math.max(a, b) + EPS);
      }),
      { numRuns: 300 },
    );
  });

  it('mid(a, b) equals the arithmetic mean and ~= interpolate(a, b, 0.5)', () => {
    fc.assert(
      fc.property(scalar, scalar, (a, b) => {
        // mid is defined as (a + b) / 2, so this holds for every value.
        exactEq(mid(a, b), (a + b) / 2);
        // interpolate uses 0.5*a + 0.5*b, which rounds identically except in
        // the subnormal range, so compare within a tiny tolerance.
        expect(Math.abs(mid(a, b) - interpolate(a, b, 0.5))).toBeLessThanOrEqual(
          EPS_COMPOUND * (1 + Math.abs(a) + Math.abs(b)),
        );
      }),
      { numRuns: 200 },
    );
  });

  it('inverse_interpolate inverts interpolate: interpolate(s, e, inv(s, e, v)) ~= v', () => {
    fc.assert(
      fc.property(scalar, scalar, scalar, (s, eRaw, v) => {
        // Keep start and end apart so the inverse is well-conditioned.
        const e = Math.abs(eRaw - s) < 1 ? s + 1 : eRaw;
        const alpha = inverseInterpolate(s, e, v);
        const back = interpolate(s, e, alpha);
        expect(Math.abs(back - v)).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(v)));
      }),
      { numRuns: 300 },
    );
  });

  it('matchInterpolate maps the old endpoints onto the new endpoints', () => {
    fc.assert(
      fc.property(scalar, scalar, scalar, scalar, (newStart, newEnd, oldStart, oldEndRaw) => {
        const oldEnd = Math.abs(oldEndRaw - oldStart) < 1 ? oldStart + 1 : oldEndRaw;
        expect(
          Math.abs(matchInterpolate(newStart, newEnd, oldStart, oldEnd, oldStart) - newStart),
        ).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(newStart)));
        expect(
          Math.abs(matchInterpolate(newStart, newEnd, oldStart, oldEnd, oldEnd) - newEnd),
        ).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(newEnd)));
      }),
      { numRuns: 300 },
    );
  });
});

describe('bezier curve evaluation properties', () => {
  it('de Casteljau at t=0 is the first anchor (exact) and t=1 the last (~=)', () => {
    fc.assert(
      fc.property(controlPoints, (pts) => {
        const curve = bezier(pts);
        const first = curve(0);
        const last = curve(1);
        for (let d = 0; d < 3; d++) {
          exactEq(first[d], pts[0][d]);
          expect(Math.abs(last[d] - pts[pts.length - 1][d])).toBeLessThanOrEqual(EPS_COMPOUND);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('a degree-1 Bézier equals the linear interpolation of its two points', () => {
    fc.assert(
      fc.property(point3, point3, unit, (a, b, t) => {
        const curve = bezier([a, b]);
        const got = curve(t);
        const want = interpolate(a, b, t);
        for (let d = 0; d < 3; d++) {
          expect(Math.abs(got[d] - want[d])).toBeLessThanOrEqual(EPS_COMPOUND);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe('bezier splitting and subdivision properties', () => {
  it('splitBezier preserves the two global endpoints and joins continuously', () => {
    fc.assert(
      fc.property(controlPoints, unit, (pts, t) => {
        const n = pts.length;
        const out = splitBezier(pts, t);
        expect(out.length).toBe(2 * n);
        // Global start/end are kept exactly.
        expect(out[0]).toEqual(pts[0]);
        expect(out[2 * n - 1]).toEqual(pts[n - 1]);
        // The last point of the first half meets the first point of the second.
        expect(out[n - 1]).toEqual(out[n]);
      }),
      { numRuns: 300 },
    );
  });

  it('subdivideBezier keeps the curve endpoints and yields n*N control points', () => {
    fc.assert(
      fc.property(controlPoints, fc.integer({ min: 1, max: 5 }), (pts, nDiv) => {
        const n = pts.length;
        const out = subdivideBezier(pts, nDiv);
        expect(out.length).toBe((nDiv <= 1 ? 1 : nDiv) * n);
        for (let d = 0; d < 3; d++) {
          expect(Math.abs(out[0][d] - pts[0][d])).toBeLessThanOrEqual(EPS_COMPOUND);
          expect(Math.abs(out[out.length - 1][d] - pts[n - 1][d])).toBeLessThanOrEqual(
            EPS_COMPOUND,
          );
        }
      }),
      { numRuns: 300 },
    );
  });
});
