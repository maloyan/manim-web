/**
 * SVGMobject - Parse and display SVG files/strings as VMobjects.
 * Converts SVG paths to Bezier curves that can be animated.
 */

import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';

/** Internal point type for SVG parsing (simple tuple) */
type SVGPoint = [number, number];

/**
 * SVGMobject options
 */
export interface SVGMobjectOptions {
  /** SVG string content */
  svgString?: string;
  /** Stroke color (default: WHITE) */
  color?: string;
  /** Stroke width (default: DEFAULT_STROKE_WIDTH) */
  strokeWidth?: number;
  /** Fill color (optional) */
  fillColor?: string;
  /** Fill opacity (default: 0) */
  fillOpacity?: number;
  /** Scale to fit within this height */
  height?: number;
  /** Scale to fit within this width */
  width?: number;
  /** Center position */
  center?: [number, number, number];
}

/**
 * VMobjectFromSVGPath options
 */
export interface VMobjectFromSVGPathOptions {
  /** SVG path d attribute */
  pathData: string;
  /** Stroke color */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Fill color */
  fillColor?: string;
  /** Fill opacity */
  fillOpacity?: number;
}

/**
 * Parse a single SVG path d attribute into Bezier control points.
 */
function parseSVGPath(d: string): SVGPoint[][] {
  const paths: SVGPoint[][] = [];
  let currentPath: SVGPoint[] = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let lastCommand = '';

  // Tokenize the path
  const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  for (const cmd of commands) {
    const type = cmd[0];
    const args = cmd.slice(1).trim().split(/[\s,]+/).filter(s => s).map(parseFloat);
    const isRelative = type === type.toLowerCase();

    switch (type.toUpperCase()) {
      case 'M': {
        // Move to
        if (currentPath.length > 0) {
          paths.push(currentPath);
          currentPath = [];
        }
        for (let i = 0; i < args.length; i += 2) {
          const x = isRelative ? currentX + args[i] : args[i];
          const y = isRelative ? currentY + args[i + 1] : args[i + 1];
          if (i === 0) {
            startX = x;
            startY = y;
          }
          currentX = x;
          currentY = y;
          currentPath.push([x, -y]); // Flip Y for screen coords
        }
        lastCommand = 'M';
        break;
      }

      case 'L': {
        // Line to - convert to cubic Bezier
        for (let i = 0; i < args.length; i += 2) {
          const x = isRelative ? currentX + args[i] : args[i];
          const y = isRelative ? currentY + args[i + 1] : args[i + 1];

          // Cubic Bezier with control points at 1/3 and 2/3
          const cp1x = currentX + (x - currentX) / 3;
          const cp1y = currentY + (y - currentY) / 3;
          const cp2x = currentX + (x - currentX) * 2 / 3;
          const cp2y = currentY + (y - currentY) * 2 / 3;

          currentPath.push([cp1x, -cp1y]);
          currentPath.push([cp2x, -cp2y]);
          currentPath.push([x, -y]);

          currentX = x;
          currentY = y;
        }
        lastCommand = 'L';
        break;
      }

      case 'H': {
        // Horizontal line
        for (const arg of args) {
          const x = isRelative ? currentX + arg : arg;
          const y = currentY;

          const cp1x = currentX + (x - currentX) / 3;
          const cp2x = currentX + (x - currentX) * 2 / 3;

          currentPath.push([cp1x, -y]);
          currentPath.push([cp2x, -y]);
          currentPath.push([x, -y]);

          currentX = x;
        }
        lastCommand = 'H';
        break;
      }

      case 'V': {
        // Vertical line
        for (const arg of args) {
          const x = currentX;
          const y = isRelative ? currentY + arg : arg;

          const cp1y = currentY + (y - currentY) / 3;
          const cp2y = currentY + (y - currentY) * 2 / 3;

          currentPath.push([x, -cp1y]);
          currentPath.push([x, -cp2y]);
          currentPath.push([x, -y]);

          currentY = y;
        }
        lastCommand = 'V';
        break;
      }

      case 'C': {
        // Cubic Bezier
        for (let i = 0; i < args.length; i += 6) {
          let cp1x = args[i];
          let cp1y = args[i + 1];
          let cp2x = args[i + 2];
          let cp2y = args[i + 3];
          let x = args[i + 4];
          let y = args[i + 5];

          if (isRelative) {
            cp1x += currentX;
            cp1y += currentY;
            cp2x += currentX;
            cp2y += currentY;
            x += currentX;
            y += currentY;
          }

          currentPath.push([cp1x, -cp1y]);
          currentPath.push([cp2x, -cp2y]);
          currentPath.push([x, -y]);

          lastControlX = cp2x;
          lastControlY = cp2y;
          currentX = x;
          currentY = y;
        }
        lastCommand = 'C';
        break;
      }

      case 'S': {
        // Smooth cubic Bezier
        for (let i = 0; i < args.length; i += 4) {
          // Reflect previous control point
          let cp1x = currentX;
          let cp1y = currentY;
          if (lastCommand === 'C' || lastCommand === 'S') {
            cp1x = 2 * currentX - lastControlX;
            cp1y = 2 * currentY - lastControlY;
          }

          let cp2x = args[i];
          let cp2y = args[i + 1];
          let x = args[i + 2];
          let y = args[i + 3];

          if (isRelative) {
            cp2x += currentX;
            cp2y += currentY;
            x += currentX;
            y += currentY;
          }

          currentPath.push([cp1x, -cp1y]);
          currentPath.push([cp2x, -cp2y]);
          currentPath.push([x, -y]);

          lastControlX = cp2x;
          lastControlY = cp2y;
          currentX = x;
          currentY = y;
        }
        lastCommand = 'S';
        break;
      }

      case 'Q': {
        // Quadratic Bezier - convert to cubic
        for (let i = 0; i < args.length; i += 4) {
          let qx = args[i];
          let qy = args[i + 1];
          let x = args[i + 2];
          let y = args[i + 3];

          if (isRelative) {
            qx += currentX;
            qy += currentY;
            x += currentX;
            y += currentY;
          }

          // Convert quadratic to cubic: CP1 = P0 + 2/3*(Q - P0), CP2 = P + 2/3*(Q - P)
          const cp1x = currentX + (2 / 3) * (qx - currentX);
          const cp1y = currentY + (2 / 3) * (qy - currentY);
          const cp2x = x + (2 / 3) * (qx - x);
          const cp2y = y + (2 / 3) * (qy - y);

          currentPath.push([cp1x, -cp1y]);
          currentPath.push([cp2x, -cp2y]);
          currentPath.push([x, -y]);

          lastControlX = qx;
          lastControlY = qy;
          currentX = x;
          currentY = y;
        }
        lastCommand = 'Q';
        break;
      }

      case 'T': {
        // Smooth quadratic Bezier
        for (let i = 0; i < args.length; i += 2) {
          // Reflect previous control point
          let qx = currentX;
          let qy = currentY;
          if (lastCommand === 'Q' || lastCommand === 'T') {
            qx = 2 * currentX - lastControlX;
            qy = 2 * currentY - lastControlY;
          }

          let x = args[i];
          let y = args[i + 1];

          if (isRelative) {
            x += currentX;
            y += currentY;
          }

          const cp1x = currentX + (2 / 3) * (qx - currentX);
          const cp1y = currentY + (2 / 3) * (qy - currentY);
          const cp2x = x + (2 / 3) * (qx - x);
          const cp2y = y + (2 / 3) * (qy - y);

          currentPath.push([cp1x, -cp1y]);
          currentPath.push([cp2x, -cp2y]);
          currentPath.push([x, -y]);

          lastControlX = qx;
          lastControlY = qy;
          currentX = x;
          currentY = y;
        }
        lastCommand = 'T';
        break;
      }

      case 'A': {
        // Arc - approximate with cubic Bezier curves
        for (let i = 0; i < args.length; i += 7) {
          const rx = args[i];
          const ry = args[i + 1];
          const xAxisRotation = args[i + 2] * Math.PI / 180;
          const largeArcFlag = args[i + 3];
          const sweepFlag = args[i + 4];
          let x = args[i + 5];
          let y = args[i + 6];

          if (isRelative) {
            x += currentX;
            y += currentY;
          }

          // Convert arc to Bezier curves
          const arcPoints = arcToBezier(
            currentX, currentY, x, y,
            rx, ry, xAxisRotation, largeArcFlag, sweepFlag
          );

          for (const pt of arcPoints) {
            currentPath.push([pt[0], -pt[1]]);
          }

          currentX = x;
          currentY = y;
        }
        lastCommand = 'A';
        break;
      }

      case 'Z': {
        // Close path - line back to start
        if (currentX !== startX || currentY !== startY) {
          const cp1x = currentX + (startX - currentX) / 3;
          const cp1y = currentY + (startY - currentY) / 3;
          const cp2x = currentX + (startX - currentX) * 2 / 3;
          const cp2y = currentY + (startY - currentY) * 2 / 3;

          currentPath.push([cp1x, -cp1y]);
          currentPath.push([cp2x, -cp2y]);
          currentPath.push([startX, -startY]);
        }
        currentX = startX;
        currentY = startY;
        lastCommand = 'Z';
        break;
      }
    }
  }

  if (currentPath.length > 0) {
    paths.push(currentPath);
  }

  return paths;
}

/**
 * Convert arc parameters to Bezier curves.
 * This is a simplified approximation.
 */
function arcToBezier(
  x1: number, y1: number,
  x2: number, y2: number,
  rx: number, ry: number,
  phi: number,
  largeArc: number,
  sweep: number
): SVGPoint[] {
  const points: SVGPoint[] = [];

  // Handle degenerate cases
  if (rx === 0 || ry === 0 || (x1 === x2 && y1 === y2)) {
    // Straight line
    const cp1x = x1 + (x2 - x1) / 3;
    const cp1y = y1 + (y2 - y1) / 3;
    const cp2x = x1 + (x2 - x1) * 2 / 3;
    const cp2y = y1 + (y2 - y1) * 2 / 3;
    return [[cp1x, cp1y], [cp2x, cp2y], [x2, y2]];
  }

  // Compute center parametrization
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // Step 1: Compute (x1', y1')
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  // Ensure radii are positive and large enough
  rx = Math.abs(rx);
  ry = Math.abs(ry);

  // Check if radii are large enough
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const sqrtLambda = Math.sqrt(lambda);
    rx *= sqrtLambda;
    ry *= sqrtLambda;
  }

  // Step 2: Compute center in rotated coordinates
  const sign = largeArc === sweep ? -1 : 1;
  const sq = Math.max(0,
    (rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p) /
    (rx * rx * y1p * y1p + ry * ry * x1p * x1p)
  );
  const coef = sign * Math.sqrt(sq);
  const cxp = coef * rx * y1p / ry;
  const cyp = -coef * ry * x1p / rx;

  // Step 3: Compute center in original coordinates
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  // Step 4: Compute theta1 and dtheta
  const theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = vectorAngle(
    (x1p - cxp) / rx, (y1p - cyp) / ry,
    (-x1p - cxp) / rx, (-y1p - cyp) / ry
  );

  if (sweep === 0 && dtheta > 0) {
    dtheta -= 2 * Math.PI;
  } else if (sweep === 1 && dtheta < 0) {
    dtheta += 2 * Math.PI;
  }

  // Approximate arc with cubic Bezier curves (one per 90 degrees)
  const numSegments = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
  const segmentAngle = dtheta / numSegments;

  for (let i = 0; i < numSegments; i++) {
    const startAngle = theta1 + i * segmentAngle;
    const endAngle = startAngle + segmentAngle;

    // Bezier approximation for arc segment
    const alpha = Math.sin(segmentAngle) * (Math.sqrt(4 + 3 * Math.tan(segmentAngle / 2) ** 2) - 1) / 3;

    const cos1 = Math.cos(startAngle);
    const sin1 = Math.sin(startAngle);
    const cos2 = Math.cos(endAngle);
    const sin2 = Math.sin(endAngle);

    // Points on ellipse
    const p1x = cx + rx * cosPhi * cos1 - ry * sinPhi * sin1;
    const p1y = cy + rx * sinPhi * cos1 + ry * cosPhi * sin1;
    const p2x = cx + rx * cosPhi * cos2 - ry * sinPhi * sin2;
    const p2y = cy + rx * sinPhi * cos2 + ry * cosPhi * sin2;

    // Tangent vectors
    const t1x = -rx * cosPhi * sin1 - ry * sinPhi * cos1;
    const t1y = -rx * sinPhi * sin1 + ry * cosPhi * cos1;
    const t2x = -rx * cosPhi * sin2 - ry * sinPhi * cos2;
    const t2y = -rx * sinPhi * sin2 + ry * cosPhi * cos2;

    // Control points
    const cp1x = p1x + alpha * t1x;
    const cp1y = p1y + alpha * t1y;
    const cp2x = p2x - alpha * t2x;
    const cp2y = p2y - alpha * t2y;

    points.push([cp1x, cp1y], [cp2x, cp2y], [p2x, p2y]);
  }

  return points;
}

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
  const dot = ux * vx + uy * vy;
  const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
  let angle = Math.acos(Math.max(-1, Math.min(1, dot / len)));
  if (ux * vy - uy * vx < 0) {
    angle = -angle;
  }
  return angle;
}

/**
 * Helper function to create a styled VMobject from points.
 */
function createStyledVMobject(
  points3D: [number, number, number][],
  color: string,
  strokeWidth: number,
  fillColor?: string,
  fillOpacity?: number
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

/**
 * VMobjectFromSVGPath - create a VMobject from a single SVG path d attribute.
 */
export class VMobjectFromSVGPath extends VMobject {
  private _pathData: string;

  constructor(options: VMobjectFromSVGPathOptions) {
    super();

    this._pathData = options.pathData;
    this.setColor(options.color ?? WHITE);
    this.strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    if (options.fillColor) {
      this.fillColor = options.fillColor;
    }
    this.fillOpacity = options.fillOpacity ?? 0;

    const paths = parseSVGPath(options.pathData);

    // Use the first path (for single path)
    if (paths.length > 0 && paths[0].length > 0) {
      // Convert 2D points to 3D
      const points3D: [number, number, number][] = paths[0].map(p => [p[0], p[1], 0]);
      this.setPoints3D(points3D);
    }
  }

  protected _createCopy(): VMobjectFromSVGPath {
    return new VMobjectFromSVGPath({
      pathData: this._pathData,
      color: this.color,
      strokeWidth: this.strokeWidth,
      fillColor: this.fillColor,
      fillOpacity: this.fillOpacity,
    });
  }
}

/**
 * SVGMobject - parse and display SVG content as a group of VMobjects.
 */
export class SVGMobject extends VGroup {
  private _svgString: string;

  constructor(options: SVGMobjectOptions = {}) {
    super();

    this._svgString = options.svgString ?? '';
    const color = options.color ?? WHITE;
    const strokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    const fillColor = options.fillColor;
    const fillOpacity = options.fillOpacity ?? 0;

    if (this._svgString) {
      this._parseSVG(this._svgString, color, strokeWidth, fillColor, fillOpacity);
    }

    // Apply scaling if specified
    if (options.height !== undefined || options.width !== undefined) {
      const bounds = this.getBounds();
      const currentWidth = bounds.max.x - bounds.min.x;
      const currentHeight = bounds.max.y - bounds.min.y;

      let scaleFactor = 1;
      if (options.height !== undefined && currentHeight > 0) {
        scaleFactor = options.height / currentHeight;
      }
      if (options.width !== undefined && currentWidth > 0) {
        const widthScale = options.width / currentWidth;
        scaleFactor = options.height !== undefined
          ? Math.min(scaleFactor, widthScale)
          : widthScale;
      }

      this.scale(scaleFactor);
    }

    // Center if specified
    if (options.center) {
      this.moveTo(options.center);
    }
  }

  private _parseSVG(
    svgString: string,
    defaultColor: string,
    defaultStrokeWidth: number,
    defaultFillColor?: string,
    defaultFillOpacity?: number
  ): void {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) {
      console.warn('SVGMobject: No SVG element found');
      return;
    }

    // Process all path elements
    const paths = svg.querySelectorAll('path');
    for (const pathEl of paths) {
      const d = pathEl.getAttribute('d');
      if (!d) continue;

      // Get styling from element
      const stroke = pathEl.getAttribute('stroke') || defaultColor;
      const fill = pathEl.getAttribute('fill') || defaultFillColor;
      const strokeWidthAttr = pathEl.getAttribute('stroke-width');
      const sw = strokeWidthAttr ? parseFloat(strokeWidthAttr) : defaultStrokeWidth;

      const pathData = parseSVGPath(d);
      for (const points of pathData) {
        if (points.length === 0) continue;

        const points3D: [number, number, number][] = points.map(p => [p[0], p[1], 0]);
        const vmob = createStyledVMobject(
          points3D,
          stroke,
          sw,
          fill !== 'none' ? fill : undefined,
          fill && fill !== 'none' ? (defaultFillOpacity ?? 0.5) : 0
        );
        this.add(vmob);
      }
    }

    // Process rect elements
    const rects = svg.querySelectorAll('rect');
    for (const rectEl of rects) {
      const x = parseFloat(rectEl.getAttribute('x') || '0');
      const y = parseFloat(rectEl.getAttribute('y') || '0');
      const width = parseFloat(rectEl.getAttribute('width') || '0');
      const height = parseFloat(rectEl.getAttribute('height') || '0');

      if (width <= 0 || height <= 0) continue;

      // Create rectangle path
      const d = `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
      const points = parseSVGPath(d);

      for (const pts of points) {
        const points3D: [number, number, number][] = pts.map(p => [p[0], p[1], 0]);
        const vmob = createStyledVMobject(
          points3D,
          rectEl.getAttribute('stroke') || defaultColor,
          parseFloat(rectEl.getAttribute('stroke-width') || String(defaultStrokeWidth)),
          rectEl.getAttribute('fill') !== 'none' ? rectEl.getAttribute('fill') || undefined : undefined,
          rectEl.getAttribute('fill') && rectEl.getAttribute('fill') !== 'none' ? (defaultFillOpacity ?? 0.5) : 0
        );
        this.add(vmob);
      }
    }

    // Process circle elements
    const circles = svg.querySelectorAll('circle');
    for (const circleEl of circles) {
      const cx = parseFloat(circleEl.getAttribute('cx') || '0');
      const cy = parseFloat(circleEl.getAttribute('cy') || '0');
      const r = parseFloat(circleEl.getAttribute('r') || '0');

      if (r <= 0) continue;

      // Create circle path using Bezier approximation
      const kappa = 0.5522847498;
      const d = `M${cx + r},${cy}
        C${cx + r},${cy + kappa * r} ${cx + kappa * r},${cy + r} ${cx},${cy + r}
        C${cx - kappa * r},${cy + r} ${cx - r},${cy + kappa * r} ${cx - r},${cy}
        C${cx - r},${cy - kappa * r} ${cx - kappa * r},${cy - r} ${cx},${cy - r}
        C${cx + kappa * r},${cy - r} ${cx + r},${cy - kappa * r} ${cx + r},${cy}
        Z`;

      const points = parseSVGPath(d);
      for (const pts of points) {
        const points3D: [number, number, number][] = pts.map(p => [p[0], p[1], 0]);
        const vmob = createStyledVMobject(
          points3D,
          circleEl.getAttribute('stroke') || defaultColor,
          parseFloat(circleEl.getAttribute('stroke-width') || String(defaultStrokeWidth)),
          circleEl.getAttribute('fill') !== 'none' ? circleEl.getAttribute('fill') || undefined : undefined,
          circleEl.getAttribute('fill') && circleEl.getAttribute('fill') !== 'none' ? (defaultFillOpacity ?? 0.5) : 0
        );
        this.add(vmob);
      }
    }

    // Process ellipse elements
    const ellipses = svg.querySelectorAll('ellipse');
    for (const ellipseEl of ellipses) {
      const cx = parseFloat(ellipseEl.getAttribute('cx') || '0');
      const cy = parseFloat(ellipseEl.getAttribute('cy') || '0');
      const rx = parseFloat(ellipseEl.getAttribute('rx') || '0');
      const ry = parseFloat(ellipseEl.getAttribute('ry') || '0');

      if (rx <= 0 || ry <= 0) continue;

      // Create ellipse path
      const kappa = 0.5522847498;
      const d = `M${cx + rx},${cy}
        C${cx + rx},${cy + kappa * ry} ${cx + kappa * rx},${cy + ry} ${cx},${cy + ry}
        C${cx - kappa * rx},${cy + ry} ${cx - rx},${cy + kappa * ry} ${cx - rx},${cy}
        C${cx - rx},${cy - kappa * ry} ${cx - kappa * rx},${cy - ry} ${cx},${cy - ry}
        C${cx + kappa * rx},${cy - ry} ${cx + rx},${cy - kappa * ry} ${cx + rx},${cy}
        Z`;

      const points = parseSVGPath(d);
      for (const pts of points) {
        const points3D: [number, number, number][] = pts.map(p => [p[0], p[1], 0]);
        const vmob = createStyledVMobject(
          points3D,
          ellipseEl.getAttribute('stroke') || defaultColor,
          parseFloat(ellipseEl.getAttribute('stroke-width') || String(defaultStrokeWidth))
        );
        this.add(vmob);
      }
    }

    // Process line elements
    const lines = svg.querySelectorAll('line');
    for (const lineEl of lines) {
      const x1 = parseFloat(lineEl.getAttribute('x1') || '0');
      const y1 = parseFloat(lineEl.getAttribute('y1') || '0');
      const x2 = parseFloat(lineEl.getAttribute('x2') || '0');
      const y2 = parseFloat(lineEl.getAttribute('y2') || '0');

      const d = `M${x1},${y1} L${x2},${y2}`;
      const points = parseSVGPath(d);

      for (const pts of points) {
        const points3D: [number, number, number][] = pts.map(p => [p[0], p[1], 0]);
        const vmob = createStyledVMobject(
          points3D,
          lineEl.getAttribute('stroke') || defaultColor,
          parseFloat(lineEl.getAttribute('stroke-width') || String(defaultStrokeWidth))
        );
        this.add(vmob);
      }
    }

    // Process polygon elements
    const polygons = svg.querySelectorAll('polygon');
    for (const polygonEl of polygons) {
      const pointsAttr = polygonEl.getAttribute('points');
      if (!pointsAttr) continue;

      const coords = pointsAttr.trim().split(/[\s,]+/).map(parseFloat);
      if (coords.length < 4) continue;

      let d = `M${coords[0]},${coords[1]}`;
      for (let i = 2; i < coords.length; i += 2) {
        d += ` L${coords[i]},${coords[i + 1]}`;
      }
      d += ' Z';

      const points = parseSVGPath(d);
      for (const pts of points) {
        const points3D: [number, number, number][] = pts.map(p => [p[0], p[1], 0]);
        const vmob = createStyledVMobject(
          points3D,
          polygonEl.getAttribute('stroke') || defaultColor,
          parseFloat(polygonEl.getAttribute('stroke-width') || String(defaultStrokeWidth)),
          polygonEl.getAttribute('fill') !== 'none' ? polygonEl.getAttribute('fill') || undefined : undefined,
          polygonEl.getAttribute('fill') && polygonEl.getAttribute('fill') !== 'none' ? (defaultFillOpacity ?? 0.5) : 0
        );
        this.add(vmob);
      }
    }

    // Process polyline elements
    const polylines = svg.querySelectorAll('polyline');
    for (const polylineEl of polylines) {
      const pointsAttr = polylineEl.getAttribute('points');
      if (!pointsAttr) continue;

      const coords = pointsAttr.trim().split(/[\s,]+/).map(parseFloat);
      if (coords.length < 4) continue;

      let d = `M${coords[0]},${coords[1]}`;
      for (let i = 2; i < coords.length; i += 2) {
        d += ` L${coords[i]},${coords[i + 1]}`;
      }

      const points = parseSVGPath(d);
      for (const pts of points) {
        const points3D: [number, number, number][] = pts.map(p => [p[0], p[1], 0]);
        const vmob = createStyledVMobject(
          points3D,
          polylineEl.getAttribute('stroke') || defaultColor,
          parseFloat(polylineEl.getAttribute('stroke-width') || String(defaultStrokeWidth))
        );
        this.add(vmob);
      }
    }
  }

  /**
   * Get all subpaths as individual VMobjects.
   */
  getSubpaths(): VMobject[] {
    return this.children.filter(c => c instanceof VMobject) as VMobject[];
  }

  protected _createCopy(): SVGMobject {
    return new SVGMobject({
      svgString: this._svgString,
    });
  }
}

/**
 * Parse SVG string and create an SVGMobject.
 */
export function svgMobject(svgString: string, options?: Omit<SVGMobjectOptions, 'svgString'>): SVGMobject {
  return new SVGMobject({ ...options, svgString });
}
