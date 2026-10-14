/**
 * Tests for the Ramachandran backbone-geometry helpers.
 *
 * Covers the signed dihedral-angle function against hand-computed cases, the
 * per-residue φ/ψ computation from backbone atoms (including skipped terminal
 * and incomplete residues), the simplified allowed-region data, and the backbone
 * N/C atoms now exposed by {@link parsePdb}.
 */
import { describe, it, expect } from 'vitest';
import { Vector3Tuple } from '../../core/Mobject';
import { parsePdb, ResidueCA } from './pdb';
import {
  dihedralDegrees,
  computeRamachandran,
  pointInPolygon,
  regionFor,
  RAMACHANDRAN_REGIONS,
} from './ramachandran';

/** Build a fixed-column PDB line; each field is `[startColumn (1-indexed), text]`. */
function pdbLine(fields: Array<[number, string]>): string {
  const arr: string[] = Array<string>(80).fill(' ');
  for (const [start, text] of fields) {
    for (let i = 0; i < text.length; i++) {
      arr[start - 1 + i] = text[i];
    }
  }
  return arr.join('').replace(/\s+$/, '');
}

/** A backbone atom line for residue `seq` of chain A at `[x, y, z]`. */
function atomLine(
  serial: number,
  name: string,
  resName: string,
  seq: number,
  [x, y, z]: Vector3Tuple,
): string {
  const f = (v: number): string => v.toFixed(3).padStart(8, ' ');
  return pdbLine([
    [1, 'ATOM'],
    [7, String(serial).padStart(5, ' ')],
    [13, name.padEnd(4, ' ')],
    [18, resName],
    [22, 'A'],
    [23, String(seq).padStart(4, ' ')],
    [31, f(x)],
    [39, f(y)],
    [47, f(z)],
    [55, '  1.00'],
    [61, '  0.00'],
  ]);
}

describe('dihedralDegrees', () => {
  // Four coplanar points: the two outer atoms on the SAME side of the central
  // bond give a cis (0°) torsion; on OPPOSITE sides a trans (180°) torsion.
  const p0: Vector3Tuple = [-1, 1, 0];
  const p1: Vector3Tuple = [0, 0, 0];
  const p2: Vector3Tuple = [1, 0, 0];

  it('returns 0 for a cis (syn-planar) arrangement', () => {
    expect(dihedralDegrees(p0, p1, p2, [2, 1, 0])).toBeCloseTo(0, 6);
  });

  it('returns 180 for a trans (anti-planar) arrangement', () => {
    expect(Math.abs(dihedralDegrees(p0, p1, p2, [2, -1, 0]))).toBeCloseTo(180, 6);
  });

  it('returns -90 for a quarter-turn out of plane', () => {
    // p3 lifted +z off the plane: a clean, hand-computed -90° torsion.
    expect(dihedralDegrees(p0, p1, p2, [2, 0, 1])).toBeCloseTo(-90, 6);
  });

  it('returns +90 for the mirrored quarter-turn', () => {
    expect(dihedralDegrees(p0, p1, p2, [2, 0, -1])).toBeCloseTo(90, 6);
  });

  it('returns NaN for a degenerate (collinear) central bond', () => {
    expect(Number.isNaN(dihedralDegrees([0, 1, 0], [0, 0, 0], [0, 0, 0], [1, 0, 0]))).toBe(true);
  });
});

/**
 * A planar, fully extended three-residue backbone (a β-strand-like zig-zag).
 * Every backbone atom lies in z = 0, so the middle residue's φ and ψ are both
 * 180°. Terminal residues (first, last) have no complete torsion.
 */
function extendedBackbone(): ResidueCA[] {
  return [
    { code: 'A', chain: 'A', resSeq: 1, ca: [1, 1, 0], n: [0, 0, 0], c: [2, 0, 0] },
    { code: 'A', chain: 'A', resSeq: 2, ca: [4, 0, 0], n: [3, 1, 0], c: [5, 1, 0] },
    { code: 'A', chain: 'A', resSeq: 3, ca: [7, 1, 0], n: [6, 0, 0], c: [8, 0, 0] },
  ];
}

describe('computeRamachandran', () => {
  it('computes one (φ, ψ) for the middle residue at the expected angle', () => {
    const points = computeRamachandran(extendedBackbone());
    expect(points).toHaveLength(1);
    expect(Math.abs(points[0].phi)).toBeCloseTo(180, 5);
    expect(Math.abs(points[0].psi)).toBeCloseTo(180, 5);
    expect(points[0].residue).toBe('A');
  });

  it('skips terminal residues (no φ for the first, no ψ for the last)', () => {
    // A two-residue chain has only terminals, so no point is produced.
    const two = extendedBackbone().slice(0, 2);
    expect(computeRamachandran(two)).toHaveLength(0);
  });

  it('skips a residue missing a backbone atom instead of crashing', () => {
    const residues = extendedBackbone();
    delete residues[1].c; // middle residue loses its carbonyl carbon
    expect(computeRamachandran(residues)).toHaveLength(0);
  });

  it('skips a residue when the chain is not sequence-consecutive', () => {
    const residues = extendedBackbone();
    residues[2].resSeq = 4; // gap between residue 2 and residue 3
    expect(computeRamachandran(residues)).toHaveLength(0);
  });

  it('returns an empty array for an empty residue list', () => {
    expect(computeRamachandran([])).toHaveLength(0);
  });
});

describe('RAMACHANDRAN_REGIONS and classification', () => {
  it('has the three classic regions', () => {
    const names = RAMACHANDRAN_REGIONS.map((r) => r.name);
    expect(names).toContain('alpha-right');
    expect(names).toContain('beta-sheet');
    expect(names).toContain('alpha-left');
  });

  it('classifies canonical angles into their regions', () => {
    expect(regionFor(-63, -43)).toBe('alpha-right');
    expect(regionFor(-120, 130)).toBe('beta-sheet');
    expect(regionFor(60, 45)).toBe('alpha-left');
  });

  it('returns null for an outlier (disallowed) conformation', () => {
    expect(regionFor(0, 0)).toBeNull();
  });

  it('pointInPolygon uses the even-odd rule on a square', () => {
    const square: Array<[number, number]> = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(pointInPolygon(5, 5, square)).toBe(true);
    expect(pointInPolygon(15, 5, square)).toBe(false);
  });
});

describe('parsePdb backbone atoms', () => {
  it('exposes the N and C backbone atoms per residue', () => {
    const pdb = [
      atomLine(1, 'N', 'ALA', 1, [0, 0, 0]),
      atomLine(2, 'CA', 'ALA', 1, [1.5, 0, 0]),
      atomLine(3, 'C', 'ALA', 1, [2, 1.3, 0]),
    ].join('\n');
    const { residues } = parsePdb(pdb);
    expect(residues).toHaveLength(1);
    expect(residues[0].n).toEqual([0, 0, 0]);
    expect(residues[0].c).toEqual([2, 1.3, 0]);
    expect(residues[0].ca).toEqual([1.5, 0, 0]);
  });
});
