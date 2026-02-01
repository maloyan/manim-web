/**
 * MoveAlongPath animation - moves a mobject along a path defined by a VMobject.
 */

import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { Animation, AnimationOptions } from '../Animation';

export interface MoveAlongPathOptions extends AnimationOptions {
  /** The path to follow (VMobject) */
  path: VMobject;
  /** Whether to orient the mobject tangent to the path, default false */
  rotateAlongPath?: boolean;
}

/**
 * Helper to evaluate a cubic Bezier curve at parameter t
 */
function evaluateCubicBezier(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number
): number[] {
  const oneMinusT = 1 - t;
  const oneMinusT2 = oneMinusT * oneMinusT;
  const oneMinusT3 = oneMinusT2 * oneMinusT;
  const t2 = t * t;
  const t3 = t2 * t;

  return [
    oneMinusT3 * p0[0] + 3 * oneMinusT2 * t * p1[0] + 3 * oneMinusT * t2 * p2[0] + t3 * p3[0],
    oneMinusT3 * p0[1] + 3 * oneMinusT2 * t * p1[1] + 3 * oneMinusT * t2 * p2[1] + t3 * p3[1],
    oneMinusT3 * p0[2] + 3 * oneMinusT2 * t * p1[2] + 3 * oneMinusT * t2 * p2[2] + t3 * p3[2]
  ];
}

/**
 * Helper to evaluate the derivative of a cubic Bezier curve at parameter t
 */
function evaluateCubicBezierDerivative(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  t: number
): number[] {
  const oneMinusT = 1 - t;
  const oneMinusT2 = oneMinusT * oneMinusT;
  const t2 = t * t;

  return [
    3 * oneMinusT2 * (p1[0] - p0[0]) + 6 * oneMinusT * t * (p2[0] - p1[0]) + 3 * t2 * (p3[0] - p2[0]),
    3 * oneMinusT2 * (p1[1] - p0[1]) + 6 * oneMinusT * t * (p2[1] - p1[1]) + 3 * t2 * (p3[1] - p2[1]),
    3 * oneMinusT2 * (p1[2] - p0[2]) + 6 * oneMinusT * t * (p2[2] - p1[2]) + 3 * t2 * (p3[2] - p2[2])
  ];
}

export class MoveAlongPath extends Animation {
  /** The path to follow */
  readonly path: VMobject;

  /** Whether to orient tangent to the path */
  readonly rotateAlongPath: boolean;

  /** Path points (Bezier control points) */
  private _pathPoints: number[][] = [];

  /** Number of curve segments */
  private _numSegments: number = 0;

  /** Initial rotation */
  private _initialRotation: THREE.Euler = new THREE.Euler();

  /** Offset from mobject.position to mobject.getCenter() (accounts for geometry offset, e.g. Dot) */
  private _centerOffset: number[] = [0, 0, 0];

  constructor(mobject: Mobject, options: MoveAlongPathOptions) {
    super(mobject, options);
    this.path = options.path;
    this.rotateAlongPath = options.rotateAlongPath ?? false;
  }

  /**
   * Set up the animation - compute path data
   */
  override begin(): void {
    super.begin();

    // Get path points
    this._pathPoints = this.path.getPoints();

    // Calculate number of cubic Bezier segments
    // Points are: anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...
    // Each segment uses 4 points, subsequent segments share anchors
    // So n points gives (n - 1) / 3 segments
    if (this._pathPoints.length >= 4) {
      this._numSegments = Math.floor((this._pathPoints.length - 1) / 3);
    } else {
      this._numSegments = 0;
    }

    // Store initial rotation
    this._initialRotation.copy(this.mobject.rotation);

    // Calculate offset between mobject's center and its position.
    // Mobjects like Dot have internal geometry offset from their position,
    // so getCenter() != position. We need this offset to correctly set position
    // such that the mobject's center lands on the path point.
    const center = this.mobject.getCenter();
    this._centerOffset = [
      center[0] - this.mobject.position.x,
      center[1] - this.mobject.position.y,
      center[2] - this.mobject.position.z,
    ];
  }

  /**
   * Get position and tangent at alpha (0 to 1) along the path
   */
  private _getPositionAndTangent(alpha: number): { position: number[]; tangent: number[] } {
    if (this._numSegments === 0 || this._pathPoints.length < 4) {
      // No valid path, stay at current position
      const pos = this.mobject.position;
      return {
        position: [pos.x, pos.y, pos.z],
        tangent: [1, 0, 0]
      };
    }

    // Clamp alpha
    alpha = Math.max(0, Math.min(1, alpha));

    // Map alpha to segment and local t
    const totalProgress = alpha * this._numSegments;
    const segmentIndex = Math.min(Math.floor(totalProgress), this._numSegments - 1);
    const localT = totalProgress - segmentIndex;

    // Get the 4 control points for this segment
    const baseIndex = segmentIndex * 3;
    const p0 = this._pathPoints[baseIndex];
    const p1 = this._pathPoints[baseIndex + 1];
    const p2 = this._pathPoints[baseIndex + 2];
    const p3 = this._pathPoints[baseIndex + 3];

    const position = evaluateCubicBezier(p0, p1, p2, p3, localT);
    const tangent = evaluateCubicBezierDerivative(p0, p1, p2, p3, localT);

    return { position, tangent };
  }

  /**
   * Interpolate the position (and optionally rotation) at the given alpha
   */
  interpolate(alpha: number): void {
    const { position, tangent } = this._getPositionAndTangent(alpha);

    // Set position, compensating for the mobject's internal center offset.
    // For a Dot, getCenter() = _point + position, so we need
    // position = desired_point - _point = desired_point - centerOffset.
    this.mobject.position.set(
      position[0] - this._centerOffset[0],
      position[1] - this._centerOffset[1],
      position[2] - this._centerOffset[2],
    );

    // Optionally set rotation to tangent direction
    if (this.rotateAlongPath) {
      const tangentVec = new THREE.Vector3(tangent[0], tangent[1], tangent[2]);
      const length = tangentVec.length();

      if (length > 0.0001) {
        tangentVec.normalize();

        // Calculate rotation to align with tangent
        // We'll rotate around Z axis for 2D paths, or use full 3D rotation
        const angle = Math.atan2(tangentVec.y, tangentVec.x);
        this.mobject.rotation.set(0, 0, angle);
      }
    }

    this.mobject._markDirty();
  }

  /**
   * Ensure the position is exact at the end
   */
  override finish(): void {
    this.interpolate(1);
    super.finish();
  }
}

/**
 * Create a MoveAlongPath animation for a mobject.
 * @param mobject The mobject to move along the path
 * @param path The VMobject path to follow
 * @param options Animation options (duration, rateFunc, rotateAlongPath)
 */
export function moveAlongPath(
  mobject: Mobject,
  path: VMobject,
  options?: Omit<MoveAlongPathOptions, 'path'>
): MoveAlongPath {
  return new MoveAlongPath(mobject, { ...options, path });
}
