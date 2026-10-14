import { describe, it, expect } from 'vitest';
import { Spring } from './Spring';

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('Spring', () => {
  it('starts and ends exactly at the given endpoints', () => {
    const s = new Spring({ start: [-1, 0.5, 0], end: [3, 2, 0] });
    const pts = s.getPoints();
    expect(pts[0]).toEqual([-1, 0.5, 0]);
    const last = pts[pts.length - 1];
    expect(last[0]).toBeCloseTo(3, 12);
    expect(last[1]).toBeCloseTo(2, 12);
    expect(s.getStart()).toEqual([-1, 0.5, 0]);
    expect(s.getEnd()).toEqual([3, 2, 0]);
  });

  it('spans the distance between its endpoints', () => {
    const s = new Spring({ start: [0, 0, 0], end: [3, 4, 0] });
    expect(s.getLength()).toBeCloseTo(5, 12);
  });

  it('has the requested number of coils (two peaks per coil)', () => {
    const s = new Spring({ start: [0, 0, 0], end: [4, 0, 0], coils: 6 });
    expect(s.getCoils()).toBe(6);
    const corners = s.getCorners();
    // start, lead end, 2 peaks per coil, coil end, end
    expect(corners.length).toBe(2 * 6 + 4);
    const peaks = corners.slice(2, corners.length - 2);
    expect(peaks.length).toBe(12);
    // Peaks alternate sides of the axis.
    peaks.forEach((p, i) => {
      expect(Math.abs(p[1])).toBeCloseTo(0.15, 12);
      expect(Math.sign(p[1])).toBe(i % 2 === 0 ? 1 : -1);
    });
  });

  it('keeps straight leads of the given length at each end', () => {
    const s = new Spring({ start: [0, 0, 0], end: [5, 0, 0], leadLength: 0.7, width: 0.4 });
    const c = s.getCorners();
    expect(c[1][0]).toBeCloseTo(0.7, 12);
    expect(c[1][1]).toBeCloseTo(0, 12);
    expect(c[c.length - 2][0]).toBeCloseTo(5 - 0.7, 12);
    expect(c[c.length - 2][1]).toBeCloseTo(0, 12);
  });

  it('uses the width as full peak to peak amplitude, perpendicular to the axis', () => {
    const s = new Spring({ start: [0, 0, 0], end: [0, 4, 0], width: 0.5, coils: 3 });
    const peaks = s.getCorners().slice(2, -2);
    const xs = peaks.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(0.5, 12);
  });

  it('follows new endpoints with setEndpoints and keeps coil count', () => {
    const s = new Spring({ start: [0, 0, 0], end: [4, 0, 0], coils: 5 });
    s.setEndpoints([1, 1, 0], [1, -3, 0]);
    expect(s.getStart()).toEqual([1, 1, 0]);
    expect(s.getEnd()).toEqual([1, -3, 0]);
    expect(s.getLength()).toBeCloseTo(4, 12);
    expect(s.getCorners().length).toBe(2 * 5 + 4);
    expect(s.getPoints()[0]).toEqual([1, 1, 0]);
  });

  it('all coil vertices stay within the endpoint span along the axis', () => {
    const start = [0, 0, 0];
    const end = [2, 2, 0];
    const s = new Spring({ start: [0, 0, 0], end: [2, 2, 0], coils: 4, width: 0.3 });
    const total = dist(start, end);
    for (const p of s.getCorners()) {
      const along = (p[0] * 2 + p[1] * 2) / total;
      expect(along).toBeGreaterThanOrEqual(-1e-12);
      expect(along).toBeLessThanOrEqual(total + 1e-12);
    }
  });

  it('degrades to a straight line when the endpoints are closer than twice the lead', () => {
    const s = new Spring({ start: [0, 0, 0], end: [0.4, 0, 0], leadLength: 0.5, coils: 4 });
    // Lead is clamped to half the length, so no room is left for the coil.
    for (const p of s.getCorners()) expect(p[1]).toBeCloseTo(0, 12);
    expect(s.getLength()).toBeCloseTo(0.4, 12);
  });

  it('handles coincident endpoints without NaN', () => {
    const s = new Spring({ start: [1, 1, 0], end: [1, 1, 0] });
    for (const p of s.getPoints()) {
      expect(Number.isFinite(p[0]) && Number.isFinite(p[1])).toBe(true);
    }
  });

  it('rejects a non positive coil count and negative sizes', () => {
    expect(() => new Spring({ coils: 0 })).toThrow();
    expect(() => new Spring({ width: -1 })).toThrow();
    expect(() => new Spring({ leadLength: -0.1 })).toThrow();
  });

  it('copy keeps the geometry', () => {
    const s = new Spring({
      start: [0, 0, 0],
      end: [3, 1, 0],
      coils: 7,
      width: 0.2,
      leadLength: 0.3,
    });
    const c = s.copy();
    expect(c.getCoils()).toBe(7);
    expect(c.getStart()).toEqual([0, 0, 0]);
    expect(c.getEnd()[0]).toBeCloseTo(3, 12);
    expect(c.getCorners().length).toBe(s.getCorners().length);
  });
});
