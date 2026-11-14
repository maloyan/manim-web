/**
 * Organelle3D: the base class of every organelle of the 3D cell kit.
 *
 * An organelle is a {@link Group} of 3D mobjects with named parts
 * ({@link getPart}), named anchor points for callouts ({@link getAnchor}, in
 * world space), a default caption ({@link getCaption}, from
 * {@link ORGANELLE_INFO}) and a staged manim-style build-up
 * ({@link buildAnimation}). It implements the `TourTarget` interface of the
 * direction layer, so an `ExplainerTour` stop can name it as its target.
 *
 * Subclasses build their parts in the organelle frame (centre at the origin)
 * and register them with {@link _addPart} and {@link _setAnchor}, then call
 * {@link _finish}. An anchor is stored relative to one 3D mesh part, so it
 * stays right when the organelle moves, rotates, or is flattened into another
 * group.
 */

import * as THREE from 'three';
import { Group } from '../../../core/Group';
import { Mobject, type Vector3Tuple } from '../../../core/Mobject';
import type { Animation } from '../../../animation/Animation';
import { LaggedStart } from '../../../animation/LaggedStart';
import { Create3D, GrowAlongPath3D } from '../../../animation/creation/Create3D';
import type { CameraFocusOptions } from '../../../animation/camera/CameraFocus';
import type { CaptionContent } from '../../annotation/CaptionCard';
import type { TourTarget } from '../../annotation/ExplainerTour';
import { applyToonShading, type ToonShadingOptions } from '../../../rendering/toon/toonShading';
import { Mobject3D } from '../../three-d/Mobject3D';
import { organelleColor } from '../biologyColors';
import { resolveInfo } from './organelleInfo';
import { makeRng, type Rng } from './geometry';
import type {
  BuildAnimationOptions,
  CellDetail,
  CellLook,
  Organelle3DOptions,
  OrganelleInfo,
} from './cell3dTypes';

/** How one part appears in the build-up. */
export type BuildMode = 'create' | 'fade' | 'grow';

/** One step of the staged build-up: a part and how it appears. */
export interface BuildStep {
  part: Mobject;
  mode: BuildMode;
  /** Relative run time of this step. Default: 1 */
  weight?: number;
}

interface AnchorRecord {
  ref: Mobject;
  /** The point in the reference part's own frame. */
  local: Vector3Tuple;
}

/**
 * Default colors of the 3D kit where the 2D palette color is too dark for a
 * dark background (ribosome) or too close to its host (nucleolus on the
 * nucleus). `ORGANELLE_COLORS` itself is unchanged; overrides still win.
 */
export const CELL3D_COLOR_DEFAULTS: Readonly<Record<string, string>> = {
  ribosome: '#F06BB4',
  nucleolus: '#E0457B',
};

/**
 * Resolve a kit color: caller override, then the kit default, then the
 * organelle palette ({@link organelleColor}).
 */
export function kitColor(name: string, overrides?: Record<string, string>): string {
  const key = name.trim().toLowerCase();
  if (overrides?.[name] !== undefined) return overrides[name];
  if (overrides?.[key] !== undefined) return overrides[key];
  return CELL3D_COLOR_DEFAULTS[key] ?? organelleColor(key, overrides);
}

/** First 3D mesh mobject in a tree, or null. */
function firstMesh(m: Mobject): Mobject3D | null {
  for (const member of m.getFamily()) if (member instanceof Mobject3D) return member;
  return null;
}

export abstract class Organelle3D extends Group implements TourTarget {
  /** Kind key of the organelle (an `ORGANELLE_INFO` key). */
  readonly kind: string;
  protected readonly _detail: CellDetail;
  protected readonly _seed: number;
  protected readonly _colorOverrides: Record<string, string>;
  protected readonly _mainColor: string;
  protected readonly _look: CellLook;
  private readonly _info: OrganelleInfo;
  private readonly _parts = new Map<string, Mobject>();
  private readonly _anchors = new Map<string, AnchorRecord>();
  private readonly _plainOutline = new Set<Mobject>();
  private readonly _center: Vector3Tuple;
  /** The mesh part the organelle frame follows, and its inverse matrix at build time. */
  private _frameRef: { mesh: Mobject3D; inv: THREE.Matrix4 } | null = null;

  constructor(kind: string, options: Organelle3DOptions, paletteName: string = kind) {
    super();
    this.kind = kind;
    this._detail = options.detail ?? 'medium';
    this._seed = options.seed ?? 1;
    this._colorOverrides = { ...(options.colors ?? {}) };
    this._mainColor = options.color ?? kitColor(paletteName, this._colorOverrides);
    this._look = options.style ?? 'manim';
    this._info = resolveInfo(kind, options.info);
    this._center = [...(options.center ?? [0, 0, 0])];
  }

  // ── colors and randomness ─────────────────────────────────────────────

  /** The main color of the organelle. */
  getMainColor(): string {
    return this._mainColor;
  }

  /**
   * Color of a part: an override by part name, else an override or palette
   * entry by palette name, else the fallback.
   */
  protected _partColor(partName: string, fallback: string, paletteName?: string): string {
    const o = this._colorOverrides;
    if (o[partName] !== undefined) return o[partName];
    if (paletteName !== undefined) {
      const key = paletteName.toLowerCase();
      if (o[key] !== undefined) return o[key];
    }
    return fallback;
  }

  /** A fresh random stream for one part, deterministic for the organelle seed. */
  protected _rng(salt: number): Rng {
    return makeRng((this._seed * 7919 + salt * 104729) >>> 0);
  }

  // ── parts ─────────────────────────────────────────────────────────────

  /**
   * Add a named part. With `outline: false` the part keeps the body look but
   * gets no rim stroke (for dense crowds of tiny instances).
   * @post this.getPart(name) === part
   */
  protected _addPart<T extends Mobject>(
    name: string,
    part: T,
    opts: { outline?: boolean } = {},
  ): T {
    this._parts.set(name, part);
    if (opts.outline === false) this._plainOutline.add(part);
    this.add(part);
    return part;
  }

  /** A part by name, or undefined. */
  getPart(name: string): Mobject | undefined {
    return this._parts.get(name);
  }

  /** Names of every part, in build order. */
  get partNames(): string[] {
    return [...this._parts.keys()];
  }

  // ── anchors ───────────────────────────────────────────────────────────

  /**
   * Register a named anchor at `point` (organelle frame, before {@link _finish}
   * places the organelle). The anchor follows `ref` (default: the first part).
   */
  protected _setAnchor(name: string, point: Vector3Tuple, ref?: Mobject): void {
    const source = ref ?? this._parts.values().next().value;
    const mesh = source ? firstMesh(source) : null;
    if (!mesh) throw new Error(`Organelle3D: anchor "${name}" needs a 3D part to follow.`);
    const inv = mesh._worldMatrix().invert();
    const v = new THREE.Vector3(...point).applyMatrix4(inv);
    this._anchors.set(name, { ref: mesh, local: [v.x, v.y, v.z] });
  }

  /**
   * A named point on the organelle in world space, or undefined for an
   * unknown name. See {@link anchorNames}.
   */
  getAnchor(name: string): Vector3Tuple | undefined {
    const record = this._anchors.get(name);
    if (!record) return undefined;
    const v = new THREE.Vector3(...record.local).applyMatrix4(record.ref._worldMatrix());
    return [v.x, v.y, v.z];
  }

  /**
   * A point given in the organelle frame (the frame its parts were built in,
   * centre at the origin) in world space, after every later move.
   */
  localToWorld(point: Vector3Tuple): Vector3Tuple {
    const v = new THREE.Vector3(...point);
    if (this._frameRef)
      v.applyMatrix4(this._frameRef.inv).applyMatrix4(this._frameRef.mesh._worldMatrix());
    return [v.x, v.y, v.z];
  }

  /** Names of every anchor. */
  get anchorNames(): string[] {
    return [...this._anchors.keys()];
  }

  // ── tour target ───────────────────────────────────────────────────────

  /** The caption text (title, body, footnote). */
  getInfo(): OrganelleInfo {
    return { ...this._info };
  }

  /** Default caption for a tour stop: the info text with a color swatch. */
  getCaption(): CaptionContent {
    const { title, body, footnote } = this._info;
    return { title, body, footnote, swatch: this._mainColor };
  }

  /** Default camera framing for a tour stop. */
  getFocusFraming(): CameraFocusOptions {
    return { fill: 0.55 };
  }

  // ── build-up ──────────────────────────────────────────────────────────

  /** The parts in build-up order, with how each one appears. */
  protected abstract _buildSteps(): BuildStep[];

  /** Default total run time of {@link buildAnimation}. */
  protected _defaultBuildDuration(): number {
    return 2.5;
  }

  /**
   * One staged manim-style build-up for `scene.play(...)`: the parts appear in
   * a meaningful order, each one outline first, then body (long shapes grow
   * along their length).
   */
  buildAnimation(options: BuildAnimationOptions = {}): Animation {
    const steps = this._buildSteps();
    const lag = Math.min(1, Math.max(0, options.lagRatio ?? 0.45));
    const total = options.duration ?? this._defaultBuildDuration();
    const weights = steps.map((s) => s.weight ?? 1);
    const unit = total / Math.max(1e-9, staggeredSpan(weights, lag));
    const animations = steps.map((s, i) => {
      const duration = unit * weights[i];
      if (s.mode === 'grow') return new GrowAlongPath3D(s.part, { duration });
      return new Create3D(s.part, {
        duration,
        outlineReveal: s.mode === 'fade' ? 'fade' : 'sweep',
      });
    });
    return new LaggedStart(animations, { lagRatio: lag });
  }

  // ── finishing ─────────────────────────────────────────────────────────

  /**
   * Apply the look and move the organelle to its centre. `rotation` (XYZ
   * Euler) turns the organelle about its centre first.
   */
  protected _finish(rotation?: THREE.Euler, applyStyle = true): void {
    if (applyStyle) applyLook(this, this._look, this._plainOutline);
    const first = this._parts.values().next().value;
    const mesh = first ? firstMesh(first) : null;
    if (mesh) this._frameRef = { mesh, inv: mesh._worldMatrix().invert() };
    if (rotation) this.rotation.copy(rotation);
    this.position.set(this._center[0], this._center[1], this._center[2]);
    this._markDirty();
  }

  // ── copy ──────────────────────────────────────────────────────────────

  /**
   * A deep copy of the same concrete class. The children are deep copies (so
   * later edits, removed parts and appearance changes carry over), and every
   * field of the organelle that refers to a child (parts, anchors, the
   * organelle frame, `Cell3D` organelles) refers to the matching copied child.
   * The organelle constructor does not run again.
   *
   * Copy contract for the own fields of a subclass:
   * - a mobject of this tree becomes its copy; a mobject outside it is shared;
   * - arrays, `Map`, `Set` and plain objects are copied, value by value;
   * - typed arrays are copied;
   * - any other object with a `clone()` method (three.js `Vector2/3/4`,
   *   `Color`, `Matrix3/4`, `Quaternion`, `Euler`, ...) is cloned, except a
   *   three.js `Object3D`, which belongs to the render tree and is shared;
   * - every other object (an instance of your own class) is shared. Override
   *   {@link _copyState} to copy it.
   *
   * @post result.constructor === this.constructor
   * @post result.partNames === this.partNames && result.anchorNames === this.anchorNames
   * @post result.getAnchor(n) === this.getAnchor(n)  // for every n in anchorNames
   * @post result.getFamily().includes(result.getPart(n)) === this.getFamily().includes(this.getPart(n))
   */
  override copy(): this {
    // Group's constructor only: a bare group whose prototype is this class.
    const clone = Reflect.construct(Group, [], this.constructor) as this;
    this._copyBaseAttributesInto(clone);
    const twins = new Map<Mobject, Mobject>();
    pairFamilies(this, clone, twins);
    const own = this as unknown as Record<string, unknown>;
    const target = clone as unknown as Record<string, unknown>;
    const base = new Set(Object.keys(clone));
    for (const key of Object.keys(own)) {
      if (!base.has(key)) target[key] = remap(own[key], twins);
    }
    clone._copyState(this);
    return clone;
  }

  /**
   * Hook for {@link copy}: runs on the new copy after every field is copied by
   * the copy contract, with the source organelle. Override it to copy state
   * the contract shares (instances of your own classes). Default: nothing.
   */
  protected _copyState(_source: this): void {}
}

/** Map each node of `src` to the node at the same place in its copy `dst`. */
function pairFamilies(src: Mobject, dst: Mobject, twins: Map<Mobject, Mobject>): void {
  twins.set(src, dst);
  const n = Math.min(src.children.length, dst.children.length);
  for (let i = 0; i < n; i++) pairFamilies(src.children[i], dst.children[i], twins);
}

/** A value object with a `clone()` method (three.js math values and the like). */
function isCloneable(v: object): v is { clone(): unknown } {
  return typeof (v as { clone?: unknown }).clone === 'function';
}

/**
 * A deep copy of an organelle field by the copy contract of
 * {@link Organelle3D.copy}: mobjects of the source tree become their twins,
 * containers, typed arrays and cloneable values are copied, a three.js
 * `Object3D` and other objects are shared.
 */
function remap(value: unknown, twins: ReadonlyMap<Mobject, Mobject>): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Mobject) return twins.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => remap(v, twins));
  if (value instanceof Map)
    return new Map([...value].map(([k, v]) => [remap(k, twins), remap(v, twins)]));
  if (value instanceof Set) return new Set([...value].map((v) => remap(v, twins)));
  if (ArrayBuffer.isView(value) && 'slice' in value)
    return (value as unknown as Float32Array).slice();
  if (value instanceof THREE.Object3D) return value;
  const proto = Object.getPrototypeOf(value) as unknown;
  if (proto !== Object.prototype && proto !== null)
    return isCloneable(value) ? value.clone() : value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) out[k] = remap(v, twins);
  return out;
}

/**
 * Run time of a LaggedStart of children with durations `weights` and lag
 * ratio `lag`: child i starts at lag * (sum of the earlier durations) and the
 * group ends when the last child to finish ends.
 * @post weights.length === 0 => result === 0
 */
function staggeredSpan(weights: readonly number[], lag: number): number {
  let start = 0;
  let end = 0;
  for (const w of weights) {
    end = Math.max(end, start + w);
    start += lag * w;
  }
  return end;
}

/** Apply a look to a tree; members of `plain` get the same look with no outline. */
export function applyLook(
  root: Mobject,
  look: CellLook,
  plain: ReadonlySet<Mobject> = new Set(),
): void {
  if (look === false) return;
  const options: ToonShadingOptions = typeof look === 'string' ? { preset: look } : look;
  applyToonShading(root, options);
  for (const part of plain) applyToonShading(part, { ...options, outline: false });
}
