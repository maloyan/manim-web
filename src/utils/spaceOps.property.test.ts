/**
 * Property-based tests for the pure vector/space operations in `./spaceOps`.
 *
 * Rotations are isometries, so they preserve length; rotating by an angle then
 * by its negative is the identity. Quaternion multiplication has `[1,0,0,0]` as
 * its unit. These invariants hold for every input (up to float tolerance), so
 * they are good property targets.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  rotateVector,
  normalize,
  normSquared,
  angleBetweenVectors,
  quaternionMult,
  quaternionFromAngleAxis,
  midpoint,
  centerOfMass,
  complexToR3,
  r3ToComplex,
  cartesianToSpherical,
  sphericalToCartesian,
} from './spaceOps';

const EPS = 1e-9;
const EPS_COMPOUND = 1e-6;

const coord = fc.double({ min: -50, max: 50, noNaN: true });
const angle = fc.double({ min: -10, max: 10, noNaN: true });
const vec3 = fc.tuple(coord, coord, coord).map(([x, y, z]) => [x, y, z]);
/** A vector whose length is safely above zero, so normalization is defined. */
const nonZeroVec3 = vec3.filter((v) => Math.sqrt(normSquared(v)) > 1e-3);
const length = (v: number[]): number => Math.sqrt(normSquared(v));

describe('rotation properties', () => {
  it('rotating by angle 0 is the identity', () => {
    fc.assert(
      fc.property(vec3, nonZeroVec3, (v, axis) => {
        const r = rotateVector(v, 0, axis);
        for (let d = 0; d < 3; d++) {
          expect(Math.abs(r[d] - v[d])).toBeLessThanOrEqual(EPS_COMPOUND);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('rotating by theta then by -theta returns the original vector', () => {
    fc.assert(
      fc.property(vec3, angle, nonZeroVec3, (v, theta, axis) => {
        const there = rotateVector(v, theta, axis);
        const back = rotateVector(there, -theta, axis);
        for (let d = 0; d < 3; d++) {
          expect(Math.abs(back[d] - v[d])).toBeLessThanOrEqual(EPS_COMPOUND * (1 + length(v)));
        }
      }),
      { numRuns: 400 },
    );
  });

  it('rotation preserves vector length (it is an isometry)', () => {
    fc.assert(
      fc.property(vec3, angle, nonZeroVec3, (v, theta, axis) => {
        const rotated = rotateVector(v, theta, axis);
        expect(Math.abs(length(rotated) - length(v))).toBeLessThanOrEqual(
          EPS_COMPOUND * (1 + length(v)),
        );
      }),
      { numRuns: 400 },
    );
  });

  it('rotation about the z-axis keeps the z component', () => {
    fc.assert(
      fc.property(vec3, angle, (v, theta) => {
        const rotated = rotateVector(v, theta, [0, 0, 1]);
        expect(Math.abs(rotated[2] - v[2])).toBeLessThanOrEqual(
          EPS_COMPOUND * (1 + Math.abs(v[2])),
        );
      }),
      { numRuns: 300 },
    );
  });
});

describe('normalization and angle properties', () => {
  it('normalize returns a unit vector for any non-zero input', () => {
    fc.assert(
      fc.property(nonZeroVec3, (v) => {
        expect(Math.abs(length(normalize(v)) - 1)).toBeLessThanOrEqual(EPS_COMPOUND);
      }),
      { numRuns: 400 },
    );
  });

  it('angleBetweenVectors always lies in [0, PI]', () => {
    fc.assert(
      fc.property(nonZeroVec3, nonZeroVec3, (a, b) => {
        const theta = angleBetweenVectors(a, b);
        expect(theta).toBeGreaterThanOrEqual(-EPS);
        expect(theta).toBeLessThanOrEqual(Math.PI + EPS_COMPOUND);
      }),
      { numRuns: 400 },
    );
  });

  it('the angle between a vector and itself is ~0', () => {
    fc.assert(
      fc.property(nonZeroVec3, (v) => {
        expect(angleBetweenVectors(v, v)).toBeLessThanOrEqual(EPS_COMPOUND);
      }),
      { numRuns: 300 },
    );
  });
});

describe('quaternion properties', () => {
  it('the unit quaternion [1,0,0,0] is a left and right identity', () => {
    const identity = [1, 0, 0, 0];
    fc.assert(
      fc.property(fc.tuple(coord, coord, coord, coord), (q) => {
        const left = quaternionMult(identity, q);
        const right = quaternionMult(q, identity);
        for (let d = 0; d < 4; d++) {
          expect(Math.abs(left[d] - q[d])).toBeLessThanOrEqual(EPS_COMPOUND * (1 + Math.abs(q[d])));
          expect(Math.abs(right[d] - q[d])).toBeLessThanOrEqual(
            EPS_COMPOUND * (1 + Math.abs(q[d])),
          );
        }
      }),
      { numRuns: 400 },
    );
  });

  it('quaternionFromAngleAxis produces a unit quaternion', () => {
    fc.assert(
      fc.property(angle, nonZeroVec3, (theta, axis) => {
        const q = quaternionFromAngleAxis(theta, axis);
        const norm = Math.sqrt(q.reduce((acc, x) => acc + x * x, 0));
        expect(Math.abs(norm - 1)).toBeLessThanOrEqual(EPS_COMPOUND);
      }),
      { numRuns: 400 },
    );
  });
});

describe('centroid and mapping properties', () => {
  it('midpoint equals the center of mass of the two points and their mean', () => {
    fc.assert(
      fc.property(vec3, vec3, (a, b) => {
        const m = midpoint(a, b);
        const c = centerOfMass([a, b]);
        for (let d = 0; d < 3; d++) {
          expect(m[d]).toBe(c[d]);
          expect(m[d]).toBe((a[d] + b[d]) / 2);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('complex <-> R3 round trips exactly for planar points', () => {
    fc.assert(
      fc.property(coord, coord, (re, im) => {
        const back = r3ToComplex(complexToR3({ re, im }));
        expect(back.re).toBe(re);
        expect(back.im).toBe(im);
      }),
      { numRuns: 300 },
    );
  });

  it('spherical <-> cartesian round trips for any non-zero vector', () => {
    fc.assert(
      fc.property(nonZeroVec3, (v) => {
        const back = sphericalToCartesian(cartesianToSpherical(v));
        for (let d = 0; d < 3; d++) {
          expect(Math.abs(back[d] - v[d])).toBeLessThanOrEqual(EPS_COMPOUND * (1 + length(v)));
        }
      }),
      { numRuns: 400 },
    );
  });
});
