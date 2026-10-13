/**
 * MolecularSurface - a smooth 3D molecular surface (the "blobby" surface).
 *
 * A molecular surface is the shape of a molecule as a single translucent skin,
 * the kind that shows a drug-binding pocket's cavity. MolecularSurface is a
 * {@link Group} that holds one {@link ImplicitSurface}: it samples a metaball
 * scalar field over the atom bounding box and extracts the isosurface with
 * marching cubes.
 *
 * Two kinds of surface are supported:
 *  - `'vdw'`: the union of van der Waals spheres (the space-filling surface).
 *  - `'sas'`: the solvent-accessible surface, the van der Waals radius plus a
 *    probe radius (water, 1.4 angstrom), so the skin sits one water molecule out.
 *
 * ## The scalar field
 *
 * The field is a signed union-of-spheres distance:
 *
 * ```
 * f(p) = min_i ( |p - p_i| - r_i )
 * ```
 *
 * where `p_i` is atom `i`'s world position and `r_i` is its world radius. The
 * surface is the level set `f = isoValue`, with `isoValue = 0` by default, so
 * the surface is exactly the union of the atoms' van der Waals spheres. A
 * positive `isoValue` dilates the surface outward (like a probe); a negative one
 * shrinks it toward the atom centers.
 *
 * A summed metaball field (`Σ r_i² / |p - p_i|²`) was tried first but is wrong
 * for a molecule: the contributions accumulate over many atoms, so the field can
 * stay above its threshold across the whole sampling box and marching cubes then
 * closes the surface off at the box faces, producing a box-shaped blob instead of
 * a molecular skin. The signed distance is local to the nearest atom and has no
 * such accumulation.
 *
 * The marching cubes mesher labels a grid corner "inside" when its value is below
 * the iso level (see {@link marchingCubes}); here that is the sphere interior
 * (`f < 0`), so the surface normals point outward and the shaded skin is correct.
 *
 * ## Performance
 *
 * Resolution 48 over a small bounding box (a ligand or one pocket) samples
 * `49³ ≈ 118k` grid points and is fine. A whole protein spans a much larger box,
 * so the same resolution would undersample it or, if raised, cost `O(n³)` field
 * evaluations. For a large structure lower the resolution, or split the atoms
 * into chunks and build one surface per chunk (not implemented here).
 *
 * @example
 * ```typescript
 * const surface = new MolecularSurface({
 *   atoms: [
 *     { element: 'C', position: [0, 0, 0] },
 *     { element: 'O', position: [1.2, 0, 0] },
 *   ],
 *   kind: 'vdw',
 *   opacity: 0.45,
 *   resolution: 48,
 * });
 * scene.add(surface);
 * ```
 */

import { Group } from '../../core/Group';
import { ImplicitSurface } from '../three-d/ImplicitSurface';
import { vdwRadius } from './elementRadii';
import type { Atom3DSpec } from './Molecule3D';

/** The kind of molecular surface to build. */
export type MolecularSurfaceKind = 'vdw' | 'sas';

/** Options for a {@link MolecularSurface}. */
export interface MolecularSurfaceOptions {
  /** The atoms the surface wraps. */
  atoms: Atom3DSpec[];
  /**
   * The surface kind. `'vdw'` is the union of van der Waals spheres;
   * `'sas'` adds a probe radius (the solvent-accessible surface). Default:
   * `'vdw'`.
   */
  kind?: MolecularSurfaceKind;
  /** Probe radius added to each atom for `'sas'`. Default: 1.4 (water). */
  probeRadius?: number;
  /** Multiplier on every atom's van der Waals radius. Default: 1. */
  radiusScale?: number;
  /** The surface color. Default: `'#6fa8dc'` (a translucent blue). */
  color?: string;
  /** Opacity from 0 to 1. Translucent so atoms show through. Default: 0.45. */
  opacity?: number;
  /** Marching-cubes grid cells per axis. Default: 48. */
  resolution?: number;
  /** The metaball iso threshold. Default: 1. */
  isoValue?: number;
  /** Extra space around the atom bounding box. Default: the max atom radius. */
  padding?: number;
  /** World scale applied to every atom coordinate and radius. Default: 1. */
  scale?: number;
}

/** The default probe radius (water) for the solvent-accessible surface. */
const DEFAULT_PROBE_RADIUS = 1.4;
/** The default surface color: a translucent blue. */
const DEFAULT_COLOR = '#6fa8dc';
/** The default opacity: translucent so the ligand and atoms show through. */
const DEFAULT_OPACITY = 0.45;
/** The default marching-cubes resolution. */
const DEFAULT_RESOLUTION = 48;
/**
 * The default iso level. The field is a signed union-of-spheres distance, so
 * the surface is the zero level set. A positive value dilates the surface
 * outward (like a probe), a negative value shrinks it toward the atom centers.
 */
const DEFAULT_ISO_VALUE = 0;
/** The default world scale. */
const DEFAULT_SCALE = 1;

/** An axis-aligned box in world coordinates, as `{x, y, z}` corners. */
interface SurfaceBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

export class MolecularSurface extends Group {
  private readonly _atomSpecs: Atom3DSpec[];
  private readonly _kind: MolecularSurfaceKind;
  private readonly _probeRadius: number;
  private readonly _radiusScale: number;
  private readonly _surfaceColor: string;
  private readonly _surfaceOpacity: number;
  private readonly _resolution: number;
  private readonly _isoValue: number;
  private readonly _padding: number | undefined;
  private readonly _worldScale: number;

  private readonly _boundsMin: [number, number, number];
  private readonly _boundsMax: [number, number, number];

  /** The isosurface that draws the skin, or `null` when there are no atoms. */
  readonly surface: ImplicitSurface | null;

  constructor(options: MolecularSurfaceOptions) {
    super();

    this._atomSpecs = options.atoms.map((a) => ({
      element: a.element,
      position: [...a.position],
    }));
    this._kind = options.kind ?? 'vdw';
    this._probeRadius = options.probeRadius ?? DEFAULT_PROBE_RADIUS;
    this._radiusScale = options.radiusScale ?? 1;
    this._surfaceColor = options.color ?? DEFAULT_COLOR;
    this._surfaceOpacity = options.opacity ?? DEFAULT_OPACITY;
    this._resolution = options.resolution ?? DEFAULT_RESOLUTION;
    this._isoValue = options.isoValue ?? DEFAULT_ISO_VALUE;
    this._padding = options.padding;
    this._worldScale = options.scale ?? DEFAULT_SCALE;

    // World-space atom centers and radii for the metaball field.
    const centers = this._atomSpecs.map((a): [number, number, number] => [
      a.position[0] * this._worldScale,
      a.position[1] * this._worldScale,
      a.position[2] * this._worldScale,
    ]);
    const radii = this._atomSpecs.map((a) => this._worldRadius(a.element));

    const [min, max] = this._computeBounds(centers, radii);
    this._boundsMin = min;
    this._boundsMax = max;

    if (centers.length === 0) {
      // Guard: no atoms -> an empty group, no surface, no throw.
      this.surface = null;
      return;
    }

    const field = this._makeField(centers, radii);
    this.surface = new ImplicitSurface({
      func: field,
      xRange: [min[0], max[0]],
      yRange: [min[1], max[1]],
      zRange: [min[2], max[2]],
      resolution: this._resolution,
      isoLevel: this._isoValue,
      color: this._surfaceColor,
      opacity: this._surfaceOpacity,
    });
    this.add(this.surface);
  }

  /** The world-space radius of an atom (van der Waals, scaled, plus probe for sas). */
  private _worldRadius(element: string): number {
    let r = vdwRadius(element) * this._radiusScale;
    if (this._kind === 'sas') {
      r += this._probeRadius;
    }
    return r * this._worldScale;
  }

  /** Build the metaball scalar field `f(p) = Σ r_i² / |p - p_i|²`. */
  private _makeField(
    centers: ReadonlyArray<[number, number, number]>,
    radii: ReadonlyArray<number>,
  ): (x: number, y: number, z: number) => number {
    // Signed union-of-spheres distance: f(p) = min_i(|p - p_i| - r_i). It is
    // negative inside any atom's sphere, zero on the union surface, and positive
    // outside. The zero level set is exactly the union of the van der Waals
    // spheres, so the extracted surface hugs the atoms instead of closing off at
    // the sampling box (a summed metaball field accumulates over many atoms and
    // can stay above its threshold everywhere, which produced a box-shaped blob).
    return (x: number, y: number, z: number): number => {
      let minSigned = Infinity;
      for (let i = 0; i < centers.length; i++) {
        const dx = x - centers[i][0];
        const dy = y - centers[i][1];
        const dz = z - centers[i][2];
        const signed = Math.sqrt(dx * dx + dy * dy + dz * dz) - radii[i];
        if (signed < minSigned) {
          minSigned = signed;
        }
      }
      return minSigned;
    };
  }

  /**
   * The sampled box: the atom spheres' bounding box grown by the padding.
   *
   * The box must enclose every atom sphere, so the surface is not clipped. The
   * default padding is the largest atom radius, which leaves room for the
   * metaball to bulge past the spheres where atoms overlap.
   */
  private _computeBounds(
    centers: ReadonlyArray<[number, number, number]>,
    radii: ReadonlyArray<number>,
  ): [[number, number, number], [number, number, number]] {
    if (centers.length === 0) {
      return [
        [0, 0, 0],
        [0, 0, 0],
      ];
    }
    const maxRadius = Math.max(...radii);
    const padding = this._padding ?? maxRadius;
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < centers.length; i++) {
      for (let axis = 0; axis < 3; axis++) {
        min[axis] = Math.min(min[axis], centers[i][axis] - radii[i]);
        max[axis] = Math.max(max[axis], centers[i][axis] + radii[i]);
      }
    }
    for (let axis = 0; axis < 3; axis++) {
      min[axis] -= padding;
      max[axis] += padding;
    }
    return [min, max];
  }

  /**
   * The sampled box in world coordinates.
   *
   * This overrides {@link Mobject.getBounds} to return the box the metaball
   * field was sampled over, rather than running the renderer. The box is a valid
   * (slightly loose) bounding box of the surface, and, unlike the base method,
   * it does not throw for an empty group. The corners use the codebase `{x, y,
   * z}` shape.
   */
  override getBounds(): SurfaceBounds {
    const [min, max] = [this._boundsMin, this._boundsMax];
    return {
      min: { x: min[0], y: min[1], z: min[2] },
      max: { x: max[0], y: max[1], z: max[2] },
    };
  }

  /** The number of atoms the surface wraps. */
  getAtomCount(): number {
    return this._atomSpecs.length;
  }

  /** The surface kind (`'vdw'` or `'sas'`). */
  getKind(): MolecularSurfaceKind {
    return this._kind;
  }

  override copy(): MolecularSurface {
    const copy = new MolecularSurface({
      atoms: this._atomSpecs.map((a) => ({ element: a.element, position: [...a.position] })),
      kind: this._kind,
      probeRadius: this._probeRadius,
      radiusScale: this._radiusScale,
      color: this._surfaceColor,
      opacity: this._surfaceOpacity,
      resolution: this._resolution,
      isoValue: this._isoValue,
      padding: this._padding,
      scale: this._worldScale,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
