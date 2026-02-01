import { VMobject } from '../../core/VMobject';
import { Axes } from './Axes';

/**
 * Options for creating an ImplicitFunction
 */
export interface ImplicitFunctionOptions {
  /** The implicit function f(x, y) whose zero-level set is plotted */
  func: (x: number, y: number) => number;
  /** X range for the plot as [min, max]. Default: [-5, 5] */
  xRange?: [number, number];
  /** Y range for the plot as [min, max]. Default: [-5, 5] */
  yRange?: [number, number];
  /** Minimum grid depth (grid = 2^minDepth cells per axis). Default: 5 */
  minDepth?: number;
  /** Maximum grid depth for adaptive refinement (grid = 2^maxDepth at finest). Default: 9 */
  maxDepth?: number;
  /** Stroke color. Default: '#58c4dd' (Manim blue) */
  color?: string;
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** Reference axes for coordinate transformation. Optional */
  axes?: Axes;
}

/**
 * ImplicitFunction - Plots the zero-level set of f(x, y) = 0
 *
 * Uses the Marching Squares algorithm with adaptive refinement to find
 * and render implicit curves. Cells containing sign changes are
 * recursively subdivided from minDepth up to maxDepth for higher
 * fidelity near the contour without paying the cost of a globally fine grid.
 *
 * Can handle multiple disjoint curves, closed loops, and saddle points.
 *
 * @example
 * ```typescript
 * // Plot a circle: x^2 + y^2 - 1 = 0
 * const circle = new ImplicitFunction({
 *   func: (x, y) => x * x + y * y - 1,
 * });
 *
 * // Plot a hyperbola: x^2 - y^2 - 1 = 0
 * const hyperbola = new ImplicitFunction({
 *   func: (x, y) => x * x - y * y - 1,
 *   xRange: [-3, 3],
 *   yRange: [-3, 3],
 * });
 *
 * // Plot with axes and adaptive refinement
 * const axes = new Axes();
 * const curve = new ImplicitFunction({
 *   func: (x, y) => Math.sin(x) - y,
 *   axes,
 *   minDepth: 4,
 *   maxDepth: 8,
 * });
 * ```
 */
export class ImplicitFunction extends VMobject {
  private _func: (x: number, y: number) => number;
  private _xRange: [number, number];
  private _yRange: [number, number];
  private _minDepth: number;
  private _maxDepth: number;
  private _axes: Axes | null;

  constructor(options: ImplicitFunctionOptions) {
    super();

    const {
      func,
      xRange = [-5, 5],
      yRange = [-5, 5],
      minDepth = 5,
      maxDepth = 9,
      color = '#58c4dd',
      strokeWidth = 2,
      axes,
    } = options;

    this._func = func;
    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._minDepth = minDepth;
    this._maxDepth = Math.max(maxDepth, minDepth);
    this._axes = axes ?? null;

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the curve points using adaptive Marching Squares
   */
  private _generatePoints(): void {
    const segments = this._marchingSquares();
    const polylines = this._chainSegments(segments);

    const allPoints: number[][] = [];
    let isFirstSegment = true;

    for (const polyline of polylines) {
      if (polyline.length < 2) continue;

      // Transform points if axes are provided
      const transformed = polyline.map((p) =>
        this._axes ? this._axes.coordsToPoint(p[0], p[1]) : [p[0], p[1], 0]
      );

      const bezierPoints = this._pointsToBezier(transformed);

      if (!isFirstSegment && allPoints.length > 0) {
        // Add a degenerate segment to break between paths
        const lastPoint = allPoints[allPoints.length - 1];
        const firstPoint = bezierPoints[0];
        allPoints.push([...lastPoint]);
        allPoints.push([...lastPoint]);
        allPoints.push([...firstPoint]);
      }

      allPoints.push(...bezierPoints);
      isFirstSegment = false;
    }

    this.setPoints3D(allPoints);
  }

  /**
   * Run the adaptive Marching Squares algorithm to extract line segments
   * along the zero-level set. Starts at minDepth resolution and recursively
   * subdivides cells with sign changes up to maxDepth.
   */
  private _marchingSquares(): number[][][] {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;
    const baseRes = Math.pow(2, this._minDepth);
    const baseDx = (xMax - xMin) / baseRes;
    const baseDy = (yMax - yMin) / baseRes;

    // Cache evaluated function values to avoid redundant calls during
    // adaptive refinement. Key: "x,y" quantized string, Value: f(x,y)
    const valueCache = new Map<string, number>();
    const evalFunc = (x: number, y: number): number => {
      // Quantize to avoid floating-point key mismatches.
      // Use the finest possible grid spacing for quantization.
      const finestRes = Math.pow(2, this._maxDepth);
      const qx = Math.round((x - xMin) * finestRes / (xMax - xMin));
      const qy = Math.round((y - yMin) * finestRes / (yMax - yMin));
      const key = `${qx},${qy}`;
      let val = valueCache.get(key);
      if (val === undefined) {
        val = this._func(x, y);
        valueCache.set(key, val);
      }
      return val;
    };

    const segments: number[][][] = [];

    // Process each base cell, with recursive subdivision
    for (let iy = 0; iy < baseRes; iy++) {
      for (let ix = 0; ix < baseRes; ix++) {
        const cellX = xMin + ix * baseDx;
        const cellY = yMin + iy * baseDy;
        this._processCell(
          cellX, cellY, baseDx, baseDy,
          this._minDepth, evalFunc, segments
        );
      }
    }

    return segments;
  }

  /**
   * Recursively process a single cell. If the cell has a sign change and
   * the current depth is below maxDepth, subdivide it into 4 sub-cells.
   * Otherwise, emit marching-squares segments for this cell.
   */
  private _processCell(
    cellX: number, cellY: number,
    dx: number, dy: number,
    depth: number,
    evalFunc: (x: number, y: number) => number,
    segments: number[][][]
  ): void {
    // Evaluate corner values: BL, BR, TR, TL
    const vBL = evalFunc(cellX, cellY);
    const vBR = evalFunc(cellX + dx, cellY);
    const vTR = evalFunc(cellX + dx, cellY + dy);
    const vTL = evalFunc(cellX, cellY + dy);

    // Build 4-bit case index: TL=8, TR=4, BR=2, BL=1
    let caseIndex = 0;
    if (vTL > 0) caseIndex |= 8;
    if (vTR > 0) caseIndex |= 4;
    if (vBR > 0) caseIndex |= 2;
    if (vBL > 0) caseIndex |= 1;

    // Skip uniform cells (all positive or all negative)
    if (caseIndex === 0 || caseIndex === 15) return;

    // Adaptive refinement: subdivide if we haven't reached maxDepth
    if (depth < this._maxDepth) {
      const halfDx = dx / 2;
      const halfDy = dy / 2;
      const nextDepth = depth + 1;
      // Bottom-left sub-cell
      this._processCell(cellX, cellY, halfDx, halfDy, nextDepth, evalFunc, segments);
      // Bottom-right sub-cell
      this._processCell(cellX + halfDx, cellY, halfDx, halfDy, nextDepth, evalFunc, segments);
      // Top-left sub-cell
      this._processCell(cellX, cellY + halfDy, halfDx, halfDy, nextDepth, evalFunc, segments);
      // Top-right sub-cell
      this._processCell(cellX + halfDx, cellY + halfDy, halfDx, halfDy, nextDepth, evalFunc, segments);
      return;
    }

    // At maxDepth: emit segments for this leaf cell
    // Compute interpolated edge crossing points
    const left = this._interpolateEdge(
      cellX, cellY + dy, vTL,
      cellX, cellY, vBL
    );
    const right = this._interpolateEdge(
      cellX + dx, cellY + dy, vTR,
      cellX + dx, cellY, vBR
    );
    const bottom = this._interpolateEdge(
      cellX, cellY, vBL,
      cellX + dx, cellY, vBR
    );
    const top = this._interpolateEdge(
      cellX, cellY + dy, vTL,
      cellX + dx, cellY + dy, vTR
    );

    // Map case index to line segments
    switch (caseIndex) {
      case 1:  // BL positive only
        segments.push([left, bottom]);
        break;
      case 2:  // BR positive only
        segments.push([bottom, right]);
        break;
      case 3:  // BL + BR positive (bottom half)
        segments.push([left, right]);
        break;
      case 4:  // TR positive only
        segments.push([right, top]);
        break;
      case 5: { // BL + TR positive (saddle)
        const center = evalFunc(cellX + dx / 2, cellY + dy / 2);
        if (center > 0) {
          // Center joins BL-TR: contour isolates TL and BR separately
          segments.push([left, top]);
          segments.push([bottom, right]);
        } else {
          // Center separates BL from TR: contour connects across
          segments.push([left, bottom]);
          segments.push([right, top]);
        }
        break;
      }
      case 6:  // TR + BR positive (right half)
        segments.push([bottom, top]);
        break;
      case 7:  // All positive except TL
        segments.push([left, top]);
        break;
      case 8:  // TL positive only
        segments.push([top, left]);
        break;
      case 9:  // TL + BL positive (left half)
        segments.push([bottom, top]);
        break;
      case 10: { // TL + BR positive (saddle)
        const center = evalFunc(cellX + dx / 2, cellY + dy / 2);
        if (center > 0) {
          // Center joins TL-BR: contour isolates TR and BL separately
          segments.push([left, bottom]);
          segments.push([right, top]);
        } else {
          // Center separates TL from BR: contour connects across
          segments.push([left, top]);
          segments.push([right, bottom]);
        }
        break;
      }
      case 11: // All positive except TR
        segments.push([right, top]);
        break;
      case 12: // TL + TR positive (top half)
        segments.push([left, right]);
        break;
      case 13: // All positive except BR
        segments.push([right, bottom]);
        break;
      case 14: // All positive except BL
        segments.push([left, bottom]);
        break;
      // case 0 and 15 already skipped above
    }
  }

  /**
   * Linear interpolation along a grid edge to find the zero-crossing point.
   * Interpolates between (x0, y0) with value v0 and (x1, y1) with value v1.
   */
  private _interpolateEdge(
    x0: number, y0: number, v0: number,
    x1: number, y1: number, v1: number
  ): number[] {
    // Avoid division by zero
    if (Math.abs(v1 - v0) < 1e-12) {
      return [(x0 + x1) / 2, (y0 + y1) / 2];
    }
    const t = -v0 / (v1 - v0);
    const tc = Math.max(0, Math.min(1, t));
    return [
      x0 + tc * (x1 - x0),
      y0 + tc * (y1 - y0),
    ];
  }

  /**
   * Chain individual line segments into continuous polylines by matching
   * endpoints within an epsilon tolerance.
   */
  private _chainSegments(segments: number[][][]): number[][][] {
    if (segments.length === 0) return [];

    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;
    // Use the finest grid level for epsilon so adaptive segments chain properly
    const finestRes = Math.pow(2, this._maxDepth);
    const cellSize = Math.max(
      (xMax - xMin) / finestRes,
      (yMax - yMin) / finestRes
    );
    const epsilon = cellSize * 0.1;

    // Build endpoint spatial index
    // Key: quantized coordinate string, Value: array of { segIndex, endIndex (0 or 1) }
    const quantize = (p: number[]): string => {
      const qx = Math.round(p[0] / epsilon);
      const qy = Math.round(p[1] / epsilon);
      return `${qx},${qy}`;
    };

    const endpointMap = new Map<string, Array<{ segIndex: number; endIndex: number }>>();
    const used = new Array<boolean>(segments.length).fill(false);

    for (let i = 0; i < segments.length; i++) {
      for (let e = 0; e < 2; e++) {
        const key = quantize(segments[i][e]);
        let list = endpointMap.get(key);
        if (!list) {
          list = [];
          endpointMap.set(key, list);
        }
        list.push({ segIndex: i, endIndex: e });
      }
    }

    const findConnected = (point: number[]): { segIndex: number; endIndex: number } | null => {
      const key = quantize(point);
      const list = endpointMap.get(key);
      if (!list) return null;
      for (const entry of list) {
        if (!used[entry.segIndex]) {
          // Verify actual distance
          const p = segments[entry.segIndex][entry.endIndex];
          const dx = p[0] - point[0];
          const dy = p[1] - point[1];
          if (dx * dx + dy * dy < epsilon * epsilon) {
            return entry;
          }
        }
      }
      return null;
    };

    const polylines: number[][][] = [];

    for (let i = 0; i < segments.length; i++) {
      if (used[i]) continue;
      used[i] = true;

      // Start a new polyline with this segment
      const polyline: number[][] = [segments[i][0], segments[i][1]];

      // Extend forward from the end
      let searching = true;
      while (searching) {
        const tail = polyline[polyline.length - 1];
        const match = findConnected(tail);
        if (match && !used[match.segIndex]) {
          used[match.segIndex] = true;
          // Append the other end of the matched segment
          const otherEnd = match.endIndex === 0 ? 1 : 0;
          polyline.push(segments[match.segIndex][otherEnd]);
        } else {
          searching = false;
        }
      }

      // Extend backward from the start
      searching = true;
      while (searching) {
        const head = polyline[0];
        const match = findConnected(head);
        if (match && !used[match.segIndex]) {
          used[match.segIndex] = true;
          const otherEnd = match.endIndex === 0 ? 1 : 0;
          polyline.unshift(segments[match.segIndex][otherEnd]);
        } else {
          searching = false;
        }
      }

      polylines.push(polyline);
    }

    return polylines;
  }

  /**
   * Convert sampled points to smooth Bezier curve points using
   * Catmull-Rom to Bezier conversion with tension 0.5.
   */
  private _pointsToBezier(points: number[][]): number[][] {
    if (points.length < 2) return points;
    if (points.length === 2) {
      // Simple line
      const p0 = points[0];
      const p1 = points[1];
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];
      return [
        [...p0],
        [p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3],
        [p0[0] + 2 * dx / 3, p0[1] + 2 * dy / 3, p0[2] + 2 * dz / 3],
        [...p1],
      ];
    }

    const bezierPoints: number[][] = [];

    // Use Catmull-Rom to Bezier conversion for smooth curves
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Calculate control points
      const tension = 0.5;
      const d1 = [
        (p2[0] - p0[0]) * tension,
        (p2[1] - p0[1]) * tension,
        (p2[2] - p0[2]) * tension,
      ];
      const d2 = [
        (p3[0] - p1[0]) * tension,
        (p3[1] - p1[1]) * tension,
        (p3[2] - p1[2]) * tension,
      ];

      const cp1 = [
        p1[0] + d1[0] / 3,
        p1[1] + d1[1] / 3,
        p1[2] + d1[2] / 3,
      ];
      const cp2 = [
        p2[0] - d2[0] / 3,
        p2[1] - d2[1] / 3,
        p2[2] - d2[2] / 3,
      ];

      if (i === 0) {
        bezierPoints.push([...p1]);
      }
      bezierPoints.push(cp1);
      bezierPoints.push(cp2);
      bezierPoints.push([...p2]);
    }

    return bezierPoints;
  }

  /**
   * Get the implicit function
   */
  getFunction(): (x: number, y: number) => number {
    return this._func;
  }

  /**
   * Set a new implicit function to plot
   */
  setFunction(func: (x: number, y: number) => number): this {
    this._func = func;
    this._generatePoints();
    return this;
  }

  /**
   * Get the x range
   */
  getXRange(): [number, number] {
    return [...this._xRange];
  }

  /**
   * Set the x range
   */
  setXRange(xRange: [number, number]): this {
    this._xRange = [...xRange];
    this._generatePoints();
    return this;
  }

  /**
   * Get the y range
   */
  getYRange(): [number, number] {
    return [...this._yRange];
  }

  /**
   * Set the y range
   */
  setYRange(yRange: [number, number]): this {
    this._yRange = [...yRange];
    this._generatePoints();
    return this;
  }

  /**
   * Set the reference axes
   */
  setAxes(axes: Axes | null): this {
    this._axes = axes;
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this ImplicitFunction
   */
  protected override _createCopy(): ImplicitFunction {
    return new ImplicitFunction({
      func: this._func,
      xRange: this._xRange,
      yRange: this._yRange,
      minDepth: this._minDepth,
      maxDepth: this._maxDepth,
      color: this.color,
      strokeWidth: this.strokeWidth,
      axes: this._axes ?? undefined,
    });
  }
}

export default ImplicitFunction;
