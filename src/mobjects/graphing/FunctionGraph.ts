import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { Axes } from './Axes';

/**
 * Options for creating a FunctionGraph
 */
export interface FunctionGraphOptions {
  /** The function to graph: y = func(x) */
  func: (x: number) => number;
  /** X range for the graph as [min, max]. Default: from axes or [-5, 5] */
  xRange?: [number, number];
  /** Stroke color. Default: '#58c4dd' (Manim blue) */
  color?: string;
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** X values where the function is discontinuous. Default: [] */
  discontinuities?: number[];
  /** Number of samples to take. Default: 100 */
  numSamples?: number;
  /** Reference axes for coordinate transformation. Optional */
  axes?: Axes;
}

/**
 * FunctionGraph - A graph of a mathematical function y = f(x)
 *
 * Samples a function over a range and creates a smooth curve using Bezier curves.
 * Can handle discontinuities by breaking the path at specified x values.
 *
 * @example
 * ```typescript
 * // Create a simple parabola
 * const parabola = new FunctionGraph({
 *   func: x => x * x
 * });
 *
 * // Create a sine wave with custom range
 * const sine = new FunctionGraph({
 *   func: x => Math.sin(x),
 *   xRange: [-Math.PI * 2, Math.PI * 2],
 *   numSamples: 200,
 *   color: '#ff0000'
 * });
 *
 * // Graph with discontinuity (e.g., 1/x)
 * const reciprocal = new FunctionGraph({
 *   func: x => 1 / x,
 *   xRange: [-5, 5],
 *   discontinuities: [0]
 * });
 * ```
 */
export class FunctionGraph extends VMobject {
  private _func: (x: number) => number;
  private _xRange: [number, number];
  private _discontinuities: number[];
  private _numSamples: number;
  private _axes: Axes | null;

  constructor(options: FunctionGraphOptions) {
    super();

    const {
      func,
      xRange,
      color = '#58c4dd',
      strokeWidth = 2,
      discontinuities = [],
      numSamples = 100,
      axes,
    } = options;

    this._func = func;
    this._axes = axes ?? null;

    // Determine x range
    if (xRange) {
      this._xRange = [...xRange];
    } else if (axes) {
      const axesRange = axes.getXRange();
      this._xRange = [axesRange[0], axesRange[1]];
    } else {
      this._xRange = [-5, 5];
    }

    this._discontinuities = [...discontinuities].sort((a, b) => a - b);
    this._numSamples = numSamples;

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the curve points by sampling the function
   */
  private _generatePoints(): void {
    const [xMin, xMax] = this._xRange;
    const dx = (xMax - xMin) / this._numSamples;

    // Split the range at discontinuities
    const ranges: [number, number][] = [];
    let currentStart = xMin;

    for (const discX of this._discontinuities) {
      if (discX > currentStart && discX < xMax) {
        ranges.push([currentStart, discX - dx * 0.1]);
        currentStart = discX + dx * 0.1;
      }
    }
    ranges.push([currentStart, xMax]);

    const allPoints: number[][] = [];
    let isFirstSegment = true;

    for (const [rangeStart, rangeEnd] of ranges) {
      const segmentPoints = this._sampleRange(rangeStart, rangeEnd);

      if (segmentPoints.length >= 2) {
        const bezierPoints = this._pointsToBezier(segmentPoints);

        if (!isFirstSegment && allPoints.length > 0) {
          // Add a break between segments by moving to the new start
          // We do this by adding a degenerate segment
          const lastPoint = allPoints[allPoints.length - 1];
          const firstPoint = bezierPoints[0];
          allPoints.push([...lastPoint]);
          allPoints.push([...lastPoint]);
          allPoints.push([...firstPoint]);
        }

        allPoints.push(...bezierPoints);
        isFirstSegment = false;
      }
    }

    this.setPoints3D(allPoints);
  }

  /**
   * Sample the function over a range
   */
  private _sampleRange(start: number, end: number): number[][] {
    const points: number[][] = [];
    const range = end - start;
    const sampleCount = Math.max(2, Math.ceil(this._numSamples * range / (this._xRange[1] - this._xRange[0])));
    const dx = range / (sampleCount - 1);

    for (let i = 0; i < sampleCount; i++) {
      const x = start + i * dx;
      try {
        const y = this._func(x);

        // Skip invalid values
        if (!isFinite(y) || isNaN(y)) continue;

        // Transform to visual coordinates if axes are provided
        const point = this._axes ? this._axes.coordsToPoint(x, y) : [x, y, 0];
        points.push(point);
      } catch {
        // Skip points where function throws
        continue;
      }
    }

    return points;
  }

  /**
   * Convert sampled points to smooth Bezier curve points
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
   * Get a point on the graph at a given x value
   * @param x - The x coordinate
   * @returns The 3D point on the graph, or null if x is outside range or at discontinuity
   */
  getPointFromX(x: number): Vector3Tuple | null {
    const [xMin, xMax] = this._xRange;

    // Check if x is in range
    if (x < xMin || x > xMax) return null;

    // Check if x is at a discontinuity
    const epsilon = (xMax - xMin) / this._numSamples * 0.1;
    for (const discX of this._discontinuities) {
      if (Math.abs(x - discX) < epsilon) return null;
    }

    try {
      const y = this._func(x);
      if (!isFinite(y) || isNaN(y)) return null;

      if (this._axes) {
        return this._axes.coordsToPoint(x, y);
      }
      return [x, y, 0];
    } catch {
      return null;
    }
  }

  /**
   * Get the function being graphed
   */
  getFunction(): (x: number) => number {
    return this._func;
  }

  /**
   * Set a new function to graph
   */
  setFunction(func: (x: number) => number): this {
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
   * Get the discontinuities
   */
  getDiscontinuities(): number[] {
    return [...this._discontinuities];
  }

  /**
   * Set the discontinuities
   */
  setDiscontinuities(discontinuities: number[]): this {
    this._discontinuities = [...discontinuities].sort((a, b) => a - b);
    this._generatePoints();
    return this;
  }

  /**
   * Get the number of samples
   */
  getNumSamples(): number {
    return this._numSamples;
  }

  /**
   * Set the number of samples
   */
  setNumSamples(numSamples: number): this {
    this._numSamples = numSamples;
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
   * Create a copy of this FunctionGraph
   */
  protected override _createCopy(): FunctionGraph {
    return new FunctionGraph({
      func: this._func,
      xRange: this._xRange,
      color: this.color,
      strokeWidth: this.strokeWidth,
      discontinuities: this._discontinuities,
      numSamples: this._numSamples,
      axes: this._axes ?? undefined,
    });
  }
}

export default FunctionGraph;
