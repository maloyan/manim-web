import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Rectangle } from '../geometry/Rectangle';
import { Sector } from '../geometry/Sector';
import { AnnularSector } from '../geometry/AnnularSector';
import { Text } from '../text/Text';
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

/** Default color cycle for pie/donut slices. */
const DEFAULT_SLICE_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/** Full turn in radians. */
const TAU = Math.PI * 2;

/**
 * Geometry of one slice, derived from the data.
 * Non-positive values are skipped, so `index` is the position in the
 * original `values` array and is not always contiguous.
 */
export interface SliceGeometry {
  /** Index of this value in the original `values` array. */
  index: number;
  /** The (positive) data value for this slice. */
  value: number;
  /** Fraction of the total this slice occupies, in [0, 1]. */
  fraction: number;
  /** Start angle of the slice sweep, in radians. */
  startAngle: number;
  /** Sweep angle of the slice, in radians (proportional to the value). */
  angle: number;
}

/**
 * Compute the sweep angles for a set of values.
 *
 * Each positive value gets a sweep angle proportional to `value / total`.
 * Non-positive values (zero and negative) are skipped and get no slice.
 * The returned slices sweep counterclockwise from `startAngle`, in the order
 * of the input array.
 *
 * @param values - The raw data values.
 * @param startAngle - Angle of the first slice edge, in radians.
 * @returns One SliceGeometry per positive value. Empty array if the total is 0.
 */
export function computeSliceGeometry(values: number[], startAngle: number): SliceGeometry[] {
  const positive = values
    .map((value, index) => ({ value, index }))
    .filter((entry) => entry.value > 0);

  const total = positive.reduce((sum, entry) => sum + entry.value, 0);
  if (total <= 0) return [];

  const slices: SliceGeometry[] = [];
  let currentAngle = startAngle;

  for (const entry of positive) {
    const fraction = entry.value / total;
    const angle = fraction * TAU;
    slices.push({
      index: entry.index,
      value: entry.value,
      fraction,
      startAngle: currentAngle,
      angle,
    });
    currentAngle += angle;
  }

  return slices;
}

/** How slice labels are placed relative to the slice. */
export type LabelPosition = 'inside' | 'outside';

/**
 * Options shared by PieChart and DonutChart.
 */
export interface PieChartOptions {
  /** Data values. One slice per positive value. Default: required. */
  values: number[];
  /** Text label for each value (by original index). Default: []. */
  labels?: string[];
  /** Slice colors. Single color applies to all, array cycles. Default: Manim palette. */
  colors?: string | string[];
  /** Angle of the first slice edge, in radians. Default: Math.PI / 2 (12 o'clock). */
  startAngle?: number;
  /** Outer radius of the chart. Default: 2. */
  radius?: number;
  /** Fill opacity of the slices. Default: 0.8. */
  fillOpacity?: number;
  /** Stroke color drawn between slices. Default: WHITE. */
  strokeColor?: string;
  /** Stroke width drawn between slices. Default: 2. */
  strokeWidth?: number;
  /** Whether to draw text labels on the slices. Default: true when labels are given. */
  showLabels?: boolean;
  /** Whether to append the percentage to each label. Default: false. */
  showPercentages?: boolean;
  /** Font size for slice labels. Default: 24. */
  labelFontSize?: number;
  /** Place labels 'inside' the slices or 'outside' the rim. Default: 'outside'. */
  labelPosition?: LabelPosition;
  /** Whether to draw a legend of label swatches. Default: false. */
  showLegend?: boolean;
  /** Font size for legend labels. Default: 18. */
  legendFontSize?: number;
}

/**
 * PieChart - a data-to-pie visualization mobject.
 *
 * Builds a VGroup of {@link Sector}s whose sweep angles are proportional to
 * each value divided by the total. Non-positive values are skipped, a single
 * value fills the whole circle, and empty data yields an empty group.
 *
 * @example
 * ```typescript
 * const pie = new PieChart({
 *   values: [30, 20, 50],
 *   labels: ['A', 'B', 'C'],
 *   showPercentages: true,
 * });
 * pie.getSlice(0); // the first Sector
 * ```
 */
export class PieChart extends VGroup {
  /** The slice sectors. */
  slices: VGroup;
  /** The slice labels. */
  labelGroup: VGroup;
  /** The legend, when enabled. */
  legend: VGroup | null = null;

  protected _values: number[];
  protected _labelTexts: string[];
  protected _colors: string[];
  protected _startAngle: number;
  protected _radius: number;
  protected _fillOpacity: number;
  protected _strokeColor: string;
  protected _strokeWidth: number;
  protected _showLabels: boolean;
  protected _showPercentages: boolean;
  protected _labelFontSize: number;
  protected _labelPosition: LabelPosition;
  protected _showLegend: boolean;
  protected _legendFontSize: number;
  protected _geometry: SliceGeometry[];

  constructor(options: PieChartOptions) {
    super();

    const {
      values,
      labels = [],
      colors = DEFAULT_SLICE_COLORS,
      startAngle = Math.PI / 2,
      radius = 2,
      fillOpacity = 0.8,
      strokeColor = WHITE,
      strokeWidth = 2,
      showLabels = labels.length > 0,
      showPercentages = false,
      labelFontSize = 24,
      labelPosition = 'outside',
      showLegend = false,
      legendFontSize = 18,
    } = options;

    this._values = [...values];
    this._labelTexts = [...labels];
    this._colors = Array.isArray(colors) ? [...colors] : [colors];
    this._startAngle = startAngle;
    this._radius = radius;
    this._fillOpacity = fillOpacity;
    this._strokeColor = strokeColor;
    this._strokeWidth = strokeWidth;
    this._showLabels = showLabels;
    this._showPercentages = showPercentages;
    this._labelFontSize = labelFontSize;
    this._labelPosition = labelPosition;
    this._showLegend = showLegend;
    this._legendFontSize = legendFontSize;

    this._geometry = computeSliceGeometry(this._values, this._startAngle);

    this.slices = new VGroup();
    this.labelGroup = new VGroup();

    this._buildSlices();
    this.add(this.slices);

    if (this._showLabels) {
      this._buildLabels();
      this.add(this.labelGroup);
    }

    if (this._showLegend) {
      this.legend = this._buildLegend();
      this.add(this.legend);
    }
  }

  /**
   * Create one slice mobject. Overridden by DonutChart to use AnnularSector.
   * @param geom - The slice geometry.
   * @param color - The slice fill color.
   * @returns A Sector sweeping the slice.
   */
  protected _makeSlice(geom: SliceGeometry, color: string): VMobject {
    const sector = new Sector({
      radius: this._radius,
      startAngle: geom.startAngle,
      angle: geom.angle,
      color,
      fillOpacity: this._fillOpacity,
      strokeWidth: this._strokeWidth,
    });
    sector.strokeColor = this._strokeColor;
    return sector;
  }

  /** Color for the slice at the given original value index. */
  protected _colorForIndex(index: number): string {
    return this._colors[index % this._colors.length];
  }

  /** Build all slice sectors into `this.slices`. */
  protected _buildSlices(): void {
    this.slices = new VGroup();
    for (const geom of this._geometry) {
      const slice = this._makeSlice(geom, this._colorForIndex(geom.index));
      this.slices.add(slice);
    }
  }

  /** Radius at which to place a label for the given position mode. */
  protected _labelRadius(): number {
    return this._labelPosition === 'inside' ? this._radius * 0.6 : this._radius * 1.15;
  }

  /** Build the slice labels into `this.labelGroup`. */
  protected _buildLabels(): void {
    this.labelGroup = new VGroup();
    const labelRadius = this._labelRadius();

    for (const geom of this._geometry) {
      const text = this._labelText(geom);
      if (text.length === 0) continue;

      const midAngle = geom.startAngle + geom.angle / 2;
      const x = labelRadius * Math.cos(midAngle);
      const y = labelRadius * Math.sin(midAngle);

      const label = new Text({
        text,
        fontSize: this._labelFontSize,
        color: WHITE,
      });
      label.moveTo([x, y, 0]);
      this.labelGroup.add(label);
    }
  }

  /** Compose the label text for a slice (name and/or percentage). */
  protected _labelText(geom: SliceGeometry): string {
    const name = this._labelTexts[geom.index] ?? '';
    if (!this._showPercentages) return name;

    const percent = `${Math.round(geom.fraction * 100)}%`;
    return name.length > 0 ? `${name} ${percent}` : percent;
  }

  /** Build the legend into a new VGroup. */
  protected _buildLegend(): VGroup {
    const legend = new VGroup();
    const legendX = this._radius * 1.4;
    const legendTop = this._radius * 0.8;
    const itemHeight = 0.4;

    for (const geom of this._geometry) {
      const name = this._labelTexts[geom.index];
      if (name === undefined || name.length === 0) continue;

      const y = legendTop - legend.length * 0.5 * itemHeight;
      const swatch = new Rectangle({
        width: 0.3,
        height: 0.2,
        center: [legendX, y, 0],
        color: this._colorForIndex(geom.index),
        fillOpacity: this._fillOpacity,
        strokeWidth: 1,
      });

      const label = new Text({
        text: name,
        fontSize: this._legendFontSize,
        color: WHITE,
        textAlign: 'left',
      });
      label.moveTo([legendX + 0.35, y, 0]);

      legend.add(swatch);
      legend.add(label);
    }

    return legend;
  }

  /** Get all slice sectors. */
  getSectors(): VMobject[] {
    return this.slices.getChildrenAs<VMobject>();
  }

  /**
   * Get a single slice sector by position.
   * @param index - Position in the slice list (not the original value index).
   * @returns The sector, or undefined when out of range.
   */
  getSlice(index: number): VMobject | undefined {
    return this.slices.get(index);
  }

  /** Get the slice geometry (angles and fractions) for all slices. */
  getSliceGeometry(): SliceGeometry[] {
    return this._geometry.map((geom) => ({ ...geom }));
  }

  /** Get the original data values. */
  getValues(): number[] {
    return [...this._values];
  }

  /** Get the outer radius. */
  getRadius(): number {
    return this._radius;
  }

  override copy(): PieChart {
    const copy = new PieChart(this._optionsForCopy());
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }

  /** Options bundle used to reconstruct this chart in copy(). */
  protected _optionsForCopy(): PieChartOptions {
    return {
      values: [...this._values],
      labels: [...this._labelTexts],
      colors: [...this._colors],
      startAngle: this._startAngle,
      radius: this._radius,
      fillOpacity: this._fillOpacity,
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      showLabels: this._showLabels,
      showPercentages: this._showPercentages,
      labelFontSize: this._labelFontSize,
      labelPosition: this._labelPosition,
      showLegend: this._showLegend,
      legendFontSize: this._legendFontSize,
    };
  }
}

/**
 * Options for DonutChart. Adds the hole radius to {@link PieChartOptions}.
 */
export interface DonutChartOptions extends PieChartOptions {
  /**
   * Hole radius as a fraction of the outer radius, in [0, 1).
   * Default: 0.5. A value of 0 makes a full pie.
   */
  innerRadius?: number;
}

/**
 * DonutChart - a PieChart with a hole in the middle.
 *
 * Builds a VGroup of {@link AnnularSector}s. The slice-angle logic is shared
 * with {@link PieChart}; only the slice shape differs. `innerRadius` is a
 * fraction of the outer radius, in [0, 1).
 *
 * @example
 * ```typescript
 * const donut = new DonutChart({ values: [1, 2, 3], innerRadius: 0.5 });
 * ```
 */
export class DonutChart extends PieChart {
  protected _innerRadiusFraction: number;

  constructor(options: DonutChartOptions) {
    // Clamp the fraction into [0, 1) before any slice is built. The base
    // constructor calls _makeSlice(), so the field must be set first; the
    // parameter property default handles the pre-super read.
    super(options);
    this._innerRadiusFraction = DonutChart._clampFraction(options.innerRadius);
    // The base constructor built annular sectors with the default fraction,
    // because the real fraction is not known until after super(). Rebuild now.
    this._rebuildSlicesAsDonut();
  }

  private static _clampFraction(value: number | undefined): number {
    const fraction = value ?? 0.5;
    if (fraction < 0) return 0;
    if (fraction >= 1) return 0.99;
    return fraction;
  }

  /** Absolute inner (hole) radius in scene units. */
  getInnerRadius(): number {
    return this._radius * this._innerRadiusFraction;
  }

  /** Inner radius as a fraction of the outer radius. */
  getInnerRadiusFraction(): number {
    return this._innerRadiusFraction;
  }

  /** Replace the pie sectors built by the base constructor with annular sectors. */
  private _rebuildSlicesAsDonut(): void {
    this.remove(this.slices);
    this._buildSlices();
    // Keep the slices behind labels/legend by adding first, then re-adding others.
    this.add(this.slices);
    if (this.labelGroup.length > 0) {
      this.remove(this.labelGroup);
      this.add(this.labelGroup);
    }
    if (this.legend) {
      this.remove(this.legend);
      this.add(this.legend);
    }
  }

  protected override _makeSlice(geom: SliceGeometry, color: string): VMobject {
    // During the base constructor, _innerRadiusFraction is undefined; fall back
    // to the default so the first (discarded) build does not throw.
    const fraction = this._innerRadiusFraction ?? 0.5;
    const sector = new AnnularSector({
      innerRadius: this._radius * fraction,
      outerRadius: this._radius,
      startAngle: geom.startAngle,
      angle: geom.angle,
      color,
      fillOpacity: this._fillOpacity,
      strokeWidth: this._strokeWidth,
    });
    sector.strokeColor = this._strokeColor;
    return sector;
  }

  override copy(): DonutChart {
    const copy = new DonutChart({
      ...this._optionsForCopy(),
      innerRadius: this._innerRadiusFraction,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
