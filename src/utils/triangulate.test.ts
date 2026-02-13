import { describe, it, expect } from 'vitest';
import {
  triangulatePolygon,
  triangulatePolygonPositions,
  signedArea2D,
  ensureCCW,
  ensureCW,
} from './triangulate';

describe('triangulatePolygon', () => {
  it('returns empty for null/undefined input', () => {
    expect(triangulatePolygon(null as unknown as number[][])).toEqual([]);
    expect(triangulatePolygon(undefined as unknown as number[][])).toEqual([]);
  });

  it('returns empty for fewer than 3 vertices', () => {
    expect(triangulatePolygon([])).toEqual([]);
    expect(triangulatePolygon([[0, 0]])).toEqual([]);
    expect(
      triangulatePolygon([
        [0, 0],
        [1, 1],
      ]),
    ).toEqual([]);
  });

  it('triangulates a triangle (single triangle)', () => {
    const tri = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const indices = triangulatePolygon(tri);
    expect(indices.length).toBe(3); // one triangle
    // All indices should be 0, 1, or 2
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(3);
    }
  });

  it('triangulates a square into 2 triangles', () => {
    const square = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const indices = triangulatePolygon(square);
    expect(indices.length).toBe(6); // 2 triangles * 3 indices
  });

  it('triangulates a convex pentagon into 3 triangles', () => {
    const pentagon = [
      [0, 0],
      [2, 0],
      [3, 1],
      [1, 3],
      [-1, 1],
    ];
    const indices = triangulatePolygon(pentagon);
    expect(indices.length).toBe(9); // 3 triangles
  });

  it('handles concave polygon (L-shape)', () => {
    const lShape = [
      [0, 0],
      [2, 0],
      [2, 1],
      [1, 1],
      [1, 2],
      [0, 2],
    ];
    const indices = triangulatePolygon(lShape);
    expect(indices.length).toBe(12); // 4 triangles for 6-vertex polygon
    // All indices within bounds
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(6);
    }
  });

  it('uses only the first two components of 3D points', () => {
    const tri3D = [
      [0, 0, 5],
      [1, 0, 10],
      [0, 1, 15],
    ];
    const indices = triangulatePolygon(tri3D);
    expect(indices.length).toBe(3);
  });

  it('handles a polygon with a hole', () => {
    const outer = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const hole = [
      [3, 3],
      [7, 3],
      [7, 7],
      [3, 7],
    ];
    const indices = triangulatePolygon(outer, [hole]);
    // Should produce triangles; the combined vertex count is 8
    expect(indices.length).toBeGreaterThan(0);
    expect(indices.length % 3).toBe(0);
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(8);
    }
  });

  it('skips degenerate holes (fewer than 3 vertices)', () => {
    const outer = [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ];
    const degenerateHole = [[1, 1]];
    const indices = triangulatePolygon(outer, [degenerateHole]);
    // Should triangulate outer ring as if no holes
    expect(indices.length).toBe(6); // 2 triangles
  });

  it('returns indices whose length is a multiple of 3', () => {
    const hexagon = [
      [1, 0],
      [0.5, 0.87],
      [-0.5, 0.87],
      [-1, 0],
      [-0.5, -0.87],
      [0.5, -0.87],
    ];
    const indices = triangulatePolygon(hexagon);
    expect(indices.length % 3).toBe(0);
    expect(indices.length).toBe(12); // 4 triangles
  });
});

describe('triangulatePolygonPositions', () => {
  it('returns empty Float32Array for degenerate input', () => {
    const result = triangulatePolygonPositions([]);
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(0);
  });

  it('returns Float32Array with xyz triplets for a triangle', () => {
    const tri = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const positions = triangulatePolygonPositions(tri);
    expect(positions).toBeInstanceOf(Float32Array);
    expect(positions.length).toBe(9); // 1 triangle * 3 verts * 3 components
    // Check z=0 for all vertices
    expect(positions[2]).toBe(0);
    expect(positions[5]).toBe(0);
    expect(positions[8]).toBe(0);
  });

  it('applies custom z coordinate', () => {
    const tri = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const positions = triangulatePolygonPositions(tri, undefined, 5);
    // All z values should be 5
    for (let i = 2; i < positions.length; i += 3) {
      expect(positions[i]).toBe(5);
    }
  });

  it('includes hole vertices in the output positions', () => {
    const outer = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const hole = [
      [3, 3],
      [7, 3],
      [7, 7],
      [3, 7],
    ];
    const positions = triangulatePolygonPositions(outer, [hole]);
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.length % 9).toBe(0); // multiple of 9 (3 verts * 3 components)
  });

  it('returns a square triangulated into positions', () => {
    const square = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const positions = triangulatePolygonPositions(square);
    expect(positions.length).toBe(18); // 2 triangles * 3 verts * 3 components
  });
});

describe('signedArea2D', () => {
  it('returns positive area for CCW triangle', () => {
    // CCW triangle: (0,0) -> (1,0) -> (0,1)
    const ccwTriangle = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const area = signedArea2D(ccwTriangle);
    expect(area).toBeCloseTo(0.5, 10);
  });

  it('returns negative area for CW triangle', () => {
    // CW triangle: (0,0) -> (0,1) -> (1,0)
    const cwTriangle = [
      [0, 0],
      [0, 1],
      [1, 0],
    ];
    const area = signedArea2D(cwTriangle);
    expect(area).toBeCloseTo(-0.5, 10);
  });

  it('returns positive area for CCW unit square', () => {
    const ccwSquare = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const area = signedArea2D(ccwSquare);
    expect(area).toBeCloseTo(1.0, 10);
  });

  it('returns negative area for CW unit square', () => {
    const cwSquare = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    const area = signedArea2D(cwSquare);
    expect(area).toBeCloseTo(-1.0, 10);
  });

  it('returns zero for degenerate (collinear) points', () => {
    const collinear = [
      [0, 0],
      [1, 1],
      [2, 2],
    ];
    expect(signedArea2D(collinear)).toBeCloseTo(0, 10);
  });

  it('returns zero for a single point', () => {
    expect(signedArea2D([[5, 5]])).toBeCloseTo(0, 10);
  });
});

describe('ensureCCW', () => {
  it('returns the same ring if already CCW', () => {
    const ccw = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const result = ensureCCW(ccw);
    expect(result).toBe(ccw); // same reference
  });

  it('reverses a CW ring to make it CCW', () => {
    const cw = [
      [0, 0],
      [0, 1],
      [1, 0],
    ];
    const result = ensureCCW(cw);
    expect(result).not.toBe(cw);
    expect(signedArea2D(result)).toBeGreaterThanOrEqual(0);
  });
});

describe('ensureCW', () => {
  it('returns the same ring if already CW', () => {
    const cw = [
      [0, 0],
      [0, 1],
      [1, 0],
    ];
    const result = ensureCW(cw);
    expect(result).toBe(cw); // same reference
  });

  it('reverses a CCW ring to make it CW', () => {
    const ccw = [
      [0, 0],
      [1, 0],
      [0, 1],
    ];
    const result = ensureCW(ccw);
    expect(result).not.toBe(ccw);
    expect(signedArea2D(result)).toBeLessThanOrEqual(0);
  });
});
