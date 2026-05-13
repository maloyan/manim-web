import { describe, it, expect } from 'vitest';
import { Rotate, MathTex, Circle } from './index';

describe('Argument Validation Tests', () => {
  describe('Rotate animation validation', () => {
    const circle = new Circle({ radius: 1 });

    it('should throw for new Rotate(circle, { duration: 1 })', () => {
      expect(() => {
        new Rotate(circle, { duration: 1 } as any);
      }).toThrow(/required numeric option 'angle'/);
    });

    it('should throw when angle is missing', () => {
      expect(() => {
        new Rotate(circle, {} as any);
      }).toThrow(/required numeric option 'angle'/);
    });

    it('should throw when angle is NaN', () => {
      expect(() => {
        new Rotate(circle, { angle: NaN } as any);
      }).toThrow(/required numeric option 'angle'/);
    });

    it('should throw when angle is not a number', () => {
      expect(() => {
        new Rotate(circle, { angle: 'not a number' } as any);
      }).toThrow(/required numeric option 'angle'/);
    });

    it('should throw when options is not a plain object', () => {
      expect(() => {
        // Pass an array as options
        new Rotate(circle, [] as any);
      }).toThrow(/options must be a plain object/);
    });

    it('should accept valid angle', () => {
      expect(() => {
        new Rotate(circle, { angle: Math.PI / 4, duration: 1 });
      }).not.toThrow();
    });
  });

  describe('MathTex validation', () => {
    it('should throw when latex is missing', () => {
      expect(() => {
        new MathTex({} as any);
      }).toThrow(/required option 'latex'/);
    });

    it('should throw when latex is not a string or string[]', () => {
      expect(() => {
        new MathTex({ latex: 123 } as any);
      }).toThrow(/required option 'latex'/);
    });

    it('should throw when latex array contains non-strings', () => {
      expect(() => {
        new MathTex({ latex: ['x', 2, 'y'] } as any);
      }).toThrow(/required option 'latex'/);
    });

    it('should throw when options is not a plain object', () => {
      expect(() => {
        // Pass an array as options
        new MathTex([] as any);
      }).toThrow(/options must be a plain object/);
    });

    it('should not throw when created with valid string latex', () => {
      expect(() => {
        new MathTex({ latex: 'x^2', color: '#fff' });
      }).not.toThrow();
    });

    it('should not throw when created with valid string array latex', () => {
      expect(() => {
        new MathTex({ latex: ['x', '^2'], color: '#fff' });
      }).not.toThrow();
    });
  });

  describe('Animation base class validation', () => {
    it('should detect accidental Animation instance as options', () => {
      const circle = new Circle({ radius: 1 });
      const fakeAnimation = { interpolate: () => {} };

      expect(() => {
        new Rotate(circle, fakeAnimation as any);
      }).toThrow(/received an Animation instance/);
    });

    it('should detect accidental Mobject instance as options', () => {
      const circle = new Circle({ radius: 1 });
      const fakeMobject = { getPoints: () => [] };

      expect(() => {
        new Rotate(circle, fakeMobject as any);
      }).toThrow(/received a Mobject-like instance/);
    });
  });

  describe('Mobject.rotate() validation', () => {
    const circle = new Circle({ radius: 1 });

    it('should reject missing angle', () => {
      expect(() => {
        // @ts-expect-error - intentionally missing required angle
        circle.rotate();
      }).toThrow(/Mobject\.rotate: angle must be a finite number/);
    });

    it('should accept valid options object', () => {
      expect(() => {
        circle.rotate(Math.PI / 4, { axis: [0, 0, 1] });
      }).not.toThrow();
    });

    it('should reject non-plain objects as options', () => {
      const fakeAnimation = { interpolate: () => {} };
      expect(() => {
        circle.rotate(Math.PI / 4, fakeAnimation as any);
      }).toThrow(/received an Animation instance/);
    });

    it('should accept axis as Vector3Tuple', () => {
      expect(() => {
        circle.rotate(Math.PI / 4, [1, 0, 0]);
      }).not.toThrow();
    });
  });
});
