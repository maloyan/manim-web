// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import { Variable } from './Variable';
import { MathTex } from './MathTex';
import { DecimalNumber } from './DecimalNumber';
import { ValueTracker } from '../value-tracker';

/**
 * happy-dom does not support canvas 2D context. DecimalNumber (used by
 * Variable internally) calls canvas.getContext('2d') which returns null
 * and throws. We stub it with a minimal mock so construction succeeds.
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
        measureText: () => ({ width: 50, fontBoundingBoxAscent: 30 }),
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

describe('Variable', () => {
  // -----------------------------------------------------------
  // Constructor & defaults
  // -----------------------------------------------------------
  describe('constructor', () => {
    it('should create with label and default value 0', () => {
      const v = new Variable({ label: 'x' });
      expect(v.getValue()).toBe(0);
    });

    it('should create with label and explicit value', () => {
      const v = new Variable({ label: 'x', value: 5 });
      expect(v.getValue()).toBe(5);
    });

    it('should create with negative value', () => {
      const v = new Variable({ label: 'y', value: -3.14 });
      expect(v.getValue()).toBe(-3.14);
    });

    it('should create with zero value', () => {
      const v = new Variable({ label: 'z', value: 0 });
      expect(v.getValue()).toBe(0);
    });

    it('should accept LaTeX label', () => {
      const v = new Variable({ label: '\\theta', value: 1 });
      expect(v.labelMobject.getLatex()).toBe('\\theta');
    });

    it('should accept numDecimalPlaces option', () => {
      const v = new Variable({ label: 'x', value: 3.14159, numDecimalPlaces: 4 });
      expect(v.getValue()).toBe(3.14159);
    });

    it('should accept fontSize option', () => {
      const v = new Variable({ label: 'x', fontSize: 72 });
      expect(v.labelMobject.getFontSize()).toBe(72);
    });
  });

  // -----------------------------------------------------------
  // getValue / setValue
  // -----------------------------------------------------------
  describe('getValue / setValue', () => {
    it('should return initial value', () => {
      const v = new Variable({ label: 'x', value: 42 });
      expect(v.getValue()).toBe(42);
    });

    it('should update value via setValue', () => {
      const v = new Variable({ label: 'x', value: 0 });
      v.setValue(10);
      expect(v.getValue()).toBe(10);
    });

    it('should return this for chaining on setValue', () => {
      const v = new Variable({ label: 'x' });
      const result = v.setValue(5);
      expect(result).toBe(v);
    });

    it('should handle setting to negative value', () => {
      const v = new Variable({ label: 'x', value: 5 });
      v.setValue(-100);
      expect(v.getValue()).toBe(-100);
    });

    it('should handle setting to float value', () => {
      const v = new Variable({ label: 'x' });
      v.setValue(3.14159);
      expect(v.getValue()).toBeCloseTo(3.14159);
    });

    it('should handle setting to zero', () => {
      const v = new Variable({ label: 'x', value: 42 });
      v.setValue(0);
      expect(v.getValue()).toBe(0);
    });

    it('should handle very large values', () => {
      const v = new Variable({ label: 'x' });
      v.setValue(1e10);
      expect(v.getValue()).toBe(1e10);
    });

    it('should handle very small values', () => {
      const v = new Variable({ label: 'x' });
      v.setValue(1e-10);
      expect(v.getValue()).toBeCloseTo(1e-10);
    });
  });

  // -----------------------------------------------------------
  // tracker property
  // -----------------------------------------------------------
  describe('tracker', () => {
    it('should return a ValueTracker instance', () => {
      const v = new Variable({ label: 'x', value: 5 });
      expect(v.tracker).toBeInstanceOf(ValueTracker);
    });

    it('should have tracker value matching initial value', () => {
      const v = new Variable({ label: 'x', value: 7 });
      expect(v.tracker.getValue()).toBe(7);
    });

    it('should update tracker when setValue is called', () => {
      const v = new Variable({ label: 'x', value: 0 });
      v.setValue(42);
      expect(v.tracker.getValue()).toBe(42);
    });

    it('should return same tracker instance on multiple accesses', () => {
      const v = new Variable({ label: 'x' });
      const t1 = v.tracker;
      const t2 = v.tracker;
      expect(t1).toBe(t2);
    });
  });

  // -----------------------------------------------------------
  // Submobject accessors
  // -----------------------------------------------------------
  describe('submobject accessors', () => {
    it('should expose labelMobject as MathTex', () => {
      const v = new Variable({ label: 'x' });
      expect(v.labelMobject).toBeInstanceOf(MathTex);
    });

    it('should expose equalsMobject as MathTex', () => {
      const v = new Variable({ label: 'x' });
      expect(v.equalsMobject).toBeInstanceOf(MathTex);
    });

    it('should expose numberMobject as DecimalNumber', () => {
      const v = new Variable({ label: 'x' });
      expect(v.numberMobject).toBeInstanceOf(DecimalNumber);
    });

    it('should have equals sign with latex "="', () => {
      const v = new Variable({ label: 'x' });
      expect(v.equalsMobject.getLatex()).toBe('=');
    });

    it('should have label matching constructor label', () => {
      const v = new Variable({ label: '\\alpha' });
      expect(v.labelMobject.getLatex()).toBe('\\alpha');
    });

    it('should have number value matching constructor value', () => {
      const v = new Variable({ label: 'x', value: 99 });
      expect(v.numberMobject.getValue()).toBe(99);
    });
  });

  // -----------------------------------------------------------
  // setLabelColor / setValueColor / setColor
  // -----------------------------------------------------------
  describe('color methods', () => {
    it('should set label color via setLabelColor', () => {
      const v = new Variable({ label: 'x' });
      v.setLabelColor('#ff0000');
      expect(v.labelMobject.color).toBe('#ff0000');
    });

    it('should also set equals color via setLabelColor', () => {
      const v = new Variable({ label: 'x' });
      v.setLabelColor('#00ff00');
      expect(v.equalsMobject.color).toBe('#00ff00');
    });

    it('should return this for chaining on setLabelColor', () => {
      const v = new Variable({ label: 'x' });
      const result = v.setLabelColor('#ff0000');
      expect(result).toBe(v);
    });

    it('should set value color via setValueColor', () => {
      const v = new Variable({ label: 'x' });
      v.setValueColor('#0000ff');
      expect(v.numberMobject.color).toBe('#0000ff');
    });

    it('should return this for chaining on setValueColor', () => {
      const v = new Variable({ label: 'x' });
      const result = v.setValueColor('#0000ff');
      expect(result).toBe(v);
    });

    it('should set both label and value colors via setColor', () => {
      const v = new Variable({ label: 'x' });
      v.setColor('#ffff00');
      expect(v.labelMobject.color).toBe('#ffff00');
      expect(v.equalsMobject.color).toBe('#ffff00');
      expect(v.numberMobject.color).toBe('#ffff00');
    });

    it('should return this for chaining on setColor', () => {
      const v = new Variable({ label: 'x' });
      const result = v.setColor('#ffff00');
      expect(result).toBe(v);
    });

    it('should accept custom labelColor in constructor', () => {
      const v = new Variable({ label: 'x', labelColor: '#aabbcc' });
      expect(v.labelMobject.color).toBe('#aabbcc');
    });

    it('should accept custom valueColor in constructor', () => {
      const v = new Variable({ label: 'x', valueColor: '#112233' });
      expect(v.numberMobject.color).toBe('#112233');
    });
  });

  // -----------------------------------------------------------
  // syncWithTracker
  // -----------------------------------------------------------
  describe('syncWithTracker', () => {
    it('should sync displayed value with tracker value', () => {
      const v = new Variable({ label: 'x', value: 0 });
      v.tracker.setValue(99);
      v.syncWithTracker();
      expect(v.getValue()).toBe(99);
    });

    it('should return this for chaining', () => {
      const v = new Variable({ label: 'x' });
      const result = v.syncWithTracker();
      expect(result).toBe(v);
    });

    it('should not change value if tracker has same value', () => {
      const v = new Variable({ label: 'x', value: 5 });
      v.syncWithTracker();
      expect(v.getValue()).toBe(5);
    });

    it('should sync after tracker is externally modified', () => {
      const v = new Variable({ label: 'x', value: 10 });
      v.tracker.setValue(20);
      expect(v.getValue()).toBe(10); // not yet synced
      v.syncWithTracker();
      expect(v.getValue()).toBe(20); // now synced
    });
  });

  // -----------------------------------------------------------
  // getCenter
  // -----------------------------------------------------------
  describe('getCenter', () => {
    it('should return origin by default', () => {
      const v = new Variable({ label: 'x' });
      expect(v.getCenter()).toEqual([0, 0, 0]);
    });

    it('should reflect position changes', () => {
      const v = new Variable({ label: 'x' });
      v.position.set(1, 2, 3);
      expect(v.getCenter()).toEqual([1, 2, 3]);
    });
  });

  // -----------------------------------------------------------
  // waitForRender
  // -----------------------------------------------------------
  describe('waitForRender', () => {
    it('should return a promise', () => {
      const v = new Variable({ label: 'x' });
      const result = v.waitForRender();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  // -----------------------------------------------------------
  // copy
  // -----------------------------------------------------------
  describe('copy', () => {
    it('should create an independent copy', () => {
      const original = new Variable({ label: 'x', value: 42 });
      const clone = original.copy() as Variable;
      expect(clone).toBeInstanceOf(Variable);
      expect(clone.getValue()).toBe(42);
    });

    it('should not be affected by changes to the original', () => {
      const original = new Variable({ label: 'x', value: 5 });
      const clone = original.copy() as Variable;
      original.setValue(100);
      expect(clone.getValue()).toBe(5);
    });

    it('should not affect original when copy is modified', () => {
      const original = new Variable({ label: 'x', value: 5 });
      const clone = original.copy() as Variable;
      clone.setValue(100);
      expect(original.getValue()).toBe(5);
    });

    it('should preserve label in copy', () => {
      const original = new Variable({ label: '\\theta', value: 3.14 });
      const clone = original.copy() as Variable;
      expect(clone.labelMobject.getLatex()).toBe('\\theta');
    });
  });

  // -----------------------------------------------------------
  // _createThreeObject
  // -----------------------------------------------------------
  describe('_createThreeObject via getThreeObject', () => {
    it('should create a THREE group with child objects', () => {
      const v = new Variable({ label: 'x', value: 5 });
      const obj = v.getThreeObject();
      expect(obj).toBeDefined();
      expect(obj.children.length).toBeGreaterThanOrEqual(3);
    });
  });

  // -----------------------------------------------------------
  // dispose
  // -----------------------------------------------------------
  describe('dispose', () => {
    it('should not throw when called', () => {
      const v = new Variable({ label: 'x', value: 5 });
      expect(() => v.dispose()).not.toThrow();
    });

    it('should not throw when called twice', () => {
      const v = new Variable({ label: 'x' });
      v.dispose();
      expect(() => v.dispose()).not.toThrow();
    });
  });
});
