import * as THREE from 'three';
import { Vector3Tuple } from '../../core/Mobject';
import { Mobject3D } from './Mobject3D';

/**
 * Options for creating a TubeFromPoints.
 */
export interface TubeFromPointsOptions {
  /** Control points [x, y, z] the tube passes through. At least two. */
  points: Vector3Tuple[];
  /** Tube radius. Default: 0.1 */
  radius?: number;
  /** Color as a CSS color string. Default: '#cccccc' */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Close the curve into a loop. Default: false */
  closed?: boolean;
  /** Segments along the curve. Default: smoothing * (points.length - 1) */
  tubularSegments?: number;
  /** Segments around the cross-section. Default: 12 */
  radialSegments?: number;
  /** Segments per span used when tubularSegments is not given. Default: 6 */
  smoothing?: number;
}

/**
 * TubeFromPoints - a smooth 3D tube swept through a list of points.
 *
 * A Catmull-Rom curve is fit through the points and a circular cross-section is
 * swept along it with TubeGeometry. This is the backbone / ribbon primitive for
 * a later Protein module (a chain of residue positions becomes one smooth tube).
 *
 * @example
 * ```typescript
 * const tube = new TubeFromPoints({
 *   points: [[0, 0, 0], [1, 1, 0], [2, 0, 0], [3, 1, 0]],
 *   radius: 0.15,
 * });
 * tube.pointAt(0.5); // midpoint along the curve
 * ```
 */
export class TubeFromPoints extends Mobject3D {
  private _points: Vector3Tuple[];
  private _radius: number;
  private _closed: boolean;
  private _tubularSegments: number;
  private _radialSegments: number;
  private _smoothing: number;
  private _curve: THREE.CatmullRomCurve3;

  constructor(options: TubeFromPointsOptions) {
    super();

    const {
      points,
      radius = 0.1,
      color = '#cccccc',
      opacity = 1,
      closed = false,
      tubularSegments,
      radialSegments = 12,
      smoothing = 6,
    } = options;

    if (points.length < 2) {
      throw new Error(`TubeFromPoints requires at least two points, received ${points.length}.`);
    }

    this._points = points.map((p) => [...p] as Vector3Tuple);
    this._radius = radius;
    this._closed = closed;
    this._radialSegments = radialSegments;
    this._smoothing = smoothing;
    this._tubularSegments = tubularSegments ?? Math.max(1, smoothing * (points.length - 1));

    this._curve = new THREE.CatmullRomCurve3(
      this._points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      this._closed,
    );

    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;
  }

  /**
   * Create the Three.js tube mesh.
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.TubeGeometry(
      this._curve,
      this._tubularSegments,
      this._radius,
      this._radialSegments,
      this._closed,
    );
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Sync material color and opacity to the Three.js mesh.
   */
  protected override _syncMaterialToThree(): void {
    const material = this.getMeshMaterial<THREE.MeshStandardMaterial>();
    if (material) {
      material.color.set(this.color);
      material.opacity = this._opacity;
      material.transparent = this._opacity < 1;
      material.needsUpdate = true;
    }
  }

  /**
   * Get a copy of the control points.
   */
  getPoints(): Vector3Tuple[] {
    return this._points.map((p) => [...p] as Vector3Tuple);
  }

  /**
   * Get the tube radius.
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Get a point on the curve by arc-length fraction.
   *
   * @param t - Fraction from 0 (first point) to 1 (last point).
   * @returns The point [x, y, z] on the curve.
   */
  pointAt(t: number): Vector3Tuple {
    const p = this._curve.getPointAt(THREE.MathUtils.clamp(t, 0, 1));
    return [p.x, p.y, p.z];
  }

  override copy(): TubeFromPoints {
    const copy = new TubeFromPoints({
      points: this._points,
      radius: this._radius,
      color: this.color,
      opacity: this._opacity,
      closed: this._closed,
      tubularSegments: this._tubularSegments,
      radialSegments: this._radialSegments,
      smoothing: this._smoothing,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
