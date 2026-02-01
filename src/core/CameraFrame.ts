/**
 * CameraFrame - ManimGL-style camera frame with Euler angle control and animation support.
 *
 * Provides programmatic camera animation via:
 *   frame.incrementPhi(PI/4)         // tilt up (immediate)
 *   frame.incrementTheta(PI/4)       // orbit right (immediate)
 *   scene.play(frame.animate.incrementPhi(PI/4))  // smooth tilt
 *   scene.play(frame.animate.setEulerAngles({ theta: PI/4, phi: PI/3 }))
 *
 * Euler angle convention (matching ManimGL):
 *   theta = azimuthal angle (horizontal orbit in XZ plane)
 *   phi   = polar angle (vertical tilt from Y axis, 0 = top, PI = bottom)
 *   gamma = roll angle (rotation around the viewing axis)
 */

import * as THREE from 'three';
import { Camera3D, Camera3DOptions } from './Camera';
import { Animation, AnimationOptions } from '../animation/Animation';
import { Mobject, Vector3Tuple } from './Mobject';
import { RateFunction, smooth } from '../rate-functions';

// ---------------------------------------------------------------------------
// CameraFrame
// ---------------------------------------------------------------------------

/**
 * Options for creating a CameraFrame.
 */
export interface CameraFrameOptions extends Camera3DOptions {
  /** Initial theta (azimuthal) angle in radians. Defaults to -PI/2. */
  theta?: number;
  /** Initial phi (polar) angle in radians. Defaults to PI/4. */
  phi?: number;
  /** Initial gamma (roll) angle in radians. Defaults to 0. */
  gamma?: number;
  /** Initial distance from the look-at target. Defaults to 10. */
  distance?: number;
}

/**
 * CameraFrame wraps a Camera3D and exposes ManimGL-compatible Euler angle
 * methods for both immediate use and animation (via the `.animate` proxy).
 */
export class CameraFrame {
  private _camera3D: Camera3D;
  private _theta: number;
  private _phi: number;
  private _gamma: number;
  private _distance: number;
  private _fov: number;
  private _center: THREE.Vector3;

  /**
   * A lightweight Mobject stub used as the Animation target.
   * This lets CameraAnimation integrate with the existing Timeline / Scene.play()
   * system which requires every Animation to have a `.mobject`.
   */
  readonly mobjectStub: Mobject;

  constructor(aspectRatio: number = 16 / 9, options: CameraFrameOptions = {}) {
    this._theta = options.theta ?? -Math.PI / 2;
    this._phi = options.phi ?? Math.PI / 4;
    this._gamma = options.gamma ?? 0;
    this._distance = options.distance ?? 10;
    this._fov = options.fov ?? 45;
    this._center = new THREE.Vector3(...(options.lookAt ?? [0, 0, 0]));

    const cam3dOpts: Camera3DOptions = {
      fov: this._fov,
      near: options.near,
      far: options.far,
      position: options.position ?? [0, 0, this._distance],
      lookAt: options.lookAt,
    };

    this._camera3D = new Camera3D(aspectRatio, cam3dOpts);
    this._syncPositionFromAngles();

    // Lightweight stub so Animation infrastructure can reference us.
    // We create a minimal concrete Mobject subclass inline.
    this.mobjectStub = new CameraFrameStub();
  }

  // -----------------------------------------------------------------------
  // Underlying Three.js camera access
  // -----------------------------------------------------------------------

  /** Get the underlying Camera3D instance. */
  getCamera3D(): Camera3D {
    return this._camera3D;
  }

  /** Get the underlying Three.js PerspectiveCamera. */
  getThreeCamera(): THREE.PerspectiveCamera {
    return this._camera3D.getCamera();
  }

  // -----------------------------------------------------------------------
  // Euler angles
  // -----------------------------------------------------------------------

  /** Get the current Euler angles [theta, phi, gamma]. */
  getEulerAngles(): [number, number, number] {
    return [this._theta, this._phi, this._gamma];
  }

  /**
   * Set Euler angles (absolute). Any parameter left undefined is unchanged.
   * @returns this for chaining
   */
  setEulerAngles(opts: { theta?: number; phi?: number; gamma?: number }): this {
    if (opts.theta !== undefined) this._theta = opts.theta;
    if (opts.phi !== undefined) this._phi = opts.phi;
    if (opts.gamma !== undefined) this._gamma = opts.gamma;
    this._syncPositionFromAngles();
    return this;
  }

  /** Get the current theta (azimuthal) angle. */
  getTheta(): number {
    return this._theta;
  }

  /** Set the theta (azimuthal) angle absolutely. */
  setTheta(value: number): this {
    this._theta = value;
    this._syncPositionFromAngles();
    return this;
  }

  /** Increment the theta (azimuthal) angle by delta. */
  incrementTheta(delta: number): this {
    this._theta += delta;
    this._syncPositionFromAngles();
    return this;
  }

  /** Get the current phi (polar) angle. */
  getPhi(): number {
    return this._phi;
  }

  /** Set the phi (polar) angle absolutely. */
  setPhi(value: number): this {
    this._phi = value;
    this._syncPositionFromAngles();
    return this;
  }

  /** Increment the phi (polar) angle by delta. */
  incrementPhi(delta: number): this {
    this._phi += delta;
    this._syncPositionFromAngles();
    return this;
  }

  /** Get the current gamma (roll) angle. */
  getGamma(): number {
    return this._gamma;
  }

  /** Set the gamma (roll) angle absolutely. */
  setGamma(value: number): this {
    this._gamma = value;
    this._syncPositionFromAngles();
    return this;
  }

  /** Increment the gamma (roll) angle by delta. */
  incrementGamma(delta: number): this {
    this._gamma += delta;
    this._syncPositionFromAngles();
    return this;
  }

  // -----------------------------------------------------------------------
  // Position / distance / FOV
  // -----------------------------------------------------------------------

  /** Get the distance from the look-at target. */
  getDistance(): number {
    return this._distance;
  }

  /** Set the distance from the look-at target. */
  setDistance(value: number): this {
    this._distance = Math.max(0.1, value);
    this._syncPositionFromAngles();
    return this;
  }

  /** Get the current field of view in degrees. */
  getFieldOfView(): number {
    return this._fov;
  }

  /** Set the field of view in degrees. */
  setFieldOfView(fov: number): this {
    this._fov = fov;
    this._camera3D.setFov(fov);
    return this;
  }

  /** Get the look-at center. */
  getCenter(): Vector3Tuple {
    return [this._center.x, this._center.y, this._center.z];
  }

  /** Move the look-at center to a point. Camera position updates accordingly. */
  moveTo(point: Vector3Tuple): this {
    this._center.set(point[0], point[1], point[2]);
    this._syncPositionFromAngles();
    return this;
  }

  /** Set the aspect ratio of the underlying camera. */
  setAspectRatio(ratio: number): this {
    this._camera3D.setAspectRatio(ratio);
    return this;
  }

  // -----------------------------------------------------------------------
  // Internal sync: angles -> Three.js camera position/orientation
  // -----------------------------------------------------------------------

  /** Compute camera position from spherical (theta, phi, distance) around _center. */
  private _syncPositionFromAngles(): void {
    const x = this._center.x + this._distance * Math.sin(this._phi) * Math.cos(this._theta);
    const y = this._center.y + this._distance * Math.cos(this._phi);
    const z = this._center.z + this._distance * Math.sin(this._phi) * Math.sin(this._theta);

    this._camera3D.moveTo([x, y, z]);
    this._camera3D.setLookAt([this._center.x, this._center.y, this._center.z]);

    // Apply roll (gamma) by rotating the camera's "up" vector
    if (this._gamma !== 0) {
      const cam = this._camera3D.getCamera();
      // The viewing direction (from camera to target)
      const viewDir = new THREE.Vector3(
        this._center.x - x,
        this._center.y - y,
        this._center.z - z,
      ).normalize();

      // Default up is world Y
      const up = new THREE.Vector3(0, 1, 0);
      // Rotate the up vector around the view direction by gamma
      up.applyAxisAngle(viewDir, this._gamma);
      cam.up.copy(up);
      cam.lookAt(this._center);
    } else {
      const cam = this._camera3D.getCamera();
      cam.up.set(0, 1, 0);
      cam.lookAt(this._center);
    }
  }

  // -----------------------------------------------------------------------
  // Snapshot / restore (used internally by CameraAnimation)
  // -----------------------------------------------------------------------

  /** Capture the current camera state. */
  _snapshot(): CameraFrameState {
    return {
      theta: this._theta,
      phi: this._phi,
      gamma: this._gamma,
      distance: this._distance,
      fov: this._fov,
      center: [this._center.x, this._center.y, this._center.z] as Vector3Tuple,
    };
  }

  /** Apply a full camera state. */
  _applyState(state: CameraFrameState): void {
    this._theta = state.theta;
    this._phi = state.phi;
    this._gamma = state.gamma;
    this._distance = state.distance;
    this._fov = state.fov;
    this._center.set(state.center[0], state.center[1], state.center[2]);
    this._camera3D.setFov(state.fov);
    this._syncPositionFromAngles();
  }

  // -----------------------------------------------------------------------
  // Animation proxy
  // -----------------------------------------------------------------------

  /**
   * Returns a proxy that records camera state changes and produces a
   * CameraAnimation when called with `scene.play()`.
   *
   * Usage (property, default 1s smooth):
   *   scene.play(frame.animate.incrementPhi(PI/4))
   *   scene.play(frame.animate.setEulerAngles({ theta: PI/4, phi: PI/3 }))
   *
   * Usage (method with options):
   *   scene.play(frame.animateTo({ duration: 2 }).incrementPhi(PI/4))
   */
  get animate(): CameraAnimateProxy {
    return new CameraAnimateProxy(this);
  }

  /**
   * Like `animate`, but accepts AnimationOptions (duration, rateFunc).
   */
  animateTo(options: CameraAnimationOptions = {}): CameraAnimateProxy {
    return new CameraAnimateProxy(this, options);
  }
}

// ---------------------------------------------------------------------------
// Camera state snapshot
// ---------------------------------------------------------------------------

export interface CameraFrameState {
  theta: number;
  phi: number;
  gamma: number;
  distance: number;
  fov: number;
  center: Vector3Tuple;
}

// ---------------------------------------------------------------------------
// CameraFrameStub - minimal Mobject subclass for the Animation system
// ---------------------------------------------------------------------------

/**
 * A no-op Mobject that serves as the animation target for CameraAnimation.
 * It is never rendered; it exists solely so CameraAnimation satisfies the
 * Animation base class contract (every Animation has a `.mobject`).
 */
class CameraFrameStub extends Mobject {
  constructor() {
    super();
  }

  /** Return an invisible Three.js group (never added to scene graph). */
  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Group();
  }

  /** No-op: camera stub has no Three.js representation. */
  _syncToThree(): void {
    // intentional no-op
  }

  /** No resources to dispose. */
  dispose(): void {
    // intentional no-op
  }

  protected _createCopy(): CameraFrameStub {
    return new CameraFrameStub();
  }
}

// ---------------------------------------------------------------------------
// CameraAnimateProxy - records desired state, builds CameraAnimation
// ---------------------------------------------------------------------------

export interface CameraAnimationOptions extends AnimationOptions {
  // No additional options needed; AnimationOptions provides duration + rateFunc.
}

/**
 * Fluent builder returned by `CameraFrame.animate`.
 *
 * Each method records a target state change and returns `this`,
 * so you can chain: `frame.animate.incrementPhi(PI/4).setFieldOfView(60)`.
 *
 * The proxy itself is used as the Animation argument to `scene.play()`.
 * When play() calls `.begin()`, the proxy finalises the CameraAnimation.
 */
export class CameraAnimateProxy extends Animation {
  private _frame: CameraFrame;
  private _targetDelta: Partial<CameraFrameState> = {};
  private _absolute: Partial<CameraFrameState> = {};
  private _startState!: CameraFrameState;

  constructor(frame: CameraFrame, options: CameraAnimationOptions = {}) {
    super(frame.mobjectStub, { duration: options.duration ?? 1, rateFunc: options.rateFunc ?? smooth });
    this._frame = frame;
  }

  // ----- builder methods (return this so it doubles as the Animation) -----

  /** Animate setting Euler angles (absolute targets). */
  setEulerAngles(opts: { theta?: number; phi?: number; gamma?: number }): this {
    if (opts.theta !== undefined) this._absolute.theta = opts.theta;
    if (opts.phi !== undefined) this._absolute.phi = opts.phi;
    if (opts.gamma !== undefined) this._absolute.gamma = opts.gamma;
    return this;
  }

  /** Animate incrementing theta by delta. */
  incrementTheta(delta: number): this {
    this._targetDelta.theta = (this._targetDelta.theta ?? 0) + delta;
    return this;
  }

  /** Animate incrementing phi by delta. */
  incrementPhi(delta: number): this {
    this._targetDelta.phi = (this._targetDelta.phi ?? 0) + delta;
    return this;
  }

  /** Animate incrementing gamma by delta. */
  incrementGamma(delta: number): this {
    this._targetDelta.gamma = (this._targetDelta.gamma ?? 0) + delta;
    return this;
  }

  /** Animate setting distance. */
  setDistance(value: number): this {
    this._absolute.distance = value;
    return this;
  }

  /** Animate setting field of view. */
  setFieldOfView(fov: number): this {
    this._absolute.fov = fov;
    return this;
  }

  /** Animate moving the look-at center. */
  moveTo(point: Vector3Tuple): this {
    this._absolute.center = point;
    return this;
  }

  /** Override duration for this animation (builder-style). */
  withDuration(seconds: number): this {
    Object.defineProperty(this, 'duration', { value: seconds, writable: false });
    return this;
  }

  /** Override rate function (builder-style). */
  withRateFunc(fn: RateFunction): this {
    Object.defineProperty(this, 'rateFunc', { value: fn, writable: false });
    return this;
  }

  // ----- Animation lifecycle overrides -----

  override begin(): void {
    super.begin();
    // Snapshot the frame state at animation start
    this._startState = this._frame._snapshot();
  }

  /**
   * Interpolate camera state at the given alpha (0..1).
   */
  interpolate(alpha: number): void {
    const start = this._startState;

    // Compute target state from start + deltas + absolutes
    const targetTheta = this._absolute.theta ?? (start.theta + (this._targetDelta.theta ?? 0));
    const targetPhi = this._absolute.phi ?? (start.phi + (this._targetDelta.phi ?? 0));
    const targetGamma = this._absolute.gamma ?? (start.gamma + (this._targetDelta.gamma ?? 0));
    const targetDistance = this._absolute.distance ?? (start.distance + (this._targetDelta.distance ?? 0));
    const targetFov = this._absolute.fov ?? (start.fov + (this._targetDelta.fov ?? 0));
    const targetCenter = this._absolute.center ?? start.center;

    // Linearly interpolate every property
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const state: CameraFrameState = {
      theta: lerp(start.theta, targetTheta, alpha),
      phi: lerp(start.phi, targetPhi, alpha),
      gamma: lerp(start.gamma, targetGamma, alpha),
      distance: lerp(start.distance, targetDistance, alpha),
      fov: lerp(start.fov, targetFov, alpha),
      center: [
        lerp(start.center[0], targetCenter[0], alpha),
        lerp(start.center[1], targetCenter[1], alpha),
        lerp(start.center[2], targetCenter[2], alpha),
      ],
    };

    this._frame._applyState(state);
  }

  override finish(): void {
    this.interpolate(1);
    super.finish();
  }

  /** Get the CameraFrame this proxy animates. */
  getFrame(): CameraFrame {
    return this._frame;
  }
}
