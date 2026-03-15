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
// Window augmentation for global MathJax
// ---------------------------------------------------------------------------

interface MathJaxAdaptor {
  outerHTML(node: unknown): string;
  [key: string]: unknown;
}

interface MathJaxGlobal {
  tex2svg?: (input: string, options?: Record<string, unknown>) => HTMLElement;
  tex?: Record<string, unknown>;
  svg?: Record<string, unknown>;
  startup?: {
    typeset?: boolean;
    ready?: () => void;
    defaultReady?: () => void;
    adaptor?: MathJaxAdaptor;
    output?: { fontCache?: { defs?: unknown } };
  };
}

interface WindowWithMathJax {
  MathJax: MathJaxGlobal;
}

// ---------------------------------------------------------------------------
// Internal MathJax module state (discriminated union)
// ---------------------------------------------------------------------------

interface MathJaxModuleGlobal {
  strategy: 'global';
  MathJax: MathJaxGlobal;
}

/** Generic callable constructor for dynamic MathJax classes */
type MathJaxConstructor = new (options: Record<string, unknown>) => Record<string, unknown>;

interface MathJaxNpmMjModule {
  mathjax: {
    document: (
      content: string,
      options: Record<string, unknown>,
    ) => {
      convert: (input: string, options: Record<string, unknown>) => unknown;
    };
  };
}

interface MathJaxNpmTexModule {
  TeX: MathJaxConstructor;
}

interface MathJaxNpmSvgModule {
  SVG: MathJaxConstructor;
}

interface MathJaxModuleNpm {
  strategy: 'npm';
  mjModule: MathJaxNpmMjModule;
  texModule: MathJaxNpmTexModule;
  svgModule: MathJaxNpmSvgModule;
  adaptor: MathJaxAdaptor;
}

type MathJaxModuleState = MathJaxModuleGlobal | MathJaxModuleNpm;

// ---------------------------------------------------------------------------
// Internal MathJax handle (lazy-loaded)
// ---------------------------------------------------------------------------

/** Cached MathJax module after first dynamic import */
let mathjaxModule: MathJaxModuleState | null = null;

/** Promise for the in-flight import (prevents duplicate loads) */
let mathjaxLoadPromise: Promise<MathJaxModuleState> | null = null;

/**
 * Dynamically load MathJax's SVG output module.
 *
 * We use the "mathjax-full" npm package which provides a programmatic API
 * without needing the global MathJax bootstrap. If that is not available we
 * fall back to loading via a CDN script tag.
 */
async function loadMathJax(): Promise<MathJaxModuleState> {
  if (mathjaxModule) return mathjaxModule;
  if (mathjaxLoadPromise) return mathjaxLoadPromise;

  mathjaxLoadPromise = (async () => {
    // Strategy 1: try the npm package "mathjax-full"
    try {
      // Use Function constructor to hide specifiers from Vite's static analysis
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const importFn = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<Record<string, (...args: unknown[]) => unknown>>;
      const mjModule = await importFn('mathjax-full/js/mathjax.js');
      const texModule = await importFn('mathjax-full/js/input/tex-full.js');
      const svgModule = await importFn('mathjax-full/js/output/svg.js');
      const liteAdaptor = await importFn('mathjax-full/js/adaptors/liteAdaptor.js');
      const htmlHandler = await importFn('mathjax-full/js/handlers/html.js');

      const adaptor = liteAdaptor.liteAdaptor() as unknown as MathJaxAdaptor;
      htmlHandler.RegisterHTMLHandler(adaptor);

      mathjaxModule = {
        mjModule: mjModule as unknown as MathJaxNpmMjModule,
        texModule: texModule as unknown as MathJaxNpmTexModule,
        svgModule: svgModule as unknown as MathJaxNpmSvgModule,
        adaptor,
        strategy: 'npm' as const,
      };
      return mathjaxModule;
    } catch {
      // npm package not available -- fall through
    }

    // Strategy 2: global MathJax loaded via <script> tag (CDN fallback)
    if (typeof window !== 'undefined') {
      const win = window as unknown as WindowWithMathJax;
      if (win.MathJax && win.MathJax.tex2svg) {
        mathjaxModule = { strategy: 'global' as const, MathJax: win.MathJax };
        return mathjaxModule;
      }

      // Load from CDN
      await new Promise<void>((resolve, reject) => {
        // Configure before loading
        win.MathJax = {
          tex: {
            inlineMath: [
              ['$', '$'],
              ['\\(', '\\)'],
            ],
            displayMath: [
              ['$$', '$$'],
              ['\\[', '\\]'],
            ],
            packages: { '[+]': ['ams', 'newcommand', 'configmacros'] },
          },
          svg: {
            fontCache: 'global',
          },
          startup: {
            typeset: false,
            ready: () => {
              win.MathJax.startup?.defaultReady?.();
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

      mathjaxModule = { strategy: 'global' as const, MathJax: win.MathJax };
      return mathjaxModule;
    }

    throw new Error('MathJax could not be loaded: no npm package and no browser environment.');
  })();

  return mathjaxLoadPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether MathJax has already been loaded.
 */
export function isMathJaxLoaded(): boolean {
  return mathjaxModule !== null;
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
 * into VMobject paths suitable for manim-web animation.
 *
 * @param texString - The raw LaTeX to render (without delimiters).
 * @param options   - Rendering options.
 * @returns A MathJaxRenderResult containing the SVG element and VMobject group.
 */
// eslint-disable-next-line complexity
export async function renderLatexToSVG(
  texString: string,
  options: MathJaxRenderOptions = {},
): Promise<MathJaxRenderResult> {
  const { displayMode = true, color = '#ffffff', fontScale = 1, macros = {} } = options;

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
      const existingMacros = (MathJax.tex.macros as Record<string, string> | undefined) ?? {};
      MathJax.tex.macros = { ...existingMacros, ...macros };
    }

    // Render
    if (!MathJax.tex2svg) {
      throw new Error('MathJax.tex2svg is not available');
    }
    const wrapper: HTMLElement = MathJax.tex2svg(texString, { display: displayMode });
    svgElement = wrapper.querySelector('svg')!;

    if (!svgElement) {
      throw new Error(`MathJax failed to produce SVG for: ${texString}`);
    }

    // Inject global font cache <defs> into the SVG so that <use> refs
    // can be resolved by svgToVMobjects.  MathJax with fontCache:'global'
    // stores glyph <path> definitions in a separate internal node tree
    // (MathJax.startup.output.fontCache.defs) instead of inlining them.
    try {
      const adaptor = MathJax.startup?.adaptor;
      const fontDefs = MathJax.startup?.output?.fontCache?.defs;
      if (adaptor && fontDefs) {
        const defsHTML = adaptor.outerHTML(fontDefs);
        if (defsHTML) {
          const tmp = document.createElement('div');
          tmp.innerHTML = defsHTML;
          const defsEl = tmp.querySelector('defs');
          if (defsEl) {
            svgElement.insertBefore(defsEl, svgElement.firstChild);
          }
        }
      }
    } catch {
      // Non-critical: svgToVMobjects will just produce fewer paths
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
  const vmobjectGroup = svgToVMobjects(svgElement, { color, scale: fontScale, flipY: false });

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
