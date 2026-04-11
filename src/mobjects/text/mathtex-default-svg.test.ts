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
import { MathTex } from './MathTex';
import { MathTexImage } from './MathTexImage';
import { Tex } from './Tex';
import { VGroup } from '../../core/VGroup';
import { Mobject } from '../../core/Mobject';

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
});
