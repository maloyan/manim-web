/**
 * ApplyPointwiseFunction animation — applies a point-wise function to ALL
 * descendant VMobjects inside a Group (or any Mobject tree).
 *
 * Unlike ApplyFunction (which works on a single VMobject), this animation
 * walks the entire family tree, captures start/target points for each
 * VMobject descendant, and interpolates them all simultaneously.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { lerpPoint } from '../../utils/math';

export interface ApplyPointwiseFunctionOptions extends AnimationOptions {
  /** Function to apply to each point [x, y, z] => [x', y', z'] */
  func?: (point: number[]) => number[];
}

interface VMobjectLike {
  getLocalPoints(): number[][];
  setPoints(pts: number[][]): void;
}

function isVMobjectLike(m: unknown): m is VMobjectLike {
  const obj = m as Record<string, unknown>;
  return typeof obj.getLocalPoints === 'function' && typeof obj.setPoints === 'function';
}

/**
 * Snapshot of a single VMobject's start and target points.
 */
interface ChildSnapshot {
  mob: VMobjectLike;
  startPoints: number[][];
  targetPoints: number[][];
}

/**
 * ApplyPointwiseFunction — applies a point-wise function to every VMobject
 * in the family tree and interpolates from start to target over the animation.
 */
export class ApplyPointwiseFunction extends Animation {
  readonly func: (point: number[]) => number[];
  private _snapshots: ChildSnapshot[] = [];

  constructor(
    mobject: Mobject,
    func: (point: number[]) => number[],
    options?: Omit<ApplyPointwiseFunctionOptions, 'func'>,
  ) {
    super(mobject, options ?? {});
    this.func = func;
  }

  override begin(): void {
    super.begin();

    this._snapshots = [];
    const vec = new THREE.Vector3();

    for (const mob of this.mobject.getFamily()) {
      if (isVMobjectLike(mob)) {
        const startPoints = mob.getLocalPoints();
        if (startPoints.length === 0) continue;

        // Transform local ↔ world space so the user's function sees world
        // coordinates (e.g. rotated objects store points in local space).
        // Use the mobject's logical world matrix, not _threeObject.matrixWorld:
        // the Three.js node is only populated during _syncToThree, so a
        // dirty/unsynced mobject reports an identity matrix and drops the
        // position offset baked into getLocalPoints() — getPoints() composes
        // this same matrix.
        const worldMatrix = (mob as Mobject)._computeWorldMatrix();
        const inverseWorld = worldMatrix.clone().invert();

        // Transform local → world, apply func, then world → local
        const targetPoints = startPoints.map((p) => {
          vec.set(p[0], p[1], p[2]).applyMatrix4(worldMatrix);
          const worldResult = this.func([vec.x, vec.y, vec.z]);
          vec.set(worldResult[0], worldResult[1], worldResult[2]).applyMatrix4(inverseWorld);
          return [vec.x, vec.y, vec.z];
        });

        this._snapshots.push({ mob, startPoints, targetPoints });
      }
    }
  }

  interpolate(alpha: number): void {
    for (const snap of this._snapshots) {
      const interpolated: number[][] = [];
      for (let i = 0; i < snap.startPoints.length; i++) {
        interpolated.push(lerpPoint(snap.startPoints[i], snap.targetPoints[i], alpha));
      }
      snap.mob.setPoints(interpolated);
    }
    // Ensure parent tree re-syncs so child geometry rebuilds are visited
    this.mobject._markDirtyUpward();
  }

  override finish(): void {
    for (const snap of this._snapshots) {
      snap.mob.setPoints(snap.targetPoints);
    }
    this.mobject._markDirtyUpward();
    super.finish();
  }
}

/**
 * Factory helper.
 */
export function applyPointwiseFunction(
  mobject: Mobject,
  func: (point: number[]) => number[],
  options?: Omit<ApplyPointwiseFunctionOptions, 'func'>,
): ApplyPointwiseFunction {
  return new ApplyPointwiseFunction(mobject, func, options);
}
