import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a ConvexHull3D
 */
export interface ConvexHull3DOptions {
  /** 3D points to compute the convex hull from */
  points: Vector3Tuple[];
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Opacity from 0 to 1. Default: 0.8 */
  opacity?: number;
  /** Whether to render as wireframe. Default: false */
  wireframe?: boolean;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * ConvexHull3D - A 3D convex hull shape computed from arbitrary points
 *
 * Uses Three.js ConvexGeometry to compute and render the convex hull
 * of a set of 3D points.
 *
 * @example
 * ```typescript
 * const hull = new ConvexHull3D({
 *   points: [
 *     [1, 0, 0], [-1, 0, 0],
 *     [0, 1, 0], [0, -1, 0],
 *     [0, 0, 1], [0, 0, -1],
 *   ],
 *   color: '#00ff00',
 *   opacity: 0.5,
 * });
 * ```
 */
export class ConvexHull3D extends Mobject {
  private _points: Vector3Tuple[];
  private _wireframe: boolean;
  private _centerPoint: Vector3Tuple;

  constructor(options: ConvexHull3DOptions) {
    super();

    const {
      points,
      color = '#ffffff',
      opacity = 0.8,
      wireframe = false,
      center = [0, 0, 0],
    } = options;

    this._points = points.map((p) => [...p] as Vector3Tuple);
    this._wireframe = wireframe;
    this._centerPoint = [...center];

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Create the ConvexGeometry from the stored points
   */
  private _createGeometry(): THREE.BufferGeometry {
    const threePoints = this._points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    return new ConvexGeometry(threePoints);
  }

  /**
   * Create the Three.js mesh
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = this._createGeometry();

    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      wireframe: this._wireframe,
      side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Sync material properties to Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Mesh) {
      const material = this._threeObject.material as THREE.MeshStandardMaterial;
      if (material) {
        material.color.set(this.color);
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        material.wireframe = this._wireframe;
        material.needsUpdate = true;
      }
    }
  }

  /**
   * Get a copy of the hull points
   */
  getPoints3D(): Vector3Tuple[] {
    return this._points.map((p) => [...p] as Vector3Tuple);
  }

  /**
   * Replace the hull points and rebuild the geometry
   */
  setPoints3DData(points: Vector3Tuple[]): this {
    this._points = points.map((p) => [...p] as Vector3Tuple);
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry.dispose();
      this._threeObject.geometry = this._createGeometry();
    }
    this._markDirty();
    return this;
  }

  /**
   * Get whether wireframe mode is enabled
   */
  isWireframe(): boolean {
    return this._wireframe;
  }

  /**
   * Set wireframe mode
   */
  setWireframe(value: boolean): this {
    this._wireframe = value;
    this._markDirty();
    return this;
  }

  /**
   * Create a copy of this ConvexHull3D
   */
  protected override _createCopy(): ConvexHull3D {
    return new ConvexHull3D({
      points: this._points.map((p) => [...p] as Vector3Tuple),
      color: this.color,
      opacity: this._opacity,
      wireframe: this._wireframe,
      center: [...this._centerPoint],
    });
  }
}
