/**
 * Tests for playTrajectory / MoleculeTrajectory, MD-trajectory playback.
 *
 * The trajectory steps a molecule across an ordered list of frames and
 * interpolates between consecutive frames, reusing MorphMolecule's lerp and
 * per-frame bond rebuild. Unlike morphMolecule, frame 0 is the recorded first
 * conformation, not the molecule's current positions.
 */
import { describe, it, expect } from 'vitest';
import { Molecule3D } from './Molecule3D';
import { playTrajectory, MoleculeTrajectory, type Conformation } from './MorphMolecule';
import { parsePdbTrajectory } from './pdb';
import { Vector3Tuple } from '../../core/Mobject';

/** A two-atom molecule, bonded, used as a trajectory target. */
function diatomic(): Molecule3D {
  return new Molecule3D({
    atoms: [
      { element: 'C', position: [9, 9, 9] },
      { element: 'C', position: [9, 9, 9] },
    ],
    bonds: [{ from: 0, to: 1 }],
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

const FRAME_0: Conformation = [
  [0, 0, 0],
  [1, 0, 0],
];
const FRAME_1: Conformation = [
  [0, 1, 0],
  [1, 1, 0],
];
const FRAME_2: Conformation = [
  [0, 2, 0],
  [1, 2, 0],
];

describe('playTrajectory', () => {
  it('alpha 0 places atoms at frame 0 (not the molecule start)', () => {
    const mol = diatomic();
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0, FRAME_1, FRAME_2] });
    anim.begin();
    anim.interpolate(0);
    expectPositionsClose(spherePositions(mol), FRAME_0);
  });

  it('alpha 0.5 sits at the middle frame of a 3-frame trajectory', () => {
    const mol = diatomic();
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0, FRAME_1, FRAME_2] });
    anim.begin();
    anim.interpolate(0.5);
    expectPositionsClose(spherePositions(mol), FRAME_1);
  });

  it('alpha 1 reaches the last frame', () => {
    const mol = diatomic();
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0, FRAME_1, FRAME_2] });
    anim.begin();
    anim.interpolate(1);
    expectPositionsClose(spherePositions(mol), FRAME_2);
  });

  it('interpolates smoothly within a segment', () => {
    const mol = diatomic();
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0, FRAME_1, FRAME_2] });
    anim.begin();
    // alpha 0.25 is halfway through segment 0 (frame0 -> frame1).
    anim.interpolate(0.25);
    expectPositionsClose(spherePositions(mol), [
      [0, 0.5, 0],
      [1, 0.5, 0],
    ]);
  });

  it('finish lands exactly on the last frame', () => {
    const mol = diatomic();
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0, FRAME_1, FRAME_2] });
    anim.begin();
    anim.interpolate(0.3);
    anim.finish();
    const got = spherePositions(mol);
    for (let i = 0; i < FRAME_2.length; i++) {
      expect(got[i]).toEqual(FRAME_2[i]);
    }
  });

  it('a single-frame trajectory holds that frame', () => {
    const mol = diatomic();
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0] });
    anim.begin();
    anim.interpolate(0);
    expectPositionsClose(spherePositions(mol), FRAME_0);
    anim.interpolate(1);
    expectPositionsClose(spherePositions(mol), FRAME_0);
  });

  it('rebuilds the bonds so sticks follow the atoms', () => {
    const mol = diatomic();
    const before = mol.bondsGroup.length;
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0, FRAME_1] });
    anim.begin();
    anim.interpolate(0.5);
    expect(mol.bondsGroup.length).toBe(before);
    const atoms = spherePositions(mol);
    const bond = mol.getBonds()[0];
    expectPositionsClose([bond.sticks[0].getStart()], [atoms[bond.from]]);
    expectPositionsClose([bond.sticks[0].getEnd()], [atoms[bond.to]]);
  });

  it('defaults runTime to 2 and honors an explicit runTime', () => {
    expect(playTrajectory({ molecule: diatomic(), frames: [FRAME_0] }).duration).toBe(2);
    expect(playTrajectory({ molecule: diatomic(), frames: [FRAME_0], runTime: 5 }).duration).toBe(
      5,
    );
  });

  it('is a MoleculeTrajectory animation over the molecule', () => {
    const mol = diatomic();
    const anim = playTrajectory({ molecule: mol, frames: [FRAME_0, FRAME_1] });
    expect(anim).toBeInstanceOf(MoleculeTrajectory);
    expect((anim as MoleculeTrajectory).mobject).toBe(mol);
  });
});

describe('playTrajectory validation', () => {
  it('throws on an empty frames array', () => {
    expect(() => playTrajectory({ molecule: diatomic(), frames: [] })).toThrow(/at least one/i);
  });

  it('throws when a frame length does not match the atom count', () => {
    expect(() => playTrajectory({ molecule: diatomic(), frames: [FRAME_0, [[0, 0, 0]]] })).toThrow(
      /frames\[1\]/,
    );
  });

  it('throws on a non-finite coordinate', () => {
    const bad: Conformation = [
      [0, 0, 0],
      [Number.NaN, 0, 0],
    ];
    expect(() => playTrajectory({ molecule: diatomic(), frames: [bad] })).toThrow(/not finite/);
  });
});

describe('playTrajectory from a parsed multi-MODEL PDB', () => {
  it('drives the molecule across the parsed frames', () => {
    const pdb = [
      'MODEL        1',
      'ATOM      1  CA  ALA A   1       0.000   0.000   0.000  1.00  0.00           C',
      'ATOM      2  CA  GLY A   2       1.000   0.000   0.000  1.00  0.00           C',
      'ENDMDL',
      'MODEL        2',
      'ATOM      1  CA  ALA A   1       0.000   3.000   0.000  1.00  0.00           C',
      'ATOM      2  CA  GLY A   2       1.000   3.000   0.000  1.00  0.00           C',
      'ENDMDL',
    ].join('\n');
    const traj = parsePdbTrajectory(pdb);
    const mol = new Molecule3D({ atoms: traj.structure.atoms });
    const anim = playTrajectory({ molecule: mol, frames: traj.frames });
    anim.begin();
    anim.interpolate(0);
    expectPositionsClose(spherePositions(mol), traj.frames[0]);
    anim.interpolate(1);
    expectPositionsClose(spherePositions(mol), traj.frames[1]);
  });
});
