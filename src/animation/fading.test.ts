import { describe, it, expect, beforeEach } from 'vitest';
import { FadeIn, fadeIn } from './fading/FadeIn';
import { FadeOut, fadeOut } from './fading/FadeOut';
import { Mobject } from '../core/Mobject';
import { linear } from '../rate-functions';

describe('FadeIn', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('accepts mobject and default options', () => {
      const anim = new FadeIn(mob);
      expect(anim.mobject).toBe(mob);
      expect(anim.duration).toBe(1);
    });

    it('accepts mobject with custom options', () => {
      const anim = new FadeIn(mob, { duration: 2, rateFunc: linear });
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(linear);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('sets opacity to 0', () => {
      mob.opacity = 1;
      const anim = new FadeIn(mob);
      anim.begin();
      expect(mob.opacity).toBe(0);
    });

    it('stores target position', () => {
      mob.position.set(3, 4, 5);
      const anim = new FadeIn(mob);
      anim.begin();
      // After begin, the mobject position should still be at (3,4,5)
      // since there is no shift
      expect(mob.position.x).toBe(3);
      expect(mob.position.y).toBe(4);
      expect(mob.position.z).toBe(5);
    });

    it('with shift: stores shifted start position and moves mobject', () => {
      mob.position.set(1, 2, 0);
      const anim = new FadeIn(mob, { shift: [0, -1, 0] });
      anim.begin();
      // Start position = target + shift = (1, 2, 0) + (0, -1, 0) = (1, 1, 0)
      expect(mob.position.x).toBeCloseTo(1, 5);
      expect(mob.position.y).toBeCloseTo(1, 5);
      expect(mob.position.z).toBeCloseTo(0, 5);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('at alpha=0: opacity is 0', () => {
      const anim = new FadeIn(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBeCloseTo(0, 5);
    });

    it('at alpha=0.5: opacity is 0.5', () => {
      const anim = new FadeIn(mob);
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.5, 5);
    });

    it('at alpha=1: opacity is 1', () => {
      const anim = new FadeIn(mob);
      anim.begin();
      anim.interpolate(1);
      expect(mob.opacity).toBeCloseTo(1, 5);
    });

    it('with shift: position interpolates from start to target', () => {
      mob.position.set(2, 0, 0);
      const anim = new FadeIn(mob, { shift: [-2, 0, 0] });
      anim.begin();
      // Start = (2,0,0) + (-2,0,0) = (0,0,0), target = (2,0,0)

      anim.interpolate(0);
      expect(mob.position.x).toBeCloseTo(0, 5);

      anim.interpolate(0.5);
      expect(mob.position.x).toBeCloseTo(1, 5);

      anim.interpolate(1);
      expect(mob.position.x).toBeCloseTo(2, 5);
    });

    it('no shift: position unchanged during interpolation', () => {
      mob.position.set(5, 3, 1);
      const anim = new FadeIn(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.position.x).toBe(5);
      expect(mob.position.y).toBe(3);
      expect(mob.position.z).toBe(1);
      anim.interpolate(0.5);
      expect(mob.position.x).toBe(5);
      expect(mob.position.y).toBe(3);
      expect(mob.position.z).toBe(1);
      anim.interpolate(1);
      expect(mob.position.x).toBe(5);
      expect(mob.position.y).toBe(3);
      expect(mob.position.z).toBe(1);
    });
  });

  // -----------------------------------------------------------
  // finish()
  // -----------------------------------------------------------

  describe('finish()', () => {
    it('sets opacity to 1', () => {
      const anim = new FadeIn(mob);
      anim.begin();
      anim.interpolate(0.5); // partially through
      anim.finish();
      expect(mob.opacity).toBe(1);
    });

    it('sets position to target when shift is used', () => {
      mob.position.set(3, 0, 0);
      const anim = new FadeIn(mob, { shift: [-3, 0, 0] });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.position.x).toBeCloseTo(3, 5);
      expect(mob.position.y).toBeCloseTo(0, 5);
      expect(mob.position.z).toBeCloseTo(0, 5);
    });

    it('marks animation as finished', () => {
      const anim = new FadeIn(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // fadeIn() factory function
  // -----------------------------------------------------------

  describe('fadeIn() factory', () => {
    it('returns a FadeIn instance', () => {
      const anim = fadeIn(mob);
      expect(anim).toBeInstanceOf(FadeIn);
      expect(anim.mobject).toBe(mob);
    });

    it('passes options through', () => {
      const anim = fadeIn(mob, { duration: 3, rateFunc: linear });
      expect(anim.duration).toBe(3);
      expect(anim.rateFunc).toBe(linear);
    });
  });
});

// =============================================================
// FadeOut
// =============================================================

describe('FadeOut', () => {
  let mob: Mobject;

  beforeEach(() => {
    mob = new Mobject();
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('sets remover to true', () => {
      const anim = new FadeOut(mob);
      expect(anim.remover).toBe(true);
    });

    it('accepts mobject and options', () => {
      const anim = new FadeOut(mob, { duration: 0.5 });
      expect(anim.mobject).toBe(mob);
      expect(anim.duration).toBe(0.5);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('stores initial opacity (default 1)', () => {
      mob.opacity = 1;
      const anim = new FadeOut(mob);
      anim.begin();
      // After begin, opacity should still be 1 (initial value stored internally)
      expect(mob.opacity).toBe(1);
    });

    it('stores initial opacity when non-1', () => {
      mob.opacity = 0.8;
      const anim = new FadeOut(mob);
      anim.begin();
      expect(mob.opacity).toBeCloseTo(0.8, 5);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('at alpha=0: opacity equals initial opacity', () => {
      mob.opacity = 1;
      const anim = new FadeOut(mob);
      anim.begin();
      anim.interpolate(0);
      expect(mob.opacity).toBeCloseTo(1, 5);
    });

    it('at alpha=0.5: opacity is half of initial', () => {
      mob.opacity = 1;
      const anim = new FadeOut(mob);
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.5, 5);
    });

    it('at alpha=1: opacity is 0', () => {
      mob.opacity = 1;
      const anim = new FadeOut(mob);
      anim.begin();
      anim.interpolate(1);
      expect(mob.opacity).toBeCloseTo(0, 5);
    });

    it('preserves initial non-1 opacity', () => {
      mob.opacity = 0.8;
      const anim = new FadeOut(mob);
      anim.begin();
      // At alpha=0.5, opacity = 0.8 * (1 - 0.5) = 0.4
      anim.interpolate(0.5);
      expect(mob.opacity).toBeCloseTo(0.4, 5);
      // At alpha=0, opacity = 0.8 * (1 - 0) = 0.8
      anim.interpolate(0);
      expect(mob.opacity).toBeCloseTo(0.8, 5);
      // At alpha=1, opacity = 0.8 * (1 - 1) = 0
      anim.interpolate(1);
      expect(mob.opacity).toBeCloseTo(0, 5);
    });

    it('with shift: position interpolates from start to start+shift', () => {
      mob.position.set(1, 0, 0);
      const anim = new FadeOut(mob, { shift: [2, 0, 0] });
      anim.begin();
      // start = (1,0,0), end = (1+2,0,0) = (3,0,0)

      anim.interpolate(0);
      expect(mob.position.x).toBeCloseTo(1, 5);

      anim.interpolate(0.5);
      expect(mob.position.x).toBeCloseTo(2, 5);

      anim.interpolate(1);
      expect(mob.position.x).toBeCloseTo(3, 5);
    });

    it('without shift: position unchanged', () => {
      mob.position.set(4, 2, 1);
      const anim = new FadeOut(mob);
      anim.begin();
      anim.interpolate(0.5);
      expect(mob.position.x).toBe(4);
      expect(mob.position.y).toBe(2);
      expect(mob.position.z).toBe(1);
    });
  });

  // -----------------------------------------------------------
  // finish()
  // -----------------------------------------------------------

  describe('finish()', () => {
    it('sets opacity to 0', () => {
      mob.opacity = 1;
      const anim = new FadeOut(mob);
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(mob.opacity).toBe(0);
    });

    it('sets position to end when shift is used', () => {
      mob.position.set(0, 0, 0);
      const anim = new FadeOut(mob, { shift: [0, 3, 0] });
      anim.begin();
      anim.finish();
      expect(mob.position.x).toBeCloseTo(0, 5);
      expect(mob.position.y).toBeCloseTo(3, 5);
      expect(mob.position.z).toBeCloseTo(0, 5);
    });

    it('marks animation as finished', () => {
      const anim = new FadeOut(mob);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  // -----------------------------------------------------------
  // fadeOut() factory function
  // -----------------------------------------------------------

  describe('fadeOut() factory', () => {
    it('returns a FadeOut instance', () => {
      const anim = fadeOut(mob);
      expect(anim).toBeInstanceOf(FadeOut);
      expect(anim.mobject).toBe(mob);
    });

    it('sets remover to true', () => {
      const anim = fadeOut(mob);
      expect(anim.remover).toBe(true);
    });

    it('passes options through', () => {
      const anim = fadeOut(mob, { duration: 0.3, rateFunc: linear });
      expect(anim.duration).toBe(0.3);
      expect(anim.rateFunc).toBe(linear);
    });
  });
});
