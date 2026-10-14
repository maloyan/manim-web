/**
 * RamachandranPlot - the φ/ψ backbone-torsion scatter plot of structural biology.
 *
 * A Ramachandran plot validates a protein backbone conformation by plotting each
 * residue's two torsion angles, φ (phi) and ψ (psi), on a plane that spans
 * `[-180, 180]` on both axes. Clusters mark the allowed backbone conformations
 * (right-handed α-helix, β-sheet, left-handed α-helix). It complements the 3D
 * {@link Protein} / molecular drug-visualization module with a 2D diagnostic.
 *
 * The plot accepts either explicit `points` (`{ phi, psi, residue? }`) or a list
 * of `residues` carrying backbone N/CA/C atoms (as {@link parsePdb} now returns),
 * from which it computes φ/ψ per residue.
 *
 * @example
 * ```typescript
 * const { residues } = parsePdb(pdbText);
 * const plot = new RamachandranPlot({ residues, showAllowedRegions: true });
 * scene.add(plot);
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Dot } from '../geometry/Dot';
import { Polygon } from '../geometry/Polygon';
import { Axes } from '../graphing/Axes';
import { residueColor } from '../biology/biologyColors';
import { ResidueCA } from './pdb';
import {
  RamachandranPoint,
  RamachandranRegion,
  RAMACHANDRAN_REGIONS,
  computeRamachandran,
  regionFor,
} from './ramachandran';

/** How the plotted dots are colored. */
export type RamachandranColorBy = 'uniform' | 'residue' | 'region';

/** Options for a {@link RamachandranPlot}. */
export interface RamachandranPlotOptions {
  /**
   * Explicit φ/ψ points. Takes precedence over `residues`. Each `phi` and `psi`
   * must be a finite number, or the constructor throws.
   */
  points?: RamachandranPoint[];
  /**
   * Residues in chain order with backbone `n`, `ca` and `c` atoms. The plot
   * computes φ/ψ per residue; a residue missing a backbone atom is skipped.
   */
  residues?: ResidueCA[];
  /** The dot color for `colorBy: 'uniform'`. Default: `'#4cc9f0'`. */
  dotColor?: string;
  /** The dot radius. Default: 0.05. */
  dotRadius?: number;
  /** How to color the dots. Default: `'uniform'`. */
  colorBy?: RamachandranColorBy;
  /** Draw the simplified allowed-region outlines behind the dots. Default: false. */
  showAllowedRegions?: boolean;
  /** The allowed regions to draw / classify by. Default: {@link RAMACHANDRAN_REGIONS}. */
  regions?: readonly RamachandranRegion[];
  /** Fill opacity for the region outlines. Default: 0.18. */
  regionFillOpacity?: number;
  /** The color for outlier dots in `colorBy: 'region'`. Default: `'#888888'`. */
  outlierColor?: string;
  /** Per-code residue color overrides for `colorBy: 'residue'`. */
  residueColors?: Record<string, string>;
  /** Visual length of each axis. Default: 6. */
  axisLength?: number;
  /** The axes color. Default: `'#ffffff'`. */
  axisColor?: string;
}

/** The default dot color (a cyan that reads on a dark scene). */
const DEFAULT_DOT_COLOR = '#4cc9f0';

/** A Ramachandran-specific residue coloring that marks glycine and proline. */
const GLYCINE_COLOR = '#f28e2b';
const PROLINE_COLOR = '#76b7b2';

/** The fully resolved options, with every default applied. */
interface ResolvedOptions {
  dotColor: string;
  dotRadius: number;
  colorBy: RamachandranColorBy;
  showAllowedRegions: boolean;
  regions: readonly RamachandranRegion[];
  regionFillOpacity: number;
  outlierColor: string;
  residueColors: Record<string, string>;
  axisLength: number;
  axisColor: string;
}

/** Apply every default so the constructor stays simple. */
function resolveOptions(options: RamachandranPlotOptions): ResolvedOptions {
  return {
    dotColor: options.dotColor ?? DEFAULT_DOT_COLOR,
    dotRadius: options.dotRadius ?? 0.05,
    colorBy: options.colorBy ?? 'uniform',
    showAllowedRegions: options.showAllowedRegions ?? false,
    regions: options.regions ?? RAMACHANDRAN_REGIONS,
    regionFillOpacity: options.regionFillOpacity ?? 0.18,
    outlierColor: options.outlierColor ?? '#888888',
    residueColors: { ...(options.residueColors ?? {}) },
    axisLength: options.axisLength ?? 6,
    axisColor: options.axisColor ?? '#ffffff',
  };
}

/**
 * Resolve the φ/ψ points from the options, computing them from residues when no
 * explicit points are given.
 *
 * @throws If `points` is given but a point has a non-finite φ or ψ.
 */
function resolvePoints(options: RamachandranPlotOptions): RamachandranPoint[] {
  if (options.points !== undefined) {
    if (!Array.isArray(options.points)) {
      throw new Error('RamachandranPlot: `points` must be an array of { phi, psi } objects.');
    }
    options.points.forEach((p, i) => {
      if (!p || !Number.isFinite(p.phi) || !Number.isFinite(p.psi)) {
        throw new Error(
          `RamachandranPlot: point ${i} has a non-finite phi/psi; both must be finite numbers.`,
        );
      }
    });
    return options.points.map((p) => ({ ...p }));
  }
  if (options.residues !== undefined) {
    if (!Array.isArray(options.residues)) {
      throw new Error(
        'RamachandranPlot: `residues` must be an array of residues with backbone atoms.',
      );
    }
    return computeRamachandran(options.residues);
  }
  return [];
}

/**
 * A φ/ψ scatter plot on `[-180, 180]` axes, with optional allowed-region
 * outlines. Extends {@link VGroup}; holds the axes, the region outlines and the
 * dots as sub-mobjects.
 */
export class RamachandranPlot extends VGroup {
  /** The coordinate system (φ on x, ψ on y), spanning `[-180, 180]`. */
  readonly axes: Axes;
  /** The allowed-region outlines (empty when `showAllowedRegions` is false). */
  readonly regions: VGroup;
  /** The plotted dots, one per φ/ψ point. */
  readonly dots: VGroup;
  /** The resolved φ/ψ points. */
  private readonly _points: RamachandranPoint[];
  private readonly _opts: ResolvedOptions;

  constructor(options: RamachandranPlotOptions = {}) {
    super();

    this._opts = resolveOptions(options);
    this._points = resolvePoints(options);

    this.axes = new Axes({
      xRange: [-180, 180, 90],
      yRange: [-180, 180, 90],
      xLength: this._opts.axisLength,
      yLength: this._opts.axisLength,
      color: this._opts.axisColor,
      tips: false,
    });
    this.axes.addCoordinates();
    this.axes.add(this.axes.getAxisLabels({ xLabel: '\\phi', yLabel: '\\psi' }));

    this.regions = this._buildRegions();
    this.dots = this._buildDots();

    // Draw order: regions behind, axes, then dots on top.
    this.add(this.regions);
    this.add(this.axes);
    this.add(this.dots);
  }

  /** Build the region outlines, or an empty group when they are disabled. */
  private _buildRegions(): VGroup {
    const group = new VGroup();
    if (!this._opts.showAllowedRegions) {
      return group;
    }
    for (const region of this._opts.regions) {
      const vertices = region.vertices.map((v) => this.axes.coordsToPoint(v[0], v[1]));
      group.add(
        new Polygon({
          vertices,
          color: region.color,
          fillOpacity: this._opts.regionFillOpacity,
          strokeWidth: 2,
        }),
      );
    }
    return group;
  }

  /** Build one dot per φ/ψ point, colored per the active color mode. */
  private _buildDots(): VGroup {
    const group = new VGroup();
    this._points.forEach((point, index) => {
      group.add(
        new Dot({
          point: this.axes.coordsToPoint(point.phi, point.psi),
          radius: this._opts.dotRadius,
          color: this.colorForPoint(index),
          strokeWidth: 0,
        }),
      );
    });
    return group;
  }

  /**
   * The resolved color for the point at `index`, per the active color mode.
   *
   * @param index - The point index.
   * @returns The hex color string.
   */
  colorForPoint(index: number): string {
    if (index < 0 || index >= this._points.length) {
      throw new Error(
        `RamachandranPlot.colorForPoint: index ${index} is out of range (0 to ${this._points.length - 1}).`,
      );
    }
    const point = this._points[index];
    switch (this._opts.colorBy) {
      case 'uniform':
        return this._opts.dotColor;
      case 'residue':
        return this._residueColor(point);
      case 'region':
        return this._regionColor(point);
      default:
        throw new Error(`RamachandranPlot: unknown colorBy "${String(this._opts.colorBy)}".`);
    }
  }

  /**
   * The residue color for a point. Glycine and proline get distinct colors
   * (they occupy special Ramachandran regions); every other residue uses the
   * shared {@link residueColor} palette. Overrides win by code.
   */
  private _residueColor(point: RamachandranPoint): string {
    const code = (point.residue ?? '').trim().toUpperCase();
    const overrides = this._opts.residueColors;
    if (overrides[code] !== undefined) {
      return overrides[code];
    }
    if (code === 'G') {
      return GLYCINE_COLOR;
    }
    if (code === 'P') {
      return PROLINE_COLOR;
    }
    return residueColor(code, overrides);
  }

  /** The region color for a point, or the outlier color when outside all regions. */
  private _regionColor(point: RamachandranPoint): string {
    const name = regionFor(point.phi, point.psi, this._opts.regions);
    if (name === null) {
      return this._opts.outlierColor;
    }
    const region = this._opts.regions.find((r) => r.name === name);
    return region?.color ?? this._opts.outlierColor;
  }

  /** The number of plotted points. */
  getPointCount(): number {
    return this._points.length;
  }

  /** The resolved φ/ψ points (a defensive copy). */
  getPlotPoints(): RamachandranPoint[] {
    return this._points.map((p) => ({ ...p }));
  }

  /** The coordinate system. */
  getAxes(): Axes {
    return this.axes;
  }

  /** The region-outline group (empty when regions are disabled). */
  getRegions(): VGroup {
    return this.regions;
  }

  /** The dot group. */
  getDots(): VGroup {
    return this.dots;
  }

  /** A single dot by point index, or undefined when out of range. */
  getDot(index: number): Dot | undefined {
    return this.dots.get(index) as Dot | undefined;
  }
}
