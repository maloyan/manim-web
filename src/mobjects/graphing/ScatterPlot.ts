import { Group } from '../../core/Group';
import { VGroup } from '../../core/VGroup';
import { Dot } from '../geometry/Dot';
import { Axes } from './Axes';
import { niceAxisRange, extent } from './stats';
import { BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD } from '../../constants/colors';

/** Default color cycle for scatter points. */
const DEFAULT_POINT_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/** Options for creating a ScatterPlot. */
export interface ScatterPlotOptions {
  /** X coordinates of the points. */
  x: number[];
  /** Y coordinates of the points. Paired with x by index. */
  y: number[];
  /** Dot radius, or a per-point radius array for a bubble chart. Default: 0.06 */
  sizes?: number | number[];
  /** Dot color, or a per-point color array. Default: Manim color palette */
  colors?: string | string[];
  /** Fill opacity for the dots. Default: 1 */
  fillOpacity?: number;
  /** Stroke width for the dots. Default: 0 */
  strokeWidth?: number;
  /** An existing Axes to plot onto. When omitted, one is built from the data. */
  axes?: Axes;
  /** X-axis range override as [min, max] or [min, max, step]. */
  xRange?: [number, number] | [number, number, number];
  /** Y-axis range override as [min, max] or [min, max, step]. */
  yRange?: [number, number] | [number, number, number];
  /** Visual length of the x-axis when auto-building axes. Default: 8 */
  xLength?: number;
  /** Visual length of the y-axis when auto-building axes. Default: 6 */
  yLength?: number;
  /** Color for the axes when auto-building. Default: '#ffffff' */
  axisColor?: string;
}

/**
 * ScatterPlot - points plotted as dots on a coordinate system.
 *
 * Each (x, y) pair becomes a Dot. Per-point sizes and colors turn the plot
 * into a bubble chart. When no Axes is supplied, one is built to fit the data.
 *
 * @example
 * ```typescript
 * const plot = new ScatterPlot({
 *   x: [1, 2, 3, 4],
 *   y: [2, 1, 4, 3],
 *   sizes: [0.05, 0.1, 0.15, 0.2],
 *   colors: ['#ff0000', '#00ff00'],
 * });
 * ```
 */
export class ScatterPlot extends Group {
  /** The coordinate system the points are plotted on. */
  axes: Axes;
  /** The plotted dots, one per (x, y) pair. */
  dots: VGroup;

  protected _x: number[];
  protected _y: number[];

  constructor(options: ScatterPlotOptions) {
    super();

    const {
      x,
      y,
      sizes = 0.06,
      colors = DEFAULT_POINT_COLORS,
      fillOpacity = 1,
      strokeWidth = 0,
      axes,
      xRange,
      yRange,
      xLength = 8,
      yLength = 6,
      axisColor = '#ffffff',
    } = options;

    const count = Math.min(x.length, y.length);
    this._x = x.slice(0, count);
    this._y = y.slice(0, count);

    const [xMin, xMax] = extent(this._x);
    const [yMin, yMax] = extent(this._y);
    this.axes =
      axes ??
      new Axes({
        xRange: xRange ?? niceAxisRange(xMin, xMax),
        yRange: yRange ?? niceAxisRange(yMin, yMax),
        xLength,
        yLength,
        color: axisColor,
        tips: false,
      });

    const colorList = Array.isArray(colors) ? colors : [colors];
    const sizeList = Array.isArray(sizes) ? sizes : null;

    this.dots = new VGroup();
    for (let i = 0; i < count; i++) {
      const radius = sizeList ? (sizeList[i] ?? 0.06) : (sizes as number);
      const dot = new Dot({
        point: this.axes.coordsToPoint(this._x[i], this._y[i]),
        radius,
        color: colorList[i % colorList.length],
        fillOpacity,
        strokeWidth,
      });
      this.dots.add(dot);
    }

    this.add(this.axes);
    this.add(this.dots);
  }

  /** Get the coordinate system. */
  getAxes(): Axes {
    return this.axes;
  }

  /** Get the group of plotted dots. */
  getDots(): VGroup {
    return this.dots;
  }

  /** Get a single dot by point index, or undefined when out of range. */
  getDot(index: number): Dot | undefined {
    return this.dots.get(index) as Dot | undefined;
  }

  /** The number of plotted points. */
  get numPoints(): number {
    return this._x.length;
  }

  override copy(): ScatterPlot {
    const copy = new ScatterPlot({ x: [...this._x], y: [...this._y] });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
