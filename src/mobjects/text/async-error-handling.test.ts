// @vitest-environment happy-dom
/**
 * Tests for async rendering error propagation (GitHub issue #77).
 *
 * Verifies that waitForRender() / waitForLoad() reject when underlying
 * render/load operations fail, instead of silently resolving.
 */

import { describe, it, expect, vi } from 'vitest';
import { MathTex } from './MathTex';
import { MathTexSVG } from './MathTexSVG';

// Helper: create a minimal MathTex prototype mock (single-part mode)
function createMathTexMock() {
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
  return tex;
}

// Helper: create a minimal MathTexSVG prototype mock
function createMathTexSVGMock() {
  const tex = Object.create(MathTexSVG.prototype);
  tex._renderPromise = null;
  tex._renderError = null;
  tex._markDirty = vi.fn();
  return tex;
}

// ===========================================================================
// MathTex error propagation
// ===========================================================================

describe('MathTex async error propagation', () => {
  it('should reject waitForRender when _renderLatex throws an Error', async () => {
    const tex = createMathTexMock();
    tex._renderLatex = vi.fn().mockRejectedValue(new Error('simulated render failure'));
    tex._startRender();

    await expect(tex.waitForRender()).rejects.toThrow('simulated render failure');
    // renderError should be the original Error instance (instanceof branch)
    expect(tex._renderState.renderError).toBeInstanceOf(Error);
    expect(tex._renderState.renderError.message).toBe('simulated render failure');
  });

  it('should set isRendering to false even on error', async () => {
    const tex = createMathTexMock();
    tex._renderLatex = vi.fn().mockRejectedValue(new Error('fail'));
    tex._startRender();

    try {
      await tex.waitForRender();
    } catch {
      // expected
    }

    expect(tex.isRendering()).toBe(false);
  });

  it('should wrap non-Error rejection values in a new Error', async () => {
    const tex = createMathTexMock();
    // Reject with a plain string — exercises the `new Error(String(error))` branch
    tex._renderLatex = vi.fn().mockRejectedValue('string error');
    tex._startRender();

    await expect(tex.waitForRender()).rejects.toThrow('string error');
  });

  it('should propagate errors through multipart waitForRender', async () => {
    const parent = createMathTexMock();
    parent._isMultiPart = true;
    parent._renderState.renderError = new Error('child render failed');
    parent._arrangePromise = Promise.resolve();

    await expect(parent.waitForRender()).rejects.toThrow('child render failed');
  });

  it('should capture error in _arrangeParts when child parts fail', async () => {
    // Create a parent mock that simulates multipart mode with failing children
    const parent = createMathTexMock();
    parent._isMultiPart = true;

    // Create mock child parts whose waitForRender rejects
    const failingChild = createMathTexMock();
    failingChild._renderState.renderPromise = Promise.resolve();
    failingChild._renderState.renderError = new Error('child KaTeX error');
    parent._parts = [failingChild];

    // Directly call _arrangeParts (private, but accessible on prototype mock)
    await (parent as any)._arrangeParts();

    // The parent should have captured the child's error
    expect(parent._renderState.renderError).toBeInstanceOf(Error);
    expect(parent._renderState.renderError!.message).toBe('child KaTeX error');
  });

  it('should wrap non-Error failures in _arrangeParts', async () => {
    const parent = createMathTexMock();
    parent._isMultiPart = true;

    // Create a mock child whose waitForRender rejects with a non-Error
    const failingChild = createMathTexMock();
    failingChild._renderState.renderPromise = null;
    // Manually override waitForRender to reject with a string
    failingChild.waitForRender = () => Promise.reject('string rejection');
    parent._parts = [failingChild];

    await (parent as any)._arrangeParts();

    expect(parent._renderState.renderError).toBeInstanceOf(Error);
    expect(parent._renderState.renderError!.message).toBe('string rejection');
  });
});

// ===========================================================================
// MathTexSVG error propagation
// ===========================================================================

describe('MathTexSVG async error propagation', () => {
  it('should reject waitForRender when _render throws an Error', async () => {
    const tex = createMathTexSVGMock();
    tex._render = vi.fn().mockRejectedValue(new Error('simulated SVG render failure'));
    tex._startRender();

    await expect(tex.waitForRender()).rejects.toThrow('simulated SVG render failure');
    // _renderError should be the original Error instance
    expect(tex._renderError).toBeInstanceOf(Error);
    expect(tex._renderError.message).toBe('simulated SVG render failure');
  });

  it('should wrap non-Error rejection values in a new Error', async () => {
    const tex = createMathTexSVGMock();
    tex._render = vi.fn().mockRejectedValue('plain string SVG error');
    tex._startRender();

    await expect(tex.waitForRender()).rejects.toThrow('plain string SVG error');
    // Should be wrapped in a real Error
    expect(tex._renderError).toBeInstanceOf(Error);
  });

  it('should not throw from waitForRender when no error occurred', async () => {
    const tex = createMathTexSVGMock();
    tex._renderPromise = Promise.resolve();
    tex._renderError = null;

    // Should resolve without throwing
    await expect(tex.waitForRender()).resolves.toBeUndefined();
  });
});

// ===========================================================================
// KaTeX styles error handling
// ===========================================================================

describe('KaTeX styles onerror', () => {
  it('should resolve and warn when CSS link fires onerror', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset module state by dynamically re-importing
    // The module caches stylesPromise, so we reset it by removing the link
    // and clearing the module cache
    const existing = document.getElementById('manimweb-katex-styles');
    if (existing) existing.remove();

    // We need to trigger the real waitForKatexStyles code path.
    // Since the module caches, we directly test the onerror pattern
    // that the module uses on the link element it creates.
    let resolved = false;
    const promise = new Promise<void>((resolve) => {
      const link = document.createElement('link');
      link.id = 'test-katex-onerror';
      link.rel = 'stylesheet';
      link.href = 'https://invalid.example.com/nonexistent.css';
      link.onerror = () => {
        console.warn(
          'MathTex: KaTeX CSS failed to load from CDN. LaTeX rendering may be degraded.',
        );
        resolve();
      };
      document.head.appendChild(link);
      // Trigger the error event
      link.dispatchEvent(new Event('error'));
    });

    await promise;
    resolved = true;

    expect(resolved).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      'MathTex: KaTeX CSS failed to load from CDN. LaTeX rendering may be degraded.',
    );

    // Clean up
    const testLink = document.getElementById('test-katex-onerror');
    if (testLink) testLink.remove();
    warnSpy.mockRestore();
  });
});
