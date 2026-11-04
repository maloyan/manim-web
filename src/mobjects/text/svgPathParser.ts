/**
 * SVG Path Parser for MathJax SVG output -> VMobject conversion.
 *
 * MathJax SVG output contains `<path>` elements with `d` attributes.
 * This module parses those path data strings into arrays of cubic Bezier
 * control points and assembles them into VMobject / VGroup hierarchies
 * that can be animated with manim-web.
 *
 * The parser handles all SVG path commands:
 *   M/m  L/l  H/h  V/v  C/c  S/s  Q/q  T/t  A/a  Z/z
 *
 * All output is normalised to cubic Bezier segments:
 *   [anchor, handle1, handle2, anchor, ...]
 */

import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A 2-tuple used internally during parsing. */
type Vec2 = [number, number];

/** A 3-tuple used as VMobject control points. */
type Vec3 = [number, number, number];

export interface SVGToVMobjectOptions {
  /** Stroke / fill color for the resulting VMobjects. */
  color?: string;
  /** Stroke width. Default: DEFAULT_STROKE_WIDTH (4). */
  strokeWidth?: number;
  /** Fill opacity. Default: 0 (stroke only). */
  fillOpacity?: number;
  /** Uniform scale factor applied to every point. Default: 1 */
  scale?: number;
  /**
   * If true, flip the Y axis so SVG screen-space (Y-down) maps
   * to manim world-space (Y-up). Default: true.
   */
  flipY?: boolean;
}

// ---------------------------------------------------------------------------
// SVG path tokenizer
// ---------------------------------------------------------------------------

/**
 * Tokenize an SVG path `d` attribute into (command, args[]) pairs.
 */
function tokenizePath(d: string): Array<{ cmd: string; args: number[] }> {
  const tokens: Array<{ cmd: string; args: number[] }> = [];
  // Split on command letters, keeping the letter
  const segments = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
  if (!segments) return tokens;

  for (const seg of segments) {
    const cmd = seg[0];
    const raw = seg.slice(1).trim();
    const args =
      raw.length > 0
        ? raw
            .replace(/([0-9])-([0-9])/g, '$1 -$2')
            .split(/[\s,]+/)
            .filter(Boolean)
            .map(Number)
        : [];
    tokens.push({ cmd, args });
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Core path parser
// ---------------------------------------------------------------------------

/**
 * Parse an SVG path `d` attribute into arrays of cubic Bezier control points.
 * Each sub-path (started by M/m or interrupted by Z/z) produces a separate array.
 *
 * Returns an array of sub-paths, where each sub-path is an array of Vec2 points
 * laid out as: [anchor, handle1, handle2, anchor, handle3, handle4, anchor, ...].
 */
export function parseSVGPathData(d: string): Vec2[][] {
  const subPaths: Vec2[][] = [];
  let currentPath: Vec2[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCtrlX = 0;
  let lastCtrlY = 0;
  let prevCmd = '';

  const tokens = tokenizePath(d);

  for (const { cmd, args } of tokens) {
    const rel = cmd === cmd.toLowerCase();
    const uc = cmd.toUpperCase();

    switch (uc) {
      case 'M': {
        // MoveTo -- starts a new sub-path
        if (currentPath.length > 0) {
          subPaths.push(currentPath);
          currentPath = [];
        }
        for (let i = 0; i < args.length; i += 2) {
          const x = rel ? cx + args[i] : args[i];
          const y = rel ? cy + args[i + 1] : args[i + 1];
          if (i === 0) {
            startX = x;
            startY = y;
            currentPath.push([x, y]);
          } else {
            // Subsequent coordinate pairs after M are implicit LineTo
            pushLineTo(currentPath, cx, cy, x, y);
          }
          cx = x;
          cy = y;
        }
        prevCmd = 'M';
        break;
      }

      case 'L': {
        for (let i = 0; i < args.length; i += 2) {
          const x = rel ? cx + args[i] : args[i];
          const y = rel ? cy + args[i + 1] : args[i + 1];
          pushLineTo(currentPath, cx, cy, x, y);
          cx = x;
          cy = y;
        }
        prevCmd = 'L';
        break;
      }

      case 'H': {
        for (const a of args) {
          const x = rel ? cx + a : a;
          pushLineTo(currentPath, cx, cy, x, cy);
          cx = x;
        }
        prevCmd = 'H';
        break;
      }

      case 'V': {
        for (const a of args) {
          const y = rel ? cy + a : a;
          pushLineTo(currentPath, cx, cy, cx, y);
          cy = y;
        }
        prevCmd = 'V';
        break;
      }

      case 'C': {
        for (let i = 0; i < args.length; i += 6) {
          let c1x = args[i],
            c1y = args[i + 1];
          let c2x = args[i + 2],
            c2y = args[i + 3];
          let ex = args[i + 4],
            ey = args[i + 5];
          if (rel) {
            c1x += cx;
            c1y += cy;
            c2x += cx;
            c2y += cy;
            ex += cx;
            ey += cy;
          }
          currentPath.push([c1x, c1y], [c2x, c2y], [ex, ey]);
          lastCtrlX = c2x;
          lastCtrlY = c2y;
          cx = ex;
          cy = ey;
        }
        prevCmd = 'C';
        break;
      }

      case 'S': {
        for (let i = 0; i < args.length; i += 4) {
          // Reflected control point
          let c1x = cx,
            c1y = cy;
          if (prevCmd === 'C' || prevCmd === 'S') {
            c1x = 2 * cx - lastCtrlX;
            c1y = 2 * cy - lastCtrlY;
          }
          let c2x = args[i],
            c2y = args[i + 1];
          let ex = args[i + 2],
            ey = args[i + 3];
          if (rel) {
            c2x += cx;
            c2y += cy;
            ex += cx;
            ey += cy;
          }
          currentPath.push([c1x, c1y], [c2x, c2y], [ex, ey]);
          lastCtrlX = c2x;
          lastCtrlY = c2y;
          cx = ex;
          cy = ey;
          prevCmd = 'S';
        }
        break;
      }

      case 'Q': {
        for (let i = 0; i < args.length; i += 4) {
          let qx = args[i],
            qy = args[i + 1];
          let ex = args[i + 2],
            ey = args[i + 3];
          if (rel) {
            qx += cx;
            qy += cy;
            ex += cx;
            ey += cy;
          }
          // Elevate quadratic to cubic
          const c1x = cx + (2 / 3) * (qx - cx);
          const c1y = cy + (2 / 3) * (qy - cy);
          const c2x = ex + (2 / 3) * (qx - ex);
          const c2y = ey + (2 / 3) * (qy - ey);
          currentPath.push([c1x, c1y], [c2x, c2y], [ex, ey]);
          lastCtrlX = qx;
          lastCtrlY = qy;
          cx = ex;
          cy = ey;
        }
        prevCmd = 'Q';
        break;
      }

      case 'T': {
        for (let i = 0; i < args.length; i += 2) {
          let qx = cx,
            qy = cy;
          if (prevCmd === 'Q' || prevCmd === 'T') {
            qx = 2 * cx - lastCtrlX;
            qy = 2 * cy - lastCtrlY;
          }
          let ex = args[i],
            ey = args[i + 1];
          if (rel) {
            ex += cx;
            ey += cy;
          }
          const c1x = cx + (2 / 3) * (qx - cx);
          const c1y = cy + (2 / 3) * (qy - cy);
          const c2x = ex + (2 / 3) * (qx - ex);
          const c2y = ey + (2 / 3) * (qy - ey);
          currentPath.push([c1x, c1y], [c2x, c2y], [ex, ey]);
          lastCtrlX = qx;
          lastCtrlY = qy;
          cx = ex;
          cy = ey;
          prevCmd = 'T';
        }
        break;
      }

      case 'A': {
        for (let i = 0; i < args.length; i += 7) {
          const rx = args[i];
          const ry = args[i + 1];
          const phi = (args[i + 2] * Math.PI) / 180;
          const fa = args[i + 3];
          const fs = args[i + 4];
          let ex = args[i + 5],
            ey = args[i + 6];
          if (rel) {
            ex += cx;
            ey += cy;
          }
          const arcPts = arcToCubicBezier(cx, cy, ex, ey, rx, ry, phi, fa, fs);
          for (const pt of arcPts) {
            currentPath.push(pt);
          }
          cx = ex;
          cy = ey;
        }
        prevCmd = 'A';
        break;
      }

      case 'Z': {
        // Close path
        if (cx !== startX || cy !== startY) {
          pushLineTo(currentPath, cx, cy, startX, startY);
        }
        cx = startX;
        cy = startY;
        prevCmd = 'Z';
        break;
      }
    }
  }

  if (currentPath.length > 0) {
    subPaths.push(currentPath);
  }

  return subPaths;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Push a cubic Bezier that represents a straight line segment. */
function pushLineTo(path: Vec2[], x0: number, y0: number, x1: number, y1: number): void {
  const c1x = x0 + (x1 - x0) / 3;
  const c1y = y0 + (y1 - y0) / 3;
  const c2x = x0 + ((x1 - x0) * 2) / 3;
  const c2y = y0 + ((y1 - y0) * 2) / 3;
  path.push([c1x, c1y], [c2x, c2y], [x1, y1]);
}

/**
 * Convert an SVG arc to cubic Bezier segments.
 * Returns an array of Vec2 points (handle1, handle2, endpoint triples).
 */
function arcToCubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  _rx: number,
  _ry: number,
  phi: number,
  fa: number,
  fs: number,
): Vec2[] {
  let rx = Math.abs(_rx);
  let ry = Math.abs(_ry);
  const result: Vec2[] = [];

  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) {
    // Degenerate -> straight line
    pushLineTo(result, x1, y1, x2, y2);
    return result;
  }

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const sign = fa === fs ? -1 : 1;
  const denom = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const sq = Math.max(0, (rx * rx * ry * ry - denom) / denom);
  const coef = sign * Math.sqrt(sq);
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;

  const cxOrig = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cyOrig = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = vecAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (fs === 0 && dtheta > 0) dtheta -= 2 * Math.PI;
  if (fs === 1 && dtheta < 0) dtheta += 2 * Math.PI;

  const numSeg = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
  const segAngle = dtheta / numSeg;

  for (let i = 0; i < numSeg; i++) {
    const sa = theta1 + i * segAngle;
    const ea = sa + segAngle;
    const alpha = (Math.sin(segAngle) * (Math.sqrt(4 + 3 * Math.tan(segAngle / 2) ** 2) - 1)) / 3;

    const cos1 = Math.cos(sa),
      sin1 = Math.sin(sa);
    const cos2 = Math.cos(ea),
      sin2 = Math.sin(ea);

    const p1x = cxOrig + rx * cosPhi * cos1 - ry * sinPhi * sin1;
    const p1y = cyOrig + rx * sinPhi * cos1 + ry * cosPhi * sin1;
    const p2x = cxOrig + rx * cosPhi * cos2 - ry * sinPhi * sin2;
    const p2y = cyOrig + rx * sinPhi * cos2 + ry * cosPhi * sin2;

    const t1x = -rx * cosPhi * sin1 - ry * sinPhi * cos1;
    const t1y = -rx * sinPhi * sin1 + ry * cosPhi * cos1;
    const t2x = -rx * cosPhi * sin2 - ry * sinPhi * cos2;
    const t2y = -rx * sinPhi * sin2 + ry * cosPhi * cos2;

    const cp1x = p1x + alpha * t1x;
    const cp1y = p1y + alpha * t1y;
    const cp2x = p2x - alpha * t2x;
    const cp2y = p2y - alpha * t2y;

    result.push([cp1x, cp1y], [cp2x, cp2y], [p2x, p2y]);
  }

  return result;
}

function vecAngle(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
  let angle = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
  if (ux * vy - uy * vx < 0) angle = -angle;
  return angle;
}

// ---------------------------------------------------------------------------
// SVG Element -> VMobject conversion
// ---------------------------------------------------------------------------

/** Ancestor `class` tokens of each glyph built by {@link svgToVMobjects}. */
const glyphClasses = new WeakMap<VMobject, readonly string[]>();

/**
 * The `class` tokens on the SVG elements that enclosed this glyph, outermost
 * first. MathJax's `\class{name}{...}` puts `name` on the group around a
 * sub-expression, so every glyph inside it reports `name` here. Nested
 * `\class` groups report all their names.
 *
 * Only glyphs produced by {@link svgToVMobjects} carry classes; any other
 * mobject (including a `copy()` of a glyph) returns an empty array.
 */
export function getGlyphClasses(glyph: VMobject): readonly string[] {
  return glyphClasses.get(glyph) ?? [];
}

/** Axis-aligned box in SVG user units. */
interface SvgBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Accumulated axis-aligned SVG transform: a local point p maps to
 * (tx + sx * p.x, ty + sy * p.y), clamped to `clip`.
 */
interface SvgFrame {
  readonly tx: number;
  readonly ty: number;
  readonly sx: number;
  readonly sy: number;
  /** Viewport of the innermost nested `<svg>`, in mapped coordinates. */
  readonly clip: SvgBox | null;
}

const IDENTITY_FRAME: SvgFrame = { tx: 0, ty: 0, sx: 1, sy: 1, clip: null };

/** `frame` followed by `translate(x, y) scale(sx, sy)`. */
function compose(frame: SvgFrame, x: number, y: number, sx: number, sy: number): SvgFrame {
  return {
    tx: frame.tx + frame.sx * x,
    ty: frame.ty + frame.sy * y,
    sx: frame.sx * sx,
    sy: frame.sy * sy,
    clip: frame.clip,
  };
}

/**
 * Apply the `translate` and `scale` items of a `transform` attribute, left
 * to right. `scale(s)` scales both axes by s; `scale(sx, sy)` scales x by
 * sx and y by sx * |sy / sx|.
 *
 * @note The sign of sy relative to sx is ignored: a y-reflection such as
 * MathJax's root `scale(1,-1)` is not applied, and callers compensate
 * with the `flipY` option (MathJax output is converted with flipY false).
 * Only the stretch (|sy| != |sx|, as in a delimiter extender) is new.
 */
function applyTransformAttribute(frame: SvgFrame, transform: string | null): SvgFrame {
  if (!transform) return frame;
  let result = frame;
  for (const m of transform.matchAll(/(translate|scale)\s*\(([^)]*)\)/g)) {
    const args = m[2]
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (m[1] === 'translate') {
      result = compose(result, args[0] || 0, args[1] || 0, 1, 1);
    } else {
      const sx = args[0] || 1;
      const stretch = args.length > 1 ? Math.abs((args[1] || sx) / sx) : 1;
      result = compose(result, 0, 0, sx, sx * stretch);
    }
  }
  return result;
}

/**
 * Frame for the content of a nested `<svg x y width height viewBox>`: the
 * viewBox maps onto the viewport, and content outside the viewport is
 * clipped.
 *
 * @note MathJax only nests `<svg>` around the rectangular extender of a
 * stretched delimiter or radical, and its viewBox always has the
 * viewport's aspect ratio, so clamping points to the viewport is an exact
 * clip and preserveAspectRatio can be ignored.
 */
function enterViewport(frame: SvgFrame, el: Element): SvgFrame {
  const attr = (name: string) => parseFloat(el.getAttribute(name) ?? '');
  const x = attr('x') || 0;
  const y = attr('y') || 0;
  const width = attr('width');
  const height = attr('height');
  const viewBox = (el.getAttribute('viewBox') ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (!(width > 0 && height > 0) || viewBox.length !== 4 || !(viewBox[2] > 0 && viewBox[3] > 0)) {
    return compose(frame, x, y, 1, 1);
  }
  const [x0, y0] = mapPoint(frame, [x, y]);
  const [x1, y1] = mapPoint(frame, [x + width, y + height]);
  const clip = {
    minX: Math.min(x0, x1),
    maxX: Math.max(x0, x1),
    minY: Math.min(y0, y1),
    maxY: Math.max(y0, y1),
  };
  const sx = width / viewBox[2];
  const sy = height / viewBox[3];
  return { ...compose(frame, x - viewBox[0] * sx, y - viewBox[1] * sy, sx, sy), clip };
}

/** Map a local point through `frame`, clamped to its clip box. */
function mapPoint(frame: SvgFrame, [px, py]: Vec2): Vec2 {
  const x = frame.tx + frame.sx * px;
  const y = frame.ty + frame.sy * py;
  const clip = frame.clip;
  if (!clip) return [x, y];
  return [Math.min(clip.maxX, Math.max(clip.minX, x)), Math.min(clip.maxY, Math.max(clip.minY, y))];
}

/**
 * Walk an SVG element tree (as produced by MathJax) and convert every
 * `<path>` element into a VMobject.  Returns a VGroup containing one
 * VMobject child per glyph / path element.
 *
 * Handles MathJax SVG specifics:
 * - `<defs>` blocks with glyph definitions referenced via `<use>`
 * - Nested `<g>` transforms
 * - `viewBox` → coordinate mapping, including nested `<svg>` viewports
 *   (stretched delimiters), which clip their content
 */
export function svgToVMobjects(
  svgElement: SVGElement | Element,
  options: SVGToVMobjectOptions = {},
): VGroup {
  const {
    color = WHITE,
    strokeWidth = DEFAULT_STROKE_WIDTH,
    fillOpacity = 0,
    scale: scaleFactor = 1,
    flipY = true,
  } = options;

  const group = new VGroup();

  // ------------------------------------------------------------------
  // 1. Collect <defs> glyph paths for <use> references
  // ------------------------------------------------------------------
  const defs = new Map<string, string>(); // id -> d-attribute
  const defElements = svgElement.querySelectorAll('defs path');
  defElements.forEach((el) => {
    const id = el.getAttribute('id');
    const d = el.getAttribute('d');
    if (id && d) defs.set(id, d);
  });

  // ------------------------------------------------------------------
  // 2. Recursively walk the SVG tree
  // ------------------------------------------------------------------

  // Keep renderer units unchanged here. Caller controls world conversion.
  const worldScale = scaleFactor;

  function addGlyph(vmob: VMobject | null, classes: readonly string[]): void {
    if (!vmob) return;
    if (classes.length > 0) glyphClasses.set(vmob, classes);
    group.add(vmob);
  }

  function walkElement(el: Element, parent: SvgFrame, accClasses: readonly string[]): void {
    const tag = el.tagName.toLowerCase();

    // Skip <defs> — we collected them above
    if (tag === 'defs') return;

    // Skip MathJax error elements (merror produces a background rect)
    if (el.getAttribute('data-mml-node') === 'merror') return;

    // Accumulate `class` tokens (from MathJax `\class{...}{...}`) so each
    // glyph knows every tagged group it sits in. Arrays are shared, not
    // copied, until a new class appears.
    const ownClass = el.getAttribute('class');
    const classes = ownClass
      ? [...accClasses, ...ownClass.split(/\s+/).filter(Boolean)]
      : accClasses;

    // A nested <svg> (MathJax uses one to stretch the extender of a tall
    // delimiter or radical) places its own viewport; then the element's
    // transform applies, left to right.
    const viewport = tag === 'svg' && el !== svgElement ? enterViewport(parent, el) : parent;
    const frame = applyTransformAttribute(viewport, el.getAttribute('transform'));
    const toVMobject = (d: string, at: SvgFrame) =>
      pathDataToVMobject(d, at, worldScale, flipY, color, strokeWidth, fillOpacity);

    if (tag === 'path') {
      const d = el.getAttribute('d');
      if (d) addGlyph(toVMobject(d, frame), classes);
    } else if (tag === 'use') {
      // Resolve <use xlink:href="#id"> or <use href="#id">
      const href = el.getAttribute('xlink:href') || el.getAttribute('href') || '';
      const id = href.replace(/^#/, '');
      const d = defs.get(id);

      // <use> elements can have their own x/y offsets (in local coordinate space)
      const useX = parseFloat(el.getAttribute('x') || '0');
      const useY = parseFloat(el.getAttribute('y') || '0');

      if (d) addGlyph(toVMobject(d, compose(frame, useX, useY, 1, 1)), classes);
    } else if (tag === 'rect') {
      const rx = parseFloat(el.getAttribute('x') || '0');
      const ry = parseFloat(el.getAttribute('y') || '0');
      const rw = parseFloat(el.getAttribute('width') || '0');
      const rh = parseFloat(el.getAttribute('height') || '0');
      if (rw > 0 && rh > 0) {
        const d = `M${rx},${ry} L${rx + rw},${ry} L${rx + rw},${ry + rh} L${rx},${ry + rh} Z`;
        addGlyph(toVMobject(d, frame), classes);
      }
    }

    // Recurse into children
    for (const child of el.children) {
      walkElement(child, frame, classes);
    }
  }

  walkElement(svgElement, IDENTITY_FRAME, []);

  return group;
}

/**
 * Convert SVG path data string into a single VMobject (or null if empty).
 * Applies the accumulated SVG frame, world scale, and optional Y-flip.
 *
 * The final position for each path point (px, py) is:
 *   worldX = mapX(px) * worldScale
 *   worldY = ±mapY(py) * worldScale   (sign depends on flipY)
 * where (mapX, mapY) is {@link mapPoint} with `frame`.
 */
function pathDataToVMobject(
  d: string,
  frame: SvgFrame,
  worldScale: number,
  flipY: boolean,
  color: string,
  strokeWidth: number,
  fillOpacity: number,
): VMobject | null {
  const subPaths = parseSVGPathData(d);
  if (subPaths.length === 0) return null;

  // Merge all sub-paths into a single points array, tracking per-sub-path lengths
  // so that compound glyphs (e.g. "0" with outer contour + inner hole) render
  // correctly with even-odd fill and separate strokes.
  const allPoints: Vec3[] = [];
  const subpathLengths: number[] = [];

  for (const sp of subPaths) {
    const startLen = allPoints.length;
    for (const point of sp) {
      const [mx, my] = mapPoint(frame, point);
      allPoints.push([mx * worldScale, (flipY ? -my : my) * worldScale, 0]);
    }
    const count = allPoints.length - startLen;
    if (count > 0) {
      subpathLengths.push(count);
    }
  }

  if (allPoints.length < 2) return null;

  const vmob = new VMobject();
  vmob.setColor(color);
  vmob.strokeWidth = strokeWidth;
  vmob.fillOpacity = fillOpacity;
  vmob.setPoints3D(allPoints);

  // Attach intrinsic subpath metadata for transform pairing.
  // Keep this even for single-contour glyphs (e.g. "1" => [N]) so
  // compound↔simple morphs can still run contour-aware alignment.
  if (subpathLengths.length > 0) {
    vmob.setBaseSubpathLengths(subpathLengths);
  }

  return vmob;
}
