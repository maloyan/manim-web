/**
 * CellTour: an {@link ExplainerTour} over a {@link Cell3D} that keeps every
 * focus stop clean, so the focused organelle is the only bright thing:
 * - the free ribosomes round the target shrink away during the camera move
 *   (`Cell3D.clearAround`), and the rest of the crowd fades to `crowdOpacity`;
 * - the focus dim also mutes the rim and highlight of the neighbours, and
 *   hides every neighbour that stands between the final camera and the target
 *   (`FocusDim` options `mute` and `occlusion`).
 * A stop with `dim: false` brings everything back.
 *
 * @example
 * ```ts
 * const tour = new CellTour(scene, cell);
 * await tour.run([{ target: cell.getOrganelle('golgi apparatus') }]);
 * await tour.finish();
 * ```
 */

import type { ThreeDScene } from '../../../core/ThreeDScene';
import type { Mobject } from '../../../core/Mobject';
import type { Animation } from '../../../animation/Animation';
import { focusCamera } from '../../../animation/camera/CameraFocus';
import type { FocusDimOptions } from '../../../animation/camera/FocusDim';
import {
  ExplainerTour,
  type ExplainerTourOptions,
  type TourStop,
} from '../../annotation/ExplainerTour';
import type { Cell3D, CellClearOptions } from './Cell3D';
import { FreeRibosomes3D } from './FreeRibosomes3D';

/** Options of {@link CellTour}. */
export interface CellTourOptions extends ExplainerTourOptions {
  /** How the crowd clears round a stop target. Default: the camera move duration */
  clear?: CellClearOptions;
  /** Opacity of the free-ribosome crowd while a focus dim is on. Default: 0.15 */
  crowdOpacity?: number;
  /** Hide the neighbours between the camera and a stop target. Default: true */
  hideOccluders?: boolean;
}

/** Default focus dim of a cell tour: a strong wash toward the background, rims off. */
const CELL_DIM: FocusDimOptions = { strength: 0.82, opacity: 0.7, mute: 0.95 };

export class CellTour extends ExplainerTour {
  readonly cell: Cell3D;
  private readonly _clear: CellClearOptions;
  private readonly _crowdOpacity: number;
  private readonly _hideOccluders: boolean;
  private _finishing = false;

  constructor(scene: ThreeDScene, cell: Cell3D, options: CellTourOptions = {}) {
    const { clear = {}, crowdOpacity = 0.15, hideOccluders = true, ...tour } = options;
    super(scene, { ...tour, dim: { ...CELL_DIM, ...tour.dim } });
    this.cell = cell;
    this._clear = clear;
    this._crowdOpacity = crowdOpacity;
    this._hideOccluders = hideOccluders;
  }

  /** The tour's enter animations, plus the crowd clearing round the stop target. */
  override enterAnimations(stop: TourStop): Animation[] {
    const target = stop.target;
    const dimmed = (stop.dim ?? target !== undefined) !== false;
    if (target === undefined) return super.enterAnimations(stop);
    const framing = this.framingFor(stop);
    const crowd = new Set<Mobject>(
      this.cell.getOrganellesOfKind('ribosome').filter((o) => o instanceof FreeRibosomes3D),
    );
    const own: FocusDimOptions = {
      leafOpacity: (leaf) => (inside(leaf, crowd) ? this._crowdOpacity : undefined),
      ...(this._hideOccluders
        ? { occlusion: { target, camera: () => focusCamera(this.scene, target, framing) } }
        : {}),
    };
    const dim = dimmed ? { ...own, ...(typeof stop.dim === 'object' ? stop.dim : {}) } : false;
    const anims = super.enterAnimations({ ...stop, dim });
    const duration = framing.duration ?? framing.runTime ?? 1.5;
    // A point target clears a sphere of `clear.radius` (default: a third of the cell radius).
    const radius =
      this._clear.radius ?? (Array.isArray(target) ? 0.35 * this._cellRadius() : undefined);
    const clearTarget = dimmed ? target : null;
    anims.push(this.cell.clearAround(clearTarget, { duration, ...this._clear, radius }));
    return anims;
  }

  private _cellRadius(): number {
    return this.cell.membrane.getInnerRadii()[1];
  }

  /** Fade the annotations, the dim and the caption away, and bring the crowd back. */
  override async finish(): Promise<void> {
    this._finishing = true;
    try {
      await super.finish();
    } finally {
      this._finishing = false;
    }
  }

  /** The exit animations; in {@link finish} also the crowd's return. */
  override exitAnnotations(): Animation[] {
    const anims = super.exitAnnotations();
    if (this._finishing) anims.push(this.cell.clearAround(null, { duration: 0.8, ...this._clear }));
    return anims;
  }
}

/** Whether `leaf` is one of `roots` or lies under one of them. */
function inside(leaf: Mobject, roots: ReadonlySet<Mobject>): boolean {
  for (let m: Mobject | null = leaf; m; m = m.parent) if (roots.has(m)) return true;
  return false;
}
