/**
 * Property-based tests for the pure color helpers in `./color`.
 *
 * Channel values are truncated toward zero when encoded to hex
 * (`Math.trunc(x * 255)`, matching ManimCE). Because every parsed channel is an
 * exact `k / 255`, a hex -> rgb -> hex round trip is exact, but a general
 * `invert`/`interpolate` round trip is NOT (truncation loses sub-byte detail),
 * so those are checked only with a one-byte tolerance.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  hexToRgb,
  rgbToHex,
  colorToIntRgb,
  interpolateColor,
  invertColor,
  averageColor,
  hsvToRgb,
  rgbToHsv,
} from './color';

const BYTE_TOLERANCE = 1 / 255 + 1e-9;
const EPS = 1e-9;

/** A single 0..255 channel byte. */
const byte = fc.integer({ min: 0, max: 255 });
const hexByte = (v: number): string => v.toString(16).toUpperCase().padStart(2, '0');
/** A canonical `#RRGGBB` string (uppercase), the form `rgbToHex` emits. */
const hexColor = fc
  .tuple(byte, byte, byte)
  .map(([r, g, b]) => `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`);
/** A unit-interval channel. */
const unitChannel = fc.double({ min: 0, max: 1, noNaN: true });

describe('color hex parsing and encoding properties', () => {
  it('hexToRgb yields three channels in [0, 1]', () => {
    fc.assert(
      fc.property(hexColor, (hex) => {
        const rgb = hexToRgb(hex);
        expect(rgb).toHaveLength(3);
        for (const c of rgb) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('hex -> rgb -> hex is an exact round trip', () => {
    fc.assert(
      fc.property(hexColor, (hex) => {
        expect(rgbToHex(hexToRgb(hex))).toBe(hex);
      }),
      { numRuns: 300 },
    );
  });

  it('colorToIntRgb yields three integers in [0, 255]', () => {
    fc.assert(
      fc.property(hexColor, (hex) => {
        const rgb = colorToIntRgb(hex);
        for (const c of rgb) {
          expect(Number.isInteger(c)).toBe(true);
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(255);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe('color interpolation and averaging properties', () => {
  it('interpolateColor at alpha 0 returns color1 and at alpha 1 returns color2 (exact)', () => {
    fc.assert(
      fc.property(hexColor, hexColor, (c1, c2) => {
        expect(interpolateColor(c1, c2, 0)).toBe(c1);
        expect(interpolateColor(c1, c2, 1)).toBe(c2);
      }),
      { numRuns: 300 },
    );
  });

  it('interpolateColor channels stay within the per-channel bounds of the inputs', () => {
    fc.assert(
      fc.property(hexColor, hexColor, fc.double({ min: 0, max: 1, noNaN: true }), (c1, c2, a) => {
        const out = hexToRgb(interpolateColor(c1, c2, a));
        const lo = hexToRgb(c1);
        const hi = hexToRgb(c2);
        for (let d = 0; d < 3; d++) {
          const min = Math.min(lo[d], hi[d]);
          const max = Math.max(lo[d], hi[d]);
          expect(out[d]).toBeGreaterThanOrEqual(min - BYTE_TOLERANCE);
          expect(out[d]).toBeLessThanOrEqual(max + BYTE_TOLERANCE);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('averageColor of a single color returns that same color (exact)', () => {
    fc.assert(
      fc.property(hexColor, (c) => {
        expect(averageColor(c)).toBe(c);
      }),
      { numRuns: 200 },
    );
  });

  it('averageColor channels stay within the min/max of the input channels', () => {
    fc.assert(
      fc.property(fc.array(hexColor, { minLength: 1, maxLength: 6 }), (colors) => {
        const out = hexToRgb(averageColor(...colors));
        const rgbs = colors.map(hexToRgb);
        for (let d = 0; d < 3; d++) {
          const vals = rgbs.map((c) => c[d]);
          expect(out[d]).toBeGreaterThanOrEqual(Math.min(...vals) - BYTE_TOLERANCE);
          expect(out[d]).toBeLessThanOrEqual(Math.max(...vals) + BYTE_TOLERANCE);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('invertColor negates each channel to within one byte of 1 - original', () => {
    fc.assert(
      fc.property(hexColor, (c) => {
        const original = hexToRgb(c);
        const inverted = hexToRgb(invertColor(c));
        for (let d = 0; d < 3; d++) {
          expect(Math.abs(inverted[d] - (1 - original[d]))).toBeLessThanOrEqual(BYTE_TOLERANCE);
        }
      }),
      { numRuns: 300 },
    );
  });
});

describe('color space conversion properties', () => {
  it('hsvToRgb yields three channels in [0, 1] for hsv in the unit cube', () => {
    fc.assert(
      fc.property(unitChannel, unitChannel, unitChannel, (h, s, v) => {
        const rgb = hsvToRgb([h, s, v]);
        for (const c of rgb) {
          expect(c).toBeGreaterThanOrEqual(-EPS);
          expect(c).toBeLessThanOrEqual(1 + EPS);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('rgb -> hsv -> rgb is an identity within float tolerance', () => {
    fc.assert(
      fc.property(unitChannel, unitChannel, unitChannel, (r, g, b) => {
        const back = hsvToRgb(rgbToHsv([r, g, b]));
        expect(Math.abs(back[0] - r)).toBeLessThanOrEqual(1e-9);
        expect(Math.abs(back[1] - g)).toBeLessThanOrEqual(1e-9);
        expect(Math.abs(back[2] - b)).toBeLessThanOrEqual(1e-9);
      }),
      { numRuns: 400 },
    );
  });

  it('rgbToHsv keeps h, s, v inside the unit interval', () => {
    fc.assert(
      fc.property(unitChannel, unitChannel, unitChannel, (r, g, b) => {
        const [h, s, v] = rgbToHsv([r, g, b]);
        for (const c of [h, s, v]) {
          expect(c).toBeGreaterThanOrEqual(-EPS);
          expect(c).toBeLessThanOrEqual(1 + EPS);
        }
      }),
      { numRuns: 300 },
    );
  });
});
