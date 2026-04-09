/**
 * Utility animations for sequencing and control flow.
 *
 * - Add: Instantly adds a mobject (0 duration)
 * - Remove: Instantly removes a mobject (0 duration)
 * - Wait: Pause/delay animation
 * - Rotating: Continuous rotation updater
 * - Broadcast: Ripple/broadcast effect for emphasis
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { linear } from '../../rate-functions';

// ============================================================================
// Add Animation
// ============================================================================

export type AddOptions = AnimationOptions;

/**
 * Instant animation that adds a mobject to the scene.
 * Duration is 0 - just marks the mobject as visible at animation time.
 * Useful for sequencing when you want to add objects at specific points in a timeline.
 */
export class Add extends Animation {
  constructor(mobject: Mobject, options: AddOptions = {}) {
    super(mobject, { ...options, duration: 0 });
  }

  /**
   * Set up the animation - ensure mobject is visible
   */
  override begin(): void {
    super.begin();
    this.mobject.opacity = 1;
    this.mobject._markDirty();
  }

  /**
   * No interpolation needed for instant add
   */
  interpolate(_alpha: number): void {}
}

/**
 * Create an Add animation for a mobject.
 * Instantly adds/shows the mobject at the scheduled time.
 * @param mobject The mobject to add
 * @param options Animation options
 */
export function add(mobject: Mobject, options?: AddOptions): Add {
  return new Add(mobject, options);
}

// ============================================================================
// Remove Animation
// ============================================================================

export type RemoveOptions = AnimationOptions;

/**
 * Instant animation that removes a mobject from visibility.
 * Duration is 0 - just marks the mobject as invisible at animation time.
 * Note: This doesn't remove from the scene, it sets opacity to 0.
 * For actual scene removal, use scene.remove() directly.
 */
export class Remove extends Animation {
  constructor(mobject: Mobject, options: RemoveOptions = {}) {
    super(mobject, { ...options, duration: 0 });
  }

  /**
   * Set up the animation - hide the mobject
   */
  override begin(): void {
    super.begin();
    this.mobject.opacity = 0;
    this.mobject._markDirty();
  }

  /**
   * No interpolation needed for instant remove
   */
  interpolate(_alpha: number): void {}
}

/**
 * Create a Remove animation for a mobject.
 * Instantly hides the mobject at the scheduled time.
 * @param mobject The mobject to remove/hide
 * @param options Animation options
 */
export function remove(mobject: Mobject, options?: RemoveOptions): Remove {
  return new Remove(mobject, options);
}

// ============================================================================
// Wait Animation
// ============================================================================

export interface WaitOptions extends AnimationOptions {
  /** Duration to wait in seconds. Default: 1 */
  duration?: number;
}

/**
 * Wait/pause animation that holds for a specified duration.
 * No visual change occurs - useful for timing and sequencing.
 */
export class Wait extends Animation {
  constructor(mobject: Mobject, options: WaitOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? linear,
    });
  }

  /**
   * No interpolation - just wait
   */
  interpolate(_alpha: number): void {}
}

/**
 * Create a Wait animation.
 * Pauses for the specified duration with no visual change.
 * @param mobject A mobject (required by Animation base, but not modified)
 * @param duration Duration to wait in seconds (default: 1)
 * @param options Additional animation options
 */
export function wait(
  mobject: Mobject,
  duration?: number,
  options?: Omit<WaitOptions, 'duration'>,
): Wait {
  return new Wait(mobject, { ...options, duration });
}

// ============================================================================
// Rotating Animation
// ============================================================================

export interface RotatingOptions extends AnimationOptions {
  /** Total angle to rotate in radians. Default: 2*PI (full revolution, matching Manim's TAU) */
  angle?: number;
  /** Axis of rotation [x, y, z]. Default: Z axis [0, 0, 1] */
  axis?: Vector3Tuple;
  /** Point to rotate about. Default: mobject center */
  aboutPoint?: Vector3Tuple;
}

/**
 * Continuous rotation animation that rotates by a total angle over the duration.
 * Matches Manim Python's Rotating: default angle=TAU (full revolution),
 * default run_time=5, default rate_func=linear.
 */
export class Rotating extends Animation {
  /** Total angle to rotate in radians */
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

  constructor(mobject: Mobject, options: RotatingOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 5,
      rateFunc: options.rateFunc ?? linear,
    });
    this.angle = options.angle ?? 2 * Math.PI; // Default: TAU (full revolution)
    this.axis = options.axis ?? [0, 0, 1];
    this.aboutPoint = options.aboutPoint ?? null;
  }

  /**
   * Set up the animation - store initial state
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
        this.aboutPoint[2],
      );
    } else {
      // Default to mobject center
      const center = this.mobject.getCenter();
      this._aboutPointVector = new THREE.Vector3(center[0], center[1], center[2]);
    }
  }

  /**
   * Interpolate the rotation at the given alpha
   * Total rotation = angle * alpha (at alpha=1, full angle is reached)
   */
  interpolate(alpha: number): void {
    // Total angle rotated so far: angle * alpha
    const totalAngle = this.angle * alpha;

    // Create rotation quaternion for current angle
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(this._axisVector, totalAngle);

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
}

/**
 * Create a Rotating animation for a mobject.
 * Rotates the mobject by the specified angle over the animation duration.
 * @param mobject The mobject to rotate
 * @param options Rotating options (angle, axis, aboutPoint, duration)
 */
export function rotating(mobject: Mobject, options?: RotatingOptions): Rotating {
  return new Rotating(mobject, options);
}

// ============================================================================
// Broadcast Animation
// ============================================================================

export interface BroadcastOptions extends AnimationOptions {
  /** Center of the broadcast effect. Default: ORIGIN [0,0,0] */
  focalPoint?: [number, number, number];
  /** Number of mobject copies that emerge. Default: 5 */
  nMobs?: number;
  /** Starting opacity of copies. Default: 1 */
  initialOpacity?: number;
  /** Ending opacity of copies. Default: 0 */
  finalOpacity?: number;
  /** Starting width of copies. Default: 0.0 */
  initialWidth?: number;
  /** Time offset between copies (0-1). Default: 0.2 */
  lagRatio?: number;
}

/**
 * Broadcast animation that creates copies of the mobject which scale up and
 * fade out, matching Python manim's Broadcast behavior.
 *
 * Each copy starts at the focal point with `initialWidth` and `initialOpacity`,
 * then animates to the original mobject's width and `finalOpacity` with
 * staggered timing via `lagRatio`.
 */
export class Broadcast extends Animation {
  /** Center of the broadcast effect */
  readonly focalPoint: [number, number, number];

  /** Number of copies */
  readonly nMobs: number;

  /** Starting opacity */
  readonly initialOpacity: number;

  /** Ending opacity */
  readonly finalOpacity: number;

  /** Starting width of copies */
  readonly initialWidth: number;

  /** Lag ratio between copies */
  readonly lagRatio: number;

  /** Copies of the mobject */
  private _copies: Mobject[] = [];

  /** Original mobject width (for scale computation) */
  private _originalWidth: number = 1;

  /** Original scale of the mobject */
  private _originalScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  /** Parent Three.js object for adding copy objects */
  private _parentObject: THREE.Object3D | null = null;

  constructor(mobject: Mobject, options: BroadcastOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 3,
      rateFunc: options.rateFunc ?? linear,
    });
    this.focalPoint = options.focalPoint ?? [0, 0, 0];
    this.nMobs = options.nMobs ?? 5;
    this.initialOpacity = options.initialOpacity ?? 1;
    this.finalOpacity = options.finalOpacity ?? 0;
    this.initialWidth = options.initialWidth ?? 0.0;
    this.lagRatio = options.lagRatio ?? 0.2;
  }

  override begin(): void {
    super.begin();

    // Get original width for scale computation
    const bbox = this.mobject.getBoundingBox();
    this._originalWidth = Math.max(bbox.width, 0.001); // avoid division by zero
    this._originalScale.copy(this.mobject.scaleVector);

    // Get parent Three.js object to add copies to
    const threeObj = this.mobject.getThreeObject();
    this._parentObject = threeObj.parent ?? threeObj;

    // Create N copies
    this._copies = [];
    for (let i = 0; i < this.nMobs; i++) {
      const copy = this.mobject.copy();

      // Position at focal point
      copy.position.set(this.focalPoint[0], this.focalPoint[1], this.focalPoint[2]);

      // Set initial scale based on initialWidth
      const scaleFactor = this._originalWidth > 0.001 ? this.initialWidth / this._originalWidth : 0;
      copy.scaleVector.copy(this._originalScale).multiplyScalar(Math.max(scaleFactor, 0));

      // Set initial opacity
      copy.setStrokeOpacity(this.initialOpacity);
      copy._markDirty();

      // Add the copy's Three.js object to the parent
      const copyThree = copy.getThreeObject();
      this._parentObject.add(copyThree);

      this._copies.push(copy);
    }
  }

  interpolate(alpha: number): void {
    if (this._copies.length === 0) return;

    for (let i = 0; i < this._copies.length; i++) {
      const copy = this._copies[i];

      // Compute staggered local alpha for this copy
      // Each copy is offset by i * lagRatio
      const copyDelay = i * this.lagRatio;
      // The available window for this copy shrinks as lag accumulates
      const copyWindow = 1 - copyDelay;
      let localAlpha: number;
      if (copyWindow <= 0) {
        localAlpha = alpha >= 1 ? 1 : 0;
      } else {
        localAlpha = Math.max(0, Math.min(1, (alpha - copyDelay) / copyWindow));
      }

      // Interpolate scale: from initialWidth to originalWidth
      const targetScaleFactor =
        this._originalWidth > 0.001 ? this.initialWidth / this._originalWidth : 0;
      const currentScaleFactor = targetScaleFactor + (1 - targetScaleFactor) * localAlpha;
      copy.scaleVector.copy(this._originalScale).multiplyScalar(Math.max(currentScaleFactor, 0));

      // Interpolate position: from focalPoint to original position
      const origPos = this.mobject.position;
      copy.position.set(
        this.focalPoint[0] + (origPos.x - this.focalPoint[0]) * localAlpha,
        this.focalPoint[1] + (origPos.y - this.focalPoint[1]) * localAlpha,
        this.focalPoint[2] + (origPos.z - this.focalPoint[2]) * localAlpha,
      );

      // Interpolate opacity: from initialOpacity to finalOpacity
      const currentOpacity =
        this.initialOpacity + (this.finalOpacity - this.initialOpacity) * localAlpha;
      copy.setStrokeOpacity(currentOpacity);

      copy._markDirty();
      // Sync Three.js object so visual updates are applied
      copy.getThreeObject();
    }
  }

  override finish(): void {
    // Remove all copy Three.js objects from the parent and dispose
    if (this._parentObject) {
      for (const copy of this._copies) {
        const copyThree = copy.getThreeObject();
        this._parentObject.remove(copyThree);
        // Dispose Three.js resources
        copyThree.traverse((child) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mesh = child as any;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m: { dispose: () => void }) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
      }
    }
    this._copies = [];
    this._parentObject = null;

    super.finish();
  }
}

/**
 * Create a Broadcast animation for a mobject.
 * Creates copies of the mobject that scale up and fade out from the focal point.
 * @param mobject The mobject to broadcast
 * @param options Broadcast options (focalPoint, nMobs, initialOpacity, finalOpacity, initialWidth, lagRatio)
 */
export function broadcast(mobject: Mobject, options?: BroadcastOptions): Broadcast {
  return new Broadcast(mobject, options);
}
