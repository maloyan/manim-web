// @vitest-environment happy-dom
/**
 * Tests for theme-seeded default colors of the graphing axis classes
 * (Block F follow-up).
 *
 * Axes, NumberLine, and UnitInterval used to hardcode a WHITE default
 * axis color, so under `setTheme('light')` — the whiteboard's white
 * stage — axes and number lines rendered white-on-white unless every
 * scene pinned a dark color by hand. The default now comes from the
 * active theme's fill color, exactly as Block F did for MathTex/Text.
 * Explicit `color=` always wins, and under the `default` theme the
 * seeded fill is WHITE, so unthemed behavior is unchanged. On the
 * unfixed tree the light-theme tests fail (the defect); the
 * default-theme pins fail there only on hex case -- the old literal
 * was '#ffffff', the theme palette's WHITE is '#FFFFFF'.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NumberLine, UnitInterval } from './NumberLine';
import { Axes } from './Axes';
import { NumberPlane } from './NumberPlane';
import { VMobject } from '../../core/VMobject';
import { WHITE, BLACK } from '../../constants/colors';
import { setTheme, resetThemes } from '../../utils/ThemeManager';

const RED = '#ff0000';

/** Every color carried by a VMobject in the mobject's family (incl. itself). */
function familyColors(root: VMobject): string[] {
  return root
    .getFamily()
    .filter((m): m is VMobject => m instanceof VMobject)
    .map((m) => m.color);
}

describe('theme-seeded axis defaults', () => {
  beforeEach(() => {
    resetThemes();
  });

  afterEach(() => {
    resetThemes();
  });

  describe('NumberLine', () => {
    it('defaults to BLACK under the light theme (line and ticks)', () => {
      setTheme('light');
      const nl = new NumberLine({ includeNumbers: false });
      expect(nl.color).toBe(BLACK);
      for (const c of familyColors(nl)) {
        expect(c).toBe(BLACK);
      }
    });

    it('defaults to WHITE under the default theme (pin)', () => {
      const nl = new NumberLine({ includeNumbers: false });
      expect(nl.color).toBe(WHITE);
    });

    it('explicit color wins under both themes', () => {
      setTheme('light');
      expect(new NumberLine({ color: RED }).color).toBe(RED);
      resetThemes();
      expect(new NumberLine({ color: RED }).color).toBe(RED);
    });
  });

  describe('UnitInterval', () => {
    it('defaults to BLACK under the light theme', () => {
      setTheme('light');
      expect(new UnitInterval().color).toBe(BLACK);
    });

    it('defaults to WHITE under the default theme (pin)', () => {
      expect(new UnitInterval().color).toBe(WHITE);
    });
  });

  describe('Axes', () => {
    it('defaults both axes and tips to BLACK under the light theme', () => {
      setTheme('light');
      const axes = new Axes();
      expect(axes.xAxis.color).toBe(BLACK);
      expect(axes.yAxis.color).toBe(BLACK);
      for (const c of familyColors(axes as unknown as VMobject)) {
        expect(c).toBe(BLACK);
      }
    });

    it('defaults to WHITE under the default theme (pin)', () => {
      const axes = new Axes();
      expect(axes.xAxis.color).toBe(WHITE);
      expect(axes.yAxis.color).toBe(WHITE);
    });

    it('explicit color wins under the light theme', () => {
      setTheme('light');
      const axes = new Axes({ color: RED });
      expect(axes.xAxis.color).toBe(RED);
      expect(axes.yAxis.color).toBe(RED);
    });

    it('per-axis config color still wins over the seeded default', () => {
      setTheme('light');
      const axes = new Axes({ xAxisConfig: { color: RED } });
      expect(axes.xAxis.color).toBe(RED);
      expect(axes.yAxis.color).toBe(BLACK);
    });

    it('getVerticalLine/getHorizontalLine default to BLACK under the light theme', () => {
      setTheme('light');
      const axes = new Axes();
      expect(axes.getVerticalLine([1, 2, 0]).color).toBe(BLACK);
      expect(axes.getHorizontalLine([1, 2, 0]).color).toBe(BLACK);
      expect(axes.getVerticalLine([1, 2, 0], { color: RED }).color).toBe(RED);
    });
  });

  describe('NumberPlane (inherits the Axes default)', () => {
    it('its axes default to BLACK under the light theme', () => {
      setTheme('light');
      const plane = new NumberPlane({ xRange: [-2, 2, 1], yRange: [-2, 2, 1] });
      expect(plane.xAxis.color).toBe(BLACK);
      expect(plane.yAxis.color).toBe(BLACK);
    });
  });
});
