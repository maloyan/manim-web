import { describe, it, expect } from 'vitest';
import { ScatterPlot } from './ScatterPlot';
import { Dot } from '../geometry/Dot';

describe('ScatterPlot', () => {
  it('places one dot per (x, y) pair at the mapped coordinates', () => {
    const x = [1, 2, 3, 4];
    const y = [2, 1, 4, 3];
    const plot = new ScatterPlot({ x, y });
    expect(plot.numPoints).toBe(4);
    expect(plot.getDots().children).toHaveLength(4);

    for (let i = 0; i < x.length; i++) {
      const dot = plot.getDot(i) as Dot;
      const expected = plot.getAxes().coordsToPoint(x[i], y[i]);
      const actual = dot.getPoint();
      expect(actual[0]).toBeCloseTo(expected[0], 10);
      expect(actual[1]).toBeCloseTo(expected[1], 10);
    }
  });

  it('supports per-point sizes for a bubble chart', () => {
    const plot = new ScatterPlot({
      x: [0, 1, 2],
      y: [0, 1, 2],
      sizes: [0.05, 0.1, 0.2],
    });
    expect((plot.getDot(0) as Dot).getRadius()).toBeCloseTo(0.05, 10);
    expect((plot.getDot(1) as Dot).getRadius()).toBeCloseTo(0.1, 10);
    expect((plot.getDot(2) as Dot).getRadius()).toBeCloseTo(0.2, 10);
  });

  it('cycles per-point colors', () => {
    const plot = new ScatterPlot({
      x: [0, 1, 2],
      y: [0, 1, 2],
      colors: ['#ff0000', '#00ff00'],
    });
    expect((plot.getDot(0) as Dot).color).toBe('#ff0000');
    expect((plot.getDot(1) as Dot).color).toBe('#00ff00');
    expect((plot.getDot(2) as Dot).color).toBe('#ff0000');
  });

  it('pairs x and y by the shorter length', () => {
    const plot = new ScatterPlot({ x: [1, 2, 3], y: [1, 2] });
    expect(plot.numPoints).toBe(2);
  });

  it('does not throw on empty data', () => {
    const plot = new ScatterPlot({ x: [], y: [] });
    expect(plot.numPoints).toBe(0);
    expect(plot.getDots().children).toHaveLength(0);
  });

  it('does not throw on a single point', () => {
    const plot = new ScatterPlot({ x: [3], y: [5] });
    expect(plot.numPoints).toBe(1);
    const dot = plot.getDot(0) as Dot;
    const expected = plot.getAxes().coordsToPoint(3, 5);
    expect(dot.getPoint()[0]).toBeCloseTo(expected[0], 10);
    expect(dot.getPoint()[1]).toBeCloseTo(expected[1], 10);
  });
});
