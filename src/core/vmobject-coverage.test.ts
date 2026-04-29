/**
 * Additional VMobject coverage tests.
 *
 * Targets testable pure-computation methods and edge cases not covered
 * by core.test.ts and core-extra.test.ts, bringing VMobject.ts coverage
 * above 54%.
 *
 * Focus: setPoints variants, _pointsToShape, _pointsToCurvePath,
 * _buildEarcutFillGeometry, _isNearlyLinear, _sampleBezierOutline,
 * _pointInPolygon, _createCopy, _interpolatePointList3D edge cases,
 * visiblePointCount clamping, and shaderCurves getter/setter.
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { VMobject, Point } from './VMobject';
import { curvesAsSubmobjects, CurvesAsSubmobjects } from './VMobjectCurveUtils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a square VMobject using setPointsAsCorners (closed path) */
function makeSquare(): VMobject {
  const v = new VMobject();
  v.setPointsAsCorners([
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 0], // close
  ]);
  return v;
}

/** Create a simple single-segment bezier VMobject */
function makeSimpleBezier(): VMobject {
  const v = new VMobject();
  v.setPoints([
    [0, 0, 0],
    [0.33, 0.5, 0],
    [0.67, 0.5, 0],
    [1, 0, 0],
  ]);
  return v;
}

/** Create a multi-segment bezier VMobject (2 segments = 7 points) */
function makeMultiSegmentBezier(): VMobject {
  const v = new VMobject();
  v.setPoints([
    [-2, 0, 0],
    [-1.5, 1, 0],
    [-0.5, 1, 0],
    [0, 0, 0],
    [0.5, -1, 0],
    [1.5, -1, 0],
    [2, 0, 0],
  ]);
  return v;
}

// ===========================================================================
// setPoints with Point[] (2D objects)
// ===========================================================================

describe('VMobject.setPoints with Point[] (2D format)', () => {
  it('converts Point[] to internal 3D representation', () => {
    const v = new VMobject();
    const pts: Point[] = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
      { x: 7, y: 8 },
    ];
    v.setPoints(pts);

    const result = v.getPoints();
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual([1, 2, 0]);
    expect(result[3]).toEqual([7, 8, 0]);
  });

  it('handles empty Point array', () => {
    const v = new VMobject();
    v.setPoints([] as Point[]);
    expect(v.getPoints()).toHaveLength(0);
    expect(v.numPoints).toBe(0);
  });
});

// ===========================================================================
// visiblePointCount edge cases
// ===========================================================================

describe('VMobject.visiblePointCount clamping', () => {
  it('clamps to 0 when set to negative', () => {
    const v = makeSimpleBezier();
    v.visiblePointCount = -5;
    expect(v.visiblePointCount).toBe(0);
  });

  it('clamps to numPoints when set beyond total', () => {
    const v = makeSimpleBezier();
    v.visiblePointCount = 100;
    expect(v.visiblePointCount).toBe(4);
  });

  it('returns numPoints when _visiblePointCount is null', () => {
    const v = makeSimpleBezier();
    // Before any assignment, should return all points
    expect(v.visiblePointCount).toBe(4);
  });

  it('getVisiblePoints returns subset', () => {
    const v = makeSimpleBezier();
    v.visiblePointCount = 2;
    expect(v.getVisiblePoints()).toHaveLength(2);
    expect(v.getVisiblePoints3D()).toHaveLength(2);
  });
});

// ===========================================================================
// _pointsToShape (via _buildEarcutFillGeometry or indirectly)
// ===========================================================================

describe('VMobject._pointsToShape (protected, tested via getThreeObject)', () => {
  it('produces a THREE.Shape from Bezier points', () => {
    const v = makeSquare();
    // Access the protected method by casting
    const shape = (v as any)._pointsToShape() as THREE.Shape;
    expect(shape).toBeInstanceOf(THREE.Shape);
    // Should have curves (the bezier segments)
    expect(shape.curves.length).toBeGreaterThan(0);
  });

  it('returns empty shape for no points', () => {
    const v = new VMobject();
    const shape = (v as any)._pointsToShape() as THREE.Shape;
    expect(shape).toBeInstanceOf(THREE.Shape);
    expect(shape.curves.length).toBe(0);
  });

  it('handles remaining points that do not form full bezier segments', () => {
    const v = new VMobject();
    // 6 points: 1 full bezier (4 pts) + 2 extra
    v.setPoints([
      [0, 0, 0],
      [0.33, 0.5, 0],
      [0.67, 0.5, 0],
      [1, 0, 0],
      [1.5, 0.5, 0],
      [2, 0, 0],
    ]);
    const shape = (v as any)._pointsToShape() as THREE.Shape;
    // Should have 1 bezierCurve + 2 lineTo for remaining points
    expect(shape.curves.length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// _pointsToCurvePath
// ===========================================================================

describe('VMobject._pointsToCurvePath', () => {
  it('produces a CurvePath from Bezier points', () => {
    const v = makeMultiSegmentBezier();
    const curvePath = (v as any)._pointsToCurvePath() as THREE.CurvePath<THREE.Vector3>;
    expect(curvePath.curves.length).toBe(2); // 2 cubic bezier segments
  });

  it('returns empty CurvePath for fewer than 2 points', () => {
    const v = new VMobject();
    v.setPoints([[0, 0, 0]]);
    const curvePath = (v as any)._pointsToCurvePath() as THREE.CurvePath<THREE.Vector3>;
    expect(curvePath.curves.length).toBe(0);
  });

  it('handles remaining points as LineCurve3', () => {
    const v = new VMobject();
    // 5 points: 1 full bezier (4 pts) + 1 extra creates a LineCurve3
    v.setPoints([
      [0, 0, 0],
      [0.33, 0.5, 0],
      [0.67, 0.5, 0],
      [1, 0, 0],
      [2, 0, 0],
    ]);
    const curvePath = (v as any)._pointsToCurvePath() as THREE.CurvePath<THREE.Vector3>;
    // 1 CubicBezierCurve3 + 1 LineCurve3
    expect(curvePath.curves.length).toBe(2);
  });
});

// ===========================================================================
// _isNearlyLinear (static private)
// ===========================================================================

describe('VMobject._isNearlyLinear', () => {
  it('returns true for a perfectly linear segment', () => {
    const p0 = [0, 0, 0];
    const p1 = [1 / 3, 0, 0]; // on chord
    const p2 = [2 / 3, 0, 0]; // on chord
    const p3 = [1, 0, 0];
    expect((VMobject as any)._isNearlyLinear(p0, p1, p2, p3)).toBe(true);
  });

  it('returns false for a curved segment', () => {
    const p0 = [0, 0, 0];
    const p1 = [0.33, 1, 0]; // far from chord
    const p2 = [0.67, 1, 0]; // far from chord
    const p3 = [1, 0, 0];
    expect((VMobject as any)._isNearlyLinear(p0, p1, p2, p3)).toBe(false);
  });

  it('returns true for degenerate segment (all points at same position)', () => {
    const p = [5, 5, 0];
    expect((VMobject as any)._isNearlyLinear(p, p, p, p)).toBe(true);
  });

  it('returns true when handles are very close to chord', () => {
    const p0 = [0, 0, 0];
    const p1 = [1 / 3, 0.005, 0]; // slightly off chord
    const p2 = [2 / 3, -0.005, 0]; // slightly off chord
    const p3 = [1, 0, 0];
    expect((VMobject as any)._isNearlyLinear(p0, p1, p2, p3)).toBe(true);
  });

  it('returns false for a curved segment in the XZ plane (regression)', () => {
    // Bezier handles bulge in +Z rather than +Y — must not be treated as linear.
    const p0 = [0, 0, 0];
    const p1 = [0.33, 0, 1];
    const p2 = [0.67, 0, 1];
    const p3 = [1, 0, 0];
    expect((VMobject as any)._isNearlyLinear(p0, p1, p2, p3)).toBe(false);
  });

  it('returns false for a curved segment in the YZ plane', () => {
    const p0 = [0, 0, 0];
    const p1 = [0, 0.33, 1];
    const p2 = [0, 0.67, 1];
    const p3 = [0, 1, 0];
    expect((VMobject as any)._isNearlyLinear(p0, p1, p2, p3)).toBe(false);
  });
});

// ===========================================================================
// _pointInPolygon (static private)
// ===========================================================================

describe('VMobject._pointInPolygon', () => {
  // Unit square corners
  const square = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];

  it('returns true for point inside polygon', () => {
    expect((VMobject as any)._pointInPolygon([0.5, 0.5], square)).toBe(true);
  });

  it('returns false for point outside polygon', () => {
    expect((VMobject as any)._pointInPolygon([2, 2], square)).toBe(false);
  });

  it('returns false for point far outside', () => {
    expect((VMobject as any)._pointInPolygon([-1, -1], square)).toBe(false);
  });

  it('works with triangle', () => {
    const triangle = [
      [0, 0],
      [2, 0],
      [1, 2],
    ];
    expect((VMobject as any)._pointInPolygon([1, 0.5], triangle)).toBe(true);
    expect((VMobject as any)._pointInPolygon([0, 2], triangle)).toBe(false);
  });
});

// ===========================================================================
// _sampleBezierOutline (private)
// ===========================================================================

describe('VMobject._sampleBezierOutline', () => {
  it('samples a curved segment with multiple points', () => {
    const v = makeSimpleBezier();
    const pts = v.getPoints();
    const outline = (v as any)._sampleBezierOutline(pts, 8) as number[][];
    // Should have multiple sampled points
    expect(outline.length).toBeGreaterThan(2);
    // First point should be start
    expect(outline[0][0]).toBeCloseTo(0);
    expect(outline[0][1]).toBeCloseTo(0);
  });

  it('samples a linear segment with fewer points (adaptive)', () => {
    const v = new VMobject();
    // Perfectly linear segment
    v.setPoints([
      [0, 0, 0],
      [1 / 3, 0, 0],
      [2 / 3, 0, 0],
      [1, 0, 0],
    ]);
    const pts = v.getPoints();
    const outline = (v as any)._sampleBezierOutline(pts, 8) as number[][];
    // Linear segment should use only 2 samples (start + end)
    expect(outline.length).toBe(2);
  });

  it('handles fallback for non-bezier points', () => {
    const v = new VMobject();
    // Only 2 points, not enough for a full bezier segment
    v.setPoints([
      [0, 0, 0],
      [1, 1, 0],
    ]);
    const pts = v.getPoints();
    const outline = (v as any)._sampleBezierOutline(pts, 8) as number[][];
    // Should use fallback: just return the input points as [x, y]
    expect(outline.length).toBe(2);
  });

  it('removes closing duplicate when first == last', () => {
    const v = new VMobject();
    // Closed bezier: last point == first point
    v.setPointsAsCorners([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 0, 0], // closes back to start
    ]);
    const pts = v.getPoints();
    const outline = (v as any)._sampleBezierOutline(pts, 8) as number[][];
    // Last point should NOT be a duplicate of first
    const first = outline[0];
    const last = outline[outline.length - 1];
    const dx = Math.abs(first[0] - last[0]);
    const dy = Math.abs(first[1] - last[1]);
    expect(dx > 1e-8 || dy > 1e-8).toBe(true);
  });
});

// ===========================================================================
// _buildEarcutFillGeometry
// ===========================================================================

describe('VMobject._buildEarcutFillGeometry', () => {
  it('returns BufferGeometry for a valid polygon', () => {
    const v = makeSquare();
    const pts3D = v.getPoints();
    const geom = (v as any)._buildEarcutFillGeometry(pts3D);
    expect(geom).not.toBeNull();
    expect(geom).toBeInstanceOf(THREE.BufferGeometry);
  });

  it('returns null for too few points', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    const pts3D = v.getPoints();
    const geom = (v as any)._buildEarcutFillGeometry(pts3D);
    // Not enough points for triangulation
    expect(geom).toBeNull();
  });
});

// ===========================================================================
// _sampleBezierPath (private)
// ===========================================================================

describe('VMobject._sampleBezierPath', () => {
  it('returns sampled points for valid bezier', () => {
    const v = makeMultiSegmentBezier();
    const pts = v.getPoints();
    const sampled = (v as any)._sampleBezierPath(pts, 4) as number[][];
    expect(sampled.length).toBeGreaterThan(2);
    // First point should match first anchor
    expect(sampled[0][0]).toBeCloseTo(-2);
    expect(sampled[0][1]).toBeCloseTo(0);
  });

  it('returns input points for non-bezier format', () => {
    const v = new VMobject();
    // Only 2 points
    v.setPoints([
      [0, 0, 0],
      [1, 1, 0],
    ]);
    const pts = v.getPoints();
    const sampled = (v as any)._sampleBezierPath(pts, 4) as number[][];
    // Fallback: just returns input points
    expect(sampled).toEqual(pts);
  });

  it('uses adaptive sampling (linear segments get fewer samples)', () => {
    const v = new VMobject();
    // Linear segment + curved segment
    v.setPoints([
      [0, 0, 0],
      [1 / 3, 0, 0], // linear handles
      [2 / 3, 0, 0],
      [1, 0, 0],
      [1.33, 1, 0], // curved handles
      [1.67, 1, 0],
      [2, 0, 0],
    ]);
    const pts = v.getPoints();
    const sampled = (v as any)._sampleBezierPath(pts, 8) as number[][];
    // Linear part should produce 2 points, curved part should produce ~9 points
    expect(sampled.length).toBeGreaterThan(3);
  });
});

// ===========================================================================
// _isClosedPath (private)
// ===========================================================================

describe('VMobject._isClosedPath', () => {
  it('returns true for closed path', () => {
    const v = makeSquare();
    const pts = v.getPoints();
    expect((v as any)._isClosedPath(pts)).toBe(true);
  });

  it('returns false for open path', () => {
    const v = makeSimpleBezier();
    const pts = v.getPoints();
    expect((v as any)._isClosedPath(pts)).toBe(false);
  });

  it('returns false for fewer than 4 points', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ]);
    const pts = v.getPoints();
    expect((v as any)._isClosedPath(pts)).toBe(false);
  });
});

// ===========================================================================
// _createCopy
// ===========================================================================

describe('VMobject._createCopy', () => {
  it('produces a deep copy of points', () => {
    const v = makeSimpleBezier();
    const copy = (v as any)._createCopy() as VMobject;
    expect(copy).toBeInstanceOf(VMobject);
    expect(copy.getPoints()).toEqual(v.getPoints());
    // Verify deep copy (modifying copy shouldn't affect original)
    copy.getPoints()[0][0] = 999;
    expect(v.getPoints()[0][0]).toBe(0);
  });

  it('copies visiblePointCount', () => {
    const v = makeSimpleBezier();
    v.visiblePointCount = 2;
    const copy = (v as any)._createCopy() as VMobject;
    expect(copy.visiblePointCount).toBe(2);
  });
});

// ===========================================================================
// _interpolatePointList3D edge cases
// ===========================================================================

describe('VMobject._interpolatePointList3D edge cases', () => {
  it('returns array of [0,0,0] for empty input', () => {
    const v = new VMobject();
    const result = (v as any)._interpolatePointList3D([], 5) as number[][];
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual([0, 0, 0]);
    expect(result[4]).toEqual([0, 0, 0]);
  });

  it('returns copy when count matches', () => {
    const v = new VMobject();
    const pts = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const result = (v as any)._interpolatePointList3D(pts, 2) as number[][];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([1, 2, 3]);
    expect(result[1]).toEqual([4, 5, 6]);
    // Should be a copy
    result[0][0] = 999;
    expect(pts[0][0]).toBe(1);
  });

  it('repeats single point to fill target count', () => {
    const v = new VMobject();
    const result = (v as any)._interpolatePointList3D([[5, 5, 5]], 4) as number[][];
    expect(result).toHaveLength(4);
    for (const p of result) {
      expect(p).toEqual([5, 5, 5]);
    }
  });

  it('handles upsampling from 2 points to 5', () => {
    const v = new VMobject();
    const pts = [
      [0, 0, 0],
      [4, 4, 0],
    ];
    const result = (v as any)._interpolatePointList3D(pts, 5) as number[][];
    expect(result).toHaveLength(5);
    // First should be [0,0,0]
    expect(result[0][0]).toBeCloseTo(0);
    expect(result[0][1]).toBeCloseTo(0);
    // Last should be [4,4,0]
    expect(result[4][0]).toBeCloseTo(4);
    expect(result[4][1]).toBeCloseTo(4);
    // Midpoint should be [2,2,0]
    expect(result[2][0]).toBeCloseTo(2);
    expect(result[2][1]).toBeCloseTo(2);
  });
});

// ===========================================================================
// setPoints3D alias
// ===========================================================================

describe('VMobject.setPoints3D', () => {
  it('is equivalent to setPoints with number[][]', () => {
    const v1 = new VMobject();
    const v2 = new VMobject();
    const pts = [
      [0, 0, 0],
      [1, 1, 1],
      [2, 2, 2],
      [3, 3, 3],
    ];
    v1.setPoints(pts);
    v2.setPoints3D(pts);
    expect(v1.getPoints()).toEqual(v2.getPoints());
  });
});

// ===========================================================================
// points getter (2D Point[] from 3D storage)
// ===========================================================================

describe('VMobject.points getter', () => {
  it('returns 2D Point objects', () => {
    const v = new VMobject();
    v.setPoints([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const pts = v.points;
    expect(pts).toHaveLength(2);
    expect(pts[0]).toEqual({ x: 1, y: 2 });
    expect(pts[1]).toEqual({ x: 4, y: 5 });
  });

  it('returns empty array for no points', () => {
    const v = new VMobject();
    expect(v.points).toEqual([]);
  });
});

// ===========================================================================
// addPoints
// ===========================================================================

describe('VMobject.addPoints', () => {
  it('appends Point objects to existing points', () => {
    const v = new VMobject();
    v.setPoints([[0, 0, 0]]);
    v.addPoints({ x: 1, y: 2 }, { x: 3, y: 4 });
    expect(v.numPoints).toBe(3);
    const pts = v.getPoints();
    expect(pts[1]).toEqual([1, 2, 0]);
    expect(pts[2]).toEqual([3, 4, 0]);
  });
});

// ===========================================================================
// getVisiblePoints / getVisiblePoints3D
// ===========================================================================

describe('VMobject visible points', () => {
  it('getVisiblePoints returns subset as Point[]', () => {
    const v = makeSimpleBezier();
    v.visiblePointCount = 2;
    const visible = v.getVisiblePoints();
    expect(visible).toHaveLength(2);
    expect(visible[0]).toEqual({ x: 0, y: 0 });
  });

  it('getVisiblePoints3D returns deep copies', () => {
    const v = makeSimpleBezier();
    const vis = v.getVisiblePoints3D();
    vis[0][0] = 999;
    // Original should be unchanged
    expect(v.getVisiblePoints3D()[0][0]).toBe(0);
  });
});

// ===========================================================================
// _toLinewidth
// ===========================================================================

describe('VMobject._toLinewidth', () => {
  it('calculates pixel linewidth from strokeWidth', () => {
    // With default _rendererWidth=800, _frameWidth=14
    const lw = VMobject._toLinewidth(4);
    // 4 * 0.01 * (800/14) = 4 * 0.01 * 57.14... = 2.2857...
    expect(lw).toBeCloseTo(4 * 0.01 * (800 / 14), 2);
  });

  it('returns 0 for zero strokeWidth', () => {
    expect(VMobject._toLinewidth(0)).toBe(0);
  });
});

// ===========================================================================
// curvesAsSubmobjects function
// ===========================================================================

describe('curvesAsSubmobjects function', () => {
  it('splits a VMobject into curve children', () => {
    const v = makeMultiSegmentBezier();
    const parent = curvesAsSubmobjects(v);
    expect(parent).toBeInstanceOf(VMobject);
    expect(parent.children.length).toBe(2); // 2 segments
    expect(parent.fillOpacity).toBe(0);
  });

  it('copies transform properties', () => {
    const v = makeSimpleBezier();
    v.position.set(1, 2, 3);
    v.scaleVector.set(2, 2, 2);
    const parent = curvesAsSubmobjects(v);
    expect(parent.position.x).toBe(1);
    expect(parent.position.y).toBe(2);
    expect(parent.scaleVector.x).toBe(2);
  });

  it('returns empty parent for VMobject with no curves', () => {
    const v = new VMobject();
    const parent = curvesAsSubmobjects(v);
    expect(parent.children.length).toBe(0);
  });
});

// ===========================================================================
// CurvesAsSubmobjects class extended
// ===========================================================================

describe('CurvesAsSubmobjects iteration', () => {
  it('supports Symbol.iterator', () => {
    const v = makeMultiSegmentBezier();
    const cas = new CurvesAsSubmobjects(v);
    const curves: VMobject[] = [];
    for (const curve of cas) {
      curves.push(curve);
    }
    expect(curves.length).toBe(2);
  });

  it('supports forEach', () => {
    const v = makeMultiSegmentBezier();
    const cas = new CurvesAsSubmobjects(v);
    const indices: number[] = [];
    cas.forEach((_, i) => indices.push(i));
    expect(indices).toEqual([0, 1]);
  });

  it('supports map', () => {
    const v = makeMultiSegmentBezier();
    const cas = new CurvesAsSubmobjects(v);
    const numPts = cas.map((c) => c.numPoints);
    expect(numPts).toEqual([4, 4]);
  });

  it('getCurve throws for out-of-range index', () => {
    const v = makeSimpleBezier();
    const cas = new CurvesAsSubmobjects(v);
    expect(() => cas.getCurve(-1)).toThrow();
    expect(() => cas.getCurve(10)).toThrow();
  });

  it('setFromVMobject clears existing children', () => {
    const v1 = makeSimpleBezier();
    const v2 = makeMultiSegmentBezier();
    const cas = new CurvesAsSubmobjects(v1);
    expect(cas.numCurves).toBe(1);
    cas.setFromVMobject(v2);
    expect(cas.numCurves).toBe(2);
  });
});

// ===========================================================================
// getUnitVector edge cases
// ===========================================================================

describe('VMobject.getUnitVector', () => {
  it('returns [1,0,0] for empty VMobject', () => {
    const v = new VMobject();
    expect(v.getUnitVector()).toEqual([1, 0, 0]);
  });

  it('returns [1,0,0] for degenerate (same start/end)', () => {
    const v = new VMobject();
    v.setPoints([
      [5, 5, 0],
      [5, 5, 0],
      [5, 5, 0],
      [5, 5, 0],
    ]);
    expect(v.getUnitVector()).toEqual([1, 0, 0]);
  });

  it('returns correct direction for vertical line', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [0, 0.33, 0],
      [0, 0.67, 0],
      [0, 1, 0],
    ]);
    const uv = v.getUnitVector();
    expect(uv[0]).toBeCloseTo(0);
    expect(uv[1]).toBeCloseTo(1);
    expect(uv[2]).toBeCloseTo(0);
  });
});

// ===========================================================================
// getCenter
// ===========================================================================

describe('VMobject.getCenter', () => {
  it('returns position for empty VMobject', () => {
    const v = new VMobject();
    v.position.set(5, 6, 7);
    expect(v.getCenter()).toEqual([5, 6, 7]);
  });

  it('returns bounding box center offset by position', () => {
    const v = new VMobject();
    v.setPoints([
      [0, 0, 0],
      [2, 0, 0],
      [2, 2, 0],
      [0, 2, 0],
    ]);
    v.position.set(0, 0, 0);
    const center = v.getCenter();
    expect(center[0]).toBeCloseTo(1);
    expect(center[1]).toBeCloseTo(1);
    expect(center[2]).toBeCloseTo(0);
  });
});

// ===========================================================================
// shaderCurves property
// ===========================================================================

describe('VMobject.shaderCurves', () => {
  it('defaults to class-level useShaderCurves', () => {
    const orig = VMobject.useShaderCurves;
    const v = new VMobject();
    expect(v.shaderCurves).toBe(orig);
    VMobject.useShaderCurves = orig; // restore
  });

  it('per-instance override takes precedence', () => {
    const v = new VMobject();
    v.shaderCurves = true;
    expect(v.shaderCurves).toBe(true);
  });

  it('null reverts to class-level default', () => {
    const v = new VMobject();
    v.shaderCurves = true;
    expect(v.shaderCurves).toBe(true);
    v.shaderCurves = null;
    expect(v.shaderCurves).toBe(VMobject.useShaderCurves);
  });
});

// ===========================================================================
// dispose
// ===========================================================================

describe('VMobject.dispose', () => {
  it('cleans up without error on fresh VMobject', () => {
    const v = new VMobject();
    expect(() => v.dispose()).not.toThrow();
  });

  it('cleans up after setting points', () => {
    const v = makeSquare();
    expect(() => v.dispose()).not.toThrow();
  });
});

// ===========================================================================
// interpolate with different point counts (triggers alignPoints)
// ===========================================================================

describe('VMobject.interpolate with alignment', () => {
  it('aligns and interpolates when point counts differ', () => {
    const v1 = new VMobject();
    v1.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ]);
    const v2 = new VMobject();
    v2.setPoints([
      [0, 0, 0],
      [1, 1, 0],
      [2, 1, 0],
      [3, 0, 0],
      [4, -1, 0],
      [5, -1, 0],
      [6, 0, 0],
    ]);

    // This should trigger alignPoints internally
    v1.interpolate(v2, 0.5);
    // After interpolation, points should be somewhere between v1 and v2
    expect(v1.numPoints).toBe(v2.numPoints);
  });
});

// ===========================================================================
// setPointsAsCorners edge cases
// ===========================================================================

describe('VMobject.setPointsAsCorners', () => {
  it('handles 3D corners correctly', () => {
    const v = new VMobject();
    v.setPointsAsCorners([
      [0, 0, 0],
      [3, 0, 6],
    ]);
    const pts = v.getPoints();
    expect(pts).toHaveLength(4); // anchor + 2 handles + anchor
    // Check z interpolation
    expect(pts[1][2]).toBeCloseTo(2); // 1/3 of 6
    expect(pts[2][2]).toBeCloseTo(4); // 2/3 of 6
    expect(pts[3][2]).toBeCloseTo(6);
  });
});

// ===========================================================================
// _createThreeObject and _syncMaterialToThree (via getThreeObject)
// ===========================================================================

describe('VMobject THREE.js integration', () => {
  it('getThreeObject creates a THREE.Group', () => {
    const v = makeSimpleBezier();
    const obj = v.getThreeObject();
    expect(obj).toBeInstanceOf(THREE.Group);
  });

  it('getThreeObject for empty VMobject still returns Group', () => {
    const v = new VMobject();
    const obj = v.getThreeObject();
    expect(obj).toBeInstanceOf(THREE.Group);
  });
});

// ===========================================================================
// constructor
// ===========================================================================

describe('VMobject constructor', () => {
  it('initializes with default fill and stroke opacity', () => {
    const v = new VMobject();
    expect(v.fillOpacity).toBe(0.5);
    expect((v as any)._style.fillOpacity).toBe(0.5);
    expect((v as any)._style.strokeOpacity).toBe(1);
  });
});

// ===========================================================================
// setVisiblePointCount / getVisiblePointCount
// ===========================================================================

describe('VMobject.setVisiblePointCount / getVisiblePointCount', () => {
  it('setVisiblePointCount sets the count and marks geometry dirty', () => {
    const v = makeSimpleBezier();
    (v as any)._geometryDirty = false;
    v.setVisiblePointCount(2);
    expect((v as any)._visiblePointCount).toBe(2);
    expect((v as any)._geometryDirty).toBe(true);
  });

  it('setVisiblePointCount with null shows all points', () => {
    const v = makeSimpleBezier();
    v.setVisiblePointCount(2);
    v.setVisiblePointCount(null);
    expect(v.getVisiblePointCount()).toBeNull();
  });

  it('getVisiblePointCount returns null by default', () => {
    const v = new VMobject();
    expect(v.getVisiblePointCount()).toBeNull();
  });

  it('getVisiblePointCount returns the set value', () => {
    const v = makeSimpleBezier();
    v.setVisiblePointCount(3);
    expect(v.getVisiblePointCount()).toBe(3);
  });
});

// ===========================================================================
// markGeometryDirty
// ===========================================================================

describe('VMobject.markGeometryDirty', () => {
  it('sets _geometryDirty to true', () => {
    const v = new VMobject();
    (v as any)._geometryDirty = false;
    v.markGeometryDirty();
    expect((v as any)._geometryDirty).toBe(true);
  });

  it('can be called multiple times without error', () => {
    const v = makeSimpleBezier();
    v.markGeometryDirty();
    v.markGeometryDirty();
    expect((v as any)._geometryDirty).toBe(true);
  });
});
