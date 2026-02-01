import { describe, it, expect } from 'vitest';
import {
  WHITE,
  BLACK,
  GRAY_A,
  GRAY_B,
  GRAY_C,
  GRAY_D,
  GRAY_E,
  LIGHTER_GRAY,
  LIGHT_GRAY,
  GRAY,
  DARK_GRAY,
  DARKER_GRAY,
  BLUE_A,
  BLUE_B,
  BLUE_C,
  BLUE_D,
  BLUE_E,
  PURE_BLUE,
  BLUE,
  DARK_BLUE,
  TEAL,
  GREEN,
  PURE_GREEN,
  YELLOW,
  GOLD,
  RED,
  RED_C,
  PURE_RED,
  MAROON,
  PURPLE,
  PINK,
  ORANGE,
  MANIM_BACKGROUND,
} from './colors';

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

describe('color constants', () => {
  describe('all colors should be valid hex strings', () => {
    const colors: Record<string, string> = {
      WHITE,
      BLACK,
      GRAY_A,
      GRAY_B,
      GRAY_C,
      GRAY_D,
      GRAY_E,
      BLUE_A,
      BLUE_B,
      BLUE_C,
      BLUE_D,
      BLUE_E,
      PURE_BLUE,
      TEAL,
      GREEN,
      PURE_GREEN,
      YELLOW,
      GOLD,
      RED,
      RED_C,
      PURE_RED,
      MAROON,
      PURPLE,
      PINK,
      ORANGE,
      MANIM_BACKGROUND,
    };

    for (const [name, value] of Object.entries(colors)) {
      it(`${name} should be a valid 6-digit hex color`, () => {
        expect(value).toMatch(HEX_COLOR_REGEX);
      });
    }
  });

  describe('specific known values', () => {
    it('WHITE should be #FFFFFF', () => {
      expect(WHITE).toBe('#FFFFFF');
    });

    it('BLACK should be #000000', () => {
      expect(BLACK).toBe('#000000');
    });

    it('PURE_RED should be #FF0000', () => {
      expect(PURE_RED).toBe('#FF0000');
    });

    it('PURE_GREEN should be #00FF00', () => {
      expect(PURE_GREEN).toBe('#00FF00');
    });

    it('PURE_BLUE should be #0000FF', () => {
      expect(PURE_BLUE).toBe('#0000FF');
    });
  });

  describe('aliases should match their targets', () => {
    it('LIGHTER_GRAY should equal GRAY_A', () => {
      expect(LIGHTER_GRAY).toBe(GRAY_A);
    });

    it('LIGHT_GRAY should equal GRAY_B', () => {
      expect(LIGHT_GRAY).toBe(GRAY_B);
    });

    it('GRAY should equal GRAY_C', () => {
      expect(GRAY).toBe(GRAY_C);
    });

    it('DARK_GRAY should equal GRAY_D', () => {
      expect(DARK_GRAY).toBe(GRAY_D);
    });

    it('DARKER_GRAY should equal GRAY_E', () => {
      expect(DARKER_GRAY).toBe(GRAY_E);
    });

    it('BLUE should equal BLUE_C', () => {
      expect(BLUE).toBe(BLUE_C);
    });

    it('DARK_BLUE should equal BLUE_E', () => {
      expect(DARK_BLUE).toBe(BLUE_E);
    });

    it('RED should equal RED_C', () => {
      expect(RED).toBe(RED_C);
    });
  });

  describe('MANIM_BACKGROUND', () => {
    it('should be the standard dark background', () => {
      expect(MANIM_BACKGROUND).toBe('#1C1C1C');
    });
  });
});
