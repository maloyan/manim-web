import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants';

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

    const { start = [0, 0, 0], end = [1, 0, 0], color = WHITE, strokeWidth = 3 } = options;

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
    const h2: number[] = [x0 + (2 * dx) / 3, y0 + (2 * dy) / 3, z0 + (2 * dz) / 3];

    this.setPoints3D([[...this._start], h1, h2, [...this._end]]);
  }

  /**
   * Get the start point in world coordinates.
   * @post result === worldMatrix * _points3D[0]
   */
  getStart(): Vector3Tuple {
    const localPt = this._points3D.length >= 4 ? this._points3D[0] : this._start;
    const worldMatrix = this._computeWorldMatrix();
    const v = new THREE.Vector3(localPt[0], localPt[1], localPt[2]).applyMatrix4(worldMatrix);
    return [v.x, v.y, v.z];
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
   * Get the end point in world coordinates.
   * @post result === worldMatrix * _points3D[last]
   */
  getEnd(): Vector3Tuple {
    const localPt =
      this._points3D.length >= 4 ? this._points3D[this._points3D.length - 1] : this._end;
    const worldMatrix = this._computeWorldMatrix();
    const v = new THREE.Vector3(localPt[0], localPt[1], localPt[2]).applyMatrix4(worldMatrix);
    return [v.x, v.y, v.z];
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
   * Get the length of the line (world-space, consistent with getStart/getEnd).
   * @post result === dist(getStart(), getEnd())
   */
  getLength(): number {
    const s = this.getStart();
    const e = this.getEnd();
    const dx = e[0] - s[0];
    const dy = e[1] - s[1];
    const dz = e[2] - s[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Get the midpoint of the line (world-space).
   * @post result === (getStart() + getEnd()) / 2
   */
  getMidpoint(): Vector3Tuple {
    const s = this.getStart();
    const e = this.getEnd();
    return [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2, (s[2] + e[2]) / 2];
  }

  /**
   * Get the direction vector of the line (normalized, world-space).
   * @post result === normalize(getEnd() - getStart())
   */
  getDirection(): Vector3Tuple {
    const s = this.getStart();
    const e = this.getEnd();
    const length = this.getLength();
    if (length === 0) {
      return [1, 0, 0];
    }
    return [(e[0] - s[0]) / length, (e[1] - s[1]) / length, (e[2] - s[2]) / length];
  }

  /**
   * Get the angle of the line in the XY plane (in radians, world-space).
   */
  getAngle(): number {
    const s = this.getStart();
    const e = this.getEnd();
    return Math.atan2(e[1] - s[1], e[0] - s[0]);
  }

  /**
   * Get a point along the line at parameter t (0 = start, 1 = end), world-space.
   * @post pointAlongPath(0) === getStart() && pointAlongPath(1) === getEnd()
   */
  pointAlongPath(t: number): Vector3Tuple {
    const s = this.getStart();
    const e = this.getEnd();
    return [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t, s[2] + (e[2] - s[2]) * t];
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
