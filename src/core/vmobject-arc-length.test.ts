import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';

/** Build a VMobject whose path is straight line segments through the corners. */
function corners(pts: number[][]): VMobject {
  const v = new VMobject();
  v.setPointsAsCorners(pts);
  return v;
}

describe('VMobject.getPointFromProportion (arc-length)', () => {
  it('maps 0 and 1 to the first and last anchors', () => {
    const line = corners([
      [0, 0, 0],
      [2, 0, 0],
    ]);
    expect(line.getPointFromProportion(0)).toEqual([0, 0, 0]);
    expect(line.getPointFromProportion(1)).toEqual([2, 0, 0]);
  });

  it('proportion 0.5 is the geometric midpoint of a straight line', () => {
    const line = corners([
      [0, 0, 0],
      [2, 0, 0],
    ]);
    const mid = line.getPointFromProportion(0.5);
    expect(mid[0]).toBeCloseTo(1, 10);
    expect(mid[1]).toBeCloseTo(0, 10);
  });

  it('uses arc length, not segment index, across uneven segments', () => {
    // Two collinear segments of length 1 and 4 (total 5); midpoint is at x=2.5.
    const path = corners([
      [0, 0, 0],
      [1, 0, 0],
      [5, 0, 0],
    ]);
    const mid = path.getPointFromProportion(0.5);
    expect(mid[0]).toBeCloseTo(2.5, 6);
  });

  it('is monotonic in x along a left-to-right path', () => {
    const path = corners([
      [0, 0, 0],
      [1, 2, 0],
      [3, -1, 0],
      [5, 0, 0],
    ]);
    let prevX = -Infinity;
    for (let a = 0; a <= 1.0001; a += 0.1) {
      const x = path.getPointFromProportion(Math.min(a, 1))[0];
      expect(x).toBeGreaterThanOrEqual(prevX - 1e-9);
      prevX = x;
    }
  });

  it('throws when the VMobject has no points', () => {
    const empty = new VMobject();
    expect(() => empty.getPointFromProportion(0.5)).toThrow();
  });
});

describe('VMobject.proportionFromPoint', () => {
  it('returns 0.5 for the midpoint of a straight line', () => {
    const line = corners([
      [0, 0, 0],
      [4, 0, 0],
    ]);
    expect(line.proportionFromPoint([2, 0, 0])).toBeCloseTo(0.5, 6);
  });

  it('round-trips with getPointFromProportion for on-curve points', () => {
    const path = corners([
      [0, 0, 0],
      [2, 1, 0],
      [4, 0, 0],
    ]);
    for (const alpha of [0.2, 0.5, 0.8]) {
      const pt = path.getPointFromProportion(alpha);
      const recovered = path.proportionFromPoint(pt);
      expect(recovered).toBeCloseTo(alpha, 1);
    }
  });

  it('is monotonic as the query point advances along the line', () => {
    const line = corners([
      [0, 0, 0],
      [10, 0, 0],
    ]);
    let prev = -Infinity;
    for (let x = 0; x <= 10; x += 1) {
      const p = line.proportionFromPoint([x, 0, 0]);
      expect(p).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = p;
    }
  });
});
