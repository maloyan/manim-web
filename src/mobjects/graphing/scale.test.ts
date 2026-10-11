import { describe, it, expect } from 'vitest';
import { ScaleBase, LinearBase, LogBase } from './scale';

describe('LinearBase', () => {
  it('scales by the scale factor', () => {
    const scale = new LinearBase(3);
    expect(scale.function(4)).toBe(12);
    expect(scale.inverseFunction(12)).toBe(4);
  });

  it('defaults to a scale factor of 1 (identity)', () => {
    const scale = new LinearBase();
    expect(scale.scaleFactor).toBe(1);
    expect(scale.function(7)).toBe(7);
    expect(scale.inverseFunction(7)).toBe(7);
  });

  it('round-trips function and inverseFunction', () => {
    const scale = new LinearBase(2.5);
    for (const value of [-3, 0, 1.5, 42]) {
      expect(scale.inverseFunction(scale.function(value))).toBeCloseTo(value, 12);
    }
  });

  it('has no custom labels', () => {
    const scale = new LinearBase();
    expect(scale.customLabels).toBe(false);
    expect(() => scale.getCustomLabels([1, 2])).toThrow();
  });

  it('is a ScaleBase', () => {
    expect(new LinearBase()).toBeInstanceOf(ScaleBase);
  });
});

describe('LogBase', () => {
  it('maps function(2) to 100 for base 10', () => {
    const scale = new LogBase(10);
    expect(scale.function(2)).toBe(100);
  });

  it('maps inverseFunction(100) to 2 for base 10', () => {
    const scale = new LogBase(10);
    expect(scale.inverseFunction(100)).toBeCloseTo(2, 12);
  });

  it('round-trips function and inverseFunction', () => {
    const scale = new LogBase(10);
    for (const value of [0.5, 1, 3]) {
      expect(scale.inverseFunction(scale.function(value))).toBeCloseTo(value, 12);
    }
  });

  it('supports a custom base', () => {
    const scale = new LogBase(2);
    expect(scale.function(10)).toBe(1024);
    expect(scale.inverseFunction(1024)).toBeCloseTo(10, 12);
  });

  it('throws for non-positive values in inverseFunction', () => {
    const scale = new LogBase(10);
    expect(() => scale.inverseFunction(0)).toThrow(/log\(0\) is undefined/);
    expect(() => scale.inverseFunction(-5)).toThrow();
  });

  it('enables custom labels by default', () => {
    expect(new LogBase().customLabels).toBe(true);
    expect(new LogBase(10, false).customLabels).toBe(false);
  });

  it('produces base^exponent tick labels', () => {
    const scale = new LogBase(10);
    // tick values 10^1 .. 10^3 -> exponents 1, 2, 3
    const labels = scale.getCustomLabels([10, 100, 1000]);
    expect(labels.map((label) => label.getLatex())).toEqual(['10^{1}', '10^{2}', '10^{3}']);
  });

  it('honors unitDecimalPlaces in labels', () => {
    const scale = new LogBase(10);
    const labels = scale.getCustomLabels([100], { unitDecimalPlaces: 2 });
    expect(labels[0].getLatex()).toBe('10^{2.00}');
  });
});
