import { describe, it, expect } from 'vitest';
import {
  mean,
  stdDev,
  quantile,
  iqr,
  histogramBins,
  kde,
  silvermanBandwidth,
  boxSummary,
} from './stats';

describe('mean', () => {
  it('averages known data', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(mean([5])).toBe(5);
    expect(mean([-2, 2])).toBe(0);
  });

  it('returns NaN for empty data', () => {
    expect(mean([])).toBeNaN();
  });
});

describe('stdDev', () => {
  it('computes the population standard deviation', () => {
    // values 2,4,4,4,5,5,7,9 -> mean 5, population sd 2
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 10);
  });

  it('computes the sample standard deviation', () => {
    // values 1,2,3,4,5 -> sample variance 2.5 -> sd sqrt(2.5)
    expect(stdDev([1, 2, 3, 4, 5], true)).toBeCloseTo(Math.sqrt(2.5), 10);
  });

  it('is zero for a single population value and NaN when empty', () => {
    expect(stdDev([7])).toBe(0);
    expect(stdDev([])).toBeNaN();
  });

  it('is zero for all-equal data', () => {
    expect(stdDev([3, 3, 3, 3])).toBe(0);
  });
});

describe('quantile', () => {
  it('matches the type-7 definition on known data', () => {
    const data = [1, 2, 3, 4];
    expect(quantile(data, 0)).toBe(1);
    expect(quantile(data, 1)).toBe(4);
    expect(quantile(data, 0.5)).toBeCloseTo(2.5, 10);
    expect(quantile(data, 0.25)).toBeCloseTo(1.75, 10);
    expect(quantile(data, 0.75)).toBeCloseTo(3.25, 10);
  });

  it('clamps out-of-range quantiles and ignores input order', () => {
    expect(quantile([4, 1, 3, 2], -1)).toBe(1);
    expect(quantile([4, 1, 3, 2], 2)).toBe(4);
  });

  it('returns NaN for empty data', () => {
    expect(quantile([], 0.5)).toBeNaN();
  });
});

describe('iqr', () => {
  it('is Q3 minus Q1', () => {
    expect(iqr([1, 2, 3, 4])).toBeCloseTo(3.25 - 1.75, 10);
  });

  it('is zero for all-equal data', () => {
    expect(iqr([5, 5, 5, 5])).toBe(0);
  });

  it('returns NaN for empty data', () => {
    expect(iqr([])).toBeNaN();
  });
});

describe('histogramBins', () => {
  it('counts sum to N and bins tile the data range', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const bins = histogramBins(data, { bins: 5 });
    expect(bins).toHaveLength(5);
    const total = bins.reduce((acc, b) => acc + b.count, 0);
    expect(total).toBe(data.length);
    expect(bins[0].x0).toBeCloseTo(1, 10);
    expect(bins[bins.length - 1].x1).toBeCloseTo(10, 10);
  });

  it('places the maximum value in the last bin', () => {
    const bins = histogramBins([0, 10], { bins: 2 });
    expect(bins[0].count).toBe(1);
    expect(bins[1].count).toBe(1);
  });

  it('density integrates to one over the bins', () => {
    const data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const bins = histogramBins(data, { bins: 5 });
    const area = bins.reduce((acc, b) => acc + b.density * (b.x1 - b.x0), 0);
    expect(area).toBeCloseTo(1, 10);
  });

  it('honours explicit bin edges', () => {
    const bins = histogramBins([1, 1, 2, 3], { binEdges: [0, 2, 4] });
    expect(bins).toHaveLength(2);
    expect(bins[0].count).toBe(2); // 1, 1
    expect(bins[1].count).toBe(2); // 2, 3
  });

  it('handles all-equal data without a zero-width range', () => {
    const bins = histogramBins([5, 5, 5], { bins: 4 });
    const total = bins.reduce((acc, b) => acc + b.count, 0);
    expect(total).toBe(3);
    expect(bins.every((b) => b.x1 > b.x0)).toBe(true);
  });

  it('returns no bins for empty data', () => {
    expect(histogramBins([], { bins: 5 })).toEqual([]);
  });
});

describe('kde', () => {
  it('peaks near the mode of a clustered sample', () => {
    const data = [-0.1, 0, 0.05, 0.1, -0.05, 0, 0.02, -0.02];
    const estimate = kde(data, { bandwidth: 0.3 });
    const grid: number[] = [];
    for (let x = -3; x <= 3; x += 0.05) grid.push(x);
    let bestX = grid[0];
    let bestY = estimate(grid[0]);
    for (const x of grid) {
      const y = estimate(x);
      if (y > bestY) {
        bestY = y;
        bestX = x;
      }
    }
    expect(bestX).toBeCloseTo(0, 1);
    expect(bestY).toBeGreaterThan(0);
  });

  it('is symmetric about the mean for a symmetric sample', () => {
    const data = [-2, -1, 0, 1, 2];
    const estimate = kde(data, { bandwidth: 0.8 });
    expect(estimate(-1.3)).toBeCloseTo(estimate(1.3), 10);
  });

  it('integrates to approximately one', () => {
    const data = [-1, 0, 1, 2, 3];
    const estimate = kde(data, { bandwidth: 0.6 });
    let area = 0;
    const dx = 0.02;
    for (let x = -8; x <= 10; x += dx) area += estimate(x) * dx;
    expect(area).toBeCloseTo(1, 1);
  });

  it('stays finite and does not throw on zero-spread data', () => {
    const estimate = kde([4, 4, 4]);
    expect(Number.isFinite(estimate(4))).toBe(true);
    expect(estimate(10)).toBe(0);
  });

  it('returns a zero estimator for empty data', () => {
    const estimate = kde([]);
    expect(estimate(0)).toBe(0);
  });
});

describe('silvermanBandwidth', () => {
  it('is positive for spread data and zero for degenerate data', () => {
    expect(silvermanBandwidth([1, 2, 3, 4, 5])).toBeGreaterThan(0);
    expect(silvermanBandwidth([7, 7, 7])).toBe(0);
    expect(silvermanBandwidth([1])).toBe(0);
    expect(silvermanBandwidth([])).toBe(0);
  });
});

describe('boxSummary', () => {
  it('reports quartiles, whiskers and outliers', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
    const s = boxSummary(data);
    expect(s.q1).toBeCloseTo(quantile(data, 0.25), 10);
    expect(s.median).toBeCloseTo(quantile(data, 0.5), 10);
    expect(s.q3).toBeCloseTo(quantile(data, 0.75), 10);
    expect(s.outliers).toContain(100);
    // The upper whisker must stop at the largest non-outlier value.
    expect(s.whiskerHigh).toBe(9);
    expect(s.whiskerLow).toBe(1);
  });

  it('flags values beyond 1.5*IQR as outliers', () => {
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 50];
    const s = boxSummary(data);
    const fence = s.q3 + 1.5 * s.iqr;
    expect(s.outliers.every((v) => v > fence || v < s.q1 - 1.5 * s.iqr)).toBe(true);
    expect(s.outliers).toContain(50);
  });

  it('has zero IQR and no outliers for all-equal data', () => {
    const s = boxSummary([5, 5, 5, 5]);
    expect(s.iqr).toBe(0);
    expect(s.q1).toBe(5);
    expect(s.median).toBe(5);
    expect(s.q3).toBe(5);
    expect(s.outliers).toEqual([]);
    expect(s.whiskerLow).toBe(5);
    expect(s.whiskerHigh).toBe(5);
  });

  it('does not throw on empty data', () => {
    const s = boxSummary([]);
    expect(s.q1).toBeNaN();
    expect(s.outliers).toEqual([]);
  });
});
