/**
 * Membrane - a horizontal phospholipid bilayer.
 *
 * The bilayer has two mirrored rows of phospholipids. Each lipid is a round
 * head and two tails. The heads face out (away from the midline) and the tails
 * face in (toward the midline), so the two tail layers meet in the middle.
 * Use `gapAt` to leave an opening where a protein embeds, for example the
 * complexes of the electron transport chain.
 *
 * The membrane is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const membrane = new Membrane({ length: 10, spacing: 0.3 });
 * membrane.gapAt(-1, 1); // room for a protein complex
 * scene.play(new FadeIn(membrane));
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Circle } from '../geometry/Circle';
import { Line } from '../geometry/Line';
import { LipidRender, MembraneGap, MembraneOptions, MembraneRow } from './biologyTypes';

/** Default membrane lipid color (a warm yellow). */
const DEFAULT_LIPID_COLOR = '#F4B942';

/** Default bilayer length. */
const DEFAULT_LENGTH = 8;

/** Default distance between neighbor lipids in a row. */
const DEFAULT_SPACING = 0.3;

/** Default head radius. */
const DEFAULT_HEAD_RADIUS = 0.1;

/** Default tail length. */
const DEFAULT_TAIL_LENGTH = 0.3;

/** Default gap between the inner tail ends of the two rows. */
const DEFAULT_CORE_GAP = 0.1;

/** Default tail stroke width. */
const DEFAULT_TAIL_STROKE_WIDTH = 2;

/** Tail x offset from the head center, as a fraction of the head radius. */
const TAIL_OFFSET_FRACTION = 0.5;

/** Where a tail meets the head circle, as a fraction of the head radius below the head center. */
const TAIL_START_FRACTION = 0.866;

/** Options with every default applied and the lipid count resolved. */
interface ResolvedMembraneOptions extends Required<Omit<MembraneOptions, 'numLipids' | 'spacing'>> {
  /** Lipids per row. */
  count: number;
}

/** Check the numbers and resolve the lipids per row. */
function resolveLipidCount(length: number, numLipids?: number, spacing = DEFAULT_SPACING): number {
  if (!(length > 0)) throw new Error('Membrane: length must be positive');
  if (numLipids !== undefined && !(numLipids >= 1)) {
    throw new Error('Membrane: numLipids must be at least 1');
  }
  if (!(spacing > 0)) throw new Error('Membrane: spacing must be positive');
  return numLipids !== undefined
    ? Math.floor(numLipids)
    : Math.max(1, Math.round(length / spacing));
}

/** Apply the defaults and resolve the lipid count. */
function resolveMembraneOptions(options: MembraneOptions): ResolvedMembraneOptions {
  const length = options.length ?? DEFAULT_LENGTH;
  const count = resolveLipidCount(length, options.numLipids, options.spacing);
  return {
    length,
    count,
    headRadius: options.headRadius ?? DEFAULT_HEAD_RADIUS,
    tailLength: options.tailLength ?? DEFAULT_TAIL_LENGTH,
    coreGap: options.coreGap ?? DEFAULT_CORE_GAP,
    headColor: options.headColor ?? DEFAULT_LIPID_COLOR,
    tailColor: options.tailColor ?? DEFAULT_LIPID_COLOR,
    tailStrokeWidth: options.tailStrokeWidth ?? DEFAULT_TAIL_STROKE_WIDTH,
    gaps: options.gaps ?? [],
    center: options.center ?? [0, 0, 0],
  };
}

export class Membrane extends VGroup {
  protected _length: number;
  protected _headRadius: number;
  protected _tailLength: number;
  protected _coreGap: number;
  protected _headColor: string;
  protected _tailColor: string;
  protected _tailStrokeWidth: number;
  protected _center: [number, number, number];
  protected _gaps: MembraneGap[] = [];
  protected _upperLipids: LipidRender[] = [];
  protected _lowerLipids: LipidRender[] = [];

  /** The upper row of lipids (heads up). */
  readonly upperRow: VGroup;
  /** The lower row of lipids (heads down). */
  readonly lowerRow: VGroup;

  constructor(options: MembraneOptions = {}) {
    super();

    const cfg = resolveMembraneOptions(options);
    const { length, count } = cfg;
    const { headRadius, tailLength, coreGap, headColor, tailColor, tailStrokeWidth } = cfg;
    const { gaps, center } = cfg;

    this._length = length;
    this._headRadius = headRadius;
    this._tailLength = tailLength;
    this._coreGap = coreGap;
    this._headColor = headColor;
    this._tailColor = tailColor;
    this._tailStrokeWidth = tailStrokeWidth;
    this._center = [center[0], center[1], center[2]];

    const step = length / count;

    this.upperRow = new VGroup();
    this.lowerRow = new VGroup();

    for (let i = 0; i < count; i++) {
      const x = -length / 2 + step * (i + 0.5);
      this._upperLipids.push(this._buildLipid('upper', x));
      this._lowerLipids.push(this._buildLipid('lower', x));
    }
    for (const lipid of this._upperLipids) this.upperRow.add(lipid.group);
    for (const lipid of this._lowerLipids) this.lowerRow.add(lipid.group);
    this.add(this.upperRow, this.lowerRow);

    this.shift(this._center);

    for (const [a, b] of gaps) this.gapAt(a, b);
  }

  /** Build one lipid at membrane x and in the given row. */
  private _buildLipid(row: MembraneRow, x: number): LipidRender {
    const sign = row === 'upper' ? 1 : -1;
    const r = this._headRadius;
    const innerY = sign * (this._coreGap / 2);
    const headY = sign * (this._coreGap / 2 + this._tailLength + r);
    const tailStartY = headY - sign * r * TAIL_START_FRACTION;
    const dx = r * TAIL_OFFSET_FRACTION;

    const head = new Circle({
      radius: r,
      center: [x, headY, 0],
      color: this._headColor,
      fillOpacity: 1,
      strokeWidth: 1,
    });
    head.fillColor = this._headColor;

    const makeTail = (offset: number): Line =>
      new Line({
        start: [x + offset, tailStartY, 0],
        end: [x + offset, innerY, 0],
        color: this._tailColor,
        strokeWidth: this._tailStrokeWidth,
      });
    const tails: [Line, Line] = [makeTail(-dx), makeTail(dx)];

    const group = new VGroup(head, ...tails);
    return { row, x, head, tails, group };
  }

  /** Number of lipids in each row. */
  get numLipids(): number {
    return this._upperLipids.length;
  }

  /** The lipids of a row, in left to right order. */
  getLipids(row: MembraneRow): LipidRender[] {
    return [...(row === 'upper' ? this._upperLipids : this._lowerLipids)];
  }

  /** The gaps, as `[xMin, xMax]` ranges in membrane coordinates. */
  getGaps(): MembraneGap[] {
    return this._gaps.map(([a, b]) => [a, b]);
  }

  /** Length of the bilayer along x. */
  getLength(): number {
    return this._length;
  }

  /** Head center y of the upper row, in world coordinates. */
  getTopY(): number {
    return this._center[1] + this._coreGap / 2 + this._tailLength + this._headRadius;
  }

  /** Head center y of the lower row, in world coordinates. */
  getBottomY(): number {
    return this._center[1] - (this._coreGap / 2 + this._tailLength + this._headRadius);
  }

  /** Distance between the head centers of the two rows. */
  getThickness(): number {
    return this.getTopY() - this.getBottomY();
  }

  /**
   * Remove every lipid whose x lies in `[xMin, xMax]` from both rows.
   *
   * The range uses membrane coordinates, so x = 0 is the membrane center. A
   * reversed range is sorted. A repeat of a recorded gap changes nothing.
   *
   * @returns This membrane, for chaining.
   */
  gapAt(xMin: number, xMax: number): this {
    const lo = Math.min(xMin, xMax);
    const hi = Math.max(xMin, xMax);
    if (!this._gaps.some(([a, b]) => a === lo && b === hi)) {
      this._gaps.push([lo, hi]);
    }
    const inGap = (lipid: LipidRender): boolean => lipid.x >= lo && lipid.x <= hi;

    for (const lipid of this._upperLipids.filter(inGap)) this.upperRow.remove(lipid.group);
    for (const lipid of this._lowerLipids.filter(inGap)) this.lowerRow.remove(lipid.group);
    this._upperLipids = this._upperLipids.filter((l) => !inGap(l));
    this._lowerLipids = this._lowerLipids.filter((l) => !inGap(l));
    return this;
  }
}
