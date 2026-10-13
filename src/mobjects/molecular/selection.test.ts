/**
 * Tests for selectAtoms and bindingSiteSelection.
 *
 * The selection language filters a parsed structure by element, chain, residue
 * sequence number, residue code, proximity to a point and proximity to the
 * ligand (hetatms). It returns a new structure with re-numbered bonds and kept
 * residues, and never mutates the input.
 */
import { describe, it, expect } from 'vitest';
import { Atom3DSpec, Bond3DSpec } from './Molecule3D';
import { ParsedStructure, ResidueCA } from './pdb';
import { selectAtoms, bindingSiteSelection } from './selection';

/**
 * Build a test structure.
 *
 * atoms (combined index 0..3):
 *   0 C  [0,0,0]   chain A resSeq 1 ALA
 *   1 N  [1,0,0]   chain A resSeq 1 ALA
 *   2 C  [10,0,0]  chain B resSeq 2 GLY
 *   3 O  [10,1,0]  chain B resSeq 2 GLY
 * hetatms (combined index 4..5), the ligand near atoms 0 and 1:
 *   4 C  [0.5,0,0] LIG
 *   5 O  [0.6,0,0] LIG
 * bonds: 0-1 (atoms), 2-3 (atoms, far), 4-5 (hetatms), 1-4 (atom-het cross).
 * residues: ALA at atom0, GLY at atom2.
 */
function makeStructure(): ParsedStructure {
  const atoms: Atom3DSpec[] = [
    { element: 'C', position: [0, 0, 0], chain: 'A', resSeq: 1, resName: 'ALA' },
    { element: 'N', position: [1, 0, 0], chain: 'A', resSeq: 1, resName: 'ALA' },
    { element: 'C', position: [10, 0, 0], chain: 'B', resSeq: 2, resName: 'GLY' },
    { element: 'O', position: [10, 1, 0], chain: 'B', resSeq: 2, resName: 'GLY' },
  ];
  const hetatms: Atom3DSpec[] = [
    { element: 'C', position: [0.5, 0, 0], resName: 'LIG' },
    { element: 'O', position: [0.6, 0, 0], resName: 'LIG' },
  ];
  const bonds: Bond3DSpec[] = [
    { from: 0, to: 1 },
    { from: 2, to: 3 },
    { from: 4, to: 5 },
    { from: 1, to: 4 },
  ];
  const residues: ResidueCA[] = [
    { code: 'A', ca: [0, 0, 0], chain: 'A', resSeq: 1 },
    { code: 'G', ca: [10, 0, 0], chain: 'B', resSeq: 2 },
  ];
  return { atoms, hetatms, bonds, residues };
}

describe('selectAtoms element filter', () => {
  it('keeps only atoms of the given elements, case-insensitively', () => {
    const s = selectAtoms(makeStructure(), { elements: ['c'] });
    expect(s.atoms.map((a) => a.element)).toEqual(['C', 'C']);
    expect(s.hetatms.map((a) => a.element)).toEqual(['C']);
    // Every surviving bond lost an endpoint, so none remain.
    expect(s.bonds).toEqual([]);
  });
});

describe('selectAtoms nearPoint filter', () => {
  it('keeps only atoms inside the radius of the point', () => {
    const s = selectAtoms(makeStructure(), { nearPoint: { point: [0, 0, 0], radius: 2 } });
    expect(s.atoms).toHaveLength(2);
    expect(s.atoms.map((a) => a.element)).toEqual(['C', 'N']);
    expect(s.hetatms).toHaveLength(2);
  });

  it('keeps nothing when the radius is <= 0', () => {
    const s = selectAtoms(makeStructure(), { nearPoint: { point: [0, 0, 0], radius: 0 } });
    expect(s.atoms).toEqual([]);
    expect(s.hetatms).toEqual([]);
  });
});

describe('bindingSiteSelection / nearLigand', () => {
  it('keeps atoms near a hetatm and drops distant ones', () => {
    const s = bindingSiteSelection(makeStructure(), 2);
    // Atoms 0 and 1 line the pocket; 2 and 3 are far. Hetatms are the reference,
    // so they are not kept (includeHetatms is false).
    expect(s.atoms).toHaveLength(2);
    expect(s.hetatms).toHaveLength(0);
    // The surviving 0-1 bond is kept and re-numbered.
    expect(s.bonds).toEqual([{ from: 0, to: 1 }]);
    // Only the ALA residue, whose atoms survived, remains.
    expect(s.residues).toHaveLength(1);
    expect(s.residues[0].code).toBe('A');
  });

  it('uses the default radius (~5 A) when none is given', () => {
    const s = bindingSiteSelection(makeStructure());
    // Atoms 0 and 1 are within 5 A; 2 and 3 (10 A away) are not.
    expect(s.atoms).toHaveLength(2);
  });

  it('keeps nothing for a radius <= 0', () => {
    const s = bindingSiteSelection(makeStructure(), -1);
    expect(s.atoms).toEqual([]);
    expect(s.hetatms).toEqual([]);
    expect(s.residues).toEqual([]);
  });

  it('nearLigand uses the full hetatm set even when includeHetatms is false', () => {
    const s = selectAtoms(makeStructure(), {
      nearLigand: { radius: 2 },
      includeHetatms: false,
    });
    expect(s.atoms).toHaveLength(2);
    expect(s.hetatms).toHaveLength(0);
  });
});

describe('selectAtoms invert', () => {
  it('returns the complement within the candidate set', () => {
    const s = selectAtoms(makeStructure(), { elements: ['C'], invert: true });
    // Non-carbon candidates: N, O (atoms) and O (het).
    expect(s.atoms.map((a) => a.element)).toEqual(['N', 'O']);
    expect(s.hetatms.map((a) => a.element)).toEqual(['O']);
  });
});

describe('selectAtoms bond re-indexing', () => {
  it('drops bonds with a removed endpoint and re-numbers survivors', () => {
    // Keep atoms 0,1 (new 0,1) and hetatms 4,5 (new 2,3).
    const s = selectAtoms(makeStructure(), { nearPoint: { point: [0, 0, 0], radius: 2 } });
    // 0-1 -> 0-1 ; 2-3 dropped ; 4-5 -> 2-3 ; 1-4 -> 1-2.
    expect(s.bonds).toEqual([
      { from: 0, to: 1 },
      { from: 2, to: 3 },
      { from: 1, to: 2 },
    ]);
  });

  it('preserves bond order when present', () => {
    const base = makeStructure();
    base.bonds = [{ from: 0, to: 1, order: 2 }];
    const s = selectAtoms(base, {});
    expect(s.bonds[0]).toEqual({ from: 0, to: 1, order: 2 });
  });
});

describe('selectAtoms residue and metadata filters', () => {
  it('filters by chain and keeps matching residues', () => {
    const s = selectAtoms(makeStructure(), { chains: ['A'] });
    expect(s.atoms).toHaveLength(2);
    expect(s.hetatms).toHaveLength(0); // hetatms carry no chain
    expect(s.residues.map((r) => r.code)).toEqual(['A']);
  });

  it('filters by residue sequence number', () => {
    const s = selectAtoms(makeStructure(), { resSeqs: [2] });
    expect(s.atoms).toHaveLength(2);
    expect(s.residues.map((r) => r.code)).toEqual(['G']);
  });

  it('filters by a 3-letter residue code', () => {
    const s = selectAtoms(makeStructure(), { residueCodes: ['ALA'] });
    expect(s.atoms.map((a) => a.resName)).toEqual(['ALA', 'ALA']);
  });

  it('filters by a 1-letter residue code', () => {
    const s = selectAtoms(makeStructure(), { residueCodes: ['G'] });
    expect(s.atoms.map((a) => a.resName)).toEqual(['GLY', 'GLY']);
  });

  it('keeps a residue by CA proximity when it has no resSeq', () => {
    const base = makeStructure();
    base.residues = [{ code: 'A', ca: [0, 0, 0] }]; // no chain/resSeq
    const s = selectAtoms(base, { nearPoint: { point: [0, 0, 0], radius: 0.5 } });
    // Atom 0 at [0,0,0] survives, so the CA-matching residue is kept.
    expect(s.residues).toHaveLength(1);
  });
});

describe('selectAtoms includeHetatms', () => {
  it('excludes hetatms from candidates when false', () => {
    const s = selectAtoms(makeStructure(), { elements: ['C'], includeHetatms: false });
    expect(s.atoms.map((a) => a.element)).toEqual(['C', 'C']);
    expect(s.hetatms).toHaveLength(0);
  });
});

describe('selectAtoms combines filters with AND', () => {
  it('requires every provided filter to pass', () => {
    const s = selectAtoms(makeStructure(), { elements: ['C'], chains: ['A'] });
    // Only atom 0 is both carbon and chain A.
    expect(s.atoms).toHaveLength(1);
    expect(s.atoms[0].position).toEqual([0, 0, 0]);
  });
});

describe('selectAtoms degenerate input', () => {
  it('returns an empty but valid structure for empty input', () => {
    const empty: ParsedStructure = { atoms: [], hetatms: [], bonds: [], residues: [] };
    const s = selectAtoms(empty, { nearLigand: { radius: 5 } });
    expect(s).toEqual({ atoms: [], hetatms: [], bonds: [], residues: [] });
  });

  it('returns an empty selection without throwing when nothing matches', () => {
    const s = selectAtoms(makeStructure(), { elements: ['Xx'] });
    expect(s.atoms).toEqual([]);
    expect(s.hetatms).toEqual([]);
    expect(s.bonds).toEqual([]);
    expect(s.residues).toEqual([]);
  });

  it('keeps everything when no filters are given', () => {
    const s = selectAtoms(makeStructure(), {});
    expect(s.atoms).toHaveLength(4);
    expect(s.hetatms).toHaveLength(2);
    expect(s.bonds).toHaveLength(4);
    expect(s.residues).toHaveLength(2);
  });
});

describe('selectAtoms purity', () => {
  it('does not mutate the input structure', () => {
    const input = makeStructure();
    const snapshot = JSON.parse(JSON.stringify(input)) as ParsedStructure;
    selectAtoms(input, { elements: ['C'], nearPoint: { point: [0, 0, 0], radius: 2 } });
    expect(input).toEqual(snapshot);
  });

  it('returns fresh bond objects, not references into the input', () => {
    const input = makeStructure();
    const s = selectAtoms(input, {});
    expect(s.bonds[0]).not.toBe(input.bonds[0]);
  });
});
