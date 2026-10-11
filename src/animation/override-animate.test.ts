import { describe, it, expect } from 'vitest';
import { Mobject } from '../core/Mobject';
import { Animation } from './Animation';
import {
  overrideAnimate,
  getAnimationOverride,
  hasAnimationOverride,
  clearAnimationOverrides,
} from './AnimationUtilities';
import { AnimateProxy } from '../core/AnimateProxy';

/**
 * Tests for `overrideAnimate` (TS form of Manim CE `@override_animate`).
 * The override is registered against a mobject class + method name, and
 * `AnimateProxy` plays it in place of the default Transform.
 */
class OverrideTestMob extends Mobject {}

class FlagAnimation extends Animation {
  interpolate(): void {
    // No interpolation needed; the test only checks the override was selected.
  }
}

describe('overrideAnimate', () => {
  it('registers an override reachable via the lookup surface', () => {
    const factory = (mob: Mobject): Animation => new FlagAnimation(mob);
    overrideAnimate(OverrideTestMob, 'scale', factory);

    expect(hasAnimationOverride('scale', 'OverrideTestMob')).toBe(true);
    expect(getAnimationOverride('scale', 'OverrideTestMob')).toBe(factory);

    clearAnimationOverrides('OverrideTestMob');
  });

  it('is used by AnimateProxy for the overridden method', () => {
    let built = false;
    overrideAnimate(OverrideTestMob, 'scale', (mob) => {
      built = true;
      return new FlagAnimation(mob);
    });

    const mob = new OverrideTestMob();
    const proxy = new AnimateProxy(mob);
    proxy.scale(2);
    proxy.begin();

    expect(built).toBe(true);

    clearAnimationOverrides('OverrideTestMob');
  });
});
