import { describe, it, expect } from 'vitest';
import { buildEarcutFillGeometry } from './VMobjectGeometry';

function cornersToLinearBezier(corners: number[][]): number[][] {
  if (corners.length < 2) return corners.map((p) => [p[0], p[1], p[2] ?? 0]);

  const points: number[][] = [];
  for (let i = 0; i < corners.length - 1; i++) {
    const p0 = corners[i];
    const p1 = corners[i + 1];
    if (i === 0) points.push([p0[0], p0[1], p0[2] ?? 0]);

    points.push([
      p0[0] + (p1[0] - p0[0]) / 3,
      p0[1] + (p1[1] - p0[1]) / 3,
      (p0[2] ?? 0) + ((p1[2] ?? 0) - (p0[2] ?? 0)) / 3,
    ]);
    points.push([
      p0[0] + (2 * (p1[0] - p0[0])) / 3,
      p0[1] + (2 * (p1[1] - p0[1])) / 3,
      (p0[2] ?? 0) + (2 * ((p1[2] ?? 0) - (p0[2] ?? 0))) / 3,
    ]);
    points.push([p1[0], p1[1], p1[2] ?? 0]);
  }

  return points;
}

describe('buildEarcutFillGeometry plane projection regressions', () => {
  it('triangulates a square in the YZ plane (XY projection is degenerate)', () => {
    const corners = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
      [0, 0, 0],
    ];
    const points3D = cornersToLinearBezier(corners);
    const visiblePoints = points3D.map((p) => ({ x: p[0], y: p[1] }));

    const geometry = buildEarcutFillGeometry(points3D, visiblePoints);
    expect(geometry).not.toBeNull();

    const positions = geometry!.getAttribute('position').array as Float32Array;
    expect(positions.length).toBeGreaterThan(0);

    let maxAbsX = 0;
    let maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      maxAbsX = Math.max(maxAbsX, Math.abs(positions[i]));
      maxZ = Math.max(maxZ, positions[i + 2]);
    }

    expect(maxAbsX).toBeLessThan(1e-6);
    expect(maxZ).toBeGreaterThan(0.5);
  });

  it('triangulates a rotated compound shape with a hole using one shared plane basis', () => {
    const outerCorners = [
      [0, 0, 0],
      [0, 2, 0],
      [0, 2, 2],
      [0, 0, 2],
      [0, 0, 0],
    ];
    const holeCorners = [
      [0, 0.75, 0.75],
      [0, 1.25, 0.75],
      [0, 1.25, 1.25],
      [0, 0.75, 1.25],
      [0, 0.75, 0.75],
    ];

    const outer = cornersToLinearBezier(outerCorners);
    const hole = cornersToLinearBezier(holeCorners);
    const points3D = [...outer, ...hole];

    const geometry = buildEarcutFillGeometry(points3D, [], () => [outer.length, hole.length]);
    expect(geometry).not.toBeNull();

    const positions = geometry!.getAttribute('position').array as Float32Array;
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.length % 9).toBe(0);

    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      minY = Math.min(minY, positions[i + 1]);
      maxY = Math.max(maxY, positions[i + 1]);
      minZ = Math.min(minZ, positions[i + 2]);
      maxZ = Math.max(maxZ, positions[i + 2]);
    }

    // Triangulated output should span the outer ring extents in plane coordinates.
    expect(minY).toBeLessThan(0.1);
    expect(maxY).toBeGreaterThan(1.9);
    expect(minZ).toBeLessThan(0.1);
    expect(maxZ).toBeGreaterThan(1.9);
  });
});
