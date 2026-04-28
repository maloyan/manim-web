/**
 * Movement and rotation Transform animations for manimweb.
 * Includes ClockwiseTransform, CounterclockwiseTransform, Swap, and CyclicReplace.
 */

import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { lerp, lerpPoint } from '../../utils/math';
import { alignVmobjectPair } from './TransformPairing';

// ============================================================================
// ClockwiseTransform
// ============================================================================

export interface ClockwiseTransformOptions extends AnimationOptions {
  /** Angle to rotate through during transform (radians), default PI */
  angle?: number;
}

/**
 * ClockwiseTransform animation - transforms while rotating clockwise.
 * Points follow an arc path in the clockwise direction.
 */
export class ClockwiseTransform extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Rotation angle */
  readonly angle: number;

  /** Starting points */
  private _startPoints: number[][] = [];

  /** Target points */
  private _targetPoints: number[][] = [];

  /** Center of rotation */
  private _center: Vector3Tuple = [0, 0, 0];

  /** Starting style values */
  private _startOpacity: number = 1;
  private _targetOpacity: number = 1;

  constructor(mobject: VMobject, target: VMobject, options: ClockwiseTransformOptions = {}) {
    super(mobject, options);
    this.target = target;
    this.angle = options.angle ?? Math.PI;
  }

  override begin(): void {
    super.begin();

    const vmobject = this.mobject as VMobject;

    const aligned = alignVmobjectPair(vmobject, this.target);
    this._startPoints = aligned.startPoints;
    this._targetPoints = aligned.targetPoints;
    vmobject.setTransformSubpathLengths(aligned.alignedSubpathLengths);

    // Calculate center as midpoint between source and target centers
    const srcCenter = vmobject.getCenter();
    const tgtCenter = this.target.getCenter();
    this._center = [
      (srcCenter[0] + tgtCenter[0]) / 2,
      (srcCenter[1] + tgtCenter[1]) / 2,
      (srcCenter[2] + tgtCenter[2]) / 2,
    ];

    this._startOpacity = vmobject.opacity;
    this._targetOpacity = this.target.opacity;

    vmobject.setPoints(this._startPoints);
  }

  interpolate(alpha: number): void {
    const vmobject = this.mobject as VMobject;

    // Rotation angle at this alpha (clockwise = negative)
    const currentAngle = -this.angle * alpha;

    const interpolatedPoints: number[][] = [];
    for (let i = 0; i < this._startPoints.length; i++) {
      // Linear interpolation of position
      const linearPoint = lerpPoint(this._startPoints[i], this._targetPoints[i], alpha);

      // Apply rotation around center
      const dx = linearPoint[0] - this._center[0];
      const dy = linearPoint[1] - this._center[1];

      const cos = Math.cos(currentAngle);
      const sin = Math.sin(currentAngle);

      // Blend between linear and rotated path
      const blendFactor = Math.sin(alpha * Math.PI); // smooth blend
      const rotatedX = dx * cos - dy * sin + this._center[0];
      const rotatedY = dx * sin + dy * cos + this._center[1];

      interpolatedPoints.push([
        lerp(linearPoint[0], rotatedX, blendFactor),
        lerp(linearPoint[1], rotatedY, blendFactor),
        linearPoint[2],
      ]);
    }

    vmobject.setPoints(interpolatedPoints);
    vmobject.opacity = lerp(this._startOpacity, this._targetOpacity, alpha);
  }

  override finish(): void {
    const vmobject = this.mobject as VMobject;
    vmobject.setPoints(this._targetPoints);
    vmobject.setTransformSubpathLengths(undefined);
    vmobject.opacity = this._targetOpacity;
    vmobject.color = this.target.color;
    super.finish();
  }
}

/**
 * Create a ClockwiseTransform animation.
 * @param mobject The VMobject to transform
 * @param target The target VMobject
 * @param options Animation options
 */
export function clockwiseTransform(
  mobject: VMobject,
  target: VMobject,
  options?: ClockwiseTransformOptions,
): ClockwiseTransform {
  return new ClockwiseTransform(mobject, target, options);
}

// ============================================================================
// CounterclockwiseTransform
// ============================================================================

export interface CounterclockwiseTransformOptions extends AnimationOptions {
  /** Angle to rotate through during transform (radians), default PI */
  angle?: number;
}

/**
 * CounterclockwiseTransform animation - transforms while rotating counterclockwise.
 * Points follow an arc path in the counterclockwise direction.
 */
export class CounterclockwiseTransform extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Rotation angle */
  readonly angle: number;

  /** Starting points */
  private _startPoints: number[][] = [];

  /** Target points */
  private _targetPoints: number[][] = [];

  /** Center of rotation */
  private _center: Vector3Tuple = [0, 0, 0];

  /** Starting style values */
  private _startOpacity: number = 1;
  private _targetOpacity: number = 1;

  constructor(mobject: VMobject, target: VMobject, options: CounterclockwiseTransformOptions = {}) {
    super(mobject, options);
    this.target = target;
    this.angle = options.angle ?? Math.PI;
  }

  override begin(): void {
    super.begin();

    const vmobject = this.mobject as VMobject;

    const aligned = alignVmobjectPair(vmobject, this.target);
    this._startPoints = aligned.startPoints;
    this._targetPoints = aligned.targetPoints;
    vmobject.setTransformSubpathLengths(aligned.alignedSubpathLengths);

    const srcCenter = vmobject.getCenter();
    const tgtCenter = this.target.getCenter();
    this._center = [
      (srcCenter[0] + tgtCenter[0]) / 2,
      (srcCenter[1] + tgtCenter[1]) / 2,
      (srcCenter[2] + tgtCenter[2]) / 2,
    ];

    this._startOpacity = vmobject.opacity;
    this._targetOpacity = this.target.opacity;

    vmobject.setPoints(this._startPoints);
  }

  interpolate(alpha: number): void {
    const vmobject = this.mobject as VMobject;

    // Rotation angle at this alpha (counterclockwise = positive)
    const currentAngle = this.angle * alpha;

    const interpolatedPoints: number[][] = [];
    for (let i = 0; i < this._startPoints.length; i++) {
      const linearPoint = lerpPoint(this._startPoints[i], this._targetPoints[i], alpha);

      const dx = linearPoint[0] - this._center[0];
      const dy = linearPoint[1] - this._center[1];

      const cos = Math.cos(currentAngle);
      const sin = Math.sin(currentAngle);

      const blendFactor = Math.sin(alpha * Math.PI);
      const rotatedX = dx * cos - dy * sin + this._center[0];
      const rotatedY = dx * sin + dy * cos + this._center[1];

      interpolatedPoints.push([
        lerp(linearPoint[0], rotatedX, blendFactor),
        lerp(linearPoint[1], rotatedY, blendFactor),
        linearPoint[2],
      ]);
    }

    vmobject.setPoints(interpolatedPoints);
    vmobject.opacity = lerp(this._startOpacity, this._targetOpacity, alpha);
  }

  override finish(): void {
    const vmobject = this.mobject as VMobject;
    vmobject.setPoints(this._targetPoints);
    vmobject.setTransformSubpathLengths(undefined);
    vmobject.opacity = this._targetOpacity;
    vmobject.color = this.target.color;
    super.finish();
  }
}

/**
 * Create a CounterclockwiseTransform animation.
 * @param mobject The VMobject to transform
 * @param target The target VMobject
 * @param options Animation options
 */
export function counterclockwiseTransform(
  mobject: VMobject,
  target: VMobject,
  options?: CounterclockwiseTransformOptions,
): CounterclockwiseTransform {
  return new CounterclockwiseTransform(mobject, target, options);
}

// ============================================================================
// Swap
// ============================================================================

export interface SwapOptions extends AnimationOptions {
  /** Path arc angle for the swap, default PI/2 */
  pathArc?: number;
  /** Auto-center points around position before animation, default true */
  autoCenter?: boolean;
}

/**
 * Swap animation - swaps the positions of two mobjects.
 * Both mobjects move simultaneously along arced paths.
 */
export class Swap extends Animation {
  /** The second mobject to swap with */
  readonly mobject2: Mobject;

  /** Path arc angle */
  readonly pathArc: number;

  /** Auto-center points around position */
  readonly autoCenter: boolean;

  /** Starting positions */
  private _startPos1: THREE.Vector3 = new THREE.Vector3();
  private _startPos2: THREE.Vector3 = new THREE.Vector3();

  /** Target positions (swapped) */
  private _targetPos1: THREE.Vector3 = new THREE.Vector3();
  private _targetPos2: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject1: Mobject, mobject2: Mobject, options: SwapOptions = {}) {
    super(mobject1, options);
    this.mobject2 = mobject2;
    this.pathArc = options.pathArc ?? Math.PI / 2;
    this.autoCenter = options.autoCenter ?? true;
  }

  override begin(): void {
    super.begin();

    if (this.autoCenter) {
      if (!(this.mobject instanceof VMobject)) {
        throw new Error(`Swap autoCenter requires VMobject, got ${this.mobject.constructor.name}`);
      }
      if (!(this.mobject2 instanceof VMobject)) {
        throw new Error(`Swap autoCenter requires VMobject, got ${this.mobject2.constructor.name}`);
      }
      this.mobject.centerPointsAroundPosition();
      this.mobject2.centerPointsAroundPosition();
    }

    this._startPos1.copy(this.mobject.position);
    this._startPos2.copy(this.mobject2.position);

    // Target positions are swapped
    this._targetPos1.copy(this._startPos2);
    this._targetPos2.copy(this._startPos1);
  }

  interpolate(alpha: number): void {
    // Calculate arc offset for visual appeal
    const arcOffset = Math.sin(alpha * Math.PI) * this.pathArc;

    // Move mobject1 along arc to position2
    const pos1 = new THREE.Vector3().lerpVectors(this._startPos1, this._targetPos1, alpha);
    pos1.y += arcOffset * 0.5;
    this.mobject.position.copy(pos1);
    this.mobject._markDirty();

    // Move mobject2 along arc to position1
    const pos2 = new THREE.Vector3().lerpVectors(this._startPos2, this._targetPos2, alpha);
    pos2.y -= arcOffset * 0.5;
    this.mobject2.position.copy(pos2);
    this.mobject2._markDirty();
  }

  override finish(): void {
    this.mobject.position.copy(this._targetPos1);
    this.mobject2.position.copy(this._targetPos2);
    this.mobject._markDirty();
    this.mobject2._markDirty();
    super.finish();
  }
}

/**
 * Create a Swap animation.
 * @param mobject1 First mobject
 * @param mobject2 Second mobject to swap with
 * @param options Animation options
 */
export function swap(mobject1: Mobject, mobject2: Mobject, options?: SwapOptions): Swap {
  return new Swap(mobject1, mobject2, options);
}

// ============================================================================
// CyclicReplace
// ============================================================================

export interface CyclicReplaceOptions extends AnimationOptions {
  /** Path arc angle for movement, default PI/2 */
  pathArc?: number;
  /** Auto-center points around position before animation, default true */
  autoCenter?: boolean;
}

/**
 * CyclicReplace animation - cyclically replaces positions of multiple mobjects.
 * Each mobject moves to the position of the next mobject in the list.
 */
export class CyclicReplace extends Animation {
  /** All mobjects in the cycle */
  readonly mobjects: Mobject[];

  /** Path arc angle */
  readonly pathArc: number;

  /** Auto-center points around position */
  readonly autoCenter: boolean;

  /** Starting positions */
  private _startPositions: THREE.Vector3[] = [];

  /** Target positions (cycled) */
  private _targetPositions: THREE.Vector3[] = [];

  constructor(mobjects: Mobject[], options: CyclicReplaceOptions = {}) {
    if (mobjects.length < 2) {
      throw new Error('CyclicReplace requires at least 2 mobjects');
    }
    super(mobjects[0], options);
    this.mobjects = mobjects;
    this.pathArc = options.pathArc ?? Math.PI / 2;
    this.autoCenter = options.autoCenter ?? true;
  }

  override begin(): void {
    super.begin();

    if (this.autoCenter) {
      for (const m of this.mobjects) {
        if (!(m instanceof VMobject)) {
          throw new Error(`CyclicReplace autoCenter requires VMobject, got ${m.constructor.name}`);
        }
        m.centerPointsAroundPosition();
      }
    }

    // Store starting positions
    this._startPositions = this.mobjects.map((m) => m.position.clone());

    // Target positions are cycled (each goes to next position)
    this._targetPositions = this.mobjects.map((_, i) => {
      const nextIndex = (i + 1) % this.mobjects.length;
      return this._startPositions[nextIndex].clone();
    });
  }

  interpolate(alpha: number): void {
    const arcOffset = Math.sin(alpha * Math.PI) * this.pathArc;

    for (let i = 0; i < this.mobjects.length; i++) {
      const mobject = this.mobjects[i];
      const pos = new THREE.Vector3().lerpVectors(
        this._startPositions[i],
        this._targetPositions[i],
        alpha,
      );

      // Alternate arc direction for visual variety
      pos.y += arcOffset * (i % 2 === 0 ? 0.5 : -0.5);

      mobject.position.copy(pos);
      mobject._markDirty();
    }
  }

  override finish(): void {
    for (let i = 0; i < this.mobjects.length; i++) {
      this.mobjects[i].position.copy(this._targetPositions[i]);
      this.mobjects[i]._markDirty();
    }
    super.finish();
  }
}

/**
 * Create a CyclicReplace animation.
 * @param mobjects Array of mobjects to cycle
 * @param options Animation options
 */
export function cyclicReplace(mobjects: Mobject[], options?: CyclicReplaceOptions): CyclicReplace {
  return new CyclicReplace(mobjects, options);
}
