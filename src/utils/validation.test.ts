import { describe, it, expect } from 'vitest';
import { assertIsPlainOptions, assertNumberOption, assertLatexOption } from './validation';

describe('validation helpers', () => {
  describe('assertIsPlainOptions', () => {
    it('should accept plain objects', () => {
      expect(() => assertIsPlainOptions({ duration: 1 }, 'test')).not.toThrow();
      expect(() => assertIsPlainOptions({}, 'test')).not.toThrow();
      expect(() => assertIsPlainOptions(undefined, 'test')).not.toThrow();
    });

    it('should reject non-objects', () => {
      expect(() => assertIsPlainOptions(null, 'test')).toThrow(TypeError);
      expect(() => assertIsPlainOptions('string', 'test')).toThrow(TypeError);
      expect(() => assertIsPlainOptions(123, 'test')).toThrow(TypeError);
      expect(() => assertIsPlainOptions([1, 2, 3], 'test')).toThrow(TypeError);
    });

    it('should reject Animation instances (by heuristic)', () => {
      const fakeAnimation = { interpolate: () => {} };
      expect(() => assertIsPlainOptions(fakeAnimation, 'test')).toThrow(
        /received an Animation instance/,
      );
    });

    it('should reject Mobject instances (by heuristic)', () => {
      const fakeMobject = { getPoints: () => [] };
      expect(() => assertIsPlainOptions(fakeMobject, 'test')).toThrow(
        /received a Mobject-like instance/,
      );
    });
  });

  describe('assertNumberOption', () => {
    it('should extract valid numeric options', () => {
      const val = assertNumberOption({ angle: 1.5 }, 'angle', 'test');
      expect(val).toBe(1.5);
    });

    it('should reject missing options', () => {
      expect(() => assertNumberOption(undefined, 'angle', 'test')).toThrow(TypeError);
      expect(() => assertNumberOption({}, 'angle', 'test')).toThrow(TypeError);
    });

    it('should reject non-numeric values', () => {
      expect(() => assertNumberOption({ angle: 'NaN' }, 'angle', 'test')).toThrow(TypeError);
      expect(() => assertNumberOption({ angle: NaN }, 'angle', 'test')).toThrow(TypeError);
      expect(() => assertNumberOption({ angle: Infinity }, 'angle', 'test')).toThrow(TypeError);
    });
  });

  describe('assertLatexOption', () => {
    it('should accept string latex', () => {
      const val = assertLatexOption({ latex: 'x^2' }, 'latex', 'test');
      expect(val).toBe('x^2');
    });

    it('should accept string array latex', () => {
      const val = assertLatexOption({ latex: ['x', '^2'] }, 'latex', 'test');
      expect(val).toEqual(['x', '^2']);
    });

    it('should reject missing latex', () => {
      expect(() => assertLatexOption(undefined, 'latex', 'test')).toThrow(TypeError);
      expect(() => assertLatexOption({}, 'latex', 'test')).toThrow(TypeError);
    });

    it('should reject invalid types', () => {
      expect(() => assertLatexOption({ latex: 123 }, 'latex', 'test')).toThrow(TypeError);
      expect(() => assertLatexOption({ latex: ['x', 2] }, 'latex', 'test')).toThrow(TypeError);
    });
  });
});
