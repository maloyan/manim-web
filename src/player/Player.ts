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
import { MasterTimeline } from '../animation/MasterTimeline';
import { PlayerUI } from './PlayerUI';
import { PlayerController } from './PlayerController';

export interface PlayerOptions extends SceneOptions {
  /** Auto-hide controls after this many ms. 0 = never. Default 2500. */
  autoHideMs?: number;
  /** Auto-play after sequence() finishes recording. Default false. */
  autoPlay?: boolean;
  /** Loop playback. Default false. */
  loop?: boolean;
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

    // Initialize top-level animations
    for (const anim of animations) {
      anim.begin();
    }

    // Add to real scene (so they're visible when we seek)
    for (const anim of allAnimations) {
      if (!this._realScene.mobjects.has(anim.mobject)) {
        this._realScene.add(anim.mobject);
      }
    }

    // Record segment
    this._masterTimeline.addSegment(animations);
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
  private _origWidth: number = 0;
  private _origHeight: number = 0;
  private _onFullscreenChange: () => void;

  constructor(container: HTMLElement, options: PlayerOptions = {}) {
    this._container = container;
    this._loop = options.loop ?? false;
    this._autoPlay = options.autoPlay ?? false;

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
      },
      {
        autoHideMs: options.autoHideMs,
      },
    );

    // Enable scroll-to-scrub
    this._ui.enableScrollScrub(() => this._masterTimeline.getCurrentTime());

    // Create controller (keyboard/mouse)
    this._controller = new PlayerController(container, {
      onPlayPause: () => this.togglePlayPause(),
      onPrev: () => this.prevSegment(),
      onNext: () => this.nextSegment(),
      onSeek: (t) => this.seek(t),
      onFullscreen: () => this.toggleFullscreen(),
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

    // Record
    const recorder = new RecordingScene(this._scene, this._masterTimeline);
    await builder(recorder);

    // Set the master timeline on the scene
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._scene as any)._timeline = this._masterTimeline;

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
    this._masterTimeline.seek(time);
    this._scene.render();
    this._ui.updateTime(this._masterTimeline.getCurrentTime(), this._masterTimeline.getDuration());
  }

  /** Jump to the next segment. Pauses playback (YouTube-style). */
  nextSegment(): void {
    if (this._isPlaying) this.pause();
    const seg = this._masterTimeline.nextSegment();
    if (seg) {
      this._scene.render();
      this._ui.updateTime(
        this._masterTimeline.getCurrentTime(),
        this._masterTimeline.getDuration(),
      );
    }
  }

  /** Jump to the previous segment. Pauses playback (YouTube-style). */
  prevSegment(): void {
    if (this._isPlaying) this.pause();
    const prev = this._masterTimeline.prevSegment();
    if (prev) {
      this._scene.render();
      this._ui.updateTime(
        this._masterTimeline.getCurrentTime(),
        this._masterTimeline.getDuration(),
      );
    }
  }

  /** Set the playback speed multiplier. */
  setPlaybackRate(rate: number): void {
    this._playbackRate = rate;
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
