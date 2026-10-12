// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Force the MathJax npm bundle to fail to load so the renderer falls through to
// its script-fallback path. A hoisted `vi.mock` registers before any import, so
// the renderer's dynamic `import('./MathJaxBundle.js')` reliably rejects. An
// earlier `vi.doMock` inside the test raced with `vi.resetModules()` under a
// loaded parallel run: the real (heavy) `@mathjax/src` bundle sometimes loaded
// instead, so `preloadMathJax()` ran past the 5s default and the test timed out.
vi.mock('./MathJaxBundle.js', () => {
  throw new Error('simulated module load failure');
});

/** Remove any global MathJax left on `window` by another test file. */
function clearGlobalMathJax(): void {
  delete (window as unknown as { MathJax?: unknown }).MathJax;
}

describe('text asset configuration', () => {
  // happy-dom shares `window` across test files, so a test elsewhere that loads
  // MathJax via the global/script path can leave `window.MathJax` behind. The
  // fallback test below relies on that global being absent, so clear it here to
  // keep this file hermetic regardless of execution order.
  beforeEach(() => {
    clearGlobalMathJax();
  });

  afterEach(() => {
    vi.resetModules();
    document.head.replaceChildren();
    clearGlobalMathJax();
  });

  it('allows applications that bundle KaTeX CSS to disable stylesheet injection', async () => {
    vi.resetModules();
    const styles = await import('./katexStyles');

    styles.setKatexStylesheetUrl(null);
    styles.ensureKatexStyles();
    await styles.waitForKatexStyles();

    expect(document.getElementById('manimweb-katex-styles')).toBeNull();
    expect(styles.areKatexStylesLoaded()).toBe(true);
  });

  it('allows applications to disable MathJax script fallback', async () => {
    vi.resetModules();
    const renderer = await import('./MathJaxRenderer');

    renderer.setMathJaxScriptUrl(null);

    await expect(renderer.preloadMathJax()).rejects.toThrow(
      'MathJax npm modules failed and the script fallback is disabled',
    );
    expect(document.querySelector('script[src*="mathjax"]')).toBeNull();
  }, 20000);
});
