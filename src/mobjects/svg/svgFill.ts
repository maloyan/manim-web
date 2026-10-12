/**
 * Shared fill/stroke construction for SVGMobject shapes.
 *
 * `createStyledVMobject` is the flat-color factory the shape loops have always
 * used (moved here from SVGMobject.ts). `makeFilledVMobject` wraps it with
 * paint awareness: a `fill="url(#id)"` that resolves to a known gradient yields
 * a {@link GradientVMobject}, and one that resolves to a known pattern yields a
 * {@link PatternVMobject}; every other fill keeps the exact prior flat-color
 * behavior.
 */

import { VMobject } from '../../core/VMobject';
import { GradientVMobject, resolveGradientFill, type SvgGradient } from './svgGradients';
import { PatternVMobject, resolvePatternFill, type SvgPattern } from './svgPatterns';

/**
 * SVG container tags whose element content is a definition, not drawn directly.
 * A shape, `<text>` or `<image>` inside one of these is a template for a
 * reference (a pattern tile, a gradient, a clip), so the top-level shape loops
 * skip it instead of rendering it twice.
 */
const NON_RENDERED_CONTAINERS = new Set([
  'defs',
  'pattern',
  'clippath',
  'mask',
  'symbol',
  'marker',
  'lineargradient',
  'radialgradient',
]);

/**
 * Report whether an SVG element is drawn directly in the document.
 *
 * @param el - The element to test.
 * @returns false when any ancestor is a definition container (for example
 *   `<defs>` or `<pattern>`); true otherwise.
 */
export function isRenderableSvgElement(el: Element): boolean {
  let parent = el.parentElement;
  while (parent) {
    if (NON_RENDERED_CONTAINERS.has(parent.tagName.toLowerCase())) return false;
    parent = parent.parentElement;
  }
  return true;
}

/**
 * Create a flat-styled VMobject from Bezier control points.
 *
 * @param points3D - Bezier control points in 3D.
 * @param color - Stroke color.
 * @param strokeWidth - Stroke width.
 * @param fillColor - Optional fill color.
 * @param fillOpacity - Fill opacity (default 0).
 */
export function createStyledVMobject(
  points3D: [number, number, number][],
  color: string,
  strokeWidth: number,
  fillColor?: string,
  fillOpacity?: number,
): VMobject {
  const vmob = new VMobject();
  vmob.setColor(color);
  vmob.strokeWidth = strokeWidth;
  if (fillColor) {
    vmob.fillColor = fillColor;
  }
  vmob.fillOpacity = fillOpacity ?? 0;
  vmob.setPoints3D(points3D);
  return vmob;
}

/** Options describing how to style one SVG shape's fill. */
export interface FilledVMobjectOptions {
  /** Bezier control points in 3D. */
  points3D: [number, number, number][];
  /** Resolved stroke color. */
  strokeColor: string;
  /** Resolved stroke width. */
  strokeWidth: number;
  /** The raw `fill` attribute from the element (may be null). */
  rawFill: string | null;
  /**
   * Fallback fill used when the element has no `fill` attribute. `<path>` falls
   * back to the SVGMobject default fill; other shapes pass undefined to match
   * their original behavior.
   */
  fallbackFill?: string;
  /** Default fill opacity for a filled shape. */
  defaultFillOpacity?: number;
  /** Gradient definitions for resolving `url(#id)` fills. */
  defs: Map<string, SvgGradient>;
  /** Pattern definitions for resolving `url(#id)` fills. */
  patternDefs?: Map<string, SvgPattern>;
}

/**
 * Build a VMobject for a fill-bearing SVG shape, applying a gradient fill when
 * the `fill` is a resolvable `url(#id)` reference and a flat fill otherwise.
 *
 * The flat-fill branch reproduces the original per-shape logic exactly, so
 * non-gradient shapes are unaffected.
 */
export function makeFilledVMobject(options: FilledVMobjectOptions): VMobject {
  const {
    points3D,
    strokeColor,
    strokeWidth,
    rawFill,
    fallbackFill,
    defaultFillOpacity,
    defs,
    patternDefs,
  } = options;
  const fill = rawFill || fallbackFill;

  if (fill && fill.trim().startsWith('url(')) {
    const gradient = resolveGradientFill(fill, defs);
    if (gradient) {
      return new GradientVMobject({
        gradient,
        points3D,
        strokeColor,
        strokeWidth,
        fillOpacity: defaultFillOpacity ?? 0.5,
      });
    }
    const pattern = patternDefs ? resolvePatternFill(fill, patternDefs) : undefined;
    if (pattern) {
      return new PatternVMobject({
        pattern,
        points3D,
        strokeColor,
        strokeWidth,
        fillOpacity: defaultFillOpacity ?? 0.5,
      });
    }
  }

  const fillColor = fill && fill !== 'none' ? fill : undefined;
  const fillOpacity = fill && fill !== 'none' ? (defaultFillOpacity ?? 0.5) : 0;
  return createStyledVMobject(points3D, strokeColor, strokeWidth, fillColor, fillOpacity);
}
