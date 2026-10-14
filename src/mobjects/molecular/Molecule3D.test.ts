/**
 * Tests for Molecule3D, a 3D molecule renderer.
 *
 * Molecule3D is a Group that holds a sphere per atom (in atomsGroup) and a
 * Bond3D stick per bond (in bondsGroup). The render style, radius scheme and
 * colors drive the sphere sizes, bond sticks and colors.
 */
import { describe, it, expect, vi } from 'vitest';
import { Molecule3D } from './Molecule3D';
import { covalentRadius, vdwRadius } from './elementRadii';

/** A minimal water molecule: O at origin, two H, two O-H bonds. */
const WATER = {
  atoms: [
    { element: 'O', position: [0, 0, 0] as [number, number, number] },
    { element: 'H', position: [0.76, 0.59, 0] as [number, number, number] },
    { element: 'H', position: [-0.76, 0.59, 0] as [number, number, number] },
  ],
  bonds: [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
  ],
};

describe('Molecule3D counts', () => {
  it('renders one sphere per atom and one bond record per bond (ball-and-stick)', () => {
    const mol = new Molecule3D(WATER);
    expect(mol.numAtoms).toBe(3);
    expect(mol.numBonds).toBe(2);
    expect(mol.atomsGroup.length).toBe(3);
    expect(mol.getAtoms()).toHaveLength(3);
    expect(mol.getBonds()).toHaveLength(2);
  });

  it('exposes atom records with element, position, color, radius and a sphere', () => {
    const mol = new Molecule3D(WATER);
    const o = mol.getAtom(0);
    expect(o).toBeDefined();
    expect(o?.element).toBe('O');
    expect(o?.position).toEqual([0, 0, 0]);
    expect(typeof o?.color).toBe('string');
    expect(o?.radius).toBeGreaterThan(0);
    expect(o?.sphere.getRadius()).toBeCloseTo(o?.radius ?? -1, 6);
  });

  it('returns undefined for an out-of-range accessor index', () => {
    const mol = new Molecule3D(WATER);
    expect(mol.getAtom(99)).toBeUndefined();
    expect(mol.getBond(99)).toBeUndefined();
  });
});

describe('Molecule3D styles', () => {
  it('space-filling draws no bonds even when bonds are given', () => {
    const mol = new Molecule3D({ ...WATER, style: 'space-filling' });
    expect(mol.numBonds).toBe(0);
    expect(mol.bondsGroup.length).toBe(0);
    expect(mol.numAtoms).toBe(3);
  });

  it('ball-and-stick draws Bond3D sticks', () => {
    const mol = new Molecule3D({ ...WATER, style: 'ball-and-stick' });
    expect(mol.numBonds).toBe(2);
    expect(mol.bondsGroup.length).toBeGreaterThanOrEqual(2);
    const bond = mol.getBond(0);
    expect(bond?.sticks.length).toBe(1);
  });

  it('wireframe draws thin bond sticks', () => {
    const mol = new Molecule3D({ ...WATER, style: 'wireframe' });
    expect(mol.numBonds).toBe(2);
    const bond = mol.getBond(0);
    expect(bond?.sticks[0].getRadius()).toBeLessThan(0.08);
  });
});

describe('Molecule3D radius scheme', () => {
  it('uniform uses atomRadius for every atom', () => {
    const mol = new Molecule3D({ ...WATER, radiusScheme: 'uniform', atomRadius: 0.42 });
    expect(mol.getAtom(0)?.radius).toBeCloseTo(0.42, 6);
    expect(mol.getAtom(1)?.radius).toBeCloseTo(0.42, 6);
  });

  it('covalent uses covalentRadius * radiusScale', () => {
    const mol = new Molecule3D({ ...WATER, radiusScheme: 'covalent', radiusScale: 0.5 });
    expect(mol.getAtom(0)?.radius).toBeCloseTo(covalentRadius('O') * 0.5, 6);
  });

  it('vdw uses vdwRadius * radiusScale and differs from covalent', () => {
    const vdwMol = new Molecule3D({ ...WATER, radiusScheme: 'vdw', radiusScale: 1 });
    const covMol = new Molecule3D({ ...WATER, radiusScheme: 'covalent', radiusScale: 1 });
    expect(vdwMol.getAtom(0)?.radius).toBeCloseTo(vdwRadius('O'), 6);
    expect(vdwMol.getAtom(0)?.radius).not.toBeCloseTo(covMol.getAtom(0)?.radius ?? -1, 6);
  });
});

describe('Molecule3D bonds', () => {
  it('skips a bond that references an out-of-range atom index and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mol = new Molecule3D({
      atoms: WATER.atoms,
      bonds: [
        { from: 0, to: 1 },
        { from: 0, to: 99 },
      ],
    });
    expect(mol.numBonds).toBe(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('builds 2 parallel sticks for a double bond and 3 for a triple bond', () => {
    const mol = new Molecule3D({
      atoms: [
        { element: 'C', position: [0, 0, 0] },
        { element: 'O', position: [1.2, 0, 0] },
        { element: 'N', position: [2.4, 0, 0] },
      ],
      bonds: [
        { from: 0, to: 1, order: 2 },
        { from: 1, to: 2, order: 3 },
      ],
    });
    expect(mol.getBond(0)?.sticks.length).toBe(2);
    expect(mol.getBond(1)?.sticks.length).toBe(3);
  });

  it('honors a uniform bondColor when set', () => {
    const mol = new Molecule3D({ ...WATER, bondColor: '#abcdef' });
    expect(mol.getBond(0)?.sticks[0].color.toLowerCase()).toBe('#abcdef');
  });
});

describe('Molecule3D colors and scale', () => {
  it('honors per-element color overrides', () => {
    const mol = new Molecule3D({ ...WATER, colors: { O: '#123456' } });
    expect(mol.getAtom(0)?.color).toBe('#123456');
  });

  it('applies the world scale to atom positions', () => {
    const mol = new Molecule3D({ ...WATER, scale: 2 });
    expect(mol.getAtom(1)?.position).toEqual([0.76 * 2, 0.59 * 2, 0]);
  });
});

describe('Molecule3D copy', () => {
  it('preserves atom and bond counts', () => {
    const mol = new Molecule3D(WATER);
    const clone = mol.copy();
    expect(clone).toBeInstanceOf(Molecule3D);
    expect(clone.numAtoms).toBe(mol.numAtoms);
    expect(clone.numBonds).toBe(mol.numBonds);
  });

  it('preserves the radius scheme', () => {
    const mol = new Molecule3D({ ...WATER, radiusScheme: 'vdw', radiusScale: 1 });
    const clone = mol.copy();
    expect(clone.getAtom(0)?.radius).toBeCloseTo(mol.getAtom(0)?.radius ?? -1, 6);
  });
});

describe('Molecule3D bond rebuild frees GPU resources', () => {
  // A moving conformation rebuilds the bond sticks every frame. Group.clear only
  // detaches children, so without an explicit dispose each rebuilt Bond3D leaks
  // its CylinderGeometry and MeshStandardMaterial on the GPU.
  it('disposes the previous bond sticks when the atoms move', () => {
    const mol = new Molecule3D(WATER);
    const oldSticks = mol.getBonds().flatMap((b) => b.sticks);
    expect(oldSticks.length).toBeGreaterThan(0);
    const spies = oldSticks.map((stick) => vi.spyOn(stick, 'dispose'));

    mol.setAtomPositions([
      [0, 0, 0],
      [0.8, 0.6, 0],
      [-0.8, 0.6, 0],
    ]);

    for (const spy of spies) {
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it('keeps the live bond-stick count bounded across many rebuilds', () => {
    const mol = new Molecule3D(WATER);
    const before = mol.bondsGroup.length;
    for (let k = 0; k < 50; k++) {
      mol.setAtomPositions([
        [0, 0, 0],
        [0.76 + k * 1e-3, 0.59, 0],
        [-0.76, 0.59, 0],
      ]);
    }
    expect(mol.bondsGroup.length).toBe(before);
  });
});
