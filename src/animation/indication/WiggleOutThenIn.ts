/**
 * WiggleOutThenIn animation - wiggles a mobject outward (scaling up with
 * rotation oscillation) and then back to its original state.
 *
 * This mimics Manim's WiggleOutThenIn animation. The mobject scales up
 * to a peak scale factor using a there-and-back envelope, while
 * simultaneously rotating back and forth with a sine-based oscillation
 * that starts and ends at zero.
 *
 * Parameters:
 * - scaleValue: peak scale factor (default 1.1)
 * - rotationAngle: maximum rotation in radians (default 0.01 * TAU)
 * - nWiggles: number of rotation oscillations (default 6)
 * - rotationAxis: axis to rotate about (default Z axis)
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { linear } from '../../rate-functions';
import { smoothstep } from '../../utils/math';

/** TAU = 2 * PI, full circle in radians */
const TAU = 2 * Math.PI;

export interface WiggleOutThenInOptions extends AnimationOptions {
  /** Peak scale factor. Default: 1.1 */
  scaleValue?: number;
  /** Maximum rotation angle in radians. Default: 0.01 * TAU (~3.6 degrees) */
  rotationAngle?: number;
  /** Number of rotation oscillations. Default: 6 */
  nWiggles?: number;
  /** Axis to rotate about. Default: [0, 0, 1] (Z axis) */
  rotationAxis?: Vector3Tuple;
}

/**
 * Manim's there_and_back: smooth ramp up to 1 at t=0.5, back to 0 at t=1.
 * Used internally for the scale envelope.
 */
function thereAndBackSmooth(t: number): number {
  return t < 0.5 ? smoothstep(2 * t) : smoothstep(2 * (1 - t));
}

/**
 * Manim's wiggle function: sinusoidal oscillation with smooth envelope.
 * Returns value that starts at 0, oscillates nWiggles times, ends at 0.
 */
function wiggle(t: number, nWiggles: number): number {
  return Math.sin(nWiggles * TAU * t) * thereAndBackSmooth(t);
}

/**
 * Linear interpolation between two values.
 */
function interpolateValue(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha;
}

export class WiggleOutThenIn extends Animation {
  /** Peak scale factor */
  readonly scaleValue: number;

  /** Maximum rotation angle */
  readonly rotationAngle: number;

  /** Number of oscillations */
  readonly nWiggles: number;

  /** Rotation axis */
  readonly rotationAxis: Vector3Tuple;

  /** Initial rotation quaternion */
  private _initialQuaternion: THREE.Quaternion = new THREE.Quaternion();

  /** Initial scale */
  private _initialScale: THREE.Vector3 = new THREE.Vector3();

  /** Initial position */
  private _initialPosition: THREE.Vector3 = new THREE.Vector3();

  /** Rotation axis as Vector3 */
  private _axisVector: THREE.Vector3 = new THREE.Vector3();

  /** About point (center of mobject) */
  private _aboutPoint: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: WiggleOutThenInOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 2,
      rateFunc: options.rateFunc ?? linear,
    });
    this.scaleValue = options.scaleValue ?? 1.1;
    this.rotationAngle = options.rotationAngle ?? 0.01 * TAU;
    this.nWiggles = options.nWiggles ?? 6;
    this.rotationAxis = options.rotationAxis ?? [0, 0, 1];
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

    // Use mobject center as the rotation pivot
    const center = this.mobject.getCenter();
    this._aboutPoint.set(center[0], center[1], center[2]);
  }

  interpolate(alpha: number): void {
    // Scale: there-and-back envelope, peaks at alpha=0.5
    const scaleAlpha = thereAndBackSmooth(alpha);
    const currentScaleFactor = interpolateValue(1, this.scaleValue, scaleAlpha);
    this.mobject.scaleVector.set(
      this._initialScale.x * currentScaleFactor,
      this._initialScale.y * currentScaleFactor,
      this._initialScale.z * currentScaleFactor
    );

    // Rotation: sinusoidal oscillation with smooth envelope
    const currentAngle = wiggle(alpha, this.nWiggles) * this.rotationAngle;

    // Create rotation quaternion
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(
      this._axisVector,
      currentAngle
    );

    // Apply rotation to initial quaternion
    const newQuat = new THREE.Quaternion().copy(this._initialQuaternion);
    newQuat.premultiply(rotationQuat);
    this.mobject.rotation.setFromQuaternion(newQuat);

    // Handle rotation about the center point
    const offset = new THREE.Vector3()
      .copy(this._initialPosition)
      .sub(this._aboutPoint);
    offset.applyQuaternion(rotationQuat);
    const newPosition = new THREE.Vector3()
      .copy(this._aboutPoint)
      .add(offset);
    this.mobject.position.copy(newPosition);

    this.mobject._markDirty();
  }

  override finish(): void {
    // Restore original state completely
    this.mobject.rotation.setFromQuaternion(this._initialQuaternion);
    this.mobject.scaleVector.copy(this._initialScale);
    this.mobject.position.copy(this._initialPosition);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a WiggleOutThenIn animation for a mobject.
 * Scales the mobject outward while oscillating rotation, then returns to original.
 * @param mobject The mobject to wiggle
 * @param options WiggleOutThenIn options (scaleValue, rotationAngle, nWiggles, rotationAxis)
 */
export function wiggleOutThenIn(
  mobject: Mobject,
  options?: WiggleOutThenInOptions
): WiggleOutThenIn {
  return new WiggleOutThenIn(mobject, options);
}
