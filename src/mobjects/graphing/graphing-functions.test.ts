import { describe, it, expect } from 'vitest';
import { FunctionGraph } from './FunctionGraph';
import { ParametricFunction } from './ParametricFunction';
import { VectorFieldVector } from './Vector';
import { Axes } from './Axes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EPSILON = 1e-6;

function closeTo(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

function tupleCloseTo(a: number[], b: number[], eps = EPSILON): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => closeTo(v, b[i], eps));
}

describe('FunctionGraph', () => {
  describe('constructor defaults', () => {
    it('should default xRange to [-5, 5] without axes', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      expect(fg.getXRange()).toEqual([-5, 5]);
    });

    it('should default numSamples to 100', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      expect(fg.getNumSamples()).toBe(100);
    });

    it('should default color to #58c4dd (Manim blue)', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      expect(fg.color).toBe('#58c4dd');
    });

    it('should default discontinuities to empty', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      expect(fg.getDiscontinuities()).toEqual([]);
    });

    it('should have fillOpacity 0', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      expect(fg.fillOpacity).toBe(0);
    });
  });

  describe('tMin / tMax', () => {
    it('should return xRange boundaries', () => {
      const fg = new FunctionGraph({ func: (x) => x, xRange: [-3, 7] });
      expect(fg.tMin).toBe(-3);
      expect(fg.tMax).toBe(7);
    });
  });

  describe('getPointFromX', () => {
    it('should return correct y for identity function', () => {
      const fg = new FunctionGraph({ func: (x) => x, xRange: [-5, 5] });
      const pt = fg.getPointFromX(3);
      expect(pt).not.toBeNull();
      expect(closeTo(pt![0], 3)).toBe(true);
      expect(closeTo(pt![1], 3)).toBe(true);
      expect(pt![2]).toBe(0);
    });

    it('should return correct y for quadratic', () => {
      const fg = new FunctionGraph({ func: (x) => x * x, xRange: [-5, 5] });
      const pt = fg.getPointFromX(2);
      expect(pt).not.toBeNull();
      expect(closeTo(pt![0], 2)).toBe(true);
      expect(closeTo(pt![1], 4)).toBe(true);
    });

    it('should return null for out of range x', () => {
      const fg = new FunctionGraph({ func: (x) => x, xRange: [-5, 5] });
      expect(fg.getPointFromX(10)).toBeNull();
      expect(fg.getPointFromX(-10)).toBeNull();
    });

    it('should return null at discontinuity', () => {
      const fg = new FunctionGraph({
        func: (x) => 1 / x,
        xRange: [-5, 5],
        discontinuities: [0],
      });
      expect(fg.getPointFromX(0)).toBeNull();
    });

    it('should handle NaN from function', () => {
      const fg = new FunctionGraph({
        func: (x) => Math.sqrt(x),
        xRange: [-5, 5],
      });
      const pt = fg.getPointFromX(-1);
      expect(pt).toBeNull();
    });
  });

  describe('getFunction / setFunction', () => {
    it('getFunction should return the function', () => {
      const f = (x: number) => x * 2;
      const fg = new FunctionGraph({ func: f });
      expect(fg.getFunction()).toBe(f);
    });

    it('setFunction should update the function', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      const newFunc = (x: number) => x * x;
      fg.setFunction(newFunc);
      expect(fg.getFunction()).toBe(newFunc);
      const pt = fg.getPointFromX(3);
      expect(pt).not.toBeNull();
      expect(closeTo(pt![1], 9)).toBe(true);
    });
  });

  describe('setters', () => {
    it('setXRange should update range', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      fg.setXRange([0, 10]);
      expect(fg.getXRange()).toEqual([0, 10]);
    });

    it('setNumSamples should update sample count', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      fg.setNumSamples(200);
      expect(fg.getNumSamples()).toBe(200);
    });

    it('setDiscontinuities should update and sort', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      fg.setDiscontinuities([3, 1, 2]);
      expect(fg.getDiscontinuities()).toEqual([1, 2, 3]);
    });

    it('setters should be chainable', () => {
      const fg = new FunctionGraph({ func: (x) => x });
      const result = fg.setXRange([0, 5]).setNumSamples(50);
      expect(result).toBe(fg);
    });
  });

  describe('with axes', () => {
    it('should use axes x range when no xRange provided', () => {
      const axes = new Axes({ xRange: [0, 8, 1] });
      const fg = new FunctionGraph({ func: (x) => x, axes });
      expect(fg.getXRange()).toEqual([0, 8]);
    });

    it('getPointFromX with axes should transform through coordsToPoint', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1], xLength: 10, yLength: 6 });
      const fg = new FunctionGraph({ func: (x) => x, axes });
      const pt = fg.getPointFromX(2);
      const expected = axes.coordsToPoint(2, 2);
      expect(pt).not.toBeNull();
      expect(tupleCloseTo(pt!, expected)).toBe(true);
    });
  });

  describe('points generation', () => {
    it('should generate non-empty points for a simple function', () => {
      const fg = new FunctionGraph({ func: (x) => x, xRange: [-1, 1], numSamples: 10 });
      const pts = fg.getPoints();
      expect(pts.length).toBeGreaterThan(0);
    });

    it('should handle a function that returns Infinity', () => {
      // 1/x will produce Infinity at discontinuity edges; should not crash
      const fg = new FunctionGraph({
        func: (x) => 1 / x,
        xRange: [-5, 5],
        discontinuities: [0],
      });
      // Just verify it constructs without error and has some points
      expect(fg.getPoints().length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// ParametricFunction
// ---------------------------------------------------------------------------
describe('ParametricFunction', () => {
  describe('constructor defaults', () => {
    it('should default tRange to [0, 1]', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      expect(pf.getTRange()).toEqual([0, 1]);
    });

    it('should default numSamples to 100', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      expect(pf.getNumSamples()).toBe(100);
    });

    it('should default color to #58c4dd', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      expect(pf.color).toBe('#58c4dd');
    });
  });

  describe('getPointFromT', () => {
    it('should evaluate the parametric function for 2D', () => {
      const pf = new ParametricFunction({
        func: (t) => [Math.cos(t), Math.sin(t)],
        tRange: [0, 2 * Math.PI],
      });
      const pt = pf.getPointFromT(0);
      expect(closeTo(pt[0], 1)).toBe(true);
      expect(closeTo(pt[1], 0)).toBe(true);
      expect(pt[2]).toBe(0);
    });

    it('should evaluate the parametric function for 3D', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t * 2, t * 3],
        tRange: [0, 1],
      });
      const pt = pf.getPointFromT(0.5);
      expect(closeTo(pt[0], 0.5)).toBe(true);
      expect(closeTo(pt[1], 1.0)).toBe(true);
      expect(closeTo(pt[2], 1.5)).toBe(true);
    });

    it('should return [0,0,0] when function throws', () => {
      const pf = new ParametricFunction({
        func: () => {
          throw new Error('oops');
        },
        tRange: [0, 1],
      });
      const pt = pf.getPointFromT(0.5);
      expect(pt).toEqual([0, 0, 0]);
    });

    it('getPointFromT at t=PI/2 for unit circle', () => {
      const pf = new ParametricFunction({
        func: (t) => [Math.cos(t), Math.sin(t)],
        tRange: [0, 2 * Math.PI],
      });
      const pt = pf.getPointFromT(Math.PI / 2);
      expect(closeTo(pt[0], 0, 1e-5)).toBe(true);
      expect(closeTo(pt[1], 1, 1e-5)).toBe(true);
    });
  });

  describe('setters', () => {
    it('setTRange should update range', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      pf.setTRange([0, 10]);
      expect(pf.getTRange()).toEqual([0, 10]);
    });

    it('setNumSamples should update count', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      pf.setNumSamples(50);
      expect(pf.getNumSamples()).toBe(50);
    });

    it('setFunction should update the function', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      const newFunc = (t: number): [number, number] => [t * 2, t * 3];
      pf.setFunction(newFunc);
      expect(pf.getFunction()).toBe(newFunc);
    });

    it('setters should be chainable', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      const result = pf.setTRange([0, 5]).setNumSamples(200);
      expect(result).toBe(pf);
    });
  });

  describe('points generation', () => {
    it('should generate points for a straight line', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        numSamples: 10,
      });
      expect(pf.getPoints().length).toBeGreaterThan(0);
    });

    it('should generate points for a circle', () => {
      const pf = new ParametricFunction({
        func: (t) => [Math.cos(t), Math.sin(t)],
        tRange: [0, 2 * Math.PI],
        numSamples: 50,
      });
      expect(pf.getPoints().length).toBeGreaterThan(0);
    });

    it('should skip invalid points gracefully', () => {
      const pf = new ParametricFunction({
        func: (t) => {
          if (t > 0.4 && t < 0.6) return [NaN, NaN];
          return [t, t];
        },
        tRange: [0, 1],
        numSamples: 20,
      });
      // Should still produce some points
      expect(pf.getPoints().length).toBeGreaterThan(0);
    });

    it('should handle Infinity values by skipping them', () => {
      const pf = new ParametricFunction({
        func: (t) => {
          if (Math.abs(t - 0.5) < 0.01) return [Infinity, 0];
          return [t, t];
        },
        tRange: [0, 1],
        numSamples: 20,
      });
      expect(pf.getPoints().length).toBeGreaterThan(0);
    });

    it('should handle function that throws for some values', () => {
      const pf = new ParametricFunction({
        func: (t) => {
          if (t > 0.3 && t < 0.7) throw new Error('domain error');
          return [t, t];
        },
        tRange: [0, 1],
        numSamples: 20,
      });
      expect(pf.getPoints().length).toBeGreaterThan(0);
    });

    it('should produce empty points when all samples are invalid', () => {
      const pf = new ParametricFunction({
        func: () => [NaN, NaN],
        tRange: [0, 1],
        numSamples: 10,
      });
      expect(pf.getPoints().length).toBe(0);
    });

    it('should produce Bezier points for exactly 2 valid samples', () => {
      // When there are exactly 2 valid sample points, _pointsToBezier
      // creates a single cubic Bezier segment (4 control points)
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        numSamples: 2,
      });
      const pts = pf.getPoints();
      // 2 points -> 1 Bezier segment -> 4 control points
      expect(pts.length).toBe(4);
    });
  });

  describe('with axes', () => {
    it('should use axes coordinate transformation when axes provided', () => {
      const axes = new Axes({
        xRange: [-5, 5, 1],
        yRange: [-3, 3, 1],
        xLength: 10,
        yLength: 6,
      });
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [-1, 1],
        axes,
      });
      // With axes, points should be transformed through coordsToPoint
      const pts = pf.getPoints();
      expect(pts.length).toBeGreaterThan(0);
    });

    it('should enable useAxesCoords by default when axes is provided', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1] });
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        axes,
      });
      // getPointFromT should use axes transformation
      const pt = pf.getPointFromT(0);
      const expected = axes.coordsToPoint(0, 0);
      expect(tupleCloseTo(pt, expected)).toBe(true);
    });

    it('getPointFromT should transform through axes when useAxesCoords is true', () => {
      const axes = new Axes({
        xRange: [-5, 5, 1],
        yRange: [-3, 3, 1],
        xLength: 10,
        yLength: 6,
      });
      const pf = new ParametricFunction({
        func: (t) => [t * 2, t * 3],
        tRange: [0, 1],
        axes,
        useAxesCoords: true,
      });
      const pt = pf.getPointFromT(1);
      const expected = axes.coordsToPoint(2, 3);
      expect(tupleCloseTo(pt, expected)).toBe(true);
    });

    it('getPointFromT should NOT transform when useAxesCoords is false', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1] });
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        axes,
        useAxesCoords: false,
      });
      // Without axes transformation, raw coordinates are returned
      const pt = pf.getPointFromT(0.5);
      expect(closeTo(pt[0], 0.5)).toBe(true);
      expect(closeTo(pt[1], 0.5)).toBe(true);
      expect(pt[2]).toBe(0);
    });
  });

  describe('setAxes', () => {
    it('should set axes and regenerate points', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
      });
      const axes = new Axes({
        xRange: [-5, 5, 1],
        yRange: [-3, 3, 1],
        xLength: 10,
        yLength: 6,
      });
      const result = pf.setAxes(axes);
      expect(result).toBe(pf); // chainable
      expect(pf.getPoints().length).toBeGreaterThan(0);
    });

    it('should clear axes when set to null', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1] });
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        axes,
      });
      pf.setAxes(null);
      // After clearing axes, getPointFromT should return raw coordinates
      const pt = pf.getPointFromT(0.5);
      expect(closeTo(pt[0], 0.5)).toBe(true);
      expect(closeTo(pt[1], 0.5)).toBe(true);
    });
  });

  describe('setUseAxesCoords', () => {
    it('should toggle axes coordinate transformation', () => {
      const axes = new Axes({
        xRange: [-5, 5, 1],
        yRange: [-3, 3, 1],
        xLength: 10,
        yLength: 6,
      });
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        axes,
        useAxesCoords: false,
      });
      // Initially no transformation
      const ptRaw = pf.getPointFromT(0.5);
      expect(closeTo(ptRaw[0], 0.5)).toBe(true);

      // Enable transformation
      const result = pf.setUseAxesCoords(true);
      expect(result).toBe(pf); // chainable
      const ptTransformed = pf.getPointFromT(0.5);
      const expected = axes.coordsToPoint(0.5, 0.5);
      expect(tupleCloseTo(ptTransformed, expected)).toBe(true);
    });

    it('should disable axes coordinate transformation', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1] });
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        axes,
        useAxesCoords: true,
      });
      pf.setUseAxesCoords(false);
      const pt = pf.getPointFromT(0.5);
      // Should return raw coords, not axes-transformed
      expect(closeTo(pt[0], 0.5)).toBe(true);
      expect(closeTo(pt[1], 0.5)).toBe(true);
    });
  });

  describe('copy', () => {
    it('should create a copy with the same function and parameters', () => {
      const func = (t: number): [number, number] => [Math.cos(t), Math.sin(t)];
      const pf = new ParametricFunction({
        func,
        tRange: [0, 2 * Math.PI],
        color: '#ff0000',
        strokeWidth: 4,
        numSamples: 50,
      });
      const copied = pf.copy() as ParametricFunction;
      expect(copied).not.toBe(pf);
      expect(copied.getTRange()).toEqual([0, 2 * Math.PI]);
      expect(copied.getNumSamples()).toBe(50);
      expect(copied.color).toBe('#ff0000');
      expect(copied.strokeWidth).toBe(4);
      expect(copied.getFunction()).toBe(func);
    });

    it('should create a copy with axes', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1] });
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        axes,
        useAxesCoords: true,
      });
      const copied = pf.copy() as ParametricFunction;
      expect(copied).not.toBe(pf);
      // The copy should produce similar points
      const origPt = pf.getPointFromT(0.5);
      const copyPt = copied.getPointFromT(0.5);
      expect(tupleCloseTo(origPt, copyPt)).toBe(true);
    });

    it('should create an independent copy (changes to copy do not affect original)', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [0, 1],
        numSamples: 50,
      });
      const copied = pf.copy() as ParametricFunction;
      copied.setTRange([0, 10]);
      expect(pf.getTRange()).toEqual([0, 1]);
      expect(copied.getTRange()).toEqual([0, 10]);
    });
  });

  describe('constructor options', () => {
    it('should accept custom strokeWidth', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        strokeWidth: 5,
      });
      expect(pf.strokeWidth).toBe(5);
    });

    it('should accept custom color', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        color: '#ff0000',
      });
      expect(pf.color).toBe('#ff0000');
    });

    it('should have fillOpacity 0', () => {
      const pf = new ParametricFunction({ func: (t) => [t, t] });
      expect(pf.fillOpacity).toBe(0);
    });

    it('should accept custom numSamples', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        numSamples: 200,
      });
      expect(pf.getNumSamples()).toBe(200);
    });

    it('should accept custom tRange', () => {
      const pf = new ParametricFunction({
        func: (t) => [t, t],
        tRange: [-10, 10],
      });
      expect(pf.getTRange()).toEqual([-10, 10]);
    });
  });
});

// ---------------------------------------------------------------------------
// VectorFieldVector
// ---------------------------------------------------------------------------
describe('VectorFieldVector', () => {
  describe('constructor', () => {
    it('should store direction', () => {
      const v = new VectorFieldVector({ direction: [3, 4, 0] });
      expect(v.getDirection()).toEqual([3, 4, 0]);
    });

    it('should default startPoint to [0,0,0]', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0] });
      expect(v.getStartPoint()).toEqual([0, 0, 0]);
    });

    it('should accept custom startPoint', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0], startPoint: [2, 3, 0] });
      expect(v.getStartPoint()).toEqual([2, 3, 0]);
    });

    it('should default maxLength to Infinity', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0] });
      expect(v.getMaxLength()).toBe(Infinity);
    });
  });

  describe('getMagnitude', () => {
    it('should return 5 for [3, 4, 0]', () => {
      const v = new VectorFieldVector({ direction: [3, 4, 0] });
      expect(closeTo(v.getMagnitude(), 5)).toBe(true);
    });

    it('should return 1 for unit vectors', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0] });
      expect(closeTo(v.getMagnitude(), 1)).toBe(true);
    });

    it('should return 0 for zero vector', () => {
      const v = new VectorFieldVector({ direction: [0, 0, 0] });
      expect(v.getMagnitude()).toBe(0);
    });

    it('should handle 3D vector magnitude', () => {
      const v = new VectorFieldVector({ direction: [1, 2, 2] });
      expect(closeTo(v.getMagnitude(), 3)).toBe(true);
    });
  });

  describe('getVisualLength', () => {
    it('should equal magnitude when no maxLength', () => {
      const v = new VectorFieldVector({ direction: [3, 4, 0] });
      expect(closeTo(v.getVisualLength(), 5)).toBe(true);
    });

    it('should be capped by maxLength', () => {
      const v = new VectorFieldVector({ direction: [3, 4, 0], maxLength: 2 });
      expect(closeTo(v.getVisualLength(), 2)).toBe(true);
    });

    it('should not exceed maxLength even with large direction', () => {
      const v = new VectorFieldVector({ direction: [100, 0, 0], maxLength: 1 });
      expect(closeTo(v.getVisualLength(), 1)).toBe(true);
    });
  });

  describe('getUnitVector', () => {
    it('should normalize [3, 4, 0] to [0.6, 0.8, 0]', () => {
      const v = new VectorFieldVector({ direction: [3, 4, 0] });
      const unit = v.getUnitVector();
      expect(closeTo(unit[0], 0.6)).toBe(true);
      expect(closeTo(unit[1], 0.8)).toBe(true);
      expect(closeTo(unit[2], 0)).toBe(true);
    });

    it('should return [1,0,0] for zero vector', () => {
      const v = new VectorFieldVector({ direction: [0, 0, 0] });
      expect(v.getUnitVector()).toEqual([1, 0, 0]);
    });

    it('unit vector should have magnitude 1', () => {
      const v = new VectorFieldVector({ direction: [2, 3, 6] });
      const unit = v.getUnitVector();
      const mag = Math.sqrt(unit[0] ** 2 + unit[1] ** 2 + unit[2] ** 2);
      expect(closeTo(mag, 1)).toBe(true);
    });
  });

  describe('getAngleXY', () => {
    it('should return 0 for [1, 0, 0]', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0] });
      expect(closeTo(v.getAngleXY(), 0)).toBe(true);
    });

    it('should return PI/2 for [0, 1, 0]', () => {
      const v = new VectorFieldVector({ direction: [0, 1, 0] });
      expect(closeTo(v.getAngleXY(), Math.PI / 2)).toBe(true);
    });

    it('should return PI/4 for [1, 1, 0]', () => {
      const v = new VectorFieldVector({ direction: [1, 1, 0] });
      expect(closeTo(v.getAngleXY(), Math.PI / 4)).toBe(true);
    });

    it('should return PI for [-1, 0, 0]', () => {
      const v = new VectorFieldVector({ direction: [-1, 0, 0] });
      expect(closeTo(v.getAngleXY(), Math.PI)).toBe(true);
    });
  });

  describe('dot product', () => {
    it('should compute dot product with tuple', () => {
      const v = new VectorFieldVector({ direction: [1, 2, 3] });
      expect(v.dot([4, 5, 6])).toBe(1 * 4 + 2 * 5 + 3 * 6);
    });

    it('should compute dot product with another VectorFieldVector', () => {
      const v1 = new VectorFieldVector({ direction: [1, 0, 0] });
      const v2 = new VectorFieldVector({ direction: [0, 1, 0] });
      expect(v1.dot(v2)).toBe(0);
    });

    it('should return magnitude squared for self-dot', () => {
      const v = new VectorFieldVector({ direction: [3, 4, 0] });
      expect(closeTo(v.dot(v.getDirection()), 25)).toBe(true);
    });
  });

  describe('cross product', () => {
    it('should compute cross product of unit x and y', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0] });
      const cross = v.cross([0, 1, 0]);
      expect(tupleCloseTo(cross, [0, 0, 1])).toBe(true);
    });

    it('cross product of parallel vectors should be zero', () => {
      const v = new VectorFieldVector({ direction: [2, 0, 0] });
      const cross = v.cross([4, 0, 0]);
      expect(tupleCloseTo(cross, [0, 0, 0])).toBe(true);
    });

    it('should be anti-commutative', () => {
      const v1 = new VectorFieldVector({ direction: [1, 2, 3] });
      const v2 = new VectorFieldVector({ direction: [4, 5, 6] });
      const cross1 = v1.cross(v2);
      const cross2 = v2.cross(v1);
      expect(closeTo(cross1[0], -cross2[0])).toBe(true);
      expect(closeTo(cross1[1], -cross2[1])).toBe(true);
      expect(closeTo(cross1[2], -cross2[2])).toBe(true);
    });
  });

  describe('setMagnitude', () => {
    it('should scale the direction to the given length', () => {
      const v = new VectorFieldVector({ direction: [3, 4, 0] });
      v.setMagnitude(10);
      expect(closeTo(v.getMagnitude(), 10)).toBe(true);
      // Direction should be proportional
      const dir = v.getDirection();
      expect(closeTo(dir[0] / dir[1], 3 / 4)).toBe(true);
    });

    it('should default to [length, 0, 0] for zero vector', () => {
      const v = new VectorFieldVector({ direction: [0, 0, 0] });
      v.setMagnitude(5);
      expect(v.getDirection()).toEqual([5, 0, 0]);
    });
  });

  describe('scaleDirection', () => {
    it('should scale direction by factor', () => {
      const v = new VectorFieldVector({ direction: [1, 2, 3] });
      v.scaleDirection(2);
      expect(v.getDirection()).toEqual([2, 4, 6]);
    });

    it('should be chainable', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0] });
      const result = v.scaleDirection(3);
      expect(result).toBe(v);
    });
  });

  describe('addVector', () => {
    it('should add a tuple to direction', () => {
      const v = new VectorFieldVector({ direction: [1, 2, 3] });
      v.addVector([4, 5, 6]);
      expect(v.getDirection()).toEqual([5, 7, 9]);
    });

    it('should add another VectorFieldVector', () => {
      const v1 = new VectorFieldVector({ direction: [1, 0, 0] });
      const v2 = new VectorFieldVector({ direction: [0, 1, 0] });
      v1.addVector(v2);
      expect(v1.getDirection()).toEqual([1, 1, 0]);
    });
  });

  describe('setMaxLength', () => {
    it('should cap visual length', () => {
      const v = new VectorFieldVector({ direction: [10, 0, 0] });
      v.setMaxLength(3);
      expect(closeTo(v.getVisualLength(), 3)).toBe(true);
    });
  });

  describe('setStartPoint', () => {
    it('should update start point and keep direction', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0], startPoint: [0, 0, 0] });
      v.setStartPoint([5, 5, 0]);
      expect(v.getStartPoint()).toEqual([5, 5, 0]);
      expect(v.getDirection()).toEqual([1, 0, 0]);
    });

    it('should be chainable', () => {
      const v = new VectorFieldVector({ direction: [1, 0, 0] });
      const result = v.setStartPoint([2, 3, 0]);
      expect(result).toBe(v);
    });
  });

  describe('copy', () => {
    it('should create an independent copy', () => {
      const v = new VectorFieldVector({
        direction: [3, 4, 0],
        startPoint: [1, 2, 0],
        color: '#ff0000',
        maxLength: 5,
      });
      const cp = v.copy();
      expect(cp).not.toBe(v);
      expect(cp).toBeInstanceOf(VectorFieldVector);
      const cpv = cp as VectorFieldVector;
      expect(cpv.getDirection()).toEqual([3, 4, 0]);
      expect(cpv.getStartPoint()).toEqual([1, 2, 0]);
      expect(cpv.getMaxLength()).toBe(5);
    });
  });
});
