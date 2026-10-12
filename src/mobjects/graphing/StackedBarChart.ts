import { Group } from '../../core/Group';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import { WHITE } from '../../constants/colors';
import { toColorList, cycleColor } from './chartColors';

/** How a StackedBarChart arranges the bars of each category. */
export type BarChartMode = 'stacked' | 'grouped';

/** Options for creating a StackedBarChart. */
export interface StackedBarChartOptions {
  /** Values as a 2D array [series][category]. A flat array is treated as one series. */
  values: number[][] | number[];
  /** 'stacked' cumulates series; 'grouped' places them side by side. Default: 'stacked' */
  mode?: BarChartMode;
  /** Width of a category slot (stacked) or the full group (grouped). Default: 0.8 */
  slotWidth?: number;
  /** Gap kept empty on each side of a category slot. Default: 0.2 */
  categoryGap?: number;
  /** Gap between bars of a group (grouped mode). Default: 0.05 */
  seriesGap?: number;
  /** Series colors. Single color applies to all, array cycles. Default: Manim palette */
  seriesColors?: string | string[];
  /** Series names for the legend. Default: [] */
  seriesNames?: string[];
  /** Whether to draw a legend. Default: false */
  showLegend?: boolean;
  /** Fill opacity for the bars. Default: 0.85 */
  fillOpacity?: number;
  /** Stroke width for the bar outlines. Default: 1.5 */
  strokeWidth?: number;
  /** X-axis labels, one per category. Default: [] */
  xLabels?: string[];
  /** Font size for x-axis labels. Default: 22 */
  xLabelFontSize?: number;
  /** Y-axis range as [min, max, step]. Default: auto-computed */
  yRange?: [number, number, number];
  /** Visual height of the chart area. Default: 5 */
  height?: number;
  /** Visual width of the chart area. Default: 8 */
  width?: number;
  /** Color for the axes and labels. Default: white */
  axisColor?: string;
}

/**
 * StackedBarChart - a multi-series bar chart with stacked or grouped bars.
 *
 * In `stacked` mode each category shows its series piled on top of one another,
 * so bar `i` sits on the cumulative sum of the series below it. In `grouped`
 * mode the series sit side by side within each category with no overlap.
 *
 * @example
 * ```typescript
 * const chart = new StackedBarChart({
 *   values: [[3, 7, 2], [5, 4, 6]],
 *   mode: 'stacked',
 *   xLabels: ['Q1', 'Q2', 'Q3'],
 *   seriesNames: ['2023', '2024'],
 *   showLegend: true,
 * });
 * ```
 */
export class StackedBarChart extends Group {
  /** All bars, in series-major order. */
  bars: VGroup;
  /** X-axis labels. */
  xLabels: VGroup;
  /** Y-axis labels. */
  yLabels: VGroup;
  /** The x-axis baseline. */
  xAxisLine: VMobject;
  /** The y-axis line. */
  yAxisLine: VMobject;
  /** Legend, when enabled. */
  legend: VGroup | null = null;

  protected _values: number[][];
  protected _mode: BarChartMode;
  protected _slotWidth: number;
  protected _categoryGap: number;
  protected _seriesGap: number;
  protected _colors: string[];
  protected _seriesNames: string[];
  protected _showLegend: boolean;
  protected _fillOpacity: number;
  protected _strokeWidth: number;
  protected _xLabelTexts: string[];
  protected _xLabelFontSize: number;
  protected _yRange: [number, number, number];
  protected _height: number;
  protected _width: number;
  protected _axisColor: string;
  /** Bars indexed [series][category]. */
  protected _barGrid: Rectangle[][];

  constructor(options: StackedBarChartOptions) {
    super();

    const {
      values,
      mode = 'stacked',
      slotWidth = 0.8,
      categoryGap = 0.2,
      seriesGap = 0.05,
      seriesColors,
      seriesNames = [],
      showLegend = false,
      fillOpacity = 0.85,
      strokeWidth = 1.5,
      xLabels = [],
      xLabelFontSize = 22,
      yRange,
      height = 5,
      width = 8,
      axisColor = WHITE,
    } = options;

    this._values = this._normalize(values);
    this._mode = mode;
    this._slotWidth = slotWidth;
    this._categoryGap = categoryGap;
    this._seriesGap = seriesGap;
    this._colors = toColorList(seriesColors);
    this._seriesNames = seriesNames;
    this._showLegend = showLegend;
    this._fillOpacity = fillOpacity;
    this._strokeWidth = strokeWidth;
    this._xLabelTexts = xLabels;
    this._xLabelFontSize = xLabelFontSize;
    this._height = height;
    this._width = width;
    this._axisColor = axisColor;
    this._yRange = yRange ?? this._computeYRange();

    this.bars = new VGroup();
    this.xLabels = new VGroup();
    this.yLabels = new VGroup();
    this._barGrid = [];

    this.yAxisLine = this._createAxisLine(true);
    this.xAxisLine = this._createAxisLine(false);
    this._createBars();
    this._createXLabels();
    this._createYLabels();

    this.add(this.yAxisLine);
    this.add(this.xAxisLine);
    this.add(this.bars);
    this.add(this.xLabels);
    this.add(this.yLabels);

    if (this._showLegend && this._seriesNames.length > 0) {
      this.legend = this._createLegend();
      this.add(this.legend);
    }
  }

  /** Coerce the input into a [series][category] grid with equal category counts. */
  private _normalize(values: number[][] | number[]): number[][] {
    if (values.length === 0) return [];
    const grid = typeof values[0] === 'number' ? [values as number[]] : (values as number[][]);
    const maxLen = grid.reduce((m, s) => Math.max(m, s.length), 0);
    return grid.map((series) => {
      const padded = series.slice(0, maxLen);
      while (padded.length < maxLen) padded.push(0);
      return padded;
    });
  }

  private get _numSeries(): number {
    return this._values.length;
  }

  private get _numCategories(): number {
    return this._values[0]?.length ?? 0;
  }

  /** Auto value range from the data, accounting for the stacking mode. */
  private _computeYRange(): [number, number, number] {
    let minVal = 0;
    let maxVal = 0;
    for (let c = 0; c < this._numCategories; c++) {
      if (this._mode === 'stacked') {
        let posSum = 0;
        let negSum = 0;
        for (let s = 0; s < this._numSeries; s++) {
          const v = this._values[s][c];
          if (v >= 0) posSum += v;
          else negSum += v;
        }
        maxVal = Math.max(maxVal, posSum);
        minVal = Math.min(minVal, negSum);
      } else {
        for (let s = 0; s < this._numSeries; s++) {
          const v = this._values[s][c];
          maxVal = Math.max(maxVal, v);
          minVal = Math.min(minVal, v);
        }
      }
    }
    if (maxVal === minVal) maxVal = minVal + 1;
    const pad = (maxVal - minVal) * 0.1;
    const hi = Math.ceil(maxVal + pad);
    const lo = minVal < 0 ? Math.floor(minVal - pad) : 0;
    const rawStep = (hi - lo) / 5 || 1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    return [lo, hi, step];
  }

  /** Map a data value to a y-coordinate in the chart frame. */
  valueToY(value: number): number {
    const [yMin, yMax] = this._yRange;
    const range = yMax - yMin;
    if (range === 0) return 0;
    return ((value - yMin) / range) * this._height;
  }

  /** The y-coordinate of the zero baseline. */
  baselineY(): number {
    return this.valueToY(Math.max(0, this._yRange[0]));
  }

  /** The center x-coordinate of category `c`. */
  categoryCenterX(c: number): number {
    const slot = this._numCategories > 0 ? this._width / this._numCategories : this._width;
    return c * slot + slot / 2;
  }

  /** Effective drawable width inside a category slot. */
  private _innerWidth(): number {
    const slot = this._numCategories > 0 ? this._width / this._numCategories : this._width;
    return Math.max(0.01, Math.min(this._slotWidth, slot) - this._categoryGap);
  }

  private _createBars(): void {
    this.bars = new VGroup();
    this._barGrid = Array.from({ length: this._numSeries }, () => []);
    const baseY = this.baselineY();
    const inner = this._innerWidth();

    for (let s = 0; s < this._numSeries; s++) {
      for (let c = 0; c < this._numCategories; c++) {
        const value = this._values[s][c];
        const { centerX, barWidth } = this._barPlacement(c, s, inner);
        const { centerY, barHeight } = this._barExtent(c, s, value, baseY);

        const bar = new Rectangle({
          width: barWidth,
          height: Math.abs(barHeight) || 0.01,
          center: [centerX, centerY, 0],
          color: cycleColor(this._colors, s),
          fillOpacity: this._fillOpacity,
          strokeWidth: this._strokeWidth,
        });
        this._barGrid[s][c] = bar;
        this.bars.add(bar);
      }
    }
  }

  /** The horizontal placement (center + width) of a bar. */
  private _barPlacement(
    c: number,
    s: number,
    inner: number,
  ): { centerX: number; barWidth: number } {
    const center = this.categoryCenterX(c);
    if (this._mode === 'stacked') {
      return { centerX: center, barWidth: inner };
    }
    const n = this._numSeries;
    const barWidth = Math.max(0.01, (inner - (n - 1) * this._seriesGap) / n);
    const left = center - inner / 2;
    const centerX = left + s * (barWidth + this._seriesGap) + barWidth / 2;
    return { centerX, barWidth };
  }

  /** The vertical placement (center + signed height) of a bar. */
  private _barExtent(
    c: number,
    s: number,
    value: number,
    baseY: number,
  ): { centerY: number; barHeight: number } {
    if (this._mode !== 'stacked') {
      const top = this.valueToY(value);
      return { centerY: (baseY + top) / 2, barHeight: top - baseY };
    }
    // Cumulate same-sign series below this one to find the stack base.
    let below = 0;
    for (let k = 0; k < s; k++) {
      const v = this._values[k][c];
      if (v >= 0 === value >= 0) below += v;
    }
    const bottom = this.valueToY(below);
    const top = this.valueToY(below + value);
    return { centerY: (bottom + top) / 2, barHeight: top - bottom };
  }

  private _createAxisLine(vertical: boolean): VMobject {
    const line = new VMobject();
    const baseY = this.baselineY();
    const p0: number[] = vertical ? [0, 0, 0] : [0, baseY, 0];
    const p1: number[] = vertical ? [0, this._height, 0] : [this._width, baseY, 0];
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    line.setPoints3D([
      [p0[0], p0[1], 0],
      [p0[0] + dx / 3, p0[1] + dy / 3, 0],
      [p0[0] + (2 * dx) / 3, p0[1] + (2 * dy) / 3, 0],
      [p1[0], p1[1], 0],
    ]);
    line.color = this._axisColor;
    line.strokeWidth = 2;
    return line;
  }

  private _createXLabels(): void {
    this.xLabels = new VGroup();
    const baseY = this.baselineY();
    for (let c = 0; c < this._numCategories; c++) {
      const label = new Text({
        text: this._xLabelTexts[c] ?? `${c + 1}`,
        fontSize: this._xLabelFontSize,
        color: this._axisColor,
      });
      label.moveTo([this.categoryCenterX(c), baseY - 0.4, 0]);
      this.xLabels.add(label);
    }
  }

  private _createYLabels(): void {
    this.yLabels = new VGroup();
    const [yMin, yMax, step] = this._yRange;
    if (step <= 0) return;
    const epsilon = step * 1e-4;
    for (let value = yMin; value <= yMax + epsilon; value += step) {
      const rounded = Math.round(value / step) * step;
      const text = Number.isInteger(rounded)
        ? rounded.toString()
        : rounded.toFixed(1).replace(/\.?0+$/, '');
      const label = new Text({
        text,
        fontSize: 20,
        color: this._axisColor,
        textAlign: 'right',
      });
      label.moveTo([-0.3, this.valueToY(rounded), 0]);
      this.yLabels.add(label);
    }
  }

  private _createLegend(): VGroup {
    const legend = new VGroup();
    const legendX = this._width + 0.5;
    const legendY = this._height - 0.5;
    const itemHeight = 0.4;
    for (let i = 0; i < this._seriesNames.length; i++) {
      const y = legendY - i * itemHeight;
      const swatch = new Rectangle({
        width: 0.3,
        height: 0.2,
        center: [legendX, y, 0],
        color: cycleColor(this._colors, i),
        fillOpacity: this._fillOpacity,
        strokeWidth: 1,
      });
      const label = new Text({
        text: this._seriesNames[i],
        fontSize: 18,
        color: this._axisColor,
        textAlign: 'left',
      });
      label.moveTo([legendX + 0.3, y, 0]);
      legend.add(swatch);
      legend.add(label);
    }
    return legend;
  }

  /** The values as a defensive copy. */
  getValues(): number[][] {
    return this._values.map((s) => [...s]);
  }

  /** The number of series. */
  getNumSeries(): number {
    return this._numSeries;
  }

  /** The number of categories. */
  getNumCategories(): number {
    return this._numCategories;
  }

  /** The chart mode. */
  getMode(): BarChartMode {
    return this._mode;
  }

  /** The value range [min, max, step]. */
  getYRange(): [number, number, number] {
    return [...this._yRange];
  }

  /** A single bar by series and category index. */
  getBar(series: number, category: number): Rectangle | undefined {
    return this._barGrid[series]?.[category];
  }

  /** All bars of one series as a VGroup. */
  getSeries(series: number): VGroup {
    const group = new VGroup();
    for (const bar of this._barGrid[series] ?? []) group.add(bar);
    return group;
  }

  override copy(): StackedBarChart {
    const copy = new StackedBarChart({
      values: this.getValues(),
      mode: this._mode,
      slotWidth: this._slotWidth,
      categoryGap: this._categoryGap,
      seriesGap: this._seriesGap,
      seriesColors: [...this._colors],
      seriesNames: [...this._seriesNames],
      showLegend: this._showLegend,
      fillOpacity: this._fillOpacity,
      strokeWidth: this._strokeWidth,
      xLabels: [...this._xLabelTexts],
      xLabelFontSize: this._xLabelFontSize,
      yRange: [...this._yRange],
      height: this._height,
      width: this._width,
      axisColor: this._axisColor,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
