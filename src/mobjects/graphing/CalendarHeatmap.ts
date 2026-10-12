import { Group } from '../../core/Group';
import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import { WHITE } from '../../constants/colors';
import { valueToColor } from './colormap';

/** GitHub-style green contribution palette (light to dark). */
export const GITHUB_GREENS: readonly string[] = ['#9be9a8', '#40c463', '#30a14e', '#216e39'];

/** One dated value for a CalendarHeatmap. */
export interface CalendarDatum {
  /** The day, as a 'YYYY-MM-DD' string or a Date. */
  date: string | Date;
  /** The value that colors the day. */
  value: number;
}

/** The grid position of a day cell. */
export interface CellPosition {
  /** Column index (week offset from the start). */
  week: number;
  /** Row index (0..6), the weekday within the chart's week layout. */
  weekday: number;
}

/** Options for creating a CalendarHeatmap. */
export interface CalendarHeatmapOptions {
  /** The dated values. */
  data: CalendarDatum[];
  /** First day shown. Default: the earliest date in the data. */
  startDate?: string | Date;
  /** Last day shown. Default: the latest date in the data. */
  endDate?: string | Date;
  /** Side length of a day cell. Default: 0.3 */
  cellSize?: number;
  /** Gap between cells. Default: 0.06 */
  cellGap?: number;
  /** Color palette mapped across the value domain. Default: GitHub greens */
  palette?: readonly string[];
  /** Value domain [min, max] mapped across the palette. Auto-computed if omitted. */
  domain?: [number, number];
  /** Blend the palette in perceptually-uniform Oklab space. Default: false */
  useOklab?: boolean;
  /** First weekday of a column: 0 = Sunday (GitHub), 1 = Monday. Default: 0 */
  weekStartsOn?: 0 | 1;
  /** Color for days with no datum. Default: '#ebedf0' */
  emptyColor?: string;
  /** Draw month labels above the grid. Default: true */
  showMonthLabels?: boolean;
  /** Font size for month labels. Default: 16 */
  monthLabelFontSize?: number;
  /** Color for labels. Default: white */
  labelColor?: string;
}

const MS_PER_DAY = 86400000;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** UTC-midnight timestamp for a 'YYYY-MM-DD' string or Date. */
function toUtcDay(date: string | Date): number {
  if (date instanceof Date) {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

/** The 'YYYY-MM-DD' key for a UTC-midnight timestamp. */
function dayKey(ts: number): string {
  const d = new Date(ts);
  const mm = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getUTCDate()}`.padStart(2, '0');
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

/**
 * CalendarHeatmap - a GitHub-style grid of day cells colored by value.
 *
 * Weeks run as columns and weekdays as rows. Each day is a colored square;
 * days with a value are colored through the palette, and days with no datum
 * take the empty color. Month labels sit above the columns where a month
 * begins.
 *
 * @example
 * ```typescript
 * const cal = new CalendarHeatmap({
 *   data: [
 *     { date: '2024-01-01', value: 3 },
 *     { date: '2024-01-02', value: 7 },
 *   ],
 * });
 * ```
 */
export class CalendarHeatmap extends Group {
  /** The day cells. */
  cells: VGroup;
  /** The month labels. */
  monthLabels: VGroup;

  protected _cellSize: number;
  protected _cellGap: number;
  protected _palette: readonly string[];
  protected _domain: [number, number];
  protected _useOklab: boolean;
  protected _weekStartsOn: 0 | 1;
  protected _emptyColor: string;
  protected _labelColor: string;
  protected _values: Map<string, number>;
  protected _startTs: number;
  protected _endTs: number;
  /** Cell rectangle by day key. */
  protected _cellByKey: Map<string, Rectangle>;
  /** Grid position by day key. */
  protected _posByKey: Map<string, CellPosition>;

  constructor(options: CalendarHeatmapOptions) {
    super();

    const {
      data,
      startDate,
      endDate,
      cellSize = 0.3,
      cellGap = 0.06,
      palette = GITHUB_GREENS,
      domain,
      useOklab = false,
      weekStartsOn = 0,
      emptyColor = '#ebedf0',
      showMonthLabels = true,
      monthLabelFontSize = 16,
      labelColor = WHITE,
    } = options;

    this._cellSize = cellSize;
    this._cellGap = cellGap;
    this._palette = [...palette];
    this._useOklab = useOklab;
    this._weekStartsOn = weekStartsOn;
    this._emptyColor = emptyColor;
    this._labelColor = labelColor;

    this._values = new Map();
    for (const d of data) this._values.set(dayKey(toUtcDay(d.date)), d.value);

    this._domain = domain ? [...domain] : this._autoDomain(data);
    this._cellByKey = new Map();
    this._posByKey = new Map();

    const bounds = this._resolveBounds(data, startDate, endDate);
    this._startTs = bounds.start;
    this._endTs = bounds.end;

    this.cells = new VGroup();
    this.monthLabels = new VGroup();
    this._createCells();
    if (showMonthLabels) this._createMonthLabels(monthLabelFontSize);

    this.add(this.cells);
    this.add(this.monthLabels);
  }

  private _autoDomain(data: CalendarDatum[]): [number, number] {
    if (data.length === 0) return [0, 1];
    let min = Infinity;
    let max = -Infinity;
    for (const d of data) {
      if (d.value < min) min = d.value;
      if (d.value > max) max = d.value;
    }
    if (min === max) return [Math.min(0, min), max === min ? min + 1 : max];
    return [min, max];
  }

  /** The first column's start day, snapped back to the week's first weekday. */
  private _resolveBounds(
    data: CalendarDatum[],
    startDate: string | Date | undefined,
    endDate: string | Date | undefined,
  ): { start: number; end: number } {
    const days = data.map((d) => toUtcDay(d.date));
    const rawStart = startDate !== undefined ? toUtcDay(startDate) : Math.min(...days);
    const rawEnd = endDate !== undefined ? toUtcDay(endDate) : Math.max(...days);
    if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) {
      // No data and no explicit range: an empty grid (end before start).
      const today = toUtcDay(new Date());
      return { start: today, end: today - MS_PER_DAY };
    }
    const start = rawStart - this._weekdayOf(rawStart) * MS_PER_DAY;
    return { start, end: Math.max(rawEnd, rawStart) };
  }

  /** The weekday row (0..6) of a day, honoring weekStartsOn. */
  private _weekdayOf(ts: number): number {
    const dow = new Date(ts).getUTCDay();
    return (dow - this._weekStartsOn + 7) % 7;
  }

  /** The grid position of a day timestamp. */
  private _positionOf(ts: number): CellPosition {
    const week = Math.floor((ts - this._startTs) / MS_PER_DAY / 7);
    return { week, weekday: this._weekdayOf(ts) };
  }

  /** The cell center in local space for a grid position. */
  private _centerOf(pos: CellPosition): [number, number, number] {
    const pitch = this._cellSize + this._cellGap;
    return [pos.week * pitch, -pos.weekday * pitch, 0];
  }

  private _createCells(): void {
    this.cells = new VGroup();
    if (this._endTs < this._startTs) return;
    for (let ts = this._startTs; ts <= this._endTs; ts += MS_PER_DAY) {
      const key = dayKey(ts);
      const pos = this._positionOf(ts);
      const value = this._values.get(key);
      const color =
        value === undefined
          ? this._emptyColor
          : valueToColor(value, this._domain[0], this._domain[1], this._palette, this._useOklab);
      const cell = new Rectangle({
        width: this._cellSize,
        height: this._cellSize,
        center: this._centerOf(pos),
        color,
        fillOpacity: 1,
        strokeWidth: 0,
      });
      this._cellByKey.set(key, cell);
      this._posByKey.set(key, pos);
      this.cells.add(cell);
    }
  }

  private _createMonthLabels(fontSize: number): void {
    this.monthLabels = new VGroup();
    const pitch = this._cellSize + this._cellGap;
    let lastMonth = -1;
    let lastWeek = -1;
    for (let ts = this._startTs; ts <= this._endTs; ts += MS_PER_DAY) {
      const pos = this._positionOf(ts);
      const month = new Date(ts).getUTCMonth();
      if (month !== lastMonth && pos.week !== lastWeek) {
        const label = new Text({
          text: MONTH_NAMES[month],
          fontSize,
          color: this._labelColor,
        });
        label.moveTo([pos.week * pitch, this._cellSize + pitch, 0]);
        this.monthLabels.add(label);
        lastMonth = month;
        lastWeek = pos.week;
      }
    }
  }

  /** The value domain [min, max] mapped across the palette. */
  getDomain(): [number, number] {
    return [...this._domain];
  }

  /** The number of day cells drawn. */
  getNumCells(): number {
    return this.cells.children.length;
  }

  /** The cell rectangle for a date, or undefined when outside the range. */
  getCell(date: string | Date): Rectangle | undefined {
    return this._cellByKey.get(dayKey(toUtcDay(date)));
  }

  /** The grid position (week, weekday) of a date. */
  cellPosition(date: string | Date): CellPosition {
    return this._positionOf(toUtcDay(date));
  }

  /** The color the map assigns to a value. */
  colorForValue(value: number): string {
    return valueToColor(value, this._domain[0], this._domain[1], this._palette, this._useOklab);
  }

  override copy(): CalendarHeatmap {
    const data: CalendarDatum[] = [];
    for (const [key, value] of this._values) data.push({ date: key, value });
    const copy = new CalendarHeatmap({
      data,
      startDate: dayKey(this._startTs),
      endDate: dayKey(this._endTs),
      cellSize: this._cellSize,
      cellGap: this._cellGap,
      palette: [...this._palette],
      domain: [...this._domain],
      useOklab: this._useOklab,
      weekStartsOn: this._weekStartsOn,
      emptyColor: this._emptyColor,
      labelColor: this._labelColor,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
