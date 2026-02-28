import * as THREE from 'three';
import { Renderer, RendererOptions } from './Renderer';
import { Camera2D, CameraOptions } from './Camera';
import { Mobject } from './Mobject';
import { Animation } from '../animation/Animation';
import { AnimationGroup } from '../animation/AnimationGroup';
import { Timeline } from '../animation/Timeline';
import { MANIM_BACKGROUND } from '../constants/colors';
import { VMobject } from './VMobject';
import { SceneStateManager, SceneSnapshot } from './StateManager';
import { AudioManager, type AddSoundOptions, type AudioTrack } from './AudioManager';

/**
 * Options for configuring a Scene.
 */
export interface SceneOptions {
  /** Canvas width in pixels. Defaults to container width. */
  width?: number;
  /** Canvas height in pixels. Defaults to container height. */
  height?: number;
  /** Background color as CSS color string. Defaults to Manim's dark gray (#1C1C1C). */
  backgroundColor?: string;
  /** Frame width in world units. Defaults to 14 (Manim standard). */
  frameWidth?: number;
  /** Frame height in world units. Defaults to 8 (Manim standard). */
  frameHeight?: number;
  /** Target frame rate in fps. Defaults to 60. */
  targetFps?: number;
  /** Enable frustum culling optimization. Defaults to true. */
  frustumCulling?: boolean;
  /** Enable auto-render on add/remove. Defaults to true. */
  autoRender?: boolean;
}

/**
 * Scene orchestrator for manimweb.
 * Manages the renderer, camera, mobjects, and animation playback.
 * Works like Manim's Scene class - add mobjects, play animations.
 */
export class Scene {
  private _renderer: Renderer;
  private _camera: Camera2D;
  private _threeScene: THREE.Scene;
  private _mobjects: Set<Mobject>;
  private _timeline: Timeline | null = null;
  private _isPlaying: boolean = false;
  private _currentTime: number = 0;
  private _animationFrameId: number | null = null;
  private _backgroundTimerId: ReturnType<typeof setInterval> | null = null;
  private _lastFrameTime: number = 0;
  private _playPromiseResolve: (() => void) | null = null;

  // Performance optimization: frame rate control
  private _targetFps: number = 60;
  private _targetFrameTime: number = 1000 / 60;

  // Performance optimization: frustum culling
  private _frustumCulling: boolean = true;
  private _frustum: THREE.Frustum = new THREE.Frustum();
  private _projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();

  // Performance optimization: object pooling for temporary vectors
  private static _tempBox3: THREE.Box3 = new THREE.Box3();

  // Performance optimization: auto-render control
  protected _autoRender: boolean = true;

  // Z-ordering: assign increasing renderOrder to each added mobject
  private _renderOrderCounter: number = 0;

  // State management (undo/redo)
  private _stateManager: SceneStateManager;

  // Audio manager (lazy – created on first access)
  private _audioManager: AudioManager | null = null;

  /**
   * Create a new Scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: SceneOptions = {}) {
    const {
      width,
      height,
      backgroundColor = MANIM_BACKGROUND,
      frameWidth = 14,
      frameHeight = 8,
      targetFps = 60,
      frustumCulling = true,
      autoRender = true,
    } = options;

    // Initialize performance options
    this._targetFps = targetFps;
    this._targetFrameTime = 1000 / targetFps;
    this._frustumCulling = frustumCulling;
    this._autoRender = autoRender;

    // Create Three.js scene
    this._threeScene = new THREE.Scene();

    // Create renderer
    const rendererOptions: RendererOptions = {
      width,
      height,
      backgroundColor,
      antialias: true,
    };
    this._renderer = new Renderer(container, rendererOptions);

    // Create camera with Manim-style frame dimensions
    const cameraOptions: CameraOptions = {
      frameWidth,
      frameHeight,
      position: [0, 0, 10],
    };
    this._camera = new Camera2D(cameraOptions);

    // Adjust camera aspect ratio to match renderer
    const aspectRatio = this._renderer.width / this._renderer.height;
    this._camera.setAspectRatio(aspectRatio);

    // Set renderer dimensions for VMobject LineMaterial resolution
    VMobject._rendererWidth = this._renderer.width;
    VMobject._rendererHeight = this._renderer.height;
    VMobject._frameWidth = frameWidth;

    // Initialize mobjects set
    this._mobjects = new Set();

    // Initialize state manager (undo/redo)
    this._stateManager = new SceneStateManager(() => Array.from(this._mobjects));

    // Initial render
    this._render();
  }

  /**
   * Get the Three.js scene.
   */
  get threeScene(): THREE.Scene {
    return this._threeScene;
  }

  /**
   * Get the camera.
   */
  get camera(): Camera2D {
    return this._camera;
  }

  /**
   * Get the renderer.
   */
  get renderer(): Renderer {
    return this._renderer;
  }

  /**
   * Get the current timeline.
   */
  get timeline(): Timeline | null {
    return this._timeline;
  }

  /**
   * Get whether animations are currently playing.
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Get the current playback time.
   */
  get currentTime(): number {
    return this._currentTime;
  }

  /**
   * Get all mobjects in the scene.
   */
  get mobjects(): ReadonlySet<Mobject> {
    return this._mobjects;
  }

  // ---------------------------------------------------------------------------
  // Audio
  // ---------------------------------------------------------------------------

  /**
   * Get the audio manager (lazily created on first access).
   * Use this to access lower-level audio controls.
   */
  get audioManager(): AudioManager {
    if (!this._audioManager) {
      this._audioManager = new AudioManager();
    }
    return this._audioManager;
  }

  /**
   * Add a sound to play at a specific time on the timeline.
   * Mirrors Python manim's `self.add_sound("file.wav", time_offset=0.5)`.
   *
   * @param url - URL of the audio file
   * @param options - Scheduling and playback options
   * @returns Promise resolving to the created AudioTrack
   *
   * @example
   * ```ts
   * await scene.addSound('/sounds/click.wav', { time: 0.5 });
   * await scene.addSound('/sounds/whoosh.wav');  // plays at time 0
   * ```
   */
  async addSound(url: string, options?: AddSoundOptions): Promise<AudioTrack> {
    return this.audioManager.addSound(url, options);
  }

  /**
   * Add a sound that starts when a given animation begins.
   *
   * @param animation - The animation to sync with
   * @param url - URL of the audio file
   * @param options - Additional options (timeOffset shifts relative to animation start)
   * @returns Promise resolving to the created AudioTrack
   *
   * @example
   * ```ts
   * const fadeIn = new FadeIn(circle);
   * await scene.addSoundAtAnimation(fadeIn, '/sounds/appear.wav');
   * await scene.play(fadeIn);
   * ```
   */
  async addSoundAtAnimation(
    animation: Animation,
    url: string,
    options?: Omit<AddSoundOptions, 'time'> & { timeOffset?: number },
  ): Promise<AudioTrack> {
    return this.audioManager.addSoundAtAnimation(animation, url, options);
  }

  /**
   * Add mobjects as foreground objects that render on top of everything.
   * Matches Manim Python's add_foreground_mobject().
   * @param mobjects - Mobjects to add in the foreground
   */
  addForegroundMobject(...mobjects: Mobject[]): this {
    for (const mobject of mobjects) {
      if (!this._mobjects.has(mobject)) {
        this.add(mobject);
      }
      // Set very high renderOrder so it draws on top
      const threeObj = mobject.getThreeObject();
      const fgRo = 10000 + this._renderOrderCounter++;
      threeObj.renderOrder = fgRo;
      threeObj.traverse((child) => {
        child.renderOrder = fgRo;
      });
    }
    if (this._autoRender) {
      this._render();
    }
    return this;
  }

  /**
   * Add mobjects to the scene.
   * @param mobjects - Mobjects to add
   */
  add(...mobjects: Mobject[]): this {
    for (const mobject of mobjects) {
      if (!this._mobjects.has(mobject)) {
        this._mobjects.add(mobject);
        const threeObj = mobject.getThreeObject();
        const ro = this._renderOrderCounter++;
        threeObj.renderOrder = ro;
        // Propagate renderOrder to ALL children so THREE.js sorts meshes
        // correctly (Group renderOrder doesn't cascade to child meshes).
        // Also disable depth test so renderOrder controls draw order (2D scene).
        threeObj.traverse((child) => {
          child.renderOrder = ro;
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              for (const m of mesh.material) m.depthTest = false;
            } else {
              mesh.material.depthTest = false;
            }
          }
        });
        // Only add to THREE scene root if not already in the scene graph
        // (prevents reparenting sub-objects like ZoomedDisplay.displayFrame)
        if (!this._isInSceneGraph(threeObj)) {
          this._threeScene.add(threeObj);
        }
        // If mobject or any descendant has pending async rendering (e.g. MathTex),
        // re-render when done. Recursively check children since MathTex objects
        // may be nested inside VGroup/Group containers.
        this._awaitAsyncRenders(mobject);
      }
    }
    if (this._autoRender) {
      this._render();
    }
    return this;
  }

  /**
   * Remove mobjects from the scene.
   * @param mobjects - Mobjects to remove
   */
  remove(...mobjects: Mobject[]): this {
    for (const mobject of mobjects) {
      if (this._mobjects.has(mobject)) {
        this._mobjects.delete(mobject);
        const threeObj = mobject.getThreeObject();
        // Only remove from THREE scene root if it's a direct child
        // (sub-objects stay with their parent group)
        if (threeObj.parent === this._threeScene) {
          this._threeScene.remove(threeObj);
        }
      }
    }
    if (this._autoRender) {
      this._render();
    }
    return this;
  }

  /**
   * Check if a THREE object is already part of this scene's graph.
   */
  private _isInSceneGraph(obj: THREE.Object3D): boolean {
    let current = obj.parent;
    while (current) {
      if (current === this._threeScene) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Clear all mobjects from the scene.
   * @param options.render - Whether to auto-render after clearing. Default: true.
   *   Pass `false` to suppress the render (e.g., when rebuilding the scene
   *   immediately afterwards to avoid a blank-frame flicker).
   */
  clear({ render = true }: { render?: boolean } = {}): this {
    for (const mobject of this._mobjects) {
      const threeObj = mobject.getThreeObject();
      this._threeScene.remove(threeObj);
    }
    this._mobjects.clear();

    // Also remove any untracked Three.js objects (e.g., cross-fade targets
    // added directly by Transform animations)
    while (this._threeScene.children.length > 0) {
      this._threeScene.remove(this._threeScene.children[0]);
    }

    if (render && this._autoRender) {
      this._render();
    }
    return this;
  }

  /**
   * Recursively collect all leaf animations from animation groups.
   */
  private _collectAllAnimations(animations: Animation[]): Animation[] {
    const result: Animation[] = [];
    for (const anim of animations) {
      result.push(anim);
      if (anim instanceof AnimationGroup) {
        result.push(...this._collectAllAnimations(anim.animations));
      }
    }
    return result;
  }

  /**
   * Play animations in parallel (all at once).
   * Matches Manim's scene.play() behavior where multiple animations run simultaneously.
   * Automatically adds mobjects to the scene if not already present.
   * @param animations - Animations to play
   * @returns Promise that resolves when all animations complete
   */
  async play(...animations: Animation[]): Promise<void> {
    if (animations.length === 0) return;

    // Collect all nested mobjects (for scene.add), but only begin top-level animations.
    // AnimationGroup.begin() handles calling begin() on its own children.
    const allAnimations = this._collectAllAnimations(animations);

    // Force geometry sync so begin() can detect Line2 children for dash-reveal
    // animations (e.g. MathTexSVG Create). This must happen before begin() but
    // we must NOT add to the scene yet — otherwise the mobject renders at full
    // opacity for one frame before begin() hides it.
    for (const animation of allAnimations) {
      if (animation.mobject._dirty) {
        animation.mobject._syncToThree();
        animation.mobject._dirty = false;
      }
    }

    // Initialize only top-level animations to avoid double begin() on AnimationGroup children
    for (const animation of animations) {
      animation.begin();
    }

    // Add animated mobjects to scene AFTER begin() so they appear in their
    // initial animation state (e.g. hidden for Create, zero opacity for FadeIn).
    for (const animation of allAnimations) {
      if (!this._mobjects.has(animation.mobject)) {
        this.add(animation.mobject);
      }
    }

    // Play all animations in parallel (Manim behavior)
    this._timeline = new Timeline();
    this._timeline.addParallel(animations);

    // Start playback
    this._timeline.play();
    this._isPlaying = true;
    this._currentTime = 0;

    // Start audio playback if audio has been loaded
    if (this._audioManager) {
      this._audioManager.seek(0);
      this._audioManager.play();
    }

    // Start render loop if not already running
    this._startRenderLoop();

    // Wait for all animations to finish
    await new Promise<void>((resolve) => {
      this._playPromiseResolve = resolve;
    });

    // Remove mobjects whose animations have remover=true (e.g. FadeOut)
    for (const animation of allAnimations) {
      if (animation.remover) {
        this.remove(animation.mobject);
      }
    }
  }

  /**
   * Play multiple animations in parallel (all at once).
   * Alias for play() - delegates to play() to avoid duplicated logic.
   * @param animations - Animations to play simultaneously
   * @returns Promise that resolves when all animations complete
   */
  async playAll(...animations: Animation[]): Promise<void> {
    return this.play(...animations);
  }

  /**
   * Wait for a duration (pause between animations).
   * Runs a render loop during the wait so that updaters keep ticking.
   * @param duration - Duration in seconds
   * @returns Promise that resolves after the duration
   */
  async wait(duration: number = 1): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let lastFrameTime = startTime;
      let rafId: number | null = null;
      let timerId: ReturnType<typeof setInterval> | null = null;
      let resolved = false;

      const tick = (currentTime: number) => {
        if (resolved) return;
        const elapsed = (currentTime - startTime) / 1000;
        if (elapsed >= duration) {
          // Final update at exactly the remaining dt
          const dt = (currentTime - lastFrameTime) / 1000;
          if (dt > 0) {
            for (const mobject of this._mobjects) {
              mobject.update(dt);
            }
            this._render();
          }
          resolved = true;
          if (rafId !== null) cancelAnimationFrame(rafId);
          if (timerId !== null) clearInterval(timerId);
          resolve();
          return;
        }

        const dt = (currentTime - lastFrameTime) / 1000;
        lastFrameTime = currentTime;

        // Update all mobjects (run updaters)
        for (const mobject of this._mobjects) {
          mobject.update(dt);
        }

        // Render frame
        this._render();
      };

      const loop = (currentTime: number) => {
        tick(currentTime);
        if (!resolved) {
          rafId = requestAnimationFrame(loop);
        }
      };

      rafId = requestAnimationFrame(loop);

      // Background-tab fallback: rAF is suspended when tab is hidden,
      // but setInterval still fires (~1Hz). This ensures wait() resolves
      // even when the tab is in the background.
      timerId = setInterval(() => {
        if (resolved) return;
        const now = performance.now();
        const elapsed = now - lastFrameTime;
        if (elapsed > 200) {
          tick(now);
        }
      }, 100);
    });
  }

  /**
   * Seek to a specific time in the timeline.
   * Also seeks the audio manager if audio has been used.
   * @param time - Time in seconds
   */
  seek(time: number): this {
    if (this._timeline) {
      this._timeline.seek(time);
      this._currentTime = time;
      this._render();
    }
    if (this._audioManager) {
      this._audioManager.seek(time);
    }
    return this;
  }

  /**
   * Pause playback (video and audio).
   */
  pause(): this {
    this._isPlaying = false;
    if (this._timeline) {
      this._timeline.pause();
    }
    if (this._audioManager) {
      this._audioManager.pause();
    }
    return this;
  }

  /**
   * Resume playback (video and audio).
   */
  resume(): this {
    if (this._timeline && !this._timeline.isFinished()) {
      this._isPlaying = true;
      this._timeline.play();
      this._startRenderLoop();
      if (this._audioManager) {
        this._audioManager.play();
      }
    }
    return this;
  }

  /**
   * Stop playback and reset timeline (video and audio).
   */
  stop(): this {
    this._isPlaying = false;
    this._currentTime = 0;
    if (this._timeline) {
      this._timeline.reset();
    }
    if (this._audioManager) {
      this._audioManager.stop();
    }
    this._stopRenderLoop();
    return this;
  }

  /**
   * Recursively find all descendant mobjects with waitForRender() and
   * trigger a scene re-render when each completes.
   *
   * Guards against already-resolved promises: if the mobject exposes an
   * `isRendering()` method and it returns false, the render has already
   * finished so we skip the callback to avoid redundant _render() calls
   * that can cause visible flicker.
   */
  private _awaitAsyncRenders(mobject: Mobject): void {
    const asyncMob = mobject as Mobject & {
      waitForRender?: () => Promise<void>;
      isRendering?: () => boolean;
    };
    if (typeof asyncMob.waitForRender === 'function') {
      // If the mobject exposes an isRendering() check and is no longer
      // rendering, the promise is already settled -- skip the callback
      // to avoid a redundant (and potentially flickering) re-render.
      const stillRendering = typeof asyncMob.isRendering !== 'function' || asyncMob.isRendering();

      if (stillRendering) {
        asyncMob.waitForRender().then(() => {
          if (this._autoRender) {
            this._render();
          }
        });
      }
    }
    for (const child of mobject.children) {
      this._awaitAsyncRenders(child);
    }
  }

  /**
   * Render a single frame.
   * Syncs only dirty mobjects before rendering for performance.
   * Protected so subclasses (e.g. ZoomedScene) can override for multi-pass rendering.
   */
  protected _render(): void {
    // Sync only dirty mobjects (dirty flag optimization)
    this._syncDirtyMobjects();

    // Update frustum for culling if enabled
    if (this._frustumCulling) {
      this._updateFrustum();
    }

    this._renderer.render(this._threeScene, this._camera.getCamera());
  }

  /**
   * Sync only mobjects that have been modified (dirty flag optimization).
   */
  private _syncDirtyMobjects(): void {
    for (const mobject of this._mobjects) {
      if (mobject._dirty) {
        mobject._syncToThree();
        mobject._dirty = false;
      }
    }
  }

  /**
   * Update frustum for culling calculations.
   */
  private _updateFrustum(): void {
    const camera = this._camera.getCamera();
    this._projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._projScreenMatrix);
  }

  /**
   * Check if an object is within the camera's view frustum.
   * Useful for manual culling checks or debugging.
   * @param object - Three.js object to check
   * @returns true if object is in view or if culling is disabled
   */
  isInView(object: THREE.Object3D): boolean {
    if (!this._frustumCulling) return true;

    // Use geometry bounding sphere if available
    if (object instanceof THREE.Mesh && object.geometry?.boundingSphere) {
      // Ensure bounding sphere is computed
      if (!object.geometry.boundingSphere) {
        object.geometry.computeBoundingSphere();
      }

      // Transform bounding sphere to world space
      const sphere = object.geometry.boundingSphere.clone();
      sphere.applyMatrix4(object.matrixWorld);

      return this._frustum.intersectsSphere(sphere);
    }

    // Fallback: use bounding box
    Scene._tempBox3.setFromObject(object);
    return this._frustum.intersectsBox(Scene._tempBox3);
  }

  /**
   * Check if the timeline is finished and resolve the play promise.
   * Shared by both the rAF loop and the background timer.
   */
  private _checkFinished(): void {
    if (this._timeline && this._timeline.isFinished()) {
      this._isPlaying = false;
      this._stopRenderLoop();

      // Resolve play promise
      if (this._playPromiseResolve) {
        this._playPromiseResolve();
        this._playPromiseResolve = null;
      }
    }
  }

  /**
   * Start the animation render loop with frame rate control.
   * Uses requestAnimationFrame for smooth foreground rendering,
   * plus a setInterval fallback so the timeline still advances
   * when the tab is in the background (rAF is suspended).
   */
  private _startRenderLoop(): void {
    if (this._animationFrameId !== null) return;

    this._lastFrameTime = performance.now();

    const loop = (currentTime: number) => {
      // Schedule next frame first (for smoother animations)
      if (this._isPlaying) {
        this._animationFrameId = requestAnimationFrame(loop);
      } else {
        this._animationFrameId = null;
        return;
      }

      // Frame rate control: skip frames if running ahead of target
      const elapsed = currentTime - this._lastFrameTime;
      if (elapsed < this._targetFrameTime * 0.9) {
        return; // Skip this frame, running too fast
      }

      // Calculate delta time
      const dt = elapsed / 1000;
      this._lastFrameTime = currentTime;

      // Update all mobjects (run updaters) BEFORE animations,
      // so animations can override updater-set values (e.g. Create
      // hiding fill while an updater rebuilds the polygon via become()).
      for (const mobject of this._mobjects) {
        mobject.update(dt);
      }

      // Update timeline (animations override updater state)
      if (this._timeline) {
        this._timeline.update(dt);
        this._currentTime = this._timeline.getCurrentTime();
      }

      // Update camera frame updaters AFTER animations so camera
      // updaters see the latest positions set by MoveAlongPath etc.
      this._camera.updateFrame(dt);

      // Render frame
      this._render();

      // Check if finished
      this._checkFinished();
    };

    this._animationFrameId = requestAnimationFrame(loop);

    // Background-tab fallback: setInterval is throttled to ~1Hz in
    // background tabs but NOT suspended like rAF. This ensures the
    // timeline advances and animations complete even when the tab
    // isn't visible (e.g., during automated testing).
    if (this._backgroundTimerId === null) {
      this._backgroundTimerId = setInterval(() => {
        if (!this._isPlaying || !this._timeline) {
          return;
        }
        const now = performance.now();
        const elapsed = now - this._lastFrameTime;
        // Only intervene when rAF hasn't fired for >200ms (i.e., tab is backgrounded)
        if (elapsed > 200) {
          const dt = elapsed / 1000;
          this._lastFrameTime = now;
          // Same order as main loop: updaters first, then animations
          for (const mobject of this._mobjects) {
            mobject.update(dt);
          }
          this._timeline.update(dt);
          this._currentTime = this._timeline.getCurrentTime();
          this._camera.updateFrame(dt);
          this._render();
          this._checkFinished();
        }
      }, 100);
    }
  }

  /**
   * Stop the animation render loop.
   */
  private _stopRenderLoop(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
    if (this._backgroundTimerId !== null) {
      clearInterval(this._backgroundTimerId);
      this._backgroundTimerId = null;
    }
  }

  /**
   * Batch multiple mobject updates without re-rendering between each.
   * Useful for performance when making many changes at once.
   * @param callback - Function containing multiple mobject operations
   * @example
   * ```ts
   * scene.batch(() => {
   *   circle.setColor('red');
   *   circle.shift([1, 0, 0]);
   *   square.setOpacity(0.5);
   * });
   * ```
   */
  batch(callback: () => void): void {
    const wasAutoRender = this._autoRender;
    this._autoRender = false;
    try {
      callback();
    } finally {
      this._autoRender = wasAutoRender;
      this._syncDirtyMobjects();
      this._render();
    }
  }

  /**
   * Set the target frame rate.
   * @param fps - Target frames per second (1-120)
   */
  setTargetFps(fps: number): this {
    this._targetFps = Math.max(1, Math.min(120, fps));
    this._targetFrameTime = 1000 / this._targetFps;
    return this;
  }

  /**
   * Get the current target frame rate.
   * @returns Target fps
   */
  getTargetFps(): number {
    return this._targetFps;
  }

  /**
   * Enable or disable frustum culling.
   * @param enabled - Whether frustum culling should be enabled
   */
  setFrustumCulling(enabled: boolean): this {
    this._frustumCulling = enabled;
    return this;
  }

  /**
   * Handle window resize.
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  resize(width: number, height: number): this {
    this._renderer.resize(width, height);
    const aspectRatio = width / height;
    this._camera.setAspectRatio(aspectRatio);
    VMobject._rendererWidth = width;
    VMobject._rendererHeight = height;
    this._render();
    return this;
  }

  /**
   * Get the canvas element.
   * @returns The HTMLCanvasElement used for rendering
   */
  getCanvas(): HTMLCanvasElement {
    return this._renderer.getCanvas();
  }

  /**
   * Get the container element the scene is rendered into.
   * Returns the parent element of the canvas.
   * @returns The container HTMLElement
   */
  getContainer(): HTMLElement {
    const canvas = this._renderer.getCanvas();
    if (!canvas.parentElement) {
      throw new Error('Scene canvas is not attached to a container');
    }
    return canvas.parentElement;
  }

  /**
   * Get the width of the canvas in pixels.
   * @returns Canvas width in pixels
   */
  getWidth(): number {
    return this._renderer.width;
  }

  /**
   * Get the height of the canvas in pixels.
   * @returns Canvas height in pixels
   */
  getHeight(): number {
    return this._renderer.height;
  }

  /**
   * Get the total duration of the current timeline.
   * @returns Duration in seconds, or 0 if no timeline
   */
  getTimelineDuration(): number {
    return this._timeline?.getDuration() ?? 0;
  }

  // ---------------------------------------------------------------------------
  // State management (save / restore / undo / redo)
  // ---------------------------------------------------------------------------

  /**
   * Get the scene's state manager for advanced undo/redo control.
   */
  get stateManager(): SceneStateManager {
    return this._stateManager;
  }

  /**
   * Save the current state of all scene mobjects.
   * Pushes onto the undo stack and clears the redo stack.
   *
   * @param label - Optional human-readable label
   * @returns The captured SceneSnapshot
   *
   * @example
   * ```ts
   * scene.add(circle, square);
   * scene.saveState();
   * circle.shift([2, 0, 0]);
   * scene.undo(); // circle returns to original position
   * ```
   */
  saveState(label?: string): SceneSnapshot {
    return this._stateManager.save(label);
  }

  /**
   * Undo the last change (restore the most recently saved state).
   * The current state is pushed to the redo stack.
   *
   * @returns true if undo was applied, false if nothing to undo
   */
  undo(): boolean {
    const result = this._stateManager.undo();
    if (result && this._autoRender) {
      this._render();
    }
    return result;
  }

  /**
   * Redo the last undone change.
   * The current state is pushed to the undo stack.
   *
   * @returns true if redo was applied, false if nothing to redo
   */
  redo(): boolean {
    const result = this._stateManager.redo();
    if (result && this._autoRender) {
      this._render();
    }
    return result;
  }

  /**
   * Get a snapshot of the current scene state without modifying stacks.
   */
  getState(label?: string): SceneSnapshot {
    return this._stateManager.getState(label);
  }

  /**
   * Apply a previously captured snapshot, overwriting all mobject states.
   * Does NOT modify undo/redo stacks. Call saveState() first to preserve.
   */
  setState(snapshot: SceneSnapshot): void {
    this._stateManager.setState(snapshot);
    if (this._autoRender) {
      this._render();
    }
  }

  /**
   * Force render a single frame.
   * Useful for video export where frames need to be captured at specific times.
   */
  render(): void {
    this._render();
  }

  /**
   * Clean up all resources (renderer, mobjects, audio).
   */
  dispose(): void {
    // Stop playback
    this._stopRenderLoop();
    this._isPlaying = false;

    // Dispose mobjects
    for (const mobject of this._mobjects) {
      mobject.dispose();
    }
    this._mobjects.clear();

    // Dispose renderer
    this._renderer.dispose();

    // Clear timeline
    this._timeline = null;

    // Dispose audio
    if (this._audioManager) {
      this._audioManager.dispose();
      this._audioManager = null;
    }
  }
}
