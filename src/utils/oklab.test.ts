import { describe, it, expect } from 'vitest';
import { colorToRgb, interpolateColor } from './color';
import {
  colorToOklab,
  oklabToColor,
  colorToOklch,
  oklchToColor,
  interpolateColorOklab,
  interpolateColorOklch,
  type Oklch,
} from './oklab';

/** Assert two numbers are equal to within `tol`. */
function closeTo(actual: number, expected: number, tol: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

describe('colorToOklab reference values', () => {
  it('maps white to L=1, a=0, b=0', () => {
    const [L, a, b] = colorToOklab('#FFFFFF');
    closeTo(L, 1.0, 1e-4);
    closeTo(a, 0.0, 1e-4);
    closeTo(b, 0.0, 1e-4);
  });

  it('maps black to L=0, a=0, b=0', () => {
    const [L, a, b] = colorToOklab('#000000');
    closeTo(L, 0.0, 1e-7);
    closeTo(a, 0.0, 1e-7);
    closeTo(b, 0.0, 1e-7);
  });

  it('matches Ottosson reference for pure sRGB red', () => {
    // Reference from Björn Ottosson's Oklab post.
    const [L, a, b] = colorToOklab('#FF0000');
    closeTo(L, 0.6279554, 1e-4);
    closeTo(a, 0.2248631, 1e-4);
    closeTo(b, 0.1258463, 1e-4);
  });
});

describe('colorToOklch reference values', () => {
  it('gives pure red a hue near 29.23 degrees', () => {
    const [, C, h] = colorToOklch('#FF0000');
    expect(C).toBeGreaterThan(0.2);
    closeTo(h, 29.23, 0.1);
  });

  it('gives pure green a hue near 142.5 degrees', () => {
    const [, , h] = colorToOklch('#00FF00');
    closeTo(h, 142.5, 0.5);
  });

  it('gives pure blue a hue near 264.05 degrees', () => {
    const [, , h] = colorToOklch('#0000FF');
    closeTo(h, 264.05, 0.5);
  });
});

describe('round-trips to tight tolerance', () => {
  const samples = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#123456',
    '#ABCDEF',
    '#58C4DD', // Manim BLUE
    '#FC6255', // Manim RED
    '#83C167', // Manim GREEN
    '#808080',
  ];

  it('sRGB -> Oklab -> sRGB preserves the color', () => {
    for (const hex of samples) {
      const back = oklabToColor(colorToOklab(hex));
      expect(back).toBe(hex);
    }
  });

  it('sRGB -> Oklch -> sRGB preserves the color', () => {
    for (const hex of samples) {
      const back = oklchToColor(colorToOklch(hex));
      expect(back).toBe(hex);
    }
  });

  it('Oklab -> Oklch -> Oklab preserves the components', () => {
    for (const hex of samples) {
      const lab = colorToOklab(hex);
      const lch = colorToOklch(hex);
      const labBack = oklchToColor(lch);
      // Compare via re-encoded hex to avoid gray-hue ambiguity.
      expect(labBack).toBe(oklabToColor(lab));
    }
  });
});

describe('interpolateColorOklab', () => {
  it('returns the endpoints at alpha 0 and 1', () => {
    expect(interpolateColorOklab('#FF0000', '#0000FF', 0)).toBe('#FF0000');
    expect(interpolateColorOklab('#FF0000', '#0000FF', 1)).toBe('#0000FF');
  });

  it('is perceptual: a 50% mix differs from the linear-RGB mix', () => {
    const oklab = interpolateColorOklab('#FF0000', '#0000FF', 0.5);
    const linear = interpolateColor('#FF0000', '#0000FF', 0.5);
    expect(oklab).not.toBe(linear);
    // The Oklab midpoint of red and blue is a vivid purple, brighter than
    // the muddy linear-RGB midpoint. Its channels sum higher.
    const [or, og, ob] = colorToRgb(oklab);
    const [lr, lg, lb] = colorToRgb(linear);
    expect(or + og + ob).toBeGreaterThan(lr + lg + lb);
  });
});

describe('interpolateColorOklch hue shortest path', () => {
  it('returns the endpoints at alpha 0 and 1', () => {
    expect(interpolateColorOklch('#FF0000', '#00FF00', 0)).toBe('#FF0000');
    expect(interpolateColorOklch('#FF0000', '#00FF00', 1)).toBe('#00FF00');
  });

  it('interpolates hue the short way around the circle', () => {
    // Red hue ~29 deg, a hue near 350 deg is only ~39 deg away the short way
    // (through 0/360), not ~321 deg the long way. The midpoint hue must land
    // in the short arc, i.e. wrap past 360/0 rather than drop toward 180.
    const red: Oklch = colorToOklch('#FF0000');
    const redH = red[2]; // ~29.23
    const nearWrap: Oklch = [red[0], red[1], 350];
    const endHex = oklchToColor(nearWrap);
    const mid = colorToOklch(interpolateColorOklch('#FF0000', endHex, 0.5));
    const midH = mid[2];
    // Short-path midpoint between 29.23 and 350 is ~9.6 deg (wrapped),
    // which normalizes to a value either near 9.6 or near 369.6 -> 9.6.
    // It must NOT be near the long-path midpoint of ~189.6.
    const shortMid = ((redH + 350 + 360) / 2) % 360; // ~189.6 is long; short wraps
    void shortMid;
    const distToShort = Math.min(Math.abs(midH - 9.6), 360 - Math.abs(midH - 9.6));
    expect(distToShort).toBeLessThan(2);
  });

  it('keeps a near-constant hue when both endpoints share it', () => {
    // Two reds of different lightness keep the red hue through the blend.
    const darkRed = oklchToColor([0.3, 0.1, 29.23]);
    const mid = colorToOklch(interpolateColorOklch('#FF0000', darkRed, 0.5));
    closeTo(mid[2], 29.23, 1);
  });
});
