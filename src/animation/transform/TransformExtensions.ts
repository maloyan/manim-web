/**
 * Extended Transform animations for manimweb.
 * These provide additional transformation capabilities beyond the basic Transform.
 */

import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { Transform } from './Transform';
import { lerp, lerpPoint } from '../../utils/math';
import { Arrow, DoubleArrow } from '../../mobjects/geometry/Arrow';

// ============================================================================
// Shared VMobjectLike duck-type (mirrors ApplyPointwiseFunction)
// ============================================================================

interface VMobjectLike {
  getPoints(): number[][];
  setPoints(pts: number[][]): void;
}

function isVMobjectLike(m: unknown): m is VMobjectLike {
  const obj = m as Record<string, unknown>;
  return typeof obj.getPoints === 'function' && typeof obj.setPoints === 'function';
}

interface ChildSnapshot {
  mob: VMobjectLike;
  startPoints: number[][];
  targetPoints: number[][];
}

function _reconstructArrowTips(mobject: Mobject): void {
  for (const mob of mobject.getFamily()) {
    if (mob instanceof Arrow) mob.reconstructTip();
    else if (mob instanceof DoubleArrow) mob.reconstructTips();
  }
}

// ============================================================================
// ApplyFunction
// ============================================================================

export interface ApplyFunctionOptions extends AnimationOptions {
  /** Function to apply to each point */
  func: (point: number[]) => number[];
}

/**
 * ApplyFunction animation - applies an arbitrary function to mobject points.
 * Supports both VMobject and Group (walks the family tree like ApplyPointwiseFunction).
 */
export class ApplyFunction extends Animation {
  readonly func: (point: number[]) => number[];
  private _snapshots: ChildSnapshot[] = [];

  constructor(mobject: Mobject, options: ApplyFunctionOptions) {
    super(mobject, options);
    this.func = options.func;
  }

  override begin(): void {
    super.begin();

    this._snapshots = [];
    const _v = new THREE.Vector3();

    for (const mob of this.mobject.getFamily()) {
      if (isVMobjectLike(mob)) {
        const startPoints = mob.getPoints();
        if (startPoints.length === 0) continue;

        const threeObj = (mob as Mobject)._threeObject;
        let worldMatrix: THREE.Matrix4 | null = null;
        let inverseWorld: THREE.Matrix4 | null = null;

        if (threeObj) {
          threeObj.updateWorldMatrix(true, false);
          worldMatrix = threeObj.matrixWorld;
          inverseWorld = worldMatrix.clone().invert();
        }

        let targetPoints: number[][];
        if (worldMatrix && inverseWorld) {
          targetPoints = startPoints.map((p) => {
            _v.set(p[0], p[1], p[2]).applyMatrix4(worldMatrix!);
            const worldResult = this.func([_v.x, _v.y, _v.z]);
            _v.set(worldResult[0], worldResult[1], worldResult[2]).applyMatrix4(inverseWorld!);
            return [_v.x, _v.y, _v.z];
          });
        } else {
          targetPoints = startPoints.map((p) => this.func([...p]));
        }

        this._snapshots.push({ mob, startPoints, targetPoints });
      }
    }
  }

  interpolate(alpha: number): void {
    for (const snap of this._snapshots) {
      const interpolated: number[][] = [];
      for (let i = 0; i < snap.startPoints.length; i++) {
        interpolated.push(lerpPoint(snap.startPoints[i], snap.targetPoints[i], alpha));
      }
      snap.mob.setPoints(interpolated);
    }
    _reconstructArrowTips(this.mobject);
    this.mobject._markDirtyUpward();
  }

  override finish(): void {
    for (const snap of this._snapshots) {
      snap.mob.setPoints(snap.targetPoints);
    }
    _reconstructArrowTips(this.mobject);
    this.mobject._markDirtyUpward();
    super.finish();
  }
}

/**
 * Create an ApplyFunction animation.
 * @param mobject The Mobject to transform (VMobject or Group)
 * @param func Function to apply to each point [x, y, z] => [x', y', z']
 * @param options Animation options
 */
export function applyFunction(
  mobject: Mobject,
  func: (point: number[]) => number[],
  options?: Omit<ApplyFunctionOptions, 'func'>,
): ApplyFunction {
  return new ApplyFunction(mobject, { ...options, func });
}

// ============================================================================
// ApplyMethod
// ============================================================================

export interface ApplyMethodOptions extends AnimationOptions {
  /** Method name to call on the mobject */
  methodName: string;
  /** Arguments to pass to the method */
  args?: unknown[];
}

/**
 * ApplyMethod animation - animates calling a method on a mobject.
 * Creates a copy, calls the method on the copy, then transforms to the result.
 */
export class ApplyMethod extends Transform {
  /** Method name */
  readonly methodName: string;

  /** Method arguments */
  readonly args: unknown[];

  constructor(mobject: VMobject, options: ApplyMethodOptions) {
    // Create target by copying and calling method
    const target = mobject.copy() as VMobject;
    const method = (target as unknown as Record<string, (...args: unknown[]) => unknown>)[
      options.methodName
    ];
    if (typeof method === 'function') {
      method.call(target, ...(options.args || []));
    }

    super(mobject, target, options);
    this.methodName = options.methodName;
    this.args = options.args || [];
  }
}

/**
 * Create an ApplyMethod animation.
 * @param mobject The VMobject to transform
 * @param methodName Name of the method to call
 * @param args Arguments to pass to the method
 * @param options Animation options
 */
export function applyMethod(
  mobject: VMobject,
  methodName: string,
  args?: unknown[],
  options?: AnimationOptions,
): ApplyMethod {
  return new ApplyMethod(mobject, { ...options, methodName, args });
}

// ============================================================================
// ApplyMatrix
// ============================================================================

export interface ApplyMatrixOptions extends AnimationOptions {
  /** 3x3 or 4x4 transformation matrix (row-major) */
  matrix: number[][];
  /** Point to apply transformation about, defaults to origin */
  aboutPoint?: Vector3Tuple;
}

/**
 * ApplyMatrix animation - applies a matrix transformation to mobject points.
 * Supports both VMobject and Group (walks the family tree like ApplyPointwiseFunction).
 */
export class ApplyMatrix extends Animation {
  readonly matrix: number[][];
  readonly aboutPoint: Vector3Tuple;
  private _snapshots: ChildSnapshot[] = [];

  constructor(mobject: Mobject, options: ApplyMatrixOptions) {
    super(mobject, options);
    this.matrix = options.matrix;
    this.aboutPoint = options.aboutPoint ?? [0, 0, 0];
  }

  override begin(): void {
    super.begin();

    this._snapshots = [];
    const _v = new THREE.Vector3();

    for (const mob of this.mobject.getFamily()) {
      if (isVMobjectLike(mob)) {
        const startPoints = mob.getPoints();
        if (startPoints.length === 0) continue;

        const threeObj = (mob as Mobject)._threeObject;
        let worldMatrix: THREE.Matrix4 | null = null;
        let inverseWorld: THREE.Matrix4 | null = null;

        if (threeObj) {
          threeObj.updateWorldMatrix(true, false);
          worldMatrix = threeObj.matrixWorld;
          inverseWorld = worldMatrix.clone().invert();
        }

        let targetPoints: number[][];
        if (worldMatrix && inverseWorld) {
          targetPoints = startPoints.map((p) => {
            _v.set(p[0], p[1], p[2]).applyMatrix4(worldMatrix!);
            const worldResult = this._transformPoint([_v.x, _v.y, _v.z]);
            _v.set(worldResult[0], worldResult[1], worldResult[2]).applyMatrix4(inverseWorld!);
            return [_v.x, _v.y, _v.z];
          });
        } else {
          targetPoints = startPoints.map((p) => this._transformPoint(p));
        }

        this._snapshots.push({ mob, startPoints, targetPoints });
      }
    }
  }

  private _transformPoint(point: number[]): number[] {
    const x = point[0] - this.aboutPoint[0];
    const y = point[1] - this.aboutPoint[1];
    const z = point[2] - this.aboutPoint[2];

    let newX: number, newY: number, newZ: number;

    if (this.matrix.length === 3 && this.matrix[0].length === 3) {
      newX = this.matrix[0][0] * x + this.matrix[0][1] * y + this.matrix[0][2] * z;
      newY = this.matrix[1][0] * x + this.matrix[1][1] * y + this.matrix[1][2] * z;
      newZ = this.matrix[2][0] * x + this.matrix[2][1] * y + this.matrix[2][2] * z;
    } else if (this.matrix.length === 4 && this.matrix[0].length === 4) {
      const w =
        this.matrix[3][0] * x + this.matrix[3][1] * y + this.matrix[3][2] * z + this.matrix[3][3];
      newX =
        (this.matrix[0][0] * x +
          this.matrix[0][1] * y +
          this.matrix[0][2] * z +
          this.matrix[0][3]) /
        w;
      newY =
        (this.matrix[1][0] * x +
          this.matrix[1][1] * y +
          this.matrix[1][2] * z +
          this.matrix[1][3]) /
        w;
      newZ =
        (this.matrix[2][0] * x +
          this.matrix[2][1] * y +
          this.matrix[2][2] * z +
          this.matrix[2][3]) /
        w;
    } else {
      return point;
    }

    return [newX + this.aboutPoint[0], newY + this.aboutPoint[1], newZ + this.aboutPoint[2]];
  }

  interpolate(alpha: number): void {
    for (const snap of this._snapshots) {
      const interpolated: number[][] = [];
      for (let i = 0; i < snap.startPoints.length; i++) {
        interpolated.push(lerpPoint(snap.startPoints[i], snap.targetPoints[i], alpha));
      }
      snap.mob.setPoints(interpolated);
    }
    _reconstructArrowTips(this.mobject);
    this.mobject._markDirtyUpward();
  }

  override finish(): void {
    for (const snap of this._snapshots) {
      snap.mob.setPoints(snap.targetPoints);
    }
    _reconstructArrowTips(this.mobject);
    this.mobject._markDirtyUpward();
    super.finish();
  }
}

/**
 * Create an ApplyMatrix animation.
 * @param mobject The Mobject to transform (VMobject or Group)
 * @param matrix 3x3 or 4x4 transformation matrix
 * @param options Animation options including aboutPoint
 */
export function applyMatrix(
  mobject: Mobject,
  matrix: number[][],
  options?: Omit<ApplyMatrixOptions, 'matrix'>,
): ApplyMatrix {
  return new ApplyMatrix(mobject, { ...options, matrix });
}

// ============================================================================
// FadeTransform
// ============================================================================

export interface FadeTransformOptions extends AnimationOptions {
  /** Stretch factor for fading effect */
  stretchFactor?: number;
}

/**
 * FadeTransform animation - transforms with a fade effect.
 * The source fades out while morphing to the target, which fades in.
 */
export class FadeTransform extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Stretch factor for the fade */
  readonly stretchFactor: number;

  /** Copy of the starting points */
  private _startPoints: number[][] = [];

  /** Copy of the target points */
  private _targetPoints: number[][] = [];

  /** Starting opacity */
  private _startOpacity: number = 1;

  /** Target opacity */
  private _targetOpacity: number = 1;

  constructor(mobject: VMobject, target: VMobject, options: FadeTransformOptions = {}) {
    super(mobject, options);
    this.target = target;
    this.stretchFactor = options.stretchFactor ?? 2;
  }

  override begin(): void {
    super.begin();

    const vmobject = this.mobject as VMobject;

    // Create working copies to align
    const startCopy = vmobject.copy() as VMobject;
    const targetCopy = this.target.copy() as VMobject;

    // Align the points
    startCopy.alignPoints(targetCopy);

    this._startPoints = startCopy.getPoints();
    this._targetPoints = targetCopy.getPoints();
    this._startOpacity = vmobject.opacity;
    this._targetOpacity = this.target.opacity;

    vmobject.setPoints(this._startPoints);
  }

  interpolate(alpha: number): void {
    const vmobject = this.mobject as VMobject;

    // Interpolate points
    const interpolatedPoints: number[][] = [];
    for (let i = 0; i < this._startPoints.length; i++) {
      interpolatedPoints.push(lerpPoint(this._startPoints[i], this._targetPoints[i], alpha));
    }
    vmobject.setPoints(interpolatedPoints);

    // Fade effect: fade out in first half, fade in in second half
    if (alpha < 0.5) {
      // Fading out
      vmobject.opacity = this._startOpacity * (1 - 2 * alpha);
    } else {
      // Fading in
      vmobject.opacity = this._targetOpacity * (2 * alpha - 1);
    }
  }

  override finish(): void {
    const vmobject = this.mobject as VMobject;
    vmobject.setPoints(this._targetPoints);
    vmobject.opacity = this._targetOpacity;
    vmobject.color = this.target.color;
    super.finish();
  }
}

/**
 * Create a FadeTransform animation.
 * @param mobject The VMobject to transform
 * @param target The target VMobject
 * @param options Animation options
 */
export function fadeTransform(
  mobject: VMobject,
  target: VMobject,
  options?: FadeTransformOptions,
): FadeTransform {
  return new FadeTransform(mobject, target, options);
}

// ============================================================================
// FadeTransformPieces
// ============================================================================

export type FadeTransformPiecesOptions = AnimationOptions;

/**
 * FadeTransformPieces animation - transforms pieces (submobjects) with fade effect.
 * Each submobject fades and transforms independently.
 */
export class FadeTransformPieces extends Animation {
  /** The target mobject to transform into */
  readonly target: VMobject;

  /** Starting state for each piece */
  private _pieceStates: Array<{
    startPoints: number[][];
    targetPoints: number[][];
    startOpacity: number;
    targetOpacity: number;
  }> = [];

  constructor(mobject: VMobject, target: VMobject, options: FadeTransformPiecesOptions = {}) {
    super(mobject, options);
    this.target = target;
  }

  override begin(): void {
    super.begin();

    const source = this.mobject as VMobject;
    const sourceChildren = source.children as VMobject[];
    const targetChildren = this.target.children as VMobject[];

    // Handle case where we have submobjects
    if (sourceChildren.length > 0 && targetChildren.length > 0) {
      const maxLen = Math.max(sourceChildren.length, targetChildren.length);

      for (let i = 0; i < maxLen; i++) {
        const srcChild = sourceChildren[Math.min(i, sourceChildren.length - 1)] as VMobject;
        const tgtChild = targetChildren[Math.min(i, targetChildren.length - 1)] as VMobject;

        const srcCopy = srcChild.copy() as VMobject;
        const tgtCopy = tgtChild.copy() as VMobject;
        srcCopy.alignPoints(tgtCopy);

        this._pieceStates.push({
          startPoints: srcCopy.getPoints(),
          targetPoints: tgtCopy.getPoints(),
          startOpacity: srcChild.opacity,
          targetOpacity: tgtChild.opacity,
        });
      }
    } else {
      // No submobjects, treat as single piece
      const srcCopy = source.copy() as VMobject;
      const tgtCopy = this.target.copy() as VMobject;
      srcCopy.alignPoints(tgtCopy);

      this._pieceStates.push({
        startPoints: srcCopy.getPoints(),
        targetPoints: tgtCopy.getPoints(),
        startOpacity: source.opacity,
        targetOpacity: this.target.opacity,
      });
    }
  }

  interpolate(alpha: number): void {
    const source = this.mobject as VMobject;
    const sourceChildren = source.children as VMobject[];

    if (sourceChildren.length > 0 && this._pieceStates.length > 0) {
      for (let i = 0; i < sourceChildren.length; i++) {
        const child = sourceChildren[i] as VMobject;
        const state = this._pieceStates[Math.min(i, this._pieceStates.length - 1)];

        const points: number[][] = [];
        for (let j = 0; j < state.startPoints.length; j++) {
          points.push(lerpPoint(state.startPoints[j], state.targetPoints[j], alpha));
        }
        child.setPoints(points);

        // Fade effect
        if (alpha < 0.5) {
          child.opacity = state.startOpacity * (1 - 2 * alpha);
        } else {
          child.opacity = state.targetOpacity * (2 * alpha - 1);
        }
      }
    } else if (this._pieceStates.length > 0) {
      // Single piece
      const state = this._pieceStates[0];
      const points: number[][] = [];
      for (let j = 0; j < state.startPoints.length; j++) {
        points.push(lerpPoint(state.startPoints[j], state.targetPoints[j], alpha));
      }
      source.setPoints(points);

      if (alpha < 0.5) {
        source.opacity = state.startOpacity * (1 - 2 * alpha);
      } else {
        source.opacity = state.targetOpacity * (2 * alpha - 1);
      }
    }
  }

  override finish(): void {
    const source = this.mobject as VMobject;
    const sourceChildren = source.children as VMobject[];

    if (sourceChildren.length > 0 && this._pieceStates.length > 0) {
      for (let i = 0; i < sourceChildren.length; i++) {
        const child = sourceChildren[i] as VMobject;
        const state = this._pieceStates[Math.min(i, this._pieceStates.length - 1)];
        child.setPoints(state.targetPoints);
        child.opacity = state.targetOpacity;
      }
    } else if (this._pieceStates.length > 0) {
      const state = this._pieceStates[0];
      source.setPoints(state.targetPoints);
      source.opacity = state.targetOpacity;
    }

    super.finish();
  }
}

/**
 * Create a FadeTransformPieces animation.
 * @param mobject The VMobject to transform
 * @param target The target VMobject
 * @param options Animation options
 */
export function fadeTransformPieces(
  mobject: VMobject,
  target: VMobject,
  options?: FadeTransformPiecesOptions,
): FadeTransformPieces {
  return new FadeTransformPieces(mobject, target, options);
}

// ============================================================================
// TransformFromCopy
// ============================================================================

export type TransformFromCopyOptions = AnimationOptions;

/**
 * TransformFromCopy animation - transforms from a copy of the source to target.
 * Useful when you want to show a transformation while keeping the original.
 */
export class TransformFromCopy extends Transform {
  /** The original source mobject (kept unchanged) */
  readonly originalSource: VMobject;

  constructor(source: VMobject, target: VMobject, options: TransformFromCopyOptions = {}) {
    // Create a copy of the source to animate
    const sourceCopy = source.copy() as VMobject;
    super(sourceCopy, target, options);
    this.originalSource = source;
  }
}

/**
 * Create a TransformFromCopy animation.
 * @param source The source VMobject (will be copied)
 * @param target The target VMobject
 * @param options Animation options
 */
export function transformFromCopy(
  source: VMobject,
  target: VMobject,
  options?: TransformFromCopyOptions,
): TransformFromCopy {
  return new TransformFromCopy(source, target, options);
}

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

    const startCopy = vmobject.copy() as VMobject;
    const targetCopy = this.target.copy() as VMobject;
    startCopy.alignPoints(targetCopy);

    this._startPoints = startCopy.getPoints();
    this._targetPoints = targetCopy.getPoints();

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

    const startCopy = vmobject.copy() as VMobject;
    const targetCopy = this.target.copy() as VMobject;
    startCopy.alignPoints(targetCopy);

    this._startPoints = startCopy.getPoints();
    this._targetPoints = targetCopy.getPoints();

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
  }

  override begin(): void {
    super.begin();

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
  }

  override begin(): void {
    super.begin();

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

// ============================================================================
// ScaleInPlace
// ============================================================================

export interface ScaleInPlaceOptions extends AnimationOptions {
  /** Scale factor */
  scaleFactor: number;
}

/**
 * ScaleInPlace animation - scales a mobject without moving its center.
 * Unlike regular scale which might affect position, this keeps center fixed.
 */
export class ScaleInPlace extends Animation {
  /** Scale factor */
  readonly scaleFactor: number;

  /** Initial scale */
  private _initialScale: THREE.Vector3 = new THREE.Vector3();

  /** Target scale */
  private _targetScale: THREE.Vector3 = new THREE.Vector3();

  /** Center position to maintain */
  private _center: Vector3Tuple = [0, 0, 0];

  constructor(mobject: Mobject, options: ScaleInPlaceOptions) {
    super(mobject, options);
    this.scaleFactor = options.scaleFactor;
  }

  override begin(): void {
    super.begin();

    this._initialScale.copy(this.mobject.scaleVector);
    this._targetScale.set(
      this._initialScale.x * this.scaleFactor,
      this._initialScale.y * this.scaleFactor,
      this._initialScale.z * this.scaleFactor,
    );
    this._center = this.mobject.getCenter();
  }

  interpolate(alpha: number): void {
    // Interpolate scale
    this.mobject.scaleVector.lerpVectors(this._initialScale, this._targetScale, alpha);

    // Ensure center stays fixed (adjust position if needed)
    const currentCenter = this.mobject.getCenter();
    const offset: Vector3Tuple = [
      this._center[0] - currentCenter[0],
      this._center[1] - currentCenter[1],
      this._center[2] - currentCenter[2],
    ];
    this.mobject.shift(offset);

    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.scaleVector.copy(this._targetScale);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a ScaleInPlace animation.
 * @param mobject The mobject to scale
 * @param scaleFactor Scale factor
 * @param options Animation options
 */
export function scaleInPlace(
  mobject: Mobject,
  scaleFactor: number,
  options?: Omit<ScaleInPlaceOptions, 'scaleFactor'>,
): ScaleInPlace {
  return new ScaleInPlace(mobject, { ...options, scaleFactor });
}

// ============================================================================
// ShrinkToCenter
// ============================================================================

export type ShrinkToCenterOptions = AnimationOptions;

/**
 * ShrinkToCenter animation - shrinks a mobject to its center point.
 * The mobject scales down to zero while staying centered.
 */
export class ShrinkToCenter extends Animation {
  /** Initial scale */
  private _initialScale: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: ShrinkToCenterOptions = {}) {
    super(mobject, options);
  }

  override begin(): void {
    super.begin();
    this._initialScale.copy(this.mobject.scaleVector);
  }

  interpolate(alpha: number): void {
    const scale = 1 - alpha;
    this.mobject.scaleVector.set(
      this._initialScale.x * scale,
      this._initialScale.y * scale,
      this._initialScale.z * scale,
    );
    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.scaleVector.set(0, 0, 0);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a ShrinkToCenter animation.
 * @param mobject The mobject to shrink
 * @param options Animation options
 */
export function shrinkToCenter(mobject: Mobject, options?: ShrinkToCenterOptions): ShrinkToCenter {
  return new ShrinkToCenter(mobject, options);
}

// ============================================================================
// Restore
// ============================================================================

/**
 * Interface for mobjects that support saved state
 */
export interface MobjectWithSavedState extends VMobject {
  savedState: VMobject | null;
}

export type RestoreOptions = AnimationOptions;

/**
 * Restore animation - restores a mobject to its saved state.
 * The mobject must have a savedState property set beforehand.
 */
export class Restore extends Transform {
  constructor(mobject: MobjectWithSavedState, options: RestoreOptions = {}) {
    if (!mobject.savedState) {
      throw new Error(
        'Restore requires mobject.savedState to be set. Use mobject.saveState() first.',
      );
    }
    super(mobject, mobject.savedState, options);
  }
}

/**
 * Create a Restore animation.
 * @param mobject The mobject to restore (must have savedState)
 * @param options Animation options
 */
export function restore(mobject: MobjectWithSavedState, options?: RestoreOptions): Restore {
  return new Restore(mobject, options);
}

// ============================================================================
// FadeToColor
// ============================================================================

export interface FadeToColorOptions extends AnimationOptions {
  /** Target color */
  color: string;
}

/**
 * FadeToColor animation - animates a color change on a mobject.
 * The color smoothly transitions from current to target.
 */
export class FadeToColor extends Animation {
  /** Target color */
  readonly targetColor: string;

  /** Starting color as THREE.Color */
  private _startColor: THREE.Color = new THREE.Color();

  /** Target color as THREE.Color */
  private _targetColorObj: THREE.Color = new THREE.Color();

  constructor(mobject: Mobject, options: FadeToColorOptions) {
    super(mobject, options);
    this.targetColor = options.color;
  }

  override begin(): void {
    super.begin();
    this._startColor.set(this.mobject.color);
    this._targetColorObj.set(this.targetColor);
  }

  interpolate(alpha: number): void {
    const color = new THREE.Color().lerpColors(this._startColor, this._targetColorObj, alpha);
    this.mobject.color = '#' + color.getHexString();
    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.color = this.targetColor;
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a FadeToColor animation.
 * @param mobject The mobject to recolor
 * @param color Target color (CSS color string)
 * @param options Animation options
 */
export function fadeToColor(
  mobject: Mobject,
  color: string,
  options?: Omit<FadeToColorOptions, 'color'>,
): FadeToColor {
  return new FadeToColor(mobject, { ...options, color });
}

// ============================================================================
// TransformAnimations (Meta-Animation)
// ============================================================================

export interface TransformAnimationsOptions extends AnimationOptions {
  /** Rate function for the meta-animation interpolation */
  transformRateFunc?: (t: number) => number;
}

/**
 * TransformAnimations - A meta-animation that transforms one animation into another
 *
 * This is a higher-order animation that interpolates between the effects of two
 * different animations. It runs both animations internally and blends their results.
 *
 * At alpha=0, the mobject shows the state from animation1
 * At alpha=1, the mobject shows the state from animation2
 * In between, it blends the two states
 *
 * @example
 * ```typescript
 * import { Circle, Transform, FadeIn, TransformAnimations } from 'manimweb';
 *
 * const circle = new Circle({ radius: 1 });
 * const target = new Square({ sideLength: 2 });
 *
 * // Create two animations
 * const anim1 = new Transform(circle, target);
 * const anim2 = new FadeIn(circle);
 *
 * // Meta-animation that transitions between the effects of the two animations
 * const metaAnim = new TransformAnimations(anim1, anim2, { duration: 2 });
 * ```
 */
export class TransformAnimations extends Animation {
  /** The first animation (source animation) */
  readonly animation1: Animation;

  /** The second animation (target animation) */
  readonly animation2: Animation;

  /** Optional rate function for the transform interpolation */
  readonly transformRateFunc: (t: number) => number;

  /** Stored state from animation2 at various points */
  private _anim2StartPoints: number[][] = [];
  private _anim2EndPoints: number[][] = [];

  /** Original mobject state before any animation */
  private _originalPoints: number[][] = [];

  /** Original style values */
  private _originalOpacity: number = 1;
  private _originalFillOpacity: number = 0;

  constructor(
    animation1: Animation,
    animation2: Animation,
    options: TransformAnimationsOptions = {},
  ) {
    // Use the mobject from animation1 as the primary mobject
    super(animation1.mobject, options);
    this.animation1 = animation1;
    this.animation2 = animation2;
    this.transformRateFunc = options.transformRateFunc ?? ((t: number) => t);
  }

  override begin(): void {
    super.begin();

    const vmobject = this.mobject as VMobject;
    const anim1Mobject = this.animation1.mobject as VMobject;
    const anim2Mobject = this.animation2.mobject as VMobject;

    // Store original state
    this._originalPoints = vmobject.getPoints();
    this._originalOpacity = vmobject.opacity;
    this._originalFillOpacity = vmobject.fillOpacity;

    // Initialize animation1 and capture its start and end states
    anim1Mobject.setPoints([...this._originalPoints]);
    anim1Mobject.opacity = this._originalOpacity;
    anim1Mobject.fillOpacity = this._originalFillOpacity;
    this.animation1.begin();

    // Run animation1 to end and capture end state
    this.animation1.interpolate(1);

    // Reset animation1 mobject
    anim1Mobject.setPoints([...this._originalPoints]);
    anim1Mobject.opacity = this._originalOpacity;
    anim1Mobject.fillOpacity = this._originalFillOpacity;

    // Initialize animation2 and capture its states
    this._anim2StartPoints = anim2Mobject.getPoints();
    this.animation2.begin();

    // Run animation2 to end
    this.animation2.interpolate(1);
    this._anim2EndPoints = anim2Mobject.getPoints();

    // Reset animation2
    anim2Mobject.setPoints(this._anim2StartPoints);

    // Reset mobject to original
    vmobject.setPoints([...this._originalPoints]);
    vmobject.opacity = this._originalOpacity;
    vmobject.fillOpacity = this._originalFillOpacity;
  }

  interpolate(alpha: number): void {
    const vmobject = this.mobject as VMobject;
    const anim1Mobject = this.animation1.mobject as VMobject;
    const anim2Mobject = this.animation2.mobject as VMobject;

    // Apply transform rate function
    const transformAlpha = this.transformRateFunc(alpha);

    // Run animation1 at current alpha
    anim1Mobject.setPoints([...this._originalPoints]);
    anim1Mobject.opacity = this._originalOpacity;
    this.animation1.interpolate(alpha);
    const anim1Points = anim1Mobject.getPoints();
    const anim1Opacity = anim1Mobject.opacity;

    // Run animation2 at current alpha
    anim2Mobject.setPoints(this._anim2StartPoints);
    this.animation2.interpolate(alpha);
    const anim2Points = anim2Mobject.getPoints();
    const anim2Opacity = anim2Mobject.opacity;

    // Blend between animation1 and animation2 results based on transformAlpha
    const blendedPoints: number[][] = [];
    const minLen = Math.min(anim1Points.length, anim2Points.length);

    for (let i = 0; i < minLen; i++) {
      blendedPoints.push(lerpPoint(anim1Points[i], anim2Points[i], transformAlpha));
    }

    // If lengths differ, append remaining points from the longer array
    if (anim1Points.length > minLen) {
      for (let i = minLen; i < anim1Points.length; i++) {
        blendedPoints.push([...anim1Points[i]]);
      }
    } else if (anim2Points.length > minLen) {
      for (let i = minLen; i < anim2Points.length; i++) {
        blendedPoints.push([...anim2Points[i]]);
      }
    }

    vmobject.setPoints(blendedPoints);

    // Blend opacity
    vmobject.opacity = lerp(anim1Opacity, anim2Opacity, transformAlpha);
  }

  override finish(): void {
    // Finish with animation2's end state
    const vmobject = this.mobject as VMobject;
    const anim2Mobject = this.animation2.mobject as VMobject;

    vmobject.setPoints(this._anim2EndPoints);
    vmobject.opacity = anim2Mobject.opacity;

    this.animation1.finish();
    this.animation2.finish();

    super.finish();
  }
}

/**
 * Create a TransformAnimations meta-animation.
 * This animation interpolates between the effects of two different animations.
 *
 * @param animation1 The first animation (source)
 * @param animation2 The second animation (target)
 * @param options Animation options
 */
export function transformAnimations(
  animation1: Animation,
  animation2: Animation,
  options?: TransformAnimationsOptions,
): TransformAnimations {
  return new TransformAnimations(animation1, animation2, options);
}
