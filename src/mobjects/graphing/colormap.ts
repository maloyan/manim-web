import { interpolateColor } from '../../utils/color';
import { interpolateColorOklab } from '../../utils/oklab';

/**
 * Perceptual color maps for scalar-field visualization.
 *
 * A color map is an ordered list of hex color stops spread evenly over the
 * unit interval. {@link sampleColormap} reads a color for any `t` in 0..1 by
 * blending the two surrounding stops. Blending runs in sRGB by default, or in
 * perceptually-uniform Oklab (see `utils/oklab`) when `useOklab` is set, which
 * keeps the midpoint of a palette bright instead of muddy.
 */

/** A built-in viridis-like palette: dark blue through green to yellow. */
export const VIRIDIS: readonly string[] = [
  '#440154',
  '#414487',
  '#2a788e',
  '#22a884',
  '#7ad151',
  '#fde725',
];

/** A built-in warm palette: black through red and orange to white. */
export const INFERNO: readonly string[] = [
  '#000004',
  '#420a68',
  '#932667',
  '#dd513a',
  '#fca50a',
  '#fcffa4',
];

/** A simple blue-white-red diverging palette, centered on white. */
export const COOLWARM: readonly string[] = ['#3b4cc0', '#ffffff', '#b40426'];

/**
 * Sample a color map at position `t` in 0..1.
 *
 * `t` is clamped to 0..1. A palette with one stop returns that stop. Otherwise
 * `t` is scaled across the stops and the two surrounding stops are blended.
 *
 * @param palette Ordered hex color stops. Must hold at least one color.
 * @param t Position along the palette, clamped to 0..1.
 * @param useOklab Blend in Oklab space for a perceptually-uniform result.
 */
export function sampleColormap(palette: readonly string[], t: number, useOklab = false): string {
  if (palette.length === 0) {
    throw new Error('sampleColormap: palette must hold at least one color.');
  }
  if (palette.length === 1) {
    return palette[0];
  }

  const tc = Math.max(0, Math.min(1, t));
  const scaled = tc * (palette.length - 1);
  const lower = Math.min(Math.floor(scaled), palette.length - 2);
  const local = scaled - lower;
  const blend = useOklab ? interpolateColorOklab : interpolateColor;
  return blend(palette[lower], palette[lower + 1], local);
}

/**
 * Map a scalar `value` in the domain `[min, max]` to a color map color.
 *
 * The value is normalized to 0..1 across the domain, then clamped. A zero-width
 * domain (`min === max`) maps every value to the first stop.
 */
export function valueToColor(
  value: number,
  min: number,
  max: number,
  palette: readonly string[],
  useOklab = false,
): string {
  const span = max - min;
  const t = span === 0 ? 0 : (value - min) / span;
  return sampleColormap(palette, t, useOklab);
}
