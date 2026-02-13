import { describe, it, expect } from 'vitest';
import {
  ValueTracker,
  ComplexValueTracker,
  valueTracker,
  complexValueTracker,
} from './ValueTracker';

describe('ValueTracker', () => {
  it('constructs with default value 0', () => {
    const vt = new ValueTracker();
    expect(vt.getValue()).toBe(0);
  });

  it('constructs with numeric value', () => {
    const vt = new ValueTracker(5);
    expect(vt.getValue()).toBe(5);
  });

  it('constructs with negative value', () => {
    const vt = new ValueTracker(-3.14);
    expect(vt.getValue()).toBe(-3.14);
  });

  it('constructs with options object', () => {
    const vt = new ValueTracker({ value: 42 });
    expect(vt.getValue()).toBe(42);
  });

  it('constructs with empty options object', () => {
    const vt = new ValueTracker({});
    expect(vt.getValue()).toBe(0);
  });

  it('setValue updates the value', () => {
    const vt = new ValueTracker(0);
    vt.setValue(10);
    expect(vt.getValue()).toBe(10);
  });

  it('setValue returns this for chaining', () => {
    const vt = new ValueTracker(0);
    const result = vt.setValue(5);
    expect(result).toBe(vt);
  });

  it('incrementValue adds to current value', () => {
    const vt = new ValueTracker(10);
    vt.incrementValue(5);
    expect(vt.getValue()).toBe(15);
  });

  it('incrementValue with negative amount subtracts', () => {
    const vt = new ValueTracker(10);
    vt.incrementValue(-3);
    expect(vt.getValue()).toBe(7);
  });

  it('incrementValue returns this for chaining', () => {
    const vt = new ValueTracker(0);
    const result = vt.incrementValue(1);
    expect(result).toBe(vt);
  });

  it('getCenter returns position-based center', () => {
    const vt = new ValueTracker(5);
    const center = vt.getCenter();
    expect(center).toEqual([0, 0, 0]);
  });

  it('animateTo returns an Animation', () => {
    const vt = new ValueTracker(0);
    const anim = vt.animateTo(10);
    expect(anim).toBeDefined();
    expect(typeof anim.interpolate).toBe('function');
  });

  it('animate is alias for animateTo', () => {
    const vt = new ValueTracker(0);
    const anim = vt.animate(10);
    expect(anim).toBeDefined();
    expect(typeof anim.interpolate).toBe('function');
  });
});

describe('ComplexValueTracker', () => {
  it('constructs with default value {re: 0, im: 0}', () => {
    const ct = new ComplexValueTracker();
    expect(ct.getValue()).toEqual({ re: 0, im: 0 });
  });

  it('constructs with Complex value directly', () => {
    const ct = new ComplexValueTracker({ re: 3, im: 4 });
    expect(ct.getValue()).toEqual({ re: 3, im: 4 });
  });

  it('constructs with options object', () => {
    const ct = new ComplexValueTracker({ value: { re: 1, im: -2 } });
    expect(ct.getValue()).toEqual({ re: 1, im: -2 });
  });

  it('constructs with empty options object', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ct = new ComplexValueTracker({} as unknown as any);
    expect(ct.getValue()).toEqual({ re: 0, im: 0 });
  });

  it('getValue returns a copy (not a reference)', () => {
    const ct = new ComplexValueTracker({ re: 1, im: 2 });
    const v1 = ct.getValue();
    v1.re = 999;
    expect(ct.getValue().re).toBe(1);
  });

  it('getComplex is alias for getValue', () => {
    const ct = new ComplexValueTracker({ re: 5, im: 6 });
    expect(ct.getComplex()).toEqual(ct.getValue());
  });

  it('getReal returns real part', () => {
    const ct = new ComplexValueTracker({ re: 3, im: 4 });
    expect(ct.getReal()).toBe(3);
  });

  it('getImaginary returns imaginary part', () => {
    const ct = new ComplexValueTracker({ re: 3, im: 4 });
    expect(ct.getImaginary()).toBe(4);
  });

  it('getMagnitude returns correct magnitude', () => {
    const ct = new ComplexValueTracker({ re: 3, im: 4 });
    expect(ct.getMagnitude()).toBe(5);
  });

  it('getMagnitude of zero is zero', () => {
    const ct = new ComplexValueTracker();
    expect(ct.getMagnitude()).toBe(0);
  });

  it('getArgument returns correct angle', () => {
    const ct = new ComplexValueTracker({ re: 1, im: 0 });
    expect(ct.getArgument()).toBe(0);

    const ct2 = new ComplexValueTracker({ re: 0, im: 1 });
    expect(ct2.getArgument()).toBeCloseTo(Math.PI / 2);

    const ct3 = new ComplexValueTracker({ re: -1, im: 0 });
    expect(ct3.getArgument()).toBeCloseTo(Math.PI);
  });

  it('setValue updates the complex value', () => {
    const ct = new ComplexValueTracker();
    ct.setValue({ re: 7, im: 8 });
    expect(ct.getValue()).toEqual({ re: 7, im: 8 });
  });

  it('setValue returns this for chaining', () => {
    const ct = new ComplexValueTracker();
    const result = ct.setValue({ re: 1, im: 1 });
    expect(result).toBe(ct);
  });

  it('setFromPolar sets correct rectangular coordinates', () => {
    const ct = new ComplexValueTracker();
    ct.setFromPolar(1, 0);
    expect(ct.getReal()).toBeCloseTo(1);
    expect(ct.getImaginary()).toBeCloseTo(0);

    ct.setFromPolar(2, Math.PI / 2);
    expect(ct.getReal()).toBeCloseTo(0);
    expect(ct.getImaginary()).toBeCloseTo(2);
  });

  it('incrementValue adds complex values', () => {
    const ct = new ComplexValueTracker({ re: 1, im: 2 });
    ct.incrementValue({ re: 3, im: 4 });
    expect(ct.getValue()).toEqual({ re: 4, im: 6 });
  });

  it('incrementValue returns this for chaining', () => {
    const ct = new ComplexValueTracker();
    const result = ct.incrementValue({ re: 1, im: 1 });
    expect(result).toBe(ct);
  });

  it('getCenter returns [re + position.x, im + position.y, position.z]', () => {
    const ct = new ComplexValueTracker({ re: 3, im: 4 });
    const center = ct.getCenter();
    expect(center[0]).toBe(3);
    expect(center[1]).toBe(4);
    expect(center[2]).toBe(0);
  });

  it('animateTo returns an Animation', () => {
    const ct = new ComplexValueTracker();
    const anim = ct.animateTo({ re: 5, im: 5 });
    expect(anim).toBeDefined();
    expect(typeof anim.interpolate).toBe('function');
  });

  it('animate is alias for animateTo', () => {
    const ct = new ComplexValueTracker();
    const anim = ct.animate({ re: 5, im: 5 });
    expect(anim).toBeDefined();
  });
});

describe('Factory functions', () => {
  it('valueTracker creates a ValueTracker with default value', () => {
    const vt = valueTracker();
    expect(vt).toBeInstanceOf(ValueTracker);
    expect(vt.getValue()).toBe(0);
  });

  it('valueTracker creates a ValueTracker with given value', () => {
    const vt = valueTracker(42);
    expect(vt.getValue()).toBe(42);
  });

  it('complexValueTracker creates a ComplexValueTracker with default', () => {
    const ct = complexValueTracker();
    expect(ct).toBeInstanceOf(ComplexValueTracker);
    expect(ct.getValue()).toEqual({ re: 0, im: 0 });
  });

  it('complexValueTracker creates a ComplexValueTracker with given value', () => {
    const ct = complexValueTracker({ re: 1, im: 2 });
    expect(ct.getValue()).toEqual({ re: 1, im: 2 });
  });
});
