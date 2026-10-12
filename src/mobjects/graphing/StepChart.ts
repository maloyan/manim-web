import { Group } from '../../core/Group';
import { VGroup } from '../../core/VGroup';
import { Polygon } from '../geometry/Polygon';
import { Dot } from '../geometry/Dot';
import { Vector3Tuple } from '../../core/Mobject';
import { Axes } from './Axes';
import { niceAxisRange, extent } from './stats';
import { cycleColor, toColorList } from './chartColors';

/**
 * Where the step between two points falls.
 * - 'after': hold the current value, then jump at the next x (matplotlib 'post').
 * - 'before': jump at the current x, then hold to the next x (matplotlib 'pre').
 * - 'center': jump halfway between the two x-values (matplotlib 'mid').
 */
export type StepMode = 'before' | 'after' | 'center';

/** Options for creating a StepChart. */
export interface StepChartOptions {
  /** Y-values as [series][point]. A flat array is treated as a single series. */
  values: number[][] | number[];
  /** Shared x-values, one per point. Default: indices 0, 1, 2, ... */
  xValues?: number[];
  /** Where the step falls between points. Default: 'after' */
  stepMode?: StepMode;
  /** Series colors. Single color or array. Default: Manim palette */
  seriesColors?: string | string[];
  /** Stroke width for the step lines. Default: 3 */
  lineWidth?: number;
  /** Draw a dot at each data point. Default: false */
  showDots?: boolean;
  /** Dot radius when showDots is set. Default: 0.06 */
  dotRadius?: number;
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
  /** Color for the axes when auto-building. Default: white */
  axisColor?: string;
}

/**
 * StepChart - a line graph drawn as horizontal/vertical steps.
 *
 * Each series holds its value across an interval, then jumps to the next
 * value. The jump falls before, after, or at the center of each interval,
 * which suits discrete or state-over-time data.
 *
 * @example
 * ```typescript
 * const chart = new StepChart({
 *   values: [0, 2, 2, 5, 3],
 *   stepMode: 'after',
 * });
 * ```
 */
export class StepChart extends Group {
  /** The coordinate system the steps are plotted on. */
  axes: Axes;
  /** The step lines, one per series. */
  lines: VGroup;
  /** The data-point dots, when enabled. */
  dots: VGroup;

  protected _values: number[][];
  protected _x: number[];
  protected _stepMode: StepMode;
  protected _colors: string[];
  protected _lineWidth: number;
  protected _showDots: boolean;
  protected _dotRadius: number;
  /** Step vertices in data space, one array per series. */
  protected _stepPoints: Array<Array<[number, number]>>;

  constructor(options: StepChartOptions) {
    super();

    const {
      values,
      xValues,
      stepMode = 'after',
      seriesColors,
      lineWidth = 3,
      showDots = false,
      dotRadius = 0.06,
      axes,
      xRange,
      yRange,
      xLength = 8,
      yLength = 6,
      axisColor = '#ffffff',
    } = options;

    this._values = this._normalize(values);
    this._stepMode = stepMode;
    this._colors = toColorList(seriesColors);
    this._lineWidth = lineWidth;
    this._showDots = showDots;
    this._dotRadius = dotRadius;
    this._stepPoints = [];

    const pointCount = this._values.reduce((m, s) => Math.max(m, s.length), 0);
    this._x = xValues
      ? xValues.slice(0, pointCount)
      : Array.from({ length: pointCount }, (_, i) => i);

    for (let s = 0; s < this._values.length; s++) {
      this._stepPoints.push(this._buildStepPoints(s));
    }

    this.axes = axes ?? this._buildAxes({ xRange, yRange, xLength, yLength, axisColor });
    this.lines = new VGroup();
    this.dots = new VGroup();
    this._createLines();

    this.add(this.axes);
    this.add(this.lines);
    this.add(this.dots);
  }

  private _normalize(values: number[][] | number[]): number[][] {
    if (values.length === 0) return [];
    return typeof values[0] === 'number' ? [values as number[]] : (values as number[][]);
  }

  /** Build the step vertices (data space) for one series. */
  private _buildStepPoints(s: number): Array<[number, number]> {
    const ys = this._values[s];
    const n = Math.min(ys.length, this._x.length);
    const pts: Array<[number, number]> = [];
    if (n === 0) return pts;
    pts.push([this._x[0], ys[0]]);
    for (let i = 0; i < n - 1; i++) {
      const x0 = this._x[i];
      const x1 = this._x[i + 1];
      const y0 = ys[i];
      const y1 = ys[i + 1];
      if (this._stepMode === 'after') {
        pts.push([x1, y0]); // hold value to the next x
        pts.push([x1, y1]); // then jump
      } else if (this._stepMode === 'before') {
        pts.push([x0, y1]); // jump at the current x
        pts.push([x1, y1]); // then hold
      } else {
        const xm = (x0 + x1) / 2;
        pts.push([xm, y0]);
        pts.push([xm, y1]);
        pts.push([x1, y1]);
      }
    }
    return pts;
  }

  private _buildAxes(opts: {
    xRange?: [number, number] | [number, number, number];
    yRange?: [number, number] | [number, number, number];
    xLength: number;
    yLength: number;
    axisColor: string;
  }): Axes {
    const [xMin, xMax] = extent(this._x);
    const allY = this._values.flat();
    const [yMin, yMax] = extent(allY);
    return new Axes({
      xRange: opts.xRange ?? niceAxisRange(xMin, xMax),
      yRange: opts.yRange ?? niceAxisRange(yMin, yMax),
      xLength: opts.xLength,
      yLength: opts.yLength,
      color: opts.axisColor,
      tips: false,
    });
  }

  private _createLines(): void {
    this.lines = new VGroup();
    this.dots = new VGroup();
    for (let s = 0; s < this._stepPoints.length; s++) {
      const stepPts = this._stepPoints[s];
      if (stepPts.length === 0) continue;
      const color = cycleColor(this._colors, s);
      const verts: Vector3Tuple[] = stepPts.map(([x, y]) => this.axes.coordsToPoint(x, y));
      const line = new Polygon({
        vertices: verts.length >= 2 ? verts : [verts[0], verts[0]],
        color,
        fillOpacity: 0,
        strokeWidth: this._lineWidth,
        closed: false,
      });
      this.lines.add(line);

      if (this._showDots) {
        const ys = this._values[s];
        const n = Math.min(ys.length, this._x.length);
        for (let i = 0; i < n; i++) {
          this.dots.add(
            new Dot({
              point: this.axes.coordsToPoint(this._x[i], ys[i]),
              radius: this._dotRadius,
              color,
              fillOpacity: 1,
              strokeWidth: 0,
            }),
          );
        }
      }
    }
  }

  /** The coordinate system. */
  getAxes(): Axes {
    return this.axes;
  }

  /** The number of series. */
  getNumSeries(): number {
    return this._values.length;
  }

  /** The step line of series `s`. */
  getLine(s: number): Polygon | undefined {
    return this.lines.get(s) as Polygon | undefined;
  }

  /** The step vertices in data space for series `s`. */
  getStepPoints(s: number): Array<[number, number]> {
    return (this._stepPoints[s] ?? []).map(([x, y]) => [x, y]);
  }

  /** The step mode. */
  getStepMode(): StepMode {
    return this._stepMode;
  }

  override copy(): StepChart {
    const copy = new StepChart({
      values: this._values.map((s) => [...s]),
      xValues: [...this._x],
      stepMode: this._stepMode,
      seriesColors: [...this._colors],
      lineWidth: this._lineWidth,
      showDots: this._showDots,
      dotRadius: this._dotRadius,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
