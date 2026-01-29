/**
 * Rotate animation - rotates a mobject around an axis.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

export interface RotateOptions extends AnimationOptions {
  /** Angle to rotate in radians */
  angle: number;
  /** Axis of rotation [x, y, z], defaults to Z axis [0, 0, 1] */
  axis?: Vector3Tuple;
  /** Point to rotate about, defaults to mobject center */
  aboutPoint?: Vector3Tuple;
}

export class Rotate extends Animation {
  /** Angle to rotate in radians */
  readonly angle: number;

  /** Axis of rotation */
  readonly axis: Vector3Tuple;

  /** Point to rotate about */
  readonly aboutPoint: Vector3Tuple | null;

  /** Initial rotation stored as quaternion */
  private _initialQuaternion: THREE.Quaternion = new THREE.Quaternion();

  /** Initial position (for rotation about a point) */
  private _initialPosition: THREE.Vector3 = new THREE.Vector3();

  /** Rotation axis as THREE.Vector3 */
  private _axisVector: THREE.Vector3 = new THREE.Vector3();

  /** About point as THREE.Vector3 */
  private _aboutPointVector: THREE.Vector3 | null = null;

  constructor(mobject: Mobject, options: RotateOptions) {
    super(mobject, options);
    this.angle = options.angle;
    this.axis = options.axis ?? [0, 0, 1];
    this.aboutPoint = options.aboutPoint ?? null;
  }

  /**
   * Set up the animation - store initial rotation
   */
  override begin(): void {
    super.begin();

    // Store initial rotation as quaternion
    this._initialQuaternion.setFromEuler(this.mobject.rotation);

    // Store initial position
    this._initialPosition.copy(this.mobject.position);

    // Prepare axis vector (normalized)
    this._axisVector.set(this.axis[0], this.axis[1], this.axis[2]).normalize();

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
   * Interpolate the rotation at the given alpha
   */
  interpolate(alpha: number): void {
    const currentAngle = this.angle * alpha;

    // Create rotation quaternion for current angle
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(
      this._axisVector,
      currentAngle
    );

    // Apply rotation to initial quaternion
    const newQuat = new THREE.Quaternion().copy(this._initialQuaternion);
    newQuat.premultiply(rotationQuat);

    // Set the new rotation
    this.mobject.rotation.setFromQuaternion(newQuat);

    // Handle rotation about a point
    if (this._aboutPointVector) {
      // Translate position: rotate initial position around aboutPoint
      const offset = new THREE.Vector3().copy(this._initialPosition).sub(this._aboutPointVector);
      offset.applyQuaternion(rotationQuat);
      const newPosition = new THREE.Vector3().copy(this._aboutPointVector).add(offset);

      this.mobject.position.copy(newPosition);
    }

    this.mobject._markDirty();
  }

  /**
   * Ensure the rotation is exact at the end
   */
  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}

/**
 * Create a Rotate animation for a mobject.
 * @param mobject The mobject to rotate
 * @param angle Angle to rotate in radians
 * @param options Animation options (duration, rateFunc, axis, aboutPoint)
 */
export function rotate(
  mobject: Mobject,
  angle: number,
  options?: Omit<RotateOptions, 'angle'>
): Rotate {
  return new Rotate(mobject, { ...options, angle });
}
