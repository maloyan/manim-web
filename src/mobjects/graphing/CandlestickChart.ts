import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';
import { Text } from '../text/Text';
import { NumberLine, NumberLineOptions } from './NumberLine';
import { GREEN, RED, WHITE } from '../../constants/colors';

/**
 * One open/high/low/close data point for a CandlestickChart.
 */
export interface OHLC {
  /** Opening price. */
  open: number;
  /** Highest price in the period. */
  high: number;
  /** Lowest price in the period. */
  low: number;
  /** Closing price. */
  close: number;
  /** Optional date or category label for the x-axis. */
  date?: string;
  /** Optional free-form label for the x-axis (overrides date). */
  label?: string;
  /** Optional traded volume, shown when showVolume is true. */
  volume?: number;
}

/**
 * Options for creating a CandlestickChart.
 */
export interface CandlestickChartOptions {
  /** Array of OHLC data points, left to right. */
  data: OHLC[];
  /** Fill/stroke color for bullish candles (close >= open). Default: GREEN. */
  bullishColor?: string;
  /** Fill/stroke color for bearish candles (close < open). Default: RED. */
  bearishColor?: string;
  /** Width of each candle body. Default: 0.5 */
  candleWidth?: number;
  /** Gap between adjacent candles. Default: 0.2 */
  candleSpacing?: number;
  /** Stroke width of the high/low wick line. Default: 2 */
  wickWidth?: number;
  /** Stroke width of the candle body outline. Default: 1.5 */
  bodyStrokeWidth?: number;
  /** Fill opacity of the candle body. Default: 0.9 */
  bodyFillOpacity?: number;
  /** Y-axis (price) range as [min, max, step]. Default: auto-scaled from data. */
  yRange?: [number, number, number];
  /** Visual height of the price area. Default: 5 */
  height?: number;
  /** Visual width of the chart area. Default: 8 */
  width?: number;
  /** Color for the axes and labels. Default: WHITE */
  axisColor?: string;
  /** Whether to include y-axis tick marks. Default: true */
  includeYTicks?: boolean;
  /** Whether to include y-axis price labels. Default: true */
  includeYLabels?: boolean;
  /** Font size for y-axis labels. Default: 20 */
  yLabelFontSize?: number;
  /** Explicit x-axis labels (overrides date/label on the data). Default: [] */
  xLabels?: string[];
  /** Font size for x-axis labels. Default: 20 */
  xLabelFontSize?: number;
  /** Whether to draw volume bars below the price area. Default: false */
  showVolume?: boolean;
  /** Visual height of the volume area. Default: 1 */
  volumeHeight?: number;
}

/** Minimum body height, so a doji (open == close) stays visible. */
const MIN_BODY_HEIGHT = 0.03;
/** Vertical gap between the price baseline and the volume area. */
const VOLUME_GAP = 0.5;

/**
 * CandlestickChart - A financial candlestick / OHLC chart mobject.
 *
 * Renders each period as a body rectangle that spans open to close, plus a
 * high/low wick line. Bullish periods (close >= open) and bearish periods
 * (close < open) use separate colors. The price y-axis auto-scales to the data
 * unless an explicit range is given. Optional volume bars render below.
 *
 * The chart is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const chart = new CandlestickChart({
 *   data: [
 *     { open: 10, high: 15, low: 8, close: 14, date: 'Mon' },
 *     { open: 14, high: 16, low: 11, close: 12, date: 'Tue' },
 *   ],
 *   showVolume: true,
 * });
 * scene.play(new Create(chart));
 * ```
 */
export class CandlestickChart extends VGroup {
  /** The candle VGroups (each holds a body Rectangle and a wick Line). */
  candles: VGroup;
  /** The volume bars, when showVolume is enabled. */
  volumeBars: VGroup;
  /** The price y-axis. */
  yAxis: NumberLine;
  /** The x-axis baseline. */
  xAxisLine: VMobject;
  /** X-axis labels. */
  xLabels: VGroup;
  /** Y-axis labels. */
  yLabels: VGroup;

  protected _data: OHLC[];
  protected _bullishColor: string;
  protected _bearishColor: string;
  protected _candleWidth: number;
  protected _candleSpacing: number;
  protected _wickWidth: number;
  protected _bodyStrokeWidth: number;
  protected _bodyFillOpacity: number;
  protected _yRange: [number, number, number];
  protected _height: number;
  protected _width: number;
  protected _axisColor: string;
  protected _includeYTicks: boolean;
  protected _includeYLabels: boolean;
  protected _yLabelFontSize: number;
  protected _xLabelTexts: string[];
  protected _xLabelFontSize: number;
  protected _showVolume: boolean;
  protected _volumeHeight: number;
  /** Horizontal shift applied by _recenter(), folded into x coordinates. */
  protected _xShift = 0;
  /** Vertical shift applied by _recenter(), folded into priceToY. */
  protected _yShift = 0;

  constructor(options: CandlestickChartOptions) {
    super();

    const {
      data,
      bullishColor = GREEN,
      bearishColor = RED,
      candleWidth = 0.5,
      candleSpacing = 0.2,
      wickWidth = 2,
      bodyStrokeWidth = 1.5,
      bodyFillOpacity = 0.9,
      yRange,
      height = 5,
      width = 8,
      axisColor = WHITE,
      includeYTicks = true,
      includeYLabels = true,
      yLabelFontSize = 20,
      xLabels = [],
      xLabelFontSize = 20,
      showVolume = false,
      volumeHeight = 1,
    } = options;

    this._data = [...data];
    this._bullishColor = bullishColor;
    this._bearishColor = bearishColor;
    this._candleWidth = candleWidth;
    this._candleSpacing = candleSpacing;
    this._wickWidth = wickWidth;
    this._bodyStrokeWidth = bodyStrokeWidth;
    this._bodyFillOpacity = bodyFillOpacity;
    this._height = height;
    this._width = width;
    this._axisColor = axisColor;
    this._includeYTicks = includeYTicks;
    this._includeYLabels = includeYLabels;
    this._yLabelFontSize = yLabelFontSize;
    this._xLabelTexts = xLabels;
    this._xLabelFontSize = xLabelFontSize;
    this._showVolume = showVolume;
    this._volumeHeight = volumeHeight;

    this._yRange = yRange || this._calculateYRange();

    this.candles = new VGroup();
    this.volumeBars = new VGroup();
    this.xLabels = new VGroup();
    this.yLabels = new VGroup();

    this.yAxis = this._createYAxis();
    this.xAxisLine = this._createXAxisLine();
    this._createCandles();
    this._createXLabels();
    this._createYLabels();

    this.add(this.yAxis);
    this.add(this.xAxisLine);
    this.add(this.candles);
    this.add(this.xLabels);
    this.add(this.yLabels);

    if (this._showVolume) {
      this._createVolumeBars();
      this.add(this.volumeBars);
    }

    // Center the whole chart on the origin. The parts are built in a
    // bottom-left-origin local frame (x in [0, width], price area in
    // [0, height]), so without this the chart sits in the top-right quadrant
    // and runs off the right/top of the default 14.22 x 8 frame (#candlestick
    // off-screen). priceToY and the x-column helper fold the same shift in, so
    // every accessor still reports a candle's real on-screen position.
    this._recenter();
  }

  /**
   * Shift the built geometry so the chart's bounding box is centered on the
   * origin, and record the shift so priceToY / candle-column coordinates stay
   * consistent with the on-screen positions.
   */
  private _recenter(): void {
    if (this.children.length === 0) return;
    const center = this.getCenter();
    this._xShift -= center[0];
    this._yShift -= center[1];
    this.shift([-center[0], -center[1], 0]);
  }

  /** Whether a period is bullish (close at or above open). */
  private _isBullish(point: OHLC): boolean {
    return point.close >= point.open;
  }

  /** Color for a period, by direction. */
  private _candleColor(point: OHLC): string {
    return this._isBullish(point) ? this._bullishColor : this._bearishColor;
  }

  /**
   * Auto-scale the price range from the data lows and highs.
   */
  private _calculateYRange(): [number, number, number] {
    if (this._data.length === 0) return [0, 1, 1];

    let minLow = Infinity;
    let maxHigh = -Infinity;
    for (const point of this._data) {
      if (point.low < minLow) minLow = point.low;
      if (point.high > maxHigh) maxHigh = point.high;
    }

    const range = maxHigh - minLow;
    const padding = range * 0.05 || 1;
    const yMin = minLow - padding;
    const yMax = maxHigh + padding;

    const rawStep = (yMax - yMin) / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;

    return [yMin, yMax, step];
  }

  /**
   * Convert a price to its y-coordinate within the price area.
   */
  priceToY(price: number): number {
    const [yMin, yMax] = this._yRange;
    const range = yMax - yMin;
    if (range === 0) return this._yShift;
    return ((price - yMin) / range) * this._height + this._yShift;
  }

  /**
   * X-coordinate of the center column for candle i.
   */
  private _candleCenterX(index: number): number {
    const count = this._data.length;
    const slot = this._candleWidth + this._candleSpacing;
    const totalWidth =
      count > 0 ? count * this._candleWidth + (count - 1) * this._candleSpacing : 0;
    const startX = (this._width - totalWidth) / 2 + this._candleWidth / 2;
    return startX + index * slot + this._xShift;
  }

  /**
   * Create the price y-axis.
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
   * Create the x-axis baseline at the bottom of the price area.
   */
  private _createXAxisLine(): VMobject {
    const line = new VMobject();
    const y = 0;
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

  /**
   * Build one candle (body rectangle + wick line) per data point.
   */
  private _createCandles(): void {
    this.candles = new VGroup();

    for (let i = 0; i < this._data.length; i++) {
      const point = this._data[i];
      const color = this._candleColor(point);
      const centerX = this._candleCenterX(i);

      const bodyTop = this.priceToY(Math.max(point.open, point.close));
      const bodyBottom = this.priceToY(Math.min(point.open, point.close));
      const rawHeight = bodyTop - bodyBottom;
      const bodyHeight = Math.max(rawHeight, MIN_BODY_HEIGHT);
      const bodyCenterY = (bodyTop + bodyBottom) / 2;

      const body = new Rectangle({
        width: this._candleWidth,
        height: bodyHeight,
        center: [centerX, bodyCenterY, 0],
        color,
        fillOpacity: this._bodyFillOpacity,
        strokeWidth: this._bodyStrokeWidth,
      });

      const wick = new Line({
        start: [centerX, this.priceToY(point.low), 0],
        end: [centerX, this.priceToY(point.high), 0],
        color,
        strokeWidth: this._wickWidth,
      });

      const candle = new VGroup();
      candle.add(wick);
      candle.add(body);
      this.candles.add(candle);
    }
  }

  /**
   * Build volume bars below the price area.
   */
  private _createVolumeBars(): void {
    this.volumeBars = new VGroup();

    let maxVolume = 0;
    for (const point of this._data) {
      const volume = point.volume ?? 0;
      if (volume > maxVolume) maxVolume = volume;
    }
    if (maxVolume <= 0) return;

    const topY = -VOLUME_GAP;
    for (let i = 0; i < this._data.length; i++) {
      const point = this._data[i];
      const volume = point.volume ?? 0;
      const barHeight = (volume / maxVolume) * this._volumeHeight;
      const bar = new Rectangle({
        width: this._candleWidth,
        height: Math.max(barHeight, MIN_BODY_HEIGHT),
        center: [this._candleCenterX(i), topY - barHeight / 2, 0],
        color: this._candleColor(point),
        fillOpacity: this._bodyFillOpacity,
        strokeWidth: this._bodyStrokeWidth,
      });
      this.volumeBars.add(bar);
    }
  }

  /**
   * Create x-axis labels from the explicit option or the data date/label.
   */
  private _createXLabels(): void {
    this.xLabels = new VGroup();

    for (let i = 0; i < this._data.length; i++) {
      const point = this._data[i];
      const labelText = this._xLabelTexts[i] ?? point.label ?? point.date;
      if (labelText === undefined || labelText === '') continue;

      const label = new Text({
        text: labelText,
        fontSize: this._xLabelFontSize,
        color: this._axisColor,
      });
      label.moveTo([this._candleCenterX(i), -0.4, 0]);
      this.xLabels.add(label);
    }
  }

  /**
   * Create y-axis price labels.
   */
  private _createYLabels(): void {
    this.yLabels = new VGroup();
    if (!this._includeYLabels || this._data.length === 0) return;

    const [yMin, yMax, step] = this._yRange;
    if (step <= 0) return;
    const epsilon = step * 0.0001;

    for (let value = yMin; value <= yMax + epsilon; value += step) {
      const roundedValue = Math.round(value / step) * step;
      const y = this.priceToY(roundedValue);

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

  /** Get all candle VGroups. */
  getCandles(): VGroup[] {
    return this.candles.getChildrenAs<VGroup>();
  }

  /**
   * Get a single candle VGroup by index.
   * @returns The candle, or undefined when out of range.
   */
  getCandle(index: number): VGroup | undefined {
    if (index < 0 || index >= this.candles.children.length) return undefined;
    return this.candles.getChildrenAs<VGroup>()[index];
  }

  /**
   * Get the body rectangle of candle i.
   * @returns The body, or undefined when out of range.
   */
  getBody(index: number): Rectangle | undefined {
    const candle = this.getCandle(index);
    return candle?.children[1] as Rectangle | undefined;
  }

  /**
   * Get the wick line of candle i.
   * @returns The wick, or undefined when out of range.
   */
  getWick(index: number): Line | undefined {
    const candle = this.getCandle(index);
    return candle?.children[0] as Line | undefined;
  }

  /** Get all volume bars (empty when showVolume is off). */
  getVolumeBars(): Rectangle[] {
    return this.volumeBars.children as Rectangle[];
  }

  /** Get the price (y-axis) range as [min, max, step]. */
  getYRange(): [number, number, number] {
    return [...this._yRange];
  }

  /** Get the data points. */
  getData(): OHLC[] {
    return this._data.map((point) => ({ ...point }));
  }

  /** Get the visual height of the price area. */
  getChartHeight(): number {
    return this._height;
  }

  /** Get the visual width of the chart area. */
  getChartWidth(): number {
    return this._width;
  }
}
