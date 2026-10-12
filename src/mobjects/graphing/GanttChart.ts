import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';
import { Arrow } from '../geometry/Arrow';
import { Text } from '../text/Text';
import { WHITE, RED } from '../../constants/colors';
import { DEFAULT_SERIES_COLORS } from './chartColors';
import {
  resolveGanttLayout,
  ganttTimeRange,
  toTimeNumber,
  type GanttTaskSpec,
} from './ganttLayout';

/** A time value, given either as a number or a Date. */
export type GanttTimeValue = number | Date;

/**
 * One task on the timeline.
 */
export interface GanttTask {
  /** Unique task name, used for labels and as a dependency reference. */
  name: string;
  /** Start of the task (number or Date). */
  start: GanttTimeValue;
  /** End of the task (number or Date). */
  end: GanttTimeValue;
  /** Row key. Tasks that share a key share a row. Default: the task name. */
  row?: string;
  /** Explicit bar color. Default: cycled from the palette by row. */
  color?: string;
  /** Names of tasks this task depends on (for dependency arrows). */
  dependencies?: string[];
}

/**
 * Options for creating a GanttChart.
 */
export interface GanttChartOptions {
  /** Tasks to render, top to bottom in row order. */
  tasks: GanttTask[];
  /** Visual width of the time axis. Default: 8 */
  width?: number;
  /** Height of each task bar. Default: 0.4 */
  rowHeight?: number;
  /** Vertical gap between rows. Default: 0.2 */
  rowGap?: number;
  /** Bar colors. Single color applies to all, array cycles by row. Default: palette. */
  barColors?: string | readonly string[];
  /** Fill opacity of the bars. Default: 0.9 */
  barFillOpacity?: number;
  /** Stroke width of the bar outline. Default: 1.5 */
  barStrokeWidth?: number;
  /** Color for the axis, ticks and labels. Default: WHITE */
  axisColor?: string;
  /** Whether to draw the time axis line and ticks. Default: true */
  showTimeAxis?: boolean;
  /** Explicit tick values on the time axis (overrides timeTickCount). */
  timeTicks?: GanttTimeValue[];
  /** Number of evenly spaced ticks when timeTicks is not given. Default: 5 */
  timeTickCount?: number;
  /** Formatter for a tick value. Default: ISO date for Date input, else the number. */
  formatTime?: (value: number) => string;
  /** Font size for the time-axis labels. Default: 18 */
  timeLabelFontSize?: number;
  /** Whether to draw the per-row task labels. Default: true */
  showLabels?: boolean;
  /** Font size for the task labels. Default: 18 */
  labelFontSize?: number;
  /** Whether to draw dependency arrows between tasks. Default: false */
  showDependencies?: boolean;
  /** Color for the dependency arrows. Default: WHITE */
  dependencyColor?: string;
  /** Stroke width of the dependency arrows. Default: 2 */
  dependencyStrokeWidth?: number;
  /** Optional "today" marker position (number or Date). */
  today?: GanttTimeValue;
  /** Color for the today marker. Default: RED */
  todayColor?: string;
  /** Stroke width of the today marker. Default: 2 */
  todayStrokeWidth?: number;
}

/** Minimum bar width, so a zero or negative duration stays visible. */
const MIN_BAR_WIDTH = 0.05;
/** Below this x-distance a dependency arrow is skipped (it cannot render a tip). */
const MIN_ARROW_LENGTH = 1e-3;

/**
 * GanttChart - A project-timeline chart mobject.
 *
 * Each task is a horizontal bar that spans its start to its end on a shared time
 * x-axis. Each task sits on one row. Tasks that share a `row` key share a row and
 * may overlap. Optional dependency arrows point from a predecessor's end to a
 * dependent task's start. An optional "today" marker draws a vertical line.
 *
 * Time values are numbers or Dates; a Date is read through getTime(). A task
 * whose end is at or before its start keeps a minimum-width bar anchored at its
 * start, so the bar count always equals the task count.
 *
 * The chart is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const chart = new GanttChart({
 *   tasks: [
 *     { name: 'Design', start: 0, end: 3 },
 *     { name: 'Build', start: 3, end: 8, dependencies: ['Design'] },
 *   ],
 *   showDependencies: true,
 *   today: 5,
 * });
 * scene.play(new Create(chart));
 * ```
 */
export class GanttChart extends VGroup {
  /** The task bars, one per task, in task order. */
  bars: VGroup;
  /** The per-row task labels. */
  taskLabels: VGroup;
  /** The dependency arrows (empty unless showDependencies is set). */
  dependencyArrows: VGroup;
  /** The time axis line. */
  timeAxis: VMobject;
  /** The time-axis tick labels. */
  timeLabels: VGroup;
  /** The today marker, when a today value is given; otherwise null. */
  todayMarker: Line | null = null;

  protected _tasks: GanttTask[];
  protected _width: number;
  protected _rowHeight: number;
  protected _rowGap: number;
  protected _barColors: string[];
  protected _barFillOpacity: number;
  protected _barStrokeWidth: number;
  protected _axisColor: string;
  protected _showTimeAxis: boolean;
  protected _timeTicks: number[] | null;
  protected _timeTickCount: number;
  protected _formatTime: (value: number) => string;
  protected _timeLabelFontSize: number;
  protected _showLabels: boolean;
  protected _labelFontSize: number;
  protected _showDependencies: boolean;
  protected _dependencyColor: string;
  protected _dependencyStrokeWidth: number;
  protected _today: number | null;
  protected _todayColor: string;
  protected _todayStrokeWidth: number;

  protected _specs: GanttTaskSpec[];
  protected _rowKeys: string[];
  protected _timeRange: [number, number];
  protected _indexByName: Map<string, number>;
  private _usesDates: boolean;

  constructor(options: GanttChartOptions) {
    super();

    const {
      tasks,
      width = 8,
      rowHeight = 0.4,
      rowGap = 0.2,
      barColors = DEFAULT_SERIES_COLORS,
      barFillOpacity = 0.9,
      barStrokeWidth = 1.5,
      axisColor = WHITE,
      showTimeAxis = true,
      timeTicks,
      timeTickCount = 5,
      formatTime,
      timeLabelFontSize = 18,
      showLabels = true,
      labelFontSize = 18,
      showDependencies = false,
      dependencyColor = WHITE,
      dependencyStrokeWidth = 2,
      today,
      todayColor = RED,
      todayStrokeWidth = 2,
    } = options;

    this._tasks = tasks.map((task) => ({ ...task }));
    this._width = width;
    this._rowHeight = rowHeight;
    this._rowGap = rowGap;
    this._barColors = Array.isArray(barColors) ? [...barColors] : [barColors];
    this._barFillOpacity = barFillOpacity;
    this._barStrokeWidth = barStrokeWidth;
    this._axisColor = axisColor;
    this._showTimeAxis = showTimeAxis;
    this._timeTickCount = timeTickCount;
    this._timeLabelFontSize = timeLabelFontSize;
    this._showLabels = showLabels;
    this._labelFontSize = labelFontSize;
    this._showDependencies = showDependencies;
    this._dependencyColor = dependencyColor;
    this._dependencyStrokeWidth = dependencyStrokeWidth;
    this._todayColor = todayColor;
    this._todayStrokeWidth = todayStrokeWidth;

    this._usesDates = tasks.some((t) => t.start instanceof Date || t.end instanceof Date);
    this._timeTicks = timeTicks ? timeTicks.map((t) => toTimeNumber(t)) : null;
    this._today = today === undefined ? null : toTimeNumber(today);
    this._formatTime = formatTime ?? ((value: number) => this._defaultFormat(value));

    const layout = resolveGanttLayout(this._tasks, this._barColors);
    this._specs = layout.specs;
    this._rowKeys = layout.rowKeys;
    this._indexByName = new Map(this._specs.map((spec, i) => [spec.name, i]));
    this._timeRange = ganttTimeRange(this._specs);

    this.bars = new VGroup();
    this.taskLabels = new VGroup();
    this.dependencyArrows = new VGroup();
    this.timeLabels = new VGroup();

    this.timeAxis = this._createTimeAxis();
    this._createBars();
    if (this._showTimeAxis) {
      this._createTimeLabels();
    }
    if (this._showLabels) {
      this._createTaskLabels();
    }
    if (this._showDependencies) {
      this._createDependencyArrows();
    }
    if (this._today !== null) {
      this.todayMarker = this._createTodayMarker();
    }

    if (this._showTimeAxis) {
      this.add(this.timeAxis);
      this.add(this.timeLabels);
    }
    this.add(this.bars);
    this.add(this.taskLabels);
    this.add(this.dependencyArrows);
    if (this.todayMarker) {
      this.add(this.todayMarker);
    }
  }

  /** Default tick formatter: ISO date for Date input, else a trimmed number. */
  private _defaultFormat(value: number): string {
    if (this._usesDates) {
      return new Date(value).toISOString().slice(0, 10);
    }
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2).replace(/\.?0+$/, '');
  }

  /** Convert a time value to its x-coordinate on the time axis. */
  valueToX(value: GanttTimeValue): number {
    const t = toTimeNumber(value);
    const [min, max] = this._timeRange;
    const range = max - min;
    if (range === 0) return 0;
    return ((t - min) / range) * this._width;
  }

  /** Y-coordinate of the center of row `rowIndex` (row 0 is topmost). */
  rowCenterY(rowIndex: number): number {
    const slot = this._rowHeight + this._rowGap;
    const rows = this._rowKeys.length;
    return (rows - 1 - rowIndex) * slot + this._rowHeight / 2;
  }

  /** Top y-coordinate of the chart area (above the top row). */
  private _chartTop(): number {
    const rows = this._rowKeys.length;
    if (rows === 0) return this._rowHeight;
    return this.rowCenterY(0) + this._rowHeight / 2;
  }

  /** Create the horizontal time axis line below the bottom row. */
  private _createTimeAxis(): VMobject {
    const line = new VMobject();
    const y = -this._rowGap;
    const points: number[][] = [
      [0, y, 0],
      [this._width / 3, y, 0],
      [(2 * this._width) / 3, y, 0],
      [this._width, y, 0],
    ];
    line.setPoints3D(points);
    line.color = this._axisColor;
    line.strokeWidth = 2;
    return line;
  }

  /** Build one bar per task spec. */
  private _createBars(): void {
    this.bars = new VGroup();

    for (const spec of this._specs) {
      const startX = this.valueToX(spec.startValue);
      const endX = this.valueToX(spec.endValue);
      const rawWidth = endX - startX;
      const barWidth = Math.max(rawWidth, MIN_BAR_WIDTH);
      // Anchor the bar's left edge at the start so a degenerate bar stays in place.
      const centerX = startX + barWidth / 2;

      const bar = new Rectangle({
        width: barWidth,
        height: this._rowHeight,
        center: [centerX, this.rowCenterY(spec.rowIndex), 0],
        color: spec.color,
        fillOpacity: this._barFillOpacity,
        strokeWidth: this._barStrokeWidth,
      });
      this.bars.add(bar);
    }
  }

  /** Build the time-axis tick labels. */
  private _createTimeLabels(): void {
    this.timeLabels = new VGroup();
    if (this._specs.length === 0) return;

    const y = -this._rowGap - 0.3;
    for (const tick of this._tickValues()) {
      const label = new Text({
        text: this._formatTime(tick),
        fontSize: this._timeLabelFontSize,
        color: this._axisColor,
      });
      label.moveTo([this.valueToX(tick), y, 0]);
      this.timeLabels.add(label);
    }
  }

  /** The tick values along the time axis. */
  private _tickValues(): number[] {
    if (this._timeTicks) return this._timeTicks;

    const [min, max] = this._timeRange;
    const count = Math.max(2, Math.floor(this._timeTickCount));
    const ticks: number[] = [];
    for (let i = 0; i < count; i++) {
      ticks.push(min + ((max - min) * i) / (count - 1));
    }
    return ticks;
  }

  /** Build one label per row, placed to the left of the chart. */
  private _createTaskLabels(): void {
    this.taskLabels = new VGroup();

    for (let rowIndex = 0; rowIndex < this._rowKeys.length; rowIndex++) {
      const label = new Text({
        text: this._rowKeys[rowIndex],
        fontSize: this._labelFontSize,
        color: this._axisColor,
        textAlign: 'right',
      });
      label.moveTo([-0.3, this.rowCenterY(rowIndex), 0]);
      this.taskLabels.add(label);
    }
  }

  /** Build an arrow from each dependency's end to the dependent task's start. */
  private _createDependencyArrows(): void {
    this.dependencyArrows = new VGroup();

    for (const spec of this._specs) {
      const toX = this.valueToX(spec.startValue);
      const toY = this.rowCenterY(spec.rowIndex);
      for (const depName of spec.dependencies) {
        const depIndex = this._indexByName.get(depName);
        if (depIndex === undefined) continue;
        const dep = this._specs[depIndex];
        const fromX = this.valueToX(dep.endValue);
        const fromY = this.rowCenterY(dep.rowIndex);

        const dist = Math.hypot(toX - fromX, toY - fromY);
        if (dist < MIN_ARROW_LENGTH) continue;

        const arrow = new Arrow({
          start: [fromX, fromY, 0],
          end: [toX, toY, 0],
          color: this._dependencyColor,
          strokeWidth: this._dependencyStrokeWidth,
          tipLength: Math.min(0.2, dist * 0.5),
        });
        this.dependencyArrows.add(arrow);
      }
    }
  }

  /** Build the vertical today marker. */
  private _createTodayMarker(): Line {
    const x = this.valueToX(this._today as number);
    return new Line({
      start: [x, -this._rowGap, 0],
      end: [x, this._chartTop(), 0],
      color: this._todayColor,
      strokeWidth: this._todayStrokeWidth,
    });
  }

  /** Get the group of task bars. */
  getBars(): VGroup {
    return this.bars;
  }

  /** Get the bar for a task by name, or undefined when there is no such task. */
  getBar(name: string): Rectangle | undefined {
    const index = this._indexByName.get(name);
    if (index === undefined) return undefined;
    return this.bars.get(index) as Rectangle | undefined;
  }

  /** Get the group of dependency arrows (empty unless showDependencies is set). */
  getDependencyArrows(): VGroup {
    return this.dependencyArrows;
  }

  /** Get the today marker, or null when no today value was given. */
  getTodayMarker(): Line | null {
    return this.todayMarker;
  }

  /** Get the time range as [min start, max end]. */
  getTimeRange(): [number, number] {
    return [...this._timeRange];
  }

  /** Get the number of rows. */
  getRowCount(): number {
    return this._rowKeys.length;
  }

  /** Get the task definitions. */
  getTasks(): GanttTask[] {
    return this._tasks.map((task) => ({ ...task }));
  }

  /** Get the visual width of the time axis. */
  getChartWidth(): number {
    return this._width;
  }

  override copy(): GanttChart {
    const clone = new GanttChart({
      tasks: this._tasks.map((task) => ({ ...task })),
      width: this._width,
      rowHeight: this._rowHeight,
      rowGap: this._rowGap,
      barColors: [...this._barColors],
      barFillOpacity: this._barFillOpacity,
      barStrokeWidth: this._barStrokeWidth,
      axisColor: this._axisColor,
      showTimeAxis: this._showTimeAxis,
      timeTicks: this._timeTicks ? [...this._timeTicks] : undefined,
      timeTickCount: this._timeTickCount,
      formatTime: this._formatTime,
      timeLabelFontSize: this._timeLabelFontSize,
      showLabels: this._showLabels,
      labelFontSize: this._labelFontSize,
      showDependencies: this._showDependencies,
      dependencyColor: this._dependencyColor,
      dependencyStrokeWidth: this._dependencyStrokeWidth,
      today: this._today === null ? undefined : this._today,
      todayColor: this._todayColor,
      todayStrokeWidth: this._todayStrokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
