import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { Polygon } from '../geometry/Polygon';
import { Line } from '../geometry/Line';
import { Text } from '../text/Text';
import { BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD, GRAY } from '../../constants/colors';

/** Default color cycle for radar series. */
const DEFAULT_SERIES_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/**
 * Options for creating a RadarChart.
 */
export interface RadarChartOptions {
  /** Values per category. One series is number[], several series are number[][]. */
  data: number[] | number[][];
  /** Axis (category) labels, one per axis. Default: [] */
  categories?: string[];
  /** Value that reaches the outer ring. Default: the largest value in the data. */
  maxValue?: number;
  /** Radius of the outer ring. Default: 3 */
  radius?: number;
  /** Number of concentric grid rings. Default: 5 */
  numRings?: number;
  /** Color per series. Single color applies to all, array cycles. Default: Manim palette. */
  seriesColors?: string | string[];
  /** Fill opacity of each series polygon. Default: 0.3 */
  fillOpacity?: number;
  /** Stroke width of each series polygon. Default: 3 */
  strokeWidth?: number;
  /** Whether to draw the rings and spokes. Default: true */
  showGrid?: boolean;
  /** Whether to draw the category labels. Default: true */
  showLabels?: boolean;
  /** Font size for the category labels. Default: 20 */
  labelFontSize?: number;
  /** Color for the grid rings, spokes and labels. Default: gray. */
  gridColor?: string;
  /** Angle of the first axis in radians. Default: Math.PI / 2 (straight up). */
  startAngle?: number;
}

/**
 * RadarChart - A radar (spider) chart mobject.
 *
 * Draws N axes that radiate from a shared center, one per category, spaced at
 * 2*pi/N. Each value is plotted at a radius proportional to the value along its
 * axis, and the points of a series connect into a closed polygon. Several series
 * overlay on the same axes, each with its own color and a semi-transparent fill.
 *
 * Negative values clamp to the center (radius 0). A value equal to maxValue sits
 * on the outer ring.
 *
 * The chart is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const chart = new RadarChart({
 *   data: [
 *     [4, 2, 5, 1, 3],
 *     [1, 5, 2, 4, 2],
 *   ],
 *   categories: ['Speed', 'Power', 'Range', 'Cost', 'Weight'],
 * });
 * scene.play(new Create(chart));
 * ```
 */
export class RadarChart extends VGroup {
  /** The concentric grid rings. */
  grid: VGroup;
  /** The axis spoke lines, one per category. */
  axes: VGroup;
  /** The series polygons. */
  series: VGroup;
  /** The category labels. */
  labels: VGroup;

  protected _series: number[][];
  protected _categories: string[];
  protected _maxValue: number;
  protected _radius: number;
  protected _numRings: number;
  protected _seriesColors: string[];
  protected _fillOpacity: number;
  protected _strokeWidth: number;
  protected _showGrid: boolean;
  protected _showLabels: boolean;
  protected _labelFontSize: number;
  protected _gridColor: string;
  protected _startAngle: number;

  constructor(options: RadarChartOptions) {
    super();

    const {
      data,
      categories = [],
      maxValue,
      radius = 3,
      numRings = 5,
      seriesColors = DEFAULT_SERIES_COLORS,
      fillOpacity = 0.3,
      strokeWidth = 3,
      showGrid = true,
      showLabels = true,
      labelFontSize = 20,
      gridColor = GRAY,
      startAngle = Math.PI / 2,
    } = options;

    this._series = this._normalizeData(data);
    this._categories = categories;
    this._radius = radius;
    this._numRings = numRings;
    this._seriesColors = Array.isArray(seriesColors) ? seriesColors : [seriesColors];
    this._fillOpacity = fillOpacity;
    this._strokeWidth = strokeWidth;
    this._showGrid = showGrid;
    this._showLabels = showLabels;
    this._labelFontSize = labelFontSize;
    this._gridColor = gridColor;
    this._startAngle = startAngle;

    this._maxValue = maxValue ?? this._autoMaxValue();

    this.grid = new VGroup();
    this.axes = new VGroup();
    this.series = new VGroup();
    this.labels = new VGroup();

    if (this._showGrid) {
      this._createGrid();
      this._createSpokes();
    }
    this._createSeries();
    if (this._showLabels) {
      this._createLabels();
    }

    this.add(this.grid);
    this.add(this.axes);
    this.add(this.series);
    this.add(this.labels);
  }

  /** Normalize data to a 2D array (series x categories). */
  private _normalizeData(data: number[] | number[][]): number[][] {
    if (data.length === 0) return [];
    if (typeof data[0] === 'number') {
      return [data as number[]];
    }
    return (data as number[][]).map((series) => [...series]);
  }

  /** Largest value across all series, or 1 when nothing is positive. */
  private _autoMaxValue(): number {
    let maxVal = -Infinity;
    for (const series of this._series) {
      for (const value of series) {
        if (value > maxVal) maxVal = value;
      }
    }
    return maxVal > 0 ? maxVal : 1;
  }

  /** Number of axes (categories). */
  private get _numAxes(): number {
    return this._series[0]?.length ?? 0;
  }

  /** Color for series s, cycling through the palette. */
  private _seriesColor(seriesIndex: number): string {
    return this._seriesColors[seriesIndex % this._seriesColors.length];
  }

  /**
   * Angle in radians of axis k, measured from the positive x-axis.
   * Axes are spaced 2*pi/N counter-clockwise from startAngle.
   */
  getAxisAngle(categoryIndex: number): number {
    const n = this._numAxes;
    if (n === 0) return this._startAngle;
    return this._startAngle + (categoryIndex * 2 * Math.PI) / n;
  }

  /** Radius for a value, clamped to [0, infinity): negatives sit at the center. */
  private _valueToRadius(value: number): number {
    if (this._maxValue === 0) return 0;
    return (Math.max(0, value) / this._maxValue) * this._radius;
  }

  /**
   * Plotted point for the value of series s at category k, in chart coordinates
   * (the chart is centered on the origin).
   */
  getPointForValue(seriesIndex: number, categoryIndex: number): Vector3Tuple {
    const value = this._series[seriesIndex]?.[categoryIndex] ?? 0;
    const r = this._valueToRadius(value);
    const a = this.getAxisAngle(categoryIndex);
    return [r * Math.cos(a), r * Math.sin(a), 0];
  }

  /** Point on the outer ring along axis k. */
  private _outerPoint(categoryIndex: number): Vector3Tuple {
    const a = this.getAxisAngle(categoryIndex);
    return [this._radius * Math.cos(a), this._radius * Math.sin(a), 0];
  }

  /** Build the concentric grid rings (one polygon per ring). */
  private _createGrid(): void {
    const n = this._numAxes;
    if (n < 2 || this._numRings < 1) return;

    for (let ring = 1; ring <= this._numRings; ring++) {
      const ringRadius = (this._radius * ring) / this._numRings;
      const vertices: Vector3Tuple[] = [];
      for (let k = 0; k < n; k++) {
        const a = this.getAxisAngle(k);
        vertices.push([ringRadius * Math.cos(a), ringRadius * Math.sin(a), 0]);
      }
      const polygon = new Polygon({
        vertices,
        color: this._gridColor,
        fillOpacity: 0,
        strokeWidth: 1,
        closed: true,
      });
      this.grid.add(polygon);
    }
  }

  /** Build one spoke line per axis, from the center to the outer ring. */
  private _createSpokes(): void {
    for (let k = 0; k < this._numAxes; k++) {
      const spoke = new Line({
        start: [0, 0, 0],
        end: this._outerPoint(k),
        color: this._gridColor,
        strokeWidth: 1,
      });
      this.axes.add(spoke);
    }
  }

  /** Build one closed polygon per series. */
  private _createSeries(): void {
    const n = this._numAxes;
    if (n === 0) return;

    for (let s = 0; s < this._series.length; s++) {
      const vertices: Vector3Tuple[] = [];
      for (let k = 0; k < n; k++) {
        vertices.push(this.getPointForValue(s, k));
      }
      // Polygon needs at least 2 vertices; duplicate a lone point.
      if (vertices.length === 1) {
        vertices.push([...vertices[0]]);
      }
      const polygon = new Polygon({
        vertices,
        color: this._seriesColor(s),
        fillOpacity: this._fillOpacity,
        strokeWidth: this._strokeWidth,
        closed: true,
      });
      this.series.add(polygon);
    }
  }

  /** Build the category labels, placed just beyond the outer ring. */
  private _createLabels(): void {
    const labelOffset = 0.35;
    for (let k = 0; k < this._numAxes; k++) {
      const labelText = this._categories[k];
      if (labelText === undefined || labelText === '') continue;

      const a = this.getAxisAngle(k);
      const r = this._radius + labelOffset;
      const label = new Text({
        text: labelText,
        fontSize: this._labelFontSize,
        color: this._gridColor,
      });
      label.moveTo([r * Math.cos(a), r * Math.sin(a), 0]);
      this.labels.add(label);
    }
  }

  /** Get the polygon for series i, or undefined when out of range. */
  getSeriesPolygon(seriesIndex: number): Polygon | undefined {
    return this.series.get(seriesIndex) as Polygon | undefined;
  }

  /** Get the group of axis spoke lines. */
  getAxes(): VGroup {
    return this.axes;
  }

  /** Get the group of grid rings. */
  getGrid(): VGroup {
    return this.grid;
  }

  /** Get the group of series polygons. */
  getSeries(): VGroup {
    return this.series;
  }

  /** Get the group of category labels. */
  getLabels(): VGroup {
    return this.labels;
  }

  /** Number of axes (categories). */
  getNumAxes(): number {
    return this._numAxes;
  }

  /** Number of series. */
  getNumSeries(): number {
    return this._numAxes === 0 ? 0 : this._series.length;
  }

  /** The value that reaches the outer ring. */
  getMaxValue(): number {
    return this._maxValue;
  }

  /** The outer ring radius. */
  getOuterRadius(): number {
    return this._radius;
  }

  /** Get the data as a 2D array (series x categories). */
  getData(): number[][] {
    return this._series.map((series) => [...series]);
  }

  override copy(): RadarChart {
    const clone = new RadarChart({
      data: this.getData(),
      categories: [...this._categories],
      maxValue: this._maxValue,
      radius: this._radius,
      numRings: this._numRings,
      seriesColors: [...this._seriesColors],
      fillOpacity: this._fillOpacity,
      strokeWidth: this._strokeWidth,
      showGrid: this._showGrid,
      showLabels: this._showLabels,
      labelFontSize: this._labelFontSize,
      gridColor: this._gridColor,
      startAngle: this._startAngle,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
