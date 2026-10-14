/**
 * ReactionScheme - a multistep reaction laid out as a horizontal row.
 *
 * A reaction scheme reads left to right: `A --cond--> B --cond--> C`. This
 * mobject places each species ({@link MoleculeMobject}) in a row and draws a
 * {@link ReactionArrow} in the gap between each adjacent pair. It composes the
 * two existing chemistry primitives; it reinvents neither the molecule drawing
 * nor the arrow math.
 *
 * Layout. The row runs along a single horizontal centerline (y = 0). A cursor
 * walks left to right. For each species the cursor places the species' bounding
 * box center at `cursorX + width/2`, so the species' left edge lands on the
 * cursor. Between two species the cursor leaves `gap`, an arrow of length
 * `arrowLength`, then another `gap`. So the cursor advances by
 * `width + gap + arrowLength + gap` per step. The arrow aligns to the same
 * centerline and carries the step's conditions.
 *
 * The object is a {@link VGroup}: its children are the species and the arrows.
 * So it adds to a scene and animates with `Create` like any group.
 *
 * @example
 * ```typescript
 * const scheme = new ReactionScheme({
 *   species: [ethanol(), water(), methane()],
 *   steps: [
 *     { arrowKind: 'forward', conditionsAbove: 'H2SO4, Δ', conditionsBelow: '-H2O' },
 *     { arrowKind: 'reversible', conditionsAbove: 'cat.' },
 *   ],
 * });
 * scene.play(new Create(scheme));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants/colors';
import { MoleculeMobject } from './MoleculeMobject';
import { ReactionArrow, ReactionArrowKind } from './ReactionArrow';

/** One step between two adjacent species: the arrow kind and its condition labels. */
export interface ReactionStep {
  /** The reaction symbol for this step's arrow. Default: 'forward'. */
  arrowKind?: ReactionArrowKind;
  /** Label above the arrow (for example 'H2SO4, Δ'). Omit for none. */
  conditionsAbove?: string;
  /** Label below the arrow (for example '-H2O'). Omit for none. */
  conditionsBelow?: string;
}

/** Options for a {@link ReactionScheme}. */
export interface ReactionSchemeOptions {
  /** The species, laid left to right. At least two (a reactant and a product). */
  species: MoleculeMobject[];
  /**
   * One step per gap between adjacent species. Its length must equal
   * `species.length - 1` when given. Omit for all-forward arrows.
   */
  steps?: ReactionStep[];
  /** Horizontal space between a species and the next arrow, in scene units. Default: 1. */
  gap?: number;
  /** Length of each arrow, in scene units. Default: 2. */
  arrowLength?: number;
  /** Arrow color. Default: WHITE. The species keep their own atom colors. */
  color?: string;
}

/** Default horizontal space between a species and the next arrow. */
const DEFAULT_GAP = 1;

/** Default arrow length. */
const DEFAULT_ARROW_LENGTH = 2;

/** The y coordinate of the row centerline. All species and arrows align to it. */
const ROW_Y = 0;

export class ReactionScheme extends VGroup {
  private readonly _species: MoleculeMobject[];
  private readonly _arrows: ReactionArrow[] = [];
  private readonly _gap: number;
  private readonly _arrowLength: number;
  private readonly _schemeColor: string;

  constructor(options: ReactionSchemeOptions) {
    super();

    const {
      species,
      steps,
      gap = DEFAULT_GAP,
      arrowLength = DEFAULT_ARROW_LENGTH,
      color = WHITE,
    } = options;

    if (species.length < 2) {
      throw new Error(
        `ReactionScheme needs at least two species (a reactant and a product), ` +
          `but got ${species.length}.`,
      );
    }
    if (steps !== undefined && steps.length !== species.length - 1) {
      throw new Error(
        `ReactionScheme steps length must equal species.length - 1 ` +
          `(${species.length - 1}), but got ${steps.length}.`,
      );
    }

    this._species = [...species];
    this._gap = gap;
    this._arrowLength = arrowLength;
    this._schemeColor = color;

    this._layout(steps);
  }

  /** Place the species in a row and build an arrow in each gap. */
  private _layout(steps?: ReactionStep[]): void {
    const stepCount = this._species.length - 1;
    let cursorX = 0;

    for (let i = 0; i < this._species.length; i++) {
      const species = this._species[i];
      const width = species.getWidth();

      // Place the species' bounding-box center on the centerline. getCenter() is
      // the bounding-box center, so this lands the species' left edge on cursorX.
      species.moveTo([cursorX + width / 2, ROW_Y, 0]);
      this.add(species);
      cursorX += width;

      if (i < stepCount) {
        const arrowStartX = cursorX + this._gap;
        const arrowEndX = arrowStartX + this._arrowLength;
        const step = steps?.[i];
        this._arrows.push(this._buildArrow(arrowStartX, arrowEndX, step));
        cursorX = arrowEndX + this._gap;
      }
    }

    // Add arrows after the species so they render in front of the molecules.
    for (const arrow of this._arrows) {
      this.add(arrow);
    }
  }

  /** Build one arrow spanning [startX, endX] on the centerline, from a step. */
  private _buildArrow(startX: number, endX: number, step?: ReactionStep): ReactionArrow {
    const start: Vector3Tuple = [startX, ROW_Y, 0];
    const end: Vector3Tuple = [endX, ROW_Y, 0];
    return new ReactionArrow({
      start,
      end,
      kind: step?.arrowKind ?? 'forward',
      conditionsAbove: step?.conditionsAbove,
      conditionsBelow: step?.conditionsBelow,
      color: this._schemeColor,
    });
  }

  /** The species, in input (left-to-right) order. */
  getSpecies(): MoleculeMobject[] {
    return [...this._species];
  }

  /** The arrows, one per gap, in left-to-right order. */
  getArrows(): ReactionArrow[] {
    return [...this._arrows];
  }

  /** The number of steps (arrows), which is `species.length - 1`. */
  getStepCount(): number {
    return this._arrows.length;
  }
}
