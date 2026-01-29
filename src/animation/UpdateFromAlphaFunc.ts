/**
 * UpdateFromAlphaFunc animation that applies a function continuously.
 * Similar to UpdateFromFunc but specifically named to indicate it receives
 * the rate-function-adjusted alpha value.
 */

import { Mobject } from '../core/Mobject';
import { Animation, AnimationOptions } from './Animation';

/**
 * Animation that applies a custom function to a mobject over time.
 * The function receives the mobject and the rate-function-adjusted alpha (progress from 0 to 1).
 * This is similar to UpdateFromFunc but specifically named to match Manim's API.
 */
export class UpdateFromAlphaFunc extends Animation {
  private _func: (mobject: Mobject, alpha: number) => void;

  /**
   * Create an UpdateFromAlphaFunc animation.
   * @param mobject - The mobject to animate
   * @param func - Function called with (mobject, alpha) each frame
   * @param options - Animation options (duration, rateFunc, etc.)
   */
  constructor(
    mobject: Mobject,
    func: (mobject: Mobject, alpha: number) => void,
    options?: AnimationOptions
  ) {
    super(mobject, options);
    this._func = func;
  }

  /**
   * Apply the animation at a given progress value.
   * The alpha value has already been transformed by the rate function.
   * @param alpha Progress from 0 (start) to 1 (end), transformed by rateFunc
   */
  interpolate(alpha: number): void {
    this._func(this.mobject, alpha);
  }
}

/**
 * Factory function to create an UpdateFromAlphaFunc animation.
 * @param mobject - The mobject to animate
 * @param func - Function called with (mobject, alpha) each frame
 * @param options - Animation options (duration, rateFunc, etc.)
 * @returns A new UpdateFromAlphaFunc animation
 */
export function updateFromAlphaFunc(
  mobject: Mobject,
  func: (mobject: Mobject, alpha: number) => void,
  options?: AnimationOptions
): UpdateFromAlphaFunc {
  return new UpdateFromAlphaFunc(mobject, func, options);
}
