/**
 * Pure data-to-audio mappings for the Sonifier.
 *
 * These functions use no Web Audio API, so they run and test in any
 * environment (Node, jsdom, SSR).
 */

/** Scale used to map a data value onto a frequency. */
export type SonifierScale = 'linear' | 'log';

/** A `[min, max]` data domain. */
export type DataDomain = [number, number];

/** Options for {@link dataToFrequency}. */
export interface FrequencyMapOptions {
  /** Data range that maps onto the frequency range. Defaults to `[0, 1]`. */
  domain?: DataDomain;
  /** Lowest output frequency in Hz. Defaults to 220. */
  minFrequency?: number;
  /** Highest output frequency in Hz. Defaults to 880. */
  maxFrequency?: number;
  /** `linear` interpolates Hz. `log` interpolates pitch (equal ratios). Defaults to `linear`. */
  scale?: SonifierScale;
}

/** Options for {@link dataToGain}. */
export interface GainMapOptions {
  /** Data range that maps onto the gain range. Defaults to `[0, 1]`. */
  domain?: DataDomain;
  /** Gain at the low end of the domain. Defaults to 0. */
  minGain?: number;
  /** Gain at the high end of the domain. Defaults to 1. */
  maxGain?: number;
}

/** Options for {@link dataToPan}. */
export interface PanMapOptions {
  /** Data range that maps onto `[-1, 1]`. Defaults to `[0, 1]`. */
  domain?: DataDomain;
}

const DEFAULT_MIN_FREQUENCY = 220;
const DEFAULT_MAX_FREQUENCY = 880;

/**
 * Normalize `value` to `[0, 1]` inside `domain`, clamped at the edges.
 * A degenerate domain returns 0.5. A non-finite value returns 0.
 */
function normalize(value: number, domain: DataDomain): number {
  if (!Number.isFinite(value)) return 0;
  const [a, b] = domain;
  if (a === b) return 0.5;
  const t = (value - a) / (b - a);
  return Math.max(0, Math.min(1, t));
}

/** Map a data value to a frequency in Hz. */
export function dataToFrequency(value: number, options: FrequencyMapOptions = {}): number {
  const lo = options.minFrequency ?? DEFAULT_MIN_FREQUENCY;
  const hi = options.maxFrequency ?? DEFAULT_MAX_FREQUENCY;
  const t = normalize(value, options.domain ?? [0, 1]);
  if (options.scale === 'log' && lo > 0 && hi > 0) {
    return lo * Math.pow(hi / lo, t);
  }
  return lo + (hi - lo) * t;
}

/** Map a data value to a gain (linear amplitude). */
export function dataToGain(value: number, options: GainMapOptions = {}): number {
  const lo = options.minGain ?? 0;
  const hi = options.maxGain ?? 1;
  return lo + (hi - lo) * normalize(value, options.domain ?? [0, 1]);
}

/** Map a data value to a stereo pan in `[-1, 1]`. */
export function dataToPan(value: number, options: PanMapOptions = {}): number {
  return -1 + 2 * normalize(value, options.domain ?? [0, 1]);
}

/**
 * Compute the `[min, max]` of a series, ignoring non-finite values.
 * An empty series returns `[0, 1]`.
 */
export function dataDomain(series: ReadonlyArray<number>): DataDomain {
  let min = Infinity;
  let max = -Infinity;
  for (const v of series) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return min > max ? [0, 1] : [min, max];
}
