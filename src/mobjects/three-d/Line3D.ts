import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a Line3D
 */
export interface Line3DOptions {
  /** Start point [x, y, z]. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point [x, y, z]. Required */
  end: Vector3Tuple;
  /** Color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Line width in pixels. Default: 2 */
  lineWidth?: number;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
}

/**
 * Line3D - A 3D line segment
 *
 * Creates a line segment between two 3D points using Three.js Line.
 * Note: Due to WebGL limitations, line width may not work on all platforms.
 *
 * @example
 * ```typescript
 * // Create a line from origin to (1, 1, 1)
 * const line = new Line3D({ end: [1, 1, 1] });
 *
 * // Create a line between two points
 * const line2 = new Line3D({
 *   start: [-1, 0, 0],
 *   end: [1, 0, 0],
 *   color: '#ff0000'
 * });
 * ```
 */
export class Line3D extends Mobject {
  protected _start: Vector3Tuple;
  protected _end: Vector3Tuple;
  protected _lineWidth: number;

  constructor(options: Line3DOptions) {
    super();

    const {
      start = [0, 0, 0],
      end,
      color = '#ffffff',
      lineWidth = 2,
      opacity = 1,
    } = options;

    this._start = [...start];
    this._end = [...end];
    this._lineWidth = lineWidth;

    this.color = color;
    this._opacity = opacity;
    this.strokeWidth = lineWidth;
  }

  /**
   * Create the Three.js line object
   */
  protected _createThreeObject(): THREE.Object3D {
    const geometry = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(this._start[0], this._start[1], this._start[2]),
      new THREE.Vector3(this._end[0], this._end[1], this._end[2]),
    ];
    geometry.setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: this.color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      linewidth: this._lineWidth, // Note: may not work on all platforms
    });

    return new THREE.Line(geometry, material);
  }

  /**
   * Sync material properties to Three.js object
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject instanceof THREE.Line) {
      const material = this._threeObject.material as THREE.LineBasicMaterial;
      if (material) {
        material.color.set(this.color);
        material.opacity = this._opacity;
        material.transparent = this._opacity < 1;
        material.linewidth = this._lineWidth;
        material.needsUpdate = true;
      }
    }
  }

  /**
   * Update the geometry with current points
   */
  protected _updateGeometry(): void {
    if (this._threeObject instanceof THREE.Line) {
      const geometry = this._threeObject.geometry as THREE.BufferGeometry;
      const points = [
        new THREE.Vector3(this._start[0], this._start[1], this._start[2]),
        new THREE.Vector3(this._end[0], this._end[1], this._end[2]),
      ];
      geometry.setFromPoints(points);
      geometry.attributes.position.needsUpdate = true;
    }
    this._markDirty();
  }

  /**
   * Get the start point
   */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /**
   * Set the start point
   */
  setStart(point: Vector3Tuple): this {
    this._start = [...point];
    this._updateGeometry();
    return this;
  }

  /**
   * Get the end point
   */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /**
   * Set the end point
   */
  setEnd(point: Vector3Tuple): this {
    this._end = [...point];
    this._updateGeometry();
    return this;
  }

  /**
   * Get the line width
   */
  getLineWidth(): number {
    return this._lineWidth;
  }

  /**
   * Set the line width
   */
  setLineWidth(width: number): this {
    this._lineWidth = width;
    this.strokeWidth = width;
    this._markDirty();
    return this;
  }

  /**
   * Get the length of the line
   */
  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get the direction vector (normalized)
   */
  getDirection(): Vector3Tuple {
    const length = this.getLength();
    if (length === 0) {
      return [1, 0, 0];
    }
    return [
      (this._end[0] - this._start[0]) / length,
      (this._end[1] - this._start[1]) / length,
      (this._end[2] - this._start[2]) / length,
    ];
  }

  /**
   * Get the midpoint of the line
   */
  getMidpoint(): Vector3Tuple {
    return [
      (this._start[0] + this._end[0]) / 2,
      (this._start[1] + this._end[1]) / 2,
      (this._start[2] + this._end[2]) / 2,
    ];
  }

  /**
   * Get a point along the line at parameter t (0 = start, 1 = end)
   */
  pointAtParameter(t: number): Vector3Tuple {
    return [
      this._start[0] + t * (this._end[0] - this._start[0]),
      this._start[1] + t * (this._end[1] - this._start[1]),
      this._start[2] + t * (this._end[2] - this._start[2]),
    ];
  }

  /**
   * Create a copy of this Line3D
   */
  protected override _createCopy(): Line3D {
    return new Line3D({
      start: this._start,
      end: this._end,
      color: this.color,
      lineWidth: this._lineWidth,
      opacity: this._opacity,
    });
  }
}

export default Line3D;
