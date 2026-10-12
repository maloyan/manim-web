/**
 * Pure statistics helpers for the statistical plot suite.
 *
 * These functions are side-effect free and operate on plain number arrays.
 * They are reused by Histogram, ScatterPlot, BoxPlot and ViolinPlot.
 *
 * Degenerate inputs never throw:
 * - Empty data returns NaN for scalar reducers and empty results for binning.
 * - All-equal data returns a zero inter-quartile range and a zero-width spread.
 */

/** One bin of a histogram. */
export interface HistogramBin {
  /** Left edge of the bin (inclusive). */
  x0: number;
  /** Right edge of the bin (exclusive, except the last bin which is inclusive). */
  x1: number;
  /** Number of data values that fall in the bin. */
  count: number;
  /** Probability density: count / (total * binWidth). Area over all bins is 1. */
  density: number;
}

/** Options for {@link histogramBins}. */
export interface HistogramBinsOptions {
  /** Number of equal-width bins. Ignored when binEdges is given. Default: 10 */
  bins?: number;
  /** Explicit bin edges (length n+1 for n bins). Overrides bins. */
  binEdges?: number[];
}

/** Options for {@link kde}. */
export interface KdeOptions {
  /** Kernel bandwidth. Default: Silverman's rule of thumb. */
  bandwidth?: number;
}

/**
 * Arithmetic mean of the data.
 * @returns NaN when data is empty.
 */
export function mean(data: number[]): number {
  if (data.length === 0) return NaN;
  let sum = 0;
  for (const value of data) sum += value;
  return sum / data.length;
}

/**
 * Standard deviation of the data.
 * @param sample - When true, divide by n-1 (sample). Default: false (population).
 * @returns NaN when data is empty. 0 for a single population value.
 */
export function stdDev(data: number[], sample = false): number {
  if (data.length === 0) return NaN;
  if (data.length === 1) return sample ? NaN : 0;
  const mu = mean(data);
  let acc = 0;
  for (const value of data) {
    const diff = value - mu;
    acc += diff * diff;
  }
  const divisor = sample ? data.length - 1 : data.length;
  return Math.sqrt(acc / divisor);
}

/**
 * Linear-interpolated quantile (the numpy / R type-7 definition).
 * @param data - The sample values (not required to be sorted).
 * @param q - Quantile in [0, 1]. Values outside are clamped.
 * @returns NaN when data is empty.
 */
export function quantile(data: number[], q: number): number {
  if (data.length === 0) return NaN;
  const clamped = Math.min(1, Math.max(0, q));
  const sorted = [...data].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const h = (sorted.length - 1) * clamped;
  const lo = Math.floor(h);
  const hi = Math.min(lo + 1, sorted.length - 1);
  return sorted[lo] + (h - lo) * (sorted[hi] - sorted[lo]);
}

/**
 * Inter-quartile range: quantile(0.75) - quantile(0.25).
 * @returns NaN when data is empty. 0 when all values are equal.
 */
export function iqr(data: number[]): number {
  if (data.length === 0) return NaN;
  return quantile(data, 0.75) - quantile(data, 0.25);
}

/**
 * Bin raw data into a histogram.
 *
 * With computed edges, every value lands in a bin and the counts sum to the
 * data length. The last bin includes its right edge. With explicit binEdges,
 * values outside the edge range are dropped.
 *
 * @returns An array of bins, left to right. Empty when data is empty and no
 *   explicit edges are given.
 */
export function histogramBins(data: number[], options: HistogramBinsOptions = {}): HistogramBin[] {
  const { bins = 10, binEdges } = options;
  const edges = binEdges ? [...binEdges] : computeEdges(data, bins);
  if (edges.length < 2) return [];

  const counts = new Array<number>(edges.length - 1).fill(0);
  const total = data.length;
  const lastIndex = counts.length - 1;

  for (const value of data) {
    if (value < edges[0] || value > edges[edges.length - 1]) continue;
    let index = binIndexOf(value, edges);
    if (index < 0) index = 0;
    if (index > lastIndex) index = lastIndex;
    counts[index] += 1;
  }

  return counts.map((count, i) => {
    const x0 = edges[i];
    const x1 = edges[i + 1];
    const width = x1 - x0;
    const density = total > 0 && width > 0 ? count / (total * width) : 0;
    return { x0, x1, count, density };
  });
}

/**
 * Compute n+1 equal-width edges that span the data range.
 * All-equal data gets a unit-wide range centred on the value.
 */
function computeEdges(data: number[], bins: number): number[] {
  const nbins = Math.max(1, Math.floor(bins));
  if (data.length === 0) return [];
  let min = data[0];
  let max = data[0];
  for (const value of data) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === max) {
    min -= 0.5;
    max += 0.5;
  }
  const width = (max - min) / nbins;
  const edges = new Array<number>(nbins + 1);
  for (let i = 0; i <= nbins; i++) edges[i] = min + i * width;
  edges[nbins] = max; // guard against floating-point drift on the last edge
  return edges;
}

/** Find the bin index of a value given sorted edges (right edge exclusive). */
function binIndexOf(value: number, edges: number[]): number {
  for (let i = 0; i < edges.length - 1; i++) {
    if (value >= edges[i] && value < edges[i + 1]) return i;
  }
  // value equals the final right edge
  return edges.length - 2;
}

/**
 * Smallest and largest values in an array.
 * @returns [0, 0] when the array is empty.
 */
export function extent(values: number[]): [number, number] {
  if (values.length === 0) return [0, 0];
  let min = values[0];
  let max = values[0];
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return [min, max];
}

/**
 * Build a padded [min, max, step] axis range that covers [dataMin, dataMax].
 *
 * The range is padded by 5% on each side. Equal or reversed bounds expand to a
 * unit-wide window so a plot axis is never zero-width. The step divides the
 * padded span into about `divisions` ticks.
 *
 * @param dataMin - Smallest data value.
 * @param dataMax - Largest data value.
 * @param divisions - Target tick count. Default: 5
 */
export function niceAxisRange(
  dataMin: number,
  dataMax: number,
  divisions = 5,
): [number, number, number] {
  let min = dataMin;
  let max = dataMax;
  if (!(max > min)) {
    min = dataMin - 1;
    max = dataMax + 1;
  }
  const pad = (max - min) * 0.05;
  const lo = min - pad;
  const hi = max + pad;
  const step = (hi - lo) / Math.max(1, divisions);
  return [lo, hi, step];
}

/** Standard normal density, used as the KDE kernel. */
function gaussianKernel(u: number): number {
  return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

/**
 * Silverman's rule-of-thumb bandwidth: 1.06 * sigma * n^(-1/5).
 * @returns 0 when data has fewer than 2 points or zero spread.
 */
export function silvermanBandwidth(data: number[]): number {
  if (data.length < 2) return 0;
  const sigma = stdDev(data);
  if (!(sigma > 0)) return 0;
  return 1.06 * sigma * Math.pow(data.length, -1 / 5);
}

/**
 * Build a Gaussian kernel-density estimator for the data.
 *
 * @returns A function that evaluates the estimated density at a point. The
 *   estimator returns 0 everywhere when data is empty. Zero-spread data uses a
 *   tiny positive bandwidth so the estimator stays finite and never divides by
 *   zero.
 */
export function kde(data: number[], options: KdeOptions = {}): (x: number) => number {
  if (data.length === 0) return () => 0;
  const auto = silvermanBandwidth(data);
  const requested = options.bandwidth ?? auto;
  const bandwidth = requested > 0 ? requested : 1e-9;
  const n = data.length;
  return (x: number): number => {
    let sum = 0;
    for (const xi of data) sum += gaussianKernel((x - xi) / bandwidth);
    return sum / (n * bandwidth);
  };
}

/**
 * Compute box-plot summary statistics for one group of data.
 *
 * The whiskers extend to the most extreme data values still inside
 * [Q1 - factor*IQR, Q3 + factor*IQR]. Values beyond the whiskers are outliers.
 */
export interface BoxSummary {
  /** First quartile (25th percentile). */
  q1: number;
  /** Median (50th percentile). */
  median: number;
  /** Third quartile (75th percentile). */
  q3: number;
  /** Inter-quartile range (Q3 - Q1). */
  iqr: number;
  /** Lower whisker end (smallest datum >= Q1 - factor*IQR). */
  whiskerLow: number;
  /** Upper whisker end (largest datum <= Q3 + factor*IQR). */
  whiskerHigh: number;
  /** Data values outside the whiskers. */
  outliers: number[];
}

/**
 * Summarise a data group for a box plot.
 * @param factor - Whisker length as a multiple of the IQR. Default: 1.5
 * @returns A summary whose fields are NaN and whose outliers are empty when
 *   data is empty.
 */
export function boxSummary(data: number[], factor = 1.5): BoxSummary {
  if (data.length === 0) {
    return {
      q1: NaN,
      median: NaN,
      q3: NaN,
      iqr: NaN,
      whiskerLow: NaN,
      whiskerHigh: NaN,
      outliers: [],
    };
  }
  const q1 = quantile(data, 0.25);
  const median = quantile(data, 0.5);
  const q3 = quantile(data, 0.75);
  const spread = q3 - q1;
  const lowFence = q1 - factor * spread;
  const highFence = q3 + factor * spread;

  let whiskerLow = Infinity;
  let whiskerHigh = -Infinity;
  const outliers: number[] = [];
  for (const value of data) {
    if (value < lowFence || value > highFence) {
      outliers.push(value);
      continue;
    }
    if (value < whiskerLow) whiskerLow = value;
    if (value > whiskerHigh) whiskerHigh = value;
  }
  // When every value is an outlier (impossible for finite data, but guard
  // anyway) fall back to the quartiles.
  if (!Number.isFinite(whiskerLow)) whiskerLow = q1;
  if (!Number.isFinite(whiskerHigh)) whiskerHigh = q3;

  return { q1, median, q3, iqr: spread, whiskerLow, whiskerHigh, outliers };
}
