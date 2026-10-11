import { describe, it, expect } from 'vitest';
import { ContourPlot } from './ContourPlot';

describe('ContourPlot', () => {
  it('constructs headless without throwing', () => {
    expect(() => {
      new ContourPlot({
        func: (x, y) => x * x + y * y - 1,
        levels: [0],
        xRange: [-2, 2],
        yRange: [-2, 2],
        resolution: 48,
      });
    }).not.toThrow();
  });

  it('draws the unit circle for the zero contour of x^2 + y^2 - 1', () => {
    const plot = new ContourPlot({
      func: (x, y) => x * x + y * y - 1,
      levels: [0],
      xRange: [-2, 2],
      yRange: [-2, 2],
      resolution: 48,
    });
    const points = plot.getPoints();
    expect(points.length).toBeGreaterThan(0);
    for (const [x, y] of points) {
      expect(Math.abs(Math.hypot(x, y) - 1)).toBeLessThan(0.12);
    }
  });

  it('draws nested circles for multiple levels', () => {
    const plot = new ContourPlot({
      func: (x, y) => x * x + y * y,
      levels: [1, 4],
      xRange: [-3, 3],
      yRange: [-3, 3],
      resolution: 64,
    });
    const radii = plot.getPoints().map(([x, y]) => Math.hypot(x, y));
    expect(radii.length).toBeGreaterThan(0);
    // Every point sits on one of the two circles (radius 1 or 2).
    for (const r of radii) {
      const onInner = Math.abs(r - 1) < 0.15;
      const onOuter = Math.abs(r - 2) < 0.15;
      expect(onInner || onOuter).toBe(true);
    }
    expect(radii.some((r) => Math.abs(r - 1) < 0.15)).toBe(true);
    expect(radii.some((r) => Math.abs(r - 2) < 0.15)).toBe(true);
  });

  it('is deterministic for identical input', () => {
    const make = (): ContourPlot =>
      new ContourPlot({
        func: (x, y) => x * x - y * y,
        levels: [-1, 0, 1],
        xRange: [-2, 2],
        yRange: [-2, 2],
        resolution: 32,
      });
    expect(make().getPoints()).toEqual(make().getPoints());
  });

  it('exposes and updates its levels', () => {
    const plot = new ContourPlot({ func: (x, y) => x + y, levels: [0] });
    expect(plot.getLevels()).toEqual([0]);
    plot.setLevels([-1, 1]);
    expect(plot.getLevels()).toEqual([-1, 1]);
  });

  it('copies into an independent instance', () => {
    const plot = new ContourPlot({
      func: (x, y) => x * x + y * y - 1,
      levels: [0],
      resolution: 24,
    });
    const copy = plot.copy();
    expect(copy).toBeInstanceOf(ContourPlot);
    expect(copy.getLevels()).toEqual([0]);
  });
});
