import { describe, it, expect } from 'vitest';
import { FourierSeries } from './FourierSeries';

const EPSILON = 1e-6;

function closeTo(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

describe('FourierSeries', () => {
  it('reproduces the target at sample points when all terms are kept', () => {
    const target = (x: number) => Math.sin(x) + 0.5 * Math.cos(2 * x);
    const numSamples = 64;
    const series = new FourierSeries({
      func: target,
      period: 2 * Math.PI,
      coefficientSamples: numSamples,
    });

    const approx = series.getFunction();
    for (let i = 0; i < numSamples; i++) {
      const x = (2 * Math.PI * i) / numSamples;
      expect(closeTo(approx(x), target(x))).toBe(true);
    }
  });

  it('generates curve points over the requested x range', () => {
    const series = new FourierSeries({
      func: (x) => (Math.sin(x) >= 0 ? 1 : -1),
      numTerms: 7,
      period: 2 * Math.PI,
      xRange: [-Math.PI, Math.PI],
      numSamples: 100,
    });
    expect(series.getLocalPoints().length).toBeGreaterThan(0);
  });

  it('converges toward the target as terms increase', () => {
    const square = (x: number) => (Math.sin(x) >= 0 ? 1 : -1);
    const evalX = Math.PI / 2;
    const few = new FourierSeries({ func: square, numTerms: 3, coefficientSamples: 128 });
    const many = new FourierSeries({ func: square, numTerms: 40, coefficientSamples: 128 });

    const errFew = Math.abs(few.getFunction()(evalX) - 1);
    const errMany = Math.abs(many.getFunction()(evalX) - 1);
    expect(errMany).toBeLessThan(errFew);
  });

  it('exposes target function, term count, and period', () => {
    const target = (x: number) => Math.cos(x);
    const series = new FourierSeries({ func: target, numTerms: 5, period: 4 });
    expect(series.getTargetFunction()).toBe(target);
    expect(series.getNumTerms()).toBe(5);
    expect(series.getPeriod()).toBe(4);
  });
});
