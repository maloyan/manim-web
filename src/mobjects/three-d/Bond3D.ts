import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { meshMaterial } from '../../core/threeMaterial';
import { Mobject3D } from './Mobject3D';
import { orientMeshAlong } from './meshOrient';

/**
 * Options for creating a Bond3D.
 */
export interface Bond3DOptions {
  /** Start point [x, y, z]. */
  start: Vector3Tuple;
  /** End point [x, y, z]. */
  end: Vector3Tuple;
  /** Cylinder radius. Default: 0.08 */
  radius?: number;
  /** Color as a CSS color string. Default: '#cccccc' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Number of radial segments. Default: 16 */
  radialSegments?: number;
  /** Split the bond into two half-length segments. Default: false */
  split?: boolean;
  /** Color of the end half when split. Default: the base color. */
  endColor?: string;
}

/**
 * Bond3D - a 3D chemical bond drawn as an oriented cylinder from start to end.
 *
 * The cylinder is centered at the midpoint of start->end and oriented along
 * that direction with {@link orientMeshAlong}. When `split` is true the bond is
 * drawn as two half-length cylinders meeting at the midpoint: the half nearer
 * `start` uses `color`, the half nearer `end` uses `endColor` (or `color` when
 * `endColor` is absent). This lets a bond show each atom's color.
 *
 * @example
 * ```typescript
 * // A single gray bond.
 * const bond = new Bond3D({ start: [0, 0, 0], end: [1.5, 0, 0] });
 *
 * // A two-tone bond (carbon gray to oxygen red).
 * const co = new Bond3D({
 *   start: [0, 0, 0],
 *   end: [1.2, 0, 0],
 *   split: true,
 *   color: '#909090',
 *   endColor: '#ff0d0d',
 * });
 * ```
 */
export class Bond3D extends Mobject3D {
  private _start: Vector3Tuple;
  private _end: Vector3Tuple;
  private _radius: number;
  private _radialSegments: number;
  private _split: boolean;
  private _endColor?: string;

  constructor(options: Bond3DOptions) {
    super();

    const {
      start,
      end,
      radius = 0.08,
      color = '#cccccc',
      opacity = 1,
      radialSegments = 16,
      split = false,
      endColor,
    } = options;

    this._start = [...start];
    this._end = [...end];
    this._radius = radius;
    this._radialSegments = radialSegments;
    this._split = split;
    this._endColor = endColor;

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;
  }

  /**
   * Create the Three.js group (one cylinder, or two half-cylinders when split).
   */
  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    const dir = new THREE.Vector3(
      this._end[0] - this._start[0],
      this._end[1] - this._start[1],
      this._end[2] - this._start[2],
    );
    const length = dir.length();
    if (length === 0) {
      // A zero-length bond has no geometry to build.
      return group;
    }
    dir.divideScalar(length);

    if (!this._split) {
      group.add(this._makeSegment(this._start, this._end, this.color, false));
      return group;
    }

    // Split: two half-length cylinders meeting at the midpoint.
    const mid: Vector3Tuple = [
      (this._start[0] + this._end[0]) / 2,
      (this._start[1] + this._end[1]) / 2,
      (this._start[2] + this._end[2]) / 2,
    ];
    const endColor = this._endColor ?? this.color;
    group.add(this._makeSegment(this._start, mid, this.color, true));
    group.add(this._makeSegment(mid, this._end, endColor, true));
    return group;
  }

  /**
   * Build one cylinder segment between two points.
   *
   * @param from - The segment start [x, y, z].
   * @param to - The segment end [x, y, z].
   * @param color - The segment color.
   * @param bakeColor - When true, store the color so a material sync keeps it
   *   (used for split halves so each keeps its own color).
   * @returns The segment mesh.
   */
  private _makeSegment(
    from: Vector3Tuple,
    to: Vector3Tuple,
    color: string,
    bakeColor: boolean,
  ): THREE.Mesh {
    const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    const length = dir.length();

    const geometry = new THREE.CylinderGeometry(
      this._radius,
      this._radius,
      length,
      this._radialSegments,
    );
    const material = new THREE.MeshStandardMaterial({
      color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2);
    orientMeshAlong(mesh, dir);
    if (bakeColor) {
      mesh.userData.bondColor = color;
    }
    return mesh;
  }

  /**
   * Sync material color and opacity to the Three.js meshes.
   *
   * Split halves keep their baked `userData.bondColor`; a single bond follows
   * the mobject's `color`.
   */
  protected override _syncMaterialToThree(): void {
    const obj = this._threeObject;
    if (!(obj instanceof THREE.Group)) {
      return;
    }
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = meshMaterial<THREE.MeshStandardMaterial>(child);
        const baked = child.userData.bondColor as string | undefined;
        material.color.set(baked ?? this.color);
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        material.needsUpdate = true;
      }
    });
  }

  /**
   * Get the start point.
   */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /**
   * Get the end point.
   */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /**
   * Get the bond length (|end - start|).
   */
  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get the bond radius.
   */
  getRadius(): number {
    return this._radius;
  }

  override copy(): Bond3D {
    const copy = new Bond3D({
      start: this._start,
      end: this._end,
      radius: this._radius,
      color: this.color,
      opacity: this._opacity,
      radialSegments: this._radialSegments,
      split: this._split,
      endColor: this._endColor,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
