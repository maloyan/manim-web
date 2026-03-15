// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { DecimalNumber } from '../../mobjects/text/DecimalNumber';
import {
  ChangingDecimal,
  ChangeDecimalToValue,
  changingDecimal,
  changeDecimalToValue,
} from './index';
import { linear } from '../../rate-functions';

/**
 * happy-dom does not support canvas 2D context. DecimalNumber calls
 * canvas.getContext('2d') which returns null and throws. We stub it
 * with a minimal mock so construction succeeds.
 */
beforeAll(() => {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
    if (type === '2d') {
      return {
        scale: () => {},
        clearRect: () => {},
        fillText: () => {},
        fillRect: () => {},
        measureText: (t: string) => ({ width: t.length * 10, fontBoundingBoxAscent: 30 }),
        drawImage: () => {},
        font: '',
        fillStyle: '',
        globalAlpha: 1,
        textBaseline: 'alphabetic',
        textAlign: 'left',
      } as unknown as CanvasRenderingContext2D;
    }
    return origGetContext.call(this, type, ...(args as []));
  } as typeof origGetContext;
});

// =============================================================
// ChangingDecimal
// =============================================================

describe('ChangingDecimal', () => {
  let num: DecimalNumber;

  beforeEach(() => {
    num = new DecimalNumber({ value: 0 });
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('stores the decimal number reference', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      expect(anim.decimalNumber).toBe(num);
    });

    it('stores mobject reference on base class', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      expect(anim.mobject).toBe(num);
    });

    it('uses current value as default startValue', () => {
      num.setValue(42);
      const anim = new ChangingDecimal(num, { endValue: 100 });
      expect(anim.getStartValue()).toBe(42);
    });

    it('accepts explicit startValue', () => {
      const anim = new ChangingDecimal(num, { startValue: 10, endValue: 100 });
      expect(anim.getStartValue()).toBe(10);
    });

    it('stores endValue', () => {
      const anim = new ChangingDecimal(num, { endValue: 200 });
      expect(anim.getEndValue()).toBe(200);
    });

    it('defaults duration to 1', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const anim = new ChangingDecimal(num, { endValue: 100, duration: 3 });
      expect(anim.duration).toBe(3);
    });

    it('accepts custom rateFunc', () => {
      const anim = new ChangingDecimal(num, { endValue: 100, rateFunc: linear });
      expect(anim.rateFunc).toBe(linear);
    });

    it('defaults suspendMobjectUpdating to false', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      anim.interpolate(0.5);
      // If not suspended, value should have changed
      expect(num.getValue()).toBe(50);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('calls super.begin()', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('at alpha=0: value equals startValue', () => {
      num.setValue(10);
      const anim = new ChangingDecimal(num, { endValue: 50 });
      anim.begin();
      anim.interpolate(0);
      expect(num.getValue()).toBeCloseTo(10, 5);
    });

    it('at alpha=0.5: value is midpoint', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(50, 5);
    });

    it('at alpha=1: value equals endValue', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      anim.interpolate(1);
      expect(num.getValue()).toBeCloseTo(100, 5);
    });

    it('interpolates with explicit startValue', () => {
      const anim = new ChangingDecimal(num, { startValue: 20, endValue: 80 });
      anim.begin();
      anim.interpolate(0.25);
      expect(num.getValue()).toBeCloseTo(35, 5); // 20 + (80-20)*0.25 = 35
    });

    it('interpolates negative range correctly', () => {
      num.setValue(-50);
      const anim = new ChangingDecimal(num, { endValue: 50 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(0, 5); // -50 + (50-(-50))*0.5 = 0
    });

    it('interpolates from positive to negative', () => {
      num.setValue(100);
      const anim = new ChangingDecimal(num, { endValue: -100 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(0, 5);
      anim.interpolate(1);
      expect(num.getValue()).toBeCloseTo(-100, 5);
    });

    it('does nothing when suspendMobjectUpdating is true', () => {
      num.setValue(42);
      const anim = new ChangingDecimal(num, {
        endValue: 100,
        suspendMobjectUpdating: true,
      });
      anim.begin();
      anim.interpolate(0.5);
      // Value should not have changed from the original
      expect(num.getValue()).toBe(42);
    });

    it('handles same start and end value', () => {
      num.setValue(50);
      const anim = new ChangingDecimal(num, { endValue: 50 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(50, 5);
    });

    it('handles fractional alpha values', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, { endValue: 1000 });
      anim.begin();
      anim.interpolate(0.1);
      expect(num.getValue()).toBeCloseTo(100, 5);
      anim.interpolate(0.333);
      expect(num.getValue()).toBeCloseTo(333, 0);
      anim.interpolate(0.9);
      expect(num.getValue()).toBeCloseTo(900, 5);
    });
  });

  // -----------------------------------------------------------
  // finish()
  // -----------------------------------------------------------

  describe('finish()', () => {
    it('sets value to exactly the endValue', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, { endValue: 99.99 });
      anim.begin();
      anim.interpolate(0.5); // partially through
      anim.finish();
      expect(num.getValue()).toBe(99.99);
    });

    it('marks animation as finished', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });

    it('sets endValue even when suspendMobjectUpdating was true', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, {
        endValue: 77,
        suspendMobjectUpdating: true,
      });
      anim.begin();
      anim.interpolate(0.5);
      // Suspended: value unchanged
      expect(num.getValue()).toBe(0);
      anim.finish();
      // finish() always sets the final value
      expect(num.getValue()).toBe(77);
    });
  });

  // -----------------------------------------------------------
  // getStartValue / getEndValue
  // -----------------------------------------------------------

  describe('getStartValue / getEndValue', () => {
    it('getStartValue returns start value', () => {
      num.setValue(5);
      const anim = new ChangingDecimal(num, { startValue: 10, endValue: 20 });
      expect(anim.getStartValue()).toBe(10);
    });

    it('getStartValue returns current value when no explicit start', () => {
      num.setValue(7);
      const anim = new ChangingDecimal(num, { endValue: 20 });
      expect(anim.getStartValue()).toBe(7);
    });

    it('getEndValue returns end value', () => {
      const anim = new ChangingDecimal(num, { endValue: 999 });
      expect(anim.getEndValue()).toBe(999);
    });
  });

  // -----------------------------------------------------------
  // changingDecimal() factory
  // -----------------------------------------------------------

  describe('changingDecimal() factory', () => {
    it('returns a ChangingDecimal instance', () => {
      const anim = changingDecimal(num, { endValue: 100 });
      expect(anim).toBeInstanceOf(ChangingDecimal);
    });

    it('passes options through', () => {
      const anim = changingDecimal(num, {
        startValue: 5,
        endValue: 50,
        duration: 2,
        rateFunc: linear,
      });
      expect(anim.getStartValue()).toBe(5);
      expect(anim.getEndValue()).toBe(50);
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(linear);
    });

    it('stores the decimal number reference', () => {
      const anim = changingDecimal(num, { endValue: 100 });
      expect(anim.decimalNumber).toBe(num);
    });
  });
});

// =============================================================
// ChangeDecimalToValue
// =============================================================

describe('ChangeDecimalToValue', () => {
  let num: DecimalNumber;

  beforeEach(() => {
    num = new DecimalNumber({ value: 0 });
  });

  // -----------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------

  describe('constructor', () => {
    it('stores the decimal number reference', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.decimalNumber).toBe(num);
    });

    it('stores mobject reference on base class', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.mobject).toBe(num);
    });

    it('captures current value as startValue', () => {
      num.setValue(25);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.getStartValue()).toBe(25);
    });

    it('stores targetValue', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 200 });
      expect(anim.getTargetValue()).toBe(200);
    });

    it('defaults duration to 1', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.duration).toBe(1);
    });

    it('accepts custom duration', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100, duration: 5 });
      expect(anim.duration).toBe(5);
    });

    it('accepts custom rateFunc', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100, rateFunc: linear });
      expect(anim.rateFunc).toBe(linear);
    });

    it('defaults suspendMobjectUpdating to false', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBe(50);
    });
  });

  // -----------------------------------------------------------
  // begin()
  // -----------------------------------------------------------

  describe('begin()', () => {
    it('captures current value as start value', () => {
      num.setValue(30);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      // Change the value after construction but before begin
      num.setValue(40);
      anim.begin();
      // begin() should re-capture the current value
      expect(anim.getStartValue()).toBe(40);
    });

    it('calls super.begin()', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.finish();
      expect(anim.isFinished()).toBe(true);
      anim.begin();
      expect(anim.isFinished()).toBe(false);
    });
  });

  // -----------------------------------------------------------
  // interpolate()
  // -----------------------------------------------------------

  describe('interpolate()', () => {
    it('at alpha=0: value equals startValue', () => {
      num.setValue(10);
      const anim = new ChangeDecimalToValue(num, { targetValue: 50 });
      anim.begin();
      anim.interpolate(0);
      expect(num.getValue()).toBeCloseTo(10, 5);
    });

    it('at alpha=0.5: value is midpoint', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(50, 5);
    });

    it('at alpha=1: value equals targetValue', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.begin();
      anim.interpolate(1);
      expect(num.getValue()).toBeCloseTo(100, 5);
    });

    it('interpolates negative values correctly', () => {
      num.setValue(-100);
      const anim = new ChangeDecimalToValue(num, { targetValue: 0 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(-50, 5);
    });

    it('interpolates from positive to negative', () => {
      num.setValue(50);
      const anim = new ChangeDecimalToValue(num, { targetValue: -50 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(0, 5);
      anim.interpolate(1);
      expect(num.getValue()).toBeCloseTo(-50, 5);
    });

    it('does nothing when suspendMobjectUpdating is true', () => {
      num.setValue(42);
      const anim = new ChangeDecimalToValue(num, {
        targetValue: 100,
        suspendMobjectUpdating: true,
      });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBe(42);
    });

    it('handles same start and target value', () => {
      num.setValue(50);
      const anim = new ChangeDecimalToValue(num, { targetValue: 50 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(50, 5);
    });

    it('handles fractional interpolation', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, { targetValue: 1000 });
      anim.begin();
      anim.interpolate(0.1);
      expect(num.getValue()).toBeCloseTo(100, 5);
      anim.interpolate(0.75);
      expect(num.getValue()).toBeCloseTo(750, 5);
    });
  });

  // -----------------------------------------------------------
  // finish()
  // -----------------------------------------------------------

  describe('finish()', () => {
    it('sets value to exactly the targetValue', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, { targetValue: 99.99 });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(num.getValue()).toBe(99.99);
    });

    it('marks animation as finished', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });

    it('sets targetValue even when suspendMobjectUpdating was true', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, {
        targetValue: 77,
        suspendMobjectUpdating: true,
      });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBe(0);
      anim.finish();
      expect(num.getValue()).toBe(77);
    });
  });

  // -----------------------------------------------------------
  // getStartValue / getTargetValue
  // -----------------------------------------------------------

  describe('getStartValue / getTargetValue', () => {
    it('getStartValue returns the captured start value', () => {
      num.setValue(15);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.getStartValue()).toBe(15);
    });

    it('getTargetValue returns target value', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 999 });
      expect(anim.getTargetValue()).toBe(999);
    });

    it('getStartValue updates after begin()', () => {
      num.setValue(10);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.getStartValue()).toBe(10);
      num.setValue(20);
      anim.begin();
      expect(anim.getStartValue()).toBe(20);
    });
  });

  // -----------------------------------------------------------
  // changeDecimalToValue() factory
  // -----------------------------------------------------------

  describe('changeDecimalToValue() factory', () => {
    it('returns a ChangeDecimalToValue instance', () => {
      const anim = changeDecimalToValue(num, { targetValue: 100 });
      expect(anim).toBeInstanceOf(ChangeDecimalToValue);
    });

    it('passes options through', () => {
      const anim = changeDecimalToValue(num, {
        targetValue: 50,
        duration: 2,
        rateFunc: linear,
      });
      expect(anim.getTargetValue()).toBe(50);
      expect(anim.duration).toBe(2);
      expect(anim.rateFunc).toBe(linear);
    });

    it('stores the decimal number reference', () => {
      const anim = changeDecimalToValue(num, { targetValue: 100 });
      expect(anim.decimalNumber).toBe(num);
    });
  });
});
