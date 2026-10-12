import { describe, it, expect } from 'vitest';
import { water, methane, benzene, ethanol } from './molecules';
import { MoleculeMobject } from './MoleculeMobject';

describe('prebuilt molecules', () => {
  it('water() has 3 atoms (O + 2 H) and 2 bonds', () => {
    const mol = water();
    expect(mol).toBeInstanceOf(MoleculeMobject);
    expect(mol.numAtoms).toBe(3);
    expect(mol.numBonds).toBe(2);
    expect(mol.getAtom(0)?.element).toBe('O');
    expect(mol.getAtom(1)?.element).toBe('H');
  });

  it('methane() has 5 atoms (C + 4 H), 4 bonds, labeled carbon', () => {
    const mol = methane();
    expect(mol.numAtoms).toBe(5);
    expect(mol.numBonds).toBe(4);
    expect(mol.getAtom(0)?.element).toBe('C');
    expect(mol.getAtom(0)?.label?.getText()).toBe('C');
  });

  it('benzene() has 6 carbons and 6 ring bonds', () => {
    const mol = benzene();
    const atoms = mol.getAtoms();
    expect(atoms).toHaveLength(6);
    expect(atoms.every((a) => a.element === 'C')).toBe(true);
    expect(mol.getBonds()).toHaveLength(6);
  });

  it('benzene() is a closed ring (last bond links back to atom 0)', () => {
    const bonds = benzene().getBonds();
    const lastBond = bonds[bonds.length - 1];
    expect(lastBond.to).toBe(0);
  });

  it('benzene() alternates single and double bonds (3 of each)', () => {
    const bonds = benzene().getBonds();
    const doubles = bonds.filter((b) => b.order === 2);
    const singles = bonds.filter((b) => b.order === 1);
    expect(doubles).toHaveLength(3);
    expect(singles).toHaveLength(3);
    // A double bond must render two lines.
    expect(doubles[0].lines).toHaveLength(2);
  });

  it('benzene() keeps carbons implicit (no labels)', () => {
    const mol = benzene();
    expect(mol.getAtoms().every((a) => a.label === null)).toBe(true);
  });

  it('ethanol() has 4 atoms (2 C, O, H) and 3 bonds', () => {
    const mol = ethanol();
    expect(mol.numAtoms).toBe(4);
    expect(mol.numBonds).toBe(3);
    expect(mol.getAtom(2)?.element).toBe('O');
    expect(mol.getAtom(2)?.label?.getText()).toBe('O');
  });

  it('forwards style overrides to the molecule', () => {
    const mol = water({ bondLength: 2 });
    // Oxygen at origin stays put; a hydrogen scales with bondLength.
    expect(mol.getAtom(1)?.position[0]).toBeCloseTo(-0.79 * 2, 10);
  });
});
