/**
 * MasterTimeline - Extended Timeline with segment tracking for Player.
 * Each play()/wait() call creates a "segment" that can be navigated
 * via prev/next controls (like slides in a presentation).
 */

import { Animation } from './Animation';
import { Timeline } from './Timeline';

export interface Segment {
  /** Index in the segments array */
  index: number;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
  /** Animations in this segment (empty for wait segments) */
  animations: Animation[];
  /** Whether this is a wait/pause segment */
  isWait: boolean;
}

export class MasterTimeline extends Timeline {
  private _segments: Segment[] = [];
  /**
   * Maps mobjects to the segment index where they first appear.
   * Used by seek() to hide mobjects that haven't been introduced yet.
   */
  private _mobjectFirstSegment: Map<Animation['mobject'], number> = new Map();

  /**
   * Override seek to always reset ALL animations before re-applying.
   * The base Timeline only resets future animations on backward seek,
   * which leaves already-finished animations in their final state
   * (e.g. a FadeOut'd mobject stays invisible when scrubbing back).
   */
  override seek(time: number): this {
    // Reset every segment's animations to pristine state
    for (const seg of this._segments) {
      for (const anim of seg.animations) {
        anim.reset();
      }
    }

    // Clear started tracking so _updateAnimationsAtTime re-begins them
    this._startedAnimations.clear();
    // Delegate to parent which re-applies animations at target time
    super.seek(time);

    // Hide mobjects whose introducing segment hasn't started yet.
    // This must run AFTER super.seek() because Timeline.seek() calls
    // reset() again on future animations (for backward seeks), which
    // would restore their opacity and undo our hiding.
    for (const [mobject, segIndex] of this._mobjectFirstSegment) {
      const seg = this._segments[segIndex];
      if (seg && time < seg.startTime) {
        mobject.opacity = 0;
      }
    }

    return this;
  }

  /**
   * Override reset to use seek(0) so future mobjects are hidden.
   */
  override reset(): this {
    this.seek(0);
    this.pause();
    return this;
  }

  /**
   * Add a segment containing one or more parallel animations.
   * Returns the segment's start time (for the recorder to resolve).
   */
  addSegment(animations: Animation[]): Segment {
    const startTime = this.getDuration();
    this.addParallel(animations, startTime);

    const maxDuration = Math.max(...animations.map((a) => a.duration));
    const segmentIndex = this._segments.length;
    const segment: Segment = {
      index: segmentIndex,
      startTime,
      endTime: startTime + maxDuration,
      animations,
      isWait: false,
    };
    this._segments.push(segment);

    // Track which segment first introduces each mobject
    for (const anim of animations) {
      if (!this._mobjectFirstSegment.has(anim.mobject)) {
        this._mobjectFirstSegment.set(anim.mobject, segmentIndex);
      }
    }

    return segment;
  }

  /**
   * Add a wait (pause) segment with no animations.
   */
  addWaitSegment(duration: number): Segment {
    const startTime = this.getDuration();

    // We need to advance the timeline's internal duration.
    // Create a no-op "wait animation" that just holds time.
    const waitAnim = new WaitAnimation(duration);
    this.add(waitAnim, startTime);

    const segment: Segment = {
      index: this._segments.length,
      startTime,
      endTime: startTime + duration,
      animations: [],
      isWait: true,
    };
    this._segments.push(segment);
    return segment;
  }

  /**
   * Get all segments.
   */
  getSegments(): readonly Segment[] {
    return this._segments;
  }

  /**
   * Get the segment at the given time.
   */
  getSegmentAtTime(time: number): Segment | null {
    for (let i = this._segments.length - 1; i >= 0; i--) {
      if (time >= this._segments[i].startTime) {
        return this._segments[i];
      }
    }
    return this._segments[0] ?? null;
  }

  /**
   * Get the currently-active segment based on _currentTime.
   */
  getCurrentSegment(): Segment | null {
    return this.getSegmentAtTime(this.getCurrentTime());
  }

  /**
   * Seek to the start of the next segment.
   * Returns the segment seeked to, or null if already at the end.
   */
  nextSegment(): Segment | null {
    const current = this.getCurrentSegment();
    if (!current) return null;

    const nextIdx = current.index + 1;
    if (nextIdx >= this._segments.length) return null;

    const next = this._segments[nextIdx];
    this.seek(next.startTime);
    return next;
  }

  /**
   * Seek to the start of the previous segment (or beginning of current).
   * If we're more than 0.5s into the current segment, seeks to its start.
   * Otherwise seeks to the previous segment's start.
   */
  prevSegment(): Segment | null {
    const current = this.getCurrentSegment();
    if (!current) return null;

    const elapsed = this.getCurrentTime() - current.startTime;
    if (elapsed > 0.5 && current.index >= 0) {
      // Go to start of current segment
      this.seek(current.startTime);
      return current;
    }

    const prevIdx = current.index - 1;
    if (prevIdx < 0) {
      this.seek(0);
      return current;
    }

    const prev = this._segments[prevIdx];
    this.seek(prev.startTime);
    return prev;
  }

  /**
   * Get the segment count.
   */
  get segmentCount(): number {
    return this._segments.length;
  }
}

/**
 * A no-op animation used to represent wait() durations on the timeline.
 * It needs a real Mobject reference but does nothing to it.
 */
class WaitAnimation extends Animation {
  constructor(duration: number) {
    // Create a minimal dummy mobject that satisfies the Animation contract
    super(DummyMobject.instance, { duration });
  }

  interpolate(_alpha: number): void {
    // No-op
  }

  begin(): void {
    this._hasBegun = true;
  }

  finish(): void {
    this._isFinished = true;
  }
}

/**
 * Minimal singleton mobject for WaitAnimation.
 * Never added to the scene — just satisfies the Animation constructor.
 */
import * as THREE from 'three';
import { Mobject } from '../core/Mobject';

class DummyMobject extends Mobject {
  private static _instance: DummyMobject | null = null;

  static get instance(): DummyMobject {
    if (!DummyMobject._instance) {
      DummyMobject._instance = new DummyMobject();
    }
    return DummyMobject._instance;
  }

  protected _createCopy(): Mobject {
    return new DummyMobject();
  }

  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Object3D();
  }
}
