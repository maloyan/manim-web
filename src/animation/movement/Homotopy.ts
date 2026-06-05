/**
 * Homotopy-based animations that transform mobjects by applying
 * point-wise transformations over time.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';
import { flowPoint } from '../../utils/ode';

/**
 * A captured world transform: the mobject's world matrix and its inverse.
 * Used to run point-wise functions in world space — points are stored in
 * local space, but the user's function (and any vector field) operates on
 * the coordinates the object actually occupies on screen.
 */
interface WorldFrame {
  worldMatrix: THREE.Matrix4;
  inverseWorld: THREE.Matrix4;
}

/**
 * Capture a mobject's world transform at the moment an animation begins.
 *
 * Uses `_computeWorldMatrix()` — the same matrix `VMobject.getPoints()` applies
 * — so lifting a local point here and reading it back via `getPoints()` round
 * trips exactly. (This is preferable to the Three.js `matrixWorld`, which also
 * folds in the render-only z-layering offset and requires the object to be
 * realised.) For an untransformed, unparented mobject this is identity, so
 * world === local and the conversion is a no-op.
 *
 * @post result.worldMatrix · result.inverseWorld === identity (up to fp error)
 */
function captureWorldFrame(mob: Mobject): WorldFrame {
  const worldMatrix = mob._worldMatrix();
  return { worldMatrix, inverseWorld: worldMatrix.clone().invert() };
}

/** Apply a Matrix4 to a tuple, returning a new tuple. */
function applyMatrix(m: THREE.Matrix4, p: number[]): [number, number, number] {
  const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(m);
  return [v.x, v.y, v.z];
}

/**
 * Type for a 3D homotopy function
 * @param x - X coordinate of the point
 * @param y - Y coordinate of the point
 * @param z - Z coordinate of the point
 * @param t - Time parameter from 0 to 1
 * @returns Transformed point as [x', y', z']
 */
export type HomotopyFunction = (
  x: number,
  y: number,
  z: number,
  t: number,
) => [number, number, number];

/**
 * Complex number representation for complex homotopy
 */
export interface Complex {
  re: number;
  im: number;
}

/**
 * Type for a complex plane homotopy function
 * @param z - Complex number (x + iy)
 * @param t - Time parameter from 0 to 1
 * @returns Transformed complex number
 */
export type ComplexHomotopyFunction = (z: Complex, t: number) => Complex;

/**
 * Type for a vector field function
 * @param point - Point in 3D space [x, y, z]
 * @returns Vector at that point [vx, vy, vz]
 */
export type VectorFieldFunction = (point: [number, number, number]) => [number, number, number];

export interface HomotopyOptions extends AnimationOptions {
  /** The homotopy function to apply */
  homotopyFunc: HomotopyFunction;
}

export interface ComplexHomotopyOptions extends AnimationOptions {
  /** The complex homotopy function to apply */
  complexFunc: ComplexHomotopyFunction;
}

export interface SmoothedVectorizedHomotopyOptions extends AnimationOptions {
  /** The homotopy function to apply */
  homotopyFunc: HomotopyFunction;
}

export interface PhaseFlowOptions extends AnimationOptions {
  /** The vector field function defining the flow */
  vectorField: VectorFieldFunction;
  /** Virtual time to flow through (default: 1) */
  virtualTime?: number;
  /** Number of RK4 integration steps per unit of virtual time (default: 100) */
  integrationSteps?: number;
}

/**
 * General homotopy animation that transforms every point on a mobject
 * using a function f(x, y, z, t) => [x', y', z'] where t goes from 0 to 1.
 */
export class Homotopy extends Animation {
  /** The homotopy function */
  readonly homotopyFunc: HomotopyFunction;

  /** Original points (local frame) stored at animation start */
  private _originalPoints: number[][] | null = null;

  /** World transform captured at begin(), so the function runs in world space */
  private _frame: WorldFrame | null = null;

  /** Whether the mobject is a VMobject */
  private _isVMobject: boolean = false;

  constructor(mobject: Mobject, options: HomotopyOptions) {
    super(mobject, options);
    this.homotopyFunc = options.homotopyFunc;
  }

  /**
   * Store the original points at animation start
   */
  override begin(): void {
    super.begin();

    if (this.mobject instanceof VMobject) {
      this._isVMobject = true;
      this._originalPoints = (this.mobject as VMobject).getLocalPoints();
      this._frame = captureWorldFrame(this.mobject);
    } else {
      this._isVMobject = false;
      this._originalPoints = null;
      this._frame = null;
    }
  }

  /**
   * Apply the homotopy at the given progress value.
   *
   * The function is evaluated in WORLD space: stored points are local, so each
   * is lifted through the world matrix before the call and pushed back through
   * its inverse afterwards. For an untransformed mobject world === local, so
   * this reduces to the plain transform.
   */
  interpolate(alpha: number): void {
    if (!this._isVMobject || !this._originalPoints || !this._frame) {
      // For non-VMobjects, we can only transform the position (already world-space)
      const pos = this.mobject.position;
      const [newX, newY, newZ] = this.homotopyFunc(pos.x, pos.y, pos.z, alpha);
      this.mobject.position.set(newX, newY, newZ);
      this.mobject._markDirty();
      return;
    }

    // Transform all points on the VMobject in world space
    const vmobject = this.mobject as VMobject;
    const { worldMatrix, inverseWorld } = this._frame;
    const newPoints: number[][] = [];

    for (const point of this._originalPoints) {
      const [wx, wy, wz] = applyMatrix(worldMatrix, point);
      const moved = this.homotopyFunc(wx, wy, wz, alpha);
      newPoints.push(applyMatrix(inverseWorld, moved));
    }

    vmobject.setPoints3D(newPoints);
  }

  /**
   * Ensure the final state is exact
   */
  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}

/**
 * Homotopy in the complex plane where points are treated as complex numbers.
 * The function operates on z = x + iy and returns a new complex number.
 */
export class ComplexHomotopy extends Animation {
  /** The complex homotopy function */
  readonly complexFunc: ComplexHomotopyFunction;

  /** Original points (local frame) stored at animation start */
  private _originalPoints: number[][] | null = null;

  /** World transform captured at begin(), so the function runs in world space */
  private _frame: WorldFrame | null = null;

  /** Whether the mobject is a VMobject */
  private _isVMobject: boolean = false;

  constructor(mobject: Mobject, options: ComplexHomotopyOptions) {
    super(mobject, options);
    this.complexFunc = options.complexFunc;
  }

  /**
   * Store the original points at animation start
   */
  override begin(): void {
    super.begin();

    if (this.mobject instanceof VMobject) {
      this._isVMobject = true;
      this._originalPoints = (this.mobject as VMobject).getLocalPoints();
      this._frame = captureWorldFrame(this.mobject);
    } else {
      this._isVMobject = false;
      this._originalPoints = null;
      this._frame = null;
    }
  }

  /**
   * Apply the complex homotopy at the given progress value.
   *
   * The complex plane is interpreted in WORLD space: each local point is
   * lifted through the world matrix, treated as z = x + iy, mapped, then
   * pushed back through the inverse. World === local when untransformed.
   */
  interpolate(alpha: number): void {
    if (!this._isVMobject || !this._originalPoints || !this._frame) {
      // For non-VMobjects, transform the position in the complex plane (world-space)
      const pos = this.mobject.position;
      const z: Complex = { re: pos.x, im: pos.y };
      const result = this.complexFunc(z, alpha);
      this.mobject.position.set(result.re, result.im, pos.z);
      this.mobject._markDirty();
      return;
    }

    // Transform all points treating (x, y) as complex numbers, in world space
    const vmobject = this.mobject as VMobject;
    const { worldMatrix, inverseWorld } = this._frame;
    const newPoints: number[][] = [];

    for (const point of this._originalPoints) {
      const [wx, wy, wz] = applyMatrix(worldMatrix, point);
      const result = this.complexFunc({ re: wx, im: wy }, alpha);
      newPoints.push(applyMatrix(inverseWorld, [result.re, result.im, wz]));
    }

    vmobject.setPoints3D(newPoints);
  }

  /**
   * Ensure the final state is exact
   */
  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}

/**
 * A homotopy animation that maintains the smoothness of Bezier curves.
 * This is better suited for VMobject transformations as it properly
 * handles control points to preserve curve continuity.
 */
export class SmoothedVectorizedHomotopy extends Animation {
  /** The homotopy function */
  readonly homotopyFunc: HomotopyFunction;

  /**
   * Original points in WORLD space, stored at animation start. The smoothing
   * algorithm runs entirely in world space (the frame the user's function
   * expects) and results are converted back to local before writing.
   */
  private _originalPoints: number[][] | null = null;

  /** World transform captured at begin(), used to convert results back to local */
  private _frame: WorldFrame | null = null;

  /** Cached anchor indices for faster lookups */
  private _anchorIndices: number[] = [];

  constructor(mobject: VMobject, options: SmoothedVectorizedHomotopyOptions) {
    super(mobject, options);
    this.homotopyFunc = options.homotopyFunc;
  }

  /**
   * Store the original points and compute anchor indices
   */
  override begin(): void {
    super.begin();

    const vmobject = this.mobject as VMobject;
    this._frame = captureWorldFrame(vmobject);
    // Store originals already lifted to world space; the smoothing math below
    // (anchor transforms blended with point offsets) is only coherent when
    // every quantity lives in the same frame.
    const { worldMatrix } = this._frame;
    this._originalPoints = vmobject.getLocalPoints().map((p) => applyMatrix(worldMatrix, p));

    // Compute anchor indices (every 3rd point starting from 0)
    // Points format: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
    this._anchorIndices = [];
    for (let i = 0; i < this._originalPoints.length; i += 3) {
      this._anchorIndices.push(i);
    }
    // Also include the last point if it's not already an anchor
    const lastIdx = this._originalPoints.length - 1;
    if (lastIdx >= 0 && !this._anchorIndices.includes(lastIdx)) {
      this._anchorIndices.push(lastIdx);
    }
  }

  /**
   * Apply the homotopy while maintaining Bezier curve smoothness.
   * Anchors are transformed directly, and handles are adjusted
   * to maintain relative positions to their anchors.
   */
  interpolate(alpha: number): void {
    if (!this._originalPoints || this._originalPoints.length === 0 || !this._frame) {
      return;
    }

    const vmobject = this.mobject as VMobject;
    const numPoints = this._originalPoints.length;
    const newPoints: number[][] = new Array(numPoints);

    // First pass: transform all anchor points
    const anchorTransforms: Map<number, { original: number[]; transformed: number[] }> = new Map();

    for (const anchorIdx of this._anchorIndices) {
      if (anchorIdx < numPoints) {
        const original = this._originalPoints[anchorIdx];
        const transformed = this.homotopyFunc(original[0], original[1], original[2], alpha);
        anchorTransforms.set(anchorIdx, { original, transformed });
        newPoints[anchorIdx] = transformed;
      }
    }

    // Second pass: transform handles while maintaining relative smoothness
    for (let i = 0; i < numPoints; i++) {
      if (anchorTransforms.has(i)) {
        // Already processed as anchor
        continue;
      }
      newPoints[i] = this._transformHandle(i, alpha, anchorTransforms);
    }

    // newPoints are in world space; convert back to local for storage.
    const { inverseWorld } = this._frame;
    vmobject.setPoints3D(newPoints.map((p) => applyMatrix(inverseWorld, p)));
  }

  /**
   * Transform a single handle point at index `i`, keeping it smooth relative to
   * the anchors that bracket it. Operates entirely in world space (the frame
   * `_originalPoints` and `anchorTransforms` were captured in).
   */
  private _transformHandle(
    i: number,
    alpha: number,
    anchorTransforms: Map<number, { original: number[]; transformed: number[] }>,
  ): number[] {
    const originalHandle = this._originalPoints![i];

    // Find the nearest anchors before and after this handle
    let prevAnchorIdx = -1;
    let nextAnchorIdx = -1;
    for (const anchorIdx of this._anchorIndices) {
      if (anchorIdx < i) {
        prevAnchorIdx = anchorIdx;
      }
      if (anchorIdx > i && nextAnchorIdx === -1) {
        nextAnchorIdx = anchorIdx;
        break;
      }
    }

    // Both anchors: blend the direct transform with a smoothed interpolation.
    if (prevAnchorIdx >= 0 && nextAnchorIdx >= 0) {
      const prevData = anchorTransforms.get(prevAnchorIdx)!;
      const nextData = anchorTransforms.get(nextAnchorIdx)!;

      const origOffset = [
        originalHandle[0] - prevData.original[0],
        originalHandle[1] - prevData.original[1],
        originalHandle[2] - prevData.original[2],
      ];
      const localTransform = this.homotopyFunc(
        originalHandle[0],
        originalHandle[1],
        originalHandle[2],
        alpha,
      );

      // Blend based on relative position between the two anchors.
      const t = (i - prevAnchorIdx) / (nextAnchorIdx - prevAnchorIdx);
      const blended = [0, 1, 2].map(
        (k) =>
          (1 - t) * (prevData.transformed[k] + origOffset[k]) +
          t *
            (nextData.transformed[k] +
              origOffset[k] -
              (nextData.original[k] - prevData.original[k])),
      );

      // Mix the direct transformation with the smoothed one to keep curve quality.
      const smoothFactor = 0.5;
      return [0, 1, 2].map(
        (k) => localTransform[k] * (1 - smoothFactor) + blended[k] * smoothFactor,
      );
    }

    // Only one anchor: carry the handle's original offset onto the moved anchor.
    const anchorData = anchorTransforms.get(prevAnchorIdx >= 0 ? prevAnchorIdx : nextAnchorIdx);
    if (anchorData) {
      return [0, 1, 2].map(
        (k) => anchorData.transformed[k] + (originalHandle[k] - anchorData.original[k]),
      );
    }

    // No anchors found, just transform directly.
    return this.homotopyFunc(originalHandle[0], originalHandle[1], originalHandle[2], alpha);
  }

  /**
   * Ensure the final state is exact
   */
  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}

/**
 * Animation that flows a mobject along a vector field.
 * The mobject follows the flow lines defined by the vector field function.
 *
 * Uses the RK4 ODE solver from `utils/ode` for accurate numerical integration.
 *
 * @example
 * ```typescript
 * // Circular flow
 * const flow = new PhaseFlow(dots, {
 *   vectorField: ([x, y, z]) => [-y, x, 0],
 *   virtualTime: 2,
 *   duration: 3,
 * });
 * ```
 */
export class PhaseFlow extends Animation {
  /** The vector field function */
  readonly vectorField: VectorFieldFunction;

  /** Virtual time to flow through */
  readonly virtualTime: number;

  /** Original points (local frame) stored at animation start */
  private _originalPoints: number[][] | null = null;

  /** World transform captured at begin(), so the flow runs in world space */
  private _frame: WorldFrame | null = null;

  /** Original position for non-VMobject mobjects */
  private _originalPosition: [number, number, number] | null = null;

  /** Whether the mobject is a VMobject */
  private _isVMobject: boolean = false;

  /** Number of integration steps per unit of virtual time */
  private readonly _integrationSteps: number;

  constructor(mobject: Mobject, options: PhaseFlowOptions) {
    super(mobject, options);
    this.vectorField = options.vectorField;
    this.virtualTime = options.virtualTime ?? 1;
    this._integrationSteps = options.integrationSteps ?? 100;
  }

  /**
   * Store the original points at animation start
   */
  override begin(): void {
    super.begin();

    if (this.mobject instanceof VMobject) {
      this._isVMobject = true;
      this._originalPoints = (this.mobject as VMobject).getLocalPoints();
      this._frame = captureWorldFrame(this.mobject);
    } else {
      this._isVMobject = false;
      this._originalPoints = null;
      this._frame = null;
      const pos = this.mobject.position;
      this._originalPosition = [pos.x, pos.y, pos.z];
    }
  }

  /**
   * Apply the phase flow at the given progress value.
   *
   * Each point is flowed from its original position for alpha * virtualTime
   * using RK4 integration. The vector field is sampled in WORLD space: local
   * points are lifted through the world matrix, flowed, then pushed back
   * through the inverse. World === local when untransformed.
   */
  interpolate(alpha: number): void {
    const flowTime = alpha * this.virtualTime;

    if (!this._isVMobject || !this._originalPoints || !this._frame) {
      // For non-VMobjects, flow the position from the stored original (world-space)
      const start =
        this._originalPosition ??
        ([this.mobject.position.x, this.mobject.position.y, this.mobject.position.z] as [
          number,
          number,
          number,
        ]);
      const [newX, newY, newZ] = flowPoint(
        this.vectorField,
        start,
        flowTime,
        this._integrationSteps,
      );
      this.mobject.position.set(newX, newY, newZ);
      this.mobject._markDirty();
      return;
    }

    // Flow all points on the VMobject from their original positions, in world space
    const vmobject = this.mobject as VMobject;
    const { worldMatrix, inverseWorld } = this._frame;
    const newPoints: number[][] = [];

    for (const point of this._originalPoints) {
      const flowed = flowPoint(
        this.vectorField,
        applyMatrix(worldMatrix, point),
        flowTime,
        this._integrationSteps,
      );
      newPoints.push(applyMatrix(inverseWorld, flowed));
    }

    vmobject.setPoints3D(newPoints);
  }

  /**
   * Ensure the final state is exact
   */
  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}

// Factory functions for convenient animation creation

/**
 * Create a Homotopy animation for a mobject.
 * @param mobject The mobject to transform
 * @param homotopyFunc The homotopy function (x, y, z, t) => [x', y', z']
 * @param options Animation options (duration, rateFunc)
 */
export function homotopy(
  mobject: Mobject,
  homotopyFunc: HomotopyFunction,
  options?: Omit<HomotopyOptions, 'homotopyFunc'>,
): Homotopy {
  return new Homotopy(mobject, { ...options, homotopyFunc });
}

/**
 * Create a ComplexHomotopy animation for a mobject.
 * @param mobject The mobject to transform
 * @param complexFunc The complex homotopy function (z, t) => z'
 * @param options Animation options (duration, rateFunc)
 */
export function complexHomotopy(
  mobject: Mobject,
  complexFunc: ComplexHomotopyFunction,
  options?: Omit<ComplexHomotopyOptions, 'complexFunc'>,
): ComplexHomotopy {
  return new ComplexHomotopy(mobject, { ...options, complexFunc });
}

/**
 * Create a SmoothedVectorizedHomotopy animation for a VMobject.
 * @param mobject The VMobject to transform
 * @param homotopyFunc The homotopy function (x, y, z, t) => [x', y', z']
 * @param options Animation options (duration, rateFunc)
 */
export function smoothedVectorizedHomotopy(
  mobject: VMobject,
  homotopyFunc: HomotopyFunction,
  options?: Omit<SmoothedVectorizedHomotopyOptions, 'homotopyFunc'>,
): SmoothedVectorizedHomotopy {
  return new SmoothedVectorizedHomotopy(mobject, { ...options, homotopyFunc });
}

/**
 * Create a PhaseFlow animation for a mobject.
 * @param mobject The mobject to flow
 * @param vectorField The vector field function defining the flow
 * @param options Animation options (duration, rateFunc, virtualTime)
 */
export function phaseFlow(
  mobject: Mobject,
  vectorField: VectorFieldFunction,
  options?: Omit<PhaseFlowOptions, 'vectorField'>,
): PhaseFlow {
  return new PhaseFlow(mobject, { ...options, vectorField });
}
