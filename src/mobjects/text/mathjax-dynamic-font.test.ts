// @vitest-environment happy-dom
/**
 * Dynamic-range glyphs of the NewCM font (Block D).
 *
 * MathJax's NewCM font keeps most character data in per-range "dynamic"
 * files that are normally fetched on demand. In this bundled library
 * nothing fetches them: the first glyph from such a range (the
 * double-struck capitals behind `\mathbb`, fraktur behind `\mathfrak`,
 * script behind `\mathcal`, ...) made the synchronous render throw
 * "MathJax retry" and MathTex rendered nothing.
 *
 * MathJaxBundle now statically imports the font's full declared set
 * of dynamic files (each registers its data with the font class on
 * import), `loadMathJax` installs a no-op `asyncLoad` (there is
 * nothing left to fetch), and conversions run through
 * `mathjax.handleRetriesFor`: the first glyph from a range pauses the
 * conversion, FontData applies the registered data, and the
 * conversion retries and completes.
 *
 * These tests use the REAL MathJax pipeline (no mocking). The four
 * dynamic-range cases below threw on the pre-fix tree; the final
 * plain-formula case is a pin — it passes on both trees and guards
 * the previously-working render path.
 */
import { describe, it, expect } from 'vitest';
import { renderLatexToSVG } from './MathJaxRenderer';
import { MathTex } from './MathTex';
import type { VGroup } from '../../core/VGroup';

function totalPoints(group: VGroup): number {
  let n = 0;
  const children = group.children as Array<{ getLocalPoints?: () => unknown[] }>;
  for (const child of children) {
    if (child && typeof child.getLocalPoints === 'function') {
      n += child.getLocalPoints().length;
    }
  }
  return n;
}

describe('MathJax dynamic font ranges (real renderer)', () => {
  it('renders \\mathbb{R}^n through renderLatexToSVG', async () => {
    const result = await renderLatexToSVG('\\mathbb{R}^n');
    expect(result.svgString.length).toBeGreaterThan(0);
    expect(result.width).toBeGreaterThan(0);
    expect(totalPoints(result.vmobjectGroup)).toBeGreaterThan(0);
  });

  it('renders sibling dynamic-range commands (\\mathfrak, \\mathcal, \\Bbbk)', async () => {
    // Each of these draws glyphs from a different dynamic file
    // (fraktur, script, double-struck) than \\mathbb's capitals alone.
    for (const tex of ['\\mathfrak{g}', '\\mathcal{L}', '\\Bbbk']) {
      const result = await renderLatexToSVG(tex);
      expect(totalPoints(result.vmobjectGroup), tex).toBeGreaterThan(0);
    }
  });

  it('renders a MathTex containing \\mathbb', async () => {
    const tex = new MathTex({ latex: 'x \\in \\mathbb{R}^n' });
    await tex.waitForRender();
    expect(tex.children.length).toBeGreaterThan(0);
    expect(totalPoints(tex as unknown as VGroup)).toBeGreaterThan(0);
  });

  it('renders every part of a multi-part MathTex with \\mathbb in one part', async () => {
    const tex = new MathTex({ latex: ['x \\in', '\\mathbb{R}^n', '\\quad \\mathbf{v}'] });
    await tex.waitForRender();
    for (let i = 0; i < 3; i++) {
      expect(totalPoints(tex.getPart(i) as VGroup), `part ${i}`).toBeGreaterThan(0);
    }
  });

  it('still renders plain formulas (no dynamic ranges involved)', async () => {
    const result = await renderLatexToSVG('x + y = z');
    expect(totalPoints(result.vmobjectGroup)).toBeGreaterThan(0);
  });
});
