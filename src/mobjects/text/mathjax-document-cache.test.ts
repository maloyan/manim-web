// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { renderLatexToSVG } from './MathJaxRenderer';

async function glyphCount(latex: string): Promise<number> {
  const result = await renderLatexToSVG(latex);
  return result.vmobjectGroup.children.filter((c) => c instanceof VMobject).length;
}

// Real MathJax renders: the first one in a file loads the bundle, which can
// exceed the 5 s default when the whole suite runs in parallel.
describe('MathJax document reuse', { timeout: 20000 }, () => {
  // MIGRATION: example for the property
  //   ∀ macro definition D and later input L without D: rendering L after
  //   D gives the same glyphs as rendering L alone.
  // Replace with a property test once the suite lands.
  it('does not leak macro definitions into later renders', async () => {
    const before = await glyphCount('\\leakedMacro');
    expect(await glyphCount('\\newcommand{\\leakedMacro}{xyz}\\leakedMacro')).toBe(3);
    expect(await glyphCount('\\leakedMacro')).toBe(before);
  });

  it('renders the same expression the same way on reuse', async () => {
    const a = await renderLatexToSVG('x^2 + \\frac{1}{2}');
    const b = await renderLatexToSVG('x^2 + \\frac{1}{2}');
    expect(b.svgString).toBe(a.svgString);
  });
});
