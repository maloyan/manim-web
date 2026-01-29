import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Options for configuring OrbitControls.
 */
export interface OrbitControlsOptions {
  /** Enable smooth motion damping. Defaults to true. */
  enableDamping?: boolean;
  /** Damping factor for smooth motion. Defaults to 0.05. */
  dampingFactor?: number;
  /** Enable zoom with scroll wheel. Defaults to true. */
  enableZoom?: boolean;
  /** Enable panning (right-click drag). Defaults to true. */
  enablePan?: boolean;
  /** Enable rotation (left-click drag). Defaults to true. */
  enableRotate?: boolean;
  /** Minimum zoom distance. */
  minDistance?: number;
  /** Maximum zoom distance. */
  maxDistance?: number;
  /** Minimum vertical angle in radians (0 = looking down). */
  minPolarAngle?: number;
  /** Maximum vertical angle in radians (PI = looking up). */
  maxPolarAngle?: number;
  /** Minimum horizontal angle in radians. */
  minAzimuthAngle?: number;
  /** Maximum horizontal angle in radians. */
  maxAzimuthAngle?: number;
  /** Enable auto-rotation. Defaults to false. */
  autoRotate?: boolean;
  /** Auto-rotation speed in degrees per second. Defaults to 2. */
  autoRotateSpeed?: number;
}

/**
 * Wrapper for Three.js OrbitControls providing camera orbit interaction.
 * Allows users to rotate, zoom, and pan the camera around a target point.
 */
export class OrbitControls {
  private _controls: ThreeOrbitControls;
  private _enabled: boolean = true;

  /**
   * Create new OrbitControls.
   * @param camera - The Three.js camera to control
   * @param canvas - The HTML canvas element for mouse events
   * @param options - Controls configuration options
   */
  constructor(
    camera: THREE.Camera,
    canvas: HTMLCanvasElement,
    options?: OrbitControlsOptions
  ) {
    this._controls = new ThreeOrbitControls(camera, canvas);

    this._controls.enableDamping = options?.enableDamping ?? true;
    this._controls.dampingFactor = options?.dampingFactor ?? 0.05;
    this._controls.enableZoom = options?.enableZoom ?? true;
    this._controls.enablePan = options?.enablePan ?? true;
    this._controls.enableRotate = options?.enableRotate ?? true;

    if (options?.minDistance !== undefined) {
      this._controls.minDistance = options.minDistance;
    }
    if (options?.maxDistance !== undefined) {
      this._controls.maxDistance = options.maxDistance;
    }
    if (options?.minPolarAngle !== undefined) {
      this._controls.minPolarAngle = options.minPolarAngle;
    }
    if (options?.maxPolarAngle !== undefined) {
      this._controls.maxPolarAngle = options.maxPolarAngle;
    }
    if (options?.minAzimuthAngle !== undefined) {
      this._controls.minAzimuthAngle = options.minAzimuthAngle;
    }
    if (options?.maxAzimuthAngle !== undefined) {
      this._controls.maxAzimuthAngle = options.maxAzimuthAngle;
    }

    this._controls.autoRotate = options?.autoRotate ?? false;
    this._controls.autoRotateSpeed = options?.autoRotateSpeed ?? 2;
  }

  /**
   * Update the controls. Must be called in the animation loop when damping is enabled.
   */
  update(): void {
    if (this._enabled) {
      this._controls.update();
    }
  }

  /**
   * Enable the controls.
   */
  enable(): void {
    this._enabled = true;
    this._controls.enabled = true;
  }

  /**
   * Disable the controls.
   */
  disable(): void {
    this._enabled = false;
    this._controls.enabled = false;
  }

  /**
   * Check if controls are enabled.
   * @returns true if controls are enabled
   */
  isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Set the target point for the camera to orbit around.
   * @param target - Target position [x, y, z]
   */
  setTarget(target: [number, number, number]): void {
    this._controls.target.set(...target);
  }

  /**
   * Get the current target point.
   * @returns The target position as a Vector3
   */
  getTarget(): THREE.Vector3 {
    return this._controls.target.clone();
  }

  /**
   * Enable or disable damping (smooth motion).
   * @param enabled - Whether damping should be enabled
   */
  setDamping(enabled: boolean): void {
    this._controls.enableDamping = enabled;
  }

  /**
   * Set the damping factor.
   * @param factor - Damping factor (0 = no damping, 1 = full damping)
   */
  setDampingFactor(factor: number): void {
    this._controls.dampingFactor = factor;
  }

  /**
   * Enable or disable auto-rotation.
   * @param enabled - Whether auto-rotation should be enabled
   */
  setAutoRotate(enabled: boolean): void {
    this._controls.autoRotate = enabled;
  }

  /**
   * Set the auto-rotation speed.
   * @param speed - Rotation speed in degrees per second
   */
  setAutoRotateSpeed(speed: number): void {
    this._controls.autoRotateSpeed = speed;
  }

  /**
   * Set zoom distance limits.
   * @param min - Minimum zoom distance
   * @param max - Maximum zoom distance
   */
  setZoomLimits(min: number, max: number): void {
    this._controls.minDistance = min;
    this._controls.maxDistance = max;
  }

  /**
   * Set polar angle limits (vertical rotation).
   * @param min - Minimum angle in radians (0 = looking down)
   * @param max - Maximum angle in radians (PI = looking up)
   */
  setPolarLimits(min: number, max: number): void {
    this._controls.minPolarAngle = min;
    this._controls.maxPolarAngle = max;
  }

  /**
   * Set azimuth angle limits (horizontal rotation).
   * @param min - Minimum angle in radians
   * @param max - Maximum angle in radians
   */
  setAzimuthLimits(min: number, max: number): void {
    this._controls.minAzimuthAngle = min;
    this._controls.maxAzimuthAngle = max;
  }

  /**
   * Reset the camera to its default position and target.
   */
  reset(): void {
    this._controls.reset();
  }

  /**
   * Get the underlying Three.js OrbitControls.
   * @returns The ThreeOrbitControls instance
   */
  getControls(): ThreeOrbitControls {
    return this._controls;
  }

  /**
   * Add an event listener for control changes.
   * @param event - Event type ('change', 'start', 'end')
   * @param callback - Callback function
   */
  addEventListener(
    event: 'change' | 'start' | 'end',
    callback: () => void
  ): void {
    this._controls.addEventListener(event, callback);
  }

  /**
   * Remove an event listener.
   * @param event - Event type ('change', 'start', 'end')
   * @param callback - Callback function to remove
   */
  removeEventListener(
    event: 'change' | 'start' | 'end',
    callback: () => void
  ): void {
    this._controls.removeEventListener(event, callback);
  }

  /**
   * Dispose of the controls and clean up event listeners.
   */
  dispose(): void {
    this._controls.dispose();
  }
}
