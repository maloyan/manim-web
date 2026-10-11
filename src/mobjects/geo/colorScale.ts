/**
 * A sequential color scale: maps a numeric value in a domain to a color by
 * sampling a gradient built from reference colors.
 *
 * Reuses {@link colorGradient} (the same helper behind
 * `VMobject.setColorByGradient`) so choropleth colors match the rest of the
 * library. Values are normalized over the domain, clamped to `[0, 1]`, and
 * indexed into a pre-sampled palette.
 */

import { colorGradient } from '../../core/VMobjectColorGradient';

/** Default two-color blue ramp used when no colors are supplied. */
const DEFAULT_COLORS = ['#0d1b2a', '#4cc9f0'];

/** Options for a {@link ColorScale}. */
export interface ColorScaleOptions {
  /** Reference colors to interpolate (at least one). Default: a blue ramp. */
  colors?: string[];
  /** Value domain `[min, max]`. Default: `[0, 1]`, or set from data later. */
  domain?: [number, number];
  /** Number of palette samples. Higher is smoother. Default: 256. */
  samples?: number;
}

/**
 * Maps numeric values to `#rrggbb` colors across a domain.
 */
export class ColorScale {
  private _palette: string[];
  private _domain: [number, number];

  constructor(options: ColorScaleOptions = {}) {
    const { colors = DEFAULT_COLORS, domain = [0, 1], samples = 256 } = options;
    const count = Math.max(2, Math.floor(samples));
    this._palette = colorGradient(colors.length > 0 ? colors : DEFAULT_COLORS, count);
    this._domain = [domain[0], domain[1]];
  }

  /**
   * Set the domain from a list of values (its min and max). Non-finite values
   * are ignored. Leaves the domain unchanged when no finite value is present.
   *
   * @param values - The data values.
   * @returns this for chaining.
   */
  setDomainFromValues(values: number[]): this {
    let min = Infinity;
    let max = -Infinity;
    for (const value of values) {
      if (!Number.isFinite(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    if (Number.isFinite(min) && Number.isFinite(max)) {
      this._domain = [min, max];
    }
    return this;
  }

  /** Get the current domain `[min, max]`. */
  getDomain(): [number, number] {
    return [this._domain[0], this._domain[1]];
  }

  /**
   * Map a value to a color. Values outside the domain clamp to the endpoints.
   * A zero-width domain maps everything to the first palette color.
   *
   * @param value - The value to map.
   * @returns A `#rrggbb` color string.
   */
  colorFor(value: number): string {
    const [min, max] = this._domain;
    const span = max - min;
    let t = span === 0 || !Number.isFinite(value) ? 0 : (value - min) / span;
    t = Math.max(0, Math.min(1, t));
    const index = Math.round(t * (this._palette.length - 1));
    return this._palette[index];
  }
}
