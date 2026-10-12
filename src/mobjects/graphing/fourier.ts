import type { Complex } from './ComplexPlane';

/**
 * A single Fourier coefficient expressed in polar form.
 *
 * The complex coefficient is `amplitude * e^(i * phase)`. In an epicycle
 * drawing each coefficient is one rotating vector: `amplitude` is the circle
 * radius, `phase` is the starting angle, and `freq` is the signed number of
 * turns the vector makes per unit of normalized time `t`.
 */
export interface FourierCoefficient {
  /** Signed integer frequency (…, -2, -1, 0, 1, 2, …), centered around 0. */
  freq: number;
  /** Non-negative magnitude |c_k| (the rotating-vector length / circle radius). */
  amplitude: number;
  /** Phase arg(c_k) in radians, in (-π, π]. */
  phase: number;
}

/** Ordering strategy for the coefficient chain. */
export type FourierOrder = 'amplitude' | 'frequency';

const TWO_PI = Math.PI * 2;

/**
 * Compute the discrete Fourier coefficients of a list of complex samples.
 *
 * Given `N` samples `f[0..N-1]` taken at equal spacing over one period, the
 * coefficient for index `k` is:
 *
 *   c_k = (1 / N) * Σ_n f[n] * e^(-2πi · k · n / N)
 *
 * The returned array has one entry per `k` (DC term first, index `k = 0`).
 * Each entry carries a *centered* signed frequency: indices in the upper half
 * (`k > N/2`) map to the negative frequency `k - N`. Centered frequencies make
 * the vectors rotate in their natural slow-to-fast, alternating-direction
 * order while still reconstructing every sample exactly (see
 * {@link reconstructSample}).
 *
 * @param samples - Complex path samples, equally spaced over one period.
 * @returns One {@link FourierCoefficient} per sample index. Empty input yields `[]`.
 */
export function fourierCoefficients(samples: Complex[]): FourierCoefficient[] {
  const n = samples.length;
  if (n === 0) return [];

  const coefficients: FourierCoefficient[] = [];

  for (let k = 0; k < n; k++) {
    let re = 0;
    let im = 0;

    for (let sampleIndex = 0; sampleIndex < n; sampleIndex++) {
      const theta = (TWO_PI * k * sampleIndex) / n;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const s = samples[sampleIndex];
      // (s.re + i·s.im) · (cos - i·sin)
      re += s.re * cos + s.im * sin;
      im += s.im * cos - s.re * sin;
    }

    re /= n;
    im /= n;

    coefficients.push({
      freq: k <= n / 2 ? k : k - n,
      amplitude: Math.hypot(re, im),
      phase: Math.atan2(im, re),
    });
  }

  return coefficients;
}

/**
 * Evaluate the complex sum of rotating vectors at normalized time `t`.
 *
 * Each coefficient contributes `amplitude · e^(i · (2π · freq · t + phase))`.
 * At `t = sampleIndex / N` this reproduces the original sample exactly, so the
 * full coefficient set round-trips the input of {@link fourierCoefficients}.
 *
 * @param coefficients - Coefficients to sum (any order; order does not change the sum).
 * @param t - Normalized time; one full period spans `t ∈ [0, 1)`.
 * @returns The summed complex value.
 */
export function reconstructSample(coefficients: FourierCoefficient[], t: number): Complex {
  return partialSum(coefficients, t, coefficients.length);
}

/**
 * Sum only the first `numTerms` coefficients at normalized time `t`.
 *
 * This is the partial reconstruction that an {@link FourierEpicycles} pen traces
 * when it shows `numTerms` vectors: it equals the tip of the vector chain.
 *
 * @param coefficients - Ordered coefficients; the first `numTerms` are summed.
 * @param t - Normalized time; one full period spans `t ∈ [0, 1)`.
 * @param numTerms - How many leading coefficients to include. Clamped to `[0, length]`.
 * @returns The summed complex value. `numTerms <= 0` yields `{ re: 0, im: 0 }`.
 */
export function partialSum(
  coefficients: FourierCoefficient[],
  t: number,
  numTerms: number,
): Complex {
  const count = Math.max(0, Math.min(numTerms, coefficients.length));
  let re = 0;
  let im = 0;

  for (let i = 0; i < count; i++) {
    const { freq, amplitude, phase } = coefficients[i];
    const angle = TWO_PI * freq * t + phase;
    re += amplitude * Math.cos(angle);
    im += amplitude * Math.sin(angle);
  }

  return { re, im };
}

/**
 * Return a reordered copy of the coefficients for the vector chain.
 *
 * - `'amplitude'` (best approximation per term): largest amplitude first;
 *   ties broken by smaller |freq|, then by larger signed freq.
 * - `'frequency'` (the iconic 3Blue1Brown look): `0, +1, -1, +2, -2, …`;
 *   that is, smaller |freq| first, positive before negative within a |freq|.
 *
 * The input array is not mutated.
 *
 * @param coefficients - Coefficients to order.
 * @param order - Ordering strategy. Default `'frequency'`.
 * @returns A new, reordered array.
 */
export function orderCoefficients(
  coefficients: FourierCoefficient[],
  order: FourierOrder = 'frequency',
): FourierCoefficient[] {
  const copy = [...coefficients];

  if (order === 'amplitude') {
    copy.sort((a, b) => {
      if (b.amplitude !== a.amplitude) return b.amplitude - a.amplitude;
      if (Math.abs(a.freq) !== Math.abs(b.freq)) return Math.abs(a.freq) - Math.abs(b.freq);
      return b.freq - a.freq;
    });
    return copy;
  }

  copy.sort((a, b) => {
    if (Math.abs(a.freq) !== Math.abs(b.freq)) return Math.abs(a.freq) - Math.abs(b.freq);
    return b.freq - a.freq;
  });
  return copy;
}

/**
 * Options for {@link fourierSeriesApproximation}.
 */
export interface FourierSeriesApproximationOptions {
  /** Length of one period in the function's domain. Default `2π`. */
  period?: number;
  /** Start of the sampled period in the domain. Default `0`. */
  start?: number;
  /** Number of harmonics (vectors) to keep, chosen by amplitude. Default: all. */
  numTerms?: number;
  /** Number of samples taken over one period. Default `256`. */
  numSamples?: number;
}

/**
 * Build the truncated Fourier approximation of a real periodic function.
 *
 * The function is sampled over one period, its discrete coefficients are
 * computed, the `numTerms` largest are kept, and the returned function
 * evaluates the real part of the partial sum at any `x`. With `numTerms`
 * equal to the sample count the approximation reproduces the samples.
 *
 * @param func - The real periodic function `y = f(x)`.
 * @param options - Period, sampling, and term-count options.
 * @returns A function `x -> y` giving the truncated approximation.
 */
export function fourierSeriesApproximation(
  func: (x: number) => number,
  options: FourierSeriesApproximationOptions = {},
): (x: number) => number {
  const { period = TWO_PI, start = 0, numSamples = 256 } = options;
  const samples: Complex[] = [];

  for (let i = 0; i < numSamples; i++) {
    const x = start + (period * i) / numSamples;
    samples.push({ re: func(x), im: 0 });
  }

  const ordered = orderCoefficients(fourierCoefficients(samples), 'amplitude');
  const numTerms = options.numTerms ?? ordered.length;

  return (x: number): number => {
    const t = (x - start) / period;
    return partialSum(ordered, t, numTerms).re;
  };
}
