/**
 * Continuous updater helpers — Manim CE `mobject_update_utils` parity.
 *
 * These mirror Manim CE's time-based updater utilities. Every updater receives
 * `dt` (seconds since the last frame) from `Mobject.update(dt)`, so the motion
 * is frame-rate independent and matches CE's `dt`-driven lambdas exactly.
 *
 * - `alwaysShift(mob, direction, rate)` shifts `mob` by `dt * rate` along a unit
 *   direction each frame (CE `always_shift`).
 * - `alwaysRotate(mob, rate, options)` rotates `mob` by `dt * rate` each frame
 *   (CE `always_rotate`).
 * - `turnAnimationIntoUpdater(animation, cycle, delay)` drives a running
 *   `Animation` from accumulated `dt`, finishing (and removing the updater)
 *   once complete, or looping forever when `cycle` is set (CE
 *   `turn_animation_into_updater`).
 * - `cycleAnimation(animation, delay)` is `turnAnimationIntoUpdater` with
 *   `cycle = true` (CE `cycle_animation`).
 *
 * dt-semantics note: manim-web's `Animation.interpolate(alpha)` is the raw
 * interpolation; the rate function is applied by `Animation.update`. CE's
 * `Animation.interpolate` applies the rate function itself. To reproduce CE's
 * eased motion, `turnAnimationIntoUpdater` feeds `animation.rateFunc(alpha)`
 * into `interpolate`. Completion is still tested on the raw (un-eased) time
 * ratio, exactly as CE tests its clipped ratio.
 */

import { Mobject, RIGHT, type AxisOrOptions, type Vector3Tuple } from '../core/Mobject';
import { Animation } from './Animation';
import { normalizeVec } from '../utils/vectors';

/**
 * CE default rotation rate: `20 * DEGREES` radians per second. manim-web has no
 * `DEGREES` constant, so the value is written out as `20 * PI / 180`.
 */
const DEFAULT_ROTATE_RATE = (20 * Math.PI) / 180;

/**
 * Continuously shift a mobject along a direction at a fixed rate.
 *
 * Adds a `dt`-based updater that shifts `mob` by `dt * rate` along the unit
 * direction each frame. The direction is normalized, so only its orientation
 * matters, not its magnitude (CE `always_shift`).
 *
 * @param mob - The mobject to shift.
 * @param direction - The shift direction; normalized before use. Default `RIGHT`.
 * @param rate - Manim units travelled per second. Default `0.1`.
 * @returns `mob`, for chaining.
 *
 * @example
 * ```typescript
 * alwaysShift(square, RIGHT, 5); // drifts right at 5 units/second
 * ```
 */
export function alwaysShift<M extends Mobject>(
  mob: M,
  direction: Vector3Tuple = RIGHT,
  rate = 0.1,
): M {
  const unit = normalizeVec(direction);
  mob.addUpdater((m, dt) => {
    m.shift([dt * rate * unit[0], dt * rate * unit[1], dt * rate * unit[2]]);
  });
  return mob;
}

/**
 * Continuously rotate a mobject at a fixed rate.
 *
 * Adds a `dt`-based updater that rotates `mob` by `dt * rate` radians each
 * frame (CE `always_rotate`).
 *
 * @param mob - The mobject to rotate.
 * @param rate - Angle in radians per second. Default `20 * PI / 180`.
 * @param options - Optional axis / about-point passed to `Mobject.rotate`.
 * @returns `mob`, for chaining.
 *
 * @example
 * ```typescript
 * alwaysRotate(triangle, 2 * Math.PI); // one full turn per second
 * ```
 */
export function alwaysRotate<M extends Mobject>(
  mob: M,
  rate: number = DEFAULT_ROTATE_RATE,
  options?: AxisOrOptions,
): M {
  mob.addUpdater((m, dt) => {
    m.rotate(dt * rate, options);
  });
  return mob;
}

/**
 * Convert a running animation into an updater on its mobject.
 *
 * Begins the animation, then adds an updater that advances it by accumulated
 * `dt`. When `cycle` is false the animation plays once, calls `finish()` at
 * completion, and removes its own updater. When `cycle` is true it loops
 * forever (CE `turn_animation_into_updater`).
 *
 * @param animation - The animation to drive. Its mobject receives the updater.
 * @param cycle - Loop forever when true; play once when false. Default `false`.
 * @param delay - Seconds to wait before the animation starts. Default `0`.
 * @returns The animation's mobject, for chaining.
 *
 * @example
 * ```typescript
 * turnAnimationIntoUpdater(new Write(words, { duration: 0.9 }));
 * scene.add(words);
 * ```
 */
export function turnAnimationIntoUpdater(animation: Animation, cycle = false, delay = 0): Mobject {
  const mobject = animation.mobject;
  animation.begin();
  let totalTime = -delay;

  const update = (m: Mobject, dt: number): void => {
    if (totalTime >= 0) {
      const runTime = animation.duration;

      if (runTime <= 0) {
        // Zero/negative duration: snap to the final state once, then detach.
        animation.interpolate(animation.rateFunc(1));
        animation.finish();
        m.removeUpdater(update);
        return;
      }

      const timeRatio = totalTime / runTime;
      let alpha: number;
      if (cycle) {
        alpha = timeRatio % 1;
      } else {
        alpha = Math.min(1, Math.max(0, timeRatio));
        if (alpha >= 1) {
          animation.interpolate(animation.rateFunc(1));
          animation.finish();
          m.removeUpdater(update);
          return;
        }
      }
      animation.interpolate(animation.rateFunc(alpha));
    }
    totalTime += dt;
  };

  mobject.addUpdater(update);
  return mobject;
}

/**
 * Loop a running animation forever as an updater on its mobject.
 *
 * Delegates to `turnAnimationIntoUpdater` with `cycle = true` (CE
 * `cycle_animation`).
 *
 * @param animation - The animation to loop.
 * @param delay - Seconds to wait before the animation starts. Default `0`.
 * @returns The animation's mobject, for chaining.
 */
export function cycleAnimation(animation: Animation, delay = 0): Mobject {
  return turnAnimationIntoUpdater(animation, true, delay);
}
