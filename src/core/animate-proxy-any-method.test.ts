import { describe, it, expect } from 'vitest';
import { Square } from '../mobjects/geometry';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';
import { linear } from '../rate-functions';
import { AnimateProxy } from './AnimateProxy';

describe('mobject.animate accepts any mobject method (ManimCE _AnimationBuilder parity)', () => {
  // MIGRATION: example for the property
  //   ∀ ValueTracker t, values a, b, alpha ∈ [0, 1]: with t at a and a linear rate,
  //   t.animate.setValue(b) at alpha gives t.getValue() === a + (b - a) * alpha,
  //   and t.getValue() === b after finish().
  // Replace with a property test once the suite lands.
  it('animates ValueTracker.setValue, the canonical ManimCE idiom', () => {
    const t = new ValueTracker(2);
    const anim = t.animate.setValue(10).withRateFunc(linear);
    anim.begin();
    anim.interpolate(0.25);
    expect(t.getValue()).toBeCloseTo(4);
    anim.finish();
    expect(t.getValue()).toBe(10);
  });

  // MIGRATION: example for the property
  //   ∀ mobject m, method f of m not defined on AnimateProxy: after
  //   m.animate.f(...args) plays to the end, m matches m.copy().f(...args).
  it('animates a method that is not on the builder (setWidth)', () => {
    const sq = new Square({ sideLength: 2 });
    const expected = sq.copy().setWidth(5).getWidth();
    const anim = sq.animate.setWidth(5);
    expect(anim).toBeInstanceOf(AnimateProxy);
    anim.begin();
    anim.finish();
    expect(sq.getWidth()).toBeCloseTo(expected);
  });

  it('chains recorded calls with builder methods and explicit methods', () => {
    const sq = new Square();
    const anim = sq.animate.setWidth(3).shift([1, 0, 0]).withDuration(2);
    expect(anim.duration).toBe(2);
    anim.begin();
    anim.finish();
    expect(sq.getWidth()).toBeCloseTo(3);
    expect(sq.getCenter()[0]).toBeCloseTo(1);
  });

  it('does not intercept names that are not methods of the mobject', () => {
    const proxy = new Square().animate as unknown as Record<string, unknown>;
    expect(proxy.notAMobjectMethod).toBeUndefined();
  });
});
