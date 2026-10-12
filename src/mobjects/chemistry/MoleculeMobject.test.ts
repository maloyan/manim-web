import { describe, it, expect } from 'vitest';
import { MoleculeMobject } from './MoleculeMobject';
import { VGroup } from '../../core/VGroup';
import { Line } from '../geometry/Line';
import { Polygon } from '../geometry/Polygon';
import { DashedLine } from '../geometry/DashedLine';
import { cpkColor } from './cpkColors';
import { AtomSpec, BondSpec } from './chemistryTypes';

const WATER_ATOMS: AtomSpec[] = [
  { element: 'O', x: 0, y: 0 },
  { element: 'H', x: -0.8, y: -0.6 },
  { element: 'H', x: 0.8, y: -0.6 },
];
const WATER_BONDS: BondSpec[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
];

describe('MoleculeMobject', () => {
  it('is a VGroup so animations apply directly', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    expect(mol).toBeInstanceOf(VGroup);
  });

  it('atom count equals the number of input atoms', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    expect(mol.getAtoms()).toHaveLength(WATER_ATOMS.length);
    expect(mol.numAtoms).toBe(WATER_ATOMS.length);
  });

  it('bond count equals the number of input bonds', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    expect(mol.getBonds()).toHaveLength(WATER_BONDS.length);
    expect(mol.numBonds).toBe(WATER_BONDS.length);
  });

  it('atom label text matches the element symbol', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    const oxygen = mol.getAtom(0);
    expect(oxygen?.element).toBe('O');
    expect(oxygen?.label?.getText()).toBe('O');
  });

  it('normalizes element case in the label (cl -> Cl)', () => {
    const mol = new MoleculeMobject({
      atoms: [{ element: 'cl', x: 0, y: 0 }],
    });
    expect(mol.getAtom(0)?.label?.getText()).toBe('Cl');
  });

  it('applies the CPK color per element', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    expect(mol.getAtom(0)?.color).toBe(cpkColor('O'));
    expect(mol.getAtom(1)?.color).toBe(cpkColor('H'));
    // Oxygen is red, hydrogen is white; they must differ.
    expect(mol.getAtom(0)?.color).not.toBe(mol.getAtom(1)?.color);
  });

  it('honors per-element color overrides', () => {
    const mol = new MoleculeMobject({
      atoms: [{ element: 'O', x: 0, y: 0 }],
      colors: { O: '#123456' },
    });
    expect(mol.getAtom(0)?.color).toBe('#123456');
    expect(mol.getAtom(0)?.label?.color).toBe('#123456');
  });

  it('draws a single bond as one line', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    const bond = mol.getBond(0);
    expect(bond?.order).toBe(1);
    expect(bond?.lines).toHaveLength(1);
    expect(bond?.lines[0]).toBeInstanceOf(Line);
  });

  it('draws a double bond as two parallel lines', () => {
    const mol = new MoleculeMobject({
      atoms: [
        { element: 'C', x: 0, y: 0 },
        { element: 'O', x: 1, y: 0 },
      ],
      bonds: [{ from: 0, to: 1, order: 2 }],
    });
    const bond = mol.getBond(0);
    expect(bond?.order).toBe(2);
    expect(bond?.lines).toHaveLength(2);
    // The two lines must be offset (not identical start points).
    const a = bond?.lines[0] as Line;
    const b = bond?.lines[1] as Line;
    expect(a.getStart()).not.toEqual(b.getStart());
  });

  it('draws a triple bond as three parallel lines', () => {
    const mol = new MoleculeMobject({
      atoms: [
        { element: 'C', x: 0, y: 0 },
        { element: 'C', x: 1, y: 0 },
      ],
      bonds: [{ from: 0, to: 1, order: 3 }],
    });
    const bond = mol.getBond(0);
    expect(bond?.order).toBe(3);
    expect(bond?.lines).toHaveLength(3);
  });

  it('draws a wedge bond as one filled triangle', () => {
    const mol = new MoleculeMobject({
      atoms: [
        { element: 'C', x: 0, y: 0 },
        { element: 'H', x: 1, y: 0 },
      ],
      bonds: [{ from: 0, to: 1, type: 'wedge' }],
    });
    const bond = mol.getBond(0);
    expect(bond?.type).toBe('wedge');
    expect(bond?.lines).toHaveLength(1);
    expect(bond?.lines[0]).toBeInstanceOf(Polygon);
  });

  it('draws a dash bond as one dashed line', () => {
    const mol = new MoleculeMobject({
      atoms: [
        { element: 'C', x: 0, y: 0 },
        { element: 'H', x: 1, y: 0 },
      ],
      bonds: [{ from: 0, to: 1, type: 'dash' }],
    });
    const bond = mol.getBond(0);
    expect(bond?.type).toBe('dash');
    expect(bond?.lines[0]).toBeInstanceOf(DashedLine);
  });

  it('scales atom coordinates by bondLength', () => {
    const mol = new MoleculeMobject({
      atoms: [{ element: 'H', x: 2, y: 1 }],
      bondLength: 1.5,
    });
    expect(mol.getAtom(0)?.position).toEqual([3, 1.5, 0]);
  });

  it('leaves carbons implicit (unlabeled) by default', () => {
    const mol = new MoleculeMobject({ atoms: [{ element: 'C', x: 0, y: 0 }] });
    expect(mol.getAtom(0)?.label).toBeNull();
  });

  it('labels carbons when showCarbonLabels is true', () => {
    const mol = new MoleculeMobject({
      atoms: [{ element: 'C', x: 0, y: 0 }],
      showCarbonLabels: true,
    });
    expect(mol.getAtom(0)?.label?.getText()).toBe('C');
  });

  // ===== Edge cases =====

  it('an empty molecule is an empty group and does not throw', () => {
    const mol = new MoleculeMobject({ atoms: [] });
    expect(mol.getAtoms()).toHaveLength(0);
    expect(mol.getBonds()).toHaveLength(0);
    expect(mol.isEmpty()).toBe(true);
  });

  it('handles a single atom with no bonds', () => {
    const mol = new MoleculeMobject({ atoms: [{ element: 'H', x: 0, y: 0 }] });
    expect(mol.numAtoms).toBe(1);
    expect(mol.numBonds).toBe(0);
    expect(mol.getAtom(0)?.label?.getText()).toBe('H');
  });

  it('does not throw on a bond referencing a missing atom', () => {
    expect(
      () =>
        new MoleculeMobject({
          atoms: [{ element: 'O', x: 0, y: 0 }],
          bonds: [{ from: 0, to: 5 }],
        }),
    ).not.toThrow();
    const mol = new MoleculeMobject({
      atoms: [{ element: 'O', x: 0, y: 0 }],
      bonds: [{ from: 0, to: 5 }],
    });
    // The bond is still counted, but it draws no lines.
    expect(mol.getBonds()).toHaveLength(1);
    expect(mol.getBond(0)?.lines).toHaveLength(0);
  });

  it('returns undefined for an out-of-range atom or bond', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    expect(mol.getAtom(99)).toBeUndefined();
    expect(mol.getBond(99)).toBeUndefined();
  });

  it('copy() preserves atom and bond counts', () => {
    const mol = new MoleculeMobject({ atoms: WATER_ATOMS, bonds: WATER_BONDS });
    const clone = mol.copy();
    expect(clone).toBeInstanceOf(MoleculeMobject);
    expect(clone.numAtoms).toBe(mol.numAtoms);
    expect(clone.numBonds).toBe(mol.numBonds);
  });
});
