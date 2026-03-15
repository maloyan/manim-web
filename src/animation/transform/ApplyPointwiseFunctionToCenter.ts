/**
 * ApplyPointwiseFunctionToCenter animation -- applies a pointwise function
 * relative to each mobject's center rather than absolute coordinates.
 *
 * For each VMobject in the family tree it:
 * 1. Shifts all points so the mobject's center is at the origin
 * 2. Applies the user-supplied pointwise function
 * 3. Shifts back to the original center
 *
 * This is useful for applying the same transformation (e.g. scaling, rotation)
 * to multiple mobjects, each relative to its own center.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { lerpPoint } from '../../utils/math';

export interface ApplyPointwiseFunctionToCenterOptions extends AnimationOptions {
  /** Function to apply to each center-relative point [x, y, z] => [x', y', z'] */
  func?: (point: number[]) => number[];
}

interface VMobjectLike {
  getPoints(): number[][];
  setPoints(pts: number[][]): void;
}

function isVMobjectLike(m: unknown): m is VMobjectLike {
  const obj = m as Record<string, unknown>;
  return typeof obj.getPoints === 'function' && typeof obj.setPoints === 'function';
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
 * ApplyPointwiseFunctionToCenter -- applies a pointwise function relative to
 * each VMobject's center, then interpolates from start to target.
 */
export class ApplyPointwiseFunctionToCenter extends Animation {
  readonly func: (point: number[]) => number[];
  private _snapshots: ChildSnapshot[] = [];

  constructor(
    mobject: Mobject,
    func: (point: number[]) => number[],
    options?: Omit<ApplyPointwiseFunctionToCenterOptions, 'func'>,
  ) {
    super(mobject, options ?? {});
    this.func = func;
  }

  override begin(): void {
    super.begin();

    this._snapshots = [];
    const _v = new THREE.Vector3();

    for (const mob of this.mobject.getFamily()) {
      if (isVMobjectLike(mob)) {
        const startPoints = mob.getPoints();
        if (startPoints.length === 0) continue;

        // Get the center of this particular mobject
        const center = (mob as Mobject).getCenter();

        // Get the Three.js object to transform local <-> world space.
        const threeObj = (mob as Mobject)._threeObject;
        let worldMatrix: THREE.Matrix4 | null = null;
        let inverseWorld: THREE.Matrix4 | null = null;

        if (threeObj) {
          threeObj.updateWorldMatrix(true, false);
          worldMatrix = threeObj.matrixWorld;
          inverseWorld = worldMatrix.clone().invert();
        }

        let targetPoints: number[][];
        if (worldMatrix && inverseWorld) {
          targetPoints = startPoints.map((p) => {
            // Transform to world space
            _v.set(p[0], p[1], p[2]).applyMatrix4(worldMatrix!);
            // Shift to center-relative coordinates
            const relPoint = [_v.x - center[0], _v.y - center[1], _v.z - center[2]];
            // Apply function in center-relative space
            const result = this.func(relPoint);
            // Shift back from center-relative
            _v.set(result[0] + center[0], result[1] + center[1], result[2] + center[2]);
            // Transform back to local space
            _v.applyMatrix4(inverseWorld!);
            return [_v.x, _v.y, _v.z];
          });
        } else {
          targetPoints = startPoints.map((p) => {
            // Shift to center-relative coordinates
            const relPoint = [p[0] - center[0], p[1] - center[1], p[2] - center[2]];
            // Apply function in center-relative space
            const result = this.func(relPoint);
            // Shift back from center-relative
            return [result[0] + center[0], result[1] + center[1], result[2] + center[2]];
          });
        }

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
export function applyPointwiseFunctionToCenter(
  mobject: Mobject,
  func: (point: number[]) => number[],
  options?: Omit<ApplyPointwiseFunctionToCenterOptions, 'func'>,
): ApplyPointwiseFunctionToCenter {
  return new ApplyPointwiseFunctionToCenter(mobject, func, options);
}
