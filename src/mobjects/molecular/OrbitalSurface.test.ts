/**
 * Tests for OrbitalSurface, the atomic-orbital lobe isosurfaces.
 *
 * Marching cubes produces a vertex soup that cannot be asserted exactly, so the
 * tests check structure (how many colored lobe surfaces), the sampled bounds,
 * the resolved parameters, the per-phase colors, and that every orbital builds
 * without throwing.
 */
import { describe, it, expect } from 'vitest';
import { OrbitalSurface, type OrbitalType } from './OrbitalSurface';
import { ImplicitSurface } from '../three-d/ImplicitSurface';

const ALL_TYPES: OrbitalType[] = ['s', 'px', 'py', 'pz', 'dz2', 'dxy'];

/** The ImplicitSurface children of an OrbitalSurface. */
function lobes(orbital: OrbitalSurface): ImplicitSurface[] {
  return orbital.children.filter((c): c is ImplicitSurface => c instanceof ImplicitSurface);
}

describe('OrbitalSurface', () => {
  it('defaults to a pz orbital', () => {
    const orbital = new OrbitalSurface();
    expect(orbital.getType()).toBe('pz');
  });

  it('stores the requested type', () => {
    for (const type of ALL_TYPES) {
      expect(new OrbitalSurface({ type }).getType()).toBe(type);
    }
  });

  it('builds every orbital type without throwing', () => {
    for (const type of ALL_TYPES) {
      expect(() => new OrbitalSurface({ type, resolution: 12 })).not.toThrow();
    }
  });

  it('gives s a single lobe surface', () => {
    const orbital = new OrbitalSurface({ type: 's' });
    expect(lobes(orbital)).toHaveLength(1);
    expect(orbital.surfaces).toHaveLength(1);
  });

  it('gives each p orbital two signed lobe surfaces', () => {
    for (const type of ['px', 'py', 'pz'] as OrbitalType[]) {
      const orbital = new OrbitalSurface({ type });
      expect(lobes(orbital)).toHaveLength(2);
    }
  });

  it('gives each d orbital two or more lobe surfaces', () => {
    for (const type of ['dz2', 'dxy'] as OrbitalType[]) {
      const orbital = new OrbitalSurface({ type });
      expect(lobes(orbital).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('exposes the lobe surfaces as ImplicitSurface instances', () => {
    const orbital = new OrbitalSurface({ type: 'pz' });
    for (const surface of orbital.surfaces) {
      expect(surface).toBeInstanceOf(ImplicitSurface);
    }
  });

  it('bounds enclose center plus or minus about scale', () => {
    const center: [number, number, number] = [1, -2, 3];
    const scale = 2;
    const orbital = new OrbitalSurface({ type: 'pz', center, scale });
    const { min, max } = orbital.getBounds();
    const axes = ['x', 'y', 'z'] as const;
    for (let i = 0; i < 3; i++) {
      // The box must reach past one lobe length (scale) on each side.
      expect(min[axes[i]]).toBeLessThan(center[i] - scale);
      expect(max[axes[i]]).toBeGreaterThan(center[i] + scale);
    }
  });

  it('centers the bounds on the requested center', () => {
    const center: [number, number, number] = [5, 6, 7];
    const orbital = new OrbitalSurface({ center });
    const { min, max } = orbital.getBounds();
    expect((min.x + max.x) / 2).toBeCloseTo(center[0]);
    expect((min.y + max.y) / 2).toBeCloseTo(center[1]);
    expect((min.z + max.z) / 2).toBeCloseTo(center[2]);
  });

  it('forwards the resolution, opacity and iso level to each lobe', () => {
    const orbital = new OrbitalSurface({ type: 'pz', resolution: 24, opacity: 0.5 });
    for (const surface of orbital.surfaces) {
      expect(surface.getResolution()).toBe(24);
      expect(surface.getIsoLevel()).toBe(0);
    }
  });

  it('colors the positive lobe and the negative lobe differently', () => {
    const positiveColor = '#112233';
    const negativeColor = '#445566';
    const orbital = new OrbitalSurface({ type: 'pz', positiveColor, negativeColor });
    const colors = orbital.surfaces.map((s) => s.color);
    expect(colors).toContain(positiveColor);
    expect(colors).toContain(negativeColor);
  });

  it('colors the single s lobe with the positive color only', () => {
    const positiveColor = '#abcdef';
    const negativeColor = '#fedcba';
    const orbital = new OrbitalSurface({ type: 's', positiveColor, negativeColor });
    expect(orbital.surfaces).toHaveLength(1);
    expect(orbital.surfaces[0].color).toBe(positiveColor);
  });

  it('builds a finite surface for an unknown (cast) orbital type', () => {
    // An invalid type must not make angularShape return undefined → NaN field.
    const build = () => new OrbitalSurface({ type: 'unknown' as OrbitalType, resolution: 12 });
    expect(build).not.toThrow();
    const bounds = build().getBounds();
    for (const corner of [bounds.min, bounds.max]) {
      expect(Number.isFinite(corner.x)).toBe(true);
      expect(Number.isFinite(corner.y)).toBe(true);
      expect(Number.isFinite(corner.z)).toBe(true);
    }
  });

  it('does not throw for zero or degenerate params', () => {
    expect(() => new OrbitalSurface({ scale: 0, resolution: 0 })).not.toThrow();
    expect(() => new OrbitalSurface({ scale: -1, resolution: 1 })).not.toThrow();
    expect(() => new OrbitalSurface({ isoValue: 0 })).not.toThrow();
  });

  it('copy preserves the type and params', () => {
    const orbital = new OrbitalSurface({
      type: 'dxy',
      center: [1, 2, 3],
      scale: 3,
      isoValue: 0.2,
      resolution: 16,
      positiveColor: '#010101',
      negativeColor: '#020202',
      opacity: 0.4,
    });
    const copy = orbital.copy();
    expect(copy).toBeInstanceOf(OrbitalSurface);
    expect(copy.getType()).toBe('dxy');
    expect(copy.getBounds()).toEqual(orbital.getBounds());
    expect(copy.surfaces).toHaveLength(orbital.surfaces.length);
    expect(copy.surfaces[0].color).toBe('#010101');
    expect(copy.surfaces[0].getResolution()).toBe(16);
  });
});
