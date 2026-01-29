/**
 * Speed-related animations for controlling animation playback speed.
 */

import * as THREE from 'three';
import { Animation } from '../Animation';
import { Mobject } from '../../core/Mobject';
import { linear } from '../../rate-functions';

/**
 * Speed function type: maps progress (0-1) to a speed multiplier.
 * - Values > 1 speed up the animation at that point
 * - Values < 1 slow down the animation at that point
 * - Values = 1 play at normal speed
 */
export type SpeedFunction = (t: number) => number;

export interface ChangeSpeedOptions {
  /** Rate function applied to the overall animation progress (default: linear) */
  rateFunc?: (t: number) => number;
}

/**
 * A dummy mobject for ChangeSpeed to satisfy Animation's constructor.
 * The actual mobject is handled by the wrapped animation.
 */
class SpeedWrapperMobject extends Mobject {
  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Group();
  }

  protected _createCopy(): Mobject {
    return new SpeedWrapperMobject();
  }
}

/**
 * Compute the adjusted duration based on the speed function.
 *
 * The duration is adjusted by integrating the inverse of the speed function.
 * If speed(t) = 2 for all t, the animation takes half the time.
 * If speed(t) = 0.5 for all t, the animation takes double the time.
 *
 * We use numerical integration (trapezoidal rule) to compute the adjusted duration.
 */
function computeAdjustedDuration(
  originalDuration: number,
  speedFunc: SpeedFunction,
  numSamples: number = 100
): number {
  let integral = 0;
  const dt = 1 / numSamples;

  for (let i = 0; i < numSamples; i++) {
    const t0 = i / numSamples;
    const t1 = (i + 1) / numSamples;
    const speed0 = Math.max(0.001, speedFunc(t0)); // Avoid division by zero
    const speed1 = Math.max(0.001, speedFunc(t1));
    // Trapezoidal rule: integrate 1/speed(t)
    integral += (1 / speed0 + 1 / speed1) / 2 * dt;
  }

  return originalDuration * integral;
}

/**
 * Map adjusted progress to original animation progress.
 *
 * Given progress in the adjusted time space, find the corresponding
 * progress in the original animation's time space.
 */
function mapProgressToOriginal(
  adjustedAlpha: number,
  speedFunc: SpeedFunction,
  numSamples: number = 100
): number {
  // We need to find t such that integral from 0 to t of 1/speed(s) ds = adjustedAlpha * totalIntegral
  // Use numerical search

  // First compute total integral
  let totalIntegral = 0;
  const dt = 1 / numSamples;
  const integrals: number[] = [0]; // Cumulative integrals at each sample point

  for (let i = 0; i < numSamples; i++) {
    const t0 = i / numSamples;
    const t1 = (i + 1) / numSamples;
    const speed0 = Math.max(0.001, speedFunc(t0));
    const speed1 = Math.max(0.001, speedFunc(t1));
    totalIntegral += (1 / speed0 + 1 / speed1) / 2 * dt;
    integrals.push(totalIntegral);
  }

  // Target integral value
  const targetIntegral = adjustedAlpha * totalIntegral;

  // Binary search to find t
  let low = 0;
  let high = numSamples;

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (integrals[mid] <= targetIntegral) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // Linear interpolation within the segment
  const segmentStart = integrals[low];
  const segmentEnd = integrals[Math.min(high, numSamples)];
  const segmentProgress = segmentEnd > segmentStart
    ? (targetIntegral - segmentStart) / (segmentEnd - segmentStart)
    : 0;

  return Math.min(1, Math.max(0, (low + segmentProgress) / numSamples));
}

/**
 * ChangeSpeed - Wraps an animation to modify its playback speed dynamically.
 *
 * The speed function maps progress (0-1) to a speed multiplier:
 * - speed(0.5) = 2 means at the halfway point, play at 2x speed
 * - speed(0.2) = 0.5 means at 20% progress, play at 0.5x speed (slower)
 *
 * This is useful for emphasizing certain parts of an animation by slowing them down,
 * or rushing through less important parts by speeding them up.
 *
 * @example
 * ```typescript
 * // Slow down the middle of an animation
 * const anim = changeSpeed(
 *   fadeIn(circle),
 *   (t) => t < 0.3 || t > 0.7 ? 2 : 0.5 // Fast start/end, slow middle
 * );
 *
 * // Exponential slowdown (dramatic ending)
 * const anim2 = changeSpeed(
 *   transform(square, circle),
 *   (t) => 2 - t // Starts at 2x, ends at 1x
 * );
 * ```
 */
export class ChangeSpeed extends Animation {
  /** The wrapped animation */
  readonly animation: Animation;

  /** The speed function */
  readonly speedFunc: SpeedFunction;

  /** Number of samples for numerical integration */
  private readonly _numSamples: number = 200;

  constructor(
    animation: Animation,
    speedFunc: SpeedFunction,
    options: ChangeSpeedOptions = {}
  ) {
    // Create a dummy mobject for the wrapper
    const dummyMobject = new SpeedWrapperMobject();

    // Compute adjusted duration
    const adjustedDuration = computeAdjustedDuration(
      animation.duration,
      speedFunc
    );

    super(dummyMobject, {
      duration: adjustedDuration,
      rateFunc: options.rateFunc ?? linear
    });

    this.animation = animation;
    this.speedFunc = speedFunc;
  }

  /**
   * Set up the animation - call begin on the wrapped animation
   */
  override begin(): void {
    super.begin();
    this.animation.begin();
  }

  /**
   * Map adjusted progress to original animation progress and interpolate
   */
  interpolate(alpha: number): void {
    // Map the adjusted alpha to the original animation's progress
    const originalAlpha = mapProgressToOriginal(
      alpha,
      this.speedFunc,
      this._numSamples
    );

    // Apply the wrapped animation's rate function
    const transformedAlpha = this.animation.rateFunc(originalAlpha);

    // Interpolate the wrapped animation
    this.animation.interpolate(transformedAlpha);
  }

  /**
   * Finish the wrapped animation
   */
  override finish(): void {
    this.animation.finish();
    super.finish();
  }

  /**
   * Reset both this animation and the wrapped animation
   */
  override reset(): void {
    super.reset();
    this.animation.reset();
  }
}

/**
 * Create a ChangeSpeed animation that modifies playback speed dynamically.
 *
 * @param animation The animation to wrap
 * @param speedFunc A function mapping progress (0-1) to speed multiplier
 * @param options Optional configuration
 * @returns A new ChangeSpeed animation
 *
 * @example
 * ```typescript
 * // Slow down at the end for emphasis
 * changeSpeed(fadeIn(circle), (t) => 1 + (1 - t));
 *
 * // Speed up in the middle
 * changeSpeed(rotate(square), (t) => {
 *   const mid = Math.abs(t - 0.5);
 *   return 0.5 + mid * 3; // Slow at edges, fast in middle
 * });
 * ```
 */
export function changeSpeed(
  animation: Animation,
  speedFunc: SpeedFunction,
  options?: ChangeSpeedOptions
): ChangeSpeed {
  return new ChangeSpeed(animation, speedFunc, options);
}

// Predefined speed functions for common use cases

/**
 * Linear speed ramp from startSpeed to endSpeed.
 */
export function linearSpeedRamp(startSpeed: number, endSpeed: number): SpeedFunction {
  return (t: number) => startSpeed + (endSpeed - startSpeed) * t;
}

/**
 * Speed that emphasizes (slows down) a specific portion of the animation.
 *
 * @param emphasizeStart Start of the emphasized region (0-1)
 * @param emphasizeEnd End of the emphasized region (0-1)
 * @param normalSpeed Speed outside the emphasized region
 * @param emphasizedSpeed Speed during the emphasized region (typically < normalSpeed)
 */
export function emphasizeRegion(
  emphasizeStart: number,
  emphasizeEnd: number,
  normalSpeed: number = 2,
  emphasizedSpeed: number = 0.5
): SpeedFunction {
  return (t: number) => {
    if (t >= emphasizeStart && t <= emphasizeEnd) {
      return emphasizedSpeed;
    }
    return normalSpeed;
  };
}

/**
 * Speed that rushes through (speeds up) a specific portion of the animation.
 *
 * @param rushStart Start of the rushed region (0-1)
 * @param rushEnd End of the rushed region (0-1)
 * @param normalSpeed Speed outside the rushed region
 * @param rushedSpeed Speed during the rushed region (typically > normalSpeed)
 */
export function rushRegion(
  rushStart: number,
  rushEnd: number,
  normalSpeed: number = 1,
  rushedSpeed: number = 3
): SpeedFunction {
  return (t: number) => {
    if (t >= rushStart && t <= rushEnd) {
      return rushedSpeed;
    }
    return normalSpeed;
  };
}

/**
 * Smooth speed transition using a sine-based curve.
 * Useful for creating natural-feeling speed variations.
 *
 * @param minSpeed Minimum speed (at t=0.5)
 * @param maxSpeed Maximum speed (at t=0 and t=1)
 */
export function smoothSpeedCurve(minSpeed: number, maxSpeed: number): SpeedFunction {
  return (t: number) => {
    // Cosine curve: starts at max, dips to min at middle, back to max
    const factor = (1 + Math.cos(2 * Math.PI * t)) / 2;
    return minSpeed + (maxSpeed - minSpeed) * factor;
  };
}
