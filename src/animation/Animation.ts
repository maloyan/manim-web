/**
 * Base Animation class for all animations in manimweb.
 * Animations transform mobjects over time.
 */

import { Mobject } from '../core/Mobject';
import { RateFunction, smooth } from '../rate-functions';

export type { RateFunction };

export interface AnimationOptions {
  /** Duration of the animation in seconds (default: 1) */
  duration?: number;
  /** Rate function controlling the animation's pacing (default: smooth) */
  rateFunc?: RateFunction;
  /** Shift direction for fade animations */
  shift?: [number, number, number];
}

export abstract class Animation {
  /** The mobject being animated */
  readonly mobject: Mobject;

  /** Duration of the animation in seconds */
  readonly duration: number;

  /** Rate function controlling the animation's pacing */
  readonly rateFunc: RateFunction;

  /** Time when the animation started (set by Timeline) */
  protected _startTime: number | null = null;

  /** Whether the animation has finished */
  protected _isFinished: boolean = false;

  /** Track if begin() has been called */
  protected _hasBegun: boolean = false;

  /**
   * If true, the scene will remove this mobject after the animation finishes.
   * Used by FadeOut (like Python manim's remover=True).
   */
  remover: boolean = false;

  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    this.mobject = mobject;
    this.duration = options.duration ?? 1;
    this.rateFunc = options.rateFunc ?? smooth;
  }

  /**
   * Called when the animation starts.
   * Subclasses can override to set up initial state.
   */
  begin(): void {
    this._hasBegun = true;
    this._isFinished = false;
  }

  /**
   * Called when the animation ends.
   * Subclasses can override to clean up or finalize state.
   */
  finish(): void {
    this._isFinished = true;
  }

  /**
   * Apply the animation at a given progress value.
   * @param alpha Progress from 0 (start) to 1 (end)
   */
  abstract interpolate(alpha: number): void;

  /**
   * Update the animation for the current frame.
   * @param _dt Time delta since last frame (unused, but available for subclasses)
   * @param currentTime Current time in the timeline
   */
  update(_dt: number, currentTime: number): void {
    if (this._startTime === null) {
      this._startTime = currentTime;
    }

    if (!this._hasBegun) {
      this.begin();
    }

    // Calculate raw progress (0 to 1)
    const elapsed = currentTime - this._startTime;
    const rawAlpha = this.duration > 0
      ? Math.min(1, Math.max(0, elapsed / this.duration))
      : 1;

    // Apply rate function to get transformed progress
    const alpha = this.rateFunc(rawAlpha);

    // Apply the interpolation
    this.interpolate(alpha);

    // Check if finished
    if (rawAlpha >= 1 && !this._isFinished) {
      this.finish();
    }
  }

  /**
   * Check if the animation has finished
   */
  isFinished(): boolean {
    return this._isFinished;
  }

  /**
   * Reset the animation to its initial state
   */
  reset(): void {
    this._startTime = null;
    this._isFinished = false;
    this._hasBegun = false;
  }

  /**
   * Get the start time of this animation (set by Timeline)
   */
  get startTime(): number | null {
    return this._startTime;
  }

  /**
   * Set the start time of this animation (used by Timeline)
   */
  set startTime(time: number | null) {
    this._startTime = time;
  }
}
