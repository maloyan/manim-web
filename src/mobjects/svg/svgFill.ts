/**
 * Shared fill/stroke construction for SVGMobject shapes.
 *
 * `createStyledVMobject` is the flat-color factory the shape loops have always
 * used (moved here from SVGMobject.ts). `makeFilledVMobject` wraps it with
 * gradient awareness: a `fill="url(#id)"` that resolves to a known gradient
 * yields a {@link GradientVMobject}; every other fill keeps the exact prior
 * flat-color behavior.
 */

import { VMobject } from '../../core/VMobject';
import { GradientVMobject, resolveGradientFill, type SvgGradient } from './svgGradients';

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
}

/**
 * Build a VMobject for a fill-bearing SVG shape, applying a gradient fill when
 * the `fill` is a resolvable `url(#id)` reference and a flat fill otherwise.
 *
 * The flat-fill branch reproduces the original per-shape logic exactly, so
 * non-gradient shapes are unaffected.
 */
export function makeFilledVMobject(options: FilledVMobjectOptions): VMobject {
  const { points3D, strokeColor, strokeWidth, rawFill, fallbackFill, defaultFillOpacity, defs } =
    options;
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
  }

  const fillColor = fill && fill !== 'none' ? fill : undefined;
  const fillOpacity = fill && fill !== 'none' ? (defaultFillOpacity ?? 0.5) : 0;
  return createStyledVMobject(points3D, strokeColor, strokeWidth, fillColor, fillOpacity);
}
