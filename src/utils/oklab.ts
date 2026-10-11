/**
 * Oklab and Oklch perceptual color interpolation.
 *
 * manim-web interpolates colors in the stored sRGB space (see
 * {@link interpolateColor} in `./color`). That space is not perceptually
 * uniform, so a straight blend of two saturated colors passes through a muddy,
 * desaturated midpoint. Oklab is a perceptually-uniform color space by Björn
 * Ottosson; its polar form Oklch separates lightness, chroma and hue. A blend
 * in either space keeps the midpoint bright and vivid.
 *
 * This module is opt-in. The default interpolation space does not change.
 * manim-web still models a color as a `#rrggbb` hex string, so the public
 * helpers here take and return hex strings, matching `interpolateColor`.
 *
 * The math follows Björn Ottosson's reference implementation:
 * - sRGB companding (gamma) to and from linear light.
 * - The two 3x3 matrices between linear sRGB and the LMS cone responses.
 * - The cube-root nonlinearity on the LMS values.
 * See https://bottosson.github.io/posts/oklab/ for the source matrices.
 */

import { hexToRgb } from './color';

// Internal tuple alias. The public color model stays a hex string.
type Rgb = [number, number, number];

/**
 * Format an sRGB `[r, g, b]` array (0.0..1.0) as a `#RRGGBB` hex string.
 *
 * Channels are rounded to the nearest byte and clamped to 0..255. This differs
 * from `rgbToHex` in `./color`, which truncates for ManimCE parity. A round of
 * the sRGB value keeps the sRGB -> Oklab -> sRGB round-trip exact, because the
 * cube-root and gamma math return values a hair below the target (for example
 * 0.99999 for a channel of 1.0), which truncation would drop to the byte below.
 */
function srgbToHexRounded(rgb: Rgb): string {
  const byte = (value: number): string => {
    const scaled = Math.round(value * 255);
    const clamped = Math.min(255, Math.max(0, scaled));
    return clamped.toString(16).toUpperCase().padStart(2, '0');
  };
  return `#${byte(rgb[0])}${byte(rgb[1])}${byte(rgb[2])}`;
}

/**
 * An Oklab color as `[L, a, b]`.
 *
 * `L` is perceptual lightness in 0.0..1.0. `a` is the green-red axis and `b` is
 * the blue-yellow axis; both are roughly in -0.4..0.4 for in-gamut sRGB colors.
 */
export type Oklab = [number, number, number];

/**
 * An Oklch color as `[L, C, h]`, the polar form of Oklab.
 *
 * `L` is perceptual lightness in 0.0..1.0. `C` is chroma (>= 0). `h` is hue in
 * degrees, in 0.0..360.0.
 */
export type Oklch = [number, number, number];

/**
 * Convert one sRGB channel (0.0..1.0, gamma-encoded) to linear light.
 *
 * Ports the standard sRGB inverse companding function.
 */
function srgbChannelToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert one linear-light channel to an sRGB channel (0.0..1.0, gamma-encoded).
 *
 * Ports the standard sRGB companding function.
 */
function linearChannelToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

/** Convert a linear-light `[r, g, b]` array to Oklab `[L, a, b]`. */
function linearToOklab(rgb: Rgb): Oklab {
  const [r, g, b] = rgb;

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lCbrt = Math.cbrt(l);
  const mCbrt = Math.cbrt(m);
  const sCbrt = Math.cbrt(s);

  return [
    0.2104542553 * lCbrt + 0.793617785 * mCbrt - 0.0040720468 * sCbrt,
    1.9779984951 * lCbrt - 2.428592205 * mCbrt + 0.4505937099 * sCbrt,
    0.0259040371 * lCbrt + 0.7827717662 * mCbrt - 0.808675766 * sCbrt,
  ];
}

/** Convert an Oklab `[L, a, b]` array to a linear-light `[r, g, b]` array. */
function oklabToLinear(lab: Oklab): Rgb {
  const [L, a, b] = lab;

  const lCbrt = L + 0.3963377774 * a + 0.2158037573 * b;
  const mCbrt = L - 0.1055613458 * a - 0.0638541728 * b;
  const sCbrt = L - 0.0894841775 * a - 1.291485548 * b;

  const l = lCbrt * lCbrt * lCbrt;
  const m = mCbrt * mCbrt * mCbrt;
  const s = sCbrt * sCbrt * sCbrt;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** Convert a color (hex string) to Oklab `[L, a, b]`. */
export function colorToOklab(color: string): Oklab {
  const [r, g, b] = hexToRgb(color);
  const linear: Rgb = [srgbChannelToLinear(r), srgbChannelToLinear(g), srgbChannelToLinear(b)];
  return linearToOklab(linear);
}

/**
 * Convert an Oklab `[L, a, b]` array to a color (hex string).
 *
 * Channels that fall outside the sRGB gamut are clamped to 0..255.
 */
export function oklabToColor(lab: Oklab): string {
  const linear = oklabToLinear(lab);
  const srgb: Rgb = [
    linearChannelToSrgb(linear[0]),
    linearChannelToSrgb(linear[1]),
    linearChannelToSrgb(linear[2]),
  ];
  return srgbToHexRounded(srgb);
}

/** Convert an Oklab `[L, a, b]` array to Oklch `[L, C, h]` (hue in degrees). */
export function oklabToOklch(lab: Oklab): Oklch {
  const [L, a, b] = lab;
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180.0) / Math.PI;
  if (h < 0) {
    h += 360.0;
  }
  return [L, C, h];
}

/** Convert an Oklch `[L, C, h]` array (hue in degrees) to Oklab `[L, a, b]`. */
export function oklchToOklab(lch: Oklch): Oklab {
  const [L, C, h] = lch;
  const hRad = (h * Math.PI) / 180.0;
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

/** Convert a color (hex string) to Oklch `[L, C, h]` (hue in degrees). */
export function colorToOklch(color: string): Oklch {
  return oklabToOklch(colorToOklab(color));
}

/**
 * Convert an Oklch `[L, C, h]` array (hue in degrees) to a color (hex string).
 *
 * Channels that fall outside the sRGB gamut are clamped to 0..255.
 */
export function oklchToColor(lch: Oklch): string {
  return oklabToColor(oklchToOklab(lch));
}

/** Linear blend of two scalars. `alpha` of 0 yields `x`, 1 yields `y`. */
function lerp(x: number, y: number, alpha: number): number {
  return x * (1 - alpha) + y * alpha;
}

/**
 * Interpolate two colors in Oklab space and return the result as a hex string.
 *
 * This is the perceptual counterpart of {@link interpolateColor}. `alpha` of
 * 0.0 yields `color1`, 1.0 yields `color2`. The midpoint stays bright and
 * vivid instead of passing through a muddy linear-RGB blend.
 */
export function interpolateColorOklab(color1: string, color2: string, alpha: number): string {
  const a = colorToOklab(color1);
  const b = colorToOklab(color2);
  return oklabToColor([lerp(a[0], b[0], alpha), lerp(a[1], b[1], alpha), lerp(a[2], b[2], alpha)]);
}

/**
 * Interpolate two colors in Oklch space and return the result as a hex string.
 *
 * This blends lightness and chroma linearly, and hue along the shortest arc of
 * the color circle. `alpha` of 0.0 yields `color1`, 1.0 yields `color2`. The
 * result tracks a natural hue sweep, so a red-to-green blend stays saturated
 * through orange instead of graying out.
 *
 * When one endpoint is achromatic (chroma near 0), its hue is undefined, so the
 * hue of the other endpoint is used to avoid an arbitrary sweep.
 */
export function interpolateColorOklch(color1: string, color2: string, alpha: number): string {
  const [L1, C1, h1Raw] = colorToOklch(color1);
  const [L2, C2, h2Raw] = colorToOklch(color2);

  // A near-gray endpoint has no meaningful hue; borrow the other endpoint's.
  const CHROMA_EPSILON = 1e-6;
  const c1Gray = C1 < CHROMA_EPSILON;
  const c2Gray = C2 < CHROMA_EPSILON;
  const h1 = c1Gray ? h2Raw : h1Raw;
  const h2 = c2Gray ? h1Raw : h2Raw;

  // Shortest path around the hue circle: fold the delta into -180..180.
  let dh = h2 - h1;
  if (dh > 180.0) {
    dh -= 360.0;
  } else if (dh < -180.0) {
    dh += 360.0;
  }
  let h = h1 + alpha * dh;
  h = ((h % 360.0) + 360.0) % 360.0;

  return oklchToColor([lerp(L1, L2, alpha), lerp(C1, C2, alpha), h]);
}
