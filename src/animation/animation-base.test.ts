import { describe, it, expect, beforeEach } from 'vitest';
import { Animation, AnimationOptions } from './Animation';
import { Mobject } from '../core/Mobject';
import { smooth, linear } from '../rate-functions';

/**
 * Concrete subclass of Animation for testing.
 * Tracks the most recent alpha passed to interpolate().
 */
class TestAnimation extends Animation {
  lastAlpha: number | null = null;
  interpolateCallCount = 0;

  constructor(mobject: Mobject, options?: AnimationOptions) {
    super(mobject, options);
  }

  interpolate(alpha: number): void {
    this.lastAlpha = alpha;
    this.interpolateCallCount++;
  }
}

describe('Animation base class', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor defaults
  // -----------------------------------------------------------

  describe('constructor defaults', () => {
    it('duration defaults to 1', () => {
      const anim = new TestAnimation(mob);
      expect(anim.duration).toBe(1);
    });

    it('rateFunc defaults to smooth', () => {
      const anim = new TestAnimation(mob);
      expect(anim.rateFunc).toBe(smooth);
    });

    it('stores the mobject reference', () => {
      const anim = new TestAnimation(mob);
      expect(anim.mobject).toBe(mob);
    });
  });

  // -----------------------------------------------------------
  // Constructor with custom options
  // -----------------------------------------------------------

  describe('constructor with custom options', () => {
    it('accepts custom duration', () => {
      const anim = new TestAnimation(mob, { duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('accepts custom rateFunc', () => {
      const anim = new TestAnimation(mob, { rateFunc: linear });
      expect(anim.rateFunc).toBe(linear);
    });

    it('accepts both duration and rateFunc', () => {
      const anim = new TestAnimation(mob, { duration: 2.5, rateFunc: linear });
      expect(anim.duration).toBe(2.5);
      expect(anim.rateFunc).toBe(linear);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('sets _hasBegun to true', () => {
      const anim = new TestAnimation(mob);
      // Access via casting since _hasBegun is protected
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(false);
      anim.begin();
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
    });

    it('sets _isFinished to false', () => {
      const anim = new TestAnimation(mob);
      // Force finished state first
      anim.finish();
      expect(anim.isFinished()).toBe(true);
      // begin() should reset _isFinished
      anim.begin();
      expect(anim.isFinished()).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // finish()
  // -----------------------------------------------------------

  describe('finish()', () => {
    it('sets _isFinished to true', () => {
      const anim = new TestAnimation(mob);
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // isFinished()
  // -----------------------------------------------------------

  describe('isFinished()', () => {
    it('returns false before animation starts', () => {
      const anim = new TestAnimation(mob);
      expect(anim.isFinished()).toBe(false);
    });

    it('returns false while animation is in progress', () => {
      const anim = new TestAnimation(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
    });

    it('returns true after finish()', () => {
      const anim = new TestAnimation(mob);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // reset()
  // -----------------------------------------------------------

  describe('reset()', () => {
    it('resets _startTime to null', () => {
      const anim = new TestAnimation(mob);
      anim.update(0, 0); // triggers _startTime = 0
      expect(anim.startTime).toBe(0);
      anim.reset();
      expect(anim.startTime).toBeNull();
    });

    it('resets _isFinished to false', () => {
      const anim = new TestAnimation(mob);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
      anim.reset();
      expect(anim.isFinished()).toBe(false);
    });

    it('resets _hasBegun to false', () => {
      const anim = new TestAnimation(mob);
      anim.begin();
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
      anim.reset();
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(false);
    });

    it('resets all state at once', () => {
      const anim = new TestAnimation(mob);
      anim.update(0, 0);
      anim.finish();
      anim.reset();
      expect(anim.startTime).toBeNull();
      expect(anim.isFinished()).toBe(false);
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // update() lifecycle
  // -----------------------------------------------------------

  describe('update() lifecycle', () => {
    it('sets _startTime on first call', () => {
      const anim = new TestAnimation(mob, { rateFunc: linear });
      expect(anim.startTime).toBeNull();
      anim.update(0, 5.0);
      expect(anim.startTime).toBe(5.0);
    });

    it('does not overwrite _startTime on subsequent calls', () => {
      const anim = new TestAnimation(mob, { rateFunc: linear });
      anim.update(0, 2.0);
      expect(anim.startTime).toBe(2.0);
      anim.update(0.016, 2.5);
      expect(anim.startTime).toBe(2.0);
    });

    it('calls begin() automatically on first update', () => {
      const anim = new TestAnimation(mob, { rateFunc: linear });
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(false);
      anim.update(0, 0);
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
    });

    it('calculates correct raw alpha from elapsed / duration', () => {
      const anim = new TestAnimation(mob, { duration: 2, rateFunc: linear });
      anim.update(0, 0); // start at t=0
      // At t=0 elapsed=0, rawAlpha=0, linear(0)=0
      expect(anim.lastAlpha).toBeCloseTo(0, 5);

      anim.update(0.016, 1.0); // elapsed=1, rawAlpha=0.5
      expect(anim.lastAlpha).toBeCloseTo(0.5, 5);

      anim.update(0.016, 1.5); // elapsed=1.5, rawAlpha=0.75
      expect(anim.lastAlpha).toBeCloseTo(0.75, 5);
    });

    it('applies rate function to raw alpha', () => {
      // Use smooth: smooth(0.5) is approximately 0.5 but via sigmoid
      const anim = new TestAnimation(mob, { duration: 1, rateFunc: smooth });
      anim.update(0, 0);
      anim.update(0.016, 0.5); // elapsed=0.5, rawAlpha=0.5
      // smooth(0.5) should be close to 0.5 (sigmoid midpoint)
      expect(anim.lastAlpha).toBeCloseTo(smooth(0.5), 5);
    });

    it('clamps alpha to [0, 1] range', () => {
      const anim = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      anim.update(0, 0);
      // Even if currentTime exceeds start + duration, rawAlpha is clamped to 1
      anim.update(0.016, 5.0); // elapsed=5, rawAlpha = min(1, 5/1) = 1
      expect(anim.lastAlpha).toBe(1);
    });

    it('calls finish() when rawAlpha >= 1', () => {
      const anim = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      anim.update(0, 0);
      expect(anim.isFinished()).toBe(false);
      anim.update(0.016, 1.0); // elapsed=1, rawAlpha=1
      expect(anim.isFinished()).toBe(true);
    });

    it('does not call finish() when rawAlpha < 1', () => {
      const anim = new TestAnimation(mob, { duration: 2, rateFunc: linear });
      anim.update(0, 0);
      anim.update(0.016, 0.5); // elapsed=0.5, rawAlpha=0.25
      expect(anim.isFinished()).toBe(false);
    });

    it('zero duration animation completes immediately with alpha=1', () => {
      const anim = new TestAnimation(mob, { duration: 0, rateFunc: linear });
      anim.update(0, 0);
      expect(anim.lastAlpha).toBe(1);
      expect(anim.isFinished()).toBe(true);
    });

    it('calls interpolate on each update', () => {
      const anim = new TestAnimation(mob, { duration: 1, rateFunc: linear });
      expect(anim.interpolateCallCount).toBe(0);
      anim.update(0, 0);
      expect(anim.interpolateCallCount).toBe(1);
      anim.update(0.016, 0.5);
      expect(anim.interpolateCallCount).toBe(2);
    });
  });

  // -----------------------------------------------------------
  // startTime getter/setter
  // -----------------------------------------------------------

  describe('startTime getter/setter', () => {
    it('getter returns null initially', () => {
      const anim = new TestAnimation(mob);
      expect(anim.startTime).toBeNull();
    });

    it('setter allows setting start time externally', () => {
      const anim = new TestAnimation(mob);
      anim.startTime = 10;
      expect(anim.startTime).toBe(10);
    });

    it('setter allows setting back to null', () => {
      const anim = new TestAnimation(mob);
      anim.startTime = 5;
      expect(anim.startTime).toBe(5);
      anim.startTime = null;
      expect(anim.startTime).toBeNull();
    });
  });

  // -----------------------------------------------------------
  // remover property
  // -----------------------------------------------------------

  describe('remover property', () => {
    it('defaults to false', () => {
      const anim = new TestAnimation(mob);
      expect(anim.remover).toBe(false);
    });

    it('can be set to true', () => {
      const anim = new TestAnimation(mob);
      anim.remover = true;
      expect(anim.remover).toBe(true);
    });
  });
});
