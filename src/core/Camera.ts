import * as THREE from 'three';
import { Camera2DFrame } from './Camera2DFrame';

/**
 * Options for configuring a Camera3D.
 */
export interface Camera3DOptions {
  /** Field of view in degrees. Defaults to 45. */
  fov?: number;
  /** Near clipping plane. Defaults to 0.1. */
  near?: number;
  /** Far clipping plane. Defaults to 1000. */
  far?: number;
  /** Initial camera position [x, y, z]. Defaults to [0, 0, 10]. */
  position?: [number, number, number];
  /** Initial look-at target [x, y, z]. Defaults to origin [0, 0, 0]. */
  lookAt?: [number, number, number];
  /** Fixed up vector [x, y, z]. If provided, orbit() will never modify it. */
  up?: [number, number, number];
}

/**
 * 3D camera for manimweb scenes.
 * Wraps Three.js PerspectiveCamera with orbit controls support.
 */
export class Camera3D {
  private _camera: THREE.PerspectiveCamera;
  private _fov: number;
  private _position: THREE.Vector3;
  private _lookAt: THREE.Vector3;
  private _lastTheta: number = 0;
  private _up: THREE.Vector3 | null = null;

  /**
   * Create a new 3D camera.
   * @param aspectRatio - Width / height ratio. Defaults to 16/9.
   * @param options - Camera configuration options
   */
  constructor(aspectRatio: number = 16 / 9, options?: Camera3DOptions) {
    this._fov = options?.fov ?? 45;
    const near = options?.near ?? 0.1;
    const far = options?.far ?? 1000;

    this._camera = new THREE.PerspectiveCamera(this._fov, aspectRatio, near, far);

    const pos = options?.position ?? [0, 0, 10];
    this._position = new THREE.Vector3(...pos);
    this._camera.position.copy(this._position);

    const lookAt = options?.lookAt ?? [0, 0, 0];
    this._lookAt = new THREE.Vector3(...lookAt);
    this._camera.lookAt(this._lookAt);

    // If up vector is provided, set it once and never modify
    if (options?.up) {
      this._up = new THREE.Vector3(...options.up);
      this._camera.up.copy(this._up);
    }
  }

  /**
   * Get the underlying Three.js PerspectiveCamera.
   * @returns The PerspectiveCamera instance
   */
  getCamera(): THREE.PerspectiveCamera {
    return this._camera;
  }

  /**
   * Get the camera position.
   *
   * Reads the live Three.js camera position so external drivers (e.g.
   * OrbitControls, which mutate the camera directly) are reflected.
   */
  get position(): THREE.Vector3 {
    return this._camera.position.clone();
  }

  /**
   * Get the look-at target.
   */
  get lookAtTarget(): THREE.Vector3 {
    return this._lookAt.clone();
  }

  /**
   * Get the field of view.
   */
  get fov(): number {
    return this._fov;
  }

  /**
   * Move the camera to a specific position.
   * @param position - Target position [x, y, z]
   * @returns this for chaining
   */
  moveTo(position: [number, number, number]): this {
    this._position.set(...position);
    this._camera.position.copy(this._position);
    this._camera.lookAt(this._lookAt);
    return this;
  }

  /**
   * Set the look-at target.
   * @param target - Target point [x, y, z]
   * @returns this for chaining
   */
  setLookAt(target: [number, number, number]): this {
    this._lookAt.set(...target);
    this._camera.lookAt(this._lookAt);
    return this;
  }

  /**
   * Set the field of view.
   * @param fov - Field of view in degrees
   * @returns this for chaining
   */
  setFov(fov: number): this {
    this._fov = fov;
    this._camera.fov = fov;
    this._camera.updateProjectionMatrix();
    return this;
  }

  /**
   * Update the aspect ratio.
   * @param ratio - Width / height ratio
   * @returns this for chaining
   */
  setAspectRatio(ratio: number): this {
    this._camera.aspect = ratio;
    this._camera.updateProjectionMatrix();
    return this;
  }

  /**
   * Orbit the camera around the look-at point using spherical coordinates.
   *
   * Mathematical convention:
   *   - theta: rotation around Z axis (azimuthal)
   *   - phi: distance from Z axis (polar, 0 = on axis)
   *
   * Default (phi=0, theta=-π/2): camera at +Z looking at origin.
   *   - X axis → screen right
   *   - Y axis → screen up
   *   - Z axis → depth (pointing toward viewer)
   *
   * @param phi - Polar angle from Z axis (0 = on axis, PI/2 = side, PI = opposite)
   * @param theta - Azimuthal angle around Z axis (radians)
   * @param distance - Optional distance from look-at point
   * @param gamma - Roll angle (radians)
   * @returns this for chaining
   */
  orbit(phi: number, theta: number, distance?: number, gamma: number = 0): this {
    // Default to the *live* camera distance so a re-orient after an external
    // zoom (OrbitControls dolly) doesn't snap back to a stale radius.
    const dist = distance ?? this._camera.position.distanceTo(this._lookAt);

    // Store theta for gimbal lock recovery in getOrbitAngles()
    this._lastTheta = theta;

    this._position.x = this._lookAt.x + dist * Math.sin(phi) * Math.cos(theta);
    this._position.y = this._lookAt.y + dist * Math.sin(phi) * Math.sin(theta);
    this._position.z = this._lookAt.z + dist * Math.cos(phi);

    this._camera.position.copy(this._position);

    // Up vector is only set ONCE: either provided at construction or computed on first orbit() call.
    // This is critical for OrbitControls compatibility - it expects camera.up to remain constant.
    if (!this._up) {
      // Up = second row of Rz(γ)·Rx(-φ)·Rz(-θ-90°)
      this._up = new THREE.Vector3(
        -Math.sin(gamma) * Math.sin(theta) - Math.cos(gamma) * Math.cos(theta) * Math.cos(phi),
        Math.sin(gamma) * Math.cos(theta) - Math.cos(gamma) * Math.sin(theta) * Math.cos(phi),
        Math.cos(gamma) * Math.sin(phi),
      );
      this._camera.up.copy(this._up);
    }

    this._camera.lookAt(this._lookAt);
    return this;
  }

  /**
   * Get spherical coordinates relative to the look-at point.
   * @returns Object with phi (polar), theta (azimuthal), and distance
   */
  getOrbitAngles(): { phi: number; theta: number; distance: number } {
    // Read from the live Three.js camera, not the cached this._position.
    // External drivers (OrbitControls) move the camera directly and never
    // touch this._position, so the cache goes stale during a drag (issue #425).
    const dx = this._camera.position.x - this._lookAt.x;
    const dy = this._camera.position.y - this._lookAt.y;
    const dz = this._camera.position.z - this._lookAt.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Camera coincident with the look-at point: angles are undefined. Avoid
    // dividing by zero (which would yield NaN) and keep the last azimuth.
    if (distance < 1e-9) {
      return { phi: 0, theta: this._lastTheta, distance: 0 };
    }

    const phi = Math.acos(dz / distance);

    // At poles (sin(phi) ≈ 0), atan2(0,0) returns 0, losing azimuth.
    // Preserve the last known theta to avoid gimbal lock artifacts.
    const sinPhi = Math.sin(phi);
    if (Math.abs(sinPhi) < 1e-6) {
      return { phi, theta: this._lastTheta, distance };
    }

    // Remember the live azimuth so a subsequent drag to the pole can fall
    // back to it rather than to a stale programmatic theta.
    const theta = Math.atan2(dy, dx);
    this._lastTheta = theta;

    return { phi, theta, distance };
  }
}

/**
 * How `Camera2D.setAspectRatio` reconciles the user-set frame with the
 * viewport's pixel aspect.
 *
 * - `'fill'` (default): keep `frameHeight`, recompute `frameWidth` from
 *   the viewport aspect. Frame is cropped horizontally on wider viewports
 *   and over-shows on narrower ones. Back-compatible.
 * - `'contain'`: keep both base `frameWidth` and `frameHeight`. Grow
 *   whichever dimension is needed to letterbox so the user's full
 *   frame is always visible (no cropping of the intended view).
 */
export type Camera2DAspectMode = 'fill' | 'contain';

/**
 * Options for configuring a Camera2D.
 */
export interface CameraOptions {
  /** Width of the visible frame in world units. Defaults to 14 (Manim standard). */
  frameWidth?: number;
  /** Height of the visible frame in world units. Defaults to 8 (Manim standard). */
  frameHeight?: number;
  /** Initial camera position [x, y, z]. Defaults to [0, 0, 10]. */
  position?: [number, number, number];
  /**
   * Behaviour of `setAspectRatio` when the viewport aspect doesn't match
   * this camera's frame. Defaults to `'fill'` for back-compat — set to
   * `'contain'` (recommended for multi-camera layouts) to make per-camera
   * `frameWidth`/`frameHeight` zoom intent survive the per-viewport
   * aspect adjustment.
   */
  aspectMode?: Camera2DAspectMode;
}

/**
 * 2D camera for manimweb scenes.
 * Wraps Three.js OrthographicCamera with Manim-style frame dimensions.
 */
export class Camera2D {
  private _camera: THREE.OrthographicCamera;
  private _frameWidth: number;
  private _frameHeight: number;
  /**
   * The frame dimensions the user *asked for*, preserved across
   * `setAspectRatio` calls when `_aspectMode === 'contain'`. Updated
   * whenever the user mutates `frameWidth`/`frameHeight` directly.
   */
  private _userFrameWidth: number;
  private _userFrameHeight: number;
  private _aspectMode: Camera2DAspectMode;
  private _frame: Camera2DFrame | null = null;

  /**
   * Create a new 2D camera.
   * @param options - Camera configuration options
   */
  constructor(options: CameraOptions = {}) {
    const {
      frameWidth = 14,
      frameHeight = 8,
      position = [0, 0, 10],
      aspectMode = 'fill',
    } = options;

    this._frameWidth = frameWidth;
    this._frameHeight = frameHeight;
    this._userFrameWidth = frameWidth;
    this._userFrameHeight = frameHeight;
    this._aspectMode = aspectMode;

    // OrthographicCamera(left, right, top, bottom, near, far)
    const halfWidth = frameWidth / 2;
    const halfHeight = frameHeight / 2;

    this._camera = new THREE.OrthographicCamera(
      -halfWidth, // left
      halfWidth, // right
      halfHeight, // top
      -halfHeight, // bottom
      0.1, // near
      1000, // far
    );

    this._camera.position.set(position[0], position[1], position[2]);
    this._camera.lookAt(position[0], position[1], 0);
  }

  /**
   * Get the frame width in world units.
   */
  get frameWidth(): number {
    return this._frameWidth;
  }

  /**
   * Set the frame width in world units.
   */
  set frameWidth(width: number) {
    this._frameWidth = width;
    this._userFrameWidth = width;
    this._updateProjection();
  }

  /**
   * Get the frame height in world units.
   */
  get frameHeight(): number {
    return this._frameHeight;
  }

  /**
   * Set the frame height in world units.
   */
  set frameHeight(height: number) {
    this._frameHeight = height;
    this._userFrameHeight = height;
    this._updateProjection();
  }

  /**
   * Get the current aspect-mode (see {@link Camera2DAspectMode}).
   */
  get aspectMode(): Camera2DAspectMode {
    return this._aspectMode;
  }

  /**
   * Set the aspect-mode. Re-applies the current aspect ratio so the
   * projection updates immediately.
   */
  set aspectMode(mode: Camera2DAspectMode) {
    if (mode === this._aspectMode) return;
    this._aspectMode = mode;
    const currentAspect = this._frameWidth / this._frameHeight;
    this.setAspectRatio(currentAspect);
  }

  /**
   * Get the camera position.
   */
  get position(): THREE.Vector3 {
    return this._camera.position;
  }

  /**
   * Move the camera to a specific point.
   * @param point - Target position [x, y, z]
   */
  moveTo(point: [number, number, number]): void {
    this._camera.position.set(point[0], point[1], point[2]);
    this._camera.lookAt(point[0], point[1], 0);
  }

  /**
   * Get the underlying Three.js OrthographicCamera.
   * @returns The OrthographicCamera instance
   */
  getCamera(): THREE.OrthographicCamera {
    return this._camera;
  }

  /**
   * Update the frame dimensions to match an aspect ratio.
   * Useful for responsive layouts.
   * @param aspectRatio - Width / height ratio
   */
  setAspectRatio(aspectRatio: number): void {
    if (this._aspectMode === 'contain') {
      // Letterbox: keep the user's base frame fully visible. Grow whichever
      // dimension is needed so the rendered frame matches the viewport
      // aspect without cropping either side of the user's box.
      const baseAspect = this._userFrameWidth / this._userFrameHeight;
      if (aspectRatio >= baseAspect) {
        // Viewport wider than user's frame -> pad width.
        this._frameHeight = this._userFrameHeight;
        this._frameWidth = this._userFrameHeight * aspectRatio;
      } else {
        // Viewport taller than user's frame -> pad height.
        this._frameWidth = this._userFrameWidth;
        this._frameHeight = this._userFrameWidth / aspectRatio;
      }
    } else {
      // 'fill' (legacy): keep frame height, recompute width.
      this._frameWidth = this._frameHeight * aspectRatio;
    }
    this._updateProjection();
  }

  /**
   * Lazy-created Camera2DFrame for Manim-style camera.frame API.
   * The frame is a VMobject whose position and scale drive the camera,
   * enabling animations like Restore, MoveToTarget, and updaters.
   */
  get frame(): Camera2DFrame {
    if (!this._frame) {
      this._frame = new Camera2DFrame(this);
    }
    return this._frame;
  }

  /**
   * Run updaters on the camera frame (if it exists).
   * Called by Scene after the timeline update so camera updaters
   * see the latest positions set by animations.
   */
  updateFrame(dt: number): void {
    if (this._frame) {
      this._frame.update(dt);
    }
  }

  /**
   * Update projection matrix after frame dimension changes.
   */
  private _updateProjection(): void {
    const halfWidth = this._frameWidth / 2;
    const halfHeight = this._frameHeight / 2;

    this._camera.left = -halfWidth;
    this._camera.right = halfWidth;
    this._camera.top = halfHeight;
    this._camera.bottom = -halfHeight;

    this._camera.updateProjectionMatrix();
  }
}
