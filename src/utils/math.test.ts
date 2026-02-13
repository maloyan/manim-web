import { describe, it, expect } from 'vitest';
import { lerp, lerpPoint, smoothstep, coordsToPoint, pointToCoords, evalCubicBezier } from './math';

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('handles negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it('extrapolates beyond [0,1]', () => {
    expect(lerp(0, 10, 2)).toBe(20);
    expect(lerp(0, 10, -1)).toBe(-10);
  });
});

describe('lerpPoint', () => {
  it('returns a at t=0', () => {
    expect(lerpPoint([0, 0, 0], [10, 10, 10], 0)).toEqual([0, 0, 0]);
  });

  it('returns b at t=1', () => {
    expect(lerpPoint([0, 0, 0], [10, 10, 10], 1)).toEqual([10, 10, 10]);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerpPoint([0, 0, 0], [10, 20, 30], 0.5)).toEqual([5, 10, 15]);
  });
});

describe('smoothstep', () => {
  it('returns 0 at t=0', () => {
    expect(smoothstep(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(smoothstep(1)).toBe(1);
  });

  it('returns 0.5 at t=0.5', () => {
    expect(smoothstep(0.5)).toBe(0.5);
  });

  it('is monotonically increasing on [0,1]', () => {
    for (let i = 0; i < 20; i++) {
      const t1 = i / 20;
      const t2 = (i + 1) / 20;
      expect(smoothstep(t2)).toBeGreaterThanOrEqual(smoothstep(t1));
    }
  });

  it('matches formula 3t^2 - 2t^3', () => {
    const t = 0.3;
    expect(smoothstep(t)).toBeCloseTo(3 * t * t - 2 * t * t * t, 10);
  });
});

describe('coordsToPoint / pointToCoords roundtrip', () => {
  const xRange: [number, number] = [0, 10];
  const yRange: [number, number] = [0, 5];
  const xLength = 12;
  const yLength = 6;

  it('maps graph origin to visual center offset', () => {
    const pt = coordsToPoint(5, 2.5, xRange, yRange, xLength, yLength);
    expect(pt).toEqual([0, 0, 0]);
  });

  it('maps min corner correctly', () => {
    const pt = coordsToPoint(0, 0, xRange, yRange, xLength, yLength);
    expect(pt).toEqual([-6, -3, 0]);
  });

  it('maps max corner correctly', () => {
    const pt = coordsToPoint(10, 5, xRange, yRange, xLength, yLength);
    expect(pt).toEqual([6, 3, 0]);
  });

  it('roundtrips: pointToCoords(coordsToPoint(x,y)) ≈ [x,y]', () => {
    const testPoints = [
      [2, 3],
      [0, 0],
      [10, 5],
      [7.5, 1.2],
    ];
    for (const [x, y] of testPoints) {
      const visual = coordsToPoint(x, y, xRange, yRange, xLength, yLength);
      const [rx, ry] = pointToCoords(visual, xRange, yRange, xLength, yLength);
      expect(rx).toBeCloseTo(x, 8);
      expect(ry).toBeCloseTo(y, 8);
    }
  });

  it('handles degenerate range (xMin === xMax)', () => {
    const pt = coordsToPoint(5, 2.5, [5, 5], yRange, xLength, yLength);
    expect(pt[0]).toBe(0); // (0.5 - 0.5) * xLength = 0
  });
});

describe('evalCubicBezier', () => {
  // Straight line from [0,0] to [1,0] (control points on line)
  const p0 = [0, 0, 0];
  const p1 = [1 / 3, 0, 0];
  const p2 = [2 / 3, 0, 0];
  const p3 = [1, 0, 0];

  it('returns p0 at t=0', () => {
    const result = evalCubicBezier(p0, p1, p2, p3, 0);
    expect(result[0]).toBeCloseTo(0, 10);
    expect(result[1]).toBeCloseTo(0, 10);
    expect(result[2]).toBeCloseTo(0, 10);
  });

  it('returns p3 at t=1', () => {
    const result = evalCubicBezier(p0, p1, p2, p3, 1);
    expect(result[0]).toBeCloseTo(1, 10);
    expect(result[1]).toBeCloseTo(0, 10);
    expect(result[2]).toBeCloseTo(0, 10);
  });

  it('returns midpoint at t=0.5 for a straight line', () => {
    const result = evalCubicBezier(p0, p1, p2, p3, 0.5);
    expect(result[0]).toBeCloseTo(0.5, 10);
    expect(result[1]).toBeCloseTo(0, 10);
  });

  it('handles 2D points (no z component)', () => {
    const result = evalCubicBezier([0, 0], [0, 1], [1, 1], [1, 0], 0.5);
    expect(result).toHaveLength(3);
    expect(result[2]).toBe(0); // z defaults to 0
  });

  it('evaluates a curved bezier', () => {
    // Quarter circle approximation
    const k = 0.5522847498;
    const cp0 = [1, 0, 0];
    const cp1 = [1, k, 0];
    const cp2 = [k, 1, 0];
    const cp3 = [0, 1, 0];
    const mid = evalCubicBezier(cp0, cp1, cp2, cp3, 0.5);
    // At t=0.5, should be roughly on the unit circle arc
    const dist = Math.sqrt(mid[0] * mid[0] + mid[1] * mid[1]);
    expect(dist).toBeCloseTo(1, 2);
  });
});
