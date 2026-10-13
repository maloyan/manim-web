/**
 * Tests for parsePdb, a local-string PDB parser (no network, no file IO).
 *
 * The parser reads fixed-column ATOM / HETATM / CONECT / HELIX / SHEET records,
 * extracts CA residues with their 1-letter code and secondary structure, and
 * drops water from HETATM by default.
 */
import { describe, it, expect } from 'vitest';
import { parsePdb } from './pdb';

/**
 * Build a fixed-column PDB line.
 *
 * Each field is `[startColumn (1-indexed), text]`; the text is written verbatim
 * starting at that column, so the caller controls exact alignment.
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

/** A small structure: an ALA + GLY residue, a 2-atom ligand, a water, a bond, a helix. */
const SAMPLE = [
  'HEADER    TEST STRUCTURE',
  // HELIX covering only ALA (resSeq 1), chain A.
  pdbLine([
    [1, 'HELIX'],
    [8, '  1'],
    [12, '  1'],
    [16, 'ALA'],
    [20, 'A'],
    [22, '   1'],
    [28, 'ALA'],
    [32, 'A'],
    [34, '   1'],
    [39, ' 1'],
  ]),
  '', // blank line, must be ignored
  pdbLine([
    [1, 'ATOM'],
    [7, '    1'],
    [13, ' N  '],
    [18, 'ALA'],
    [22, 'A'],
    [23, '   1'],
    [31, '  11.000'],
    [39, '  13.000'],
    [47, '  10.000'],
    [55, '  1.00'],
    [61, '  0.00'],
    [77, ' N'],
  ]),
  pdbLine([
    [1, 'ATOM'],
    [7, '    2'],
    [13, ' CA '],
    [18, 'ALA'],
    [22, 'A'],
    [23, '   1'],
    [31, '  12.500'],
    [39, '  13.000'],
    [47, '  10.000'],
    [55, '  1.00'],
    [61, '  0.00'],
    [77, ' C'],
  ]),
  pdbLine([
    [1, 'ATOM'],
    [7, '    3'],
    [13, ' C  '],
    [18, 'ALA'],
    [22, 'A'],
    [23, '   1'],
    [31, '  13.000'],
    [39, '  14.500'],
    [47, '  10.000'],
    [55, '  1.00'],
    [61, '  0.00'],
    [77, ' C'],
  ]),
  pdbLine([
    [1, 'ATOM'],
    [7, '    4'],
    [13, ' CA '],
    [18, 'GLY'],
    [22, 'A'],
    [23, '   2'],
    [31, '  15.000'],
    [39, '  14.500'],
    [47, '  10.000'],
    [55, '  1.00'],
    [61, '  0.00'],
    [77, ' C'],
  ]),
  'TER       5      GLY A   2',
  pdbLine([
    [1, 'HETATM'],
    [7, '    6'],
    [13, ' C1 '],
    [18, 'LIG'],
    [22, 'A'],
    [23, ' 101'],
    [31, '  20.000'],
    [39, '  20.000'],
    [47, '  20.000'],
    [55, '  1.00'],
    [61, '  0.00'],
    [77, ' C'],
  ]),
  pdbLine([
    [1, 'HETATM'],
    [7, '    7'],
    [13, ' O1 '],
    [18, 'LIG'],
    [22, 'A'],
    [23, ' 101'],
    [31, '  21.000'],
    [39, '  20.000'],
    [47, '  20.000'],
    [55, '  1.00'],
    [61, '  0.00'],
    [77, ' O'],
  ]),
  pdbLine([
    [1, 'HETATM'],
    [7, '    8'],
    [13, ' O  '],
    [18, 'HOH'],
    [22, 'A'],
    [23, ' 201'],
    [31, '  30.000'],
    [39, '  30.000'],
    [47, '  30.000'],
    [55, '  1.00'],
    [61, '  0.00'],
    [77, ' O'],
  ]),
  // CONECT: ligand C1 (serial 6) bonded to O1 (serial 7), listed both ways.
  pdbLine([
    [1, 'CONECT'],
    [7, '    6'],
    [12, '    7'],
  ]),
  pdbLine([
    [1, 'CONECT'],
    [7, '    7'],
    [12, '    6'],
  ]),
  'GARBAGE LINE THAT IS NOT A RECORD',
  'END',
].join('\n');

describe('parsePdb records', () => {
  it('splits ATOM and HETATM records and excludes water by default', () => {
    const s = parsePdb(SAMPLE);
    expect(s.atoms).toHaveLength(4);
    expect(s.hetatms).toHaveLength(2); // LIG C1, LIG O1; water dropped
    expect(s.hetatms.map((a) => a.element)).toEqual(['C', 'O']);
  });

  it('includes water when includeWater is true', () => {
    const s = parsePdb(SAMPLE, { includeWater: true });
    expect(s.hetatms).toHaveLength(3);
  });

  it('parses atom coordinates and elements', () => {
    const s = parsePdb(SAMPLE);
    expect(s.atoms[0].element).toBe('N');
    expect(s.atoms[0].position).toEqual([11.0, 13.0, 10.0]);
  });
});

describe('parsePdb CONECT bonds', () => {
  it('maps CONECT serials to combined atom+hetatm indices and dedups', () => {
    const s = parsePdb(SAMPLE);
    // Combined order: 4 ATOM (idx 0..3) then LIG C1 (idx 4), LIG O1 (idx 5).
    expect(s.bonds).toHaveLength(1);
    expect(s.bonds[0]).toMatchObject({ from: 4, to: 5 });
  });
});

describe('parsePdb residues', () => {
  it('extracts one residue per CA with code, chain, resSeq and ss', () => {
    const s = parsePdb(SAMPLE);
    expect(s.residues).toHaveLength(2);
    expect(s.residues[0]).toMatchObject({ code: 'A', chain: 'A', resSeq: 1, ss: 'helix' });
    expect(s.residues[1]).toMatchObject({ code: 'G', chain: 'A', resSeq: 2, ss: 'coil' });
  });
});

describe('parsePdb robustness', () => {
  it('ignores blank lines, TER and trailing junk', () => {
    const s = parsePdb(SAMPLE);
    // 4 ATOM atoms proves junk/blank/TER did not become atoms.
    expect(s.atoms).toHaveLength(4);
  });

  it('derives the element from the atom name when the element column is missing', () => {
    // A carbon with no element column, and an iron HETATM with no element column.
    const text = [
      pdbLine([
        [1, 'ATOM'],
        [7, '    1'],
        [13, ' C  '],
        [18, 'ALA'],
        [22, 'A'],
        [23, '   1'],
        [31, '   1.000'],
        [39, '   2.000'],
        [47, '   3.000'],
      ]),
      pdbLine([
        [1, 'HETATM'],
        [7, '    2'],
        [13, 'FE  '],
        [18, ' FE'],
        [22, 'A'],
        [23, ' 500'],
        [31, '   4.000'],
        [39, '   5.000'],
        [47, '   6.000'],
      ]),
    ].join('\n');
    const s = parsePdb(text);
    expect(s.atoms[0].element).toBe('C');
    expect(s.hetatms[0].element).toBe('Fe');
  });

  it('returns empty arrays for empty input', () => {
    const s = parsePdb('');
    expect(s.atoms).toEqual([]);
    expect(s.hetatms).toEqual([]);
    expect(s.bonds).toEqual([]);
    expect(s.residues).toEqual([]);
  });
});
