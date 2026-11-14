import * as THREE from 'three';
import { Mobject } from '../../core/Mobject';
import {
  applyToonToObject,
  resolveToonOptions,
  type ResolvedToonShading,
  type ToonPreset,
  type ToonShadingOptions,
} from '../../rendering/toon/toonShading';
import { detachOutlines } from '../../rendering/toon/toonOutline';

/**
 * Base class for 3D mesh mobjects (Cube, Sphere, Cylinder, Arrow3D, Polyhedron, …).
 *
 * Unlike VMobjects, a 3D mesh stores its geometry in a Three.js buffer rather
 * than in bakeable points, so it cannot fold a transform into geometry. Instead
 * of resetting its local transform to identity (which would silently discard
 * rotation/scale), `normalizeTransform()` *absolutizes*: it sets the local
 * transform equal to the incoming world matrix, so the mesh renders in the right
 * place once its ancestors collapse to identity. It is a flattening barrier — its
 * descendants stay relative to it. See {@link Mobject._flattenAsMesh}.
 *
 * Every 3D mesh mobject also carries the toon look ({@link setToonShading}).
 *
 * Any 3D mesh primitive should extend this class rather than `Mobject`.
 */
export abstract class Mobject3D extends Mobject {
  /** Resolved toon settings, or null when the look is off. Shared, never mutated. */
  private _toon: ResolvedToonShading | null = null;
  /** True while some toon state (patched materials, outlines) may be on the meshes. */
  private _toonOnMeshes = false;
  /** Body opacity when the look was set; the outline is at full strength there. */
  private _toonRestOpacity = 1;
  /**
   * Outline opacity set by a creation animation, or null for the automatic
   * value. A creation animation draws the outline before the body fills in.
   * @internal
   */
  _toonOutlineOpacityOverride: number | null = null;
  /** How far the outline and the highlight are muted, 0 (full) to 1 (off). */
  private _toonMute = 0;

  override normalizeTransform(worldMatrix: THREE.Matrix4 = this._ownMatrix()): this {
    return this._flattenAsMesh(worldMatrix);
  }

  /**
   * Turn on the toon look for this mobject and every 3D mesh mobject below it,
   * or turn it off with `false`.
   *
   * With no argument the look is the `'manim'` preset: a smooth body a bit
   * darker than the mobject colour, a soft highlight, and a bright rim stroke
   * of constant screen width, for a dark background. `'cartoon'` gives hard
   * tone bands and a dark ink outline for a white page. An options object
   * overrides single parts of its `preset`.
   *
   * The outline follows `setColor()` and opacity changes. Its opacity is
   * `outline.opacity × min(1, opacity / restOpacity)`, where `restOpacity` is
   * the body opacity at this call. So a 0.4-opacity sphere keeps a solid rim,
   * and FadeIn / FadeOut fade the rim with the body.
   *
   * @example
   * ```ts
   * new Sphere({ color: BLUE, opacity: 0.5 }).setToonShading();
   * new Torus({ color: '#e8603c' }).setToonShading('cartoon');
   * new Cube({ color: TEAL }).setToonShading({ outline: { mode: 'same', width: 3 } });
   * ```
   *
   * @post options === false => this.getToonShading() === null
   * @post options !== false => this.getToonShading() !== null
   */
  setToonShading(options: ToonShadingOptions | ToonPreset | false = {}): this {
    const resolved = options === false ? null : resolveToonOptions(options);
    for (const member of this.getFamily()) {
      if (member instanceof Mobject3D) member._setOwnToon(resolved);
    }
    return this;
  }

  /**
   * Turn the toon look off for this mobject and its 3D descendants.
   * @post this.getToonShading() === null
   */
  clearToonShading(): this {
    return this.setToonShading(false);
  }

  /** The resolved toon settings, or null when the look is off. */
  getToonShading(): ResolvedToonShading | null {
    return this._toon;
  }

  /**
   * Mute the outline and the highlight of the toon look, for this mobject
   * only: 0 shows them in full, 1 turns them off. A focus dim uses it to make
   * a neighbour a quiet shape. The body colour does not change.
   * @post this.getToonMute() === Math.min(1, Math.max(0, amount))
   */
  setToonMute(amount: number): this {
    const m = Math.min(1, Math.max(0, amount));
    if (m !== this._toonMute) {
      this._toonMute = m;
      this._markDirty();
    }
    return this;
  }

  /** The current toon mute, 0 (none) to 1 (outline and highlight off). */
  getToonMute(): number {
    return this._toonMute;
  }

  private _setOwnToon(resolved: ResolvedToonShading | null): void {
    this._toon = resolved;
    this._toonRestOpacity = this._opacity > 0 ? this._opacity : 1;
    // The next sync applies the new settings to the meshes.
    this._markDirty();
  }

  /**
   * The outline opacity for the current frame.
   * @post 0 <= result && result <= 1
   */
  _toonOutlineOpacity(): number {
    if (this._toonOutlineOpacityOverride !== null) {
      return Math.max(0, Math.min(1, this._toonOutlineOpacityOverride));
    }
    const base = (this._toon?.outline?.opacity ?? 1) * (1 - this._toonMute);
    return Math.max(0, Math.min(1, base * Math.min(1, this._opacity / this._toonRestOpacity)));
  }

  /**
   * Make the materials this mobject's own before per-object state (toon
   * patch, reveal clip) goes on them. A mobject whose copy can share
   * materials (ModelMobject) overrides it. Default: nothing to do.
   * @internal
   */
  _ownSharedMaterials(): void {}

  override _syncToThree(): void {
    const wasDirty = this._dirty;
    // Before the base sync, while still dirty: the override may mark dirty.
    if (wasDirty && this._toon) this._ownSharedMaterials();
    super._syncToThree();
    if (!wasDirty || !this._threeObject) return;
    if (!this._toon && !this._toonOnMeshes) return;
    const skip = new Set<THREE.Object3D>();
    for (const child of this.children) skip.add(child.getThreeObject());
    applyToonToObject(this._threeObject, this._mutedToon(), () => this._toonOutlineOpacity(), skip);
    this._toonOnMeshes = this._toon !== null;
  }

  /** The toon settings with the highlight scaled by the mute (a copy; `_toon` is shared). */
  private _mutedToon(): ResolvedToonShading | null {
    const toon = this._toon;
    if (!toon || this._toonMute === 0 || !toon.highlight) return toon;
    const k = 1 - this._toonMute;
    return { ...toon, highlight: { ...toon.highlight, intensity: toon.highlight.intensity * k } };
  }

  protected override _copyBaseAttributesInto(
    clone: Mobject,
    options?: { copyChildren?: boolean; copyPosition?: boolean },
  ): void {
    super._copyBaseAttributesInto(clone, options);
    if (!(clone instanceof Mobject3D)) return;
    clone.setToonMute(this._toonMute);
    if (this._toon) {
      clone._toon = this._toon;
      clone._toonRestOpacity = this._toonRestOpacity;
      clone._markDirty();
    }
  }

  override dispose(): void {
    if (this._threeObject && this._toonOnMeshes) {
      // Free the outlines (and their depth materials) first: they are not
      // mobject state, so the base dispose does not know them. The material
      // patches stay: a material can be shared with a copy (ModelMobject).
      detachOutlines(this._threeObject);
      this._toonOnMeshes = false;
    }
    super.dispose();
  }
}
