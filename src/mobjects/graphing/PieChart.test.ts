import { describe, it, expect } from 'vitest';
import { PieChart, DonutChart, computeSliceGeometry } from './PieChart';
import { Sector } from '../geometry/Sector';
import { AnnularSector } from '../geometry/AnnularSector';

const TAU = Math.PI * 2;

describe('computeSliceGeometry', () => {
  it('assigns sweep angles proportional to each value', () => {
    const slices = computeSliceGeometry([1, 1, 2], 0);
    expect(slices.map((s) => s.angle)).toEqual([Math.PI / 2, Math.PI / 2, Math.PI]);
    const total = slices.reduce((sum, s) => sum + s.angle, 0);
    expect(total).toBeCloseTo(TAU, 10);
  });

  it('chains start angles end-to-end from the given startAngle', () => {
    const start = Math.PI / 2;
    const slices = computeSliceGeometry([1, 1, 2], start);
    expect(slices[0].startAngle).toBeCloseTo(start, 10);
    expect(slices[1].startAngle).toBeCloseTo(start + Math.PI / 2, 10);
    expect(slices[2].startAngle).toBeCloseTo(start + Math.PI, 10);
  });

  it('skips zero and negative values', () => {
    const slices = computeSliceGeometry([2, 0, -5, 2], 0);
    expect(slices.map((s) => s.index)).toEqual([0, 3]);
    expect(slices.map((s) => s.angle)).toEqual([Math.PI, Math.PI]);
  });

  it('makes a single value a full circle', () => {
    const slices = computeSliceGeometry([7], 0);
    expect(slices).toHaveLength(1);
    expect(slices[0].angle).toBeCloseTo(TAU, 10);
  });

  it('returns no slices when the total is not positive', () => {
    expect(computeSliceGeometry([], 0)).toEqual([]);
    expect(computeSliceGeometry([0, -1], 0)).toEqual([]);
  });
});

describe('PieChart', () => {
  it('builds one sector per data value', () => {
    const pie = new PieChart({ values: [1, 2, 3, 4] });
    expect(pie.getSectors()).toHaveLength(4);
    for (const sector of pie.getSectors()) {
      expect(sector).toBeInstanceOf(Sector);
    }
  });

  it('gives each sector a sweep angle proportional to its value', () => {
    const pie = new PieChart({ values: [1, 1, 2], startAngle: 0 });
    const angles = pie.getSectors().map((s) => (s as Sector).getAngle());
    expect(angles[0]).toBeCloseTo(Math.PI / 2, 10);
    expect(angles[1]).toBeCloseTo(Math.PI / 2, 10);
    expect(angles[2]).toBeCloseTo(Math.PI, 10);
    expect(angles.reduce((a, b) => a + b, 0)).toBeCloseTo(TAU, 10);
  });

  it('respects the configured start angle', () => {
    const start = Math.PI / 3;
    const pie = new PieChart({ values: [1, 1], startAngle: start });
    expect((pie.getSlice(0) as Sector).getStartAngle()).toBeCloseTo(start, 10);
    expect((pie.getSlice(1) as Sector).getStartAngle()).toBeCloseTo(start + Math.PI, 10);
  });

  it('defaults the first slice edge to the top (PI/2)', () => {
    const pie = new PieChart({ values: [1, 1] });
    expect((pie.getSlice(0) as Sector).getStartAngle()).toBeCloseTo(Math.PI / 2, 10);
  });

  it('applies the given colors to the slices, cycling the palette', () => {
    const colors = ['#111111', '#222222'];
    const pie = new PieChart({ values: [1, 1, 1], colors });
    const sectors = pie.getSectors();
    expect(sectors[0].color).toBe('#111111');
    expect(sectors[1].color).toBe('#222222');
    expect(sectors[2].color).toBe('#111111');
  });

  it('accepts a single color for every slice', () => {
    const pie = new PieChart({ values: [1, 2], colors: '#abcdef' });
    for (const sector of pie.getSectors()) {
      expect(sector.color).toBe('#abcdef');
    }
  });

  it('applies the stroke color and width between slices', () => {
    const pie = new PieChart({ values: [1, 1], strokeColor: '#ff00ff', strokeWidth: 3 });
    const sector = pie.getSlice(0) as Sector;
    expect(sector.strokeColor).toBe('#ff00ff');
    expect(sector.strokeWidth).toBe(3);
  });

  it('skips zero and negative values when building sectors', () => {
    const pie = new PieChart({ values: [1, 0, -2, 3] });
    expect(pie.getSectors()).toHaveLength(2);
    expect(pie.getValues()).toEqual([1, 0, -2, 3]);
  });

  it('makes a single value fill the whole circle', () => {
    const pie = new PieChart({ values: [5] });
    expect(pie.getSectors()).toHaveLength(1);
    expect((pie.getSlice(0) as Sector).getAngle()).toBeCloseTo(TAU, 10);
  });

  it('is an empty group for empty data and does not throw', () => {
    let pie!: PieChart;
    expect(() => {
      pie = new PieChart({ values: [] });
    }).not.toThrow();
    expect(pie.getSectors()).toHaveLength(0);
    expect(pie.slices.length).toBe(0);
  });

  it('does not throw for all non-positive data', () => {
    expect(() => new PieChart({ values: [0, -1, -2] }).getThreeObject()).not.toThrow();
    expect(new PieChart({ values: [0, -1] }).getSectors()).toHaveLength(0);
  });

  it('builds one label per labelled slice when labels are given', () => {
    const pie = new PieChart({ values: [1, 1, 2], labels: ['A', 'B', 'C'] });
    expect(pie.labelGroup.length).toBe(3);
  });

  it('shows no labels by default when none are given', () => {
    const pie = new PieChart({ values: [1, 2] });
    expect(pie.labelGroup.length).toBe(0);
  });

  it('builds percentage labels with correct rounding', () => {
    const pie = new PieChart({
      values: [1, 1, 2],
      showPercentages: true,
      showLabels: true,
    });
    const geom = pie.getSliceGeometry();
    expect(Math.round(geom[0].fraction * 100)).toBe(25);
    expect(Math.round(geom[2].fraction * 100)).toBe(50);
    expect(pie.labelGroup.length).toBe(3);
  });

  it('builds a legend when requested', () => {
    const pie = new PieChart({
      values: [1, 2, 3],
      labels: ['A', 'B', 'C'],
      showLegend: true,
    });
    expect(pie.legend).not.toBeNull();
    // One swatch + one text per labelled slice.
    expect(pie.legend!.length).toBe(6);
  });

  it('constructs a renderable three object', () => {
    const pie = new PieChart({ values: [3, 2, 1], labels: ['x', 'y', 'z'], showLegend: true });
    expect(() => pie.getThreeObject()).not.toThrow();
  });

  it('copies to an independent instance with the same slices', () => {
    const pie = new PieChart({ values: [1, 2, 3], startAngle: 1 });
    const clone = pie.copy();
    expect(clone).toBeInstanceOf(PieChart);
    expect(clone).not.toBe(pie);
    expect(clone.getSectors()).toHaveLength(3);
    expect((clone.getSlice(0) as Sector).getStartAngle()).toBeCloseTo(1, 10);
  });
});

describe('DonutChart', () => {
  it('builds annular sectors instead of plain sectors', () => {
    const donut = new DonutChart({ values: [1, 2, 3] });
    expect(donut.getSectors()).toHaveLength(3);
    for (const sector of donut.getSectors()) {
      expect(sector).toBeInstanceOf(AnnularSector);
    }
  });

  it('shares the proportional slice-angle logic with PieChart', () => {
    const donut = new DonutChart({ values: [1, 1, 2], startAngle: 0 });
    const angles = donut.getSectors().map((s) => (s as AnnularSector).getAngle());
    expect(angles[0]).toBeCloseTo(Math.PI / 2, 10);
    expect(angles[2]).toBeCloseTo(Math.PI, 10);
    expect(angles.reduce((a, b) => a + b, 0)).toBeCloseTo(TAU, 10);
  });

  it('carries the inner radius on every sector (fraction of outer radius)', () => {
    const donut = new DonutChart({ values: [1, 1], radius: 4, innerRadius: 0.5 });
    expect(donut.getInnerRadius()).toBeCloseTo(2, 10);
    for (const sector of donut.getSectors()) {
      expect((sector as AnnularSector).getInnerRadius()).toBeCloseTo(2, 10);
      expect((sector as AnnularSector).getOuterRadius()).toBeCloseTo(4, 10);
    }
  });

  it('defaults the inner radius to half the outer radius', () => {
    const donut = new DonutChart({ values: [1], radius: 2 });
    expect(donut.getInnerRadiusFraction()).toBeCloseTo(0.5, 10);
    expect(donut.getInnerRadius()).toBeCloseTo(1, 10);
  });

  it('clamps an out-of-range inner radius into [0, 1)', () => {
    expect(new DonutChart({ values: [1], innerRadius: -1 }).getInnerRadiusFraction()).toBe(0);
    expect(new DonutChart({ values: [1], innerRadius: 2 }).getInnerRadiusFraction()).toBeCloseTo(
      0.99,
      10,
    );
  });

  it('is an empty group for empty data and does not throw', () => {
    let donut!: DonutChart;
    expect(() => {
      donut = new DonutChart({ values: [] });
    }).not.toThrow();
    expect(donut.getSectors()).toHaveLength(0);
  });

  it('copies to an independent DonutChart keeping the inner radius', () => {
    const donut = new DonutChart({ values: [1, 2], radius: 3, innerRadius: 0.4 });
    const clone = donut.copy();
    expect(clone).toBeInstanceOf(DonutChart);
    expect(clone).not.toBe(donut);
    expect(clone.getInnerRadius()).toBeCloseTo(1.2, 10);
    expect(clone.getSectors()).toHaveLength(2);
  });
});
