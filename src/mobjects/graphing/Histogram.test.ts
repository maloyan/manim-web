import { describe, it, expect } from 'vitest';
import { Histogram } from './Histogram';
import { Rectangle } from '../geometry/Rectangle';

describe('Histogram', () => {
  it('creates one bar per bin and counts sum to N', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const hist = new Histogram({ data, bins: 5 });
    expect(hist.numBins).toBe(5);
    expect(hist.getBars().children).toHaveLength(5);
    const total = hist.getBins().reduce((acc, b) => acc + b.count, 0);
    expect(total).toBe(data.length);
  });

  it('maps bar height to the axis in count mode', () => {
    const data = [1, 1, 2, 2, 2, 3];
    const hist = new Histogram({ data, binEdges: [0.5, 1.5, 2.5, 3.5] });
    const axes = hist.getAxes();
    const bins = hist.getBins();
    for (let i = 0; i < hist.numBins; i++) {
      const bar = hist.getBar(i) as Rectangle;
      const base = axes.coordsToPoint(bins[i].x0, 0);
      const top = axes.coordsToPoint(bins[i].x0, bins[i].count);
      const expectedHeight = Math.abs(top[1] - base[1]);
      expect(bar.getHeight()).toBeCloseTo(expectedHeight, 6);
    }
  });

  it('maps bars to the x-axis span of each bin', () => {
    const hist = new Histogram({ data: [0, 1, 2, 3, 4], bins: 4 });
    const axes = hist.getAxes();
    const bins = hist.getBins();
    const bar = hist.getBar(0) as Rectangle;
    const left = axes.coordsToPoint(bins[0].x0, 0);
    const right = axes.coordsToPoint(bins[0].x1, 0);
    expect(bar.getWidth()).toBeCloseTo(Math.abs(right[0] - left[0]), 6);
  });

  it('uses density heights when density is true', () => {
    const data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const hist = new Histogram({ data, bins: 5, density: true });
    const bins = hist.getBins();
    const area = bins.reduce((acc, b) => acc + b.density * (b.x1 - b.x0), 0);
    expect(area).toBeCloseTo(1, 10);
  });

  it('does not throw on empty data', () => {
    const hist = new Histogram({ data: [], bins: 5 });
    expect(hist.numBins).toBe(0);
    expect(hist.getBars().children).toHaveLength(0);
  });

  it('does not throw on all-equal data', () => {
    const hist = new Histogram({ data: [4, 4, 4, 4], bins: 4 });
    const total = hist.getBins().reduce((acc, b) => acc + b.count, 0);
    expect(total).toBe(4);
  });
});
