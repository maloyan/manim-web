/**
 * TextOnPath - lay out glyphs along an arbitrary curve.
 *
 * A VGroup that places each glyph of a run along a path (an Arc, a Line, a
 * parametric curve, or any VMobject) by arc length. Each glyph center sits at a
 * successive arc-length offset (advance width + tracking) and, by default,
 * rotates to match the path tangent. This is the per-glyph typography layout
 * that ManimCE's `MoveAlongPath` does not provide (that animates a whole
 * mobject along a path).
 *
 * Two construction modes:
 *   - Synchronous: pass pre-built glyph mobjects with their advance widths.
 *   - Asynchronous: pass a string plus a font URL; call `waitForReady()`.
 *
 * The layout math lives in `textOnPathLayout.ts` and is font-free and testable.
 */

import opentype from 'opentype.js';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { GlyphVMobject } from './GlyphVMobject';
import {
  alignmentToOffset,
  computeGlyphPlacements,
  sampledPathFromFunction,
  sampledPathFromPoints,
  visibleGlyphChars,
  type GlyphLayoutEntry,
  type SampledPath,
  type TextOnPathAlignment,
  type TextOnPathOverflow,
} from './textOnPathLayout';
import { DEFAULT_FONT_SIZE_PT, TEXT_FONT_SIZE_IN_WORLD_SPACE } from '../../constants/fontRender';

/** Scale factor matching GlyphVMobject: Manim CE Text's em in world units. */
const PIXEL_TO_WORLD = TEXT_FONT_SIZE_IN_WORLD_SPACE / DEFAULT_FONT_SIZE_PT;

/**
 * Half the x-height in font units, from the 'x' glyph's vertical extent
 * (`yMax - yMin`). Used as the shared vertical layout datum so every glyph sits
 * on the same line. Falls back to a quarter of the em when the extent is unknown
 * (`yMax`/`yMin` missing) or non-positive. The `top`/`bottom` inputs are typed
 * `unknown` because opentype.js' glyph metric fields reach here loosely typed.
 *
 * @param top - The 'x' glyph `yMax` in font units (a number when present).
 * @param bottom - The 'x' glyph `yMin` in font units (a number when present).
 * @param unitsPerEm - The font's units per em, for the fallback.
 */
function halfXHeightFontUnits(top: unknown, bottom: unknown, unitsPerEm: number): number {
  const t = typeof top === 'number' ? top : 0;
  const b = typeof bottom === 'number' ? bottom : 0;
  const height = t - b;
  return height > 0 ? height / 2 : unitsPerEm * 0.25;
}

/** A path the text can follow: a VMobject, a raw point chain, or a function. */
export type TextOnPathSource = VMobject | number[][] | ((t: number) => number[]);

/** A pre-built glyph plus its advance width, for synchronous layout. */
export interface TextOnPathGlyph {
  /** The glyph mobject to position. */
  mobject: VMobject;
  /** Advance width in world units. Defaults to `mobject.getWidth()`. */
  width?: number;
  /** Extra gap before this glyph (world units). Default 0. */
  leadingGap?: number;
  /**
   * Point in the glyph's own local frame that lands on the path, and about
   * which the glyph rotates to the tangent. Defaults to the glyph's bounding-box
   * center. Font mode sets it to the advance-box center (advance width / 2, half
   * the x-height) so the x-height midline sits on the path. Without it, a glyph
   * whose ink box differs from its advance box (a narrow glyph, or one with a
   * dot such as 'i') is misplaced along and across the path.
   */
  anchor?: Vector3Tuple;
}

/** Options for {@link TextOnPath}. */
export interface TextOnPathOptions {
  /** The path to lay the glyphs on. */
  path: TextOnPathSource;
  /** Pre-built glyphs (synchronous mode). */
  glyphs?: TextOnPathGlyph[];
  /** Text to render (asynchronous font mode; needs `fontUrl`). */
  text?: string;
  /** URL of the font file (OTF/TTF) for font mode. */
  fontUrl?: string;
  /** Font size in pixels. Default 48. */
  fontSize?: number;
  /** Glyph color. Default '#ffffff'. */
  color?: string;
  /** Arc-length distance where the run starts. Default 0. */
  startOffset?: number;
  /** Extra spacing added after every glyph (world units). Default 0. */
  tracking?: number;
  /** Rotate each glyph to the path tangent. Default true. */
  rotateWithTangent?: boolean;
  /** Vertical placement relative to the curve. Default 'center'. */
  alignment?: TextOnPathAlignment;
  /** Clamp to the ends or wrap around the path. Default 'clamp'. */
  overflow?: TextOnPathOverflow;
}

/**
 * A VGroup of glyph mobjects laid out along a path.
 *
 * Synchronous usage:
 *   const t = new TextOnPath({ glyphs, path: arc });
 *
 * Font usage:
 *   const t = new TextOnPath({ text: 'Hello', fontUrl, path: arc });
 *   await t.waitForReady();
 */
export class TextOnPath extends VGroup {
  private readonly _options: TextOnPathOptions;
  private readonly _path: SampledPath;
  private readonly _fontSize: number;
  private readonly _glyphColor: string;
  private _readyPromise: Promise<void>;

  constructor(options: TextOnPathOptions) {
    super();

    this._options = options;
    this._fontSize = options.fontSize ?? 48;
    this._glyphColor = options.color ?? '#ffffff';
    this._path = TextOnPath._buildPath(options.path);

    this.fillOpacity = 0;
    this._style.fillOpacity = 0;

    if (options.glyphs) {
      // Synchronous mode: lay the given glyphs out immediately.
      this._layoutGlyphs(
        options.glyphs.map((g) => ({
          mobject: g.mobject,
          width: g.width ?? g.mobject.getWidth(),
          leadingGap: g.leadingGap ?? 0,
          anchor: g.anchor,
        })),
      );
      this._readyPromise = Promise.resolve();
    } else if (options.text && options.fontUrl && visibleGlyphChars(options.text).length > 0) {
      // Asynchronous font mode.
      this._readyPromise = this._loadAndBuild(options.text, options.fontUrl);
    } else {
      // Empty string (or no source): an empty group, no throw.
      this._readyPromise = Promise.resolve();
    }
  }

  /** Resolves once the font has loaded and glyphs are laid out (font mode). */
  async waitForReady(): Promise<void> {
    return this._readyPromise;
  }

  /** Build a {@link SampledPath} from any accepted path source. */
  private static _buildPath(source: TextOnPathSource): SampledPath {
    if (typeof source === 'function') {
      return sampledPathFromFunction(source);
    }
    if (source instanceof VMobject) {
      return sampledPathFromPoints(source.getPoints());
    }
    return sampledPathFromPoints(source);
  }

  /**
   * Position every glyph mobject along the path and add it to this group.
   * Each glyph is transformed while unparented, so `rotate` and `moveTo`
   * act in world space, then added to the group.
   */
  private _layoutGlyphs(
    glyphs: Array<{
      mobject: VMobject;
      width: number;
      leadingGap: number;
      anchor?: Vector3Tuple;
    }>,
  ): void {
    const glyphHeightWorld = this._fontSize * PIXEL_TO_WORLD;
    const alignmentOffset = alignmentToOffset(
      this._options.alignment ?? 'center',
      glyphHeightWorld,
    );

    const entries: GlyphLayoutEntry[] = glyphs.map((g) => ({
      width: g.width,
      leadingGap: g.leadingGap,
    }));

    const placements = computeGlyphPlacements(entries, this._path, {
      startOffset: this._options.startOffset,
      tracking: this._options.tracking,
      rotateWithTangent: this._options.rotateWithTangent,
      alignmentOffset,
      overflow: this._options.overflow,
    });

    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i].mobject;
      const placement = placements[i];
      // The reference point that lands on the path. Default: the bounding-box
      // center (`getCenter()`), which keeps the synchronous behavior. Font mode
      // passes the advance-box center so narrow or dotted glyphs ('i') stay on
      // the path line instead of riding low under their own bounding box.
      const ref = glyphs[i].anchor ?? glyph.getCenter();
      if (placement.angle !== 0) {
        // Rotate about the reference point, so the glyph pivots on the path.
        glyph.rotate(placement.angle, { aboutPoint: ref });
      }
      // Move the reference point onto the path. The reference is fixed under the
      // rotation above, so it still sits at `ref` and this shift lands it exactly.
      glyph.shift([
        placement.center[0] - ref[0],
        placement.center[1] - ref[1],
        placement.center[2] - ref[2],
      ]);
      this.add(glyph);
    }
  }

  /** Load the font, build a GlyphVMobject per visible character, lay them out. */
  private async _loadAndBuild(text: string, fontUrl: string): Promise<void> {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch font ${fontUrl}: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const font = opentype.parse(buffer);

    const scale = this._fontSize / font.unitsPerEm;
    // Vertical reference shared by every glyph: half the x-height, in world
    // units. Placing this point on the path puts the x-height midline on the
    // curve for all glyphs, so a dot or an ascender no longer shifts a glyph off
    // the line (the bounding-box center does, because the dot inflates it).
    // Measure the x-height from the 'x' glyph (baseline to its top); fall back to
    // a quarter of the em when the font has no usable 'x'.
    const xGlyph = font.charToGlyph('x');
    const verticalAnchor =
      halfXHeightFontUnits(xGlyph.yMax, xGlyph.yMin, font.unitsPerEm) * scale * PIXEL_TO_WORLD;
    const glyphs: Array<{
      mobject: VMobject;
      width: number;
      leadingGap: number;
      anchor: Vector3Tuple;
    }> = [];
    let pendingGap = 0;

    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      if (char.trim().length === 0) {
        // Whitespace: advance the pen, draw no glyph.
        const spaceGlyph = font.charToGlyph(char);
        pendingGap += (spaceGlyph.advanceWidth ?? 0) * scale * PIXEL_TO_WORLD;
        continue;
      }

      const glyph = font.charToGlyph(char);
      if (!glyph || glyph.index === 0) {
        pendingGap += (glyph?.advanceWidth ?? this._fontSize * 0.5) * scale * PIXEL_TO_WORLD;
        continue;
      }

      if (i > 0) {
        const prevGlyph = font.charToGlyph(chars[i - 1]);
        pendingGap += font.getKerningValue(prevGlyph, glyph) * scale * PIXEL_TO_WORLD;
      }

      const mobject = new GlyphVMobject({
        glyph,
        font,
        fontSize: this._fontSize,
        color: this._glyphColor,
      });

      const width = (glyph.advanceWidth ?? 0) * scale * PIXEL_TO_WORLD;
      glyphs.push({
        mobject,
        width,
        leadingGap: pendingGap,
        // Advance-box center in the glyph's local frame: the glyph is built with
        // its pen origin at x = 0, so the advance center is at width / 2.
        anchor: [width / 2, verticalAnchor, 0],
      });
      pendingGap = 0;
    }

    this._layoutGlyphs(glyphs);
  }
}
