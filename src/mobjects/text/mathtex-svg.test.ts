// @vitest-environment happy-dom
/**
 * Test for issue #228: MathTex and Tex should use SVG mode by default.
 *
 * Python manim users expect MathTex to produce VMobject paths (not rasterized
 * textures), so Create animation works as stroke-draw reveal. This test
 * verifies that MathTex and Tex are VGroup instances (SVG-based), not plain
 * Mobject instances (rasterized).
 */
import { describe, it, expect } from 'vitest';
import { MathTex, MathTexSVG } from './MathTex';
import { MathTexImage } from './MathTexImage';
import { Tex } from './Tex';
import { renderLatexToSVG } from './MathJaxRenderer';
import { VGroup } from '../../core/VGroup';
import { Mobject } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { DEFAULT_FONT_SIZE_IN_WORLD_SPACE } from '../../constants/fontRender';

describe('Issue #228: MathTex defaults to SVG mode', () => {
  it('MathTex should be an instance of VGroup (SVG path-based)', () => {
    const tex = new MathTex({ latex: 'x^2' });
    expect(tex).toBeInstanceOf(VGroup);
  });

  it('MathTexImage should be an instance of Mobject but NOT VGroup', () => {
    const tex = new MathTexImage({ latex: 'x^2' });
    expect(tex).toBeInstanceOf(Mobject);
    expect(tex).not.toBeInstanceOf(VGroup);
  });

  it('Tex should be an instance of VGroup (inherits SVG-based MathTex)', () => {
    const tex = new Tex({ latex: 'Hello World' });
    expect(tex).toBeInstanceOf(VGroup);
    expect(tex).toBeInstanceOf(MathTex);
  });

  it('MathTex should have SVG-specific options (strokeWidth, fillOpacity)', () => {
    const tex = new MathTex({
      latex: 'E = mc^2',
      strokeWidth: 3,
      fillOpacity: 0.8,
    });
    expect(tex).toBeInstanceOf(VGroup);
    // These SVG-specific properties should be set
    expect((tex as unknown as { _svgStrokeWidth: number })._svgStrokeWidth).toBe(3);
    expect((tex as unknown as { _svgFillOpacity: number })._svgFillOpacity).toBe(0.8);
  });

  it('MathTexImage should have rasterized-specific options (renderer)', () => {
    const tex = new MathTexImage({ latex: 'x', renderer: 'katex' });
    expect(tex.getRenderer()).toBe('katex');
  });

  it('MathTex multi-part should be a VGroup with isMultiPart flag', () => {
    const tex = new MathTex({ latex: ['x', '=', '5'] });
    expect(tex).toBeInstanceOf(VGroup);
    // The _isMultiPart flag is set synchronously in the constructor
    expect((tex as unknown as { _isMultiPart: boolean })._isMultiPart).toBe(true);
  });

  it('deprecated MathTexSVG alias should be the same as MathTex', () => {
    expect(MathTexSVG).toBe(MathTex);
  });

  it('Tex.copy() should not double-wrap latex in \\text{}', () => {
    const original = new Tex({ latex: 'Hello' });
    const copy = original.copy() as Tex;
    // Both should have the same internal latex (wrapped once)
    expect(copy.getLatex()).toBe(original.getLatex());
  });
});

describe('Tex size consistency', () => {
  it('Tex "what" should have consistent dimensions', async () => {
    const tex = new Tex({ latex: 'what' });
    await tex.waitForRender();
    tex.center();

    const top = tex.getTop();
    const bottom = tex.getBottom();
    const right = tex.getRight();
    const left = tex.getLeft();

    const vertical = Math.abs(top[1] - bottom[1]);
    const horizontal = Math.abs(right[0] - left[0]);

    expect(horizontal).toBeCloseTo(DEFAULT_FONT_SIZE_IN_WORLD_SPACE, 2);
  });

  it('Tex em dash should be approximately 1 em wide', async () => {
    // Em dash: use actual em dash character (U+2014) inside \text{}
    const tex = new Tex({ latex: '—' });
    await tex.waitForRender();
    tex.center();

    const right = tex.getRight();
    const left = tex.getLeft();
    const width = Math.abs(right[0] - left[0]);

    console.log('Tex em dash (—) width:', width);
    console.log('Expected (DEFAULT_FONT_SIZE_IN_WORLD_SPACE):', DEFAULT_FONT_SIZE_IN_WORLD_SPACE);
    console.log('Ratio:', width / DEFAULT_FONT_SIZE_IN_WORLD_SPACE);
    console.log('Scale error:', (width / DEFAULT_FONT_SIZE_IN_WORLD_SPACE - 1) * 100, '%');

    // Em dash is exactly 1 em wide by definition
    // At default fontSize 48pt, 1 em = DEFAULT_FONT_SIZE_IN_WORLD_SPACE world units
    expect(width).toBeCloseTo(DEFAULT_FONT_SIZE_IN_WORLD_SPACE, 2);
  });
});

describe('MathTex stroke width', () => {
  it('should extract non-zero stroke width by default', async () => {
    const render = await renderLatexToSVG('x', { displayMode: true });
    const strokeMatches =
      render.svgString.match(/stroke-width\s*=\s*"[^"]+"|stroke-width\s*:\s*[^;"']+/g) || [];
    console.log('stroke matches:', strokeMatches.slice(0, 10));
    console.log('extractedStrokeWidth:', render.extractedStrokeWidth);

    const tex = new MathTex({ latex: 'x' });
    await tex.waitForRender();

    // Check that the default stroke width is applied
    expect(tex.strokeWidth).toBe(2);
  });

  it('should use user-provided strokeWidth when specified', async () => {
    const tex = new MathTex({ latex: 'x', strokeWidth: 5 });
    await tex.waitForRender();

    expect(tex.strokeWidth).toBe(5);
  });

  it('children should have the same strokeWidth', async () => {
    const tex = new MathTex({ latex: 'x^2 + y^2', strokeWidth: 3 });
    await tex.waitForRender();

    for (const child of tex.children) {
      if (child instanceof VMobject) {
        expect(child.strokeWidth).toBe(3);
      }
    }
  });
});

describe('MathTex size consistency', () => {
  it('MathTex em dash should be approximately 1 em wide', async () => {
    // Em dash in math mode: use \text{—} with actual em dash character (U+2014)
    const tex = new MathTex({ latex: '\\text{—}' });
    await tex.waitForRender();
    tex.center();

    const right = tex.getRight();
    const left = tex.getLeft();
    const width = Math.abs(right[0] - left[0]);

    console.log('MathTex em dash (\\text{—}) width:', width);
    console.log('Expected (DEFAULT_FONT_SIZE_IN_WORLD_SPACE):', DEFAULT_FONT_SIZE_IN_WORLD_SPACE);
    console.log('Ratio:', width / DEFAULT_FONT_SIZE_IN_WORLD_SPACE);
    console.log('Scale error:', (width / DEFAULT_FONT_SIZE_IN_WORLD_SPACE - 1) * 100, '%');

    // Em dash is exactly 1 em wide by definition
    // At default fontSize 48pt, 1 em = DEFAULT_FONT_SIZE_IN_WORLD_SPACE world units
    expect(width).toBeCloseTo(DEFAULT_FONT_SIZE_IN_WORLD_SPACE, 2);
  });
});
