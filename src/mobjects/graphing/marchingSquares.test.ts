import { describe, it, expect } from 'vitest';
import { marchingSquares, type ContourSegment } from './marchingSquares';

/** Sample a field on a regular grid over [-2, 2] x [-2, 2]. */
function sampleGrid(
  func: (x: number, y: number) => number,
  n: number,
): { values: number[][]; xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= n; i++) {
    xs.push(-2 + (i / n) * 4);
    ys.push(-2 + (i / n) * 4);
  }
  const values: number[][] = [];
  for (let iy = 0; iy <= n; iy++) {
    const row: number[] = [];
    for (let ix = 0; ix <= n; ix++) row.push(func(xs[ix], ys[iy]));
    values.push(row);
  }
  return { values, xs, ys };
}

const radius = (s: ContourSegment): number[] => [s[0], s[1]].map(([x, y]) => Math.hypot(x, y));

describe('marchingSquares', () => {
  it('extracts the unit circle as the zero contour of x^2 + y^2 - 1', () => {
    const { values, xs, ys } = sampleGrid((x, y) => x * x + y * y - 1, 48);
    const segments = marchingSquares(values, xs, ys, 0);
    expect(segments.length).toBeGreaterThan(0);
    for (const seg of segments) {
      for (const r of radius(seg)) {
        expect(Math.abs(r - 1)).toBeLessThan(0.1);
      }
    }
  });

  it('contours a radius-2 circle at a non-zero iso level', () => {
    // g = x^2 + y^2 at level 2 is the circle of radius sqrt(2).
    const { values, xs, ys } = sampleGrid((x, y) => x * x + y * y, 64);
    const segments = marchingSquares(values, xs, ys, 2);
    expect(segments.length).toBeGreaterThan(0);
    const target = Math.sqrt(2);
    for (const seg of segments) {
      for (const r of radius(seg)) {
        expect(Math.abs(r - target)).toBeLessThan(0.1);
      }
    }
  });

  it('returns no segments for a field that never reaches the iso level', () => {
    const { values, xs, ys } = sampleGrid((x, y) => x * x + y * y, 16);
    expect(marchingSquares(values, xs, ys, -1)).toEqual([]);
  });

  it('is deterministic for identical input', () => {
    const { values, xs, ys } = sampleGrid((x, y) => x * x - y * y, 32);
    const a = marchingSquares(values, xs, ys, 0);
    const b = marchingSquares(values, xs, ys, 0);
    expect(a).toEqual(b);
  });
});
