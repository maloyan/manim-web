/**
 * Timeline - Sequencer for animations.
 * Supports GSAP-style positioning for flexible animation scheduling.
 */

import { Animation } from './Animation';

/**
 * Position parameter for adding animations to the timeline.
 * - Number: absolute time in seconds
 * - '+=N': N seconds after the last animation ends
 * - '-=N': N seconds before the last animation ends
 * - '<': same start time as the previous animation
 * - '>': end of the previous animation (default)
 */
export type PositionParam = number | string;

interface ScheduledAnimation {
  animation: Animation;
  startTime: number;
  endTime: number;
}

export class Timeline {
  /** All scheduled animations with their timing */
  private _animations: ScheduledAnimation[] = [];

  /** Total duration of the timeline */
  private _duration: number = 0;

  /** Current playback time */
  private _currentTime: number = 0;

  /** Whether the timeline is playing */
  private _isPlaying: boolean = false;

  /** Track which animations have been started */
  protected _startedAnimations: Set<Animation> = new Set();

  /**
   * Add an animation to the timeline.
   * @param animation The animation to add
   * @param position When to start the animation (default: '>' - after previous ends)
   */
  add(animation: Animation, position: PositionParam = '>'): this {
    const startTime = this._resolvePosition(position);
    const endTime = startTime + animation.duration;

    this._animations.push({
      animation,
      startTime,
      endTime,
    });

    // Update total duration
    this._duration = Math.max(this._duration, endTime);

    return this;
  }

  /**
   * Add multiple animations to play in parallel (all start at the same time).
   * @param animations The animations to add
   * @param position When to start all animations (default: '>' - after previous ends)
   */
  addParallel(animations: Animation[], position: PositionParam = '>'): this {
    const startTime = this._resolvePosition(position);

    for (const animation of animations) {
      const endTime = startTime + animation.duration;

      this._animations.push({
        animation,
        startTime,
        endTime,
      });

      // Update total duration
      this._duration = Math.max(this._duration, endTime);
    }

    return this;
  }

  /**
   * Resolve a position parameter to an absolute time.
   */
  private _resolvePosition(position: PositionParam): number {
    // If it's a number, return it directly
    if (typeof position === 'number') {
      return Math.max(0, position);
    }

    // Get the last animation's timing
    const lastAnim = this._animations[this._animations.length - 1];
    const lastEnd = lastAnim?.endTime ?? 0;
    const lastStart = lastAnim?.startTime ?? 0;

    // Parse string position
    if (position === '>') {
      // End of previous animation
      return lastEnd;
    }

    if (position === '<') {
      // Same start as previous animation
      return lastStart;
    }

    // Handle +=N and -=N patterns
    const addMatch = position.match(/^\+=(\d*\.?\d+)$/);
    if (addMatch) {
      const offset = parseFloat(addMatch[1]);
      return lastEnd + offset;
    }

    const subMatch = position.match(/^-=(\d*\.?\d+)$/);
    if (subMatch) {
      const offset = parseFloat(subMatch[1]);
      return Math.max(0, lastEnd - offset);
    }

    // Default to after previous
    console.warn(`Invalid position parameter: "${position}", using ">" instead`);
    return lastEnd;
  }

  /**
   * Seek to a specific time in the timeline.
   * @param time The time to seek to (in seconds)
   */
  seek(time: number): this {
    const prevTime = this._currentTime;
    this._currentTime = Math.max(0, Math.min(time, this._duration));

    // If seeking backwards, reset animations that haven't started yet at new time
    if (time < prevTime) {
      for (const scheduled of this._animations) {
        if (scheduled.startTime > this._currentTime) {
          scheduled.animation.reset();
          this._startedAnimations.delete(scheduled.animation);
        }
      }
    }

    // Update all active animations at the new time
    this._updateAnimationsAtTime(this._currentTime);

    return this;
  }

  /**
   * Update the timeline by a time delta.
   * @param dt Time delta in seconds
   */
  update(dt: number): void {
    if (!this._isPlaying) return;

    this._currentTime += dt;

    // Clamp to duration
    if (this._currentTime > this._duration) {
      this._currentTime = this._duration;
      this._isPlaying = false;
    }

    this._updateAnimationsAtTime(this._currentTime);
  }

  /**
   * Update all animations that should be active at the given time.
   */
  private _updateAnimationsAtTime(time: number): void {
    for (const scheduled of this._animations) {
      const { animation, startTime, endTime } = scheduled;

      // Skip animations that haven't started yet
      if (time < startTime) {
        continue;
      }

      // Start animation if not started
      if (!this._startedAnimations.has(animation)) {
        animation.startTime = startTime;
        this._startedAnimations.add(animation);
      }

      // Update animation if it's currently active
      if (time <= endTime || !animation.isFinished()) {
        animation.update(0, time);
      }
    }
  }

  /**
   * Start playing the timeline.
   */
  play(): this {
    this._isPlaying = true;
    return this;
  }

  /**
   * Pause the timeline.
   */
  pause(): this {
    this._isPlaying = false;
    return this;
  }

  /**
   * Reset the timeline to the beginning.
   */
  reset(): this {
    this._currentTime = 0;
    this._isPlaying = false;
    this._startedAnimations.clear();

    for (const scheduled of this._animations) {
      scheduled.animation.reset();
    }

    return this;
  }

  /**
   * Check if the timeline has finished playing.
   */
  isFinished(): boolean {
    return this._currentTime >= this._duration;
  }

  /**
   * Check if the timeline is currently playing.
   */
  isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Get the total duration of the timeline.
   */
  getDuration(): number {
    return this._duration;
  }

  /**
   * Get the current playback time.
   */
  getCurrentTime(): number {
    return this._currentTime;
  }

  /**
   * Get the number of animations in the timeline.
   */
  get length(): number {
    return this._animations.length;
  }

  /**
   * Clear all animations from the timeline.
   */
  clear(): this {
    this._animations = [];
    this._duration = 0;
    this._currentTime = 0;
    this._isPlaying = false;
    this._startedAnimations.clear();
    return this;
  }
}
