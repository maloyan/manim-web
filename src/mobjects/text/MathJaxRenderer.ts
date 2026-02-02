/**
 * MathJaxRenderer - LaTeX rendering via MathJax SVG output.
 *
 * MathJax supports virtually all LaTeX commands and packages (including
 * chemfig, tikz, custom macros, \usepackage, \begin{align}, etc.).
 * It runs entirely in the browser and produces SVG output.
 *
 * This renderer is used as a fallback when KaTeX cannot handle the input,
 * or when explicitly requested via `renderer: 'mathjax'`.
 *
 * MathJax is dynamically imported to keep the default bundle small.
 */

import katex from 'katex';
import type { VGroup } from '../../core/VGroup';
import { svgToVMobjects } from './svgPathParser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MathJaxRenderOptions {
  /** Display mode (block) vs inline mode. Default: true */
  displayMode?: boolean;
  /** Custom LaTeX preamble (e.g. '\\usepackage{amsmath}'). Merged with defaults. */
  preamble?: string;
  /** Custom macros as { name: expansion }. */
  macros?: Record<string, string>;
  /** Color applied to the output (CSS color string). Default: '#ffffff' */
  color?: string;
  /** Font scale relative to surrounding text (em). Default: 1 */
  fontScale?: number;
}

export interface MathJaxRenderResult {
  /** The root SVG element produced by MathJax */
  svgElement: SVGElement;
  /** VMobject group with one child per glyph/path */
  vmobjectGroup: VGroup;
  /** Original SVG string (for debugging or caching) */
  svgString: string;
  /** Bounding width in MathJax "ex" units */
  width: number;
  /** Bounding height in MathJax "ex" units */
  height: number;
}

// ---------------------------------------------------------------------------
// Internal MathJax handle (lazy-loaded)
// ---------------------------------------------------------------------------

/** Cached MathJax module after first dynamic import */
let _mathjaxModule: any = null;

/** Promise for the in-flight import (prevents duplicate loads) */
let _mathjaxLoadPromise: Promise<any> | null = null;

/**
 * Dynamically load MathJax's SVG output module.
 *
 * We use the "mathjax-full" npm package which provides a programmatic API
 * without needing the global MathJax bootstrap. If that is not available we
 * fall back to loading via a CDN script tag.
 */
async function loadMathJax(): Promise<any> {
  if (_mathjaxModule) return _mathjaxModule;
  if (_mathjaxLoadPromise) return _mathjaxLoadPromise;

  _mathjaxLoadPromise = (async () => {
    // Strategy 1: try the npm package "mathjax-full"
    try {
      // Use Function constructor to hide specifiers from Vite's static analysis
      const _import = new Function('s', 'return import(s)') as (s: string) => Promise<any>;
      const mjModule = await _import('mathjax-full/js/mathjax.js');
      const texModule = await _import('mathjax-full/js/input/tex-full.js');
      const svgModule = await _import('mathjax-full/js/output/svg.js');
      const liteAdaptor = await _import('mathjax-full/js/adaptors/liteAdaptor.js');
      const htmlHandler = await _import('mathjax-full/js/handlers/html.js');

      const adaptor = liteAdaptor.liteAdaptor();
      htmlHandler.RegisterHTMLHandler(adaptor);

      _mathjaxModule = { mjModule, texModule, svgModule, adaptor, strategy: 'npm' as const };
      return _mathjaxModule;
    } catch {
      // npm package not available -- fall through
    }

    // Strategy 2: global MathJax loaded via <script> tag (CDN fallback)
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.MathJax && win.MathJax.tex2svg) {
        _mathjaxModule = { strategy: 'global' as const, MathJax: win.MathJax };
        return _mathjaxModule;
      }

      // Load from CDN
      await new Promise<void>((resolve, reject) => {
        // Configure before loading
        win.MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            packages: { '[+]': ['ams', 'newcommand', 'configmacros'] },
          },
          svg: {
            fontCache: 'global',
          },
          startup: {
            typeset: false,
            ready: () => {
              win.MathJax.startup.defaultReady();
              resolve();
            },
          },
        };

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg-full.js';
        script.async = true;
        script.onerror = () => reject(new Error('Failed to load MathJax from CDN'));
        document.head.appendChild(script);

        // Timeout after 15 seconds
        setTimeout(() => reject(new Error('MathJax CDN load timed out')), 15000);
      });

      _mathjaxModule = { strategy: 'global' as const, MathJax: win.MathJax };
      return _mathjaxModule;
    }

    throw new Error('MathJax could not be loaded: no npm package and no browser environment.');
  })();

  return _mathjaxLoadPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether MathJax has already been loaded.
 */
export function isMathJaxLoaded(): boolean {
  return _mathjaxModule !== null;
}

/**
 * Pre-load MathJax so the first render is fast.
 * Call this early (e.g. on page load) if you know LaTeX will be used.
 */
export async function preloadMathJax(): Promise<void> {
  await loadMathJax();
}

/**
 * Render a LaTeX string to SVG using MathJax and convert the result
 * into VMobject paths suitable for manim-js animation.
 *
 * @param texString - The raw LaTeX to render (without delimiters).
 * @param options   - Rendering options.
 * @returns A MathJaxRenderResult containing the SVG element and VMobject group.
 */
export async function renderLatexToSVG(
  texString: string,
  options: MathJaxRenderOptions = {},
): Promise<MathJaxRenderResult> {
  const {
    displayMode = true,
    color = '#ffffff',
    fontScale = 1,
    macros = {},
    preamble: _preamble,
  } = options;

  const mj = await loadMathJax();

  let svgElement: SVGElement;
  let svgString: string;

  if (mj.strategy === 'global') {
    // ------------------------------------------------------------------
    // Global MathJax (CDN)
    // ------------------------------------------------------------------
    const MathJax = mj.MathJax;

    // Merge custom macros
    if (Object.keys(macros).length > 0) {
      MathJax.tex = MathJax.tex || {};
      MathJax.tex.macros = { ...MathJax.tex.macros, ...macros };
    }

    // Render
    const wrapper: HTMLElement = MathJax.tex2svg(texString, { display: displayMode });
    svgElement = wrapper.querySelector('svg')!;

    if (!svgElement) {
      throw new Error(`MathJax failed to produce SVG for: ${texString}`);
    }

    svgString = svgElement.outerHTML;
  } else {
    // ------------------------------------------------------------------
    // npm mathjax-full
    // ------------------------------------------------------------------
    const { mjModule, texModule, svgModule, adaptor } = mj;
    const MathJax = mjModule.mathjax;
    const TeX = texModule.TeX;
    const SVG = svgModule.SVG;

    const tex = new TeX({
      packages: ['base', 'ams', 'newcommand', 'configmacros'],
      ...(Object.keys(macros).length > 0 ? { macros } : {}),
    });
    const svg = new SVG({ fontCache: 'none' });
    const html = MathJax.document('', { InputJax: tex, OutputJax: svg });

    const node = html.convert(texString, { display: displayMode });
    svgString = adaptor.outerHTML(node);

    // Parse the string into a real SVGElement for downstream use
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    svgElement = doc.documentElement as unknown as SVGElement;
  }

  // ------------------------------------------------------------------
  // Apply color & scale
  // ------------------------------------------------------------------
  svgElement.setAttribute('color', color);
  svgElement.setAttribute('style', `color:${color};`);

  // Replace currentColor in all shapes
  const shapes = svgElement.querySelectorAll('path, line, rect, circle, polyline, polygon, use');
  shapes.forEach((el) => {
    const fill = el.getAttribute('fill');
    if (!fill || fill === 'currentColor' || fill === 'inherit') {
      el.setAttribute('fill', color);
    }
    const stroke = el.getAttribute('stroke');
    if (stroke === 'currentColor' || stroke === 'inherit') {
      el.setAttribute('stroke', color);
    }
  });

  // Read dimensions from the SVG viewBox (MathJax always sets one)
  const viewBox = svgElement.getAttribute('viewBox');
  let width = 0;
  let height = 0;
  if (viewBox) {
    const parts = viewBox.split(/\s+/);
    width = parseFloat(parts[2]) || 0;
    height = parseFloat(parts[3]) || 0;
  }

  // Scale dimensions
  width *= fontScale;
  height *= fontScale;

  // ------------------------------------------------------------------
  // Convert SVG paths to VMobjects
  // ------------------------------------------------------------------
  const vmobjectGroup = svgToVMobjects(svgElement, { color, scale: fontScale });

  return {
    svgElement,
    vmobjectGroup,
    svgString,
    width,
    height,
  };
}

/**
 * Quick check: can KaTeX render this LaTeX string without throwing?
 * Used by the 'auto' renderer mode to decide whether to fall back to MathJax.
 */
export function katexCanRender(texString: string, displayMode = true): boolean {
  try {
    katex.renderToString(texString, {
      displayMode,
      throwOnError: true,
      output: 'html',
    });
    return true;
  } catch {
    return false;
  }
}
