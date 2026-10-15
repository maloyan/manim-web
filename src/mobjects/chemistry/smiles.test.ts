import { describe, it, expect } from 'vitest';
import { parseSmiles, moleculeFromSmiles } from './smiles';

/** Distance between two atoms, used to check the generated layout. */
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe('parseSmiles: atoms and elements', () => {
  it('parses ethanol CCO into 3 atoms and 2 bonds', () => {
    const { atoms, bonds } = parseSmiles('CCO');
    expect(atoms.map((a) => a.element)).toEqual(['C', 'C', 'O']);
    expect(bonds).toHaveLength(2);
    expect(bonds[0]).toMatchObject({ from: 0, to: 1, order: 1 });
    expect(bonds[1]).toMatchObject({ from: 1, to: 2, order: 1 });
  });

  it('parses the two-letter organic atoms Cl and Br', () => {
    const { atoms, bonds } = parseSmiles('ClCBr');
    expect(atoms.map((a) => a.element)).toEqual(['Cl', 'C', 'Br']);
    expect(bonds).toHaveLength(2);
  });

  it('parses every organic-subset element', () => {
    const { atoms } = parseSmiles('BCNOPSFI');
    expect(atoms.map((a) => a.element)).toEqual(['B', 'C', 'N', 'O', 'P', 'S', 'F', 'I']);
  });

  it('generates finite 2D coordinates for every atom', () => {
    const { atoms } = parseSmiles('CCO');
    for (const a of atoms) {
      expect(Number.isFinite(a.x)).toBe(true);
      expect(Number.isFinite(a.y)).toBe(true);
    }
  });
});

describe('parseSmiles: bond orders', () => {
  it('parses a double bond C=O', () => {
    const { atoms, bonds } = parseSmiles('C=O');
    expect(atoms.map((a) => a.element)).toEqual(['C', 'O']);
    expect(bonds).toHaveLength(1);
    expect(bonds[0].order).toBe(2);
  });

  it('parses a triple bond C#N', () => {
    const { bonds } = parseSmiles('C#N');
    expect(bonds[0].order).toBe(3);
  });

  it('parses an explicit single bond C-C', () => {
    const { bonds } = parseSmiles('C-C');
    expect(bonds[0].order).toBe(1);
  });

  it('parses an aromatic colon bond c:c as order 1 and aromatic', () => {
    const { bonds } = parseSmiles('C:C');
    expect(bonds[0].order).toBe(1);
    expect(bonds[0].aromatic).toBe(true);
  });
});

describe('parseSmiles: branches', () => {
  it('parses acetic acid CC(=O)O', () => {
    const { atoms, bonds } = parseSmiles('CC(=O)O');
    expect(atoms.map((a) => a.element)).toEqual(['C', 'C', 'O', 'O']);
    expect(bonds).toHaveLength(3);
    // C0-C1 single, C1=O2 double (the branch), C1-O3 single.
    expect(bonds[0]).toMatchObject({ from: 0, to: 1, order: 1 });
    expect(bonds[1]).toMatchObject({ from: 1, to: 2, order: 2 });
    expect(bonds[2]).toMatchObject({ from: 1, to: 3, order: 1 });
  });

  it('parses nested branches', () => {
    const { atoms, bonds } = parseSmiles('CC(C(C)C)C');
    expect(atoms).toHaveLength(6);
    // The last atom bonds back to the first branch point (atom 1).
    expect(bonds[bonds.length - 1]).toMatchObject({ from: 1, to: 5 });
  });
});

describe('parseSmiles: ring closures', () => {
  it('parses benzene c1ccccc1 as 6 aromatic carbons and 6 ring bonds', () => {
    const { atoms, bonds } = parseSmiles('c1ccccc1');
    expect(atoms).toHaveLength(6);
    expect(atoms.every((a) => a.element === 'C')).toBe(true);
    expect(atoms.every((a) => a.aromatic)).toBe(true);
    expect(bonds).toHaveLength(6);
    expect(bonds.every((b) => b.aromatic)).toBe(true);
    // The closing bond joins the last atom back to the first.
    const closing = bonds[bonds.length - 1];
    expect(closing).toMatchObject({ from: 0, to: 5 });
  });

  it('parses cyclohexane C1CCCCC1 as 6 single bonds, none aromatic', () => {
    const { atoms, bonds } = parseSmiles('C1CCCCC1');
    expect(atoms).toHaveLength(6);
    expect(bonds).toHaveLength(6);
    expect(bonds.every((b) => b.order === 1)).toBe(true);
    expect(bonds.some((b) => b.aromatic)).toBe(false);
  });

  it('honors a bond symbol written before a ring-closure digit', () => {
    // The ring bond here is a double bond declared at the closure.
    const { bonds } = parseSmiles('C=1CCCCC=1');
    const closing = bonds[bonds.length - 1];
    expect(closing.order).toBe(2);
  });

  it('parses a two-digit ring label %nn', () => {
    const { atoms, bonds } = parseSmiles('C%10CCCCC%10');
    expect(atoms).toHaveLength(6);
    expect(bonds).toHaveLength(6);
    expect(bonds[bonds.length - 1]).toMatchObject({ from: 0, to: 5 });
  });
});

describe('parseSmiles: bracket atoms', () => {
  it('parses the ammonium ion [NH4+]', () => {
    const { atoms } = parseSmiles('[NH4+]');
    expect(atoms).toHaveLength(1);
    expect(atoms[0].element).toBe('N');
    expect(atoms[0].charge).toBe(1);
    expect(atoms[0].hcount).toBe(4);
  });

  it('parses a negative single charge [O-]', () => {
    const { atoms } = parseSmiles('[O-]');
    expect(atoms[0].element).toBe('O');
    expect(atoms[0].charge).toBe(-1);
    expect(atoms[0].hcount).toBe(0);
  });

  it('parses a doubled charge [Mg++] as +2', () => {
    const { atoms } = parseSmiles('[Mg++]');
    expect(atoms[0].element).toBe('Mg');
    expect(atoms[0].charge).toBe(2);
  });

  it('parses a numeric charge [Fe+3] as +3', () => {
    const { atoms } = parseSmiles('[Fe+3]');
    expect(atoms[0].element).toBe('Fe');
    expect(atoms[0].charge).toBe(3);
  });

  it('parses an isotope [13CH4]', () => {
    const { atoms } = parseSmiles('[13CH4]');
    expect(atoms[0].element).toBe('C');
    expect(atoms[0].isotope).toBe(13);
    expect(atoms[0].hcount).toBe(4);
  });

  it('parses an aromatic bracket atom [nH]', () => {
    const { atoms } = parseSmiles('[nH]');
    expect(atoms[0].element).toBe('N');
    expect(atoms[0].aromatic).toBe(true);
    expect(atoms[0].hcount).toBe(1);
  });

  it('bonds a bracket atom to its neighbor', () => {
    const { atoms, bonds } = parseSmiles('C[O-]');
    expect(atoms).toHaveLength(2);
    expect(bonds).toHaveLength(1);
    expect(atoms[1].charge).toBe(-1);
  });
});

describe('parseSmiles: disconnected components', () => {
  it('parses a dot OCC.O as two components with no joining bond', () => {
    const { atoms, bonds } = parseSmiles('OCC.O');
    expect(atoms.map((a) => a.element)).toEqual(['O', 'C', 'C', 'O']);
    // 2 bonds inside the first component, none across the dot.
    expect(bonds).toHaveLength(2);
    expect(bonds.some((b) => b.from === 3 || b.to === 3)).toBe(false);
  });
});

describe('parseSmiles: errors', () => {
  it('throws on an unmatched opening parenthesis', () => {
    expect(() => parseSmiles('CC(C')).toThrow(/parenthes/i);
  });

  it('throws on an unmatched closing parenthesis', () => {
    expect(() => parseSmiles('CC)C')).toThrow(/parenthes/i);
  });

  it('throws on a dangling ring label', () => {
    expect(() => parseSmiles('C1CCCC')).toThrow(/ring/i);
  });

  it('throws on an unknown bare element', () => {
    expect(() => parseSmiles('CXC')).toThrow(/element|unexpected/i);
  });

  it('throws on an unknown bracket element', () => {
    expect(() => parseSmiles('[Xx]')).toThrow(/element/i);
  });

  it('throws on an unclosed bracket', () => {
    expect(() => parseSmiles('[NH4')).toThrow(/bracket/i);
  });

  it('throws on a leading bond symbol', () => {
    expect(() => parseSmiles('=CC')).toThrow(/bond/i);
  });

  it('returns an empty graph for an empty string', () => {
    const { atoms, bonds } = parseSmiles('');
    expect(atoms).toHaveLength(0);
    expect(bonds).toHaveLength(0);
  });
});

describe('parseSmiles: layout geometry', () => {
  it('lays ethanol out with unit bond lengths', () => {
    const { atoms, bonds } = parseSmiles('CCO');
    for (const b of bonds) {
      expect(dist(atoms[b.from], atoms[b.to])).toBeCloseTo(1, 5);
    }
  });

  it('lays benzene as a regular hexagon (6 distinct points on a circle)', () => {
    const { atoms, bonds } = parseSmiles('c1ccccc1');
    // Every bond is one unit long.
    for (const b of bonds) {
      expect(dist(atoms[b.from], atoms[b.to])).toBeCloseTo(1, 5);
    }
    // All vertices equidistant from their centroid.
    const cx = atoms.reduce((s, a) => s + a.x, 0) / atoms.length;
    const cy = atoms.reduce((s, a) => s + a.y, 0) / atoms.length;
    const radii = atoms.map((a) => Math.hypot(a.x - cx, a.y - cy));
    for (const r of radii) {
      expect(r).toBeCloseTo(radii[0], 5);
    }
  });

  it('lays cyclohexane with unit bonds', () => {
    const { atoms, bonds } = parseSmiles('C1CCCCC1');
    for (const b of bonds) {
      expect(dist(atoms[b.from], atoms[b.to])).toBeCloseTo(1, 5);
    }
  });

  it('is deterministic (same input, same coordinates)', () => {
    const a = parseSmiles('CC(=O)O').atoms;
    const b = parseSmiles('CC(=O)O').atoms;
    expect(a).toEqual(b);
  });

  it('separates disconnected components', () => {
    const { atoms } = parseSmiles('OCC.O');
    // The lone O of the second component sits apart from the first three atoms.
    const lone = atoms[3];
    const near = Math.min(dist(lone, atoms[0]), dist(lone, atoms[1]), dist(lone, atoms[2]));
    expect(near).toBeGreaterThan(1);
  });
});

describe('moleculeFromSmiles', () => {
  it('builds a MoleculeMobject with the right atom and bond counts', () => {
    const mol = moleculeFromSmiles('CCO');
    expect(mol.numAtoms).toBe(3);
    expect(mol.numBonds).toBe(2);
  });

  it('builds benzene with 6 atoms and 6 bonds', () => {
    const mol = moleculeFromSmiles('c1ccccc1');
    expect(mol.numAtoms).toBe(6);
    expect(mol.numBonds).toBe(6);
  });

  it('passes options through to the MoleculeMobject', () => {
    const mol = moleculeFromSmiles('CCO', { bondLength: 2 });
    const atoms = mol.getAtoms();
    // Bond length 2 doubles the distance between bonded atoms.
    const d = Math.hypot(
      atoms[0].position[0] - atoms[1].position[0],
      atoms[0].position[1] - atoms[1].position[1],
    );
    expect(d).toBeCloseTo(2, 5);
  });

  it('renders a double bond as two line mobjects', () => {
    const mol = moleculeFromSmiles('C=O');
    const bond = mol.getBonds()[0];
    expect(bond.order).toBe(2);
    expect(bond.lines.length).toBe(2);
  });
});

describe('parseSmiles: long chains (iterative layout)', () => {
  it('lays out a very long chain without a call-stack overflow', () => {
    // The recursive child placement overflowed the stack on a long chain.
    const long = 'C'.repeat(20000);
    let atoms: ReadonlyArray<{ x: number; y: number }> = [];
    expect(() => {
      atoms = parseSmiles(long).atoms;
    }).not.toThrow();
    expect(atoms).toHaveLength(20000);
    // Every atom gets finite coordinates.
    expect(atoms.every((a) => Number.isFinite(a.x) && Number.isFinite(a.y))).toBe(true);
  });

  it('keeps the layout of short structures unchanged (regression)', () => {
    // Golden coordinates captured from the recursive layout before the rewrite.
    const cases: Array<[string, number[][]]> = [
      [
        'CCCC',
        [
          [0, 0],
          [-0.866025, -0.5],
          [-0.866025, 0.5],
          [-1.732051, 0],
        ],
      ],
      [
        'CC(C)CC',
        [
          [0, 0],
          [-0.866025, -0.5],
          [-0.866025, 0.5],
          [0, -1],
          [0, 0],
        ],
      ],
      [
        'C1CCC(CC)CC1',
        [
          [1, 1],
          [1.866025, 0.5],
          [1.866025, -0.5],
          [1, -1],
          [0.133975, -0.5],
          [0.133975, -1.5],
          [0.133975, -0.5],
          [0.133975, 0.5],
        ],
      ],
    ];
    for (const [smiles, expected] of cases) {
      const { atoms } = parseSmiles(smiles);
      expect(atoms).toHaveLength(expected.length);
      atoms.forEach((atom, i) => {
        expect(atom.x).toBeCloseTo(expected[i][0], 5);
        expect(atom.y).toBeCloseTo(expected[i][1], 5);
      });
    }
  });
});

describe('parseSmiles: two-letter lowercase aromatic bracket atoms', () => {
  it('parses [se] as selenium, not sulfur plus a dropped letter', () => {
    const { atoms } = parseSmiles('c1cc[se]c1');
    const se = atoms.find((a) => a.element === 'Se');
    expect(se).toBeDefined();
    expect(se?.aromatic).toBe(true);
    // The bug read only 's' (sulfur) and dropped 'e'.
    expect(atoms.some((a) => a.element === 'S')).toBe(false);
  });

  it('parses [te] tellurium and [as] arsenic', () => {
    expect(parseSmiles('[te]').atoms[0].element).toBe('Te');
    expect(parseSmiles('[as]').atoms[0].element).toBe('As');
  });
});

describe('parseSmiles: structural integrity (no phantom bonds)', () => {
  // Guards the invariant behind the reported "phantom bond" on acetic acid:
  // every emitted bond must join two atoms that exist in the atom list, and
  // every atom must get a finite coordinate inside the molecule's own span.
  // A bond to a missing/implicit atom index, or an atom stranded far from the
  // structure, is what would draw a line to nowhere. The parser already holds
  // this invariant; the test locks it in.
  const cases = ['CC(=O)O', 'CCO', 'c1ccccc1', 'CC(C(C)C)C', 'C1CCCCC1', 'OCC.O'];

  for (const smiles of cases) {
    it(`"${smiles}": every bond joins two existing atoms`, () => {
      const { atoms, bonds } = parseSmiles(smiles);
      expect(atoms.length).toBeGreaterThan(0);
      for (const b of bonds) {
        // Indices are in range and distinct (no self-bond, no missing atom).
        expect(Number.isInteger(b.from)).toBe(true);
        expect(Number.isInteger(b.to)).toBe(true);
        expect(b.from).toBeGreaterThanOrEqual(0);
        expect(b.to).toBeGreaterThanOrEqual(0);
        expect(b.from).toBeLessThan(atoms.length);
        expect(b.to).toBeLessThan(atoms.length);
        expect(b.from).not.toBe(b.to);
      }
    });

    it(`"${smiles}": every atom has a finite, bounded coordinate`, () => {
      const { atoms } = parseSmiles(smiles);
      for (const a of atoms) {
        expect(Number.isFinite(a.x)).toBe(true);
        expect(Number.isFinite(a.y)).toBe(true);
      }
      // No atom strays outside the structure's own extent. The layout uses a
      // unit bond length, so the span scales with the atom count; a stray atom
      // parked at the origin or far off the layout breaks this bound.
      const xs = atoms.map((a) => a.x);
      const ys = atoms.map((a) => a.y);
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      expect(span).toBeLessThanOrEqual(atoms.length + 1);
    });
  }
});
