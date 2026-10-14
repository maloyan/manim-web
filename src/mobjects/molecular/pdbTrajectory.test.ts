/**
 * Tests for parsePdbTrajectory (multi-MODEL PDB playback) and the B-factor /
 * occupancy columns parsePdb now exposes per atom and per residue.
 *
 * The parser reads one conformation per MODEL...ENDMDL block, in the same atom
 * order, so a Molecule3D built from the first model can be driven across frames.
 */
import { describe, it, expect } from 'vitest';
import { parsePdb, parsePdbTrajectory } from './pdb';

/**
 * Build a fixed-column PDB line.
 *
 * Each field is `[startColumn (1-indexed), text]`; the text is written verbatim
 * from that column, so the caller controls exact alignment.
 */
function pdbLine(fields: Array<[number, string]>): string {
  const arr: string[] = Array<string>(80).fill(' ');
  for (const [start, text] of fields) {
    for (let i = 0; i < text.length; i++) {
      arr[start - 1 + i] = text[i];
    }
  }
  return arr.join('').replace(/\s+$/, '');
}

/** Format a coordinate into the 8-wide PDB column. */
function coord(value: number): string {
  return value.toFixed(3).padStart(8, ' ');
}

/** Build one CA ATOM line for a residue with explicit coordinates and B-factor. */
function caLine(
  serial: number,
  res: string,
  resSeq: number,
  x: number,
  y: number,
  z: number,
  temp: number,
): string {
  return pdbLine([
    [1, 'ATOM'],
    [7, String(serial).padStart(5, ' ')],
    [13, ' CA '],
    [18, res],
    [22, 'A'],
    [23, String(resSeq).padStart(4, ' ')],
    [31, coord(x)],
    [39, coord(y)],
    [47, coord(z)],
    [55, '  1.00'],
    [61, temp.toFixed(2).padStart(6, ' ')],
    [77, ' C'],
  ]);
}

/** Two CA atoms (ALA res 1, GLY res 2) at a per-model offset. */
function modelAtoms(offset: number): string[] {
  return [
    caLine(1, 'ALA', 1, offset, 0, 0, 10 + offset),
    caLine(2, 'GLY', 2, offset + 1, 0, 0, 20 + offset),
  ];
}

/** A 3-MODEL trajectory PDB, offsets 0 / 2 / 4. */
const THREE_MODEL = [
  'MODEL        1',
  ...modelAtoms(0),
  'ENDMDL',
  'MODEL        2',
  ...modelAtoms(2),
  'ENDMDL',
  'MODEL        3',
  ...modelAtoms(4),
  'ENDMDL',
  'END',
].join('\n');

describe('parsePdbTrajectory', () => {
  it('parses a 3-MODEL PDB into 3 frames with the first-model structure', () => {
    const traj = parsePdbTrajectory(THREE_MODEL);
    expect(traj.numModels).toBe(3);
    expect(traj.frames).toHaveLength(3);
    expect(traj.structure.atoms).toHaveLength(2);
    expect(traj.structure.residues).toHaveLength(2);
    expect(traj.structure.residues[0].code).toBe('A');
    expect(traj.structure.residues[1].code).toBe('G');
  });

  it('reads the correct per-frame coordinates, same atom order', () => {
    const traj = parsePdbTrajectory(THREE_MODEL);
    expect(traj.frames[0][0]).toEqual([0, 0, 0]);
    expect(traj.frames[0][1]).toEqual([1, 0, 0]);
    expect(traj.frames[2][0]).toEqual([4, 0, 0]);
    expect(traj.frames[2][1]).toEqual([5, 0, 0]);
  });

  it('treats a single-model PDB (no MODEL records) as a 1-frame trajectory', () => {
    const singleModel = [...modelAtoms(0), 'END'].join('\n');
    const traj = parsePdbTrajectory(singleModel);
    expect(traj.numModels).toBe(1);
    expect(traj.frames).toHaveLength(1);
    expect(traj.frames[0]).toHaveLength(2);
  });

  it('throws when models have mismatched atom counts', () => {
    const mismatched = [
      'MODEL        1',
      ...modelAtoms(0),
      'ENDMDL',
      'MODEL        2',
      caLine(1, 'ALA', 1, 0, 0, 0, 1),
      'ENDMDL',
    ].join('\n');
    expect(() => parsePdbTrajectory(mismatched)).toThrow(/same atoms|atoms but model/i);
  });

  it('throws when there is no model at all', () => {
    expect(() => parsePdbTrajectory('HEADER only, no atoms\nEND')).toThrow(
      /at least one model|no MODEL/i,
    );
  });
});

describe('parsePdb B-factor and occupancy columns', () => {
  it('exposes tempFactor and occupancy per atom', () => {
    const text = caLine(2, 'ALA', 1, 1, 2, 3, 42.5);
    const { residues, atoms } = parsePdb(text);
    expect(atoms[0].tempFactor).toBeCloseTo(42.5, 3);
    expect(atoms[0].occupancy).toBeCloseTo(1.0, 3);
    expect(residues[0].tempFactor).toBeCloseTo(42.5, 3);
  });
});
