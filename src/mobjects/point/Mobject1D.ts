import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';
import { PMobject } from './PMobject';

/**
 * Options for creating a Mobject1D
 */
export interface Mobject1DOptions {
  /** Start point [x, y, z]. Default: [-1, 0, 0] */
  start?: Vector3Tuple;
  /** End point [x, y, z]. Default: [1, 0, 0] */
  end?: Vector3Tuple;
  /** Number of points along the line. Default: 20 */
  numPoints?: number;
  /** Alternative to numPoints: density (points per unit length). Overrides numPoints if provided. */
  density?: number;
  /** Color as CSS color string. Default: white (#FFFFFF) */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Size of each point in pixels. Default: 6 */
  pointSize?: number;
}

/**
 * Mobject1D - 1D point distribution along a line
 *
 * Points are distributed along a line segment between start and end.
 * You can specify either a fixed number of points or a density
 * (points per unit length).
 *
 * @example
 * ```typescript
 * // Create a line of 10 points from origin to (2, 0, 0)
 * const line = new Mobject1D({
 *   start: [0, 0, 0],
 *   end: [2, 0, 0],
 *   numPoints: 10,
 * });
 *
 * // Create a line with density of 5 points per unit
 * const denseLine = new Mobject1D({
 *   start: [-1, -1, 0],
 *   end: [1, 1, 0],
 *   density: 5,
 *   color: '#00ff00',
 * });
 * ```
 */
export class Mobject1D extends PMobject {
  protected _start: Vector3Tuple;
  protected _end: Vector3Tuple;
  protected _numPointsConfig: number;
  protected _density?: number;

  constructor(options: Mobject1DOptions = {}) {
    const {
      start = [-1, 0, 0],
      end = [1, 0, 0],
      numPoints = 20,
      density,
      color = WHITE,
      opacity = 1,
      pointSize = 6,
    } = options;

    super({
      color,
      opacity,
      pointSize,
    });

    this._start = [...start];
    this._end = [...end];
    this._numPointsConfig = numPoints;
    this._density = density;

    this._generatePoints();
  }

  /**
   * Calculate the length of the line segment
   */
  getLength(): number {
    const dx = this._end[0] - this._start[0];
    const dy = this._end[1] - this._start[1];
    const dz = this._end[2] - this._start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get the actual number of points based on config or density
   */
  protected _getActualNumPoints(): number {
    if (this._density !== undefined) {
      const length = this.getLength();
      return Math.max(2, Math.round(length * this._density));
    }
    return this._numPointsConfig;
  }

  /**
   * Generate points along the line
   */
  protected _generatePoints(): void {
    this.clearPoints();

    const actualNumPoints = this._getActualNumPoints();
    if (actualNumPoints < 1) return;

    for (let i = 0; i < actualNumPoints; i++) {
      const t = actualNumPoints === 1 ? 0.5 : i / (actualNumPoints - 1);

      const x = this._start[0] + t * (this._end[0] - this._start[0]);
      const y = this._start[1] + t * (this._end[1] - this._start[1]);
      const z = this._start[2] + t * (this._end[2] - this._start[2]);

      this._points.push({
        position: [x, y, z],
        color: this.color,
        opacity: this._opacity,
      });
    }

    this._markDirty();
  }

  /**
   * Get the start point
   */
  getStart(): Vector3Tuple {
    return this._localToWorld(this._start);
  }

  /**
   * Get the end point
   */
  getEnd(): Vector3Tuple {
    return this._localToWorld(this._end);
  }

  /**
   * Set the start point and regenerate
   * @param start - New start point [x, y, z]
   * @returns this for chaining
   */
  setStart(start: Vector3Tuple): this {
    this._start = [...start];
    this._generatePoints();
    return this;
  }

  /**
   * Set the end point and regenerate
   * @param end - New end point [x, y, z]
   * @returns this for chaining
   */
  setEnd(end: Vector3Tuple): this {
    this._end = [...end];
    this._generatePoints();
    return this;
  }

  /**
   * Set both endpoints and regenerate
   * @param start - New start point [x, y, z]
   * @param end - New end point [x, y, z]
   * @returns this for chaining
   */
  setEndpoints(start: Vector3Tuple, end: Vector3Tuple): this {
    this._start = [...start];
    this._end = [...end];
    this._generatePoints();
    return this;
  }

  /**
   * Set the number of points and regenerate (clears density)
   * @param count - Number of points
   * @returns this for chaining
   */
  setNumPoints(count: number): this {
    this._numPointsConfig = Math.max(1, Math.round(count));
    this._density = undefined;
    this._generatePoints();
    return this;
  }

  /**
   * Set the density and regenerate (overrides numPoints)
   * @param density - Points per unit length
   * @returns this for chaining
   */
  setDensity(density: number): this {
    this._density = Math.max(0.1, density);
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the line segment
   */
  override getCenter(): Vector3Tuple {
    const local: Vector3Tuple = [
      (this._start[0] + this._end[0]) / 2,
      (this._start[1] + this._end[1]) / 2,
      (this._start[2] + this._end[2]) / 2,
    ];
    return this._localToWorld(local);
  }

  /**
   * Move the line to center at a new position
   * @param point - Target center position [x, y, z]
   */
  override moveTo(point: Vector3Tuple): this {
    const currentCenter = this.getCenter();
    const delta: Vector3Tuple = [
      point[0] - currentCenter[0],
      point[1] - currentCenter[1],
      point[2] - currentCenter[2],
    ];
    return this.shift(delta);
  }

  /**
   * Shift the line by a delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    return super.shift(delta);
  }

  /**
   * Regenerate the points
   * @returns this for chaining
   */
  regenerate(): this {
    this._generatePoints();
    return this;
  }

  override copy(): Mobject1D {
    const copy = new Mobject1D({
      start: [...this._start],
      end: [...this._end],
      numPoints: this._numPointsConfig,
      density: this._density,
      color: this.color,
      opacity: this._opacity,
      pointSize: this._pointSize,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
