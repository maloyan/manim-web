import { describe, it, expect } from 'vitest';
import { VMobject } from '../core/VMobject';
import { ApplyComplexFunction, applyComplexFunction } from './transform/ApplyTransforms';
import type { Complex } from './movement/Homotopy';

// Helpers
function vm(pts: number[][]): VMobject {
  const v = new VMobject();
  v.setPoints(pts);
  return v;
}

describe('ApplyComplexFunction', () => {
  it('stores func, mobject, and default duration', () => {
    const fn = (z: Complex) => ({ re: z.re * 2, im: z.im * 2 });
    const v = vm([[1, 2, 0]]);
    const anim = new ApplyComplexFunction(v, { func: fn });
    expect(anim.func).toBe(fn);
    expect(anim.mobject).toBe(v);
    expect(anim.duration).toBe(1);
  });

  it('applies z => z^2 correctly', () => {
    // z = 1+i => z^2 = (1+i)^2 = 1 + 2i - 1 = 2i => (0, 2)
    const v = vm([[1, 1, 0]]);
    const anim = new ApplyComplexFunction(v, {
      func: (z) => ({ re: z.re * z.re - z.im * z.im, im: 2 * z.re * z.im }),
    });
    anim.begin();
    anim.interpolate(1);
    const pts = v.getPoints();
    expect(pts[0][0]).toBeCloseTo(0, 5);
    expect(pts[0][1]).toBeCloseTo(2, 5);
    expect(pts[0][2]).toBeCloseTo(0, 5); // z preserved
  });

  it('interpolates linearly between start and target', () => {
    // z = 2+0i, func: z => z*2 = 4+0i
    const v = vm([[2, 0, 0]]);
    const anim = new ApplyComplexFunction(v, {
      func: (z) => ({ re: z.re * 2, im: z.im * 2 }),
    });
    anim.begin();

    anim.interpolate(0);
    expect(v.getPoints()[0][0]).toBeCloseTo(2, 5); // start

    anim.interpolate(0.5);
    expect(v.getPoints()[0][0]).toBeCloseTo(3, 5); // midpoint: lerp(2, 4, 0.5) = 3

    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(4, 5); // end
  });

  it('preserves z coordinate', () => {
    const v = vm([[1, 0, 5]]);
    const anim = new ApplyComplexFunction(v, {
      func: (z) => ({ re: z.re + 10, im: z.im }),
    });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][2]).toBeCloseTo(5, 5);
  });

  it('handles multiple points', () => {
    const v = vm([
      [1, 0, 0],
      [0, 1, 0],
      [-1, 0, 0],
    ]);
    // z => z * i = (-im, re)
    const anim = new ApplyComplexFunction(v, {
      func: (z) => ({ re: -z.im, im: z.re }),
    });
    anim.begin();
    anim.interpolate(1);
    const pts = v.getPoints();
    expect(pts[0][0]).toBeCloseTo(0, 5); // 1+0i => 0+1i
    expect(pts[0][1]).toBeCloseTo(1, 5);
    expect(pts[1][0]).toBeCloseTo(-1, 5); // 0+1i => -1+0i
    expect(pts[1][1]).toBeCloseTo(0, 5);
    expect(pts[2][0]).toBeCloseTo(0, 5); // -1+0i => 0-1i
    expect(pts[2][1]).toBeCloseTo(-1, 5);
  });

  it('finish sets final points exactly', () => {
    const v = vm([[3, 4, 0]]);
    const anim = new ApplyComplexFunction(v, {
      func: (z) => ({ re: z.re * 2, im: z.im * 2 }),
    });
    anim.begin();
    anim.finish();
    const pts = v.getPoints();
    expect(pts[0][0]).toBeCloseTo(6, 5);
    expect(pts[0][1]).toBeCloseTo(8, 5);
  });

  it('identity function preserves points', () => {
    const v = vm([[1, 2, 3]]);
    const anim = new ApplyComplexFunction(v, {
      func: (z) => z,
    });
    anim.begin();
    anim.interpolate(1);
    const pts = v.getPoints();
    expect(pts[0][0]).toBeCloseTo(1, 5);
    expect(pts[0][1]).toBeCloseTo(2, 5);
    expect(pts[0][2]).toBeCloseTo(3, 5);
  });

  it('factory creates ApplyComplexFunction', () => {
    const fn = (z: Complex) => z;
    const v = vm([[0, 0, 0]]);
    expect(applyComplexFunction(v, fn)).toBeInstanceOf(ApplyComplexFunction);
  });

  it('complex conjugate function works', () => {
    // z => conj(z) = (re, -im)
    const v = vm([[3, 4, 0]]);
    const anim = new ApplyComplexFunction(v, {
      func: (z) => ({ re: z.re, im: -z.im }),
    });
    anim.begin();
    anim.interpolate(1);
    expect(v.getPoints()[0][0]).toBeCloseTo(3, 5);
    expect(v.getPoints()[0][1]).toBeCloseTo(-4, 5);
  });

  it('works with custom duration', () => {
    const v = vm([[0, 0, 0]]);
    const anim = new ApplyComplexFunction(v, {
      func: (z) => z,
      duration: 3,
    });
    expect(anim.duration).toBe(3);
  });
});
