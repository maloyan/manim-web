import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { WHITE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a Line
 */
export interface LineOptions {
  /** Start point of the line. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** End point of the line. Default: [1, 0, 0] */
  end?: Vector3Tuple;
  /** Stroke color as CSS color string. Default: WHITE */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
}

/**
 * Line - A straight line segment VMobject
 *
 * Creates a simple line from a start point to an end point.
 *
 * @example
 * ```typescript
 * // Create a horizontal line
 * const line = new Line();
 *
 * // Create a diagonal line
 * const diagonal = new Line({
 *   start: [-1, -1, 0],
 *   end: [1, 1, 0],
 *   color: '#00ff00'
 * });
 * ```
 */
export class Line extends VMobject {
  private _start: Vector3Tuple;
  private _end: Vector3Tuple;

  constructor(options: LineOptions = {}) {
    super();

    const {
      start = [0, 0, 0],
      end = [1, 0, 0],
      color = WHITE,
      strokeWidth = 3,
    } = options;

    this._start = [...start];
    this._end = [...end];

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the line points as a degenerate cubic Bezier
   */
  private _generatePoints(): void {
    // For a straight line, we use a cubic Bezier where the control
    // points are on the line (interpolated at 1/3 and 2/3)
    const [x0, y0, z0] = this._start;
    const [x1, y1, z1] = this._end;

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;

    // Control points at 1/3 and 2/3 along the line
    const h1: number[] = [x0 + dx / 3, y0 + dy / 3, z0 + dz / 3];
    const h2: number[] = [x0 + 2 * dx / 3, y0 + 2 * dy / 3, z0 + 2 * dz / 3];

    this.setPoints3D([
      [...this._start],
      h1,
      h2,
      [...this._end],
    ]);
  }

  /**
   * Get the start point (derived from transformed _points3D when available)
   */
  getStart(): Vector3Tuple {
    if (this._points3D.length >= 4) {
      const p = this._points3D[0];
      return [p[0], p[1], p[2]];
    }
    return [...this._start];
  }

  /**
   * Set the start point
   */
  setStart(point: Vector3Tuple): this {
    this._start = [...point];
    this._generatePoints();
    return this;
  }

  /**
   * Get the end point (derived from transformed _points3D when available)
   */
  getEnd(): Vector3Tuple {
    if (this._points3D.length >= 4) {
      const p = this._points3D[this._points3D.length - 1];
      return [p[0], p[1], p[2]];
    }
    return [...this._end];
  }

  /**
   * Set the end point
   */
  setEnd(point: Vector3Tuple): this {
    this._end = [...point];
    this._generatePoints();
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
   * Get the direction vector of the line (normalized)
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
   * Get the angle of the line in the XY plane (in radians)
   */
  getAngle(): number {
    return Math.atan2(
      this._end[1] - this._start[1],
      this._end[0] - this._start[0]
    );
  }

  /**
   * Get a point along the line at parameter t (0 = start, 1 = end)
   */
  pointAlongPath(t: number): Vector3Tuple {
    return [
      this._start[0] + (this._end[0] - this._start[0]) * t,
      this._start[1] + (this._end[1] - this._start[1]) * t,
      this._start[2] + (this._end[2] - this._start[2]) * t,
    ];
  }

  /**
   * Create a copy of this Line
   */
  protected override _createCopy(): Line {
    return new Line({
      start: this._start,
      end: this._end,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}
