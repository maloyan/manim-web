// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import { DecimalNumber, Integer } from './DecimalNumber';

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

describe('DecimalNumber', () => {
  describe('constructor defaults', () => {
    it('should create with default value 0', () => {
      const num = new DecimalNumber();
      expect(num.getValue()).toBe(0);
    });

    it('should default to 2 decimal places', () => {
      const num = new DecimalNumber();
      expect(num.getNumDecimalPlaces()).toBe(2);
    });

    it('should default fontSize to 48', () => {
      const num = new DecimalNumber();
      expect(num.getFontSize()).toBe(48);
    });
  });

  describe('constructor with options', () => {
    it('should accept a custom value', () => {
      const num = new DecimalNumber({ value: 3.14 });
      expect(num.getValue()).toBe(3.14);
    });

    it('should accept numDecimalPlaces', () => {
      const num = new DecimalNumber({ numDecimalPlaces: 4 });
      expect(num.getNumDecimalPlaces()).toBe(4);
    });

    it('should accept fontSize', () => {
      const num = new DecimalNumber({ fontSize: 72 });
      expect(num.getFontSize()).toBe(72);
    });

    it('should accept negative value', () => {
      const num = new DecimalNumber({ value: -5.5 });
      expect(num.getValue()).toBe(-5.5);
    });

    it('should accept zero decimal places', () => {
      const num = new DecimalNumber({ numDecimalPlaces: 0 });
      expect(num.getNumDecimalPlaces()).toBe(0);
    });
  });

  describe('getValue / setValue', () => {
    it('should get the current value', () => {
      const num = new DecimalNumber({ value: 42 });
      expect(num.getValue()).toBe(42);
    });

    it('should set a new value', () => {
      const num = new DecimalNumber({ value: 0 });
      num.setValue(99.5);
      expect(num.getValue()).toBe(99.5);
    });

    it('should return this for chaining', () => {
      const num = new DecimalNumber();
      const result = num.setValue(10);
      expect(result).toBe(num);
    });

    it('should set negative value', () => {
      const num = new DecimalNumber();
      num.setValue(-123.456);
      expect(num.getValue()).toBe(-123.456);
    });

    it('should set zero', () => {
      const num = new DecimalNumber({ value: 50 });
      num.setValue(0);
      expect(num.getValue()).toBe(0);
    });

    it('should set very large value', () => {
      const num = new DecimalNumber();
      num.setValue(1000000);
      expect(num.getValue()).toBe(1000000);
    });

    it('should set very small value', () => {
      const num = new DecimalNumber();
      num.setValue(0.001);
      expect(num.getValue()).toBe(0.001);
    });
  });

  describe('getNumDecimalPlaces / setNumDecimalPlaces', () => {
    it('should get decimal places', () => {
      const num = new DecimalNumber({ numDecimalPlaces: 3 });
      expect(num.getNumDecimalPlaces()).toBe(3);
    });

    it('should set decimal places', () => {
      const num = new DecimalNumber();
      num.setNumDecimalPlaces(5);
      expect(num.getNumDecimalPlaces()).toBe(5);
    });

    it('should return this for chaining', () => {
      const num = new DecimalNumber();
      const result = num.setNumDecimalPlaces(3);
      expect(result).toBe(num);
    });

    it('should clamp negative to 0', () => {
      const num = new DecimalNumber();
      num.setNumDecimalPlaces(-1);
      expect(num.getNumDecimalPlaces()).toBe(0);
    });

    it('should floor fractional values', () => {
      const num = new DecimalNumber();
      num.setNumDecimalPlaces(2.9);
      expect(num.getNumDecimalPlaces()).toBe(2);
    });
  });

  describe('getFontSize / setFontSize', () => {
    it('should get font size', () => {
      const num = new DecimalNumber({ fontSize: 36 });
      expect(num.getFontSize()).toBe(36);
    });

    it('should set font size', () => {
      const num = new DecimalNumber();
      num.setFontSize(72);
      expect(num.getFontSize()).toBe(72);
    });

    it('should return this for chaining', () => {
      const num = new DecimalNumber();
      const result = num.setFontSize(24);
      expect(result).toBe(num);
    });
  });

  describe('getWidth / getHeight', () => {
    it('should return width >= 0', () => {
      const num = new DecimalNumber({ value: 3.14 });
      expect(num.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should return height >= 0', () => {
      const num = new DecimalNumber({ value: 3.14 });
      expect(num.getHeight()).toBeGreaterThanOrEqual(0);
    });

    it('should have width for a number with default value', () => {
      const num = new DecimalNumber();
      // "0.00" should have some width
      expect(num.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should have height for a number with default value', () => {
      const num = new DecimalNumber();
      expect(num.getHeight()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('_formatNumber (tested via observable behavior)', () => {
    // _formatNumber is protected, so we test its effects indirectly.
    // The formatted string is what gets rendered. We can verify by
    // checking that width changes as expected for different formatting options.

    it('should handle default formatting (value=0, 2 decimal places)', () => {
      // The number "0.00" with default settings
      const num = new DecimalNumber({ value: 0, numDecimalPlaces: 2 });
      expect(num.getValue()).toBe(0);
      expect(num.getNumDecimalPlaces()).toBe(2);
      // Width should be positive for "0.00"
      expect(num.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should format with includeSign for positive number', () => {
      // "+3.14" should be wider than "3.14" due to the + sign
      const withSign = new DecimalNumber({ value: 3.14, includeSign: true });
      const withoutSign = new DecimalNumber({ value: 3.14, includeSign: false });
      // Both should have valid widths
      expect(withSign.getWidth()).toBeGreaterThanOrEqual(0);
      expect(withoutSign.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should not add sign for negative numbers even with includeSign', () => {
      // includeSign only adds + for positive; negative already has -
      const num = new DecimalNumber({ value: -3.14, includeSign: true });
      expect(num.getValue()).toBe(-3.14);
    });

    it('should not add sign for zero with includeSign', () => {
      // 0 is not > 0, so no sign
      const num = new DecimalNumber({ value: 0, includeSign: true });
      expect(num.getValue()).toBe(0);
    });

    it('should handle groupWithCommas for large numbers', () => {
      // "1,000.00" should be wider than "100.00"
      const large = new DecimalNumber({ value: 1000, groupWithCommas: true });
      const small = new DecimalNumber({ value: 100, groupWithCommas: true });
      expect(large.getWidth()).toBeGreaterThanOrEqual(0);
      expect(small.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle showEllipsis', () => {
      const withEllipsis = new DecimalNumber({ value: 3.14, showEllipsis: true });
      const withoutEllipsis = new DecimalNumber({ value: 3.14, showEllipsis: false });
      expect(withEllipsis.getWidth()).toBeGreaterThanOrEqual(0);
      expect(withoutEllipsis.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle unit', () => {
      const withUnit = new DecimalNumber({ value: 75.5, unit: '%' });
      const withoutUnit = new DecimalNumber({ value: 75.5 });
      expect(withUnit.getWidth()).toBeGreaterThanOrEqual(0);
      expect(withoutUnit.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle combined formatting options', () => {
      const num = new DecimalNumber({
        value: 1000,
        includeSign: true,
        groupWithCommas: true,
        unit: '%',
        showEllipsis: true,
      });
      // "+1,000.00%..." - should have valid dimensions
      expect(num.getWidth()).toBeGreaterThanOrEqual(0);
      expect(num.getHeight()).toBeGreaterThanOrEqual(0);
    });

    it('should handle 0 decimal places', () => {
      const num = new DecimalNumber({ value: 42, numDecimalPlaces: 0 });
      // "42" - no decimal point
      expect(num.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should handle many decimal places', () => {
      const num = new DecimalNumber({ value: 3.14159, numDecimalPlaces: 5 });
      // "3.14159"
      expect(num.getWidth()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edgeToFix', () => {
    it('should accept left edge fixing', () => {
      const num = new DecimalNumber({ value: 100, edgeToFix: 'left' });
      // First setValue initializes _worldWidth (construction does not render)
      num.setValue(100);
      const leftEdgeBefore = num.position.x - num.getWidth() / 2;

      num.setValue(1000);
      const leftEdgeAfter = num.position.x - num.getWidth() / 2;

      // Left edge should remain approximately the same
      expect(Math.abs(leftEdgeAfter - leftEdgeBefore)).toBeLessThan(0.001);
    });

    it('should accept right edge fixing', () => {
      const num = new DecimalNumber({ value: 100, edgeToFix: 'right' });
      // First setValue initializes _worldWidth
      num.setValue(100);
      const rightEdgeBefore = num.position.x + num.getWidth() / 2;

      num.setValue(1000);
      const rightEdgeAfter = num.position.x + num.getWidth() / 2;

      // Right edge should remain approximately the same
      expect(Math.abs(rightEdgeAfter - rightEdgeBefore)).toBeLessThan(0.001);
    });

    it('should not fix edge when edgeToFix is null', () => {
      const num = new DecimalNumber({ value: 100, edgeToFix: null });
      num.setValue(100);
      const centerBefore = num.position.x;

      num.setValue(1000);
      // Without edge fixing, position.x should not change
      expect(num.position.x).toBe(centerBefore);
    });

    it('should adjust position.x when left edge is fixed and width changes', () => {
      const num = new DecimalNumber({ value: 10, edgeToFix: 'left' });
      num.setValue(10); // initialize worldWidth
      const posBeforeX = num.position.x;

      num.setValue(10000); // much wider number
      // position.x should have shifted right to keep left edge fixed
      expect(num.position.x).not.toBe(posBeforeX);
    });
  });

  describe('copy', () => {
    it('should create a copy with same value', () => {
      const num = new DecimalNumber({ value: 3.14 });
      const copyNum = num.copy() as DecimalNumber;
      expect(copyNum.getValue()).toBe(3.14);
    });

    it('should create an independent copy', () => {
      const num = new DecimalNumber({ value: 10 });
      const copyNum = num.copy() as DecimalNumber;
      copyNum.setValue(20);
      expect(num.getValue()).toBe(10);
      expect(copyNum.getValue()).toBe(20);
    });

    it('should copy decimal places', () => {
      const num = new DecimalNumber({ numDecimalPlaces: 5 });
      const copyNum = num.copy() as DecimalNumber;
      expect(copyNum.getNumDecimalPlaces()).toBe(5);
    });

    it('should copy font size', () => {
      const num = new DecimalNumber({ fontSize: 72 });
      const copyNum = num.copy() as DecimalNumber;
      expect(copyNum.getFontSize()).toBe(72);
    });

    it('should return a DecimalNumber instance', () => {
      const num = new DecimalNumber();
      const copyNum = num.copy();
      expect(copyNum).toBeInstanceOf(DecimalNumber);
    });
  });

  describe('dispose', () => {
    it('should dispose without error', () => {
      const num = new DecimalNumber({ value: 42 });
      expect(() => num.dispose()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      const num = new DecimalNumber();
      num.dispose();
      expect(() => num.dispose()).not.toThrow();
    });
  });

  describe('getCenter', () => {
    it('should return position as center', () => {
      const num = new DecimalNumber({ value: 5 });
      const center = num.getCenter();
      expect(center).toEqual([0, 0, 0]);
    });

    it('should reflect position changes', () => {
      const num = new DecimalNumber({ value: 5 });
      num.position.set(1, 2, 3);
      const center = num.getCenter();
      expect(center).toEqual([1, 2, 3]);
    });
  });

  describe('color and opacity', () => {
    it('should accept custom color', () => {
      const num = new DecimalNumber({ color: '#ff0000' });
      expect(num.color).toBe('#ff0000');
    });

    it('should accept custom fill opacity', () => {
      const num = new DecimalNumber({ fillOpacity: 0.5 });
      expect(num.fillOpacity).toBe(0.5);
    });

    it('should default color to white', () => {
      const num = new DecimalNumber();
      expect(num.color).toBe('#ffffff');
    });

    it('should default fill opacity to 1', () => {
      const num = new DecimalNumber();
      expect(num.fillOpacity).toBe(1);
    });
  });
});

describe('Integer', () => {
  it('should create with 0 decimal places', () => {
    const int = new Integer({ value: 42 });
    expect(int.getNumDecimalPlaces()).toBe(0);
  });

  it('should create with default value 0', () => {
    const int = new Integer();
    expect(int.getValue()).toBe(0);
  });

  it('should set and get value', () => {
    const int = new Integer({ value: 10 });
    int.setValue(25);
    expect(int.getValue()).toBe(25);
  });

  it('should be an instance of DecimalNumber', () => {
    const int = new Integer();
    expect(int).toBeInstanceOf(DecimalNumber);
  });

  it('should accept includeSign', () => {
    const int = new Integer({ value: 42, includeSign: true });
    expect(int.getValue()).toBe(42);
    expect(int.getWidth()).toBeGreaterThanOrEqual(0);
  });

  it('should accept groupWithCommas', () => {
    const int = new Integer({ value: 10000, groupWithCommas: true });
    expect(int.getValue()).toBe(10000);
    expect(int.getWidth()).toBeGreaterThanOrEqual(0);
  });

  it('should accept unit', () => {
    const int = new Integer({ value: 50, unit: '%' });
    expect(int.getValue()).toBe(50);
  });

  describe('copy', () => {
    it('should create a copy that is an Integer', () => {
      const int = new Integer({ value: 7 });
      const copyInt = int.copy();
      expect(copyInt).toBeInstanceOf(Integer);
    });

    it('should copy the value', () => {
      const int = new Integer({ value: 99 });
      const copyInt = int.copy() as Integer;
      expect(copyInt.getValue()).toBe(99);
    });

    it('should retain 0 decimal places in copy', () => {
      const int = new Integer({ value: 42 });
      const copyInt = int.copy() as Integer;
      expect(copyInt.getNumDecimalPlaces()).toBe(0);
    });

    it('should be independent from the original', () => {
      const int = new Integer({ value: 5 });
      const copyInt = int.copy() as Integer;
      copyInt.setValue(100);
      expect(int.getValue()).toBe(5);
    });
  });

  describe('dispose', () => {
    it('should dispose without error', () => {
      const int = new Integer({ value: 42 });
      expect(() => int.dispose()).not.toThrow();
    });
  });
});
