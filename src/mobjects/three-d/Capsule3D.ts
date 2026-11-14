import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import {
  MeshBuilder,
  OrganicMesh3D,
  requireFinitePoints,
  requireNumber,
  sweepCappedTube,
  type OrganicMeshOptions,
} from './organicMesh';

/**
 * Options for creating a Capsule3D.
 */
export interface Capsule3DOptions extends OrganicMeshOptions {
  /** Radius of the rod and of its round ends. Default: 0.25 */
  radius?: number;
  /** Length of the spine between the two end centres (caps add `radius` each side). Default: 1 */
  length?: number;
  /**
   * Bend angle in radians. The spine follows a circular arc that turns by this
   * angle from one end to the other. Default bend plane: the spine curves
   * toward +X (for the default +Z direction, toward the +X side). Default: 0 (straight)
   */
  bend?: number;
  /** Direction of the spine (Manim's up axis, +Z, by default). Default: [0, 0, 1] */
  direction?: Vector3Tuple;
  /** Segments around the rod. Default: 24 */
  radialSegments?: number;
  /** Segments along the spine. Default: 16 (1 when straight) */
  lengthSegments?: number;
  /** Latitude rings in each round end. Default: 8 */
  capSegments?: number;
}

/**
 * Capsule3D - a rod with round ends, optionally bent along an arc.
 *
 * The mesh is closed (watertight) and its normals are the exact tube and
 * hemisphere normals, so it shades smoothly everywhere. Use it for rods,
 * bacteria, mitochondria (bent), and centriole tubes.
 *
 * Build-up order: the `reveal` attribute is the arc-length fraction along the
 * spine (0 at the start pole, 1 at the end pole) and the triangles are sorted
 * by it, so `geometry.setDrawRange(0, k)` grows the rod from start to end.
 *
 * @example
 * ```typescript
 * const rod = new Capsule3D({ radius: 0.3, length: 1.5, color: '#e0603a' });
 * const bean = new Capsule3D({ radius: 0.3, length: 1.2, bend: Math.PI / 3 });
 * ```
 */
export class Capsule3D extends OrganicMesh3D {
  private _radius: number;
  private _length: number;
  private _bend: number;
  private _direction: Vector3Tuple;
  private _radialSegments: number;
  private _lengthSegments: number | undefined;
  private _capSegments: number;

  constructor(options: Capsule3DOptions = {}) {
    super(options, '#FC6255');
    const {
      radius = 0.25,
      length = 1,
      bend = 0,
      direction = [0, 0, 1],
      radialSegments = 24,
      lengthSegments,
      capSegments = 8,
    } = options;
    requireNumber('Capsule3D', 'radius', radius, 0);
    requireNumber('Capsule3D', 'length', length, 0);
    requireNumber('Capsule3D', 'bend', bend);
    requireFinitePoints('Capsule3D', 'direction', [direction]);
    this._radius = radius;
    this._length = Math.max(1e-6, length);
    this._bend = bend;
    this._direction = [...direction];
    this._radialSegments = Math.max(3, radialSegments);
    this._lengthSegments = lengthSegments;
    this._capSegments = Math.max(1, capSegments);
  }

  /** Spine points in local coordinates (before the direction rotation). */
  private _spine(): Vector3Tuple[] {
    const straight = Math.abs(this._bend) < 1e-6;
    const segments = Math.max(1, this._lengthSegments ?? (straight ? 1 : 16));
    const points: Vector3Tuple[] = [];
    const curvatureRadius = straight ? 0 : this._length / this._bend;
    // Centre the arc's chord sag around x = 0.
    const sag = straight ? 0 : curvatureRadius * (1 - Math.cos(this._bend / 2));
    for (let i = 0; i <= segments; i++) {
      const s = i / segments - 0.5;
      if (straight) {
        points.push([0, s * this._length, 0]);
      } else {
        const a = s * this._bend;
        points.push([
          curvatureRadius * (1 - Math.cos(a)) - sag / 2,
          curvatureRadius * Math.sin(a),
          0,
        ]);
      }
    }
    return points;
  }

  protected _buildGeometry(): THREE.BufferGeometry {
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(...this._direction).normalize(),
    );
    const v = new THREE.Vector3();
    const spine = this._spine().map((p): Vector3Tuple => {
      v.set(p[0], p[1], p[2]).applyQuaternion(q);
      return [v.x, v.y, v.z];
    });
    const builder = new MeshBuilder();
    sweepCappedTube(builder, spine, this._radius, this._radialSegments, this._capSegments);
    return builder.build();
  }

  /** The rod radius. */
  getRadius(): number {
    return this._radius;
  }

  /** The spine length between the two end centres. */
  getLength(): number {
    return this._length;
  }

  /** The bend angle in radians. */
  getBend(): number {
    return this._bend;
  }

  /** Set the bend angle in radians and rebuild the mesh. */
  setBend(value: number): this {
    this._bend = value;
    this._rebuild();
    return this;
  }

  override copy(): Capsule3D {
    const copy = new Capsule3D({
      radius: this._radius,
      length: this._length,
      bend: this._bend,
      direction: this._direction,
      radialSegments: this._radialSegments,
      lengthSegments: this._lengthSegments,
      capSegments: this._capSegments,
      color: this.color,
      opacity: this._opacity,
      center: this._centerPoint,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
