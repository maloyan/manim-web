import * as THREE from 'three';
import { Scene, SceneOptions } from './Scene';
import { Camera3D, Camera3DOptions } from './Camera';
import { Lighting } from './Lighting';
import { OrbitControls, OrbitControlsOptions } from '../interaction/OrbitControls';
import { Mobject, Vector3Tuple } from './Mobject';

/**
 * Options for configuring a ThreeDScene.
 */
export interface ThreeDSceneOptions extends SceneOptions {
  /** Camera field of view in degrees. Defaults to 45. */
  fov?: number;
  /** Initial camera phi angle (polar, from Y axis). Defaults to PI/4. */
  phi?: number;
  /** Initial camera theta angle (azimuthal, in XZ plane). Defaults to -PI/4. */
  theta?: number;
  /** Initial camera distance from origin. Defaults to 15. */
  distance?: number;
  /** Enable orbit controls for user interaction. Defaults to true. */
  enableOrbitControls?: boolean;
  /** Orbit controls configuration options. */
  orbitControlsOptions?: OrbitControlsOptions;
  /** Whether to set up default lighting. Defaults to true. */
  setupLighting?: boolean;
}

/**
 * Scene configured for 3D content.
 * Provides a 3D camera, orbit controls, and lighting setup by default.
 * Compatible with the Timeline system for animations.
 */
export class ThreeDScene extends Scene {
  private _camera3D: Camera3D;
  private _lighting: Lighting;
  private _orbitControls: OrbitControls | null = null;
  private _orbitControlsEnabled: boolean = true;
  private _isRendering: boolean = false;
  private _orbitRafId: number | null = null;
  private _orbitInteracting: boolean = false;

  // HUD overlay for fixed-in-frame mobjects (pinned to screen)
  private _hudScene: THREE.Scene;
  private _hudCamera: THREE.OrthographicCamera;
  private _fixedMobjects: Set<Mobject> = new Set();

  // Ambient camera rotation
  private _ambientRotationRate: number = 0;
  private _lastRenderTime: number = 0;

  // 3D illusion camera rotation
  private _illusionRotationRate: number = 0;
  private _illusionOriginPhi: number = 0;
  private _illusionOriginTheta: number = 0;
  private _illusionThetaTracker: number = 0;
  private _illusionPhiTracker: number = 0;
  private _illusionActive: boolean = false;

  /**
   * Create a new 3D scene.
   * @param container - DOM element to render into
   * @param options - Scene configuration options
   */
  constructor(container: HTMLElement, options: ThreeDSceneOptions = {}) {
    super(container, options);

    const {
      fov = 45,
      phi = Math.PI / 4,
      theta = -Math.PI / 4,
      distance = 15,
      enableOrbitControls = true,
      orbitControlsOptions,
      setupLighting = true,
    } = options;

    // Create 3D camera
    const aspectRatio = this.renderer.width / this.renderer.height;
    const camera3DOptions: Camera3DOptions = {
      fov,
      position: [0, 0, distance],
    };
    this._camera3D = new Camera3D(aspectRatio, camera3DOptions);

    // Set initial camera orientation
    this._camera3D.orbit(phi, theta, distance);

    // Set up lighting
    this._lighting = new Lighting(this.threeScene);
    if (setupLighting) {
      this._lighting.setupDefault();
    }

    // Set up orbit controls
    this._orbitControlsEnabled = enableOrbitControls;
    if (enableOrbitControls) {
      this._orbitControls = new OrbitControls(this._camera3D.getCamera(), this.getCanvas(), {
        enableDamping: true,
        dampingFactor: 0.05,
        ...orbitControlsOptions,
      });

      // Idle orbit loop: re-render only when user drags while scene isn't animating
      this._orbitControls.addEventListener('start', () => {
        this._orbitInteracting = true;
        this._startOrbitLoop();
      });
      this._orbitControls.addEventListener('end', () => {
        this._orbitInteracting = false;
      });
    }

    // HUD overlay for fixed-in-frame mobjects
    this._hudScene = new THREE.Scene();
    const halfW = (options.frameWidth ?? 14) / 2;
    const halfH = (options.frameHeight ?? 8) / 2;
    this._hudCamera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 1000);
    this._hudCamera.position.set(0, 0, 10);
    this._hudCamera.lookAt(0, 0, 0);

    // Initial render with 3D camera
    this.render();
  }

  /**
   * Override add to re-enable depth testing for proper 3D occlusion.
   * The base Scene disables depthTest for 2D render-order layering,
   * but 3D scenes need depth testing for correct visibility.
   */
  add(...mobjects: Mobject[]): this {
    super.add(...mobjects);
    for (const mobject of mobjects) {
      const threeObj = mobject.getThreeObject();
      threeObj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            m.depthTest = true;
            m.depthWrite = true;
          }
        }
      });
    }
    return this;
  }

  /**
   * Get the 3D camera.
   */
  get camera3D(): Camera3D {
    return this._camera3D;
  }

  /**
   * Get the lighting system.
   */
  get lighting(): Lighting {
    return this._lighting;
  }

  /**
   * Get the orbit controls (if enabled).
   */
  get orbitControls(): OrbitControls | null {
    return this._orbitControls;
  }

  /**
   * Set the camera orientation using spherical coordinates.
   * @param phi - Polar angle from Y axis (0 = top, PI = bottom)
   * @param theta - Azimuthal angle in XZ plane
   * @param distance - Optional distance from the look-at point
   * @returns this for chaining
   */
  setCameraOrientation(phi: number, theta: number, distance?: number): this {
    this._camera3D.orbit(phi, theta, distance);
    this.render();
    return this;
  }

  /**
   * Set the camera's look-at target.
   * @param target - Target position [x, y, z]
   * @returns this for chaining
   */
  setLookAt(target: Vector3Tuple): this {
    this._camera3D.setLookAt(target);
    if (this._orbitControls) {
      this._orbitControls.setTarget(target);
    }
    this.render();
    return this;
  }

  /**
   * Get the current camera orientation angles.
   * @returns Object with phi, theta, and distance
   */
  getCameraOrientation(): { phi: number; theta: number; distance: number } {
    return this._camera3D.getOrbitAngles();
  }

  /**
   * Begin continuous ambient rotation of the camera around the scene.
   * Rotates the camera's theta angle at the given rate (radians per second)
   * during wait() calls and play() calls.
   * Equivalent to Python Manim's begin_ambient_camera_rotation(rate).
   * @param rate - Rotation rate in radians per second. Defaults to 0.1.
   * @returns this for chaining
   */
  beginAmbientCameraRotation(rate: number = 0.1): this {
    this._ambientRotationRate = rate;
    this._lastRenderTime = performance.now();
    return this;
  }

  /**
   * Stop the ambient camera rotation.
   * Equivalent to Python Manim's stop_ambient_camera_rotation().
   * @returns this for chaining
   */
  stopAmbientCameraRotation(): this {
    this._ambientRotationRate = 0;
    return this;
  }

  /**
   * Begin 3D illusion camera rotation.
   * Unlike ambient rotation (which only rotates theta), this also oscillates
   * phi sinusoidally, creating a wobbling 3D illusion as if the viewer walks
   * around the scene.
   * Equivalent to Python Manim's begin_3dillusion_camera_rotation(rate).
   * @param rate - Rotation rate in radians per second. Defaults to 2.
   * @returns this for chaining
   */
  begin3DIllusionCameraRotation(rate: number = 2): this {
    const current = this._camera3D.getOrbitAngles();
    this._illusionRotationRate = rate;
    this._illusionOriginPhi = current.phi;
    this._illusionOriginTheta = current.theta;
    this._illusionThetaTracker = current.theta;
    this._illusionPhiTracker = current.phi;
    this._illusionActive = true;
    this._lastRenderTime = performance.now();
    return this;
  }

  /**
   * Stop the 3D illusion camera rotation.
   * Equivalent to Python Manim's stop_3dillusion_camera_rotation().
   * @returns this for chaining
   */
  stop3DIllusionCameraRotation(): this {
    this._illusionActive = false;
    this._illusionRotationRate = 0;
    return this;
  }

  /**
   * Animate the camera to a new orientation over a given duration.
   * Equivalent to Python Manim's move_camera(phi, theta, distance).
   * If no duration is given, snaps instantly.
   * @param options - Target orientation and duration
   * @returns Promise that resolves when the animation completes
   */
  async moveCamera(options: {
    phi?: number;
    theta?: number;
    distance?: number;
    duration?: number;
  }): Promise<void> {
    const current = this._camera3D.getOrbitAngles();
    const targetPhi = options.phi ?? current.phi;
    const targetTheta = options.theta ?? current.theta;
    const targetDistance = options.distance ?? current.distance;
    const duration = options.duration ?? 1;

    if (duration <= 0) {
      this._camera3D.orbit(targetPhi, targetTheta, targetDistance);
      this.render();
      return;
    }

    const startPhi = current.phi;
    const startTheta = current.theta;
    const startDistance = current.distance;

    return new Promise((resolve) => {
      const startTime = performance.now();
      let lastFrameTime = startTime;
      let rafId: number | null = null;
      let timerId: ReturnType<typeof setInterval> | null = null;
      let resolved = false;

      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        if (rafId !== null) cancelAnimationFrame(rafId);
        if (timerId !== null) clearInterval(timerId);
        resolve();
      };

      // Register so dispose() can cancel this animation
      this._waitCleanups.push(cleanup);

      const tick = (currentTime: number) => {
        if (resolved || this._disposed) {
          cleanup();
          return;
        }
        const elapsed = (currentTime - startTime) / 1000;
        const t = Math.min(1, elapsed / duration);
        // Smooth interpolation using smoothstep
        const s = t * t * (3 - 2 * t);

        const phi = startPhi + (targetPhi - startPhi) * s;
        const theta = startTheta + (targetTheta - startTheta) * s;
        const dist = startDistance + (targetDistance - startDistance) * s;

        this._camera3D.orbit(phi, theta, dist);

        // Also run mobject updaters during camera animation
        const dt = (currentTime - lastFrameTime) / 1000;
        lastFrameTime = currentTime;
        for (const mobject of this.mobjects) {
          mobject.update(dt);
        }

        this._render();

        if (t >= 1) {
          const idx = this._waitCleanups.indexOf(cleanup);
          if (idx >= 0) this._waitCleanups.splice(idx, 1);
          cleanup();
          return;
        }
      };

      const loop = (currentTime: number) => {
        tick(currentTime);
        if (!resolved) {
          rafId = requestAnimationFrame(loop);
        }
      };

      rafId = requestAnimationFrame(loop);

      // Background-tab fallback
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
   * Enable or disable orbit controls.
   * @param enabled - Whether orbit controls should be enabled
   * @returns this for chaining
   */
  setOrbitControlsEnabled(enabled: boolean): this {
    this._orbitControlsEnabled = enabled;
    if (this._orbitControls) {
      if (enabled) {
        this._orbitControls.enable();
      } else {
        this._orbitControls.disable();
      }
    }
    return this;
  }

  /**
   * Pin mobjects to the screen (HUD) so they don't move with the 3D camera.
   * Equivalent to Python Manim's add_fixed_in_frame_mobjects.
   * @param mobjects - Mobjects to fix in screen space
   * @returns this for chaining
   */
  addFixedInFrameMobjects(...mobjects: Mobject[]): this {
    for (const mob of mobjects) {
      this._fixedMobjects.add(mob);
      // Ensure the Three.js object is initialized
      const threeObj = mob.getThreeObject();
      this._hudScene.add(threeObj);
    }
    if (this._fixedMobjects.size > 0) {
      this.render();
    }
    return this;
  }

  /**
   * Remove mobjects from the fixed-in-frame HUD.
   * @param mobjects - Mobjects to unpin from screen space
   * @returns this for chaining
   */
  removeFixedInFrameMobjects(...mobjects: Mobject[]): this {
    for (const mob of mobjects) {
      if (this._fixedMobjects.has(mob)) {
        this._fixedMobjects.delete(mob);
        const threeObj = mob.getThreeObject();
        this._hudScene.remove(threeObj);
      }
    }
    return this;
  }

  /**
   * Override: also needs per-frame rendering when camera is animating.
   */
  protected override _needsPerFrameRendering(): boolean {
    if (this._ambientRotationRate !== 0) return true;
    if (this._illusionActive && this._illusionRotationRate !== 0) return true;
    return super._needsPerFrameRendering();
  }

  /**
   * Override _render to use the 3D camera with two-pass rendering for HUD.
   * This is called by the animation loop internally.
   */
  // eslint-disable-next-line complexity
  protected override _render(): void {
    // Guard: super() calls _render() before our fields are initialized
    if (!this._camera3D || this._disposed) return;

    // Advance ambient camera rotation
    if (this._ambientRotationRate !== 0) {
      const now = performance.now();
      if (this._lastRenderTime > 0) {
        const dt = (now - this._lastRenderTime) / 1000;
        // Clamp dt to avoid huge jumps (e.g. after tab regains focus)
        const clampedDt = Math.min(dt, 0.1);
        if (clampedDt > 0) {
          const current = this._camera3D.getOrbitAngles();
          const newTheta = current.theta + this._ambientRotationRate * clampedDt;
          this._camera3D.orbit(current.phi, newTheta, current.distance);
        }
      }
      this._lastRenderTime = now;
    }

    // Advance 3D illusion camera rotation (elliptical orbit)
    // Python Manim: theta oscillates via 0.2*sin(tracker), phi via 0.1*cos(tracker)
    // Both trackers advance at rate*dt, creating an elliptical camera path
    if (this._illusionActive && this._illusionRotationRate !== 0) {
      const now = performance.now();
      if (this._lastRenderTime > 0) {
        const dt = (now - this._lastRenderTime) / 1000;
        const clampedDt = Math.min(dt, 0.1);
        if (clampedDt > 0) {
          const current = this._camera3D.getOrbitAngles();
          this._illusionThetaTracker += this._illusionRotationRate * clampedDt;
          this._illusionPhiTracker += this._illusionRotationRate * clampedDt;
          const newTheta = this._illusionOriginTheta + 0.2 * Math.sin(this._illusionThetaTracker);
          const newPhi = this._illusionOriginPhi + 0.1 * Math.cos(this._illusionPhiTracker);
          this._camera3D.orbit(newPhi, newTheta, current.distance);
        }
      }
      this._lastRenderTime = now;
    }

    // Sync dirty mobjects in the main scene
    for (const mob of this.mobjects) {
      if (mob._dirty) {
        mob._syncToThree();
        mob._dirty = false;
      }
    }

    // Sync fixed (HUD) mobjects
    if (this._fixedMobjects) {
      for (const mob of this._fixedMobjects) {
        if (mob._dirty) {
          mob._syncToThree();
          mob._dirty = false;
        }
      }
    }

    // Update orbit controls if enabled
    if (this._orbitControls && this._orbitControlsEnabled) {
      this._orbitControls.update();
    }

    const threeRenderer = this.renderer.getThreeRenderer();

    // Pass 1: 3D scene (clears buffer)
    threeRenderer.autoClear = true;
    threeRenderer.render(this.threeScene, this._camera3D.getCamera());

    // Pass 2: HUD overlay (no clear, composites on top)
    if (this._fixedMobjects && this._fixedMobjects.size > 0) {
      threeRenderer.autoClear = false;
      threeRenderer.render(this._hudScene, this._hudCamera);
      threeRenderer.autoClear = true;
    }
  }

  /**
   * Public render - delegates to _render.
   */
  render(): void {
    if (this._isRendering) return;
    this._isRendering = true;
    try {
      this._render();
    } finally {
      this._isRendering = false;
    }
  }

  /**
   * Override clear to also clear the HUD scene and fixed mobjects.
   */
  clear(options: { render?: boolean } = {}): this {
    // Clear fixed mobjects from HUD scene
    for (const mob of this._fixedMobjects) {
      const threeObj = mob.getThreeObject();
      this._hudScene.remove(threeObj);
    }
    this._fixedMobjects.clear();

    // Clear any remaining HUD scene children
    while (this._hudScene.children.length > 0) {
      this._hudScene.remove(this._hudScene.children[0]);
    }

    super.clear(options);

    // Re-add lights after clear (super.clear removes ALL three scene children)
    for (const light of this._lighting.getLights()) {
      this.threeScene.add(light);
    }

    return this;
  }

  /**
   * Override remove to also handle fixed mobjects.
   */
  remove(...mobjects: Mobject[]): this {
    for (const mob of mobjects) {
      if (this._fixedMobjects.has(mob)) {
        this._fixedMobjects.delete(mob);
        const threeObj = mob.getThreeObject();
        this._hudScene.remove(threeObj);
      }
    }
    return super.remove(...mobjects);
  }

  /**
   * Handle window resize.
   * @param width - New width in pixels
   * @param height - New height in pixels
   */
  resize(width: number, height: number): this {
    super.resize(width, height);
    const aspectRatio = width / height;
    this._camera3D.setAspectRatio(aspectRatio);
    this.render();
    return this;
  }

  /**
   * Start a lightweight rAF loop for orbit controls when the scene
   * isn't already rendering (no active animations/waits).
   * Stops automatically when the user releases and damping settles.
   */
  private _startOrbitLoop(): void {
    if (this._orbitRafId !== null) return;
    // Skip only if the scene's rAF loop is actively rendering every frame
    // (e.g. play() or wait() with updaters/camera animation).
    // Allow orbit loop for static waits where no rAF loop is running.
    if (this._hasActiveLoop && this._needsPerFrameRendering()) return;

    let lastCamJson = '';
    const tick = () => {
      if (this._disposed) {
        this._orbitRafId = null;
        return;
      }
      this._orbitControls!.update();
      this._render();

      // Check if camera has settled (for damping)
      const cam = this._camera3D.getCamera();
      const camJson =
        cam.position.x.toFixed(6) +
        cam.position.y.toFixed(6) +
        cam.position.z.toFixed(6) +
        cam.quaternion.x.toFixed(6) +
        cam.quaternion.y.toFixed(6) +
        cam.quaternion.z.toFixed(6) +
        cam.quaternion.w.toFixed(6);

      if (this._orbitInteracting || camJson !== lastCamJson) {
        lastCamJson = camJson;
        this._orbitRafId = requestAnimationFrame(tick);
      } else {
        this._orbitRafId = null;
      }
    };
    this._orbitRafId = requestAnimationFrame(tick);
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    if (this._orbitRafId !== null) {
      cancelAnimationFrame(this._orbitRafId);
      this._orbitRafId = null;
    }
    this._lighting.dispose();
    if (this._orbitControls) {
      this._orbitControls.dispose();
    }
    super.dispose();
  }
}
