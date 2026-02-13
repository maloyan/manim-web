import { describe, it, expect } from 'vitest';
import { NumberLine, UnitInterval } from './NumberLine';
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

// ---------------------------------------------------------------------------
// NumberLine
// ---------------------------------------------------------------------------
describe('NumberLine', () => {
  describe('constructor defaults', () => {
    it('should use default xRange [-5, 5, 1]', () => {
      const nl = new NumberLine();
      expect(nl.getXRange()).toEqual([-5, 5, 1]);
    });

    it('should use default length 10', () => {
      const nl = new NumberLine();
      expect(nl.getLength()).toBe(10);
    });

    it('should include ticks by default', () => {
      const nl = new NumberLine();
      expect(nl.hasTicks()).toBe(true);
    });

    it('should have default tick size 0.2', () => {
      const nl = new NumberLine();
      expect(nl.getTickSize()).toBe(0.2);
    });

    it('should have default color #ffffff', () => {
      const nl = new NumberLine();
      expect(nl.color).toBe('#ffffff');
    });

    it('should have default strokeWidth 2', () => {
      const nl = new NumberLine();
      expect(nl.strokeWidth).toBe(2);
    });

    it('should have fillOpacity 0', () => {
      const nl = new NumberLine();
      expect(nl.fillOpacity).toBe(0);
    });

    it('should not include number labels by default', () => {
      const nl = new NumberLine();
      expect(nl.getNumberLabels()).toHaveLength(0);
    });
  });

  describe('custom options', () => {
    it('should accept custom xRange', () => {
      const nl = new NumberLine({ xRange: [0, 10, 2] });
      expect(nl.getXRange()).toEqual([0, 10, 2]);
    });

    it('should accept custom length', () => {
      const nl = new NumberLine({ length: 8 });
      expect(nl.getLength()).toBe(8);
    });

    it('should accept custom color', () => {
      const nl = new NumberLine({ color: '#ff0000' });
      expect(nl.color).toBe('#ff0000');
    });

    it('should accept custom strokeWidth', () => {
      const nl = new NumberLine({ strokeWidth: 4 });
      expect(nl.strokeWidth).toBe(4);
    });

    it('should accept includeTicks: false', () => {
      const nl = new NumberLine({ includeTicks: false });
      expect(nl.hasTicks()).toBe(false);
      expect(nl.getTickMarks()).toHaveLength(0);
    });
  });

  describe('getMin / getMax / getStep', () => {
    it('should return range components', () => {
      const nl = new NumberLine({ xRange: [-3, 7, 0.5] });
      expect(nl.getMin()).toBe(-3);
      expect(nl.getMax()).toBe(7);
      expect(nl.getStep()).toBe(0.5);
    });
  });

  describe('tick marks', () => {
    it('should create 11 ticks for range [-5,5,1]', () => {
      const nl = new NumberLine();
      // Ticks at -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5 = 11
      expect(nl.getTickMarks().length).toBe(11);
    });

    it('should create correct number of ticks for custom range', () => {
      const nl = new NumberLine({ xRange: [0, 4, 1] });
      // Ticks at 0, 1, 2, 3, 4 = 5
      expect(nl.getTickMarks().length).toBe(5);
    });

    it('should create no ticks when disabled', () => {
      const nl = new NumberLine({ includeTicks: false });
      expect(nl.getTickMarks().length).toBe(0);
    });
  });

  describe('numberToPoint / pointToNumber roundtrip', () => {
    it('should roundtrip for min value', () => {
      const nl = new NumberLine({ xRange: [-5, 5, 1], length: 10 });
      const point = nl.numberToPoint(-5);
      const value = nl.pointToNumber(point);
      expect(closeTo(value, -5)).toBe(true);
    });

    it('should roundtrip for max value', () => {
      const nl = new NumberLine({ xRange: [-5, 5, 1], length: 10 });
      const point = nl.numberToPoint(5);
      const value = nl.pointToNumber(point);
      expect(closeTo(value, 5)).toBe(true);
    });

    it('should roundtrip for zero', () => {
      const nl = new NumberLine();
      const point = nl.numberToPoint(0);
      const value = nl.pointToNumber(point);
      expect(closeTo(value, 0)).toBe(true);
    });

    it('should roundtrip for arbitrary value', () => {
      const nl = new NumberLine({ xRange: [0, 10, 1], length: 20 });
      const point = nl.numberToPoint(7.5);
      const value = nl.pointToNumber(point);
      expect(closeTo(value, 7.5)).toBe(true);
    });

    it('should position min at -length/2 and max at +length/2', () => {
      const nl = new NumberLine({ xRange: [-5, 5, 1], length: 10 });
      const minPt = nl.numberToPoint(-5);
      const maxPt = nl.numberToPoint(5);
      expect(closeTo(minPt[0], -5)).toBe(true);
      expect(closeTo(maxPt[0], 5)).toBe(true);
    });

    it('should have y and z as 0 for default position', () => {
      const nl = new NumberLine();
      const point = nl.numberToPoint(3);
      expect(point[1]).toBe(0);
      expect(point[2]).toBe(0);
    });
  });

  describe('setters', () => {
    it('setXRange should update range', () => {
      const nl = new NumberLine();
      nl.setXRange([0, 20, 5]);
      expect(nl.getXRange()).toEqual([0, 20, 5]);
    });

    it('setLength should update length', () => {
      const nl = new NumberLine();
      nl.setLength(15);
      expect(nl.getLength()).toBe(15);
    });

    it('setTickSize should update tick size', () => {
      const nl = new NumberLine();
      nl.setTickSize(0.5);
      expect(nl.getTickSize()).toBe(0.5);
    });

    it('setIncludeTicks should toggle ticks', () => {
      const nl = new NumberLine();
      expect(nl.getTickMarks().length).toBeGreaterThan(0);
      nl.setIncludeTicks(false);
      expect(nl.getTickMarks().length).toBe(0);
    });

    it('setters should be chainable', () => {
      const nl = new NumberLine();
      const result = nl.setXRange([0, 5, 1]).setLength(5).setTickSize(0.3);
      expect(result).toBe(nl);
    });
  });
});

// ---------------------------------------------------------------------------
// UnitInterval
// ---------------------------------------------------------------------------
describe('UnitInterval', () => {
  it('should have range [0, 1, step]', () => {
    const ui = new UnitInterval();
    const range = ui.getXRange();
    expect(range[0]).toBe(0);
    expect(range[1]).toBe(1);
  });

  it('should default to length 5', () => {
    const ui = new UnitInterval();
    expect(ui.getLength()).toBe(5);
  });

  it('should default numDecimalPlaces=1 giving step 0.1', () => {
    const ui = new UnitInterval();
    const range = ui.getXRange();
    expect(closeTo(range[2], 0.1)).toBe(true);
  });

  it('should use step 0.25 for numDecimalPlaces=2', () => {
    const ui = new UnitInterval({ numDecimalPlaces: 2 });
    const range = ui.getXRange();
    expect(closeTo(range[2], 0.25)).toBe(true);
  });

  it('should create correct number of ticks for default', () => {
    const ui = new UnitInterval();
    // range [0,1,0.1] => 11 ticks
    expect(ui.getTickMarks().length).toBe(11);
  });

  it('numberToPoint(0) should be at -length/2', () => {
    const ui = new UnitInterval({ length: 5 });
    const pt = ui.numberToPoint(0);
    expect(closeTo(pt[0], -2.5)).toBe(true);
  });

  it('numberToPoint(1) should be at +length/2', () => {
    const ui = new UnitInterval({ length: 5 });
    const pt = ui.numberToPoint(1);
    expect(closeTo(pt[0], 2.5)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Axes
// ---------------------------------------------------------------------------
describe('Axes', () => {
  describe('constructor defaults', () => {
    it('should have default xRange [-5, 5, 1]', () => {
      const axes = new Axes();
      expect(axes.getXRange()).toEqual([-5, 5, 1]);
    });

    it('should have default yRange [-3, 3, 1]', () => {
      const axes = new Axes();
      expect(axes.getYRange()).toEqual([-3, 3, 1]);
    });

    it('should have default xLength 10', () => {
      const axes = new Axes();
      expect(axes.getXLength()).toBe(10);
    });

    it('should have default yLength 6', () => {
      const axes = new Axes();
      expect(axes.getYLength()).toBe(6);
    });

    it('should provide xAxis and yAxis NumberLine instances', () => {
      const axes = new Axes();
      expect(axes.xAxis).toBeDefined();
      expect(axes.yAxis).toBeDefined();
    });
  });

  describe('coordinate transformations', () => {
    it('coordsToPoint(0, 0) should map to the visual origin', () => {
      const axes = new Axes();
      const origin = axes.coordsToPoint(0, 0);
      expect(closeTo(origin[0], 0)).toBe(true);
      expect(closeTo(origin[1], 0)).toBe(true);
      expect(origin[2]).toBe(0);
    });

    it('c2p should be an alias for coordsToPoint', () => {
      const axes = new Axes();
      const p1 = axes.coordsToPoint(2, 3);
      const p2 = axes.c2p(2, 3);
      expect(tupleCloseTo(p1, p2)).toBe(true);
    });

    it('getOrigin should return coordsToPoint(0,0)', () => {
      const axes = new Axes();
      const origin = axes.getOrigin();
      const c2p = axes.coordsToPoint(0, 0);
      expect(tupleCloseTo(origin, c2p)).toBe(true);
    });

    it('roundtrip coordsToPoint -> pointToCoords', () => {
      const axes = new Axes();
      const coords = [2.5, -1.5];
      const point = axes.coordsToPoint(coords[0], coords[1]);
      const back = axes.pointToCoords(point);
      expect(closeTo(back[0], coords[0])).toBe(true);
      expect(closeTo(back[1], coords[1])).toBe(true);
    });

    it('min corner should map to (-xLength/2, -yLength/2)', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1], xLength: 10, yLength: 6 });
      const pt = axes.coordsToPoint(-5, -3);
      expect(closeTo(pt[0], -5)).toBe(true);
      expect(closeTo(pt[1], -3)).toBe(true);
    });

    it('max corner should map to (+xLength/2, +yLength/2)', () => {
      const axes = new Axes({ xRange: [-5, 5, 1], yRange: [-3, 3, 1], xLength: 10, yLength: 6 });
      const pt = axes.coordsToPoint(5, 3);
      expect(closeTo(pt[0], 5)).toBe(true);
      expect(closeTo(pt[1], 3)).toBe(true);
    });

    it('c2pX and c2pY convenience methods', () => {
      const axes = new Axes();
      const x = axes.c2pX(3);
      const y = axes.c2pY(2);
      const fullPoint = axes.coordsToPoint(3, 2);
      expect(closeTo(x, fullPoint[0])).toBe(true);
      expect(closeTo(y, fullPoint[1])).toBe(true);
    });

    it('should handle asymmetric ranges', () => {
      const axes = new Axes({ xRange: [0, 10, 1], yRange: [-1, 1, 0.5], xLength: 10, yLength: 4 });
      const pt0 = axes.coordsToPoint(0, 0);
      const pt10 = axes.coordsToPoint(10, 0);
      // x=0 should be at -xLength/2, x=10 at +xLength/2
      expect(closeTo(pt0[0], -5)).toBe(true);
      expect(closeTo(pt10[0], 5)).toBe(true);
    });
  });

  describe('xRange/yRange property accessors', () => {
    it('xRange property should equal getXRange()', () => {
      const axes = new Axes({ xRange: [0, 8, 2] });
      expect(axes.xRange).toEqual(axes.getXRange());
    });

    it('yRange property should equal getYRange()', () => {
      const axes = new Axes({ yRange: [-2, 2, 0.5] });
      expect(axes.yRange).toEqual(axes.getYRange());
    });
  });

  describe('2-element range normalization', () => {
    it('should normalize 2-element xRange to step=1', () => {
      const axes = new Axes({ xRange: [0, 5] });
      expect(axes.getXRange()).toEqual([0, 5, 1]);
    });

    it('should normalize 2-element yRange to step=1', () => {
      const axes = new Axes({ yRange: [-2, 2] });
      expect(axes.getYRange()).toEqual([-2, 2, 1]);
    });
  });
});

// ---------------------------------------------------------------------------
// FunctionGraph
// ---------------------------------------------------------------------------
