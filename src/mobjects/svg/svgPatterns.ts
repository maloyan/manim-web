/**
 * SVG `<pattern>` fill support for SVGMobject (best-manim enhancement).
 *
 * Parses `<pattern>` definitions into a plain data model, resolves
 * `fill="url(#id)"` references, rasterizes the pattern tile to a canvas, and
 * builds a {@link PatternVMobject} whose fill exposes a repeating
 * {@link THREE.CanvasTexture} (`wrapS`/`wrapT` = `RepeatWrapping`).
 *
 * This mirrors the gradient design ({@link ./svgGradients}): the shape stays a
 * VMobject with a flat-fill approximation so the single-fill render path is
 * unchanged, and the repeating texture is exposed additively on the mobject for
 * texture-aware consumers. The tile raster reuses the same `THREE.CanvasTexture`
 * mechanism as {@link ImageMobject}.
 *
 * Scope: the tile may hold simple shapes (`rect`, `circle`, `ellipse`,
 * `polygon`, `path`) and `<image>` elements. Unsupported or empty tiles fall
 * back to a solid approximation or no fill rather than throwing.
 */

import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { logger } from '../../utils/logger';

/** SVG coordinate system for a pattern's tile box or its content. */
export type SvgPatternUnits = 'userSpaceOnUse' | 'objectBoundingBox';

/** Parsed SVG `<pattern>` definition. */
export interface SvgPattern {
  /** The pattern `id` used by `url(#id)` references. */
  id: string;
  /** Coordinate system of `width`/`height` (default `objectBoundingBox`). */
  patternUnits: SvgPatternUnits;
  /** Coordinate system of the tile content (default `userSpaceOnUse`). */
  patternContentUnits: SvgPatternUnits;
  /** Tile width in the `patternUnits` system. */
  width: number;
  /** Tile height in the `patternUnits` system. */
  height: number;
  /** Drawable child elements of the tile, in document order. */
  content: Element[];
}

/** Nominal tile size (px) used when `patternUnits` is `objectBoundingBox`. */
const OBJECT_BOUNDING_BOX_TILE = 256;

/** Parse a units attribute, falling back to the given default. */
function parseUnits(raw: string | null, fallback: SvgPatternUnits): SvgPatternUnits {
  return raw === 'userSpaceOnUse' || raw === 'objectBoundingBox' ? raw : fallback;
}

/** Parse a numeric length attribute, dropping a trailing `%`. Default 0. */
function parseLength(raw: string | null): number {
  if (!raw) return 0;
  const value = parseFloat(raw);
  return Number.isNaN(value) ? 0 : value;
}

/**
 * Collect every `<pattern>` definition in an SVG, keyed by its `id`.
 *
 * A pattern without an `id` or without drawable content children is skipped,
 * mirroring how a stop-less gradient is skipped.
 *
 * @param svg - The parsed `<svg>` root element.
 * @returns A map from pattern id to its parsed definition.
 */
export function parsePatternDefs(svg: Element): Map<string, SvgPattern> {
  const defs = new Map<string, SvgPattern>();
  for (const node of svg.querySelectorAll('pattern')) {
    const id = node.getAttribute('id');
    if (!id) continue;
    const content = Array.from(node.children);
    if (content.length === 0) continue;
    defs.set(id, {
      id,
      patternUnits: parseUnits(node.getAttribute('patternUnits'), 'objectBoundingBox'),
      patternContentUnits: parseUnits(node.getAttribute('patternContentUnits'), 'userSpaceOnUse'),
      width: parseLength(node.getAttribute('width')),
      height: parseLength(node.getAttribute('height')),
      content,
    });
  }
  return defs;
}

/**
 * Resolve a `fill="url(#id)"` reference to its pattern definition.
 *
 * @param fillAttr - The raw fill attribute value.
 * @param defs - Pattern definitions from {@link parsePatternDefs}.
 * @returns The matching pattern, or undefined when the fill is not a pattern
 *   reference or the id is unknown.
 */
export function resolvePatternFill(
  fillAttr: string | null | undefined,
  defs: Map<string, SvgPattern>,
): SvgPattern | undefined {
  if (!fillAttr) return undefined;
  const match = /url\(\s*['"]?#([^'")\s]+)['"]?\s*\)/.exec(fillAttr);
  if (!match) return undefined;
  return defs.get(match[1]);
}

/** Read a shape's solid fill color, or undefined when none/`none`/a reference. */
function readSolidFill(el: Element): string | undefined {
  const fill = el.getAttribute('fill');
  if (!fill || fill === 'none' || fill.trim().startsWith('url(')) return undefined;
  return fill;
}

/** Read an `<image>` href (SVG2 `href`, then legacy `xlink:href`). */
function readImageHref(el: Element): string | null {
  return (
    el.getAttribute('href') ??
    el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ??
    el.getAttribute('xlink:href')
  );
}

/** Result of rasterizing a pattern tile. */
interface RasterizedTile {
  /** The repeating tile texture. */
  texture: THREE.CanvasTexture;
  /** First solid fill color found in the tile, for the flat approximation. */
  flatColor?: string;
}

/**
 * Draw one supported tile child onto the 2D context.
 *
 * @param ctx - The tile canvas context.
 * @param el - The child element to draw.
 * @param scale - Factor mapping content coordinates to canvas pixels.
 * @returns true when the element produced drawable output.
 */
function drawTileChild(ctx: CanvasRenderingContext2D, el: Element, scale: number): boolean {
  const tag = el.tagName.toLowerCase();
  const fill = readSolidFill(el);
  if (fill) ctx.fillStyle = fill;

  switch (tag) {
    case 'rect': {
      ctx.fillRect(
        parseLength(el.getAttribute('x')) * scale,
        parseLength(el.getAttribute('y')) * scale,
        parseLength(el.getAttribute('width')) * scale,
        parseLength(el.getAttribute('height')) * scale,
      );
      return true;
    }
    case 'circle': {
      const r = parseLength(el.getAttribute('r'));
      if (r <= 0) return false;
      ctx.beginPath();
      ctx.arc(
        parseLength(el.getAttribute('cx')) * scale,
        parseLength(el.getAttribute('cy')) * scale,
        r * scale,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      return true;
    }
    case 'ellipse': {
      const rx = parseLength(el.getAttribute('rx'));
      const ry = parseLength(el.getAttribute('ry'));
      if (rx <= 0 || ry <= 0) return false;
      ctx.beginPath();
      ctx.ellipse(
        parseLength(el.getAttribute('cx')) * scale,
        parseLength(el.getAttribute('cy')) * scale,
        rx * scale,
        ry * scale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      return true;
    }
    case 'polygon':
    case 'polyline': {
      const coords = (el.getAttribute('points') ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(parseFloat)
        .filter((n) => !Number.isNaN(n));
      if (coords.length < 4) return false;
      ctx.beginPath();
      ctx.moveTo(coords[0] * scale, coords[1] * scale);
      for (let i = 2; i < coords.length - 1; i += 2) {
        ctx.lineTo(coords[i] * scale, coords[i + 1] * scale);
      }
      ctx.closePath();
      ctx.fill();
      return true;
    }
    case 'path': {
      const d = el.getAttribute('d');
      if (!d || typeof Path2D === 'undefined') return false;
      const path = new Path2D(d);
      ctx.save();
      ctx.scale(scale, scale);
      ctx.fill(path);
      ctx.restore();
      return true;
    }
    case 'image': {
      const href = readImageHref(el);
      if (!href) return false;
      return drawTileImage(ctx, el, href, scale);
    }
    default:
      return false;
  }
}

/**
 * Draw an `<image>` tile child. The browser decodes images asynchronously, so
 * the draw completes on load and marks the texture for a GPU re-upload, the same
 * way {@link ImageMobject} refreshes a canvas texture.
 */
function drawTileImage(
  ctx: CanvasRenderingContext2D,
  el: Element,
  href: string,
  scale: number,
): boolean {
  if (typeof Image === 'undefined') return false;
  const x = parseLength(el.getAttribute('x')) * scale;
  const y = parseLength(el.getAttribute('y')) * scale;
  const w = parseLength(el.getAttribute('width')) * scale;
  const h = parseLength(el.getAttribute('height')) * scale;
  const img = new Image();
  img.onload = () => {
    try {
      if (w > 0 && h > 0) ctx.drawImage(img, x, y, w, h);
      else ctx.drawImage(img, x, y);
    } catch (error) {
      logger.warn(`SVGMobject: pattern image draw failed: ${String(error)}`);
    }
  };
  img.src = href;
  return true;
}

/** Tile dimensions in canvas pixels for the given pattern. */
function tilePixelSize(pattern: SvgPattern): { w: number; h: number } {
  const toPx = (v: number): number =>
    pattern.patternUnits === 'objectBoundingBox' && v <= 1 ? v * OBJECT_BOUNDING_BOX_TILE : v;
  return {
    w: Math.max(1, Math.round(toPx(pattern.width))),
    h: Math.max(1, Math.round(toPx(pattern.height))),
  };
}

/**
 * Rasterize a pattern tile to a repeating canvas texture.
 *
 * @param pattern - The pattern definition to render.
 * @returns The texture and flat approximation color, or undefined when the tile
 *   has no drawable content or no 2D context is available.
 */
function rasterizePatternTile(pattern: SvgPattern): RasterizedTile | undefined {
  const { w, h } = tilePixelSize(pattern);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const contentScale = pattern.patternContentUnits === 'objectBoundingBox' ? w : 1;
  let drewSomething = false;
  let flatColor: string | undefined;
  for (const child of pattern.content) {
    if (flatColor === undefined) flatColor = readSolidFill(child);
    if (drawTileChild(ctx, child, contentScale)) drewSomething = true;
  }
  if (!drewSomething) return undefined;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, flatColor };
}

/** Options for {@link PatternVMobject}. */
export interface PatternVMobjectOptions {
  /** The resolved pattern applied as this object's fill. */
  pattern: SvgPattern;
  /** Bezier control points in 3D. */
  points3D: [number, number, number][];
  /** Stroke color (default WHITE). */
  strokeColor?: string;
  /** Stroke width (default DEFAULT_STROKE_WIDTH). */
  strokeWidth?: number;
  /** Fill opacity when the pattern renders a fill (default 0.5). */
  fillOpacity?: number;
}

/**
 * A VMobject whose fill comes from an SVG `<pattern>`.
 *
 * The flat `fillColor` is the first solid color in the tile, so the shape still
 * renders in the single-fill pipeline. {@link patternTexture} holds the
 * repeating tile texture (`RepeatWrapping`, repeat count derived from the shape
 * size over the tile size) for texture-aware consumers, and {@link pattern}
 * keeps the parsed definition. When the tile has no drawable content the texture
 * is null and the fill falls back to the solid color or to no fill.
 */
export class PatternVMobject extends VMobject {
  /** The parsed pattern definition applied as fill. */
  readonly pattern: SvgPattern;
  /** The repeating tile texture, or null when the tile is not renderable. */
  readonly patternTexture: THREE.CanvasTexture | null;

  constructor(options: PatternVMobjectOptions) {
    super();
    this.pattern = options.pattern;
    this.setColor(options.strokeColor ?? WHITE);
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;

    const raster = rasterizePatternTile(options.pattern);
    this.patternTexture = raster?.texture ?? null;

    const flatColor = raster?.flatColor;
    if (this.patternTexture || flatColor) {
      if (flatColor) this.fillColor = flatColor;
      this.fillOpacity = options.fillOpacity ?? 0.5;
    } else {
      this.fillOpacity = 0;
    }

    this.setPoints3D(options.points3D);
    this._applyRepeatFromPoints(options.points3D);
  }

  /** Set the texture repeat from the shape span over the tile size. */
  private _applyRepeatFromPoints(points3D: [number, number, number][]): void {
    if (!this.patternTexture || points3D.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of points3D) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const { w, h } = tilePixelSize(this.pattern);
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    this.patternTexture.repeat.set(spanX > 0 ? spanX / w : 1, spanY > 0 ? spanY / h : 1);
  }

  override copy(): PatternVMobject {
    const clone = new PatternVMobject({
      pattern: this.pattern,
      points3D: [],
      strokeColor: this.color,
      strokeWidth: this.strokeWidth,
      fillOpacity: this.fillOpacity,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
