/**
 * Point-based mobjects rendered as particles using THREE.js Points.
 * Unlike VMobjects which render connected paths, PMobjects render
 * discrete points as particles for efficient visualization.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';

/**
 * A single point with position, color, and opacity.
 */
export interface PointData {
  /** Position [x, y, z] */
  position: Vector3Tuple;
  /** Color as CSS color string */
  color?: string;
  /** Opacity from 0 to 1 */
  opacity?: number;
}

/**
 * Options for creating a PMobject
 */
export interface PMobjectOptions {
  /** Initial points to add */
  points?: PointData[];
  /** Default color for points. Default: white (#FFFFFF) */
  color?: string;
  /** Default opacity for points. Default: 1 */
  opacity?: number;
  /** Size of each point in pixels. Default: 10 */
  pointSize?: number;
}

/**
 * PMobject - Point-based mobject (not vector-based like VMobject)
 *
 * A collection of points rendered as particles using THREE.js Points
 * and PointsMaterial. Each point has position, color, and opacity.
 * Points are not connected like VMobject paths.
 *
 * @example
 * ```typescript
 * // Create a PMobject with some points
 * const points = new PMobject({
 *   points: [
 *     { position: [0, 0, 0] },
 *     { position: [1, 0, 0], color: '#ff0000' },
 *     { position: [0, 1, 0], color: '#00ff00', opacity: 0.5 },
 *   ],
 *   pointSize: 15,
 * });
 * ```
 */
export class PMobject extends Mobject {
  /** Internal point data storage */
  protected _points: PointData[] = [];

  /** Point size in pixels */
  protected _pointSize: number = 10;

  /** THREE.js geometry for points */
  protected _geometry: THREE.BufferGeometry | null = null;

  /** THREE.js material for points */
  protected _material: THREE.PointsMaterial | null = null;

  constructor(options: PMobjectOptions = {}) {
    super();

    const { points = [], color = WHITE, opacity = 1, pointSize = 10 } = options;

    this.color = color;
    this._opacity = opacity;
    this._pointSize = pointSize;

    // Add initial points
    for (const point of points) {
      this.addPoint(point);
    }
  }

  /**
   * Add a single point to the mobject
   * @param point - Point data with position and optional color/opacity
   * @returns this for chaining
   */
  addPoint(point: PointData): this {
    this._points.push({
      position: [...point.position],
      color: point.color ?? this.color,
      opacity: point.opacity ?? this._opacity,
    });
    this._markDirty();
    return this;
  }

  /**
   * Add multiple points to the mobject
   * @param points - Array of point data
   * @returns this for chaining
   */
  addPoints(points: PointData[]): this {
    for (const point of points) {
      this.addPoint(point);
    }
    return this;
  }

  /**
   * Remove a point by index
   * @param index - Index of point to remove
   * @returns this for chaining
   */
  removePoint(index: number): this {
    if (index >= 0 && index < this._points.length) {
      this._points.splice(index, 1);
      this._markDirty();
    }
    return this;
  }

  /**
   * Clear all points
   * @returns this for chaining
   */
  clearPoints(): this {
    this._points = [];
    this._markDirty();
    return this;
  }

  /**
   * Get all points
   * @returns Copy of the points array
   */
  getPoints(): PointData[] {
    return this._points.map((p) => ({
      position: [...p.position] as Vector3Tuple,
      color: p.color,
      opacity: p.opacity,
    }));
  }

  /**
   * Get the number of points
   */
  get numPoints(): number {
    return this._points.length;
  }

  /**
   * Set the point size
   * @param size - Size in pixels
   * @returns this for chaining
   */
  setPointSize(size: number): this {
    this._pointSize = Math.max(1, size);
    this._markDirty();
    return this;
  }

  /**
   * Get the point size
   */
  getPointSize(): number {
    return this._pointSize;
  }

  /**
   * Set the color of all points
   * @param color - CSS color string
   * @returns this for chaining
   */
  override setColor(color: string): this {
    super.setColor(color);
    for (const point of this._points) {
      point.color = color;
    }
    return this;
  }

  /**
   * Set the opacity of all points
   * @param opacity - Opacity value (0-1)
   * @returns this for chaining
   */
  override setStrokeOpacity(opacity: number): this {
    super.setStrokeOpacity(opacity);
    for (const point of this._points) {
      point.opacity = opacity;
    }
    return this;
  }

  /**
   * Get the center of all points
   * @returns Center position as [x, y, z]
   */
  override getCenter(): Vector3Tuple {
    if (this._points.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    let sumX = 0,
      sumY = 0,
      sumZ = 0;
    for (const point of this._points) {
      sumX += point.position[0];
      sumY += point.position[1];
      sumZ += point.position[2];
    }

    const count = this._points.length;
    return [
      this.position.x + sumX / count,
      this.position.y + sumY / count,
      this.position.z + sumZ / count,
    ];
  }

  /**
   * Shift all points by a delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    super.shift(delta);
    for (const point of this._points) {
      point.position[0] += delta[0];
      point.position[1] += delta[1];
      point.position[2] += delta[2];
    }
    return this;
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    this._updateGeometry();
    this._updateMaterial();

    const points = new THREE.Points(this._geometry!, this._material!);
    return points;
  }

  /**
   * Update or create the geometry from points
   */
  protected _updateGeometry(): void {
    const positions: number[] = [];
    const colors: number[] = [];

    const tempColor = new THREE.Color();

    for (const point of this._points) {
      positions.push(point.position[0], point.position[1], point.position[2]);

      // Parse color
      tempColor.set(point.color ?? this.color);
      colors.push(tempColor.r, tempColor.g, tempColor.b);
    }

    if (!this._geometry) {
      this._geometry = new THREE.BufferGeometry();
    }

    this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this._geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  /**
   * Update or create the material
   */
  protected _updateMaterial(): void {
    if (!this._material) {
      this._material = new THREE.PointsMaterial({
        size: this._pointSize,
        vertexColors: true,
        transparent: true,
        opacity: this._opacity,
        sizeAttenuation: false, // Points stay same size regardless of distance
      });
    } else {
      this._material.size = this._pointSize;
      this._material.opacity = this._opacity;
      this._material.needsUpdate = true;
    }
  }

  /**
   * Sync material properties to Three.js
   */
  protected override _syncMaterialToThree(): void {
    this._updateGeometry();
    this._updateMaterial();

    if (this._threeObject instanceof THREE.Points) {
      this._threeObject.geometry = this._geometry!;
      this._threeObject.material = this._material!;
    }
  }

  /**
   * Create a copy of this PMobject
   */
  protected override _createCopy(): PMobject {
    return new PMobject({
      points: this.getPoints(),
      color: this.color,
      opacity: this._opacity,
      pointSize: this._pointSize,
    });
  }

  /**
   * Clean up Three.js resources
   */
  override dispose(): void {
    super.dispose();
    this._geometry?.dispose();
    this._material?.dispose();
  }
}
