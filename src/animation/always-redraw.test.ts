import { describe, it, expect } from 'vitest';
import { alwaysRedraw } from './AlwaysRedraw';
import { VMobject } from '../core/VMobject';

/**
 * Tests for `alwaysRedraw` (Manim CE `always_redraw` parity): the returned
 * mobject rebuilds itself from the factory on every frame tick via `become`.
 */

/** Build a square of the given half-size, centered at the origin. */
function square(halfSize: number): VMobject {
  const vm = new VMobject();
  vm.setPoints([
    [-halfSize, -halfSize, 0],
    [halfSize, -halfSize, 0],
    [halfSize, halfSize, 0],
    [-halfSize, halfSize, 0],
  ]);
  return vm;
}

describe('alwaysRedraw', () => {
  it('calls the factory once and returns its mobject', () => {
    let calls = 0;
    const mob = alwaysRedraw(() => {
      calls += 1;
      return square(1);
    });
    expect(calls).toBe(1);
    // Same geometry as a directly-built reference square.
    expect(mob.getWidth()).toBeCloseTo(square(1).getWidth(), 6);
  });

  it('registers a single updater on the mobject', () => {
    const mob = alwaysRedraw(() => square(1));
    expect(mob.hasUpdaters()).toBe(true);
    expect(mob.getUpdaters()).toHaveLength(1);
  });

  it('rebuilds the mobject on each frame tick', () => {
    let half = 1;
    const mob = alwaysRedraw(() => square(half));
    const unit = mob.getWidth(); // rendered width for half = 1

    half = 3;
    mob.update(1 / 60);
    expect(mob.getWidth()).toBeCloseTo(unit * 3, 6);

    half = 0.5;
    mob.update(1 / 60);
    expect(mob.getWidth()).toBeCloseTo(unit * 0.5, 6);
  });

  it('calls the factory again for every tick', () => {
    let calls = 0;
    const mob = alwaysRedraw(() => {
      calls += 1;
      return square(1);
    });
    expect(calls).toBe(1);
    mob.update(1 / 60);
    mob.update(1 / 60);
    expect(calls).toBe(3); // 1 initial + 2 ticks
  });
});
