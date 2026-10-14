/**
 * Tests for MolecularSurface, the blobby metaball molecular surface.
 *
 * Marching cubes produces a vertex soup that cannot be asserted exactly, so the
 * tests check structure, the sampled bounds, the resolved parameters, and that
 * the surface builds without throwing.
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MolecularSurface, maxValue } from './MolecularSurface';
import type { SurfaceColorBy } from './MolecularSurface';
import { ImplicitSurface } from '../three-d/ImplicitSurface';
import { vdwRadius } from './elementRadii';
import type { Atom3DSpec } from './Molecule3D';

const DIATOMIC: Atom3DSpec[] = [
  { element: 'C', position: [0, 0, 0] },
  { element: 'O', position: [1.2, 0, 0] },
];

/** Index of the surface vertex nearest a target point, over a flat xyz soup. */
function nearestVertex(positions: Float32Array, target: [number, number, number]): number {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - target[0];
    const dy = positions[i + 1] - target[1];
    const dz = positions[i + 2] - target[2];
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestDist) {
      bestDist = d;
      best = i / 3;
    }
  }
  return best;
}

/** The `[r, g, b]` (0..1) of a vertex in a flat color soup. */
function vertexColor(colors: Float32Array, index: number): [number, number, number] {
  return [colors[index * 3], colors[index * 3 + 1], colors[index * 3 + 2]];
}

// Two atoms far enough apart that the surface has a distinct region near each.
const PLUS_AT: [number, number, number] = [0, 0, 0];
const MINUS_AT: [number, number, number] = [3, 0, 0];
const CHARGED_PAIR: Atom3DSpec[] = [
  { element: 'C', position: PLUS_AT },
  { element: 'C', position: MINUS_AT },
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

describe('MolecularSurface colorBy (property / electrostatic surface coloring)', () => {
  it("colorBy 'uniform' is the default and sets no per-vertex colors", () => {
    const surface = new MolecularSurface({ atoms: CHARGED_PAIR });
    expect(surface.getColorBy()).toBe('uniform');
    expect(surface.getVertexColors()).toBeNull();
    // The material stays a single solid color (vertex colors off).
    const mesh = surface.surface?.getThreeObject() as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.vertexColors).toBe(false);
  });

  it("colorBy 'electrostatic' paints the + atom red and the - atom blue", () => {
    const surface = new MolecularSurface({
      atoms: CHARGED_PAIR,
      colorBy: 'electrostatic',
      charges: [1, -1],
      resolution: 24,
    });
    const colors = surface.getVertexColors();
    expect(colors).not.toBeNull();
    if (!colors) throw new Error('expected vertex colors');
    const positions = surface.surface?.getPositions() as Float32Array;
    expect(colors.length).toBe(positions.length);

    const plus = vertexColor(colors, nearestVertex(positions, PLUS_AT));
    const minus = vertexColor(colors, nearestVertex(positions, MINUS_AT));
    // Near the + atom: the positive (red) ramp end. Near the -: the blue end.
    expect(plus[0]).toBeGreaterThan(plus[2]);
    expect(plus[0]).toBeGreaterThan(0.5);
    expect(minus[2]).toBeGreaterThan(minus[0]);
    expect(minus[2]).toBeGreaterThan(0.5);
  });

  it("writes the per-vertex colors onto the mesh geometry's color attribute", () => {
    const surface = new MolecularSurface({
      atoms: CHARGED_PAIR,
      colorBy: 'electrostatic',
      charges: [1, -1],
    });
    const mesh = surface.surface?.getThreeObject() as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.vertexColors).toBe(true);
    const colorAttr = mesh.geometry.getAttribute('color');
    expect(colorAttr).toBeDefined();
    expect(colorAttr.count).toBe(mesh.geometry.getAttribute('position').count);
  });

  it("colorBy 'charge' uses the nearest atom's charge (via the charges option)", () => {
    const surface = new MolecularSurface({
      atoms: CHARGED_PAIR,
      colorBy: 'charge',
      charges: [1, -1],
    });
    const colors = surface.getVertexColors();
    if (!colors) throw new Error('expected vertex colors');
    const positions = surface.surface?.getPositions() as Float32Array;
    const plus = vertexColor(colors, nearestVertex(positions, PLUS_AT));
    const minus = vertexColor(colors, nearestVertex(positions, MINUS_AT));
    expect(plus[0]).toBeGreaterThan(plus[2]); // red near +
    expect(minus[2]).toBeGreaterThan(minus[0]); // blue near -
  });

  it("colorBy 'charge' falls back to residueCharge(resName) when no charges given", () => {
    const surface = new MolecularSurface({
      atoms: [
        { element: 'C', position: PLUS_AT, resName: 'ARG' }, // +1
        { element: 'C', position: MINUS_AT, resName: 'ASP' }, // -1
      ],
      colorBy: 'charge',
    });
    const colors = surface.getVertexColors();
    if (!colors) throw new Error('expected vertex colors');
    const positions = surface.surface?.getPositions() as Float32Array;
    const plus = vertexColor(colors, nearestVertex(positions, PLUS_AT));
    const minus = vertexColor(colors, nearestVertex(positions, MINUS_AT));
    expect(plus[0]).toBeGreaterThan(plus[2]);
    expect(minus[2]).toBeGreaterThan(minus[0]);
  });

  it("colorBy 'hydrophobicity' paints hydrophobic residues red, hydrophilic blue", () => {
    const surface = new MolecularSurface({
      atoms: [
        { element: 'C', position: PLUS_AT, resName: 'ILE' }, // +4.5 hydrophobic
        { element: 'C', position: MINUS_AT, resName: 'ARG' }, // -4.5 hydrophilic
      ],
      colorBy: 'hydrophobicity',
    });
    const colors = surface.getVertexColors();
    if (!colors) throw new Error('expected vertex colors');
    const positions = surface.surface?.getPositions() as Float32Array;
    const hydrophobic = vertexColor(colors, nearestVertex(positions, PLUS_AT));
    const hydrophilic = vertexColor(colors, nearestVertex(positions, MINUS_AT));
    expect(hydrophobic[0]).toBeGreaterThan(hydrophobic[2]); // red near hydrophobic
    expect(hydrophilic[2]).toBeGreaterThan(hydrophilic[0]); // blue near hydrophilic
  });

  it('throws on an unknown colorBy', () => {
    const bad = 'rainbow' as SurfaceColorBy;
    expect(() => new MolecularSurface({ atoms: CHARGED_PAIR, colorBy: bad })).toThrow(/colorBy/);
  });

  it("throws when colorBy 'electrostatic' has no charge data", () => {
    expect(() => new MolecularSurface({ atoms: CHARGED_PAIR, colorBy: 'electrostatic' })).toThrow(
      /charge/i,
    );
  });

  it("throws when colorBy 'charge' has neither charges nor resName", () => {
    expect(() => new MolecularSurface({ atoms: CHARGED_PAIR, colorBy: 'charge' })).toThrow(
      /charge/i,
    );
  });

  it("throws when colorBy 'hydrophobicity' has no residue names", () => {
    expect(() => new MolecularSurface({ atoms: CHARGED_PAIR, colorBy: 'hydrophobicity' })).toThrow(
      /resName|residue/i,
    );
  });

  it('copy preserves the coloring options', () => {
    const surface = new MolecularSurface({
      atoms: CHARGED_PAIR,
      colorBy: 'electrostatic',
      charges: [1, -1],
    });
    const clone = surface.copy();
    expect(clone.getColorBy()).toBe('electrostatic');
    expect(clone.getVertexColors()).not.toBeNull();
  });
});

describe('maxValue (bounds helper)', () => {
  it('handles a very large array without a call-stack overflow', () => {
    const big = new Array<number>(1000000);
    for (let i = 0; i < big.length; i++) {
      big[i] = i % 97;
    }
    big[123456] = 1000;
    // Math.max(...big) throws "Maximum call stack size exceeded" at this size.
    expect(() => Math.max(...big)).toThrow();
    expect(maxValue(big)).toBe(1000);
  });

  it('matches Math.max on small arrays', () => {
    expect(maxValue([3, 1, 4, 1, 5, 9, 2, 6])).toBe(9);
    expect(maxValue([-5, -2, -9])).toBe(-2);
  });
});
