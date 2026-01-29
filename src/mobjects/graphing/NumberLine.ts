import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';

/**
 * Options for creating a NumberLine
 */
export interface NumberLineOptions {
  /** Range as [min, max, step]. Default: [-5, 5, 1] */
  xRange?: [number, number, number];
  /** Visual length of the number line. Default: 10 */
  length?: number;
  /** Stroke color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** Whether to include tick marks. Default: true */
  includeTicks?: boolean;
  /** Size of tick marks. Default: 0.2 */
  tickSize?: number;
  /** Whether to include number labels. Default: false */
  includeNumbers?: boolean;
  /** Numbers to exclude from labels. Default: [] */
  numbersToExclude?: number[];
  /** Decimal places for number labels. Default: 0 */
  decimalPlaces?: number;
}

/**
 * NumberLine - A line with tick marks for representing a range of numbers
 *
 * Creates a horizontal line with tick marks at regular intervals.
 * Can optionally display number labels at each tick.
 *
 * @example
 * ```typescript
 * // Create a simple number line from -5 to 5
 * const numberLine = new NumberLine();
 *
 * // Create a number line with custom range and labels
 * const labeledLine = new NumberLine({
 *   xRange: [0, 10, 2],
 *   length: 8,
 *   includeNumbers: true
 * });
 * ```
 */
export class NumberLine extends VMobject {
  private _xRange: [number, number, number];
  private _length: number;
  private _includeTicks: boolean;
  private _tickSize: number;
  private _includeNumbers: boolean;
  private _numbersToExclude: number[];
  private _decimalPlaces: number;
  private _tickMarks: VMobject[];

  constructor(options: NumberLineOptions = {}) {
    super();

    const {
      xRange = [-5, 5, 1],
      length = 10,
      color = '#ffffff',
      strokeWidth = 2,
      includeTicks = true,
      tickSize = 0.2,
      includeNumbers = false,
      numbersToExclude = [],
      decimalPlaces = 0,
    } = options;

    this._xRange = [...xRange];
    this._length = length;
    this._includeTicks = includeTicks;
    this._tickSize = tickSize;
    this._includeNumbers = includeNumbers;
    this._numbersToExclude = [...numbersToExclude];
    this._decimalPlaces = decimalPlaces;
    this._tickMarks = [];

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the number line points including main line and ticks
   */
  private _generatePoints(): void {
    const [min, max, step] = this._xRange;

    // Calculate the visual extent
    const startX = this._numberToX(min);
    const endX = this._numberToX(max);

    // Main horizontal line only (no ticks in main path)
    const dx = endX - startX;
    this.setPoints3D([
      [startX, 0, 0],
      [startX + dx / 3, 0, 0],
      [startX + 2 * dx / 3, 0, 0],
      [endX, 0, 0],
    ]);

    // Add tick marks as separate child VMobjects
    this._tickMarks = [];
    if (this._includeTicks && step > 0) {
      const epsilon = step * 0.0001;
      for (let n = min; n <= max + epsilon; n += step) {
        const roundedN = Math.round(n / step) * step;
        const x = this._numberToX(roundedN);

        const tick = new VMobject();
        tick.color = this.color;
        tick.strokeWidth = this.strokeWidth;
        tick.fillOpacity = 0;
        tick.setPoints3D([
          [x, -this._tickSize, 0],
          [x, -this._tickSize / 3, 0],
          [x, this._tickSize / 3, 0],
          [x, this._tickSize, 0],
        ]);
        this._tickMarks.push(tick);
        this.add(tick);
      }
    }
  }

  /**
   * Convert a number value to its x position on the line
   */
  private _numberToX(n: number): number {
    const [min, max] = this._xRange;
    const range = max - min;
    if (range === 0) return 0;
    return ((n - min) / range - 0.5) * this._length;
  }

  /**
   * Convert a number value to its point on the number line
   * @param n - The number value to convert
   * @returns The 3D point [x, y, z] on the number line
   */
  numberToPoint(n: number): Vector3Tuple {
    const x = this._numberToX(n);
    return [
      x + this.position.x,
      this.position.y,
      this.position.z,
    ];
  }

  /**
   * Convert a point on the number line to its number value
   * @param point - The 3D point to convert
   * @returns The number value at that point
   */
  pointToNumber(point: Vector3Tuple): number {
    const [min, max] = this._xRange;
    const range = max - min;
    const localX = point[0] - this.position.x;
    return ((localX / this._length) + 0.5) * range + min;
  }

  /**
   * Get all tick mark VMobjects
   * @returns Array of VMobjects representing tick marks
   */
  getTickMarks(): VMobject[] {
    return [...this._tickMarks];
  }

  /**
   * Get the x range
   */
  getXRange(): [number, number, number] {
    return [...this._xRange];
  }

  /**
   * Set the x range
   */
  setXRange(xRange: [number, number, number]): this {
    this._xRange = [...xRange];
    this._generatePoints();
    return this;
  }

  /**
   * Get the visual length
   */
  getLength(): number {
    return this._length;
  }

  /**
   * Set the visual length
   */
  setLength(length: number): this {
    this._length = length;
    this._generatePoints();
    return this;
  }

  /**
   * Get the tick size
   */
  getTickSize(): number {
    return this._tickSize;
  }

  /**
   * Set the tick size
   */
  setTickSize(size: number): this {
    this._tickSize = size;
    this._generatePoints();
    return this;
  }

  /**
   * Get whether ticks are included
   */
  hasTicks(): boolean {
    return this._includeTicks;
  }

  /**
   * Set whether ticks are included
   */
  setIncludeTicks(include: boolean): this {
    this._includeTicks = include;
    this._generatePoints();
    return this;
  }

  /**
   * Get the minimum value of the range
   */
  getMin(): number {
    return this._xRange[0];
  }

  /**
   * Get the maximum value of the range
   */
  getMax(): number {
    return this._xRange[1];
  }

  /**
   * Get the step value of the range
   */
  getStep(): number {
    return this._xRange[2];
  }

  /**
   * Create a copy of this NumberLine
   */
  protected override _createCopy(): NumberLine {
    return new NumberLine({
      xRange: this._xRange,
      length: this._length,
      color: this.color,
      strokeWidth: this.strokeWidth,
      includeTicks: this._includeTicks,
      tickSize: this._tickSize,
      includeNumbers: this._includeNumbers,
      numbersToExclude: this._numbersToExclude,
      decimalPlaces: this._decimalPlaces,
    });
  }
}

/**
 * Options for creating a UnitInterval
 */
export interface UnitIntervalOptions {
  /** Visual length of the unit interval. Default: 5 */
  length?: number;
  /** Stroke color as CSS color string. Default: '#ffffff' */
  color?: string;
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** Whether to include tick marks. Default: true */
  includeTicks?: boolean;
  /** Size of tick marks. Default: 0.2 */
  tickSize?: number;
  /** Whether to include number labels. Default: false */
  includeNumbers?: boolean;
  /** Number of subdivisions. Default: 10 (ticks at 0, 0.1, 0.2, ..., 1) */
  numDecimalPlaces?: number;
  /** Numbers to exclude from labels. Default: [] */
  numbersToExclude?: number[];
}

/**
 * UnitInterval - A NumberLine from 0 to 1
 *
 * A convenience class that creates a NumberLine representing the unit interval [0, 1].
 * Commonly used for probability, percentage, or normalized value visualizations.
 *
 * @example
 * ```typescript
 * // Create a simple unit interval
 * const unitInterval = new UnitInterval();
 *
 * // Create a unit interval with labels
 * const labeledInterval = new UnitInterval({
 *   length: 8,
 *   includeNumbers: true,
 *   numDecimalPlaces: 2  // ticks at 0, 0.25, 0.5, 0.75, 1
 * });
 * ```
 */
export class UnitInterval extends NumberLine {
  constructor(options: UnitIntervalOptions = {}) {
    const {
      length = 5,
      color = '#ffffff',
      strokeWidth = 2,
      includeTicks = true,
      tickSize = 0.2,
      includeNumbers = false,
      numDecimalPlaces = 1,
      numbersToExclude = [],
    } = options;

    // Calculate step based on number of decimal places
    // numDecimalPlaces = 1 -> step = 0.1 (10 subdivisions)
    // numDecimalPlaces = 2 -> step = 0.01 (100 subdivisions), but we want 0.25 for nice ticks
    const step = numDecimalPlaces === 1 ? 0.1 : numDecimalPlaces === 2 ? 0.25 : 0.5;

    super({
      xRange: [0, 1, step],
      length,
      color,
      strokeWidth,
      includeTicks,
      tickSize,
      includeNumbers,
      numbersToExclude,
      decimalPlaces: numDecimalPlaces,
    });
  }

  /**
   * Create a copy of this UnitInterval
   */
  protected override _createCopy(): UnitInterval {
    const xRange = this.getXRange();
    return new UnitInterval({
      length: this.getLength(),
      color: this.color,
      strokeWidth: this.strokeWidth,
      includeTicks: this.hasTicks(),
      tickSize: this.getTickSize(),
      numDecimalPlaces: xRange[2] === 0.1 ? 1 : xRange[2] === 0.25 ? 2 : 0,
    });
  }
}

export default NumberLine;
