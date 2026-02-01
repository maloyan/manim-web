import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { NumberPlane, NumberPlaneOptions } from './NumberPlane';
import { Line } from '../geometry';
import { Circle } from '../geometry';
import { Text } from '../text';
import { WHITE } from '../../constants';

/**
 * Complex number representation
 */
export interface Complex {
  /** Real part */
  re: number;
  /** Imaginary part */
  im: number;
}

/**
 * Options for creating a ComplexPlane
 */
export interface ComplexPlaneOptions extends NumberPlaneOptions {
  /** Whether to show imaginary unit labels (i, 2i, etc.). Default: true */
  includeImaginaryLabels?: boolean;
  /** Font size for labels. Default: 24 */
  labelFontSize?: number;
  /** Color for axis labels. Default: '#ffffff' */
  labelColor?: string;
}

/**
 * ComplexPlane - A coordinate system for complex numbers
 *
 * Displays the complex plane with the real axis (horizontal) and
 * imaginary axis (vertical). Provides methods to convert between
 * complex numbers and visual points.
 *
 * @example
 * ```typescript
 * // Create a simple complex plane
 * const plane = new ComplexPlane();
 *
 * // Plot a complex number
 * const z = { re: 2, im: 3 };
 * const point = plane.n2p(z);
 *
 * // Convert a point back to a complex number
 * const z2 = plane.p2n([1, -1, 0]);
 * ```
 */
export class ComplexPlane extends NumberPlane {
  private _includeImaginaryLabels: boolean;
  private _labelFontSize: number;
  private _labelColor: string;
  private _imaginaryLabels: Group;
  private _coordinateLabels: Group;

  constructor(options: ComplexPlaneOptions = {}) {
    const {
      includeImaginaryLabels = true,
      labelFontSize = 24,
      labelColor = WHITE,
      ...planeOptions
    } = options;

    super(planeOptions);

    this._includeImaginaryLabels = includeImaginaryLabels;
    this._labelFontSize = labelFontSize;
    this._labelColor = labelColor;
    this._imaginaryLabels = new Group();
    this._coordinateLabels = new Group();

    if (this._includeImaginaryLabels) {
      this._generateImaginaryLabels();
      this.add(this._imaginaryLabels);
    }
  }

  /**
   * Generate labels for the imaginary axis (i, 2i, -i, etc.)
   */
  private _generateImaginaryLabels(): void {
    const [yMin, yMax, yStep] = this._yRange;
    const epsilon = 0.0001;

    // Clear existing labels
    while (this._imaginaryLabels.children.length > 0) {
      this._imaginaryLabels.remove(this._imaginaryLabels.children[0]);
    }

    if (yStep <= 0) return;

    for (let y = yMin; y <= yMax + epsilon; y += yStep) {
      const roundedY = Math.round(y / yStep) * yStep;

      // Skip zero (it's labeled on the real axis typically)
      if (Math.abs(roundedY) < epsilon) continue;

      const labelText = this._formatImaginaryLabel(roundedY);
      const [visualX, visualY] = this.coordsToPoint(0, roundedY);

      const label = new Text({
        text: labelText,
        fontSize: this._labelFontSize,
        color: this._labelColor,
      });

      // Position label to the left of the y-axis
      label.moveTo([
        visualX - this.position.x - 0.3,
        visualY - this.position.y,
        0,
      ]);

      this._imaginaryLabels.add(label);
    }
  }

  /**
   * Format a number as an imaginary label (i, 2i, -i, -2i, etc.)
   */
  private _formatImaginaryLabel(value: number): string {
    if (Math.abs(value - 1) < 0.0001) {
      return 'i';
    } else if (Math.abs(value + 1) < 0.0001) {
      return '-i';
    } else if (Number.isInteger(value)) {
      return `${value}i`;
    } else {
      return `${value.toFixed(1)}i`;
    }
  }

  /**
   * Convert a complex number to a visual point
   * @param z - Complex number as {re, im} or a number (treated as real)
   * @returns Visual point [x, y, z]
   */
  n2p(z: Complex | number): Vector3Tuple {
    if (typeof z === 'number') {
      return this.coordsToPoint(z, 0);
    }
    return this.coordsToPoint(z.re, z.im);
  }

  /**
   * Convert a visual point to a complex number
   * @param point - Visual point [x, y, z]
   * @returns Complex number
   */
  p2n(point: Vector3Tuple): Complex {
    const [x, y] = this.pointToCoords(point);
    return { re: x, im: y };
  }

  /**
   * Get the modulus (absolute value) of a complex number
   * @param z - Complex number
   */
  static modulus(z: Complex): number {
    return Math.sqrt(z.re * z.re + z.im * z.im);
  }

  /**
   * Get the argument (angle) of a complex number in radians
   * @param z - Complex number
   */
  static argument(z: Complex): number {
    return Math.atan2(z.im, z.re);
  }

  /**
   * Add two complex numbers
   */
  static add(a: Complex, b: Complex): Complex {
    return { re: a.re + b.re, im: a.im + b.im };
  }

  /**
   * Multiply two complex numbers
   */
  static multiply(a: Complex, b: Complex): Complex {
    return {
      re: a.re * b.re - a.im * b.im,
      im: a.re * b.im + a.im * b.re,
    };
  }

  /**
   * Get the conjugate of a complex number
   */
  static conjugate(z: Complex): Complex {
    return { re: z.re, im: -z.im };
  }

  /**
   * Convert polar coordinates to a complex number
   * @param r - Modulus (radius)
   * @param theta - Argument (angle in radians)
   */
  static fromPolar(r: number, theta: number): Complex {
    return {
      re: r * Math.cos(theta),
      im: r * Math.sin(theta),
    };
  }

  /**
   * Subtract two complex numbers: a - b
   */
  static subtract(a: Complex, b: Complex): Complex {
    return { re: a.re - b.re, im: a.im - b.im };
  }

  /**
   * Divide two complex numbers: a / b = (a * conj(b)) / |b|^2
   */
  static divide(a: Complex, b: Complex): Complex {
    const denom = b.re * b.re + b.im * b.im;
    return {
      re: (a.re * b.re + a.im * b.im) / denom,
      im: (a.im * b.re - a.re * b.im) / denom,
    };
  }

  /**
   * Raise a complex number to a real power: z^n via polar form (r^n * e^(in*theta))
   * @param z - Complex number
   * @param n - Real exponent
   */
  static pow(z: Complex, n: number): Complex {
    const r = ComplexPlane.modulus(z);
    const theta = ComplexPlane.argument(z);
    const rn = Math.pow(r, n);
    return {
      re: rn * Math.cos(n * theta),
      im: rn * Math.sin(n * theta),
    };
  }

  /**
   * Complex exponential: e^z = e^re * (cos(im) + i*sin(im))
   */
  static exp(z: Complex): Complex {
    const er = Math.exp(z.re);
    return {
      re: er * Math.cos(z.im),
      im: er * Math.sin(z.im),
    };
  }

  /**
   * Complex logarithm (principal branch): log(z) = ln|z| + i*arg(z)
   */
  static log(z: Complex): Complex {
    return {
      re: Math.log(ComplexPlane.modulus(z)),
      im: ComplexPlane.argument(z),
    };
  }

  /**
   * Complex square root (principal root) via polar form
   */
  static sqrt(z: Complex): Complex {
    const r = ComplexPlane.modulus(z);
    const theta = ComplexPlane.argument(z);
    const sqrtR = Math.sqrt(r);
    return {
      re: sqrtR * Math.cos(theta / 2),
      im: sqrtR * Math.sin(theta / 2),
    };
  }

  /**
   * Complex reciprocal: 1/z = conj(z) / |z|^2
   */
  static reciprocal(z: Complex): Complex {
    const denom = z.re * z.re + z.im * z.im;
    return {
      re: z.re / denom,
      im: -z.im / denom,
    };
  }

  /**
   * Get the imaginary labels group
   */
  getImaginaryLabels(): Group {
    return this._imaginaryLabels;
  }

  /**
   * Set whether to show imaginary labels
   */
  setIncludeImaginaryLabels(include: boolean): this {
    if (include === this._includeImaginaryLabels) return this;

    this._includeImaginaryLabels = include;

    if (include) {
      this._generateImaginaryLabels();
      if (!this.children.includes(this._imaginaryLabels)) {
        this.add(this._imaginaryLabels);
      }
    } else {
      const index = this.children.indexOf(this._imaginaryLabels);
      if (index !== -1) {
        this.children.splice(index, 1);
        this._imaginaryLabels.parent = null;
      }
    }

    this._markDirty();
    return this;
  }

  /**
   * Apply a complex function to all children of this plane, warping
   * any VMobject's control points through the function.
   *
   * Each point is converted to a complex number via `p2n()`, passed through
   * `func`, then mapped back to visual space via `n2p()`.
   *
   * @param func - A function mapping one complex number to another
   * @returns this for chaining
   */
  applyComplexFunction(func: (z: Complex) => Complex): this {
    const transformPoint = (point: number[]): number[] => {
      const z = this.p2n(point as [number, number, number]);
      const w = func(z);
      return [...this.n2p(w)];
    };

    // Transform all VMobject children recursively
    this._transformChildren(this, transformPoint);
    return this;
  }

  /**
   * Recursively walk `group` and transform the points of every VMobject child.
   */
  private _transformChildren(
    group: any,
    transformFn: (p: number[]) => number[],
  ): void {
    for (const child of group.children || []) {
      if (child instanceof VMobject) {
        const points = child.getPoints();
        if (points.length > 0) {
          const newPoints = points.map(transformFn);
          child.setPoints3D(newPoints);
        }
      }
      if (child.children) {
        this._transformChildren(child, transformFn);
      }
    }
  }

  /**
   * Add numeric coordinate labels at the specified values.
   *
   * - For real (x) values: creates Text labels below the x-axis.
   * - For imaginary (y) values: creates Text labels (e.g. "2i", "-i") to the
   *   left of the y-axis.
   *
   * If no values are supplied the ranges are derived from the axis settings.
   *
   * @param xVals - Real-axis values to label (defaults to integer steps from axis range)
   * @param yVals - Imaginary-axis values to label (defaults to integer steps from axis range)
   * @returns this for chaining
   */
  addCoordinates(xVals?: number[], yVals?: number[]): this {
    // Clear previous coordinate labels
    while (this._coordinateLabels.children.length > 0) {
      this._coordinateLabels.remove(this._coordinateLabels.children[0]);
    }

    const epsilon = 0.0001;

    // Derive default x values from axis range
    if (!xVals) {
      const [xMin, xMax, xStep] = this._xRange;
      xVals = [];
      if (xStep > 0) {
        for (let x = xMin; x <= xMax + epsilon; x += xStep) {
          const rounded = Math.round(x / xStep) * xStep;
          if (Math.abs(rounded) >= epsilon) {
            xVals.push(rounded);
          }
        }
      }
    }

    // Derive default y values from axis range
    if (!yVals) {
      const [yMin, yMax, yStep] = this._yRange;
      yVals = [];
      if (yStep > 0) {
        for (let y = yMin; y <= yMax + epsilon; y += yStep) {
          const rounded = Math.round(y / yStep) * yStep;
          if (Math.abs(rounded) >= epsilon) {
            yVals.push(rounded);
          }
        }
      }
    }

    // Create x-axis labels
    for (const x of xVals) {
      const labelText = Number.isInteger(x) ? `${x}` : x.toFixed(1);
      const [visualX, visualY] = this.coordsToPoint(x, 0);
      const label = new Text({
        text: labelText,
        fontSize: this._labelFontSize,
        color: this._labelColor,
      });
      label.moveTo([
        visualX - this.position.x,
        visualY - this.position.y - 0.3,
        0,
      ]);
      this._coordinateLabels.add(label);
    }

    // Create y-axis (imaginary) labels
    for (const y of yVals) {
      const labelText = this._formatImaginaryLabel(y);
      const [visualX, visualY] = this.coordsToPoint(0, y);
      const label = new Text({
        text: labelText,
        fontSize: this._labelFontSize,
        color: this._labelColor,
      });
      label.moveTo([
        visualX - this.position.x - 0.3,
        visualY - this.position.y,
        0,
      ]);
      this._coordinateLabels.add(label);
    }

    // Add coordinate labels group as a child (if not already present)
    if (!this.children.includes(this._coordinateLabels)) {
      this.add(this._coordinateLabels);
    }

    this._markDirty();
    return this;
  }

  /**
   * Get the coordinate labels group
   */
  getCoordinateLabels(): Group {
    return this._coordinateLabels;
  }

  /**
   * Create a copy of this ComplexPlane
   */
  protected override _createCopy(): ComplexPlane {
    return new ComplexPlane({
      xRange: this._xRange,
      yRange: this._yRange,
      xLength: this._xLength,
      yLength: this._yLength,
      tips: this._tips,
      tipLength: this._tipLength,
      includeImaginaryLabels: this._includeImaginaryLabels,
      labelFontSize: this._labelFontSize,
      labelColor: this._labelColor,
    });
  }
}

/**
 * Options for creating a PolarPlane
 */
export interface PolarPlaneOptions {
  /** Maximum radius in coordinate units. Default: 3 */
  radius?: number;
  /** Visual size (diameter) of the plane. Default: 6 */
  size?: number;
  /** Number of radial divisions (concentric circles). Default: 3 */
  radialDivisions?: number;
  /** Number of angular divisions (radial lines). Default: 12 */
  angularDivisions?: number;
  /** Stroke color for grid lines. Default: '#555555' */
  gridColor?: string;
  /** Stroke width for grid lines. Default: 1 */
  gridStrokeWidth?: number;
  /** Grid line opacity. Default: 0.5 */
  gridOpacity?: number;
  /** Whether to include angle labels. Default: true */
  includeAngleLabels?: boolean;
  /** Whether to include radius labels. Default: true */
  includeRadiusLabels?: boolean;
  /** Font size for labels. Default: 20 */
  labelFontSize?: number;
  /** Color for axis labels. Default: '#ffffff' */
  labelColor?: string;
  /** Azimuth offset angle in radians (0 = right). Default: 0 */
  azimuthOffset?: number;
}

/**
 * PolarPlane - A polar coordinate system
 *
 * Displays a polar coordinate system with radial lines at regular angle
 * intervals and concentric circles at regular radius intervals.
 *
 * @example
 * ```typescript
 * // Create a simple polar plane
 * const polar = new PolarPlane();
 *
 * // Convert polar coordinates to a point
 * const point = polar.pr2pt(2, Math.PI / 4);
 *
 * // Convert a point to polar coordinates
 * const [r, theta] = polar.pt2pr([1, 1, 0]);
 * ```
 */
export class PolarPlane extends Group {
  private _radius: number;
  private _size: number;
  private _radialDivisions: number;
  private _angularDivisions: number;
  private _gridColor: string;
  private _gridStrokeWidth: number;
  private _gridOpacity: number;
  private _includeAngleLabels: boolean;
  private _includeRadiusLabels: boolean;
  private _labelFontSize: number;
  private _labelColor: string;
  private _azimuthOffset: number;

  private _concentricCircles: Group;
  private _radialLines: Group;
  private _angleLabels: Group;
  private _radiusLabels: Group;

  constructor(options: PolarPlaneOptions = {}) {
    super();

    const {
      radius = 3,
      size = 6,
      radialDivisions = 3,
      angularDivisions = 12,
      gridColor = '#555555',
      gridStrokeWidth = 1,
      gridOpacity = 0.5,
      includeAngleLabels = true,
      includeRadiusLabels = true,
      labelFontSize = 20,
      labelColor = WHITE,
      azimuthOffset = 0,
    } = options;

    this._radius = radius;
    this._size = size;
    this._radialDivisions = radialDivisions;
    this._angularDivisions = angularDivisions;
    this._gridColor = gridColor;
    this._gridStrokeWidth = gridStrokeWidth;
    this._gridOpacity = gridOpacity;
    this._includeAngleLabels = includeAngleLabels;
    this._includeRadiusLabels = includeRadiusLabels;
    this._labelFontSize = labelFontSize;
    this._labelColor = labelColor;
    this._azimuthOffset = azimuthOffset;

    this._concentricCircles = new Group();
    this._radialLines = new Group();
    this._angleLabels = new Group();
    this._radiusLabels = new Group();

    this._generateGrid();
    this._generateLabels();

    this.add(this._concentricCircles);
    this.add(this._radialLines);

    if (this._includeAngleLabels) {
      this.add(this._angleLabels);
    }
    if (this._includeRadiusLabels) {
      this.add(this._radiusLabels);
    }
  }

  /**
   * Get the visual scale factor (visual units per coordinate unit)
   */
  private _getScaleFactor(): number {
    return this._size / (2 * this._radius);
  }

  /**
   * Generate the concentric circles and radial lines
   */
  private _generateGrid(): void {
    const scaleFactor = this._getScaleFactor();

    // Generate concentric circles
    for (let i = 1; i <= this._radialDivisions; i++) {
      const circleRadius = (i / this._radialDivisions) * this._radius * scaleFactor;
      const circle = new Circle({
        radius: circleRadius,
        color: this._gridColor,
        strokeWidth: this._gridStrokeWidth,
      });
      circle.setOpacity(this._gridOpacity);
      this._concentricCircles.add(circle);
    }

    // Generate radial lines
    const outerRadius = this._size / 2;
    for (let i = 0; i < this._angularDivisions; i++) {
      const angle = this._azimuthOffset + (i / this._angularDivisions) * 2 * Math.PI;
      const endX = outerRadius * Math.cos(angle);
      const endY = outerRadius * Math.sin(angle);

      const line = new Line({
        start: [0, 0, 0],
        end: [endX, endY, 0],
        color: this._gridColor,
        strokeWidth: this._gridStrokeWidth,
      });
      line.setOpacity(this._gridOpacity);
      this._radialLines.add(line);
    }
  }

  /**
   * Generate angle and radius labels
   */
  private _generateLabels(): void {
    const scaleFactor = this._getScaleFactor();
    const outerRadius = this._size / 2;
    const labelOffset = 0.3; // Offset for labels beyond the grid

    // Angle labels
    if (this._includeAngleLabels) {
      for (let i = 0; i < this._angularDivisions; i++) {
        const angle = this._azimuthOffset + (i / this._angularDivisions) * 2 * Math.PI;
        const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const labelText = this._formatAngleLabel(normalizedAngle);

        const labelX = (outerRadius + labelOffset) * Math.cos(angle);
        const labelY = (outerRadius + labelOffset) * Math.sin(angle);

        const label = new Text({
          text: labelText,
          fontSize: this._labelFontSize,
          color: this._labelColor,
        });
        label.moveTo([labelX, labelY, 0]);

        this._angleLabels.add(label);
      }
    }

    // Radius labels
    if (this._includeRadiusLabels) {
      for (let i = 1; i <= this._radialDivisions; i++) {
        const r = (i / this._radialDivisions) * this._radius;
        const visualR = r * scaleFactor;
        const labelText = Number.isInteger(r) ? `${r}` : r.toFixed(1);

        const label = new Text({
          text: labelText,
          fontSize: this._labelFontSize * 0.8,
          color: this._labelColor,
        });
        // Position radius labels along the positive x-axis, slightly below
        label.moveTo([visualR, -0.2, 0]);

        this._radiusLabels.add(label);
      }
    }
  }

  /**
   * Format an angle as a label (0, π/4, π/2, etc.)
   */
  private _formatAngleLabel(angle: number): string {
    const epsilon = 0.0001;

    // Check for common angles
    if (Math.abs(angle) < epsilon) return '0';
    if (Math.abs(angle - Math.PI / 6) < epsilon) return 'π/6';
    if (Math.abs(angle - Math.PI / 4) < epsilon) return 'π/4';
    if (Math.abs(angle - Math.PI / 3) < epsilon) return 'π/3';
    if (Math.abs(angle - Math.PI / 2) < epsilon) return 'π/2';
    if (Math.abs(angle - 2 * Math.PI / 3) < epsilon) return '2π/3';
    if (Math.abs(angle - 3 * Math.PI / 4) < epsilon) return '3π/4';
    if (Math.abs(angle - 5 * Math.PI / 6) < epsilon) return '5π/6';
    if (Math.abs(angle - Math.PI) < epsilon) return 'π';
    if (Math.abs(angle - 7 * Math.PI / 6) < epsilon) return '7π/6';
    if (Math.abs(angle - 5 * Math.PI / 4) < epsilon) return '5π/4';
    if (Math.abs(angle - 4 * Math.PI / 3) < epsilon) return '4π/3';
    if (Math.abs(angle - 3 * Math.PI / 2) < epsilon) return '3π/2';
    if (Math.abs(angle - 5 * Math.PI / 3) < epsilon) return '5π/3';
    if (Math.abs(angle - 7 * Math.PI / 4) < epsilon) return '7π/4';
    if (Math.abs(angle - 11 * Math.PI / 6) < epsilon) return '11π/6';
    if (Math.abs(angle - 2 * Math.PI) < epsilon) return '2π';

    // Fallback to decimal radians
    return `${(angle / Math.PI).toFixed(2)}π`;
  }

  /**
   * Convert polar coordinates to a visual point
   * @param r - Radius in coordinate units
   * @param theta - Angle in radians (0 = right, counter-clockwise)
   * @returns Visual point [x, y, z]
   */
  pr2pt(r: number, theta: number): Vector3Tuple {
    const scaleFactor = this._getScaleFactor();
    const visualR = r * scaleFactor;
    const adjustedTheta = theta + this._azimuthOffset;

    return [
      visualR * Math.cos(adjustedTheta) + this.position.x,
      visualR * Math.sin(adjustedTheta) + this.position.y,
      this.position.z,
    ];
  }

  /**
   * Convert a visual point to polar coordinates
   * @param point - Visual point [x, y, z]
   * @returns Polar coordinates [r, theta] where theta is in radians
   */
  pt2pr(point: Vector3Tuple): [number, number] {
    const scaleFactor = this._getScaleFactor();
    const localX = point[0] - this.position.x;
    const localY = point[1] - this.position.y;

    const visualR = Math.sqrt(localX * localX + localY * localY);
    const r = visualR / scaleFactor;

    let theta = Math.atan2(localY, localX) - this._azimuthOffset;
    // Normalize to [0, 2π)
    theta = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    return [r, theta];
  }

  /**
   * Get the radius (maximum coordinate value)
   */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Get the visual size (diameter)
   */
  getSize(): number {
    return this._size;
  }

  /**
   * Get the origin point in visual coordinates
   */
  getOrigin(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Get the concentric circles group
   */
  getConcentricCircles(): Group {
    return this._concentricCircles;
  }

  /**
   * Get the radial lines group
   */
  getRadialLines(): Group {
    return this._radialLines;
  }

  /**
   * Get the angle labels group
   */
  getAngleLabels(): Group {
    return this._angleLabels;
  }

  /**
   * Get the radius labels group
   */
  getRadiusLabels(): Group {
    return this._radiusLabels;
  }

  /**
   * Set whether to show angle labels
   */
  setIncludeAngleLabels(include: boolean): this {
    if (include === this._includeAngleLabels) return this;

    this._includeAngleLabels = include;

    if (include) {
      if (!this.children.includes(this._angleLabels)) {
        this.add(this._angleLabels);
      }
    } else {
      const index = this.children.indexOf(this._angleLabels);
      if (index !== -1) {
        this.children.splice(index, 1);
        this._angleLabels.parent = null;
      }
    }

    this._markDirty();
    return this;
  }

  /**
   * Set whether to show radius labels
   */
  setIncludeRadiusLabels(include: boolean): this {
    if (include === this._includeRadiusLabels) return this;

    this._includeRadiusLabels = include;

    if (include) {
      if (!this.children.includes(this._radiusLabels)) {
        this.add(this._radiusLabels);
      }
    } else {
      const index = this.children.indexOf(this._radiusLabels);
      if (index !== -1) {
        this.children.splice(index, 1);
        this._radiusLabels.parent = null;
      }
    }

    this._markDirty();
    return this;
  }

  /**
   * Create a copy of this PolarPlane
   */
  protected override _createCopy(): PolarPlane {
    return new PolarPlane({
      radius: this._radius,
      size: this._size,
      radialDivisions: this._radialDivisions,
      angularDivisions: this._angularDivisions,
      gridColor: this._gridColor,
      gridStrokeWidth: this._gridStrokeWidth,
      gridOpacity: this._gridOpacity,
      includeAngleLabels: this._includeAngleLabels,
      includeRadiusLabels: this._includeRadiusLabels,
      labelFontSize: this._labelFontSize,
      labelColor: this._labelColor,
      azimuthOffset: this._azimuthOffset,
    });
  }
}

export default ComplexPlane;
