import { FunctionGraph, type FunctionGraphOptions } from './FunctionGraph';
import { fourierSeriesApproximation } from './fourier';

/**
 * Options for {@link FourierSeries}.
 */
export interface FourierSeriesOptions {
  /** The target real periodic function to approximate, `y = f(x)`. */
  func: (x: number) => number;
  /** Number of harmonics kept, chosen by amplitude. Default: all sampled terms. */
  numTerms?: number;
  /** Length of one period of {@link func}. Default `2π`. */
  period?: number;
  /** Start of the sampled period. Default: the graph's `xRange[0]`, else `0`. */
  periodStart?: number;
  /** Samples used to compute the Fourier coefficients. Default `256`. */
  coefficientSamples?: number;
  /** X range for the plotted curve as `[min, max]`. */
  xRange?: [number, number];
  /** Stroke color. Default `'#58c4dd'`. */
  color?: string;
  /** Stroke width in pixels. Default `2`. */
  strokeWidth?: number;
  /** Samples used to draw the curve. Default `200`. */
  numSamples?: number;
  /** Reference axes for coordinate transformation. */
  axes?: FunctionGraphOptions['axes'];
}

/**
 * FourierSeries - the truncated Fourier partial sum of a function, as a graph.
 *
 * Computes the discrete Fourier coefficients of a real periodic function,
 * keeps the `numTerms` largest harmonics, and plots the resulting partial-sum
 * approximation `y = f_N(x)` like a {@link FunctionGraph}. As `numTerms` grows,
 * the curve converges to the target function.
 *
 * @example
 * ```typescript
 * // Approximate a square wave with 7 harmonics over [-π, π].
 * const square = (x: number) => (Math.sin(x) >= 0 ? 1 : -1);
 * const series = new FourierSeries({
 *   func: square,
 *   numTerms: 7,
 *   period: 2 * Math.PI,
 *   xRange: [-Math.PI, Math.PI],
 *   axes,
 * });
 * ```
 */
export class FourierSeries extends FunctionGraph {
  private _targetFunc: (x: number) => number;
  private _numTerms: number | undefined;
  private _period: number;

  constructor(options: FourierSeriesOptions) {
    const period = options.period ?? Math.PI * 2;
    const periodStart = options.periodStart ?? options.xRange?.[0] ?? 0;

    const approximation = fourierSeriesApproximation(options.func, {
      period,
      start: periodStart,
      numTerms: options.numTerms,
      numSamples: options.coefficientSamples ?? 256,
    });

    super({
      func: approximation,
      xRange: options.xRange,
      color: options.color,
      strokeWidth: options.strokeWidth,
      numSamples: options.numSamples ?? 200,
      axes: options.axes,
    });

    this._targetFunc = options.func;
    this._numTerms = options.numTerms;
    this._period = period;
  }

  /** The target function this series approximates. */
  getTargetFunction(): (x: number) => number {
    return this._targetFunc;
  }

  /** The number of harmonics requested (`undefined` means all sampled terms). */
  getNumTerms(): number | undefined {
    return this._numTerms;
  }

  /** The period used to compute the coefficients. */
  getPeriod(): number {
    return this._period;
  }
}
