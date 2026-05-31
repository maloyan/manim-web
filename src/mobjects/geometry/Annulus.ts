import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating an Annulus
 */
export interface AnnulusOptions {
  /** Inner radius of the annulus. Default: 0.5 */
  innerRadius?: number;
  /** Outer radius of the annulus. Default: 1 */
  outerRadius?: number;
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
 * Annulus - A ring/donut shaped VMobject
 *
 * Creates an annulus (ring) defined by inner and outer radii.
 * The area between the two circles is filled.
 *
 * @example
 * ```typescript
 * // Create a basic ring
 * const ring = new Annulus({ innerRadius: 0.5, outerRadius: 1.5 });
 *
 * // Create a filled donut
 * const donut = new Annulus({
 *   innerRadius: 0.3,
 *   outerRadius: 1,
 *   fillOpacity: 0.8,
 *   color: '#ff6600'
 * });
 * ```
 */
export class Annulus extends VMobject {
  private _innerRadius: number;
  private _outerRadius: number;
  private _centerPoint: Vector3Tuple;
  private _numComponents: number;

  constructor(options: AnnulusOptions = {}) {
    super();

    const {
      innerRadius = 0.5,
      outerRadius = 1,
      color = BLUE,
      fillOpacity = 0.5,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      numComponents = 8,
    } = options;

    this._innerRadius = innerRadius;
    this._outerRadius = outerRadius;
    this._centerPoint = [...center];
    this._numComponents = numComponents;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the annulus points using two circles (outer CCW, inner CW).
   */
  private _generatePoints(): void {
    const kappa = (4 / 3) * (Math.SQRT2 - 1);
    const [cx, cy, cz] = this._centerPoint;
    const points: number[][] = [];

    // Generate outer circle (counter-clockwise)
    const outerR = this._outerRadius;
    points.push([cx + outerR, cy, cz]); // Start at right
    points.push([cx + outerR, cy + outerR * kappa, cz]);
    points.push([cx + outerR * kappa, cy + outerR, cz]);
    points.push([cx, cy + outerR, cz]);

    points.push([cx - outerR * kappa, cy + outerR, cz]);
    points.push([cx - outerR, cy + outerR * kappa, cz]);
    points.push([cx - outerR, cy, cz]);

    points.push([cx - outerR, cy - outerR * kappa, cz]);
    points.push([cx - outerR * kappa, cy - outerR, cz]);
    points.push([cx, cy - outerR, cz]);

    points.push([cx + outerR * kappa, cy - outerR, cz]);
    points.push([cx + outerR, cy - outerR * kappa, cz]);
    points.push([cx + outerR, cy, cz]); // Close outer circle

    // Connect outer to inner with a line
    const innerR = this._innerRadius;
    const dx = innerR - outerR;
    points.push([cx + outerR + dx / 3, cy, cz]);
    points.push([cx + outerR + (2 * dx) / 3, cy, cz]);
    points.push([cx + innerR, cy, cz]);

    // Generate inner circle (clockwise - reversed direction)
    points.push([cx + innerR, cy - innerR * kappa, cz]);
    points.push([cx + innerR * kappa, cy - innerR, cz]);
    points.push([cx, cy - innerR, cz]);

    points.push([cx - innerR * kappa, cy - innerR, cz]);
    points.push([cx - innerR, cy - innerR * kappa, cz]);
    points.push([cx - innerR, cy, cz]);

    points.push([cx - innerR, cy + innerR * kappa, cz]);
    points.push([cx - innerR * kappa, cy + innerR, cz]);
    points.push([cx, cy + innerR, cz]);

    points.push([cx + innerR * kappa, cy + innerR, cz]);
    points.push([cx + innerR, cy + innerR * kappa, cz]);
    points.push([cx + innerR, cy, cz]); // Close inner circle

    // Connect back to outer
    points.push([cx + innerR - dx / 3, cy, cz]);
    points.push([cx + innerR - (2 * dx) / 3, cy, cz]);
    points.push([cx + outerR, cy, cz]);

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
   * Get the center of the annulus
   */
  getAnnulusCenter(): Vector3Tuple {
    return [...this._centerPoint];
  }

  /**
   * Set the center of the annulus
   */
  setAnnulusCenter(value: Vector3Tuple): this {
    this._centerPoint = [...value];
    this._generatePoints();
    return this;
  }

  /**
   * Get the area of the annulus
   */
  getArea(): number {
    return (
      Math.PI * (this._outerRadius * this._outerRadius - this._innerRadius * this._innerRadius)
    );
  }

  /**
   * Get the thickness (outer - inner radius)
   */
  getThickness(): number {
    return this._outerRadius - this._innerRadius;
  }

  /**
   * Create a copy of this Annulus
   */
  override copy(): Annulus {
    this.normalizeTransform();
    const clone = new Annulus({
      innerRadius: this._innerRadius,
      outerRadius: this._outerRadius,
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
