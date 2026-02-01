/**
 * SVG Path Parser for MathJax SVG output -> VMobject conversion.
 *
 * MathJax SVG output contains `<path>` elements with `d` attributes.
 * This module parses those path data strings into arrays of cubic Bezier
 * control points and assembles them into VMobject / VGroup hierarchies
 * that can be animated with manim-js.
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
    const args = raw.length > 0
      ? raw.split(/[\s,]+/).filter(Boolean).map(Number)
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
          let c1x = args[i], c1y = args[i + 1];
          let c2x = args[i + 2], c2y = args[i + 3];
          let ex = args[i + 4], ey = args[i + 5];
          if (rel) {
            c1x += cx; c1y += cy;
            c2x += cx; c2y += cy;
            ex += cx; ey += cy;
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
          let c1x = cx, c1y = cy;
          if (prevCmd === 'C' || prevCmd === 'S') {
            c1x = 2 * cx - lastCtrlX;
            c1y = 2 * cy - lastCtrlY;
          }
          let c2x = args[i], c2y = args[i + 1];
          let ex = args[i + 2], ey = args[i + 3];
          if (rel) {
            c2x += cx; c2y += cy;
            ex += cx; ey += cy;
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
          let qx = args[i], qy = args[i + 1];
          let ex = args[i + 2], ey = args[i + 3];
          if (rel) {
            qx += cx; qy += cy;
            ex += cx; ey += cy;
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
          let qx = cx, qy = cy;
          if (prevCmd === 'Q' || prevCmd === 'T') {
            qx = 2 * cx - lastCtrlX;
            qy = 2 * cy - lastCtrlY;
          }
          let ex = args[i], ey = args[i + 1];
          if (rel) {
            ex += cx; ey += cy;
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
          const phi = args[i + 2] * Math.PI / 180;
          const fa = args[i + 3];
          const fs = args[i + 4];
          let ex = args[i + 5], ey = args[i + 6];
          if (rel) { ex += cx; ey += cy; }
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
  const c2x = x0 + (x1 - x0) * 2 / 3;
  const c2y = y0 + (y1 - y0) * 2 / 3;
  path.push([c1x, c1y], [c2x, c2y], [x1, y1]);
}

/**
 * Convert an SVG arc to cubic Bezier segments.
 * Returns an array of Vec2 points (handle1, handle2, endpoint triples).
 */
function arcToCubicBezier(
  x1: number, y1: number,
  x2: number, y2: number,
  _rx: number, _ry: number,
  phi: number, fa: number, fs: number,
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
  const cxp = coef * rx * y1p / ry;
  const cyp = -coef * ry * x1p / rx;

  const cxOrig = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cyOrig = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = vecAngle(
    (x1p - cxp) / rx, (y1p - cyp) / ry,
    (-x1p - cxp) / rx, (-y1p - cyp) / ry,
  );
  if (fs === 0 && dtheta > 0) dtheta -= 2 * Math.PI;
  if (fs === 1 && dtheta < 0) dtheta += 2 * Math.PI;

  const numSeg = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
  const segAngle = dtheta / numSeg;

  for (let i = 0; i < numSeg; i++) {
    const sa = theta1 + i * segAngle;
    const ea = sa + segAngle;
    const alpha = Math.sin(segAngle) * (Math.sqrt(4 + 3 * Math.tan(segAngle / 2) ** 2) - 1) / 3;

    const cos1 = Math.cos(sa), sin1 = Math.sin(sa);
    const cos2 = Math.cos(ea), sin2 = Math.sin(ea);

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

/**
 * Walk an SVG element tree (as produced by MathJax) and convert every
 * `<path>` element into a VMobject.  Returns a VGroup containing one
 * VMobject child per glyph / path element.
 *
 * Handles MathJax SVG specifics:
 * - `<defs>` blocks with glyph definitions referenced via `<use>`
 * - Nested `<g>` transforms
 * - `viewBox` → coordinate mapping
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

  // Convert the SVG coordinate system: MathJax uses large integer units
  // (typically 1000-unit em-square). We scale down to manim world units.
  const viewBox = svgElement.getAttribute?.('viewBox');
  let vbScale = 1;
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    // Use the width to determine a reasonable scale
    const vbWidth = parts[2] || 1000;
    // Map the viewBox to roughly ems (MathJax uses ~1000 units per em)
    vbScale = 1 / vbWidth;
  }

  const worldScale = scaleFactor * vbScale;

  function walkElement(el: Element, tx: number, ty: number): void {
    const tag = el.tagName.toLowerCase();

    // Skip <defs> — we collected them above
    if (tag === 'defs') return;

    // Handle <g> transform
    let localTx = tx;
    let localTy = ty;
    const transform = el.getAttribute('transform');
    if (transform) {
      const translate = transform.match(/translate\s*\(\s*([^,\s]+)[\s,]+([^)]+)\)/);
      if (translate) {
        localTx += parseFloat(translate[1]) || 0;
        localTy += parseFloat(translate[2]) || 0;
      }
    }

    if (tag === 'path') {
      const d = el.getAttribute('d');
      if (d) {
        const vmob = pathDataToVMobject(d, localTx, localTy, worldScale, flipY, color, strokeWidth, fillOpacity);
        if (vmob) group.add(vmob);
      }
    } else if (tag === 'use') {
      // Resolve <use xlink:href="#id"> or <use href="#id">
      const href = el.getAttribute('xlink:href') || el.getAttribute('href') || '';
      const id = href.replace(/^#/, '');
      const d = defs.get(id);

      // <use> elements can have their own x/y offsets
      const useX = parseFloat(el.getAttribute('x') || '0');
      const useY = parseFloat(el.getAttribute('y') || '0');

      if (d) {
        const vmob = pathDataToVMobject(
          d,
          localTx + useX,
          localTy + useY,
          worldScale,
          flipY,
          color,
          strokeWidth,
          fillOpacity,
        );
        if (vmob) group.add(vmob);
      }
    } else if (tag === 'rect') {
      const rx = parseFloat(el.getAttribute('x') || '0');
      const ry = parseFloat(el.getAttribute('y') || '0');
      const rw = parseFloat(el.getAttribute('width') || '0');
      const rh = parseFloat(el.getAttribute('height') || '0');
      if (rw > 0 && rh > 0) {
        const d = `M${rx},${ry} L${rx + rw},${ry} L${rx + rw},${ry + rh} L${rx},${ry + rh} Z`;
        const vmob = pathDataToVMobject(d, localTx, localTy, worldScale, flipY, color, strokeWidth, fillOpacity);
        if (vmob) group.add(vmob);
      }
    }

    // Recurse into children
    for (const child of el.children) {
      walkElement(child, localTx, localTy);
    }
  }

  walkElement(svgElement, 0, 0);

  return group;
}

/**
 * Convert SVG path data string into a single VMobject (or null if empty).
 * Applies translation, scale, and optional Y-flip.
 */
function pathDataToVMobject(
  d: string,
  tx: number,
  ty: number,
  scale: number,
  flipY: boolean,
  color: string,
  strokeWidth: number,
  fillOpacity: number,
): VMobject | null {
  const subPaths = parseSVGPathData(d);
  if (subPaths.length === 0) return null;

  // Merge all sub-paths into a single points array.
  // (MathJax glyph paths are usually a single closed contour.)
  const allPoints: Vec3[] = [];

  for (const sp of subPaths) {
    for (const [px, py] of sp) {
      const x = (px + tx) * scale;
      const y = flipY ? -(py + ty) * scale : (py + ty) * scale;
      allPoints.push([x, y, 0]);
    }
  }

  if (allPoints.length < 2) return null;

  const vmob = new VMobject();
  vmob.setColor(color);
  vmob.strokeWidth = strokeWidth;
  vmob.fillOpacity = fillOpacity;
  vmob.setPoints3D(allPoints);

  return vmob;
}
