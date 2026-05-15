/**
 * Player - Integrated playback controller for manim-web animations.
 *
 * Provides a presentation-style experience with:
 * - Play/pause, prev/next segment navigation
 * - Timeline scrubbing (drag, scroll, click)
 * - Keyboard shortcuts (space, arrows, F)
 * - Playback speed control
 * - Auto-hiding controls
 * - Fullscreen support
 *
 * Usage:
 * ```ts
 * const player = new Player(container, { width: 800, height: 450 });
 *
 * player.sequence(async (scene) => {
 *   const circle = new Circle({ radius: 1.5 });
 *   await scene.play(new Create(circle));
 *   await scene.wait(0.5);
 *   await scene.play(new FadeOut(circle));
 * });
 * ```
 */

import { Scene, SceneOptions } from '../core/Scene';
import { Animation } from '../animation/Animation';
import { AnimationGroup } from '../animation/AnimationGroup';
import { MasterTimeline, SlideOptions } from '../animation/MasterTimeline';
import { PlayerUI } from './PlayerUI';
import { PlayerController } from './PlayerController';

export interface PlayerOptions extends SceneOptions {
  /** Auto-hide controls after this many ms. 0 = never. Default 2500. */
  autoHideMs?: number;
  /** Auto-play after sequence() finishes recording. Default false. */
  autoPlay?: boolean;
  /** Loop playback. Default false. */
  loop?: boolean;
  /** Slides mode: arrows play/pause at segment boundaries like a presentation. Default false. */
  slidesMode?: boolean;
}

/**
 * A recording-scene proxy that captures play/wait calls
 * without actually running animations. Used by Player.sequence().
 */
class RecordingScene {
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
   * Start a new slide. Mirrors manim-slides' `Scene.next_slide(...)`:
   * options apply to the slide that *follows* this call (every play()/wait()
   * up to the next `nextSlide()` belongs to that slide).
   *
   * If `nextSlide()` is never called inside a `sequence()`, each play()/wait()
   * becomes its own slide.
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

export class Player {
  private _scene: Scene;
  private _masterTimeline: MasterTimeline;
  private _ui: PlayerUI;
  private _controller: PlayerController;
  private _isPlaying: boolean = false;
  private _playbackRate: number = 1;
  private _animFrameId: number | null = null;
  private _lastFrameTime: number = 0;
  private _container: HTMLElement;
  private _loop: boolean;
  private _autoPlay: boolean;
  private _slidesMode: boolean;
  /**
   * Index of the slide that slidesMode playback should stop (or loop / advance)
   * at when its endTime is reached. -1 means no target armed.
   */
  private _slidesTargetSlideIndex: number = -1;
  /**
   * Index of the slide currently being looped in slidesMode, or null if no
   * loop is active. When set, the player rewinds to the slide's startTime
   * on every endTime crossing and keeps playing until the user advances.
   */
  private _activeLoopSlideIndex: number | null = null;
  private _origWidth: number = 0;
  private _origHeight: number = 0;
  private _onFullscreenChange: () => void;

  constructor(container: HTMLElement, options: PlayerOptions = {}) {
    this._container = container;
    this._loop = options.loop ?? false;
    this._autoPlay = options.autoPlay ?? false;
    this._slidesMode = options.slidesMode ?? false;

    // Create the underlying scene
    this._scene = new Scene(container, options);

    // Create master timeline
    this._masterTimeline = new MasterTimeline();

    // Create UI
    this._ui = new PlayerUI(
      container,
      {
        onPlayPause: () => this.togglePlayPause(),
        onSeek: (t) => this.seek(t),
        onPrev: () => this.prevSegment(),
        onNext: () => this.nextSegment(),
        onSpeedChange: (r) => this.setPlaybackRate(r),
        onFullscreen: () => this.toggleFullscreen(),
        onExport: (format) => this.exportAs(format),
        onSlidesToggle: (enabled) => this.setSlidesMode(enabled),
      },
      {
        autoHideMs: options.autoHideMs,
      },
    );

    // Sync initial slides mode state
    this._ui.setSlidesMode(this._slidesMode);

    // Enable scroll-to-scrub
    this._ui.enableScrollScrub(() => this._masterTimeline.getCurrentTime());

    // Create controller (keyboard/mouse)
    this._controller = new PlayerController(container, {
      onPlayPause: () => this.togglePlayPause(),
      onPrev: () => this.prevSegment(),
      onNext: () => this.nextSegment(),
      onSeek: (t) => this.seek(t),
      onFullscreen: () => this.toggleFullscreen(),
      onSlidesToggle: () => this.setSlidesMode(!this._slidesMode),
      getCurrentTime: () => this._masterTimeline.getCurrentTime(),
      getDuration: () => this._masterTimeline.getDuration(),
    });

    // Track original dimensions for fullscreen restore
    this._origWidth = this._scene.getWidth();
    this._origHeight = this._scene.getHeight();

    // Resize scene when entering/leaving fullscreen
    this._onFullscreenChange = () => {
      if (document.fullscreenElement === this._container) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this._scene.resize(w, h);
      } else {
        this._scene.resize(this._origWidth, this._origHeight);
      }
      this._scene.render();
    };
    document.addEventListener('fullscreenchange', this._onFullscreenChange);
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Define the animation sequence. The callback receives a recording proxy
   * that captures all play()/wait() calls to build the master timeline.
   */
  async sequence(builder: (scene: RecordingScene) => Promise<void>): Promise<void> {
    // Reset
    this._masterTimeline = new MasterTimeline();
    this._activeLoopSlideIndex = null;
    this._slidesTargetSlideIndex = -1;

    // Record
    const recorder = new RecordingScene(this._scene, this._masterTimeline);
    await builder(recorder);

    // Build the slide list from recorded segments + slide boundaries.
    this._masterTimeline.finalizeSlides();

    // Set the master timeline on the scene
    this._scene.setTimeline(this._masterTimeline);

    // Seek to start to show initial state
    this._masterTimeline.seek(0);
    this._scene.render();

    // Update UI with segment markers
    this._ui.setSegments(this._masterTimeline);
    this._ui.updateTime(0, this._masterTimeline.getDuration());

    if (this._autoPlay) {
      this.play();
    }
  }

  /** Get the underlying scene for direct manipulation. */
  get scene(): Scene {
    return this._scene;
  }

  /** Get the master timeline. */
  get timeline(): MasterTimeline {
    return this._masterTimeline;
  }

  /** Whether playback is active. */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /** Start playback from current position. */
  play(): void {
    if (this._masterTimeline.isFinished()) {
      this._masterTimeline.seek(0);
    }
    this._isPlaying = true;
    this._masterTimeline.play();
    this._ui.setPlaying(true);
    if (this._slidesMode && this._slidesTargetSlideIndex < 0) {
      const current = this._masterTimeline.getCurrentSlide();
      if (current) {
        this._slidesTargetSlideIndex = current.index;
      }
    }
    this._startLoop();
  }

  /** Pause playback. */
  pause(): void {
    this._isPlaying = false;
    this._masterTimeline.pause();
    this._ui.setPlaying(false);
    this._stopLoop();
  }

  /** Toggle between play and pause. */
  togglePlayPause(): void {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /** Seek to a specific time in seconds. */
  seek(time: number): void {
    // User-initiated seek is a strong signal — drop any active slide loop and
    // its target so the next render tick doesn't snap back to the old slide.
    this._activeLoopSlideIndex = null;
    this._slidesTargetSlideIndex = -1;
    this._masterTimeline.seek(time);
    this._scene.render();
    this._ui.updateTime(this._masterTimeline.getCurrentTime(), this._masterTimeline.getDuration());
  }

  /**
   * Jump to the next slide. In slidesMode, plays through the current slide
   * to its end, then pauses (or rewinds, or auto-advances depending on the
   * slide's flags).
   *
   * Kept as `nextSegment()` for API stability; the unit of navigation is the
   * Slide (possibly multi-play). For single-play sequences each slide is one
   * play() call so the behavior matches the original per-segment navigation.
   */
  nextSegment(): void {
    if (this._slidesMode) {
      // Exiting an active loop is a special case: snap to the start of the
      // next slide (or end the deck if the loop is the last slide).
      if (this._activeLoopSlideIndex !== null) {
        const loopIdx = this._activeLoopSlideIndex;
        const slides = this._masterTimeline.getSlides();
        const loopSlide = slides[loopIdx];
        this._activeLoopSlideIndex = null;
        const nextIdx = loopIdx + 1;
        if (nextIdx >= slides.length) {
          // Final loop: land on its endTime and pause normally.
          this._masterTimeline.seek(loopSlide.endTime);
          this._slidesTargetSlideIndex = -1;
          this._isPlaying = false;
          this._masterTimeline.pause();
          this._ui.setPlaying(false);
          this._stopLoop();
          this._scene.render();
          this._ui.updateTime(
            this._masterTimeline.getCurrentTime(),
            this._masterTimeline.getDuration(),
          );
          return;
        }
        const nextSlide = slides[nextIdx];
        this._masterTimeline.seek(nextSlide.startTime);
        this._slidesTargetSlideIndex = nextIdx;
        if (!this._isPlaying) this.play();
        else this._masterTimeline.play();
        return;
      }
      const current = this._masterTimeline.getCurrentSlide();
      if (!current) return;
      const nextIdx = current.index + 1;
      // If already at last slide and past its end, do nothing
      if (nextIdx >= this._masterTimeline.slideCount && this._masterTimeline.isFinished()) return;
      // Set the target: pause when we reach the end of the current slide
      this._slidesTargetSlideIndex = current.index;
      if (!this._isPlaying) this.play();
      return;
    }
    if (this._isPlaying) this.pause();
    // Non-slides mode: navigate by slide too, so multi-play slides act as one
    // unit on ← / →.
    const slides = this._masterTimeline.getSlides();
    const cur = this._masterTimeline.getCurrentSlide();
    if (!cur) return;
    const next = slides[cur.index + 1];
    if (next) {
      this._masterTimeline.seek(next.startTime);
      this._scene.render();
      this._ui.updateTime(
        this._masterTimeline.getCurrentTime(),
        this._masterTimeline.getDuration(),
      );
    }
  }

  /** Alias for nextSegment — navigates by slide. */
  nextSlide(): void {
    this.nextSegment();
  }

  /** Alias for prevSegment — navigates by slide. */
  prevSlide(): void {
    this.prevSegment();
  }

  /** Jump to the previous slide. Pauses playback. */
  prevSegment(): void {
    if (this._isPlaying) this.pause();
    // From an active loop, ← always means "exit to the previous slide" rather
    // than the >0.5s phase-dependent restart-current behavior, since the user
    // is conceptually on the looping slide rather than at a specific offset.
    if (this._activeLoopSlideIndex !== null) {
      const loopIdx = this._activeLoopSlideIndex;
      this._activeLoopSlideIndex = null;
      this._slidesTargetSlideIndex = -1;
      const slides = this._masterTimeline.getSlides();
      const targetIdx = Math.max(0, loopIdx - 1);
      const targetSlide = slides[targetIdx];
      this._masterTimeline.seek(targetSlide.startTime);
      this._scene.render();
      this._ui.updateTime(
        this._masterTimeline.getCurrentTime(),
        this._masterTimeline.getDuration(),
      );
      return;
    }
    this._slidesTargetSlideIndex = -1;
    const slides = this._masterTimeline.getSlides();
    const current = this._masterTimeline.getCurrentSlide();
    if (!current) return;
    const elapsed = this._masterTimeline.getCurrentTime() - current.startTime;
    // If we're well into the current slide, go to its start; otherwise the
    // previous slide. Matches the per-segment behavior at the slide level.
    const target = elapsed > 0.5 ? current : (slides[current.index - 1] ?? current);
    this._masterTimeline.seek(target.startTime);
    this._scene.render();
    this._ui.updateTime(this._masterTimeline.getCurrentTime(), this._masterTimeline.getDuration());
  }

  /** Set the playback speed multiplier. */
  setPlaybackRate(rate: number): void {
    this._playbackRate = rate;
  }

  /** Enable or disable slides (presentation) mode at runtime. */
  setSlidesMode(enabled: boolean): void {
    this._slidesMode = enabled;
    this._ui.setSlidesMode(enabled);
    if (!enabled) {
      this._activeLoopSlideIndex = null;
      this._slidesTargetSlideIndex = -1;
    }
  }

  /** Export the animation in the given format (gif, webm, mp4). */
  async exportAs(format: string): Promise<void> {
    const wasPlaying = this._isPlaying;
    const savedTime = this._masterTimeline.getCurrentTime();
    if (wasPlaying) this.pause();

    const filename = `animation.${format}`;
    this._ui.setExportProgress(0);

    try {
      await this._scene.export(filename, {
        duration: this._masterTimeline.getDuration(),
        width: this._scene.getWidth(),
        height: this._scene.getHeight(),
        onProgress: (p) => this._ui.setExportProgress(p),
      });
    } catch (err) {
      console.error('Export failed:', err);
      this._ui.showError(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      this._ui.setExportProgress(null);
      // Restore playback position (export seeks through the entire timeline)
      this.seek(savedTime);
      if (wasPlaying) this.play();
    }
  }

  /** Toggle browser fullscreen on the player container. */
  toggleFullscreen(): void {
    if (document.fullscreenElement === this._container) {
      document.exitFullscreen();
    } else {
      this._container.requestFullscreen().catch(() => {
        // Fullscreen may be blocked by browser policy
      });
    }
  }

  /** Clean up all resources. */
  dispose(): void {
    this._stopLoop();
    document.removeEventListener('fullscreenchange', this._onFullscreenChange);
    this._ui.dispose();
    this._controller.dispose();
    this._scene.dispose();
  }

  // ---------------------------------------------------------------------------
  // Render loop (Player manages its own loop, separate from Scene's)
  // ---------------------------------------------------------------------------

  private _startLoop(): void {
    if (this._animFrameId !== null) return;
    this._lastFrameTime = performance.now();

    const loop = (now: number) => {
      if (!this._isPlaying) {
        this._animFrameId = null;
        return;
      }
      this._animFrameId = requestAnimationFrame(loop);

      const elapsed = now - this._lastFrameTime;
      // ~16ms frame budget at 60fps; skip if too fast
      if (elapsed < 14) return;

      const dt = (elapsed / 1000) * this._playbackRate;
      this._lastFrameTime = now;

      // Update master timeline
      this._masterTimeline.update(dt);

      // Update mobject updaters
      for (const mob of this._scene.mobjects) {
        mob.update(dt);
      }

      // Render
      this._scene.render();

      // Update UI
      this._ui.updateTime(
        this._masterTimeline.getCurrentTime(),
        this._masterTimeline.getDuration(),
      );

      // In slides mode, branch on the active slide's flags at its endTime.
      // loop wins over autoNext (a looping slide never reaches its end naturally).
      if (this._slidesMode && this._slidesTargetSlideIndex >= 0) {
        const slides = this._masterTimeline.getSlides();
        const targetSlide = slides[this._slidesTargetSlideIndex];
        if (targetSlide && this._masterTimeline.getCurrentTime() >= targetSlide.endTime) {
          if (targetSlide.loop) {
            // Rewind and keep playing. play() is required because Timeline.update
            // self-pauses when currentTime crosses the timeline duration (i.e.
            // when the looping slide is the final slide).
            this._masterTimeline.seek(targetSlide.startTime);
            this._masterTimeline.play();
            this._activeLoopSlideIndex = targetSlide.index;
            this._scene.render();
            this._ui.updateTime(
              this._masterTimeline.getCurrentTime(),
              this._masterTimeline.getDuration(),
            );
            return;
          }
          const nextIdx = targetSlide.index + 1;
          if (targetSlide.autoNext && nextIdx < slides.length) {
            // Advance to the next slide and keep playing through it.
            const nextSlide = slides[nextIdx];
            this._masterTimeline.seek(nextSlide.startTime);
            this._masterTimeline.play();
            this._slidesTargetSlideIndex = nextIdx;
            this._scene.render();
            this._ui.updateTime(
              this._masterTimeline.getCurrentTime(),
              this._masterTimeline.getDuration(),
            );
            return;
          }
          // Default: pause at the slide boundary. (Final autoNext slide
          // also falls through here — there is nothing to advance to.)
          this._masterTimeline.seek(targetSlide.endTime);
          this._scene.render();
          this._ui.updateTime(
            this._masterTimeline.getCurrentTime(),
            this._masterTimeline.getDuration(),
          );
          this._slidesTargetSlideIndex = -1;
          this._isPlaying = false;
          this._masterTimeline.pause();
          this._ui.setPlaying(false);
          this._stopLoop();
          return;
        }
      }

      // Check if finished
      if (this._masterTimeline.isFinished()) {
        if (this._loop) {
          this._masterTimeline.seek(0);
          this._masterTimeline.play();
        } else {
          this._isPlaying = false;
          this._masterTimeline.pause();
          this._ui.setPlaying(false, true); // show replay icon
          this._stopLoop();
        }
      }
    };

    this._animFrameId = requestAnimationFrame(loop);
  }

  private _stopLoop(): void {
    if (this._animFrameId !== null) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  }
}
