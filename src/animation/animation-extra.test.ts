import { describe, it, expect, vi } from 'vitest';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { Animation, AnimationOptions } from './Animation';
import { MoveAlongPath } from './movement/MoveAlongPath';
import { AnimationGroup } from './AnimationGroup';
import { laggedStart, LaggedStart } from './LaggedStart';
import { UpdateFromAlphaFunc, updateFromAlphaFunc } from './UpdateFromAlphaFunc';
import { UpdateFromFunc, updateFromFunc } from './UpdateFromFunc';
import { maintainPositionRelativeTo } from './MaintainPositionRelativeTo';
import { Timeline } from './Timeline';
import { laggedStartMap, LaggedStartMap } from './composition/LaggedStartMap';
import { linear } from '../rate-functions';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

class TestAnimation extends Animation {
  lastAlpha: number | null = null;
  constructor(mobject: Mobject, options?: AnimationOptions) {
    super(mobject, options);
  }
  interpolate(alpha: number): void {
    this.lastAlpha = alpha;
  }
}

function makeMob(): Mobject {
  return new Mobject();
}

function makeAnim(duration = 1): TestAnimation {
  return new TestAnimation(makeMob(), { duration, rateFunc: linear });
}

// ---------------------------------------------------------------------------
// 1. LaggedStart
// ---------------------------------------------------------------------------

describe('LaggedStart', () => {
  it('laggedStart factory creates AnimationGroup with lagRatio=0.2 by default', () => {
    const a1 = makeAnim();
    const a2 = makeAnim();
    const group = laggedStart([a1, a2]);
    expect(group).toBeInstanceOf(AnimationGroup);
    expect(group.lagRatio).toBeCloseTo(0.2);
  });

  it('laggedStart factory uses custom lagRatio', () => {
    const group = laggedStart([makeAnim(), makeAnim()], { lagRatio: 0.5 });
    expect(group.lagRatio).toBeCloseTo(0.5);
  });

  it('LaggedStart class creates group with lagRatio=0.2 by default', () => {
    const group = new LaggedStart([makeAnim(), makeAnim()]);
    expect(group).toBeInstanceOf(AnimationGroup);
    expect(group.lagRatio).toBeCloseTo(0.2);
  });

  it('LaggedStart class uses custom lagRatio', () => {
    const group = new LaggedStart([makeAnim()], { lagRatio: 0.7 });
    expect(group.lagRatio).toBeCloseTo(0.7);
  });

  it('works with empty array', () => {
    const group = laggedStart([]);
    expect(group.duration).toBe(0);
    expect(group.lagRatio).toBeCloseTo(0.2);
  });

  it('computes correct staggered duration', () => {
    // 3 anims of 1s each, lagRatio=0.2
    // anim0: 0..1, anim1: 0.2..1.2, anim2: 0.4..1.4
    const group = laggedStart([makeAnim(), makeAnim(), makeAnim()]);
    expect(group.duration).toBeCloseTo(1.4, 5);
  });
});

// ---------------------------------------------------------------------------
// 2. UpdateFromAlphaFunc
// ---------------------------------------------------------------------------

describe('UpdateFromAlphaFunc', () => {
  it('constructor stores mobject and func', () => {
    const mob = makeMob();
    const fn = vi.fn();
    const anim = new UpdateFromAlphaFunc(mob, fn);
    expect(anim.mobject).toBe(mob);
  });

  it('interpolate calls func with (mobject, alpha)', () => {
    const mob = makeMob();
    const fn = vi.fn();
    const anim = new UpdateFromAlphaFunc(mob, fn);
    anim.interpolate(0.5);
    expect(fn).toHaveBeenCalledWith(mob, 0.5);
  });

  it('updateFromAlphaFunc factory creates correct instance', () => {
    const mob = makeMob();
    const fn = vi.fn();
    const anim = updateFromAlphaFunc(mob, fn);
    expect(anim).toBeInstanceOf(UpdateFromAlphaFunc);
    expect(anim.mobject).toBe(mob);
  });

  it('factory passes options through', () => {
    const anim = updateFromAlphaFunc(makeMob(), vi.fn(), { duration: 3 });
    expect(anim.duration).toBe(3);
  });

  it('multiple interpolate calls track alpha values', () => {
    const alphas: number[] = [];
    const fn = (_m: Mobject, a: number) => alphas.push(a);
    const anim = new UpdateFromAlphaFunc(makeMob(), fn);

    anim.interpolate(0);
    anim.interpolate(0.25);
    anim.interpolate(0.5);
    anim.interpolate(1);
    expect(alphas).toEqual([0, 0.25, 0.5, 1]);
  });
});

// ---------------------------------------------------------------------------
// 3. UpdateFromFunc
// ---------------------------------------------------------------------------

describe('UpdateFromFunc', () => {
  it('constructor stores mobject and func', () => {
    const mob = makeMob();
    const fn = vi.fn();
    const anim = new UpdateFromFunc(mob, fn);
    expect(anim.mobject).toBe(mob);
  });

  it('interpolate calls func with (mobject, alpha)', () => {
    const mob = makeMob();
    const fn = vi.fn();
    const anim = new UpdateFromFunc(mob, fn);
    anim.interpolate(0.75);
    expect(fn).toHaveBeenCalledWith(mob, 0.75);
  });

  it('updateFromFunc factory creates correct instance', () => {
    const mob = makeMob();
    const fn = vi.fn();
    const anim = updateFromFunc(mob, fn);
    expect(anim).toBeInstanceOf(UpdateFromFunc);
    expect(anim.mobject).toBe(mob);
  });

  it('factory passes options through', () => {
    const anim = updateFromFunc(makeMob(), vi.fn(), { duration: 5 });
    expect(anim.duration).toBe(5);
  });

  it('multiple interpolate calls track alpha values', () => {
    const alphas: number[] = [];
    const fn = (_m: Mobject, a: number) => alphas.push(a);
    const anim = new UpdateFromFunc(makeMob(), fn);

    anim.interpolate(0);
    anim.interpolate(0.33);
    anim.interpolate(0.66);
    anim.interpolate(1);
    expect(alphas).toEqual([0, 0.33, 0.66, 1]);
  });
});

// ---------------------------------------------------------------------------
// 4. MaintainPositionRelativeTo
// ---------------------------------------------------------------------------

describe('MaintainPositionRelativeTo', () => {
  it('captures initial offset between mobject and target', () => {
    const mob = makeMob();
    const target = makeMob();
    mob.moveTo([3, 2, 0]);
    target.moveTo([1, 1, 0]);

    const updater = maintainPositionRelativeTo(mob, target);
    // Move target, then call updater
    target.moveTo([5, 5, 0]);
    updater(mob, 0);

    // mob should be at target + offset(2,1,0)
    expect(mob.position.x).toBeCloseTo(7);
    expect(mob.position.y).toBeCloseTo(6);
    expect(mob.position.z).toBeCloseTo(0);
  });

  it('moves mobject when target moves', () => {
    const mob = makeMob();
    const target = makeMob();
    mob.moveTo([1, 0, 0]);
    target.moveTo([0, 0, 0]);

    const updater = maintainPositionRelativeTo(mob, target);

    target.moveTo([10, 10, 0]);
    updater(mob, 0);
    expect(mob.position.x).toBeCloseTo(11);
    expect(mob.position.y).toBeCloseTo(10);
  });

  it('zero offset when both at same position', () => {
    const mob = makeMob();
    const target = makeMob();
    mob.moveTo([0, 0, 0]);
    target.moveTo([0, 0, 0]);

    const updater = maintainPositionRelativeTo(mob, target);
    target.moveTo([5, -3, 2]);
    updater(mob, 0);

    expect(mob.position.x).toBeCloseTo(5);
    expect(mob.position.y).toBeCloseTo(-3);
    expect(mob.position.z).toBeCloseTo(2);
  });

  it('3D offset works correctly', () => {
    const mob = makeMob();
    const target = makeMob();
    mob.moveTo([1, 2, 3]);
    target.moveTo([0, 0, 0]);

    const updater = maintainPositionRelativeTo(mob, target);
    target.moveTo([10, 20, 30]);
    updater(mob, 0);

    expect(mob.position.x).toBeCloseTo(11);
    expect(mob.position.y).toBeCloseTo(22);
    expect(mob.position.z).toBeCloseTo(33);
  });
});

// ---------------------------------------------------------------------------
// 5. Timeline
// ---------------------------------------------------------------------------

describe('Timeline', () => {
  describe('empty timeline', () => {
    it('has duration 0', () => {
      const tl = new Timeline();
      expect(tl.getDuration()).toBe(0);
    });

    it('getCurrentTime starts at 0', () => {
      expect(new Timeline().getCurrentTime()).toBe(0);
    });

    it('length is 0', () => {
      expect(new Timeline().length).toBe(0);
    });

    it('isFinished is true (0 >= 0)', () => {
      expect(new Timeline().isFinished()).toBe(true);
    });
  });

  describe('add() positioning', () => {
    it('">" chains sequentially (default)', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1)); // 0..1
      tl.add(makeAnim(2)); // 1..3
      expect(tl.getDuration()).toBeCloseTo(3);
      expect(tl.length).toBe(2);
    });

    it('"<" starts at same time as previous', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1)); // 0..1
      tl.add(makeAnim(2), '<'); // 0..2
      expect(tl.getDuration()).toBeCloseTo(2);
    });

    it('absolute number positions correctly', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1), 5); // 5..6
      expect(tl.getDuration()).toBeCloseTo(6);
    });

    it('"+=N" adds gap', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1)); // 0..1
      tl.add(makeAnim(1), '+=0.5'); // 1.5..2.5
      expect(tl.getDuration()).toBeCloseTo(2.5);
    });

    it('"-=N" overlaps', () => {
      const tl = new Timeline();
      tl.add(makeAnim(2)); // 0..2
      tl.add(makeAnim(1), '-=0.5'); // 1.5..2.5
      expect(tl.getDuration()).toBeCloseTo(2.5);
    });

    it('negative absolute time clamps to 0', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1), -5); // clamped to 0..1
      expect(tl.getDuration()).toBeCloseTo(1);
    });
  });

  describe('addParallel()', () => {
    it('starts all at same time', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1)); // 0..1 (sets lastEnd = 1)
      tl.addParallel([makeAnim(2), makeAnim(3)]); // both start at 1
      // longest ends at 1+3=4
      expect(tl.getDuration()).toBeCloseTo(4);
      expect(tl.length).toBe(3);
    });
  });

  describe('playback controls', () => {
    it('play()/pause() toggles isPlaying', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1));
      expect(tl.isPlaying()).toBe(false);
      tl.play();
      expect(tl.isPlaying()).toBe(true);
      tl.pause();
      expect(tl.isPlaying()).toBe(false);
    });

    it('seek() moves to correct time', () => {
      const tl = new Timeline();
      tl.add(makeAnim(2));
      tl.seek(1);
      expect(tl.getCurrentTime()).toBeCloseTo(1);
    });

    it('seek() clamps to [0, duration]', () => {
      const tl = new Timeline();
      tl.add(makeAnim(2));
      tl.seek(10);
      expect(tl.getCurrentTime()).toBeCloseTo(2);
      tl.seek(-5);
      expect(tl.getCurrentTime()).toBeCloseTo(0);
    });

    it('reset() returns to beginning', () => {
      const tl = new Timeline();
      tl.add(makeAnim(2));
      tl.play();
      tl.update(1);
      tl.reset();
      expect(tl.getCurrentTime()).toBe(0);
      expect(tl.isPlaying()).toBe(false);
    });
  });

  describe('update()', () => {
    it('advances time when playing', () => {
      const tl = new Timeline();
      tl.add(makeAnim(2));
      tl.play();
      tl.update(0.5);
      expect(tl.getCurrentTime()).toBeCloseTo(0.5);
    });

    it('stops at end of duration', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1));
      tl.play();
      tl.update(5);
      expect(tl.getCurrentTime()).toBeCloseTo(1);
      expect(tl.isPlaying()).toBe(false);
    });

    it('does nothing when paused', () => {
      const tl = new Timeline();
      tl.add(makeAnim(2));
      // Not playing by default
      tl.update(1);
      expect(tl.getCurrentTime()).toBe(0);
    });
  });

  describe('isFinished()', () => {
    it('returns true when past duration', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1));
      tl.play();
      tl.update(2);
      expect(tl.isFinished()).toBe(true);
    });

    it('returns false when in progress', () => {
      const tl = new Timeline();
      tl.add(makeAnim(2));
      tl.play();
      tl.update(0.5);
      expect(tl.isFinished()).toBe(false);
    });
  });

  describe('clear()', () => {
    it('removes everything', () => {
      const tl = new Timeline();
      tl.add(makeAnim(1));
      tl.add(makeAnim(2));
      tl.clear();
      expect(tl.length).toBe(0);
      expect(tl.getDuration()).toBe(0);
      expect(tl.getCurrentTime()).toBe(0);
    });
  });

  describe('invalid position', () => {
    it('warns and defaults to ">"', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const tl = new Timeline();
      tl.add(makeAnim(1)); // 0..1
      tl.add(makeAnim(1), 'invalid'); // should behave like ">" => 1..2
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid position'));
      expect(tl.getDuration()).toBeCloseTo(2);
      warnSpy.mockRestore();
    });
  });
});

// ---------------------------------------------------------------------------
// 6. LaggedStartMap
// ---------------------------------------------------------------------------

describe('LaggedStartMap', () => {
  it('laggedStartMap factory creates group with lagRatio=0.2 default', () => {
    const m1 = makeMob();
    const m2 = makeMob();
    const group = laggedStartMap(TestAnimation, [m1, m2]);
    expect(group).toBeInstanceOf(AnimationGroup);
    expect(group.lagRatio).toBeCloseTo(0.2);
    expect(group.animations.length).toBe(2);
  });

  it('custom lagRatio', () => {
    const group = laggedStartMap(TestAnimation, [makeMob()], {
      lagRatio: 0.6,
    });
    expect(group.lagRatio).toBeCloseTo(0.6);
  });

  it('animOptions passed to each animation', () => {
    const m1 = makeMob();
    const m2 = makeMob();
    const group = laggedStartMap(TestAnimation, [m1, m2], {
      animOptions: { duration: 3 },
    });
    for (const anim of group.animations) {
      expect(anim.duration).toBe(3);
    }
  });

  it('LaggedStartMap class works', () => {
    const group = new LaggedStartMap(TestAnimation, [makeMob(), makeMob()]);
    expect(group).toBeInstanceOf(AnimationGroup);
    expect(group.lagRatio).toBeCloseTo(0.2);
    expect(group.animations.length).toBe(2);
  });

  it('LaggedStartMap class with custom options', () => {
    const group = new LaggedStartMap(TestAnimation, [makeMob()], {
      lagRatio: 0.9,
      animOptions: { duration: 2 },
    });
    expect(group.lagRatio).toBeCloseTo(0.9);
    expect(group.animations[0].duration).toBe(2);
  });

  it('empty mobjects array', () => {
    const group = laggedStartMap(TestAnimation, []);
    expect(group.animations.length).toBe(0);
    expect(group.duration).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// MoveAlongPath - rotateAlongPath
// ---------------------------------------------------------------------------
describe('MoveAlongPath rotateAlongPath', () => {
  it('sets rotation to tangent direction when rotateAlongPath is true', () => {
    const path = new VMobject();
    // Horizontal line from (0,0,0) to (4,0,0)
    path.setPoints([
      [0, 0, 0],
      [1, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
    ]);
    const mob = new VMobject();
    const anim = new MoveAlongPath(mob, { path, rotateAlongPath: true });
    anim.begin();
    anim.interpolate(0.5);
    // Tangent along x-axis => angle ~ 0
    expect(mob.rotation.z).toBeCloseTo(0, 3);
  });

  it('sets rotation for angled path', () => {
    const path = new VMobject();
    // Diagonal line from (0,0,0) to (4,4,0) via bezier
    path.setPoints([
      [0, 0, 0],
      [1, 1, 0],
      [3, 3, 0],
      [4, 4, 0],
    ]);
    const mob = new VMobject();
    const anim = new MoveAlongPath(mob, { path, rotateAlongPath: true });
    anim.begin();
    anim.interpolate(0.5);
    // Tangent at 45 degrees => rotation.z ~ PI/4
    expect(mob.rotation.z).toBeCloseTo(Math.PI / 4, 2);
  });
});
