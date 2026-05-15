/**
 * RecordingScene - the scene proxy passed to `Player.sequence(builder)`.
 *
 * Captures `play()` / `wait()` / `nextSlide()` calls into the player's
 * MasterTimeline without actually running animations. Visible to user code
 * only via the builder callback; not exported from the public surface.
 */

import { Scene } from '../core/Scene';
import { Animation } from '../animation/Animation';
import { AnimationGroup } from '../animation/AnimationGroup';
import { MasterTimeline, SlideOptions } from '../animation/MasterTimeline';

export class RecordingScene {
  private _realScene: Scene;
  private _masterTimeline: MasterTimeline;

  constructor(scene: Scene, masterTimeline: MasterTimeline) {
    this._realScene = scene;
    this._masterTimeline = masterTimeline;
  }

  /** Proxy for scene.play() — records animations into the master timeline. */
  async play(...animations: Animation[]): Promise<void> {
    if (animations.length === 0) return;

    // Collect all nested animations for scene.add + begin()
    const allAnimations = this._collectAll(animations);

    // Sync geometry so begin() can detect children
    for (const anim of allAnimations) {
      if (anim.mobject._dirty) {
        anim.mobject._syncToThree();
        anim.mobject._dirty = false;
      }
    }

    // Record segment BEFORE begin() so addSegment captures the correct
    // pre-animation opacity. begin() may modify mobject opacity (e.g.
    // Create's opacity fallback sets it to 0), which would corrupt the
    // saved value used for visibility restoration during seek/playback.
    this._masterTimeline.addSegment(animations);

    // Initialize top-level animations
    for (const anim of animations) {
      anim.begin();
    }

    // Add to real scene (so they're visible when we seek)
    for (const anim of allAnimations) {
      if (!this._realScene.mobjects.has(anim.mobject)) {
        this._realScene.add(anim.mobject);
        // Mark as animation-introduced so MasterTimeline hides it
        // until its segment starts (scene.add sets createdAtBeginning=true
        // which would bypass the hiding logic in MasterTimeline.update).
        anim.mobject.createdAtBeginning = false;
      }
    }
  }

  /**
   * Start a new slide. Inspired by manim-slides' `Scene.next_slide(...)`:
   * options apply to the slide that *follows* this call (every play()/wait()
   * up to the next `nextSlide()` belongs to that slide).
   *
   * Supported options: `{ loop, autoNext }`. manim-slides' `name`,
   * `playback_rate`, and `notes` are not implemented.
   *
   * If `nextSlide()` is never called inside a `sequence()`, each play()/wait()
   * becomes its own slide. The moment the first `nextSlide()` appears, all
   * plays in the sequence — including any before that first call — are grouped
   * by boundary; plays before the first boundary form an implicit slide 0 with
   * default options.
   */
  async nextSlide(opts: SlideOptions = {}): Promise<void> {
    this._masterTimeline.beginSlide(opts);
  }

  /** Proxy for scene.wait() — records a wait segment. */
  async wait(duration: number = 1): Promise<void> {
    this._masterTimeline.addWaitSegment(duration);
  }

  /** Pass-through: add mobjects directly to the scene. */
  add(...args: Parameters<Scene['add']>): ReturnType<Scene['add']> {
    return this._realScene.add(...args);
  }

  /** Pass-through: remove mobjects from the scene. */
  remove(...args: Parameters<Scene['remove']>): ReturnType<Scene['remove']> {
    return this._realScene.remove(...args);
  }

  /** Pass-through: access the camera. */
  get camera() {
    return this._realScene.camera;
  }

  /** Pass-through: batch updates. */
  batch(callback: () => void): void {
    this._realScene.batch(callback);
  }

  private _collectAll(animations: Animation[]): Animation[] {
    const result: Animation[] = [];
    for (const anim of animations) {
      result.push(anim);
      if (anim instanceof AnimationGroup) {
        result.push(...this._collectAll(anim.animations));
      }
    }
    return result;
  }
}
