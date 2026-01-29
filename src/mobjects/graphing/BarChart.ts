import { Group } from '../../core/Group';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import { NumberLine, NumberLineOptions } from './NumberLine';
import { BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD, WHITE } from '../../constants/colors';

/** Default color cycle for bars */
const DEFAULT_BAR_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/**
 * Options for creating a BarChart
 */
export interface BarChartOptions {
  /** Array of values for the bars. For grouped bars, use 2D array [[series1], [series2], ...] */
  values: number[] | number[][];
  /** Width of each bar. Default: 0.6 */
  barWidth?: number;
  /** Gap between bars within a group (for grouped bars). Default: 0.05 */
  barGap?: number;
  /** Gap between bar groups. Default: 0.25 */
  groupGap?: number;
  /** Bar colors. Single color applies to all, array cycles through bars/series. Default: Manim color palette */
  barColors?: string | string[];
  /** Fill opacity for bars. Default: 0.8 */
  barFillOpacity?: number;
  /** Stroke width for bar outlines. Default: 2 */
  barStrokeWidth?: number;
  /** X-axis labels for each bar/group. Default: [] */
  xLabels?: string[];
  /** Font size for x-axis labels. Default: 24 */
  xLabelFontSize?: number;
  /** Y-axis range as [min, max, step]. Default: auto-calculated from values */
  yRange?: [number, number, number];
  /** Visual height of the chart area. Default: 5 */
  height?: number;
  /** Visual width of the chart area. Default: 8 */
  width?: number;
  /** Color for axes. Default: '#ffffff' */
  axisColor?: string;
  /** Whether to include y-axis tick marks. Default: true */
  includeYTicks?: boolean;
  /** Whether to include y-axis number labels. Default: true */
  includeYLabels?: boolean;
  /** Font size for y-axis labels. Default: 20 */
  yLabelFontSize?: number;
  /** Series names for legend (grouped bars). Default: [] */
  seriesNames?: string[];
  /** Whether to show a legend. Default: false */
  showLegend?: boolean;
}

/**
 * BarChart - A bar chart visualization mobject
 *
 * Creates a bar chart with customizable bars, axes, and labels.
 * Supports both simple bar charts and grouped bar charts for comparing multiple series.
 *
 * @example
 * ```typescript
 * // Simple bar chart
 * const chart = new BarChart({
 *   values: [3, 7, 2, 5],
 *   xLabels: ['A', 'B', 'C', 'D']
 * });
 *
 * // Grouped bar chart comparing two series
 * const grouped = new BarChart({
 *   values: [[3, 7, 2], [5, 4, 6]],
 *   xLabels: ['Q1', 'Q2', 'Q3'],
 *   seriesNames: ['2023', '2024'],
 *   showLegend: true
 * });
 *
 * // Animate value changes
 * chart.changeBarValues([5, 3, 8, 2]);
 * ```
 */
export class BarChart extends Group {
  /** The rectangular bars */
  bars: VGroup;
  /** The y-axis (left side) */
  yAxis: NumberLine;
  /** X-axis line */
  xAxisLine: VMobject;
  /** X-axis labels */
  xLabels: VGroup;
  /** Y-axis labels */
  yLabels: VGroup;
  /** Legend (if enabled) */
  legend: VGroup | null = null;

  protected _values: number[][];
  protected _barWidth: number;
  protected _barGap: number;
  protected _groupGap: number;
  protected _barColors: string[];
  protected _barFillOpacity: number;
  protected _barStrokeWidth: number;
  protected _xLabelTexts: string[];
  protected _yRange: [number, number, number];
  protected _height: number;
  protected _width: number;
  protected _axisColor: string;
  protected _includeYTicks: boolean;
  protected _includeYLabels: boolean;
  protected _xLabelFontSize: number;
  protected _yLabelFontSize: number;
  protected _seriesNames: string[];
  protected _showLegend: boolean;

  constructor(options: BarChartOptions) {
    super();

    const {
      values,
      barWidth = 0.6,
      barGap = 0.05,
      groupGap = 0.25,
      barColors = DEFAULT_BAR_COLORS,
      barFillOpacity = 0.8,
      barStrokeWidth = 2,
      xLabels = [],
      xLabelFontSize = 24,
      yRange,
      height = 5,
      width = 8,
      axisColor = WHITE,
      includeYTicks = true,
      includeYLabels = true,
      yLabelFontSize = 20,
      seriesNames = [],
      showLegend = false,
    } = options;

    // Normalize values to 2D array
    this._values = this._normalizeValues(values);
    this._barWidth = barWidth;
    this._barGap = barGap;
    this._groupGap = groupGap;
    this._barColors = Array.isArray(barColors) ? barColors : [barColors];
    this._barFillOpacity = barFillOpacity;
    this._barStrokeWidth = barStrokeWidth;
    this._xLabelTexts = xLabels;
    this._height = height;
    this._width = width;
    this._axisColor = axisColor;
    this._includeYTicks = includeYTicks;
    this._includeYLabels = includeYLabels;
    this._xLabelFontSize = xLabelFontSize;
    this._yLabelFontSize = yLabelFontSize;
    this._seriesNames = seriesNames;
    this._showLegend = showLegend;

    // Calculate y-range if not provided
    this._yRange = yRange || this._calculateYRange();

    // Initialize groups
    this.bars = new VGroup();
    this.xLabels = new VGroup();
    this.yLabels = new VGroup();

    // Create chart components
    this.yAxis = this._createYAxis();
    this.xAxisLine = this._createXAxisLine();
    this._createBars();
    this._createXLabels();
    this._createYLabels();

    // Add all components
    this.add(this.yAxis);
    this.add(this.xAxisLine);
    this.add(this.bars);
    this.add(this.xLabels);
    this.add(this.yLabels);

    // Create legend if requested
    if (this._showLegend && this._seriesNames.length > 0) {
      this.legend = this._createLegend();
      this.add(this.legend);
    }
  }

  /**
   * Normalize values to 2D array (series x groups)
   */
  private _normalizeValues(values: number[] | number[][]): number[][] {
    if (values.length === 0) return [[]];

    if (typeof values[0] === 'number') {
      // Simple array - single series
      return [values as number[]];
    }
    // Already 2D array
    return values as number[][];
  }

  /**
   * Get the number of series
   */
  private get _numSeries(): number {
    return this._values.length;
  }

  /**
   * Get the number of groups/categories
   */
  private get _numGroups(): number {
    return this._values[0]?.length || 0;
  }

  /**
   * Calculate y-range from values
   */
  private _calculateYRange(): [number, number, number] {
    let minVal = 0;
    let maxVal = 0;

    for (const series of this._values) {
      for (const val of series) {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }

    // Add padding and calculate nice step
    const range = maxVal - minVal;
    const padding = range * 0.1 || 1;

    // Start from 0 for positive values
    const yMin = minVal < 0 ? Math.floor(minVal - padding) : 0;
    const yMax = Math.ceil(maxVal + padding);

    // Calculate a nice step value
    const rawStep = (yMax - yMin) / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;

    return [yMin, yMax, step];
  }

  /**
   * Create the y-axis
   */
  private _createYAxis(): NumberLine {
    const yAxisConfig: NumberLineOptions = {
      xRange: this._yRange,
      length: this._height,
      color: this._axisColor,
      strokeWidth: 2,
      includeTicks: this._includeYTicks,
      tickSize: 0.1,
    };

    const yAxis = new NumberLine(yAxisConfig);
    yAxis.rotate(Math.PI / 2);
    yAxis.moveTo([0, this._height / 2, 0]);

    return yAxis;
  }

  /**
   * Create the x-axis line
   */
  private _createXAxisLine(): VMobject {
    const line = new VMobject();
    const startX = 0;
    const endX = this._width;
    const y = this._valueToY(Math.max(0, this._yRange[0]));

    // Create as cubic Bezier (straight line)
    const points: number[][] = [
      [startX, y, 0],
      [startX + (endX - startX) / 3, y, 0],
      [startX + 2 * (endX - startX) / 3, y, 0],
      [endX, y, 0],
    ];

    line.setPoints3D(points);
    line.color = this._axisColor;
    line.strokeWidth = 2;

    return line;
  }

  /**
   * Convert a data value to y-coordinate
   */
  private _valueToY(value: number): number {
    const [yMin, yMax] = this._yRange;
    const range = yMax - yMin;
    if (range === 0) return 0;
    return ((value - yMin) / range) * this._height;
  }

  /**
   * Get the x-coordinate for a group center
   */
  private _groupCenterX(groupIndex: number): number {
    const groupWidth = this._numSeries * this._barWidth + (this._numSeries - 1) * this._barGap;
    const totalWidth = this._numGroups * groupWidth + (this._numGroups - 1) * this._groupGap;
    const startX = (this._width - totalWidth) / 2 + groupWidth / 2;
    return startX + groupIndex * (groupWidth + this._groupGap);
  }

  /**
   * Get the x-coordinate for a specific bar
   */
  private _barCenterX(groupIndex: number, seriesIndex: number): number {
    const groupCenter = this._groupCenterX(groupIndex);
    const groupWidth = this._numSeries * this._barWidth + (this._numSeries - 1) * this._barGap;
    const barOffset = seriesIndex * (this._barWidth + this._barGap) - groupWidth / 2 + this._barWidth / 2;
    return groupCenter + barOffset;
  }

  /**
   * Get color for a series/bar
   */
  private _getBarColor(seriesIndex: number): string {
    return this._barColors[seriesIndex % this._barColors.length];
  }

  /**
   * Create all bars
   */
  private _createBars(): void {
    this.bars = new VGroup();
    const baseY = this._valueToY(Math.max(0, this._yRange[0]));

    for (let groupIdx = 0; groupIdx < this._numGroups; groupIdx++) {
      for (let seriesIdx = 0; seriesIdx < this._numSeries; seriesIdx++) {
        const value = this._values[seriesIdx][groupIdx];
        const barHeight = this._valueToY(value) - baseY;
        const centerX = this._barCenterX(groupIdx, seriesIdx);

        // Handle negative values
        const barY = value >= 0 ? baseY + barHeight / 2 : baseY + barHeight / 2;

        const bar = new Rectangle({
          width: this._barWidth,
          height: Math.abs(barHeight) || 0.01, // Minimum height for zero values
          center: [centerX, barY, 0],
          color: this._getBarColor(seriesIdx),
          fillOpacity: this._barFillOpacity,
          strokeWidth: this._barStrokeWidth,
        });

        this.bars.add(bar);
      }
    }
  }

  /**
   * Create x-axis labels
   */
  private _createXLabels(): void {
    this.xLabels = new VGroup();
    const baseY = this._valueToY(Math.max(0, this._yRange[0]));

    for (let i = 0; i < this._numGroups; i++) {
      const labelText = this._xLabelTexts[i] || `${i + 1}`;
      const label = new Text({
        text: labelText,
        fontSize: this._xLabelFontSize,
        color: this._axisColor,
      });

      const centerX = this._groupCenterX(i);
      label.moveTo([centerX, baseY - 0.4, 0]);
      this.xLabels.add(label);
    }
  }

  /**
   * Create y-axis labels
   */
  private _createYLabels(): void {
    this.yLabels = new VGroup();

    if (!this._includeYLabels) return;

    const [yMin, yMax, step] = this._yRange;
    const epsilon = step * 0.0001;

    for (let value = yMin; value <= yMax + epsilon; value += step) {
      const roundedValue = Math.round(value / step) * step;
      const y = this._valueToY(roundedValue);

      // Format the number (remove trailing zeros after decimal)
      const labelText = Number.isInteger(roundedValue)
        ? roundedValue.toString()
        : roundedValue.toFixed(1).replace(/\.?0+$/, '');

      const label = new Text({
        text: labelText,
        fontSize: this._yLabelFontSize,
        color: this._axisColor,
        textAlign: 'right',
      });

      label.moveTo([-0.3, y, 0]);
      this.yLabels.add(label);
    }
  }

  /**
   * Create legend for grouped bar charts
   */
  private _createLegend(): VGroup {
    const legend = new VGroup();
    const legendX = this._width + 0.5;
    const legendY = this._height - 0.5;
    const itemHeight = 0.4;

    for (let i = 0; i < this._seriesNames.length; i++) {
      const color = this._getBarColor(i);
      const y = legendY - i * itemHeight;

      // Color swatch
      const swatch = new Rectangle({
        width: 0.3,
        height: 0.2,
        center: [legendX, y, 0],
        color,
        fillOpacity: this._barFillOpacity,
        strokeWidth: 1,
      });

      // Label
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

  /**
   * Get the current values
   */
  getValues(): number[][] {
    return this._values.map(series => [...series]);
  }

  /**
   * Get a flat array of values (for single series charts)
   */
  getValuesFlat(): number[] {
    if (this._numSeries === 1) {
      return [...this._values[0]];
    }
    return this._values.flat();
  }

  /**
   * Change bar values with animation support
   *
   * This method updates the bar heights to reflect new values.
   * For animations, use this with a Transform animation.
   *
   * @param newValues - New values for the bars
   * @returns The bars VGroup with updated heights (useful for animations)
   *
   * @example
   * ```typescript
   * // Direct update
   * chart.changeBarValues([5, 3, 8, 2]);
   *
   * // With animation (using scene.play)
   * const newChart = chart.copy();
   * newChart.changeBarValues([5, 3, 8, 2]);
   * scene.play(new Transform(chart, newChart));
   * ```
   */
  changeBarValues(newValues: number[] | number[][]): VGroup {
    // Normalize new values
    const normalizedValues = this._normalizeValues(newValues);

    // Update internal values
    this._values = normalizedValues;

    // Recalculate y-range if values exceed current range
    const [yMin, yMax] = this._yRange;
    let needsNewRange = false;
    for (const series of this._values) {
      for (const val of series) {
        if (val < yMin || val > yMax) {
          needsNewRange = true;
          break;
        }
      }
      if (needsNewRange) break;
    }

    if (needsNewRange) {
      this._yRange = this._calculateYRange();
      // Recreate y-axis and labels for new range
      this.remove(this.yAxis);
      this.yAxis = this._createYAxis();
      this.add(this.yAxis);

      this.remove(this.yLabels);
      this._createYLabels();
      this.add(this.yLabels);
    }

    // Update bar heights
    const baseY = this._valueToY(Math.max(0, this._yRange[0]));
    let barIndex = 0;

    for (let groupIdx = 0; groupIdx < this._numGroups; groupIdx++) {
      for (let seriesIdx = 0; seriesIdx < this._numSeries; seriesIdx++) {
        const value = this._values[seriesIdx][groupIdx];
        const barHeight = this._valueToY(value) - baseY;
        const centerX = this._barCenterX(groupIdx, seriesIdx);
        const barY = value >= 0 ? baseY + barHeight / 2 : baseY + barHeight / 2;

        const bar = this.bars.get(barIndex) as Rectangle;
        if (bar) {
          bar.setHeight(Math.abs(barHeight) || 0.01);
          bar.setRectCenter([centerX, barY, 0]);
        }
        barIndex++;
      }
    }

    this._markDirty();
    return this.bars;
  }

  /**
   * Get a specific bar by group and series index
   * @param groupIndex - The group/category index
   * @param seriesIndex - The series index (default 0 for single series)
   * @returns The Rectangle bar, or undefined if not found
   */
  getBar(groupIndex: number, seriesIndex: number = 0): Rectangle | undefined {
    const barIndex = groupIndex * this._numSeries + seriesIndex;
    return this.bars.get(barIndex) as Rectangle | undefined;
  }

  /**
   * Get all bars for a specific series
   * @param seriesIndex - The series index
   * @returns VGroup containing the bars for that series
   */
  getSeriesBars(seriesIndex: number): VGroup {
    const seriesBars = new VGroup();
    for (let i = 0; i < this._numGroups; i++) {
      const bar = this.getBar(i, seriesIndex);
      if (bar) {
        seriesBars.add(bar);
      }
    }
    return seriesBars;
  }

  /**
   * Get the height of the chart area
   */
  getHeight(): number {
    return this._height;
  }

  /**
   * Get the width of the chart area
   */
  getWidth(): number {
    return this._width;
  }

  /**
   * Get the y-axis range
   */
  getYRange(): [number, number, number] {
    return [...this._yRange];
  }

  /**
   * Get the number of bar groups
   */
  getNumGroups(): number {
    return this._numGroups;
  }

  /**
   * Get the number of series
   */
  getNumSeries(): number {
    return this._numSeries;
  }

  /**
   * Set bar colors
   * @param colors - New colors (single color or array)
   * @returns this for chaining
   */
  setBarColors(colors: string | string[]): this {
    this._barColors = Array.isArray(colors) ? colors : [colors];

    // Update existing bars
    let barIndex = 0;
    for (let groupIdx = 0; groupIdx < this._numGroups; groupIdx++) {
      for (let seriesIdx = 0; seriesIdx < this._numSeries; seriesIdx++) {
        const bar = this.bars.get(barIndex) as Rectangle;
        if (bar) {
          bar.setColor(this._getBarColor(seriesIdx));
        }
        barIndex++;
      }
    }

    this._markDirty();
    return this;
  }

  /**
   * Set bar fill opacity
   * @param opacity - Fill opacity (0-1)
   * @returns this for chaining
   */
  setBarFillOpacity(opacity: number): this {
    this._barFillOpacity = opacity;
    this.bars.setFillOpacity(opacity);
    return this;
  }

  /**
   * Create a copy of this BarChart
   */
  protected override _createCopy(): BarChart {
    return new BarChart({
      values: this.getValues(),
      barWidth: this._barWidth,
      barGap: this._barGap,
      groupGap: this._groupGap,
      barColors: this._barColors,
      barFillOpacity: this._barFillOpacity,
      barStrokeWidth: this._barStrokeWidth,
      xLabels: [...this._xLabelTexts],
      xLabelFontSize: this._xLabelFontSize,
      yRange: [...this._yRange],
      height: this._height,
      width: this._width,
      axisColor: this._axisColor,
      includeYTicks: this._includeYTicks,
      includeYLabels: this._includeYLabels,
      yLabelFontSize: this._yLabelFontSize,
      seriesNames: [...this._seriesNames],
      showLegend: this._showLegend,
    });
  }
}

export default BarChart;
