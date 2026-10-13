/**
 * Tests for Protein, a 3D protein backbone trace.
 *
 * Protein is a Group of per-residue Line3D segments (backbone-line) or
 * TubeFromPoints spans (tube). Color resolution follows the color mode.
 */
import { describe, it, expect } from 'vitest';
import { Protein } from './Protein';
import { Line3D } from '../three-d/Line3D';
import { TubeFromPoints } from '../three-d/TubeFromPoints';
import { residueColor } from '../biology/biologyColors';
import type { ResidueCA } from './pdb';

/** Four residues with a helix, a sheet and coil, spaced on a line. */
const RESIDUES: ResidueCA[] = [
  { code: 'A', ca: [0, 0, 0], chain: 'A', resSeq: 1, ss: 'helix' },
  { code: 'G', ca: [1, 0, 0], chain: 'A', resSeq: 2, ss: 'helix' },
  { code: 'K', ca: [2, 1, 0], chain: 'A', resSeq: 3, ss: 'sheet' },
  { code: 'D', ca: [3, 0, 0], chain: 'A', resSeq: 4, ss: 'coil' },
];

describe('Protein basics', () => {
  it('reports the residue count', () => {
    expect(new Protein({ residues: RESIDUES }).getResidueCount()).toBe(4);
  });

  it('returns the CA points, one per residue, scaled by scale', () => {
    const protein = new Protein({ residues: RESIDUES, scale: 2 });
    const points = protein.getCAPoints();
    expect(points).toHaveLength(4);
    expect(points[3]).toEqual([6, 0, 0]);
  });

  it('throws when given fewer than two residues', () => {
    expect(() => new Protein({ residues: [RESIDUES[0]] })).toThrow();
  });
});

describe('Protein representation', () => {
  it('tube (default) builds one TubeFromPoints per residue span', () => {
    const protein = new Protein({ residues: RESIDUES });
    const tubes = protein.children.filter((c) => c instanceof TubeFromPoints);
    expect(tubes).toHaveLength(RESIDUES.length - 1);
  });

  it('backbone-line builds one Line3D per residue span', () => {
    const protein = new Protein({ residues: RESIDUES, representation: 'backbone-line' });
    const lines = protein.children.filter((c) => c instanceof Line3D);
    expect(lines).toHaveLength(RESIDUES.length - 1);
  });
});

describe('Protein color modes', () => {
  it('secondary-structure resolves the SS color (default helix red)', () => {
    const protein = new Protein({ residues: RESIDUES, colorMode: 'secondary-structure' });
    expect(protein.colorForResidue(0)).toBe('#ff5d5d'); // helix
    expect(protein.colorForResidue(2)).toBe('#ffd23f'); // sheet
    expect(protein.colorForResidue(3)).toBe('#b0bec5'); // coil
  });

  it('secondary-structure honors ssColors and colors overrides', () => {
    const viaSsColors = new Protein({
      residues: RESIDUES,
      colorMode: 'secondary-structure',
      ssColors: { helix: '#010203' },
    });
    expect(viaSsColors.colorForResidue(0)).toBe('#010203');

    const viaColors = new Protein({
      residues: RESIDUES,
      colorMode: 'secondary-structure',
      colors: { helix: '#040506' },
    });
    expect(viaColors.colorForResidue(0)).toBe('#040506');
  });

  it('residue resolves residueColor and honors overrides', () => {
    const protein = new Protein({ residues: RESIDUES, colorMode: 'residue' });
    expect(protein.colorForResidue(0)).toBe(residueColor('A'));

    const overridden = new Protein({
      residues: RESIDUES,
      colorMode: 'residue',
      colors: { A: '#123456' },
    });
    expect(overridden.colorForResidue(0)).toBe('#123456');
  });

  it('rainbow gives distinct colors across the chain', () => {
    const protein = new Protein({ residues: RESIDUES, colorMode: 'rainbow' });
    expect(protein.colorForResidue(0)).not.toBe(protein.colorForResidue(3));
  });

  it('uniform uses uniformColor for every residue', () => {
    const protein = new Protein({
      residues: RESIDUES,
      colorMode: 'uniform',
      uniformColor: '#abcdef',
    });
    expect(protein.colorForResidue(0)).toBe('#abcdef');
    expect(protein.colorForResidue(2)).toBe('#abcdef');
  });
});

describe('Protein copy', () => {
  it('preserves residue count, CA points and resolved colors', () => {
    const protein = new Protein({ residues: RESIDUES, colorMode: 'rainbow', scale: 1.5 });
    const clone = protein.copy();
    expect(clone).toBeInstanceOf(Protein);
    expect(clone.getResidueCount()).toBe(protein.getResidueCount());
    expect(clone.getCAPoints()).toEqual(protein.getCAPoints());
    expect(clone.colorForResidue(2)).toBe(protein.colorForResidue(2));
  });
});
