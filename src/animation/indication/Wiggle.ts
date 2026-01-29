/**
 * Wiggle animation - makes a mobject wiggle back and forth.
 *
 * This mimics Manim's Wiggle animation, which rotates the mobject
 * back and forth around a point with optional scaling.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { linear } from '../../rate-functions';

export interface WiggleOptions extends AnimationOptions {
  /** Maximum rotation angle in radians. Default: PI/12 (15 degrees) */
  rotationAngle?: number;
  /** Number of wiggles. Default: 6 */
  nWiggles?: number;
  /** Scale factor at peak of wiggle. Default: 1.1 */
  scaleFactor?: number;
  /** Axis to rotate about. Default: [0, 0, 1] (Z axis) */
  rotationAxis?: Vector3Tuple;
  /** Point to wiggle about. Default: mobject center */
  aboutPoint?: Vector3Tuple;
}

export class Wiggle extends Animation {
  /** Maximum rotation angle */
  readonly rotationAngle: number;

  /** Number of wiggles */
  readonly nWiggles: number;

  /** Scale factor */
  readonly scaleFactor: number;

  /** Rotation axis */
  readonly rotationAxis: Vector3Tuple;

  /** Point to wiggle about */
  readonly aboutPoint: Vector3Tuple | null;

  /** Initial rotation quaternion */
  private _initialQuaternion: THREE.Quaternion = new THREE.Quaternion();

  /** Initial scale */
  private _initialScale: THREE.Vector3 = new THREE.Vector3();

  /** Initial position */
  private _initialPosition: THREE.Vector3 = new THREE.Vector3();

  /** About point as Vector3 */
  private _aboutPointVector: THREE.Vector3 | null = null;

  /** Rotation axis as Vector3 */
  private _axisVector: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: WiggleOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? linear,
    });
    this.rotationAngle = options.rotationAngle ?? Math.PI / 12;
    this.nWiggles = options.nWiggles ?? 6;
    this.scaleFactor = options.scaleFactor ?? 1.1;
    this.rotationAxis = options.rotationAxis ?? [0, 0, 1];
    this.aboutPoint = options.aboutPoint ?? null;
  }

  override begin(): void {
    super.begin();

    // Store initial state
    this._initialQuaternion.setFromEuler(this.mobject.rotation);
    this._initialScale.copy(this.mobject.scaleVector);
    this._initialPosition.copy(this.mobject.position);

    // Set up rotation axis
    this._axisVector.set(
      this.rotationAxis[0],
      this.rotationAxis[1],
      this.rotationAxis[2]
    ).normalize();

    // Set up about point
    if (this.aboutPoint) {
      this._aboutPointVector = new THREE.Vector3(
        this.aboutPoint[0],
        this.aboutPoint[1],
        this.aboutPoint[2]
      );
    } else {
      const center = this.mobject.getCenter();
      this._aboutPointVector = new THREE.Vector3(center[0], center[1], center[2]);
    }
  }

  interpolate(alpha: number): void {
    // Calculate wiggle angle using sine wave
    // Complete multiple oscillations during the animation
    const wigglePhase = alpha * this.nWiggles * Math.PI * 2;

    // Amplitude envelope: starts at 0, peaks in middle, returns to 0
    // Using sin^2 for smooth envelope
    const envelope = Math.sin(alpha * Math.PI);

    // Current rotation angle
    const currentAngle = Math.sin(wigglePhase) * this.rotationAngle * envelope;

    // Create rotation quaternion
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(
      this._axisVector,
      currentAngle
    );

    // Apply rotation to initial quaternion
    const newQuat = new THREE.Quaternion().copy(this._initialQuaternion);
    newQuat.premultiply(rotationQuat);
    this.mobject.rotation.setFromQuaternion(newQuat);

    // Scale: peaks at middle of animation
    const scaleEnvelope = Math.sin(alpha * Math.PI);
    const currentScaleFactor = 1 + (this.scaleFactor - 1) * scaleEnvelope;
    this.mobject.scaleVector.set(
      this._initialScale.x * currentScaleFactor,
      this._initialScale.y * currentScaleFactor,
      this._initialScale.z * currentScaleFactor
    );

    // Handle rotation about a point
    if (this._aboutPointVector) {
      const offset = new THREE.Vector3().copy(this._initialPosition).sub(this._aboutPointVector);
      offset.applyQuaternion(rotationQuat);
      const newPosition = new THREE.Vector3().copy(this._aboutPointVector).add(offset);
      this.mobject.position.copy(newPosition);
    }

    this.mobject._markDirty();
  }

  override finish(): void {
    // Restore original state
    this.mobject.rotation.setFromQuaternion(this._initialQuaternion);
    this.mobject.scaleVector.copy(this._initialScale);
    this.mobject.position.copy(this._initialPosition);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a Wiggle animation for a mobject.
 * Makes the mobject wiggle back and forth with rotation and optional scaling.
 * @param mobject The mobject to wiggle
 * @param options Wiggle options (rotationAngle, nWiggles, scaleFactor, rotationAxis, aboutPoint)
 */
export function wiggle(mobject: Mobject, options?: WiggleOptions): Wiggle {
  return new Wiggle(mobject, options);
}
