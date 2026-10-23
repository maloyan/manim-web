/**
 * Indicate animation - draws attention to a mobject by scaling it up
 * and changing its color, then returning to the original state.
 *
 * This mimics Manim's Indicate animation, which scales the mobject up
 * to a larger size while changing to a highlight color, then returns
 * to the original state.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import type { MobjectColorState } from '../../core/MobjectTypes';
import { Animation, AnimationOptions } from '../Animation';
import { thereAndBack } from '../../rate-functions';
import { YELLOW } from '../../constants';

export interface IndicateOptions extends AnimationOptions {
  /** Scale factor at peak of indication. Default: 1.2 */
  scaleFactor?: number;
  /** Color to use for indication highlight. Default: YELLOW */
  color?: string;
}

export class Indicate extends Animation {
  /** Scale factor at peak */
  readonly scaleFactor: number;

  /** Highlight color */
  readonly indicateColor: string;

  /** Original scale */
  private _originalScale: THREE.Vector3 = new THREE.Vector3();

  /** Original color state of each family member, in getFamily() order */
  private _originalColors: { member: Mobject; state: MobjectColorState }[] = [];

  constructor(mobject: Mobject, options: IndicateOptions = {}) {
    // Use thereAndBack rate function by default for smooth there-and-back motion
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? thereAndBack,
    });
    this.scaleFactor = options.scaleFactor ?? 1.2;
    this.indicateColor = options.color ?? YELLOW;
  }

  override begin(): void {
    super.begin();
    this._originalScale.copy(this.mobject.scaleVector);
    // Per member, so a group of differently colored children keeps each
    // child's own color at the end (#856), as in Manim CE.
    this._originalColors = this.mobject
      .getFamily()
      .map((member) => ({ member, state: member._getColorState() }));
  }

  interpolate(alpha: number): void {
    // Scale interpolation: 1 -> scaleFactor -> 1
    const currentScaleFactor = 1 + (this.scaleFactor - 1) * alpha;
    this.mobject.scaleVector.set(
      this._originalScale.x * currentScaleFactor,
      this._originalScale.y * currentScaleFactor,
      this._originalScale.z * currentScaleFactor,
    );

    // Color interpolation using THREE.Color for proper blending. Set each
    // member's own color: setColor() on a group would cascade one color.
    const targetColor = new THREE.Color(this.indicateColor);
    for (const { member, state } of this._originalColors) {
      const lerpedColor = new THREE.Color(state.color).lerp(targetColor, alpha);
      member._setOwnColor('#' + lerpedColor.getHexString());
    }

    this.mobject._markDirty();
  }

  override finish(): void {
    // Restore original state
    this.mobject.scaleVector.copy(this._originalScale);
    for (const { member, state } of this._originalColors) {
      member._setColorState(state);
    }
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create an Indicate animation for a mobject.
 * Draws attention by scaling up and changing color, then returning to original.
 * @param mobject The mobject to indicate
 * @param options Indicate options (scaleFactor, color, duration, rateFunc)
 */
export function indicate(mobject: Mobject, options?: IndicateOptions): Indicate {
  return new Indicate(mobject, options);
}
