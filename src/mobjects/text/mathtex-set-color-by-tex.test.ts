// @vitest-environment happy-dom
/**
 * Tests for MathTex.setColorByTex / setColorByTexToColorMap (Manim CE parity).
 *
 * These color the sub-expression(s) whose LaTeX matches a substring. The
 * assertions check that a matched part's color changed and non-matched parts
 * are left unchanged. MathJax renders for real in happy-dom, so parts exist
 * only after waitForRender().
 */
import { describe, it, expect } from 'vitest';
import { MathTex } from './MathTex';
import { VMobject } from '../../core/VMobject';
import { WHITE } from '../../constants/colors';

const RED = '#ff0000';
const BLUE = '#0000ff';

describe('MathTex.setColorByTex', () => {
  it('colors the matching part and leaves others unchanged (substring default)', async () => {
    const tex = new MathTex({ latex: ['x^2', '+', 'y^2'], fontSize: 1 });
    await tex.waitForRender();

    const ret = tex.setColorByTex('x', RED);

    expect(ret).toBe(tex); // chainable
    expect(tex.getPart(0).color).toBe(RED);
    expect(tex.getPart(1).color).toBe(WHITE);
    expect(tex.getPart(2).color).toBe(WHITE);
  });

  it('propagates the color to the matched part glyph VMobjects', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    await tex.waitForRender();

    tex.setColorByTex('a', RED);

    const glyphColors = tex
      .getPart(0)
      .children.filter((c): c is VMobject => c instanceof VMobject)
      .map((c) => c.color);
    expect(glyphColors.length).toBeGreaterThan(0);
    for (const c of glyphColors) {
      expect(c).toBe(RED);
    }
  });

  it('matches by substring inside a longer part string', async () => {
    const tex = new MathTex({ latex: ['x^2', '+', 'y^2'], fontSize: 1 });
    await tex.waitForRender();

    tex.setColorByTex('y', BLUE);

    expect(tex.getPart(0).color).toBe(WHITE);
    expect(tex.getPart(2).color).toBe(BLUE); // 'y^2' contains 'y'
  });

  it('exact match with substring: false', async () => {
    const tex = new MathTex({ latex: ['x^2', 'x'], fontSize: 1 });
    await tex.waitForRender();

    tex.setColorByTex('x', RED, { substring: false });

    expect(tex.getPart(0).color).toBe(WHITE); // 'x^2' !== 'x'
    expect(tex.getPart(1).color).toBe(RED); // 'x' === 'x'
  });

  it('matches case-insensitively when caseSensitive is false', async () => {
    const tex = new MathTex({ latex: ['X', 'y'], fontSize: 1 });
    await tex.waitForRender();

    tex.setColorByTex('x', RED, { caseSensitive: false });

    expect(tex.getPart(0).color).toBe(RED);
    expect(tex.getPart(1).color).toBe(WHITE);
  });

  it('is case-sensitive by default (no match on wrong case)', async () => {
    const tex = new MathTex({ latex: ['X', 'y'], fontSize: 1 });
    await tex.waitForRender();

    tex.setColorByTex('x', RED);

    expect(tex.getPart(0).color).toBe(WHITE);
  });

  it('colors the whole single-string MathTex on a match', () => {
    const tex = new MathTex({ latex: 'x+y', fontSize: 1 });
    const ret = tex.setColorByTex('x', RED);

    expect(ret).toBe(tex);
    expect(tex.color).toBe(RED);
  });

  it('leaves a single-string MathTex unchanged on no match', () => {
    const tex = new MathTex({ latex: 'x+y', fontSize: 1 });
    tex.setColorByTex('z', RED);

    expect(tex.color).toBe(WHITE);
  });
});

describe('MathTex.setColorByTexToColorMap', () => {
  it('colors several parts from a map', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    await tex.waitForRender();

    const ret = tex.setColorByTexToColorMap({ a: RED, b: BLUE });

    expect(ret).toBe(tex); // chainable
    expect(tex.getPart(0).color).toBe(RED);
    expect(tex.getPart(1).color).toBe(WHITE);
    expect(tex.getPart(2).color).toBe(BLUE);
  });

  it('applies later entries over earlier ones where they overlap', async () => {
    const tex = new MathTex({ latex: ['xy', 'z'], fontSize: 1 });
    await tex.waitForRender();

    // Both 'x' and 'xy' match part 0; the later entry wins.
    tex.setColorByTexToColorMap({ x: RED, xy: BLUE });

    expect(tex.getPart(0).color).toBe(BLUE);
  });
});
