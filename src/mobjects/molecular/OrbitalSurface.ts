/**
 * OrbitalSurface - 3D atomic-orbital lobes drawn as isosurfaces.
 *
 * An OrbitalSurface shows the recognizable shape of an atomic orbital (an s
 * blob, a p dumbbell, a d four-lobe or ring-and-lobe) so a reaction can be seen
 * "at the orbital level". It is a {@link Group} that holds one
 * {@link ImplicitSurface} per colored lobe set: marching cubes extracts each
 * lobe from a scalar field and the lobe is colored by its phase (sign of the
 * wavefunction).
 *
 * ## The scalar field
 *
 * Each orbital uses an analytic hydrogen-like shape, a radial gaussian envelope
 * times the angular part. The full radial wavefunction is not needed; only the
 * lobe shape must read. The signed shape is:
 *
 * ```
 * S(p) = angular(p) * exp(-|p - center|^2 / scale^2)
 * ```
 *
 * where `angular` is `1` for s, a coordinate for p (for example `z/scale` for
 * pz), and a quadratic form for d (for example `(2z^2 - x^2 - y^2)/scale^2` for
 * dz2). `S` is positive in one phase and negative in the opposite phase.
 *
 * One colored lobe set is the region where `sign * S > isoValue`, with
 * `sign = +1` for the positive phase and `sign = -1` for the negative phase.
 * The field passed to {@link ImplicitSurface} is therefore:
 *
 * ```
 * f(p) = isoValue - sign * S(p)
 * ```
 *
 * and the surface is the zero level set `f = 0`. Inside the lobe `f < 0`, which
 * marching cubes treats as "inside", so the surface normals point outward (the
 * same signed convention {@link MolecularSurface} uses).
 *
 * ## Why the field is local (no box-blob)
 *
 * The gaussian envelope `exp(-r^2/scale^2)` decays to about `0` well before the
 * sampling box edge (the box is `center ± 2.5 * scale`, where the envelope is
 * `exp(-6.25) ~= 0.002`). So `S ~= 0` at the box faces and `f ~= isoValue > 0`
 * there, which is "outside". The surface closes inside the box and never shuts
 * against the box faces. {@link MolecularSurface} hit that box-blob failure with
 * a summed metaball field; a decaying envelope avoids it.
 *
 * @example
 * ```typescript
 * const pz = new OrbitalSurface({ type: 'pz', scale: 2 });
 * scene.add(pz); // a two-color dumbbell along z
 * ```
 */

import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { ImplicitSurface } from '../three-d/ImplicitSurface';

/** The atomic-orbital shapes OrbitalSurface can draw. */
export type OrbitalType = 's' | 'px' | 'py' | 'pz' | 'dz2' | 'dxy';

/** Options for an {@link OrbitalSurface}. */
export interface OrbitalSurfaceOptions {
  /** The orbital shape. Default: `'pz'`. */
  type?: OrbitalType;
  /** The lobe center in world coordinates. Default: `[0, 0, 0]`. */
  center?: Vector3Tuple;
  /** The spatial size of a lobe (the gaussian envelope width). Default: 2. */
  scale?: number;
  /**
   * The `|psi|`-style threshold the lobe surface is drawn at. A smaller value
   * grows the lobe, a larger value shrinks it. Default: 0.1.
   */
  isoValue?: number;
  /** Marching-cubes grid cells per axis. Default: 40. */
  resolution?: number;
  /** The color of the positive phase. Default: `'#ef476f'`. */
  positiveColor?: string;
  /** The color of the negative phase. Default: `'#4f8ac9'`. */
  negativeColor?: string;
  /** Opacity from 0 to 1. Default: 0.65. */
  opacity?: number;
}

/** The default orbital shape. */
const DEFAULT_TYPE: OrbitalType = 'pz';
/** The default lobe center. */
const DEFAULT_CENTER: Vector3Tuple = [0, 0, 0];
/** The default lobe size. */
const DEFAULT_SCALE = 2;
/** The default lobe threshold (chosen so a p dumbbell reads). */
const DEFAULT_ISO_VALUE = 0.1;
/** The default marching-cubes resolution. */
const DEFAULT_RESOLUTION = 40;
/** The default positive-phase color. */
const DEFAULT_POSITIVE_COLOR = '#ef476f';
/** The default negative-phase color. */
const DEFAULT_NEGATIVE_COLOR = '#4f8ac9';
/** The default opacity: translucent so overlapping lobes read. */
const DEFAULT_OPACITY = 0.65;

/**
 * The sampling half-extent as a multiple of `scale`. At this distance the
 * gaussian envelope is `exp(-6.25) ~= 0.002`, so the field is near zero at the
 * box edge and the lobe cannot close against a box face.
 */
const EXTENT_FACTOR = 2.5;

/** The smallest usable scale, so a 0 or negative scale does not divide by zero. */
const MIN_SCALE = 1e-9;

/** An axis-aligned box in world coordinates, as `{x, y, z}` corners. */
interface SurfaceBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

/** The sign of a phase: `+1` positive, `-1` negative. */
type Phase = 1 | -1;

export class OrbitalSurface extends Group {
  private readonly _type: OrbitalType;
  private readonly _center: Vector3Tuple;
  private readonly _scale: number;
  private readonly _isoValue: number;
  private readonly _resolution: number;
  private readonly _positiveColor: string;
  private readonly _negativeColor: string;
  private readonly _surfaceOpacity: number;

  private readonly _boundsMin: [number, number, number];
  private readonly _boundsMax: [number, number, number];

  /** The isosurfaces that draw the lobes, one per colored phase. */
  readonly surfaces: ImplicitSurface[];

  constructor(options: OrbitalSurfaceOptions = {}) {
    super();

    this._type = options.type ?? DEFAULT_TYPE;
    this._center = [...(options.center ?? DEFAULT_CENTER)];
    this._scale = options.scale ?? DEFAULT_SCALE;
    this._isoValue = options.isoValue ?? DEFAULT_ISO_VALUE;
    this._resolution = options.resolution ?? DEFAULT_RESOLUTION;
    this._positiveColor = options.positiveColor ?? DEFAULT_POSITIVE_COLOR;
    this._negativeColor = options.negativeColor ?? DEFAULT_NEGATIVE_COLOR;
    this._surfaceOpacity = options.opacity ?? DEFAULT_OPACITY;

    // A 0 or negative scale would divide by zero in the field and give a
    // zero-size box. Clamp to a tiny positive value so nothing throws.
    const safeScale = Math.abs(this._scale) > MIN_SCALE ? Math.abs(this._scale) : MIN_SCALE;
    const extent = EXTENT_FACTOR * safeScale;

    const [cx, cy, cz] = this._center;
    this._boundsMin = [cx - extent, cy - extent, cz - extent];
    this._boundsMax = [cx + extent, cy + extent, cz + extent];

    this.surfaces = [];
    for (const phase of this._phases()) {
      const surface = this._makeLobe(phase, safeScale);
      this.surfaces.push(surface);
      this.add(surface);
    }
  }

  /** The phases this orbital shows: `[+1]` for s, `[+1, -1]` for p and d. */
  private _phases(): Phase[] {
    return this._type === 's' ? [1] : [1, -1];
  }

  /** Build one colored lobe set as its own {@link ImplicitSurface}. */
  private _makeLobe(phase: Phase, safeScale: number): ImplicitSurface {
    const [cx, cy, cz] = this._center;
    const iso = this._isoValue;
    const type = this._type;
    // f(p) = isoValue - sign * S(p). The lobe is f < 0 (marching cubes "inside"),
    // so normals point outward. S decays with the gaussian envelope, so f is
    // positive (outside) at the box edge and the lobe does not touch a box face.
    const func = (x: number, y: number, z: number): number => {
      const s = angularShape(type, x - cx, y - cy, z - cz, safeScale);
      return iso - phase * s;
    };
    return new ImplicitSurface({
      func,
      xRange: [this._boundsMin[0], this._boundsMax[0]],
      yRange: [this._boundsMin[1], this._boundsMax[1]],
      zRange: [this._boundsMin[2], this._boundsMax[2]],
      resolution: this._resolution,
      isoLevel: 0,
      color: phase === 1 ? this._positiveColor : this._negativeColor,
      opacity: this._surfaceOpacity,
    });
  }

  /** The orbital shape. */
  getType(): OrbitalType {
    return this._type;
  }

  /**
   * The sampled box in world coordinates.
   *
   * This overrides {@link Mobject.getBounds} to return the box the field was
   * sampled over, the same way {@link MolecularSurface} does. It does not run
   * the renderer and does not throw for an empty group.
   */
  override getBounds(): SurfaceBounds {
    const [min, max] = [this._boundsMin, this._boundsMax];
    return {
      min: { x: min[0], y: min[1], z: min[2] },
      max: { x: max[0], y: max[1], z: max[2] },
    };
  }

  override copy(): OrbitalSurface {
    const copy = new OrbitalSurface({
      type: this._type,
      center: [...this._center],
      scale: this._scale,
      isoValue: this._isoValue,
      resolution: this._resolution,
      positiveColor: this._positiveColor,
      negativeColor: this._negativeColor,
      opacity: this._surfaceOpacity,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}

/**
 * The signed angular shape `S(p) = angular * exp(-r^2 / scale^2)`, in lobe-local
 * coordinates `(rx, ry, rz)` (already shifted by the center).
 *
 * The angular factor is the hydrogen-like real angular part, kept simple: a
 * constant for s, a coordinate for p, and a quadratic form for d. The sign of
 * `S` is the orbital phase.
 */
function angularShape(
  type: OrbitalType,
  rx: number,
  ry: number,
  rz: number,
  scale: number,
): number {
  const r2 = rx * rx + ry * ry + rz * rz;
  const env = Math.exp(-r2 / (scale * scale));
  switch (type) {
    case 's':
      return env;
    case 'px':
      return (rx / scale) * env;
    case 'py':
      return (ry / scale) * env;
    case 'pz':
      return (rz / scale) * env;
    case 'dz2':
      return ((2 * rz * rz - rx * rx - ry * ry) / (scale * scale)) * env;
    case 'dxy':
      return ((rx * ry) / (scale * scale)) * env;
  }
}
