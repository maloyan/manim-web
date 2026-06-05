/**
 * MasterTimeline - Extended Timeline with segment + slide tracking for Player.
 *
 * Two granularities:
 * - **Segment**: one play() or wait() call. Pure timing unit.
 * - **Slide**: one or more contiguous segments that the user navigates as a
 *   single unit in slidesMode. Mirrors manim-slides' next_slide() concept.
 *
 * Slides are built by the recorder calling beginSlide(opts) as a boundary
 * marker; finalizeSlides() at end of recording builds the _slides array.
 * If no boundary is ever recorded each segment becomes its own slide, which
 * preserves the original per-play slidesMode behavior.
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

export interface Slide {
  /** Index in the slides array */
  readonly index: number;
  /** First segment in this slide */
  readonly startSegmentIndex: number;
  /** Last segment in this slide (inclusive) */
  readonly endSegmentIndex: number;
  /** = segments[startSegmentIndex].startTime */
  readonly startTime: number;
  /** = segments[endSegmentIndex].endTime */
  readonly endTime: number;
  /**
   * Replay this slide in slidesMode until the user navigates away
   * (→, ←, public seek out of the slide, or setSlidesMode(false)).
   * Wins over `autoNext` when both are set.
   */
  readonly loop: boolean;
  /**
   * Auto-advance to the next slide when this slide finishes (slidesMode only).
   * Ignored if `loop` is also true. Final autoNext slide pauses normally.
   */
  readonly autoNext: boolean;
}

export interface SlideOptions {
  /** Replay this slide in slidesMode until the user advances. */
  loop?: boolean;
  /** Auto-advance to the next slide when this slide finishes (slidesMode only). */
  autoNext?: boolean;
}

export class MasterTimeline extends Timeline {
  private _segments: Segment[] = [];
  private _slides: Slide[] = [];
  /**
   * Slide boundaries recorded by beginSlide() during recording. Each entry
   * means "the segment at this index starts a new slide with these opts."
   * Consumed by finalizeSlides().
   */
  private _slideBoundaries: { atSegmentIndex: number; opts: SlideOptions }[] = [];
  /**
   * Maps mobjects to the segment index where they first appear.
   * Used by seek() to hide mobjects that haven't been introduced yet.
   */
  private _mobjectFirstSegment: Map<Animation['mobject'], number> = new Map();
  /**
   * Saves each mobject's original opacity at addSegment() time,
   * before any seek() hides it. Used to restore the correct opacity
   * before animation begin() runs, preventing opacity corruption.
   */
  private _savedMobjectOpacities: Map<Animation['mobject'], number> = new Map();

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

    // Restore all mobjects to their original opacity before replaying.
    // This ensures animation begin() captures the correct opacity,
    // even if a previous begin() captured a value corrupted by hiding.
    for (const [mobject, opacity] of this._savedMobjectOpacities) {
      mobject.opacity = opacity;
    }

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
   * Override update to restore opacity for mobjects whose introducing
   * segment starts during this tick. seek() hides future mobjects by
   * setting opacity=0; this restores them exactly when playback crosses
   * their segment boundary (not every frame).
   */
  override update(dt: number): void {
    const prevTime = this.getCurrentTime();

    // Restore original opacity for hidden future mobjects before super.update()
    // so that animation begin() captures the correct value when the segment starts.
    // Without this, Create animations using the opacity fallback path would capture
    // opacity=0 (set by seek()) and compute 0*alpha=0 forever.
    for (const [mobject, segIndex] of this._mobjectFirstSegment) {
      const seg = this._segments[segIndex];
      if (seg && prevTime < seg.startTime) {
        const savedOpacity = this._savedMobjectOpacities.get(mobject);
        if (savedOpacity !== undefined) {
          mobject.opacity = savedOpacity;
        }
      }
    }

    super.update(dt);
    const newTime = this.getCurrentTime();

    // Re-hide mobjects whose introducing segment still hasn't started
    // and were not added immediately via `scene.add()`.
    for (const [mobject, segIndex] of this._mobjectFirstSegment) {
      const seg = this._segments[segIndex];
      if (seg && newTime < seg.startTime && !mobject.createdAtBeginning) {
        mobject.opacity = 0;
      }
    }
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

    // Track which segment first introduces each mobject and save its
    // original opacity before any seek() hides it.
    for (const anim of animations) {
      if (!this._mobjectFirstSegment.has(anim.mobject)) {
        this._mobjectFirstSegment.set(anim.mobject, segmentIndex);
        this._savedMobjectOpacities.set(anim.mobject, anim.mobject.opacity);
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
   * Record a slide boundary: the next segment added will start a new slide
   * with the given options. Inspired by manim-slides' `next_slide(...)` — the
   * options configure the slide that *follows* this call.
   *
   * If no boundary is ever recorded, every segment becomes its own slide
   * (per-play behavior, used by existing slidesMode callers).
   *
   * Calling `beginSlide()` twice at the same segment index (i.e. with no
   * intervening play/wait) drops the earlier call's options, since an
   * empty slide cannot carry options into anything that will play. We warn
   * to surface the likely user error.
   */
  beginSlide(opts: SlideOptions = {}): void {
    const atSegmentIndex = this._segments.length;
    const last = this._slideBoundaries[this._slideBoundaries.length - 1];
    if (
      last &&
      last.atSegmentIndex === atSegmentIndex &&
      (last.opts.loop || last.opts.autoNext) &&
      typeof console !== 'undefined'
    ) {
      console.warn(
        'MasterTimeline.beginSlide: consecutive nextSlide() calls with no play()/wait() between them — previous opts ' +
          JSON.stringify(last.opts) +
          ' will be dropped.',
      );
    }
    this._slideBoundaries.push({ atSegmentIndex, opts });
  }

  /**
   * Build the `_slides` array from recorded segments and slide boundaries.
   * Call once after the recording builder finishes; idempotent — calling
   * twice with the same `_segments` / `_slideBoundaries` produces the same
   * `_slides`.
   *
   * - No boundaries recorded: each segment is its own slide.
   * - Otherwise: segments before the first boundary form an implicit slide 0
   *   with default opts; each boundary opens a new slide with its opts that
   *   captures all subsequent segments up to the next boundary (or the end).
   *
   * Empty slides (consecutive boundaries with no plays between them) are
   * skipped — they have no animations and no duration to occupy.
   *
   * Throws if any slide carries `loop: true` but has zero total duration,
   * since the player would rewind every frame.
   */
  finalizeSlides(): void {
    this._slides = [];
    if (this._segments.length === 0) return;

    if (this._slideBoundaries.length === 0) {
      // Auto-boundary: each segment becomes its own slide with default opts.
      for (const seg of this._segments) {
        this._slides.push(this._buildSlide(seg.index, seg.index, {}));
      }
      return;
    }

    // Manual boundary mode. Synthesise a leading boundary at index 0 if the
    // first user boundary is later, so plays before it form slide 0 with
    // default opts.
    const boundaries = [...this._slideBoundaries];
    if (boundaries[0].atSegmentIndex > 0) {
      boundaries.unshift({ atSegmentIndex: 0, opts: {} });
    }
    // Synthesise a trailing boundary at segments.length so the last slide
    // has a well-defined end.
    boundaries.push({ atSegmentIndex: this._segments.length, opts: {} });

    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i].atSegmentIndex;
      const end = boundaries[i + 1].atSegmentIndex - 1;
      if (end < start) continue; // empty slide — skip
      this._slides.push(this._buildSlide(start, end, boundaries[i].opts));
    }
  }

  /**
   * Single construction site for Slide: enforces invariants, normalises opts
   * (`loop` wins over `autoNext`), and validates zero-duration loops.
   */
  private _buildSlide(start: number, end: number, opts: SlideOptions): Slide {
    const startSeg = this._segments[start];
    const endSeg = this._segments[end];
    if (!startSeg || !endSeg || end < start) {
      throw new Error(
        `MasterTimeline._buildSlide: invalid segment range [${start}..${end}] for ${this._segments.length} segments.`,
      );
    }
    const loop = opts.loop ?? false;
    if (loop && endSeg.endTime <= startSeg.startTime) {
      throw new Error(
        'MasterTimeline.finalizeSlides: cannot loop a zero-duration slide (would rewind every frame).',
      );
    }
    // Normalize: loop wins over autoNext so the runtime branch and the type
    // tell the same story.
    const autoNext = loop ? false : (opts.autoNext ?? false);
    return {
      index: this._slides.length,
      startSegmentIndex: start,
      endSegmentIndex: end,
      startTime: startSeg.startTime,
      endTime: endSeg.endTime,
      loop,
      autoNext,
    };
  }

  /**
   * Get all segments.
   */
  getSegments(): readonly Segment[] {
    return this._segments;
  }

  /**
   * Get all slides.
   */
  getSlides(): readonly Slide[] {
    return this._slides;
  }

  /**
   * Get the slide active at the given time. Returns `null` if `time` is
   * before the first slide's startTime or no slides exist.
   */
  getSlideAtTime(time: number): Slide | null {
    for (let i = this._slides.length - 1; i >= 0; i--) {
      if (time >= this._slides[i].startTime) {
        return this._slides[i];
      }
    }
    return null;
  }

  /**
   * Get the currently-active slide based on _currentTime.
   */
  getCurrentSlide(): Slide | null {
    return this.getSlideAtTime(this.getCurrentTime());
  }

  /** Number of slides built by finalizeSlides(). */
  get slideCount(): number {
    return this._slides.length;
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
 * Factory function to create a MasterTimeline.
 * @returns A new MasterTimeline instance
 */
export function masterTimeline(): MasterTimeline {
  return new MasterTimeline();
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
  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    return this._flattenAsContainer(worldMatrix);
  }
  private static _instance: DummyMobject | null = null;

  static get instance(): DummyMobject {
    if (!DummyMobject._instance) {
      DummyMobject._instance = new DummyMobject();
    }
    return DummyMobject._instance;
  }

  override copy(): Mobject {
    return new DummyMobject();
  }

  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Object3D();
  }
}
