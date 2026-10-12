import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';
import { Text } from '../text/Text';
import { NumberLine, NumberLineOptions } from './NumberLine';
import { GREEN, RED, BLUE, WHITE } from '../../constants/colors';

/** Minimum bar height, so a zero delta stays visible. */
const MIN_BAR_HEIGHT = 0.03;

/** One rendered bar, resolved from the deltas. */
interface BarSpec {
  /** Running total at the bottom start of the bar. */
  startValue: number;
  /** Running total at the top end of the bar. */
  endValue: number;
  /** Running total carried to the next bar (for the connector level). */
  connectLevel: number;
  /** Fill/stroke color for the bar. */
  color: string;
  /** Label text for the bar, if any. */
  label?: string;
}

/**
 * Options for creating a WaterfallChart.
 */
export interface WaterfallChartOptions {
  /** Sequential contributions (deltas), left to right. */
  values: number[];
  /** Labels for each bar. Default: [] */
  labels?: string[];
  /** Color for positive contributions. Default: GREEN. */
  increaseColor?: string;
  /** Color for negative contributions. Default: RED. */
  decreaseColor?: string;
  /** Color for the total bar. Default: BLUE. */
  totalColor?: string;
  /** Whether to draw connector lines between bars. Default: true */
  showConnectors?: boolean;
  /** Whether to append a total bar spanning 0 to the sum. Default: false */
  showTotal?: boolean;
  /** Label for the appended total bar. Default: 'Total' */
  totalLabel?: string;
  /** Width of each bar. Default: 0.6 */
  barWidth?: number;
  /** Gap between adjacent bars. Default: 0.4 */
  barGap?: number;
  /** Stroke width of the connector lines. Default: 1.5 */
  connectorWidth?: number;
  /** Stroke width of the bar outline. Default: 1.5 */
  barStrokeWidth?: number;
  /** Fill opacity of the bars. Default: 0.9 */
  fillOpacity?: number;
  /** Y-axis range as [min, max, step]. Default: auto-scaled from the running totals. */
  yRange?: [number, number, number];
  /** Visual height of the chart area. Default: 5 */
  height?: number;
  /** Visual width of the chart area. Default: 8 */
  width?: number;
  /** Color for the axes and labels. Default: WHITE */
  axisColor?: string;
  /** Whether to include y-axis tick marks. Default: true */
  includeYTicks?: boolean;
  /** Whether to include y-axis number labels. Default: true */
  includeYLabels?: boolean;
  /** Whether to draw the per-bar labels. Default: true */
  showLabels?: boolean;
  /** Font size for the bar labels. Default: 18 */
  labelFontSize?: number;
  /** Font size for the y-axis labels. Default: 20 */
  yLabelFontSize?: number;
}

/**
 * WaterfallChart - A waterfall (bridge) chart mobject.
 *
 * Shows sequential positive and negative contributions as floating bars. Bar i
 * starts at the running total of the previous bars and spans its own delta.
 * Positive and negative deltas use separate colors. Connector lines join each
 * bar to the next at the running-total level. An optional total bar spans from
 * zero to the final sum.
 *
 * The chart is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const chart = new WaterfallChart({
 *   values: [100, -40, 30, -20, 50],
 *   labels: ['Start', 'Q1', 'Q2', 'Q3', 'Q4'],
 *   showTotal: true,
 * });
 * scene.play(new Create(chart));
 * ```
 */
export class WaterfallChart extends VGroup {
  /** The floating bars (deltas, plus the total bar when enabled). */
  bars: VGroup;
  /** The connector lines between bars. */
  connectors: VGroup;
  /** The y-axis. */
  yAxis: NumberLine;
  /** The baseline at value zero. */
  baseline: VMobject;
  /** Per-bar labels. */
  barLabels: VGroup;
  /** Y-axis labels. */
  yLabels: VGroup;

  protected _values: number[];
  protected _labelTexts: string[];
  protected _increaseColor: string;
  protected _decreaseColor: string;
  protected _totalColor: string;
  protected _showConnectors: boolean;
  protected _showTotal: boolean;
  protected _totalLabel: string;
  protected _barWidth: number;
  protected _barGap: number;
  protected _connectorWidth: number;
  protected _barStrokeWidth: number;
  protected _fillOpacity: number;
  protected _yRange: [number, number, number];
  protected _height: number;
  protected _width: number;
  protected _axisColor: string;
  protected _includeYTicks: boolean;
  protected _includeYLabels: boolean;
  protected _showLabels: boolean;
  protected _labelFontSize: number;
  protected _yLabelFontSize: number;

  protected _specs: BarSpec[];

  constructor(options: WaterfallChartOptions) {
    super();

    const {
      values,
      labels = [],
      increaseColor = GREEN,
      decreaseColor = RED,
      totalColor = BLUE,
      showConnectors = true,
      showTotal = false,
      totalLabel = 'Total',
      barWidth = 0.6,
      barGap = 0.4,
      connectorWidth = 1.5,
      barStrokeWidth = 1.5,
      fillOpacity = 0.9,
      yRange,
      height = 5,
      width = 8,
      axisColor = WHITE,
      includeYTicks = true,
      includeYLabels = true,
      showLabels = true,
      labelFontSize = 18,
      yLabelFontSize = 20,
    } = options;

    this._values = [...values];
    this._labelTexts = labels;
    this._increaseColor = increaseColor;
    this._decreaseColor = decreaseColor;
    this._totalColor = totalColor;
    this._showConnectors = showConnectors;
    this._showTotal = showTotal;
    this._totalLabel = totalLabel;
    this._barWidth = barWidth;
    this._barGap = barGap;
    this._connectorWidth = connectorWidth;
    this._barStrokeWidth = barStrokeWidth;
    this._fillOpacity = fillOpacity;
    this._height = height;
    this._width = width;
    this._axisColor = axisColor;
    this._includeYTicks = includeYTicks;
    this._includeYLabels = includeYLabels;
    this._showLabels = showLabels;
    this._labelFontSize = labelFontSize;
    this._yLabelFontSize = yLabelFontSize;

    this._specs = this._buildSpecs();
    this._yRange = yRange || this._calculateYRange();

    this.bars = new VGroup();
    this.connectors = new VGroup();
    this.barLabels = new VGroup();
    this.yLabels = new VGroup();

    this.yAxis = this._createYAxis();
    this.baseline = this._createBaseline();
    this._createBars();
    if (this._showConnectors) {
      this._createConnectors();
    }
    this._createYLabels();
    if (this._showLabels) {
      this._createBarLabels();
    }

    this.add(this.yAxis);
    this.add(this.baseline);
    this.add(this.connectors);
    this.add(this.bars);
    this.add(this.yLabels);
    this.add(this.barLabels);
  }

  /** Resolve the deltas into ordered bar specs. */
  private _buildSpecs(): BarSpec[] {
    const specs: BarSpec[] = [];
    let running = 0;

    for (let i = 0; i < this._values.length; i++) {
      const delta = this._values[i];
      const start = running;
      const end = running + delta;
      running = end;
      specs.push({
        startValue: start,
        endValue: end,
        connectLevel: end,
        color: delta >= 0 ? this._increaseColor : this._decreaseColor,
        label: this._labelTexts[i],
      });
    }

    if (this._showTotal) {
      specs.push({
        startValue: 0,
        endValue: running,
        connectLevel: running,
        color: this._totalColor,
        label: this._totalLabel,
      });
    }

    return specs;
  }

  /** Auto-scale the y range from every running-total level the bars reach. */
  private _calculateYRange(): [number, number, number] {
    if (this._specs.length === 0) return [0, 1, 1];

    let minVal = 0;
    let maxVal = 0;
    for (const spec of this._specs) {
      minVal = Math.min(minVal, spec.startValue, spec.endValue);
      maxVal = Math.max(maxVal, spec.startValue, spec.endValue);
    }

    const range = maxVal - minVal;
    const padding = range * 0.1 || 1;
    const yMin = minVal < 0 ? minVal - padding : 0;
    const yMax = maxVal + padding;

    const rawStep = (yMax - yMin) / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;

    return [yMin, yMax, step];
  }

  /** Convert a value to its y-coordinate within the chart area. */
  valueToY(value: number): number {
    const [yMin, yMax] = this._yRange;
    const range = yMax - yMin;
    if (range === 0) return 0;
    return ((value - yMin) / range) * this._height;
  }

  /** X-coordinate of the center of bar i. */
  private _barCenterX(index: number): number {
    const count = this._specs.length;
    const slot = this._barWidth + this._barGap;
    const totalWidth = count > 0 ? count * this._barWidth + (count - 1) * this._barGap : 0;
    const startX = (this._width - totalWidth) / 2 + this._barWidth / 2;
    return startX + index * slot;
  }

  /** Create the y-axis. */
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

  /** Create the baseline at value zero. */
  private _createBaseline(): VMobject {
    const line = new VMobject();
    const y = this.valueToY(0);
    const points: number[][] = [
      [0, y, 0],
      [this._width / 3, y, 0],
      [(2 * this._width) / 3, y, 0],
      [this._width, y, 0],
    ];
    line.setPoints3D(points);
    line.color = this._axisColor;
    line.strokeWidth = 2;
    return line;
  }

  /** Build one rectangle per bar spec. */
  private _createBars(): void {
    this.bars = new VGroup();

    for (let i = 0; i < this._specs.length; i++) {
      const spec = this._specs[i];
      const topY = this.valueToY(Math.max(spec.startValue, spec.endValue));
      const bottomY = this.valueToY(Math.min(spec.startValue, spec.endValue));
      const rawHeight = topY - bottomY;
      const barHeight = Math.max(rawHeight, MIN_BAR_HEIGHT);
      const centerY = (topY + bottomY) / 2;

      const bar = new Rectangle({
        width: this._barWidth,
        height: barHeight,
        center: [this._barCenterX(i), centerY, 0],
        color: spec.color,
        fillOpacity: this._fillOpacity,
        strokeWidth: this._barStrokeWidth,
      });
      this.bars.add(bar);
    }
  }

  /** Build the connector lines between adjacent bars. */
  private _createConnectors(): void {
    this.connectors = new VGroup();

    for (let i = 0; i < this._specs.length - 1; i++) {
      const y = this.valueToY(this._specs[i].connectLevel);
      const rightEdge = this._barCenterX(i) + this._barWidth / 2;
      const leftEdge = this._barCenterX(i + 1) - this._barWidth / 2;
      const connector = new Line({
        start: [rightEdge, y, 0],
        end: [leftEdge, y, 0],
        color: this._axisColor,
        strokeWidth: this._connectorWidth,
      });
      this.connectors.add(connector);
    }
  }

  /** Build the y-axis labels. */
  private _createYLabels(): void {
    this.yLabels = new VGroup();
    if (!this._includeYLabels || this._specs.length === 0) return;

    const [yMin, yMax, step] = this._yRange;
    if (step <= 0) return;
    const epsilon = step * 0.0001;

    for (let value = yMin; value <= yMax + epsilon; value += step) {
      const roundedValue = Math.round(value / step) * step;
      const y = this.valueToY(roundedValue);

      const labelText = Number.isInteger(roundedValue)
        ? roundedValue.toString()
        : roundedValue.toFixed(2).replace(/\.?0+$/, '');

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

  /** Build the per-bar labels below the baseline. */
  private _createBarLabels(): void {
    this.barLabels = new VGroup();
    const y = this.valueToY(0) - 0.4;

    for (let i = 0; i < this._specs.length; i++) {
      const labelText = this._specs[i].label;
      if (labelText === undefined || labelText === '') continue;

      const label = new Text({
        text: labelText,
        fontSize: this._labelFontSize,
        color: this._axisColor,
      });
      label.moveTo([this._barCenterX(i), y, 0]);
      this.barLabels.add(label);
    }
  }

  /** Get the group of bars. */
  getBars(): VGroup {
    return this.bars;
  }

  /** Get bar i, or undefined when out of range. */
  getBar(index: number): Rectangle | undefined {
    return this.bars.get(index) as Rectangle | undefined;
  }

  /** Get the group of connector lines. */
  getConnectors(): VGroup {
    return this.connectors;
  }

  /** Get the y-axis range as [min, max, step]. */
  getYRange(): [number, number, number] {
    return [...this._yRange];
  }

  /** Get the deltas. */
  getValues(): number[] {
    return [...this._values];
  }

  /** Get the final running total (sum of all deltas). */
  getTotal(): number {
    return this._values.reduce((a, b) => a + b, 0);
  }

  /** Get the visual height of the chart area. */
  getChartHeight(): number {
    return this._height;
  }

  /** Get the visual width of the chart area. */
  getChartWidth(): number {
    return this._width;
  }

  override copy(): WaterfallChart {
    const clone = new WaterfallChart({
      values: [...this._values],
      labels: [...this._labelTexts],
      increaseColor: this._increaseColor,
      decreaseColor: this._decreaseColor,
      totalColor: this._totalColor,
      showConnectors: this._showConnectors,
      showTotal: this._showTotal,
      totalLabel: this._totalLabel,
      barWidth: this._barWidth,
      barGap: this._barGap,
      connectorWidth: this._connectorWidth,
      barStrokeWidth: this._barStrokeWidth,
      fillOpacity: this._fillOpacity,
      yRange: [...this._yRange],
      height: this._height,
      width: this._width,
      axisColor: this._axisColor,
      includeYTicks: this._includeYTicks,
      includeYLabels: this._includeYLabels,
      showLabels: this._showLabels,
      labelFontSize: this._labelFontSize,
      yLabelFontSize: this._yLabelFontSize,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
