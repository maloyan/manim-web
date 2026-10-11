import { describe, it, expect } from 'vitest';
import {
  colorToRgb,
  colorToRgba,
  colorToIntRgb,
  colorToIntRgba,
  rgbToColor,
  rgbaToColor,
  rgbToHex,
  hexToRgb,
  invertColor,
  interpolateColor,
  averageColor,
  colorGradient,
  randomColor,
  randomBrightColor,
  hsvToRgb,
  rgbToHsv,
} from './color';

describe('hexToRgb / colorToRgb', () => {
  it('maps white to [1, 1, 1] (0..1 convention)', () => {
    expect(hexToRgb('#FFFFFF')).toEqual([1, 1, 1]);
    expect(colorToRgb('#FFFFFF')).toEqual([1, 1, 1]);
  });

  it('maps black to [0, 0, 0]', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
  });

  it('parses primary channels', () => {
    expect(hexToRgb('#FF0000')).toEqual([1, 0, 0]);
    expect(hexToRgb('#00FF00')).toEqual([0, 1, 0]);
    expect(hexToRgb('#0000FF')).toEqual([0, 0, 1]);
  });

  it('expands 3-digit shorthand by doubling', () => {
    expect(hexToRgb('#F00')).toEqual([1, 0, 0]);
    expect(hexToRgb('#FFF')).toEqual([1, 1, 1]);
  });

  it('accepts a 0x prefix', () => {
    expect(hexToRgb('0xFF0000')).toEqual([1, 0, 0]);
  });

  it('is case insensitive', () => {
    expect(hexToRgb('#ff0000')).toEqual([1, 0, 0]);
  });

  it('throws on an unparseable string', () => {
    expect(() => hexToRgb('not-a-color')).toThrow();
  });
});

describe('colorToRgba', () => {
  it('appends the given alpha (default 1.0)', () => {
    expect(colorToRgba('#FF0000')).toEqual([1, 0, 0, 1]);
    expect(colorToRgba('#FF0000', 0.5)).toEqual([1, 0, 0, 0.5]);
  });

  it('replaces any alpha carried by an 8-digit color', () => {
    expect(colorToRgba('#FF000000', 1.0)).toEqual([1, 0, 0, 1]);
  });
});

describe('colorToIntRgb / colorToIntRgba', () => {
  it('scales to 0..255 and truncates', () => {
    expect(colorToIntRgb('#FFFFFF')).toEqual([255, 255, 255]);
    expect(colorToIntRgb('#808080')).toEqual([128, 128, 128]);
  });

  it('truncates toward zero (int(0.5 * 255) === 127)', () => {
    // #7F7F7F == 127/255, and 127/255 * 255 rounds back to 127 exactly.
    expect(colorToIntRgb('#7F7F7F')).toEqual([127, 127, 127]);
  });

  it('scales alpha to 0..255', () => {
    expect(colorToIntRgba('#FF0000', 1.0)).toEqual([255, 0, 0, 255]);
    expect(colorToIntRgba('#FF0000', 0.5)).toEqual([255, 0, 0, 127]);
  });
});

describe('rgbToHex / rgbToColor / rgbaToColor', () => {
  it('formats 0..1 floats as uppercase #RRGGBB', () => {
    expect(rgbToHex([1, 1, 1])).toBe('#FFFFFF');
    expect(rgbToHex([0, 0, 0])).toBe('#000000');
    expect(rgbToColor([1, 0, 0])).toBe('#FF0000');
  });

  it('truncates channels like ManimCE (0.5 -> 0x7F)', () => {
    expect(rgbToHex([0.5, 0, 0.5])).toBe('#7F007F');
  });

  it('drops alpha in rgbaToColor', () => {
    expect(rgbaToColor([1, 0, 0, 0.5])).toBe('#FF0000');
  });

  it('round-trips hex -> rgb -> hex', () => {
    expect(rgbToHex(hexToRgb('#58C4DD'))).toBe('#58C4DD');
  });
});

describe('invertColor', () => {
  it('linearly inverts each channel', () => {
    expect(invertColor('#000000')).toBe('#FFFFFF');
    expect(invertColor('#FFFFFF')).toBe('#000000');
    expect(invertColor('#FF0000')).toBe('#00FFFF');
  });
});

describe('interpolateColor', () => {
  it('returns the endpoints at alpha 0 and 1', () => {
    expect(interpolateColor('#FF0000', '#0000FF', 0)).toBe('#FF0000');
    expect(interpolateColor('#FF0000', '#0000FF', 1)).toBe('#0000FF');
  });

  it('returns the RGB midpoint at alpha 0.5 (#7F007F)', () => {
    expect(interpolateColor('#FF0000', '#0000FF', 0.5)).toBe('#7F007F');
  });
});

describe('averageColor', () => {
  it('averages the RGB primaries to #555555', () => {
    expect(averageColor('#FF0000', '#00FF00', '#0000FF')).toBe('#555555');
  });

  it('averages two colors', () => {
    expect(averageColor('#000000', '#FFFFFF')).toBe('#7F7F7F');
  });

  it('throws when given no colors', () => {
    expect(() => averageColor()).toThrow();
  });
});

describe('colorGradient', () => {
  it('produces exactly the requested number of colors', () => {
    expect(colorGradient(['#FF0000', '#0000FF'], 5)).toHaveLength(5);
  });

  it('keeps the endpoints and puts an achromatic gray between them', () => {
    // colorGradient is the existing VMobject helper, which interpolates in
    // THREE's linear-RGB space; here we only assert the endpoints survive and
    // the middle color is an achromatic gray (r == g == b).
    const g = colorGradient(['#000000', '#FFFFFF'], 3);
    expect(g[0].toUpperCase()).toBe('#000000');
    expect(g[2].toUpperCase()).toBe('#FFFFFF');
    const [r, gr, b] = hexToRgb(g[1]);
    expect(r).toBe(gr);
    expect(gr).toBe(b);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1);
  });

  it('returns an empty array for length 0', () => {
    expect(colorGradient(['#FF0000', '#00FF00'], 0)).toEqual([]);
  });
});

describe('randomColor / randomBrightColor', () => {
  it('returns a valid 6-digit hex color', () => {
    expect(randomColor()).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('randomBrightColor returns a valid hex color with every channel >= ~0.5', () => {
    // 0.5 * (x + 1) >= 0.5, then truncated by rgbToHex to >= 127/255.
    const minChannel = 127 / 255;
    const [r, g, b] = hexToRgb(randomBrightColor());
    expect(r).toBeGreaterThanOrEqual(minChannel);
    expect(g).toBeGreaterThanOrEqual(minChannel);
    expect(b).toBeGreaterThanOrEqual(minChannel);
  });
});

describe('hsvToRgb / rgbToHsv', () => {
  it('matches colorsys for known values', () => {
    expect(hsvToRgb([0.5, 1.0, 1.0])).toEqual([0.0, 1.0, 1.0]);
    expect(rgbToHsv([1.0, 0.0, 0.0])).toEqual([0.0, 1.0, 1.0]);
  });

  it('returns a gray for zero saturation', () => {
    expect(hsvToRgb([0.3, 0.0, 0.7])).toEqual([0.7, 0.7, 0.7]);
  });

  it('round-trips rgb -> hsv -> rgb', () => {
    const samples: [number, number, number][] = [
      [0.5, 0.25, 0.75],
      [0.2, 0.8, 0.4],
      [0.9, 0.1, 0.6],
    ];
    for (const rgb of samples) {
      const back = hsvToRgb(rgbToHsv(rgb));
      expect(back[0]).toBeCloseTo(rgb[0], 10);
      expect(back[1]).toBeCloseTo(rgb[1], 10);
      expect(back[2]).toBeCloseTo(rgb[2], 10);
    }
  });

  it('computes the expected hsv for a sample', () => {
    const [h, s, v] = rgbToHsv([0.5, 0.25, 0.75]);
    expect(h).toBeCloseTo(0.75, 10);
    expect(s).toBeCloseTo(2 / 3, 10);
    expect(v).toBeCloseTo(0.75, 10);
  });
});
