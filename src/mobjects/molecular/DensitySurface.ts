/**
 * DensitySurface - a 3D isosurface extracted from a scalar density grid.
 *
 * A density grid is a flat array of scalar samples on a regular 3D lattice: a
 * cryo-EM map, an electron-density map, or any volumetric field. DensitySurface
 * is a {@link Group} that holds one {@link ImplicitSurface}: it wraps the grid in
 * a trilinear-interpolating sampler `f(x, y, z)` and lets marching cubes extract
 * the level set `f = isoValue` over the grid's world bounding box.
 *
 * ## The grid
 *
 * The grid is cell-centered. Voxel `(i, j, k)` has its center at world position
 *
 * ```
 * origin + (i + 0.5, j + 0.5, k + 0.5) * spacing
 * ```
 *
 * so each voxel occupies a cell of size `spacing`, and the whole grid spans the
 * world box `[origin, origin + dims * spacing]`. Values are stored flat with
 * index `x + nx * (y + ny * z)` (x fastest), matching the common C-order of map
 * files.
 *
 * ## The sampler (trilinear, bounded)
 *
 * The sampler maps a world point to continuous voxel-center coordinates
 * `v = (p - origin) / spacing - 0.5`, then trilinearly interpolates the eight
 * surrounding grid values. At a voxel center `v` is an integer, so the sampler
 * returns that voxel's value exactly; between centers it interpolates.
 *
 * Outside the voxel-center lattice (any axis `v < 0` or `v > dim - 1`) the
 * sampler returns the grid's minimum value. For a density map the minimum is the
 * background (near 0), which is below a positive iso value. This keeps the field
 * low at the box faces, so the isosurface closes inside the box and never shuts
 * against a box face. {@link MolecularSurface} documents the same box-blob
 * failure for a field that stays above its threshold across the whole box; a
 * field that drops to the background at the lattice edge avoids it.
 *
 * ## The iso value
 *
 * The default iso value is `0.5 * max(values)`, half the peak density. This is a
 * common first choice for an electron-density or cryo-EM isosurface: it sits
 * between the background (low) and the peak, so the surface wraps the dense core.
 * Pass an explicit `isoValue` to carve the map tighter (higher) or looser
 * (lower).
 *
 * @example
 * ```typescript
 * const surface = new DensitySurface({
 *   grid: { values, dims: [64, 64, 64], origin: [-16, -16, -16], spacing: [0.5, 0.5, 0.5] },
 *   isoValue: 1.2,
 *   opacity: 0.6,
 * });
 * scene.add(surface);
 * ```
 */

import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { ImplicitSurface } from '../three-d/ImplicitSurface';

/** A scalar density sampled on a regular 3D grid. */
export interface DensityGrid {
  /** Flat sample array, length `nx * ny * nz`, index `x + nx * (y + ny * z)`. */
  values: number[];
  /** Grid size per axis `[nx, ny, nz]`. Each must be a positive integer. */
  dims: [number, number, number];
  /** World position of voxel `(0, 0, 0)`'s center. Default: `[0, 0, 0]`. */
  origin?: Vector3Tuple;
  /** World size of one voxel step per axis. Default: `[1, 1, 1]`. */
  spacing?: Vector3Tuple;
}

/** Options for a {@link DensitySurface}. */
export interface DensitySurfaceOptions {
  /** The density grid to extract the surface from. */
  grid: DensityGrid;
  /**
   * The iso level the surface is drawn at. Default: `0.5 * max(values)` (half
   * the peak density).
   */
  isoValue?: number;
  /** The surface color. Default: `'#8e7cc3'` (a translucent purple). */
  color?: string;
  /** Opacity from 0 to 1. Translucent so the core shows through. Default: 0.5. */
  opacity?: number;
  /** Marching-cubes grid cells per axis. Default: 48. */
  resolution?: number;
}

/** The default surface color: a translucent purple. */
const DEFAULT_COLOR = '#8e7cc3';
/** The default opacity: translucent so the dense core reads through the skin. */
const DEFAULT_OPACITY = 0.5;
/** The default marching-cubes resolution. */
const DEFAULT_RESOLUTION = 48;
/** The default origin: voxel (0,0,0) at the world origin. */
const DEFAULT_ORIGIN: Vector3Tuple = [0, 0, 0];
/** The default spacing: one world unit per voxel step. */
const DEFAULT_SPACING: Vector3Tuple = [1, 1, 1];
/** The fraction of the peak density the surface is drawn at by default. */
const DEFAULT_ISO_FRACTION = 0.5;
/** The smallest usable spacing, so a 0 spacing does not divide by zero. */
const MIN_SPACING = 1e-9;

/** An axis-aligned box in world coordinates, as `{x, y, z}` corners. */
interface SurfaceBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

/** A sampler `f(x, y, z)` over world coordinates. */
type Sampler = (x: number, y: number, z: number) => number;

export class DensitySurface extends Group {
  private readonly _values: number[];
  private readonly _dims: [number, number, number];
  private readonly _origin: Vector3Tuple;
  private readonly _spacing: Vector3Tuple;
  private readonly _isoValue: number;
  private readonly _surfaceColor: string;
  private readonly _surfaceOpacity: number;
  private readonly _resolution: number;

  private readonly _boundsMin: [number, number, number];
  private readonly _boundsMax: [number, number, number];
  private readonly _sampler: Sampler;

  /** The isosurface that draws the density skin. */
  readonly surface: ImplicitSurface;

  constructor(options: DensitySurfaceOptions) {
    super();

    const grid = options.grid;
    const [nx, ny, nz] = this._validateDims(grid);
    const expected = nx * ny * nz;
    if (grid.values.length !== expected) {
      throw new Error(
        `DensitySurface: grid.values length (${grid.values.length}) must equal ` +
          `nx*ny*nz (${nx}*${ny}*${nz} = ${expected}).`,
      );
    }

    this._values = [...grid.values];
    this._dims = [nx, ny, nz];
    this._origin = [...(grid.origin ?? DEFAULT_ORIGIN)];
    // Clamp each spacing away from zero so the sampler never divides by zero and
    // the bounds stay finite. A 0 spacing has no physical meaning for a grid.
    this._spacing = (grid.spacing ?? DEFAULT_SPACING).map((s) =>
      Math.abs(s) > MIN_SPACING ? s : MIN_SPACING,
    ) as Vector3Tuple;

    const [minValue, maxValue] = this._minMax(this._values);
    this._isoValue = options.isoValue ?? DEFAULT_ISO_FRACTION * maxValue;
    this._surfaceColor = options.color ?? DEFAULT_COLOR;
    this._surfaceOpacity = options.opacity ?? DEFAULT_OPACITY;
    this._resolution = options.resolution ?? DEFAULT_RESOLUTION;

    // World box: [origin, origin + dims * spacing]. Each voxel is a cell of size
    // spacing, so the grid spans dims cells per axis.
    this._boundsMin = [...this._origin];
    this._boundsMax = [
      this._origin[0] + nx * this._spacing[0],
      this._origin[1] + ny * this._spacing[1],
      this._origin[2] + nz * this._spacing[2],
    ];

    this._sampler = this._makeSampler(minValue);

    this.surface = new ImplicitSurface({
      func: this._sampler,
      xRange: [this._boundsMin[0], this._boundsMax[0]],
      yRange: [this._boundsMin[1], this._boundsMax[1]],
      zRange: [this._boundsMin[2], this._boundsMax[2]],
      resolution: this._resolution,
      isoLevel: this._isoValue,
      color: this._surfaceColor,
      opacity: this._surfaceOpacity,
    });
    this.add(this.surface);
  }

  /** Validate that dims are three positive integers; throw a clear error if not. */
  private _validateDims(grid: DensityGrid): [number, number, number] {
    const dims = grid?.dims;
    if (!dims || dims.length !== 3) {
      throw new Error('DensitySurface: grid.dims must be [nx, ny, nz].');
    }
    const [nx, ny, nz] = dims;
    for (const n of [nx, ny, nz]) {
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(
          `DensitySurface: grid.dims must be positive integers, got [${nx}, ${ny}, ${nz}].`,
        );
      }
    }
    return [nx, ny, nz];
  }

  /** The minimum and maximum of the values in one pass (0,0 for an empty array). */
  private _minMax(values: number[]): [number, number] {
    if (values.length === 0) return [0, 0];
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return [min, max];
  }

  /**
   * Build the trilinear sampler. Outside the voxel-center lattice it returns
   * `background` (the grid minimum), so the field is low at the box faces and the
   * surface is bounded.
   */
  private _makeSampler(background: number): Sampler {
    const values = this._values;
    const [nx, ny, nz] = this._dims;
    const [ox, oy, oz] = this._origin;
    const [sx, sy, sz] = this._spacing;

    return (x: number, y: number, z: number): number => {
      // World -> continuous voxel-center coordinate.
      const vx = (x - ox) / sx - 0.5;
      const vy = (y - oy) / sy - 0.5;
      const vz = (z - oz) / sz - 0.5;
      if (vx < 0 || vx > nx - 1 || vy < 0 || vy > ny - 1 || vz < 0 || vz > nz - 1) {
        return background;
      }
      const i0 = Math.floor(vx);
      const j0 = Math.floor(vy);
      const k0 = Math.floor(vz);
      const i1 = Math.min(i0 + 1, nx - 1);
      const j1 = Math.min(j0 + 1, ny - 1);
      const k1 = Math.min(k0 + 1, nz - 1);
      const tx = vx - i0;
      const ty = vy - j0;
      const tz = vz - k0;

      const at = (i: number, j: number, k: number): number => values[i + nx * (j + ny * k)];
      const c000 = at(i0, j0, k0);
      const c100 = at(i1, j0, k0);
      const c010 = at(i0, j1, k0);
      const c110 = at(i1, j1, k0);
      const c001 = at(i0, j0, k1);
      const c101 = at(i1, j0, k1);
      const c011 = at(i0, j1, k1);
      const c111 = at(i1, j1, k1);

      const c00 = c000 * (1 - tx) + c100 * tx;
      const c10 = c010 * (1 - tx) + c110 * tx;
      const c01 = c001 * (1 - tx) + c101 * tx;
      const c11 = c011 * (1 - tx) + c111 * tx;
      const c0 = c00 * (1 - ty) + c10 * ty;
      const c1 = c01 * (1 - ty) + c11 * ty;
      return c0 * (1 - tz) + c1 * tz;
    };
  }

  /** The density at a world point (trilinear, background outside the lattice). */
  sample(x: number, y: number, z: number): number {
    return this._sampler(x, y, z);
  }

  /** The iso level the surface is drawn at. */
  getIsoValue(): number {
    return this._isoValue;
  }

  /** The marching-cubes resolution. */
  getResolution(): number {
    return this._resolution;
  }

  /**
   * The sampled box in world coordinates.
   *
   * This overrides {@link Mobject.getBounds} to return the grid's world box,
   * the same way {@link MolecularSurface} does. It does not run the renderer and
   * does not throw.
   */
  override getBounds(): SurfaceBounds {
    const [min, max] = [this._boundsMin, this._boundsMax];
    return {
      min: { x: min[0], y: min[1], z: min[2] },
      max: { x: max[0], y: max[1], z: max[2] },
    };
  }

  override copy(): DensitySurface {
    const copy = new DensitySurface({
      grid: {
        values: [...this._values],
        dims: [...this._dims],
        origin: [...this._origin],
        spacing: [...this._spacing],
      },
      isoValue: this._isoValue,
      color: this._surfaceColor,
      opacity: this._surfaceOpacity,
      resolution: this._resolution,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
