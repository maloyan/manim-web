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
  private _centerPoint: Vector3Tuple;

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
    this._centerPoint = [...center];

    this.setColor(color);
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
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
    const [cx, cy, cz] = this._centerPoint;

    // Generate 4 cubic Bezier segments for a complete circle
    // Each segment spans 90 degrees
    // Points format: anchor, handle, handle, anchor, handle, handle, ...
    const points: number[][] = [];

    // Right point (0 degrees)
    const p0: number[] = [cx + r, cy, cz];
    // Top point (90 degrees)
    const p1: number[] = [cx, cy + r, cz];
    // Left point (180 degrees)
    const p2: number[] = [cx - r, cy, cz];
    // Bottom point (270 degrees)
    const p3: number[] = [cx, cy - r, cz];

    // Segment 1: Right to Top
    points.push(p0);
    points.push([cx + r, cy + r * kappa, cz]);
    points.push([cx + r * kappa, cy + r, cz]);
    points.push(p1);

    // Segment 2: Top to Left
    points.push([cx - r * kappa, cy + r, cz]);
    points.push([cx - r, cy + r * kappa, cz]);
    points.push(p2);

    // Segment 3: Left to Bottom
    points.push([cx - r, cy - r * kappa, cz]);
    points.push([cx - r * kappa, cy - r, cz]);
    points.push(p3);

    // Segment 4: Bottom to Right (close the circle)
    points.push([cx + r * kappa, cy - r, cz]);
    points.push([cx + r, cy - r * kappa, cz]);
    points.push([...p0]); // Close back to start

    this.setPoints3D(points);
  }

  /**
   * Get the radius of the circle
   */
  getRadius(): number {
    return this._radius;
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
    return [...this._centerPoint];
  }

  /**
   * Set the center of the circle
   */
  setCircleCenter(value: Vector3Tuple): this {
    this._centerPoint = [...value];
    this._generatePoints();
    return this;
  }

  /**
   * Scale the circle by changing its actual radius (not scaleVector).
   * Scales about the circle's own center so the center stays put.
   */
  override scale(factor: number | Vector3Tuple): this {
    if (typeof factor === 'number') {
      this._radius *= factor;
      this._generatePoints();
      this._markDirty();
      return this;
    }
    // For non-uniform scaling, fall back to base
    return super.scale(factor);
  }

  /**
   * Shift the circle by updating its center point and regenerating geometry.
   * Does not change Mobject.position to avoid double-counting in THREE.js hierarchy.
   */
  override shift(delta: Vector3Tuple): this {
    this._centerPoint[0] += delta[0];
    this._centerPoint[1] += delta[1];
    this._centerPoint[2] += delta[2];
    this._generatePoints();
    this._markDirty();
    return this;
  }

  /**
   * Get the circumference of the circle
   */
  getCircumference(): number {
    return 2 * Math.PI * this._radius;
  }

  /**
   * Get the area of the circle
   */
  getArea(): number {
    return Math.PI * this._radius * this._radius;
  }

  /**
   * Get a point on the circle at a given angle (in radians)
   * @param angle Angle in radians from the positive x-axis
   */
  pointAtAngle(angle: number): Vector3Tuple {
    return [
      this._centerPoint[0] + this._radius * Math.cos(angle),
      this._centerPoint[1] + this._radius * Math.sin(angle),
      this._centerPoint[2],
    ];
  }

  /**
   * Create a copy of this Circle
   */
  protected override _createCopy(): Circle {
    return new Circle({
      radius: this._radius,
      numPoints: this._numPoints,
      center: this._centerPoint,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}
