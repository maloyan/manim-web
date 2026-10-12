import { Group } from '../../core/Group';
import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { Axes } from './Axes';
import { histogramBins, niceAxisRange, type HistogramBin } from './stats';
import { BLUE } from '../../constants/colors';

/** Options for creating a Histogram. */
export interface HistogramOptions {
  /** The raw data values to bin. */
  data: number[];
  /** Number of equal-width bins. Ignored when binEdges is given. Default: 10 */
  bins?: number;
  /** Explicit bin edges (length n+1 for n bins). Overrides bins. */
  binEdges?: number[];
  /** Plot bar height as probability density instead of count. Default: false */
  density?: boolean;
  /** Plot bar height as relative frequency (count / N). Ignored if density. Default: false */
  normalize?: boolean;
  /** Fill color for the bars. Default: Manim's blue */
  color?: string;
  /** Fill opacity for the bars. Default: 0.75 */
  fillOpacity?: number;
  /** Stroke width for the bar outlines. Default: 1 */
  strokeWidth?: number;
  /** An existing Axes to draw onto. When omitted, one is built from the bins. */
  axes?: Axes;
  /** Visual length of the x-axis when auto-building axes. Default: 8 */
  xLength?: number;
  /** Visual length of the y-axis when auto-building axes. Default: 6 */
  yLength?: number;
  /** Color for the axes when auto-building. Default: '#ffffff' */
  axisColor?: string;
}

/**
 * Histogram - bars over an x-axis from binned raw data.
 *
 * The raw data is binned into equal-width bins (or the given explicit edges).
 * Bar height is the bin count, the relative frequency, or the probability
 * density. When no Axes is supplied, one is built to fit the bins.
 *
 * @example
 * ```typescript
 * const hist = new Histogram({
 *   data: [1, 2, 2, 3, 3, 3, 4, 4, 5],
 *   bins: 5,
 *   density: true,
 * });
 * ```
 */
export class Histogram extends Group {
  /** The coordinate system the bars are drawn on. */
  axes: Axes;
  /** The rectangular bars, one per bin, left to right. */
  bars: VGroup;

  protected _data: number[];
  protected _bins: HistogramBin[];

  constructor(options: HistogramOptions) {
    super();

    const {
      data,
      bins = 10,
      binEdges,
      density = false,
      normalize = false,
      color = BLUE,
      fillOpacity = 0.75,
      strokeWidth = 1,
      axes,
      xLength = 8,
      yLength = 6,
      axisColor = '#ffffff',
    } = options;

    this._data = [...data];
    this._bins = histogramBins(this._data, { bins, binEdges });

    const heights = this._bins.map((bin) => this._barHeight(bin, density, normalize));
    const maxHeight = heights.reduce((acc, h) => Math.max(acc, h), 0);

    const xMin = this._bins.length > 0 ? this._bins[0].x0 : 0;
    const xMax = this._bins.length > 0 ? this._bins[this._bins.length - 1].x1 : 1;

    this.axes =
      axes ??
      new Axes({
        xRange: niceAxisRange(xMin, xMax),
        yRange: [0, maxHeight > 0 ? maxHeight : 1, (maxHeight > 0 ? maxHeight : 1) / 5],
        xLength,
        yLength,
        color: axisColor,
        tips: false,
      });

    this.bars = new VGroup();
    for (let i = 0; i < this._bins.length; i++) {
      const bin = this._bins[i];
      const height = heights[i];
      const left = this.axes.coordsToPoint(bin.x0, 0);
      const right = this.axes.coordsToPoint(bin.x1, 0);
      const top = this.axes.coordsToPoint(bin.x0, height);
      const worldWidth = Math.abs(right[0] - left[0]);
      const worldHeight = Math.abs(top[1] - left[1]);
      const bar = new Rectangle({
        width: worldWidth,
        height: worldHeight || 0.0001,
        center: [(left[0] + right[0]) / 2, (left[1] + top[1]) / 2, left[2]],
        color,
        fillOpacity,
        strokeWidth,
      });
      this.bars.add(bar);
    }

    this.add(this.axes);
    this.add(this.bars);
  }

  /** Map a bin to its bar height given the count/frequency/density mode. */
  private _barHeight(bin: HistogramBin, density: boolean, normalize: boolean): number {
    if (density) return bin.density;
    if (normalize) return this._data.length > 0 ? bin.count / this._data.length : 0;
    return bin.count;
  }

  /** Get the coordinate system. */
  getAxes(): Axes {
    return this.axes;
  }

  /** Get the group of bars. */
  getBars(): VGroup {
    return this.bars;
  }

  /** Get a single bar by bin index, or undefined when out of range. */
  getBar(index: number): Rectangle | undefined {
    return this.bars.get(index) as Rectangle | undefined;
  }

  /** Get the computed bins (edges, counts, density). */
  getBins(): HistogramBin[] {
    return this._bins.map((bin) => ({ ...bin }));
  }

  /** The number of bins. */
  get numBins(): number {
    return this._bins.length;
  }

  override copy(): Histogram {
    const copy = new Histogram({ data: [...this._data], bins: this._bins.length || 10 });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
