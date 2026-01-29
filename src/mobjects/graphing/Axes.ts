import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { NumberLine, NumberLineOptions } from './NumberLine';

/**
 * Options for creating Axes
 */
export interface AxesOptions {
  /** X-axis range as [min, max, step]. Default: [-5, 5, 1] */
  xRange?: [number, number, number];
  /** Y-axis range as [min, max, step]. Default: [-3, 3, 1] */
  yRange?: [number, number, number];
  /** Visual length of the x-axis. Default: 10 */
  xLength?: number;
  /** Visual length of the y-axis. Default: 6 */
  yLength?: number;
  /** Stroke color for axes. Default: '#ffffff' */
  color?: string;
  /** Common configuration for both axes */
  axisConfig?: Partial<NumberLineOptions>;
  /** Configuration specific to x-axis (overrides axisConfig) */
  xAxisConfig?: Partial<NumberLineOptions>;
  /** Configuration specific to y-axis (overrides axisConfig) */
  yAxisConfig?: Partial<NumberLineOptions>;
  /** Whether to include arrow tips on axes. Default: true */
  tips?: boolean;
  /** Length of arrow tips. Default: 0.25 */
  tipLength?: number;
}

/**
 * Axes - A coordinate system with x and y axes
 *
 * Creates a 2D coordinate system with configurable ranges and styling.
 * Supports coordinate transformations between graph space and visual space.
 *
 * @example
 * ```typescript
 * // Create default axes
 * const axes = new Axes();
 *
 * // Create axes with custom ranges
 * const customAxes = new Axes({
 *   xRange: [0, 10, 1],
 *   yRange: [-1, 1, 0.5],
 *   xLength: 8,
 *   yLength: 4
 * });
 *
 * // Get a point in visual coordinates
 * const point = axes.coordsToPoint(3, 2);
 * ```
 */
export class Axes extends Group {
  /** The x-axis NumberLine */
  xAxis: NumberLine;
  /** The y-axis NumberLine */
  yAxis: NumberLine;

  protected _xRange: [number, number, number];
  protected _yRange: [number, number, number];
  protected _xLength: number;
  protected _yLength: number;
  protected _tips: boolean;
  protected _tipLength: number;
  protected _xTip: VMobject | null = null;
  protected _yTip: VMobject | null = null;

  constructor(options: AxesOptions = {}) {
    super();

    const {
      xRange = [-5, 5, 1],
      yRange = [-3, 3, 1],
      xLength = 10,
      yLength = 6,
      color = '#ffffff',
      axisConfig = {},
      xAxisConfig = {},
      yAxisConfig = {},
      tips = true,
      tipLength = 0.25,
    } = options;

    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._xLength = xLength;
    this._yLength = yLength;
    this._tips = tips;
    this._tipLength = tipLength;

    // Create x-axis
    const xConfig: NumberLineOptions = {
      color,
      ...axisConfig,
      ...xAxisConfig,
      xRange: this._xRange,
      length: this._xLength,
    };
    this.xAxis = new NumberLine(xConfig);

    // Create y-axis (rotated 90 degrees)
    const yConfig: NumberLineOptions = {
      color,
      ...axisConfig,
      ...yAxisConfig,
      xRange: this._yRange,
      length: this._yLength,
    };
    this.yAxis = new NumberLine(yConfig);
    this.yAxis.rotate(Math.PI / 2);

    this.add(this.xAxis);
    this.add(this.yAxis);

    // Add arrow tips if enabled
    if (this._tips) {
      this._addTips(color);
    }
  }

  /**
   * Add arrow tips to the axes
   */
  private _addTips(color: string): void {
    const xEnd = this._xLength / 2;
    const yEnd = this._yLength / 2;
    const tipWidth = this._tipLength * 0.6;

    // Helper to create a triangular tip as a filled VMobject
    const createTip = (tipPoint: number[], baseLeft: number[], baseRight: number[]): VMobject => {
      const tip = new VMobject();
      tip.color = color;
      tip.fillOpacity = 1;
      tip.strokeWidth = 0;

      const addLineSegment = (points: number[][], p0: number[], p1: number[], isFirst: boolean) => {
        const dx = p1[0] - p0[0];
        const dy = p1[1] - p0[1];
        const dz = p1[2] - p0[2];
        if (isFirst) points.push([...p0]);
        points.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
        points.push([p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3]);
        points.push([...p1]);
      };

      const points: number[][] = [];
      addLineSegment(points, baseLeft, tipPoint, true);
      addLineSegment(points, tipPoint, baseRight, false);
      addLineSegment(points, baseRight, baseLeft, false);
      tip.setPoints3D(points);
      return tip;
    };

    // X-axis tip (pointing right) — base starts at axis end so it doesn't overlap the last tick
    this._xTip = createTip(
      [xEnd + this._tipLength, 0, 0],
      [xEnd, tipWidth, 0],
      [xEnd, -tipWidth, 0]
    );
    this.add(this._xTip);

    // Y-axis tip (pointing up) — base starts at axis end so it doesn't overlap the last tick
    this._yTip = createTip(
      [0, yEnd + this._tipLength, 0],
      [-tipWidth, yEnd, 0],
      [tipWidth, yEnd, 0]
    );
    this.add(this._yTip);

    // Remove endpoint ticks that coincide with arrow tip bases
    const xTicks = this.xAxis.getTickMarks();
    if (xTicks.length > 0) {
      this.xAxis.remove(xTicks[xTicks.length - 1]);
    }
    const yTicks = this.yAxis.getTickMarks();
    if (yTicks.length > 0) {
      this.yAxis.remove(yTicks[yTicks.length - 1]);
    }
  }

  /**
   * Convert graph coordinates to visual point coordinates
   * @param x - X coordinate in graph space
   * @param y - Y coordinate in graph space
   * @returns The visual point [x, y, z]
   */
  coordsToPoint(x: number, y: number): Vector3Tuple {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;

    // Calculate normalized position (0 to 1)
    const xNorm = xMax !== xMin ? (x - xMin) / (xMax - xMin) : 0.5;
    const yNorm = yMax !== yMin ? (y - yMin) / (yMax - yMin) : 0.5;

    // Convert to visual coordinates (centered at origin)
    const visualX = (xNorm - 0.5) * this._xLength;
    const visualY = (yNorm - 0.5) * this._yLength;

    return [
      visualX + this.position.x,
      visualY + this.position.y,
      this.position.z,
    ];
  }

  /**
   * Convert visual point coordinates to graph coordinates
   * @param point - Visual point [x, y, z]
   * @returns The graph coordinates [x, y]
   */
  pointToCoords(point: Vector3Tuple): [number, number] {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;

    // Get local coordinates
    const localX = point[0] - this.position.x;
    const localY = point[1] - this.position.y;

    // Convert from visual to normalized (0 to 1)
    const xNorm = localX / this._xLength + 0.5;
    const yNorm = localY / this._yLength + 0.5;

    // Convert to graph coordinates
    const x = xNorm * (xMax - xMin) + xMin;
    const y = yNorm * (yMax - yMin) + yMin;

    return [x, y];
  }

  /**
   * Get the x-axis NumberLine
   */
  getXAxis(): NumberLine {
    return this.xAxis;
  }

  /**
   * Get the y-axis NumberLine
   */
  getYAxis(): NumberLine {
    return this.yAxis;
  }

  /**
   * Get the x range
   */
  getXRange(): [number, number, number] {
    return [...this._xRange];
  }

  /**
   * Get the y range
   */
  getYRange(): [number, number, number] {
    return [...this._yRange];
  }

  /**
   * Get the visual x length
   */
  getXLength(): number {
    return this._xLength;
  }

  /**
   * Get the visual y length
   */
  getYLength(): number {
    return this._yLength;
  }

  /**
   * Get the origin point in visual coordinates
   */
  getOrigin(): Vector3Tuple {
    return this.coordsToPoint(0, 0);
  }

  /**
   * Convert an x coordinate to visual x position
   */
  c2pX(x: number): number {
    return this.coordsToPoint(x, 0)[0];
  }

  /**
   * Convert a y coordinate to visual y position
   */
  c2pY(y: number): number {
    return this.coordsToPoint(0, y)[1];
  }

  /**
   * Create a copy of this Axes
   */
  protected override _createCopy(): Axes {
    return new Axes({
      xRange: this._xRange,
      yRange: this._yRange,
      xLength: this._xLength,
      yLength: this._yLength,
      tips: this._tips,
      tipLength: this._tipLength,
    });
  }
}

export default Axes;
