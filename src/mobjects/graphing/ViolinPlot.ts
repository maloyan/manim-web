import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { Polygon } from '../geometry/Polygon';
import { Axes } from './Axes';
import { kde, extent, niceAxisRange } from './stats';
import { normalizeGroups, type PlotOrientation } from './BoxPlot';
import { BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD } from '../../constants/colors';

/** Default color cycle for the violins. */
const DEFAULT_VIOLIN_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/** The sampled KDE for one violin group. */
export interface ViolinDensity {
  /** Value-axis positions where the density was sampled, low to high. */
  values: number[];
  /** Estimated density at each value. */
  densities: number[];
  /** Half-width of the violin at each value, in category units. */
  halfWidths: number[];
}

/** Options for creating a ViolinPlot. */
export interface ViolinPlotOptions {
  /** One data group (number[]) or several groups (number[][]). */
  data: number[] | number[][];
  /** KDE bandwidth. Default: Silverman's rule of thumb per group. */
  bandwidth?: number;
  /** Lay violins along the x-axis ('vertical') or y-axis ('horizontal'). Default: 'vertical' */
  orientation?: PlotOrientation;
  /** Violin color, or a per-group color array. Default: Manim color palette */
  colors?: string | string[];
  /** Fill opacity for the violins. Default: 0.5 */
  fillOpacity?: number;
  /** Stroke width for the violin outline. Default: 2 */
  strokeWidth?: number;
  /** Number of KDE samples along the value axis per group. Default: 48 */
  resolution?: number;
  /** Maximum half-width of a violin in category units. Default: 0.4 */
  widthScale?: number;
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
 * ViolinPlot - a mirrored kernel-density shape per data group.
 *
 * Each group estimates a Gaussian KDE over its value range and draws a shape
 * that is symmetric about the group's category line. The widest part of the
 * violin sits at the densest value (the mode). Groups sit side by side along
 * the category axis.
 *
 * @example
 * ```typescript
 * const violin = new ViolinPlot({
 *   data: [[1, 2, 2, 3, 3, 3, 4, 4, 5], [2, 3, 3, 4]],
 *   bandwidth: 0.5,
 * });
 * ```
 */
export class ViolinPlot extends Group {
  /** The coordinate system the violins are drawn on. */
  axes: Axes;

  protected _groupsData: number[][];
  protected _orientation: PlotOrientation;
  protected _densities: ViolinDensity[] = [];
  protected _violins: (Polygon | null)[] = [];

  constructor(options: ViolinPlotOptions) {
    super();

    const {
      data,
      bandwidth,
      orientation = 'vertical',
      colors = DEFAULT_VIOLIN_COLORS,
      fillOpacity = 0.5,
      strokeWidth = 2,
      resolution = 48,
      widthScale = 0.4,
      axes,
      xLength = 8,
      yLength = 6,
      axisColor = '#ffffff',
    } = options;

    this._groupsData = normalizeGroups(data);
    this._orientation = orientation;

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
      const density = this._sampleDensity(this._groupsData[i], resolution, widthScale, bandwidth);
      this._densities.push(density);
      const violin = this._buildViolin(i, density, colorList[i % colorList.length], {
        fillOpacity,
        strokeWidth,
      });
      this._violins.push(violin);
      if (violin) this.add(violin);
    }
  }

  /** Padded value range covering every data value across all groups. */
  private _valueRange(): [number, number, number] {
    const [min, max] = extent(this._groupsData.flat());
    return niceAxisRange(min, max);
  }

  /** Sample the KDE of one group over its value range. */
  private _sampleDensity(
    group: number[],
    resolution: number,
    widthScale: number,
    bandwidth?: number,
  ): ViolinDensity {
    const values: number[] = [];
    const densities: number[] = [];
    const halfWidths: number[] = [];
    if (group.length === 0) return { values, densities, halfWidths };

    const [min, max] = extent(group);
    const estimate = kde(group, bandwidth !== undefined ? { bandwidth } : {});
    const steps = Math.max(2, Math.floor(resolution));
    const lo = min === max ? min - 0.5 : min;
    const hi = min === max ? max + 0.5 : max;
    const dx = (hi - lo) / (steps - 1);

    let peak = 0;
    for (let i = 0; i < steps; i++) {
      const value = lo + i * dx;
      const density = estimate(value);
      values.push(value);
      densities.push(density);
      if (density > peak) peak = density;
    }
    // Normalize the half-width so the densest point reaches widthScale.
    for (const density of densities) {
      halfWidths.push(peak > 0 ? (density / peak) * widthScale : 0);
    }
    return { values, densities, halfWidths };
  }

  /** Map a (category, value) pair to a world point, respecting orientation. */
  private _toPoint(category: number, value: number): Vector3Tuple {
    return this._orientation === 'vertical'
      ? this.axes.coordsToPoint(category, value)
      : this.axes.coordsToPoint(value, category);
  }

  /** Build the mirrored KDE polygon for one group. */
  private _buildViolin(
    index: number,
    density: ViolinDensity,
    color: string,
    style: { fillOpacity: number; strokeWidth: number },
  ): Polygon | null {
    if (density.values.length < 2) return null;

    const vertices: Vector3Tuple[] = [];
    // Right side, low value to high value.
    for (let i = 0; i < density.values.length; i++) {
      vertices.push(this._toPoint(index + density.halfWidths[i], density.values[i]));
    }
    // Left side, high value back to low value (mirror image).
    for (let i = density.values.length - 1; i >= 0; i--) {
      vertices.push(this._toPoint(index - density.halfWidths[i], density.values[i]));
    }

    return new Polygon({
      vertices,
      color,
      fillOpacity: style.fillOpacity,
      strokeWidth: style.strokeWidth,
      closed: true,
    });
  }

  /** Get the coordinate system. */
  getAxes(): Axes {
    return this.axes;
  }

  /** Get the sampled KDE for one group. */
  getDensity(index: number): ViolinDensity {
    const density = this._densities[index];
    return {
      values: [...density.values],
      densities: [...density.densities],
      halfWidths: [...density.halfWidths],
    };
  }

  /** Get the violin polygon for one group, or null when the group is empty. */
  getViolin(index: number): Polygon | null {
    return this._violins[index] ?? null;
  }

  /** The number of data groups. */
  get numGroups(): number {
    return this._groupsData.length;
  }

  override copy(): ViolinPlot {
    const copy = new ViolinPlot({
      data: this._groupsData.map((group) => [...group]),
      orientation: this._orientation,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
