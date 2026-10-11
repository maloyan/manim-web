/**
 * TypstRenderer - Typst markup rendering via the Typst WASM compiler.
 *
 * Typst is a modern markup-based typesetting system. The `@myriaddreamin/typst.ts`
 * package ships a self-contained WebAssembly compiler that turns Typst source
 * into SVG, entirely in the browser (no system install). This module compiles a
 * Typst source string to an SVG string and then reuses the shared
 * `svgToVMobjects` importer so Typst output becomes the same VMobject paths that
 * MathTex produces from MathJax SVG.
 *
 * The compiler is heavy (a multi-megabyte WASM binary). It is therefore
 * LAZY-LOADED through a dynamic `import()` on first use. The static module graph
 * never references `@myriaddreamin/typst.ts`, so the base bundle stays small and
 * SSR / the Docs build never pull in the WASM for users who do not touch Typst.
 *
 * Tests inject a mock compiler via `setTypstCompiler`, which bypasses the dynamic
 * import entirely. This keeps the unit tests free of any real WASM compile.
 */

import type { VGroup } from '../../core/VGroup';
import { svgToVMobjects } from './svgPathParser';
import { WHITE } from '../../constants/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TypstRenderOptions {
  /** Stroke / fill color for the resulting VMobjects. Default: WHITE. */
  color?: string;
  /** Stroke width passed to the SVG importer. Default: 0.02. */
  strokeWidth?: number;
  /** Fill opacity passed to the SVG importer. Default: 1. */
  fillOpacity?: number;
}

export interface TypstRenderResult {
  /** The root SVG element produced by the Typst compiler. */
  svgElement: SVGElement;
  /** VMobject group with one child per glyph / path. */
  vmobjectGroup: VGroup;
  /** Original SVG string (for debugging or caching). */
  svgString: string;
  /** Bounding width in the SVG's viewBox units. */
  width: number;
  /** Bounding height in the SVG's viewBox units. */
  height: number;
}

/**
 * A function that compiles a Typst source string to a full SVG string.
 * Used as the dependency-injection seam: tests set a mock compiler so the
 * real WASM compiler is never loaded.
 */
export type TypstSvgCompiler = (source: string) => Promise<string> | string;

// ---------------------------------------------------------------------------
// Compiler handle (lazy-loaded or injected)
// ---------------------------------------------------------------------------

/** Minimal shape of the `$typst` snippet util used here. */
interface TypstSnippetLike {
  svg(options: { mainContent: string }): Promise<string>;
}

/** Injected compiler. When set, the real WASM compiler is never loaded. */
let compilerOverride: TypstSvgCompiler | null = null;

/** Cached `$typst` snippet util after the first dynamic import. */
let typstSnippet: TypstSnippetLike | null = null;

/** Promise for the in-flight import (prevents duplicate loads). */
let typstLoadPromise: Promise<TypstSnippetLike> | null = null;

/**
 * Inject a Typst compiler, replacing the lazy-loaded WASM compiler.
 *
 * Pass a function that maps a Typst source string to an SVG string. Pass `null`
 * to restore the default WASM-backed compiler. Tests use this to avoid any real
 * WASM compile.
 */
export function setTypstCompiler(compiler: TypstSvgCompiler | null): void {
  compilerOverride = compiler;
}

/**
 * Dynamically load the Typst WASM compiler.
 *
 * The import specifier is a literal so bundlers emit a separate lazy chunk and
 * static analysers (knip) still see the dependency as used.
 */
async function loadTypst(): Promise<TypstSnippetLike> {
  if (typstSnippet) return typstSnippet;
  if (typstLoadPromise) return typstLoadPromise;

  typstLoadPromise = (async () => {
    try {
      const { $typst } = await import('@myriaddreamin/typst.ts');
      typstSnippet = $typst as unknown as TypstSnippetLike;
      return typstSnippet;
    } catch (error) {
      typstLoadPromise = null;
      throw new Error(
        `Typst compiler could not be loaded. Install @myriaddreamin/typst.ts ` +
          `(with its web-compiler and renderer peers), or inject a compiler via ` +
          `setTypstCompiler(). Cause: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  })();

  return typstLoadPromise;
}

/**
 * Check whether the Typst compiler has already been loaded.
 */
export function isTypstLoaded(): boolean {
  return typstSnippet !== null;
}

/**
 * Pre-load the Typst compiler so the first render is fast.
 * Call this early if you know Typst will be used.
 */
export async function preloadTypst(): Promise<void> {
  if (compilerOverride) return;
  await loadTypst();
}

/** Compile a Typst source string to a full SVG string. */
async function compileToSvgString(source: string): Promise<string> {
  if (compilerOverride) {
    return compilerOverride(source);
  }
  const snippet = await loadTypst();
  return snippet.svg({ mainContent: source });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compile a Typst source string to SVG and convert the result into VMobject
 * paths suitable for manim-web animation.
 *
 * The returned VMobject coordinates are raw SVG viewBox units (not world units).
 * The caller (`Typst`) applies the final point -> world conversion.
 *
 * @param source  - The Typst source to compile (already wrapped for math mode
 *                  by `MathTypst` when applicable).
 * @param options - Rendering options.
 */
export async function renderTypstToSVG(
  source: string,
  options: TypstRenderOptions = {},
): Promise<TypstRenderResult> {
  const { color = WHITE, strokeWidth = 0.02, fillOpacity = 1 } = options;

  const svgString = await compileToSvgString(source);

  let svgElement: SVGElement;
  if (typeof DOMParser === 'undefined') {
    // Headless / no-DOM environment — create a minimal stub SVGElement.
    svgElement = {
      getAttribute: () => null,
      setAttribute: () => {},
      querySelectorAll: () => [],
    } as unknown as SVGElement;
  } else {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const innerSvg = doc.querySelector('svg');
    svgElement = (innerSvg || doc.documentElement) as unknown as SVGElement;
    if (!svgElement || !('tagName' in svgElement)) {
      svgElement = {
        getAttribute: () => null,
        setAttribute: () => {},
        querySelectorAll: () => [],
      } as unknown as SVGElement;
    }
  }

  // Read dimensions from the SVG viewBox when present.
  const viewBox = svgElement.getAttribute('viewBox');
  let width = 0;
  let height = 0;
  if (viewBox) {
    const parts = viewBox.split(/\s+/);
    width = parseFloat(parts[2]) || 0;
    height = parseFloat(parts[3]) || 0;
  }

  if (!('tagName' in svgElement)) {
    throw new Error('Typst SVG element has no tagName');
  }

  // Typst renders text black by default. The importer paints every path with
  // `color`, so the output honors the requested color without extra recoloring.
  const vmobjectGroup = svgToVMobjects(svgElement, {
    color,
    scale: 1,
    flipY: true,
    strokeWidth,
    fillOpacity,
  });

  return {
    svgElement,
    vmobjectGroup,
    svgString,
    width,
    height,
  };
}
