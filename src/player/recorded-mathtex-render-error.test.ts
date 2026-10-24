// @vitest-environment happy-dom
/**
 * Round-3 rework: a copy of an already-rendered MathTex starts NO render
 * at all — its geometry comes from the deep copy in copy().
 *
 * History: the original copy fix (686b2a2) let the copy's constructor
 * start a redundant render and set a flag telling that render to
 * discard its result when it landed; A2 (review repair) then pinned, in
 * this file, that a discarded render's failure was not the copy's error.
 * The discard mechanism is now removed entirely. The guarantees it
 * provided are pinned directly instead:
 *  - rendered-source copies (single-part, multi-part, copy-of-a-copy)
 *    invoke the renderer ZERO times — there is no render whose failure
 *    would need forgiving — and waitForRender() resolves;
 *  - unrendered-source copies still start their own render (exactly
 *    one), and its failure surfaces via waitForRender(), exactly like a
 *    plain instance's (the NON-discarded test below, kept from A2).
 *
 * This lives in its own file because renders are counted and failed via
 * a per-file vi.mock of MathJaxRenderer; the other recorded-mathtex
 * tests need the real renderer.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

let failRenders = false;

vi.mock('../mobjects/text/MathJaxRenderer', () => ({
  renderLatexToSVG: vi.fn(async () => {
    if (failRenders) {
      throw new Error('boom-render');
    }
    const { VGroup } = await import('../core/VGroup');
    const { VMobject } = await import('../core/VMobject');
    const vmobjectGroup = new VGroup();
    for (let i = 0; i < 3; i++) {
      const glyph = new VMobject();
      glyph.setPoints([
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
        [0, 0, 0],
      ]);
      vmobjectGroup.add(glyph);
    }
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('viewBox', '0 0 1000 1000');
    return { svgElement, vmobjectGroup };
  }),
}));

import { MathTex } from '../mobjects/text/MathTex';
import { renderLatexToSVG } from '../mobjects/text/MathJaxRenderer';

const renderSpy = vi.mocked(renderLatexToSVG);

describe('MathTex.copy() render-start contract (round-3 rework)', () => {
  afterEach(() => {
    failRenders = false;
    renderSpy.mockClear();
  });

  it('multi-part: copy of a rendered MathTex starts no render and keeps parts and points', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    await tex.waitForRender();
    expect(tex.getPartCount()).toBe(3);
    const pointCount = tex.getLocalPoints().length;
    expect(pointCount).toBeGreaterThan(0);

    // Even a renderer that would fail must never be invoked for the copy.
    failRenders = true;
    renderSpy.mockClear();
    const copy = tex.copy();
    expect(renderSpy).not.toHaveBeenCalled();
    await expect(copy.waitForRender()).resolves.toBeUndefined();

    expect(copy.getRenderError()).toBeNull();
    expect(copy.getPartCount()).toBe(3);
    expect(copy.getLocalPoints().length).toBe(pointCount);
    expect(copy.getPart(0).getLocalPoints().length).toBe(tex.getPart(0).getLocalPoints().length);
  });

  it('single-part: copy of a rendered MathTex starts no render and keeps its points', async () => {
    const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
    await tex.waitForRender();
    const pointCount = tex.getLocalPoints().length;
    expect(pointCount).toBeGreaterThan(0);

    failRenders = true;
    renderSpy.mockClear();
    const copy = tex.copy();
    expect(renderSpy).not.toHaveBeenCalled();
    await expect(copy.waitForRender()).resolves.toBeUndefined();

    expect(copy.getRenderError()).toBeNull();
    expect(copy.getLocalPoints().length).toBe(pointCount);
  });

  it('multi-part: copy of a copy of a rendered MathTex starts no render either', async () => {
    const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
    await tex.waitForRender();
    const pointCount = tex.getLocalPoints().length;
    expect(pointCount).toBeGreaterThan(0);

    renderSpy.mockClear();
    const copy1 = tex.copy();
    expect(renderSpy).not.toHaveBeenCalled();
    const copy2 = copy1.copy();
    expect(renderSpy).not.toHaveBeenCalled();
    await expect(copy2.waitForRender()).resolves.toBeUndefined();

    expect(copy2.getPartCount()).toBe(3);
    expect(copy2.getLocalPoints().length).toBe(pointCount);
    expect(copy2.getPart(1).getLocalPoints().length).toBe(tex.getPart(1).getLocalPoints().length);
  });

  // Preservation pin (passes under the old discard design too): an
  // unrendered source's copy has no deep-copied geometry yet, so its own
  // render must start — single-part construction invokes the renderer
  // exactly once, synchronously.
  it('copy of an unrendered MathTex starts exactly one render', async () => {
    const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
    renderSpy.mockClear();
    // Synchronous copy: the source's render cannot have landed yet.
    const copy = tex.copy();
    expect(renderSpy).toHaveBeenCalledTimes(1);
    await copy.waitForRender();
    await tex.waitForRender();

    expect(copy.getLocalPoints().length).toBeGreaterThan(0);
    expect(copy.getLocalPoints().length).toBe(tex.getLocalPoints().length);
  });

  // A2 replacement guarantee: the copy's render is its only glyph
  // source, so its failure surfaces via waitForRender() exactly like a
  // plain instance's — there is no "redundant render" left to forgive.
  it('copy of an unrendered MathTex surfaces a render failure via waitForRender', async () => {
    // Project idiom (src/test-setup/vitest-setup.ts): console.error is
    // strict in tests, so the render-error log is silenced with a scoped
    // spy — without it the logger itself would throw inside the catch
    // before _renderError is recorded.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      failRenders = true;
      const tex = new MathTex({ latex: 'x^2', fontSize: 1 });
      // Synchronous copy: the source is unrendered, so the copy starts
      // its own render — which fails, like the source's.
      const copy = tex.copy();
      await expect(copy.waitForRender()).rejects.toThrow('boom-render');
      expect(copy.getRenderError()).not.toBeNull();
      await expect(tex.waitForRender()).rejects.toThrow('boom-render');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('a NON-discarded multi-part render failure still surfaces via waitForRender', async () => {
    // Project idiom (src/test-setup/vitest-setup.ts): console.error is
    // strict in tests, so the render-error log is silenced with a scoped
    // spy — without it the logger itself would throw inside the catch
    // before _renderError is recorded.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      failRenders = true;
      const tex = new MathTex({ latex: ['a', '+', 'b'], fontSize: 1 });
      await expect(tex.waitForRender()).rejects.toThrow('boom-render');
      expect(tex.getRenderError()).not.toBeNull();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
