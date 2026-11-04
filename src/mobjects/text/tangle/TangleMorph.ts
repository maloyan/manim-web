/**
 * TangleExpand / TangleCollapse - animate a TangleTex matrix between its
 * symbol and its entries.
 *
 * Both renders are known before the animation starts (the target is
 * rendered off-screen while scene.play() waits for async renders). Glyphs
 * outside the matrix are the same characters in both renders, in the same
 * order, so glyph i of one slides to glyph i of the other. The symbol and
 * the matrix fade-transform into each other (as Manim's FadeTransform): each
 * moves and stretches toward the other's bounding box while one fades out
 * and the other fades in. If the outside glyphs do not pair up (e.g. a
 * stretchy delimiter around the matrix changes size and is built from a
 * different number of pieces), the whole formula fade-transforms instead.
 *
 * At the end the exact target render replaces the morphing glyphs;
 * reset() puts the starting render back, so the Player can seek backward.
 */

import * as THREE from 'three';
import { Animation, type AnimationOptions } from '../../../animation/Animation';
import type { Mobject } from '../../../core/Mobject';
import { VMobject } from '../../../core/VMobject';
import { collectGlyphs } from '../mathTexLayout';
import type { TangleRenderState, TangleTex } from './TangleTex';

export interface TangleMorphOptions extends AnimationOptions {
  /** Which `\tanglematrix` marker to animate. Default: every marker of the matrix. */
  occurrence?: number;
}

/** A glyph's starting geometry and opacity, so interpolate() is a pure function of alpha. */
interface GlyphStart {
  glyph: VMobject;
  points: number[][];
  fillOpacity: number;
  strokeOpacity: number;
}

/** Glyphs that fade-transform from `from` (fading out) into `to` (fading in). */
interface FadePair {
  from: GlyphStart[];
  to: GlyphStart[];
  fromBox: Box;
  toBox: Box;
}

interface Box {
  center: [number, number];
  size: [number, number];
}

function startOf(glyph: VMobject): GlyphStart {
  return {
    glyph,
    points: glyph.getLocalPoints().map((p) => [...p]),
    fillOpacity: glyph.fillOpacity,
    strokeOpacity: glyph.opacity,
  };
}

function boxOf(glyphs: GlyphStart[]): Box {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const g of glyphs) {
    for (const p of g.points) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
  }
  if (minX > maxX) return { center: [0, 0], size: [0, 0] };
  return { center: [(minX + maxX) / 2, (minY + maxY) / 2], size: [maxX - minX, maxY - minY] };
}

/** Ratio a/b, or 1 when either side is too small to stretch meaningfully. */
function ratio(a: number, b: number): number {
  return a > 1e-6 && b > 1e-6 ? a / b : 1;
}

/**
 * Map `start`'s points: scale by `scale` about `from`, then move `from` to `to`.
 * Sets the opacity to `opacity` times the starting opacity.
 */
function place(
  start: GlyphStart,
  from: [number, number],
  to: [number, number],
  scale: [number, number],
  opacity: number,
): void {
  const m = new THREE.Matrix4()
    .makeTranslation(to[0], to[1], 0)
    .multiply(new THREE.Matrix4().makeScale(scale[0], scale[1], 1))
    .multiply(new THREE.Matrix4().makeTranslation(-from[0], -from[1], 0));
  const v = new THREE.Vector3();
  start.glyph.setPoints3D(
    start.points.map((p) => {
      v.set(p[0], p[1], p[2]).applyMatrix4(m);
      return [v.x, v.y, v.z];
    }),
  );
  start.glyph.setFillOpacity(start.fillOpacity * opacity);
  start.glyph.setStrokeOpacity(start.strokeOpacity * opacity);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Glyphs of a captured render, in the same order as collectGlyphs on the displayed TangleTex. */
function glyphsOf(state: TangleRenderState): VMobject[] {
  return state.children.flatMap((child: Mobject) => collectGlyphs(child));
}

/** Split a render's glyphs into those of the animated matrix occurrences and the rest. */
function splitGlyphs(
  state: TangleRenderState,
  name: string,
  occurrences: number[],
): { outside: VMobject[]; matrix: Map<number, VMobject[]> } {
  const glyphs = glyphsOf(state);
  const inMatrix = new Set<number>();
  const matrix = new Map<number, VMobject[]>();
  for (const occurrence of occurrences) {
    const indices = state.glyphIndex.get(`tangle-m-${name}-${occurrence}`) ?? [];
    indices.forEach((i) => inMatrix.add(i));
    matrix.set(
      occurrence,
      indices.map((i) => glyphs[i]),
    );
  }
  return { outside: glyphs.filter((_, i) => !inMatrix.has(i)), matrix };
}

/**
 * Base of {@link TangleExpand} and {@link TangleCollapse}: morph between the
 * displayed render and the render with the matrix occurrences toggled.
 */
export abstract class TangleMatrixMorph extends Animation<TangleTex> {
  private readonly _name: string;
  private readonly _occurrences: number[];
  private _targetTex: TangleTex | null = null;
  private _targetError: unknown = null;
  private _startState: TangleRenderState | null = null;
  private _endState: TangleRenderState | null = null;
  /** Glyph pairs that slide from one render's spot to the other's. */
  private _slides: Array<{ start: GlyphStart; end: number[][] }> = [];
  private _fades: FadePair[] = [];
  /** Copies of target glyphs shown while fading in; removed at the end. */
  private _temporaries: VMobject[] = [];
  private _holding = false;

  constructor(tex: TangleTex, name: string, expanded: boolean, options: TangleMorphOptions) {
    const { occurrence, ...animationOptions } = options;
    super(tex, animationOptions);
    this._name = name;
    const count = tex.getMatrixOccurrenceCount(name);
    this._occurrences = occurrence === undefined ? [...Array(count).keys()] : [occurrence];
    for (const i of this._occurrences) {
      if (!Number.isInteger(i) || i < 0 || i >= count) {
        throw new Error(`TangleTex: matrix '${name}' has no occurrence ${i}.`);
      }
    }
    tex._prepareMorphTarget(
      name,
      this._occurrences,
      expanded,
      (target) => {
        this._targetTex = target;
      },
      (error) => {
        this._targetError = error;
      },
    );
  }

  override begin(): void {
    super.begin();
    const tex = this.mobject;
    if (!this._endState) {
      if (!this._targetTex) {
        throw new Error(
          `TangleTex: the ${this._name} morph target is not rendered yet` +
            (this._targetError ? ` (${String(this._targetError)})` : '') +
            '. Play it with scene.play(), or await tex.waitForRender() first.',
        );
      }
      this._endState = this._targetTex._captureRenderState();
    }
    this._startState = tex._captureRenderState();
    tex._holdRefresh(true);
    this._holding = true;
    this._plan(this._startState, this._endState);
    this.interpolate(0);
  }

  /** Pair glyphs of the two renders and stage the target's matrix glyphs. */
  private _plan(start: TangleRenderState, end: TangleRenderState): void {
    const tex = this.mobject;
    const a = splitGlyphs(start, this._name, this._occurrences);
    const b = splitGlyphs(end, this._name, this._occurrences);
    this._slides = [];
    this._fades = [];
    const fade = (from: VMobject[], to: VMobject[]) => {
      const copies = to.map((glyph) => glyph.copy());
      this._temporaries.push(...copies);
      tex.add(...copies);
      const fromStarts = from.map(startOf);
      const toStarts = copies.map(startOf);
      this._fades.push({
        from: fromStarts,
        to: toStarts,
        fromBox: boxOf(fromStarts),
        toBox: boxOf(toStarts),
      });
    };

    if (a.outside.length !== b.outside.length) {
      // Outside glyphs do not pair up: fade-transform the whole formula.
      fade(glyphsOf(start), glyphsOf(end));
      return;
    }
    a.outside.forEach((glyph, i) => {
      const end = b.outside[i].getLocalPoints();
      if (glyph.getLocalPoints().length === end.length) {
        this._slides.push({ start: startOf(glyph), end: end.map((p) => [...p]) });
      } else {
        fade([glyph], [b.outside[i]]);
      }
    });
    for (const occurrence of this._occurrences) {
      fade(a.matrix.get(occurrence) ?? [], b.matrix.get(occurrence) ?? []);
    }
  }

  interpolate(alpha: number): void {
    for (const { start, end } of this._slides) {
      start.glyph.setPoints3D(
        start.points.map((p, i) => [
          lerp(p[0], end[i][0], alpha),
          lerp(p[1], end[i][1], alpha),
          lerp(p[2], end[i][2], alpha),
        ]),
      );
    }
    for (const { from, to, fromBox, toBox } of this._fades) {
      const center: [number, number] = [
        lerp(fromBox.center[0], toBox.center[0], alpha),
        lerp(fromBox.center[1], toBox.center[1], alpha),
      ];
      const grow: [number, number] = [
        lerp(1, ratio(toBox.size[0], fromBox.size[0]), alpha),
        lerp(1, ratio(toBox.size[1], fromBox.size[1]), alpha),
      ];
      const shrink: [number, number] = [
        lerp(ratio(fromBox.size[0], toBox.size[0]), 1, alpha),
        lerp(ratio(fromBox.size[1], toBox.size[1]), 1, alpha),
      ];
      for (const g of from) place(g, fromBox.center, center, grow, 1 - alpha);
      for (const g of to) place(g, toBox.center, center, shrink, alpha);
    }
    this.mobject._markDirty();
  }

  override finish(): void {
    super.finish();
    if (!this._startState || !this._endState) return;
    this._restoreStart();
    this.mobject._adoptRenderState(this._endState);
    this._release();
  }

  override reset(): void {
    if (this._startState) {
      this._restoreStart();
      this.mobject._adoptRenderState(this._startState);
      this._release();
    }
    super.reset();
  }

  /** Undo the morph on the starting glyphs and drop the temporary copies. */
  private _restoreStart(): void {
    const restore = (g: GlyphStart) => {
      g.glyph.setPoints3D(g.points);
      g.glyph.setFillOpacity(g.fillOpacity);
      g.glyph.setStrokeOpacity(g.strokeOpacity);
    };
    for (const { start } of this._slides) restore(start);
    for (const pair of this._fades) pair.from.forEach(restore);
    this.mobject.remove(...this._temporaries);
    for (const t of this._temporaries) t.dispose();
    this._temporaries = [];
    this._slides = [];
    this._fades = [];
  }

  private _release(): void {
    if (!this._holding) return;
    this._holding = false;
    this.mobject._holdRefresh(false);
  }
}

/**
 * Animate a TangleTex matrix from its symbol to its entries.
 * Usually created with `tex.expand(name)`.
 */
export class TangleExpand extends TangleMatrixMorph {
  constructor(tex: TangleTex, name: string, options: TangleMorphOptions = {}) {
    super(tex, name, true, options);
  }
}

/**
 * Animate a TangleTex matrix from its entries back to its symbol.
 * Usually created with `tex.collapse(name)`.
 */
export class TangleCollapse extends TangleMatrixMorph {
  constructor(tex: TangleTex, name: string, options: TangleMorphOptions = {}) {
    super(tex, name, false, options);
  }
}
