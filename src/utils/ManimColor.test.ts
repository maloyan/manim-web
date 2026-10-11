import { describe, expect, it } from 'vitest';

import { hsvToRgb } from './color';
import {
  getShadedRgb,
  HSV,
  ManimColor,
  ParsableManimColor,
  RandomColorGenerator,
  RGBA,
} from './ManimColor';

describe('ManimColor construction', () => {
  it('round-trips hex -> rgb -> hex', () => {
    expect(new ManimColor('#FC6255').toHex()).toBe('#FC6255');
    expect(new ManimColor('#FFFFFF').toRgb()).toEqual([1, 1, 1]);
    expect(ManimColor.fromRgb([1, 1, 1]).toHex()).toBe('#FFFFFF');
  });

  it('accepts a 0x prefix and short (3/4-digit) hex', () => {
    expect(new ManimColor('0xFF0000').toHex()).toBe('#FF0000');
    expect(new ManimColor('#f00').toHex()).toBe('#FF0000');
  });

  it('builds from an rgb tuple (0..1 floats)', () => {
    expect(new ManimColor([1, 0, 0]).toHex()).toBe('#FF0000');
  });

  it('builds from an rgba tuple carrying its own alpha', () => {
    const c = new ManimColor([1, 0, 0, 0.5]);
    expect(c.toRgba()).toEqual([1, 0, 0, 0.5]);
    expect(c.toHex(true)).toBe('#FF00007F');
  });

  it('builds from a packed integer', () => {
    expect(new ManimColor(0xfc6255).toHex()).toBe('#FC6255');
  });

  it('builds from a palette name', () => {
    expect(new ManimColor('RED').toHex()).toBe('#FC6255');
  });

  it('copies another ManimColor', () => {
    const src = new ManimColor('#123456');
    expect(new ManimColor(src).equals(src)).toBe(true);
  });

  it('defaults null to black with the given alpha', () => {
    expect(new ManimColor(null, 0.25).toRgba()).toEqual([0, 0, 0, 0.25]);
  });
});

describe('ManimColor conversions', () => {
  it('toIntRgb truncates to 0..255', () => {
    expect(new ManimColor('#FFFFFF').toIntRgb()).toEqual([255, 255, 255]);
    expect(new ManimColor('#FC6255').toIntRgb()).toEqual([252, 98, 85]);
  });

  it('toIntRgba includes the alpha byte', () => {
    expect(new ManimColor([1, 0, 0, 0.5]).toIntRgba()).toEqual([255, 0, 0, 127]);
  });

  it('toHsv matches the free hsv conversion', () => {
    const rgb = new ManimColor('#58C4DD').toRgb();
    const hsv = new ManimColor('#58C4DD').toHsv();
    expect(hsvToRgb(hsv)[0]).toBeCloseTo(rgb[0], 10);
    expect(hsvToRgb(hsv)[1]).toBeCloseTo(rgb[1], 10);
    expect(hsvToRgb(hsv)[2]).toBeCloseTo(rgb[2], 10);
  });
});

describe('ManimColor transforms', () => {
  it('interpolates the midpoint in rgb space', () => {
    const mid = new ManimColor('#000000').interpolate(new ManimColor('#FFFFFF'), 0.5);
    expect(mid.toHex()).toBe('#7F7F7F');
  });

  it('interpolate endpoints return the endpoints', () => {
    const a = new ManimColor('#FC6255');
    const b = new ManimColor('#58C4DD');
    expect(a.interpolate(b, 0).toHex()).toBe('#FC6255');
    expect(a.interpolate(b, 1).toHex()).toBe('#58C4DD');
  });

  it('inverts channels but keeps alpha by default', () => {
    expect(new ManimColor('#FFFFFF').invert().toHex()).toBe('#000000');
    const c = new ManimColor([1, 1, 1, 0.3]).invert();
    expect(c.toRgba()).toEqual([0, 0, 0, 0.3]);
  });

  it('inverts alpha when asked', () => {
    expect(new ManimColor([1, 1, 1, 0.25]).invert(true).toRgba()).toEqual([0, 0, 0, 0.75]);
  });

  it('opacity and withAlpha set the alpha', () => {
    expect(new ManimColor('#FF0000').opacity(0.4).toRgba()).toEqual([1, 0, 0, 0.4]);
    expect(new ManimColor('#FF0000').withAlpha(0.4).toRgba()).toEqual([1, 0, 0, 0.4]);
  });

  it('darker(0) and lighter(0) are no-ops; darker/lighter move toward black/white', () => {
    expect(new ManimColor('#808080').darker(0).toHex()).toBe('#808080');
    expect(new ManimColor('#808080').lighter(0).toHex()).toBe('#808080');
    const red = new ManimColor('#FF0000');
    expect(red.darker(0.5).toRgb()).toEqual([0.5, 0, 0]);
    expect(red.lighter(0.5).toRgb()).toEqual([1, 0.5, 0.5]);
  });

  it('darker preserves opacity', () => {
    expect(new ManimColor([1, 0, 0, 0.6]).darker(0.5).toRgba()[3]).toBeCloseTo(0.6, 10);
  });
});

describe('ManimColor.parse', () => {
  it('parses each single input form into a ManimColor', () => {
    const forms: ParsableManimColor[] = ['#FF0000', 0xff0000, [1, 0, 0], [1, 0, 0, 0.5]];
    for (const form of forms) {
      expect(ManimColor.parse(form)).toBeInstanceOf(ManimColor);
    }
    expect(ManimColor.parse(new ManimColor('#FF0000'))).toBeInstanceOf(ManimColor);
  });

  it('parses a list of colors into an array', () => {
    const parsed = ManimColor.parse(['#FF0000', '#00FF00']);
    expect(Array.isArray(parsed)).toBe(true);
    expect((parsed as ManimColor[]).map((c) => c.toHex())).toEqual(['#FF0000', '#00FF00']);
  });
});

describe('HSV and RGBA', () => {
  it('HSV construction matches hsvToRgb', () => {
    const hsv: [number, number, number] = [0.5, 0.6, 0.7];
    const expected = hsvToRgb(hsv);
    const got = new HSV(hsv).toRgb();
    expect(got[0]).toBeCloseTo(expected[0], 10);
    expect(got[1]).toBeCloseTo(expected[1], 10);
    expect(got[2]).toBeCloseTo(expected[2], 10);
  });

  it('HSV exposes h/s/v and an alpha', () => {
    const c = new HSV([0.25, 0.5, 0.75], 0.4);
    expect([c.h, c.s, c.v]).toEqual([0.25, 0.5, 0.75]);
    expect(c.toRgba()[3]).toBe(0.4);
  });

  it('RGBA is a ManimColor that takes an rgba tuple', () => {
    const c = new RGBA([1, 0, 0, 0.5]);
    expect(c).toBeInstanceOf(ManimColor);
    expect(c.toRgba()).toEqual([1, 0, 0, 0.5]);
  });
});

describe('RandomColorGenerator', () => {
  it('is deterministic for a given seed', () => {
    const a = new RandomColorGenerator(42);
    const b = new RandomColorGenerator(42);
    const seqA = Array.from({ length: 12 }, () => a.next().toHex());
    const seqB = Array.from({ length: 12 }, () => b.next().toHex());
    expect(seqA).toEqual(seqB);
    expect(typeof seqA[0]).toBe('string');
  });

  it('samples only from a custom palette', () => {
    const palette = ['#FF0000', '#00FF00', '#0000FF'];
    const rnd = new RandomColorGenerator(1, palette);
    for (let i = 0; i < 20; i += 1) {
      expect(palette).toContain(rnd.next().toHex());
    }
  });
});

describe('getShadedRgb', () => {
  it('lights a surface facing the light source', () => {
    // normal . to_sun = 1, light = 0.5 * 1^3 = 0.5, so 0.5 + 0.5 = 1.0
    expect(getShadedRgb([0.5, 0.5, 0.5], [0, 0, 0], [0, 0, 1], [0, 0, 1])).toEqual([1, 1, 1]);
  });

  it('shades a surface facing away (negative light is halved)', () => {
    // normal . to_sun = -1, light = 0.5 * (-1)^3 = -0.5, then *0.5 = -0.25
    const shaded = getShadedRgb([0.5, 0.5, 0.5], [0, 0, 0], [0, 0, 1], [0, 0, -1]);
    expect(shaded[0]).toBeCloseTo(0.25, 10);
    expect(shaded[1]).toBeCloseTo(0.25, 10);
    expect(shaded[2]).toBeCloseTo(0.25, 10);
  });
});
