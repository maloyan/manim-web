import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyReducedMotion,
  getReducedMotionRunTime,
  isReducedMotionEnabled,
  prefersReducedMotion,
  reducedRunTime,
  resetReducedMotion,
  setReducedMotion,
  shouldReduceMotion,
} from './reducedMotion';

afterEach(() => {
  resetReducedMotion();
  vi.unstubAllGlobals();
});

describe('prefersReducedMotion (guard)', () => {
  it('returns false when window is undefined (node environment)', () => {
    // Default vitest environment is node, so window does not exist here.
    expect(typeof window).toBe('undefined');
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns false when matchMedia is missing from window', () => {
    vi.stubGlobal('window', {});
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns false when matchMedia throws', () => {
    vi.stubGlobal('window', {
      matchMedia: () => {
        throw new Error('nope');
      },
    });
    expect(prefersReducedMotion()).toBe(false);
  });

  it('reflects the matchMedia result when present', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('window', { matchMedia });
    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});

describe('reduced-motion setting', () => {
  it('is disabled by default', () => {
    expect(isReducedMotionEnabled()).toBe(false);
    expect(getReducedMotionRunTime()).toBe(0);
  });

  it('accepts a boolean shorthand', () => {
    setReducedMotion(true);
    expect(isReducedMotionEnabled()).toBe(true);
  });

  it('accepts a partial options object and clamps a bad runTime to zero', () => {
    setReducedMotion({ enabled: true, runTime: 0.2 });
    expect(getReducedMotionRunTime()).toBe(0.2);
    setReducedMotion({ runTime: -5 });
    expect(getReducedMotionRunTime()).toBe(0);
    setReducedMotion({ runTime: Number.NaN });
    expect(getReducedMotionRunTime()).toBe(0);
    expect(isReducedMotionEnabled()).toBe(true);
  });
});

describe('shouldReduceMotion', () => {
  it('is false unless opted in AND the OS prefers reduced motion', () => {
    vi.stubGlobal('window', { matchMedia: vi.fn().mockReturnValue({ matches: true }) });
    expect(shouldReduceMotion()).toBe(false); // not opted in
    setReducedMotion(true);
    expect(shouldReduceMotion()).toBe(true);
  });

  it('is false when opted in but the OS does not prefer reduced motion', () => {
    vi.stubGlobal('window', { matchMedia: vi.fn().mockReturnValue({ matches: false }) });
    setReducedMotion(true);
    expect(shouldReduceMotion()).toBe(false);
  });
});

describe('reducedRunTime', () => {
  it('returns the requested run time when motion is not reduced', () => {
    expect(reducedRunTime(2)).toBe(2);
  });

  it('collapses the run time when motion is reduced', () => {
    vi.stubGlobal('window', { matchMedia: vi.fn().mockReturnValue({ matches: true }) });
    setReducedMotion({ enabled: true, runTime: 0 });
    expect(reducedRunTime(2)).toBe(0);
  });
});

describe('applyReducedMotion', () => {
  it('does nothing and reports false when motion is not reduced', () => {
    const animations = [{ duration: 2 }, { duration: 3 }];
    expect(applyReducedMotion(animations)).toBe(false);
    expect(animations.map((a) => a.duration)).toEqual([2, 3]);
  });

  it('overrides every duration with the collapsed run time when reduced', () => {
    vi.stubGlobal('window', { matchMedia: vi.fn().mockReturnValue({ matches: true }) });
    setReducedMotion({ enabled: true, runTime: 0 });
    const animations = [{ duration: 2 }, { duration: 3 }];
    expect(applyReducedMotion(animations)).toBe(true);
    expect(animations.map((a) => a.duration)).toEqual([0, 0]);
  });
});
