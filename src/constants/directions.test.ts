import { describe, it, expect } from 'vitest';
import { UP, DOWN, LEFT, RIGHT, OUT, IN, ORIGIN, UL, UR, DL } from '../core/Mobject';

describe('direction constants', () => {
  describe('cardinal directions', () => {
    it('UP should be [0, 1, 0]', () => {
      expect(UP).toEqual([0, 1, 0]);
    });

    it('DOWN should be [0, -1, 0]', () => {
      expect(DOWN).toEqual([0, -1, 0]);
    });

    it('LEFT should be [-1, 0, 0]', () => {
      expect(LEFT).toEqual([-1, 0, 0]);
    });

    it('RIGHT should be [1, 0, 0]', () => {
      expect(RIGHT).toEqual([1, 0, 0]);
    });

    it('OUT should be [0, 0, 1]', () => {
      expect(OUT).toEqual([0, 0, 1]);
    });

    it('IN should be [0, 0, -1]', () => {
      expect(IN).toEqual([0, 0, -1]);
    });
  });

  describe('ORIGIN', () => {
    it('should be [0, 0, 0]', () => {
      expect(ORIGIN).toEqual([0, 0, 0]);
    });
  });

  describe('diagonal directions', () => {
    it('UL (UP + LEFT) should be [-1, 1, 0]', () => {
      expect(UL).toEqual([-1, 1, 0]);
    });

    it('UR (UP + RIGHT) should be [1, 1, 0]', () => {
      expect(UR).toEqual([1, 1, 0]);
    });

    it('DL (DOWN + LEFT) should be [-1, -1, 0]', () => {
      expect(DL).toEqual([-1, -1, 0]);
    });
  });

  describe('vector properties', () => {
    it('all direction constants should be 3-element arrays', () => {
      const directions = [UP, DOWN, LEFT, RIGHT, OUT, IN, ORIGIN, UL, UR, DL];
      for (const dir of directions) {
        expect(dir).toHaveLength(3);
      }
    });

    it('UP and DOWN should be opposites', () => {
      expect(UP[0] + DOWN[0]).toBe(0);
      expect(UP[1] + DOWN[1]).toBe(0);
      expect(UP[2] + DOWN[2]).toBe(0);
    });

    it('LEFT and RIGHT should be opposites', () => {
      expect(LEFT[0] + RIGHT[0]).toBe(0);
      expect(LEFT[1] + RIGHT[1]).toBe(0);
      expect(LEFT[2] + RIGHT[2]).toBe(0);
    });

    it('IN and OUT should be opposites', () => {
      expect(IN[0] + OUT[0]).toBe(0);
      expect(IN[1] + OUT[1]).toBe(0);
      expect(IN[2] + OUT[2]).toBe(0);
    });
  });
});
