/**
 * Base Animation class for all animations in manimweb.
 * Animations transform mobjects over time.
 */

import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { RateFunction, smooth } from '../rate-functions';
import { logger } from '../utils/logger';
import typia from 'typia';

export type { RateFunction };

export interface AnimationOptions {
  /** Duration of the animation in seconds (default: 1) */
  duration?: number;
  /** Rate function controlling the animation's pacing (default: smooth) */
  rateFunc?: RateFunction;
  /** Shift direction for fade animations */
  shift?: [number, number, number];
}

/**
 * Minimal scene surface needed by Animation.cleanUpFromScene().
 * Declared here (not imported from core/Scene) to avoid a core→animation cycle.
 */
export interface AnimationScene {
  add(...mobjects: Mobject[]): void;
  remove(...mobjects: Mobject[]): void;
}

export abstract class Animation<M extends Mobject = Mobject> {
  /** The mobject being animated */
  readonly mobject: M;

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

  /**
   * Snapshot of the mobject's state before this animation first ran.
   * Captured on the first begin() call and used by reset() to restore
   * the mobject to its pre-animation visual state for clean re-seeking.
   */
  private _preAnimationState: Mobject | null = null;

  constructor(mobject: M, options: AnimationOptions = {}) {
    // Validate options via typia to generate runtime assertions.
    typia.assert<AnimationOptions>(options);
    this.mobject = mobject;
    this.duration = options.duration ?? 1;
    this.rateFunc = options.rateFunc ?? smooth;
  }

  /**
   * Called when the animation starts.
   * Subclasses can override to set up initial state.
   * On the very first call, captures a snapshot of the mobject so that
   * reset() can restore it for clean backward seeking.
   */
  begin(): void {
    if (!this._preAnimationState) {
      // `copy()` is abstract on Mobject, so a bare `new Mobject()` (no concrete
      // subclass) has no `copy` on its prototype at runtime. Such bare mobjects
      // only ever come from animation tests; detect them by prototype lookup and
      // fall back to a minimal snapshot silently. Errors thrown from _inside_ a
      // real subclass's copy() are still surfaced loudly below.
      //
      // Cleanup owed: several animation tests construct bare Mobjects and
      // animate them. They should be migrated to concrete mobjects, after which
      // this prototype check and the _captureMinimalState fallback can go.
      const hasCopy = typeof (this.mobject as { copy?: () => Mobject }).copy === 'function';
      if (!hasCopy) {
        this._preAnimationState = this._captureMinimalState();
      } else {
        try {
          this._preAnimationState = this.mobject.copy();
        } catch (err) {
          logger.warn(
            'Animation.begin(): mobject.copy() failed, using minimal state snapshot. ' +
              'Backward seeking may not fully restore this mobject.',
            err,
          );
          this._preAnimationState = this._captureMinimalState();
        }
      }
    }
    this._hasBegun = true;
    this._isFinished = false;
  }

  /**
   * Capture a minimal snapshot when copy() is unavailable.
   * Creates a plain object that looks enough like a Mobject for reset() to use.
   */
  private _captureMinimalState(): Mobject {
    const m = this.mobject;
    // Create a minimal object with the properties reset() needs
    const snapshot = Object.create(null) as Record<string, unknown>;
    snapshot.position = m.position.clone();
    snapshot.rotation = m.rotation.clone();
    snapshot.scaleVector = m.scaleVector.clone();
    snapshot.color = m.color;
    snapshot.opacity = m.opacity;
    snapshot.strokeWidth = m.strokeWidth;
    snapshot.fillOpacity = m.fillOpacity;
    return snapshot as unknown as Mobject;
  }

  /**
   * Called when the animation ends.
   * Subclasses can override to clean up or finalize state.
   */
  finish(): void {
    this._isFinished = true;
  }

  /**
   * Hook called by Scene after the animation finishes, before the next play().
   * Default: removes `mobject` if `remover` is set (FadeOut, Write({remover:true})).
   * Override for animations that need to mutate scene membership — e.g.
   * ReplacementTransform swaps source for target.
   */
  cleanUpFromScene(scene: AnimationScene): void {
    if (this.remover) {
      scene.remove(this.mobject);
    }
  }

  /**
   * Apply the animation at a given progress value.
   * @param alpha Progress from 0 (start) to 1 (end)
   */
  abstract interpolate(alpha: number): void;

  /** Linear progress of the running {@link interpolateAt} call, else null. */
  private _linearAlpha: number | null = null;

  /**
   * Apply the animation at linear progress `linearAlpha` (elapsed / duration).
   * Applies the rate function like {@link update}, and lets staggered
   * subclasses apply it per family member (see {@link getRatedSubAlpha}).
   * @param linearAlpha Linear progress from 0 (start) to 1 (end)
   */
  interpolateAt(linearAlpha: number): void {
    this._linearAlpha = linearAlpha;
    try {
      this.interpolate(this.rateFunc(linearAlpha));
    } finally {
      this._linearAlpha = null;
    }
  }

  /**
   * Manim CE's `get_sub_alpha`: remaps a global progress `alpha` into the
   * local progress of family member `index` (of `count`) under a `lagRatio`
   * stagger. With `lagRatio <= 0` (or a single member), every member tracks
   * `alpha` directly. Subclasses that stagger across a mobject's family
   * (e.g. Create) should index this by `familyMembersWithPoints()`, never by
   * rendering-layer primitives.
   */
  protected getSubAlpha(alpha: number, index: number, count: number, lagRatio: number): number {
    if (lagRatio <= 0 || count <= 1) return alpha;
    const fullLength = (count - 1) * lagRatio + 1;
    const value = alpha * fullLength;
    const lower = index * lagRatio;
    return Math.max(0, Math.min(1, value - lower));
  }

  /**
   * Like {@link getSubAlpha}, but with the rate function applied inside each
   * member's lag window, as Manim CE's `get_sub_alpha` does: the window is cut
   * from linear progress and eased on its own. Applying the rate function to
   * the whole animation and then splitting it linearly makes the first and
   * last members crawl and the middle ones rush.
   *
   * Only an {@link interpolateAt} call knows the linear progress; a direct
   * `interpolate(alpha)` call falls back to splitting `alpha` linearly.
   */
  protected getRatedSubAlpha(
    alpha: number,
    index: number,
    count: number,
    lagRatio: number,
  ): number {
    const linear = this._linearAlpha;
    if (linear === null || lagRatio <= 0 || count <= 1) {
      return this.getSubAlpha(alpha, index, count, lagRatio);
    }
    return this.rateFunc(this.getSubAlpha(linear, index, count, lagRatio));
  }

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

    const elapsed = currentTime - this._startTime;
    const rawAlpha = this.duration > 0 ? Math.min(1, Math.max(0, elapsed / this.duration)) : 1;
    this.interpolateAt(rawAlpha);

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
   * Reset the animation to its initial state.
   * Restores the mobject to its pre-animation visual state so that
   * re-seeking (especially backward) produces correct results.
   */
  reset(): void {
    if (this._preAnimationState) {
      // Restore the mobject's visual properties from the snapshot
      const saved = this._preAnimationState;
      this.mobject.position.copy(saved.position);
      this.mobject.rotation.copy(saved.rotation);
      this.mobject.scaleVector.copy(saved.scaleVector);
      this._restoreFamilyColors(saved);
      this.mobject.opacity = saved.opacity;
      this.mobject.strokeWidth = saved.strokeWidth;
      this.mobject.fillOpacity = saved.fillOpacity;

      // Restore VMobject points if applicable
      if (this.mobject instanceof VMobject && saved instanceof VMobject) {
        const pts = saved.getLocalPoints();
        if (pts && pts.length > 0) {
          this.mobject.setPoints(pts);
        }
      }

      this.mobject._markDirty();
    }
    this._startTime = null;
    this._isFinished = false;
    this._hasBegun = false;
  }

  /**
   * Restore the colors of the mobject and of every descendant from the
   * snapshot. Each node gets its own color back, without the cascade of
   * `setColor()` on a group, which would recolor every child to the group
   * color (#856).
   */
  private _restoreFamilyColors(saved: Mobject): void {
    if (typeof (saved as { getFamily?: unknown }).getFamily !== 'function') {
      // Minimal snapshot (see _captureMinimalState): own color only.
      this.mobject.color = saved.color;
      return;
    }
    const live = this.mobject.getFamily();
    const snap = saved.getFamily();
    if (live.length !== snap.length) {
      // The family changed after the snapshot: restore the root node only.
      this.mobject._setColorState(saved._getColorState());
      return;
    }
    for (let i = 0; i < live.length; i++) {
      live[i]._setColorState(snap[i]._getColorState());
    }
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
