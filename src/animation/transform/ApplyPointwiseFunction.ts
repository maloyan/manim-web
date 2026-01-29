/**
 * ApplyPointwiseFunction animation — applies a point-wise function to ALL
 * descendant VMobjects inside a Group (or any Mobject tree).
 *
 * Unlike ApplyFunction (which works on a single VMobject), this animation
 * walks the entire family tree, captures start/target points for each
 * VMobject descendant, and interpolates them all simultaneously.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

/**
 * Helper for linear interpolation between 3D points.
 */
function lerpPoint(a: number[], b: number[], t: number): number[] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ];
}

export interface ApplyPointwiseFunctionOptions extends AnimationOptions {
  /** Function to apply to each point [x, y, z] => [x', y', z'] */
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
 * ApplyPointwiseFunction — applies a point-wise function to every VMobject
 * in the family tree and interpolates from start to target over the animation.
 */
export class ApplyPointwiseFunction extends Animation {
  readonly func: (point: number[]) => number[];
  private _snapshots: ChildSnapshot[] = [];

  constructor(
    mobject: Mobject,
    func: (point: number[]) => number[],
    options?: Omit<ApplyPointwiseFunctionOptions, 'func'>
  ) {
    super(mobject, options ?? {});
    this.func = func;
  }

  override begin(): void {
    super.begin();

    this._snapshots = [];
    for (const mob of this.mobject.getFamily()) {
      if (isVMobjectLike(mob)) {
        const startPoints = mob.getPoints();
        if (startPoints.length === 0) continue;
        const targetPoints = startPoints.map(p => this.func([...p]));
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
  options?: Omit<ApplyPointwiseFunctionOptions, 'func'>
): ApplyPointwiseFunction {
  return new ApplyPointwiseFunction(mobject, func, options);
}
