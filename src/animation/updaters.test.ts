import { describe, it, expect } from 'vitest';
import { alwaysShift, alwaysRotate, turnAnimationIntoUpdater, cycleAnimation } from './updaters';
import { Animation, type AnimationOptions } from './Animation';
import { Mobject, RIGHT, UP } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { linear } from '../rate-functions';

/**
 * Tests for the continuous updater helpers (Manim CE `mobject_update_utils`
 * parity). Every helper installs a `dt`-based updater, so each test drives it
 * with explicit `mob.update(dt)` ticks, as in always-redraw.test.ts.
 */

/** Build a unit square centered at the origin. */
function square(): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [-1, -1, 0],
    [1, -1, 0],
    [1, 1, 0],
    [-1, 1, 0],
  ]);
  return vm;
}

/** A minimal linear animation that drives the mobject's x from 0 to 1. */
class MoveX extends Animation {
  constructor(mobject: Mobject, options: AnimationOptions = {}) {
    super(mobject, { rateFunc: linear, duration: 1, ...options });
  }
  interpolate(alpha: number): void {
    this.mobject.setX(alpha);
  }
}

describe('alwaysShift', () => {
  it('registers a single dt-based updater', () => {
    const mob = square();
    alwaysShift(mob, RIGHT, 5);
    expect(mob.hasUpdaters()).toBe(true);
    expect(mob.getUpdaters()).toHaveLength(1);
  });

  it('shifts the mobject by rate * dt each tick', () => {
    const mob = square();
    alwaysShift(mob, RIGHT, 5);
    mob.update(0.1); // 5 * 0.1 = 0.5
    expect(mob.getCenter()[0]).toBeCloseTo(0.5, 6);
    mob.update(0.1);
    expect(mob.getCenter()[0]).toBeCloseTo(1.0, 6);
  });

  it('normalizes the direction (magnitude does not matter)', () => {
    const mob = square();
    alwaysShift(mob, [0, 10, 0], 2); // non-unit direction, points +Y
    mob.update(0.5); // 2 * 0.5 = 1.0 along unit +Y
    expect(mob.getCenter()[0]).toBeCloseTo(0, 6);
    expect(mob.getCenter()[1]).toBeCloseTo(1.0, 6);
  });

  it('defaults to RIGHT at rate 0.1', () => {
    const mob = square();
    alwaysShift(mob);
    mob.update(1); // 0.1 * 1 along +X
    expect(mob.getCenter()[0]).toBeCloseTo(0.1, 6);
  });

  it('returns the mobject for chaining', () => {
    const mob = square();
    expect(alwaysShift(mob, UP, 1)).toBe(mob);
  });
});

describe('alwaysRotate', () => {
  it('registers a single dt-based updater', () => {
    const mob = square();
    alwaysRotate(mob, Math.PI / 2);
    expect(mob.hasUpdaters()).toBe(true);
    expect(mob.getUpdaters()).toHaveLength(1);
  });

  it('rotates the mobject by rate * dt each tick', () => {
    const mob = square();
    alwaysRotate(mob, Math.PI / 2);
    mob.update(0.5); // PI/2 * 0.5 = PI/4
    expect(mob.rotation.z).toBeCloseTo(Math.PI / 4, 6);
    mob.update(0.5); // cumulative PI/2
    expect(mob.rotation.z).toBeCloseTo(Math.PI / 2, 6);
  });

  it('does not change orientation before the first tick', () => {
    const mob = square();
    alwaysRotate(mob, Math.PI);
    expect(mob.rotation.z).toBeCloseTo(0, 6);
  });

  it('returns the mobject for chaining', () => {
    const mob = square();
    expect(alwaysRotate(mob, 1)).toBe(mob);
  });
});

describe('turnAnimationIntoUpdater', () => {
  it('returns the animation mobject and installs one updater', () => {
    const mob = square();
    const result = turnAnimationIntoUpdater(new MoveX(mob));
    expect(result).toBe(mob);
    expect(mob.getUpdaters()).toHaveLength(1);
  });

  it('advances the animation to completion over ticks, then stops', () => {
    const mob = square();
    turnAnimationIntoUpdater(new MoveX(mob));

    mob.update(0.5); // timeRatio 0 -> x 0, totalTime -> 0.5
    expect(mob.getCenter()[0]).toBeCloseTo(0, 6);

    mob.update(0.5); // timeRatio 0.5 -> x 0.5, totalTime -> 1.0
    expect(mob.getCenter()[0]).toBeCloseTo(0.5, 6);

    mob.update(0.5); // timeRatio 1.0 -> snap to x 1, finish, remove updater
    expect(mob.getCenter()[0]).toBeCloseTo(1, 6);
    expect(mob.hasUpdaters()).toBe(false);

    // Further ticks do nothing: the updater is gone.
    mob.update(10);
    expect(mob.getCenter()[0]).toBeCloseTo(1, 6);
  });

  it('respects the delay before starting', () => {
    const mob = square();
    turnAnimationIntoUpdater(new MoveX(mob), false, 1);

    mob.update(0.5); // totalTime -1 still negative, -> -0.5: no interpolate
    expect(mob.getCenter()[0]).toBeCloseTo(0, 6);
    expect(mob.hasUpdaters()).toBe(true);

    mob.update(0.5); // totalTime -0.5 still negative, -> 0.0: no interpolate
    expect(mob.getCenter()[0]).toBeCloseTo(0, 6);

    mob.update(0.5); // totalTime 0.0 -> interpolate(0) -> x 0, -> 0.5
    expect(mob.getCenter()[0]).toBeCloseTo(0, 6);

    mob.update(0.5); // timeRatio 0.5 -> x 0.5, -> 1.0
    expect(mob.getCenter()[0]).toBeCloseTo(0.5, 6);
  });

  it('snaps to the final state and detaches for zero-duration animations', () => {
    const mob = square();
    turnAnimationIntoUpdater(new MoveX(mob, { duration: 0 }));
    mob.update(0.1);
    expect(mob.getCenter()[0]).toBeCloseTo(1, 6);
    expect(mob.hasUpdaters()).toBe(false);
  });
});

describe('cycleAnimation', () => {
  it('loops forever and never removes its updater', () => {
    const mob = square();
    const result = cycleAnimation(new MoveX(mob));
    expect(result).toBe(mob);

    mob.update(0.5); // timeRatio 0 -> x 0, totalTime 0.5
    mob.update(1.0); // timeRatio 0.5 -> x 0.5, totalTime 1.5
    expect(mob.getCenter()[0]).toBeCloseTo(0.5, 6);

    mob.update(0); // timeRatio 1.5 % 1 = 0.5 -> x 0.5
    expect(mob.getCenter()[0]).toBeCloseTo(0.5, 6);

    // Still looping after passing full cycles.
    mob.update(1.0); // totalTime 2.5 -> timeRatio 2.5 % 1 = 0.5
    expect(mob.getCenter()[0]).toBeCloseTo(0.5, 6);
    expect(mob.hasUpdaters()).toBe(true);
  });
});
