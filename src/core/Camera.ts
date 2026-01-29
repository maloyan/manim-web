import * as THREE from 'three';

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
   */
  get position(): THREE.Vector3 {
    return this._position.clone();
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
   * @param phi - Polar angle from Y axis (0 = top, PI = bottom)
   * @param theta - Azimuthal angle in XZ plane
   * @param distance - Optional distance from look-at point
   * @returns this for chaining
   */
  orbit(phi: number, theta: number, distance?: number): this {
    const dist = distance ?? this._position.distanceTo(this._lookAt);

    this._position.x = this._lookAt.x + dist * Math.sin(phi) * Math.cos(theta);
    this._position.y = this._lookAt.y + dist * Math.cos(phi);
    this._position.z = this._lookAt.z + dist * Math.sin(phi) * Math.sin(theta);

    this._camera.position.copy(this._position);
    this._camera.lookAt(this._lookAt);
    return this;
  }

  /**
   * Get spherical coordinates relative to the look-at point.
   * @returns Object with phi (polar), theta (azimuthal), and distance
   */
  getOrbitAngles(): { phi: number; theta: number; distance: number } {
    const dx = this._position.x - this._lookAt.x;
    const dy = this._position.y - this._lookAt.y;
    const dz = this._position.z - this._lookAt.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return {
      phi: Math.acos(dy / distance),
      theta: Math.atan2(dz, dx),
      distance,
    };
  }
}

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
   * Create a new 2D camera.
   * @param options - Camera configuration options
   */
  constructor(options: CameraOptions = {}) {
    const {
      frameWidth = 14,
      frameHeight = 8,
      position = [0, 0, 10],
    } = options;

    this._frameWidth = frameWidth;
    this._frameHeight = frameHeight;

    // OrthographicCamera(left, right, top, bottom, near, far)
    const halfWidth = frameWidth / 2;
    const halfHeight = frameHeight / 2;

    this._camera = new THREE.OrthographicCamera(
      -halfWidth,  // left
      halfWidth,   // right
      halfHeight,  // top
      -halfHeight, // bottom
      0.1,         // near
      1000         // far
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
    this._updateProjection();
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
    // Keep frame height, adjust width to match aspect ratio
    this._frameWidth = this._frameHeight * aspectRatio;
    this._updateProjection();
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
