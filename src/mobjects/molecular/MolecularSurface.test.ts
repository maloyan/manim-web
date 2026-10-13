/**
 * Tests for MolecularSurface, the blobby metaball molecular surface.
 *
 * Marching cubes produces a vertex soup that cannot be asserted exactly, so the
 * tests check structure, the sampled bounds, the resolved parameters, and that
 * the surface builds without throwing.
 */
import { describe, it, expect } from 'vitest';
import { MolecularSurface } from './MolecularSurface';
import { ImplicitSurface } from '../three-d/ImplicitSurface';
import { vdwRadius } from './elementRadii';
import type { Atom3DSpec } from './Molecule3D';

const DIATOMIC: Atom3DSpec[] = [
  { element: 'C', position: [0, 0, 0] },
  { element: 'O', position: [1.2, 0, 0] },
];

describe('MolecularSurface', () => {
  it('reports the atom count', () => {
    const surface = new MolecularSurface({ atoms: DIATOMIC });
    expect(surface.getAtomCount()).toBe(2);
  });

  it('adds one ImplicitSurface to the group', () => {
    const surface = new MolecularSurface({ atoms: DIATOMIC });
    expect(surface.surface).toBeInstanceOf(ImplicitSurface);
    const implicitChildren = surface.children.filter((c) => c instanceof ImplicitSurface);
    expect(implicitChildren).toHaveLength(1);
  });

  it('bounds enclose every atom sphere', () => {
    const surface = new MolecularSurface({ atoms: DIATOMIC });
    const { min, max } = surface.getBounds();
    const axes = ['x', 'y', 'z'] as const;
    for (const atom of DIATOMIC) {
      const r = vdwRadius(atom.element); // radiusScale 1, scale 1, kind 'vdw'
      for (let i = 0; i < 3; i++) {
        expect(min[axes[i]]).toBeLessThan(atom.position[i] - r);
        expect(max[axes[i]]).toBeGreaterThan(atom.position[i] + r);
      }
    }
  });

  it('sas bounds are larger than vdw bounds (the probe adds radius)', () => {
    const vdw = new MolecularSurface({ atoms: DIATOMIC, kind: 'vdw' }).getBounds();
    const sas = new MolecularSurface({ atoms: DIATOMIC, kind: 'sas' }).getBounds();
    for (const axis of ['x', 'y', 'z'] as const) {
      expect(sas.min[axis]).toBeLessThan(vdw.min[axis]);
      expect(sas.max[axis]).toBeGreaterThan(vdw.max[axis]);
    }
  });

  it('defaults to the vdw kind', () => {
    const surface = new MolecularSurface({ atoms: DIATOMIC });
    expect(surface.getKind()).toBe('vdw');
  });

  it('builds a single-atom surface without throwing', () => {
    const surface = new MolecularSurface({ atoms: [{ element: 'C', position: [0, 0, 0] }] });
    expect(surface.getAtomCount()).toBe(1);
    expect(surface.surface).toBeInstanceOf(ImplicitSurface);
    expect(surface.surface?.getTriangleCount()).toBeGreaterThan(0);
  });

  it('0 atoms gives an empty group and does not throw', () => {
    const surface = new MolecularSurface({ atoms: [] });
    expect(surface.getAtomCount()).toBe(0);
    expect(surface.surface).toBeNull();
    expect(surface.children.filter((c) => c instanceof ImplicitSurface)).toHaveLength(0);
    expect(surface.getBounds()).toEqual({
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    });
  });

  it('applies the scale to positions and radii in the bounds', () => {
    const scale = 2;
    const surface = new MolecularSurface({
      atoms: [{ element: 'C', position: [0, 0, 0] }],
      scale,
    });
    const { min, max } = surface.getBounds();
    const r = vdwRadius('C') * scale;
    // single atom at origin, padding defaults to the (scaled) max radius r.
    expect(max.x).toBeCloseTo(r + r, 6);
    expect(min.x).toBeCloseTo(-(r + r), 6);
  });

  it('a larger radiusScale grows the bounds', () => {
    const base = new MolecularSurface({ atoms: DIATOMIC, radiusScale: 1 }).getBounds();
    const big = new MolecularSurface({ atoms: DIATOMIC, radiusScale: 2 }).getBounds();
    expect(big.max.x).toBeGreaterThan(base.max.x);
  });

  it('passes color, opacity, resolution and isoValue to the surface', () => {
    const surface = new MolecularSurface({
      atoms: DIATOMIC,
      color: '#123456',
      opacity: 0.3,
      resolution: 16,
      isoValue: 1.5,
    });
    expect(surface.surface?.color).toBe('#123456');
    expect(surface.surface?.fillOpacity).toBeCloseTo(0.3, 6);
    expect(surface.surface?.getResolution()).toBe(16);
    expect(surface.surface?.getIsoLevel()).toBe(1.5);
  });

  it('copy preserves atoms, kind, bounds and parameters', () => {
    const surface = new MolecularSurface({
      atoms: DIATOMIC,
      kind: 'sas',
      opacity: 0.5,
      resolution: 20,
    });
    const clone = surface.copy();
    expect(clone).toBeInstanceOf(MolecularSurface);
    expect(clone.getAtomCount()).toBe(2);
    expect(clone.getKind()).toBe('sas');
    expect(clone.getBounds()).toEqual(surface.getBounds());
    expect(clone.surface?.fillOpacity).toBeCloseTo(0.5, 6);
    expect(clone.surface?.getResolution()).toBe(20);
  });
});
