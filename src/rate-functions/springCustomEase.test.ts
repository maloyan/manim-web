import { describe, it, expect } from 'vitest';
import { spring, type SpringOptions } from './spring';
import {
  cubicBezier,
  ease,
  easeInBezier,
  easeOutBezier,
  easeInOutBezier,
  steps,
} from './customEase';

const sample = (fn: (t: number) => number, n: number): number[] => {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    out.push(fn(i / n));
  }
  return out;
};

describe('spring', () => {
  it('starts at 0 and settles at 1 with default options', () => {
    const s = spring();
    expect(s(0)).toBe(0);
    expect(s(1)).toBe(1);
  });

  it('clamps outside [0, 1] to the endpoints', () => {
    const s = spring();
    expect(s(-0.5)).toBe(0);
    expect(s(2)).toBe(1);
  });

  it('is deterministic for the same options', () => {
    const a = spring({ stiffness: 120, damping: 8 });
    const b = spring({ stiffness: 120, damping: 8 });
    for (let i = 0; i <= 10; i++) {
      expect(a(i / 10)).toBe(b(i / 10));
    }
  });

  it('is near 1 just before the end (continuous settle)', () => {
    const s = spring();
    expect(s(0.999)).toBeCloseTo(1, 2);
  });

  it('overshoots 1 when underdamped (bouncy)', () => {
    const bouncy = spring({ bounce: 0.7 });
    const values = sample(bouncy, 200);
    const peak = Math.max(...values);
    expect(peak).toBeGreaterThan(1);
  });

  it('does not overshoot when critically damped (bounce 0)', () => {
    const firm = spring({ bounce: 0 });
    const values = sample(firm, 200);
    const peak = Math.max(...values);
    expect(peak).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('does not overshoot when overdamped', () => {
    const slow = spring({ stiffness: 100, damping: 40, mass: 1 });
    const values = sample(slow, 200);
    const peak = Math.max(...values);
    expect(peak).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('rises monotonically early on for all regimes', () => {
    const configs: SpringOptions[] = [
      { bounce: 0.6 },
      { bounce: 0 },
      { stiffness: 100, damping: 40 },
    ];
    for (const cfg of configs) {
      const s = spring(cfg);
      expect(s(0.05)).toBeGreaterThan(s(0));
      expect(s(0.1)).toBeGreaterThan(s(0.05));
    }
  });

  it('changes the curve when parameters change', () => {
    const soft = spring({ stiffness: 100, damping: 4 });
    const firm = spring({ stiffness: 100, damping: 20 });
    let different = false;
    for (let i = 1; i < 10; i++) {
      if (Math.abs(soft(i / 10) - firm(i / 10)) > 1e-3) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('bounce near 1 overshoots more than a small bounce', () => {
    const little = Math.max(...sample(spring({ bounce: 0.2 }), 200));
    const lots = Math.max(...sample(spring({ bounce: 0.8 }), 200));
    expect(lots).toBeGreaterThan(little);
  });

  it('stays finite for zero damping (a frictionless spring)', () => {
    const f = spring({ damping: 0 });
    expect(f(0)).toBe(0);
    expect(f(1)).toBeCloseTo(1, 5);
    for (const v of sample(f, 50)) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe('cubicBezier', () => {
  it('has exact endpoints', () => {
    const fn = cubicBezier(0.42, 0, 0.58, 1);
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
  });

  it('cubicBezier(0,0,1,1) is linear', () => {
    const fn = cubicBezier(0, 0, 1, 1);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(fn(t)).toBeCloseTo(t, 6);
    }
  });

  it('diagonal control points give the identity', () => {
    const fn = cubicBezier(0.3, 0.3, 0.7, 0.7);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(fn(t)).toBeCloseTo(t, 6);
    }
  });

  it('matches the known CSS ease value at t = 0.5', () => {
    // cubic-bezier(0.25, 0.1, 0.25, 1) at x = 0.5 is about 0.8029.
    expect(ease(0.5)).toBeCloseTo(0.803, 2);
  });

  it('is monotonic for standard CSS eases', () => {
    for (const fn of [ease, easeInBezier, easeOutBezier, easeInOutBezier]) {
      let prev = fn(0);
      for (let i = 1; i <= 50; i++) {
        const v = fn(i / 50);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
  });

  it('ease-in stays below linear in the first half', () => {
    expect(easeInBezier(0.25)).toBeLessThan(0.25);
  });

  it('ease-out stays above linear in the first half', () => {
    expect(easeOutBezier(0.25)).toBeGreaterThan(0.25);
  });

  it('clamps inputs outside [0, 1]', () => {
    const fn = cubicBezier(0.42, 0, 0.58, 1);
    expect(fn(-1)).toBe(0);
    expect(fn(2)).toBe(1);
  });

  it('allows vertical overshoot when y is outside [0, 1]', () => {
    // A back-style curve with negative y1 dips below 0.
    const back = cubicBezier(0.68, -0.6, 0.32, 1.6);
    const values = sample(back, 200);
    expect(Math.min(...values)).toBeLessThan(0);
    expect(Math.max(...values)).toBeGreaterThan(1);
  });
});

describe('steps', () => {
  it('has endpoints 0 and 1 with the default end position', () => {
    const fn = steps(4);
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
  });

  it('produces n distinct levels', () => {
    const fn = steps(4, 'end');
    const levels = new Set([fn(0.1), fn(0.3), fn(0.6), fn(0.9)]);
    expect(levels.size).toBeGreaterThan(1);
    for (const level of levels) {
      expect([0, 0.25, 0.5, 0.75, 1]).toContainEqual(level);
    }
  });

  it('start position jumps immediately after 0', () => {
    const fn = steps(4, 'start');
    expect(fn(0)).toBe(0);
    expect(fn(0.01)).toBe(0.25);
    expect(fn(1)).toBe(1);
  });

  it('is non-decreasing', () => {
    const fn = steps(5, 'end');
    let prev = fn(0);
    for (let i = 1; i <= 50; i++) {
      const v = fn(i / 50);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
