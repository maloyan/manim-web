import { describe, it, expect } from 'vitest';
import { binarySearch, choose, clip, sigmoid } from './simpleFunctions';

describe('clip', () => {
  it('returns the value when inside the interval', () => {
    expect(clip(15, 11, 20)).toBe(15);
  });

  it('clamps to the nearer bound', () => {
    expect(clip(5, 11, 20)).toBe(11);
    expect(clip(25, 11, 20)).toBe(20);
  });
});

describe('sigmoid', () => {
  it('is 0.5 at zero', () => {
    expect(sigmoid(0)).toBe(0.5);
  });

  it('is monotonic and bounded in (0, 1)', () => {
    expect(sigmoid(-10)).toBeGreaterThan(0);
    expect(sigmoid(10)).toBeLessThan(1);
    expect(sigmoid(1)).toBeGreaterThan(sigmoid(0));
  });
});

describe('choose', () => {
  it('computes known binomial coefficients', () => {
    expect(choose(5, 2)).toBe(10);
    expect(choose(10, 0)).toBe(1);
    expect(choose(10, 10)).toBe(1);
    expect(choose(52, 5)).toBe(2598960);
  });

  it('returns 0 for out-of-range k', () => {
    expect(choose(3, -1)).toBe(0);
    expect(choose(3, 4)).toBe(0);
  });
});

describe('binarySearch', () => {
  it('finds a value in range', () => {
    const solution = binarySearch((x) => x * x + 3 * x + 1, 11, 0, 5);
    expect(solution).toBeDefined();
    expect(Math.abs((solution as number) - 2) < 1e-4).toBe(true);
  });

  it('returns undefined when the target is out of range', () => {
    expect(binarySearch((x) => x * x + 3 * x + 1, 71, 0, 5)).toBeUndefined();
  });
});
