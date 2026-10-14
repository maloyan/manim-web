import { describe, it, expect, vi } from 'vitest';
import { parseMolfile, parseSdf, moleculeFromMolfile } from './molfile';
import { logger } from '../../utils/logger';

/**
 * Format a V2000 atom-block line. The coordinates occupy three 10-wide fields
 * (cols 1-30), then a space (col 31), then the element symbol (cols 32-34).
 */
function atomLine(x: number, y: number, z: number, element: string): string {
  const coord = (n: number): string => n.toFixed(4).padStart(10);
  return `${coord(x)}${coord(y)}${coord(z)} ${element.padEnd(3)} 0  0  0  0  0  0  0  0  0  0  0  0`;
}

/**
 * Format a V2000 bond-block line: first atom (cols 1-3), second atom (cols 4-6),
 * bond type (cols 7-9), stereo (cols 10-12), all 1-based indices.
 */
function bondLine(a: number, b: number, type: number, stereo = 0): string {
  const field = (n: number): string => String(n).padStart(3);
  return `${field(a)}${field(b)}${field(type)}${field(stereo)}  0  0  0`;
}

/** Format the counts line: atom count (cols 1-3), bond count (cols 4-6). */
function countsLine(atomCount: number, bondCount: number): string {
  const field = (n: number): string => String(n).padStart(3);
  return `${field(atomCount)}${field(bondCount)}  0  0  0  0  0  0  0  0999 V2000`;
}

/**
 * A small test molecule.
 * Atoms: C(0,0), C(1,0), O(2,0), Cl(0,1).
 * Bonds: C0=C1 double, C1-O2 single, C0-Cl3 wedge, O2-Cl3 dash.
 */
const TEST_MOLECULE = [
  'test-molecule',
  '  manim-web',
  'a comment line',
  countsLine(4, 4),
  atomLine(0, 0, 0, 'C'),
  atomLine(1, 0, 0, 'C'),
  atomLine(2, 0, 0, 'O'),
  atomLine(0, 1, 0, 'Cl'),
  bondLine(1, 2, 2, 0), // double, normal
  bondLine(2, 3, 1, 0), // single, normal
  bondLine(1, 4, 1, 1), // single, wedge
  bondLine(3, 4, 1, 6), // single, dash
  'M  END',
].join('\n');

describe('parseMolfile', () => {
  it('parses the title', () => {
    expect(parseMolfile(TEST_MOLECULE).title).toBe('test-molecule');
  });

  it('parses the right atom and bond counts', () => {
    const parsed = parseMolfile(TEST_MOLECULE);
    expect(parsed.atoms).toHaveLength(4);
    expect(parsed.bonds).toHaveLength(4);
  });

  it('parses elements and x,y coordinates (z is dropped)', () => {
    const { atoms } = parseMolfile(TEST_MOLECULE);
    expect(atoms[0]).toEqual({ element: 'C', x: 0, y: 0 });
    expect(atoms[1]).toEqual({ element: 'C', x: 1, y: 0 });
    expect(atoms[2]).toEqual({ element: 'O', x: 2, y: 0 });
    expect(atoms[3]).toEqual({ element: 'Cl', x: 0, y: 1 });
    // No z key on the 2D atom spec.
    expect(Object.keys(atoms[0]).sort()).toEqual(['element', 'x', 'y']);
  });

  it('converts 1-based molfile indices to 0-based from/to', () => {
    const { bonds } = parseMolfile(TEST_MOLECULE);
    expect(bonds[0].from).toBe(0);
    expect(bonds[0].to).toBe(1);
    expect(bonds[2].from).toBe(0);
    expect(bonds[2].to).toBe(3);
  });

  it('parses bond orders', () => {
    const { bonds } = parseMolfile(TEST_MOLECULE);
    expect(bonds[0].order).toBe(2); // double
    expect(bonds[1].order).toBe(1); // single
  });

  it('parses wedge and dash stereo styles', () => {
    const { bonds } = parseMolfile(TEST_MOLECULE);
    expect(bonds[0].type).toBe('normal');
    expect(bonds[2].type).toBe('wedge'); // stereo 1
    expect(bonds[3].type).toBe('dash'); // stereo 6
  });

  it('tolerates CRLF line endings', () => {
    const crlf = TEST_MOLECULE.replace(/\n/g, '\r\n');
    const parsed = parseMolfile(crlf);
    expect(parsed.atoms).toHaveLength(4);
    expect(parsed.bonds).toHaveLength(4);
    expect(parsed.atoms[3].element).toBe('Cl');
  });

  it('tolerates trailing blank lines', () => {
    const parsed = parseMolfile(`${TEST_MOLECULE}\n\n\n`);
    expect(parsed.atoms).toHaveLength(4);
  });

  it('maps an aromatic bond (type 4) to a single bond', () => {
    const aromatic = [
      'benzene-fragment',
      '  manim-web',
      '',
      countsLine(2, 1),
      atomLine(0, 0, 0, 'C'),
      atomLine(1, 0, 0, 'C'),
      bondLine(1, 2, 4, 0), // aromatic
      'M  END',
    ].join('\n');
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    expect(parseMolfile(aromatic).bonds[0].order).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('throws a clear error on a malformed counts line', () => {
    const bad = [
      'bad-counts',
      '  manim-web',
      '',
      'xxx  2  0  0  0  0  0  0  0  0999 V2000',
      atomLine(0, 0, 0, 'C'),
      'M  END',
    ].join('\n');
    expect(() => parseMolfile(bad)).toThrow(/atom count/);
  });

  it('throws when the record has too few lines for its counts', () => {
    const truncated = [
      'truncated',
      '  manim-web',
      '',
      countsLine(4, 4),
      atomLine(0, 0, 0, 'C'),
    ].join('\n');
    expect(() => parseMolfile(truncated)).toThrow(/too few lines/);
  });
});

describe('parseSdf', () => {
  it('returns one molecule per $$$$-separated record', () => {
    const sdf = [
      TEST_MOLECULE,
      '> <NAME>',
      'test',
      '',
      '$$$$',
      TEST_MOLECULE,
      '> <NAME>',
      'test2',
      '',
      '$$$$',
    ].join('\n');
    const records = parseSdf(sdf);
    expect(records).toHaveLength(2);
    expect(records[0].atoms).toHaveLength(4);
    expect(records[1].bonds).toHaveLength(4);
  });

  it('ignores the data-item section after the molecule', () => {
    const sdf = [TEST_MOLECULE, '> <LOGP>', '1.23', '', '$$$$'].join('\n');
    const records = parseSdf(sdf);
    expect(records).toHaveLength(1);
    expect(records[0].atoms[2].element).toBe('O');
  });

  it('throws when no molecule record is present', () => {
    expect(() => parseSdf('$$$$\n')).toThrow(/no molecule record/);
  });
});

describe('moleculeFromMolfile', () => {
  it('builds a MoleculeMobject with the right atom and bond counts', () => {
    const mol = moleculeFromMolfile(TEST_MOLECULE);
    expect(mol.numAtoms).toBe(4);
    expect(mol.numBonds).toBe(4);
  });

  it('passes options through to the MoleculeMobject', () => {
    const mol = moleculeFromMolfile(TEST_MOLECULE, { bondLength: 2 });
    const atoms = mol.getAtoms();
    // C1 is at x=1 in file units; a bondLength of 2 scales it to x=2.
    expect(atoms[1].position[0]).toBe(2);
  });

  it('builds a molecule from the first record of an SDF', () => {
    const sdf = [TEST_MOLECULE, '$$$$'].join('\n');
    const mol = moleculeFromMolfile(sdf);
    expect(mol.numAtoms).toBe(4);
  });
});

describe('parseMolfile V3000', () => {
  it('rejects a V3000 counts line instead of returning an empty molecule', () => {
    // The V3000 extended format stores atoms/bonds in `M V30` blocks, so the
    // fixed-column counts line reads zero. The parser must flag it, not return
    // a silently empty molecule.
    const v3000 = [
      'v3000-molecule',
      '  manim-web',
      '',
      '  0  0  0  0  0  0  0  0  0999 V3000',
      'M  V30 BEGIN CTAB',
      'M  V30 COUNTS 2 1 0 0 0',
      'M  V30 END CTAB',
      'M  END',
    ].join('\n');
    expect(() => parseMolfile(v3000)).toThrow(/V3000/);
  });
});
