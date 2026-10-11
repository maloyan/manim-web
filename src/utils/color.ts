/**
 * Color conversion utilities ported from ManimCE's `manim/utils/color/core.py`
 * (ManimCE 0.22.0).
 *
 * manim-web represents a color as a `#rrggbb` (or `#rrggbbaa`) hex string, so
 * these helpers adapt ManimCE's `ManimColor`-based functional helpers to that
 * model: inputs that ManimCE types as a color are hex strings here, and
 * functions that ManimCE returns a `ManimColor` from return a hex string.
 *
 * Numeric conventions match ManimCE exactly:
 * - RGB float arrays use the 0.0..1.0 range (`hexToRgb('#FFFFFF')` -> [1, 1, 1]).
 * - Integer RGB arrays use the 0..255 range, truncated toward zero
 *   (`Math.trunc(x * 255)`, matching NumPy's `.astype(int)` / Python `int()`).
 * - Hex output truncates channels and uppercases (matching `ManimColor.to_hex`).
 * - HSV conversion mirrors Python's `colorsys` (h, s, v all in 0.0..1.0).
 *
 * The `ManimColor`, `HSV` and `RGBA` classes (the object layer on top of these
 * functions) live in `./ManimColor`.
 */

import * as Colors from '../constants/colors';

// Internal tuple aliases (kept unexported; the public signatures are structural).
type Rgb = [number, number, number];
type Rgba = [number, number, number, number];
type Hsv = [number, number, number];

// The canonical gradient helper already lives with VMobject; re-export it so
// `colorGradient` is the single public implementation and internal callers keep
// importing it from its original module.
export { colorGradient } from '../core/VMobjectColorGradient';

const HEX_RE = /(?:#|0[xX])([A-Fa-f0-9]{3,8})/;

/**
 * Parse a hex color string into an `[r, g, b, a]` float array (0.0..1.0).
 *
 * Accepts `#` or `0x` prefixes and 3, 4, 6 or 8 hex digits, matching
 * ManimCE's `ManimColor._internal_from_hex_string`:
 * - 3/4 digits are expanded by doubling each digit.
 * - 6 digits imply an alpha of 1.0.
 * - 8 digits carry the alpha in the final byte (`#rrggbbaa`).
 */
function parseHexToRgba(hexCode: string): Rgba {
  const match = HEX_RE.exec(hexCode);
  if (match === null) {
    throw new Error(`Failed to parse a color from "${hexCode}"`);
  }
  let hex = match[1];
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length === 6) {
    hex += 'FF';
  } else if (hex.length !== 8) {
    throw new Error(
      'Hex colors must use a # or 0x prefix and contain 3, 4, 6 or 8 hexadecimal digits',
    );
  }
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
    parseInt(hex.slice(6, 8), 16) / 255,
  ];
}

/** Format a single 0.0..1.0 channel as a 2-digit uppercase hex byte. */
function channelToHexByte(value: number): string {
  const scaled = Math.trunc(value * 255);
  const clamped = Math.min(255, Math.max(0, scaled));
  return clamped.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Convert an `[r, g, b]` float array (0.0..1.0) to a `#RRGGBB` hex string.
 *
 * Ports `ManimColor.from_rgb(...).to_hex()`. Channels are truncated, not
 * rounded, to match ManimCE.
 */
export function rgbToHex(rgb: Rgb): string {
  return `#${channelToHexByte(rgb[0])}${channelToHexByte(rgb[1])}${channelToHexByte(rgb[2])}`;
}

/** Convert a color (hex string) to an `[r, g, b]` float array (0.0..1.0). */
export function hexToRgb(hexCode: string): Rgb {
  const [r, g, b] = parseHexToRgba(hexCode);
  return [r, g, b];
}

/** Alias of {@link hexToRgb}; ports ManimCE's `color_to_rgb`. */
export function colorToRgb(color: string): Rgb {
  return hexToRgb(color);
}

/**
 * Convert a color to an `[r, g, b, a]` float array (0.0..1.0).
 *
 * Ports `color_to_rgba`: the supplied `alpha` replaces any alpha carried by the
 * color itself.
 */
export function colorToRgba(color: string, alpha = 1.0): Rgba {
  const [r, g, b] = colorToRgb(color);
  return [r, g, b, alpha];
}

/** Convert a color to an `[r, g, b]` integer array (0..255). Ports `color_to_int_rgb`. */
export function colorToIntRgb(color: string): Rgb {
  const [r, g, b] = colorToRgb(color);
  return [Math.trunc(r * 255), Math.trunc(g * 255), Math.trunc(b * 255)];
}

/**
 * Convert a color to an `[r, g, b, a]` integer array (0..255).
 *
 * Ports `color_to_int_rgba`: the supplied `alpha` (0.0..1.0) is scaled to 0..255.
 */
export function colorToIntRgba(color: string, alpha = 1.0): Rgba {
  const [r, g, b] = colorToIntRgb(color);
  return [r, g, b, Math.trunc(alpha * 255)];
}

/**
 * Convert an `[r, g, b]` float array (0.0..1.0) to a color (hex string).
 *
 * Ports `rgb_to_color`. Unlike ManimCE, the array is always interpreted as
 * floats in 0.0..1.0 (manim-web's internal color model); ManimCE's int-vs-float
 * auto-detection is not reproduced.
 */
export function rgbToColor(rgb: Rgb): string {
  return rgbToHex(rgb);
}

/**
 * Convert an `[r, g, b, a]` float array to a color (hex string).
 *
 * Ports `rgba_to_color`. The alpha is dropped, matching `ManimColor.to_hex`
 * with its default `with_alpha=False`.
 */
export function rgbaToColor(rgba: Rgba): string {
  return rgbToHex([rgba[0], rgba[1], rgba[2]]);
}

/** Return the linearly inverted color (1 - channel). Ports `invert_color`. */
export function invertColor(color: string): string {
  const [r, g, b] = colorToRgb(color);
  return rgbToHex([1 - r, 1 - g, 1 - b]);
}

/**
 * Interpolate two colors in RGB space and return the result as a hex string.
 *
 * Ports `interpolate_color`: `alpha` of 0.0 yields `color1`, 1.0 yields `color2`.
 */
export function interpolateColor(color1: string, color2: string, alpha: number): string {
  const a = colorToRgb(color1);
  const b = colorToRgb(color2);
  return rgbToHex([
    a[0] * (1 - alpha) + b[0] * alpha,
    a[1] * (1 - alpha) + b[1] * alpha,
    a[2] * (1 - alpha) + b[2] * alpha,
  ]);
}

/**
 * Return the per-channel average of the given colors as a hex string.
 *
 * Ports `average_color`. Alpha is ignored; the result is fully opaque.
 */
export function averageColor(...colors: string[]): string {
  if (colors.length === 0) {
    throw new Error('Expected 1 or more colors. Got 0 colors.');
  }
  const sum: Rgb = [0, 0, 0];
  for (const color of colors) {
    const [r, g, b] = colorToRgb(color);
    sum[0] += r;
    sum[1] += g;
    sum[2] += b;
  }
  const n = colors.length;
  return rgbToHex([sum[0] / n, sum[1] / n, sum[2] / n]);
}

// The default palette sampled by randomColor: every hex constant exported by
// the colors module, de-duplicated (aliases such as RED = RED_C collapse).
const PALETTE: string[] = Array.from(new Set<string>(Object.values(Colors)));

/** Return a random color from the Manim palette. Ports `random_color`. */
export function randomColor(): string {
  const index = Math.floor(Math.random() * PALETTE.length);
  return PALETTE[index];
}

/**
 * Return a random bright color: a random palette color averaged with white.
 *
 * Ports `random_bright_color` (`0.5 * (rgb + 1)`).
 */
export function randomBrightColor(): string {
  const [r, g, b] = colorToRgb(randomColor());
  return rgbToHex([0.5 * (r + 1), 0.5 * (g + 1), 0.5 * (b + 1)]);
}

/**
 * Convert an `[h, s, v]` array (0.0..1.0) to an `[r, g, b]` array (0.0..1.0).
 *
 * Faithful port of Python's `colorsys.hsv_to_rgb`.
 */
export function hsvToRgb(hsv: Hsv): Rgb {
  const [h, s, v] = hsv;
  if (s === 0.0) {
    return [v, v, v];
  }
  const i = Math.floor(h * 6.0);
  const f = h * 6.0 - i;
  const p = v * (1.0 - s);
  const q = v * (1.0 - s * f);
  const t = v * (1.0 - s * (1.0 - f));
  switch (((i % 6) + 6) % 6) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    default:
      return [v, p, q];
  }
}

/**
 * Convert an `[r, g, b]` array (0.0..1.0) to an `[h, s, v]` array (0.0..1.0).
 *
 * Faithful port of Python's `colorsys.rgb_to_hsv`.
 */
export function rgbToHsv(rgb: Rgb): Hsv {
  const [r, g, b] = rgb;
  const maxc = Math.max(r, g, b);
  const minc = Math.min(r, g, b);
  const v = maxc;
  if (minc === maxc) {
    return [0.0, 0.0, v];
  }
  const delta = maxc - minc;
  const s = delta / maxc;
  const rc = (maxc - r) / delta;
  const gc = (maxc - g) / delta;
  const bc = (maxc - b) / delta;
  let h: number;
  if (r === maxc) {
    h = bc - gc;
  } else if (g === maxc) {
    h = 2.0 + rc - bc;
  } else {
    h = 4.0 + gc - rc;
  }
  h = (((h / 6.0) % 1.0) + 1.0) % 1.0;
  return [h, s, v];
}

/*
 * The `ManimColor` object layer (with `HSV` / `RGBA` color spaces,
 * `RandomColorGenerator` and `get_shaded_rgb`) is ported in `./ManimColor`,
 * reusing the conversion functions above. manim-web still models a color as a
 * `#rrggbb` hex string end to end; `ManimColor.toHex()` keeps the object
 * interoperable with that model.
 */
