import { BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD } from '../../constants/colors';

/**
 * Default color cycle shared by the multi-series charts (stacked/grouped bars,
 * area charts, step charts). Matches the Manim palette used by BarChart.
 */
export const DEFAULT_SERIES_COLORS: readonly string[] = [
  BLUE,
  GREEN,
  RED,
  YELLOW,
  ORANGE,
  PURPLE,
  TEAL,
  GOLD,
];

/**
 * Pick a color for series `index`, cycling through `colors`.
 *
 * Falls back to the default palette when `colors` is empty. A negative index
 * wraps the same way a positive index does.
 */
export function cycleColor(colors: readonly string[], index: number): string {
  const palette = colors.length > 0 ? colors : DEFAULT_SERIES_COLORS;
  const n = palette.length;
  return palette[((index % n) + n) % n];
}

/**
 * Normalize a color option (single color or array) into a color array.
 * An empty or missing option yields the default series palette.
 */
export function toColorList(colors: string | readonly string[] | undefined): string[] {
  if (colors === undefined) return [...DEFAULT_SERIES_COLORS];
  if (typeof colors === 'string') return [colors];
  return colors.length > 0 ? [...colors] : [...DEFAULT_SERIES_COLORS];
}
