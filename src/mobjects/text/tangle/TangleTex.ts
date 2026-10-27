/**
 * TangleTex - a MathTex with named numbers you can change in place.
 *
 * Mark numbers with `\tangle{name}` and matrices with `\tanglematrix{name}`
 * in the LaTeX, and configure each name. Every parameter is backed by a
 * {@link ValueTracker}, so the formula follows tracker animations and
 * updaters like any other mobject; a matrix collapses to a symbol and can
 * be expanded. The glyphs of each marker can be looked up after every
 * render, which is what the interaction layer (makeTangle) hit-tests.
 *
 * This file holds the mobject only; dragging and editing are separate.
 */

import typia from 'typia';
import type { Mobject } from '../../../core/Mobject';
import { VMobject } from '../../../core/VMobject';
import type { VGroup } from '../../../core/VGroup';
import { ValueTracker } from '../../value-tracker/ValueTracker';
import { MathTex, type MathTexOptions } from '../MathTex';
import { collectGlyphs } from '../mathTexLayout';
import { getGlyphClasses } from '../svgPathParser';
import { TangleCollapse, TangleExpand, type TangleMorphOptions } from './TangleMorph';
import {
  expandTangle,
  matrixKey,
  resolveTangleSpec,
  snapTangleValue,
  type ResolvedTangleMatrix,
  type ResolvedTangleParam,
  type TangleMatrix,
  type TangleParam,
  type TangleSpec,
  type TangleTag,
} from './tangleSource';

/**
 * @internal A displayed render of a TangleTex: its glyphs (by reference)
 * and the lookup state that goes with them. Used by matrix morphs to swap
 * between the starting and the target render.
 */
export interface TangleRenderState {
  readonly children: Mobject[];
  readonly latex: string;
  readonly tags: ReadonlyMap<string, TangleTag>;
  readonly indexedTags: ReadonlyMap<string, TangleTag>;
  readonly glyphIndex: Map<string, number[]>;
  readonly layoutExtent: [number, number] | null;
  readonly expanded: ReadonlySet<string>;
}

export interface TangleTexOptions extends Omit<MathTexOptions, 'latex'> {
  /** LaTeX with `\tangle{name}` and `\tanglematrix{name}` markers. */
  latex: string;
  /** Configuration of each `\tangle{name}`. */
  parameters?: Record<string, TangleParam>;
  /** Configuration of each `\tanglematrix{name}`. */
  matrices?: Record<string, TangleMatrix>;
}

/**
 * TangleTex - LaTeX with draggable, animatable numbers and expandable matrices.
 *
 * @example
 * ```typescript
 * const tex = new TangleTex({
 *   latex: String.raw`\vec y = \tanglematrix{R}\,\vec x`,
 *   parameters: {
 *     k: { value: 2, min: 0, max: 5, step: 0.1 },
 *     t: { value: 0.5, min: -3.14, max: 3.14, step: 0.05, display: 'symbol', symbol: '\\theta' },
 *   },
 *   matrices: {
 *     R: {
 *       entries: [
 *         ['\\tangle{k}\\cos\\tangle{t}', '-\\tangle{k}\\sin\\tangle{t}'],
 *         ['\\tangle{k}\\sin\\tangle{t}', '\\tangle{k}\\cos\\tangle{t}'],
 *       ],
 *     },
 *   },
 * });
 * scene.add(tex);
 * tex.setExpanded('R', true);
 * await scene.play(tex.getTracker('k').animateTo(3));
 * ```
 */
export class TangleTex extends MathTex {
  /** The validated configuration. */
  protected _spec: TangleSpec;
  /** The configuration as given, for copy(). */
  protected _tangleConfig: {
    latex: string;
    parameters: Record<string, TangleParam>;
    matrices: Record<string, TangleMatrix>;
  };
  protected _trackers: Map<string, ValueTracker> = new Map();
  /** Symbol-display parameters currently shown as numbers. */
  protected _revealed: Set<string> = new Set();
  /** Expanded matrix occurrences, as matrixKey() strings. */
  protected _expanded: Set<string> = new Set();
  /** Tags of the LaTeX last requested (the one the next commit renders). */
  protected _tags: ReadonlyMap<string, TangleTag> = new Map();
  /**
   * Class name -> indices into collectGlyphs(this), for the glyphs currently
   * displayed. Indices rather than glyph references so copy() can carry it
   * over to the deep-copied glyphs.
   */
  protected _glyphIndex: Map<string, number[]> = new Map();
  /** Tags of the glyphs currently displayed. */
  protected _indexedTags: ReadonlyMap<string, TangleTag> = new Map();
  /** While > 0, refresh() does nothing (a matrix morph owns the glyphs). */
  protected _refreshHolds: number = 0;
  /** Morph targets still rendering; waitForRender() waits for them too. */
  protected _pendingTargets: Set<Promise<unknown>> = new Set();

  constructor(options: TangleTexOptions) {
    typia.assert<TangleTexOptions>(options);
    const { latex: template, parameters = {}, matrices = {}, ...mathTexOptions } = options;
    const spec = resolveTangleSpec(template, parameters, matrices);
    const expanded = new Set<string>();
    for (const [name, count] of spec.matrixOccurrences) {
      if (!spec.matrices.get(name)?.expanded) continue;
      for (let i = 0; i < count; i++) expanded.add(matrixKey(name, i));
    }
    const values = new Map([...spec.params].map(([name, p]) => [name, p.value]));
    const expansion = expandTangle(spec, { values, revealed: new Set(), expanded });

    super({ ...mathTexOptions, latex: expansion.latex });

    this._spec = spec;
    this._tangleConfig = { latex: template, parameters, matrices };
    this._expanded = expanded;
    this._tags = expansion.tags;
    for (const [name, value] of values) this._trackers.set(name, new ValueTracker(value));
  }

  // ── Parameters ───────────────────────────────────────────────────

  /** Names of all parameters, including those that number cells create. */
  getParameterNames(): string[] {
    return [...this._spec.params.keys()];
  }

  /** A parameter's configuration with every default filled in. */
  getParameter(name: string): ResolvedTangleParam {
    return this._param(name);
  }

  /**
   * The ValueTracker behind a parameter. Animating or setting it updates
   * the formula on the next frame (or call {@link refresh}).
   */
  getTracker(name: string): ValueTracker {
    this._param(name);
    return this._trackers.get(name) as ValueTracker;
  }

  /** A parameter's current value (its tracker's value). */
  getValue(name: string): number {
    return this.getTracker(name).getValue();
  }

  /** Every parameter's current value. */
  getValues(): Record<string, number> {
    return Object.fromEntries([...this._trackers].map(([name, t]) => [name, t.getValue()]));
  }

  /**
   * Set a parameter, snapped to its step and clamped to [min, max], and
   * re-render. Chainable; `waitForRender()` resolves when the glyphs land.
   *
   * @post this.getValue(name) === snapTangleValue(value, this.getParameter(name))
   */
  setValue(name: string, value: number): this {
    this.getTracker(name).setValue(snapTangleValue(value, this._param(name)));
    this.refresh();
    return this;
  }

  /** Set every parameter back to its configured value. */
  reset(): this {
    for (const [name, param] of this._spec.params) {
      (this._trackers.get(name) as ValueTracker).setValue(param.value);
    }
    this.refresh();
    return this;
  }

  /**
   * Show a `'symbol'` parameter as its number (or back as its symbol).
   * No effect on the look of `'number'` parameters.
   */
  setRevealed(name: string, revealed: boolean): this {
    this._param(name);
    if (revealed) this._revealed.add(name);
    else this._revealed.delete(name);
    this.refresh();
    return this;
  }

  /** Whether a parameter is currently shown as a number. */
  isShowingNumber(name: string): boolean {
    return this._param(name).display === 'number' || this._revealed.has(name);
  }

  // ── Matrices ─────────────────────────────────────────────────────

  /** Names of all matrices. */
  getMatrixNames(): string[] {
    return [...this._spec.matrices.keys()];
  }

  /** Names of the matrices whose cells reference a parameter. */
  getMatricesUsing(name: string): string[] {
    this._param(name);
    return [...this._spec.matrices.values()].filter((m) => m.params.has(name)).map((m) => m.name);
  }

  /** How many `\tanglematrix{name}` markers the LaTeX has. */
  getMatrixOccurrenceCount(name: string): number {
    this._matrix(name);
    return this._spec.matrixOccurrences.get(name) ?? 0;
  }

  /**
   * Expand a matrix to its entries, or collapse it to its symbol, and
   * re-render. Without `occurrence`, applies to every marker of the matrix.
   */
  setExpanded(name: string, expanded: boolean, occurrence?: number): this {
    const count = this.getMatrixOccurrenceCount(name);
    const occurrences = occurrence === undefined ? [...Array(count).keys()] : [occurrence];
    for (const i of occurrences) {
      if (!Number.isInteger(i) || i < 0 || i >= count) {
        throw new Error(`TangleTex: matrix '${name}' has no occurrence ${i}.`);
      }
      if (expanded) this._expanded.add(matrixKey(name, i));
      else this._expanded.delete(matrixKey(name, i));
    }
    this.refresh();
    return this;
  }

  /** Whether a matrix marker currently shows its entries. */
  isExpanded(name: string, occurrence: number = 0): boolean {
    this._matrix(name);
    return this._expanded.has(matrixKey(name, occurrence));
  }

  /**
   * A matrix's numeric value: its `evaluate` function if it has one, else
   * the value of each cell's parameter.
   *
   * @throws Error when a cell is an expression and there is no `evaluate`.
   */
  getMatrix(name: string): number[][] {
    const matrix = this._matrix(name);
    if (matrix.evaluate) return matrix.evaluate(this.getValues());
    return matrix.cellParams.map((row) =>
      row.map((param) => {
        if (param === null) {
          throw new Error(
            `TangleTex: matrix '${name}' has expression cells; give it an \`evaluate\` function.`,
          );
        }
        return this.getValue(param);
      }),
    );
  }

  /**
   * Animate a matrix from its symbol to its entries. The symbol morphs into
   * the matrix while the rest of the formula slides to its new place.
   * Without `occurrence`, every marker of the matrix expands.
   *
   * @example
   * ```typescript
   * await scene.play(tex.expand('R', { duration: 0.8 }));
   * ```
   */
  expand(name: string, options: TangleMorphOptions = {}): TangleExpand {
    return new TangleExpand(this, name, options);
  }

  /** Animate a matrix from its entries back to its symbol. See {@link expand}. */
  collapse(name: string, options: TangleMorphOptions = {}): TangleCollapse {
    return new TangleCollapse(this, name, options);
  }

  // ── Glyph lookup ─────────────────────────────────────────────────

  /**
   * The occurrence numbers of a parameter that are currently displayed
   * (occurrences inside a collapsed matrix are not).
   */
  getParameterOccurrences(name: string): number[] {
    this._param(name);
    return this._occurrences('param', name);
  }

  /**
   * The displayed glyphs of a parameter: of one occurrence, or of all of
   * them. Reflects what is on screen, so during a pending re-render it
   * still describes the old glyphs.
   */
  getParameterGlyphs(name: string, occurrence?: number): VMobject[] {
    this._param(name);
    return this._glyphsOf('param', name, occurrence);
  }

  /** The displayed glyphs of a matrix marker (symbol or entries). See {@link getParameterGlyphs}. */
  getMatrixGlyphs(name: string, occurrence?: number): VMobject[] {
    this._matrix(name);
    return this._glyphsOf('matrix', name, occurrence);
  }

  // ── Rendering ────────────────────────────────────────────────────

  /**
   * Re-render if the displayed LaTeX is out of date with the trackers,
   * reveals or expansions. Called by every setter, and on every frame via
   * update(), so tracker animations and updaters show up without it.
   */
  refresh(): this {
    if (this._refreshHolds > 0) return this;
    const values = new Map([...this._trackers].map(([name, t]) => [name, t.getValue()]));
    const expansion = expandTangle(this._spec, {
      values,
      revealed: this._revealed,
      expanded: this._expanded,
    });
    if (expansion.latex !== this._latex) {
      this._tags = expansion.tags;
      void this.setLatex(expansion.latex).catch(() => {
        // Recorded by setLatex for waitForRender(); nothing else to do here.
      });
    }
    return this;
  }

  override update(dt: number): void {
    this.refresh();
    super.update(dt);
  }

  /** Also waits for the targets of matrix morphs created from this TangleTex. */
  override async waitForRender(): Promise<void> {
    await super.waitForRender();
    while (this._pendingTargets.size > 0) await Promise.all([...this._pendingTargets]);
  }

  // ── Matrix morph support (used by TangleExpand / TangleCollapse) ──

  /**
   * @internal Render, off-screen, this TangleTex with the given matrix
   * occurrences expanded or collapsed. The target is a copy taken once this
   * TangleTex has settled, so its glyphs share this one's local frame,
   * baked transform and anchor. `onReady` (or `onError`) runs before
   * waitForRender() resolves.
   */
  _prepareMorphTarget(
    name: string,
    occurrences: number[],
    expanded: boolean,
    onReady: (target: TangleTex) => void,
    onError: (error: unknown) => void,
  ): void {
    const done = super
      .waitForRender()
      .then(async () => {
        const target = this.copy();
        for (const i of occurrences) target.setExpanded(name, expanded, i);
        await target.waitForRender();
        return target;
      })
      .then(onReady, onError);
    this._pendingTargets.add(done);
    void done.then(() => this._pendingTargets.delete(done));
  }

  /** @internal The displayed render: glyphs (by reference) plus lookup state. */
  _captureRenderState(): TangleRenderState {
    return {
      children: [...this.children],
      latex: this._latex,
      tags: this._tags,
      indexedTags: this._indexedTags,
      glyphIndex: this._glyphIndex,
      layoutExtent: this._layoutExtent ? [...this._layoutExtent] : null,
      expanded: new Set(this._expanded),
    };
  }

  /**
   * @internal Show a captured render: its glyphs replace the current
   * children (which are detached, not disposed, so a captured state can be
   * shown again). Cancels any re-render in flight.
   */
  _adoptRenderState(state: TangleRenderState): void {
    this._renderToken++;
    this.remove(...this.children);
    this.add(...state.children);
    this._latex = state.latex;
    this._tags = state.tags;
    this._indexedTags = state.indexedTags;
    this._glyphIndex = state.glyphIndex;
    this._layoutExtent = state.layoutExtent ? [...state.layoutExtent] : null;
    this._expanded = new Set(state.expanded);
    this._renderCompleted = true;
    this._markDirty();
  }

  /** @internal Stop (hold = true) or resume refresh(); calls nest. */
  _holdRefresh(hold: boolean): void {
    this._refreshHolds = Math.max(0, this._refreshHolds + (hold ? 1 : -1));
    if (this._refreshHolds === 0) this.refresh();
  }

  override setColor(color: string): this {
    super.setColor(color);
    this._applyTagColors();
    return this;
  }

  protected override _commitRender(
    staging: VGroup,
    svgElement: SVGElement,
    parts: Array<VGroup & { _latex: string }>,
  ): void {
    super._commitRender(staging, svgElement, parts);
    // Only the latest request commits, so _tags describes these glyphs.
    this._indexedTags = this._tags;
    this._glyphIndex = new Map();
    collectGlyphs(this).forEach((glyph, i) => {
      for (const cls of getGlyphClasses(glyph)) {
        if (!this._indexedTags.has(cls)) continue;
        const list = this._glyphIndex.get(cls);
        if (list) list.push(i);
        else this._glyphIndex.set(cls, [i]);
      }
    });
    this._applyTagColors();
  }

  /** Color matrix glyphs, then parameter glyphs (so parameters win inside a matrix). */
  protected _applyTagColors(): void {
    const glyphs = collectGlyphs(this);
    for (const kind of ['matrix', 'param'] as const) {
      for (const [cls, tag] of this._indexedTags) {
        if (tag.kind !== kind) continue;
        const color =
          kind === 'param'
            ? this._spec.params.get(tag.name)?.color
            : this._spec.matrices.get(tag.name)?.color;
        if (!color) continue;
        for (const i of this._glyphIndex.get(cls) ?? []) glyphs[i]?.setColor(color);
      }
    }
  }

  override copy(): TangleTex {
    const copy = new TangleTex({
      ...this._copyConstructorOptions(),
      ...this._tangleConfig,
    });
    this._copyRenderStateInto(copy);
    for (const [name, tracker] of this._trackers) {
      (copy._trackers.get(name) as ValueTracker).setValue(tracker.getValue());
    }
    copy._revealed = new Set(this._revealed);
    copy._expanded = new Set(this._expanded);
    copy._tags = this._tags;
    copy._indexedTags = this._indexedTags;
    copy._glyphIndex = new Map([...this._glyphIndex].map(([cls, idx]) => [cls, [...idx]]));
    if (this._renderCompleted) {
      // The deep-copied glyphs show this LaTeX (the copy's constructor
      // built the initial-state LaTeX and, skipping its render, nothing else).
      copy._latex = this._latex;
    } else {
      // No glyphs yet: replace the constructor's initial-state render with
      // one of the copied state.
      copy.refresh();
    }
    return copy;
  }

  // ── Internals ────────────────────────────────────────────────────

  protected _param(name: string): ResolvedTangleParam {
    const param = this._spec.params.get(name);
    if (!param) throw new Error(`TangleTex: unknown parameter '${name}'.`);
    return param;
  }

  protected _matrix(name: string): ResolvedTangleMatrix {
    const matrix = this._spec.matrices.get(name);
    if (!matrix) throw new Error(`TangleTex: unknown matrix '${name}'.`);
    return matrix;
  }

  protected _occurrences(kind: TangleTag['kind'], name: string): number[] {
    const result: number[] = [];
    for (const tag of this._indexedTags.values()) {
      if (tag.kind === kind && tag.name === name) result.push(tag.occurrence);
    }
    return result.sort((a, b) => a - b);
  }

  protected _glyphsOf(kind: TangleTag['kind'], name: string, occurrence?: number): VMobject[] {
    const glyphs = collectGlyphs(this);
    const result: VMobject[] = [];
    for (const [cls, tag] of this._indexedTags) {
      if (tag.kind !== kind || tag.name !== name) continue;
      if (occurrence !== undefined && tag.occurrence !== occurrence) continue;
      for (const i of this._glyphIndex.get(cls) ?? []) {
        const glyph = glyphs[i];
        if (glyph instanceof VMobject) result.push(glyph);
      }
    }
    return result;
  }
}
