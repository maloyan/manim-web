// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { VMobject } from '../../core/VMobject';
import { renderLatexToSVG } from './MathJaxRenderer';
import { getGlyphClasses, svgToVMobjects } from './svgPathParser';

function glyphs(group: { children: unknown[] }): VMobject[] {
  return group.children.filter((c): c is VMobject => c instanceof VMobject);
}

// Real MathJax renders: the first one in a file loads the bundle, which can
// exceed the 5 s default when the whole suite runs in parallel.
describe('getGlyphClasses', { timeout: 20000 }, () => {
  // MIGRATION: example for the property
  //   ∀ glyph g of svgToVMobjects(svg), getGlyphClasses(g) lists the class
  //   tokens of g's ancestor elements, outermost first.
  // Replace with a property test once the suite lands.
  it('reports ancestor class tokens, outermost first', () => {
    const svg = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">
         <path d="M0,0 L1,0 L1,1 Z"/>
         <g class="outer extra"><g class="inner"><path d="M0,0 L1,0 L1,1 Z"/></g></g>
       </svg>`,
      'image/svg+xml',
    ).documentElement;

    const [plain, tagged] = glyphs(svgToVMobjects(svg));
    expect(getGlyphClasses(plain)).toEqual([]);
    expect(getGlyphClasses(tagged)).toEqual(['outer', 'extra', 'inner']);
  });

  // MIGRATION: example for the property
  //   ∀ latex L, name n: the glyphs of renderLatexToSVG(`a+\class{n}{L}`)
  //   carrying n are exactly the glyphs of renderLatexToSVG(L).
  // Replace with a property test once the suite lands.
  it('tags the glyphs inside MathJax \\class groups, including nested ones', async () => {
    const result = await renderLatexToSVG(
      String.raw`y = \class{tangle-p-a-0}{{2.5}}x + \class{tangle-m-R-0}{\begin{bmatrix}\class{tangle-p-k-0}{{7}} & 1\end{bmatrix}}`,
    );
    const all = glyphs(result.vmobjectGroup);
    const withClass = (name: string) => all.filter((g) => getGlyphClasses(g).includes(name));

    // "2.5" is three glyphs; the matrix holds 7 and 1 plus two brackets.
    expect(withClass('tangle-p-a-0')).toHaveLength(3);
    expect(withClass('tangle-p-k-0')).toHaveLength(1);
    expect(withClass('tangle-m-R-0')).toHaveLength(4);
    expect(getGlyphClasses(withClass('tangle-p-k-0')[0])).toEqual(['tangle-m-R-0', 'tangle-p-k-0']);
  });
});
