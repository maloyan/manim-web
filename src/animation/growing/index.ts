/**
 * Growing animations - animations that grow mobjects from specific points/edges.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { Arrow } from '../../mobjects/geometry/Arrow';

// Re-export GrowFromCenter from Scale module
export { GrowFromCenter, growFromCenter, type GrowFromCenterOptions } from '../movement/Scale';

/**
 * GrowArrow options
 */
export type GrowArrowOptions = AnimationOptions;

/**
 * GrowArrow animation - grows an arrow from its start point.
 * The arrow extends from start toward end, with the tip growing proportionally.
 */
export class GrowArrow extends Animation {
  private _startPoint = new THREE.Vector3();
  private _parts: {
    m: Mobject;
    pos: THREE.Vector3;
    scale: THREE.Vector3;
    // A stable local point used to pin each child during growth.
    // shaft: first point, tip: apex point.
    // We animate this anchor from arrow start -> original anchor world.
    anchorLocal: THREE.Vector3;
  }[] = [];

  constructor(mobject: Arrow, options: GrowArrowOptions = {}) {
    super(mobject, options);
  }

  /**
   * Pick one meaningful local anchor per arrow child.
   * Why this exists:
   * - Scaling around each child's local origin alone makes tip/shaft drift apart.
   * - We instead keep a semantic anchor (shaft-start or tip-apex) constrained.
   * - Given anchorLocal, scale, and position we can solve world anchor exactly:
   *     anchorWorld = anchorLocal * scale + position
   *   and invert it to place the child at any animation alpha.
   */
  private _getAnchorLocal(child: Mobject, index: number): THREE.Vector3 {
    const pts = (child as unknown as { getPoints?: () => number[][] }).getPoints?.() ?? [];
    if (pts.length === 0) return new THREE.Vector3();
    const i = index === 0 ? 0 : Math.min(3, pts.length - 1); // shaft start, tip apex
    return new THREE.Vector3(pts[i][0], pts[i][1], pts[i][2]);
  }

  override begin(): void {
    super.begin();

    const arrow = this.mobject as Arrow;
    const shaft = arrow.children[0] as unknown as {
      getPoints?: () => number[][];
      position: THREE.Vector3;
    };
    const shaftStart = shaft?.getPoints?.()?.[0] ?? arrow.getStart();
    this._startPoint.set(
      shaftStart[0] + (shaft?.position?.x ?? 0),
      shaftStart[1] + (shaft?.position?.y ?? 0),
      shaftStart[2] + (shaft?.position?.z ?? 0),
    );

    this._parts = arrow.children.map((m, i) => ({
      m,
      pos: m.position.clone(),
      scale: m.scaleVector.clone(),
      anchorLocal: this._getAnchorLocal(m, i),
    }));

    this.interpolate(0);
  }

  interpolate(alpha: number): void {
    const s = Math.max(0.001, alpha);
    for (const p of this._parts) {
      const sx = p.scale.x * s;
      const sy = p.scale.y * s;
      const sz = p.scale.z * s;
      p.m.scaleVector.set(sx, sy, sz);

      const targetAx = p.anchorLocal.x * p.scale.x + p.pos.x;
      const targetAy = p.anchorLocal.y * p.scale.y + p.pos.y;
      const targetAz = p.anchorLocal.z * p.scale.z + p.pos.z;
      const ax = this._startPoint.x + (targetAx - this._startPoint.x) * alpha;
      const ay = this._startPoint.y + (targetAy - this._startPoint.y) * alpha;
      const az = this._startPoint.z + (targetAz - this._startPoint.z) * alpha;
      p.m.position.set(
        ax - p.anchorLocal.x * sx,
        ay - p.anchorLocal.y * sy,
        az - p.anchorLocal.z * sz,
      );
      p.m._markDirty();
    }
    this.mobject._markDirty();
  }

  override finish(): void {
    for (const p of this._parts) {
      p.m.position.copy(p.pos);
      p.m.scaleVector.copy(p.scale);
      p.m._markDirty();
    }
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a GrowArrow animation.
 */
export function growArrow(mobject: Arrow, options?: GrowArrowOptions): GrowArrow {
  return new GrowArrow(mobject, options);
}

/**
 * GrowFromEdge options
 */
export interface GrowFromEdgeOptions extends AnimationOptions {
  /** Edge to grow from (UP, DOWN, LEFT, RIGHT) */
  edge: Vector3Tuple;
}

/**
 * GrowFromEdge animation - grows a mobject from a specific edge.
 */
export class GrowFromEdge extends Animation {
  readonly edge: Vector3Tuple;

  private _targetScale: THREE.Vector3 = new THREE.Vector3();
  private _targetPosition: THREE.Vector3 = new THREE.Vector3();
  private _edgePoint: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: GrowFromEdgeOptions) {
    super(mobject, options);
    this.edge = options.edge;
  }

  override begin(): void {
    super.begin();

    // Store target state
    this._targetScale.copy(this.mobject.scaleVector);
    this._targetPosition.copy(this.mobject.position);

    // Get the edge point
    const bounds = this.mobject.getBounds();
    const edge = this.edge;

    // Calculate edge point based on direction
    this._edgePoint.set(
      edge[0] > 0 ? bounds.max.x : edge[0] < 0 ? bounds.min.x : (bounds.min.x + bounds.max.x) / 2,
      edge[1] > 0 ? bounds.max.y : edge[1] < 0 ? bounds.min.y : (bounds.min.y + bounds.max.y) / 2,
      edge[2] > 0 ? bounds.max.z : edge[2] < 0 ? bounds.min.z : (bounds.min.z + bounds.max.z) / 2,
    );

    // Start at scale 0
    this.mobject.scaleVector.set(0.001, 0.001, 0.001);
  }

  interpolate(alpha: number): void {
    // Scale from 0 to target
    const scale = Math.max(0.001, alpha);
    this.mobject.scaleVector.set(
      this._targetScale.x * scale,
      this._targetScale.y * scale,
      this._targetScale.z * scale,
    );

    // Position moves from edge point toward target
    this.mobject.position.set(
      this._edgePoint.x + (this._targetPosition.x - this._edgePoint.x) * alpha,
      this._edgePoint.y + (this._targetPosition.y - this._edgePoint.y) * alpha,
      this._edgePoint.z + (this._targetPosition.z - this._edgePoint.z) * alpha,
    );

    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.scaleVector.copy(this._targetScale);
    this.mobject.position.copy(this._targetPosition);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a GrowFromEdge animation.
 */
export function growFromEdge(
  mobject: Mobject,
  edge: Vector3Tuple,
  options?: Omit<GrowFromEdgeOptions, 'edge'>,
): GrowFromEdge {
  return new GrowFromEdge(mobject, { ...options, edge });
}

/**
 * GrowFromPoint options
 */
export interface GrowFromPointOptions extends AnimationOptions {
  /** Point to grow from */
  point: Vector3Tuple;
}

/**
 * GrowFromPoint animation - grows a mobject from a specific point.
 */
export class GrowFromPoint extends Animation {
  readonly point: Vector3Tuple;

  private _targetScale: THREE.Vector3 = new THREE.Vector3();
  private _targetPosition: THREE.Vector3 = new THREE.Vector3();
  private _growPoint: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: GrowFromPointOptions) {
    super(mobject, options);
    this.point = options.point;
  }

  override begin(): void {
    super.begin();

    // Store target state
    this._targetScale.copy(this.mobject.scaleVector);
    this._targetPosition.copy(this.mobject.position);
    this._growPoint.set(this.point[0], this.point[1], this.point[2]);

    // Start at scale 0 at the grow point
    this.mobject.scaleVector.set(0.001, 0.001, 0.001);
    this.mobject.position.copy(this._growPoint);
  }

  interpolate(alpha: number): void {
    // Scale from 0 to target
    const scale = Math.max(0.001, alpha);
    this.mobject.scaleVector.set(
      this._targetScale.x * scale,
      this._targetScale.y * scale,
      this._targetScale.z * scale,
    );

    // Position moves from grow point toward target
    this.mobject.position.set(
      this._growPoint.x + (this._targetPosition.x - this._growPoint.x) * alpha,
      this._growPoint.y + (this._targetPosition.y - this._growPoint.y) * alpha,
      this._growPoint.z + (this._targetPosition.z - this._growPoint.z) * alpha,
    );

    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.scaleVector.copy(this._targetScale);
    this.mobject.position.copy(this._targetPosition);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a GrowFromPoint animation.
 */
export function growFromPoint(
  mobject: Mobject,
  point: Vector3Tuple,
  options?: Omit<GrowFromPointOptions, 'point'>,
): GrowFromPoint {
  return new GrowFromPoint(mobject, { ...options, point });
}

/**
 * SpinInFromNothing options
 */
export interface SpinInFromNothingOptions extends AnimationOptions {
  /** Total rotation angle in radians (default: 2*PI) */
  angle?: number;
  /** Axis to rotate around (default: [0, 0, 1] for z-axis) */
  axis?: Vector3Tuple;
}

/**
 * SpinInFromNothing animation - spins in while scaling from 0.
 * Combines rotation with scale for a dramatic entrance effect.
 */
export class SpinInFromNothing extends Animation {
  readonly angle: number;
  readonly axis: Vector3Tuple;

  private _targetScale: THREE.Vector3 = new THREE.Vector3();
  private _initialRotation: THREE.Euler = new THREE.Euler();
  private _rotationAxis: THREE.Vector3 = new THREE.Vector3();

  constructor(mobject: Mobject, options: SpinInFromNothingOptions = {}) {
    super(mobject, options);
    this.angle = options.angle ?? Math.PI * 2;
    this.axis = options.axis ?? [0, 0, 1];
  }

  override begin(): void {
    super.begin();

    // Store target state
    this._targetScale.copy(this.mobject.scaleVector);
    this._initialRotation.copy(this.mobject.rotation);
    this._rotationAxis.set(this.axis[0], this.axis[1], this.axis[2]).normalize();

    // Start at scale 0
    this.mobject.scaleVector.set(0.001, 0.001, 0.001);
  }

  interpolate(alpha: number): void {
    // Scale from 0 to target
    const scale = Math.max(0.001, alpha);
    this.mobject.scaleVector.set(
      this._targetScale.x * scale,
      this._targetScale.y * scale,
      this._targetScale.z * scale,
    );

    // Rotate from -angle to 0 (so it ends at initial rotation)
    const currentAngle = this.angle * (1 - alpha);

    // Create rotation quaternion
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(this._rotationAxis, -currentAngle);

    // Apply to initial rotation
    const initialQuaternion = new THREE.Quaternion().setFromEuler(this._initialRotation);
    quaternion.multiply(initialQuaternion);

    this.mobject.rotation.setFromQuaternion(quaternion);
    this.mobject._markDirty();
  }

  override finish(): void {
    this.mobject.scaleVector.copy(this._targetScale);
    this.mobject.rotation.copy(this._initialRotation);
    this.mobject._markDirty();
    super.finish();
  }
}

/**
 * Create a SpinInFromNothing animation.
 */
export function spinInFromNothing(
  mobject: Mobject,
  options?: SpinInFromNothingOptions,
): SpinInFromNothing {
  return new SpinInFromNothing(mobject, options);
}
