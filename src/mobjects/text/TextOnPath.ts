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

/** Scale factor matching GlyphVMobject: 100 pixels = 1 world unit. */
const PIXEL_TO_WORLD = 1 / 100;

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
    glyphs: Array<{ mobject: VMobject; width: number; leadingGap: number }>,
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
      if (placement.angle !== 0) {
        // Rotate about the glyph's own center, then move the center onto the path.
        glyph.rotate(placement.angle);
      }
      glyph.moveTo(placement.center);
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
    const glyphs: Array<{ mobject: VMobject; width: number; leadingGap: number }> = [];
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

      glyphs.push({
        mobject,
        width: (glyph.advanceWidth ?? 0) * scale * PIXEL_TO_WORLD,
        leadingGap: pendingGap,
      });
      pendingGap = 0;
    }

    this._layoutGlyphs(glyphs);
  }
}
