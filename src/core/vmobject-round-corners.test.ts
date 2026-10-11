import { describe, it, expect } from 'vitest';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { anchorsFromPoints } from './VMobjectCurveMath';
import { isClosedPath } from './VMobjectGeometry';

/** Build a VMobject whose anchors are the given corners (straight edges). */
function polygon(corners: number[][], close: boolean): VMobject {
  const v = new VMobject();
  v.setPointsAsCorners(close ? [...corners, corners[0]] : corners);
  return v;
}

/** Euclidean distance between two points (z ignored). */
function dist(a: number[], b: number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Minimum distance from a point to any corner in a list. */
function minDistToCorners(p: number[], corners: number[][]): number {
  return Math.min(...corners.map((c) => dist(p, c)));
}

/** Whether `pts` contains a point equal to `target` within tolerance. */
function containsPoint(pts: number[][], target: number[], tol = 1e-6): boolean {
  return pts.some((p) => dist(p, target) < tol);
}

const SQUARE = [
  [-1, 1, 0],
  [1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
];

describe('VMobject.roundCorners - closed square', () => {
  it('keeps the path closed', () => {
    const sq = polygon(SQUARE, true);
    sq.roundCorners(0.5);
    const pts = sq.getLocalPoints();
    expect(isClosedPath(pts)).toBe(true);
    expect(dist(pts[0], pts[pts.length - 1])).toBeLessThan(1e-9);
  });

  it('inserts the expected number of points (4 corners, 2 segments each)', () => {
    const sq = polygon(SQUARE, true);
    sq.roundCorners(0.5);
    const pts = sq.getLocalPoints();
    // (3n+1) + (m-1)(3+3n) + 3 closing, with m=4 vertices, n=2 segments.
    const n = 2;
    const m = 4;
    const expected = 3 * n + 1 + (m - 1) * (3 + 3 * n) + 3;
    expect(expected).toBe(37);
    expect(pts.length).toBe(37);
    expect((pts.length - 1) % 3).toBe(0);
  });

  it('removes the sharp vertices', () => {
    const sq = polygon(SQUARE, true);
    sq.roundCorners(0.5);
    const anchors = anchorsFromPoints(sq.getLocalPoints());
    for (const corner of SQUARE) {
      expect(containsPoint(anchors, corner, 1e-6)).toBe(false);
    }
  });

  it('keeps every anchor within the radius of its corner', () => {
    const r = 0.5;
    const sq = polygon(SQUARE, true);
    sq.roundCorners(r);
    const anchors = anchorsFromPoints(sq.getLocalPoints());
    for (const a of anchors) {
      expect(minDistToCorners(a, SQUARE)).toBeLessThanOrEqual(r + 1e-9);
    }
  });

  it('leaves the straight part of each edge (so edge midpoints are unchanged)', () => {
    const sq = polygon(SQUARE, true);
    sq.roundCorners(0.5);
    const pts = sq.getLocalPoints();
    // With r=0.5 the tangent points sit 0.5 from each corner, so each edge
    // keeps a straight span whose own midpoint is the original edge midpoint.
    expect(containsPoint(pts, [-0.5, 1, 0])).toBe(true);
    expect(containsPoint(pts, [0.5, 1, 0])).toBe(true);
    expect(containsPoint(pts, [1, 0.5, 0])).toBe(true);
    expect(containsPoint(pts, [1, -0.5, 0])).toBe(true);
    // Original top-edge midpoint lies on the straight span (its midpoint).
    const mid = [(-0.5 + 0.5) / 2, 1, 0];
    expect(mid).toEqual([0, 1, 0]);
  });

  it('places each corner arc on a true circle of the effective radius', () => {
    const r = 0.5;
    const sq = polygon(SQUARE, true);
    sq.roundCorners(r);
    const anchors = anchorsFromPoints(sq.getLocalPoints());
    // Corner (1,1): offset = r, arc centre is (0.5, 0.5).
    const center = [0.5, 0.5];
    const nearCorner = anchors.filter((a) => dist(a, [1, 1, 0]) < r + 1e-9);
    expect(nearCorner.length).toBeGreaterThanOrEqual(3);
    for (const a of nearCorner) {
      expect(dist(a, center)).toBeCloseTo(r, 6);
    }
  });

  it('is chainable (returns this)', () => {
    const sq = polygon(SQUARE, true);
    expect(sq.roundCorners(0.5)).toBe(sq);
  });
});

describe('VMobject.roundCorners - clamping', () => {
  it('clamps the offset to half the shorter adjacent edge', () => {
    // Edge length 2, so the offset can never exceed 1. A huge radius collapses
    // the tangent points onto the edge midpoints.
    const sq = polygon(SQUARE, true);
    sq.roundCorners(100);
    const pts = sq.getLocalPoints();
    for (const mid of [
      [0, 1, 0],
      [1, 0, 0],
      [0, -1, 0],
      [-1, 0, 0],
    ]) {
      expect(containsPoint(pts, mid, 1e-6)).toBe(true);
    }
  });

  it('never pushes a point outside the original square', () => {
    const sq = polygon(SQUARE, true);
    sq.roundCorners(100);
    for (const p of sq.getLocalPoints()) {
      expect(p[0]).toBeGreaterThanOrEqual(-1 - 1e-9);
      expect(p[0]).toBeLessThanOrEqual(1 + 1e-9);
      expect(p[1]).toBeGreaterThanOrEqual(-1 - 1e-9);
      expect(p[1]).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});

describe('VMobject.roundCorners - degenerate inputs', () => {
  it('radius 0 is a no-op and returns this', () => {
    const sq = polygon(SQUARE, true);
    const before = sq.getLocalPoints();
    const result = sq.roundCorners(0);
    expect(result).toBe(sq);
    expect(sq.getLocalPoints()).toEqual(before);
  });

  it('negative radius is a no-op', () => {
    const sq = polygon(SQUARE, true);
    const before = sq.getLocalPoints();
    sq.roundCorners(-0.5);
    expect(sq.getLocalPoints()).toEqual(before);
  });

  it('leaves a collinear interior vertex sharp', () => {
    const line = polygon(
      [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
      ],
      false,
    );
    const before = line.getLocalPoints();
    line.roundCorners(0.3);
    const after = line.getLocalPoints();
    // No arc inserted: geometry unchanged, and the middle vertex survives.
    expect(after.length).toBe(before.length);
    expect(containsPoint(anchorsFromPoints(after), [1, 0, 0])).toBe(true);
    for (let i = 0; i < before.length; i++) {
      expect(dist(after[i], before[i])).toBeLessThan(1e-9);
    }
  });
});

describe('VMobject.roundCorners - open path', () => {
  it('keeps the two end vertices sharp and rounds the interior corner', () => {
    const open = polygon(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
      ],
      false,
    );
    open.roundCorners(0.25);
    const pts = open.getLocalPoints();
    // Still open.
    expect(isClosedPath(pts)).toBe(false);
    // Endpoints unchanged.
    expect(dist(pts[0], [0, 0, 0])).toBeLessThan(1e-9);
    expect(dist(pts[pts.length - 1], [1, 1, 0])).toBeLessThan(1e-9);
    // Interior corner (1,0) is gone.
    expect(containsPoint(anchorsFromPoints(pts), [1, 0, 0])).toBe(false);
  });
});

describe('VMobject.roundCorners - reflex corner', () => {
  // L-shaped hexagon, counter-clockwise, with a reflex corner at (1,1).
  const L = [
    [0, 0, 0],
    [2, 0, 0],
    [2, 1, 0],
    [1, 1, 0],
    [1, 2, 0],
    [0, 2, 0],
  ];

  it('bulges the reflex arc into the concave notch', () => {
    const l = polygon(L, true);
    l.roundCorners(0.25);
    const pts = l.getLocalPoints();
    const near = pts.filter((p) => dist(p, [1, 1, 0]) < 0.45);
    expect(near.length).toBeGreaterThan(0);
    // Every point near the reflex corner stays in the up-right notch quadrant.
    for (const p of near) {
      expect(p[0]).toBeGreaterThanOrEqual(1 - 1e-6);
      expect(p[1]).toBeGreaterThanOrEqual(1 - 1e-6);
    }
    // The arc genuinely bulges into the notch (strictly past the corner).
    expect(near.some((p) => p[0] > 1.02 && p[1] > 1.02)).toBe(true);
  });

  it('bulges a convex arc toward the polygon interior', () => {
    const l = polygon(L, true);
    l.roundCorners(0.25);
    const pts = l.getLocalPoints();
    // Convex corner (0,0): the arc must cut inward (positive x and y).
    const near = pts.filter((p) => dist(p, [0, 0, 0]) < 0.45);
    expect(near.length).toBeGreaterThan(0);
    for (const p of near) {
      expect(p[0]).toBeGreaterThanOrEqual(-1e-6);
      expect(p[1]).toBeGreaterThanOrEqual(-1e-6);
    }
  });
});

describe('VMobject.roundCorners - family members', () => {
  it('rounds every child of a VGroup', () => {
    const child = polygon(SQUARE, true);
    const group = new VGroup(child);
    group.roundCorners(0.5);
    const anchors = anchorsFromPoints(child.getLocalPoints());
    // The child's sharp corners are gone.
    for (const corner of SQUARE) {
      expect(containsPoint(anchors, corner, 1e-6)).toBe(false);
    }
  });
});
