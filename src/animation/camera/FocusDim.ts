/**
 * FocusDim: wash every mobject except a focus set toward the background
 * colour (and lower its opacity a little), and bring them back later.
 *
 * Works through public mobject APIs only: `setColor`, `fillColor` /
 * `strokeColor`, `setStrokeOpacity` / `setFillOpacity`, and, for an
 * InstancedMobject with per-instance colours, `setInstanceColor`. So it
 * applies to VMobjects, Text, 3D meshes and instanced meshes alike.
 */

import * as THREE from 'three';
import { Group } from '../../core/Group';
import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { InstancedMobject } from '../../mobjects/three-d/InstancedMobject';
import { Mobject3D } from '../../mobjects/three-d/Mobject3D';
import { OrganicMesh3D } from '../../mobjects/three-d/organicMesh';
import { interpolateColor } from '../../utils/color';
import { AnimationOptions } from '../Animation';
import { LazyStateAnimation } from './LazyStateAnimation';

/** Minimal scene surface FocusDim reads. Scene and ThreeDScene both fit. */
export interface FocusDimScene {
  readonly mobjects: ReadonlySet<Mobject>;
  readonly backgroundColor: { getHexString(): string };
  isFixedInFrame?(mobject: Mobject): boolean;
}

export interface FocusDimOptions extends AnimationOptions {
  /** Alias of `duration`. Default: 0.8 */
  runTime?: number;
  /** How far colours move toward the background, 0..1. Default: 0.7 */
  strength?: number;
  /** Opacity multiplier for washed mobjects, 0..1. Default: 0.8 */
  opacity?: number;
  /** Wash target. Default: the scene background colour. */
  backgroundColor?: string;
  /**
   * Mobjects to consider. Default: every mobject in the scene except
   * fixed-in-frame (HUD) ones, read when the animation starts.
   */
  targets?: Mobject[];
  /**
   * How far the toon outline and highlight of a washed 3D mobject fade, 0..1
   * (see `Mobject3D.setToonMute`). It moves with the wash, so a dimmed
   * neighbour becomes a quiet shape with no rim. Default: 0.9
   */
  mute?: number;
  /**
   * Hide what stands between the camera and the focus target. A washed leaf
   * whose screen bounds overlap the target's and whose centre is nearer to the
   * camera than the target's centre fades out completely. The test uses
   * `camera()`, read when the dim starts (for a stop, the camera at the end of
   * its move). Leaves much larger on screen than the target (a whole
   * membrane, a crowd) are not occluders. Default: off
   */
  occlusion?: FocusOcclusion;
  /**
   * Opacity multiplier of one washed leaf, overriding `opacity` for it
   * (undefined keeps `opacity`). For example a crowd of tiny instances can
   * fade further than solid neighbours. Default: none
   */
  leafOpacity?: (leaf: Mobject) => number | undefined;
}

/** What {@link FocusDimOptions.occlusion} tests against. */
export interface FocusOcclusion {
  /** The focus target: a mobject or a world point. */
  target: Mobject | Vector3Tuple;
  /** The camera of the test, with its world matrix up to date. */
  camera: () => THREE.Camera;
  /** A leaf larger on screen than `maxArea` times the target is never an occluder. Default: 3 */
  maxArea?: number;
}

/** The undimmed look of one leaf, recorded when a dim session starts. */
interface LeafOriginal {
  color: string;
  strokeColor: string | undefined;
  fillColor: string | undefined;
  opacity: number;
  fillOpacity: number;
  /** Toon mute of a 3D mesh before the dim (0 for other mobjects). */
  mute: number;
  instanceColors: string[] | null;
}

/** The scalar look a wash wrote last; a different live value is the author's. */
type LeafLook = Omit<LeafOriginal, 'instanceColors'>;

/** Wash amounts of one leaf: c = colour mix, o = opacity loss, m = toon mute, all 0..1. */
interface Wash {
  c: number;
  o: number;
  m: number;
}

// A dim session of a leaf runs from its first non-zero wash to the wash that
// brings it back to zero. ORIGINALS holds the look from the session start;
// WRITTEN the look the last wash wrote. Both end with the session, so a later
// session starts from the leaf's look at that time (a recolour in between
// wins).
const ORIGINALS = new WeakMap<Mobject, LeafOriginal>();
const WRITTEN = new WeakMap<Mobject, LeafLook>();
const WASH = new WeakMap<Mobject, Wash>();

function readInstanceColors(mob: Mobject): string[] | null {
  if (!(mob instanceof InstancedMobject)) return null;
  const mesh = mob.getInstancedMesh();
  if (!mesh.instanceColor) return null;
  const out: string[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < mob.getInstanceCount(); i++) {
    mesh.getColorAt(i, c);
    out.push(`#${c.getHexString()}`);
  }
  return out;
}

function lookOf(leaf: Mobject): LeafLook {
  return {
    color: leaf.color,
    strokeColor: leaf.strokeColor,
    fillColor: leaf.fillColor,
    opacity: leaf.opacity,
    fillOpacity: leaf.fillOpacity,
    mute: leaf instanceof Mobject3D ? leaf.getToonMute() : 0,
  };
}

/**
 * The undimmed look of a leaf for the current session. A session starts with
 * the leaf's live look. Inside a session, a field whose live value differs
 * from what the last wash wrote was changed by the author: it becomes the new
 * undimmed value.
 */
function originalOf(leaf: Mobject): LeafOriginal {
  const o = ORIGINALS.get(leaf);
  if (!o) {
    const fresh = { ...lookOf(leaf), instanceColors: readInstanceColors(leaf) };
    ORIGINALS.set(leaf, fresh);
    return fresh;
  }
  const written = WRITTEN.get(leaf);
  if (written) {
    const live = lookOf(leaf);
    for (const key of Object.keys(live) as (keyof LeafLook)[]) {
      if (live[key] !== written[key]) Object.assign(o, { [key]: live[key] });
    }
  }
  return o;
}

function applyWash(leaf: Mobject, wash: Wash, bg: string): void {
  const o = originalOf(leaf);
  const mix = (c: string | undefined) =>
    c === undefined ? undefined : interpolateColor(c, bg, wash.c);
  if (o.instanceColors) {
    // instanceColor multiplies the material colour: wash one of them only.
    const inst = leaf as InstancedMobject;
    o.instanceColors.forEach((c, i) => inst.setInstanceColor(i, interpolateColor(c, bg, wash.c)));
  } else {
    leaf.setColor(mix(o.color) as string);
    const stroke = mix(o.strokeColor);
    const fill = mix(o.fillColor);
    if (stroke !== undefined) leaf.strokeColor = stroke;
    if (fill !== undefined) leaf.fillColor = fill;
  }
  const k = 1 - wash.o;
  leaf.setStrokeOpacity(o.opacity * k);
  leaf.setFillOpacity(o.fillOpacity * k);
  // The mute moves from the leaf's own mute toward 1, so wash.m = 0 is exact.
  if (leaf instanceof Mobject3D) leaf.setToonMute(o.mute + (1 - o.mute) * wash.m);
  // Caps, rims and inner faces of an organic shape have their own colours.
  if (leaf instanceof OrganicMesh3D) leaf.setSlotWash(bg, wash.c);
  if (wash.c === 0 && wash.o === 0 && wash.m === 0) {
    // Back to the undimmed look: the session ends.
    ORIGINALS.delete(leaf);
    WRITTEN.delete(leaf);
    WASH.delete(leaf);
    return;
  }
  WRITTEN.set(leaf, lookOf(leaf));
  WASH.set(leaf, { ...wash });
}

/** Leaves under `roots` that have something to recolour. */
function collectLeaves(roots: Iterable<Mobject>): Mobject[] {
  const out: Mobject[] = [];
  for (const root of roots) {
    for (const m of root.getFamily()) {
      if (m.children.length > 0) continue;
      // Empty Groups are animation drivers or placeholders, not content.
      if (m instanceof Group) continue;
      out.push(m);
    }
  }
  return out;
}

function isInside(leaf: Mobject, keep: ReadonlySet<Mobject>): boolean {
  for (let m: Mobject | null = leaf; m; m = m.parent) {
    if (keep.has(m)) return true;
  }
  return false;
}

type DimState = Map<Mobject, Wash>;

/**
 * Animate a focus wash. Mobjects in `keep` (and their descendants) return to
 * full colour; every other target moves to the washed look. Pass an empty
 * `keep` with `strength: 0` (or use {@link restoreFocus}) to bring
 * everything back.
 *
 * Seekable like {@link CameraFocus}: the start state is read when the wash
 * starts, and reset() puts it back.
 *
 * @example
 * ```ts
 * await scene.play(new FocusDim(scene, [nucleus]), scene.focusOn ...);
 * await scene.play(restoreFocus(scene));
 * ```
 */
export class FocusDim extends LazyStateAnimation<DimState> {
  readonly scene: FocusDimScene;
  readonly keep: ReadonlySet<Mobject>;
  private readonly _strength: number;
  private readonly _opacityLoss: number;
  private readonly _bg: string | undefined;
  private readonly _targets: Mobject[] | undefined;
  private readonly _mute: number;
  private readonly _occlusion: FocusOcclusion | undefined;
  private readonly _leafOpacity: FocusDimOptions['leafOpacity'];

  constructor(scene: FocusDimScene, keep: Mobject | Mobject[] = [], options: FocusDimOptions = {}) {
    const {
      runTime,
      strength,
      opacity,
      backgroundColor,
      targets,
      mute,
      occlusion,
      leafOpacity,
      ...animOptions
    } = options;
    super({ ...animOptions, duration: options.duration ?? runTime ?? 0.8 });
    this.scene = scene;
    this.keep = new Set(Array.isArray(keep) ? keep : [keep]);
    this._strength = Math.max(0, Math.min(1, strength ?? 0.7));
    this._opacityLoss = 1 - Math.max(0, Math.min(1, opacity ?? 0.8));
    this._bg = backgroundColor;
    this._targets = targets;
    this._mute = Math.max(0, Math.min(1, mute ?? 0.9));
    this._occlusion = occlusion;
    this._leafOpacity = leafOpacity;
  }

  private get _background(): string {
    return this._bg ?? `#${this.scene.backgroundColor.getHexString()}`;
  }

  private _leaves(): Mobject[] {
    const roots =
      this._targets ??
      [...this.scene.mobjects].filter((m) => !(this.scene.isFixedInFrame?.(m) ?? false));
    return collectLeaves(roots);
  }

  protected captureState(): DimState {
    const state: DimState = new Map();
    for (const leaf of this._leaves()) {
      state.set(leaf, WASH.get(leaf) ?? { c: 0, o: 0, m: 0 });
    }
    return state;
  }

  protected targetState(from: DimState): DimState {
    const to: DimState = new Map();
    const dimmed = this._strength > 0;
    const occludes = dimmed && this._occlusion ? occluderTest(this._occlusion) : () => false;
    for (const leaf of from.keys()) {
      if (isInside(leaf, this.keep)) to.set(leaf, { c: 0, o: 0, m: 0 });
      else if (occludes(leaf)) to.set(leaf, { c: this._strength, o: 1, m: 1 });
      else {
        const own = this._leafOpacity?.(leaf);
        const loss = own === undefined ? this._opacityLoss : 1 - Math.max(0, Math.min(1, own));
        to.set(leaf, { c: this._strength, o: dimmed ? loss : 0, m: dimmed ? this._mute : 0 });
      }
    }
    return to;
  }

  protected applyState(from: DimState, to: DimState, alpha: number): void {
    const bg = this._background;
    for (const [leaf, a] of from) {
      const b = to.get(leaf) ?? a;
      const mix = (x: number, y: number) => x + (y - x) * alpha;
      const wash = { c: mix(a.c, b.c), o: mix(a.o, b.o), m: mix(a.m, b.m) };
      const prev = WASH.get(leaf);
      // Skip untouched leaves: never-washed mobjects keep their exact state.
      if (!prev && wash.c === 0 && wash.o === 0 && wash.m === 0) continue;
      if (prev && prev.c === wash.c && prev.o === wash.o && prev.m === wash.m) continue;
      applyWash(leaf, wash, bg);
    }
  }
}

/** Screen rectangle (NDC) and camera distance of a world box or point. */
interface ScreenBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  depth: number;
}

const BOX = new THREE.Box3();
const V = new THREE.Vector3();

function screenBox(box: THREE.Box3, camera: THREE.Camera): ScreenBox {
  const out = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, depth: 0 };
  for (let i = 0; i < 8; i++) {
    V.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z,
    );
    V.project(camera);
    out.x0 = Math.min(out.x0, V.x);
    out.x1 = Math.max(out.x1, V.x);
    out.y0 = Math.min(out.y0, V.y);
    out.y1 = Math.max(out.y1, V.y);
  }
  box.getCenter(V);
  out.depth = V.distanceTo(camera.getWorldPosition(new THREE.Vector3()));
  return out;
}

function boxOf(target: Mobject | Vector3Tuple): THREE.Box3 {
  if (Array.isArray(target)) {
    const p = new THREE.Vector3(target[0], target[1], target[2]);
    return new THREE.Box3(p.clone(), p.clone());
  }
  const { min, max } = target.getBounds();
  return new THREE.Box3(
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(max.x, max.y, max.z),
  );
}

const area = (b: ScreenBox) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);

/**
 * The occluder predicate of a focus dim: a leaf overlaps the target on screen,
 * covers at least a quarter of its own screen box there, and its centre is
 * nearer to the camera than the target's centre.
 */
function occluderTest(o: FocusOcclusion): (leaf: Mobject) => boolean {
  const camera = o.camera();
  const t = screenBox(boxOf(o.target), camera);
  // A point target gets a small screen box (about a tenth of the frame).
  const pad = area(t) > 0 ? 0 : 0.1;
  const tb = { ...t, x0: t.x0 - pad, x1: t.x1 + pad, y0: t.y0 - pad, y1: t.y1 + pad };
  const maxArea = (o.maxArea ?? 3) * area(tb);
  return (leaf) => {
    if (leaf.isEmpty()) return false;
    let box: THREE.Box3;
    try {
      box = boxOf(leaf);
    } catch {
      // A driver mobject with no geometry (for example an animation group's
      // placeholder) has no bounds, so it cannot hide anything.
      return false;
    }
    const l = screenBox(BOX.copy(box), camera);
    const la = area(l);
    if (la === 0 || la > maxArea || l.depth >= t.depth) return false;
    const ix = Math.min(l.x1, tb.x1) - Math.max(l.x0, tb.x0);
    const iy = Math.min(l.y1, tb.y1) - Math.max(l.y0, tb.y0);
    return ix > 0 && iy > 0 && ix * iy >= 0.25 * la;
  };
}

/** Wash everything but `keep` toward the background. */
export function focusDim(
  scene: FocusDimScene,
  keep: Mobject | Mobject[],
  options?: FocusDimOptions,
): FocusDim {
  return new FocusDim(scene, keep, options);
}

/** Undo every wash: all targets return to their original look. */
export function restoreFocus(
  scene: FocusDimScene,
  options: Omit<FocusDimOptions, 'strength'> = {},
): FocusDim {
  return new FocusDim(scene, [], { ...options, strength: 0 });
}
