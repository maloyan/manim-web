import { describe, it, expect } from 'vitest';
import type { Complex } from './ComplexPlane';
import {
  fourierCoefficients,
  reconstructSample,
  partialSum,
  orderCoefficients,
  fourierSeriesApproximation,
} from './fourier';

const EPSILON = 1e-9;

function closeTo(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) < eps;
}

/** Deterministic pseudo-random sequence, so tests do not depend on Math.random. */
function pseudoSamples(n: number): Complex[] {
  const samples: Complex[] = [];
  let seed = 12345;
  for (let i = 0; i < n; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const re = (seed / 0x7fffffff) * 2 - 1;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const im = (seed / 0x7fffffff) * 2 - 1;
    samples.push({ re, im });
  }
  return samples;
}

describe('fourierCoefficients', () => {
  it('returns one coefficient per sample', () => {
    const coeffs = fourierCoefficients(pseudoSamples(16));
    expect(coeffs).toHaveLength(16);
  });

  it('returns [] for empty input (no throw)', () => {
    expect(fourierCoefficients([])).toEqual([]);
  });

  it('reconstructs every sample within tolerance (round-trip)', () => {
    const n = 32;
    const samples = pseudoSamples(n);
    const coeffs = fourierCoefficients(samples);

    for (let i = 0; i < n; i++) {
      const reconstructed = reconstructSample(coeffs, i / n);
      expect(closeTo(reconstructed.re, samples[i].re, 1e-9)).toBe(true);
      expect(closeTo(reconstructed.im, samples[i].im, 1e-9)).toBe(true);
    }
  });

  it('maps a pure complex exponential to a single dominant coefficient', () => {
    const n = 64;
    const k0 = 5;
    const samples: Complex[] = [];
    for (let i = 0; i < n; i++) {
      const theta = (2 * Math.PI * k0 * i) / n;
      samples.push({ re: Math.cos(theta), im: Math.sin(theta) });
    }

    const coeffs = fourierCoefficients(samples);
    const dominant = coeffs.find((c) => c.freq === k0);
    expect(dominant).toBeDefined();
    expect(closeTo(dominant!.amplitude, 1, 1e-9)).toBe(true);

    // Every other coefficient is negligible.
    for (const c of coeffs) {
      if (c.freq === k0) continue;
      expect(c.amplitude).toBeLessThan(1e-9);
    }
  });

  it('maps a real cosine to a symmetric pair at ±frequency', () => {
    const n = 64;
    const k0 = 3;
    const samples: Complex[] = [];
    for (let i = 0; i < n; i++) {
      samples.push({ re: Math.cos((2 * Math.PI * k0 * i) / n), im: 0 });
    }

    const coeffs = fourierCoefficients(samples);
    const pos = coeffs.find((c) => c.freq === k0);
    const neg = coeffs.find((c) => c.freq === -k0);
    expect(closeTo(pos!.amplitude, 0.5, 1e-9)).toBe(true);
    expect(closeTo(neg!.amplitude, 0.5, 1e-9)).toBe(true);
  });

  it('assigns centered signed frequencies', () => {
    const coeffs = fourierCoefficients(pseudoSamples(8));
    expect(coeffs.map((c) => c.freq)).toEqual([0, 1, 2, 3, 4, -3, -2, -1]);
  });
});

describe('partialSum', () => {
  it('returns zero for numTerms <= 0', () => {
    const coeffs = fourierCoefficients(pseudoSamples(8));
    expect(partialSum(coeffs, 0.3, 0)).toEqual({ re: 0, im: 0 });
    expect(partialSum(coeffs, 0.3, -5)).toEqual({ re: 0, im: 0 });
  });

  it('clamps numTerms above the length to the full reconstruction', () => {
    const coeffs = fourierCoefficients(pseudoSamples(8));
    const clamped = partialSum(coeffs, 0.25, 999);
    const full = reconstructSample(coeffs, 0.25);
    expect(closeTo(clamped.re, full.re)).toBe(true);
    expect(closeTo(clamped.im, full.im)).toBe(true);
  });
});

describe('orderCoefficients', () => {
  it('orders by frequency as 0, +1, -1, +2, -2, ... (default)', () => {
    const coeffs = fourierCoefficients(pseudoSamples(8));
    const ordered = orderCoefficients(coeffs, 'frequency');
    expect(ordered.map((c) => c.freq)).toEqual([0, 1, -1, 2, -2, 3, -3, 4]);
  });

  it('orders by descending amplitude', () => {
    const coeffs = fourierCoefficients(pseudoSamples(16));
    const ordered = orderCoefficients(coeffs, 'amplitude');
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i - 1].amplitude).toBeGreaterThanOrEqual(ordered[i].amplitude);
    }
  });

  it('does not mutate the input array', () => {
    const coeffs = fourierCoefficients(pseudoSamples(8));
    const before = coeffs.map((c) => c.freq);
    orderCoefficients(coeffs, 'amplitude');
    expect(coeffs.map((c) => c.freq)).toEqual(before);
  });
});

describe('fourierSeriesApproximation', () => {
  it('reproduces the sampled function when all terms are kept', () => {
    const target = (x: number) => Math.sin(x) + 0.5 * Math.cos(2 * x);
    const numSamples = 64;
    const approx = fourierSeriesApproximation(target, {
      period: 2 * Math.PI,
      numSamples,
    });

    for (let i = 0; i < numSamples; i++) {
      const x = (2 * Math.PI * i) / numSamples;
      expect(closeTo(approx(x), target(x), 1e-6)).toBe(true);
    }
  });

  it('converges toward a square wave as terms increase', () => {
    const square = (x: number) => (Math.sin(x) >= 0 ? 1 : -1);
    const evalX = Math.PI / 2; // mid-plateau, away from the discontinuity
    const few = fourierSeriesApproximation(square, { numTerms: 3, numSamples: 128 });
    const many = fourierSeriesApproximation(square, { numTerms: 40, numSamples: 128 });

    const errFew = Math.abs(few(evalX) - 1);
    const errMany = Math.abs(many(evalX) - 1);
    expect(errMany).toBeLessThan(errFew);
  });
});
