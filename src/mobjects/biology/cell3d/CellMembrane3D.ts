/**
 * CellMembrane3D: the plasma membrane of a cutaway cell.
 *
 * A flattened ellipsoid wall, cut open as a bowl (plane cut), a wedge, or
 * closed. The wall is two leaflets, so the cut rim reads as a two-tone band:
 * the lipid bilayer, drawn far thicker than it is.
 *
 * Parts: `membrane` (outer leaflet), `innerLeaflet` (absent when closed).
 * Anchors: `rim`, `surface`, `inside`, `top`, `center`.
 *
 * @example
 * ```ts
 * const membrane = new CellMembrane3D({ radius: 4, cutaway: 'bowl' });
 * scene.add(membrane);
 * await scene.play(membrane.buildAnimation());
 * ```
 */

import type { Vector3Tuple } from '../../../core/Mobject';
import { Shell3D } from '../../three-d/Shell3D';
import { Blob3D } from '../../three-d/Blob3D';
import { interpolateColor } from '../../../utils/color';
import { byDetail } from './geometry';
import { Organelle3D, applyLook, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** How a cell is opened. */
export type CellCutaway = 'bowl' | 'wedge' | 'none';

/** Options of {@link CellMembrane3D}. */
export interface CellMembrane3DOptions extends Organelle3DOptions {
  /** Radius along Y before the aspect scale. Default: 4 */
  radius?: number;
  /** Per-axis shape scale [x, y, z]: a flattened cell. Default: [1.15, 1, 0.62] */
  aspect?: Vector3Tuple;
  /** Wall thickness (both leaflets). Default: 0.05 * radius */
  thickness?: number;
  /** How the cell is opened. Default: 'bowl' */
  cutaway?: CellCutaway;
  /** Bowl only: height of the cut plane as a fraction of the half-height. Default: 0.12 */
  cutHeight?: number;
  /** Wedge only: azimuth of the middle of the removed wedge (radians, about +Z). Default: -1.2 */
  wedgeCenter?: number;
  /** Wedge only: angle of the removed wedge. Default: PI / 2 */
  wedgeAngle?: number;
  /** Color of the inner face. Default: a dark shade of the membrane color. */
  innerColor?: string;
  /** Color of the cut rim band. Default: a light shade of the membrane color. */
  rimColor?: string;
}

/** Throw a clear error when the wall or the bowl cut cannot form the membrane. */
function checkMembrane(
  radius: number,
  thickness: number,
  cutaway: CellCutaway,
  cutHeight: number,
): void {
  if (!(Number.isFinite(radius) && radius > 0))
    throw new Error(`CellMembrane3D: radius must be a positive number, got ${radius}.`);
  if (!(thickness > 0 && thickness < radius))
    throw new Error(
      `CellMembrane3D: thickness must be > 0 and < radius (${radius}), got ${thickness}.`,
    );
  // The cut plane must cross the inner wall of the inner leaflet.
  const maxCut = 1 - thickness / radius;
  if (cutaway === 'bowl' && !(Math.abs(cutHeight) < maxCut))
    throw new Error(
      `CellMembrane3D: cutHeight must lie in (-${maxCut}, ${maxCut}) for this thickness, got ${cutHeight}.`,
    );
}

export class CellMembrane3D extends Organelle3D {
  private readonly _radius: number;
  private readonly _aspect: Vector3Tuple;
  private readonly _thickness: number;
  private readonly _cutaway: CellCutaway;
  private readonly _cutZ: number | null;

  constructor(options: CellMembrane3DOptions = {}) {
    super('cell membrane', options);
    const {
      radius = 4,
      aspect = [1.15, 1, 0.62],
      thickness = 0.05 * radius,
      cutaway = 'bowl',
      cutHeight = 0.12,
      wedgeCenter = -1.2,
      wedgeAngle = Math.PI / 2,
    } = options;
    checkMembrane(radius, thickness, cutaway, cutHeight);
    this._radius = radius;
    this._aspect = [...aspect];
    this._thickness = thickness;
    this._cutaway = cutaway;
    this._cutZ = cutaway === 'bowl' ? cutHeight * radius * aspect[2] : null;

    const main = this._mainColor;
    // Manim look: the inner face is almost the dark background, so organelles
    // sit on a near-black field and the wall reads as a bright band. The
    // cartoon look keeps a pale floor for a white page.
    const preset = typeof this._look === 'object' ? this._look.preset : this._look;
    const floor =
      preset === 'cartoon'
        ? interpolateColor(main, '#fff8ee', 0.6)
        : interpolateColor(main, '#0d0b0a', 0.9);
    const inner = options.innerColor ?? this._partColor('inner', floor);
    const rim = options.rimColor ?? this._partColor('rim', interpolateColor(main, '#ffffff', 0.4));
    const segments = byDetail(this._detail, [48, 72, 112] as const);
    const shared = { scale: this._aspect, segments, innerColor: inner };

    if (cutaway === 'none') {
      this._addPart(
        'membrane',
        new Blob3D({
          radius,
          lumpiness: 0.015,
          lobes: 4,
          seed: this._seed,
          scale: this._aspect,
          color: main,
        }),
      );
    } else {
      const cut =
        cutaway === 'bowl'
          ? { cut: 'plane' as const, cutDirection: [0, 0, 1] as Vector3Tuple }
          : {
              cut: 'wedge' as const,
              cutDirection: [0, 0, 1] as Vector3Tuple,
              wedgeStart: wedgeCenter - wedgeAngle / 2,
              wedgeAngle,
            };
      const half = thickness / 2;
      this._addPart(
        'membrane',
        new Shell3D({
          ...shared,
          ...cut,
          outerRadius: radius,
          thickness: half,
          cutOffset: cutHeight,
          color: main,
          rimColor: rim,
        }),
      );
      this._addPart(
        'innerLeaflet',
        new Shell3D({
          ...shared,
          ...cut,
          outerRadius: radius - half,
          thickness: half,
          cutOffset: (cutHeight * radius) / (radius - half),
          color: interpolateColor(main, '#000000', 0.15),
          rimColor: interpolateColor(rim, main, 0.55),
        }),
      );
    }

    const rc = this.getInnerRadii()[2];
    const az = wedgeCenter;
    const zc = this._cutZ ?? 0;
    const rimFrac = Math.sqrt(Math.max(0, 1 - (zc / (radius * aspect[2])) ** 2));
    const rimR = radius - thickness / 4;
    this._setAnchor(
      'rim',
      cutaway === 'wedge'
        ? [
            0.85 * rimR * aspect[0] * Math.cos(az - wedgeAngle / 2),
            0.85 * rimR * aspect[1] * Math.sin(az - wedgeAngle / 2),
            0,
          ]
        : [
            rimFrac * rimR * aspect[0] * Math.cos(az),
            rimFrac * rimR * aspect[1] * Math.sin(az),
            zc,
          ],
    );
    const el = -0.45;
    this._setAnchor('surface', [
      radius * aspect[0] * Math.cos(el) * Math.cos(az + 0.5),
      radius * aspect[1] * Math.cos(el) * Math.sin(az + 0.5),
      radius * aspect[2] * Math.sin(el),
    ]);
    this._setAnchor('inside', [0, 0, -0.9 * rc]);
    this._setAnchor('top', [0, 0, cutaway === 'bowl' ? zc : rc]);
    this._setAnchor('center', [0, 0, 0]);
    this._finish();
    // A highlight on the large inner floor reads as a smudge: keep it off. A
    // closed cell keeps it: there it is the shine of the body.
    if (this._look !== false && cutaway !== 'none') {
      const base = typeof this._look === 'string' ? { preset: this._look } : this._look;
      applyLook(this, { ...base, highlight: false });
    }
  }

  /** Semi-axes of the inner wall surface, in the membrane frame. */
  getInnerRadii(): Vector3Tuple {
    const r = this._radius - this._thickness;
    return [r * this._aspect[0], r * this._aspect[1], r * this._aspect[2]];
  }

  /** Semi-axes of the outer wall surface, in the membrane frame. */
  getOuterRadii(): Vector3Tuple {
    const r = this._radius;
    return [r * this._aspect[0], r * this._aspect[1], r * this._aspect[2]];
  }

  /** Height of the bowl cut plane in the membrane frame, or null when not a bowl. */
  getCutHeight(): number | null {
    return this._cutZ;
  }

  /** How the cell is opened. */
  getCutaway(): CellCutaway {
    return this._cutaway;
  }

  /**
   * Whether a sphere at `p` (membrane frame) with radius `margin` lies inside
   * the inner wall (the closed ellipsoid; the cut is ignored).
   */
  containsSphere(p: Vector3Tuple, margin = 0): boolean {
    const [a, b, c] = this.getInnerRadii();
    const k = [a - margin, b - margin, c - margin];
    if (k.some((v) => v <= 0)) return false;
    return (p[0] / k[0]) ** 2 + (p[1] / k[1]) ** 2 + (p[2] / k[2]) ** 2 <= 1;
  }

  /** Height of the inner floor under (x, y), in the membrane frame (NaN outside). */
  floorAt(x: number, y: number): number {
    const [a, b, c] = this.getInnerRadii();
    const q = 1 - (x / a) ** 2 - (y / b) ** 2;
    return q < 0 ? Number.NaN : -c * Math.sqrt(q);
  }

  protected _buildSteps(): BuildStep[] {
    const steps: BuildStep[] = [{ part: this.getPart('membrane')!, mode: 'create', weight: 1.4 }];
    const inner = this.getPart('innerLeaflet');
    if (inner) steps.push({ part: inner, mode: 'fade', weight: 0.6 });
    return steps;
  }

  protected override _defaultBuildDuration(): number {
    return 2;
  }
}
