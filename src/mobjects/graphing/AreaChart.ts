import { Group } from '../../core/Group';
import { VGroup } from '../../core/VGroup';
import { Polygon } from '../geometry/Polygon';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import { Vector3Tuple } from '../../core/Mobject';
import { Axes } from './Axes';
import { niceAxisRange, extent } from './stats';
import { toColorList, cycleColor } from './chartColors';
import { isFlatSeries } from './seriesData';

/** Options for creating an AreaChart. */
export interface AreaChartOptions {
  /** Y-values as [series][point]. A flat array is treated as a single series. */
  values: number[][] | number[];
  /** Shared x-values, one per point. Default: indices 0, 1, 2, ... */
  xValues?: number[];
  /** Stack the series so each area rests on the sum below it. Default: false */
  stacked?: boolean;
  /** Baseline each (unstacked) area fills down to. Default: 0 */
  baseline?: number;
  /** Series colors for fills and lines. Single color or array. Default: Manim palette */
  seriesColors?: string | string[];
  /** Series names for the legend. Default: [] */
  seriesNames?: string[];
  /** Show a legend of the series names. Default: true when seriesNames is given. */
  showLegend?: boolean;
  /** Font size for the legend labels. Default: 18 */
  legendFontSize?: number;
  /** Fill opacity for the areas. Default: 0.4 */
  fillOpacity?: number;
  /** Stroke width for the top line. Default: 3 */
  lineWidth?: number;
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

/** The two mobjects that draw one series of an AreaChart. */
interface SeriesParts {
  /** The filled area from the top line down to the band below. */
  area: Polygon;
  /** The top boundary line. */
  line: Polygon;
}

/**
 * AreaChart - one or more series drawn as filled areas under a line.
 *
 * Each series becomes a semi-transparent fill from its line down to the
 * baseline, plus the line itself. When `stacked` is set, each area rests on
 * the cumulative sum of the series below it.
 *
 * @example
 * ```typescript
 * const chart = new AreaChart({
 *   values: [[1, 3, 2, 5], [2, 1, 4, 3]],
 *   stacked: true,
 *   seriesNames: ['A', 'B'],
 * });
 * ```
 */
export class AreaChart extends Group {
  /** The coordinate system the areas are plotted on. */
  axes: Axes;
  /** The filled areas, one per series. */
  areas: VGroup;
  /** The top boundary lines, one per series. */
  lines: VGroup;
  /** The legend of series names, or null when no legend is drawn. */
  legend: VGroup | null = null;

  protected _values: number[][];
  protected _x: number[];
  protected _stacked: boolean;
  protected _baseline: number;
  protected _colors: string[];
  protected _fillOpacity: number;
  protected _lineWidth: number;
  protected _seriesNames: string[];
  protected _showLegend: boolean;
  protected _legendFontSize: number;
  protected _parts: SeriesParts[];

  constructor(options: AreaChartOptions) {
    super();

    const {
      values,
      xValues,
      stacked = false,
      baseline = 0,
      seriesColors,
      seriesNames = [],
      showLegend,
      legendFontSize = 18,
      fillOpacity = 0.4,
      lineWidth = 3,
      axes,
      xRange,
      yRange,
      xLength = 8,
      yLength = 6,
      axisColor = '#ffffff',
    } = options;

    this._values = this._normalize(values);
    this._stacked = stacked;
    this._baseline = baseline;
    this._colors = toColorList(seriesColors);
    this._fillOpacity = fillOpacity;
    this._lineWidth = lineWidth;
    this._seriesNames = seriesNames;
    this._showLegend = showLegend ?? seriesNames.length > 0;
    this._legendFontSize = legendFontSize;
    this._parts = [];

    const pointCount = this._values.reduce((m, s) => Math.max(m, s.length), 0);
    this._x = xValues
      ? xValues.slice(0, pointCount)
      : Array.from({ length: pointCount }, (_, i) => i);

    this.axes = axes ?? this._buildAxes({ xRange, yRange, xLength, yLength, axisColor });
    this.areas = new VGroup();
    this.lines = new VGroup();
    this._createSeries();

    this.add(this.axes);
    this.add(this.areas);
    this.add(this.lines);

    if (this._showLegend && this._seriesNames.length > 0) {
      this.legend = this._createLegend();
      this.add(this.legend);
    }
  }

  /**
   * Build the legend: one color swatch and series-name label per series,
   * stacked at the top-left corner of the plot area.
   */
  private _createLegend(): VGroup {
    const legend = new VGroup();
    const [xMin] = this.axes.getXRange();
    const [, yMax] = this.axes.getYRange();
    const topLeft = this.axes.coordsToPoint(xMin, yMax);
    const rowHeight = 0.42;
    const swatchSize = 0.26;
    const startX = topLeft[0] + 0.35;
    const startY = topLeft[1] - 0.3;

    const count = Math.min(this._seriesNames.length, this._values.length);
    for (let s = 0; s < count; s++) {
      const name = this._seriesNames[s];
      if (name === undefined || name === '') continue;
      const color = cycleColor(this._colors, s);
      const y = startY - s * rowHeight;

      const swatch = new Rectangle({
        width: swatchSize,
        height: swatchSize,
        center: [startX, y, 0],
        color,
        fillOpacity: Math.max(this._fillOpacity, 0.6),
        strokeWidth: 1,
      });
      const label = new Text({
        text: name,
        fontSize: this._legendFontSize,
        color: '#ffffff',
        textAlign: 'left',
      });
      label.moveTo([startX + swatchSize / 2 + 0.3, y, 0]);

      legend.add(swatch);
      legend.add(label);
    }

    return legend;
  }

  /** The legend group, or null when no legend is drawn. */
  getLegend(): VGroup | null {
    return this.legend;
  }

  private _normalize(values: number[][] | number[]): number[][] {
    if (values.length === 0) return [];
    return isFlatSeries(values) ? [values] : values;
  }

  /** The cumulative baseline below series `s` at point index `i`. */
  private _bandBelow(s: number, i: number): number {
    if (!this._stacked) return this._baseline;
    let sum = 0;
    for (let k = 0; k < s; k++) sum += this._values[k]?.[i] ?? 0;
    return sum;
  }

  /** The top value of series `s` at point index `i`. */
  private _bandTop(s: number, i: number): number {
    return this._bandBelow(s, i) + (this._values[s]?.[i] ?? 0);
  }

  private _buildAxes(opts: {
    xRange?: [number, number] | [number, number, number];
    yRange?: [number, number] | [number, number, number];
    xLength: number;
    yLength: number;
    axisColor: string;
  }): Axes {
    const [xMin, xMax] = extent(this._x);
    let yLo = Math.min(this._baseline, 0);
    let yHi = this._baseline;
    for (let i = 0; i < this._x.length; i++) {
      const topMost = this._stacked ? this._bandTop(this._values.length - 1, i) : this._baseline;
      yHi = Math.max(yHi, topMost);
      for (let s = 0; s < this._values.length; s++) {
        yHi = Math.max(yHi, this._bandTop(s, i));
        yLo = Math.min(yLo, this._bandBelow(s, i), this._bandTop(s, i));
      }
    }
    return new Axes({
      xRange: opts.xRange ?? niceAxisRange(xMin, xMax),
      yRange: opts.yRange ?? niceAxisRange(yLo, yHi),
      xLength: opts.xLength,
      yLength: opts.yLength,
      color: opts.axisColor,
      tips: false,
    });
  }

  private _createSeries(): void {
    this.areas = new VGroup();
    this.lines = new VGroup();
    this._parts = [];
    if (this._x.length === 0) return;

    for (let s = 0; s < this._values.length; s++) {
      const color = cycleColor(this._colors, s);
      const topVerts: Vector3Tuple[] = [];
      const bottomVerts: Vector3Tuple[] = [];
      for (let i = 0; i < this._x.length; i++) {
        topVerts.push(this.axes.coordsToPoint(this._x[i], this._bandTop(s, i)));
        bottomVerts.push(this.axes.coordsToPoint(this._x[i], this._bandBelow(s, i)));
      }

      // Area = top boundary forward, bottom boundary backward (closed band).
      const areaVerts = [...topVerts, ...bottomVerts.slice().reverse()];
      const area = new Polygon({
        vertices: areaVerts,
        color,
        fillOpacity: this._fillOpacity,
        strokeWidth: 0,
        closed: true,
      });

      const line = new Polygon({
        vertices: topVerts.length >= 2 ? topVerts : [topVerts[0], topVerts[0]],
        color,
        fillOpacity: 0,
        strokeWidth: this._lineWidth,
        closed: false,
      });

      this._parts.push({ area, line });
      this.areas.add(area);
      this.lines.add(line);
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

  /** The filled area polygon of series `s`. */
  getArea(s: number): Polygon | undefined {
    return this._parts[s]?.area;
  }

  /** The top boundary line of series `s`. */
  getLine(s: number): Polygon | undefined {
    return this._parts[s]?.line;
  }

  /** The area and line of series `s` grouped together. */
  getSeries(s: number): VGroup {
    const group = new VGroup();
    const parts = this._parts[s];
    if (parts) {
      group.add(parts.area);
      group.add(parts.line);
    }
    return group;
  }

  /** The data-space baseline value an unstacked area fills down to. */
  getBaseline(): number {
    return this._baseline;
  }

  /** The top data value of series `s` at each x (cumulative when stacked). */
  getTopValues(s: number): number[] {
    return this._x.map((_, i) => this._bandTop(s, i));
  }

  /** The baseline data value below series `s` at each x (cumulative when stacked). */
  getBottomValues(s: number): number[] {
    return this._x.map((_, i) => this._bandBelow(s, i));
  }

  override copy(): AreaChart {
    const copy = new AreaChart({
      values: this._values.map((s) => [...s]),
      xValues: [...this._x],
      stacked: this._stacked,
      baseline: this._baseline,
      seriesColors: [...this._colors],
      seriesNames: [...this._seriesNames],
      showLegend: this._showLegend,
      legendFontSize: this._legendFontSize,
      fillOpacity: this._fillOpacity,
      lineWidth: this._lineWidth,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
