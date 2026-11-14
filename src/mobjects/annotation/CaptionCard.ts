/**
 * CaptionCard: the manim-style lower-third caption of a narrated tour.
 *
 * A caption page is a stack of rows anchored to a frame corner:
 *   row 0: optional colour swatch (square or underline) + the title
 *   row 1: the body line (wrapped to the card width, dimmer shade)
 *   row 2: the footnote (still dimmer)
 *   or, for a legend page, one row per (swatch, text) entry.
 *
 * The card is a controller, not a mobject: every method returns an
 * Animation built from the repo's own Write / FadeIn / FadeOut /
 * LaggedStart / Transform, so it plays in `scene.play(...)`, runs in
 * parallel with a camera move, and seeks in the Player like any animation.
 * Row mobjects are pinned to the frame (ThreeDScene HUD) and added by the
 * animation that introduces them.
 *
 * @example
 * ```ts
 * const card = new CaptionCard({ scene });
 * await scene.play(card.show({ title: 'Nucleus', swatch: PURPLE, body: 'Stores DNA.' }));
 * await scene.play(card.revealNext()); // the body
 * await scene.play(card.update({ title: 'Ribosome', swatch: PINK }));
 * ```
 */

import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation } from '../../animation/Animation';
import { AnimationGroup } from '../../animation/AnimationGroup';
import { LaggedStart } from '../../animation/LaggedStart';
import { Create, Write } from '../../animation/creation/Create';
import { FadeIn } from '../../animation/fading/FadeIn';
import { FadeOut } from '../../animation/fading/FadeOut';
import { Transform } from '../../animation/transform/Transform';
import { Line } from '../geometry/Line';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import {
  ANNOTATION_FONT,
  AnnotationScene,
  backgroundOf,
  emOf,
  frameSizeOf,
  pinToFrame,
  placeTextTopLeft,
  resolvePalette,
  textBoxHeight,
  textBoxWidth,
  wrapText,
  type AnnotationPalette,
} from './annotationStyle';

/** One swatch + text row of a legend page. */
export interface LegendRow {
  color: string;
  text: string;
}

/** The content of one caption page. */
export interface CaptionContent {
  title: string;
  body?: string;
  footnote?: string;
  /** Swatch colour next to the title. No swatch when omitted. */
  swatch?: string;
  /** Legend entries; each one is a reveal step after the title. */
  rows?: LegendRow[];
  /**
   * 'caption' (default): title + body + footnote at caption sizes.
   * 'headline': a larger title and a subtitle (the body), no swatch.
   */
  style?: 'caption' | 'headline';
}

export type CaptionCorner = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export interface CaptionCardOptions {
  /** Host scene. Gives the frame size, background and HUD pinning. */
  scene?: AnnotationScene;
  /** Frame corner the card hugs. Default: 'bottom-left' */
  corner?: CaptionCorner;
  /** Distance from the frame edges (frame units). Default: 4% of the frame height */
  margin?: number;
  /** Max text width (frame units); the body wraps to it. Default: 62% of the frame width */
  maxWidth?: number;
  /**
   * Legibility backing behind the text:
   * 'soft' (default) a translucent background-colour plate, no stroke;
   * 'panel' a near-background panel with a thin stroke; 'none'.
   */
  backing?: 'soft' | 'panel' | 'none';
  /** Swatch shape. Default: 'square' */
  swatchStyle?: 'square' | 'underline';
  /** Font family. Default: the Text default (CMU Serif, manim style) */
  fontFamily?: string;
  /** Title size in points. Default: scales with the frame (30 pt at height 8) */
  titleSize?: number;
  /** Body size in points. Default: 0.6 x titleSize */
  bodySize?: number;
  /** Footnote size in points. Default: 0.5 x titleSize */
  footnoteSize?: number;
  /** Background colour the palette derives from. Default: the scene background */
  backgroundColor?: string;
  /** Primary text colour. Default: derived from the background */
  textColor?: string;
}

/** One revealable row: its mobjects and how each one enters. */
interface Row {
  parts: { mob: Mobject; enter: 'write' | 'fade' | 'create' }[];
  /** Bottom edge of the row (frame units), used to size the backing. */
  bottom: number;
  right: number;
}

/** A row while the page is being laid out. */
interface RowSpec {
  parts: Row['parts'];
  text: Text;
  swatch: Mobject | null;
  underline?: Line;
  /** Text offset from the block's left edge. */
  indent: number;
  /** Space above the row. */
  gap: number;
}

/** A laid-out caption page. */
interface Page {
  rows: Row[];
  top: number;
  left: number;
  backing: Rectangle | null;
}

const ROW_GAP_EM = 0.55;

export class CaptionCard {
  readonly scene: AnnotationScene | undefined;
  readonly palette: AnnotationPalette;
  private readonly _opts: Required<
    Omit<CaptionCardOptions, 'scene' | 'backgroundColor' | 'textColor'>
  >;
  private readonly _frame: { width: number; height: number };
  private _page: Page | null = null;
  /** Rows of the current page already revealed (record-time cursor). */
  private _revealed = 0;
  /** Mobjects on screen after the last returned animation (record-time). */
  private _visible: Mobject[] = [];

  constructor(options: CaptionCardOptions = {}) {
    this.scene = options.scene;
    this._frame = frameSizeOf(options.scene);
    const titleSize = options.titleSize ?? 30 * (this._frame.height / 8);
    this._opts = {
      corner: options.corner ?? 'bottom-left',
      margin: options.margin ?? 0.04 * this._frame.height,
      maxWidth: options.maxWidth ?? 0.62 * this._frame.width,
      backing: options.backing ?? 'soft',
      swatchStyle: options.swatchStyle ?? 'square',
      fontFamily: options.fontFamily ?? ANNOTATION_FONT,
      titleSize,
      bodySize: options.bodySize ?? 0.6 * titleSize,
      footnoteSize: options.footnoteSize ?? 0.5 * titleSize,
    };
    this.palette = resolvePalette(
      options.backgroundColor ?? backgroundOf(options.scene),
      options.textColor,
    );
  }

  /** Mobjects the card shows after the animations created so far. */
  getVisibleMobjects(): Mobject[] {
    return [...this._visible];
  }

  /**
   * Bring the card in with `content`. Reveals the title row; pass
   * `reveal: 'all'` to bring every row at once.
   */
  show(content: CaptionContent, options: { reveal?: 'title' | 'all' } = {}): Animation {
    const out = this._visible.length > 0 ? this._fadeOutVisible() : null;
    this._page = this._buildPage(content);
    this._revealed = 0;
    const steps = options.reveal === 'all' ? this._page.rows.length : 1;
    const enter = this._revealRows(steps, true);
    return out ? new LaggedStart([out, enter], { lagRatio: 0.45 }) : enter;
  }

  /** Reveal the next row (body, then footnote, or the next legend row). */
  revealNext(): Animation {
    return this._revealRows(1, false);
  }

  /** Reveal every remaining row together, staggered. */
  revealAll(): Animation {
    const rest = this._page ? this._page.rows.length - this._revealed : 0;
    return this._revealRows(Math.max(rest, 1), false);
  }

  /**
   * Swap to a new page: the old text fades out, the new title writes in.
   * Same as {@link show} while a page is visible.
   */
  update(content: CaptionContent, options: { reveal?: 'title' | 'all' } = {}): Animation {
    return this.show(content, options);
  }

  /** Fade the whole card out. */
  hide(): Animation {
    const out = this._fadeOutVisible();
    this._page = null;
    this._revealed = 0;
    return out ?? new AnimationGroup([]);
  }

  // ── Layout ───────────────────────────────────────────────────────

  private _text(text: string, size: number, color: string, weight: string = 'normal'): Text {
    return new Text({
      text,
      fontSize: size,
      fontFamily: this._opts.fontFamily,
      fontWeight: weight,
      color,
      textAlign: 'left',
      lineHeight: 1.4,
    });
  }

  /** Build every row of a page at the card's corner. */
  private _buildPage(content: CaptionContent): Page {
    const o = this._opts;
    const headline = content.style === 'headline';
    const titleSize = headline ? o.titleSize * 1.35 : o.titleSize;
    const bodySize = headline ? o.bodySize * 1.1 : o.bodySize;
    const pal = this.palette;
    const rows: RowSpec[] = [];

    // Title row, with an optional swatch.
    const title = this._text(content.title, titleSize, pal.text);
    const titleEm = emOf(titleSize);
    const titleRow: RowSpec = {
      parts: [],
      text: title,
      swatch: null,
      indent: 0,
      gap: 0,
    };
    if (content.swatch && !headline) {
      if (o.swatchStyle === 'underline') {
        const bar = new Line({
          start: [0, 0, 0],
          end: [1, 0, 0],
          color: content.swatch,
          strokeWidth: 5,
        });
        titleRow.parts.push({ mob: bar, enter: 'create' });
        titleRow.underline = bar;
      } else {
        const sw = this._square(content.swatch, 0.55 * titleEm);
        titleRow.parts.push({ mob: sw, enter: 'fade' });
        titleRow.swatch = sw;
        titleRow.indent = 0.55 * titleEm + 0.35 * titleEm;
      }
    }
    titleRow.parts.push({ mob: title, enter: 'write' });
    rows.push(titleRow);

    // Body and footnote: wrapped, dimmer.
    const addTextRow = (text: string, size: number, color: string) => {
      const lines = wrapText(text, o.maxWidth, size, o.fontFamily);
      const t = this._text(lines.join('\n'), size, color);
      rows.push({
        parts: [{ mob: t, enter: 'fade' }],
        text: t,
        swatch: null,
        indent: 0,
        gap: ROW_GAP_EM * emOf(size),
      });
    };
    if (content.body) addTextRow(content.body, bodySize, pal.dim);
    if (content.footnote) addTextRow(content.footnote, o.footnoteSize, pal.faint);

    // Legend rows.
    for (const entry of content.rows ?? []) {
      const em = emOf(bodySize);
      const t = this._text(entry.text, bodySize, pal.dim);
      const sw = this._square(entry.color, 0.55 * em);
      rows.push({
        parts: [
          { mob: sw, enter: 'fade' },
          { mob: t, enter: 'fade' },
        ],
        text: t,
        swatch: sw,
        indent: 0.95 * em,
        gap: ROW_GAP_EM * 0.6 * em,
      });
    }

    // Anchor the whole block at the corner.
    const extra = (r: RowSpec) => (r.underline ? 0.4 * titleEm : 0);
    const totalH = rows.reduce((h, r) => h + r.gap + textBoxHeight(r.text) + extra(r), 0);
    const blockW = Math.max(...rows.map((r) => r.indent + textBoxWidth(r.text)));
    const halfW = this._frame.width / 2;
    const halfH = this._frame.height / 2;
    const left = o.corner.endsWith('right') ? halfW - o.margin - blockW : -halfW + o.margin;
    const top = o.corner.startsWith('top') ? halfH - o.margin : -halfH + o.margin + totalH;

    const laid: Row[] = [];
    let y = top;
    const z = 0.02;
    for (const r of rows) {
      y -= r.gap;
      const h = textBoxHeight(r.text);
      placeTextTopLeft(r.text, left + r.indent, y, z);
      if (r.swatch) r.swatch.moveTo([left + r.swatch.getWidth() / 2, y - h / 2, z]);
      if (r.underline) {
        const yLine = y - h - 0.22 * titleEm;
        r.underline.setStart([left, yLine, z]);
        r.underline.setEnd([left + Math.min(textBoxWidth(r.text), 2.2 * titleEm), yLine, z]);
      }
      y -= h + extra(r);
      laid.push({ parts: r.parts, bottom: y, right: left + r.indent + textBoxWidth(r.text) });
    }
    for (const r of laid) pinToFrame(this.scene, ...r.parts.map((p) => p.mob));
    return { rows: laid, top, left, backing: null };
  }

  private _square(color: string, size: number): Rectangle {
    return new Rectangle({ width: size, height: size, color, fillOpacity: 1, strokeWidth: 0 });
  }

  /** The backing rectangle that covers the first `rowCount` rows. */
  private _backingFor(page: Page, rowCount: number): Rectangle {
    const rows = page.rows.slice(0, Math.max(1, rowCount));
    const pad = 0.35 * emOf(this._opts.bodySize);
    const right = Math.max(...rows.map((r) => r.right));
    const bottom = rows[rows.length - 1].bottom;
    const w = right - page.left + 2 * pad;
    const h = page.top - bottom + 2 * pad;
    const panel = this._opts.backing === 'panel';
    const rect = new Rectangle({
      width: w,
      height: h,
      color: panel ? this.palette.faint : this.palette.background,
      fillOpacity: panel ? 0.88 : 0.62,
      strokeWidth: panel ? 1.5 : 0,
      center: [page.left - pad + w / 2, page.top + pad - h / 2, 0],
    });
    rect.setFill(panel ? this.palette.panel : this.palette.background, panel ? 0.88 : 0.62);
    return rect;
  }

  // ── Animations ───────────────────────────────────────────────────

  private _enter(part: Row['parts'][number], shift: Vector3Tuple): Animation {
    if (part.enter === 'write') return new Write(part.mob, { duration: 0.9 });
    if (part.enter === 'create') return new Create(part.mob, { duration: 0.6 });
    return new FadeIn(part.mob, { shift, duration: 0.6 });
  }

  private _revealRows(count: number, first: boolean): Animation {
    const page = this._page;
    if (!page || this._revealed >= page.rows.length) return new AnimationGroup([]);
    const end = Math.min(page.rows.length, this._revealed + count);
    const anims: Animation[] = [];
    const shift: Vector3Tuple = [0, 0.12 * (this._frame.height / 8), 0];

    if (page.backing && !first) {
      anims.push(new Transform(page.backing, this._backingFor(page, end), { duration: 0.5 }));
    } else if (this._opts.backing !== 'none') {
      // Size the backing to the rows this call reveals.
      page.backing = this._backingFor(page, end);
      pinToFrame(this.scene, page.backing);
      anims.push(new FadeIn(page.backing, { duration: 0.5 }));
      this._visible.push(page.backing);
    }
    for (let i = this._revealed; i < end; i++) {
      for (const part of page.rows[i].parts) {
        anims.push(this._enter(part, shift));
        this._visible.push(part.mob);
      }
    }
    this._revealed = end;
    return new LaggedStart(anims, { lagRatio: first ? 0.25 : 0.15 });
  }

  private _fadeOutVisible(): Animation | null {
    if (this._visible.length === 0) return null;
    const shift: Vector3Tuple = [0, -0.08 * (this._frame.height / 8), 0];
    const anims = this._visible.map((m) => new FadeOut(m, { shift, duration: 0.45 }));
    this._visible = [];
    return new AnimationGroup(anims);
  }
}
