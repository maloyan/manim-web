import { describe, it, expect } from 'vitest';
import { ViolinPlot } from './ViolinPlot';
import { Polygon } from '../geometry/Polygon';

describe('ViolinPlot', () => {
  it('density peaks near the mode of the data', () => {
    // Data clustered tightly around 5.
    const data = [4.8, 4.9, 5, 5, 5, 5.1, 5.2, 5, 4.95, 5.05];
    const plot = new ViolinPlot({ data, bandwidth: 0.3 });
    const { values, densities } = plot.getDensity(0);
    let peakIndex = 0;
    for (let i = 1; i < densities.length; i++) {
      if (densities[i] > densities[peakIndex]) peakIndex = i;
    }
    expect(values[peakIndex]).toBeCloseTo(5, 0);
  });

  it('builds a polygon symmetric about the group center line (vertical)', () => {
    const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
    const plot = new ViolinPlot({ data, bandwidth: 0.6, resolution: 16 });
    const axes = plot.getAxes();
    const polygon = plot.getViolin(0) as Polygon;
    const vertices = polygon.getVertices();
    const density = plot.getDensity(0);
    const n = density.values.length;
    // Vertices: first n on the right side, next n on the left (reversed).
    const centerX = axes.coordsToPoint(0, density.values[0])[0];
    for (let i = 0; i < n; i++) {
      const right = vertices[i];
      const left = vertices[2 * n - 1 - i];
      // y of mirrored pair matches; x offsets are equal and opposite.
      expect(right[1]).toBeCloseTo(left[1], 8);
      expect(right[0] - centerX).toBeCloseTo(centerX - left[0], 8);
    }
  });

  it('normalizes the widest point to the width scale', () => {
    const data = [1, 2, 2, 3, 3, 3, 4, 4, 5];
    const plot = new ViolinPlot({ data, widthScale: 0.4 });
    const { halfWidths } = plot.getDensity(0);
    const maxHalf = Math.max(...halfWidths);
    expect(maxHalf).toBeCloseTo(0.4, 10);
    expect(Math.min(...halfWidths)).toBeGreaterThanOrEqual(0);
  });

  it('supports multiple groups', () => {
    const plot = new ViolinPlot({
      data: [
        [1, 2, 3, 4],
        [3, 4, 5, 6],
      ],
    });
    expect(plot.numGroups).toBe(2);
    expect(plot.getViolin(0)).not.toBeNull();
    expect(plot.getViolin(1)).not.toBeNull();
  });

  it('does not throw on all-equal data', () => {
    const plot = new ViolinPlot({ data: [7, 7, 7, 7] });
    const { densities } = plot.getDensity(0);
    expect(densities.every((d) => Number.isFinite(d))).toBe(true);
  });

  it('does not throw on a single point', () => {
    const plot = new ViolinPlot({ data: [3] });
    const { densities } = plot.getDensity(0);
    expect(densities.every((d) => Number.isFinite(d))).toBe(true);
  });

  it('returns a null violin for an empty group without throwing', () => {
    const plot = new ViolinPlot({ data: [] });
    expect(plot.numGroups).toBe(1);
    expect(plot.getViolin(0)).toBeNull();
    expect(plot.getDensity(0).values).toEqual([]);
  });
});
