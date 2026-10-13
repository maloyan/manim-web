/**
 * dockLigand - the ligand-docking animation composer.
 *
 * Docking is the headline move of the molecular module: a ligand flies in from
 * an offset above the binding pocket, optionally tumbling, and settles at the
 * pocket center. {@link dockLigand} places the ligand at the start offset and
 * returns one {@link Animation} that the caller plays with `scene.play(...)`.
 *
 * The animation composes two existing animations in one {@link AnimationGroup}:
 *  - a {@link Rotate} (the tumble, about the Y axis through the ligand center),
 *  - a {@link Shift} (the straight approach from the offset to the pocket).
 * The Shift runs last each frame, so it owns the final position and the ligand
 * lands exactly on the target.
 *
 * Camera orbit is the scene's job, not this function's. The caller can call
 * `scene.beginAmbientCameraRotation(rate)` separately to orbit while docking.
 *
 * @example
 * ```typescript
 * const ligand = new Molecule3D({ atoms, bonds });
 * scene.add(ligand);
 * scene.beginAmbientCameraRotation(0.2);
 * await scene.play(dockLigand({ ligand, target: pocket.getCenter() }));
 * ```
 */

import { Animation } from '../../animation/Animation';
import { AnimationGroup } from '../../animation/AnimationGroup';
import { Shift } from '../../animation/movement/Shift';
import { Rotate } from '../../animation/movement/Rotate';
import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';

/** Options for {@link dockLigand}. */
export interface DockLigandOptions {
  /** The ligand to dock (a {@link Group}, e.g. a Molecule3D). */
  ligand: Group;
  /** The pocket center the ligand docks into. */
  target: Vector3Tuple;
  /** Where the ligand flies in from, relative to the target. Default: `[0, 0, 8]`. */
  startOffset?: Vector3Tuple;
  /** The animation duration in seconds. Default: 2. */
  runTime?: number;
  /** Tumble the ligand while it approaches. Default: true. */
  spin?: boolean;
  /** The tumble angle in radians. Default: `2 * PI`. */
  spinAngle?: number;
}

/**
 * Compose the docking animation. The ligand is moved to `target + startOffset`
 * at construction, so the caller only adds it to the scene and plays the result.
 *
 * @param options - The docking options.
 * @returns An {@link Animation} (an {@link AnimationGroup}) moving the ligand to
 *   the target while optionally spinning it.
 */
export function dockLigand(options: DockLigandOptions): Animation {
  const { ligand, target } = options;
  const startOffset = options.startOffset ?? [0, 0, 8];
  const runTime = options.runTime ?? 2;
  const spin = options.spin ?? true;
  const spinAngle = options.spinAngle ?? 2 * Math.PI;

  // Place the ligand at the start, then approach the target by -startOffset.
  ligand.moveTo([
    target[0] + startOffset[0],
    target[1] + startOffset[1],
    target[2] + startOffset[2],
  ]);
  const direction: Vector3Tuple = [-startOffset[0], -startOffset[1], -startOffset[2]];

  const animations: Animation[] = [];
  // Rotate is pushed first so Shift interpolates last and owns the final
  // position; the ligand lands exactly on the target.
  if (spin) {
    animations.push(new Rotate(ligand, { angle: spinAngle, axis: [0, 1, 0], duration: runTime }));
  }
  animations.push(new Shift(ligand, { direction, duration: runTime }));

  return new AnimationGroup(animations, { lagRatio: 0 });
}
