/**
 * Class layer ported from ManimCE's `manim/utils/color/core.py` (ManimCE 0.22.0).
 *
 * The free color functions (hex/rgb/hsv conversion, interpolation, gradients)
 * live in `./color` and use the 0.0..1.0 float convention. This module adds the
 * `ManimColor` object on top of them.
 *
 * manim-web otherwise stores a color as a `#rrggbb` hex string end to end, so a
 * `ManimColor` stays interoperable by exposing {@link ManimColor.toHex}: the
 * returned string works everywhere the repo expects a color.
 *
 * Deliberate divergences from ManimCE (documented for parity readers):
 * - TypeScript cannot tell an integer tuple from a float tuple at run time, so a
 *   numeric array is always read as a float RGB(A) array in 0.0..1.0. ManimCE's
 *   int-vs-float auto-detection is not reproduced.
 * - {@link RandomColorGenerator} is deterministic for a given seed, but it does
 *   not reproduce CPython's Mersenne Twister sequence; it uses a `mulberry32`
 *   PRNG instead.
 */

import * as Colors from '../constants/colors';
import { hsvToRgb, rgbToHex, rgbToHsv } from './color';
import { dotVec, normalizeVec } from './vectors';

/** A color channel. Name-parity with ManimCE's numpy `float64` dtype. */
export type ManimColorDType = number;

type Rgb = [number, number, number];
type Rgba = [number, number, number, number];
type Hsv = [number, number, number];

/** Every type that {@link ManimColor.parse} and the constructor accept. */
export type ParsableManimColor =
  ManimColor | number | string | [number, number, number] | [number, number, number, number];

const HEX_RE = /(?:#|0[xX])([A-Fa-f0-9]{3,8})/;

/** Truncate a 0.0..1.0 channel to a clamped 0..255 integer (matches `int(x*255)`). */
function toByte(value: number): number {
  return Math.min(255, Math.max(0, Math.trunc(value * 255)));
}

/** Format a 0.0..1.0 channel as a 2-digit uppercase hex byte. */
function byteHex(value: number): string {
  return toByte(value).toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Parse a raw hex string (no prefix) into `[r,g,b,a]` floats.
 *
 * Mirrors `ManimColor._internal_from_hex_string`: 3/4 digits are doubled, a
 * 6-digit string keeps the supplied `alpha`, and an 8-digit string takes its
 * alpha from the final byte (the supplied `alpha` is ignored).
 */
function hexToRgba(hex: string, alpha: number): Rgba {
  let digits = hex;
  if (digits.length === 3 || digits.length === 4) {
    digits = digits
      .split('')
      .map((c) => c + c)
      .join('');
  }
  let a = alpha;
  if (digits.length === 8) {
    a = parseInt(digits.slice(6, 8), 16) / 255;
  } else if (digits.length !== 6) {
    throw new Error(
      'Hex colors must use a # or 0x prefix and contain 3, 4, 6 or 8 hexadecimal digits',
    );
  }
  return [
    parseInt(digits.slice(0, 2), 16) / 255,
    parseInt(digits.slice(2, 4), 16) / 255,
    parseInt(digits.slice(4, 6), 16) / 255,
    a,
  ];
}

/** Resolve a string to `[r,g,b,a]`: a hex code, or a palette name such as `RED`. */
function stringToRgba(value: string, alpha: number): Rgba {
  const match = HEX_RE.exec(value);
  if (match !== null) {
    return hexToRgba(match[1], alpha);
  }
  const palette = Colors as Record<string, unknown>;
  const named = palette[value.toUpperCase()];
  if (typeof named === 'string') {
    return stringToRgba(named, alpha);
  }
  throw new Error(`Failed to parse a color from "${value}"`);
}

/** Convert a packed `0xRRGGBB` integer to `[r,g,b,a]` floats. */
function integerToRgba(value: number, alpha: number): Rgba {
  return [((value >> 16) & 0xff) / 255, ((value >> 8) & 0xff) / 255, (value & 0xff) / 255, alpha];
}

/**
 * Internal color data structure, ported from ManimCE's `ManimColor`.
 *
 * The internal representation is an `[r,g,b,a]` array of floats in 0.0..1.0.
 */
export class ManimColor {
  protected readonly value: Rgba;

  /**
   * @param value Any {@link ParsableManimColor}, or `null` for black.
   * @param alpha Opacity in 0.0..1.0. Default `1.0`. Ignored for an 8-digit hex
   *   string and for a 4-element (RGBA) array, which carry their own alpha.
   */
  constructor(value: ParsableManimColor | null, alpha = 1.0) {
    if (value === null) {
      this.value = [0, 0, 0, alpha];
    } else if (value instanceof ManimColor) {
      const v = value.internalRgba();
      this.value = [v[0], v[1], v[2], v[3]];
    } else if (typeof value === 'number') {
      this.value = integerToRgba(value, alpha);
    } else if (typeof value === 'string') {
      this.value = stringToRgba(value, alpha);
    } else if (value.length === 3) {
      this.value = [value[0], value[1], value[2], alpha];
    } else if (value.length === 4) {
      this.value = [value[0], value[1], value[2], value[3]];
    } else {
      throw new Error('ManimColor only accepts arrays of length 3 or 4');
    }
  }

  // --- color-space abstraction (overridden by subclasses such as HSV) ---

  /** The `[r,g,b,a]` internal value. Overridden by subclasses. */
  protected internalRgba(): Rgba {
    return this.value;
  }

  /** The space used for operators and interpolation (`[r,g,b,a]` for the base). */
  protected getSpace(): number[] {
    const v = this.internalRgba();
    return [v[0], v[1], v[2], v[3]];
  }

  /** Build a color of this class from a space array. Overridden by subclasses. */
  protected constructFromSpace(space: number[]): ManimColor {
    return new ManimColor([space[0], space[1], space[2], space[3]]);
  }

  /** Build a color of this class from an `[r,g,b,a]` value (ManimCE `_from_internal`). */
  protected fromInternal(rgba: Rgba): ManimColor {
    return new ManimColor(rgba);
  }

  // --- conversions ---

  /** Convert to an `[r,g,b]` float array (0.0..1.0). */
  toRgb(): Rgb {
    const v = this.internalRgba();
    return [v[0], v[1], v[2]];
  }

  /** Convert to an `[r,g,b,a]` float array (0.0..1.0). */
  toRgba(): Rgba {
    const v = this.internalRgba();
    return [v[0], v[1], v[2], v[3]];
  }

  /** Convert to an `[r,g,b]` integer array (0..255, truncated). */
  toIntRgb(): Rgb {
    const v = this.internalRgba();
    return [toByte(v[0]), toByte(v[1]), toByte(v[2])];
  }

  /** Convert to an `[r,g,b,a]` integer array (0..255, truncated). */
  toIntRgba(): Rgba {
    const v = this.internalRgba();
    return [toByte(v[0]), toByte(v[1]), toByte(v[2]), toByte(v[3])];
  }

  /**
   * Convert to a `#RRGGBB` hex string, or `#RRGGBBAA` when `withAlpha` is true.
   */
  toHex(withAlpha = false): string {
    const v = this.internalRgba();
    const base = rgbToHex([v[0], v[1], v[2]]);
    return withAlpha ? base + byteHex(v[3]) : base;
  }

  /** Convert to an `[h,s,v]` float array (0.0..1.0). */
  toHsv(): Hsv {
    return rgbToHsv(this.toRgb());
  }

  // --- transforms (all return a new color; none mutate) ---

  /**
   * Interpolate toward `other` in this color's space.
   *
   * `alpha` 0.0 returns a copy of this color, 1.0 returns `other`.
   */
  interpolate(other: ManimColor, alpha: number): ManimColor {
    const a = this.getSpace();
    const b = other.getSpace();
    return this.constructFromSpace(a.map((channel, i) => channel * (1 - alpha) + b[i] * alpha));
  }

  /**
   * Return a linearly inverted color (`1 - channel`).
   *
   * @param withAlpha If true, the alpha is inverted too. Default `false`.
   */
  invert(withAlpha = false): ManimColor {
    const space = this.getSpace();
    const inverted = space.map((channel) => 1 - channel);
    if (!withAlpha) {
      inverted[inverted.length - 1] = space[space.length - 1];
    }
    return this.constructFromSpace(inverted);
  }

  /** Return a new color with the given opacity and the same color values. */
  opacity(opacity: number): ManimColor {
    const space = this.getSpace();
    space[space.length - 1] = opacity;
    return this.constructFromSpace(space);
  }

  /** Alias of {@link opacity}. */
  withAlpha(alpha: number): ManimColor {
    return this.opacity(alpha);
  }

  /**
   * Return a darker color: interpolated toward black. The opacity is unchanged.
   *
   * @param blend 0.0 (unchanged) to 1.0 (pure black). Default `0.2`.
   */
  darker(blend = 0.2): ManimColor {
    const alpha = this.internalRgba()[3];
    const black = this.fromInternal([0, 0, 0, 1]);
    return this.interpolate(black, blend).opacity(alpha);
  }

  /**
   * Return a lighter color: interpolated toward white. The opacity is unchanged.
   *
   * @param blend 0.0 (unchanged) to 1.0 (pure white). Default `0.2`.
   */
  lighter(blend = 0.2): ManimColor {
    const alpha = this.internalRgba()[3];
    const white = this.fromInternal([1, 1, 1, 1]);
    return this.interpolate(white, blend).opacity(alpha);
  }

  // --- equality / string ---

  /** Compare two colors with a numpy-style `allclose` tolerance. */
  equals(other: ManimColor): boolean {
    const a = this.internalRgba();
    const b = other.internalRgba();
    return a.every((channel, i) => Math.abs(channel - b[i]) <= 1e-8 + 1e-5 * Math.abs(b[i]));
  }

  /** Return the `#RRGGBB` hex string, so a color interpolates into templates. */
  toString(): string {
    return this.toHex();
  }

  // --- static factories ---

  /** Create a color from an RGB(A) float array. Ports `ManimColor.from_rgb`. */
  static fromRgb(rgb: Rgb | Rgba, alpha = 1.0): ManimColor {
    return new ManimColor(rgb, alpha);
  }

  /** Create a color from an RGBA float array. Ports `ManimColor.from_rgba`. */
  static fromRgba(rgba: Rgba): ManimColor {
    return new ManimColor(rgba);
  }

  /** Create a color from a hex string. Ports `ManimColor.from_hex`. */
  static fromHex(hex: string, alpha = 1.0): ManimColor {
    return new ManimColor(hex, alpha);
  }

  /** Create a color from an `[h,s,v]` float array. Ports `ManimColor.from_hsv`. */
  static fromHsv(hsv: Hsv, alpha = 1.0): ManimColor {
    return new ManimColor(hsvToRgb(hsv), alpha);
  }

  /**
   * Parse one color, or a list of colors.
   *
   * A numeric array (length 3 or 4) is read as a single RGB(A) color. An array
   * whose elements are themselves colors (strings, numbers-as-ints via nested
   * arrays, or `ManimColor`s) is read as a list. This resolves ManimCE's
   * documented "array of numbers becomes a list of colors" footgun in favor of
   * the single-color reading.
   */
  static parse(
    color: ParsableManimColor | ParsableManimColor[] | null,
    alpha = 1.0,
  ): ManimColor | ManimColor[] {
    if (Array.isArray(color) && color.some((c) => typeof c !== 'number')) {
      return (color as ParsableManimColor[]).map((c) => new ManimColor(c, alpha));
    }
    return new ManimColor(color as ParsableManimColor | null, alpha);
  }
}

/** RGBA color space. In ManimCE this is an alias of {@link ManimColor}. */
export const RGBA = ManimColor;
/** RGBA color space type. In ManimCE this is an alias of {@link ManimColor}. */
export type RGBA = ManimColor;

/**
 * HSV color space, a {@link ManimColor} subclass.
 *
 * It is constructed from `[h,s,v]` (or `[h,s,v,a]`) floats in 0.0..1.0 and keeps
 * that representation internally, so operators and {@link ManimColor.interpolate}
 * act in HSV space.
 */
export class HSV extends ManimColor {
  private readonly hsva: [number, number, number, number];

  constructor(hsv: Hsv | [number, number, number, number], alpha = 1.0) {
    super(null);
    if (hsv.length === 3) {
      this.hsva = [hsv[0], hsv[1], hsv[2], alpha];
    } else if (hsv.length === 4) {
      this.hsva = [hsv[0], hsv[1], hsv[2], hsv[3]];
    } else {
      throw new Error('HSV color must be an array of 3 or 4 values');
    }
  }

  protected override internalRgba(): Rgba {
    const rgb = hsvToRgb([this.hsva[0], this.hsva[1], this.hsva[2]]);
    return [rgb[0], rgb[1], rgb[2], this.hsva[3]];
  }

  protected override getSpace(): number[] {
    return [this.hsva[0], this.hsva[1], this.hsva[2], this.hsva[3]];
  }

  protected override constructFromSpace(space: number[]): ManimColor {
    return new HSV([space[0], space[1], space[2], space[3]]);
  }

  protected override fromInternal(rgba: Rgba): ManimColor {
    const hsv = rgbToHsv([rgba[0], rgba[1], rgba[2]]);
    return new HSV([hsv[0], hsv[1], hsv[2], rgba[3]]);
  }

  get h(): number {
    return this.hsva[0];
  }

  get s(): number {
    return this.hsva[1];
  }

  get v(): number {
    return this.hsva[2];
  }
}

/** A `mulberry32` PRNG: a seed produces a deterministic stream of 0.0..1.0 floats. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The default palette: every distinct hex constant in the colors module. */
const DEFAULT_PALETTE: ManimColor[] = Array.from(new Set<string>(Object.values(Colors))).map(
  (hex) => new ManimColor(hex),
);

/**
 * A generator of random colors, deterministic when given a seed.
 *
 * Ports ManimCE's `RandomColorGenerator`. With a `seed`, the same sequence of
 * colors is produced every time (see the module note on the PRNG). Without a
 * seed, `Math.random` is used and the output is non-deterministic.
 */
export class RandomColorGenerator {
  private readonly rng: () => number;
  private readonly colors: ManimColor[];

  constructor(seed?: number, sampleColors?: readonly ParsableManimColor[]) {
    this.rng = seed === undefined ? Math.random : mulberry32(seed);
    this.colors =
      sampleColors === undefined
        ? DEFAULT_PALETTE
        : sampleColors.map((c) => (c instanceof ManimColor ? c : new ManimColor(c)));
  }

  /** Return the next random color from the configured palette. */
  next(): ManimColor {
    const index = Math.floor(this.rng() * this.colors.length);
    return this.colors[index];
  }
}

/**
 * Add light or shadow to an `rgb` color on a surface, ported from ManimCE's
 * `get_shaded_rgb`.
 *
 * The surface sits at `point`, faces `unitNormal`, and may be lit by
 * `lightSource`. The result is not clamped, matching ManimCE.
 *
 * @param rgb The surface base color (0.0..1.0 floats).
 * @param point The location of the surface.
 * @param unitNormal The unit normal the surface faces.
 * @param lightSource The location of the light source.
 */
export function getShadedRgb(
  rgb: Rgb,
  point: readonly number[],
  unitNormal: readonly number[],
  lightSource: readonly number[],
): Rgb {
  const toSun = normalizeVec([
    lightSource[0] - point[0],
    lightSource[1] - point[1],
    lightSource[2] - point[2],
  ]);
  let lightCoef = 0.5 * dotVec(unitNormal, toSun) ** 3;
  if (lightCoef < 0) {
    lightCoef *= 0.5;
  }
  return [rgb[0] + lightCoef, rgb[1] + lightCoef, rgb[2] + lightCoef];
}
