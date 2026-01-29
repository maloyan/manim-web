/**
 * UpdateFromFunc animation that applies a function continuously.
 * The function receives the mobject and the current alpha value (0 to 1).
 */

import { Mobject } from '../core/Mobject';
import { Animation, AnimationOptions } from './Animation';

/**
 * Animation that applies a custom function to a mobject over time.
 * The function is called with the mobject and the current alpha (progress from 0 to 1).
 */
export class UpdateFromFunc extends Animation {
  private _func: (mobject: Mobject, alpha: number) => void;

  /**
   * Create an UpdateFromFunc animation.
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
   * @param alpha Progress from 0 (start) to 1 (end)
   */
  interpolate(alpha: number): void {
    this._func(this.mobject, alpha);
  }
}

/**
 * Factory function to create an UpdateFromFunc animation.
 * @param mobject - The mobject to animate
 * @param func - Function called with (mobject, alpha) each frame
 * @param options - Animation options (duration, rateFunc, etc.)
 * @returns A new UpdateFromFunc animation
 */
export function updateFromFunc(
  mobject: Mobject,
  func: (mobject: Mobject, alpha: number) => void,
  options?: AnimationOptions
): UpdateFromFunc {
  return new UpdateFromFunc(mobject, func, options);
}
