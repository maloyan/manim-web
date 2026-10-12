import { describe, it, expect } from 'vitest';
import { ContourPlot } from './ContourPlot';

describe('ContourPlot', () => {
  it('constructs headless without throwing', () => {
    expect(() => {
      new ContourPlot({
        func: (x, y) => x * x + y * y - 1,
        levels: [0],
        xRange: [-2, 2],
        yRange: [-2, 2],
        resolution: 48,
      });
    }).not.toThrow();
  });

  it('draws the unit circle for the zero contour of x^2 + y^2 - 1', () => {
    const plot = new ContourPlot({
      func: (x, y) => x * x + y * y - 1,
      levels: [0],
      xRange: [-2, 2],
      yRange: [-2, 2],
      resolution: 48,
    });
    const points = plot.getPoints();
    expect(points.length).toBeGreaterThan(0);
    for (const [x, y] of points) {
      expect(Math.abs(Math.hypot(x, y) - 1)).toBeLessThan(0.12);
    }
  });

  it('draws nested circles for multiple levels', () => {
    const plot = new ContourPlot({
      func: (x, y) => x * x + y * y,
      levels: [1, 4],
      xRange: [-3, 3],
      yRange: [-3, 3],
      resolution: 64,
    });
    const radii = plot.getPoints().map(([x, y]) => Math.hypot(x, y));
    expect(radii.length).toBeGreaterThan(0);
    // Every point sits on one of the two circles (radius 1 or 2).
    for (const r of radii) {
      const onInner = Math.abs(r - 1) < 0.15;
      const onOuter = Math.abs(r - 2) < 0.15;
      expect(onInner || onOuter).toBe(true);
    }
    expect(radii.some((r) => Math.abs(r - 1) < 0.15)).toBe(true);
    expect(radii.some((r) => Math.abs(r - 2) < 0.15)).toBe(true);
  });

  it('is deterministic for identical input', () => {
    const make = (): ContourPlot =>
      new ContourPlot({
        func: (x, y) => x * x - y * y,
        levels: [-1, 0, 1],
        xRange: [-2, 2],
        yRange: [-2, 2],
        resolution: 32,
      });
    expect(make().getPoints()).toEqual(make().getPoints());
  });

  it('exposes and updates its levels', () => {
    const plot = new ContourPlot({ func: (x, y) => x + y, levels: [0] });
    expect(plot.getLevels()).toEqual([0]);
    plot.setLevels([-1, 1]);
    expect(plot.getLevels()).toEqual([-1, 1]);
  });

  it('draws disjoint contour pieces as separate subpaths with no bridging lines', () => {
    // g = x^2 - y^2 is a saddle: each nonzero level is TWO distant hyperbola
    // branches, and the zero level is two crossing lines. The old code strung
    // every marching-squares segment into one path and "broke" between them
    // with a degenerate cubic triple, which still drew a visible straight line
    // bridging the spatially distant pieces.
    const xRange: [number, number] = [-2, 2];
    const yRange: [number, number] = [-2, 2];
    const resolution = 32;
    const plot = new ContourPlot({
      func: (x, y) => x * x - y * y,
      levels: [-1, 0, 1],
      xRange,
      yRange,
      resolution,
    });

    const points = plot.getPoints();
    expect(points.length).toBeGreaterThan(0);

    // Disjoint contour pieces must be separate subpaths, not one strung path.
    const lengths = plot.getEffectiveSubpathLengths();
    expect(lengths).toBeDefined();
    expect(lengths!.length).toBeGreaterThan(1);
    // The subpath lengths must tile the full point list exactly.
    expect(lengths!.reduce((a, b) => a + b, 0)).toBe(points.length);

    // Within each subpath, consecutive control points come from a single
    // marching-squares segment, so no step may exceed about one grid cell.
    // A bridging line between distant pieces spans far more than that.
    const dx = (xRange[1] - xRange[0]) / resolution;
    const dy = (yRange[1] - yRange[0]) / resolution;
    const maxStep = 2 * Math.hypot(dx, dy);

    const subpathLengths = lengths ?? [points.length];
    let offset = 0;
    for (const len of subpathLengths) {
      for (let i = offset + 1; i < offset + len; i++) {
        const a = points[i - 1];
        const b = points[i];
        const step = Math.hypot(b[0] - a[0], b[1] - a[1]);
        expect(step).toBeLessThan(maxStep);
      }
      offset += len;
    }
  });

  it('separates the two nested circles of distinct levels into subpaths', () => {
    const plot = new ContourPlot({
      func: (x, y) => x * x + y * y,
      levels: [1, 4],
      xRange: [-3, 3],
      yRange: [-3, 3],
      resolution: 64,
    });
    const lengths = plot.getEffectiveSubpathLengths();
    expect(lengths).toBeDefined();
    // Two concentric circles are two disjoint loops => at least two subpaths.
    expect(lengths!.length).toBeGreaterThanOrEqual(2);
    expect(lengths!.reduce((a, b) => a + b, 0)).toBe(plot.getPoints().length);
  });

  it('copies into an independent instance', () => {
    const plot = new ContourPlot({
      func: (x, y) => x * x + y * y - 1,
      levels: [0],
      resolution: 24,
    });
    const copy = plot.copy();
    expect(copy).toBeInstanceOf(ContourPlot);
    expect(copy.getLevels()).toEqual([0]);
  });
});
