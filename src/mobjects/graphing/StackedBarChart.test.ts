import { describe, it, expect } from 'vitest';
import { StackedBarChart } from './StackedBarChart';
import { Rectangle } from '../geometry/Rectangle';

/** Bottom edge y of a bar. */
function bottomOf(bar: Rectangle): number {
  return bar.getRectCenter()[1] - bar.getHeight() / 2;
}
/** Top edge y of a bar. */
function topOf(bar: Rectangle): number {
  return bar.getRectCenter()[1] + bar.getHeight() / 2;
}

describe('StackedBarChart', () => {
  it('stacks each series atop the cumulative sum of the lower series', () => {
    const chart = new StackedBarChart({
      values: [
        [3, 7, 2],
        [5, 4, 6],
      ],
      mode: 'stacked',
    });
    for (let c = 0; c < 3; c++) {
      const lower = chart.getBar(0, c) as Rectangle;
      const upper = chart.getBar(1, c) as Rectangle;
      // The lower bar rests on the zero baseline.
      expect(bottomOf(lower)).toBeCloseTo(chart.baselineY(), 9);
      // The upper bar's bottom meets the lower bar's top.
      expect(bottomOf(upper)).toBeCloseTo(topOf(lower), 9);
      // The upper bar's bottom is the mapped cumulative sum of the series below.
      expect(bottomOf(upper)).toBeCloseTo(chart.valueToY(chart.getValues()[0][c]), 9);
    }
  });

  it('gives each stacked bar a height proportional to its own value', () => {
    const chart = new StackedBarChart({ values: [[2], [6]], mode: 'stacked' });
    const h0 = (chart.getBar(0, 0) as Rectangle).getHeight();
    const h1 = (chart.getBar(1, 0) as Rectangle).getHeight();
    // Series 1 value is 3x series 0, so its segment is ~3x as tall.
    expect(h1 / h0).toBeCloseTo(3, 6);
  });

  it('places grouped series side by side without overlap', () => {
    const chart = new StackedBarChart({
      values: [
        [3, 7],
        [5, 4],
      ],
      mode: 'grouped',
    });
    for (let c = 0; c < 2; c++) {
      const a = chart.getBar(0, c) as Rectangle;
      const b = chart.getBar(1, c) as Rectangle;
      const ax = a.getRectCenter()[0];
      const bx = b.getRectCenter()[0];
      expect(bx).toBeGreaterThan(ax);
      // The centers are at least a bar-width apart: edges do not overlap.
      const gap = bx - ax;
      expect(gap).toBeGreaterThanOrEqual((a.getWidth() + b.getWidth()) / 2 - 1e-9);
      // Grouped bars share the baseline, they do not stack.
      expect(bottomOf(a)).toBeCloseTo(chart.baselineY(), 9);
      expect(bottomOf(b)).toBeCloseTo(chart.baselineY(), 9);
    }
  });

  it('exposes series and bars through accessors', () => {
    const chart = new StackedBarChart({
      values: [
        [1, 2, 3],
        [4, 5, 6],
      ],
    });
    expect(chart.getNumSeries()).toBe(2);
    expect(chart.getNumCategories()).toBe(3);
    expect(chart.getSeries(0).children).toHaveLength(3);
    expect(chart.getSeries(1).children).toHaveLength(3);
    expect(chart.getBar(1, 2)).toBeInstanceOf(Rectangle);
    expect(chart.getBar(5, 0)).toBeUndefined();
  });

  it('builds a legend only when names and the flag are given', () => {
    const withLegend = new StackedBarChart({
      values: [[1], [2]],
      seriesNames: ['A', 'B'],
      showLegend: true,
    });
    expect(withLegend.legend).not.toBeNull();
    const withoutLegend = new StackedBarChart({ values: [[1], [2]] });
    expect(withoutLegend.legend).toBeNull();
  });

  it('accepts a flat array as a single series', () => {
    const chart = new StackedBarChart({ values: [3, 1, 4] });
    expect(chart.getNumSeries()).toBe(1);
    expect(chart.getNumCategories()).toBe(3);
  });

  it('does not throw on empty data', () => {
    const chart = new StackedBarChart({ values: [] });
    expect(chart.getNumSeries()).toBe(0);
    expect(chart.getNumCategories()).toBe(0);
    expect(chart.bars.children).toHaveLength(0);
  });

  it('does not throw on a single series with one point', () => {
    const chart = new StackedBarChart({ values: [[5]] });
    expect(chart.getNumSeries()).toBe(1);
    expect(chart.getBar(0, 0)).toBeInstanceOf(Rectangle);
  });

  it('does not throw when all values are equal', () => {
    const chart = new StackedBarChart({
      values: [
        [4, 4, 4],
        [4, 4, 4],
      ],
    });
    const [lo, hi, step] = chart.getYRange();
    expect(hi).toBeGreaterThan(lo);
    expect(step).toBeGreaterThan(0);
  });

  it('pads shorter series with zeros', () => {
    const chart = new StackedBarChart({ values: [[1, 2, 3], [4]] });
    expect(chart.getValues()[1]).toEqual([4, 0, 0]);
  });

  it('copies independently', () => {
    const chart = new StackedBarChart({
      values: [
        [1, 2],
        [3, 4],
      ],
      mode: 'grouped',
    });
    const clone = chart.copy();
    expect(clone.getValues()).toEqual(chart.getValues());
    expect(clone.getMode()).toBe('grouped');
    expect(clone).not.toBe(chart);
  });
});
