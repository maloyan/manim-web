import { Animation, AnimationOptions } from '../../animation/Animation';
import { VMobject } from '../../core/VMobject';
import { pointFromProportionOnPath } from '../../core/VMobjectCurveMath';
import type { Vector3Tuple } from '../../core/Mobject';
import { WritingPen } from './WritingPen';

/** Options for {@link PenFollowStroke}. */
export interface PenFollowStrokeOptions extends AnimationOptions {
  /**
   * Stagger between family members of a group target, as in `Create`.
   * Default 1: members are drawn one after the other.
   */
  lagRatio?: number;
  /** Remove the pen from the scene when the animation ends. Default true. */
  removePen?: boolean;
}

/**
 * Moves a {@link WritingPen} so that its nib sits at the tip of a stroke that
 * is being revealed. At progress `alpha`, the nib is at the arc-length point
 * `alpha` of the target path, the same point a `Create` reveals up to.
 *
 * For a group target, each member that owns points is one path, drawn in
 * order, and the nib follows the member that is being drawn.
 */
export class PenFollowStroke extends Animation<WritingPen> {
  private readonly _target: VMobject;
  private readonly _lagRatio: number;
  private _members: VMobject[] = [];

  constructor(pen: WritingPen, target: VMobject, options: PenFollowStrokeOptions = {}) {
    const { lagRatio = 1, removePen = true, ...animationOptions } = options;
    super(pen, animationOptions);
    this._target = target;
    this._lagRatio = lagRatio;
    this.remover = removePen;
  }

  override begin(): void {
    this._members = this._target.familyMembersWithPoints();
    if (this._members.length === 0) {
      throw new Error('PenFollowStroke: target has no stroke points to follow');
    }
    super.begin();
    this.interpolate(0);
  }

  /** The point of the stroke tip, in world coordinates, at progress `alpha`. */
  private _tipAt(alpha: number): Vector3Tuple {
    const n = this._members.length;
    let active = 0;
    let activeAlpha = 0;
    for (let i = 0; i < n; i++) {
      const sub = this.getSubAlpha(alpha, i, n, this._lagRatio);
      if (sub > 0 || i === 0) {
        active = i;
        activeAlpha = sub;
      }
    }
    return pointFromProportionOnPath(this._members[active].getPoints(), activeAlpha);
  }

  interpolate(alpha: number): void {
    if (this._members.length === 0) return;
    this.mobject.placeNibAt(this._tipAt(alpha));
  }

  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}
