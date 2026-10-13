/**
 * ElectronPushingArrow - a curved electron-pushing (arrow-pushing) arrow for
 * 2D reaction mechanisms.
 *
 * Organic chemists draw reaction mechanisms with curved arrows that show where
 * electrons move: a double-barbed arrow for an electron pair (2 electrons) and
 * a single-barbed "fishhook" for a single electron (1 electron, radical steps).
 * The tail sits on the electron source (a lone pair, a bond midpoint or an
 * atom); the head points at the destination (an atom, a bond or a point).
 *
 * The arrow is a smooth curved arc from `from` to `to`. The arc bows away from
 * the straight chord by `bulge` (a fraction of the chord length) to the chosen
 * `direction` side. The shaft is a single quadratic Bezier, converted to one
 * cubic segment, so the arc apex lands exactly `bulge * chordLength` off the
 * chord midpoint. The head is a reused geometry tip primitive.
 *
 * The arrow is a VMobject whose own points are the shaft and whose single child
 * is the head, so `Create` draws it progressively (shaft then head) and the
 * usual Mobject transforms position it.
 *
 * Shaft reuse note: the repository's `ArcBetweenPoints` / `CurvedArrow` arc math
 * does not return a path whose end anchor equals the requested end point, so it
 * cannot drive a from->to shaft. A quadratic Bezier is used instead; it gives an
 * exact, testable apex offset. The head reuses {@link ArrowTriangleFilledTip}.
 *
 * @example
 * ```typescript
 * // A lone pair on O attacks a carbon: curved pair arrow, bowing ccw.
 * const arrow = new ElectronPushingArrow({
 *   from: [0, 0, 0],
 *   to: [1.5, 0.5, 0],
 *   bulge: 0.3,
 *   direction: 'ccw',
 * });
 * scene.play(new Create(arrow));
 * ```
 */

import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { ArrowTriangleFilledTip } from '../geometry/ArrowTips';
import type { MoleculeMobject } from './MoleculeMobject';

/** Number of electrons the arrow moves: a pair (double-barbed) or one (fishhook). */
export type ArrowElectrons = 'pair' | 'single';

/** Default arrow color: a distinct magenta that reads over CPK atom colors. */
export const DEFAULT_ELECTRON_ARROW_COLOR = '#e84393';

/** Below this chord length the arrow is treated as degenerate (no head, no curve). */
const MIN_CHORD = 1e-9;

/** Options for an {@link ElectronPushingArrow}. */
export interface ElectronPushingArrowOptions {
  /** Tail: the electron source (a lone pair, a bond midpoint or an atom). */
  from: Vector3Tuple;
  /** Head: where the electrons go (an atom, a bond or a point). */
  to: Vector3Tuple;
  /** Electrons moved. Default: 'pair'. */
  electrons?: ArrowElectrons;
  /** Curvature: how far the arc bows from the straight chord, as a fraction of the chord length. Default: 0.3. */
  bulge?: number;
  /** Which side the arc bows to. Default: 'ccw'. */
  direction?: 'ccw' | 'cw';
  /** Stroke/head color. Default: {@link DEFAULT_ELECTRON_ARROW_COLOR}. */
  color?: string;
  /** Stroke width in pixels. Default: Manim's default. */
  strokeWidth?: number;
}

export class ElectronPushingArrow extends VMobject {
  private readonly _from: Vector3Tuple;
  private readonly _to: Vector3Tuple;
  private readonly _electrons: ArrowElectrons;
  private readonly _bulge: number;
  private readonly _direction: 'ccw' | 'cw';
  private readonly _arrowColor: string;
  private readonly _arrowStrokeWidth: number;

  /** The head mobject, or null for a degenerate (zero-length) arrow. */
  private _tip: VMobject | null = null;

  constructor(options: ElectronPushingArrowOptions) {
    super();

    const {
      from,
      to,
      electrons = 'pair',
      bulge = 0.3,
      direction = 'ccw',
      color = DEFAULT_ELECTRON_ARROW_COLOR,
      strokeWidth = DEFAULT_STROKE_WIDTH,
    } = options;

    this._from = [from[0], from[1], from[2] ?? 0];
    this._to = [to[0], to[1], to[2] ?? 0];
    this._electrons = electrons;
    this._bulge = bulge;
    this._direction = direction;
    this._arrowColor = color;
    this._arrowStrokeWidth = strokeWidth;

    this.color = color;
    this.strokeWidth = strokeWidth;
    // The shaft is an open stroke, never a filled region. VMobject defaults
    // fillOpacity to 0.5, which would make Create fill the open parabola.
    this.fillOpacity = 0;

    this._build();
  }

  /** Build the shaft points and the head child. Safe for a zero-length arrow. */
  private _build(): void {
    const [x0, y0] = this._from;
    const [x1, y1] = this._to;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const chord = Math.hypot(dx, dy);

    // Degenerate arrow: from == to. Draw nothing and add no head; do not throw.
    if (chord < MIN_CHORD) {
      this.setPoints3D([]);
      this._tip = null;
      return;
    }

    // Unit chord direction and the left normal (+90 degrees, the ccw side).
    const ux = dx / chord;
    const uy = dy / chord;
    const sign = this._direction === 'ccw' ? 1 : -1;
    const nx = -uy * sign;
    const ny = ux * sign;

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;

    // Quadratic control point placed so the arc apex (t = 0.5) is offset from
    // the chord midpoint by exactly `bulge * chord`:
    //   Q(0.5) = 0.5 * mid + 0.5 * C  =>  C = mid + 2 * s * n, s = bulge * chord
    const s = this._bulge * chord;
    const cx = midX + 2 * s * nx;
    const cy = midY + 2 * s * ny;

    // A quadratic Bezier is exactly one cubic: raise the degree.
    const cp1x = x0 + (2 / 3) * (cx - x0);
    const cp1y = y0 + (2 / 3) * (cy - y0);
    const cp2x = x1 + (2 / 3) * (cx - x1);
    const cp2y = y1 + (2 / 3) * (cy - y1);

    this.setPoints3D([
      [x0, y0, 0],
      [cp1x, cp1y, 0],
      [cp2x, cp2y, 0],
      [x1, y1, 0],
    ]);

    // End tangent of the quadratic at t = 1 is 2 * (P1 - C); the head points
    // along it, so the arrow meets its target at the curve's real heading.
    let tangentX = x1 - cx;
    let tangentY = y1 - cy;
    const tangentLen = Math.hypot(tangentX, tangentY);
    if (tangentLen < MIN_CHORD) {
      tangentX = ux;
      tangentY = uy;
    } else {
      tangentX /= tangentLen;
      tangentY /= tangentLen;
    }

    this._tip = this._buildTip([tangentX, tangentY, 0], chord);
    this.add(this._tip);
  }

  /**
   * Build the arrowhead at `to`, pointing along `direction`.
   *
   * 'pair' reuses {@link ArrowTriangleFilledTip}, a filled double-barbed head.
   * 'single' is a radical fishhook: a single-barbed half head. The repository
   * has no half-arrow tip primitive, so the single barb is drawn as one short
   * stroke from the tip back to one side. The head size scales with the chord so
   * short arrows get proportionally small heads.
   */
  private _buildTip(direction: Vector3Tuple, chord: number): VMobject {
    const length = Math.min(0.25, 0.22 * chord);
    const width = 0.6 * length;

    if (this._electrons === 'pair') {
      return new ArrowTriangleFilledTip({
        position: this._to,
        direction,
        length,
        width,
        color: this._arrowColor,
        strokeWidth: this._arrowStrokeWidth,
      });
    }

    // Single-barbed fishhook: one barb from the tip point to a single corner.
    const [px, py] = this._to;
    const [dx, dy] = direction;
    // Perpendicular (left of the heading) for the single barb's corner.
    const perpX = -dy;
    const perpY = dx;
    const baseX = px - dx * length;
    const baseY = py - dy * length;
    const cornerX = baseX + perpX * width;
    const cornerY = baseY + perpY * width;

    const barb = new VMobject();
    barb.color = this._arrowColor;
    barb.strokeWidth = this._arrowStrokeWidth;
    barb.fillOpacity = 0;
    // One straight cubic segment from the tip point to the barb corner.
    barb.setPoints3D([
      [px, py, 0],
      [px + (cornerX - px) / 3, py + (cornerY - py) / 3, 0],
      [px + (2 * (cornerX - px)) / 3, py + (2 * (cornerY - py)) / 3, 0],
      [cornerX, cornerY, 0],
    ]);
    return barb;
  }

  /** The tail point (the electron source), as given. */
  getStart(): Vector3Tuple {
    return [...this._from];
  }

  /** The head point (the electron destination), as given. */
  getEnd(): Vector3Tuple {
    return [...this._to];
  }

  /** Whether this arrow moves an electron pair or a single electron. */
  getElectrons(): ArrowElectrons {
    return this._electrons;
  }

  /** The head mobject, or null for a degenerate (zero-length) arrow. */
  getTip(): VMobject | null {
    return this._tip;
  }

  override copy(): ElectronPushingArrow {
    const clone = new ElectronPushingArrow({
      from: this._from,
      to: this._to,
      electrons: this._electrons,
      bulge: this._bulge,
      direction: this._direction,
      color: this._arrowColor,
      strokeWidth: this._arrowStrokeWidth,
    });
    // copyChildren: false keeps the freshly built head; copyPosition: false
    // matches the geometry primitives' copy convention.
    this._copyBaseAttributesInto(clone, { copyChildren: false, copyPosition: false });
    return clone;
  }
}

/**
 * Build an {@link ElectronPushingArrow} between two atoms of a molecule.
 *
 * A convenience that reads the world positions of atoms `i` and `j` from a
 * {@link MoleculeMobject} and returns an arrow from atom `i` to atom `j`.
 *
 * @throws Error when either atom index is out of range.
 */
export function arrowBetweenAtoms(
  molecule: MoleculeMobject,
  i: number,
  j: number,
  opts: Omit<ElectronPushingArrowOptions, 'from' | 'to'> = {},
): ElectronPushingArrow {
  const a = molecule.getAtom(i);
  const b = molecule.getAtom(j);
  if (!a || !b) {
    throw new Error(
      `arrowBetweenAtoms: atom index out of range (i=${i}, j=${j}, atom count=${molecule.numAtoms}).`,
    );
  }
  return new ElectronPushingArrow({ ...opts, from: a.position, to: b.position });
}
