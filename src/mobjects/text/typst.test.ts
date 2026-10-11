// @vitest-environment happy-dom
/**
 * Tests for Typst / MathTypst (ManimCE 0.22.0 parity).
 *
 * The real Typst compiler is a multi-megabyte WASM binary that cannot run in
 * the unit-test environment. These tests inject a mock compiler via
 * `setTypstCompiler`, so they assert the MODEL and the API contract:
 *   - the Typst markup is stored,
 *   - `MathTypst` wraps the input in `$ ... $`,
 *   - the compiler is invoked with the expected source,
 *   - options flow through to the glyph children,
 *   - the SVG -> VMobject step runs (real glyph children appear),
 *   - a failing / absent compiler fails gracefully (no suite crash).
 * No real WASM compile happens.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Typst, MathTypst } from './Typst';
import {
  renderTypstToSVG,
  setTypstCompiler,
  isTypstLoaded,
  type TypstSvgCompiler,
} from './TypstRenderer';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';

/** A minimal, valid single-glyph SVG the mock compiler returns. */
function fakeSvg(): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">' +
    '<path d="M10 20 L90 20 L90 100 L10 100 Z" fill="#000000"/>' +
    '</svg>'
  );
}

/** Records every source the compiler is asked to compile. */
let compiledSources: string[];

/** Install a mock compiler that records the source and returns a fake SVG. */
function installMockCompiler(svg: () => string = fakeSvg): void {
  compiledSources = [];
  const compiler: TypstSvgCompiler = (source: string) => {
    compiledSources.push(source);
    return svg();
  };
  setTypstCompiler(compiler);
}

beforeEach(() => {
  installMockCompiler();
});
afterEach(() => {
  setTypstCompiler(null);
});

describe('Typst markup model', () => {
  it('is a VGroup (SVG path-based, like MathTex)', () => {
    const t = new Typst({ typst: '*Hello*' });
    expect(t).toBeInstanceOf(VGroup);
  });

  it('stores the raw markup and compiles it verbatim', async () => {
    const t = new Typst({ typst: '*Hello* from _Typst!_' });
    expect(t.getTypst()).toBe('*Hello* from _Typst!_');
    expect(t.getSource()).toBe('*Hello* from _Typst!_');
    await t.waitForRender();
    expect(compiledSources).toEqual(['*Hello* from _Typst!_']);
  });

  it('exposes SVG-specific options on the instance', () => {
    const t = new Typst({ typst: 'x', strokeWidth: 3, fillOpacity: 0.8 });
    expect((t as unknown as { _svgStrokeWidth: number })._svgStrokeWidth).toBe(3);
    expect((t as unknown as { _svgFillOpacity: number })._svgFillOpacity).toBe(0.8);
  });
});

describe('MathTypst math-mode wrapping', () => {
  it('wraps the input in `$ ... $` for the compiler', async () => {
    const eq = new MathTypst({ typst: 'sum_(k=1)^n k' });
    // Raw markup is kept verbatim; source is math-wrapped.
    expect(eq.getTypst()).toBe('sum_(k=1)^n k');
    expect(eq.getSource()).toBe('$ sum_(k=1)^n k $');
    await eq.waitForRender();
    expect(compiledSources).toEqual(['$ sum_(k=1)^n k $']);
  });

  it('is a Typst subclass (mirrors MathTex vs Tex)', () => {
    const eq = new MathTypst({ typst: 'x^2' });
    expect(eq).toBeInstanceOf(Typst);
    expect(eq).toBeInstanceOf(VGroup);
  });
});

describe('Typst SVG -> VMobject pipeline', () => {
  it('builds VMobject glyph children from the compiled SVG', async () => {
    const t = new Typst({ typst: 'A' });
    await t.waitForRender();
    expect(t.getRenderError()).toBeNull();
    const glyphs = t.children.filter((c) => c instanceof VMobject);
    expect(glyphs.length).toBeGreaterThan(0);
  });

  it('propagates strokeWidth to glyph children after render', async () => {
    const t = new Typst({ typst: 'A', strokeWidth: 4 });
    await t.waitForRender();
    for (const child of t.children) {
      if (child instanceof VMobject) {
        expect(child.strokeWidth).toBe(4);
      }
    }
  });

  it('honors an explicit height (exact scaling)', async () => {
    const t = new Typst({ typst: 'A', height: 2 });
    await t.waitForRender();
    const top = t.getTop();
    const bottom = t.getBottom();
    expect(Math.abs(top[1] - bottom[1])).toBeCloseTo(2, 3);
  });

  it('scales larger with a larger fontSize', async () => {
    const small = new Typst({ typst: 'A', fontSize: 24 });
    const big = new Typst({ typst: 'A', fontSize: 96 });
    await small.waitForRender();
    await big.waitForRender();
    const h = (t: Typst) => Math.abs(t.getTop()[1] - t.getBottom()[1]);
    expect(h(big)).toBeGreaterThan(h(small));
  });
});

describe('Typst color handling', () => {
  it('setColor propagates to all glyph children', async () => {
    const t = new Typst({ typst: 'A', color: '#ffffff' });
    await t.waitForRender();
    t.setColor('#ff0000');
    for (const child of t.children) {
      if (child instanceof VMobject) {
        expect(child.color).toBe('#ff0000');
      }
    }
  });
});

describe('Typst copy()', () => {
  it('Typst.copy() keeps the markup and type', async () => {
    const t = new Typst({ typst: '*Hi*' });
    await t.waitForRender();
    const c = t.copy();
    expect(c).toBeInstanceOf(Typst);
    expect(c.getTypst()).toBe('*Hi*');
    expect(c.getSource()).toBe('*Hi*');
  });

  it('MathTypst.copy() stays a MathTypst and re-wraps the markup', async () => {
    const eq = new MathTypst({ typst: 'x^2' });
    await eq.waitForRender();
    const c = eq.copy();
    expect(c).toBeInstanceOf(MathTypst);
    expect(c.getTypst()).toBe('x^2');
    expect(c.getSource()).toBe('$ x^2 $');
  });
});

describe('Typst graceful failure', () => {
  it('rejects waitForRender when the compiler throws, without crashing', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setTypstCompiler(() => {
      throw new Error('simulated compile failure');
    });

    const t = new Typst({ typst: 'A' });
    await expect(t.waitForRender()).rejects.toThrow('simulated compile failure');
    expect(t.getRenderError()).toBeInstanceOf(Error);

    errorSpy.mockRestore();
  });

  it('produces an empty group (no throw) when the SVG has no drawable paths', async () => {
    installMockCompiler(() => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>');
    const t = new Typst({ typst: 'A' });
    await expect(t.waitForRender()).resolves.toBeUndefined();
    expect(t.getRenderError()).toBeNull();
    const glyphs = t.children.filter((c) => c instanceof VMobject);
    expect(glyphs.length).toBe(0);
  });
});

describe('renderTypstToSVG (renderer API)', () => {
  it('compiler is not loaded until a real render is needed', () => {
    // The mock compiler is injected, so the WASM compiler must stay unloaded.
    expect(isTypstLoaded()).toBe(false);
  });

  it('returns a VMobject group plus viewBox dimensions and the raw SVG', async () => {
    const result = await renderTypstToSVG('A', { color: '#00ff00' });
    expect(result.width).toBe(100);
    expect(result.height).toBe(120);
    expect(result.svgString).toContain('<svg');
    expect(result.vmobjectGroup).toBeInstanceOf(VGroup);
    const glyphs = result.vmobjectGroup.children.filter((c) => c instanceof VMobject);
    expect(glyphs.length).toBeGreaterThan(0);
  });

  it('invokes the injected compiler with the exact source string', async () => {
    await renderTypstToSVG('#box[body] <label>');
    expect(compiledSources).toEqual(['#box[body] <label>']);
  });
});
