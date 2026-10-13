/**
 * Tests for MorphMolecule, a conformational morph / trajectory playback.
 *
 * The morph interpolates each atom position from its current position to a
 * target, rebuilding the bonds each frame so the sticks follow the atoms. The
 * tests drive begin / interpolate / finish directly; no GL scene is needed for
 * the position logic.
 */
import { describe, it, expect } from 'vitest';
import { Molecule3D } from './Molecule3D';
import { morphMolecule, MorphMolecule, type Conformation } from './MorphMolecule';
import { Vector3Tuple } from '../../core/Mobject';

/** A minimal water molecule: O at origin, two H, two O-H bonds. */
function water(): Molecule3D {
  return new Molecule3D({
    atoms: [
      { element: 'O', position: [0, 0, 0] },
      { element: 'H', position: [0.76, 0.59, 0] },
      { element: 'H', position: [-0.76, 0.59, 0] },
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
    ],
  });
}

/** The current sphere positions of a molecule, in atom order. */
function spherePositions(mol: Molecule3D): Vector3Tuple[] {
  return mol.getAtoms().map((a) => [a.sphere.position.x, a.sphere.position.y, a.sphere.position.z]);
}

/** Assert two position lists are element-wise close. */
function expectPositionsClose(got: Vector3Tuple[], want: Vector3Tuple[]): void {
  expect(got).toHaveLength(want.length);
  for (let i = 0; i < want.length; i++) {
    expect(got[i][0]).toBeCloseTo(want[i][0], 6);
    expect(got[i][1]).toBeCloseTo(want[i][1], 6);
    expect(got[i][2]).toBeCloseTo(want[i][2], 6);
  }
}

const TO: Conformation = [
  [0, 0, 0],
  [0.9, 0.3, 0],
  [-0.9, 0.3, 0],
];

describe('morphMolecule single target', () => {
  it('interpolate(0) holds the start positions', () => {
    const mol = water();
    const start = spherePositions(mol);
    const anim = morphMolecule({ molecule: mol, to: TO });
    anim.begin();
    anim.interpolate(0);
    expectPositionsClose(spherePositions(mol), start);
  });

  it('interpolate(1) reaches the target', () => {
    const mol = water();
    const anim = morphMolecule({ molecule: mol, to: TO });
    anim.begin();
    anim.interpolate(1);
    expectPositionsClose(spherePositions(mol), TO);
  });

  it('interpolate(0.5) sits at the midpoint', () => {
    const mol = water();
    const start = spherePositions(mol);
    const anim = morphMolecule({ molecule: mol, to: TO });
    anim.begin();
    anim.interpolate(0.5);
    const mid = start.map((s, i): Vector3Tuple => [
      (s[0] + TO[i][0]) / 2,
      (s[1] + TO[i][1]) / 2,
      (s[2] + TO[i][2]) / 2,
    ]);
    expectPositionsClose(spherePositions(mol), mid);
  });

  it('defaults runTime to 2 seconds', () => {
    const anim = morphMolecule({ molecule: water(), to: TO });
    expect(anim.duration).toBe(2);
  });

  it('honors an explicit runTime', () => {
    const anim = morphMolecule({ molecule: water(), to: TO, runTime: 5 });
    expect(anim.duration).toBe(5);
  });
});

describe('morphMolecule bonds follow atoms', () => {
  it('bond endpoints track the atoms at alpha 0.5', () => {
    const mol = water();
    const anim = morphMolecule({ molecule: mol, to: TO });
    anim.begin();
    anim.interpolate(0.5);

    const atoms = spherePositions(mol);
    const bonds = mol.getBonds();
    // Water has two bonds: O-H1 (0->1) and O-H2 (0->2).
    expect(bonds).toHaveLength(2);
    for (const bond of bonds) {
      const stick = bond.sticks[0];
      expectPositionsClose([stick.getStart()], [atoms[bond.from]]);
      expectPositionsClose([stick.getEnd()], [atoms[bond.to]]);
    }
  });

  it('rebuilds the same number of bond sticks each frame', () => {
    const mol = water();
    const before = mol.bondsGroup.length;
    const anim = morphMolecule({ molecule: mol, to: TO });
    anim.begin();
    anim.interpolate(0.3);
    expect(mol.bondsGroup.length).toBe(before);
    anim.interpolate(0.7);
    expect(mol.bondsGroup.length).toBe(before);
  });
});

describe('morphMolecule finish', () => {
  it('finish lands exactly on the target', () => {
    const mol = water();
    const anim = morphMolecule({ molecule: mol, to: TO });
    anim.begin();
    anim.interpolate(0.42);
    anim.finish();
    const got = spherePositions(mol);
    // Exact equality: finish() sets the stored target values, no drift.
    for (let i = 0; i < TO.length; i++) {
      expect(got[i]).toEqual(TO[i]);
    }
  });

  it('leaves the atom count unchanged', () => {
    const mol = water();
    expect(mol.numAtoms).toBe(3);
    const anim = morphMolecule({ molecule: mol, to: TO });
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(mol.numAtoms).toBe(3);
  });
});

describe('morphMolecule degenerate', () => {
  it('a target equal to the current positions is a no-op that still plays', () => {
    const mol = water();
    const same = spherePositions(mol);
    const anim = morphMolecule({ molecule: mol, to: same });
    anim.begin();
    expect(() => anim.interpolate(0.5)).not.toThrow();
    expectPositionsClose(spherePositions(mol), same);
    anim.finish();
    expectPositionsClose(spherePositions(mol), same);
  });
});

describe('morphMolecule validation', () => {
  it('throws when the target length does not match the atom count', () => {
    const mol = water();
    expect(() => morphMolecule({ molecule: mol, to: [[0, 0, 0]] })).toThrow(
      /one position per atom/,
    );
  });

  it('throws on a non-finite coordinate', () => {
    const mol = water();
    const bad: Conformation = [
      [0, 0, 0],
      [Number.NaN, 0, 0],
      [0, 0, 0],
    ];
    expect(() => morphMolecule({ molecule: mol, to: bad })).toThrow(/not finite/);
  });

  it('throws when neither "to" nor "frames" is given', () => {
    const mol = water();
    expect(() => morphMolecule({ molecule: mol })).toThrow(/either "to" or "frames"/);
  });

  it('throws on an empty frames array', () => {
    const mol = water();
    expect(() => morphMolecule({ molecule: mol, frames: [] })).toThrow(/at least one/);
  });

  it('throws when a frame has the wrong length', () => {
    const mol = water();
    const frames: Conformation[] = [TO, [[0, 0, 0]]];
    expect(() => morphMolecule({ molecule: mol, frames })).toThrow(/frames\[1\]/);
  });
});

describe('morphMolecule multi-frame trajectory', () => {
  const FRAME_A: Conformation = [
    [0, 0, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ];
  const FRAME_B: Conformation = [
    [0, 1, 0],
    [1, 1, 0],
    [-1, 1, 0],
  ];

  it('passes through each frame in order', () => {
    const mol = water();
    const start = spherePositions(mol);
    const anim = morphMolecule({ molecule: mol, frames: [FRAME_A, FRAME_B] });
    anim.begin();

    // Two segments: start->A over [0, 0.5], A->B over [0.5, 1].
    anim.interpolate(0);
    expectPositionsClose(spherePositions(mol), start);

    anim.interpolate(0.5);
    expectPositionsClose(spherePositions(mol), FRAME_A);

    anim.interpolate(1);
    expectPositionsClose(spherePositions(mol), FRAME_B);
  });

  it('interpolates within a segment (quarter of the way to frame A)', () => {
    const mol = water();
    const start = spherePositions(mol);
    const anim = morphMolecule({ molecule: mol, frames: [FRAME_A, FRAME_B] });
    anim.begin();
    // alpha 0.25 is halfway through segment 0 (start->A).
    anim.interpolate(0.25);
    const want = start.map((s, i): Vector3Tuple => [
      (s[0] + FRAME_A[i][0]) / 2,
      (s[1] + FRAME_A[i][1]) / 2,
      (s[2] + FRAME_A[i][2]) / 2,
    ]);
    expectPositionsClose(spherePositions(mol), want);
  });

  it('finish lands exactly on the last frame', () => {
    const mol = water();
    const anim = morphMolecule({ molecule: mol, frames: [FRAME_A, FRAME_B] });
    anim.begin();
    anim.interpolate(0.3);
    anim.finish();
    const got = spherePositions(mol);
    for (let i = 0; i < FRAME_B.length; i++) {
      expect(got[i]).toEqual(FRAME_B[i]);
    }
  });
});

describe('MorphMolecule class', () => {
  it('is an Animation with the molecule as its mobject', () => {
    const mol = water();
    const anim = morphMolecule({ molecule: mol, to: TO });
    expect(anim).toBeInstanceOf(MorphMolecule);
    expect((anim as MorphMolecule).mobject).toBe(mol);
    expect((anim as MorphMolecule).numAtoms).toBe(3);
  });
});
