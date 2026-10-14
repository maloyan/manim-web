/**
 * SVG gradient support for SVGMobject (best-manim enhancement).
 *
 * Parses `<linearGradient>` and `<radialGradient>` definitions into a plain
 * data model, resolves `fill="url(#id)"` references, and builds a
 * {@link GradientVMobject} whose fill reuses the repo gradient helper
 * ({@link colorGradient}).
 *
 * ManimCE drops gradients on SVG import (tracking issue #3709); the browser
 * renders them natively. manim-web draws the gradient with per-vertex fill
 * colors (see {@link VMobject.setFillGradient}). The full resampled palette is
 * also exposed on {@link GradientVMobject.gradientColors}. SVG stop opacity and
 * gradient vectors are not applied. The gradient spans the shape bounding box.
 */

import { VMobject } from '../../core/VMobject';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { colorGradient } from '../../core/VMobjectColorGradient';

/** Gradient geometry kind parsed from an SVG definition. */
export type SvgGradientType = 'linear' | 'radial';

/** One color stop of an SVG gradient. */
export interface SvgGradientStop {
  /** Position along the gradient, clamped to [0, 1]. */
  offset: number;
  /** Stop color as a CSS color string (default black). */
  color: string;
  /** Stop opacity in [0, 1] (default 1). */
  opacity: number;
}

/** Parsed SVG gradient definition. */
export interface SvgGradient {
  /** The gradient `id` used by `url(#id)` references. */
  id: string;
  /** Gradient kind. Radial is approximated as a linear stop sequence. */
  type: SvgGradientType;
  /** Ordered color stops. */
  stops: SvgGradientStop[];
}

/** Default SVG stop color when neither attribute nor style specifies one. */
const DEFAULT_STOP_COLOR = '#000000';

/**
 * Read one property from an inline `style` attribute string.
 *
 * @param styleAttr - The raw `style` value, e.g. `stop-color:#f00;stop-opacity:0.5`.
 * @param name - The property name to read, e.g. `stop-color`.
 * @returns The trimmed value, or undefined when absent.
 */
function readStyleProp(styleAttr: string, name: string): string | undefined {
  for (const decl of styleAttr.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    if (decl.slice(0, idx).trim() === name) {
      return decl.slice(idx + 1).trim();
    }
  }
  return undefined;
}

/**
 * Parse an SVG stop offset (`0.5` or `50%`) into a number clamped to [0, 1].
 */
function parseOffset(raw: string | null): number {
  if (!raw) return 0;
  const trimmed = raw.trim();
  const value = trimmed.endsWith('%') ? parseFloat(trimmed) / 100 : parseFloat(trimmed);
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Parse an SVG `<stop>` element into a {@link SvgGradientStop}.
 *
 * Reads `stop-color`/`stop-opacity` from attributes first, then from the inline
 * `style` attribute.
 */
function parseStop(stop: Element): SvgGradientStop {
  const style = stop.getAttribute('style') ?? '';
  const color =
    stop.getAttribute('stop-color') ?? readStyleProp(style, 'stop-color') ?? DEFAULT_STOP_COLOR;
  const opacityRaw = stop.getAttribute('stop-opacity') ?? readStyleProp(style, 'stop-opacity');
  const opacity = opacityRaw === undefined ? 1 : parseFloat(opacityRaw);
  return {
    offset: parseOffset(stop.getAttribute('offset')),
    color,
    opacity: Number.isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity)),
  };
}

/**
 * Collect every `<linearGradient>`/`<radialGradient>` definition in an SVG,
 * keyed by its `id`. Gradients without an `id` or without stops are skipped.
 *
 * @param svg - The parsed `<svg>` root element.
 * @returns A map from gradient id to its parsed definition.
 */
export function parseGradientDefs(svg: Element): Map<string, SvgGradient> {
  const defs = new Map<string, SvgGradient>();
  const nodes = svg.querySelectorAll('linearGradient, radialGradient');
  for (const node of nodes) {
    const id = node.getAttribute('id');
    if (!id) continue;
    const stops = Array.from(node.querySelectorAll('stop')).map(parseStop);
    if (stops.length === 0) continue;
    const type: SvgGradientType = node.tagName.toLowerCase().includes('radial')
      ? 'radial'
      : 'linear';
    defs.set(id, { id, type, stops });
  }
  return defs;
}

/**
 * Resolve a `fill="url(#id)"` reference to its gradient definition.
 *
 * @param fillAttr - The raw fill attribute value.
 * @param defs - Gradient definitions from {@link parseGradientDefs}.
 * @returns The matching gradient, or undefined when the fill is not a gradient
 *   reference or the id is unknown.
 */
export function resolveGradientFill(
  fillAttr: string | null | undefined,
  defs: Map<string, SvgGradient>,
): SvgGradient | undefined {
  if (!fillAttr) return undefined;
  const match = /url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/.exec(fillAttr);
  if (!match) return undefined;
  return defs.get(match[1]);
}

/**
 * Resample a gradient's stop colors into an evenly spaced palette using the
 * repo's {@link colorGradient} helper. Always at least two colors so a
 * single-stop gradient still interpolates.
 *
 * @param gradient - The gradient to sample.
 * @returns An array of `#rrggbb` colors, or [] when the gradient has no stops.
 */
function gradientColorList(gradient: SvgGradient): string[] {
  const colors = gradient.stops.map((stop) => stop.color);
  if (colors.length === 0) return [];
  return colorGradient(colors, Math.max(colors.length, 2));
}

/** Options for {@link GradientVMobject}. */
export interface GradientVMobjectOptions {
  /** The resolved gradient applied as this object's fill. */
  gradient: SvgGradient;
  /** Bezier control points in 3D. */
  points3D: [number, number, number][];
  /** Stroke color (default WHITE). */
  strokeColor?: string;
  /** Stroke width (default DEFAULT_STROKE_WIDTH). */
  strokeWidth?: number;
  /** Fill opacity (default 0.5). */
  fillOpacity?: number;
}

/**
 * A VMobject whose fill comes from an SVG gradient.
 *
 * The constructor calls {@link VMobject.setFillGradient} with the parsed stops,
 * so the fill renders as a real linear or radial gradient. The flat `fillColor`
 * stays the first (offset-0) stop. {@link gradientColors} holds the full
 * resampled palette (via {@link colorGradient}), and {@link gradient} keeps the
 * original parsed stops.
 */
export class GradientVMobject extends VMobject {
  /** The parsed gradient definition applied as fill. */
  readonly gradient: SvgGradient;
  /** Evenly spaced palette of the gradient stops (via {@link colorGradient}). */
  readonly gradientColors: string[];

  constructor(options: GradientVMobjectOptions) {
    super();
    this.gradient = options.gradient;
    this.gradientColors = gradientColorList(options.gradient);
    this.setColor(options.strokeColor ?? WHITE);
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    const firstStop = options.gradient.stops[0];
    if (firstStop) {
      this.fillColor = firstStop.color;
    }
    this.setFillGradient({
      type: options.gradient.type,
      stops: options.gradient.stops.map((stop) => ({ offset: stop.offset, color: stop.color })),
    });
    this.fillOpacity = options.fillOpacity ?? 0.5;
    this.setPoints3D(options.points3D);
  }

  override copy(): GradientVMobject {
    const clone = new GradientVMobject({
      gradient: this.gradient,
      points3D: [],
      strokeColor: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
