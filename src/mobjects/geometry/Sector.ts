import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating a Sector
 */
export interface SectorOptions {
  /** Radius of the sector. Default: 1 */
  radius?: number;
  /** Start angle in radians. Default: 0 */
  startAngle?: number;
  /** Arc angle (span) in radians. Default: PI/2 */
  angle?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0.5 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Number of Bezier segments for approximation. Default: 8 */
  numComponents?: number;
}

/**
 * Sector - A pie slice of a circle
 *
 * Creates a sector (pie slice) from the center to the arc.
 *
 * @example
 * ```typescript
 * // Create a quarter pie slice
 * const quarter = new Sector({
 *   radius: 1,
 *   startAngle: 0,
 *   angle: Math.PI / 2
 * });
 *
 * // Create a filled semicircle sector
 * const semi = new Sector({
 *   radius: 2,
 *   angle: Math.PI,
 *   fillOpacity: 0.8,
 *   color: '#ff0000'
 * });
 * ```
 */
export class Sector extends VMobject {
  private _radius: number;
  private _startAngle: number;
  private _angle: number;
  private _centerPoint: Vector3Tuple;
  private _numComponents: number;

  constructor(options: SectorOptions = {}) {
    super();

    const {
      radius = 1,
      startAngle = 0,
      angle = Math.PI / 2,
      color = BLUE,
      fillOpacity = 0.5,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      numComponents = 8,
    } = options;

    this._radius = radius;
    this._startAngle = startAngle;
    this._angle = angle;
    this._centerPoint = [...center];
    this._numComponents = numComponents;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the sector points.
   */
  private _generatePoints(): void {
    const [cx, cy, cz] = this._centerPoint;
    const points: number[][] = [];

    const numSegments = Math.max(
      1,
      Math.ceil((Math.abs(this._angle) / (Math.PI / 2)) * (this._numComponents / 4)),
    );
    const segmentAngle = this._angle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    // Start from center to arc start
    const arcStart = [
      cx + this._radius * Math.cos(this._startAngle),
      cy + this._radius * Math.sin(this._startAngle),
      cz,
    ];

    // Line from center to arc start
    points.push([cx, cy, cz]);
    const dx1 = arcStart[0] - cx;
    const dy1 = arcStart[1] - cy;
    points.push([cx + dx1 / 3, cy + dy1 / 3, cz]);
    points.push([cx + (2 * dx1) / 3, cy + (2 * dy1) / 3, cz]);
    points.push([...arcStart]);

    // Arc segments
    for (let i = 0; i < numSegments; i++) {
      const theta1 = this._startAngle + i * segmentAngle;
      const theta2 = this._startAngle + (i + 1) * segmentAngle;

      const x0 = cx + this._radius * Math.cos(theta1);
      const y0 = cy + this._radius * Math.sin(theta1);
      const x3 = cx + this._radius * Math.cos(theta2);
      const y3 = cy + this._radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * this._radius * dx1;
      const y1 = y0 + kappa * this._radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * this._radius * dx2;
      const y2 = y3 - kappa * this._radius * dy2;

      points.push([x1, y1, cz]);
      points.push([x2, y2, cz]);
      points.push([x3, y3, cz]);
    }

    // Line from arc end back to center
    const endAngle = this._startAngle + this._angle;
    const arcEnd = [
      cx + this._radius * Math.cos(endAngle),
      cy + this._radius * Math.sin(endAngle),
      cz,
    ];
    const dx2 = cx - arcEnd[0];
    const dy2 = cy - arcEnd[1];
    points.push([arcEnd[0] + dx2 / 3, arcEnd[1] + dy2 / 3, cz]);
    points.push([arcEnd[0] + (2 * dx2) / 3, arcEnd[1] + (2 * dy2) / 3, cz]);
    points.push([cx, cy, cz]);

    this.setPoints3D(points);
  }

  /**
   * Get the radius
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Set the radius
   */
  setRadius(value: number): this {
    this._radius = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the start angle
   */
  getStartAngle(): number {
    return this._startAngle;
  }

  /**
   * Set the start angle
   */
  setStartAngle(value: number): this {
    this._startAngle = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the arc angle
   */
  getAngle(): number {
    return this._angle;
  }

  /**
   * Set the arc angle
   */
  setAngle(value: number): this {
    this._angle = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the center
   */
  getSectorCenter(): Vector3Tuple {
    return [...this._centerPoint];
  }

  /**
   * Get the area of the sector
   */
  getArea(): number {
    return (Math.abs(this._angle) / 2) * this._radius * this._radius;
  }

  /**
   * Get the arc length of the sector
   */
  getArcLength(): number {
    return Math.abs(this._radius * this._angle);
  }

  /**
   * Create a copy of this Sector
   */
  override copy(): Sector {
    this.normalizeTransform();
    const clone = new Sector({
      radius: this._radius,
      startAngle: this._startAngle,
      angle: this._angle,
      center: this._centerPoint,
      numComponents: this._numComponents,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, false);
    return clone;
  }
}
