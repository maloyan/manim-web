import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for creating an Ellipse
 */
export interface EllipseOptions {
  /** Width (horizontal diameter) of the ellipse. Default: 2 */
  width?: number;
  /** Height (vertical diameter) of the ellipse. Default: 1 */
  height?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Number of Bezier segments for approximation. Default: 8 */
  numComponents?: number;
}

/**
 * Ellipse - An elliptical VMobject
 *
 * Creates an ellipse using cubic Bezier curve approximation.
 * The ellipse is defined by its width and height.
 *
 * @example
 * ```typescript
 * // Create a horizontal ellipse
 * const ellipse = new Ellipse({ width: 4, height: 2 });
 *
 * // Create a filled ellipse
 * const filled = new Ellipse({ width: 3, height: 1, fillOpacity: 0.5 });
 * ```
 */
export class Ellipse extends VMobject {
  private _width: number;
  private _height: number;
  private _centerPoint: Vector3Tuple;
  private _numComponents: number;

  constructor(options: EllipseOptions = {}) {
    super();

    const {
      width = 2,
      height = 1,
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      center = [0, 0, 0],
      numComponents = 8,
    } = options;

    this._width = width;
    this._height = height;
    this._centerPoint = [...center];
    this._numComponents = numComponents;

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the ellipse points using Bezier curve approximation.
   * Uses 4 cubic Bezier segments for optimal ellipse approximation.
   */
  private _generatePoints(): void {
    // Kappa constant for cubic Bezier ellipse approximation
    const kappa = (4 / 3) * (Math.SQRT2 - 1);
    const a = this._width / 2; // Semi-major axis (horizontal)
    const b = this._height / 2; // Semi-minor axis (vertical)
    const [cx, cy, cz] = this._centerPoint;

    const points: number[][] = [];

    // Right point (0 degrees)
    const p0: number[] = [cx + a, cy, cz];
    // Top point (90 degrees)
    const p1: number[] = [cx, cy + b, cz];
    // Left point (180 degrees)
    const p2: number[] = [cx - a, cy, cz];
    // Bottom point (270 degrees)
    const p3: number[] = [cx, cy - b, cz];

    // Segment 1: Right to Top
    points.push(p0);
    points.push([cx + a, cy + b * kappa, cz]);
    points.push([cx + a * kappa, cy + b, cz]);
    points.push(p1);

    // Segment 2: Top to Left
    points.push([cx - a * kappa, cy + b, cz]);
    points.push([cx - a, cy + b * kappa, cz]);
    points.push(p2);

    // Segment 3: Left to Bottom
    points.push([cx - a, cy - b * kappa, cz]);
    points.push([cx - a * kappa, cy - b, cz]);
    points.push(p3);

    // Segment 4: Bottom to Right (close the ellipse)
    points.push([cx + a * kappa, cy - b, cz]);
    points.push([cx + a, cy - b * kappa, cz]);
    points.push([...p0]); // Close back to start

    this.setPoints3D(points);
  }

  /**
   * Get the width of the ellipse
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Set the width of the ellipse
   */
  setWidth(value: number): this {
    this._width = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the height of the ellipse
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Set the height of the ellipse
   */
  setHeight(value: number): this {
    this._height = value;
    this._generatePoints();
    return this;
  }

  /**
   * Get the center of the ellipse
   */
  getEllipseCenter(): Vector3Tuple {
    return [...this._centerPoint];
  }

  /**
   * Set the center of the ellipse
   */
  setEllipseCenter(value: Vector3Tuple): this {
    this._centerPoint = [...value];
    this._generatePoints();
    return this;
  }

  /**
   * Get the semi-major axis length (half of width)
   */
  getSemiMajorAxis(): number {
    return this._width / 2;
  }

  /**
   * Get the semi-minor axis length (half of height)
   */
  getSemiMinorAxis(): number {
    return this._height / 2;
  }

  /**
   * Get the eccentricity of the ellipse
   */
  getEccentricity(): number {
    const a = this._width / 2;
    const b = this._height / 2;
    if (a >= b) {
      return Math.sqrt(1 - (b * b) / (a * a));
    } else {
      return Math.sqrt(1 - (a * a) / (b * b));
    }
  }

  /**
   * Get the area of the ellipse
   */
  getArea(): number {
    return Math.PI * (this._width / 2) * (this._height / 2);
  }

  /**
   * Get a point on the ellipse at a given angle (in radians)
   * @param angle Angle in radians from the positive x-axis
   */
  pointAtAngle(angle: number): Vector3Tuple {
    return [
      this._centerPoint[0] + (this._width / 2) * Math.cos(angle),
      this._centerPoint[1] + (this._height / 2) * Math.sin(angle),
      this._centerPoint[2],
    ];
  }

  /**
   * Create a copy of this Ellipse
   */
  override copy(): Ellipse {
    this.normalizeTransform();
    const clone = new Ellipse({
      width: this._width,
      height: this._height,
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
