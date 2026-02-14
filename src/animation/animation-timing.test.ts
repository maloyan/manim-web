import * as THREE from 'three';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Animation, AnimationOptions } from './Animation';
import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { Timeline } from './Timeline';
import { LaggedStart, laggedStart } from './LaggedStart';
import { UpdateFromFunc, updateFromFunc } from './UpdateFromFunc';
import { UpdateFromAlphaFunc, updateFromAlphaFunc } from './UpdateFromAlphaFunc';
import { maintainPositionRelativeTo } from './MaintainPositionRelativeTo';
import { MoveAlongPath, moveAlongPath } from './movement/MoveAlongPath';
import { AnimationGroup } from './AnimationGroup';
import { linear } from '../rate-functions';

/** Concrete Mobject for tests needing getCenter()/getThreeObject(). */
class ConcreteMobject extends Mobject {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Group();
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected _createCopy(): Mobject {
    return new ConcreteMobject();
  }
}

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

function anim(duration = 1): TestAnimation {
  return new TestAnimation(new Mobject(), { duration, rateFunc: linear });
}

// --- Timeline ---

describe('Timeline', () => {
  let tl: Timeline;
  beforeEach(() => {
    tl = new Timeline();
  });

  describe('empty timeline', () => {
    it('has duration 0, length 0, time 0, finished, not playing', () => {
      expect(tl.getDuration()).toBe(0);
      expect(tl.length).toBe(0);
      expect(tl.getCurrentTime()).toBe(0);
      expect(tl.isFinished()).toBe(true);
      expect(tl.isPlaying()).toBe(false);
    });
  });

  describe('position parameter resolution', () => {
    it('">" appends after previous end', () => {
      tl.add(anim(2)).add(anim(1));
      expect(tl.getDuration()).toBeCloseTo(3, 5);
      expect(tl.length).toBe(2);
    });

    it('absolute number positions at exact time', () => {
      tl.add(anim(1), 5);
      expect(tl.getDuration()).toBeCloseTo(6, 5);
    });

    it('negative absolute is clamped to 0', () => {
      tl.add(anim(1), -3);
      expect(tl.getDuration()).toBeCloseTo(1, 5);
    });

    it('"<" starts at same time as previous', () => {
      tl.add(anim(2)).add(anim(3), '<');
      expect(tl.getDuration()).toBeCloseTo(3, 5);
    });

    it('"+=N" adds gap after previous end', () => {
      tl.add(anim(1)).add(anim(1), '+=0.5');
      expect(tl.getDuration()).toBeCloseTo(2.5, 5);
    });

    it('"-=N" overlaps before previous end', () => {
      tl.add(anim(2)).add(anim(1), '-=0.5');
      expect(tl.getDuration()).toBeCloseTo(2.5, 5);
    });

    it('"-=N" clamps start to 0 when overlap too large', () => {
      tl.add(anim(1)).add(anim(1), '-=5');
      expect(tl.getDuration()).toBeCloseTo(1, 5);
    });

    it('first animation with ">" or "<" starts at 0', () => {
      tl.add(anim(1), '>');
      expect(tl.getDuration()).toBeCloseTo(1, 5);
      const tl2 = new Timeline();
      tl2.add(anim(1), '<');
      expect(tl2.getDuration()).toBeCloseTo(1, 5);
    });

    it('invalid position falls back to ">" with warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      tl.add(anim(1)).add(anim(1), 'invalid');
      expect(tl.getDuration()).toBeCloseTo(2, 5);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('"+=N" with decimals', () => {
      tl.add(anim(1)).add(anim(1), '+=1.25');
      expect(tl.getDuration()).toBeCloseTo(3.25, 5);
    });
  });

  describe('addParallel', () => {
    it('all animations share same start time, duration = max', () => {
      tl.addParallel([anim(1), anim(2), anim(1.5)]);
      expect(tl.length).toBe(3);
      expect(tl.getDuration()).toBeCloseTo(2, 5);
    });

    it('after add, starts after previous', () => {
      tl.add(anim(1));
      tl.addParallel([anim(2), anim(3)]);
      expect(tl.getDuration()).toBeCloseTo(4, 5);
    });

    it('empty parallel adds nothing', () => {
      tl.addParallel([]);
      expect(tl.length).toBe(0);
    });
  });

  describe('play / pause / reset / update / seek / clear', () => {
    it('play/pause toggles isPlaying', () => {
      tl.play();
      expect(tl.isPlaying()).toBe(true);
      tl.pause();
      expect(tl.isPlaying()).toBe(false);
    });

    it('reset clears time and stops playing', () => {
      tl.add(anim(1));
      tl.play();
      tl.update(0.5);
      tl.reset();
      expect(tl.getCurrentTime()).toBe(0);
      expect(tl.isPlaying()).toBe(false);
    });

    it('update does nothing when not playing', () => {
      tl.add(anim(1));
      tl.update(0.5);
      expect(tl.getCurrentTime()).toBe(0);
    });

    it('update advances time and clamps to duration', () => {
      tl.add(anim(2));
      tl.play();
      tl.update(0.5);
      expect(tl.getCurrentTime()).toBeCloseTo(0.5, 5);
      tl.update(10);
      expect(tl.getCurrentTime()).toBeCloseTo(2, 5);
      expect(tl.isPlaying()).toBe(false);
    });

    it('seek clamps to [0, duration]', () => {
      tl.add(anim(2));
      tl.seek(-5);
      expect(tl.getCurrentTime()).toBe(0);
      tl.seek(10);
      expect(tl.getCurrentTime()).toBeCloseTo(2, 5);
      tl.seek(1.5);
      expect(tl.getCurrentTime()).toBeCloseTo(1.5, 5);
    });

    it('clear removes everything', () => {
      tl.add(anim(1));
      tl.play();
      tl.update(0.5);
      tl.clear();
      expect(tl.length).toBe(0);
      expect(tl.getDuration()).toBe(0);
      expect(tl.getCurrentTime()).toBe(0);
      expect(tl.isPlaying()).toBe(false);
    });
  });

  describe('chaining', () => {
    it('all mutating methods return this', () => {
      expect(tl.add(anim(1))).toBe(tl);
      expect(tl.addParallel([])).toBe(tl);
      expect(tl.seek(0)).toBe(tl);
      expect(tl.play()).toBe(tl);
      expect(tl.pause()).toBe(tl);
      expect(tl.reset()).toBe(tl);
      expect(tl.clear()).toBe(tl);
    });
  });
});

// --- LaggedStart ---

describe('LaggedStart', () => {
  it('defaults lagRatio to 0.2 and is AnimationGroup', () => {
    const ls = new LaggedStart([anim(1), anim(1)]);
    expect(ls).toBeInstanceOf(AnimationGroup);
    expect(ls.lagRatio).toBe(0.2);
  });

  it('accepts custom lagRatio', () => {
    const ls = new LaggedStart([anim(1), anim(1)], { lagRatio: 0.5 });
    expect(ls.lagRatio).toBe(0.5);
  });

  it('computes staggered duration (3 anims, lag 0.2)', () => {
    const ls = new LaggedStart([anim(1), anim(1), anim(1)]);
    expect(ls.duration).toBeCloseTo(1.4, 5);
  });

  it('computes duration (2 anims, lag 0.5)', () => {
    const ls = new LaggedStart([anim(1), anim(1)], { lagRatio: 0.5 });
    expect(ls.duration).toBeCloseTo(1.5, 5);
  });

  it('empty LaggedStart has duration 0', () => {
    expect(new LaggedStart([]).duration).toBe(0);
  });

  describe('laggedStart factory', () => {
    it('returns AnimationGroup with lagRatio 0.2 by default', () => {
      const g = laggedStart([anim(1)]);
      expect(g).toBeInstanceOf(AnimationGroup);
      expect(g.lagRatio).toBe(0.2);
    });

    it('accepts custom lagRatio and computes duration', () => {
      const g = laggedStart([anim(2), anim(2)], { lagRatio: 0.7 });
      expect(g.lagRatio).toBe(0.7);
    });

    it('computes correct duration (2 anims dur 2, lag 0.2)', () => {
      const g = laggedStart([anim(2), anim(2)]);
      expect(g.duration).toBeCloseTo(2.4, 5);
    });
  });

  it('interpolation: alpha 0 and 1 reach start and end', () => {
    const a1 = anim(1);
    const a2 = anim(1);
    const ls = new LaggedStart([a1, a2], { lagRatio: 0.5 });
    ls.begin();
    ls.interpolate(0);
    expect(a1.lastAlpha).toBeCloseTo(0, 5);
    expect(a2.lastAlpha).toBeCloseTo(0, 5);
    ls.interpolate(1);
    expect(a1.lastAlpha).toBeCloseTo(1, 5);
    expect(a2.lastAlpha).toBeCloseTo(1, 5);
  });
});

// --- UpdateFromFunc ---

describe('UpdateFromFunc', () => {
  it('calls function with mobject and alpha', () => {
    const mob = new Mobject();
    const fn = vi.fn();
    new UpdateFromFunc(mob, fn).interpolate(0.5);
    expect(fn).toHaveBeenCalledWith(mob, 0.5);
  });

  it('calls at boundary alphas 0 and 1', () => {
    const mob = new Mobject();
    const fn = vi.fn();
    const a = new UpdateFromFunc(mob, fn);
    a.interpolate(0);
    expect(fn).toHaveBeenCalledWith(mob, 0);
    a.interpolate(1);
    expect(fn).toHaveBeenCalledWith(mob, 1);
  });

  it('modifies mobject through function', () => {
    const mob = new Mobject();
    const a = new UpdateFromFunc(mob, (m, alpha) => m.position.set(alpha * 10, 0, 0));
    a.interpolate(0.3);
    expect(mob.position.x).toBeCloseTo(3, 5);
    a.interpolate(1);
    expect(mob.position.x).toBeCloseTo(10, 5);
  });

  it('tracks calls with increasing alpha', () => {
    const alphas: number[] = [];
    const a = new UpdateFromFunc(new Mobject(), (_m, alpha) => alphas.push(alpha));
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => a.interpolate(v));
    expect(alphas).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('respects custom duration and rateFunc', () => {
    const a = new UpdateFromFunc(new Mobject(), vi.fn(), { duration: 5, rateFunc: linear });
    expect(a.duration).toBe(5);
    expect(a.rateFunc).toBe(linear);
  });

  it('factory returns instance and passes options', () => {
    const a = updateFromFunc(new Mobject(), vi.fn(), { duration: 3 });
    expect(a).toBeInstanceOf(UpdateFromFunc);
    expect(a.duration).toBe(3);
  });
});

// --- UpdateFromAlphaFunc ---

describe('UpdateFromAlphaFunc', () => {
  it('calls function with mobject and alpha', () => {
    const mob = new Mobject();
    const fn = vi.fn();
    new UpdateFromAlphaFunc(mob, fn).interpolate(0.7);
    expect(fn).toHaveBeenCalledWith(mob, 0.7);
  });

  it('applies side effects to mobject', () => {
    const mob = new Mobject();
    new UpdateFromAlphaFunc(mob, (m, a) => m.position.set(0, a * 5, 0)).interpolate(0.4);
    expect(mob.position.y).toBeCloseTo(2, 5);
  });

  it('receives rate-function-adjusted alpha via update()', () => {
    const received: number[] = [];
    const customRate = (t: number) => t * t;
    const a = new UpdateFromAlphaFunc(new Mobject(), (_m, alpha) => received.push(alpha), {
      duration: 1,
      rateFunc: customRate,
    });
    a.update(0, 0); // rawAlpha=0, rate(0)=0
    a.update(0, 0.5); // rawAlpha=0.5, rate(0.5)=0.25
    expect(received[0]).toBeCloseTo(0, 5);
    expect(received[1]).toBeCloseTo(0.25, 5);
  });

  it('factory returns instance and passes options', () => {
    const a = updateFromAlphaFunc(new Mobject(), vi.fn(), { duration: 4 });
    expect(a).toBeInstanceOf(UpdateFromAlphaFunc);
    expect(a.duration).toBe(4);
  });
});

// --- MaintainPositionRelativeTo ---

describe('maintainPositionRelativeTo', () => {
  it('computes initial offset and applies it when leader moves', () => {
    const follower = new Mobject();
    const leader = new Mobject();
    follower.position.set(3, 0, 0);
    leader.position.set(1, 0, 0);
    const updater = maintainPositionRelativeTo(follower, leader);
    leader.position.set(5, 0, 0);
    updater(follower, 0);
    expect(follower.position.x).toBeCloseTo(7, 5);
    expect(follower.position.y).toBeCloseTo(0, 5);
  });

  it('preserves 3D offset', () => {
    const follower = new Mobject();
    const leader = new Mobject();
    follower.position.set(1, 2, 3);
    const updater = maintainPositionRelativeTo(follower, leader);
    leader.position.set(10, 20, 30);
    updater(follower, 0.016);
    expect(follower.position.x).toBeCloseTo(11, 5);
    expect(follower.position.y).toBeCloseTo(22, 5);
    expect(follower.position.z).toBeCloseTo(33, 5);
  });

  it('works with zero offset (both at origin)', () => {
    const follower = new Mobject();
    const leader = new Mobject();
    const updater = maintainPositionRelativeTo(follower, leader);
    leader.position.set(5, 5, 5);
    updater(follower, 0);
    expect(follower.position.x).toBeCloseTo(5, 5);
    expect(follower.position.y).toBeCloseTo(5, 5);
    expect(follower.position.z).toBeCloseTo(5, 5);
  });

  it('maintains offset across multiple updates', () => {
    const follower = new Mobject();
    const leader = new Mobject();
    follower.position.set(2, 0, 0);
    const updater = maintainPositionRelativeTo(follower, leader);

    leader.position.set(1, 0, 0);
    updater(follower, 0.016);
    expect(follower.position.x).toBeCloseTo(3, 5);

    leader.position.set(10, 0, 0);
    updater(follower, 0.016);
    expect(follower.position.x).toBeCloseTo(12, 5);

    leader.position.set(-5, 0, 0);
    updater(follower, 0.016);
    expect(follower.position.x).toBeCloseTo(-3, 5);
  });

  it('can be used with addUpdater', () => {
    const follower = new Mobject();
    const leader = new Mobject();
    follower.addUpdater(maintainPositionRelativeTo(follower, leader));
    expect(follower.hasUpdaters()).toBe(true);
    expect(follower.getUpdaters()).toHaveLength(1);
  });
});

// --- MoveAlongPath ---

describe('MoveAlongPath', () => {
  function straightPath(): VMobject {
    const p = new VMobject();
    p.setPoints([
      [0, 0, 0],
      [10 / 3, 0, 0],
      [20 / 3, 0, 0],
      [10, 0, 0],
    ]);
    return p;
  }

  function twoSegPath(): VMobject {
    const p = new VMobject();
    p.setPoints([
      [0, 0, 0],
      [5 / 3, 5 / 3, 0],
      [10 / 3, 10 / 3, 0],
      [5, 5, 0],
      [20 / 3, 10 / 3, 0],
      [25 / 3, 5 / 3, 0],
      [10, 0, 0],
    ]);
    return p;
  }

  it('stores path and rotateAlongPath from options', () => {
    const path = straightPath();
    const a = new MoveAlongPath(new Mobject(), { path, rotateAlongPath: true });
    expect(a.path).toBe(path);
    expect(a.rotateAlongPath).toBe(true);
  });

  it('rotateAlongPath defaults to false', () => {
    expect(new MoveAlongPath(new Mobject(), { path: straightPath() }).rotateAlongPath).toBe(false);
  });

  it('moves along straight path at alpha 0, 0.5, 1', () => {
    const mob = new ConcreteMobject();
    const a = new MoveAlongPath(mob, { path: straightPath(), rateFunc: linear });
    a.begin();
    a.interpolate(0);
    expect(mob.position.x).toBeCloseTo(0, 1);
    a.interpolate(0.5);
    expect(mob.position.x).toBeCloseTo(5, 1);
    expect(mob.position.y).toBeCloseTo(0, 1);
    a.interpolate(1);
    expect(mob.position.x).toBeCloseTo(10, 1);
  });

  it('works with two-segment path', () => {
    const mob = new ConcreteMobject();
    const a = new MoveAlongPath(mob, { path: twoSegPath(), rateFunc: linear });
    a.begin();
    a.interpolate(0);
    expect(mob.position.x).toBeCloseTo(0, 1);
    a.interpolate(0.5);
    expect(mob.position.x).toBeCloseTo(5, 1);
    expect(mob.position.y).toBeCloseTo(5, 1);
    a.interpolate(1);
    expect(mob.position.x).toBeCloseTo(10, 1);
    expect(mob.position.y).toBeCloseTo(0, 1);
  });

  it('finish sets position to path end', () => {
    const mob = new ConcreteMobject();
    const a = new MoveAlongPath(mob, { path: straightPath(), rateFunc: linear });
    a.begin();
    a.finish();
    expect(mob.position.x).toBeCloseTo(10, 1);
  });

  it('handles path with fewer than 4 points without throwing', () => {
    const mob = new ConcreteMobject();
    const p = new VMobject();
    p.setPoints([
      [0, 0, 0],
      [1, 1, 0],
    ]);
    const a = new MoveAlongPath(mob, { path: p, rateFunc: linear });
    a.begin();
    expect(() => a.interpolate(0.5)).not.toThrow();
  });

  describe('moveAlongPath factory', () => {
    it('returns MoveAlongPath with correct options', () => {
      const a = moveAlongPath(new Mobject(), straightPath(), {
        duration: 3,
        rotateAlongPath: true,
      });
      expect(a).toBeInstanceOf(MoveAlongPath);
      expect(a.duration).toBe(3);
      expect(a.rotateAlongPath).toBe(true);
    });
  });
});
