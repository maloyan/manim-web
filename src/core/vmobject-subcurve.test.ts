import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';

function corners(pts: number[][]): VMobject {
  const v = new VMobject();
  v.setPointsAsCorners(pts);
  return v;
}

/** A unit square as a closed corner path (5 anchors, 4 cubics). */
function closedSquare(): VMobject {
  return corners([
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 0],
  ]);
}

describe('VMobject.pointwiseBecomePartial', () => {
  it('copies all points when a <= 0 and b >= 1', () => {
    const src = corners([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ]);
    const dst = new VMobject();
    dst.pointwiseBecomePartial(src, 0, 1);
    expect(dst.getLocalPoints()).toEqual(src.getLocalPoints());
  });

  it('produces a valid cubic chain (3k+1 points)', () => {
    const src = corners([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const dst = new VMobject();
    dst.pointwiseBecomePartial(src, 0.2, 0.9);
    const n = dst.getLocalPoints().length;
    expect(n).toBeGreaterThanOrEqual(4);
    expect((n - 1) % 3).toBe(0);
  });

  it('returns this for chaining', () => {
    const src = corners([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const dst = new VMobject();
    expect(dst.pointwiseBecomePartial(src, 0, 0.5)).toBe(dst);
  });
});

describe('VMobject.getSubcurve', () => {
  it('extracts the first half of a straight line', () => {
    const line = corners([
      [0, 0, 0],
      [4, 0, 0],
    ]);
    const sub = line.getSubcurve(0, 0.5);
    const pts = sub.getLocalPoints();
    expect(pts[0]).toEqual([0, 0, 0]);
    const end = pts[pts.length - 1];
    expect(end[0]).toBeCloseTo(2, 10);
    expect(end[1]).toBeCloseTo(0, 10);
  });

  it('cuts on cubic-index boundaries for an evenly segmented path', () => {
    // 4 cubics along x = 0..4; proportions 0.25 and 0.75 land on anchors.
    const path = corners([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const sub = path.getSubcurve(0.25, 0.75);
    const pts = sub.getLocalPoints();
    expect(pts[0][0]).toBeCloseTo(1, 10);
    expect(pts[pts.length - 1][0]).toBeCloseTo(3, 10);
  });

  it('preserves both endpoints of the full curve for getSubcurve(0, 1)', () => {
    const path = corners([
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 0],
    ]);
    const sub = path.getSubcurve(0, 1);
    expect(sub.getLocalPoints()).toEqual(path.getLocalPoints());
  });

  it('wraps across the seam for a closed path when a > b', () => {
    const square = closedSquare();
    const sub = square.getSubcurve(0.75, 0.25);
    const pts = sub.getLocalPoints();
    expect(pts.length).toBeGreaterThan(0);
    // Head starts at the [0.75, 1] partial; tail ends at the [0, 0.25] partial.
    const head = square.copy();
    head.pointwiseBecomePartial(square, 0.75, 1);
    expect(pts[0]).toEqual(head.getLocalPoints()[0]);
    const tail = square.copy();
    tail.pointwiseBecomePartial(square, 0, 0.25);
    const tailEnd = tail.getLocalPoints();
    expect(pts[pts.length - 1]).toEqual(tailEnd[tailEnd.length - 1]);
  });
});
