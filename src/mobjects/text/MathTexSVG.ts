/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MathTexSVG - Vector-based LaTeX rendering using SVG paths.
 *
 * Unlike MathTex (which rasterizes LaTeX to a canvas texture), MathTexSVG
 * produces real VMobject paths from MathJax SVG output. This enables
 * path-based animations like Create (stroke-draw reveal), DrawBorderThenFill,
 * and point-morphing Transform.
 *
 * Uses renderLatexToSVG() -> svgToVMobjects() pipeline.
 */

import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants/colors';
import { renderLatexToSVG } from './MathJaxRenderer';

export interface MathTexSVGOptions {
  /** LaTeX string or array of strings for multi-part expressions. */
  latex: string | string[];
  /** Color as CSS color string. Default: WHITE ('#ffffff') */
  color?: string;
  /** Scale factor (1 = standard math size). Default: 1 */
  fontSize?: number;
  /** Use display mode (block) vs inline mode. Default: true */
  displayMode?: boolean;
  /** Position in 3D space. Default: [0,0,0] */
  position?: Vector3Tuple;
  /** Stroke width for glyph outlines. Default: 2 */
  strokeWidth?: number;
  /** Fill opacity for glyph interiors. Default: 1 */
  fillOpacity?: number;
  /** Explicit target height in world units. Overrides fontSize scaling. */
  height?: number;
  /** Custom LaTeX macros as { name: expansion }. */
  macros?: Record<string, string>;
}

export class MathTexSVG extends VGroup {
  protected _latex: string;
  protected _fontSize: number;
  protected _displayMode: boolean;
  protected _color: string;
  protected _svgStrokeWidth: number;
  protected _svgFillOpacity: number;
  protected _targetHeight: number | undefined;
  protected _macros: Record<string, string> | undefined;
  protected _svgViewBoxWidth: number = 1000;

  /** Whether this is a multi-part MathTexSVG (created from string[]) */
  protected _isMultiPart: boolean = false;
  /** Child part groups (only when _isMultiPart is true) */
  protected _parts: VGroup[] = [];
  /** Promise that resolves when rendering is complete */
  protected _renderPromise: Promise<void> | null = null;

  constructor(options: MathTexSVGOptions) {
    super();

    const {
      latex,
      color = WHITE,
      fontSize = 1,
      displayMode = true,
      position = [0, 0, 0],
      strokeWidth = 2,
      fillOpacity = 1,
      height,
      macros,
    } = options;

    this._fontSize = fontSize;
    this._displayMode = displayMode;
    this._color = color;
    this._svgStrokeWidth = strokeWidth;
    this._svgFillOpacity = fillOpacity;
    this._targetHeight = height;
    this._macros = macros;

    // Set position
    this.position.set(position[0], position[1], position[2]);

    if (Array.isArray(latex)) {
      // Multi-part mode: render the FULL expression as one MathJax call
      // for correct layout, then split VMobjects into parts by glyph count.
      this._isMultiPart = true;
      this._latex = latex.join('');
      this._renderPromise = this._renderMultiPart(latex);
    } else {
      this._isMultiPart = false;
      this._latex = latex;
      this._startRender();
    }
  }

  /**
   * Wait for the LaTeX to finish rendering.
   */
  async waitForRender(): Promise<void> {
    if (this._renderPromise) {
      await this._renderPromise;
    }
  }

  /**
   * Get a sub-part of a multi-part expression.
   * Only available when created with a string array.
   * Returns a VGroup with setColor() support.
   */
  getPart(index: number): VGroup {
    if (!this._isMultiPart) {
      throw new Error(
        'getPart() is only available on multi-part MathTexSVG (created with string[])',
      );
    }
    if (index < 0 || index >= this._parts.length) {
      throw new Error(`Part index ${index} out of range [0, ${this._parts.length - 1}]`);
    }
    return this._parts[index];
  }

  /**
   * Get the number of parts.
   */
  getPartCount(): number {
    return this._isMultiPart ? this._parts.length : 1;
  }

  /**
   * Get the LaTeX string.
   */
  getLatex(): string {
    return this._latex;
  }

  /**
   * Override setColor to propagate to all VMobject children (fill + stroke).
   */
  override setColor(color: string): this {
    this._color = color;
    if (this._isMultiPart) {
      for (const part of this._parts) {
        part.setColor(color);
      }
    } else {
      // Propagate to all VMobject children (the glyph paths)
      for (const child of this.children) {
        if (child instanceof VMobject) {
          child.setColor(color);
        }
        // Handle nested VGroups from svgToVMobjects
        if (child instanceof VGroup) {
          for (const grandchild of child.children) {
            if (grandchild instanceof VMobject) {
              grandchild.setColor(color);
            }
          }
        }
      }
    }
    this._markDirty();
    return this;
  }

  /**
   * Start the async rendering process.
   */
  protected _startRender(): void {
    this._renderPromise = this._render()
      .then(() => {
        this._markDirty();
      })
      .catch((error) => {
        console.error('MathTexSVG rendering error:', error);
        throw error;
      });
  }

  /**
   * Render the LaTeX to VMobject paths.
   */
  protected async _render(): Promise<void> {
    const result = await renderLatexToSVG(this._latex, {
      displayMode: this._displayMode,
      color: this._color,
      fontScale: this._fontSize,
      macros: this._macros,
    });

    const viewBox = result.svgElement.getAttribute?.('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      this._svgViewBoxWidth = parts[2] || 1000;
    }

    const vmobjectGroup = result.vmobjectGroup;

    // Restyle children: MathJax glyphs should be filled with visible border
    this._restyleChildren(vmobjectGroup);

    // Add the VMobject children from the group
    for (const child of [...vmobjectGroup.children]) {
      vmobjectGroup.remove(child);
      this.add(child);
    }

    // Scale to target height if specified, otherwise use a sensible default
    this._scaleToTarget();

    // Set fillOpacity on this VGroup so Create animation detects it has fill
    // and properly hides it during the stroke-draw phase before fading it in.
    this.fillOpacity = this._svgFillOpacity;
  }

  /**
   * Restyle all VMobject children for solid glyph rendering.
   */
  protected _restyleChildren(group: VGroup): void {
    const restyle = (mob: Mobject) => {
      if (mob instanceof VMobject) {
        mob.fillOpacity = this._svgFillOpacity;
        mob.strokeWidth = this._svgStrokeWidth;
        mob.setColor(this._color);
        // Access _style via any cast since protected access from sibling instances
        (mob as any)._style.fillOpacity = this._svgFillOpacity;
        (mob as any)._style.strokeWidth = this._svgStrokeWidth;
      }
      if ('children' in mob) {
        for (const child of (mob as any).children) {
          restyle(child);
        }
      }
    };
    restyle(group);
  }

  /**
   * Scale and center the assembled paths by transforming actual point data.
   */
  protected _scaleToTarget(): void {
    // Collect all VMobject descendants (may be direct children or nested in part VGroups)
    const vmobjects: VMobject[] = [];
    const collect = (mob: Mobject) => {
      if (mob instanceof VMobject && !(mob instanceof VGroup)) {
        vmobjects.push(mob);
      }
      if ('children' in mob) {
        for (const child of (mob as any).children) {
          collect(child);
        }
      }
    };
    collect(this);

    // Compute bounding box from raw point data
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const vmob of vmobjects) {
      for (const p of vmob.getPoints()) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
    }

    const rawHeight = maxY - minY;
    if (rawHeight < 0.0001) return;

    let s: number;
    if (this._targetHeight !== undefined) {
      // Explicit height: scale bounding box to fit (user intent)
      s = this._targetHeight / rawHeight;
    } else {
      // Scale based on em height for consistent font sizing.
      // svgToVMobjects scales paths by fontSize / vbWidth, so in raw coords
      // 1 em = 1000 * fontSize / vbWidth. We want 1 em = 0.5 * fontSize
      // world units, giving: s = 0.5 * vbWidth / 1000.
      s = (0.5 * this._svgViewBoxWidth) / 1000;
    }

    // Center of current bounds
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Transform all point data: scale and center at origin
    for (const vmob of vmobjects) {
      const pts = vmob.getPoints();
      const transformed = pts.map((p) => [(p[0] - cx) * s, (p[1] - cy) * s, p[2]]);
      vmob.setPoints3D(transformed);
    }
  }

  /**
   * Render a multi-part expression by:
   * 1. Rendering the FULL expression as one MathJax call (correct layout)
   * 2. Rendering each part separately to count its glyphs
   * 3. Splitting the full expression's VMobjects into part groups by glyph count
   */
  private async _renderMultiPart(latexParts: string[]): Promise<void> {
    const fullLatex = latexParts.join('');

    // Render the full expression as one unit (correct spacing & layout)
    const fullResult = await renderLatexToSVG(fullLatex, {
      displayMode: this._displayMode,
      color: this._color,
      fontScale: this._fontSize,
      macros: this._macros,
    });
    const viewBox = fullResult.svgElement.getAttribute?.('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      this._svgViewBoxWidth = parts[2] || 1000;
    }

    this._restyleChildren(fullResult.vmobjectGroup);

    // Collect all VMobject children from the full render
    const allGlyphs: VMobject[] = [];
    for (const child of [...fullResult.vmobjectGroup.children]) {
      if (child instanceof VMobject) {
        allGlyphs.push(child);
      }
    }

    // Render each part separately to count how many glyphs it produces
    const partGlyphCounts: number[] = [];
    for (const partLatex of latexParts) {
      const partResult = await renderLatexToSVG(partLatex, {
        displayMode: false,
        color: this._color,
        fontScale: this._fontSize,
        macros: this._macros,
      });
      let count = 0;
      for (const child of partResult.vmobjectGroup.children) {
        if (child instanceof VMobject) count++;
      }
      partGlyphCounts.push(count);
    }

    // Assign glyphs from the full render to parts by count
    let glyphIdx = 0;
    for (let i = 0; i < latexParts.length; i++) {
      const partGroup = new MathTexSVG._PartGroup(this);
      partGroup._latex = latexParts[i];
      partGroup._color = this._color;

      const count = partGlyphCounts[i];
      for (let j = 0; j < count && glyphIdx < allGlyphs.length; j++) {
        const glyph = allGlyphs[glyphIdx++];
        fullResult.vmobjectGroup.remove(glyph);
        partGroup.add(glyph);
      }

      this._parts.push(partGroup as unknown as MathTexSVG);
      this.add(partGroup);
    }

    // If there are leftover glyphs (spacing elements etc.), add to last part
    while (glyphIdx < allGlyphs.length) {
      const lastPart = this._parts[this._parts.length - 1];
      const glyph = allGlyphs[glyphIdx++];
      fullResult.vmobjectGroup.remove(glyph);
      lastPart.add(glyph);
    }

    // Scale and center the full expression
    this._scaleToTarget();

    // Set fillOpacity on the parent VGroup for Create animation
    this.fillOpacity = this._svgFillOpacity;
  }

  /**
   * Lightweight VGroup used as a part container in multi-part mode.
   * Supports setColor() for per-part coloring.
   */
  private static _PartGroup = class extends VGroup {
    _latex: string = '';
    _color: string = WHITE;
    constructor(_parent: MathTexSVG) {
      super();
    }

    override setColor(color: string): this {
      this._color = color;
      for (const child of this.children) {
        if (child instanceof VMobject) {
          child.setColor(color);
        }
      }
      this._markDirty();
      return this;
    }

    getLatex(): string {
      return this._latex;
    }
  };

  /**
   * Create a copy of this MathTexSVG.
   */
  protected override _createCopy(): MathTexSVG {
    const latexValue = this._isMultiPart
      ? this._parts.map((p) => (p as any)._latex as string)
      : this._latex;
    return new MathTexSVG({
      latex: latexValue,
      color: this._color,
      fontSize: this._fontSize,
      displayMode: this._displayMode,
      position: [this.position.x, this.position.y, this.position.z],
      strokeWidth: this._svgStrokeWidth,
      fillOpacity: this._svgFillOpacity,
      height: this._targetHeight,
      macros: this._macros,
    });
  }
}

export default MathTexSVG;
