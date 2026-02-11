/**
 * TextGlyphGroup - A VGroup of GlyphVMobjects for a text string.
 *
 * Loads a font file via opentype.js, then creates one GlyphVMobject per
 * non-space character, laid out using the font's advance widths and kerning.
 * Used by the Write animation to provide stroke-drawing glyph outlines.
 */

import { VGroup } from '../../core/VGroup';
import { GlyphVMobject } from './GlyphVMobject';
import opentype from 'opentype.js';
import type { SkeletonizeOptions } from '../../utils/skeletonize';

export interface TextGlyphGroupOptions {
  /** The text string to render */
  text: string;
  /** URL to the font file (OTF/TTF) */
  fontUrl: string;
  /** Font size in pixels (default: 48) */
  fontSize?: number;
  /** Stroke color (default: '#ffffff') */
  color?: string;
  /** Stroke width for glyph outlines (default: 2) */
  strokeWidth?: number;
  /**
   * When true, each GlyphVMobject computes its skeleton (medial axis)
   * so the Write animation can draw along the center-line. Default: false.
   */
  useSkeletonStroke?: boolean;
  /** Options forwarded to the skeletonization algorithm. */
  skeletonOptions?: SkeletonizeOptions;
}

/**
 * A VGroup that holds one GlyphVMobject per visible character in a string.
 * Characters are positioned using the font's metric data (advance width + kerning).
 *
 * Usage:
 *   const group = new TextGlyphGroup({ text: 'Hello', fontUrl: '/fonts/MyFont.otf' });
 *   await group.waitForReady();
 */
export class TextGlyphGroup extends VGroup {
  private _text: string;
  private _fontUrl: string;
  private _fontSize: number;
  private _glyphStrokeWidth: number;
  private _useSkeletonStroke: boolean;
  private _skeletonOptions: SkeletonizeOptions;
  private _readyPromise: Promise<void>;

  constructor(options: TextGlyphGroupOptions) {
    super();

    this._text = options.text;
    this._fontUrl = options.fontUrl;
    this._fontSize = options.fontSize ?? 48;
    this._color = options.color ?? '#ffffff';
    this._glyphStrokeWidth = options.strokeWidth ?? 2;
    this._useSkeletonStroke = options.useSkeletonStroke ?? false;
    this._skeletonOptions = options.skeletonOptions ?? {};

    // VGroup defaults
    this.fillOpacity = 0;
    this._style.fillOpacity = 0;

    // Start async font loading
    this._readyPromise = this._loadAndBuild();
  }

  /**
   * Wait for the font to load and glyphs to be built.
   */
  async waitForReady(): Promise<void> {
    return this._readyPromise;
  }

  /**
   * Load font and build GlyphVMobject children.
   */
  private async _loadAndBuild(): Promise<void> {
    // Load font via opentype.js
    const font = await opentype.load(this._fontUrl);

    const scale = this._fontSize / font.unitsPerEm;
    let xCursor = 0; // in pixels

    for (let i = 0; i < this._text.length; i++) {
      const char = this._text[i];

      // Skip spaces — no visible glyph, but advance the cursor
      if (char === ' ') {
        const spaceGlyph = font.charToGlyph(char);
        xCursor += (spaceGlyph.advanceWidth ?? 0) * scale;
        continue;
      }

      const glyph = font.charToGlyph(char);
      if (!glyph || glyph.index === 0) {
        // Missing glyph — skip but advance
        xCursor += (glyph?.advanceWidth ?? this._fontSize * 0.5) * scale;
        continue;
      }

      // Apply kerning with previous character
      if (i > 0) {
        const prevGlyph = font.charToGlyph(this._text[i - 1]);
        const kerning = font.getKerningValue(prevGlyph, glyph);
        xCursor += kerning * scale;
      }

      const glyphVMob = new GlyphVMobject({
        glyph,
        font,
        fontSize: this._fontSize,
        xOffset: xCursor,
        yOffset: 0,
        color: this._color,
        strokeWidth: this._glyphStrokeWidth,
        useSkeletonStroke: this._useSkeletonStroke,
        skeletonOptions: this._skeletonOptions,
      });

      this.add(glyphVMob);

      // Advance cursor by glyph's advance width
      xCursor += (glyph.advanceWidth ?? 0) * scale;
    }
  }
}
