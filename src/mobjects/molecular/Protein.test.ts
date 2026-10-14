/**
 * Tests for Protein, a 3D protein backbone trace.
 *
 * Protein is a Group of per-residue Line3D segments (backbone-line) or
 * TubeFromPoints spans (tube). Color resolution follows the color mode.
 */
import { describe, it, expect } from 'vitest';
import { Protein, type ProteinColorMode } from './Protein';
import { Line3D } from '../three-d/Line3D';
import { TubeFromPoints } from '../three-d/TubeFromPoints';
import { residueColor } from '../biology/biologyColors';
import { ColorScale } from '../geo/colorScale';
import {
  residueHydropathy,
  HYDROPATHY_MIN,
  HYDROPATHY_MAX,
  DEFAULT_BFACTOR_COLORS,
  DEFAULT_HYDROPATHY_COLORS,
  DEFAULT_CHARGE_COLORS,
} from './residueProperties';
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

  it('throws a clear range error for an out-of-range residue index', () => {
    const protein = new Protein({ residues: RESIDUES, colorMode: 'uniform' });
    const last = protein.getResidueCount() - 1;
    expect(() => protein.colorForResidue(protein.getResidueCount())).toThrow(
      new RegExp(`out of range \\(0 to ${last}\\)`),
    );
    expect(() => protein.colorForResidue(-1)).toThrow(/out of range/i);
  });
});

describe('Protein property coloring', () => {
  /** Residues spanning the hydropathy and charge extremes, with B-factors. */
  const PROP_RESIDUES: ResidueCA[] = [
    { code: 'I', ca: [0, 0, 0], chain: 'A', resSeq: 1, ss: 'coil', tempFactor: 10 },
    { code: 'V', ca: [1, 0, 0], chain: 'A', resSeq: 2, ss: 'coil', tempFactor: 30 },
    { code: 'R', ca: [2, 0, 0], chain: 'A', resSeq: 3, ss: 'coil', tempFactor: 60 },
    { code: 'D', ca: [3, 0, 0], chain: 'A', resSeq: 4, ss: 'coil', tempFactor: 90 },
    { code: 'A', ca: [4, 0, 0], chain: 'A', resSeq: 5, ss: 'coil', tempFactor: 50 },
  ];

  it('bfactor maps high and low tempFactor to opposite ends of the ramp', () => {
    const protein = new Protein({ residues: PROP_RESIDUES, colorMode: 'bfactor' });
    const temps = PROP_RESIDUES.map((r) => r.tempFactor as number);
    const ref = new ColorScale({ colors: DEFAULT_BFACTOR_COLORS }).setDomainFromValues(temps);
    // Index 0 has the lowest tempFactor (10), index 3 the highest (90).
    expect(protein.colorForResidue(0)).toBe(ref.colorFor(10));
    expect(protein.colorForResidue(3)).toBe(ref.colorFor(90));
    expect(protein.colorForResidue(0)).not.toBe(protein.colorForResidue(3));
  });

  it('bfactor throws when no residue carries B-factor data', () => {
    const noTemp: ResidueCA[] = [
      { code: 'A', ca: [0, 0, 0] },
      { code: 'G', ca: [1, 0, 0] },
    ];
    expect(() => new Protein({ residues: noTemp, colorMode: 'bfactor' })).toThrow(/B-factor/i);
  });

  it('hydrophobicity gives hydrophobic (ILE/VAL) and hydrophilic (ARG/ASP) distinct colors', () => {
    const protein = new Protein({ residues: PROP_RESIDUES, colorMode: 'hydrophobicity' });
    const ref = new ColorScale({
      colors: DEFAULT_HYDROPATHY_COLORS,
      domain: [HYDROPATHY_MIN, HYDROPATHY_MAX],
    });
    expect(protein.colorForResidue(0)).toBe(ref.colorFor(residueHydropathy('I')));
    expect(protein.colorForResidue(2)).toBe(ref.colorFor(residueHydropathy('R')));
    // ILE (hydrophobic) and ARG (hydrophilic) must differ.
    expect(protein.colorForResidue(0)).not.toBe(protein.colorForResidue(2));
  });

  it('charge colors ARG positive, ASP negative and ALA neutral, all distinct', () => {
    const protein = new Protein({ residues: PROP_RESIDUES, colorMode: 'charge' });
    const arg = protein.colorForResidue(2); // R, +1
    const asp = protein.colorForResidue(3); // D, -1
    const ala = protein.colorForResidue(4); // A, 0
    expect(arg).toBe(DEFAULT_CHARGE_COLORS.positive);
    expect(asp).toBe(DEFAULT_CHARGE_COLORS.negative);
    expect(ala).toBe(DEFAULT_CHARGE_COLORS.neutral);
    expect(new Set([arg, asp, ala]).size).toBe(3);
  });

  it('charge honors color overrides', () => {
    const protein = new Protein({
      residues: PROP_RESIDUES,
      colorMode: 'charge',
      colors: { positive: '#111111' },
    });
    expect(protein.colorForResidue(2)).toBe('#111111');
  });

  it('throws on an unknown colorMode', () => {
    expect(
      () =>
        new Protein({
          residues: PROP_RESIDUES,
          colorMode: 'bogus' as unknown as ProteinColorMode,
        }),
    ).toThrow(/unknown colorMode/i);
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
