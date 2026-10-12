import { describe, it, expect } from 'vitest';
import { StepChart } from './StepChart';
import { Polygon } from '../geometry/Polygon';

describe('StepChart', () => {
  it("holds the value then jumps at the next x in 'after' mode", () => {
    const chart = new StepChart({ values: [2, 5], xValues: [0, 1], stepMode: 'after' });
    // Hold 2 across the interval, then jump to 5 at x = 1.
    expect(chart.getStepPoints(0)).toEqual([
      [0, 2],
      [1, 2],
      [1, 5],
    ]);
  });

  it("jumps at the current x then holds in 'before' mode", () => {
    const chart = new StepChart({ values: [2, 5], xValues: [0, 1], stepMode: 'before' });
    expect(chart.getStepPoints(0)).toEqual([
      [0, 2],
      [0, 5],
      [1, 5],
    ]);
  });

  it("jumps at the interval midpoint in 'center' mode", () => {
    const chart = new StepChart({ values: [2, 5], xValues: [0, 2], stepMode: 'center' });
    expect(chart.getStepPoints(0)).toEqual([
      [0, 2],
      [1, 2],
      [1, 5],
      [2, 5],
    ]);
  });

  it('maps step vertices onto the axes', () => {
    const chart = new StepChart({ values: [2, 5], xValues: [0, 1], stepMode: 'after' });
    const axes = chart.getAxes();
    const line = chart.getLine(0) as Polygon;
    const pts = line.getPoints();
    const hold = axes.coordsToPoint(1, 2);
    // The middle vertex is the hold point before the jump.
    const hasHold = pts.some(
      (p) => Math.abs(p[0] - hold[0]) < 1e-6 && Math.abs(p[1] - hold[1]) < 1e-6,
    );
    expect(hasHold).toBe(true);
  });

  it('supports multiple series', () => {
    const chart = new StepChart({
      values: [
        [1, 2, 3],
        [3, 2, 1],
      ],
    });
    expect(chart.getNumSeries()).toBe(2);
    expect(chart.lines.children).toHaveLength(2);
    expect(chart.getStepPoints(1)[0]).toEqual([0, 3]);
  });

  it('draws dots at each data point when enabled', () => {
    const chart = new StepChart({ values: [1, 2, 3], showDots: true });
    expect(chart.dots.children).toHaveLength(3);
  });

  it('does not throw on empty data', () => {
    const chart = new StepChart({ values: [] });
    expect(chart.getNumSeries()).toBe(0);
    expect(chart.lines.children).toHaveLength(0);
  });

  it('does not throw on a single point', () => {
    const chart = new StepChart({ values: [7] });
    expect(chart.getStepPoints(0)).toEqual([[0, 7]]);
    expect(chart.getLine(0)).toBeInstanceOf(Polygon);
  });

  it('copies independently', () => {
    const chart = new StepChart({ values: [1, 2, 3], stepMode: 'before' });
    const clone = chart.copy();
    expect(clone.getStepMode()).toBe('before');
    expect(clone.getStepPoints(0)).toEqual(chart.getStepPoints(0));
    expect(clone).not.toBe(chart);
  });
});
