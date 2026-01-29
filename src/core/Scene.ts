import * as THREE from 'three';
import { Renderer, RendererOptions } from './Renderer';
import { Camera2D, CameraOptions } from './Camera';
import { Mobject } from './Mobject';
import { Animation } from '../animation/Animation';
import { AnimationGroup } from '../animation/AnimationGroup';
import { Timeline } from '../animation/Timeline';
import { MANIM_BACKGROUND } from '../constants/colors';
import { VMobject } from './VMobject';

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
  private _autoRender: boolean = true;

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

    // Initialize mobjects set
    this._mobjects = new Set();

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

  /**
   * Add mobjects to the scene.
   * @param mobjects - Mobjects to add
   */
  add(...mobjects: Mobject[]): this {
    for (const mobject of mobjects) {
      if (!this._mobjects.has(mobject)) {
        this._mobjects.add(mobject);
        this._threeScene.add(mobject.getThreeObject());
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
        this._threeScene.remove(threeObj);
      }
    }
    if (this._autoRender) {
      this._render();
    }
    return this;
  }

  /**
   * Clear all mobjects from the scene.
   */
  clear(): this {
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

    if (this._autoRender) {
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

    // Initialize only top-level animations to avoid double begin() on AnimationGroup children
    for (const animation of animations) {
      animation.begin();
    }

    // Ensure all animated mobjects are in the scene
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

    // Start render loop if not already running
    this._startRenderLoop();

    // Return a promise that resolves when animations complete
    return new Promise<void>((resolve) => {
      this._playPromiseResolve = resolve;
    });
  }

  /**
   * Play multiple animations in parallel (all at once).
   * @param animations - Animations to play simultaneously
   * @returns Promise that resolves when all animations complete
   */
  async playAll(...animations: Animation[]): Promise<void> {
    if (animations.length === 0) return;

    // Collect all nested mobjects (for scene.add)
    const allAnimations = this._collectAllAnimations(animations);

    // Initialize only top-level animations to avoid double begin() on AnimationGroup children
    for (const animation of animations) {
      animation.begin();
    }

    // Ensure all animated mobjects are in the scene
    for (const animation of allAnimations) {
      if (!this._mobjects.has(animation.mobject)) {
        this.add(animation.mobject);
      }
    }

    // Create a timeline with all animations starting at the same time
    this._timeline = new Timeline();
    this._timeline.addParallel(animations);

    // Start playback
    this._timeline.play();
    this._isPlaying = true;
    this._currentTime = 0;

    // Start render loop
    this._startRenderLoop();

    return new Promise<void>((resolve) => {
      this._playPromiseResolve = resolve;
    });
  }

  /**
   * Wait for a duration (pause between animations).
   * @param duration - Duration in seconds
   * @returns Promise that resolves after the duration
   */
  async wait(duration: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, duration * 1000);
    });
  }

  /**
   * Seek to a specific time in the timeline.
   * @param time - Time in seconds
   */
  seek(time: number): this {
    if (this._timeline) {
      this._timeline.seek(time);
      this._currentTime = time;
      this._render();
    }
    return this;
  }

  /**
   * Pause playback.
   */
  pause(): this {
    this._isPlaying = false;
    if (this._timeline) {
      this._timeline.pause();
    }
    return this;
  }

  /**
   * Resume playback.
   */
  resume(): this {
    if (this._timeline && !this._timeline.isFinished()) {
      this._isPlaying = true;
      this._timeline.play();
      this._startRenderLoop();
    }
    return this;
  }

  /**
   * Stop playback and reset timeline.
   */
  stop(): this {
    this._isPlaying = false;
    this._currentTime = 0;
    if (this._timeline) {
      this._timeline.reset();
    }
    this._stopRenderLoop();
    return this;
  }

  /**
   * Render a single frame.
   * Syncs only dirty mobjects before rendering for performance.
   */
  private _render(): void {
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
    this._projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
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
   * Start the animation render loop with frame rate control.
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

      // Update timeline
      if (this._timeline) {
        this._timeline.update(dt);
        this._currentTime = this._timeline.getCurrentTime();
      }

      // Update all mobjects (run updaters)
      for (const mobject of this._mobjects) {
        mobject.update(dt);
      }

      // Render frame
      this._render();

      // Check if finished
      if (this._timeline && this._timeline.isFinished()) {
        this._isPlaying = false;
        if (this._animationFrameId !== null) {
          cancelAnimationFrame(this._animationFrameId);
          this._animationFrameId = null;
        }

        // Resolve play promise
        if (this._playPromiseResolve) {
          this._playPromiseResolve();
          this._playPromiseResolve = null;
        }
      }
    };

    this._animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stop the animation render loop.
   */
  private _stopRenderLoop(): void {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
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
   * Get the camera.
   * @returns The Camera2D instance
   */
  getCamera(): Camera2D {
    return this._camera;
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

  /**
   * Force render a single frame.
   * Useful for video export where frames need to be captured at specific times.
   */
  render(): void {
    this._render();
  }

  /**
   * Clean up all resources.
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
  }
}
