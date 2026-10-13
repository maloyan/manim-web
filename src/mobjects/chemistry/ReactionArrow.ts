/**
 * ReactionArrow - a straight reaction-scheme arrow between chemical species.
 *
 * A reaction scheme draws a species on the left, an arrow, and a species on the
 * right: `A + B --cat--> C`. The arrow states the reaction direction and carries
 * the conditions (catalyst, solvent, heat) above and below its shaft. This is the
 * straight species-to-species arrow, distinct from the curved
 * {@link ElectronPushingArrow} that shows electron movement inside one mechanism
 * step.
 *
 * Four kinds cover the common symbols:
 * - `'forward'` — one shaft with a single filled head at `end` (A -> B).
 * - `'reversible'` — two offset parallel shafts, the top head points to `end`,
 *   the bottom head points to `start`. The standard reversible-reaction symbol.
 * - `'equilibrium'` — like `'reversible'` but with HALF heads (harpoons). The
 *   repository has no half-head tip primitive, so each harpoon is drawn as one
 *   barb stroke (the same single-barb technique the fishhook uses in
 *   {@link ElectronPushingArrow}). The two harpoon barbs sit on opposite sides,
 *   the conventional equilibrium symbol.
 * - `'resonance'` — one shaft with a filled head at BOTH ends. The resonance
 *   symbol between contributing structures.
 *
 * The object is a {@link VGroup}: its children are the shaft {@link Line}s, the
 * head tips, and the optional condition {@link Text} labels. So it adds to a
 * scene and animates with `Create` like any group, and the usual Mobject
 * transforms position it.
 *
 * Primitive reuse: shafts are {@link Line}, filled heads are
 * {@link ArrowTriangleFilledTip}, condition labels are {@link Text}. No arrow
 * math is reinvented.
 *
 * @example
 * ```typescript
 * // A + B --cat., heat--> C (conditions above, solvent below).
 * const arrow = new ReactionArrow({
 *   start: [0, 0, 0],
 *   end: [2, 0, 0],
 *   kind: 'forward',
 *   conditionsAbove: 'cat., Δ',
 *   conditionsBelow: 'H2O',
 * });
 * scene.play(new Create(arrow));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { WHITE } from '../../constants/colors';
import { Line } from '../geometry/Line';
import { ArrowTriangleFilledTip } from '../geometry/ArrowTips';
import { Text } from '../text/Text';

/** The reaction symbol this arrow draws. */
export type ReactionArrowKind = 'forward' | 'reversible' | 'equilibrium' | 'resonance';

/** Options for a {@link ReactionArrow}. */
export interface ReactionArrowOptions {
  /** Tail of the arrow (the reactant side). */
  start: Vector3Tuple;
  /** Head of the arrow (the product side). */
  end: Vector3Tuple;
  /** The reaction symbol. Default: 'forward'. */
  kind?: ReactionArrowKind;
  /** Label centered just above the arrow midpoint (for example 'cat., heat'). Omit for no label. */
  conditionsAbove?: string;
  /** Label centered just below the arrow midpoint (for example 'H2O'). Omit for no label. */
  conditionsBelow?: string;
  /** Shaft and head color. Default: WHITE. */
  color?: string;
  /** Stroke width in pixels. Default: Manim's default. */
  strokeWidth?: number;
  /** Condition label font size in points. Default: 24. */
  fontSize?: number;
}

/** Below this length the arrow is degenerate; a fallback direction keeps it from throwing. */
const MIN_LENGTH = 1e-9;

/** Perpendicular gap of each parallel shaft from the center line, in scene units. */
const PARALLEL_OFFSET = 0.08;

/** Gap of a condition label center from the arrow midpoint, in scene units. */
const LABEL_GAP = 0.3;

export class ReactionArrow extends VGroup {
  private readonly _start: Vector3Tuple;
  private readonly _end: Vector3Tuple;
  private readonly _kind: ReactionArrowKind;
  private readonly _conditionsAbove?: string;
  private readonly _conditionsBelow?: string;
  private readonly _arrowColor: string;
  private readonly _arrowStrokeWidth: number;
  private readonly _fontSize: number;

  private readonly _shafts: Line[] = [];
  private readonly _tips: VMobject[] = [];
  private _aboveLabel: Text | null = null;
  private _belowLabel: Text | null = null;

  constructor(options: ReactionArrowOptions) {
    super();

    const {
      start,
      end,
      kind = 'forward',
      conditionsAbove,
      conditionsBelow,
      color = WHITE,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      fontSize = 24,
    } = options;

    this._start = [start[0], start[1], start[2] ?? 0];
    this._end = [end[0], end[1], end[2] ?? 0];
    this._kind = kind;
    this._conditionsAbove = conditionsAbove;
    this._conditionsBelow = conditionsBelow;
    this._arrowColor = color;
    this._arrowStrokeWidth = strokeWidth;
    this._fontSize = fontSize;

    this.color = color;
    this.strokeWidth = strokeWidth;

    this._build();
  }

  /** Build the shafts, heads and labels for the chosen kind. Safe when start == end. */
  private _build(): void {
    const [x0, y0] = this._start;
    const [x1, y1] = this._end;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const length = Math.hypot(dx, dy);

    // Unit heading and its left normal. For a degenerate arrow (start == end) the
    // heading is undefined, so fall back to +x; nothing throws and the heads
    // collapse onto the point.
    let ux = 1;
    let uy = 0;
    if (length >= MIN_LENGTH) {
      ux = dx / length;
      uy = dy / length;
    }
    const nx = -uy;
    const ny = ux;

    switch (this._kind) {
      case 'forward':
        this._buildForward([ux, uy, 0]);
        break;
      case 'resonance':
        this._buildResonance([ux, uy, 0]);
        break;
      case 'reversible':
        this._buildDoubleShaft([ux, uy, 0], [nx, ny, 0], 'full');
        break;
      case 'equilibrium':
        this._buildDoubleShaft([ux, uy, 0], [nx, ny, 0], 'harpoon');
        break;
    }

    this._buildLabels([nx, ny, 0], length);
  }

  /** One shaft start->end, one filled head at end. */
  private _buildForward(dir: Vector3Tuple): void {
    this._addShaft(this._start, this._end);
    this._addFilledTip(this._end, dir);
  }

  /** One shaft start->end, a filled head at both ends (the resonance symbol). */
  private _buildResonance(dir: Vector3Tuple): void {
    this._addShaft(this._start, this._end);
    this._addFilledTip(this._end, dir);
    this._addFilledTip(this._start, [-dir[0], -dir[1], -dir[2]]);
  }

  /**
   * Two parallel shafts: the top one points to `end`, the bottom to `start`.
   *
   * `heads: 'full'` gives the reversible symbol (filled triangle heads).
   * `heads: 'harpoon'` gives the equilibrium symbol (single-barb half heads on
   * opposite sides).
   */
  private _buildDoubleShaft(
    dir: Vector3Tuple,
    normal: Vector3Tuple,
    heads: 'full' | 'harpoon',
  ): void {
    const off: Vector3Tuple = [normal[0] * PARALLEL_OFFSET, normal[1] * PARALLEL_OFFSET, 0];
    const back: Vector3Tuple = [-dir[0], -dir[1], -dir[2]];

    // Top shaft on the +normal side, head points to `end`.
    const topStart = this._shift(this._start, off);
    const topEnd = this._shift(this._end, off);
    this._addShaft(topStart, topEnd);

    // Bottom shaft on the -normal side, head points to `start`.
    const botStart = this._shift(this._start, [-off[0], -off[1], 0]);
    const botEnd = this._shift(this._end, [-off[0], -off[1], 0]);
    this._addShaft(botStart, botEnd);

    if (heads === 'full') {
      this._addFilledTip(topEnd, dir);
      this._addFilledTip(botStart, back);
    } else {
      // Harpoon barbs sit on opposite sides: top barb on +normal, bottom on -normal.
      this._addHarpoonTip(topEnd, dir, normal);
      this._addHarpoonTip(botStart, back, [-normal[0], -normal[1], 0]);
    }
  }

  /** Add a straight shaft line from `a` to `b`. */
  private _addShaft(a: Vector3Tuple, b: Vector3Tuple): void {
    const shaft = new Line({
      start: a,
      end: b,
      color: this._arrowColor,
      strokeWidth: this._arrowStrokeWidth,
    });
    this._shafts.push(shaft);
    this.add(shaft);
  }

  /** Head size in scene units, scaled down for short arrows. */
  private _headLength(): number {
    const length = Math.hypot(this._end[0] - this._start[0], this._end[1] - this._start[1]);
    return Math.min(0.22, 0.2 * length) || 0.22;
  }

  /** Add a filled triangle head at `position`, pointing along `dir`. */
  private _addFilledTip(position: Vector3Tuple, dir: Vector3Tuple): void {
    const len = this._headLength();
    const tip = new ArrowTriangleFilledTip({
      position,
      direction: dir,
      length: len,
      width: 0.5 * len,
      color: this._arrowColor,
      strokeWidth: this._arrowStrokeWidth,
    });
    this._tips.push(tip);
    this.add(tip);
  }

  /**
   * Add a half head (harpoon) at `position`, pointing along `dir`, with its single
   * barb on the `side` normal. The repository has no half-head tip primitive, so
   * the barb is one straight stroke from the tip point back to one corner.
   */
  private _addHarpoonTip(position: Vector3Tuple, dir: Vector3Tuple, side: Vector3Tuple): void {
    const len = this._headLength();
    const width = 0.5 * len;
    const [px, py] = position;
    const baseX = px - dir[0] * len;
    const baseY = py - dir[1] * len;
    const cornerX = baseX + side[0] * width;
    const cornerY = baseY + side[1] * width;

    const barb = new Line({
      start: [px, py, 0],
      end: [cornerX, cornerY, 0],
      color: this._arrowColor,
      strokeWidth: this._arrowStrokeWidth,
    });
    this._tips.push(barb);
    this.add(barb);
  }

  /** Place the condition labels above and below the arrow midpoint, centered. */
  private _buildLabels(normal: Vector3Tuple, length: number): void {
    const midX = (this._start[0] + this._end[0]) / 2;
    const midY = (this._start[1] + this._end[1]) / 2;
    // For a degenerate arrow the normal still has unit length (fallback heading),
    // so the labels stay readable instead of collapsing onto the point.
    void length;

    if (this._conditionsAbove !== undefined) {
      const label = new Text({
        text: this._conditionsAbove,
        fontSize: this._fontSize,
        color: this._arrowColor,
      });
      label.moveTo([midX + normal[0] * LABEL_GAP, midY + normal[1] * LABEL_GAP, 0]);
      this._aboveLabel = label;
      this.add(label);
    }

    if (this._conditionsBelow !== undefined) {
      const label = new Text({
        text: this._conditionsBelow,
        fontSize: this._fontSize,
        color: this._arrowColor,
      });
      label.moveTo([midX - normal[0] * LABEL_GAP, midY - normal[1] * LABEL_GAP, 0]);
      this._belowLabel = label;
      this.add(label);
    }
  }

  /** Shift a point by a delta vector. */
  private _shift(p: Vector3Tuple, d: Vector3Tuple): Vector3Tuple {
    return [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  }

  /** The tail point, as given. */
  getStart(): Vector3Tuple {
    return [...this._start];
  }

  /** The head point, as given. */
  getEnd(): Vector3Tuple {
    return [...this._end];
  }

  /** The reaction symbol this arrow draws. */
  getKind(): ReactionArrowKind {
    return this._kind;
  }

  /** The shaft lines (one for forward/resonance, two for reversible/equilibrium). */
  getShafts(): Line[] {
    return [...this._shafts];
  }

  /** The head mobjects (triangles for full heads, barb strokes for harpoons). */
  getTips(): VMobject[] {
    return [...this._tips];
  }

  /** The above-arrow condition label, or null when none was given. */
  getAboveLabel(): Text | null {
    return this._aboveLabel;
  }

  /** The below-arrow condition label, or null when none was given. */
  getBelowLabel(): Text | null {
    return this._belowLabel;
  }

  override copy(): ReactionArrow {
    const clone = new ReactionArrow({
      start: this._start,
      end: this._end,
      kind: this._kind,
      conditionsAbove: this._conditionsAbove,
      conditionsBelow: this._conditionsBelow,
      color: this._arrowColor,
      strokeWidth: this._arrowStrokeWidth,
      fontSize: this._fontSize,
    });
    // copyChildren: false keeps the freshly built shafts, heads and labels.
    this._copyBaseAttributesInto(clone, { copyChildren: false, copyPosition: false });
    return clone;
  }
}
