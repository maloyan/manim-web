import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { BLUE, DEFAULT_STROKE_WIDTH } from '../../constants';
import { Arc } from './Arc';

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
  protected override _createCopy(): Ellipse {
    return new Ellipse({
      width: this._width,
      height: this._height,
      center: this._centerPoint,
      numComponents: this._numComponents,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

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
    points.push([cx + outerR + 2 * dx / 3, cy, cz]);
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
    points.push([cx + innerR - 2 * dx / 3, cy, cz]);
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
    return Math.PI * (this._outerRadius * this._outerRadius - this._innerRadius * this._innerRadius);
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
  protected override _createCopy(): Annulus {
    return new Annulus({
      innerRadius: this._innerRadius,
      outerRadius: this._outerRadius,
      center: this._centerPoint,
      numComponents: this._numComponents,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

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

    const numSegments = Math.max(1, Math.ceil(Math.abs(this._angle) / (Math.PI / 2) * (this._numComponents / 4)));
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
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, cz]);
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
    const outerEnd = [cx + this._outerRadius * Math.cos(endAngle), cy + this._outerRadius * Math.sin(endAngle), cz];
    const innerEnd = [cx + this._innerRadius * Math.cos(endAngle), cy + this._innerRadius * Math.sin(endAngle), cz];
    addLineSegment(outerEnd, innerEnd);

    // Inner arc (backward direction)
    for (let i = numSegments - 1; i >= 0; i--) {
      const theta1 = this._startAngle + (i + 1) * segmentAngle;
      const theta2 = this._startAngle + i * segmentAngle;
      addArcSegment(this._innerRadius, theta1, theta2, false);
    }

    // Line from inner start to outer start (close the shape)
    const innerStart = [cx + this._innerRadius * Math.cos(this._startAngle), cy + this._innerRadius * Math.sin(this._startAngle), cz];
    const outerStart = [cx + this._outerRadius * Math.cos(this._startAngle), cy + this._outerRadius * Math.sin(this._startAngle), cz];
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
    return Math.abs(this._angle) / 2 * (this._outerRadius * this._outerRadius - this._innerRadius * this._innerRadius);
  }

  /**
   * Create a copy of this AnnularSector
   */
  protected override _createCopy(): AnnularSector {
    return new AnnularSector({
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
  }
}

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

    const numSegments = Math.max(1, Math.ceil(Math.abs(this._angle) / (Math.PI / 2) * (this._numComponents / 4)));
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
    points.push([cx + 2 * dx1 / 3, cy + 2 * dy1 / 3, cz]);
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
    points.push([arcEnd[0] + 2 * dx2 / 3, arcEnd[1] + 2 * dy2 / 3, cz]);
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
    return Math.abs(this._angle) / 2 * this._radius * this._radius;
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
  protected override _createCopy(): Sector {
    return new Sector({
      radius: this._radius,
      startAngle: this._startAngle,
      angle: this._angle,
      center: this._centerPoint,
      numComponents: this._numComponents,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Arc configuration for connecting vertices in ArcPolygon
 */
export interface ArcConfig {
  /** Arc angle for this edge. Default: 0 (straight line) */
  angle?: number;
  /** Number of Bezier segments. Default: 8 */
  numComponents?: number;
}

/**
 * Options for creating an ArcPolygon
 */
export interface ArcPolygonOptions {
  /** Array of vertices defining the polygon. Required. */
  vertices: Vector3Tuple[];
  /** Arc configurations for each edge. If not provided, straight lines are used. */
  arcConfigs?: ArcConfig[];
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Fill opacity from 0 to 1. Default: 0 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
}

/**
 * ArcPolygon - A polygon with arc edges instead of straight lines
 *
 * Creates a polygon where edges can be curved arcs.
 *
 * @example
 * ```typescript
 * // Create a triangle with curved edges
 * const arcTriangle = new ArcPolygon({
 *   vertices: [
 *     [0, 1, 0],
 *     [-1, -0.5, 0],
 *     [1, -0.5, 0]
 *   ],
 *   arcConfigs: [
 *     { angle: Math.PI / 4 },
 *     { angle: -Math.PI / 4 },
 *     { angle: Math.PI / 4 }
 *   ]
 * });
 * ```
 */
export class ArcPolygon extends VMobject {
  private _vertices: Vector3Tuple[];
  private _arcConfigs: ArcConfig[];

  constructor(options: ArcPolygonOptions) {
    super();

    const {
      vertices,
      arcConfigs = [],
      color = BLUE,
      fillOpacity = 0,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    if (!vertices || vertices.length < 2) {
      throw new Error('ArcPolygon requires at least 2 vertices');
    }

    this._vertices = vertices.map((v) => [...v] as Vector3Tuple);
    // Extend arcConfigs to match number of edges
    this._arcConfigs = [];
    for (let i = 0; i < vertices.length; i++) {
      this._arcConfigs.push(arcConfigs[i] || { angle: 0 });
    }

    this.color = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the arc polygon points.
   */
  private _generatePoints(): void {
    const points: number[][] = [];
    const n = this._vertices.length;

    for (let i = 0; i < n; i++) {
      const start = this._vertices[i];
      const end = this._vertices[(i + 1) % n];
      const config = this._arcConfigs[i];
      const angle = config.angle || 0;
      const numComponents = config.numComponents || 8;

      if (Math.abs(angle) < 1e-10) {
        // Straight line segment
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const dz = end[2] - start[2];

        if (i === 0) {
          points.push([...start]);
        }
        points.push([start[0] + dx / 3, start[1] + dy / 3, start[2] + dz / 3]);
        points.push([start[0] + 2 * dx / 3, start[1] + 2 * dy / 3, start[2] + 2 * dz / 3]);
        points.push([...end]);
      } else {
        // Arc segment using ArcBetweenPoints logic
        const arcPoints = this._generateArcPoints(start, end, angle, numComponents);

        if (i === 0) {
          points.push(...arcPoints);
        } else {
          // Skip the first point (it's the end of the previous segment)
          points.push(...arcPoints.slice(1));
        }
      }
    }

    this.setPoints3D(points);
  }

  /**
   * Generate points for an arc between two points
   */
  private _generateArcPoints(
    start: Vector3Tuple,
    end: Vector3Tuple,
    angle: number,
    numComponents: number
  ): number[][] {
    const points: number[][] = [];

    // Calculate arc parameters
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    const chordX = end[0] - start[0];
    const chordY = end[1] - start[1];
    const halfChord = Math.sqrt(chordX * chordX + chordY * chordY) / 2;

    if (halfChord < 1e-10) {
      points.push([...start]);
      return points;
    }

    const halfAngle = Math.abs(angle) / 2;
    const radius = halfChord / Math.sin(halfAngle);
    const distToCenter = radius * Math.cos(halfAngle);

    const chordLength = 2 * halfChord;
    let perpX = -chordY / chordLength;
    let perpY = chordX / chordLength;

    if (angle > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const centerX = midX + distToCenter * perpX;
    const centerY = midY + distToCenter * perpY;
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);

    // Generate arc points
    const numSegments = Math.max(1, Math.ceil(Math.abs(angle) / (Math.PI / 2) * (numComponents / 4)));
    const segmentAngle = angle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = startAngle + i * segmentAngle;
      const theta2 = startAngle + (i + 1) * segmentAngle;

      const x0 = centerX + radius * Math.cos(theta1);
      const y0 = centerY + radius * Math.sin(theta1);
      const x3 = centerX + radius * Math.cos(theta2);
      const y3 = centerY + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * radius * dx1;
      const y1 = y0 + kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * radius * dx2;
      const y2 = y3 - kappa * radius * dy2;

      if (i === 0) {
        points.push([x0, y0, midZ]);
      }
      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    return points;
  }

  /**
   * Get the vertices
   */
  getVertices(): Vector3Tuple[] {
    return this._vertices.map((v) => [...v] as Vector3Tuple);
  }

  /**
   * Get the arc configurations
   */
  getArcConfigs(): ArcConfig[] {
    return this._arcConfigs.map((c) => ({ ...c }));
  }

  /**
   * Create a copy of this ArcPolygon
   */
  protected override _createCopy(): ArcPolygon {
    return new ArcPolygon({
      vertices: this._vertices,
      arcConfigs: this._arcConfigs,
      color: this.color,
      fillOpacity: this.fillOpacity,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a CurvedArrow
 */
export interface CurvedArrowOptions {
  /** Start point of the arrow. Default: [-1, 0, 0] */
  startPoint?: Vector3Tuple;
  /** End point of the arrow. Default: [1, 0, 0] */
  endPoint?: Vector3Tuple;
  /** Arc angle in radians. Default: PI/4 */
  angle?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Length of the arrowhead tip. Default: 0.25 */
  tipLength?: number;
  /** Width of the arrowhead base. Default: 0.15 */
  tipWidth?: number;
  /** Number of Bezier segments for approximation. Default: 8 */
  numComponents?: number;
}

/**
 * CurvedArrow - An arrow that follows an arc path
 *
 * Creates an arrow that curves from start to end point.
 *
 * @example
 * ```typescript
 * // Create a curved arrow
 * const curvedArrow = new CurvedArrow({
 *   startPoint: [-2, 0, 0],
 *   endPoint: [2, 0, 0],
 *   angle: Math.PI / 3
 * });
 *
 * // Create an arrow curving the other way
 * const otherWay = new CurvedArrow({
 *   startPoint: [0, -1, 0],
 *   endPoint: [0, 1, 0],
 *   angle: -Math.PI / 4
 * });
 * ```
 */
export class CurvedArrow extends VMobject {
  private _startPoint: Vector3Tuple;
  private _endPoint: Vector3Tuple;
  private _angle: number;
  private _tipLength: number;
  private _tipWidth: number;
  private _numComponents: number;

  constructor(options: CurvedArrowOptions = {}) {
    super();

    const {
      startPoint = [-1, 0, 0],
      endPoint = [1, 0, 0],
      angle = Math.PI / 4,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      tipLength = 0.25,
      tipWidth = 0.15,
      numComponents = 8,
    } = options;

    this._startPoint = [...startPoint];
    this._endPoint = [...endPoint];
    this._angle = angle;
    this._tipLength = tipLength;
    this._tipWidth = tipWidth;
    this._numComponents = numComponents;

    this.color = color;
    this.fillOpacity = 1; // Fill the arrowhead
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the curved arrow points.
   */
  private _generatePoints(): void {
    const points: number[][] = [];

    // Calculate arc parameters
    const start = this._startPoint;
    const end = this._endPoint;
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    const chordX = end[0] - start[0];
    const chordY = end[1] - start[1];
    const halfChord = Math.sqrt(chordX * chordX + chordY * chordY) / 2;

    if (halfChord < 1e-10) {
      this.setPoints([]);
      return;
    }

    const halfAngle = Math.abs(this._angle) / 2;
    const radius = halfChord / Math.sin(halfAngle);
    const distToCenter = radius * Math.cos(halfAngle);

    const chordLength = 2 * halfChord;
    let perpX = -chordY / chordLength;
    let perpY = chordX / chordLength;

    if (this._angle > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const centerX = midX + distToCenter * perpX;
    const centerY = midY + distToCenter * perpY;
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);

    // Calculate where to end the arc (before the tip)
    // We need to find the point on the arc that is tipLength away from the end
    const arcLength = Math.abs(radius * this._angle);
    const shortenedArcLength = arcLength - this._tipLength;
    const shortenedAngle = (this._angle > 0 ? 1 : -1) * (shortenedArcLength / radius);

    // Generate arc points for the shaft
    const numSegments = Math.max(1, Math.ceil(Math.abs(shortenedAngle) / (Math.PI / 2) * (this._numComponents / 4)));
    const segmentAngle = shortenedAngle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = startAngle + i * segmentAngle;
      const theta2 = startAngle + (i + 1) * segmentAngle;

      const x0 = centerX + radius * Math.cos(theta1);
      const y0 = centerY + radius * Math.sin(theta1);
      const x3 = centerX + radius * Math.cos(theta2);
      const y3 = centerY + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * radius * dx1;
      const y1 = y0 + kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * radius * dx2;
      const y2 = y3 - kappa * radius * dy2;

      if (i === 0) {
        points.push([x0, y0, midZ]);
      }
      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    // Calculate tip base position (where the shaft ends)
    const tipBaseAngle = startAngle + shortenedAngle;
    const tipBaseX = centerX + radius * Math.cos(tipBaseAngle);
    const tipBaseY = centerY + radius * Math.sin(tipBaseAngle);

    // Direction at the tip (tangent to the arc)
    const endAngleOnArc = startAngle + this._angle;
    const dirX = this._angle > 0 ? -Math.sin(endAngleOnArc) : Math.sin(endAngleOnArc);
    const dirY = this._angle > 0 ? Math.cos(endAngleOnArc) : -Math.cos(endAngleOnArc);
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
    const normDirX = dirX / dirLen;
    const normDirY = dirY / dirLen;

    // Perpendicular to direction
    const tipPerpX = -normDirY;
    const tipPerpY = normDirX;

    // Tip corners
    const tipLeftX = tipBaseX + tipPerpX * this._tipWidth;
    const tipLeftY = tipBaseY + tipPerpY * this._tipWidth;
    const tipRightX = tipBaseX - tipPerpX * this._tipWidth;
    const tipRightY = tipBaseY - tipPerpY * this._tipWidth;

    // Add arrowhead as line segments
    const addLineSegment = (p0: number[], p1: number[]) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    // Tip: tipBase -> tipLeft -> end -> tipRight -> tipBase
    addLineSegment([tipBaseX, tipBaseY, midZ], [tipLeftX, tipLeftY, midZ]);
    addLineSegment([tipLeftX, tipLeftY, midZ], [end[0], end[1], midZ]);
    addLineSegment([end[0], end[1], midZ], [tipRightX, tipRightY, midZ]);
    addLineSegment([tipRightX, tipRightY, midZ], [tipBaseX, tipBaseY, midZ]);

    this.setPoints3D(points);
  }

  /**
   * Get the start point
   */
  getStartPoint(): Vector3Tuple {
    return [...this._startPoint];
  }

  /**
   * Set the start point
   */
  setStartPoint(point: Vector3Tuple): this {
    this._startPoint = [...point];
    this._generatePoints();
    return this;
  }

  /**
   * Get the end point
   */
  getEndPoint(): Vector3Tuple {
    return [...this._endPoint];
  }

  /**
   * Set the end point
   */
  setEndPoint(point: Vector3Tuple): this {
    this._endPoint = [...point];
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
   * Get the tip length
   */
  getTipLength(): number {
    return this._tipLength;
  }

  /**
   * Get the tip width
   */
  getTipWidth(): number {
    return this._tipWidth;
  }

  /**
   * Create a copy of this CurvedArrow
   */
  protected override _createCopy(): CurvedArrow {
    return new CurvedArrow({
      startPoint: this._startPoint,
      endPoint: this._endPoint,
      angle: this._angle,
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      numComponents: this._numComponents,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * CurvedDoubleArrow - A double arrow that follows an arc path
 *
 * Creates a double-headed arrow that curves from start to end point.
 *
 * @example
 * ```typescript
 * // Create a curved double arrow
 * const curvedDouble = new CurvedDoubleArrow({
 *   startPoint: [-2, 0, 0],
 *   endPoint: [2, 0, 0],
 *   angle: Math.PI / 3
 * });
 * ```
 */
export class CurvedDoubleArrow extends VMobject {
  private _startPoint: Vector3Tuple;
  private _endPoint: Vector3Tuple;
  private _angle: number;
  private _tipLength: number;
  private _tipWidth: number;
  private _numComponents: number;

  constructor(options: CurvedArrowOptions = {}) {
    super();

    const {
      startPoint = [-1, 0, 0],
      endPoint = [1, 0, 0],
      angle = Math.PI / 4,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      tipLength = 0.25,
      tipWidth = 0.15,
      numComponents = 8,
    } = options;

    this._startPoint = [...startPoint];
    this._endPoint = [...endPoint];
    this._angle = angle;
    this._tipLength = tipLength;
    this._tipWidth = tipWidth;
    this._numComponents = numComponents;

    this.color = color;
    this.fillOpacity = 1;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the curved double arrow points.
   */
  private _generatePoints(): void {
    const points: number[][] = [];

    const start = this._startPoint;
    const end = this._endPoint;
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    const chordX = end[0] - start[0];
    const chordY = end[1] - start[1];
    const halfChord = Math.sqrt(chordX * chordX + chordY * chordY) / 2;

    if (halfChord < 1e-10) {
      this.setPoints([]);
      return;
    }

    const halfAngle = Math.abs(this._angle) / 2;
    const radius = halfChord / Math.sin(halfAngle);
    const distToCenter = radius * Math.cos(halfAngle);

    const chordLength = 2 * halfChord;
    let perpX = -chordY / chordLength;
    let perpY = chordX / chordLength;

    if (this._angle > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }

    const centerX = midX + distToCenter * perpX;
    const centerY = midY + distToCenter * perpY;
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);

    // Calculate shortened angles for both ends
    const shortenedAngleFromStart = (this._angle > 0 ? 1 : -1) * (this._tipLength / radius);
    const shortenedAngleFromEnd = (this._angle > 0 ? -1 : 1) * (this._tipLength / radius);

    const actualStartAngle = startAngle + shortenedAngleFromStart;
    const actualEndAngle = startAngle + this._angle + shortenedAngleFromEnd;
    const actualArcAngle = actualEndAngle - actualStartAngle;

    // Start tip
    const startTipBaseX = centerX + radius * Math.cos(actualStartAngle);
    const startTipBaseY = centerY + radius * Math.sin(actualStartAngle);

    // Direction at start (tangent to arc, pointing away from start)
    const startDirX = this._angle > 0 ? Math.sin(startAngle) : -Math.sin(startAngle);
    const startDirY = this._angle > 0 ? -Math.cos(startAngle) : Math.cos(startAngle);
    const startDirLen = Math.sqrt(startDirX * startDirX + startDirY * startDirY);
    const normStartDirX = startDirX / startDirLen;
    const normStartDirY = startDirY / startDirLen;

    const startPerpX = -normStartDirY;
    const startPerpY = normStartDirX;

    const startTipLeftX = startTipBaseX + startPerpX * this._tipWidth;
    const startTipLeftY = startTipBaseY + startPerpY * this._tipWidth;
    const startTipRightX = startTipBaseX - startPerpX * this._tipWidth;
    const startTipRightY = startTipBaseY - startPerpY * this._tipWidth;

    // Helper to add line segment
    const addLineSegment = (p0: number[], p1: number[], isFirst: boolean) => {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];
      if (isFirst) {
        points.push([...p0]);
      }
      points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
      points.push([...p1]);
    };

    // Start tip
    addLineSegment([start[0], start[1], midZ], [startTipLeftX, startTipLeftY, midZ], true);
    addLineSegment([startTipLeftX, startTipLeftY, midZ], [startTipBaseX, startTipBaseY, midZ], false);

    // Arc shaft
    const numSegments = Math.max(1, Math.ceil(Math.abs(actualArcAngle) / (Math.PI / 2) * (this._numComponents / 4)));
    const segmentAngle = actualArcAngle / numSegments;
    const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

    for (let i = 0; i < numSegments; i++) {
      const theta1 = actualStartAngle + i * segmentAngle;
      const theta2 = actualStartAngle + (i + 1) * segmentAngle;

      const x0 = centerX + radius * Math.cos(theta1);
      const y0 = centerY + radius * Math.sin(theta1);
      const x3 = centerX + radius * Math.cos(theta2);
      const y3 = centerY + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 + kappa * radius * dx1;
      const y1 = y0 + kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 - kappa * radius * dx2;
      const y2 = y3 - kappa * radius * dy2;

      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    // End tip
    const endTipBaseX = centerX + radius * Math.cos(actualEndAngle);
    const endTipBaseY = centerY + radius * Math.sin(actualEndAngle);

    const endAngleOnArc = startAngle + this._angle;
    const endDirX = this._angle > 0 ? -Math.sin(endAngleOnArc) : Math.sin(endAngleOnArc);
    const endDirY = this._angle > 0 ? Math.cos(endAngleOnArc) : -Math.cos(endAngleOnArc);
    const endDirLen = Math.sqrt(endDirX * endDirX + endDirY * endDirY);
    const normEndDirX = endDirX / endDirLen;
    const normEndDirY = endDirY / endDirLen;

    const endPerpX = -normEndDirY;
    const endPerpY = normEndDirX;

    const endTipLeftX = endTipBaseX + endPerpX * this._tipWidth;
    const endTipLeftY = endTipBaseY + endPerpY * this._tipWidth;
    const endTipRightX = endTipBaseX - endPerpX * this._tipWidth;
    const endTipRightY = endTipBaseY - endPerpY * this._tipWidth;

    addLineSegment([endTipBaseX, endTipBaseY, midZ], [endTipLeftX, endTipLeftY, midZ], false);
    addLineSegment([endTipLeftX, endTipLeftY, midZ], [end[0], end[1], midZ], false);
    addLineSegment([end[0], end[1], midZ], [endTipRightX, endTipRightY, midZ], false);
    addLineSegment([endTipRightX, endTipRightY, midZ], [endTipBaseX, endTipBaseY, midZ], false);

    // Return along arc (reversed)
    for (let i = numSegments - 1; i >= 0; i--) {
      const theta1 = actualStartAngle + (i + 1) * segmentAngle;
      const theta2 = actualStartAngle + i * segmentAngle;

      const x0 = centerX + radius * Math.cos(theta1);
      const y0 = centerY + radius * Math.sin(theta1);
      const x3 = centerX + radius * Math.cos(theta2);
      const y3 = centerY + radius * Math.sin(theta2);

      const dx1 = -Math.sin(theta1);
      const dy1 = Math.cos(theta1);
      const x1 = x0 - kappa * radius * dx1;
      const y1 = y0 - kappa * radius * dy1;

      const dx2 = -Math.sin(theta2);
      const dy2 = Math.cos(theta2);
      const x2 = x3 + kappa * radius * dx2;
      const y2 = y3 + kappa * radius * dy2;

      points.push([x1, y1, midZ]);
      points.push([x2, y2, midZ]);
      points.push([x3, y3, midZ]);
    }

    // Complete start tip
    addLineSegment([startTipBaseX, startTipBaseY, midZ], [startTipRightX, startTipRightY, midZ], false);
    addLineSegment([startTipRightX, startTipRightY, midZ], [start[0], start[1], midZ], false);

    this.setPoints3D(points);
  }

  /**
   * Get the start point
   */
  getStartPoint(): Vector3Tuple {
    return [...this._startPoint];
  }

  /**
   * Set the start point
   */
  setStartPoint(point: Vector3Tuple): this {
    this._startPoint = [...point];
    this._generatePoints();
    return this;
  }

  /**
   * Get the end point
   */
  getEndPoint(): Vector3Tuple {
    return [...this._endPoint];
  }

  /**
   * Set the end point
   */
  setEndPoint(point: Vector3Tuple): this {
    this._endPoint = [...point];
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
   * Create a copy of this CurvedDoubleArrow
   */
  protected override _createCopy(): CurvedDoubleArrow {
    return new CurvedDoubleArrow({
      startPoint: this._startPoint,
      endPoint: this._endPoint,
      angle: this._angle,
      tipLength: this._tipLength,
      tipWidth: this._tipWidth,
      numComponents: this._numComponents,
      color: this.color,
      strokeWidth: this.strokeWidth,
    });
  }
}

/**
 * Options for creating a TangentialArc
 */
export interface TangentialArcOptions {
  /** Start point of the arc. Default: [0, 0, 0] */
  start?: Vector3Tuple;
  /** Direction at the start point (tangent direction). Default: [1, 0, 0] */
  direction?: Vector3Tuple;
  /** Radius of the arc. Default: 1 */
  radius?: number;
  /** Arc angle in radians. Default: PI/2 */
  angle?: number;
  /** Stroke color as CSS color string. Default: Manim's blue (#58C4DD) */
  color?: string;
  /** Stroke width in pixels. Default: 4 (Manim's default) */
  strokeWidth?: number;
  /** Number of Bezier segments for approximation. Default: 8 */
  numComponents?: number;
}

/**
 * TangentialArc - An arc that is tangent to a given direction at its start
 *
 * Creates an arc that starts tangent to a given direction.
 *
 * @example
 * ```typescript
 * // Create an arc tangent to the x-axis
 * const tangentArc = new TangentialArc({
 *   start: [0, 0, 0],
 *   direction: [1, 0, 0],
 *   radius: 1,
 *   angle: Math.PI / 2
 * });
 *
 * // Create an arc tangent to a diagonal
 * const diagonalArc = new TangentialArc({
 *   start: [0, 0, 0],
 *   direction: [1, 1, 0],
 *   radius: 2,
 *   angle: Math.PI / 3
 * });
 * ```
 */
export class TangentialArc extends Arc {
  private _direction: Vector3Tuple;

  constructor(options: TangentialArcOptions = {}) {
    const {
      start = [0, 0, 0],
      direction = [1, 0, 0],
      radius = 1,
      angle = Math.PI / 2,
      color = BLUE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      numComponents = 8,
    } = options;

    // Normalize the direction
    const dirLen = Math.sqrt(
      direction[0] * direction[0] +
      direction[1] * direction[1] +
      direction[2] * direction[2]
    );
    const normDir: Vector3Tuple = [
      direction[0] / dirLen,
      direction[1] / dirLen,
      direction[2] / dirLen,
    ];

    // Calculate the center perpendicular to the direction
    // For positive angle, center is to the left of the direction
    // For negative angle, center is to the right
    const sign = angle > 0 ? 1 : -1;
    const perpX = -sign * normDir[1];
    const perpY = sign * normDir[0];

    const centerX = start[0] + radius * perpX;
    const centerY = start[1] + radius * perpY;
    const center: Vector3Tuple = [centerX, centerY, start[2]];

    // Calculate the start angle on this circle
    const startAngle = Math.atan2(start[1] - centerY, start[0] - centerX);

    super({
      radius,
      startAngle,
      angle,
      color,
      strokeWidth,
      numComponents,
      center,
    });

    this._direction = [...normDir];
  }

  /**
   * Get the tangent direction at the start
   */
  getDirection(): Vector3Tuple {
    return [...this._direction];
  }

  /**
   * Create a copy of this TangentialArc
   */
  protected override _createCopy(): TangentialArc {
    return new TangentialArc({
      start: this.getStartPoint(),
      direction: this._direction,
      radius: this._radius,
      angle: this._angle,
      color: this.color,
      strokeWidth: this.strokeWidth,
      numComponents: this._numComponents,
    });
  }
}
