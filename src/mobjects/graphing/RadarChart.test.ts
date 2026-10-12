import { describe, it, expect } from 'vitest';
import { RadarChart } from './RadarChart';
import { Polygon } from '../geometry/Polygon';
import { VGroup } from '../../core/VGroup';

const SINGLE = [4, 2, 5, 1, 3];
const MULTI = [
  [4, 2, 5, 1, 3],
  [1, 5, 2, 4, 2],
];
const CATEGORIES = ['Speed', 'Power', 'Range', 'Cost', 'Weight'];

describe('RadarChart', () => {
  it('creates one axis per category at 2*pi/N spacing', () => {
    const chart = new RadarChart({ data: SINGLE, categories: CATEGORIES });
    expect(chart.getNumAxes()).toBe(SINGLE.length);
    const step = (2 * Math.PI) / SINGLE.length;
    for (let k = 1; k < SINGLE.length; k++) {
      const delta = chart.getAxisAngle(k) - chart.getAxisAngle(k - 1);
      expect(delta).toBeCloseTo(step, 10);
    }
  });

  it('exposes N spoke lines through getAxes()', () => {
    const chart = new RadarChart({ data: SINGLE });
    expect(chart.getAxes()).toBeInstanceOf(VGroup);
    expect(chart.getAxes().children).toHaveLength(SINGLE.length);
  });

  it('places a value equal to maxValue on the outer ring', () => {
    const chart = new RadarChart({ data: SINGLE, maxValue: 5, radius: 3 });
    // category index 2 has value 5 == maxValue
    const point = chart.getPointForValue(0, 2);
    const dist = Math.hypot(point[0], point[1]);
    expect(dist).toBeCloseTo(3, 10);
  });

  it('places each value at the correct angle and radius', () => {
    const chart = new RadarChart({ data: SINGLE, maxValue: 5, radius: 3 });
    for (let k = 0; k < SINGLE.length; k++) {
      const r = (SINGLE[k] / 5) * 3;
      const a = chart.getAxisAngle(k);
      const point = chart.getPointForValue(0, k);
      expect(point[0]).toBeCloseTo(r * Math.cos(a), 10);
      expect(point[1]).toBeCloseTo(r * Math.sin(a), 10);
    }
  });

  it('builds a closed polygon per series whose vertices match the plotted points', () => {
    const chart = new RadarChart({ data: SINGLE, maxValue: 5, radius: 3 });
    const poly = chart.getSeriesPolygon(0);
    expect(poly).toBeInstanceOf(Polygon);
    expect(poly!.isClosed()).toBe(true);
    const verts = poly!.getVertices();
    expect(verts).toHaveLength(SINGLE.length);
    for (let k = 0; k < SINGLE.length; k++) {
      const point = chart.getPointForValue(0, k);
      expect(verts[k][0]).toBeCloseTo(point[0], 10);
      expect(verts[k][1]).toBeCloseTo(point[1], 10);
    }
  });

  it('overlays multiple series', () => {
    const chart = new RadarChart({ data: MULTI, maxValue: 5, radius: 3 });
    expect(chart.getNumSeries()).toBe(2);
    expect(chart.getSeriesPolygon(0)).toBeInstanceOf(Polygon);
    expect(chart.getSeriesPolygon(1)).toBeInstanceOf(Polygon);
    // series share the same axis geometry
    const p0 = chart.getPointForValue(0, 2); // value 5 -> outer ring
    const p1 = chart.getPointForValue(1, 2); // value 2
    expect(Math.hypot(p0[0], p0[1])).toBeCloseTo(3, 10);
    expect(Math.hypot(p1[0], p1[1])).toBeCloseTo((2 / 5) * 3, 10);
  });

  it('gives each series its own color', () => {
    const chart = new RadarChart({
      data: MULTI,
      seriesColors: ['#00ffff', '#ff00ff'],
    });
    expect(chart.getSeriesPolygon(0)!.color.toLowerCase()).toBe('#00ffff');
    expect(chart.getSeriesPolygon(1)!.color.toLowerCase()).toBe('#ff00ff');
  });

  it('applies the fill opacity to the series polygons', () => {
    const chart = new RadarChart({ data: SINGLE, fillOpacity: 0.25 });
    expect(chart.getSeriesPolygon(0)!.fillOpacity).toBeCloseTo(0.25, 10);
  });

  it('draws concentric grid rings through getGrid()', () => {
    const chart = new RadarChart({ data: SINGLE, numRings: 4, showGrid: true });
    expect(chart.getGrid()).toBeInstanceOf(VGroup);
    expect(chart.getGrid().children).toHaveLength(4);
  });

  it('omits the grid when showGrid is false', () => {
    const chart = new RadarChart({ data: SINGLE, showGrid: false });
    expect(chart.getGrid().children).toHaveLength(0);
  });

  it('clamps negative values to the center', () => {
    const chart = new RadarChart({ data: [-3, 2, 1], maxValue: 5, radius: 3 });
    const point = chart.getPointForValue(0, 0);
    expect(Math.hypot(point[0], point[1])).toBeCloseTo(0, 10);
  });

  it('handles an empty data set without throwing', () => {
    expect(() => new RadarChart({ data: [] })).not.toThrow();
    const chart = new RadarChart({ data: [] });
    expect(chart.getNumAxes()).toBe(0);
    expect(chart.getNumSeries()).toBe(0);
    expect(chart.getAxes().children).toHaveLength(0);
  });

  it('handles a single category without throwing', () => {
    expect(() => new RadarChart({ data: [3] })).not.toThrow();
    const chart = new RadarChart({ data: [3] });
    expect(chart.getNumAxes()).toBe(1);
    expect(chart.getAxes().children).toHaveLength(1);
  });

  it('auto-scales maxValue to the largest value when not given', () => {
    const chart = new RadarChart({ data: SINGLE, radius: 3 });
    expect(chart.getMaxValue()).toBe(5);
    // the max value sits on the outer ring
    const point = chart.getPointForValue(0, 2);
    expect(Math.hypot(point[0], point[1])).toBeCloseTo(3, 10);
  });

  it('is copyable', () => {
    const chart = new RadarChart({ data: MULTI, categories: CATEGORIES });
    const clone = chart.copy();
    expect(clone).toBeInstanceOf(RadarChart);
    expect(clone.getNumSeries()).toBe(2);
    expect(clone.getNumAxes()).toBe(CATEGORIES.length);
  });
});
