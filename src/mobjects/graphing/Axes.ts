import { Group } from '../../core/Group';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { NumberLine, NumberLineOptions } from './NumberLine';
import { FunctionGraph, FunctionGraphOptions } from './FunctionGraph';
import { MathTex } from '../../mobjects/text/MathTex';
import { Line } from '../../mobjects/geometry/Line';

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

    // Create x-axis (Manim excludes origin label by default)
    const xConfig: NumberLineOptions = {
      color,
      numbersToExclude: [0],
      ...axisConfig,
      ...xAxisConfig,
      xRange: this._xRange,
      length: this._xLength,
    };
    this.xAxis = new NumberLine(xConfig);

    // Create y-axis (rotated 90 degrees, Manim excludes origin label by default)
    // Use smaller tick size for the y-axis (Manim default behavior)
    const yConfig: NumberLineOptions = {
      color,
      numbersToExclude: [0],
      tickSize: 0.12,
      ...axisConfig,
      ...yAxisConfig,
      xRange: this._yRange,
      length: this._yLength,
    };
    this.yAxis = new NumberLine(yConfig);
    this.yAxis.rotate(Math.PI / 2);

    // Position axes so they intersect at the origin (0,0) in graph space
    const xOriginVisual = this._numberToVisualX(0);
    const yOriginVisual = this._numberToVisualY(0);
    this.yAxis.position.x = xOriginVisual;
    this.xAxis.position.y = yOriginVisual;

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
   * Plot a function on these axes, returning a FunctionGraph.
   * @param func - Function y = f(x)
   * @param options - Additional FunctionGraph options (color, strokeWidth, etc.)
   * @returns A FunctionGraph bound to these axes
   */
  plot(func: (x: number) => number, options: Partial<Omit<FunctionGraphOptions, 'func' | 'axes'>> = {}): FunctionGraph {
    return new FunctionGraph({
      func,
      axes: this,
      ...options,
    });
  }

  /**
   * Get axis labels ("x" and "y" by default).
   * @param xLabel - LaTeX string for x-axis label. Default: "x"
   * @param yLabel - LaTeX string for y-axis label. Default: "y"
   * @returns A Group containing the two labels
   */
  getAxisLabels(xLabel: string = 'x', yLabel: string = 'y'): Group {
    const xLabelMob = new MathTex({ latex: xLabel, fontSize: 32, color: '#ffffff' });
    const yLabelMob = new MathTex({ latex: yLabel, fontSize: 32, color: '#ffffff' });

    // Position x label to the right of x-axis
    const xEnd = this._xLength / 2;
    xLabelMob.position.set(xEnd + 0.3, -0.35, 0);

    // Position y label above y-axis
    const yEnd = this._yLength / 2;
    yLabelMob.position.set(0.35, yEnd + 0.3, 0);

    const group = new Group();
    group.add(xLabelMob);
    group.add(yLabelMob);
    return group;
  }

  /**
   * Get a label for a graph at a specific x-value.
   * Matches Python Manim's axes.get_graph_label() API.
   * @param graph - The FunctionGraph to label
   * @param label - LaTeX string for the label
   * @param options - Positioning options
   * @returns A MathTex label positioned near the graph
   */
  getGraphLabel(
    graph: FunctionGraph,
    labelOrOptions?: string | {
      xVal?: number;
      direction?: Vector3Tuple;
      color?: string;
      label?: string;
    },
    options: {
      xVal?: number;
      direction?: Vector3Tuple;
      color?: string;
      label?: string;
    } = {}
  ): MathTex {
    // Handle overload: second arg can be a string label or an options object
    let opts = options;
    let label: string | undefined;
    if (typeof labelOrOptions === 'object' && labelOrOptions !== null) {
      opts = { ...labelOrOptions, ...options };
      label = undefined;
    } else {
      label = labelOrOptions;
    }
    const labelStr = label ?? opts.label ?? '';
    const xVal = opts.xVal ?? this._xRange[1];
    const direction = opts.direction ?? [1, 1, 0];
    const color = opts.color ?? graph.color;

    // Get the point on the graph at xVal
    const point = graph.getPointFromX(xVal);
    const pos: Vector3Tuple = point ?? this.coordsToPoint(xVal, 0);

    const labelMob = new MathTex({ latex: labelStr, fontSize: 32, color });
    // Offset by direction (scaled for readability)
    const dx = direction[0] * 0.5;
    const dy = direction[1] * 0.5;
    labelMob.position.set(pos[0] + dx, pos[1] + dy, pos[2]);

    return labelMob;
  }

  /**
   * Create a vertical line from the x-axis to a point.
   * @param point - The target point [x, y, z] in visual coordinates
   * @param options - Line options
   * @returns A Line from the x-axis to the point
   */
  getVerticalLine(
    point: Vector3Tuple,
    options: { color?: string; strokeWidth?: number } = {}
  ): Line {
    const { color = '#ffffff', strokeWidth = 2 } = options;
    const xAxisY = this.coordsToPoint(0, 0)[1];
    return new Line({
      start: [point[0], xAxisY, point[2]],
      end: [point[0], point[1], point[2]],
      color,
      strokeWidth,
    });
  }

  /**
   * Input to graph point: convert an x value to the visual point on a graph.
   * Shorthand for graph.getPointFromX(x).
   * @param x - The x coordinate in graph space
   * @param graph - The FunctionGraph
   * @returns The visual coordinates on the graph
   */
  i2gp(x: number, graph: FunctionGraph): Vector3Tuple {
    const point = graph.getPointFromX(x);
    return point ?? this.coordsToPoint(x, 0);
  }

  private _numberToVisualX(x: number): number {
    const [min, max] = this._xRange;
    const range = max - min;
    if (range === 0) return 0;
    return ((x - min) / range - 0.5) * this._xLength;
  }

  private _numberToVisualY(y: number): number {
    const [min, max] = this._yRange;
    const range = max - min;
    if (range === 0) return 0;
    return ((y - min) / range - 0.5) * this._yLength;
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
