import * as THREE from 'three';
import { interpolateColor } from '../../utils/color';
import { Vector3Tuple } from '../../core/Mobject';
import {
  crossVec,
  dotVec,
  lengthVec,
  normalizeVec,
  orthonormalFrame,
  subVec,
} from '../../utils/vectors';
import { meshMaterial } from '../../core/threeMaterial';
import { Mobject3D } from './Mobject3D';

/**
 * Shared machinery for the organic 3D mobjects (Capsule3D, Blob3D, Shell3D,
 * Extrude3D, TubeNetwork3D).
 *
 * Every shape here builds ONE indexed BufferGeometry that is closed
 * (watertight once coincident positions are welded) and has consistent outward
 * winding. Hard edges (a cut rim, a slab cap) use duplicated vertices with
 * different normals, so the shading is sharp there and smooth elsewhere.
 *
 * Each geometry also carries a `smoothNormal` attribute: the area-weighted
 * normal of all faces that touch a welded position. A hard edge splits the
 * `normal` attribute, so an inverted-hull outline that pushes vertices along
 * `normal` opens a gap at the edge. Push along `smoothNormal` to keep the hull
 * closed.
 *
 * Each geometry also carries a `reveal` attribute in [0, 1]: the position of a
 * vertex along the shape's principal axis or parameter (spine of a tube,
 * distance from the root node of a network, height of a bowl). The index
 * buffer of every material group is sorted by the mean `reveal` of each
 * triangle, so `geometry.setDrawRange(0, k)` grows the shape from start to end,
 * and a shader can also clip on `reveal < t`.
 */

/** Name of the per-vertex build-up parameter attribute (0 = first, 1 = last). */
export const REVEAL_ATTRIBUTE = 'reveal';

/** Name of the welded (crease-free) normal attribute on every organic geometry. */
export const SMOOTH_NORMAL_ATTRIBUTE = 'smoothNormal';

/**
 * Incremental indexed-mesh writer with material groups.
 *
 * Vertices go in with {@link vertex}, triangles with {@link tri}. Each
 * triangle belongs to the current group ({@link setGroup}); groups map to
 * material slots.
 */
export class MeshBuilder {
  readonly positions: number[] = [];
  readonly normals: number[] = [];
  /** Per-vertex reveal parameter; NaN means "derive from the principal axis". */
  readonly reveal: number[] = [];
  private readonly _indicesByGroup: number[][] = [[]];
  private _group = 0;

  /** Number of vertices written so far. */
  get vertexCount(): number {
    return this.positions.length / 3;
  }

  /** Select the material group for the next triangles. */
  setGroup(group: number): this {
    while (this._indicesByGroup.length <= group) this._indicesByGroup.push([]);
    this._group = group;
    return this;
  }

  /** Add one vertex (with an optional reveal parameter) and return its index. */
  vertex(p: ArrayLike<number>, n: ArrayLike<number>, reveal = Number.NaN): number {
    this.positions.push(p[0], p[1], p[2]);
    this.normals.push(n[0], n[1], n[2]);
    this.reveal.push(reveal);
    return this.vertexCount - 1;
  }

  /** Add one triangle (counter-clockwise seen from the outside). */
  tri(a: number, b: number, c: number): this {
    this._indicesByGroup[this._group].push(a, b, c);
    return this;
  }

  /**
   * Add triangle a-b-c, flipped when needed so its face normal points along
   * `facing`. Use it for flat faces whose outward direction is known.
   */
  triFacing(a: number, b: number, c: number, facing: ArrayLike<number>): this {
    const p = this.positions;
    const e1: Vector3Tuple = [
      p[3 * b] - p[3 * a],
      p[3 * b + 1] - p[3 * a + 1],
      p[3 * b + 2] - p[3 * a + 2],
    ];
    const e2: Vector3Tuple = [
      p[3 * c] - p[3 * a],
      p[3 * c + 1] - p[3 * a + 1],
      p[3 * c + 2] - p[3 * a + 2],
    ];
    const n = crossVec(e1, e2);
    return dotVec(n, facing) >= 0 ? this.tri(a, b, c) : this.tri(a, c, b);
  }

  /** Add the quad a-b-c-d (counter-clockwise from outside) as two triangles. */
  quad(a: number, b: number, c: number, d: number): this {
    return this.tri(a, b, c).tri(a, c, d);
  }

  /**
   * Stitch two rings of equal length into a band of quads.
   * Ring `a` then ring `b`; with `closed` the last column joins the first.
   * The band faces outward when `b` follows `a` counter-clockwise around the
   * outward normal, i.e. the quad a[i], a[i+1], b[i+1], b[i] is CCW.
   */
  band(a: number[], b: number[], closed: boolean, flip = false): this {
    const n = a.length;
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const j = (i + 1) % n;
      if (flip) this.quad(a[i], b[i], b[j], a[j]);
      else this.quad(a[i], a[j], b[j], b[i]);
    }
    return this;
  }

  /** Triangle fan from one apex to a closed ring. */
  fan(apex: number, ring: number[], flip = false): this {
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      if (flip) this.tri(apex, ring[j], ring[i]);
      else this.tri(apex, ring[i], ring[j]);
    }
    return this;
  }

  /**
   * Build the indexed BufferGeometry, with one draw group per material slot.
   * Vertices without a reveal value get their projection on `axis`.
   */
  build(axis: Vector3Tuple = [0, 1, 0]): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const index: number[] = [];
    this._indicesByGroup.forEach((indices, g) => {
      if (indices.length === 0) return;
      geometry.addGroup(index.length, indices.length, g);
      for (const i of indices) index.push(i);
    });
    const big = this.vertexCount > 65535;
    geometry.setIndex(big ? new THREE.Uint32BufferAttribute(index, 1) : index);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    finishGeometry(geometry, axis, this.reveal);
    return geometry;
  }
}

/**
 * Add `smoothNormal` and `reveal`, sort each group's triangles by reveal, and
 * compute the bounding sphere. `reveal[i]` NaN (or missing) means: use the
 * projection of vertex i on `axis`, normalised to [0, 1] over the mesh.
 */
export function finishGeometry(
  geometry: THREE.BufferGeometry,
  axis: Vector3Tuple,
  reveal: number[] = [],
): void {
  addSmoothNormals(geometry);
  const pos = geometry.getAttribute('position');
  const unit = normalizeVec(axis);
  const values = new Float32Array(pos.count);
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const proj = dotVec([pos.getX(i), pos.getY(i), pos.getZ(i)], unit);
    lo = Math.min(lo, proj);
    hi = Math.max(hi, proj);
  }
  const span = hi - lo > 1e-12 ? hi - lo : 1;
  for (let i = 0; i < pos.count; i++) {
    const given = reveal[i];
    values[i] =
      given !== undefined && !Number.isNaN(given)
        ? given
        : (dotVec([pos.getX(i), pos.getY(i), pos.getZ(i)], unit) - lo) / span;
  }
  geometry.setAttribute(REVEAL_ATTRIBUTE, new THREE.BufferAttribute(values, 1));
  sortTrianglesByReveal(geometry, values);
  geometry.computeBoundingSphere();
}

/** Sort the triangles inside each draw group by their mean reveal value. */
function sortTrianglesByReveal(geometry: THREE.BufferGeometry, values: Float32Array): void {
  const index = geometry.getIndex();
  if (!index) return;
  const array = index.array;
  const groups = geometry.groups.length > 0 ? geometry.groups : [{ start: 0, count: index.count }];
  for (const group of groups) {
    const tris: { key: number; v: [number, number, number] }[] = [];
    for (let t = group.start; t < group.start + group.count; t += 3) {
      const v: [number, number, number] = [array[t], array[t + 1], array[t + 2]];
      tris.push({ key: values[v[0]] + values[v[1]] + values[v[2]], v });
    }
    tris.sort((a, b) => a.key - b.key);
    tris.forEach((tri, k) => {
      array[group.start + 3 * k] = tri.v[0];
      array[group.start + 3 * k + 1] = tri.v[1];
      array[group.start + 3 * k + 2] = tri.v[2];
    });
  }
  index.needsUpdate = true;
}

/** Quantised key of a position, so coincident vertices weld together. */
function positionKey(x: number, y: number, z: number): string {
  const q = 1e5;
  return `${Math.round(x * q)},${Math.round(y * q)},${Math.round(z * q)}`;
}

/**
 * Map each vertex to a welded id: vertices at the same position share an id.
 * @post result.length === geometry.attributes.position.count
 */
export function weldIds(geometry: THREE.BufferGeometry): Int32Array {
  const pos = geometry.getAttribute('position');
  const ids = new Int32Array(pos.count);
  const map = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const key = positionKey(pos.getX(i), pos.getY(i), pos.getZ(i));
    let id = map.get(key);
    if (id === undefined) {
      id = map.size;
      map.set(key, id);
    }
    ids[i] = id;
  }
  return ids;
}

/** Add the `smoothNormal` attribute: area-weighted normals over welded positions. */
function addSmoothNormals(geometry: THREE.BufferGeometry): void {
  const pos = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const ids = weldIds(geometry);
  let welded = 0;
  for (const id of ids) welded = Math.max(welded, id + 1);
  const acc = new Float64Array(welded * 3);
  const triCount = index ? index.count / 3 : pos.count / 3;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(3 * t) : 3 * t;
    const i1 = index ? index.getX(3 * t + 1) : 3 * t + 1;
    const i2 = index ? index.getX(3 * t + 2) : 3 * t + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    // Unnormalised cross product = 2 * area * face normal (area weighting).
    const n = crossVec(
      subVec([b.x, b.y, b.z], [a.x, a.y, a.z]),
      subVec([c.x, c.y, c.z], [a.x, a.y, a.z]),
    );
    for (const i of [i0, i1, i2]) {
      const w = ids[i] * 3;
      acc[w] += n[0];
      acc[w + 1] += n[1];
      acc[w + 2] += n[2];
    }
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const w = ids[i] * 3;
    const n = normalizeVec([acc[w], acc[w + 1], acc[w + 2]]);
    out[3 * i] = n[0];
    out[3 * i + 1] = n[1];
    out[3 * i + 2] = n[2];
  }
  geometry.setAttribute(SMOOTH_NORMAL_ATTRIBUTE, new THREE.BufferAttribute(out, 3));
}

/**
 * Append a closed swept tube with round (hemisphere) end caps.
 *
 * The spine is a polyline of points with unit tangents. A rotation-minimising
 * frame carries the circular cross-section along it. Each cap is a hemisphere
 * of the tube radius, centred on the end point, closed by one pole vertex, so
 * the result is watertight and every normal is the exact sphere / tube normal.
 *
 * @pre spine.length >= 2
 * @pre radius > 0
 */
export function sweepCappedTube(
  builder: MeshBuilder,
  spine: Vector3Tuple[],
  radius: number,
  radialSegments: number,
  capSegments: number,
  revealRange: [number, number] = [0, 1],
): void {
  const n = spine.length;
  // Arc length along the spine, caps included, drives the reveal parameter.
  const arc: number[] = [0];
  for (let i = 1; i < n; i++) arc.push(arc[i - 1] + lengthVec(subVec(spine[i], spine[i - 1])));
  const total = arc[n - 1] + 2 * radius;
  const revealAt = (s: number) =>
    revealRange[0] + ((revealRange[1] - revealRange[0]) * (s + radius)) / total;
  const tangents: Vector3Tuple[] = spine.map((_, i) => {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n - 1, i + 1)];
    return normalizeVec(subVec(b, a));
  });
  // Rotation-minimising frame (double reflection is overkill for tube
  // shading; a projected carry-over frame is stable for smooth spines).
  const normals: Vector3Tuple[] = [];
  const binormals: Vector3Tuple[] = [];
  let u = orthonormalFrame(tangents[0]).u;
  for (let i = 0; i < n; i++) {
    const t = tangents[i];
    const d = dotVec(u, t);
    const projected = normalizeVec([u[0] - d * t[0], u[1] - d * t[1], u[2] - d * t[2]]);
    u = Number.isFinite(projected[0]) ? projected : orthonormalFrame(t).u;
    normals.push(u);
    binormals.push(crossVec(t, u));
  }

  const ring = (
    center: Vector3Tuple,
    axial: Vector3Tuple,
    i: number,
    s: number,
    c: number,
    reveal: number,
  ) => {
    // c = cos of the cap latitude (1 on the tube body), s = its axial offset.
    const out: number[] = [];
    const nn = normals[i];
    const bb = binormals[i];
    for (let k = 0; k < radialSegments; k++) {
      const phi = (2 * Math.PI * k) / radialSegments;
      const cp = Math.cos(phi);
      const sp = Math.sin(phi);
      const dir: Vector3Tuple = [
        c * (cp * nn[0] + sp * bb[0]) + s * axial[0],
        c * (cp * nn[1] + sp * bb[1]) + s * axial[1],
        c * (cp * nn[2] + sp * bb[2]) + s * axial[2],
      ];
      out.push(
        builder.vertex(
          [center[0] + radius * dir[0], center[1] + radius * dir[1], center[2] + radius * dir[2]],
          dir,
          reveal,
        ),
      );
    }
    return out;
  };

  const rings: number[][] = [];
  const startAxis: Vector3Tuple = [-tangents[0][0], -tangents[0][1], -tangents[0][2]];
  const startPole = builder.vertex(
    [
      spine[0][0] + radius * startAxis[0],
      spine[0][1] + radius * startAxis[1],
      spine[0][2] + radius * startAxis[2],
    ],
    startAxis,
    revealAt(-radius),
  );
  for (let k = capSegments - 1; k >= 1; k--) {
    const lat = (Math.PI / 2) * (k / capSegments);
    rings.push(
      ring(spine[0], startAxis, 0, Math.sin(lat), Math.cos(lat), revealAt(-radius * Math.sin(lat))),
    );
  }
  for (let i = 0; i < n; i++) rings.push(ring(spine[i], tangents[i], i, 0, 1, revealAt(arc[i])));
  const endAxis = tangents[n - 1];
  for (let k = 1; k < capSegments; k++) {
    const lat = (Math.PI / 2) * (k / capSegments);
    rings.push(
      ring(
        spine[n - 1],
        endAxis,
        n - 1,
        Math.sin(lat),
        Math.cos(lat),
        revealAt(arc[n - 1] + radius * Math.sin(lat)),
      ),
    );
  }
  const endPole = builder.vertex(
    [
      spine[n - 1][0] + radius * endAxis[0],
      spine[n - 1][1] + radius * endAxis[1],
      spine[n - 1][2] + radius * endAxis[2],
    ],
    endAxis,
    revealAt(arc[n - 1] + radius),
  );

  // Each ring runs counter-clockwise around +tangent (u x b = t) and ring r+1
  // lies further along +t, so d(phi) x d(s) points outward: no flip on the body.
  builder.fan(startPole, rings[0], true);
  for (let r = 0; r + 1 < rings.length; r++) builder.band(rings[r], rings[r + 1], true);
  builder.fan(endPole, rings[rings.length - 1]);
}

/** Options shared by every organic mobject. */
export interface OrganicMeshOptions {
  /** Color as a CSS color string. */
  color?: string;
  /** Opacity from 0 to 1. Default: 1 */
  opacity?: number;
  /** Center position [x, y, z]. Default: [0, 0, 0] */
  center?: Vector3Tuple;
}

/**
 * Base class for the organic mobjects: one mesh, one indexed geometry, and
 * one material per geometry group.
 *
 * Subclasses implement {@link _buildGeometry} and, when they have extra
 * material slots, {@link _slotColors}. Material slot 0 always uses
 * {@link color}; the other slots fall back to it.
 */
export abstract class OrganicMesh3D extends Mobject3D {
  protected _centerPoint: Vector3Tuple;
  private _geometryCache: THREE.BufferGeometry | null = null;

  constructor(options: OrganicMeshOptions, defaultColor: string) {
    super();
    const { color = defaultColor, opacity = 1, center = [0, 0, 0] } = options;
    this._centerPoint = [...center];
    this.color = color;
    this._opacity = opacity;
    this.fillOpacity = opacity;
    this.position.set(center[0], center[1], center[2]);
  }

  /** Build the geometry in local coordinates (centred on the origin). */
  protected abstract _buildGeometry(): THREE.BufferGeometry;

  /**
   * Colors of material slots 1..n (slot 0 is {@link color}). An undefined
   * entry uses {@link color}. Default: no extra slots.
   */
  protected _slotColors(): (string | undefined)[] {
    return [];
  }

  /** Wash of the extra material slots: colour and amount 0..1, or null. */
  private _slotWash: { color: string; amount: number } | null = null;

  /**
   * Mix the colours of material slots 1..n (caps, rims, inner faces) toward
   * `color` by `amount` (0 = own colours, 1 = `color`). Slot 0 follows
   * `setColor()`, so a focus dim washes the whole shape with both calls.
   * @post amount <= 0 => the slots show their own colours
   */
  setSlotWash(color: string, amount: number): this {
    const a = Math.min(1, Math.max(0, amount));
    this._slotWash = a > 0 ? { color, amount: a } : null;
    this._markDirty();
    return this;
  }

  /** The built geometry (cached until {@link _rebuild}). */
  getGeometry(): THREE.BufferGeometry {
    if (!this._geometryCache) this._geometryCache = this._buildGeometry();
    return this._geometryCache;
  }

  /** Number of triangles in the geometry. */
  getTriangleCount(): number {
    const g = this.getGeometry();
    const index = g.getIndex();
    return (index ? index.count : g.getAttribute('position').count) / 3;
  }

  private _makeMaterial(color: string): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      opacity: this._opacity,
      transparent: this._opacity < 1,
      depthWrite: this._opacity >= 1,
      // Closed, outward-wound geometry: front faces only, so a back-face
      // outline pass and the depth buffer behave.
      side: THREE.FrontSide,
    });
  }

  /**
   * Create the mesh, plus a depth-only prepass child for translucent fills.
   *
   * This follows {@link Surface3D} (issue #416): a translucent closed shape
   * draws its colour pass with depthWrite off, so without help the far side
   * (for a Shell3D, the inner wall) blends over the near side in triangle
   * order. The prepass child is created first (lower object id, same
   * renderOrder), writes only depth, and is transparent so it runs after the
   * opaque pass: opaque mobjects inside the shape stay visible through it,
   * and the colour pass shows only the front-most layer.
   */
  protected _createThreeObject(): THREE.Object3D {
    const extra = this._slotColors();
    const geometry = this.getGeometry();
    const prepassMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      transparent: true,
      side: THREE.FrontSide,
    });
    prepassMaterial.userData.depthPrepass = true;
    this._applyPrepassState(prepassMaterial);
    const prepass = new THREE.Mesh(geometry, prepassMaterial);
    prepass.raycast = () => {}; // depth-only helper; picking sees only the colour mesh
    const material =
      extra.length === 0
        ? this._makeMaterial(this.color)
        : [this.color, ...extra].map((c) => this._makeMaterial(c ?? this.color));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.add(prepass);
    return mesh;
  }

  /** The prepass helps only a translucent, still visible fill. */
  private _applyPrepassState(material: THREE.Material): void {
    const enabled = this._opacity > 0 && this._opacity < 1;
    material.depthWrite = enabled;
    material.visible = enabled;
  }

  private _prepassMesh(): THREE.Mesh | null {
    if (!(this._threeObject instanceof THREE.Mesh)) return null;
    const found = this._threeObject.children.find(
      (c): c is THREE.Mesh => c instanceof THREE.Mesh && !!meshMaterial(c).userData.depthPrepass,
    );
    return found ?? null;
  }

  protected override _syncMaterialToThree(): void {
    if (!(this._threeObject instanceof THREE.Mesh)) return;
    const material = this._threeObject.material;
    const list = Array.isArray(material) ? material : [material];
    const wash = this._slotWash;
    const slots = this._slotColors().map((c) =>
      c !== undefined && wash ? interpolateColor(c, wash.color, wash.amount) : c,
    );
    const colors = [this.color, ...slots];
    list.forEach((m, i) => {
      const std = m as THREE.MeshStandardMaterial;
      if (std.color) std.color.set(colors[i] ?? this.color);
      std.opacity = this._opacity;
      std.transparent = this._opacity < 1;
      std.depthWrite = this._opacity >= 1;
      std.needsUpdate = true;
    });
    const prepass = this._prepassMesh();
    if (prepass) this._applyPrepassState(meshMaterial(prepass));
  }

  /** Drop the cached geometry and swap a fresh one into the mesh. */
  protected _rebuild(): void {
    const old = this._geometryCache;
    this._geometryCache = null;
    if (this._threeObject instanceof THREE.Mesh) {
      this._threeObject.geometry = this.getGeometry();
      const prepass = this._prepassMesh();
      if (prepass) prepass.geometry = this.getGeometry();
    }
    old?.dispose();
    this._markDirty();
  }

  override dispose(): void {
    super.dispose();
    this._geometryCache?.dispose();
    this._geometryCache = null;
  }
}

// ── input validation ─────────────────────────────────────────────────────

/**
 * Throw an Error that names the shape and the option when `value` is not a
 * finite number at or above `min` (above it with `exclusive`).
 * @post Number.isFinite(value) && (exclusive ? value > min : value >= min)
 */
export function requireNumber(
  shape: string,
  name: string,
  value: number,
  min = Number.NEGATIVE_INFINITY,
  exclusive = false,
): void {
  const inRange = exclusive ? value > min : value >= min;
  if (Number.isFinite(value) && inRange) return;
  const bound = min === Number.NEGATIVE_INFINITY ? '' : ` ${exclusive ? '>' : '>='} ${min}`;
  throw new Error(`${shape}: ${name} must be a finite number${bound}, got ${value}.`);
}

/**
 * Throw an Error that names the shape and the option when a point has a
 * non-finite coordinate.
 * @post points.every((p) => Array.from(p).every(Number.isFinite))
 */
export function requireFinitePoints(
  shape: string,
  name: string,
  points: readonly ArrayLike<number>[],
): void {
  const bad = points.findIndex((p) => !Array.from(p).every(Number.isFinite));
  if (bad >= 0) throw new Error(`${shape}: ${name}[${bad}] must have finite coordinates.`);
}
