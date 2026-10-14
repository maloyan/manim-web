import { describe, it, expect } from 'vitest';
import { AreaChart } from './AreaChart';
import { Polygon } from '../geometry/Polygon';

/** The [minY, maxY] span of a polygon's points. */
function yspan(poly: Polygon): [number, number] {
  const ys = poly.getPoints().map((p) => p[1]);
  return [Math.min(...ys), Math.max(...ys)];
}

describe('AreaChart', () => {
  it('fills each area from its line down to the baseline', () => {
    const chart = new AreaChart({ values: [1, 3, 2, 5], baseline: 0 });
    const axes = chart.getAxes();
    const area = chart.getArea(0) as Polygon;
    const [minY, maxY] = yspan(area);
    const baselineY = axes.coordsToPoint(0, 0)[1];
    const topY = axes.coordsToPoint(0, 5)[1];
    // The fill reaches down to the baseline and up to the peak value.
    expect(minY).toBeCloseTo(baselineY, 6);
    expect(maxY).toBeCloseTo(topY, 6);
  });

  it('draws the line through each data point', () => {
    const chart = new AreaChart({ values: [2, 4], xValues: [0, 1] });
    const axes = chart.getAxes();
    const line = chart.getLine(0) as Polygon;
    const pts = line.getPoints();
    const start = axes.coordsToPoint(0, 2);
    const end = axes.coordsToPoint(1, 4);
    expect(pts[0][0]).toBeCloseTo(start[0], 6);
    expect(pts[0][1]).toBeCloseTo(start[1], 6);
    expect(pts[pts.length - 1][0]).toBeCloseTo(end[0], 6);
    expect(pts[pts.length - 1][1]).toBeCloseTo(end[1], 6);
  });

  it('stacks series so each rests on the cumulative sum below', () => {
    const chart = new AreaChart({
      values: [
        [1, 2, 3],
        [4, 5, 6],
      ],
      stacked: true,
    });
    // Series 0 tops are its own values; its band below is the baseline 0.
    expect(chart.getBottomValues(0)).toEqual([0, 0, 0]);
    expect(chart.getTopValues(0)).toEqual([1, 2, 3]);
    // Series 1 rests on series 0 and its top is the cumulative sum.
    expect(chart.getBottomValues(1)).toEqual([1, 2, 3]);
    expect(chart.getTopValues(1)).toEqual([5, 7, 9]);
  });

  it('does not stack by default', () => {
    const chart = new AreaChart({
      values: [
        [1, 2],
        [4, 5],
      ],
    });
    expect(chart.getBottomValues(1)).toEqual([0, 0]);
    expect(chart.getTopValues(1)).toEqual([4, 5]);
  });

  it('exposes one area and one line per series', () => {
    const chart = new AreaChart({
      values: [
        [1, 2],
        [3, 4],
        [5, 6],
      ],
    });
    expect(chart.getNumSeries()).toBe(3);
    expect(chart.areas.children).toHaveLength(3);
    expect(chart.lines.children).toHaveLength(3);
    expect(chart.getSeries(1).children).toHaveLength(2);
  });

  it('does not throw on empty data', () => {
    const chart = new AreaChart({ values: [] });
    expect(chart.getNumSeries()).toBe(0);
    expect(chart.areas.children).toHaveLength(0);
  });

  it('does not throw on a single point', () => {
    const chart = new AreaChart({ values: [5] });
    expect(chart.getNumSeries()).toBe(1);
    expect(chart.getArea(0)).toBeInstanceOf(Polygon);
  });

  it('renders a legend when seriesNames are given', () => {
    const chart = new AreaChart({
      values: [
        [1, 3, 2],
        [2, 1, 4],
      ],
      seriesNames: ['Reads', 'Writes'],
    });
    expect(chart.getLegend()).not.toBeNull();
    // one swatch + one label per named series
    expect(chart.legend!.children).toHaveLength(4);
  });

  it('omits the legend when no seriesNames are given', () => {
    const chart = new AreaChart({ values: [[1, 2, 3]] });
    expect(chart.getLegend()).toBeNull();
  });

  it('suppresses the legend when showLegend is false', () => {
    const chart = new AreaChart({
      values: [[1, 2, 3]],
      seriesNames: ['A'],
      showLegend: false,
    });
    expect(chart.getLegend()).toBeNull();
  });

  it('copies the legend options', () => {
    const chart = new AreaChart({
      values: [
        [1, 2],
        [3, 4],
      ],
      seriesNames: ['A', 'B'],
    });
    const clone = chart.copy();
    expect(clone.getLegend()).not.toBeNull();
    expect(clone.legend!.children).toHaveLength(4);
  });

  it('copies independently', () => {
    const chart = new AreaChart({
      values: [
        [1, 2],
        [3, 4],
      ],
      stacked: true,
    });
    const clone = chart.copy();
    expect(clone.getNumSeries()).toBe(2);
    expect(clone.getTopValues(1)).toEqual([4, 6]);
    expect(clone).not.toBe(chart);
  });
});
