/**
 * Creation animations for 3D mesh mobjects, in the manim style.
 *
 * - {@link Create3D}: the 3D analog of a 2D `Create` / `DrawBorderThenFill`.
 *   The outline draws first (a sweep along the longest axis, or a fade), then
 *   the body fills in.
 * - {@link SweepReveal3D}: a plane sweeps along an axis and reveals the mesh
 *   (body and outline) behind it. Good for any shape, and for straight long
 *   shapes such as a capsule or a cylinder.
 * - {@link GrowAlongPath3D}: a tube grows along its own path. A shape with a
 *   `reveal` vertex attribute (the organicMesh.ts shapes) grows in that order
 *   through a shader clip; other meshes grow by geometry draw range.
 *
 * With the default axis `'auto'`, a geometry with a `reveal` attribute follows
 * its own build order (spine, graph distance, cut direction) instead of a
 * plane; `reverse` runs that order backwards. Multi-slot materials keep their
 * slots: each slot gets the clip. The depth-only helpers (the prepass of a
 * translucent shape, the depth draw of an outline) get the same clip, so a
 * part that is not revealed yet hides nothing behind it.
 *
 * Each animation is a pure function of alpha: `interpolate(alpha)` writes the
 * full state, so the Player and the video export can seek. `reset()` restores
 * the mobject.
 */

import * as THREE from 'three';
import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Mobject3D } from '../../mobjects/three-d/Mobject3D';
import {
  REVEAL_ALL,
  REVEAL_ATTR_ALL,
  getRevealUniforms,
  type RevealUniforms,
} from '../../rendering/toon/toonMaterial';
import { getOutlineMesh, getOutlineRevealUniforms } from '../../rendering/toon/toonOutline';
import { forEachOwnMesh } from '../../rendering/toon/toonShading';
import { Animation, type AnimationOptions } from '../Animation';

/** Sweep direction: a world axis vector, or 'auto' for the longest side of the bounding box. */
export type SweepAxis = Vector3Tuple | 'auto';

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** The 3D mesh mobjects of a tree (the root too, when it is one). */
function meshMobjectsOf(root: Mobject): Mobject3D[] {
  return root.getFamily().filter((m): m is Mobject3D => m instanceof Mobject3D);
}

/** Visit the meshes that belong to one mobject (not to its child mobjects). */
function forEachMeshOf(mobject: Mobject, fn: (mesh: THREE.Mesh) => void): void {
  const skip = new Set<THREE.Object3D>();
  for (const child of mobject.children) skip.add(child.getThreeObject());
  forEachOwnMesh(mobject.getThreeObject(), skip, fn);
}

function materialsOf(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

/**
 * One reveal state for a whole tree: progress `t` in 0..1 and the world plane
 * for that progress (null when no plane sweep is needed).
 */
interface RevealStep {
  t: number;
  plane: THREE.Vector4 | null;
  /** Use the `reveal` attribute of a geometry that has one. */
  preferAttribute: boolean;
  /** Attribute order backwards: show the highest `reveal` values first. */
  reverse?: boolean;
}

/** Whether a geometry carries the per-vertex `reveal` order (organicMesh.ts shapes). */
function hasRevealAttribute(geometry: THREE.BufferGeometry): boolean {
  return geometry.getAttribute('reveal') !== undefined;
}

/** Write one reveal step into a pair of reveal uniforms. */
function writeReveal(target: RevealUniforms, step: RevealStep, useAttribute: boolean): void {
  const attr = target.attr.value;
  if (step.t >= 1) {
    target.plane.value.copy(REVEAL_ALL);
    attr.copy(REVEAL_ATTR_ALL);
  } else if (useAttribute) {
    target.plane.value.copy(REVEAL_ALL);
    // At t = 0 hide everything, including the vertices at the range ends.
    if (step.reverse) attr.set(step.t <= 0 ? 2 : 1 - step.t, REVEAL_ATTR_ALL.y);
    else attr.set(REVEAL_ATTR_ALL.x, step.t <= 0 ? -1 : step.t);
  } else {
    target.plane.value.copy(step.plane ?? REVEAL_ALL);
    attr.copy(REVEAL_ATTR_ALL);
  }
}

/** The depth-only prepass children of a body mesh (organicMesh.ts, Surface3D). */
function prepassMeshesOf(mesh: THREE.Mesh): THREE.Mesh[] {
  return mesh.children.filter(
    (c): c is THREE.Mesh =>
      c instanceof THREE.Mesh &&
      !c.userData.toonOutline &&
      materialsOf(c).some((m) => m.userData.depthPrepass === true),
  );
}

/** Apply one reveal step to the bodies (and outlines, when asked) of a mobject. */
function setReveal(
  mobject: Mobject,
  step: RevealStep,
  parts: { body: boolean; outline: boolean },
): void {
  // A reveal is per-object state: it must not land on a shared material.
  if (mobject instanceof Mobject3D) mobject._ownSharedMaterials();
  forEachMeshOf(mobject, (mesh) => {
    const useAttribute = step.preferAttribute && hasRevealAttribute(mesh.geometry);
    if (parts.body) {
      const helpers = prepassMeshesOf(mesh).flatMap(materialsOf);
      for (const material of [...materialsOf(mesh), ...helpers]) {
        const uniforms = getRevealUniforms(material);
        if (uniforms) writeReveal(uniforms, step, useAttribute);
      }
    }
    const outline = getOutlineMesh(mesh);
    if (parts.outline && outline)
      writeReveal(getOutlineRevealUniforms(outline), step, useAttribute);
  });
}

/** Stroke and fill opacity of every family member, in family order (root first). */
type FamilyOpacity = Map<Mobject, [number, number]>;

function captureFamilyOpacity(root: Mobject): FamilyOpacity {
  const out: FamilyOpacity = new Map();
  for (const m of root.getFamily()) out.set(m, [m.opacity, m.fillOpacity]);
  return out;
}

/**
 * Put every family member's opacity back. Runs after the base reset, whose
 * group opacity write cascades onto all children. Root first, so a group
 * write is followed by its children's own values.
 */
function restoreFamilyOpacity(saved: FamilyOpacity): void {
  for (const [m, [stroke, fill]] of saved) {
    m.setStrokeOpacity(stroke);
    m.setFillOpacity(fill);
  }
}

/** The reveal step that shows everything. */
const SHOW_ALL: RevealStep = { t: 1, plane: null, preferAttribute: false };

/** Whether any mesh of the tree lacks a `reveal` attribute (and so needs a plane). */
function needsPlane(members: Mobject3D[]): boolean {
  let needed = false;
  for (const m of members)
    forEachMeshOf(m, (mesh) => (needed ||= !hasRevealAttribute(mesh.geometry)));
  return needed;
}

/**
 * The sweep extent of a tree along an axis, from its world bounding box.
 *
 * @post result.axis.length() === 1
 * @post result.min <= result.max
 */
function sweepExtent(
  root: Mobject,
  axisOption: SweepAxis,
): { axis: THREE.Vector3; min: number; max: number } {
  const object = root.getThreeObject();
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return { axis: new THREE.Vector3(1, 0, 0), min: 0, max: 0 };
  let axis: THREE.Vector3;
  if (axisOption === 'auto') {
    const size = box.getSize(new THREE.Vector3());
    if (size.x >= size.y && size.x >= size.z) axis = new THREE.Vector3(1, 0, 0);
    else if (size.y >= size.z) axis = new THREE.Vector3(0, 1, 0);
    else axis = new THREE.Vector3(0, 0, 1);
  } else {
    axis = new THREE.Vector3(...axisOption).normalize();
  }
  let min = Infinity;
  let max = -Infinity;
  const corner = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    corner.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z,
    );
    const d = corner.dot(axis);
    min = Math.min(min, d);
    max = Math.max(max, d);
  }
  return { axis, min, max };
}

/**
 * The reveal plane at progress `t`: everything with `dot(p, axis) <= threshold`
 * shows. `reverse` sweeps from the far end.
 *
 * @post t >= 1 => result.equals(REVEAL_ALL)
 */
function revealPlane(
  extent: { axis: THREE.Vector3; min: number; max: number },
  t: number,
  reverse: boolean,
): THREE.Vector4 {
  if (t >= 1) return REVEAL_ALL.clone();
  const pad = 1e-3 * Math.max(1, extent.max - extent.min);
  const span = extent.max - extent.min + 2 * pad;
  if (reverse) {
    // Keep dot(p, axis) >= max - t·span, written as dot(p, -axis) <= t·span - max.
    const a = extent.axis.clone().negate();
    return new THREE.Vector4(a.x, a.y, a.z, t * span - extent.max - pad);
  }
  const a = extent.axis;
  return new THREE.Vector4(a.x, a.y, a.z, extent.min - pad + t * span);
}

/** Options for {@link Create3D}. */
export interface Create3DOptions extends AnimationOptions {
  /** Part of the run time for the outline phase, from 0 to 1. Default: 0.5. */
  outlineFraction?: number;
  /** How the outline appears: 'sweep' along an axis (default) or 'fade'. */
  outlineReveal?: 'sweep' | 'fade';
  /** Sweep axis for the outline. Default: 'auto' (longest side). */
  axis?: SweepAxis;
}

/**
 * Manim-style build-up of 3D mesh mobjects: the outline draws first, then the
 * body fills in to its own opacity. Without a toon outline, the body only
 * fades in. Works on one mesh mobject or on a group of them.
 *
 * @example
 * ```ts
 * const sphere = new Sphere({ color: BLUE, opacity: 0.5 }).setToonShading();
 * await scene.play(new Create3D(sphere, { duration: 2 }));
 * ```
 */
export class Create3D extends Animation {
  private readonly _outlineFraction: number;
  private readonly _outlineReveal: 'sweep' | 'fade';
  private readonly _axis: SweepAxis;
  private _members: Mobject3D[] = [];
  private _targetOpacity = new Map<Mobject3D, number>();
  /** Opacities before the first begin(), which reset() puts back. */
  private _startOpacity: FamilyOpacity = new Map();

  constructor(mobject: Mobject, options: Create3DOptions = {}) {
    super(mobject, options);
    this._outlineFraction = clamp01(options.outlineFraction ?? 0.5);
    this._outlineReveal = options.outlineReveal ?? 'sweep';
    this._axis = options.axis ?? 'auto';
  }

  override begin(): void {
    const firstRun = this._members.length === 0;
    if (firstRun) this._startOpacity = captureFamilyOpacity(this.mobject);
    super.begin();
    if (firstRun) {
      this._members = meshMobjectsOf(this.mobject);
      for (const m of this._members) this._targetOpacity.set(m, m.opacity > 0 ? m.opacity : 1);
    }
    this.interpolate(this.rateFunc(0));
  }

  /**
   * @post alpha >= 1 => every member m: m.opacity === targetOpacity(m)
   */
  interpolate(alpha: number): void {
    const hasOutline = this._members.some((m) => m.getToonShading()?.outline);
    const f = hasOutline ? this._outlineFraction : 0;
    const outlineT = f > 0 ? clamp01(alpha / f) : 1;
    const bodyT = f < 1 ? clamp01((alpha - f) / (1 - f)) : alpha >= 1 ? 1 : 0;

    let step = SHOW_ALL;
    if (this._outlineReveal === 'sweep' && outlineT < 1) {
      const preferAttribute = this._axis === 'auto';
      const plane =
        !preferAttribute || needsPlane(this._members)
          ? revealPlane(sweepExtent(this.mobject, this._axis), outlineT, false)
          : null;
      step = { t: outlineT, plane, preferAttribute };
    }
    for (const m of this._members) {
      m._toonOutlineOpacityOverride =
        alpha >= 1 ? null : this._outlineReveal === 'fade' ? outlineT : 1;
      m.opacity = (this._targetOpacity.get(m) ?? 1) * bodyT;
      setReveal(m, step, { body: false, outline: true });
    }
  }

  override finish(): void {
    this.interpolate(this.rateFunc(1));
    super.finish();
  }

  override reset(): void {
    for (const m of this._members) {
      m._toonOutlineOpacityOverride = null;
      setReveal(m, SHOW_ALL, { body: false, outline: true });
    }
    super.reset();
    restoreFamilyOpacity(this._startOpacity);
  }
}

/** Options for {@link SweepReveal3D}. */
export interface SweepReveal3DOptions extends AnimationOptions {
  /** Sweep axis in world space. Default: 'auto' (longest side of the bounding box). */
  axis?: SweepAxis;
  /** Sweep from the far end of the axis. Default: false. */
  reverse?: boolean;
}

/**
 * Reveal a mesh mobject (body and outline) behind a plane that sweeps along an
 * axis. For a group, one plane sweeps over the whole group.
 *
 * @example
 * ```ts
 * await scene.play(new SweepReveal3D(capsule, { axis: [0, 1, 0] }));
 * ```
 */
export class SweepReveal3D extends Animation {
  private readonly _axis: SweepAxis;
  private readonly _reverse: boolean;
  private _members: Mobject3D[] = [];
  /** Opacities before the first begin(), which reset() puts back. */
  private _startOpacity: FamilyOpacity | null = null;

  constructor(mobject: Mobject, options: SweepReveal3DOptions = {}) {
    super(mobject, options);
    this._axis = options.axis ?? 'auto';
    this._reverse = options.reverse ?? false;
  }

  override begin(): void {
    this._startOpacity ??= captureFamilyOpacity(this.mobject);
    super.begin();
    this._members = meshMobjectsOf(this.mobject);
    this.interpolate(this.rateFunc(0));
  }

  interpolate(alpha: number): void {
    const t = clamp01(alpha);
    const preferAttribute = this._axis === 'auto';
    const plane =
      t < 1 && (!preferAttribute || needsPlane(this._members))
        ? revealPlane(sweepExtent(this.mobject, this._axis), t, this._reverse)
        : null;
    const step: RevealStep = { t, plane, preferAttribute, reverse: this._reverse };
    for (const m of this._members) setReveal(m, step, { body: true, outline: true });
  }

  override finish(): void {
    this.interpolate(this.rateFunc(1));
    super.finish();
  }

  override reset(): void {
    for (const m of this._members) setReveal(m, SHOW_ALL, { body: true, outline: true });
    super.reset();
    if (this._startOpacity) restoreFamilyOpacity(this._startOpacity);
  }
}

/** Number of indices (or vertices) in one ring of a tube, or 3 for a generic mesh. */
function drawStep(geometry: THREE.BufferGeometry): number {
  const params = (geometry as { parameters?: { radialSegments?: number } }).parameters;
  const radial = params?.radialSegments;
  return geometry.type === 'TubeGeometry' && radial ? radial * 6 : 3;
}

function fullDrawCount(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex();
  if (index) return index.count;
  return geometry.getAttribute('position')?.count ?? 0;
}

/**
 * Grow a tube along its own path. An instanced crowd without a `reveal`
 * attribute shows its instances one after the other. A geometry with a `reveal` attribute shows
 * the vertices with `reveal <= alpha` (shader clip on body and outline).
 * Another geometry draws its first `alpha` part, in geometry order: for a
 * `TubeGeometry` that is ring after ring along the path, so a curved tube
 * grows along its curve; the outline shares the geometry and grows with it.
 *
 * For a mesh whose triangles are not ordered along its length (a lathe, a
 * capsule), use {@link SweepReveal3D}.
 */
export class GrowAlongPath3D extends Animation {
  private _members: Mobject3D[] = [];
  private _rangeGeometries: THREE.BufferGeometry[] = [];
  private _instanced: { mesh: THREE.InstancedMesh; count: number }[] = [];
  /** Opacities before the first begin(), which reset() puts back. */
  private _startOpacity: FamilyOpacity | null = null;

  override begin(): void {
    this._startOpacity ??= captureFamilyOpacity(this.mobject);
    super.begin();
    this._members = meshMobjectsOf(this.mobject);
    const set = new Set<THREE.BufferGeometry>();
    const instanced: { mesh: THREE.InstancedMesh; count: number }[] = [];
    for (const m of this._members) {
      forEachMeshOf(m, (mesh) => {
        if (hasRevealAttribute(mesh.geometry)) return;
        if (mesh instanceof THREE.InstancedMesh) instanced.push({ mesh, count: mesh.count });
        else set.add(mesh.geometry);
      });
    }
    this._rangeGeometries = [...set];
    // Keep the full counts from the first run: a re-begin after a seek must
    // not read a count that an earlier interpolate() lowered.
    if (this._instanced.length === 0) this._instanced = instanced;
    this.interpolate(this.rateFunc(0));
  }

  interpolate(alpha: number): void {
    const t = clamp01(alpha);
    // Shapes with a `reveal` attribute: shader clip on it (body and outline).
    const step: RevealStep = { t, plane: null, preferAttribute: true };
    for (const m of this._members) setReveal(m, step, { body: true, outline: true });
    // Instanced crowds: the instances appear one after the other.
    for (const { mesh, count } of this._instanced) mesh.count = Math.round(t * count);
    // Other meshes: draw range, in geometry order.
    for (const geometry of this._rangeGeometries) {
      if (t >= 1) {
        geometry.setDrawRange(0, Infinity);
        continue;
      }
      const stride = drawStep(geometry);
      const steps = Math.floor(fullDrawCount(geometry) / stride);
      geometry.setDrawRange(0, Math.round(t * steps) * stride);
    }
  }

  override finish(): void {
    this.interpolate(this.rateFunc(1));
    super.finish();
  }

  override reset(): void {
    for (const m of this._members) setReveal(m, SHOW_ALL, { body: true, outline: true });
    for (const geometry of this._rangeGeometries) geometry.setDrawRange(0, Infinity);
    for (const { mesh, count } of this._instanced) mesh.count = count;
    super.reset();
    if (this._startOpacity) restoreFamilyOpacity(this._startOpacity);
  }
}
