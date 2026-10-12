import { describe, it, expect } from 'vitest';
import { sketch } from './sketch';
import { Line } from '../geometry/Line';
import { Square } from '../geometry/Rectangle';
import { Circle } from '../geometry/Circle';
import { anchorsFromPoints } from '../../core/VMobjectCurveMath';

/** Largest perpendicular distance of any point from the infinite line a->b. */
function maxDeviationFromLine(points: number[][], a: number[], b: number[]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  let max = 0;
  for (const p of points) {
    // Perpendicular distance via the 2D cross product.
    const cross = Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / length;
    if (cross > max) max = cross;
  }
  return max;
}

function distance(a: number[], b: number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

describe('sketch', () => {
  const start: [number, number, number] = [-2, 0, 0];
  const end: [number, number, number] = [2, 0, 0];
  const lineLength = distance(start, end);

  it('produces a path with more points than the source line', () => {
    const line = new Line({ start, end });
    const rough = sketch(line, { seed: 7 });
    expect(rough.numPoints).toBeGreaterThan(line.numPoints);
  });

  it('deviates from the exact line within a bounded roughness', () => {
    const line = new Line({ start, end });
    const rough = sketch(line, { seed: 3, roughness: 1 });
    const points = rough.getLocalPoints();
    const deviation = maxDeviationFromLine(points, start, end);
    // A real wobble...
    expect(deviation).toBeGreaterThan(1e-4);
    // ...but bounded well below the configured roughness budget.
    expect(deviation).toBeLessThan(lineLength * 0.2);
  });

  it('keeps the endpoints near the source endpoints', () => {
    const line = new Line({ start, end });
    const rough = sketch(line, { seed: 9, roughness: 1 });
    const points = rough.getLocalPoints();
    expect(distance(points[0], start)).toBeLessThan(lineLength * 0.1);
    expect(distance(points[points.length - 1], end)).toBeLessThan(lineLength * 0.1);
  });

  it('is deterministic: same seed gives identical output', () => {
    const a = sketch(new Line({ start, end }), { seed: 42, roughness: 1 });
    const b = sketch(new Line({ start, end }), { seed: 42, roughness: 1 });
    expect(a.getLocalPoints()).toEqual(b.getLocalPoints());
  });

  it('differs for a different seed', () => {
    const a = sketch(new Line({ start, end }), { seed: 1, roughness: 1 });
    const b = sketch(new Line({ start, end }), { seed: 2, roughness: 1 });
    expect(a.getLocalPoints()).not.toEqual(b.getLocalPoints());
  });

  it('reproduces the source shape at roughness 0', () => {
    const line = new Line({ start, end });
    const rough = sketch(line, { seed: 5, roughness: 0 });
    const points = rough.getLocalPoints();
    // Every point stays on the original line (only denser), so no deviation.
    expect(maxDeviationFromLine(points, start, end)).toBeLessThan(1e-9);
    expect(distance(points[0], start)).toBeLessThan(1e-9);
    expect(distance(points[points.length - 1], end)).toBeLessThan(1e-9);
  });

  it('keeps a closed shape closed', () => {
    const square = new Square({ sideLength: 2 });
    const rough = sketch(square, { seed: 11, roughness: 1 });
    const points = rough.getLocalPoints();
    expect(distance(points[0], points[points.length - 1])).toBeLessThan(1e-9);
  });

  it('does not mutate the source mobject', () => {
    const line = new Line({ start, end });
    const before = line.getLocalPoints();
    sketch(line, { seed: 13, roughness: 1 });
    expect(line.getLocalPoints()).toEqual(before);
  });

  it('does not mutate a closed source mobject', () => {
    const square = new Square({ sideLength: 2 });
    const before = square.getLocalPoints();
    sketch(square, { seed: 17, roughness: 1 });
    expect(square.getLocalPoints()).toEqual(before);
  });

  it('samples a circle and keeps it closed', () => {
    const circle = new Circle({ radius: 1.5 });
    const rough = sketch(circle, { seed: 4, roughness: 0.5 });
    const points = rough.getLocalPoints();
    expect(points.length).toBeGreaterThan(0);
    expect(distance(points[0], points[points.length - 1])).toBeLessThan(1e-9);
  });

  it('builds two subpaths for a double stroke', () => {
    const line = new Line({ start, end });
    const rough = sketch(line, { seed: 8, strokes: 2 });
    const lengths = rough.getSubpathLengths();
    expect(lengths).toBeDefined();
    expect(lengths?.length).toBe(2);
    // Subpath lengths sum to the total point count.
    const total = (lengths ?? []).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(rough.numPoints);
  });

  it('jitters the stroke width when asked', () => {
    const line = new Line({ start, end, strokeWidth: 10 });
    const rough = sketch(line, { seed: 6, strokeWidthJitter: 0.5 });
    expect(rough.strokeWidth).not.toBe(10);
    expect(rough.strokeWidth).toBeGreaterThan(5);
    expect(rough.strokeWidth).toBeLessThan(15);
  });

  it('returns the same concrete type as the source', () => {
    const line = new Line({ start, end });
    const rough = sketch(line, { seed: 2 });
    expect(rough).toBeInstanceOf(Line);
  });

  it('bows more with a larger bowing factor', () => {
    const straight = sketch(new Line({ start, end }), { seed: 1, roughness: 1, bowing: 0 });
    const bowed = sketch(new Line({ start, end }), { seed: 1, roughness: 1, bowing: 3 });
    const straightDev = maxDeviationFromLine(straight.getLocalPoints(), start, end);
    const bowedDev = maxDeviationFromLine(bowed.getLocalPoints(), start, end);
    expect(bowedDev).toBeGreaterThan(straightDev);
  });

  it('preserves the anchor count structure as corners', () => {
    const line = new Line({ start, end });
    const rough = sketch(line, { seed: 1, segments: 4 });
    // 1 edge * 4 segments = 4 corners + start => 5 anchors => 13 bezier points.
    const anchors = anchorsFromPoints(rough.getLocalPoints());
    expect(anchors.length).toBe(5);
  });
});
