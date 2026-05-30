import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a Circle
 */
export interface CircleOptions {
  /** Radius of the circle. Default: 1 */
  radius?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Number of points for Bezier approximation. Default: 64 */
  numPoints?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * Circle - A circular VMobject
 *
 * Creates a circle using cubic Bezier curves. Four cubic Bezier segments
 * can approximate a circle with high accuracy using the kappa constant.
 *
 * @example
 * ```typescript
 * // Create a unit circle
 * const circle = new Circle();
 *
 * // Create a red circle with radius 2
 * const redCircle = new Circle({ radius: 2, color: '#ff0000' });
 *
 * // Create a filled circle
 * const filled = new Circle({ fillOpacity: 0.5 });
 * ```
 */
export class Circle extends VMobject {
  private _radius: number;
  private _numPoints: number;

  constructor(options: CircleOptions = {}) {
    super();

    const {
      radius = 1,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      numPoints = 64,
      center = [0, 0, 0],
    } = options;

    this._radius = radius;
    this._numPoints = numPoints;

    this.setColor(color);
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    // Points are always centered at origin; this.position encodes the center.
    this._generatePoints();
    this.position.set(center[0], center[1], center[2]);
  }

  /**
   * Generate the circle points using Bezier curve approximation.
   * Uses 4 cubic Bezier segments for optimal circle approximation.
   */
  private _generatePoints(): void {
    // Kappa constant for cubic Bezier circle approximation
    // k = (4/3) * tan(pi/8) = (4/3) * (sqrt(2) - 1)
    const kappa = (4 / 3) * (Math.SQRT2 - 1);
    const r = this._radius;

    // Points are always at origin; this.position encodes the actual center.
    const points: number[][] = [];

    const p0: number[] = [r, 0, 0];
    const p1: number[] = [0, r, 0];
    const p2: number[] = [-r, 0, 0];
    const p3: number[] = [0, -r, 0];

    // Segment 1: Right to Top
    points.push(p0);
    points.push([r, r * kappa, 0]);
    points.push([r * kappa, r, 0]);
    points.push(p1);

    // Segment 2: Top to Left
    points.push([-r * kappa, r, 0]);
    points.push([-r, r * kappa, 0]);
    points.push(p2);

    // Segment 3: Left to Bottom
    points.push([-r, -r * kappa, 0]);
    points.push([-r * kappa, -r, 0]);
    points.push(p3);

    // Segment 4: Bottom to Right (close the circle)
    points.push([r * kappa, -r, 0]);
    points.push([r, -r * kappa, 0]);
    points.push([...p0]);

    this.setPoints3D(points);
  }

  private _getUniformScaleFactor(): number {
    const sx = this.scaleVector.x;
    const sy = this.scaleVector.y;
    const sz = this.scaleVector.z;
    const eps = 1e-9;
    if (Math.abs(sx - sy) > eps || Math.abs(sx - sz) > eps) {
      throw new Error('Circle requires uniform scale (x == y == z) to derive radius.');
    }
    return sx;
  }

  /**
   * Get the radius of the circle (includes deferred uniform scale).
   */
  getRadius(): number {
    return this._radius * this._getUniformScaleFactor();
  }

  /**
   * Set the radius of the circle
   */
  setRadius(value: number): this {
    this._radius = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the circle
   */
  getCircleCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Set the center of the circle
   */
  setCircleCenter(value: Vector3Tuple): this {
    this.position.set(value[0], value[1], value[2]);
    return this;
  }

  /**
   * Get the circumference of the circle.
   */
  getCircumference(): number {
    const r = this.getRadius();
    return 2 * Math.PI * r;
  }

  /**
   * Get the area of the circle.
   */
  getArea(): number {
    const r = this.getRadius();
    return Math.PI * r * r;
  }

  /**
   * Get a point on the circle at a given angle (in radians)
   * @param angle Angle in radians from the positive x-axis
   */
  pointAtAngle(angle: number): Vector3Tuple {
    const r = this.getRadius();
    return [
      this.position.x + r * Math.cos(angle),
      this.position.y + r * Math.sin(angle),
      this.position.z,
    ];
  }

  override normalizeTransform(): this {
    this._radius *= this._getUniformScaleFactor();
    super.normalizeTransform();
    return this;
  }

  /**
   * Create a copy of this Circle
   */
  protected override _createCopy(): Circle {
    return new Circle({
      radius: this._radius,
      numPoints: this._numPoints,
      center: this.getCircleCenter(),
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}
