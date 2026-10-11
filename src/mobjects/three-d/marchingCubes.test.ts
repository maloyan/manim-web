import { describe, it, expect } from 'vitest';
import { marchingCubes } from './marchingCubes';

// The field whose level set f = 1 is the unit sphere x^2 + y^2 + z^2 = 1.
const sphereField = (x: number, y: number, z: number): number => x * x + y * y + z * z;

describe('marchingCubes', () => {
  it('extracts a non-empty mesh for the unit sphere', () => {
    const result = marchingCubes({
      field: sphereField,
      xRange: [-2, 2],
      yRange: [-2, 2],
      zRange: [-2, 2],
      resolution: 24,
      isoLevel: 1,
    });
    expect(result.triangleCount).toBeGreaterThan(0);
    expect(result.positions.length).toBe(result.triangleCount * 9);
  });

  it('places every vertex on the sphere radius within tolerance', () => {
    const result = marchingCubes({
      field: sphereField,
      xRange: [-2, 2],
      yRange: [-2, 2],
      zRange: [-2, 2],
      resolution: 40,
      isoLevel: 1,
    });
    const p = result.positions;
    for (let i = 0; i < p.length; i += 3) {
      const r = Math.hypot(p[i], p[i + 1], p[i + 2]);
      expect(Math.abs(r - 1)).toBeLessThan(0.15);
    }
  });

  it('is deterministic for identical input', () => {
    const opts = {
      field: sphereField,
      xRange: [-2, 2] as [number, number],
      yRange: [-2, 2] as [number, number],
      zRange: [-2, 2] as [number, number],
      resolution: 16,
      isoLevel: 1,
    };
    const a = marchingCubes(opts);
    const b = marchingCubes(opts);
    expect(a.triangleCount).toBe(b.triangleCount);
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions));
  });

  it('returns an empty mesh when the iso level is outside the field range', () => {
    const result = marchingCubes({
      field: sphereField,
      xRange: [-2, 2],
      yRange: [-2, 2],
      zRange: [-2, 2],
      resolution: 8,
      isoLevel: 1000,
    });
    expect(result.triangleCount).toBe(0);
  });

  it('scales the triangle count with resolution', () => {
    const coarse = marchingCubes({
      field: sphereField,
      xRange: [-2, 2],
      yRange: [-2, 2],
      zRange: [-2, 2],
      resolution: 8,
      isoLevel: 1,
    });
    const fine = marchingCubes({
      field: sphereField,
      xRange: [-2, 2],
      yRange: [-2, 2],
      zRange: [-2, 2],
      resolution: 24,
      isoLevel: 1,
    });
    expect(fine.triangleCount).toBeGreaterThan(coarse.triangleCount);
  });
});
