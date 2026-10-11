import { describe, it, expect } from 'vitest';
import {
  PI,
  TAU,
  DEGREES,
  X_AXIS,
  Y_AXIS,
  Z_AXIS,
  DEFAULT_DOT_RADIUS,
  DEFAULT_SMALL_DOT_RADIUS,
  DEFAULT_DASH_LENGTH,
  DEFAULT_ARROW_TIP_LENGTH,
  NORMAL,
  BOLD,
  THIN,
  LIGHT,
  MEDIUM,
  SEMIBOLD,
  HEAVY,
  ULTRAHEAVY,
  ULTRALIGHT,
  SEMILIGHT,
  BOOK,
  ULTRABOLD,
  ITALIC,
  OBLIQUE,
  DEFAULT_WAIT_TIME,
  DEFAULT_POINTWISE_FUNCTION_RUN_TIME,
  DEFAULT_POINT_DENSITY_2D,
  DEFAULT_POINT_DENSITY_1D,
  SCALE_FACTOR_PER_FONT_POINT,
  START_X,
  START_Y,
  LineJointType,
  CapStyleType,
} from './parity';

describe('ManimCE parity constants', () => {
  describe('mathematical constants', () => {
    it('PI equals Math.PI', () => {
      expect(PI).toBeCloseTo(Math.PI, 12);
    });

    it('TAU equals 2 * PI', () => {
      expect(TAU).toBeCloseTo(2 * Math.PI, 12);
    });

    it('DEGREES equals PI / 180 (radians per degree)', () => {
      expect(DEGREES).toBeCloseTo(Math.PI / 180, 12);
    });

    it('DEGREES equals TAU / 360', () => {
      expect(DEGREES).toBeCloseTo(TAU / 360, 12);
    });
  });

  describe('unit basis axes', () => {
    it('X_AXIS is [1, 0, 0]', () => {
      expect(X_AXIS).toEqual([1, 0, 0]);
    });

    it('Y_AXIS is [0, 1, 0]', () => {
      expect(Y_AXIS).toEqual([0, 1, 0]);
    });

    it('Z_AXIS is [0, 0, 1]', () => {
      expect(Z_AXIS).toEqual([0, 0, 1]);
    });
  });

  describe('geometry defaults', () => {
    it('DEFAULT_DOT_RADIUS is 0.08', () => {
      expect(DEFAULT_DOT_RADIUS).toBe(0.08);
    });

    it('DEFAULT_SMALL_DOT_RADIUS is 0.04', () => {
      expect(DEFAULT_SMALL_DOT_RADIUS).toBe(0.04);
    });

    it('DEFAULT_DASH_LENGTH is 0.05', () => {
      expect(DEFAULT_DASH_LENGTH).toBe(0.05);
    });

    it('DEFAULT_ARROW_TIP_LENGTH is 0.35', () => {
      expect(DEFAULT_ARROW_TIP_LENGTH).toBe(0.35);
    });
  });

  describe('font weights (Pango names)', () => {
    it('match ManimCE string values', () => {
      expect(NORMAL).toBe('NORMAL');
      expect(BOLD).toBe('BOLD');
      expect(THIN).toBe('THIN');
      expect(LIGHT).toBe('LIGHT');
      expect(MEDIUM).toBe('MEDIUM');
      expect(SEMIBOLD).toBe('SEMIBOLD');
      expect(HEAVY).toBe('HEAVY');
      expect(ULTRAHEAVY).toBe('ULTRAHEAVY');
    });
  });

  describe('LineJointType enum', () => {
    it('has ManimCE members and values', () => {
      expect(LineJointType.AUTO).toBe(0);
      expect(LineJointType.ROUND).toBe(1);
      expect(LineJointType.BEVEL).toBe(2);
      expect(LineJointType.MITER).toBe(3);
    });
  });

  describe('CapStyleType enum', () => {
    it('has ManimCE members and values', () => {
      expect(CapStyleType.AUTO).toBe(0);
      expect(CapStyleType.ROUND).toBe(1);
      expect(CapStyleType.BUTT).toBe(2);
      expect(CapStyleType.SQUARE).toBe(3);
    });
  });

  describe('extra font weights and slants', () => {
    it('exposes the Pango weight and slant names', () => {
      expect(ULTRALIGHT).toBe('ULTRALIGHT');
      expect(SEMILIGHT).toBe('SEMILIGHT');
      expect(BOOK).toBe('BOOK');
      expect(ULTRABOLD).toBe('ULTRABOLD');
      expect(ITALIC).toBe('ITALIC');
      expect(OBLIQUE).toBe('OBLIQUE');
    });
  });

  describe('simple defaults (verbatim from ManimCE)', () => {
    it('matches ManimCE values', () => {
      expect(DEFAULT_WAIT_TIME).toBe(1.0);
      expect(DEFAULT_POINTWISE_FUNCTION_RUN_TIME).toBe(3.0);
      expect(DEFAULT_POINT_DENSITY_2D).toBe(25);
      expect(DEFAULT_POINT_DENSITY_1D).toBe(10);
      expect(SCALE_FACTOR_PER_FONT_POINT).toBeCloseTo(1 / 960, 12);
      expect(START_X).toBe(30);
      expect(START_Y).toBe(20);
    });
  });
});
