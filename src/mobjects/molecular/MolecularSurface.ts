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
import { ColorScale } from '../geo/colorScale';
import { ManimColor } from '../../utils/ManimColor';
import { vdwRadius } from './elementRadii';
import {
  residueCharge,
  residueHydropathy,
  DEFAULT_ELECTROSTATIC_COLORS,
  DEFAULT_HYDROPATHY_COLORS,
  HYDROPATHY_MIN,
  HYDROPATHY_MAX,
} from './residueProperties';
import type { Atom3DSpec } from './Molecule3D';

/** The kind of molecular surface to build. */
export type MolecularSurfaceKind = 'vdw' | 'sas';

/**
 * How to color each surface vertex.
 *  - `'uniform'`: a single {@link MolecularSurfaceOptions.color} (default).
 *  - `'charge'`: the nearest atom's formal side-chain charge.
 *  - `'hydrophobicity'`: the nearest atom's Kyte-Doolittle hydropathy.
 *  - `'electrostatic'`: a Coulombic potential summed over the atoms.
 */
export type SurfaceColorBy = 'uniform' | 'charge' | 'hydrophobicity' | 'electrostatic';

/** The valid {@link SurfaceColorBy} values, for runtime validation. */
const COLOR_BY_VALUES: ReadonlyArray<SurfaceColorBy> = [
  'uniform',
  'charge',
  'hydrophobicity',
  'electrostatic',
];

/**
 * The softening distance (angstrom) in the Coulombic sum `Σ qᵢ / (rᵢ + ε)`.
 * It keeps the potential finite when a vertex sits on an atom center.
 */
const ELECTROSTATIC_EPSILON = 1.0;

/** The resolved, validated coloring options for a {@link MolecularSurface}. */
interface ResolvedColorOptions {
  colorBy: SurfaceColorBy;
  charges: number[] | undefined;
  colorRamp: string[] | undefined;
  colorScale: ColorScale | undefined;
  domain: [number, number] | undefined;
}

/**
 * Resolve and validate the coloring options.
 * @throws If `colorBy` is not a valid {@link SurfaceColorBy}.
 */
function resolveColorOptions(options: MolecularSurfaceOptions): ResolvedColorOptions {
  const colorBy = options.colorBy ?? 'uniform';
  if (!COLOR_BY_VALUES.includes(colorBy)) {
    throw new Error(
      `MolecularSurface: unknown colorBy '${colorBy}'. ` +
        `Use ${COLOR_BY_VALUES.map((v) => `'${v}'`).join(', ')}.`,
    );
  }
  return {
    colorBy,
    charges: options.charges ? [...options.charges] : undefined,
    colorRamp: options.colorRamp ? [...options.colorRamp] : undefined,
    colorScale: options.colorScale,
    domain: options.domain ?? options.chargeRange,
  };
}

/**
 * The maximum of a numeric list, computed with a loop.
 *
 * `Math.max(...values)` spreads the whole array as function arguments, which
 * overflows the call stack at roughly 1e5 elements. A loop has no such limit,
 * so bounds for a large structure (hundreds of thousands of atoms) still work.
 *
 * @param values - The numbers. An empty list yields `-Infinity`, as `Math.max`.
 */
export function maxValue(values: ReadonlyArray<number>): number {
  let max = -Infinity;
  for (const value of values) {
    if (value > max) {
      max = value;
    }
  }
  return max;
}

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
  /**
   * The iso threshold. Default: 0 (the union-of-spheres surface; a positive
   * value dilates it outward, a negative value shrinks it).
   */
  isoValue?: number;
  /** Extra space around the atom bounding box. Default: the max atom radius. */
  padding?: number;
  /** World scale applied to every atom coordinate and radius. Default: 1. */
  scale?: number;
  /**
   * How to color the surface. Default: `'uniform'` (the single {@link color}).
   * The other modes map a per-vertex scalar through a diverging ramp (blue
   * negative, white neutral, red positive). See {@link SurfaceColorBy}.
   */
  colorBy?: SurfaceColorBy;
  /**
   * Per-atom partial charge (elementary charge units), parallel to `atoms`.
   * Used by `colorBy: 'charge'` and `'electrostatic'`. When omitted, the charge
   * comes from each atom's `charge` field, then (for `'charge'`) from
   * `residueCharge(atom.resName)`.
   */
  charges?: number[];
  /**
   * The ramp colors for the diverging scale (low to high). Default:
   * blue / white / red for charge and electrostatic, the hydropathy ramp for
   * hydrophobicity. Ignored when {@link colorScale} is given.
   */
  colorRamp?: string[];
  /** A pre-built {@link ColorScale}. Overrides `colorRamp`, `domain` and `chargeRange`. */
  colorScale?: ColorScale;
  /**
   * The scalar domain `[min, max]` for the diverging scale. Default: symmetric
   * around 0 from the data (charge, electrostatic), or the full hydropathy range.
   */
  domain?: [number, number];
  /** Alias of {@link domain}, for the charge / electrostatic scales. */
  chargeRange?: [number, number];
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

  private readonly _colorBy: SurfaceColorBy;
  private readonly _charges: number[] | undefined;
  private readonly _colorRamp: string[] | undefined;
  private readonly _colorScale: ColorScale | undefined;
  private readonly _domain: [number, number] | undefined;

  private readonly _boundsMin: [number, number, number];
  private readonly _boundsMax: [number, number, number];

  /** The per-vertex RGB colors (0..1), or null when colorBy is `'uniform'`. */
  private _vertexColors: Float32Array | null = null;

  /** The isosurface that draws the skin, or `null` when there are no atoms. */
  readonly surface: ImplicitSurface | null;

  constructor(options: MolecularSurfaceOptions) {
    super();

    const colors = resolveColorOptions(options);
    this._colorBy = colors.colorBy;
    this._charges = colors.charges;
    this._colorRamp = colors.colorRamp;
    this._colorScale = colors.colorScale;
    this._domain = colors.domain;

    this._atomSpecs = options.atoms.map((a) => ({
      element: a.element,
      position: [...a.position],
      resName: a.resName,
      charge: a.charge,
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

    // Property / electrostatic coloring reuses the surface mesh (no re-meshing):
    // it samples a scalar at each vertex and writes a per-vertex color.
    if (this._colorBy !== 'uniform') {
      this._vertexColors = this._computeVertexColors(centers);
      if (this._vertexColors) {
        this.surface.setVertexColors(this._vertexColors);
      }
    }
  }

  /** The world-space radius of an atom (van der Waals, scaled, plus probe for sas). */
  private _worldRadius(element: string): number {
    let r = vdwRadius(element) * this._radiusScale;
    if (this._kind === 'sas') {
      r += this._probeRadius;
    }
    return r * this._worldScale;
  }

  /** Build the signed union-of-spheres distance field `f(p) = min_i(|p - p_i| − r_i)`. */
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
   * Compute a per-vertex RGB color (0..1) for the active {@link SurfaceColorBy}.
   *
   * It samples a scalar at every surface vertex, then maps it through a
   * {@link ColorScale}. The scalar is:
   *  - `'charge'` / `'hydrophobicity'`: the value of the nearest atom (its
   *    residue charge or Kyte-Doolittle hydropathy).
   *  - `'electrostatic'`: a Coulombic potential (see {@link _electrostaticValues}).
   *
   * Returns null when there are no surface vertices. Throws when the mode needs
   * atom data that is absent.
   */
  private _computeVertexColors(
    centers: ReadonlyArray<[number, number, number]>,
  ): Float32Array | null {
    const positions = this.surface?.getPositions();
    if (!positions || positions.length === 0) {
      return null;
    }
    const values =
      this._colorBy === 'electrostatic'
        ? this._electrostaticValues(positions, centers)
        : this._nearestAtomValues(positions, centers);

    const scale = this._buildColorScale(values);
    const colors = new Float32Array(positions.length);
    for (let v = 0; v < values.length; v++) {
      const [r, g, b] = new ManimColor(scale.colorFor(values[v])).toRgb();
      colors[v * 3] = r;
      colors[v * 3 + 1] = g;
      colors[v * 3 + 2] = b;
    }
    return colors;
  }

  /**
   * The nearest-atom scalar per surface vertex, for `'charge'` / `'hydrophobicity'`.
   * @throws If no atom carries the data the mode needs.
   */
  private _nearestAtomValues(
    positions: Float32Array,
    centers: ReadonlyArray<[number, number, number]>,
  ): number[] {
    const atomValues = this._atomScalarValues();
    const values = new Array<number>(positions.length / 3);
    for (let i = 0; i < positions.length; i += 3) {
      const nearest = this._nearestAtomIndex(
        positions[i],
        positions[i + 1],
        positions[i + 2],
        centers,
      );
      values[i / 3] = atomValues[nearest];
    }
    return values;
  }

  /**
   * The scalar of each atom for `'charge'` / `'hydrophobicity'`.
   *
   * For `'charge'`: the `charges` option, then `atom.charge`, then
   * `residueCharge(atom.resName)`. For `'hydrophobicity'`:
   * `residueHydropathy(atom.resName)`.
   *
   * @throws If no atom carries any usable value.
   */
  private _atomScalarValues(): number[] {
    let hasData = false;
    const values = this._atomSpecs.map((atom, i) => {
      if (this._colorBy === 'hydrophobicity') {
        if (atom.resName === undefined) return 0;
        hasData = true;
        return residueHydropathy(atom.resName);
      }
      const explicit = this._charges?.[i] ?? atom.charge;
      if (explicit !== undefined) {
        hasData = true;
        return explicit;
      }
      if (atom.resName !== undefined) {
        hasData = true;
        return residueCharge(atom.resName);
      }
      return 0;
    });
    if (!hasData) {
      if (this._colorBy === 'hydrophobicity') {
        throw new Error(
          "MolecularSurface: colorBy 'hydrophobicity' needs atom resName; none of the atoms has one.",
        );
      }
      throw new Error(
        "MolecularSurface: colorBy 'charge' needs per-atom charges " +
          '(the `charges` option or atom.charge) or atom resName; none found.',
      );
    }
    return values;
  }

  /**
   * The Coulombic potential per surface vertex: `Σ qᵢ / (rᵢ + ε)`, where `qᵢ` is
   * atom `i`'s partial charge and `rᵢ` is its distance to the vertex.
   *
   * This is a cheap approximation for teaching, NOT a Poisson-Boltzmann solve:
   * it ignores the solvent dielectric, ionic screening and the molecular
   * boundary. It only shows where positive and negative charge concentrate.
   *
   * @throws If no atom carries a partial charge.
   */
  private _electrostaticValues(
    positions: Float32Array,
    centers: ReadonlyArray<[number, number, number]>,
  ): number[] {
    const charges = this._atomSpecs.map((atom, i) => this._charges?.[i] ?? atom.charge);
    if (!charges.some((q) => q !== undefined)) {
      throw new Error(
        "MolecularSurface: colorBy 'electrostatic' needs per-atom charges " +
          '(the `charges` option or atom.charge); none found.',
      );
    }
    const q = charges.map((c) => c ?? 0);
    const values = new Array<number>(positions.length / 3);
    for (let i = 0; i < positions.length; i += 3) {
      let potential = 0;
      for (let a = 0; a < centers.length; a++) {
        const dx = positions[i] - centers[a][0];
        const dy = positions[i + 1] - centers[a][1];
        const dz = positions[i + 2] - centers[a][2];
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
        potential += q[a] / (r + ELECTROSTATIC_EPSILON);
      }
      values[i / 3] = potential;
    }
    return values;
  }

  /** The index of the atom center nearest to a point. */
  private _nearestAtomIndex(
    x: number,
    y: number,
    z: number,
    centers: ReadonlyArray<[number, number, number]>,
  ): number {
    let best = 0;
    let bestDist = Infinity;
    for (let a = 0; a < centers.length; a++) {
      const dx = x - centers[a][0];
      const dy = y - centers[a][1];
      const dz = z - centers[a][2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = a;
      }
    }
    return best;
  }

  /**
   * Build the {@link ColorScale} for the sampled values: the explicit
   * `colorScale`, else a ramp over the domain. The default domain is the full
   * hydropathy range for `'hydrophobicity'`, otherwise symmetric around 0 from
   * the data (so neutral maps to the ramp's middle).
   */
  private _buildColorScale(values: ReadonlyArray<number>): ColorScale {
    if (this._colorScale) {
      return this._colorScale;
    }
    const colors =
      this._colorRamp ??
      (this._colorBy === 'hydrophobicity'
        ? DEFAULT_HYDROPATHY_COLORS
        : DEFAULT_ELECTROSTATIC_COLORS);
    const domain = this._domain ?? this._defaultDomain(values);
    return new ColorScale({ colors, domain });
  }

  /** The default scalar domain for the active mode. */
  private _defaultDomain(values: ReadonlyArray<number>): [number, number] {
    if (this._colorBy === 'hydrophobicity') {
      return [HYDROPATHY_MIN, HYDROPATHY_MAX];
    }
    let maxAbs = 0;
    for (const value of values) {
      if (Number.isFinite(value) && Math.abs(value) > maxAbs) {
        maxAbs = Math.abs(value);
      }
    }
    if (maxAbs === 0) {
      return [-1, 1];
    }
    return [-maxAbs, maxAbs];
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
    const maxRadius = maxValue(radii);
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

  /** How the surface is colored (`'uniform'`, `'charge'`, …). */
  getColorBy(): SurfaceColorBy {
    return this._colorBy;
  }

  /**
   * The per-vertex RGB colors (0..1), flat `[r, g, b, …]` parallel to the
   * surface vertices, or null when colorBy is `'uniform'` or there is no surface.
   */
  getVertexColors(): Float32Array | null {
    return this._vertexColors;
  }

  override copy(): MolecularSurface {
    const copy = new MolecularSurface({
      atoms: this._atomSpecs.map((a) => ({
        element: a.element,
        position: [...a.position],
        resName: a.resName,
        charge: a.charge,
      })),
      kind: this._kind,
      probeRadius: this._probeRadius,
      radiusScale: this._radiusScale,
      color: this._surfaceColor,
      opacity: this._surfaceOpacity,
      resolution: this._resolution,
      isoValue: this._isoValue,
      padding: this._padding,
      scale: this._worldScale,
      colorBy: this._colorBy,
      charges: this._charges ? [...this._charges] : undefined,
      colorRamp: this._colorRamp ? [...this._colorRamp] : undefined,
      colorScale: this._colorScale,
      domain: this._domain,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
