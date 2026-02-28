import { describe, it, expect } from 'vitest';
import {
  linear,
  smooth,
  easeIn,
  easeOut,
  easeInOut,
  easeInQuad,
  easeOutQuad,
  easeInExpo,
  easeOutExpo,
  easeOutBounce,
  easeInBounce,
  thereAndBack,
  rushInto,
  rushFrom,
  doubleSmooth,
  stepFunction,
  reverse,
  compose,
  slowInto,
  squishRateFunc,
  thereAndBackWithPause,
  runningStart,
  wiggle,
  notQuiteThere,
  lingering,
  exponentialDecay,
} from './index';

const EPSILON = 1e-6;

describe('rate functions', () => {
  describe('linear', () => {
    it('should return t unchanged', () => {
      expect(linear(0)).toBe(0);
      expect(linear(0.25)).toBe(0.25);
      expect(linear(0.5)).toBe(0.5);
      expect(linear(0.75)).toBe(0.75);
      expect(linear(1)).toBe(1);
    });
  });

  describe('smooth', () => {
    it('should map 0 to ~0 and 1 to ~1', () => {
      expect(smooth(0)).toBeCloseTo(0, 5);
      expect(smooth(1)).toBeCloseTo(1, 5);
    });

    it('should map 0.5 to ~0.5 (sigmoid midpoint)', () => {
      expect(smooth(0.5)).toBeCloseTo(0.5, 5);
    });

    it('should be monotonically increasing', () => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(smooth(t2)).toBeGreaterThanOrEqual(smooth(t1) - EPSILON);
      }
    });
  });

  describe('easeIn (cubic)', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(easeIn(0)).toBe(0);
      expect(easeIn(1)).toBe(1);
    });

    it('should start slow (values near 0 are small)', () => {
      expect(easeIn(0.1)).toBeLessThan(0.1);
      expect(easeIn(0.2)).toBeLessThan(0.2);
    });

    it('should be monotonically increasing', () => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(easeIn(t2)).toBeGreaterThanOrEqual(easeIn(t1) - EPSILON);
      }
    });
  });

  describe('easeOut (cubic)', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(easeOut(0)).toBe(0);
      expect(easeOut(1)).toBe(1);
    });

    it('should start fast (values near 0 are larger than linear)', () => {
      expect(easeOut(0.1)).toBeGreaterThan(0.1);
      expect(easeOut(0.2)).toBeGreaterThan(0.2);
    });

    it('should be monotonically increasing', () => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(easeOut(t2)).toBeGreaterThanOrEqual(easeOut(t1) - EPSILON);
      }
    });
  });

  describe('easeInOut (cubic)', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(easeInOut(0)).toBe(0);
      expect(easeInOut(1)).toBe(1);
    });

    it('should map 0.5 to 0.5 (symmetric midpoint)', () => {
      expect(easeInOut(0.5)).toBeCloseTo(0.5, 5);
    });

    it('should be monotonically increasing', () => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(easeInOut(t2)).toBeGreaterThanOrEqual(easeInOut(t1) - EPSILON);
      }
    });
  });

  describe('easeInQuad', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(easeInQuad(0)).toBe(0);
      expect(easeInQuad(1)).toBe(1);
    });

    it('should equal t^2', () => {
      expect(easeInQuad(0.3)).toBeCloseTo(0.09, 10);
      expect(easeInQuad(0.5)).toBeCloseTo(0.25, 10);
      expect(easeInQuad(0.7)).toBeCloseTo(0.49, 10);
    });
  });

  describe('easeOutQuad', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(easeOutQuad(0)).toBe(0);
      expect(easeOutQuad(1)).toBe(1);
    });

    it('should equal 1 - (1-t)^2', () => {
      expect(easeOutQuad(0.3)).toBeCloseTo(1 - 0.7 * 0.7, 10);
      expect(easeOutQuad(0.5)).toBeCloseTo(0.75, 10);
    });

    it('should be faster than linear near 0', () => {
      expect(easeOutQuad(0.1)).toBeGreaterThan(0.1);
    });
  });

  describe('easeInExpo', () => {
    it('should map 0 to 0 and 1 to ~1', () => {
      expect(easeInExpo(0)).toBe(0);
      expect(easeInExpo(1)).toBeCloseTo(1, 3);
    });

    it('should start very slow', () => {
      expect(easeInExpo(0.1)).toBeLessThan(0.01);
    });
  });

  describe('easeOutExpo', () => {
    it('should map 0 to ~0 and 1 to 1', () => {
      expect(easeOutExpo(0)).toBeCloseTo(0, 3);
      expect(easeOutExpo(1)).toBe(1);
    });

    it('should start very fast', () => {
      expect(easeOutExpo(0.1)).toBeGreaterThan(0.4);
    });
  });

  describe('easeOutBounce', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(easeOutBounce(0)).toBe(0);
      expect(easeOutBounce(1)).toBe(1);
    });

    it('should reach 1 and not exceed it', () => {
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        expect(easeOutBounce(t)).toBeLessThanOrEqual(1 + EPSILON);
        expect(easeOutBounce(t)).toBeGreaterThanOrEqual(-EPSILON);
      }
    });
  });

  describe('easeInBounce', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(easeInBounce(0)).toBe(0);
      expect(easeInBounce(1)).toBe(1);
    });
  });

  describe('thereAndBack', () => {
    it('should start at ~0 and end at ~0', () => {
      expect(thereAndBack(0)).toBeCloseTo(0, 5);
      expect(thereAndBack(1)).toBeCloseTo(0, 5);
    });

    it('should reach peak (~1) at t=0.5', () => {
      expect(thereAndBack(0.5)).toBeCloseTo(1, 5);
    });

    it('should be symmetric around t=0.5', () => {
      expect(thereAndBack(0.25)).toBeCloseTo(thereAndBack(0.75), 5);
      expect(thereAndBack(0.1)).toBeCloseTo(thereAndBack(0.9), 5);
    });
  });

  describe('rushInto', () => {
    it('should map 0 to ~0 and 1 to ~1', () => {
      expect(rushInto(0)).toBeCloseTo(0, 5);
      expect(rushInto(1)).toBeCloseTo(1, 5);
    });
  });

  describe('rushFrom', () => {
    it('should map 0 to ~0 and 1 to ~1', () => {
      expect(rushFrom(0)).toBeCloseTo(0, 5);
      expect(rushFrom(1)).toBeCloseTo(1, 5);
    });
  });

  describe('doubleSmooth', () => {
    it('should map 0 to ~0 and 1 to ~1', () => {
      expect(doubleSmooth(0)).toBeCloseTo(0, 5);
      expect(doubleSmooth(1)).toBeCloseTo(1, 5);
    });

    it('should map 0.5 to 0.5 (midpoint)', () => {
      expect(doubleSmooth(0.5)).toBeCloseTo(0.5, 5);
    });

    it('should match Python Manim values', () => {
      // doubleSmooth(0.25) = 0.5 * smooth(0.5) = 0.5 * 0.5 = 0.25
      expect(doubleSmooth(0.25)).toBeCloseTo(0.25, 5);
      // doubleSmooth(0.75) = 0.5 * (1 + smooth(0.5)) = 0.5 * 1.5 = 0.75
      expect(doubleSmooth(0.75)).toBeCloseTo(0.75, 5);
    });

    it('should be monotonically increasing', () => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(doubleSmooth(t2)).toBeGreaterThanOrEqual(doubleSmooth(t1) - EPSILON);
      }
    });

    it('should be symmetric: doubleSmooth(t) + doubleSmooth(1-t) ≈ 1', () => {
      for (const t of [0.1, 0.2, 0.3, 0.4]) {
        expect(doubleSmooth(t) + doubleSmooth(1 - t)).toBeCloseTo(1, 5);
      }
    });
  });

  describe('stepFunction', () => {
    it('should return 0 below threshold and 1 at/above threshold', () => {
      const step = stepFunction(0.5);
      expect(step(0)).toBe(0);
      expect(step(0.49)).toBe(0);
      expect(step(0.5)).toBe(1);
      expect(step(1)).toBe(1);
    });

    it('should support custom threshold', () => {
      const step = stepFunction(0.3);
      expect(step(0.29)).toBe(0);
      expect(step(0.3)).toBe(1);
    });

    it('should default to threshold 0.5', () => {
      const step = stepFunction();
      expect(step(0.49)).toBe(0);
      expect(step(0.5)).toBe(1);
    });
  });

  describe('reverse', () => {
    it('should reverse a rate function so f(0) becomes ~1 and f(1) becomes ~0 for easeIn', () => {
      const reversed = reverse(easeIn);
      // reverse(easeIn)(0) = 1 - easeIn(1-0) = 1 - easeIn(1) = 0
      expect(reversed(0)).toBeCloseTo(0, 5);
      // reverse(easeIn)(1) = 1 - easeIn(0) = 1
      expect(reversed(1)).toBeCloseTo(1, 5);
    });

    it('should make easeIn behave like easeOut', () => {
      const reversed = reverse(easeIn);
      // reverse(easeIn) should produce values larger than linear near t=0
      // (like easeOut does)
      expect(reversed(0.1)).toBeGreaterThan(0.1);
    });
  });

  describe('compose', () => {
    it('should apply inner then outer function', () => {
      const composed = compose(easeInQuad, linear);
      // compose(easeInQuad, linear)(t) = easeInQuad(linear(t)) = easeInQuad(t) = t^2
      expect(composed(0.5)).toBeCloseTo(0.25, 10);
    });

    it('should return identity when composing linear with linear', () => {
      const composed = compose(linear, linear);
      expect(composed(0.3)).toBeCloseTo(0.3, 10);
      expect(composed(0.7)).toBeCloseTo(0.7, 10);
    });
  });

  describe('slowInto', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      expect(slowInto(0)).toBe(0);
      expect(slowInto(1)).toBe(1);
    });

    it('should match Python Manim: sqrt(1 - (1-t)^2)', () => {
      expect(slowInto(0.5)).toBeCloseTo(0.86602540378, 5);
    });

    it('should be monotonically increasing', () => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(slowInto(t2)).toBeGreaterThanOrEqual(slowInto(t1) - EPSILON);
      }
    });

    it('should decelerate into the end (values above linear)', () => {
      expect(slowInto(0.1)).toBeGreaterThan(0.1);
      expect(slowInto(0.3)).toBeGreaterThan(0.3);
    });
  });

  describe('squishRateFunc', () => {
    it('should clamp below a to func(0)', () => {
      const squished = squishRateFunc(smooth, 0.2, 0.8);
      expect(squished(0)).toBeCloseTo(smooth(0), 5);
      expect(squished(0.1)).toBeCloseTo(smooth(0), 5);
      expect(squished(0.19)).toBeCloseTo(smooth(0), 5);
    });

    it('should clamp above b to func(1)', () => {
      const squished = squishRateFunc(smooth, 0.2, 0.8);
      expect(squished(0.81)).toBeCloseTo(smooth(1), 5);
      expect(squished(0.9)).toBeCloseTo(smooth(1), 5);
      expect(squished(1)).toBeCloseTo(smooth(1), 5);
    });

    it('should remap [a, b] to [0, 1]', () => {
      const squished = squishRateFunc(smooth, 0.2, 0.8);
      // midpoint of [0.2, 0.8] is 0.5 -> func((0.5-0.2)/0.6) = func(0.5)
      expect(squished(0.5)).toBeCloseTo(smooth(0.5), 5);
    });

    it('should work with linear to verify remapping', () => {
      const squished = squishRateFunc(linear, 0.25, 0.75);
      expect(squished(0.25)).toBeCloseTo(0, 5);
      expect(squished(0.5)).toBeCloseTo(0.5, 5);
      expect(squished(0.75)).toBeCloseTo(1, 5);
    });

    it('should default to a=0, b=1 (identity)', () => {
      const squished = squishRateFunc(smooth);
      expect(squished(0.5)).toBeCloseTo(smooth(0.5), 5);
    });
  });

  describe('thereAndBackWithPause', () => {
    it('should map 0 to ~0 and 1 to ~0 with default pause', () => {
      const fn = thereAndBackWithPause();
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(0, 5);
    });

    it('should hold at 1 during the pause window', () => {
      const fn = thereAndBackWithPause();
      // pause is [0.5 - 1/6, 0.5 + 1/6] ≈ [0.333, 0.667]
      expect(fn(0.4)).toBeCloseTo(1, 5);
      expect(fn(0.5)).toBeCloseTo(1, 5);
      expect(fn(0.6)).toBeCloseTo(1, 5);
    });

    it('should be symmetric around t=0.5', () => {
      const fn = thereAndBackWithPause();
      expect(fn(0.25)).toBeCloseTo(fn(0.75), 5);
    });

    it('should be continuous at pause boundaries', () => {
      const fn = thereAndBackWithPause();
      // At t=0.25 (in the going segment), should be close to 1
      expect(fn(0.25)).toBeCloseTo(0.929896, 4);
      // At boundary t≈0.333, should be ~1 (continuous with pause)
      expect(fn(0.333)).toBeCloseTo(1, 2);
    });

    it('should support custom pause ratio', () => {
      const fn = thereAndBackWithPause(0.5);
      // pause is [0.25, 0.75]
      expect(fn(0.3)).toBeCloseTo(1, 5);
      expect(fn(0.5)).toBeCloseTo(1, 5);
      expect(fn(0.7)).toBeCloseTo(1, 5);
    });
  });

  describe('runningStart', () => {
    it('should map 0 to 0 and 1 to 1', () => {
      const fn = runningStart();
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(1, 5);
    });

    it('should go negative in the middle with default pullFactor', () => {
      const fn = runningStart();
      // At t=0.5, value should be -0.125
      expect(fn(0.5)).toBeCloseTo(-0.125, 5);
    });

    it('should match Python Manim numerical values', () => {
      const fn = runningStart();
      expect(fn(0.25)).toBeCloseTo(-0.16015625, 5);
      expect(fn(0.75)).toBeCloseTo(0.45703125, 5);
    });

    it('should support custom pullFactor', () => {
      const fn = runningStart(0);
      // With pullFactor=0, control points are [0,0,0,0,1,1]
      // Should still go from 0 to 1 but without pullback
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(1, 5);
      expect(fn(0.5)).toBeGreaterThanOrEqual(0); // no negative values
    });
  });

  describe('wiggle', () => {
    it('should map 0 to 0 and 1 to ~0', () => {
      const fn = wiggle();
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(0, 5);
    });

    it('should oscillate with default wiggles=2', () => {
      const fn = wiggle();
      // At t=0.25: thereAndBack(0.25)*sin(pi/2) = 0.5*1 = 0.5
      expect(fn(0.25)).toBeCloseTo(0.5, 5);
      // At t=0.5: thereAndBack(0.5)*sin(pi) = 1*0 ≈ 0
      expect(fn(0.5)).toBeCloseTo(0, 5);
      // At t=0.75: thereAndBack(0.75)*sin(3pi/2) = 0.5*(-1) = -0.5
      expect(fn(0.75)).toBeCloseTo(-0.5, 5);
    });

    it('should support custom wiggles count', () => {
      const fn = wiggle(1);
      // At t=0.5: thereAndBack(0.5)*sin(pi/2*... wait, sin(1*pi*0.5) = sin(pi/2) = 1
      // thereAndBack(0.5) = 1
      // So wiggle(1)(0.5) = 1*1 = 1
      expect(fn(0.5)).toBeCloseTo(1, 5);
    });
  });

  describe('notQuiteThere', () => {
    it('should map 0 to 0 with defaults', () => {
      const fn = notQuiteThere();
      expect(fn(0)).toBeCloseTo(0, 5);
    });

    it('should only reach proportion of 1 at t=1', () => {
      const fn = notQuiteThere();
      expect(fn(1)).toBeCloseTo(0.7, 5);
    });

    it('should match Python Manim values at midpoint', () => {
      const fn = notQuiteThere();
      // 0.7 * smooth(0.5) = 0.7 * 0.5 = 0.35
      expect(fn(0.5)).toBeCloseTo(0.35, 5);
    });

    it('should support custom function and proportion', () => {
      const fn = notQuiteThere(linear, 0.5);
      expect(fn(0.5)).toBeCloseTo(0.25, 5);
      expect(fn(1)).toBeCloseTo(0.5, 5);
    });
  });

  describe('lingering', () => {
    it('should map 0 to ~0', () => {
      expect(lingering(0)).toBeCloseTo(0, 5);
    });

    it('should reach 1 before t=1 and stay there', () => {
      // lingering = squishRateFunc(smooth, 0, 0.8)
      // At t=0.8, smooth(1) ≈ 1
      expect(lingering(0.8)).toBeCloseTo(1, 5);
      expect(lingering(0.9)).toBeCloseTo(1, 5);
      expect(lingering(1)).toBeCloseTo(1, 5);
    });

    it('should match Python Manim at t=0.4', () => {
      // lingering(0.4) = smooth(0.4/0.8) = smooth(0.5) = 0.5
      expect(lingering(0.4)).toBeCloseTo(0.5, 5);
    });

    it('should be monotonically increasing', () => {
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(lingering(t2)).toBeGreaterThanOrEqual(lingering(t1) - EPSILON);
      }
    });
  });

  describe('exponentialDecay', () => {
    it('should map 0 to 0', () => {
      const fn = exponentialDecay();
      expect(fn(0)).toBe(0);
    });

    it('should approach 1 as t increases', () => {
      const fn = exponentialDecay();
      expect(fn(1)).toBeCloseTo(1, 3);
    });

    it('should match Python Manim values with default halfLife=0.1', () => {
      const fn = exponentialDecay();
      expect(fn(0.1)).toBeCloseTo(0.63212055882, 5);
      expect(fn(0.5)).toBeCloseTo(0.993262053, 5);
    });

    it('should support custom halfLife', () => {
      const fn = exponentialDecay(0.5);
      // 1 - exp(-0.5/0.5) = 1 - exp(-1) ≈ 0.6321
      expect(fn(0.5)).toBeCloseTo(0.63212055882, 5);
    });

    it('should be monotonically increasing', () => {
      const fn = exponentialDecay();
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t1 = i / steps;
        const t2 = (i + 1) / steps;
        expect(fn(t2)).toBeGreaterThanOrEqual(fn(t1) - EPSILON);
      }
    });
  });

  describe('all standard easing functions boundary behavior', () => {
    const standardFunctions = [
      { name: 'linear', fn: linear },
      { name: 'smooth', fn: smooth },
      { name: 'easeIn', fn: easeIn },
      { name: 'easeOut', fn: easeOut },
      { name: 'easeInOut', fn: easeInOut },
      { name: 'easeInQuad', fn: easeInQuad },
      { name: 'easeOutQuad', fn: easeOutQuad },
      { name: 'easeInExpo', fn: easeInExpo },
      { name: 'easeOutExpo', fn: easeOutExpo },
      { name: 'easeOutBounce', fn: easeOutBounce },
      { name: 'easeInBounce', fn: easeInBounce },
      { name: 'rushInto', fn: rushInto },
      { name: 'rushFrom', fn: rushFrom },
      { name: 'doubleSmooth', fn: doubleSmooth },
      { name: 'slowInto', fn: slowInto },
      { name: 'lingering', fn: lingering },
    ];

    for (const { name, fn } of standardFunctions) {
      it(`${name}(0) should be close to 0`, () => {
        expect(fn(0)).toBeCloseTo(0, 3);
      });

      it(`${name}(1) should be close to 1`, () => {
        expect(fn(1)).toBeCloseTo(1, 3);
      });
    }
  });
});
