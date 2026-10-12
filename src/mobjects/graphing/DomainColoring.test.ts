import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { DomainColoring, phasePortraitColor } from './DomainColoring';
import { Complex, ComplexPlane } from './ComplexPlane';
import { rgbToHsv, hexToRgb } from '../../utils/color';

/** The identity f(z) = z. */
const identity = (z: Complex): Complex => z;

describe('DomainColoring', () => {
  it('maps arg(f(z)) to hue: +real is hue 0, +imaginary is a quarter turn', () => {
    const portrait = new DomainColoring({ func: identity, resolution: 8 });

    // Positive real axis -> argument 0 -> hue 0.
    const realHue = rgbToHsv(hexToRgb(portrait.colorAt({ re: 1, im: 0 })))[0];
    expect(realHue).toBeCloseTo(0, 5);

    // Positive imaginary axis -> argument pi/2 -> hue shifted 90 degrees (0.25).
    const imagHue = rgbToHsv(hexToRgb(portrait.colorAt({ re: 0, im: 1 })))[0];
    expect(imagHue).toBeCloseTo(0.25, 2);

    // Negative real axis -> argument pi -> hue 180 degrees (0.5).
    const negHue = rgbToHsv(hexToRgb(portrait.colorAt({ re: -1, im: 0 })))[0];
    expect(negHue).toBeCloseTo(0.5, 2);
  });

  it('brightens with the modulus under the smooth scheme', () => {
    const portrait = new DomainColoring({ func: identity, scheme: 'smooth', resolution: 4 });
    const near = rgbToHsv(phasePortraitColor({ re: 0.1, im: 0 }, 'smooth', 1, false))[2];
    const far = rgbToHsv(phasePortraitColor({ re: 10, im: 0 }, 'smooth', 1, false))[2];
    // A value of the hsv triple is brightness; a larger modulus is brighter.
    expect(far).toBeGreaterThan(near);
    // A zero is black, a far value approaches white.
    expect(rgbToHsv(phasePortraitColor({ re: 0, im: 0 }, 'smooth', 1, false))[2]).toBeCloseTo(0, 5);
    expect(far).toBeGreaterThan(0.9);
    // The portrait exists so the instance option path is exercised.
    expect(portrait.getScheme()).toBe('smooth');
  });

  it('never produces NaN or out-of-range colors at zeros or poles', () => {
    // f(z) = 1/z has a pole at 0 and a zero at infinity.
    const portrait = new DomainColoring({
      func: (z) => ComplexPlane.reciprocal(z),
      reRange: [-1, 1],
      imRange: [-1, 1],
      resolution: 16,
    });
    const data = portrait.getPixelData();
    for (let i = 0; i < data.length; i++) {
      expect(Number.isNaN(data[i])).toBe(false);
      expect(data[i]).toBeGreaterThanOrEqual(0);
      expect(data[i]).toBeLessThanOrEqual(255);
    }

    // Direct checks on the pole and a NaN value.
    const pole = phasePortraitColor({ re: Infinity, im: Infinity }, 'banded', 1, false);
    const nan = phasePortraitColor({ re: NaN, im: NaN }, 'banded', 1, false);
    for (const c of [...pole, ...nan]) {
      expect(Number.isFinite(c)).toBe(true);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('sizes the pixel buffer from the resolution', () => {
    const square = new DomainColoring({ func: identity, resolution: 32 });
    expect(square.getResolution()).toEqual([32, 32]);
    expect(square.getPixelData().length).toBe(32 * 32 * 4);

    const rect = new DomainColoring({ func: identity, resolution: [20, 10] });
    expect(rect.getResolution()).toEqual([20, 10]);
    expect(rect.getPixelData().length).toBe(20 * 10 * 4);
  });

  it('paints a constant function as a single uniform color', () => {
    const portrait = new DomainColoring({
      func: () => ({ re: 2, im: 1 }),
      resolution: 12,
    });
    const data = portrait.getPixelData();
    const [r0, g0, b0, a0] = [data[0], data[1], data[2], data[3]];
    for (let i = 0; i < data.length; i += 4) {
      expect(data[i]).toBe(r0);
      expect(data[i + 1]).toBe(g0);
      expect(data[i + 2]).toBe(b0);
      expect(data[i + 3]).toBe(a0);
    }
  });

  it('maps pixel coordinates to the complex region, top row first', () => {
    const portrait = new DomainColoring({
      func: identity,
      reRange: [-2, 2],
      imRange: [-3, 3],
      resolution: [5, 7],
    });
    // Top-left pixel is (reMin, imMax); bottom-right is (reMax, imMin).
    expect(portrait.pixelToComplex(0, 0)).toEqual({ re: -2, im: 3 });
    expect(portrait.pixelToComplex(4, 6)).toEqual({ re: 2, im: -3 });
  });

  it('constructs headless and builds a textured mesh', () => {
    const portrait = new DomainColoring({ func: identity, resolution: 8 });
    const mesh = portrait.getThreeObject() as THREE.Mesh;
    expect(mesh.isMesh).toBe(true);
    const material = mesh.material as THREE.MeshBasicMaterial;
    expect(material.map).toBeInstanceOf(THREE.Texture);
    expect(mesh.geometry.getAttribute('uv')).toBeDefined();
    expect(mesh.geometry.getIndex()?.count).toBe(6);
  });

  it('copies into an independent instance', () => {
    const portrait = new DomainColoring({ func: identity, scheme: 'smooth', resolution: 4 });
    const copy = portrait.copy();
    expect(copy).toBeInstanceOf(DomainColoring);
    expect(copy.getScheme()).toBe('smooth');
    expect(copy.getResolution()).toEqual([4, 4]);
    expect(copy.colorAt({ re: 1, im: 0 })).toBe(portrait.colorAt({ re: 1, im: 0 }));
  });

  it('darkens modulus contour lines when requested', () => {
    // At |f| = 1 (octave 0) the contour darkens brightness toward CONTOUR_DARKEN.
    const plain = rgbToHsv(phasePortraitColor({ re: 1, im: 0 }, 'smooth', 1, false))[2];
    const lined = rgbToHsv(phasePortraitColor({ re: 1, im: 0 }, 'smooth', 1, true))[2];
    expect(lined).toBeLessThan(plain);
  });
});
