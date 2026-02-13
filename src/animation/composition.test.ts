import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { AnimationGroup } from './AnimationGroup';
import { Succession, succession } from './Succession';
import { FadeIn } from './fading/FadeIn';
import { linear } from '../rate-functions';

/**
 * Helper to create a FadeIn animation with linear rateFunc for predictable testing.
 */
function createFadeIn(duration: number = 1): FadeIn {
  const m = new Mobject();
  return new FadeIn(m, { duration, rateFunc: linear });
}

describe('AnimationGroup', () => {
  describe('empty group', () => {
    it('has duration 0', () => {
      const group = new AnimationGroup([]);
      expect(group.duration).toBe(0);
    });

    it('can call begin without error', () => {
      const group = new AnimationGroup([]);
      expect(() => group.begin()).not.toThrow();
    });

    it('can call finish without error', () => {
      const group = new AnimationGroup([]);
      group.begin();
      expect(() => group.finish()).not.toThrow();
    });
  });

  describe('parallel (lagRatio=0)', () => {
    it('duration is max of all animation durations', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(2);
      const a3 = createFadeIn(1.5);
      const group = new AnimationGroup([a1, a2, a3], { lagRatio: 0 });
      expect(group.duration).toBeCloseTo(2, 5);
    });

    it('duration equals single animation duration with one child', () => {
      const a1 = createFadeIn(3);
      const group = new AnimationGroup([a1], { lagRatio: 0 });
      expect(group.duration).toBeCloseTo(3, 5);
    });

    it('lagRatio defaults to 0', () => {
      const a1 = createFadeIn(1);
      const group = new AnimationGroup([a1]);
      expect(group.lagRatio).toBe(0);
    });
  });

  describe('sequential (lagRatio=1)', () => {
    it('duration is sum of all animation durations', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(2);
      const a3 = createFadeIn(1.5);
      const group = new AnimationGroup([a1, a2, a3], { lagRatio: 1 });
      expect(group.duration).toBeCloseTo(4.5, 5);
    });

    it('duration is single duration with one child', () => {
      const a1 = createFadeIn(2);
      const group = new AnimationGroup([a1], { lagRatio: 1 });
      expect(group.duration).toBeCloseTo(2, 5);
    });
  });

  describe('staggered (lagRatio=0.5)', () => {
    it('computes correct duration with equal-length animations', () => {
      // Two animations of duration 1 each, lagRatio=0.5
      // anim0 starts at 0, ends at 1
      // anim1 starts at 0.5 (0 + 1*0.5), ends at 1.5
      // Group duration = max(1, 1.5) = 1.5
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 0.5 });
      expect(group.duration).toBeCloseTo(1.5, 5);
    });

    it('computes correct duration with three animations', () => {
      // Three animations of duration 1, lagRatio=0.5
      // anim0: starts 0, ends 1
      // anim1: starts 0.5, ends 1.5
      // anim2: starts 1.0, ends 2.0
      // Group duration = 2.0
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const a3 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2, a3], { lagRatio: 0.5 });
      expect(group.duration).toBeCloseTo(2.0, 5);
    });

    it('computes correct duration with different-length animations', () => {
      // anim0: dur=2, starts 0, ends 2
      // anim1: dur=1, starts 2*0.5=1, ends 2
      // Group duration = max(2, 2) = 2
      const a1 = createFadeIn(2);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 0.5 });
      expect(group.duration).toBeCloseTo(2, 5);
    });
  });

  describe('begin()', () => {
    it('calls begin on all child animations', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2]);
      group.begin();

      // After group.begin(), children should have begun
      // FadeIn.begin() sets opacity to 0
      expect(a1.mobject.opacity).toBe(0);
      expect(a2.mobject.opacity).toBe(0);
    });

    it('can be called on sequential group', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 1 });
      group.begin();

      expect(a1.mobject.opacity).toBe(0);
      expect(a2.mobject.opacity).toBe(0);
    });
  });

  describe('interpolate() with lagRatio=0 (parallel)', () => {
    it('all animations get same alpha when same duration', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 0 });
      group.begin();

      // Group alpha=0.5 => groupTime = 0.5 * 1 = 0.5
      // Both start at 0, duration 1: localAlpha = 0.5
      // FadeIn with linear: interpolate(0.5) -> opacity = 0.5
      group.interpolate(0.5);
      expect(a1.mobject.opacity).toBeCloseTo(0.5, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0.5, 5);
    });

    it('at alpha=0 all animations are at start', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 0 });
      group.begin();
      group.interpolate(0);

      expect(a1.mobject.opacity).toBeCloseTo(0, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);
    });

    it('at alpha=1 all animations are at end', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 0 });
      group.begin();
      group.interpolate(1);

      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(1, 5);
    });

    it('shorter animation finishes before longer one', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(2);
      const group = new AnimationGroup([a1, a2], { lagRatio: 0 });
      // group duration = max(1, 2) = 2
      group.begin();

      // At group alpha=0.5 => groupTime = 0.5 * 2 = 1
      // a1: localAlpha = min(1, 1/1) = 1 (finished)
      // a2: localAlpha = 1/2 = 0.5
      group.interpolate(0.5);
      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0.5, 5);
    });
  });

  describe('interpolate() with lagRatio=1 (sequential)', () => {
    it('first anim plays then second with 2 anims of duration 1', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 1 });
      // group duration = 1 + 1 = 2
      expect(group.duration).toBeCloseTo(2, 5);
      group.begin();

      // At group alpha=0.25 => groupTime = 0.25 * 2 = 0.5
      // a1: start=0, end=1, localAlpha = 0.5/1 = 0.5
      // a2: start=1, end=2, groupTime < startTime => localAlpha = 0
      group.interpolate(0.25);
      expect(a1.mobject.opacity).toBeCloseTo(0.5, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);
    });

    it('second anim plays after first finishes', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 1 });
      group.begin();

      // At group alpha=0.75 => groupTime = 0.75 * 2 = 1.5
      // a1: start=0, end=1, groupTime >= endTime => localAlpha = 1
      // a2: start=1, end=2, localAlpha = (1.5 - 1) / 1 = 0.5
      group.interpolate(0.75);
      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0.5, 5);
    });

    it('at group alpha=0 both are at start', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 1 });
      group.begin();
      group.interpolate(0);

      expect(a1.mobject.opacity).toBeCloseTo(0, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);
    });

    it('at group alpha=1 both are finished', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 1 });
      group.begin();
      group.interpolate(1);

      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(1, 5);
    });

    it('midpoint: first finished, second starting', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 1 });
      group.begin();

      // At group alpha=0.5 => groupTime = 0.5 * 2 = 1.0
      // a1: start=0, end=1, groupTime >= endTime => localAlpha = 1
      // a2: start=1, end=2, groupTime = startTime => localAlpha = 0
      group.interpolate(0.5);
      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);
    });

    it('works with three sequential animations', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const a3 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2, a3], { lagRatio: 1 });
      // duration = 3
      expect(group.duration).toBeCloseTo(3, 5);
      group.begin();

      // At group alpha = 1/3 => groupTime = 1
      // a1: done, a2: starting, a3: not started
      group.interpolate(1 / 3);
      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);
      expect(a3.mobject.opacity).toBeCloseTo(0, 5);

      // At group alpha = 2/3 => groupTime = 2
      // a1: done, a2: done, a3: starting
      group.interpolate(2 / 3);
      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(1, 5);
      expect(a3.mobject.opacity).toBeCloseTo(0, 5);
    });
  });

  describe('interpolate() with lagRatio=0.5 (staggered)', () => {
    it('animations overlap correctly', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 0.5 });
      // a1: start=0, end=1
      // a2: start=0.5, end=1.5
      // group duration = 1.5
      expect(group.duration).toBeCloseTo(1.5, 5);
      group.begin();

      // At group alpha = 1/3 => groupTime = 0.5
      // a1: localAlpha = 0.5/1 = 0.5
      // a2: groupTime = startTime => localAlpha = 0
      group.interpolate(1 / 3);
      expect(a1.mobject.opacity).toBeCloseTo(0.5, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);

      // At group alpha = 2/3 => groupTime = 1.0
      // a1: localAlpha = 1/1 = 1 (finished)
      // a2: localAlpha = (1.0 - 0.5)/1 = 0.5
      group.interpolate(2 / 3);
      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0.5, 5);
    });
  });

  describe('finish()', () => {
    it('calls finish on all children', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2]);
      group.begin();
      group.finish();

      // FadeIn.finish() sets opacity to 1
      expect(a1.mobject.opacity).toBe(1);
      expect(a2.mobject.opacity).toBe(1);

      // Group itself should be finished
      expect(group.isFinished()).toBe(true);
    });

    it('finish on sequential group finishes all children', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2], { lagRatio: 1 });
      group.begin();
      group.finish();

      expect(a1.mobject.opacity).toBe(1);
      expect(a2.mobject.opacity).toBe(1);
    });
  });

  describe('isFinished()', () => {
    it('returns false initially', () => {
      const a1 = createFadeIn(1);
      const group = new AnimationGroup([a1]);
      expect(group.isFinished()).toBe(false);
    });

    it('returns true only when all children finished', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2]);
      group.begin();
      group.finish();
      expect(group.isFinished()).toBe(true);
    });
  });

  describe('reset()', () => {
    it('resets all children', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = new AnimationGroup([a1, a2]);
      group.begin();
      group.finish();
      expect(group.isFinished()).toBe(true);

      group.reset();
      expect(group.isFinished()).toBe(false);
      expect(a1.isFinished()).toBe(false);
      expect(a2.isFinished()).toBe(false);
    });
  });

  describe('animationGroup() factory function', () => {
    it('returns an AnimationGroup instance', async () => {
      const { animationGroup } = await import('./AnimationGroup');
      const a1 = createFadeIn(1);
      const group = animationGroup([a1]);
      expect(group).toBeInstanceOf(AnimationGroup);
    });

    it('passes lagRatio option', async () => {
      const { animationGroup } = await import('./AnimationGroup');
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const group = animationGroup([a1, a2], { lagRatio: 1 });
      expect(group.lagRatio).toBe(1);
      expect(group.duration).toBeCloseTo(2, 5);
    });
  });
});

describe('Succession', () => {
  describe('class', () => {
    it('creates an AnimationGroup with lagRatio=1', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const s = new Succession([a1, a2]);
      expect(s).toBeInstanceOf(AnimationGroup);
      expect(s.lagRatio).toBe(1);
    });

    it('duration is sum of all animation durations', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(2);
      const s = new Succession([a1, a2]);
      expect(s.duration).toBeCloseTo(3, 5);
    });

    it('animations play sequentially', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const s = new Succession([a1, a2]);
      s.begin();

      // At alpha=0.25, groupTime=0.5 => first at 0.5, second at 0
      s.interpolate(0.25);
      expect(a1.mobject.opacity).toBeCloseTo(0.5, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);

      // At alpha=0.75, groupTime=1.5 => first done, second at 0.5
      s.interpolate(0.75);
      expect(a1.mobject.opacity).toBeCloseTo(1, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0.5, 5);
    });

    it('works with three animations', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const a3 = createFadeIn(1);
      const s = new Succession([a1, a2, a3]);
      expect(s.duration).toBeCloseTo(3, 5);
    });

    it('empty succession has duration 0', () => {
      const s = new Succession([]);
      expect(s.duration).toBe(0);
    });
  });

  describe('succession() factory function', () => {
    it('returns an AnimationGroup with lagRatio=1', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const s = succession([a1, a2]);
      expect(s).toBeInstanceOf(AnimationGroup);
      expect(s.lagRatio).toBe(1);
    });

    it('computes correct sequential duration', () => {
      const a1 = createFadeIn(2);
      const a2 = createFadeIn(3);
      const s = succession([a1, a2]);
      expect(s.duration).toBeCloseTo(5, 5);
    });

    it('animations play in sequence', () => {
      const a1 = createFadeIn(1);
      const a2 = createFadeIn(1);
      const s = succession([a1, a2]);
      s.begin();

      // First animation at halfway
      s.interpolate(0.25);
      expect(a1.mobject.opacity).toBeCloseTo(0.5, 5);
      expect(a2.mobject.opacity).toBeCloseTo(0, 5);
    });

    it('accepts rateFunc option', () => {
      const customRate = (t: number) => t * t;
      const a1 = createFadeIn(1);
      const s = succession([a1], { rateFunc: customRate });
      expect(s.rateFunc).toBe(customRate);
    });
  });
});
