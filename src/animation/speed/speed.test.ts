import { describe, it, expect, beforeEach } from 'vitest';
import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { linear } from '../../rate-functions';
import {
  ChangeSpeed,
  changeSpeed,
  linearSpeedRamp,
  emphasizeRegion,
  rushRegion,
  smoothSpeedCurve,
  SpeedFunction,
} from './index';

/**
 * Concrete test animation that tracks interpolation calls.
 */
class TestAnimation extends Animation {
  lastAlpha: number | null = null;
  interpolateCallCount = 0;
  interpolateHistory: number[] = [];

  constructor(mobject: Mobject, options?: AnimationOptions) {
    super(mobject, options);
  }

  interpolate(alpha: number): void {
    this.lastAlpha = alpha;
    this.interpolateCallCount++;
    this.interpolateHistory.push(alpha);
  }
}

// =============================================================
// Predefined speed functions
// =============================================================

describe('linearSpeedRamp', () => {
  it('returns startSpeed at t=0', () => {
    const fn = linearSpeedRamp(1, 3);
    expect(fn(0)).toBe(1);
  });

  it('returns endSpeed at t=1', () => {
    const fn = linearSpeedRamp(1, 3);
    expect(fn(1)).toBe(3);
  });

  it('returns midpoint at t=0.5', () => {
    const fn = linearSpeedRamp(1, 3);
    expect(fn(0.5)).toBeCloseTo(2, 5);
  });

  it('works with decreasing speed', () => {
    const fn = linearSpeedRamp(4, 1);
    expect(fn(0)).toBe(4);
    expect(fn(1)).toBe(1);
    expect(fn(0.5)).toBeCloseTo(2.5, 5);
  });

  it('works with equal speeds (constant)', () => {
    const fn = linearSpeedRamp(2, 2);
    expect(fn(0)).toBe(2);
    expect(fn(0.5)).toBe(2);
    expect(fn(1)).toBe(2);
  });

  it('interpolates linearly at arbitrary t', () => {
    const fn = linearSpeedRamp(0, 10);
    expect(fn(0.3)).toBeCloseTo(3, 5);
    expect(fn(0.7)).toBeCloseTo(7, 5);
  });
});

describe('emphasizeRegion', () => {
  it('returns emphasizedSpeed within the region', () => {
    const fn = emphasizeRegion(0.3, 0.7, 2, 0.5);
    expect(fn(0.3)).toBe(0.5);
    expect(fn(0.5)).toBe(0.5);
    expect(fn(0.7)).toBe(0.5);
  });

  it('returns normalSpeed outside the region', () => {
    const fn = emphasizeRegion(0.3, 0.7, 2, 0.5);
    expect(fn(0)).toBe(2);
    expect(fn(0.1)).toBe(2);
    expect(fn(0.29)).toBe(2);
    expect(fn(0.71)).toBe(2);
    expect(fn(1)).toBe(2);
  });

  it('uses default values (normalSpeed=2, emphasizedSpeed=0.5)', () => {
    const fn = emphasizeRegion(0.2, 0.8);
    expect(fn(0)).toBe(2);
    expect(fn(0.5)).toBe(0.5);
  });

  it('handles region at start (0 to X)', () => {
    const fn = emphasizeRegion(0, 0.5, 3, 1);
    expect(fn(0)).toBe(1);
    expect(fn(0.25)).toBe(1);
    expect(fn(0.5)).toBe(1);
    expect(fn(0.51)).toBe(3);
    expect(fn(1)).toBe(3);
  });

  it('handles region at end (X to 1)', () => {
    const fn = emphasizeRegion(0.5, 1, 3, 1);
    expect(fn(0)).toBe(3);
    expect(fn(0.49)).toBe(3);
    expect(fn(0.5)).toBe(1);
    expect(fn(0.75)).toBe(1);
    expect(fn(1)).toBe(1);
  });

  it('handles full range (0 to 1)', () => {
    const fn = emphasizeRegion(0, 1, 3, 0.5);
    expect(fn(0)).toBe(0.5);
    expect(fn(0.5)).toBe(0.5);
    expect(fn(1)).toBe(0.5);
  });
});

describe('rushRegion', () => {
  it('returns rushedSpeed within the region', () => {
    const fn = rushRegion(0.2, 0.6, 1, 3);
    expect(fn(0.2)).toBe(3);
    expect(fn(0.4)).toBe(3);
    expect(fn(0.6)).toBe(3);
  });

  it('returns normalSpeed outside the region', () => {
    const fn = rushRegion(0.2, 0.6, 1, 3);
    expect(fn(0)).toBe(1);
    expect(fn(0.19)).toBe(1);
    expect(fn(0.61)).toBe(1);
    expect(fn(1)).toBe(1);
  });

  it('uses default values (normalSpeed=1, rushedSpeed=3)', () => {
    const fn = rushRegion(0.3, 0.7);
    expect(fn(0)).toBe(1);
    expect(fn(0.5)).toBe(3);
  });

  it('handles region covering full range', () => {
    const fn = rushRegion(0, 1, 1, 5);
    expect(fn(0)).toBe(5);
    expect(fn(0.5)).toBe(5);
    expect(fn(1)).toBe(5);
  });
});

describe('smoothSpeedCurve', () => {
  it('returns maxSpeed at t=0', () => {
    const fn = smoothSpeedCurve(0.5, 2);
    // At t=0: cos(0) = 1, factor = (1+1)/2 = 1, result = 0.5 + 1.5*1 = 2
    expect(fn(0)).toBeCloseTo(2, 5);
  });

  it('returns minSpeed at t=0.5', () => {
    const fn = smoothSpeedCurve(0.5, 2);
    // At t=0.5: cos(PI) = -1, factor = (1-1)/2 = 0, result = 0.5 + 1.5*0 = 0.5
    expect(fn(0.5)).toBeCloseTo(0.5, 5);
  });

  it('returns maxSpeed at t=1', () => {
    const fn = smoothSpeedCurve(0.5, 2);
    // At t=1: cos(2*PI) = 1, factor = (1+1)/2 = 1, result = 0.5 + 1.5*1 = 2
    expect(fn(1)).toBeCloseTo(2, 5);
  });

  it('is symmetric around t=0.5', () => {
    const fn = smoothSpeedCurve(1, 3);
    expect(fn(0.25)).toBeCloseTo(fn(0.75), 5);
    expect(fn(0.1)).toBeCloseTo(fn(0.9), 5);
  });

  it('handles equal min and max (constant speed)', () => {
    const fn = smoothSpeedCurve(2, 2);
    expect(fn(0)).toBeCloseTo(2, 5);
    expect(fn(0.5)).toBeCloseTo(2, 5);
    expect(fn(1)).toBeCloseTo(2, 5);
  });

  it('handles minSpeed > maxSpeed (inverted curve)', () => {
    const fn = smoothSpeedCurve(3, 1);
    // At t=0: factor=1, result = 3 + (1-3)*1 = 1
    expect(fn(0)).toBeCloseTo(1, 5);
    // At t=0.5: factor=0, result = 3 + (1-3)*0 = 3
    expect(fn(0.5)).toBeCloseTo(3, 5);
  });
});

// =============================================================
// ChangeSpeed
// =============================================================

describe('ChangeSpeed', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('wraps the given animation', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, (t) => 1);
      expect(anim.animation).toBe(inner);
    });

    it('stores the speed function', () => {
      const speedFn: SpeedFunction = (t) => 2;
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, speedFn);
      expect(anim.speedFunc).toBe(speedFn);
    });

    it('adjusts duration for constant speed > 1 (shorter)', () => {
      const inner = new TestAnimation(mob, { duration: 2, rateFunc: linear });
      // Speed 2x everywhere -> duration should be halved
      const anim = new ChangeSpeed(inner, () => 2);
      expect(anim.duration).toBeCloseTo(1, 1);
    });

    it('adjusts duration for constant speed < 1 (longer)', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      // Speed 0.5x everywhere -> duration should be doubled
      const anim = new ChangeSpeed(inner, () => 0.5);
      expect(anim.duration).toBeCloseTo(2, 1);
    });

    it('keeps same duration for constant speed = 1', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      expect(anim.duration).toBeCloseTo(1, 1);
    });

    it('uses linear rateFunc by default', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      expect(anim.rateFunc).toBe(linear);
    });

    it('accepts custom rateFunc for the wrapper', () => {
      const customRate = (t: number) => t * t;
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1, { rateFunc: customRate });
      expect(anim.rateFunc).toBe(customRate);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('calls begin on wrapped animation', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      anim.begin();
      expect((inner as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('with constant speed=1, maps alpha to approximately same original alpha', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      anim.begin();

      anim.interpolate(0);
      expect(inner.lastAlpha).toBeCloseTo(0, 1);

      anim.interpolate(0.5);
      expect(inner.lastAlpha).toBeCloseTo(0.5, 1);

      anim.interpolate(1);
      expect(inner.lastAlpha).toBeCloseTo(1, 1);
    });

    it('at alpha=0 wrapped animation alpha is near 0', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 2);
      anim.begin();
      anim.interpolate(0);
      expect(inner.lastAlpha).toBeCloseTo(0, 1);
    });

    it('at alpha=1 wrapped animation alpha is near 1', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 2);
      anim.begin();
      anim.interpolate(1);
      expect(inner.lastAlpha).toBeCloseTo(1, 1);
    });

    it('calls interpolate on inner animation', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      anim.begin();
      anim.interpolate(0.5);
      expect(inner.interpolateCallCount).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------
  // finish()
  // -----------------------------------------------------------

  describe('finish()', () => {
    it('calls finish on wrapped animation', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      anim.begin();
      anim.finish();
      expect(inner.isFinished()).toBe(true);
    });

    it('marks wrapper as finished', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // reset()
  // -----------------------------------------------------------

  describe('reset()', () => {
    it('resets both wrapper and wrapped animation', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      anim.begin();
      anim.finish();
      expect(anim.isFinished()).toBe(true);
      expect(inner.isFinished()).toBe(true);
      anim.reset();
      expect(anim.isFinished()).toBe(false);
      expect(inner.isFinished()).toBe(false);
    });

    it('resets startTime to null', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = new ChangeSpeed(inner, () => 1);
      anim.update(0, 0);
      expect(anim.startTime).toBe(0);
      anim.reset();
      expect(anim.startTime).toBeNull();
    });
  });

  // -----------------------------------------------------------
  // Speed function integration tests
  // -----------------------------------------------------------

  describe('speed function integration', () => {
    it('linearSpeedRamp: animation reaches full progress', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, linearSpeedRamp(1, 2));
      anim.begin();
      anim.interpolate(1);
      expect(inner.lastAlpha).toBeCloseTo(1, 1);
    });

    it('emphasizeRegion: animation reaches full progress', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, emphasizeRegion(0.3, 0.7));
      anim.begin();
      anim.interpolate(1);
      expect(inner.lastAlpha).toBeCloseTo(1, 1);
    });

    it('rushRegion: animation reaches full progress', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, rushRegion(0.2, 0.8));
      anim.begin();
      anim.interpolate(1);
      expect(inner.lastAlpha).toBeCloseTo(1, 1);
    });

    it('smoothSpeedCurve: animation reaches full progress', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, smoothSpeedCurve(0.5, 2));
      anim.begin();
      anim.interpolate(1);
      expect(inner.lastAlpha).toBeCloseTo(1, 1);
    });
  });

  // -----------------------------------------------------------
  // changeSpeed() factory
  // -----------------------------------------------------------

  describe('changeSpeed() factory', () => {
    it('returns a ChangeSpeed instance', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, () => 1);
      expect(anim).toBeInstanceOf(ChangeSpeed);
    });

    it('passes speed function through', () => {
      const speedFn: SpeedFunction = (t) => 1 + t;
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, speedFn);
      expect(anim.speedFunc).toBe(speedFn);
    });

    it('passes options through', () => {
      const customRate = (t: number) => t;
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, () => 1, { rateFunc: customRate });
      expect(anim.rateFunc).toBe(customRate);
    });

    it('wraps the given animation', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, () => 1);
      expect(anim.animation).toBe(inner);
    });
  });

  // -----------------------------------------------------------
  // Duration adjustment for various speed functions
  // -----------------------------------------------------------

  describe('duration adjustment', () => {
    it('linearSpeedRamp(1,1) keeps original duration', () => {
      const inner = new TestAnimation(mob, { duration: 2, rateFunc: linear });
      const anim = changeSpeed(inner, linearSpeedRamp(1, 1));
      expect(anim.duration).toBeCloseTo(2, 1);
    });

    it('linearSpeedRamp(2,2) halves duration', () => {
      const inner = new TestAnimation(mob, { duration: 4, rateFunc: linear });
      const anim = changeSpeed(inner, linearSpeedRamp(2, 2));
      expect(anim.duration).toBeCloseTo(2, 1);
    });

    it('constant speed 0.25 quadruples duration', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, () => 0.25);
      expect(anim.duration).toBeCloseTo(4, 1);
    });

    it('very high speed produces very short duration', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, () => 10);
      expect(anim.duration).toBeCloseTo(0.1, 1);
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------

  describe('edge cases', () => {
    it('handles zero-duration inner animation', () => {
      const inner = new TestAnimation(mob, { duration: 0, rateFunc: linear });
      // Speed function with zero duration: adjusted duration should be 0
      const anim = changeSpeed(inner, () => 1);
      expect(anim.duration).toBeCloseTo(0, 1);
    });

    it('handles near-zero speed (clamped to 0.001)', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      // Near-zero speed: should not cause division by zero
      const anim = changeSpeed(inner, () => 0);
      // Duration should be very large since 1/0.001 * 1 = 1000
      expect(anim.duration).toBeGreaterThan(100);
      expect(Number.isFinite(anim.duration)).toBe(true);
    });

    it('interpolate handles alpha=0 correctly', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, linearSpeedRamp(0.5, 2));
      anim.begin();
      anim.interpolate(0);
      expect(inner.lastAlpha).toBeCloseTo(0, 1);
    });

    it('interpolate handles alpha=1 correctly', () => {
      const inner = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      const anim = changeSpeed(inner, linearSpeedRamp(0.5, 2));
      anim.begin();
      anim.interpolate(1);
      expect(inner.lastAlpha).toBeCloseTo(1, 1);
    });
  });
});
