// @vitest-environment happy-dom
/**
 * Tests for theme-seeded default colors of the text mobjects (Block F).
 *
 * MathTex (and Text, below) used to hardcode a WHITE default color, so
 * under `setTheme('light')` — where the scene background and geometry
 * defaults flip to white/black — formulas and plain text still rendered
 * white: white-on-white, invisible. The default now comes from the
 * active theme's fill color, exactly like the `Mobject` constructor's
 * seeding. Explicit `color=` always wins, and under the `default`
 * theme the seeded fill is WHITE, so unthemed behavior is unchanged
 * (the default-theme tests are pins: they pass before and after).
 *
 * MathJax renders for real in happy-dom, so glyph colors are asserted
 * only after waitForRender(). Text needs a mocked canvas 2D context
 * (happy-dom has none), following text.test.ts's convention.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MathTex } from './MathTex';
import { Text } from './Text';
import { VMobject } from '../../core/VMobject';
import { WHITE, BLACK } from '../../constants/colors';
import { setTheme, resetThemes } from '../../utils/ThemeManager';

const RED = '#ff0000';

/** Colors of a single-part MathTex's glyph VMobjects. */
function glyphColors(tex: MathTex): string[] {
  return tex.children.filter((c): c is VMobject => c instanceof VMobject).map((c) => c.color);
}

/** Mock CanvasRenderingContext2D, as in text.test.ts. */
function createMockCtx(): CanvasRenderingContext2D {
  return {
    font: '',
    textBaseline: 'top',
    textAlign: 'center',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    measureText: vi.fn((_text: string) => ({
      width: _text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: _text.length * 10,
    })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('theme-seeded text defaults (Block F)', () => {
  beforeEach(() => {
    resetThemes();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
      if (contextId === '2d') return createMockCtx();
      return null;
    });
  });
  afterEach(() => {
    resetThemes();
    vi.restoreAllMocks();
  });

  it('MathTex glyphs take the active theme fill under the light theme', async () => {
    setTheme('light');
    const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
    await tex.waitForRender();

    const colors = glyphColors(tex);
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) {
      expect(c).toBe(BLACK);
    }
  });

  it('MathTex glyphs stay WHITE under the default theme', async () => {
    const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
    await tex.waitForRender();

    const colors = glyphColors(tex);
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) {
      expect(c).toBe(WHITE);
    }
  });

  it('multi-part MathTex parts take the theme fill under the light theme', async () => {
    setTheme('light');
    const tex = new MathTex({ latex: ['x^2', '+', 'y^2'], fontSize: 1 });
    await tex.waitForRender();

    for (let i = 0; i < 3; i++) {
      const part = tex.getPart(i);
      expect(part.color).toBe(BLACK);
      const partGlyphs = part.children.filter((c): c is VMobject => c instanceof VMobject);
      expect(partGlyphs.length).toBeGreaterThan(0);
      for (const g of partGlyphs) {
        expect(g.color).toBe(BLACK);
      }
    }
  });

  it('explicit MathTex color wins under the light theme', async () => {
    setTheme('light');
    const tex = new MathTex({ latex: 'x^2', color: RED, fontSize: 1 });
    await tex.waitForRender();

    const colors = glyphColors(tex);
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) {
      expect(c).toBe(RED);
    }
  });

  it('explicit MathTex color wins under the default theme', async () => {
    const tex = new MathTex({ latex: 'x^2', color: RED, fontSize: 1 });
    await tex.waitForRender();

    const colors = glyphColors(tex);
    expect(colors.length).toBeGreaterThan(0);
    for (const c of colors) {
      expect(c).toBe(RED);
    }
  });

  it('setColorByTex still recolors parts under the light theme', async () => {
    setTheme('light');
    const tex = new MathTex({ latex: ['x^2', '+', 'y^2'], fontSize: 1 });
    await tex.waitForRender();

    tex.setColorByTex('x', RED);

    expect(tex.getPart(0).color).toBe(RED);
    // Untouched parts keep the theme-seeded default (BLACK), not WHITE.
    expect(tex.getPart(1).color).toBe(BLACK);
    expect(tex.getPart(2).color).toBe(BLACK);
  });

  it('Text takes the active theme fill under the light theme', () => {
    setTheme('light');
    const text = new Text({ text: 'hello' });
    expect(text.color).toBe(BLACK);
  });

  it('Text stays white under the default theme', () => {
    const text = new Text({ text: 'hello' });
    // Case-insensitive: the historical literal was '#ffffff', the theme
    // palette's WHITE is '#FFFFFF' — the color is the same.
    expect(text.color.toLowerCase()).toBe('#ffffff');
  });

  it('explicit Text color wins under the light theme', () => {
    setTheme('light');
    const text = new Text({ text: 'hello', color: RED });
    expect(text.color).toBe(RED);
  });
});
