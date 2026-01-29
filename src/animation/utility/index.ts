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
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { linear } from '../../rate-functions';
import { YELLOW, DEFAULT_STROKE_WIDTH } from '../../constants';

// ============================================================================
// Add Animation
// ============================================================================

export interface AddOptions extends AnimationOptions {
  // Add has no special options - it's instant
}

/**
 * Instant animation that adds a mobject to the scene.
 * Duration is 0 - just marks the mobject as visible at animation time.
 * Useful for sequencing when you want to add objects at specific points in a timeline.
 */
export class Add extends Animation {
  constructor(mobject: Mobject, options: AddOptions = {}) {
    // Force duration to 0 for instant add
    super(mobject, { ...options, duration: 0 });
  }

  /**
   * Set up the animation - ensure mobject is visible
   */
  override begin(): void {
    super.begin();
    // Make the mobject visible
    this.mobject.opacity = 1;
    this.mobject._markDirty();
  }

  /**
   * No interpolation needed for instant add
   */
  interpolate(_alpha: number): void {
    // Instant add - nothing to interpolate
  }
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

export interface RemoveOptions extends AnimationOptions {
  // Remove has no special options - it's instant
}

/**
 * Instant animation that removes a mobject from visibility.
 * Duration is 0 - just marks the mobject as invisible at animation time.
 * Note: This doesn't remove from the scene, it sets opacity to 0.
 * For actual scene removal, use scene.remove() directly.
 */
export class Remove extends Animation {
  constructor(mobject: Mobject, options: RemoveOptions = {}) {
    // Force duration to 0 for instant remove
    super(mobject, { ...options, duration: 0 });
  }

  /**
   * Set up the animation - hide the mobject
   */
  override begin(): void {
    super.begin();
    // Hide the mobject by setting opacity to 0
    this.mobject.opacity = 0;
    this.mobject._markDirty();
  }

  /**
   * No interpolation needed for instant remove
   */
  interpolate(_alpha: number): void {
    // Instant remove - nothing to interpolate
  }
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
  interpolate(_alpha: number): void {
    // Wait does nothing visually
  }
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
  options?: Omit<WaitOptions, 'duration'>
): Wait {
  return new Wait(mobject, { ...options, duration });
}

// ============================================================================
// Rotating Animation
// ============================================================================

export interface RotatingOptions extends AnimationOptions {
  /** Rotation speed in radians per second. Default: PI (180 degrees/sec) */
  speed?: number;
  /** Axis of rotation [x, y, z]. Default: Z axis [0, 0, 1] */
  axis?: Vector3Tuple;
  /** Point to rotate about. Default: mobject center */
  aboutPoint?: Vector3Tuple;
}

/**
 * Continuous rotation animation that rotates while active.
 * Unlike Rotate which rotates by a specific angle, Rotating
 * continuously rotates at a given speed for the animation duration.
 */
export class Rotating extends Animation {
  /** Rotation speed in radians per second */
  readonly speed: number;

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
      duration: options.duration ?? 2,
      rateFunc: options.rateFunc ?? linear, // Linear for smooth continuous rotation
    });
    this.speed = options.speed ?? Math.PI; // Default: 180 deg/sec
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
   * For continuous rotation, alpha maps to total rotation = speed * duration * alpha
   */
  interpolate(alpha: number): void {
    // Total angle rotated so far: speed * duration * alpha
    const totalAngle = this.speed * this.duration * alpha;

    // Create rotation quaternion for current angle
    const rotationQuat = new THREE.Quaternion().setFromAxisAngle(
      this._axisVector,
      totalAngle
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
}

/**
 * Create a Rotating animation for a mobject.
 * Continuously rotates the mobject at the specified speed.
 * @param mobject The mobject to rotate
 * @param options Rotating options (speed, axis, aboutPoint, duration)
 */
export function rotating(mobject: Mobject, options?: RotatingOptions): Rotating {
  return new Rotating(mobject, options);
}

// ============================================================================
// Broadcast Animation
// ============================================================================

export interface BroadcastOptions extends AnimationOptions {
  /** Color of the broadcast rings. Default: YELLOW */
  color?: string;
  /** Number of rings to broadcast. Default: 3 */
  numRings?: number;
  /** Maximum radius the rings expand to. Default: 2 */
  maxRadius?: number;
  /** Stroke width of rings. Default: DEFAULT_STROKE_WIDTH */
  strokeWidth?: number;
  /** Time offset between rings (0-1). Default: 0.3 */
  lagRatio?: number;
}

/**
 * Broadcast/ripple animation that creates expanding rings from the mobject center.
 * Useful for emphasis or drawing attention to an object.
 * Rings expand outward and fade as they grow.
 */
export class Broadcast extends Animation {
  /** Ring color */
  readonly ringColor: string;

  /** Number of rings */
  readonly numRings: number;

  /** Maximum radius */
  readonly maxRadius: number;

  /** Stroke width */
  readonly strokeWidth: number;

  /** Lag ratio between rings */
  readonly lagRatio: number;

  /** Rings group */
  private _ringsGroup: THREE.Group | null = null;

  /** Parent object */
  private _parentObject: THREE.Object3D | null = null;

  /** Center point */
  private _center: Vector3Tuple = [0, 0, 0];

  constructor(mobject: Mobject, options: BroadcastOptions = {}) {
    super(mobject, {
      duration: options.duration ?? 1,
      rateFunc: options.rateFunc ?? linear,
    });
    this.ringColor = options.color ?? YELLOW;
    this.numRings = options.numRings ?? 3;
    this.maxRadius = options.maxRadius ?? 2;
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    this.lagRatio = options.lagRatio ?? 0.3;
  }

  override begin(): void {
    super.begin();

    // Get center of mobject
    this._center = this.mobject.getCenter();

    // Get parent Three.js object
    const threeObj = this.mobject.getThreeObject();
    this._parentObject = threeObj.parent ?? threeObj;

    // Create rings group
    this._ringsGroup = new THREE.Group();
    this._ringsGroup.position.set(this._center[0], this._center[1], this._center[2] + 0.01);

    // Create rings (start with 0 radius)
    for (let i = 0; i < this.numRings; i++) {
      const ring = this._createRing(0.01); // Start very small
      this._ringsGroup.add(ring);
    }

    // Add to scene
    this._parentObject.add(this._ringsGroup);
  }

  private _createRing(radius: number): Line2 {
    const numSegments = 64;
    const positions: number[] = [];

    for (let i = 0; i <= numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    const material = new LineMaterial({
      color: new THREE.Color(this.ringColor).getHex(),
      linewidth: this.strokeWidth * 0.01,
      transparent: true,
      opacity: 1,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    });

    const ring = new Line2(geometry, material);
    ring.computeLineDistances();
    return ring;
  }

  private _updateRing(ring: Line2, radius: number, opacity: number): void {
    const numSegments = 64;
    const positions: number[] = [];

    const effectiveRadius = Math.max(0.01, radius);
    for (let i = 0; i <= numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2;
      positions.push(
        Math.cos(angle) * effectiveRadius,
        Math.sin(angle) * effectiveRadius,
        0
      );
    }

    // Create new geometry
    const geometry = new LineGeometry();
    geometry.setPositions(positions);

    // Update geometry and material
    ring.geometry.dispose();
    ring.geometry = geometry;
    ring.computeLineDistances();

    const material = ring.material as LineMaterial;
    material.opacity = Math.max(0, opacity);
    material.needsUpdate = true;
  }

  interpolate(alpha: number): void {
    if (!this._ringsGroup) return;

    this._ringsGroup.children.forEach((child, i) => {
      if (child instanceof Line2) {
        // Stagger the rings - each one starts later
        const ringDelay = i * this.lagRatio;
        const ringAlpha = Math.max(0, Math.min(1, (alpha - ringDelay) / (1 - ringDelay * (this.numRings - 1) / this.numRings)));

        if (ringAlpha <= 0) {
          // Ring hasn't started yet
          this._updateRing(child, 0.01, 0);
        } else {
          // Calculate radius: grows from 0 to maxRadius
          const radius = this.maxRadius * ringAlpha;

          // Calculate opacity: starts at 1, fades to 0
          const opacity = 1 - ringAlpha;

          this._updateRing(child, radius, opacity);
        }
      }
    });
  }

  override finish(): void {
    // Remove rings from scene
    if (this._ringsGroup && this._parentObject) {
      this._parentObject.remove(this._ringsGroup);

      // Dispose geometries and materials
      this._ringsGroup.traverse((child) => {
        if (child instanceof Line2) {
          child.geometry.dispose();
          (child.material as LineMaterial).dispose();
        }
      });

      this._ringsGroup = null;
    }

    super.finish();
  }
}

/**
 * Create a Broadcast animation for a mobject.
 * Creates expanding rings that radiate from the mobject's center.
 * @param mobject The mobject to broadcast from
 * @param options Broadcast options (color, numRings, maxRadius, strokeWidth, lagRatio)
 */
export function broadcast(mobject: Mobject, options?: BroadcastOptions): Broadcast {
  return new Broadcast(mobject, options);
}
