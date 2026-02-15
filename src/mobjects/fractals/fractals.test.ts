import { describe, it, expect } from 'vitest';
import { MandelbrotSet } from './MandelbrotSet';
import { NewtonFractal } from './NewtonFractal';

// ==========================================================================
// MandelbrotSet
// ==========================================================================

describe('MandelbrotSet', () => {
  describe('construction with defaults', () => {
    it('has correct default values', () => {
      const m = new MandelbrotSet();
      expect(m.getWidth()).toBe(8);
      expect(m.getHeight()).toBe(6);
      expect(m.getCenter()).toEqual([-0.5, 0, 0]);
      expect(m.getZoom()).toBe(1);
      expect(m.getMaxIterations()).toBe(100);
      expect(m.getSaturation()).toBe(0.8);
      expect(m.getLightness()).toBe(0.5);
      expect(m.opacity).toBe(1);
      expect(m.fillOpacity).toBe(1);
    });
  });

  describe('construction with custom options', () => {
    it('accepts all custom options', () => {
      const m = new MandelbrotSet({
        width: 10,
        height: 8,
        center: [-0.7, 0.3],
        zoom: 50,
        maxIterations: 500,
        saturation: 0.6,
        lightness: 0.4,
        opacity: 0.5,
      });
      expect(m.getWidth()).toBe(10);
      expect(m.getHeight()).toBe(8);
      expect(m.getCenter()).toEqual([-0.7, 0.3, 0]);
      expect(m.getZoom()).toBe(50);
      expect(m.getMaxIterations()).toBe(500);
      expect(m.getSaturation()).toBe(0.6);
      expect(m.getLightness()).toBe(0.4);
      expect(m.opacity).toBe(0.5);
      expect(m.fillOpacity).toBe(0.5);
    });
  });

  describe('setters return this for chaining', () => {
    it('setCenter updates and returns this', () => {
      const m = new MandelbrotSet();
      expect(m.setCenter([1.5, -0.3])).toBe(m);
      expect(m.getCenter()).toEqual([1.5, -0.3, 0]);
    });

    it('setZoom updates and returns this', () => {
      const m = new MandelbrotSet();
      expect(m.setZoom(200)).toBe(m);
      expect(m.getZoom()).toBe(200);
    });

    it('setMaxIterations updates and returns this', () => {
      const m = new MandelbrotSet();
      expect(m.setMaxIterations(300)).toBe(m);
      expect(m.getMaxIterations()).toBe(300);
    });

    it('setSaturation updates and returns this', () => {
      const m = new MandelbrotSet();
      expect(m.setSaturation(0.3)).toBe(m);
      expect(m.getSaturation()).toBe(0.3);
    });

    it('setLightness updates and returns this', () => {
      const m = new MandelbrotSet();
      expect(m.setLightness(0.7)).toBe(m);
      expect(m.getLightness()).toBe(0.7);
    });

    it('setWidth updates and returns this', () => {
      const m = new MandelbrotSet();
      expect(m.setWidth(12)).toBe(m);
      expect(m.getWidth()).toBe(12);
    });

    it('setHeight updates and returns this', () => {
      const m = new MandelbrotSet();
      expect(m.setHeight(9)).toBe(m);
      expect(m.getHeight()).toBe(9);
    });
  });

  describe('validation and clamping', () => {
    it('setMaxIterations rounds to integer', () => {
      const m = new MandelbrotSet();
      m.setMaxIterations(99.7);
      expect(m.getMaxIterations()).toBe(100);
    });

    it('setMaxIterations enforces minimum of 1', () => {
      const m = new MandelbrotSet();
      m.setMaxIterations(0);
      expect(m.getMaxIterations()).toBe(1);
      m.setMaxIterations(-5);
      expect(m.getMaxIterations()).toBe(1);
    });

    it('clamps saturation to [0, 1]', () => {
      const m = new MandelbrotSet();
      m.setSaturation(-0.5);
      expect(m.getSaturation()).toBe(0);
      m.setSaturation(1.5);
      expect(m.getSaturation()).toBe(1);
    });

    it('clamps lightness to [0, 1]', () => {
      const m = new MandelbrotSet();
      m.setLightness(-0.1);
      expect(m.getLightness()).toBe(0);
      m.setLightness(2.0);
      expect(m.getLightness()).toBe(1);
    });
  });

  describe('array isolation', () => {
    it('constructor copies the center array', () => {
      const center: [number, number] = [1, 2];
      const m = new MandelbrotSet({ center });
      center[0] = 99;
      expect(m.getCenter()).toEqual([1, 2, 0]);
    });

    it('setCenter copies the array', () => {
      const m = new MandelbrotSet();
      const center: [number, number] = [3, 4];
      m.setCenter(center);
      center[0] = 99;
      expect(m.getCenter()).toEqual([3, 4, 0]);
    });
  });

  describe('method chaining', () => {
    it('supports chaining multiple setters', () => {
      const m = new MandelbrotSet();
      const result = m
        .setCenter([-1, 0.5])
        .setZoom(10)
        .setMaxIterations(200)
        .setSaturation(0.9)
        .setLightness(0.6)
        .setWidth(10)
        .setHeight(8);
      expect(result).toBe(m);
      expect(m.getCenter()).toEqual([-1, 0.5, 0]);
      expect(m.getZoom()).toBe(10);
      expect(m.getMaxIterations()).toBe(200);
    });
  });

  describe('copy', () => {
    it('preserves all properties', () => {
      const m = new MandelbrotSet({
        width: 12,
        height: 9,
        center: [-0.7, 0.2],
        zoom: 50,
        maxIterations: 250,
        saturation: 0.6,
        lightness: 0.4,
        opacity: 0.8,
      });
      const clone = m.copy();
      expect(clone).toBeInstanceOf(MandelbrotSet);
      expect(clone).not.toBe(m);
      expect(clone.getWidth()).toBe(12);
      expect(clone.getHeight()).toBe(9);
      expect(clone.getCenter()).toEqual([-0.7, 0.2, 0]);
      expect(clone.getZoom()).toBe(50);
      expect(clone.getMaxIterations()).toBe(250);
      expect(clone.getSaturation()).toBe(0.6);
      expect(clone.getLightness()).toBe(0.4);
      expect(clone.opacity).toBe(0.8);
    });

    it('copy is independent from original', () => {
      const m = new MandelbrotSet({ center: [1, 2], zoom: 5 });
      const clone = m.copy();
      m.setCenter([99, 99]);
      m.setZoom(999);
      expect(clone.getCenter()).toEqual([1, 2, 0]);
      expect(clone.getZoom()).toBe(5);
    });
  });
});

// ==========================================================================
// NewtonFractal
// ==========================================================================

describe('NewtonFractal', () => {
  describe('construction with defaults', () => {
    it('has correct default values', () => {
      const n = new NewtonFractal();
      expect(n.getWidth()).toBe(8);
      expect(n.getHeight()).toBe(6);
      expect(n.getCenter()).toEqual([0, 0, 0]);
      expect(n.getZoom()).toBe(1);
      expect(n.getMaxIterations()).toBe(40);
      expect(n.getCoefficients()).toEqual([-1, 0, 0, 1]);
      expect(n.getTolerance()).toBe(1e-6);
      expect(n.getSaturation()).toBe(0.85);
      expect(n.getLightness()).toBe(0.5);
      expect(n.opacity).toBe(1);
      expect(n.fillOpacity).toBe(1);
    });
  });

  describe('construction with custom options', () => {
    it('accepts all custom options', () => {
      const n = new NewtonFractal({
        width: 16,
        height: 12,
        center: [0.5, -0.5],
        zoom: 10,
        maxIterations: 100,
        coefficients: [-1, 0, 0, 0, 1],
        tolerance: 1e-10,
        saturation: 0.7,
        lightness: 0.3,
        opacity: 0.6,
      });
      expect(n.getWidth()).toBe(16);
      expect(n.getHeight()).toBe(12);
      expect(n.getCenter()).toEqual([0.5, -0.5, 0]);
      expect(n.getZoom()).toBe(10);
      expect(n.getMaxIterations()).toBe(100);
      expect(n.getCoefficients()).toEqual([-1, 0, 0, 0, 1]);
      expect(n.getTolerance()).toBe(1e-10);
      expect(n.getSaturation()).toBe(0.7);
      expect(n.getLightness()).toBe(0.3);
      expect(n.opacity).toBe(0.6);
      expect(n.fillOpacity).toBe(0.6);
    });
  });

  describe('setters return this for chaining', () => {
    it('setCenter updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setCenter([2.0, -1.0])).toBe(n);
      expect(n.getCenter()).toEqual([2.0, -1.0, 0]);
    });

    it('setZoom updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setZoom(25)).toBe(n);
      expect(n.getZoom()).toBe(25);
    });

    it('setMaxIterations updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setMaxIterations(80)).toBe(n);
      expect(n.getMaxIterations()).toBe(80);
    });

    it('setCoefficients updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setCoefficients([-1, 0, 0, 0, 0, 1])).toBe(n);
      expect(n.getCoefficients()).toEqual([-1, 0, 0, 0, 0, 1]);
    });

    it('setTolerance updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setTolerance(1e-8)).toBe(n);
      expect(n.getTolerance()).toBe(1e-8);
    });

    it('setSaturation updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setSaturation(0.5)).toBe(n);
      expect(n.getSaturation()).toBe(0.5);
    });

    it('setLightness updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setLightness(0.8)).toBe(n);
      expect(n.getLightness()).toBe(0.8);
    });

    it('setWidth updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setWidth(20)).toBe(n);
      expect(n.getWidth()).toBe(20);
    });

    it('setHeight updates and returns this', () => {
      const n = new NewtonFractal();
      expect(n.setHeight(15)).toBe(n);
      expect(n.getHeight()).toBe(15);
    });
  });

  describe('validation and clamping', () => {
    it('setMaxIterations rounds to integer', () => {
      const n = new NewtonFractal();
      n.setMaxIterations(39.2);
      expect(n.getMaxIterations()).toBe(39);
    });

    it('setMaxIterations enforces minimum of 1', () => {
      const n = new NewtonFractal();
      n.setMaxIterations(0);
      expect(n.getMaxIterations()).toBe(1);
      n.setMaxIterations(-10);
      expect(n.getMaxIterations()).toBe(1);
    });

    it('clamps saturation to [0, 1]', () => {
      const n = new NewtonFractal();
      n.setSaturation(-0.2);
      expect(n.getSaturation()).toBe(0);
      n.setSaturation(1.5);
      expect(n.getSaturation()).toBe(1);
    });

    it('clamps lightness to [0, 1]', () => {
      const n = new NewtonFractal();
      n.setLightness(-1);
      expect(n.getLightness()).toBe(0);
      n.setLightness(3);
      expect(n.getLightness()).toBe(1);
    });

    it('enforces minimum tolerance of 1e-12', () => {
      const n = new NewtonFractal();
      n.setTolerance(1e-15);
      expect(n.getTolerance()).toBe(1e-12);
      n.setTolerance(0);
      expect(n.getTolerance()).toBe(1e-12);
      n.setTolerance(-1);
      expect(n.getTolerance()).toBe(1e-12);
    });
  });

  describe('array isolation', () => {
    it('constructor copies the center array', () => {
      const center: [number, number] = [1, 2];
      const n = new NewtonFractal({ center });
      center[0] = 99;
      expect(n.getCenter()).toEqual([1, 2, 0]);
    });

    it('setCenter copies the array', () => {
      const n = new NewtonFractal();
      const center: [number, number] = [5, 6];
      n.setCenter(center);
      center[0] = 99;
      expect(n.getCenter()).toEqual([5, 6, 0]);
    });

    it('constructor copies the coefficients array', () => {
      const coeffs = [-1, 0, 0, 1];
      const n = new NewtonFractal({ coefficients: coeffs });
      coeffs[0] = 999;
      expect(n.getCoefficients()).toEqual([-1, 0, 0, 1]);
    });

    it('setCoefficients copies the array', () => {
      const n = new NewtonFractal();
      const coeffs = [1, 0, -1, 0, 1];
      n.setCoefficients(coeffs);
      coeffs[0] = 999;
      expect(n.getCoefficients()).toEqual([1, 0, -1, 0, 1]);
    });

    it('getCoefficients returns a copy', () => {
      const n = new NewtonFractal({ coefficients: [-1, 0, 0, 1] });
      const returned = n.getCoefficients();
      returned[0] = 999;
      expect(n.getCoefficients()).toEqual([-1, 0, 0, 1]);
    });
  });

  describe('method chaining', () => {
    it('supports chaining all setters', () => {
      const n = new NewtonFractal();
      const result = n
        .setCenter([1, -1])
        .setZoom(5)
        .setMaxIterations(60)
        .setCoefficients([-1, 0, 0, 0, 1])
        .setTolerance(1e-8)
        .setSaturation(0.7)
        .setLightness(0.4)
        .setWidth(10)
        .setHeight(8);
      expect(result).toBe(n);
      expect(n.getCenter()).toEqual([1, -1, 0]);
      expect(n.getZoom()).toBe(5);
      expect(n.getMaxIterations()).toBe(60);
      expect(n.getCoefficients()).toEqual([-1, 0, 0, 0, 1]);
      expect(n.getTolerance()).toBe(1e-8);
    });
  });

  describe('copy', () => {
    it('preserves all properties', () => {
      const n = new NewtonFractal({
        width: 16,
        height: 12,
        center: [0.5, -0.5],
        zoom: 10,
        maxIterations: 80,
        coefficients: [-1, 0, 0, 0, 1],
        tolerance: 1e-8,
        saturation: 0.7,
        lightness: 0.3,
        opacity: 0.9,
      });
      const clone = n.copy();
      expect(clone).toBeInstanceOf(NewtonFractal);
      expect(clone).not.toBe(n);
      expect(clone.getWidth()).toBe(16);
      expect(clone.getHeight()).toBe(12);
      expect(clone.getCenter()).toEqual([0.5, -0.5, 0]);
      expect(clone.getZoom()).toBe(10);
      expect(clone.getMaxIterations()).toBe(80);
      expect(clone.getCoefficients()).toEqual([-1, 0, 0, 0, 1]);
      expect(clone.getTolerance()).toBe(1e-8);
      expect(clone.getSaturation()).toBe(0.7);
      expect(clone.getLightness()).toBe(0.3);
      expect(clone.opacity).toBe(0.9);
    });

    it('copy is independent from original', () => {
      const n = new NewtonFractal({
        center: [1, 2],
        zoom: 5,
        coefficients: [-1, 0, 0, 1],
      });
      const clone = n.copy();
      n.setCenter([99, 99]);
      n.setZoom(999);
      n.setCoefficients([1, 2, 3]);
      expect(clone.getCenter()).toEqual([1, 2, 0]);
      expect(clone.getZoom()).toBe(5);
      expect(clone.getCoefficients()).toEqual([-1, 0, 0, 1]);
    });
  });

  describe('polynomial representations', () => {
    it('can represent various polynomials', () => {
      // z^2 - 1
      const n2 = new NewtonFractal({ coefficients: [-1, 0, 1] });
      expect(n2.getCoefficients()).toEqual([-1, 0, 1]);

      // z^5 - 1
      const n5 = new NewtonFractal({ coefficients: [-1, 0, 0, 0, 0, 1] });
      expect(n5.getCoefficients()).toHaveLength(6);

      // linear: z + 1
      const n1 = new NewtonFractal({ coefficients: [1, 1] });
      expect(n1.getCoefficients()).toEqual([1, 1]);
    });

    it('supports up to 12-coefficient polynomials', () => {
      const coeffs = new Array(12).fill(0);
      coeffs[0] = -1;
      coeffs[11] = 1;
      const n = new NewtonFractal({ coefficients: coeffs });
      expect(n.getCoefficients()).toHaveLength(12);
      expect(n.getCoefficients()[0]).toBe(-1);
      expect(n.getCoefficients()[11]).toBe(1);
    });
  });
});
