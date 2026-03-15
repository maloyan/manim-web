/**
 * UpdateFromAlphaFunc is an alias for UpdateFromFunc.
 *
 * Both classes are behaviorally identical: Animation.update() applies the
 * rate function before calling interpolate(), so the function always receives
 * the rate-adjusted alpha value. The name "UpdateFromAlphaFunc" is preserved
 * for Manim API compatibility and backward compatibility.
 */

import { Mobject } from '../core/Mobject';
import { AnimationOptions } from './Animation';
import { UpdateFromFunc } from './UpdateFromFunc';

/**
 * Animation that applies a custom function to a mobject over time.
 * The function receives the mobject and the rate-function-adjusted alpha (progress from 0 to 1).
 *
 * This is an alias for UpdateFromFunc — both classes behave identically because
 * Animation.update() applies rateFunc before calling interpolate().
 */
export class UpdateFromAlphaFunc extends UpdateFromFunc {
  // No additional behavior — extends UpdateFromFunc purely for API / backward compatibility.
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
  options?: AnimationOptions,
): UpdateFromAlphaFunc {
  return new UpdateFromAlphaFunc(mobject, func, options);
}
