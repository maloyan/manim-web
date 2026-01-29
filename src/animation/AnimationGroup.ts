/**
 * AnimationGroup - plays multiple animations together with optional staggering.
 */

import * as THREE from 'three';
import { Animation } from './Animation';
import { Mobject } from '../core/Mobject';
import { linear } from '../rate-functions';

export interface AnimationGroupOptions {
  /**
   * Lag ratio: 0 = all parallel (default), 1 = sequential.
   * Values between 0 and 1 create overlapping animations.
   */
  lagRatio?: number;
  /** Rate function applied to the group's overall progress */
  rateFunc?: (t: number) => number;
}

/**
 * A dummy mobject for the AnimationGroup to satisfy Animation's constructor.
 * The actual mobjects are handled by the child animations.
 */
class GroupMobject extends Mobject {
  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Group();
  }

  protected _createCopy(): Mobject {
    return new GroupMobject();
  }
}

/**
 * Compute the total duration based on animations and lag ratio.
 */
function computeGroupDuration(animations: Animation[], lagRatio: number): number {
  if (animations.length === 0) {
    return 0;
  }

  if (lagRatio === 0) {
    // All parallel - duration is max of all durations
    return Math.max(...animations.map(a => a.duration));
  } else if (lagRatio >= 1) {
    // Sequential - duration is sum of all durations
    return animations.reduce((sum, a) => sum + a.duration, 0);
  } else {
    // Staggered - each animation starts lagRatio * previous duration after previous
    let computedDuration = 0;
    let currentTime = 0;
    for (let i = 0; i < animations.length; i++) {
      const endTime = currentTime + animations[i].duration;
      computedDuration = Math.max(computedDuration, endTime);
      if (i < animations.length - 1) {
        currentTime += animations[i].duration * lagRatio;
      }
    }
    return computedDuration;
  }
}

export class AnimationGroup extends Animation {
  /** Child animations */
  readonly animations: Animation[];

  /** Lag ratio */
  readonly lagRatio: number;

  /** Start times for each animation (relative to group start) */
  private _startTimes: number[] = [];

  /** End times for each animation (relative to group start) */
  private _endTimes: number[] = [];

  constructor(animations: Animation[], options: AnimationGroupOptions = {}) {
    // Create a dummy mobject for the group
    const dummyMobject = new GroupMobject();

    // Calculate duration based on animations and lag
    const lagRatio = options.lagRatio ?? 0;
    const computedDuration = computeGroupDuration(animations, lagRatio);

    super(dummyMobject, {
      duration: computedDuration,
      rateFunc: options.rateFunc ?? linear
    });

    this.animations = animations;
    this.lagRatio = lagRatio;
  }

  /**
   * Set up the animation - compute start/end times and call begin on all children
   */
  override begin(): void {
    super.begin();

    // Compute start and end times for each animation
    this._startTimes = [];
    this._endTimes = [];

    let currentStartTime = 0;

    for (let i = 0; i < this.animations.length; i++) {
      const anim = this.animations[i];
      this._startTimes.push(currentStartTime);
      this._endTimes.push(currentStartTime + anim.duration);

      // Begin the animation
      anim.begin();

      // Calculate next start time based on lag ratio
      if (this.lagRatio === 0) {
        // All start at 0 (parallel)
        currentStartTime = 0;
      } else if (this.lagRatio >= 1) {
        // Sequential - next starts when this ends
        currentStartTime += anim.duration;
      } else {
        // Staggered
        currentStartTime += anim.duration * this.lagRatio;
      }
    }
  }

  /**
   * Interpolate all child animations based on group alpha
   */
  interpolate(alpha: number): void {
    // Convert group alpha to absolute time
    const groupTime = alpha * this.duration;

    for (let i = 0; i < this.animations.length; i++) {
      const anim = this.animations[i];
      const startTime = this._startTimes[i];
      const endTime = this._endTimes[i];

      // Calculate local alpha for this animation
      let localAlpha: number;

      if (groupTime < startTime) {
        // Animation hasn't started yet
        localAlpha = 0;
      } else if (groupTime >= endTime) {
        // Animation has finished
        localAlpha = 1;
      } else {
        // Animation is in progress
        const localTime = groupTime - startTime;
        const animDuration = anim.duration;
        localAlpha = animDuration > 0 ? localTime / animDuration : 1;
      }

      // Apply the animation's rate function
      const transformedAlpha = anim.rateFunc(localAlpha);
      anim.interpolate(transformedAlpha);
    }
  }

  /**
   * Finish all child animations
   */
  override finish(): void {
    for (const anim of this.animations) {
      anim.finish();
    }
    super.finish();
  }

  /**
   * Check if all child animations have finished
   */
  override isFinished(): boolean {
    return this.animations.every(anim => anim.isFinished());
  }

  /**
   * Reset the animation group
   */
  override reset(): void {
    super.reset();
    for (const anim of this.animations) {
      anim.reset();
    }
  }
}

/**
 * Create an AnimationGroup that plays animations together.
 * @param animations Array of animations to play
 * @param options Options including lagRatio
 */
export function animationGroup(
  animations: Animation[],
  options?: AnimationGroupOptions
): AnimationGroup {
  return new AnimationGroup(animations, options);
}
