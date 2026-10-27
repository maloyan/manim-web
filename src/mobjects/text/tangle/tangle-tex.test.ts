// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { TangleTex } from './TangleTex';

function rotation(): TangleTex {
  return new TangleTex({
    latex: String.raw`y = \tanglematrix{R} x + \tangle{b}`,
    parameters: {
      k: { value: 2, min: 0, max: 5, step: 0.1 },
      b: { value: 1, step: 0.5, color: '#ff0000' },
    },
    matrices: {
      R: {
        entries: [
          [String.raw`\tangle{k}\cos t`, 0],
          [0, String.raw`\tangle{k}`],
        ],
      },
    },
  });
}

// Real MathJax renders: the first one in a file loads the bundle, which can
// exceed the 5 s default when the whole suite runs in parallel.
describe('TangleTex', { timeout: 20000 }, () => {
  // MIGRATION: example for the property
  //   ∀ parameter p, displayed occurrence i: getParameterGlyphs(p, i) are
  //   exactly the glyphs MathJax draws for p's formatted value.
  // Replace with a property test once the suite lands.
  it('finds each parameter occurrence’s glyphs, and follows value changes', async () => {
    const tex = new TangleTex({
      latex: String.raw`\tangle{a}x^2 + \tangle{a}`,
      parameters: { a: { value: 2.5, min: -20, max: 20, step: 0.1 } },
    });
    await tex.waitForRender();
    expect(tex.getParameterOccurrences('a')).toEqual([0, 1]);
    expect(tex.getParameterGlyphs('a', 0)).toHaveLength(3); // "2.5"
    expect(tex.getParameterGlyphs('a')).toHaveLength(6);

    tex.setValue('a', -10.04);
    await tex.waitForRender();
    expect(tex.getValue('a')).toBe(-10);
    expect(tex.getLatex()).toContain('{{-10.0}}');
    expect(tex.getParameterGlyphs('a', 1)).toHaveLength(5); // "-10.0"
  });

  it('expands a matrix and exposes the parameters inside it', async () => {
    const tex = rotation();
    await tex.waitForRender();
    expect(tex.getMatrixGlyphs('R')).toHaveLength(1); // the symbol "R"
    expect(tex.getParameterOccurrences('k')).toEqual([]);

    tex.setExpanded('R', true);
    await tex.waitForRender();
    expect(tex.isExpanded('R')).toBe(true);
    expect(tex.getParameterOccurrences('k')).toEqual([0, 1]);
    expect(tex.getParameterGlyphs('R_1_2')).toHaveLength(1);
    expect(tex.getMatrixGlyphs('R').length).toBeGreaterThan(tex.getParameterGlyphs('k').length);
    expect(() => tex.getMatrix('R')).toThrow(/evaluate/);
  });

  it('re-renders on update() when a tracker changes, and colors parameters', async () => {
    const tex = rotation();
    await tex.waitForRender();
    tex.getTracker('b').setValue(4);
    tex.update(1 / 60);
    await tex.waitForRender();
    expect(tex.getLatex()).toContain('{{4.0}}');
    expect(tex.getParameterGlyphs('b').every((g) => g.color === '#ff0000')).toBe(true);
  });

  it('copies values, expansion and glyph lookup', async () => {
    const tex = rotation();
    await tex.waitForRender();
    tex.setValue('k', 3).setExpanded('R', true);
    await tex.waitForRender();

    const copy = tex.copy();
    expect(copy.getValue('k')).toBe(3);
    expect(copy.isExpanded('R')).toBe(true);
    expect(copy.getLatex()).toBe(tex.getLatex());
    expect(copy.getParameterGlyphs('k')).toHaveLength(tex.getParameterGlyphs('k').length);
    expect(copy.getParameterGlyphs('k')[0]).not.toBe(tex.getParameterGlyphs('k')[0]);

    copy.reset();
    expect(copy.getValue('k')).toBe(2);
    expect(tex.getValue('k')).toBe(3);
  });
});
