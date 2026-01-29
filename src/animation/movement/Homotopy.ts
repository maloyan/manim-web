/**
 * Homotopy-based animations that transform mobjects by applying
 * point-wise transformations over time.
 */

import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';

/**
 * Type for a 3D homotopy function
 * @param x - X coordinate of the point
 * @param y - Y coordinate of the point
 * @param z - Z coordinate of the point
 * @param t - Time parameter from 0 to 1
 * @returns Transformed point as [x', y', z']
 */
export type HomotopyFunction = (x: number, y: number, z: number, t: number) => [number, number, number];

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
}

/**
 * General homotopy animation that transforms every point on a mobject
 * using a function f(x, y, z, t) => [x', y', z'] where t goes from 0 to 1.
 */
export class Homotopy extends Animation {
  /** The homotopy function */
  readonly homotopyFunc: HomotopyFunction;

  /** Original points stored at animation start */
  private _originalPoints: number[][] | null = null;

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
      this._originalPoints = (this.mobject as VMobject).getPoints();
    } else {
      this._isVMobject = false;
      this._originalPoints = null;
    }
  }

  /**
   * Apply the homotopy at the given progress value
   */
  interpolate(alpha: number): void {
    if (!this._isVMobject || !this._originalPoints) {
      // For non-VMobjects, we can only transform the position
      const pos = this.mobject.position;
      const [newX, newY, newZ] = this.homotopyFunc(pos.x, pos.y, pos.z, alpha);
      this.mobject.position.set(newX, newY, newZ);
      this.mobject._markDirty();
      return;
    }

    // Transform all points on the VMobject
    const vmobject = this.mobject as VMobject;
    const newPoints: number[][] = [];

    for (const point of this._originalPoints) {
      const [newX, newY, newZ] = this.homotopyFunc(point[0], point[1], point[2], alpha);
      newPoints.push([newX, newY, newZ]);
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

  /** Original points stored at animation start */
  private _originalPoints: number[][] | null = null;

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
      this._originalPoints = (this.mobject as VMobject).getPoints();
    } else {
      this._isVMobject = false;
      this._originalPoints = null;
    }
  }

  /**
   * Apply the complex homotopy at the given progress value
   */
  interpolate(alpha: number): void {
    if (!this._isVMobject || !this._originalPoints) {
      // For non-VMobjects, transform the position in the complex plane
      const pos = this.mobject.position;
      const z: Complex = { re: pos.x, im: pos.y };
      const result = this.complexFunc(z, alpha);
      this.mobject.position.set(result.re, result.im, pos.z);
      this.mobject._markDirty();
      return;
    }

    // Transform all points treating (x, y) as complex numbers
    const vmobject = this.mobject as VMobject;
    const newPoints: number[][] = [];

    for (const point of this._originalPoints) {
      const z: Complex = { re: point[0], im: point[1] };
      const result = this.complexFunc(z, alpha);
      newPoints.push([result.re, result.im, point[2]]);
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

  /** Original points stored at animation start */
  private _originalPoints: number[][] | null = null;

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
    this._originalPoints = vmobject.getPoints();

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
    if (!this._originalPoints || this._originalPoints.length === 0) {
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

      const originalHandle = this._originalPoints[i];

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

      // Transform the handle
      // If we have both anchors, interpolate based on relative position
      if (prevAnchorIdx >= 0 && nextAnchorIdx >= 0) {
        const prevData = anchorTransforms.get(prevAnchorIdx)!;
        const nextData = anchorTransforms.get(nextAnchorIdx)!;

        // Compute the relative offset from the previous anchor in original space
        const origOffset = [
          originalHandle[0] - prevData.original[0],
          originalHandle[1] - prevData.original[1],
          originalHandle[2] - prevData.original[2]
        ];

        // Compute the local transformation at this point
        const localTransform = this.homotopyFunc(originalHandle[0], originalHandle[1], originalHandle[2], alpha);

        // Compute how the transformation changes between the two anchors
        // and blend based on position
        const t = (i - prevAnchorIdx) / (nextAnchorIdx - prevAnchorIdx);

        // Use the direct transformation with smoothing
        const blendedX = (1 - t) * (prevData.transformed[0] + origOffset[0]) +
                         t * (nextData.transformed[0] + origOffset[0] - (nextData.original[0] - prevData.original[0]));
        const blendedY = (1 - t) * (prevData.transformed[1] + origOffset[1]) +
                         t * (nextData.transformed[1] + origOffset[1] - (nextData.original[1] - prevData.original[1]));
        const blendedZ = (1 - t) * (prevData.transformed[2] + origOffset[2]) +
                         t * (nextData.transformed[2] + origOffset[2] - (nextData.original[2] - prevData.original[2]));

        // Blend between the simple transformation and the smoothed transformation
        // to maintain curve quality while still following the homotopy
        const smoothFactor = 0.5;
        newPoints[i] = [
          localTransform[0] * (1 - smoothFactor) + blendedX * smoothFactor,
          localTransform[1] * (1 - smoothFactor) + blendedY * smoothFactor,
          localTransform[2] * (1 - smoothFactor) + blendedZ * smoothFactor
        ];
      } else if (prevAnchorIdx >= 0) {
        // Only have previous anchor
        const prevData = anchorTransforms.get(prevAnchorIdx)!;
        const origOffset = [
          originalHandle[0] - prevData.original[0],
          originalHandle[1] - prevData.original[1],
          originalHandle[2] - prevData.original[2]
        ];
        newPoints[i] = [
          prevData.transformed[0] + origOffset[0],
          prevData.transformed[1] + origOffset[1],
          prevData.transformed[2] + origOffset[2]
        ];
      } else if (nextAnchorIdx >= 0) {
        // Only have next anchor
        const nextData = anchorTransforms.get(nextAnchorIdx)!;
        const origOffset = [
          originalHandle[0] - nextData.original[0],
          originalHandle[1] - nextData.original[1],
          originalHandle[2] - nextData.original[2]
        ];
        newPoints[i] = [
          nextData.transformed[0] + origOffset[0],
          nextData.transformed[1] + origOffset[1],
          nextData.transformed[2] + origOffset[2]
        ];
      } else {
        // No anchors found, just transform directly
        newPoints[i] = this.homotopyFunc(originalHandle[0], originalHandle[1], originalHandle[2], alpha);
      }
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
 * Animation that flows a mobject along a vector field.
 * The mobject follows the flow lines defined by the vector field function.
 */
export class PhaseFlow extends Animation {
  /** The vector field function */
  readonly vectorField: VectorFieldFunction;

  /** Virtual time to flow through */
  readonly virtualTime: number;

  /** Original points stored at animation start */
  private _originalPoints: number[][] | null = null;

  /** Whether the mobject is a VMobject */
  private _isVMobject: boolean = false;

  /** Number of integration steps for numerical integration */
  private readonly _integrationSteps: number = 100;

  constructor(mobject: Mobject, options: PhaseFlowOptions) {
    super(mobject, options);
    this.vectorField = options.vectorField;
    this.virtualTime = options.virtualTime ?? 1;
  }

  /**
   * Store the original points at animation start
   */
  override begin(): void {
    super.begin();

    if (this.mobject instanceof VMobject) {
      this._isVMobject = true;
      this._originalPoints = (this.mobject as VMobject).getPoints();
    } else {
      this._isVMobject = false;
      this._originalPoints = null;
    }
  }

  /**
   * Flow a single point along the vector field for a given time using RK4 integration
   */
  private _flowPoint(start: [number, number, number], time: number): [number, number, number] {
    if (time === 0) {
      return [...start] as [number, number, number];
    }

    const steps = Math.ceil(Math.abs(time) * this._integrationSteps);
    const dt = time / steps;

    let [x, y, z] = start;

    // RK4 integration
    for (let i = 0; i < steps; i++) {
      const k1 = this.vectorField([x, y, z]);

      const k2 = this.vectorField([
        x + 0.5 * dt * k1[0],
        y + 0.5 * dt * k1[1],
        z + 0.5 * dt * k1[2]
      ]);

      const k3 = this.vectorField([
        x + 0.5 * dt * k2[0],
        y + 0.5 * dt * k2[1],
        z + 0.5 * dt * k2[2]
      ]);

      const k4 = this.vectorField([
        x + dt * k3[0],
        y + dt * k3[1],
        z + dt * k3[2]
      ]);

      x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      y += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      z += (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    }

    return [x, y, z];
  }

  /**
   * Apply the phase flow at the given progress value
   */
  interpolate(alpha: number): void {
    const flowTime = alpha * this.virtualTime;

    if (!this._isVMobject || !this._originalPoints) {
      // For non-VMobjects, flow the position
      const pos = this.mobject.position;
      const [newX, newY, newZ] = this._flowPoint([pos.x, pos.y, pos.z], flowTime);
      this.mobject.position.set(newX, newY, newZ);
      this.mobject._markDirty();
      return;
    }

    // Flow all points on the VMobject
    const vmobject = this.mobject as VMobject;
    const newPoints: number[][] = [];

    for (const point of this._originalPoints) {
      const flowed = this._flowPoint([point[0], point[1], point[2]], flowTime);
      newPoints.push(flowed);
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
  options?: Omit<HomotopyOptions, 'homotopyFunc'>
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
  options?: Omit<ComplexHomotopyOptions, 'complexFunc'>
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
  options?: Omit<SmoothedVectorizedHomotopyOptions, 'homotopyFunc'>
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
  options?: Omit<PhaseFlowOptions, 'vectorField'>
): PhaseFlow {
  return new PhaseFlow(mobject, { ...options, vectorField });
}
