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
 * GrowArrow animation - interpolate arrow from a start-growth state to end state.
 */
export class GrowArrow extends Animation {
  private _start = new THREE.Vector3();
  private _endShaftPos = new THREE.Vector3();
  private _endTipPos = new THREE.Vector3();
  private _endShaftScale = new THREE.Vector3();
  private _endTipScale = new THREE.Vector3();
  private _shaftCenterOffset = new THREE.Vector3();
  private _tipCenterOffset = new THREE.Vector3();

  constructor(mobject: Arrow, options: GrowArrowOptions = {}) {
    super(mobject, options);
  }

  override begin(): void {
    super.begin();

    const arrow = this.mobject as Arrow;
    const shaft = arrow.children[0];
    const tip = arrow.children[1];
    if (!shaft || !tip) throw new Error('GrowArrow requires Arrow to have shaft and tip children');

    const [sx, sy, sz] = arrow.getStart();
    this._start.set(sx, sy, sz);
    this._endShaftPos.copy(shaft.position);
    this._endTipPos.copy(tip.position);
    this._endShaftScale.copy(shaft.scaleVector);
    this._endTipScale.copy(tip.scaleVector);

    {
      const c = shaft.getCenter();
      this._shaftCenterOffset.set(c[0] - sx, c[1] - sy, c[2] - sz);
    }
    {
      const c = tip.getCenter();
      this._tipCenterOffset.set(c[0] - sx, c[1] - sy, c[2] - sz);
    }

    this.interpolate(0);
  }

  interpolate(alpha: number): void {
    const arrow = this.mobject as Arrow;
    const shaft = arrow.children[0];
    const tip = arrow.children[1];
    if (!shaft || !tip) throw new Error('GrowArrow requires Arrow to have shaft and tip children');

    const s = Math.max(0.001, alpha);

    shaft.scaleVector.set(
      this._endShaftScale.x * s,
      this._endShaftScale.y * s,
      this._endShaftScale.z * s,
    );
    tip.scaleVector.set(this._endTipScale.x * s, this._endTipScale.y * s, this._endTipScale.z * s);

    const desiredShaftCenter: [number, number, number] = [
      this._start.x + this._shaftCenterOffset.x * alpha,
      this._start.y + this._shaftCenterOffset.y * alpha,
      this._start.z + this._shaftCenterOffset.z * alpha,
    ];
    const shaftCenter = shaft.getCenter();
    shaft.shift([
      desiredShaftCenter[0] - shaftCenter[0],
      desiredShaftCenter[1] - shaftCenter[1],
      desiredShaftCenter[2] - shaftCenter[2],
    ]);

    const desiredTipCenter: [number, number, number] = [
      this._start.x + this._tipCenterOffset.x * alpha,
      this._start.y + this._tipCenterOffset.y * alpha,
      this._start.z + this._tipCenterOffset.z * alpha,
    ];
    const tipCenter = tip.getCenter();
    tip.shift([
      desiredTipCenter[0] - tipCenter[0],
      desiredTipCenter[1] - tipCenter[1],
      desiredTipCenter[2] - tipCenter[2],
    ]);

    shaft._markDirty();
    tip._markDirty();
    this.mobject._markDirty();
  }

  override finish(): void {
    const arrow = this.mobject as Arrow;
    const shaft = arrow.children[0];
    const tip = arrow.children[1];
    if (!shaft || !tip) throw new Error('GrowArrow requires Arrow to have shaft and tip children');

    shaft.position.copy(this._endShaftPos);
    tip.position.copy(this._endTipPos);
    shaft.scaleVector.copy(this._endShaftScale);
    tip.scaleVector.copy(this._endTipScale);

    shaft._markDirty();
    tip._markDirty();
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
