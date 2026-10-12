import { describe, it, expect } from 'vitest';
import { BoxPlot } from './BoxPlot';
import { boxSummary } from './stats';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';

describe('BoxPlot', () => {
  it('summarizes a single group correctly', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
    const plot = new BoxPlot({ data });
    expect(plot.numGroups).toBe(1);
    const summary = plot.getSummary(0);
    const expected = boxSummary(data);
    expect(summary.q1).toBeCloseTo(expected.q1, 10);
    expect(summary.median).toBeCloseTo(expected.median, 10);
    expect(summary.q3).toBeCloseTo(expected.q3, 10);
    expect(summary.outliers).toContain(100);
  });

  it('draws the box spanning Q1 to Q3 with a median line (vertical)', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const plot = new BoxPlot({ data, orientation: 'vertical' });
    const axes = plot.getAxes();
    const s = plot.getSummary(0);

    const box = plot.getBox(0) as Rectangle;
    const q1Point = axes.coordsToPoint(0, s.q1);
    const q3Point = axes.coordsToPoint(0, s.q3);
    const expectedHeight = Math.abs(q3Point[1] - q1Point[1]);
    expect(box.getHeight()).toBeCloseTo(expectedHeight, 6);
    expect(box.getRectCenter()[1]).toBeCloseTo((q1Point[1] + q3Point[1]) / 2, 6);

    const median = plot.getMedianLine(0) as Line;
    const medianPoint = axes.coordsToPoint(0, s.median);
    expect(median.getStart()[1]).toBeCloseTo(medianPoint[1], 6);
    expect(median.getEnd()[1]).toBeCloseTo(medianPoint[1], 6);
  });

  it('draws four whisker lines and one dot per outlier', () => {
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 50];
    const plot = new BoxPlot({ data });
    const s = plot.getSummary(0);
    expect(plot.getWhiskers(0)?.children).toHaveLength(4);
    expect(plot.getOutlierDots(0)?.children).toHaveLength(s.outliers.length);
    expect(s.outliers).toContain(50);
  });

  it('places whisker ends at the correct values', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const plot = new BoxPlot({ data });
    const axes = plot.getAxes();
    const s = plot.getSummary(0);
    const stems = plot.getWhiskers(0)!.children as Line[];
    // First stem goes from Q3 to the upper whisker.
    const upperEnd = stems[0].getEnd();
    const expectedUpper = axes.coordsToPoint(0, s.whiskerHigh);
    expect(upperEnd[1]).toBeCloseTo(expectedUpper[1], 6);
  });

  it('supports multiple groups side by side', () => {
    const plot = new BoxPlot({
      data: [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
      ],
    });
    expect(plot.numGroups).toBe(2);
    const box0 = plot.getBox(0) as Rectangle;
    const box1 = plot.getBox(1) as Rectangle;
    // Group 1 sits to the right of group 0 on the category (x) axis.
    expect(box1.getRectCenter()[0]).toBeGreaterThan(box0.getRectCenter()[0]);
  });

  it('supports horizontal orientation', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const plot = new BoxPlot({ data, orientation: 'horizontal' });
    const axes = plot.getAxes();
    const s = plot.getSummary(0);
    const box = plot.getBox(0) as Rectangle;
    const q1Point = axes.coordsToPoint(s.q1, 0);
    const q3Point = axes.coordsToPoint(s.q3, 0);
    // Horizontally, the box spans along x.
    expect(box.getWidth()).toBeCloseTo(Math.abs(q3Point[0] - q1Point[0]), 6);
  });

  it('has zero box height for all-equal data without throwing', () => {
    const plot = new BoxPlot({ data: [5, 5, 5, 5] });
    const s = plot.getSummary(0);
    expect(s.iqr).toBe(0);
    expect(plot.getOutlierDots(0)?.children).toHaveLength(0);
  });

  it('does not throw on an empty group', () => {
    const plot = new BoxPlot({ data: [] });
    expect(plot.numGroups).toBe(1);
    expect(plot.getBox(0)).toBeNull();
    expect(plot.getSummary(0).q1).toBeNaN();
  });
});
