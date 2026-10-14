/**
 * MorphMolecule - a conformational morph / trajectory playback for a molecule.
 *
 * Animates a {@link Molecule3D} smoothly between sets of atom positions. This is
 * the induced-fit / MD-trajectory / open-closed visual for structural biology:
 * each atom's {@link Sphere} moves from its current position to the target, and
 * the bonds rebuild every frame so the sticks follow the atoms.
 *
 * A {@link Conformation} is one set of atom positions, in the same length and
 * order as the molecule's atoms, in the molecule's rendered coordinate space
 * (the space of {@link Molecule3D.getAtoms}`()[i].position`).
 *
 * @example
 * ```typescript
 * const water = new Molecule3D({
 *   atoms: [
 *     { element: 'O', position: [0, 0, 0] },
 *     { element: 'H', position: [0.76, 0.59, 0] },
 *     { element: 'H', position: [-0.76, 0.59, 0] },
 *   ],
 *   bonds: [{ from: 0, to: 1 }, { from: 0, to: 2 }],
 * });
 * scene.add(water);
 * // Bend the molecule: move the two hydrogens.
 * scene.play(
 *   morphMolecule({
 *     molecule: water,
 *     to: [
 *       [0, 0, 0],
 *       [0.9, 0.3, 0],
 *       [-0.9, 0.3, 0],
 *     ],
 *     runTime: 2,
 *   }),
 * );
 * ```
 */

import { Vector3Tuple } from '../../core/Mobject';
import { Animation } from '../../animation/Animation';
import { Molecule3D } from './Molecule3D';

/** One set of atom positions, one `[x, y, z]` per atom, in atom order. */
export type Conformation = Vector3Tuple[];

/** The default run time of a morph, in seconds. */
const DEFAULT_RUN_TIME = 2;

/** Options for {@link morphMolecule}. */
export interface MorphMoleculeOptions {
  /** The molecule to morph. */
  molecule: Molecule3D;
  /**
   * The target positions, one per atom, in atom order. Ignored when
   * {@link frames} is given; one of `to` or `frames` is required.
   */
  to?: Conformation;
  /**
   * A multi-frame trajectory instead of a single {@link to}. The morph plays
   * from the molecule's current positions through each frame in order.
   */
  frames?: Conformation[];
  /** The total run time in seconds. Default: 2. */
  runTime?: number;
}

/** Throw if a conformation has the wrong length or a non-finite coordinate. */
function validateFrame(frame: Conformation, numAtoms: number, label: string): void {
  if (frame.length !== numAtoms) {
    throw new Error(
      `morphMolecule: ${label} has ${frame.length} positions but the molecule ` +
        `has ${numAtoms} atoms; a conformation must have one position per atom.`,
    );
  }
  for (let i = 0; i < frame.length; i++) {
    const p = frame[i];
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1]) || !Number.isFinite(p[2])) {
      throw new Error(
        `morphMolecule: ${label} position ${i} is not finite ` +
          `([${p[0]}, ${p[1]}, ${p[2]}]); every coordinate must be a finite number.`,
      );
    }
  }
}

/** Linear interpolation between two positions. */
function lerpPosition(from: Vector3Tuple, to: Vector3Tuple, t: number): Vector3Tuple {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

/**
 * The morph animation. It captures the start conformation on {@link begin}, then
 * interpolates each atom position across the keyframes on each frame, rebuilding
 * the bonds so the sticks follow the atoms.
 *
 * A single `to` is one segment (start to target). A `frames` trajectory is one
 * segment per frame (start to frame 0, frame 0 to frame 1, ...). The alpha range
 * 0 to 1 is split evenly across the segments, so the rate function (applied by
 * the scene before `interpolate`) eases the whole trajectory.
 */
export class MorphMolecule extends Animation<Molecule3D> {
  /** The target frames, one segment end each (at least one). */
  private readonly _frames: Conformation[];
  /** The start conformation, captured on the first begin(). */
  private _start: Conformation | null = null;

  constructor(molecule: Molecule3D, frames: Conformation[], runTime: number) {
    super(molecule, { duration: runTime });
    this._frames = frames;
  }

  /** The number of atoms this morph drives. */
  get numAtoms(): number {
    return this.mobject.numAtoms;
  }

  override begin(): void {
    super.begin();
    // Snapshot the current atom positions as the first keyframe. getAtoms()
    // returns the live render positions; clone each so later moves do not mutate
    // the snapshot.
    this._start = this.mobject.getAtoms().map((a): Vector3Tuple => {
      const pos = a.sphere.position;
      return [pos.x, pos.y, pos.z];
    });
  }

  interpolate(alpha: number): void {
    const start = this._start;
    if (!start) {
      // interpolate() before begin() should not happen via the normal drive
      // path; guard so a direct call is a no-op rather than a crash.
      return;
    }
    const keyframes: Conformation[] = [start, ...this._frames];
    const segments = this._frames.length;
    const clamped = Math.min(1, Math.max(0, alpha));
    // Map the global alpha onto one segment and a local progress within it.
    const scaled = clamped * segments;
    let seg = Math.floor(scaled);
    if (seg >= segments) {
      seg = segments - 1;
    }
    const local = scaled - seg;
    const from = keyframes[seg];
    const to = keyframes[seg + 1];
    const positions = from.map((f, i) => lerpPosition(f, to[i], local));
    this.mobject.setAtomPositions(positions);
  }

  override finish(): void {
    // Land exactly on the final frame, free of any floating-point drift.
    this.mobject.setAtomPositions(this._frames[this._frames.length - 1]);
    super.finish();
  }
}

/**
 * Create a {@link MorphMolecule} animation.
 *
 * Over alpha 0 to 1, every atom's position interpolates linearly from its
 * current position to the target, and the bonds rebuild each frame so the
 * sticks follow. With {@link MorphMoleculeOptions.frames} the morph plays a
 * trajectory through each frame in order.
 *
 * @param options The molecule, the target `to` (or a `frames` trajectory) and
 *   the run time.
 * @returns An {@link Animation} to pass to `scene.play`.
 * @throws If neither `to` nor `frames` is given, if `frames` is empty, or if any
 *   conformation has the wrong length or a non-finite coordinate.
 */
export function morphMolecule(options: MorphMoleculeOptions): Animation {
  const { molecule, to, frames, runTime } = options;
  const numAtoms = molecule.numAtoms;

  let targetFrames: Conformation[];
  if (frames !== undefined) {
    if (frames.length === 0) {
      throw new Error('morphMolecule: frames must have at least one conformation.');
    }
    frames.forEach((frame, i) => validateFrame(frame, numAtoms, `frames[${i}]`));
    targetFrames = frames;
  } else if (to !== undefined) {
    validateFrame(to, numAtoms, 'to');
    targetFrames = [to];
  } else {
    throw new Error('morphMolecule: either "to" or "frames" is required.');
  }

  return new MorphMolecule(molecule, targetFrames, runTime ?? DEFAULT_RUN_TIME);
}

/** Options for {@link playTrajectory}. */
export interface PlayTrajectoryOptions {
  /** The molecule to drive. Its atom count must match every frame's length. */
  molecule: Molecule3D;
  /**
   * The trajectory frames, one conformation per frame, in frame order. Frame 0
   * is the starting conformation (for example model 1 of a multi-MODEL PDB).
   */
  frames: Conformation[];
  /** The total run time in seconds. Default: 2. */
  runTime?: number;
}

/**
 * An MD-trajectory playback animation.
 *
 * Unlike {@link MorphMolecule}, the trajectory starts at its own frame 0, not at
 * the molecule's current conformation: {@link begin} snaps the molecule to frame
 * 0 first. It then reuses the MorphMolecule segment interpolation and per-frame
 * bond rebuild to step through the remaining frames. The alpha range 0 to 1 is
 * split evenly across the segments between consecutive frames.
 */
export class MoleculeTrajectory extends MorphMolecule {
  /** The first frame, used as the explicit start conformation. */
  private readonly _firstFrame: Conformation;

  constructor(molecule: Molecule3D, frames: Conformation[], runTime: number) {
    // The morph's targets are the frames after the first. A single-frame
    // trajectory holds that one frame (the molecule stays at frame 0).
    super(molecule, frames.length > 1 ? frames.slice(1) : [frames[0]], runTime);
    this._firstFrame = frames[0];
  }

  override begin(): void {
    // Start at the recorded frame 0, not at whatever conformation the molecule
    // currently holds, so alpha 0 lands exactly on the first frame.
    this.mobject.setAtomPositions(this._firstFrame);
    super.begin();
  }
}

/**
 * Create a {@link MoleculeTrajectory} animation that plays a molecule across an
 * ordered list of frames (an MD trajectory).
 *
 * Over alpha 0 to 1, the molecule moves from frame 0 through each frame in
 * order, interpolating linearly between consecutive frames and rebuilding the
 * bonds each frame so the sticks follow the atoms. Pair it with
 * {@link parsePdbTrajectory} to play a multi-MODEL PDB.
 *
 * @param options - The molecule, the trajectory `frames` and the run time.
 * @returns An {@link Animation} to pass to `scene.play`.
 * @throws If `frames` is empty, or if any frame has the wrong length or a
 *   non-finite coordinate.
 */
export function playTrajectory(options: PlayTrajectoryOptions): Animation {
  const { molecule, frames, runTime } = options;
  if (!frames || frames.length < 1) {
    throw new Error('playTrajectory: frames must have at least one conformation.');
  }
  const numAtoms = molecule.numAtoms;
  frames.forEach((frame, i) => validateFrame(frame, numAtoms, `frames[${i}]`));
  return new MoleculeTrajectory(molecule, frames, runTime ?? DEFAULT_RUN_TIME);
}
