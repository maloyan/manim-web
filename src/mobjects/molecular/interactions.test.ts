import { describe, it, expect } from 'vitest';
import { detectInteractions, drawInteractions } from './interactions';
import { Atom3DSpec } from './Molecule3D';

const atom = (element: string, position: [number, number, number]): Atom3DSpec => ({
  element,
  position,
});

describe('detectInteractions', () => {
  it('reports a hydrogen bond between a polar N/O pair within the cutoff', () => {
    const receptor = [atom('N', [0, 0, 0])];
    const ligand = [atom('O', [3, 0, 0])]; // 3.0 A apart, < 3.5 default
    const found = detectInteractions(receptor, ligand);
    expect(found).toHaveLength(1);
    expect(found[0].type).toBe('hbond');
    expect(found[0].distance).toBeCloseTo(3, 6);
  });

  it('does not report an interaction beyond the cutoffs', () => {
    const receptor = [atom('N', [0, 0, 0])];
    const ligand = [atom('O', [6, 0, 0])]; // 6 A, beyond both cutoffs
    expect(detectInteractions(receptor, ligand)).toHaveLength(0);
  });

  it('reports a hydrophobic contact between two carbons within the contact cutoff', () => {
    const receptor = [atom('C', [0, 0, 0])];
    const ligand = [atom('C', [3.8, 0, 0])]; // < 4.0, > hbond cutoff
    const found = detectInteractions(receptor, ligand);
    expect(found).toHaveLength(1);
    expect(found[0].type).toBe('contact');
  });

  it('a carbon pair outside the contact cutoff is not reported', () => {
    expect(detectInteractions([atom('C', [0, 0, 0])], [atom('C', [4.5, 0, 0])])).toHaveLength(0);
  });

  it('respects custom cutoffs', () => {
    const r = [atom('N', [0, 0, 0])];
    const l = [atom('O', [3.2, 0, 0])];
    expect(detectInteractions(r, l, { hBondCutoff: 3.0 })).toHaveLength(0);
    expect(detectInteractions(r, l, { hBondCutoff: 3.5 })).toHaveLength(1);
  });

  it('contactCutoff 0 skips hydrophobic contacts', () => {
    expect(
      detectInteractions([atom('C', [0, 0, 0])], [atom('C', [3.5, 0, 0])], {
        contactCutoff: 0,
      }),
    ).toHaveLength(0);
  });

  it('sorts results closest-first and handles many atoms', () => {
    const receptor = [atom('O', [0, 0, 0]), atom('N', [0, 0, 0])];
    const ligand = [atom('N', [3.4, 0, 0]), atom('O', [2.5, 0, 0])];
    const found = detectInteractions(receptor, ligand);
    // 4 polar pairs within 3.5; closest first.
    expect(found.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < found.length; i++) {
      expect(found[i].distance).toBeGreaterThanOrEqual(found[i - 1].distance);
    }
  });

  it('is case-insensitive on element symbols', () => {
    const found = detectInteractions([atom('n', [0, 0, 0])], [atom('o', [3, 0, 0])]);
    expect(found).toHaveLength(1);
    expect(found[0].type).toBe('hbond');
  });
});

describe('drawInteractions', () => {
  it('builds a group with one child per interaction', () => {
    const found = detectInteractions(
      [atom('N', [0, 0, 0]), atom('C', [0, 0, 0])],
      [atom('O', [3, 0, 0]), atom('C', [3.8, 0, 0])],
    );
    const group = drawInteractions(found);
    expect(group.children.length).toBe(found.length);
  });
});
