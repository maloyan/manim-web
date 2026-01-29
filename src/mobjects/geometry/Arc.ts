import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating an Arc
 */
export interface ArcOptions {
  /** Radius of the arc. Default: 1 */
  radius?: number;
  /** Start angle in radians. Default: 0 */
  startAngle?: number;
  /** Arc angle (span) in radians. Default: PI/2 */
  angle?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Number of Bezier segments for approximation. Default: 8 */
  numComponents?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * Arc - A circular arc VMobject
 *
 * Creates a circular arc using cubic Bezier curve approximation.
 * The arc starts at `startAngle` and spans `angle` radians.
 *
 * @example
 * ```typescript
 * // Create a quarter circle arc
 * const arc = new Arc();
 *
 * // Create a semicircle
 * const semicircle = new Arc({ angle: Math.PI });
 *
 * // Create a full circle using Arc
 * const fullCircle = new Arc({ angle: Math.PI * 2 });
 * ```
 */
export class Arc extends VMobject {
  protected _radius: number;
  protected _startAngle: number;
  protected _angle: number;
  protected _numComponents: number;
  protected _arcCenter: Vector3Tuple;

  constructor(options: ArcOptions = {}) {
    super();

    const {
      radius = 1,
      startAngle = 0,
      angle = Math.PI / 2,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      numComponents = 8,
      center = [0, 0, 0],
    } = options;

    this._radius = radius;
    this._startAngle = startAngle;
    this._angle = angle;
    this._numComponents = numComponents;
    this._arcCenter = [...center];

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the arc points using cubic Bezier approximation.
   * Each segment approximates a portion of the arc.
   */
  protected _generatePoints(): void {
    const points: number[][] = [];
    const [cx, cy, cz] = this._arcCenter;
    const r = this._radius;

    // For a full circle or near-full circle, ensure we get complete coverage
    const totalAngle = this._angle;
    const numSegments = Math.max(1, Math.ceil(Math.abs(totalAngle) / (Math.PI / 2) * (this._numComponents / 4)));

    // Angle per segment
    const segmentAngle = totalAngle / numSegments;

    // Kappa factor for cubic Bezier approximation of an arc
    // For a segment spanning angle theta:
    // k = (4/3) * tan(theta/4)
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = this._startAngle + i * segmentAngle;
      const theta2 = this._startAngle + (i + 1) * segmentAngle;

      // Start point
      const x0 = cx + r * Math.cos(theta1);
      const y0 = cy + r * Math.sin(theta1);

      // End point
      const x3 = cx + r * Math.cos(theta2);
      const y3 = cy + r * Math.sin(theta2);

      // Control points
      // Tangent at start point (perpendicular to radius, scaled by kappa * r)
      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * r * dx1;
      const y1 = y0 + kappa * r * dy1;

      // Tangent at end point (perpendicular to radius, scaled by -kappa * r)
      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * r * dx2;
      const y2 = y3 - kappa * r * dy2;

      if (i === 0) {
        // First segment: include anchor point
        points.push([x0, y0, cz]);
      }
      points.push([x1, y1, cz]);
      points.push([x2, y2, cz]);
      points.push([x3, y3, cz]);
    }

    this.setPoints3D(points);
  }

  /**
   * Get the start angle of the arc
   */
  getStartAngle(): number {
    return this._startAngle;
  }

  /**
   * Set the start angle of the arc
   * @param angle Start angle in radians
   */
  setStartAngle(angle: number): this {
    this._startAngle = angle;
    this._generatePoints();
    return this;
  }

  /**
   * Get the arc angle (span)
   */
  getAngle(): number {
    return this._angle;
  }

  /**
   * Set the arc angle (span)
   * @param angle Arc angle in radians
   */
  setAngle(angle: number): this {
    this._angle = angle;
    this._generatePoints();
    return this;
  }

  /**
   * Get the radius of the arc
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the radius of the arc
   * @param r Radius value
   */
  setRadius(r: number): this {
    this._radius = r;
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the arc
   */
  getArcCenter(): Vector3Tuple {
    return [...this._arcCenter];
  }

  /**
   * Set the center of the arc
   * @param center Center position [x, y, z]
   */
  setArcCenter(center: Vector3Tuple): this {
    this._arcCenter = [...center];
    this._generatePoints();
    return this;
  }

  /**
   * Get a point at a given proportion along the arc
   * @param alpha Proportion from 0 (start) to 1 (end)
   * @returns Point on the arc as [x, y, z]
   */
  pointFromProportion(alpha: number): Vector3Tuple {
    const angle = this._startAngle + alpha * this._angle;
    return [
      this._arcCenter[0] + this._radius * Math.cos(angle),
      this._arcCenter[1] + this._radius * Math.sin(angle),
      this._arcCenter[2],
    ];
  }

  /**
   * Get the start point of the arc
   */
  getStartPoint(): Vector3Tuple {
    return this.pointFromProportion(0);
  }

  /**
   * Get the end point of the arc
   */
  getEndPoint(): Vector3Tuple {
    return this.pointFromProportion(1);
  }

  /**
   * Get the arc length
   */
  getArcLength(): number {
    return Math.abs(this._radius * this._angle);
  }

  /**
   * Create a copy of this Arc
   */
  protected override _createCopy(): Arc {
    return new Arc({
      radius: this._radius,
      startAngle: this._startAngle,
      angle: this._angle,
      color: this.color,
      strokeWidth: this.strokeWidth,
      numComponents: this._numComponents,
      center: this._arcCenter,
    });
  }
}
