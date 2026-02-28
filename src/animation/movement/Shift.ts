/**
 * Shift animation - translates a mobject by a delta vector.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

export interface ShiftOptions extends AnimationOptions {
  /** Direction/delta to move [dx, dy, dz] */
  direction: Vector3Tuple;
}

export class Shift extends Animation {
  /** Direction to shift */
  readonly direction: Vector3Tuple;

  /** Initial position */
  private _initialPosition: THREE.Vector3 = new THREE.Vector3();

  /** Target position */
  private _targetPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: ShiftOptions) {
    super(mobject, options);
    this.direction = options.direction;
  }

  /**
   * Set up the animation - store initial position
   */
  override begin(): void {
    super.begin();

    // Store initial position
    this._initialPosition.copy(this.mobject.position);

    // Calculate target position
    this._targetPosition.set(
      this._initialPosition.x + this.direction[0],
      this._initialPosition.y + this.direction[1],
      this._initialPosition.z + this.direction[2],
    );
  }

  /**
   * Interpolate the position at the given alpha
   */
  interpolate(alpha: number): void {
    this.mobject.position.set(
      this._initialPosition.x + this.direction[0] * alpha,
      this._initialPosition.y + this.direction[1] * alpha,
      this._initialPosition.z + this.direction[2] * alpha,
    );
    this.mobject._markDirty();
  }

  /**
   * Ensure the position is exact at the end by applying rateFunc(1)
   */
  override finish(): void {
    const finalAlpha = this.rateFunc(1);
    this.mobject.position.set(
      this._initialPosition.x + this.direction[0] * finalAlpha,
      this._initialPosition.y + this.direction[1] * finalAlpha,
      this._initialPosition.z + this.direction[2] * finalAlpha,
    );
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a Shift animation for a mobject.
 * @param mobject The mobject to shift
 * @param direction Direction/delta to move [dx, dy, dz]
 * @param options Animation options (duration, rateFunc)
 */
export function shift(
  mobject: Mobject,
  direction: Vector3Tuple,
  options?: Omit<ShiftOptions, 'direction'>,
): Shift {
  return new Shift(mobject, { ...options, direction });
}

/**
 * MoveToTargetPosition options - moves mobject to its targetPosition property.
 */
export type MoveToTargetPositionOptions = AnimationOptions;

/**
 * Interface for mobjects with a targetPosition property.
 */
export interface MobjectWithTargetPosition extends Mobject {
  targetPosition?: Vector3Tuple;
}

/**
 * MoveToTargetPosition animation - moves a mobject to its targetPosition property.
 */
export class MoveToTargetPosition extends Animation {
  /** Initial position */
  private _initialPosition: THREE.Vector3 = new THREE.Vector3();

  /** Target position */
  private _targetPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: MobjectWithTargetPosition, options: MoveToTargetPositionOptions = {}) {
    super(mobject, options);
    if (!mobject.targetPosition) {
      throw new Error('MoveToTargetPosition requires mobject.targetPosition to be set.');
    }
  }

  /**
   * Set up the animation - store initial and target positions
   */
  override begin(): void {
    super.begin();

    const mobject = this.mobject as MobjectWithTargetPosition;

    // Store initial position
    this._initialPosition.copy(this.mobject.position);

    // Get target position
    if (mobject.targetPosition) {
      this._targetPosition.set(
        mobject.targetPosition[0],
        mobject.targetPosition[1],
        mobject.targetPosition[2],
      );
    }
  }

  /**
   * Interpolate the position at the given alpha
   */
  interpolate(alpha: number): void {
    this.mobject.position.set(
      this._initialPosition.x + (this._targetPosition.x - this._initialPosition.x) * alpha,
      this._initialPosition.y + (this._targetPosition.y - this._initialPosition.y) * alpha,
      this._initialPosition.z + (this._targetPosition.z - this._initialPosition.z) * alpha,
    );
    this.mobject._markDirty();
  }

  /**
   * Ensure the position is exact at the end
   */
  override finish(): void {
    this.mobject.position.copy(this._targetPosition);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a MoveToTargetPosition animation for a mobject.
 * @param mobject The mobject to move (must have targetPosition set)
 * @param options Animation options (duration, rateFunc)
 */
export function moveToTargetPosition(
  mobject: MobjectWithTargetPosition,
  options?: MoveToTargetPositionOptions,
): MoveToTargetPosition {
  return new MoveToTargetPosition(mobject, options);
}
