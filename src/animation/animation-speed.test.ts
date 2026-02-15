import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { Animation, AnimationOptions } from './Animation';
import { linear } from '../rate-functions';
import {
  ChangeSpeed,
  changeSpeed,
  linearSpeedRamp,
  emphasizeRegion,
  rushRegion,
  smoothSpeedCurve,
  SpeedFunction,
} from './speed/index';

/**
 * Simple animation that records alphas passed to interpolate.
 */
class RecordingAnimation extends Animation {
  alphas: number[] = [];

  constructor(mobject: Mobject, options?: AnimationOptions) {
    super(mobject, { rateFunc: linear, ...options });
  }

  interpolate(alpha: number): void {
    this.alphas.push(alpha);
  }
}

function createMob(): Mobject {
  return new Mobject();
}

// ------------------------------------------------------------------
// ChangeSpeed
// ------------------------------------------------------------------

describe('ChangeSpeed', () => {
  describe('constructor', () => {
    it('wraps the provided animation', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      expect(cs.animation).toBe(inner);
    });

    it('stores the speed function', () => {
      const sf: SpeedFunction = (t) => 1 + t;
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, sf);
      expect(cs.speedFunc).toBe(sf);
    });

    it('constant speed=1 preserves original duration', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 2 });
      const cs = new ChangeSpeed(inner, () => 1);
      expect(cs.duration).toBeCloseTo(2, 1);
    });

    it('constant speed=2 halves the duration', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 2 });
      const cs = new ChangeSpeed(inner, () => 2);
      expect(cs.duration).toBeCloseTo(1, 1);
    });

    it('constant speed=0.5 doubles the duration', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 0.5);
      expect(cs.duration).toBeCloseTo(2, 1);
    });

    it('uses linear rateFunc by default', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      expect(cs.rateFunc).toBe(linear);
    });

    it('accepts custom rateFunc in options', () => {
      const customRate = (t: number) => t * t;
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1, {
        rateFunc: customRate,
      });
      expect(cs.rateFunc).toBe(customRate);
    });
  });

  describe('begin()', () => {
    it('calls begin on the wrapped animation', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      cs.begin();
      expect((inner as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 the wrapped animation gets alpha close to 0', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      cs.begin();
      cs.interpolate(0);
      expect(inner.alphas.length).toBe(1);
      expect(inner.alphas[0]).toBeCloseTo(0, 1);
    });

    it('at alpha=1 the wrapped animation gets alpha close to 1', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      cs.begin();
      cs.interpolate(1);
      expect(inner.alphas.length).toBe(1);
      expect(inner.alphas[0]).toBeCloseTo(1, 1);
    });

    it('uniform speed maps alpha linearly', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      cs.begin();
      cs.interpolate(0.5);
      expect(inner.alphas[0]).toBeCloseTo(0.5, 1);
    });
  });

  describe('finish()', () => {
    it('calls finish on the wrapped animation', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      cs.begin();
      cs.finish();
      expect(inner.isFinished()).toBe(true);
    });

    it('marks itself as finished', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      cs.begin();
      cs.finish();
      expect(cs.isFinished()).toBe(true);
    });
  });

  describe('reset()', () => {
    it('resets both wrapper and wrapped animation', () => {
      const inner = new RecordingAnimation(createMob(), { duration: 1 });
      const cs = new ChangeSpeed(inner, () => 1);
      cs.begin();
      cs.finish();
      cs.reset();
      expect(cs.isFinished()).toBe(false);
      expect(inner.isFinished()).toBe(false);
    });
  });
});

// ------------------------------------------------------------------
// changeSpeed factory
// ------------------------------------------------------------------

describe('changeSpeed() factory', () => {
  it('returns a ChangeSpeed instance', () => {
    const inner = new RecordingAnimation(createMob(), { duration: 1 });
    const cs = changeSpeed(inner, () => 1);
    expect(cs).toBeInstanceOf(ChangeSpeed);
  });

  it('passes speed function and options through', () => {
    const sf: SpeedFunction = () => 2;
    const inner = new RecordingAnimation(createMob(), { duration: 2 });
    const cs = changeSpeed(inner, sf, { rateFunc: linear });
    expect(cs.speedFunc).toBe(sf);
    expect(cs.rateFunc).toBe(linear);
    // speed=2 should halve: 2/2 = 1
    expect(cs.duration).toBeCloseTo(1, 1);
  });
});

// ------------------------------------------------------------------
// Predefined speed functions
// ------------------------------------------------------------------

describe('linearSpeedRamp()', () => {
  it('returns startSpeed at t=0', () => {
    const sf = linearSpeedRamp(1, 3);
    expect(sf(0)).toBe(1);
  });

  it('returns endSpeed at t=1', () => {
    const sf = linearSpeedRamp(1, 3);
    expect(sf(1)).toBe(3);
  });

  it('returns midpoint at t=0.5', () => {
    const sf = linearSpeedRamp(1, 3);
    expect(sf(0.5)).toBe(2);
  });

  it('works with decreasing ramp', () => {
    const sf = linearSpeedRamp(4, 0);
    expect(sf(0)).toBe(4);
    expect(sf(0.5)).toBe(2);
    expect(sf(1)).toBe(0);
  });
});

describe('emphasizeRegion()', () => {
  it('returns emphasizedSpeed inside the region', () => {
    const sf = emphasizeRegion(0.3, 0.7, 2, 0.5);
    expect(sf(0.5)).toBe(0.5);
    expect(sf(0.3)).toBe(0.5);
    expect(sf(0.7)).toBe(0.5);
  });

  it('returns normalSpeed outside the region', () => {
    const sf = emphasizeRegion(0.3, 0.7, 2, 0.5);
    expect(sf(0)).toBe(2);
    expect(sf(0.1)).toBe(2);
    expect(sf(0.8)).toBe(2);
    expect(sf(1)).toBe(2);
  });

  it('uses defaults: normalSpeed=2, emphasizedSpeed=0.5', () => {
    const sf = emphasizeRegion(0.2, 0.8);
    expect(sf(0.5)).toBe(0.5);
    expect(sf(0)).toBe(2);
  });
});

describe('rushRegion()', () => {
  it('returns rushedSpeed inside the region', () => {
    const sf = rushRegion(0.2, 0.5, 1, 3);
    expect(sf(0.3)).toBe(3);
    expect(sf(0.2)).toBe(3);
    expect(sf(0.5)).toBe(3);
  });

  it('returns normalSpeed outside the region', () => {
    const sf = rushRegion(0.2, 0.5, 1, 3);
    expect(sf(0)).toBe(1);
    expect(sf(0.1)).toBe(1);
    expect(sf(0.6)).toBe(1);
    expect(sf(1)).toBe(1);
  });

  it('uses defaults: normalSpeed=1, rushedSpeed=3', () => {
    const sf = rushRegion(0.4, 0.6);
    expect(sf(0.5)).toBe(3);
    expect(sf(0)).toBe(1);
  });
});

describe('smoothSpeedCurve()', () => {
  it('returns maxSpeed at t=0', () => {
    const sf = smoothSpeedCurve(0.5, 2);
    expect(sf(0)).toBeCloseTo(2, 5);
  });

  it('returns minSpeed at t=0.5', () => {
    const sf = smoothSpeedCurve(0.5, 2);
    expect(sf(0.5)).toBeCloseTo(0.5, 5);
  });

  it('returns maxSpeed at t=1', () => {
    const sf = smoothSpeedCurve(0.5, 2);
    expect(sf(1)).toBeCloseTo(2, 5);
  });

  it('is symmetric around t=0.5', () => {
    const sf = smoothSpeedCurve(1, 4);
    expect(sf(0.25)).toBeCloseTo(sf(0.75), 5);
  });

  it('values stay in [minSpeed, maxSpeed] range', () => {
    const sf = smoothSpeedCurve(0.5, 3);
    for (let t = 0; t <= 1; t += 0.1) {
      const v = sf(t);
      expect(v).toBeGreaterThanOrEqual(0.5 - 1e-10);
      expect(v).toBeLessThanOrEqual(3 + 1e-10);
    }
  });
});
