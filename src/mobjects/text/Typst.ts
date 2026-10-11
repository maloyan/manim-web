/**
 * Typst - Vector-based Typst rendering using SVG paths.
 *
 * `Typst` compiles Typst markup to SVG via a lazy-loaded WASM compiler and
 * imports the result into real VMobject paths, exactly like `MathTex` does for
 * LaTeX. This enables path-based animations (Create, DrawBorderThenFill,
 * point-morphing Transform). `MathTypst` is the math-mode variant: it wraps the
 * input in Typst math delimiters (`$ ... $`), mirroring the MathTex-vs-Tex split.
 *
 * Difference from MathTex: the MathJax render path can resolve synchronously in
 * some environments, while the Typst compiler is ALWAYS asynchronous (the WASM
 * compile is a promise). Construction stays synchronous; call `waitForRender()`
 * (the same ready-promise pattern MathTex exposes) before reading geometry.
 *
 * Uses renderTypstToSVG() -> svgToVMobjects() pipeline.
 */

import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import type { Mobject, MobjectStyle, Vector3Tuple } from '../../core/Mobject';
import { WHITE } from '../../constants/colors';
import { DEFAULT_FONT_SIZE_IN_WORLD_SPACE, DEFAULT_FONT_SIZE_PT } from '../../constants/fontRender';
import typia from 'typia';
import { renderTypstToSVG } from './TypstRenderer';
import { logger } from '../../utils/logger';

/**
 * Typst SVG coordinate units per em.
 *
 * Typst compiles layout to physical units and emits SVG geometry at roughly 16
 * units per point. This constant keeps a default-font-size Typst mobject in the
 * same world-space ballpark as a MathTex of the same `fontSize`. It is an
 * approximation: for exact control, pass an explicit `height`.
 */
const TYPST_SVG_UNITS_PER_EM = 16;

export interface TypstOptions {
  /** Typst markup to compile. For `MathTypst`, math-mode content without `$`. */
  typst: string;
  /** Color as CSS color string. Default: WHITE ('#ffffff'). */
  color?: string;
  /** Scale factor (1 = standard size). Default: DEFAULT_FONT_SIZE_PT. */
  fontSize?: number;
  /** Position in 3D space. Default: [0, 0, 0]. */
  position?: Vector3Tuple;
  /** Stroke width for glyph outlines. Default: 0.00001. */
  strokeWidth?: number;
  /** Fill opacity for glyph interiors. Default: 1. */
  fillOpacity?: number;
  /** Explicit target height in world units. Overrides fontSize scaling. */
  height?: number;
}

/** Options for `MathTypst` (identical shape to `TypstOptions`). */
export type MathTypstOptions = TypstOptions;

export class Typst extends VGroup {
  /** Raw markup the user passed (before any math-mode wrapping). */
  protected _typst: string;
  /** Actual source compiled by Typst (wrapped for math mode in `MathTypst`). */
  protected _source: string;
  protected _fontSize: number;
  protected _color: string;
  protected _svgStrokeWidth: number;
  protected _svgFillOpacity: number;
  protected _targetHeight: number | undefined;

  /** Promise that resolves when rendering is complete. */
  protected _renderPromise: Promise<void> | null = null;
  /** Error from rendering, if any. */
  protected _renderError: Error | null = null;

  constructor(options: TypstOptions) {
    super();

    typia.assert<TypstOptions>(options);

    const {
      typst,
      color = WHITE,
      fontSize = DEFAULT_FONT_SIZE_PT,
      position = [0, 0, 0],
      strokeWidth = 0.00001, // nonzero so glyphs stay visible (see MathTex #258)
      fillOpacity = 1,
      height,
    } = options;

    this._typst = typst;
    this._source = this._buildSource(typst);
    this._fontSize = fontSize;
    this._color = color;
    this._svgStrokeWidth = strokeWidth;
    this.strokeWidth = strokeWidth;
    this._svgFillOpacity = fillOpacity;
    this.fillOpacity = fillOpacity;
    this._targetHeight = height;

    this.position.set(position[0], position[1], position[2]);

    this._startRender();
  }

  /**
   * Build the Typst source actually compiled from the user's markup.
   * The base `Typst` compiles the markup verbatim; `MathTypst` overrides this to
   * wrap the markup in math-mode delimiters.
   *
   * Pure (depends only on its argument), so it is safe to call from the base
   * constructor before subclass fields initialize.
   */
  protected _buildSource(markup: string): string {
    return markup;
  }

  /**
   * Wait for the Typst markup to finish compiling and rendering.
   */
  async waitForRender(): Promise<void> {
    if (this._renderPromise) {
      await this._renderPromise;
    }
    if (this._renderError) {
      throw this._renderError;
    }
  }

  /** Get the raw markup the user passed. */
  getTypst(): string {
    return this._typst;
  }

  /** Get the actual Typst source compiled (math-wrapped for `MathTypst`). */
  getSource(): string {
    return this._source;
  }

  /**
   * Get the render error, if any. Returns null when rendering succeeded or is
   * still in progress.
   */
  getRenderError(): Error | null {
    return this._renderError;
  }

  /**
   * World-space center. An empty (not-yet-rendered) Typst falls back to its
   * world-space origin instead of throwing, because Typst is built lazily and
   * `scale()` / `moveTo()` may run before the SVG geometry exists.
   */
  override getCenter(): Vector3Tuple {
    if (this.isEmpty()) {
      return this._localToWorld([0, 0, 0]);
    }
    return super.getCenter();
  }

  /**
   * Override setColor to propagate to all VMobject children (fill + stroke).
   */
  override setColor(color: string): this {
    this._color = color;
    for (const child of this.children) {
      if (child instanceof VMobject) {
        child.setColor(color);
      }
      if (child instanceof VGroup) {
        for (const grandchild of child.children) {
          if (grandchild instanceof VMobject) {
            grandchild.setColor(color);
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
        logger.error('Typst rendering error:', error);
        this._renderError = error instanceof Error ? error : new Error(String(error));
      });
  }

  /**
   * Compile the Typst source to SVG and build VMobject paths.
   */
  protected async _render(): Promise<void> {
    const result = await renderTypstToSVG(this._source, {
      color: this._color,
      strokeWidth: 0.02,
      fillOpacity: this._svgFillOpacity,
    });

    const vmobjectGroup = result.vmobjectGroup;

    this._restyleChildren(vmobjectGroup);

    for (const child of [...vmobjectGroup.children]) {
      vmobjectGroup.remove(child);
      this.add(child);
    }

    this._scaleToTarget();
    this._consumePendingScale();

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
        const style = (mob as unknown as { _style: MobjectStyle })._style;
        style.fillOpacity = this._svgFillOpacity;
        style.strokeWidth = this._svgStrokeWidth;
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
   * Unit flow mirrors MathTex: convert Typst SVG units to world units via the
   * font-size baseline and `TYPST_SVG_UNITS_PER_EM`. An explicit `height`
   * overrides the fontSize scaling with an exact target.
   */
  protected _scaleToTarget(): void {
    const vmobjects: VMobject[] = [];
    const collect = (mob: Mobject) => {
      if (mob instanceof VMobject && !(mob instanceof VGroup)) {
        vmobjects.push(mob);
      }
      if ('children' in mob) {
        for (const child of (mob as { children: Mobject[] }).children) {
          collect(child);
        }
      }
    };
    collect(this);

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

    const worldPerTypstUnit =
      DEFAULT_FONT_SIZE_IN_WORLD_SPACE / (DEFAULT_FONT_SIZE_PT * TYPST_SVG_UNITS_PER_EM);
    let s = this._fontSize * worldPerTypstUnit;
    if (this._targetHeight !== undefined) {
      s = this._targetHeight / rawHeight;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    for (const vmob of vmobjects) {
      const pts = vmob.getLocalPoints();
      const transformed = pts.map((p) => [(p[0] - cx) * s, (p[1] - cy) * s, p[2]]);
      vmob.setPoints3D(transformed);
    }
  }

  /**
   * Bake any pending parent `scaleVector` (e.g. from a pre-render `scale()`)
   * into descendant geometry so post-render `shift` / `moveTo` operate in the
   * same coordinate frame as the rendered glyphs (mirrors MathTex #324).
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
    this.scaleVector.set(1, 1, 1);
    this._markDirty();
  }

  override copy(): Typst {
    const copy = new Typst({
      typst: this._typst,
      color: this._color,
      fontSize: this._fontSize,
      position: [this.position.x, this.position.y, this.position.z],
      strokeWidth: this._svgStrokeWidth,
      fillOpacity: this._svgFillOpacity,
      height: this._targetHeight,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: true });
    return copy;
  }
}

/**
 * MathTypst - Typst in display math mode.
 *
 * Wraps the input in Typst math delimiters (`$ ... $`), mirroring how `MathTex`
 * renders math while `Tex` renders text. The raw markup is kept verbatim in
 * `getTypst()`; the wrapped form is what the compiler receives (`getSource()`).
 *
 * @example
 * ```typescript
 * const eq = new MathTypst({ typst: 'sum_(k=1)^n k = frac(n(n + 1), 2)' });
 * await eq.waitForRender();
 * ```
 */
export class MathTypst extends Typst {
  protected override _buildSource(markup: string): string {
    return `$ ${markup} $`;
  }

  override copy(): MathTypst {
    const copy = new MathTypst({
      typst: this._typst,
      color: this._color,
      fontSize: this._fontSize,
      position: [this.position.x, this.position.y, this.position.z],
      strokeWidth: this._svgStrokeWidth,
      fillOpacity: this._svgFillOpacity,
      height: this._targetHeight,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: true });
    return copy;
  }
}
