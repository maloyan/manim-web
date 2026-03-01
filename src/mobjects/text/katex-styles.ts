/**
 * KaTeX CSS loader for manimweb
 *
 * Ensures the KaTeX stylesheet is loaded for proper LaTeX rendering.
 */

let stylesPromise: Promise<void> | null = null;

/**
 * Ensure KaTeX styles are loaded in the document.
 * This is called automatically by MathTex on first use.
 *
 * The stylesheet is loaded from a CDN for convenience.
 * In production, you may want to bundle the CSS directly.
 */
export function ensureKatexStyles(): void {
  waitForKatexStyles();
}

/**
 * Wait for KaTeX CSS to finish loading.
 * Returns a promise that resolves when the stylesheet is loaded.
 */
export function waitForKatexStyles(): Promise<void> {
  if (stylesPromise) return stylesPromise;
  if (typeof document === 'undefined') {
    stylesPromise = Promise.resolve();
    return stylesPromise;
  }

  const existing = document.getElementById('manimweb-katex-styles') as HTMLLinkElement | null;
  if (existing) {
    stylesPromise = Promise.resolve();
    return stylesPromise;
  }

  stylesPromise = new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.id = 'manimweb-katex-styles';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css';
    link.crossOrigin = 'anonymous';
    link.onload = () => resolve();
    link.onerror = () => {
      console.warn('MathTex: KaTeX CSS failed to load from CDN. LaTeX rendering may be degraded.');
      resolve();
    };
    document.head.appendChild(link);
  });

  return stylesPromise;
}

/**
 * Check if KaTeX styles have been injected
 */
export function areKatexStylesLoaded(): boolean {
  return stylesPromise !== null || document.getElementById('manimweb-katex-styles') !== null;
}
