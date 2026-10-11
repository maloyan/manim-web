import { describe, it, expect } from 'vitest';
import { fAlways, always } from './Always';
import { VMobject } from '../core/VMobject';

/**
 * Tests for `fAlways` and `always` (Manim CE `f_always` / `always` parity):
 * each adds an updater that re-applies a named method of the mobject on every
 * frame tick. `fAlways` reads live getter values; `always` uses fixed args.
 */

/** Build a unit square centered at the origin; gives `getCenter` real geometry. */
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

describe('fAlways', () => {
  it('registers a single updater on the mobject', () => {
    const mob = square();
    let value = 0;
    fAlways(mob, 'setX', () => value);
    expect(mob.hasUpdaters()).toBe(true);
    expect(mob.getUpdaters()).toHaveLength(1);
  });

  it('updates the mobject from the live getter value on each tick', () => {
    const mob = square();
    let value = 0;
    fAlways(mob, 'setX', () => value);

    value = 3;
    mob.update(1 / 60);
    expect(mob.getCenter()[0]).toBeCloseTo(3, 6);

    value = -2;
    mob.update(1 / 60);
    expect(mob.getCenter()[0]).toBeCloseTo(-2, 6);
  });

  it('does not apply the method before the first tick', () => {
    const mob = square();
    fAlways(mob, 'setX', () => 5);
    // Updater registered but not yet run: center unchanged.
    expect(mob.getCenter()[0]).toBeCloseTo(0, 6);
  });

  it('passes multiple getter values as separate arguments', () => {
    const mob = square();
    let x = 1;
    let y = 2;
    fAlways(mob, 'moveTo', () => [x, y, 0]);
    x = 4;
    y = -3;
    mob.update(1 / 60);
    expect(mob.getCenter()[0]).toBeCloseTo(4, 6);
    expect(mob.getCenter()[1]).toBeCloseTo(-3, 6);
  });

  it('returns the mobject for chaining', () => {
    const mob = square();
    const result = fAlways(mob, 'setX', () => 0);
    expect(result).toBe(mob);
  });
});

describe('always', () => {
  it('registers a single updater on the mobject', () => {
    const mob = square();
    always(mob, 'setX', 2);
    expect(mob.hasUpdaters()).toBe(true);
    expect(mob.getUpdaters()).toHaveLength(1);
  });

  it('re-applies the fixed argument on each tick', () => {
    const mob = square();
    always(mob, 'setX', 2);

    // A competing change is overridden back to the fixed value every frame.
    mob.setX(10);
    expect(mob.getCenter()[0]).toBeCloseTo(10, 6);

    mob.update(1 / 60);
    expect(mob.getCenter()[0]).toBeCloseTo(2, 6);

    mob.setX(-7);
    mob.update(1 / 60);
    expect(mob.getCenter()[0]).toBeCloseTo(2, 6);
  });

  it('returns the mobject for chaining', () => {
    const mob = square();
    const result = always(mob, 'setX', 2);
    expect(result).toBe(mob);
  });
});
