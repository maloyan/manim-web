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
  private _initWidth: number;
  private _initHeight: number;
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

    this._initWidth = width;
    this._initHeight = height;
    this._numComponents = numComponents;

    this.position.set(center[0], center[1], center[2]);
    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  private _generatePoints(): void {
    const kappa = (4 / 3) * (Math.SQRT2 - 1);
    const a = this._initWidth / 2;
    const b = this._initHeight / 2;

    const points: number[][] = [];

    const p0: number[] = [a, 0, 0];
    const p1: number[] = [0, b, 0];
    const p2: number[] = [-a, 0, 0];
    const p3: number[] = [0, -b, 0];

    points.push(p0);
    points.push([a, b * kappa, 0]);
    points.push([a * kappa, b, 0]);
    points.push(p1);

    points.push([-a * kappa, b, 0]);
    points.push([-a, b * kappa, 0]);
    points.push(p2);

    points.push([-a, -b * kappa, 0]);
    points.push([-a * kappa, -b, 0]);
    points.push(p3);

    points.push([a * kappa, -b, 0]);
    points.push([a, -b * kappa, 0]);
    points.push([...p0]);

    this.setPoints3D(points);
  }

  setWidth(value: number): this {
    this._initWidth = value;
    this._generatePoints();
    return this;
  }

  setHeight(value: number): this {
    this._initHeight = value;
    this._generatePoints();
    return this;
  }

  getCenter(): Vector3Tuple {
    return this._parentLocalToWorld([this.position.x, this.position.y, this.position.z]);
  }

  getEllipseCenter(): Vector3Tuple {
    return this.getCenter();
  }

  setEllipseCenter(value: Vector3Tuple): this {
    this.position.set(value[0], value[1], value[2]);
    this._markDirty();
    return this;
  }

  getSemiMajorAxis(): number {
    return this.getWidth() / 2;
  }

  getSemiMinorAxis(): number {
    return this.getHeight() / 2;
  }

  getEccentricity(): number {
    const a = this.getWidth() / 2;
    const b = this.getHeight() / 2;
    if (a >= b) {
      return Math.sqrt(1 - (b * b) / (a * a));
    } else {
      return Math.sqrt(1 - (a * a) / (b * b));
    }
  }

  getArea(): number {
    return Math.PI * (this.getWidth() / 2) * (this.getHeight() / 2);
  }

  pointAtAngle(angle: number): Vector3Tuple {
    const [cx, cy, cz] = this.getCenter();
    return [
      cx + (this.getWidth() / 2) * Math.cos(angle),
      cy + (this.getHeight() / 2) * Math.sin(angle),
      cz,
    ];
  }

  override copy(): Ellipse {
    const clone = new Ellipse({
      width: this._initWidth,
      height: this._initHeight,
      numComponents: this._numComponents,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
