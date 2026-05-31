import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating an AnnularSector
 */
export interface AnnularSectorOptions {
  /** Inner radius of the sector. Default: 0.5 */
  innerRadius?: number;
  /** Outer radius of the sector. Default: 1 */
  outerRadius?: number;
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
 * AnnularSector - A pie slice of an annulus (ring)
 *
 * Creates a sector of an annulus, like a slice of a donut.
 *
 * @example
 * ```typescript
 * // Create a quarter donut slice
 * const slice = new AnnularSector({
 *   innerRadius: 0.5,
 *   outerRadius: 1.5,
 *   startAngle: 0,
 *   angle: Math.PI / 2
 * });
 *
 * // Create a half ring
 * const halfRing = new AnnularSector({
 *   innerRadius: 0.3,
 *   outerRadius: 1,
 *   angle: Math.PI,
 *   fillOpacity: 0.8
 * });
 * ```
 */
export class AnnularSector extends VMobject {
  private _innerRadius: number;
  private _outerRadius: number;
  private _startAngle: number;
  private _angle: number;
  private _centerPoint: Vector3Tuple;
  private _numComponents: number;

  constructor(options: AnnularSectorOptions = {}) {
    super();

    const {
      innerRadius = 0.5,
      outerRadius = 1,
      startAngle = 0,
      angle = Math.PI / 2,
      color = BLUE,
      fillOpacity = 0.5,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      numComponents = 8,
    } = options;

    this._innerRadius = innerRadius;
    this._outerRadius = outerRadius;
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
   * Generate the annular sector points.
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

    // Helper to add arc segment
    const addArcSegment = (radius: number, theta1: number, theta2: number, isFirst: boolean) => {
      const x0 = cx + radius * Math.cos(theta1);
      const y0 = cy + radius * Math.sin(theta1);
      const x3 = cx + radius * Math.cos(theta2);
      const y3 = cy + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * radius * dx1;
      const y1 = y0 + kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * radius * dx2;
      const y2 = y3 - kappa * radius * dy2;

      if (isFirst) {
        points.push([x0, y0, cz]);
      }
      points.push([x1, y1, cz]);
      points.push([x2, y2, cz]);
      points.push([x3, y3, cz]);
    };

    // Helper to add line segment
    const addLineSegment = (p0: number[], p1: number[]) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, cz]);
      points.push([p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, cz]);
      points.push([...p1]);
    };

    // Outer arc (forward direction)
    for (let i = 0; i < numSegments; i++) {
      const theta1 = this._startAngle + i * segmentAngle;
      const theta2 = this._startAngle + (i + 1) * segmentAngle;
      addArcSegment(this._outerRadius, theta1, theta2, i === 0);
    }

    // Line from outer end to inner end
    const endAngle = this._startAngle + this._angle;
    const outerEnd = [
      cx + this._outerRadius * Math.cos(endAngle),
      cy + this._outerRadius * Math.sin(endAngle),
      cz,
    ];
    const innerEnd = [
      cx + this._innerRadius * Math.cos(endAngle),
      cy + this._innerRadius * Math.sin(endAngle),
      cz,
    ];
    addLineSegment(outerEnd, innerEnd);

    // Inner arc (backward direction)
    for (let i = numSegments - 1; i >= 0; i--) {
      const theta1 = this._startAngle + (i + 1) * segmentAngle;
      const theta2 = this._startAngle + i * segmentAngle;
      addArcSegment(this._innerRadius, theta1, theta2, false);
    }

    // Line from inner start to outer start (close the shape)
    const innerStart = [
      cx + this._innerRadius * Math.cos(this._startAngle),
      cy + this._innerRadius * Math.sin(this._startAngle),
      cz,
    ];
    const outerStart = [
      cx + this._outerRadius * Math.cos(this._startAngle),
      cy + this._outerRadius * Math.sin(this._startAngle),
      cz,
    ];
    addLineSegment(innerStart, outerStart);

    this.setPoints3D(points);
  }

  /**
   * Get the inner radius
   */
  getInnerRadius(): number {
    return this._innerRadius;
  }

  /**
   * Set the inner radius
   */
  setInnerRadius(value: number): this {
    this._innerRadius = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the outer radius
   */
  getOuterRadius(): number {
    return this._outerRadius;
  }

  /**
   * Set the outer radius
   */
  setOuterRadius(value: number): this {
    this._outerRadius = value;
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
    return (
      (Math.abs(this._angle) / 2) *
      (this._outerRadius * this._outerRadius - this._innerRadius * this._innerRadius)
    );
  }

  /**
   * Create a copy of this AnnularSector
   */
  override copy(): AnnularSector {
    this.normalizeTransform();
    const clone = new AnnularSector({
      innerRadius: this._innerRadius,
      outerRadius: this._outerRadius,
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
