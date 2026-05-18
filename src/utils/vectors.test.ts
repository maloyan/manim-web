import { describe, it, expect } from 'vitest';
import {
  scaleVec,
  addVec,
  subVec,
  linspace,
  dotVec,
  crossVec,
  lengthVec,
  normalizeVec,
  unitPerpendicularTo,
  orthonormalFrame,
  orientation2D,
} from './vectors';

describe('scaleVec', () => {
  it('scales a vector by a positive scalar', () => {
    expect(scaleVec(2, [1, 0, 0])).toEqual([2, 0, 0]);
    expect(scaleVec(3, [1, 2, 3])).toEqual([3, 6, 9]);
  });

  it('scales by zero', () => {
    expect(scaleVec(0, [5, 10, 15])).toEqual([0, 0, 0]);
  });

  it('scales by negative scalar', () => {
    expect(scaleVec(-1, [1, 2, 3])).toEqual([-1, -2, -3]);
  });

  it('scales by fractional scalar', () => {
    expect(scaleVec(0.5, [4, 6, 8])).toEqual([2, 3, 4]);
  });

  it('preserves the zero vector', () => {
    expect(scaleVec(100, [0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('addVec', () => {
  it('adds two vectors', () => {
    expect(addVec([1, 0, 0], [0, 1, 0])).toEqual([1, 1, 0]);
  });

  it('adds three vectors', () => {
    expect(addVec([1, 0, 0], [0, 1, 0], [0, 0, 1])).toEqual([1, 1, 1]);
  });

  it('returns [0,0,0] for no arguments', () => {
    expect(addVec()).toEqual([0, 0, 0]);
  });

  it('identity with single vector', () => {
    expect(addVec([3, 4, 5])).toEqual([3, 4, 5]);
  });

  it('handles negative components', () => {
    expect(addVec([1, -1, 0], [-1, 1, 0])).toEqual([0, 0, 0]);
  });
});

describe('subVec', () => {
  it('subtracts two vectors', () => {
    expect(subVec([3, 5, 7], [1, 2, 3])).toEqual([2, 3, 4]);
  });

  it('a - a = zero vector', () => {
    expect(subVec([4, 5, 6], [4, 5, 6])).toEqual([0, 0, 0]);
  });

  it('a - zero = a', () => {
    expect(subVec([1, 2, 3], [0, 0, 0])).toEqual([1, 2, 3]);
  });

  it('zero - a = -a', () => {
    expect(subVec([0, 0, 0], [1, 2, 3])).toEqual([-1, -2, -3]);
  });
});

describe('linspace', () => {
  it('generates evenly spaced values', () => {
    const result = linspace(0, 10, 5);
    expect(result).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it('generates 3 points from 0 to 1', () => {
    expect(linspace(0, 1, 3)).toEqual([0, 0.5, 1]);
  });

  it('single point returns start', () => {
    expect(linspace(5, 10, 1)).toEqual([5]);
  });

  it('zero points returns empty array', () => {
    expect(linspace(0, 10, 0)).toEqual([]);
  });

  it('handles start > stop', () => {
    const result = linspace(10, 0, 3);
    expect(result).toEqual([10, 5, 0]);
  });

  it('handles negative range', () => {
    const result = linspace(-5, 5, 3);
    expect(result).toEqual([-5, 0, 5]);
  });

  it('two points returns start and stop', () => {
    expect(linspace(0, 1, 2)).toEqual([0, 1]);
  });
});

describe('dotVec', () => {
  it('orthogonal vectors → 0', () => {
    expect(dotVec([1, 0, 0], [0, 1, 0])).toBe(0);
    expect(dotVec([1, 0, 0], [0, 0, 1])).toBe(0);
  });

  it('parallel vectors → product of magnitudes', () => {
    expect(dotVec([2, 0, 0], [3, 0, 0])).toBe(6);
  });

  it('general 3D', () => {
    expect(dotVec([1, 2, 3], [4, -5, 6])).toBe(4 - 10 + 18);
  });

  it('treats missing z as 0', () => {
    expect(dotVec([1, 2], [3, 4])).toBe(11);
  });
});

describe('crossVec', () => {
  it('e_x × e_y = e_z', () => {
    expect(crossVec([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
  });
  it('e_y × e_z = e_x', () => {
    expect(crossVec([0, 1, 0], [0, 0, 1])).toEqual([1, 0, 0]);
  });
  it('e_z × e_x = e_y', () => {
    expect(crossVec([0, 0, 1], [1, 0, 0])).toEqual([0, 1, 0]);
  });
  it('parallel vectors give zero', () => {
    expect(crossVec([1, 2, 3], [2, 4, 6])).toEqual([0, 0, 0]);
  });
  it('anticommutative: a × b = −(b × a)', () => {
    const ab = crossVec([1, 2, 3], [4, 5, 6]);
    const ba = crossVec([4, 5, 6], [1, 2, 3]);
    expect(ab).toEqual([-ba[0], -ba[1], -ba[2]]);
  });
});

describe('lengthVec', () => {
  it('axis-aligned', () => {
    expect(lengthVec([3, 0, 0])).toBe(3);
  });
  it('3-4-5 triangle in XY', () => {
    expect(lengthVec([3, 4, 0])).toBe(5);
  });
  it('treats missing components as 0', () => {
    expect(lengthVec([5])).toBe(5);
  });
});

describe('normalizeVec', () => {
  it('produces unit length', () => {
    const n = normalizeVec([3, 4, 0]);
    expect(lengthVec(n)).toBeCloseTo(1, 12);
    expect(n[0]).toBeCloseTo(0.6, 12);
    expect(n[1]).toBeCloseTo(0.8, 12);
  });
  it('returns fallback for zero vector', () => {
    expect(normalizeVec([0, 0, 0])).toEqual([0, 0, 0]);
    expect(normalizeVec([0, 0, 0], [1, 0, 0])).toEqual([1, 0, 0]);
  });
});

describe('unitPerpendicularTo', () => {
  it.each([
    ['X axis', [1, 0, 0] as [number, number, number]],
    ['Y axis', [0, 1, 0] as [number, number, number]],
    ['Z axis', [0, 0, 1] as [number, number, number]],
    ['diagonal', normalizeVec([1, 1, 1])],
    ['XY diagonal', normalizeVec([1, 1, 0])],
  ])('orthogonal unit vector for %s', (_, n) => {
    const p = unitPerpendicularTo(n);
    expect(lengthVec(p)).toBeCloseTo(1, 10);
    expect(Math.abs(dotVec(p, n))).toBeLessThan(1e-10);
  });

  it.each([
    [[2, 2, 1] as [number, number, number]],
    [[10, 0, 0] as [number, number, number]],
    [[3, -4, 5] as [number, number, number]],
  ])('still orthogonal for non-unit input %j', (n) => {
    const p = unitPerpendicularTo(n);
    expect(lengthVec(p)).toBeCloseTo(1, 10);
    // Dot with original (non-unit) input must vanish — orthogonality is
    // independent of magnitude.
    expect(Math.abs(dotVec(p, n))).toBeLessThan(1e-10);
  });
});

describe('orthonormalFrame', () => {
  it.each([
    ['X axis', [1, 0, 0] as [number, number, number]],
    ['Y axis', [0, 1, 0] as [number, number, number]],
    ['Z axis', [0, 0, 1] as [number, number, number]],
    ['arbitrary', [0.3, -0.7, 0.5] as [number, number, number]],
  ])('returns a right-handed orthonormal frame for %s', (_, normal) => {
    const { u, v, n } = orthonormalFrame(normal);
    expect(lengthVec(u)).toBeCloseTo(1, 10);
    expect(lengthVec(v)).toBeCloseTo(1, 10);
    expect(lengthVec(n)).toBeCloseTo(1, 10);
    expect(Math.abs(dotVec(u, v))).toBeLessThan(1e-10);
    expect(Math.abs(dotVec(v, n))).toBeLessThan(1e-10);
    expect(Math.abs(dotVec(u, n))).toBeLessThan(1e-10);
    // u × v should equal n (right-handed)
    const uv = crossVec(u, v);
    expect(uv[0]).toBeCloseTo(n[0], 10);
    expect(uv[1]).toBeCloseTo(n[1], 10);
    expect(uv[2]).toBeCloseTo(n[2], 10);
  });

  it('no Z-axis special case — frame size and properties invariant under axis choice', () => {
    // All three world axes get a *consistent* orthonormal frame, not
    // anything specific to Z.
    const fx = orthonormalFrame([1, 0, 0]);
    const fy = orthonormalFrame([0, 1, 0]);
    const fz = orthonormalFrame([0, 0, 1]);
    expect(lengthVec(fx.u)).toBeCloseTo(1, 10);
    expect(lengthVec(fy.u)).toBeCloseTo(1, 10);
    expect(lengthVec(fz.u)).toBeCloseTo(1, 10);
  });
});

describe('orientation2D', () => {
  it('CCW turn is positive', () => {
    expect(orientation2D([0, 0], [1, 0], [1, 1])).toBeGreaterThan(0);
  });
  it('CW turn is negative', () => {
    expect(orientation2D([0, 0], [1, 0], [1, -1])).toBeLessThan(0);
  });
  it('collinear is zero', () => {
    expect(orientation2D([0, 0], [1, 1], [2, 2])).toBe(0);
  });
  it('ignores z component', () => {
    expect(orientation2D([0, 0, 5], [1, 0, -3], [1, 1, 100])).toBeGreaterThan(0);
  });
});
