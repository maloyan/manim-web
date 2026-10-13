import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';
import { Dot } from '../geometry/Dot';
import { Axes } from './Axes';
import { boxSummary, extent, niceAxisRange, type BoxSummary } from './stats';
import { isFlatSeries } from './seriesData';
import {
  BLUE,
  GREEN,
  RED,
  YELLOW,
  ORANGE,
  PURPLE,
  TEAL,
  GOLD,
  WHITE,
} from '../../constants/colors';

/** Default color cycle for the boxes. */
const DEFAULT_BOX_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/** Orientation of a box or violin plot. */
export type PlotOrientation = 'vertical' | 'horizontal';

/** Options for creating a BoxPlot. */
export interface BoxPlotOptions {
  /** One data group (number[]) or several groups (number[][]). */
  data: number[] | number[][];
  /** Lay boxes along the x-axis ('vertical') or y-axis ('horizontal'). Default: 'vertical' */
  orientation?: PlotOrientation;
  /** Box color, or a per-group color array. Default: Manim color palette */
  colors?: string | string[];
  /** Fill opacity for the boxes. Default: 0.6 */
  fillOpacity?: number;
  /** Stroke width for box, median and whiskers. Default: 2 */
  strokeWidth?: number;
  /** Whisker length as a multiple of the IQR. Default: 1.5 */
  whiskerFactor?: number;
  /** Box thickness in category units. Default: 0.5 */
  boxWidth?: number;
  /** Radius of the outlier dots. Default: 0.05 */
  outlierRadius?: number;
  /** An existing Axes to draw onto. When omitted, one is built from the data. */
  axes?: Axes;
  /** Visual length of the x-axis when auto-building axes. Default: 8 */
  xLength?: number;
  /** Visual length of the y-axis when auto-building axes. Default: 6 */
  yLength?: number;
  /** Color for the axes when auto-building. Default: '#ffffff' */
  axisColor?: string;
}

/**
 * BoxPlot - a box-and-whisker plot for one or more data groups.
 *
 * Each group draws a box from Q1 to Q3 with a median line, whiskers that reach
 * the most extreme values inside 1.5*IQR, and dots for the outliers beyond the
 * whiskers. Groups sit side by side along the category axis.
 *
 * @example
 * ```typescript
 * const box = new BoxPlot({
 *   data: [[1, 2, 3, 4, 5, 100], [2, 3, 4, 5, 6]],
 *   orientation: 'vertical',
 * });
 * const summary = box.getSummary(0); // { q1, median, q3, whiskerLow, ... }
 * ```
 */
export class BoxPlot extends Group {
  /** The coordinate system the boxes are drawn on. */
  axes: Axes;

  protected _groupsData: number[][];
  protected _orientation: PlotOrientation;
  protected _boxWidth: number;
  protected _summaries: BoxSummary[] = [];
  protected _groupMobjects: VGroup[] = [];
  protected _boxes: (Rectangle | null)[] = [];
  protected _medianLines: (Line | null)[] = [];
  protected _whiskerGroups: VGroup[] = [];
  protected _outlierGroups: VGroup[] = [];

  constructor(options: BoxPlotOptions) {
    super();

    const {
      data,
      orientation = 'vertical',
      colors = DEFAULT_BOX_COLORS,
      fillOpacity = 0.6,
      strokeWidth = 2,
      whiskerFactor = 1.5,
      boxWidth = 0.5,
      outlierRadius = 0.05,
      axes,
      xLength = 8,
      yLength = 6,
      axisColor = '#ffffff',
    } = options;

    this._groupsData = normalizeGroups(data);
    this._orientation = orientation;
    this._boxWidth = boxWidth;
    this._summaries = this._groupsData.map((group) => boxSummary(group, whiskerFactor));

    const valueRange = this._valueRange();
    const categoryRange: [number, number, number] = [-0.5, this._groupsData.length - 0.5, 1];
    this.axes =
      axes ??
      new Axes({
        xRange: orientation === 'vertical' ? categoryRange : valueRange,
        yRange: orientation === 'vertical' ? valueRange : categoryRange,
        xLength,
        yLength,
        color: axisColor,
        tips: false,
      });

    const colorList = Array.isArray(colors) ? colors : [colors];
    this.add(this.axes);

    for (let i = 0; i < this._groupsData.length; i++) {
      const groupMob = this._buildGroup(i, colorList[i % colorList.length], {
        fillOpacity,
        strokeWidth,
        outlierRadius,
      });
      this._groupMobjects.push(groupMob);
      this.add(groupMob);
    }
  }

  /** Padded value range covering every data value across all groups. */
  private _valueRange(): [number, number, number] {
    const all = this._groupsData.flat();
    const [min, max] = extent(all);
    return niceAxisRange(min, max);
  }

  /** Map a (category, value) pair to a world point, respecting orientation. */
  private _toPoint(category: number, value: number): Vector3Tuple {
    return this._orientation === 'vertical'
      ? this.axes.coordsToPoint(category, value)
      : this.axes.coordsToPoint(value, category);
  }

  /** Build the box, median, whiskers and outliers for one group. */
  private _buildGroup(
    index: number,
    color: string,
    style: { fillOpacity: number; strokeWidth: number; outlierRadius: number },
  ): VGroup {
    const groupMob = new VGroup();
    const summary = this._summaries[index];
    const whiskers = new VGroup();
    const outliers = new VGroup();

    // Empty group: no geometry, record nulls so accessors stay aligned.
    if (Number.isNaN(summary.q1)) {
      this._boxes.push(null);
      this._medianLines.push(null);
      this._whiskerGroups.push(whiskers);
      this._outlierGroups.push(outliers);
      return groupMob;
    }

    const half = this._boxWidth / 2;
    const quarter = this._boxWidth / 4;

    const box = this._buildBox(index, summary, color, style);
    groupMob.add(box);
    this._boxes.push(box);

    const median = new Line({
      start: this._toPoint(index - half, summary.median),
      end: this._toPoint(index + half, summary.median),
      color: WHITE,
      strokeWidth: style.strokeWidth,
    });
    groupMob.add(median);
    this._medianLines.push(median);

    // Whisker stems from the box edges to the whisker caps.
    whiskers.add(this._stem(index, summary.q3, summary.whiskerHigh, style.strokeWidth));
    whiskers.add(this._stem(index, summary.q1, summary.whiskerLow, style.strokeWidth));
    // Whisker caps (short perpendicular lines).
    whiskers.add(this._cap(index, summary.whiskerHigh, quarter, style.strokeWidth));
    whiskers.add(this._cap(index, summary.whiskerLow, quarter, style.strokeWidth));
    groupMob.add(whiskers);
    this._whiskerGroups.push(whiskers);

    for (const value of summary.outliers) {
      outliers.add(
        new Dot({
          point: this._toPoint(index, value),
          radius: style.outlierRadius,
          color,
        }),
      );
    }
    groupMob.add(outliers);
    this._outlierGroups.push(outliers);

    return groupMob;
  }

  /** Build the Q1..Q3 box rectangle for one group. */
  private _buildBox(
    index: number,
    summary: BoxSummary,
    color: string,
    style: { fillOpacity: number; strokeWidth: number },
  ): Rectangle {
    const half = this._boxWidth / 2;
    const corner1 = this._toPoint(index - half, summary.q1);
    const corner2 = this._toPoint(index + half, summary.q3);
    const width = Math.abs(corner2[0] - corner1[0]) || 0.0001;
    const height = Math.abs(corner2[1] - corner1[1]) || 0.0001;
    return new Rectangle({
      width,
      height,
      center: [(corner1[0] + corner2[0]) / 2, (corner1[1] + corner2[1]) / 2, corner1[2]],
      color,
      fillOpacity: style.fillOpacity,
      strokeWidth: style.strokeWidth,
    });
  }

  /** A whisker stem from a box edge value to a whisker end value. */
  private _stem(index: number, fromValue: number, toValue: number, strokeWidth: number): Line {
    return new Line({
      start: this._toPoint(index, fromValue),
      end: this._toPoint(index, toValue),
      color: WHITE,
      strokeWidth,
    });
  }

  /** A whisker cap: a short line perpendicular to the stem at a value. */
  private _cap(index: number, value: number, halfCap: number, strokeWidth: number): Line {
    return new Line({
      start: this._toPoint(index - halfCap, value),
      end: this._toPoint(index + halfCap, value),
      color: WHITE,
      strokeWidth,
    });
  }

  /** Get the coordinate system. */
  getAxes(): Axes {
    return this.axes;
  }

  /** Get the computed summary for one group. */
  getSummary(index: number): BoxSummary {
    return { ...this._summaries[index], outliers: [...this._summaries[index].outliers] };
  }

  /** Get all group summaries. */
  getSummaries(): BoxSummary[] {
    return this._summaries.map((s) => ({ ...s, outliers: [...s.outliers] }));
  }

  /** Get the mobject group for one data group. */
  getGroup(index: number): VGroup | undefined {
    return this._groupMobjects[index];
  }

  /** Get the box rectangle for one group, or null for an empty group. */
  getBox(index: number): Rectangle | null {
    return this._boxes[index] ?? null;
  }

  /** Get the median line for one group, or null for an empty group. */
  getMedianLine(index: number): Line | null {
    return this._medianLines[index] ?? null;
  }

  /** Get the whisker lines for one group. */
  getWhiskers(index: number): VGroup | undefined {
    return this._whiskerGroups[index];
  }

  /** Get the outlier dots for one group. */
  getOutlierDots(index: number): VGroup | undefined {
    return this._outlierGroups[index];
  }

  /** The number of data groups. */
  get numGroups(): number {
    return this._groupsData.length;
  }

  override copy(): BoxPlot {
    const copy = new BoxPlot({
      data: this._groupsData.map((group) => [...group]),
      orientation: this._orientation,
      boxWidth: this._boxWidth,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

/** Normalize a one-group or many-group data argument to number[][]. */
export function normalizeGroups(data: number[] | number[][]): number[][] {
  if (data.length === 0) return [[]];
  if (isFlatSeries(data)) return [data];
  return data;
}
