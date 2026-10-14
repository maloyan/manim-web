/**
 * Tests for DensitySurface, the isosurface of a scalar density grid.
 *
 * Marching cubes produces a vertex soup that cannot be asserted exactly, so the
 * tests check the dims/length validation, the sampled world bounds, the default
 * iso value, the trilinear sampler (exact at voxel centers, interpolated
 * between), that a central blob yields a non-empty surface, and that copy
 * preserves the grid and parameters.
 */
import { describe, it, expect } from 'vitest';
import { DensitySurface, type DensityGrid } from './DensitySurface';
import { ImplicitSurface } from '../three-d/ImplicitSurface';

/** A 2x2x2 grid with distinct values, for sampler tests. Index = x + 2*(y + 2*z). */
const TINY_GRID: DensityGrid = {
  values: [0, 10, 0, 0, 0, 0, 0, 0], // only voxel (1,0,0) is 10
  dims: [2, 2, 2],
};

/** Build an nx*ny*nz gaussian blob centered on the grid. */
function blobGrid(n: number): DensityGrid {
  const values: number[] = [];
  const c = (n - 1) / 2;
  for (let z = 0; z < n; z++) {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const d2 = (x - c) ** 2 + (y - c) ** 2 + (z - c) ** 2;
        values.push(Math.exp(-d2 / 2));
      }
    }
  }
  return { values, dims: [n, n, n] };
}

describe('DensitySurface', () => {
  it('throws when values.length does not match nx*ny*nz', () => {
    expect(
      () => new DensitySurface({ grid: { values: [1, 2, 3, 4, 5, 6, 7], dims: [2, 2, 2] } }),
    ).toThrow(/length/i);
  });

  it('throws when a dimension is not a positive integer', () => {
    expect(() => new DensitySurface({ grid: { values: [], dims: [0, 1, 1] } })).toThrow(/dim/i);
    expect(() => new DensitySurface({ grid: { values: [1, 2], dims: [2.5, 1, 1] } })).toThrow(
      /dim/i,
    );
  });

  it('adds one ImplicitSurface to the group', () => {
    const surface = new DensitySurface({ grid: blobGrid(5) });
    expect(surface.surface).toBeInstanceOf(ImplicitSurface);
    const implicitChildren = surface.children.filter((c) => c instanceof ImplicitSurface);
    expect(implicitChildren).toHaveLength(1);
  });

  it('bounds span origin to origin + dims * spacing', () => {
    const origin: [number, number, number] = [1, 2, 3];
    const spacing: [number, number, number] = [2, 0.5, 1];
    const dims: [number, number, number] = [4, 6, 8];
    const values = new Array(4 * 6 * 8).fill(0);
    const surface = new DensitySurface({ grid: { values, dims, origin, spacing } });
    const { min, max } = surface.getBounds();
    expect(min.x).toBeCloseTo(1, 6);
    expect(min.y).toBeCloseTo(2, 6);
    expect(min.z).toBeCloseTo(3, 6);
    expect(max.x).toBeCloseTo(1 + 4 * 2, 6);
    expect(max.y).toBeCloseTo(2 + 6 * 0.5, 6);
    expect(max.z).toBeCloseTo(3 + 8 * 1, 6);
  });

  it('defaults iso value to half the peak density', () => {
    const values = [0, 1, 2, 4, 0, 0, 0, 0]; // max is 4
    const surface = new DensitySurface({ grid: { values, dims: [2, 2, 2] } });
    expect(surface.getIsoValue()).toBeCloseTo(2, 6);
  });

  it('uses an explicit iso value when given', () => {
    const surface = new DensitySurface({ grid: blobGrid(5), isoValue: 0.3 });
    expect(surface.getIsoValue()).toBeCloseTo(0.3, 6);
    expect(surface.surface.getIsoLevel()).toBeCloseTo(0.3, 6);
  });

  it('samples the exact grid value at each voxel center', () => {
    const surface = new DensitySurface({ grid: TINY_GRID });
    // Cell-centered: voxel (i,j,k) center is at origin + (i+0.5)*spacing.
    expect(surface.sample(0.5, 0.5, 0.5)).toBeCloseTo(0, 6); // voxel (0,0,0)
    expect(surface.sample(1.5, 0.5, 0.5)).toBeCloseTo(10, 6); // voxel (1,0,0)
  });

  it('trilinearly interpolates between voxel centers', () => {
    const surface = new DensitySurface({ grid: TINY_GRID });
    // Halfway in x between voxel (0,0,0)=0 and voxel (1,0,0)=10 -> 5.
    expect(surface.sample(1.0, 0.5, 0.5)).toBeCloseTo(5, 6);
    // A quarter of the way -> 2.5.
    expect(surface.sample(0.75, 0.5, 0.5)).toBeCloseTo(2.5, 6);
  });

  it('returns a low (background) value outside the voxel lattice', () => {
    const surface = new DensitySurface({ grid: TINY_GRID });
    // The grid minimum is 0; outside the lattice the sampler returns it, so the
    // surface stays bounded and never closes against a box face.
    expect(surface.sample(-5, -5, -5)).toBeCloseTo(0, 6);
    expect(surface.sample(100, 100, 100)).toBeCloseTo(0, 6);
  });

  it('a central blob yields a non-empty surface', () => {
    const surface = new DensitySurface({ grid: blobGrid(7), resolution: 24 });
    expect(surface.surface.getTriangleCount()).toBeGreaterThan(0);
  });

  it('an all-zero grid builds an empty-ish surface without throwing or NaN', () => {
    const values = new Array(27).fill(0);
    let surface: DensitySurface | undefined;
    expect(() => {
      surface = new DensitySurface({ grid: { values, dims: [3, 3, 3] } });
    }).not.toThrow();
    expect(surface?.surface.getTriangleCount()).toBe(0);
    expect(Number.isNaN(surface?.getIsoValue())).toBe(false);
  });

  it('passes color, opacity and resolution to the surface', () => {
    const surface = new DensitySurface({
      grid: blobGrid(5),
      color: '#123456',
      opacity: 0.3,
      resolution: 16,
    });
    expect(surface.surface.color).toBe('#123456');
    expect(surface.surface.fillOpacity).toBeCloseTo(0.3, 6);
    expect(surface.surface.getResolution()).toBe(16);
  });

  it('copy preserves the grid, bounds, iso value and parameters', () => {
    const surface = new DensitySurface({
      grid: { ...blobGrid(5), origin: [1, 1, 1], spacing: [2, 2, 2] },
      color: '#abcdef',
      opacity: 0.4,
      resolution: 20,
      isoValue: 0.25,
    });
    const clone = surface.copy();
    expect(clone).toBeInstanceOf(DensitySurface);
    expect(clone.getBounds()).toEqual(surface.getBounds());
    expect(clone.getIsoValue()).toBeCloseTo(0.25, 6);
    expect(clone.surface.color).toBe('#abcdef');
    expect(clone.surface.getResolution()).toBe(20);
    // The sampler must survive the copy (same value at a voxel center).
    expect(clone.sample(2, 2, 2)).toBeCloseTo(surface.sample(2, 2, 2), 6);
  });
});
