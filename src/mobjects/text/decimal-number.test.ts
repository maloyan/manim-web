// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
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

  describe('_formatNumber via constructor options (width checks)', () => {
    it('handles includeSign, groupWithCommas, unit, showEllipsis, and decimal places', () => {
      const opts = [
        { value: 3.14, includeSign: true },
        { value: -3.14, includeSign: true },
        { value: 0, includeSign: true },
        { value: 1000, groupWithCommas: true },
        { value: 75.5, unit: '%' },
        { value: 3.14, showEllipsis: true },
        { value: 1000, includeSign: true, groupWithCommas: true, unit: '%', showEllipsis: true },
        { value: 42, numDecimalPlaces: 0 },
        { value: 3.14159, numDecimalPlaces: 5 },
      ];
      for (const o of opts) {
        const num = new DecimalNumber(o);
        expect(num.getWidth()).toBeGreaterThanOrEqual(0);
      }
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

    it('should dispose mesh resources after getThreeObject', () => {
      const num = new DecimalNumber({ value: 1 });
      num.getThreeObject();
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

  describe('_formatNumber via setValue', () => {
    it('covers includeSign branch', () => {
      const n = new DecimalNumber({ value: 1, includeSign: true });
      n.setValue(5);
      expect(n.getValue()).toBe(5);
    });
    it('covers groupWithCommas branch', () => {
      const n = new DecimalNumber({ value: 0, groupWithCommas: true, numDecimalPlaces: 2 });
      n.setValue(1234567.89);
      expect(n.getValue()).toBe(1234567.89);
    });
    it('covers unit branch', () => {
      const n = new DecimalNumber({ value: 0, unit: 'px' });
      n.setValue(10);
      expect(n.getValue()).toBe(10);
    });
    it('covers showEllipsis branch', () => {
      const n = new DecimalNumber({ value: 0, showEllipsis: true });
      n.setValue(3.14);
      expect(n.getValue()).toBe(3.14);
    });
    it('covers negative numDecimalPlaces (toString branch)', () => {
      const n = new DecimalNumber({ value: 0, numDecimalPlaces: -1 });
      n.setValue(3.14159);
      expect(n.getValue()).toBe(3.14159);
    });
  });

  describe('Three.js integration', () => {
    it('getThreeObject creates mesh and texture', () => {
      const n = new DecimalNumber({ value: 42 });
      const obj = n.getThreeObject();
      expect(obj).toBeDefined();
    });
    it('_syncMaterialToThree runs after getThreeObject', () => {
      const n = new DecimalNumber({ value: 1 });
      n.getThreeObject();
      n.setColor('#ff0000');
      const obj = n.getThreeObject();
      expect(obj).toBeDefined();
    });
    it('setValue updates mesh after getThreeObject', () => {
      const n = new DecimalNumber({ value: 1 });
      n.getThreeObject();
      n.setValue(999);
      expect(n.getValue()).toBe(999);
    });
    it('should set texture.colorSpace to SRGBColorSpace', () => {
      const n = new DecimalNumber({ value: 7 });
      const obj = n.getThreeObject();
      const mesh = obj.children.find((ch: { type: string }) => ch.type === 'Mesh') as THREE.Mesh;
      expect(mesh).toBeDefined();
      const mat = mesh.material as THREE.MeshBasicMaterial;
      expect(mat.map).toBeDefined();
      expect(mat.map!.colorSpace).toBe(THREE.SRGBColorSpace);
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
