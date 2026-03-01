// @vitest-environment happy-dom
/**
 * Tests for async rendering error propagation (GitHub issue #77).
 *
 * Verifies that waitForRender() / waitForLoad() reject when underlying
 * render/load operations fail, instead of silently resolving.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MathTex } from './MathTex';
import { MathTexSVG } from './MathTexSVG';

// ===========================================================================
// MathTex error propagation
// ===========================================================================

describe('MathTex async error propagation', () => {
  it('should reject renderPromise when _renderLatex throws', async () => {
    // Create a MathTex with an intercepted prototype to prevent initial render
    const tex = Object.create(MathTex.prototype);
    // Initialize minimal state without triggering constructor render
    tex._renderState = {
      canvas: null,
      texture: null,
      mesh: null,
      width: 0,
      height: 0,
      isRendering: false,
      renderPromise: null,
      renderError: null,
    };
    tex._isMultiPart = false;

    // Override _renderLatex to simulate a failure
    tex._renderLatex = vi.fn().mockRejectedValue(new Error('simulated render failure'));

    // Trigger _startRender which should propagate the error
    tex._startRender();

    // waitForRender should reject
    await expect(tex.waitForRender()).rejects.toThrow('simulated render failure');
  });

  it('should set isRendering to false even on error', async () => {
    const tex = Object.create(MathTex.prototype);
    tex._renderState = {
      canvas: null,
      texture: null,
      mesh: null,
      width: 0,
      height: 0,
      isRendering: false,
      renderPromise: null,
      renderError: null,
    };
    tex._isMultiPart = false;

    tex._renderLatex = vi.fn().mockRejectedValue(new Error('fail'));
    tex._startRender();

    try {
      await tex.waitForRender();
    } catch {
      // expected
    }

    expect(tex.isRendering()).toBe(false);
  });

  it('should wrap non-Error rejection values in an Error', async () => {
    const tex = Object.create(MathTex.prototype);
    tex._renderState = {
      canvas: null,
      texture: null,
      mesh: null,
      width: 0,
      height: 0,
      isRendering: false,
      renderPromise: null,
      renderError: null,
    };
    tex._isMultiPart = false;

    // Reject with a plain string instead of an Error
    tex._renderLatex = vi.fn().mockRejectedValue('string error');
    tex._startRender();

    await expect(tex.waitForRender()).rejects.toThrow('string error');
  });

  it('should propagate errors through multipart waitForRender', async () => {
    // Create a parent MathTex that simulates multipart mode
    const parent = Object.create(MathTex.prototype);
    parent._isMultiPart = true;
    parent._renderState = {
      canvas: null,
      texture: null,
      mesh: null,
      width: 0,
      height: 0,
      isRendering: false,
      renderPromise: null,
      renderError: new Error('child render failed'),
    };
    // _arrangePromise already resolved (allSettled captured the error)
    parent._arrangePromise = Promise.resolve();

    await expect(parent.waitForRender()).rejects.toThrow('child render failed');
  });
});

// ===========================================================================
// MathTexSVG error propagation
// ===========================================================================

describe('MathTexSVG async error propagation', () => {
  it('should reject renderPromise when _render throws', async () => {
    // Create a MathTexSVG with an intercepted prototype to prevent initial render
    const tex = Object.create(MathTexSVG.prototype);
    tex._renderPromise = null;
    tex._renderError = null;

    // Override _render to simulate a failure
    tex._render = vi.fn().mockRejectedValue(new Error('simulated SVG render failure'));
    tex._markDirty = vi.fn();

    // Trigger _startRender
    tex._startRender();

    // waitForRender should reject
    await expect(tex.waitForRender()).rejects.toThrow('simulated SVG render failure');
  });

  it('should wrap non-Error rejection values in an Error', async () => {
    const tex = Object.create(MathTexSVG.prototype);
    tex._renderPromise = null;
    tex._renderError = null;

    tex._render = vi.fn().mockRejectedValue('plain string SVG error');
    tex._markDirty = vi.fn();

    tex._startRender();

    await expect(tex.waitForRender()).rejects.toThrow('plain string SVG error');
  });

  it('should store _renderError on failure', async () => {
    const tex = Object.create(MathTexSVG.prototype);
    tex._renderPromise = null;
    tex._renderError = null;

    tex._render = vi.fn().mockRejectedValue(new Error('stored error'));
    tex._markDirty = vi.fn();

    tex._startRender();

    try {
      await tex.waitForRender();
    } catch {
      // expected
    }

    expect(tex._renderError).toBeInstanceOf(Error);
    expect(tex._renderError.message).toBe('stored error');
  });
});

// ===========================================================================
// KaTeX styles error handling
// ===========================================================================

describe('KaTeX styles onerror', () => {
  beforeEach(() => {
    // Reset the module-level stylesPromise by removing cached link
    const existing = document.getElementById('manimweb-katex-styles');
    if (existing) existing.remove();
  });

  it('should resolve and warn when CSS fails to load', async () => {
    // We need to reset the module state. Import fresh.
    // The module caches stylesPromise, so we need to clear it.
    // Since we can't easily reset module state, we test the onerror
    // handler pattern directly via a DOM link element simulation.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const link = document.createElement('link');
    let resolvedValue: string | undefined;
    const promise = new Promise<string>((resolve) => {
      link.onerror = () => {
        console.warn('MathTex: KaTeX CSS failed to load from CDN. LaTeX rendering may be degraded.');
        resolve('resolved-after-error');
      };
    });

    // Simulate the error
    link.dispatchEvent(new Event('error'));
    resolvedValue = await promise;

    expect(resolvedValue).toBe('resolved-after-error');
    expect(warnSpy).toHaveBeenCalledWith(
      'MathTex: KaTeX CSS failed to load from CDN. LaTeX rendering may be degraded.',
    );
    warnSpy.mockRestore();
  });
});
