/**
 * Mitochondrion3D: a rod-shaped mitochondrion, whole or cut open.
 *
 * Whole: a (slightly bent) capsule. With `cutaway: true` the top is sliced
 * off along the long axis: the outer membrane is a low wall around the rim,
 * and inside it the inner membrane folds into the cristae, plates that poke
 * into the matrix from alternate sides.
 *
 * Built along local +X with the cut facing local +Z; `direction` and `up`
 * turn it.
 *
 * Parts (whole): `outerMembrane`. Parts (cutaway): `matrix`, `outerMembrane`,
 * `innerMembrane`, and `lid` with `lid: true`.
 *
 * A cutaway with `lid: true` starts closed: a lid covers the cut, so it looks
 * like a whole mitochondrion. {@link openAnimation} sweeps the lid away, top
 * first, and shows the cristae.
 * Anchors: `outerMembrane`, `end`, `center`; cutaway adds `cristae`,
 * `innerMembrane`, `matrix`.
 */

import type { Vector3Tuple } from '../../../core/Mobject';
import type { Animation, AnimationOptions } from '../../../animation/Animation';
import { SweepReveal3D } from '../../../animation/creation/Create3D';
import { smooth } from '../../../rate-functions';
import { Capsule3D } from '../../three-d/Capsule3D';
import { Extrude3D } from '../../three-d/Extrude3D';
import { interpolateColor } from '../../../utils/color';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import { byDetail, cristaeOutline, eulerFromAxes, stadiumOutline } from './geometry';
import { Organelle3D, type BuildStep } from './Organelle3D';
import type { Organelle3DOptions } from './cell3dTypes';

/** Options of {@link Mitochondrion3D}. */
export interface Mitochondrion3DOptions extends Organelle3DOptions {
  /** End-to-end length. Default: 1.6 */
  length?: number;
  /** Radius of the rod. Default: 0.3 */
  radius?: number;
  /** Bend of a whole mitochondrion in radians (ignored for a cutaway). Default: 0.35 */
  bend?: number;
  /** Cut the top off to show the cristae. Default: false */
  cutaway?: boolean;
  /** Number of cristae folds (cutaway). Default: by detail (5, 7, 9) */
  cristae?: number;
  /** Direction of the long axis. Default: [1, 0, 0] */
  direction?: Vector3Tuple;
  /** Direction the cut faces (and the bend plane normal). Default: [0, 0, 1] */
  up?: Vector3Tuple;
  /** Cutaway only: start closed under a lid that {@link Mitochondrion3D.openAnimation} removes. Default: false */
  lid?: boolean;
}

export class Mitochondrion3D extends Organelle3D {
  private readonly _cutaway: boolean;
  private readonly _up: Vector3Tuple;
  private readonly _direction: Vector3Tuple;

  constructor(options: Mitochondrion3DOptions = {}) {
    super('mitochondrion', options);
    const {
      length = 1.6,
      radius = 0.3,
      bend = 0.35,
      cutaway = false,
      direction = [1, 0, 0],
      up = [0, 0, 1],
    } = options;
    this._cutaway = cutaway;
    this._up = [...up];
    this._direction = [...direction];
    const r = radius;
    const a = Math.max(0.05, length / 2 - r);
    const main = this._mainColor;
    const segs = byDetail(this._detail, [8, 12, 16] as const);

    if (!cutaway) {
      const body = this._addPart(
        'outerMembrane',
        new Capsule3D({
          radius: r,
          length: 2 * a,
          bend,
          direction: [1, 0, 0],
          radialSegments: byDetail(this._detail, [16, 24, 32] as const),
          lengthSegments: byDetail(this._detail, [8, 12, 18] as const),
          capSegments: byDetail(this._detail, [5, 7, 9] as const),
          color: main,
        }),
      );
      this._setAnchor('outerMembrane', [0, 0, r], body);
      this._setAnchor('end', [a + r, 0, 0], body);
      this._setAnchor('center', [0, 0, 0], body);
      this._finish(eulerFromAxes(direction, up));
      return;
    }

    const wall = 0.22 * r;
    const gap = 0.1 * r;
    const innerWall = 0.15 * r;
    const lumenB = r - wall - gap - innerWall;
    const wallH = 0.75 * r;
    const innerH = 0.62 * r;
    const matrixColor = this._partColor('matrix', interpolateColor(main, '#FFE4E1', 0.72));
    const innerColor = this._partColor('innerMembrane', interpolateColor(main, '#ffb3b3', 0.45));
    const count = Math.max(1, options.cristae ?? byDetail(this._detail, [5, 7, 9] as const));

    const body = this._addPart(
      'matrix',
      new Extrude3D({
        outline: stadiumOutline(a, r, segs),
        depth: 0.9 * r,
        bevel: 0.42 * r,
        bevelSegments: byDetail(this._detail, [3, 5, 7] as const),
        center: [0, 0, -0.45 * r],
        color: main,
        capColor: matrixColor,
      }),
    );
    this._addPart(
      'outerMembrane',
      new Extrude3D({
        outline: stadiumOutline(a, r, segs),
        holes: [stadiumOutline(a, r - wall, segs)],
        depth: wallH,
        bevel: 0.35 * wall,
        bevelSegments: 2,
        center: [0, 0, wallH / 2 - 0.02 * r],
        color: main,
        capColor: interpolateColor(main, '#ffffff', 0.3),
      }),
    );
    this._addPart(
      'innerMembrane',
      new Extrude3D({
        outline: stadiumOutline(a, r - wall - gap, segs),
        holes: [cristaeOutline(a, lumenB, count, 1.25 * lumenB, 0.5 * innerWall + 0.02 * r)],
        depth: innerH,
        bevel: 0.3 * innerWall,
        bevelSegments: 2,
        center: [0, 0, innerH / 2 - 0.02 * r],
        color: innerColor,
        capColor: interpolateColor(innerColor, '#ffffff', 0.35),
      }),
    );
    const mid = Math.floor(count / 2);
    const foldX = -a + ((mid + 0.5) * 2 * a) / count;
    const foldY = mid % 2 === 0 ? -lumenB + 1.25 * lumenB : lumenB - 1.25 * lumenB;
    this._setAnchor('cristae', [foldX, foldY, innerH], body);
    this._setAnchor('innerMembrane', [-a - lumenB, 0, innerH], body);
    const between = -a + ((mid + 1) * 2 * a) / count;
    this._setAnchor('matrix', [between, 0, 0], body);
    if (options.lid) {
      // The top half of the rod, the mirror of the matrix body below the cut.
      this._addPart(
        'lid',
        new Extrude3D({
          outline: stadiumOutline(a, r, segs),
          depth: 0.9 * r,
          bevel: 0.42 * r,
          bevelSegments: byDetail(this._detail, [3, 5, 7] as const),
          center: [0, 0, 0.45 * r],
          color: main,
          capColor: main,
        }),
      );
    }
    this._setAnchor('outerMembrane', [0, -(r - wall / 2), wallH], body);
    this._setAnchor('end', [a + r, 0, 0], body);
    this._setAnchor('center', [0, 0, 0], body);
    this._finish(eulerFromAxes(direction, up));
  }

  /** Whether the mitochondrion is cut open. */
  isCutaway(): boolean {
    return this._cutaway;
  }

  /**
   * Open a cutaway with a lid: the lid is swept away from the top down, and
   * the cristae show. The lid stays hidden at the end. With no lid it does
   * nothing visible.
   */
  openAnimation(options: AnimationOptions = {}): Animation {
    const lid = this.getPart('lid');
    const up = this._up;
    // Played backwards, a reveal sweep hides the lid from its far (top) end.
    return new SweepReveal3D(lid ?? this, {
      axis: up,
      duration: 1.6,
      ...options,
      rateFunc: (t: number) => (lid ? 1 - smooth(t) : 1),
    });
  }

  protected _buildSteps(): BuildStep[] {
    if (!this._cutaway) return [{ part: this.getPart('outerMembrane')!, mode: 'grow' }];
    const steps: BuildStep[] = [
      { part: this.getPart('matrix')!, mode: 'create', weight: 1.2 },
      { part: this.getPart('outerMembrane')!, mode: 'create' },
      { part: this.getPart('innerMembrane')!, mode: 'create', weight: 1.2 },
    ];
    const lid = this.getPart('lid');
    if (lid) steps.push({ part: lid, mode: 'create' });
    return steps;
  }

  protected override _defaultBuildDuration(): number {
    return this._cutaway ? 2.5 : 1.2;
  }

  override getFocusFraming(): CameraFocusOptions {
    // Look down into the cut, from the side of the long axis.
    const d = this._direction;
    const tilt = Math.atan2(Math.hypot(this._up[0], this._up[1]), this._up[2]);
    return {
      fill: 0.55,
      phi: Math.min(1.2, 0.55 + tilt),
      theta: Math.atan2(d[1], d[0]) - Math.PI / 2,
    };
  }
}
