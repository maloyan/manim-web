// @vitest-environment happy-dom
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { DecimalNumber } from '../mobjects/text/DecimalNumber';
import {
  ChangingDecimal,
  ChangeDecimalToValue,
  changingDecimal,
  changeDecimalToValue,
} from './numbers/index';
import { linear } from '../rate-functions';

/**
 * happy-dom does not support canvas 2D context. Stub it with a minimal
 * mock so DecimalNumber construction succeeds.
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
        measureText: (t: string) => ({
          width: t.length * 10,
          fontBoundingBoxAscent: 30,
        }),
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

describe('ChangingDecimal', () => {
  let num: DecimalNumber;

  beforeEach(() => {
    num = new DecimalNumber({ value: 0, numDecimalPlaces: 2 });
  });

  describe('constructor', () => {
    it('stores decimalNumber reference', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      expect(anim.decimalNumber).toBe(num);
    });

    it('uses current value as startValue when not provided', () => {
      num.setValue(25);
      const anim = new ChangingDecimal(num, { endValue: 100 });
      expect(anim.getStartValue()).toBe(25);
    });

    it('uses explicit startValue when provided', () => {
      const anim = new ChangingDecimal(num, {
        startValue: 10,
        endValue: 100,
      });
      expect(anim.getStartValue()).toBe(10);
    });

    it('stores endValue', () => {
      const anim = new ChangingDecimal(num, { endValue: 50 });
      expect(anim.getEndValue()).toBe(50);
    });

    it('defaults suspendMobjectUpdating to false', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      anim.interpolate(0.5);
      // If not suspended, value should change
      expect(num.getValue()).toBeCloseTo(50, 5);
    });

    it('accepts custom duration', () => {
      const anim = new ChangingDecimal(num, {
        endValue: 100,
        duration: 3,
      });
      expect(anim.duration).toBe(3);
    });

    it('accepts custom rateFunc', () => {
      const anim = new ChangingDecimal(num, {
        endValue: 100,
        rateFunc: linear,
      });
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('begin()', () => {
    it('calls super.begin()', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      expect((anim as unknown as { _hasBegun: boolean })._hasBegun).toBe(true);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 sets value to startValue', () => {
      num.setValue(10);
      const anim = new ChangingDecimal(num, { endValue: 50 });
      anim.begin();
      anim.interpolate(0);
      expect(num.getValue()).toBeCloseTo(10, 5);
    });

    it('at alpha=0.5 sets value to midpoint', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(50, 5);
    });

    it('at alpha=1 sets value to endValue', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      anim.interpolate(1);
      expect(num.getValue()).toBeCloseTo(100, 5);
    });

    it('interpolates with explicit startValue', () => {
      const anim = new ChangingDecimal(num, {
        startValue: 20,
        endValue: 80,
      });
      anim.begin();
      anim.interpolate(0.25);
      // 20 + (80-20)*0.25 = 20 + 15 = 35
      expect(num.getValue()).toBeCloseTo(35, 5);
    });

    it('handles negative range', () => {
      num.setValue(100);
      const anim = new ChangingDecimal(num, { endValue: -100 });
      anim.begin();
      anim.interpolate(0.5);
      // 100 + (-100-100)*0.5 = 100 - 100 = 0
      expect(num.getValue()).toBeCloseTo(0, 5);
    });

    it('does nothing when suspendMobjectUpdating is true', () => {
      num.setValue(42);
      const anim = new ChangingDecimal(num, {
        endValue: 100,
        suspendMobjectUpdating: true,
      });
      anim.begin();
      anim.interpolate(0.5);
      // Value should remain unchanged
      expect(num.getValue()).toBe(42);
    });
  });

  describe('finish()', () => {
    it('sets value exactly to endValue', () => {
      num.setValue(0);
      const anim = new ChangingDecimal(num, { endValue: 77.77 });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(num.getValue()).toBeCloseTo(77.77, 5);
    });

    it('marks animation as finished', () => {
      const anim = new ChangingDecimal(num, { endValue: 100 });
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('getStartValue() / getEndValue()', () => {
    it('returns configured start and end', () => {
      const anim = new ChangingDecimal(num, {
        startValue: 5,
        endValue: 95,
      });
      expect(anim.getStartValue()).toBe(5);
      expect(anim.getEndValue()).toBe(95);
    });
  });
});

describe('ChangeDecimalToValue', () => {
  let num: DecimalNumber;

  beforeEach(() => {
    num = new DecimalNumber({ value: 0, numDecimalPlaces: 2 });
  });

  describe('constructor', () => {
    it('stores decimalNumber reference', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.decimalNumber).toBe(num);
    });

    it('captures current value as startValue', () => {
      num.setValue(30);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      expect(anim.getStartValue()).toBe(30);
    });

    it('stores targetValue', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 42 });
      expect(anim.getTargetValue()).toBe(42);
    });

    it('accepts custom duration and rateFunc', () => {
      const anim = new ChangeDecimalToValue(num, {
        targetValue: 100,
        duration: 2.5,
        rateFunc: linear,
      });
      expect(anim.duration).toBe(2.5);
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('begin()', () => {
    it('re-captures current value at begin time', () => {
      num.setValue(10);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      // Change value after construction but before begin
      num.setValue(20);
      anim.begin();
      expect(anim.getStartValue()).toBe(20);
    });
  });

  describe('interpolate()', () => {
    it('at alpha=0 value equals startValue', () => {
      num.setValue(10);
      const anim = new ChangeDecimalToValue(num, { targetValue: 50 });
      anim.begin();
      anim.interpolate(0);
      expect(num.getValue()).toBeCloseTo(10, 5);
    });

    it('at alpha=0.5 value is midpoint', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.begin();
      anim.interpolate(0.5);
      expect(num.getValue()).toBeCloseTo(50, 5);
    });

    it('at alpha=1 value equals targetValue', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.begin();
      anim.interpolate(1);
      expect(num.getValue()).toBeCloseTo(100, 5);
    });

    it('handles decreasing values', () => {
      num.setValue(100);
      const anim = new ChangeDecimalToValue(num, { targetValue: 0 });
      anim.begin();
      anim.interpolate(0.75);
      // 100 + (0-100)*0.75 = 100 - 75 = 25
      expect(num.getValue()).toBeCloseTo(25, 5);
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
  });

  describe('finish()', () => {
    it('sets value exactly to targetValue', () => {
      num.setValue(0);
      const anim = new ChangeDecimalToValue(num, {
        targetValue: 33.33,
      });
      anim.begin();
      anim.interpolate(0.5);
      anim.finish();
      expect(num.getValue()).toBeCloseTo(33.33, 5);
    });

    it('marks animation as finished', () => {
      const anim = new ChangeDecimalToValue(num, { targetValue: 100 });
      anim.begin();
      expect(anim.isFinished()).toBe(false);
      anim.finish();
      expect(anim.isFinished()).toBe(true);
    });
  });

  describe('getStartValue() / getTargetValue()', () => {
    it('returns configured values', () => {
      num.setValue(15);
      const anim = new ChangeDecimalToValue(num, { targetValue: 85 });
      expect(anim.getStartValue()).toBe(15);
      expect(anim.getTargetValue()).toBe(85);
    });
  });
});

describe('Factory functions', () => {
  let num: DecimalNumber;

  beforeEach(() => {
    num = new DecimalNumber({ value: 0 });
  });

  describe('changingDecimal()', () => {
    it('returns a ChangingDecimal instance', () => {
      const anim = changingDecimal(num, { endValue: 100 });
      expect(anim).toBeInstanceOf(ChangingDecimal);
    });

    it('passes options through', () => {
      const anim = changingDecimal(num, {
        startValue: 5,
        endValue: 95,
        duration: 3,
        rateFunc: linear,
      });
      expect(anim.getStartValue()).toBe(5);
      expect(anim.getEndValue()).toBe(95);
      expect(anim.duration).toBe(3);
      expect(anim.rateFunc).toBe(linear);
    });
  });

  describe('changeDecimalToValue()', () => {
    it('returns a ChangeDecimalToValue instance', () => {
      const anim = changeDecimalToValue(num, { targetValue: 50 });
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
  });
});
