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
});

// ===========================================================================
// MathTexSVG error propagation
// ===========================================================================

describe('MathTexSVG async error propagation', () => {
  it('should reject renderPromise when _render throws', async () => {
    // Create a MathTexSVG with an intercepted prototype to prevent initial render
    const tex = Object.create(MathTexSVG.prototype);
    tex._renderPromise = null;

    // Override _render to simulate a failure
    tex._render = vi.fn().mockRejectedValue(new Error('simulated SVG render failure'));
    tex._markDirty = vi.fn();

    // Trigger _startRender
    tex._startRender();

    // waitForRender should reject
    await expect(tex.waitForRender()).rejects.toThrow('simulated SVG render failure');
  });
});
