import { VMobject } from '../../core/VMobject';
import { Axes } from './Axes';
import { marchingSquares, type ContourSegment } from './marchingSquares';

/** A 2D scalar field g(x, y). */
export type ContourField = (x: number, y: number) => number;

/**
 * Options for creating a ContourPlot.
 */
export interface ContourPlotOptions {
  /** The scalar field g(x, y). Contours are the level sets g = level. */
  func: ContourField;
  /** The iso levels to draw. Default: [-2, -1, 0, 1, 2] */
  levels?: number[];
  /** X range [min, max]. Default: [-5, 5] */
  xRange?: [number, number];
  /** Y range [min, max]. Default: [-5, 5] */
  yRange?: [number, number];
  /** Grid cells per axis for the marching-squares sampling. Default: 48 */
  resolution?: number;
  /** Stroke color. Default: '#58c4dd' (Manim blue) */
  color?: string;
  /** Stroke width in pixels. Default: 2 */
  strokeWidth?: number;
  /** Reference axes for coordinate transformation. Optional. */
  axes?: Axes;
}

/**
 * ContourPlot - iso-contour lines of a 2D scalar field g(x, y).
 *
 * The field is sampled on a regular grid, then marching squares (see
 * {@link marchingSquares}) extracts the line segments of each requested level.
 * The segments are drawn as one stroked VMobject with a path break between
 * them, so disjoint contours and nested loops all render. When `axes` is given,
 * segment endpoints map through `axes.coordsToPoint`, matching
 * {@link ImplicitFunction}.
 *
 * @example
 * ```typescript
 * // Concentric circles: g = x^2 + y^2 contoured at 1, 4, 9
 * const contours = new ContourPlot({
 *   func: (x, y) => x * x + y * y,
 *   levels: [1, 4, 9],
 *   xRange: [-4, 4],
 *   yRange: [-4, 4],
 * });
 * ```
 */
export class ContourPlot extends VMobject {
  private _func: ContourField;
  private _levels: number[];
  private _xRange: [number, number];
  private _yRange: [number, number];
  private _resolution: number;
  private _axes: Axes | null;

  constructor(options: ContourPlotOptions) {
    super();

    const {
      func,
      levels = [-2, -1, 0, 1, 2],
      xRange = [-5, 5],
      yRange = [-5, 5],
      resolution = 48,
      color = '#58c4dd',
      strokeWidth = 2,
      axes,
    } = options;

    this._func = func;
    this._levels = [...levels];
    this._xRange = [...xRange];
    this._yRange = [...yRange];
    this._resolution = Math.max(1, Math.floor(resolution));
    this._axes = axes ?? null;

    this.color = color;
    this.fillOpacity = 0;
    this.strokeWidth = strokeWidth;

    this._generatePoints();
  }

  /** Sample the field grid and return the values plus the coordinate axes. */
  private _sampleGrid(): { values: number[][]; xs: number[]; ys: number[] } {
    const [xMin, xMax] = this._xRange;
    const [yMin, yMax] = this._yRange;
    const n = this._resolution;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let ix = 0; ix <= n; ix++) xs.push(xMin + (ix / n) * (xMax - xMin));
    for (let iy = 0; iy <= n; iy++) ys.push(yMin + (iy / n) * (yMax - yMin));

    const values: number[][] = [];
    for (let iy = 0; iy <= n; iy++) {
      const row: number[] = [];
      for (let ix = 0; ix <= n; ix++) {
        row.push(this._func(xs[ix], ys[iy]));
      }
      values.push(row);
    }
    return { values, xs, ys };
  }

  /** Collect contour segments across every requested level. */
  private _contourSegments(): ContourSegment[] {
    const { values, xs, ys } = this._sampleGrid();
    const segments: ContourSegment[] = [];
    for (const level of this._levels) {
      segments.push(...marchingSquares(values, xs, ys, level));
    }
    return segments;
  }

  /** Map a field-space point to scene space through the axes, if any. */
  private _toScene(point: [number, number]): number[] {
    return this._axes ? this._axes.coordsToPoint(point[0], point[1]) : [point[0], point[1], 0];
  }

  /** Convert a straight segment into four cubic-Bezier control points. */
  private _segmentToBezier(a: number[], b: number[]): number[][] {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    return [
      [...a],
      [a[0] + d[0] / 3, a[1] + d[1] / 3, a[2] + d[2] / 3],
      [a[0] + (2 * d[0]) / 3, a[1] + (2 * d[1]) / 3, a[2] + (2 * d[2]) / 3],
      [...b],
    ];
  }

  /** Build the stroked path from the contour segments. */
  private _generatePoints(): void {
    const segments = this._contourSegments();
    const allPoints: number[][] = [];
    let first = true;

    for (const [sa, sb] of segments) {
      const a = this._toScene(sa);
      const b = this._toScene(sb);
      const bezier = this._segmentToBezier(a, b);

      if (!first && allPoints.length > 0) {
        // A degenerate triple breaks the path between disjoint segments.
        const last = allPoints[allPoints.length - 1];
        allPoints.push([...last], [...last], [...bezier[0]]);
      }
      allPoints.push(...bezier);
      first = false;
    }

    this.setPoints3D(allPoints);
  }

  /** Get the scalar field. */
  getFunc(): ContourField {
    return this._func;
  }

  /** Set the scalar field and rebuild the contours. */
  setFunc(func: ContourField): this {
    this._func = func;
    this._generatePoints();
    return this;
  }

  /** Get the contour levels. */
  getLevels(): number[] {
    return [...this._levels];
  }

  /** Set the contour levels and rebuild. */
  setLevels(levels: number[]): this {
    this._levels = [...levels];
    this._generatePoints();
    return this;
  }

  /** Set the reference axes and rebuild. */
  setAxes(axes: Axes | null): this {
    this._axes = axes;
    this._generatePoints();
    return this;
  }

  override copy(): ContourPlot {
    const copy = new ContourPlot({
      func: this._func,
      levels: [...this._levels],
      xRange: this._xRange,
      yRange: this._yRange,
      resolution: this._resolution,
      color: this.color,
      strokeWidth: this.strokeWidth,
      axes: this._axes ?? undefined,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
