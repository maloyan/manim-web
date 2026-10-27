/**
 * MathTex - Vector-based LaTeX rendering using SVG paths (default).
 *
 * Unlike MathTexImage (which rasterizes LaTeX to a canvas texture), MathTex
 * produces real VMobject paths from MathJax SVG output. This enables
 * path-based animations like Create (stroke-draw reveal), DrawBorderThenFill,
 * and point-morphing Transform.
 *
 * This is the default LaTeX renderer, matching Python Manim's behavior.
 *
 * Uses renderLatexToSVG() -> svgToVMobjects() pipeline.
 */

import * as THREE from 'three';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { hasStyleRecord } from './glyphStyle';
import { getActiveTheme } from '../../utils/ThemeManager';
import { DEFAULT_FONT_SIZE_IN_WORLD_SPACE, DEFAULT_FONT_SIZE_PT } from '../../constants/fontRender';
import typia from 'typia';
import { renderLatexToSVG } from './MathJaxRenderer';
import { logger } from '../../utils/logger';
import { collectGlyphs, firstMaterial, inheritLayering, placeGlyphs } from './mathTexLayout';

/** MathJax SVG uses ~1000 font units per em. */
const MATHJAX_SVG_UNITS_PER_EM = 1000;

export interface MathTexOptions {
  /** LaTeX string or array of strings for multi-part expressions. */
  latex: string | string[];
  /** Color as CSS color string. Default: the active theme's fill color (WHITE under the default theme) */
  color?: string;
  /** Scale factor (1 = standard math size). Default: 1 */
  fontSize?: number;
  /** Use display mode (block) vs inline mode. Default: true */
  displayMode?: boolean;
  /** Position in 3D space. Default: [0,0,0] */
  position?: Vector3Tuple;
  /** Stroke width for glyph outlines. Default: 0 */
  strokeWidth?: number;
  /** Fill opacity for glyph interiors. Default: 1 */
  fillOpacity?: number;
  /** Explicit target height in world units. Overrides fontSize scaling. */
  height?: number;
  /** Custom LaTeX macros as { name: expansion }. */
  macros?: Record<string, string>;
  /**
   * Which horizontal point stays fixed when {@link MathTex.setLatex} changes
   * the width: `'center'`, the `'left'` edge, or the `'right'` edge. The
   * vertical center always stays fixed. Default: `'center'`.
   */
  anchor?: MathTexAnchor;
}

/** Horizontal point held fixed when a re-render changes a MathTex's width. */
export type MathTexAnchor = 'center' | 'left' | 'right';

/** True when `m` exposes a `getLatex()` method. */
function hasGetLatex(m: object): m is { getLatex(): string } {
  return 'getLatex' in m && typeof m.getLatex === 'function';
}

/**
 * Internal construction token: when set as a symbol-keyed property on the
 * options object, the constructor does not start a render. Only copy()
 * sets it — for a copy of an already-rendered MathTex, whose geometry
 * arrives via the deep copy in copy() instead of a render. A module-private
 * symbol key keeps the token out of the public {@link MathTexOptions} type
 * (and out of the built typings); only code in this module can set it.
 */
const SKIP_RENDER: unique symbol = Symbol('MathTex.skipRender');

/** {@link MathTexOptions} plus the internal {@link SKIP_RENDER} token. */
type MathTexOptionsWithSkip = MathTexOptions & { [SKIP_RENDER]?: boolean };

export class MathTex extends VGroup {
  protected _latex: string;
  protected _fontSize: number;
  protected _displayMode: boolean;
  protected _color: string;
  protected _svgStrokeWidth: number;
  protected _svgFillOpacity: number;
  protected _targetHeight: number | undefined;
  protected _macros: Record<string, string> | undefined;
  protected _svgViewBoxWidth: number = 1000;

  /** Whether this is a multi-part MathTex (created from string[]) */
  protected _isMultiPart: boolean = false;
  /** Child part groups (only when _isMultiPart is true) */
  protected _parts: Array<VGroup & { _latex: string }> = [];
  /** Promise that resolves when rendering is complete */
  protected _renderPromise: Promise<void> | null = null;
  /** Error from rendering, if any */
  protected _renderError: Error | null = null;
  /**
   * The original per-part LaTeX strings (multi-part only), retained from
   * construction. copy() reconstructs a multi-part copy from this list —
   * NOT from `_parts`, which is empty until the first render lands (a
   * pre-render copy built from `_parts` got `latex: []` and stayed empty).
   */
  protected _latexParts: string[] | null = null;
  /**
   * True once this instance's geometry is settled: either a render's
   * result has actually been applied here, or copy() set it on a copy
   * whose deep-copied children ARE the geometry (such a copy starts no
   * render of its own). copy() keys its no-render decision for the copy
   * on this flag rather than on `children.length > 0`: children are the
   * geometry, this is the event that produced them.
   */
  protected _renderCompleted: boolean = false;
  /** Horizontal point held fixed across re-renders. See {@link MathTexOptions.anchor}. */
  protected _anchor: MathTexAnchor = 'center';
  /**
   * Incremented by every {@link setLatex} call. A render applies its glyphs
   * only if no newer render was requested since it started, so the latest
   * request wins even when renders finish out of order.
   */
  protected _renderToken: number = 0;
  /**
   * The transform already baked into the glyph points, relative to a fresh
   * render's layout frame: a pre-render scale() (see _consumePendingScale)
   * and every normalizeTransform() (which Transform and Group/VGroup
   * construction call). A re-render applies it to the new glyphs so they
   * land where the old ones were.
   */
  protected _geometryMatrix: THREE.Matrix4 = new THREE.Matrix4();
  /**
   * The glyphs' horizontal extent [minX, maxX] in the layout frame (before
   * _geometryMatrix), or null before the first render. The anchor point of
   * the next render is placed where this extent's anchor point is.
   */
  protected _layoutExtent: [number, number] | null = null;

  constructor(options: MathTexOptions) {
    super();

    // Validate options via typia and read required latex field
    typia.assert<MathTexOptions>(options);
    const latex = options.latex;

    // Internal (copy() only): the instance's geometry comes from a deep
    // copy, so no render starts. See SKIP_RENDER.
    const skipRender = (options as MathTexOptionsWithSkip)[SKIP_RENDER] === true;

    const {
      color = getActiveTheme().fillColor,
      fontSize = DEFAULT_FONT_SIZE_PT,
      displayMode = true,
      position = [0, 0, 0],
      strokeWidth = 0.00001, // Workaround for https://github.com/maloyan/manim-web/issues/258
      fillOpacity = 1,
      height,
      macros,
      anchor = 'center',
    } = options;

    this._anchor = anchor;
    this._fontSize = fontSize;
    this._displayMode = displayMode;
    this._color = color;
    this._svgStrokeWidth = strokeWidth;
    this.strokeWidth = strokeWidth;
    this._svgFillOpacity = fillOpacity;
    this.fillOpacity = fillOpacity;
    this._targetHeight = height;
    this._macros = macros;

    // Set position
    this.position.set(position[0], position[1], position[2]);

    if (Array.isArray(latex)) {
      // Multi-part mode: render the FULL expression as one MathJax call
      // for correct layout, then split VMobjects into parts by glyph count.
      this._isMultiPart = true;
      this._latexParts = [...latex];
      this._latex = latex.join('');
      if (!skipRender) {
        this._renderPromise = this._renderMultiPart(latex)
          .then(() => {
            this._markDirty();
          })
          .catch((error) => {
            // Mirror _startRender's catch: a render failure is recorded
            // and surfaces via waitForRender(), as on the single-part path.
            this._recordRenderError(error);
          });
      }
    } else {
      this._isMultiPart = false;
      this._latex = latex;
      if (!skipRender) {
        this._startRender();
      }
    }
  }

  /**
   * Wait for the LaTeX to finish rendering.
   */
  async waitForRender(): Promise<void> {
    // Wait for the latest render, including any requested (setLatex) while
    // waiting, so the glyphs are current when this resolves.
    let pending: Promise<void> | null;
    do {
      pending = this._renderPromise;
      if (pending) await pending;
    } while (pending !== this._renderPromise);
    if (this._renderError) {
      throw this._renderError;
    }
  }

  /**
   * Get a sub-part of a multi-part expression.
   * Only available when created with a string array.
   * Returns a VGroup with setColor() support.
   */
  getPart(index: number): VGroup {
    if (!this._isMultiPart) {
      throw new Error('getPart() is only available on multi-part MathTex (created with string[])');
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
   * Add children, giving them the scene layering of the glyphs already here.
   *
   * Scene.add() stamps a renderOrder (and the 2D depth settings) on the
   * Three.js subtree it finds at that moment. Glyphs added afterwards (the
   * first render of a MathTex added before it rendered, every setLatex()
   * swap) would otherwise keep renderOrder 0 and draw under anything added
   * to the scene later. So each new child takes this MathTex's renderOrder,
   * and the depth settings of an existing glyph material when there is one.
   */
  override add(...mobjects: Mobject[]): this {
    const own = this._threeObject;
    const reference = firstMaterial(own);
    super.add(...mobjects);
    if (own) inheritLayering(mobjects, own.renderOrder, reference);
    return this;
  }

  /**
   * Replace the LaTeX and re-render in place.
   *
   * The old glyphs stay on screen until the new ones are ready, then are
   * swapped out in one step. The new glyphs keep this MathTex's color, its
   * current opacity, and every transform applied so far (including ones
   * baked into the glyphs by normalizeTransform(), e.g. by a Transform or by
   * adding it to a Group). The point chosen by the `anchor` option stays
   * fixed. For a multi-part MathTex with the same number of parts, each
   * part keeps its color.
   *
   * Calls may overlap: only the latest one is applied, and earlier calls
   * resolve without changing the glyphs. The returned promise rejects if
   * this call's render fails (and it was not superseded). `getLatex()`
   * reports the new LaTeX immediately.
   *
   * Do not call this while an animation is running on this MathTex: the
   * glyphs the animation holds are replaced (and disposed).
   *
   * @param latex - New LaTeX: a string, or a string array for a multi-part
   *   expression (see the `latex` option).
   * @post getLatex() === (Array.isArray(latex) ? latex.join('') : latex)
   */
  setLatex(latex: string | string[]): Promise<void> {
    typia.assert<string | string[]>(latex);
    const token = ++this._renderToken;
    this._isMultiPart = Array.isArray(latex);
    this._latexParts = Array.isArray(latex) ? [...latex] : null;
    this._latex = Array.isArray(latex) ? latex.join('') : latex;
    this._renderError = null;

    let failed: Error | null = null;
    // One render at a time: start after the render in flight settles, and
    // only if no newer call came in meanwhile. Calls made in one burst (e.g.
    // several values set in one event) thus cost a single MathJax render.
    const parts = Array.isArray(latex) ? [...latex] : null;
    const render = (this._renderPromise ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => {
        if (token !== this._renderToken) return undefined;
        return parts ? this._renderMultiPart(parts, token) : this._render(token);
      });
    this._renderPromise = render
      .then(() => {
        this._markDirty();
      })
      .catch((error) => {
        if (token !== this._renderToken) return;
        failed = this._recordRenderError(error);
      });
    return this._renderPromise.then(() => {
      if (failed) throw failed;
    });
  }

  /** Log a render failure and keep it for waitForRender(). */
  protected _recordRenderError(error: unknown): Error {
    logger.error('MathTex rendering error:', error);
    this._renderError = error instanceof Error ? error : new Error(String(error));
    return this._renderError;
  }

  /**
   * Get the render error, if any.
   * Returns null if rendering succeeded or is still in progress.
   */
  getRenderError(): Error | null {
    return this._renderError;
  }

  /**
   * World-space center. Unlike the base VGroup, an empty (not-yet-rendered)
   * MathTex falls back to its world-space origin instead of throwing: MathTex is
   * built lazily, so `scale()`/`moveTo()` (which read getCenter() for their
   * default anchor) are routinely called before the SVG geometry exists.
   */
  override getCenter(): Vector3Tuple {
    if (this.isEmpty()) {
      // World location of the node origin (own + ancestor transforms applied).
      return this._localToWorld([0, 0, 0]);
    }
    return super.getCenter();
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
   * Color every sub-part whose LaTeX matches `tex`.
   *
   * Matches Manim CE `set_color_by_tex`. By default a part matches when its
   * LaTeX string CONTAINS `tex` (substring match). Set `substring: false` for
   * an exact-string match. Matching is case-sensitive unless `caseSensitive`
   * is false. For a single-string MathTex the whole expression is one part, so
   * a match colors the whole mobject. Chainable.
   *
   * Call after `waitForRender()`: parts exist only once rendering completes.
   */
  setColorByTex(
    tex: string,
    color: string,
    opts: { substring?: boolean; caseSensitive?: boolean } = {},
  ): this {
    const substring = opts.substring ?? true;
    const caseSensitive = opts.caseSensitive ?? true;
    const needle = caseSensitive ? tex : tex.toLowerCase();
    const matches = (partLatex: string): boolean => {
      const hay = caseSensitive ? partLatex : partLatex.toLowerCase();
      return substring ? hay.includes(needle) : hay === needle;
    };

    if (!this._isMultiPart) {
      if (matches(this._latex)) {
        this.setColor(color);
      }
      return this;
    }

    for (const part of this._parts) {
      const partLatex = hasGetLatex(part) ? part.getLatex() : '';
      if (matches(partLatex)) {
        part.setColor(color);
      }
    }
    return this;
  }

  /**
   * Color several sub-expressions at once, from a { tex: color } map.
   *
   * Matches Manim CE `set_color_by_tex_to_color_map`. Each entry is applied
   * with the default substring semantics of `setColorByTex`. Later entries can
   * override earlier ones where their matches overlap. Chainable.
   */
  setColorByTexToColorMap(map: Record<string, string>): this {
    for (const [tex, color] of Object.entries(map)) {
      this.setColorByTex(tex, color);
    }
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
        this._recordRenderError(error);
      });
  }

  /**
   * Render the LaTeX to VMobject paths.
   *
   * @param token - The {@link _renderToken} this render belongs to. If a newer
   *   render was requested by the time MathJax finishes, this one is dropped
   *   (its errors too).
   */
  protected async _render(token: number = this._renderToken): Promise<void> {
    let result;
    try {
      result = await renderLatexToSVG(this._latex, {
        displayMode: this._displayMode,
        color: this._color,
        macros: this._macros,
      });
    } catch (error) {
      if (token !== this._renderToken) return;
      throw error;
    }
    if (token !== this._renderToken) return;

    // Restyle children: MathJax glyphs should be filled with visible border
    this._restyleChildren(result.vmobjectGroup);
    this._commitRender(result.vmobjectGroup, result.svgElement, []);
  }

  /**
   * Lay out freshly rendered glyphs and swap them in for the current ones.
   *
   * The staging group's children become this MathTex's children. They are
   * scaled and centered (_scaleToTarget), shifted so the anchor point lands
   * where the previous render's did, and given every transform already
   * baked into the old glyphs (_geometryMatrix). On a re-render they also
   * take the old glyphs' opacity, and the old glyphs are disposed.
   *
   * @post this.children === old(staging.children)
   * @post this._renderCompleted
   */
  protected _commitRender(
    staging: VGroup,
    svgElement: SVGElement,
    parts: Array<VGroup & { _latex: string }>,
  ): void {
    const viewBox = svgElement.getAttribute?.('viewBox');
    if (viewBox) {
      const vb = viewBox.split(/\s+/).map(Number);
      this._svgViewBoxWidth = vb[2] || 1000;
    }

    // Scale to target height if specified, otherwise use a sensible default
    this._scaleToTarget(staging);

    // Hold the anchor point fixed, then apply the transforms already baked
    // into the old glyphs.
    const glyphs = collectGlyphs(staging);
    this._layoutExtent = placeGlyphs(
      glyphs,
      this._layoutExtent,
      this._anchor,
      this._geometryMatrix,
    );

    const previous = [...this.children];
    const previousGlyph = collectGlyphs(this)[0];
    if (previousGlyph) {
      for (const glyph of glyphs) {
        glyph.setFillOpacity(previousGlyph.fillOpacity);
        glyph.setStrokeOpacity(previousGlyph.opacity);
      }
    }
    // Same number of parts: each new part keeps its old part's color.
    if (parts.length > 0 && parts.length === this._parts.length) {
      parts.forEach((part, i) => part.setColor(this._parts[i].color));
    }

    this.remove(...previous);
    for (const child of previous) child.dispose();
    for (const child of [...staging.children]) {
      staging.remove(child);
      this.add(child);
    }
    this._parts = parts;

    // Bake any pre-render scale() call into glyph geometry so subsequent
    // transforms operate in a consistent coordinate frame (#324). Only the
    // first render does this: afterwards scale() is an ordinary deferred
    // transform on this node, which the new glyphs inherit as they are.
    if (!this._renderCompleted) {
      this._consumePendingScale();
      // Set fillOpacity on this VGroup so Create animation detects it has fill
      // and properly hides it during the stroke-draw phase before fading it in.
      this.fillOpacity = this._svgFillOpacity;
    }

    this._renderCompleted = true;
  }

  /**
   * Fold the flattened transform into _geometryMatrix so a later re-render
   * can reproduce it. An empty (not yet rendered) MathTex has no glyphs to
   * fold into, so nothing is recorded and the render lands untransformed,
   * as before.
   */
  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    if (!this.isEmpty()) this._geometryMatrix.premultiply(worldMatrix);
    return super.normalizeTransform(worldMatrix);
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
        // Access _style directly: protected member, reached from a sibling instance.
        if (hasStyleRecord(mob)) {
          const style = mob._style;
          style.fillOpacity = this._svgFillOpacity;
          style.strokeWidth = this._svgStrokeWidth;
        }
      }
      if ('children' in mob) {
        for (const child of (mob as { children: Mobject[] }).children) {
          restyle(child);
        }
      }
    };
    restyle(group);
  }

  /**
   * Scale and center the assembled paths by transforming point data directly.
   *
   * Unit flow:
   * - MathJax path coordinates arrive in font units (~1000 units per em).
   * - Convert font-size points to world units via DEFAULT_FONT_SIZE_PT baseline.
   * - Convert MathJax units to em by dividing by MATHJAX_SVG_UNITS_PER_EM.
   *
   * This keeps MathTex aligned with Text/MathTexImage behavior at 48pt.
   */
  protected _scaleToTarget(root: Mobject = this): void {
    // Collect all VMobject descendants (may be direct children or nested in part VGroups)
    const vmobjects = collectGlyphs(root);

    // Compute bounding box from raw point data
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const vmob of vmobjects) {
      for (const p of vmob.getLocalPoints()) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
    }

    const rawHeight = maxY - minY;
    if (rawHeight < 0.0001) return;

    const worldPerMathJaxUnit =
      DEFAULT_FONT_SIZE_IN_WORLD_SPACE / (DEFAULT_FONT_SIZE_PT * MATHJAX_SVG_UNITS_PER_EM);
    let s = this._fontSize * worldPerMathJaxUnit;
    if (this._targetHeight !== undefined) {
      s = this._targetHeight / rawHeight;
    }

    // Center of current bounds
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Transform all point data: scale and center at origin
    for (const vmob of vmobjects) {
      const pts = vmob.getLocalPoints();
      const transformed = pts.map((p) => [(p[0] - cx) * s, (p[1] - cy) * s, p[2]]);
      vmob.setPoints3D(transformed);
    }
  }

  /**
   * Bake any pending parent `scaleVector` (e.g. from a pre-render `scale()`)
   * into descendant geometry so post-render `shift`/`moveTo` operate in the
   * same coordinate frame as the rendered glyphs. Without this step the
   * parent's Three.js scale would silently multiply any later child-frame
   * translations, producing a mismatch between `getCenter()` and the
   * rendered position. See issue #324.
   */
  protected _consumePendingScale(): void {
    const sx = this.scaleVector.x;
    const sy = this.scaleVector.y;
    const sz = this.scaleVector.z;
    if (sx === 1 && sy === 1 && sz === 1) return;

    const visit = (mob: Mobject) => {
      mob.position.set(mob.position.x * sx, mob.position.y * sy, mob.position.z * sz);
      if (mob instanceof VMobject && !(mob instanceof VGroup)) {
        const pts = mob.getLocalPoints();
        const scaled = pts.map((p) => [p[0] * sx, p[1] * sy, p[2] * sz]);
        mob.setPoints3D(scaled);
      }
      if ('children' in mob) {
        for (const child of (mob as { children: Mobject[] }).children) visit(child);
      }
      mob._markDirty();
    };
    for (const child of this.children) visit(child);
    this._geometryMatrix.premultiply(new THREE.Matrix4().makeScale(sx, sy, sz));
    this.scaleVector.set(1, 1, 1);
    this._markDirty();
  }

  /**
   * Render a multi-part expression by:
   * 1. Rendering the FULL expression as one MathJax call (correct layout)
   * 2. Rendering each part separately to count its glyphs
   * 3. Splitting the full expression's VMobjects into part groups by glyph count
   *
   * @param token - As in {@link _render}: a superseded render is dropped.
   */
  private async _renderMultiPart(
    latexParts: string[],
    token: number = this._renderToken,
  ): Promise<void> {
    try {
      await this._buildMultiPart(latexParts, token);
    } catch (error) {
      if (token !== this._renderToken) return;
      throw error;
    }
  }

  private async _buildMultiPart(latexParts: string[], token: number): Promise<void> {
    const fullLatex = latexParts.join('');

    // Render the full expression as one unit (correct spacing & layout)
    const fullResult = await renderLatexToSVG(fullLatex, {
      displayMode: this._displayMode,
      color: this._color,
      macros: this._macros,
    });

    this._restyleChildren(fullResult.vmobjectGroup);

    // Collect all VMobject children from the full render
    const allGlyphs: VMobject[] = [];
    for (const child of [...fullResult.vmobjectGroup.children]) {
      if (child instanceof VMobject) {
        allGlyphs.push(child);
      }
    }

    // Render each part separately to count how many glyphs it produces.
    // Use the same displayMode as the full render so MathJax produces matching
    // glyph counts (operators rendered alone in inline mode can drop or add
    // wrapper paths, throwing off the per-part assignment).
    const partGlyphCounts: number[] = [];
    for (const partLatex of latexParts) {
      const partResult = await renderLatexToSVG(partLatex, {
        displayMode: this._displayMode,
        color: this._color,
        macros: this._macros,
      });
      let count = 0;
      for (const child of partResult.vmobjectGroup.children) {
        if (child instanceof VMobject) count++;
      }
      partGlyphCounts.push(count);
    }
    if (token !== this._renderToken) return;

    // Assign glyphs from the full render to parts by count
    const staging = new VGroup();
    const parts: Array<VGroup & { _latex: string }> = [];
    let glyphIdx = 0;
    for (let i = 0; i < latexParts.length; i++) {
      const partGroup = new MathTex._PartGroup(this);
      partGroup._latex = latexParts[i];
      partGroup._color = this._color;

      const count = partGlyphCounts[i];
      for (let j = 0; j < count && glyphIdx < allGlyphs.length; j++) {
        const glyph = allGlyphs[glyphIdx++];
        fullResult.vmobjectGroup.remove(glyph);
        partGroup.add(glyph);
      }

      parts.push(partGroup);
      staging.add(partGroup);
    }

    // If there are leftover glyphs (spacing elements etc.), add to last part
    while (glyphIdx < allGlyphs.length && parts.length > 0) {
      const glyph = allGlyphs[glyphIdx++];
      fullResult.vmobjectGroup.remove(glyph);
      parts[parts.length - 1].add(glyph);
    }

    this._commitRender(staging, fullResult.svgElement, parts);
  }

  /**
   * Lightweight VGroup used as a part container in multi-part mode.
   * Supports setColor() for per-part coloring.
   */
  private static _PartGroup = class extends VGroup {
    _latex: string = '';
    _color: string = getActiveTheme().fillColor;
    constructor(_parent?: MathTex) {
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

    override copy(): VGroup {
      const copy = new MathTex._PartGroup();
      copy._latex = this._latex;
      copy._color = this._color;
      this._copyBaseAttributesInto(copy);
      return copy;
    }
  };

  override copy(): MathTex {
    const copy = new MathTex(this._copyConstructorOptions());
    this._copyRenderStateInto(copy);
    return copy;
  }

  /**
   * Constructor options that rebuild this MathTex, for copy(). A subclass's
   * copy() spreads them into its own constructor options (the internal
   * no-render token travels with the spread).
   */
  protected _copyConstructorOptions(): MathTexOptions {
    // Multi-part: rebuild from the parts retained at construction. (This
    // used to read `this._parts`, which is empty until the render lands —
    // a copy made before that got `latex: []` and stayed empty forever.)
    // _latexParts is non-null exactly when _isMultiPart: the constructor
    // sets both in the same branch, and nothing else sets either.
    const latexValue = this._isMultiPart ? [...(this._latexParts as string[])] : this._latex;
    const options: MathTexOptionsWithSkip = {
      latex: latexValue,
      color: this._color,
      fontSize: this._fontSize,
      displayMode: this._displayMode,
      position: [this.position.x, this.position.y, this.position.z],
      strokeWidth: this._svgStrokeWidth,
      fillOpacity: this._svgFillOpacity,
      height: this._targetHeight,
      macros: this._macros,
      anchor: this._anchor,
    };
    // If the source had completed its render, the deep copy made by
    // _copyRenderStateInto is the copy's complete geometry: mark the options
    // so the constructor does not start a redundant render at all (a second
    // set of glyphs landing on top of the deep copy is what broke
    // VGroup.setPoints' partition invariant for animation state snapshots:
    // "expected N points, got 2N"). The copy presents as rendered too, so a
    // copy OF this copy starts no render either. If the source had not
    // rendered yet, the copy starts its own render: it is the only source of
    // glyphs the copy gets.
    if (this._renderCompleted) {
      options[SKIP_RENDER] = true;
    }
    return options;
  }

  /**
   * Deep-copy the children and the render state into `copy`, a fresh
   * instance built from {@link _copyConstructorOptions}.
   */
  protected _copyRenderStateInto(copy: MathTex): void {
    this._copyBaseAttributesInto(copy, { copyChildren: true });
    if (this._renderCompleted) {
      copy._renderCompleted = true;
      // The copied glyphs carry the same baked transform and layout, so a
      // setLatex() on the copy re-renders them in the same place.
      copy._geometryMatrix.copy(this._geometryMatrix);
      copy._layoutExtent = this._layoutExtent ? [...this._layoutExtent] : null;
      if (this._isMultiPart) {
        // No render will rebuild _parts; point it at the copied part
        // groups (children were copied in part order).
        copy._parts = copy.children.filter(
          (c): c is VGroup & { _latex: string } => c instanceof MathTex._PartGroup,
        );
      }
    }
  }
}

/**
 * @deprecated Use `MathTex` instead. `MathTexSVG` is a backwards-compatible alias.
 */
export const MathTexSVG = MathTex;
/** @deprecated Use `MathTexOptions` instead. */
export type MathTexSVGOptions = MathTexOptions;
