import { describe, it, expect } from 'vitest';
import { FourierEpicycles } from './FourierEpicycles';
import { partialSum } from './fourier';
import { ValueTracker } from '../value-tracker/ValueTracker';
import { Circle } from '../geometry';
import type { Complex } from './ComplexPlane';

const EPSILON = 1e-9;

function closeTo(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

/** A closed, lopsided loop so the DFT has many non-trivial coefficients. */
function loopPath(n = 64): number[][] {
  const pts: number[][] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push([Math.cos(a) + 0.3 * Math.cos(3 * a), Math.sin(a) + 0.2 * Math.sin(2 * a)]);
  }
  return pts;
}

describe('FourierEpicycles construction', () => {
  it('creates exactly numTerms vectors and circles', () => {
    const epicycles = new FourierEpicycles({ path: loopPath(64), numTerms: 10, animate: false });
    expect(epicycles.getNumTerms()).toBe(10);
    expect(epicycles.getVectors().children).toHaveLength(10);
    expect(epicycles.getCircles().children).toHaveLength(10);
    expect(epicycles.getCoefficients()).toHaveLength(10);
  });

  it('omits circles when showCircles is false', () => {
    const epicycles = new FourierEpicycles({
      path: loopPath(32),
      numTerms: 5,
      showCircles: false,
      animate: false,
    });
    expect(epicycles.getVectors().children).toHaveLength(5);
    expect(epicycles.getCircles().children).toHaveLength(0);
  });

  it('clamps numTerms to the number of available coefficients', () => {
    const epicycles = new FourierEpicycles({ path: loopPath(8), numTerms: 999, animate: false });
    expect(epicycles.getNumTerms()).toBe(8);
  });

  it('defaults numTerms to every coefficient', () => {
    const epicycles = new FourierEpicycles({ path: loopPath(16), animate: false });
    expect(epicycles.getNumTerms()).toBe(16);
  });
});

describe('FourierEpicycles.setTime', () => {
  it('summed vector tip equals the partial-sum reconstruction', () => {
    const center: [number, number, number] = [0, 0, 0];
    const epicycles = new FourierEpicycles({
      path: loopPath(64),
      numTerms: 12,
      center,
      animate: false,
    });
    const coeffs = epicycles.getCoefficients();

    for (const t of [0, 0.17, 0.5, 0.83]) {
      const tip = epicycles.setTime(t);
      const expected = partialSum(coeffs, t, coeffs.length);
      expect(closeTo(tip[0], center[0] + expected.re)).toBe(true);
      expect(closeTo(tip[1], center[1] + expected.im)).toBe(true);
    }
  });

  it('applies the center offset to the tip', () => {
    const center: [number, number, number] = [2, -1, 0];
    const path = loopPath(32);
    const epicycles = new FourierEpicycles({ path, center, animate: false });

    // With all terms at t = 0 the tip equals center + the first sample.
    const tip = epicycles.setTime(0);
    expect(closeTo(tip[0], center[0] + path[0][0], 1e-9)).toBe(true);
    expect(closeTo(tip[1], center[1] + path[0][1], 1e-9)).toBe(true);
  });

  it('getTipPoint mirrors the last setTime result', () => {
    const epicycles = new FourierEpicycles({ path: loopPath(32), numTerms: 8, animate: false });
    const tip = epicycles.setTime(0.4);
    expect(epicycles.getTipPoint()).toEqual(tip);
  });
});

describe('FourierEpicycles trace', () => {
  it('accumulates trace points as time advances', () => {
    const epicycles = new FourierEpicycles({ path: loopPath(32), numTerms: 8 });
    expect(epicycles.getTracePoints()).toHaveLength(1); // seeded at t = 0

    for (let i = 0; i < 5; i++) epicycles.update(0.1);

    expect(epicycles.getTracePoints()).toHaveLength(6);
    expect(epicycles.getTracedPath().getLocalPoints().length).toBeGreaterThan(0);
  });

  it('caps the trace at maxTracePoints, dropping the oldest', () => {
    const epicycles = new FourierEpicycles({
      path: loopPath(16),
      numTerms: 4,
      maxTracePoints: 3,
    });
    for (let i = 0; i < 10; i++) epicycles.update(0.05);
    expect(epicycles.getTracePoints()).toHaveLength(3);
  });

  it('clearTrace empties the accumulated curve', () => {
    const epicycles = new FourierEpicycles({ path: loopPath(16), numTerms: 4 });
    for (let i = 0; i < 4; i++) epicycles.update(0.1);
    epicycles.clearTrace();
    expect(epicycles.getTracePoints()).toHaveLength(0);
    expect(epicycles.getTracedPath().getLocalPoints()).toHaveLength(0);
  });
});

describe('FourierEpicycles tracker', () => {
  it('reads time from a ValueTracker when provided', () => {
    const tracker = new ValueTracker(0);
    const epicycles = new FourierEpicycles({
      path: loopPath(32),
      numTerms: 10,
      tracker,
    });
    const coeffs = epicycles.getCoefficients();

    tracker.setValue(0.42);
    epicycles.update(0.016);

    const expected = partialSum(coeffs, 0.42, coeffs.length);
    const tip = epicycles.getTipPoint();
    expect(closeTo(tip[0], expected.re, 1e-9)).toBe(true);
    expect(closeTo(tip[1], expected.im, 1e-9)).toBe(true);
  });
});

describe('FourierEpicycles alternate path inputs', () => {
  it('accepts a complex parametric function', () => {
    const epicycles = new FourierEpicycles({
      path: {
        func: (t: number): Complex => ({
          re: Math.cos(2 * Math.PI * t),
          im: Math.sin(2 * Math.PI * t),
        }),
        tRange: [0, 1],
      },
      numSamples: 64,
      numTerms: 4,
      animate: false,
    });
    expect(epicycles.getNumTerms()).toBe(4);
  });

  it('accepts a VMobject path', () => {
    const circle = new Circle({ radius: 1 });
    const epicycles = new FourierEpicycles({
      path: circle,
      numSamples: 48,
      numTerms: 6,
      animate: false,
    });
    expect(epicycles.getNumTerms()).toBe(6);
    expect(epicycles.getVectors().children).toHaveLength(6);
  });
});

describe('FourierEpicycles degenerate input', () => {
  it('handles an empty path without throwing', () => {
    expect(() => new FourierEpicycles({ path: [] })).not.toThrow();
    const epicycles = new FourierEpicycles({ path: [] });
    expect(epicycles.getNumTerms()).toBe(0);
    expect(epicycles.setTime(0.5)).toEqual([0, 0, 0]);
  });

  it('handles a single-point path without throwing', () => {
    const epicycles = new FourierEpicycles({ path: [[1, 2]], animate: false });
    expect(epicycles.getNumTerms()).toBe(1);
    const tip = epicycles.setTime(0.3);
    expect(closeTo(tip[0], 1, 1e-9)).toBe(true);
    expect(closeTo(tip[1], 2, 1e-9)).toBe(true);
  });

  it('handles an empty VMobject path without throwing', () => {
    const empty = new Circle({ radius: 1 });
    empty.setPoints3D([]);
    expect(() => new FourierEpicycles({ path: empty, animate: false })).not.toThrow();
  });

  it('can be copied', () => {
    const epicycles = new FourierEpicycles({ path: loopPath(16), numTerms: 5, animate: false });
    const copy = epicycles.copy();
    expect(copy.getNumTerms()).toBe(5);
    expect(copy.getCoefficients()).toHaveLength(5);
  });
});
