import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { Axes } from './Axes';

/**
 * Options for creating a ParametricFunction
 */
export interface ParametricFunctionOptions {
  /** The parametric function: returns [x, y] or [x, y, z] for a given t */
  func: (t: number) => [number, number] | [number, number, number];
  /** Parameter range as [min, max]. Default: [0, 1] */
  tRange?: [number, number];
  /** Stroke color. Default: '#58c4dd' (Manim blue) */
  color?: string;
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** Number of samples to take. Default: 100 */
  numSamples?: number;
  /** Reference axes for coordinate transformation. Optional */
  axes?: Axes;
  /** Whether to use axes coordinate transformation. Default: true if axes provided */
  useAxesCoords?: boolean;
}

/**
 * ParametricFunction - A curve defined by parametric equations
 *
 * Samples a parametric function over a parameter range and creates a smooth curve.
 * The function takes a parameter t and returns the position [x, y] or [x, y, z].
 *
 * @example
 * ```typescript
 * // Create a circle using parametric equations
 * const circle = new ParametricFunction({
 *   func: t => [Math.cos(t), Math.sin(t)],
 *   tRange: [0, 2 * Math.PI]
 * });
 *
 * // Create a Lissajous curve
 * const lissajous = new ParametricFunction({
 *   func: t => [Math.sin(3 * t), Math.sin(2 * t)],
 *   tRange: [0, 2 * Math.PI],
 *   numSamples: 200
 * });
 *
 * // Create a spiral
 * const spiral = new ParametricFunction({
 *   func: t => [t * Math.cos(t * 6), t * Math.sin(t * 6)],
 *   tRange: [0, 2],
 *   color: '#ff00ff'
 * });
 * ```
 */
export class ParametricFunction extends VMobject {
  private _func: (t: number) => [number, number] | [number, number, number];
  private _tRange: [number, number];
  private _numSamples: number;
  private _axes: Axes | null;
  private _useAxesCoords: boolean;

  constructor(options: ParametricFunctionOptions) {
    super();

    const {
      func,
      tRange = [0, 1],
      color = '#58c4dd',
      strokeWidth = 2,
      numSamples = 100,
      axes,
      useAxesCoords,
    } = options;

    this._func = func;
    this._tRange = [...tRange];
    this._numSamples = numSamples;
    this._axes = axes ?? null;
    this._useAxesCoords = useAxesCoords ?? (axes !== undefined);

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /**
   * Generate the curve points by sampling the parametric function
   */
  private _generatePoints(): void {
    const [tMin, tMax] = this._tRange;
    const dt = (tMax - tMin) / (this._numSamples - 1);

    const points: number[][] = [];

    for (let i = 0; i < this._numSamples; i++) {
      const t = tMin + i * dt;

      try {
        const result = this._func(t);
        let x = result[0];
        let y = result[1];
        let z: number = result.length > 2 ? (result as [number, number, number])[2] : 0;

        // Skip invalid values
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue;
        if (isNaN(x) || isNaN(y) || isNaN(z)) continue;

        // Transform to visual coordinates if axes are provided
        if (this._axes && this._useAxesCoords) {
          const point = this._axes.coordsToPoint(x, y);
          x = point[0];
          y = point[1];
          z = point[2];
        }

        points.push([x, y, z]);
      } catch {
        // Skip points where function throws
        continue;
      }
    }

    if (points.length < 2) {
      this.setPoints3D([]);
      return;
    }

    // Convert to smooth Bezier curves
    const bezierPoints = this._pointsToBezier(points);
    this.setPoints3D(bezierPoints);
  }

  /**
   * Convert sampled points to smooth Bezier curve points
   */
  private _pointsToBezier(points: number[][]): number[][] {
    if (points.length < 2) return points;
    if (points.length === 2) {
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

      // Calculate control points using Catmull-Rom spline formula
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
   * Get a point on the curve at a given parameter value
   * @param t - The parameter value
   * @returns The 3D point on the curve
   */
  getPointFromT(t: number): Vector3Tuple {
    try {
      const result = this._func(t);
      const x = result[0];
      const y = result[1];
      const z: number = result.length > 2 ? (result as [number, number, number])[2] : 0;

      if (this._axes && this._useAxesCoords) {
        return this._axes.coordsToPoint(x, y);
      }

      return [x, y, z];
    } catch {
      return [0, 0, 0];
    }
  }

  /**
   * Get the parametric function
   */
  getFunction(): (t: number) => [number, number] | [number, number, number] {
    return this._func;
  }

  /**
   * Set a new parametric function
   */
  setFunction(func: (t: number) => [number, number] | [number, number, number]): this {
    this._func = func;
    this._generatePoints();
    return this;
  }

  /**
   * Get the parameter range
   */
  getTRange(): [number, number] {
    return [...this._tRange];
  }

  /**
   * Set the parameter range
   */
  setTRange(tRange: [number, number]): this {
    this._tRange = [...tRange];
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
   * Set whether to use axes coordinate transformation
   */
  setUseAxesCoords(use: boolean): this {
    this._useAxesCoords = use;
    this._generatePoints();
    return this;
  }

  /**
   * Create a copy of this ParametricFunction
   */
  protected override _createCopy(): ParametricFunction {
    return new ParametricFunction({
      func: this._func,
      tRange: this._tRange,
      color: this.color,
      strokeWidth: this.strokeWidth,
      numSamples: this._numSamples,
      axes: this._axes ?? undefined,
      useAxesCoords: this._useAxesCoords,
    });
  }
}

export default ParametricFunction;
