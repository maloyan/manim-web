/**
 * Scale animation - scales a mobject uniformly or non-uniformly.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

export interface ScaleOptions extends AnimationOptions {
  /** Scale factor: number for uniform scale, tuple for per-axis scale */
  scaleFactor: number | Vector3Tuple;
  /** Point to scale about, defaults to mobject center */
  aboutPoint?: Vector3Tuple;
}

/**
 * Helper function to lerp between two Vector3
 */
function lerpVector3(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  return new THREE.Vector3(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.z + (b.z - a.z) * t
  );
}

export class Scale extends Animation {
  /** Scale factor */
  readonly scaleFactor: number | Vector3Tuple;

  /** Point to scale about */
  readonly aboutPoint: Vector3Tuple | null;

  /** Initial scale vector */
  private _initialScale: THREE.Vector3 = new THREE.Vector3();

  /** Target scale vector */
  private _targetScale: THREE.Vector3 = new THREE.Vector3();

  /** Initial position */
  private _initialPosition: THREE.Vector3 = new THREE.Vector3();

  /** About point as THREE.Vector3 */
  private _aboutPointVector: THREE.Vector3 | null = null;

  constructor(mobject: Mobject, options: ScaleOptions) {
    super(mobject, options);
    this.scaleFactor = options.scaleFactor;
    this.aboutPoint = options.aboutPoint ?? null;
  }

  /**
   * Set up the animation - store initial scale
   */
  override begin(): void {
    super.begin();

    // Store initial scale
    this._initialScale.copy(this.mobject.scaleVector);

    // Calculate target scale
    if (typeof this.scaleFactor === 'number') {
      this._targetScale.set(
        this._initialScale.x * this.scaleFactor,
        this._initialScale.y * this.scaleFactor,
        this._initialScale.z * this.scaleFactor
      );
    } else {
      // For 2D scenes, z-scale=0 means "preserve z" (matching Python Manim where
      // z*0=0 is a no-op for 2D points). Avoid z=0 which creates a singular
      // transform matrix that breaks Line2/LineMaterial rendering in THREE.js.
      const zFactor = this.scaleFactor[2] === 0 ? 1 : this.scaleFactor[2];
      this._targetScale.set(
        this._initialScale.x * this.scaleFactor[0],
        this._initialScale.y * this.scaleFactor[1],
        this._initialScale.z * zFactor
      );
    }

    // Store initial position
    this._initialPosition.copy(this.mobject.position);

    // Prepare about point
    if (this.aboutPoint) {
      this._aboutPointVector = new THREE.Vector3(
        this.aboutPoint[0],
        this.aboutPoint[1],
        this.aboutPoint[2]
      );
    } else {
      // Default to mobject center
      const center = this.mobject.getCenter();
      this._aboutPointVector = new THREE.Vector3(center[0], center[1], center[2]);
    }
  }

  /**
   * Interpolate the scale at the given alpha
   */
  interpolate(alpha: number): void {
    // Lerp scale
    const newScale = lerpVector3(this._initialScale, this._targetScale, alpha);
    this.mobject.scaleVector.copy(newScale);

    // Handle scale about a point
    if (this._aboutPointVector) {
      // Calculate the scale factor at this alpha
      const currentScaleFactor = new THREE.Vector3(
        newScale.x / this._initialScale.x,
        newScale.y / this._initialScale.y,
        newScale.z / this._initialScale.z
      );

      // Scale position offset from about point
      const offset = new THREE.Vector3().copy(this._initialPosition).sub(this._aboutPointVector);
      offset.multiply(currentScaleFactor);
      const newPosition = new THREE.Vector3().copy(this._aboutPointVector).add(offset);

      this.mobject.position.copy(newPosition);
    }

    this.mobject._markDirty();
  }

  /**
   * Ensure the scale is exact at the end
   */
  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}

/**
 * Create a Scale animation for a mobject.
 * @param mobject The mobject to scale
 * @param factor Scale factor (number for uniform, tuple for per-axis)
 * @param options Animation options (duration, rateFunc, aboutPoint)
 */
export function scale(
  mobject: Mobject,
  factor: number | Vector3Tuple,
  options?: Omit<ScaleOptions, 'scaleFactor'>
): Scale {
  return new Scale(mobject, { ...options, scaleFactor: factor });
}

/**
 * GrowFromCenter options
 */
export interface GrowFromCenterOptions extends AnimationOptions {}

/**
 * GrowFromCenter animation - scales from 0 to 1, appearing from center.
 */
export class GrowFromCenter extends Animation {
  /** Initial scale to restore at begin */
  private _targetScale: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: GrowFromCenterOptions = {}) {
    super(mobject, options);
  }

  /**
   * Set up the animation - start with scale 0
   */
  override begin(): void {
    super.begin();

    // Store the target scale (what the mobject should end up at)
    this._targetScale.copy(this.mobject.scaleVector);

    // Start at scale 0
    this.mobject.scaleVector.set(0, 0, 0);
  }

  /**
   * Interpolate the scale from 0 to target
   */
  interpolate(alpha: number): void {
    this.mobject.scaleVector.set(
      this._targetScale.x * alpha,
      this._targetScale.y * alpha,
      this._targetScale.z * alpha
    );
    this.mobject._markDirty();
  }

  /**
   * Ensure the scale is exact at the end
   */
  override finish(): void {
    this.mobject.scaleVector.copy(this._targetScale);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a GrowFromCenter animation for a mobject.
 * @param mobject The mobject to grow from center
 * @param options Animation options (duration, rateFunc)
 */
export function growFromCenter(
  mobject: Mobject,
  options?: GrowFromCenterOptions
): GrowFromCenter {
  return new GrowFromCenter(mobject, options);
}
