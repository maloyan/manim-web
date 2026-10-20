/**
 * Dynamic (continuous) 2x2 and 3x3 matrix transformations.
 *
 * The one-shot {@link LinearTransformationScene.applyMatrix} and the
 * `applyMatrix` animation play a single tween from the identity to a target
 * matrix. This module adds the live/continuous mode asked for in issue #359: a
 * `NumberPlane`, a grid Group, or any mobject is bound to a *live* matrix and
 * re-maps itself every frame as that matrix changes.
 *
 * A 2x2 matrix maps x and y and leaves z alone, as in a 2D scene. A 3x3 matrix
 * maps all three axes (issue #837), so a `ThreeDScene` can shear, stretch or
 * rotate 3D mobjects live. VMobjects (control points) and 3D meshes such as
 * `Sphere`, `Cube` or `Surface3D` (Three.js vertex buffers) both follow the map.
 *
 * The matrix can be driven by draggable basis vectors (for example the
 * {@link MovablePoint} shipped for explorable explanations), by a
 * {@link ValueTracker}-style {@link MatrixTracker}, or by any plain getter. The
 * feel matches the AstroWidgets linear-algebra playground: drag a basis vector
 * and the whole grid morphs under your hand.
 *
 * Design: the matrix math is NOT re-implemented here. The per-point map reuses
 * {@link transformPointByMatrix} from `utils/math`, the same helper the
 * one-shot `applyMatrix` uses. Each frame re-maps from a snapshot of the
 * pristine (identity) geometry, so the mapping is absolute. It never composes
 * frame on frame, and a singular matrix (collapsed basis vectors) is handled
 * with no inverse of the matrix and no drift.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple, type UpdaterFunction } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { Mobject3D } from '../mobjects/three-d/Mobject3D';
import { transformPointByMatrix } from '../utils/math';

/**
 * A 2x2 linear map written row-major as `[[a, b], [c, d]]`, i.e.
 * `| a  b |`
 * `| c  d |`.
 * Its columns are the images of the basis vectors: `i = (a, c)`, `j = (b, d)`.
 */
export type Matrix2x2 = [[number, number], [number, number]];

/**
 * A 3x3 linear map written row-major. Its columns are the images of the three
 * basis vectors `i`, `j` and `k`.
 */
export type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

/** A matrix {@link applyMatrixLive} accepts: 2x2 (2D) or 3x3 (3D). */
export type LiveMatrix = Matrix2x2 | Matrix3x3;

/** A column (basis vector image) of a matrix `M`: 2 components or 3. */
type ColumnOf<M extends LiveMatrix> = M extends Matrix3x3
  ? [number, number, number]
  : [number, number];

/** The columns `[i, j]` or `[i, j, k]` of a matrix `M`. */
type ColumnsOf<M extends LiveMatrix> = M extends Matrix3x3
  ? [ColumnOf<M>, ColumnOf<M>, ColumnOf<M>]
  : [ColumnOf<M>, ColumnOf<M>];

/** Read-only form of {@link ColumnsOf}, for inputs. */
type ColumnsInput<M extends LiveMatrix> = M extends Matrix3x3
  ? [
      readonly [number, number, number],
      readonly [number, number, number],
      readonly [number, number, number],
    ]
  : [readonly [number, number], readonly [number, number]];

/**
 * A source of a live basis vector. Either a getter that returns `[x, y]` or
 * `[x, y, z]`, or any object with `getPoint()` (such as a {@link MovablePoint}).
 * A 2D tracker reads the first two components. A 3D tracker reads three, and a
 * missing `z` reads as `0`.
 */
export type BasisVectorSource =
  | (() => readonly [number, number] | readonly [number, number, number])
  | { getPoint(): Vector3Tuple };

/**
 * Anything that can drive {@link applyMatrixLive}: a fixed matrix, a getter that
 * returns the current matrix, or a {@link MatrixTracker}.
 */
export type MatrixSource<M extends LiveMatrix = Matrix2x2> = M | (() => M) | MatrixTracker<M>;

/**
 * A mobject whose position follows the live transform, mapped from a fixed base
 * position under the identity matrix.
 */
export interface DependentPoint {
  /** The mobject to move each frame. */
  mobject: Mobject;
  /** Its position under the identity matrix, in the plane's coordinate space. */
  base: Vector3Tuple;
}

/**
 * Options for {@link applyMatrixLive}.
 */
export interface DynamicMatrixOptions<M extends LiveMatrix = Matrix2x2> {
  /** Pivot the transform is applied about. Default `[0, 0, 0]` (the origin). */
  aboutPoint?: Vector3Tuple;
  /** Dependent points/vectors that follow the transform. */
  dependents?: DependentPoint[];
  /** Called with the current matrix after every re-map (e.g. to trigger a render). */
  onChange?: (matrix: M) => void;
}

/**
 * Handle returned by {@link applyMatrixLive}. Controls the live binding without
 * re-reading the mobject.
 */
export interface LiveMatrixBinding<M extends LiveMatrix = Matrix2x2> {
  /** The tracker driving the transform. */
  readonly tracker: MatrixTracker<M>;
  /** The current matrix. */
  getMatrix(): M;
  /** Set the matrix and re-map immediately. */
  setMatrix(matrix: M): LiveMatrixBinding<M>;
  /** Register a dependent point after binding. */
  addDependentPoint(mobject: Mobject, base: Vector3Tuple): LiveMatrixBinding<M>;
  /** Re-map once from the current matrix (called automatically each frame). */
  update(): LiveMatrixBinding<M>;
  /** Detach the per-frame updater so the geometry stops following the matrix. */
  remove(): void;
}

/** The 2x2 identity matrix, returned as a fresh array each time. */
function identityMatrix(): Matrix2x2 {
  return [
    [1, 0],
    [0, 1],
  ];
}

/** Deep-copy a matrix so callers never alias the tracker's state. */
function cloneMatrix<M extends LiveMatrix>(matrix: M): M {
  return matrix.map((row) => [...row]) as M;
}

/** Read the first `size` components of a basis vector. A missing `z` is `0`. */
function readBasisVector(source: BasisVectorSource, size: 2 | 3): number[] {
  const v: readonly number[] = typeof source === 'function' ? source() : source.getPoint();
  return size === 2 ? [v[0], v[1]] : [v[0], v[1], v[2] ?? 0];
}

/** Build a square matrix whose columns are the given vectors. */
function matrixFromColumns<M extends LiveMatrix>(columns: ReadonlyArray<readonly number[]>): M {
  return columns.map((_, r) => columns.map((col) => col[r])) as M;
}

/**
 * MatrixTracker — holds a live 2x2 or 3x3 matrix, the matrix analogue of
 * {@link ValueTracker}.
 *
 * It either stores a matrix directly (via the constructor or {@link setMatrix})
 * or computes one on every read from a getter ({@link fromGetter}) or from
 * basis-vector sources ({@link fromBasisVectors}). Bind it to a grid or a 3D
 * mobject with {@link applyMatrixLive}. The type parameter is the matrix size:
 * pass a 3x3 matrix for a 3D tracker.
 *
 * @example
 * ```typescript
 * const iPoint = new MovablePoint(scene, { point: [1, 0, 0] });
 * const jPoint = new MovablePoint(scene, { point: [0, 1, 0] });
 * const tracker = MatrixTracker.fromBasisVectors(iPoint, jPoint);
 * applyMatrixLive(plane, tracker, { onChange: () => scene.render() });
 *
 * // 3D: a 3x3 tracker bound to a mesh in a ThreeDScene.
 * const tracker3d = new MatrixTracker<Matrix3x3>([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
 * applyMatrixLive(cube, tracker3d, { onChange: () => scene.render() });
 * ```
 */
export class MatrixTracker<M extends LiveMatrix = Matrix2x2> {
  private _matrix: M;
  private _compute: (() => M) | null;

  /**
   * Create a tracker holding a fixed matrix.
   * @param matrix - The initial matrix. Default: the 2x2 identity.
   */
  constructor(matrix: M = identityMatrix() as M) {
    this._matrix = cloneMatrix(matrix);
    this._compute = null;
  }

  /**
   * Get the current matrix as a fresh copy.
   * @returns The current matrix.
   */
  getMatrix(): M {
    return cloneMatrix(this._compute ? this._compute() : this._matrix);
  }

  /**
   * Set the matrix directly, dropping any getter source.
   * @param matrix - The new matrix.
   * @returns this for chaining.
   */
  setMatrix(matrix: M): this {
    this._compute = null;
    this._matrix = cloneMatrix(matrix);
    return this;
  }

  /**
   * Set the matrix from its column basis vectors.
   * @param columns - The images of the basis vectors: `i, j` for a 2x2
   *   matrix, `i, j, k` for a 3x3 matrix.
   * @returns this for chaining.
   */
  setColumns(...columns: ColumnsInput<M>): this {
    return this.setMatrix(matrixFromColumns<M>(columns));
  }

  /**
   * Get the column basis vectors of the current matrix.
   * @returns `[i, j]` for a 2x2 matrix (`i = (a, c)`, `j = (b, d)`), or
   *   `[i, j, k]` for a 3x3 matrix.
   */
  getColumns(): ColumnsOf<M> {
    const m: number[][] = this.getMatrix();
    return m[0].map((_, c) => m.map((row) => row[c])) as ColumnsOf<M>;
  }

  /**
   * Map a point by the current matrix (about the origin).
   * @param point - The point `[x, y]` (2x2) or `[x, y, z]` (3x3) to transform.
   * @returns The transformed point, with the same size.
   */
  transformPoint(point: Readonly<ColumnOf<M>>): ColumnOf<M> {
    const m: number[][] = this.getMatrix();
    const p: readonly number[] = point;
    return m.map((row) => row.reduce((sum, v, c) => sum + v * p[c], 0)) as ColumnOf<M>;
  }

  /**
   * Create a tracker whose matrix is recomputed from a getter on every read.
   * @param getter - Returns the current matrix.
   * @returns A new MatrixTracker.
   */
  static fromGetter<M extends LiveMatrix>(getter: () => M): MatrixTracker<M> {
    const tracker = new MatrixTracker<M>();
    tracker._compute = getter;
    return tracker;
  }

  /**
   * Create a tracker whose matrix is built live from basis-vector sources.
   * The columns follow the sources, so dragging a {@link MovablePoint} drives
   * the matrix in real time. Two sources give a 2x2 matrix. Three sources give
   * a 3x3 matrix.
   * @param iSource - Source of the x basis vector image (first column).
   * @param jSource - Source of the y basis vector image (second column).
   * @param kSource - Source of the z basis vector image (third column, 3D only).
   * @returns A new MatrixTracker.
   */
  static fromBasisVectors(
    iSource: BasisVectorSource,
    jSource: BasisVectorSource,
  ): MatrixTracker<Matrix2x2>;
  static fromBasisVectors(
    iSource: BasisVectorSource,
    jSource: BasisVectorSource,
    kSource: BasisVectorSource,
  ): MatrixTracker<Matrix3x3>;
  static fromBasisVectors(
    iSource: BasisVectorSource,
    jSource: BasisVectorSource,
    kSource?: BasisVectorSource,
  ): MatrixTracker<Matrix2x2> | MatrixTracker<Matrix3x3> {
    if (kSource) {
      const sources = [iSource, jSource, kSource];
      return MatrixTracker.fromGetter(() =>
        matrixFromColumns<Matrix3x3>(sources.map((s) => readBasisVector(s, 3))),
      );
    }
    const sources = [iSource, jSource];
    return MatrixTracker.fromGetter(() =>
      matrixFromColumns<Matrix2x2>(sources.map((s) => readBasisVector(s, 2))),
    );
  }
}

/**
 * Factory for a {@link MatrixTracker}.
 * @param matrix - The initial matrix. Default: the 2x2 identity.
 * @returns A new MatrixTracker.
 */
export function makeMatrixTracker<M extends LiveMatrix = Matrix2x2>(matrix?: M): MatrixTracker<M> {
  return new MatrixTracker<M>(matrix);
}

/** Normalize any {@link MatrixSource} to a {@link MatrixTracker}. */
function toTracker<M extends LiveMatrix>(source: MatrixSource<M>): MatrixTracker<M> {
  if (source instanceof MatrixTracker) return source;
  if (typeof source === 'function') return MatrixTracker.fromGetter(source);
  return new MatrixTracker(source);
}

/** A VMobject leaf and its pristine (identity) control points. */
interface PointSnapshot {
  node: VMobject;
  points: number[][];
}

/**
 * A vertex buffer of a 3D mesh mobject and its pristine (identity) positions.
 * The positions are local to `object`. `toOwner` maps them into the local
 * space of `owner`, whose world matrix then maps them into scene space.
 */
interface MeshSnapshot {
  owner: Mobject3D;
  toOwner: THREE.Matrix4;
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
}

/** The matrix that maps `object`'s local space into `root`'s local space. */
function matrixToRoot(object: THREE.Object3D, root: THREE.Object3D): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  for (let o: THREE.Object3D | null = object; o && o !== root; o = o.parent) {
    o.updateMatrix();
    matrix.premultiply(o.matrix);
  }
  return matrix;
}

/**
 * Snapshot the vertex buffers of every 3D mesh mobject in `target`'s family.
 *
 * Each mesh mobject's THREE subtree is walked, but a subtree that belongs to
 * another family member is skipped, so every buffer has exactly one owner.
 * Instanced geometry (fat `Line2` lines, instanced meshes) is skipped: its
 * `position` attribute is a shared template, not the drawn points.
 */
function snapshotMeshes(target: Mobject): MeshSnapshot[] {
  const family = target.getFamily();
  const meshOwners = family.filter((m): m is Mobject3D => m instanceof Mobject3D);
  const familyRoots = new Set<THREE.Object3D>();
  for (const m of meshOwners) familyRoots.add(m.getThreeObject());
  for (const m of family) if (m._threeObject) familyRoots.add(m._threeObject);

  const seen = new Set<THREE.BufferGeometry>();
  const snapshots: MeshSnapshot[] = [];
  for (const owner of meshOwners) {
    const root = owner.getThreeObject();
    const visit = (object: THREE.Object3D): void => {
      if (object !== root && familyRoots.has(object)) return;
      const geometry = (object as { geometry?: unknown }).geometry;
      if (
        geometry instanceof THREE.BufferGeometry &&
        !(geometry instanceof THREE.InstancedBufferGeometry) &&
        !seen.has(geometry)
      ) {
        const position = geometry.getAttribute('position');
        if (position && position.itemSize === 3 && position.array instanceof Float32Array) {
          seen.add(geometry);
          snapshots.push({
            owner,
            toOwner: matrixToRoot(object, root),
            geometry,
            positions: position.array.slice(),
          });
        }
      }
      for (const child of object.children) visit(child);
    };
    visit(root);
  }
  return snapshots;
}

/**
 * Re-map one mesh buffer from its snapshot. Each vertex goes to scene space,
 * through the matrix about `aboutPoint`, and back to the buffer's local space.
 */
function remapMesh(snap: MeshSnapshot, matrix: LiveMatrix, aboutPoint: Vector3Tuple): void {
  const toWorld = snap.owner._worldMatrix().multiply(snap.toOwner);
  const toLocal = toWorld.clone().invert();
  const position = snap.geometry.getAttribute('position') as THREE.BufferAttribute;
  const src = snap.positions;
  const v = new THREE.Vector3();
  for (let i = 0; i < src.length; i += 3) {
    v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(toWorld);
    const mapped = transformPointByMatrix([v.x, v.y, v.z], matrix, aboutPoint);
    v.set(mapped[0], mapped[1], mapped[2]).applyMatrix4(toLocal);
    position.setXYZ(i / 3, v.x, v.y, v.z);
  }
  position.needsUpdate = true;
  // Normals follow the new shape so lighting stays right under shear/stretch.
  if (snap.geometry.getAttribute('normal')) snap.geometry.computeVertexNormals();
  snap.geometry.computeBoundingSphere();
  snap.geometry.boundingBox = null;
}

/**
 * Bind a mobject to a live 2x2 or 3x3 matrix so it morphs continuously.
 *
 * Every VMobject leaf in `target`'s family is snapshotted at bind time, and so
 * is the vertex buffer of every 3D mesh mobject (`Sphere`, `Cube`,
 * `Surface3D`, ...). An updater is added to `target`; each frame it re-maps
 * every snapshotted point by the current matrix (about `aboutPoint`) and moves
 * any dependent points. Because the re-map always starts from the snapshot,
 * the transform is absolute and free of per-frame drift — a collapsed
 * (singular) matrix is just a flat shape, with full recovery on the next frame.
 *
 * A 2x2 matrix maps x and y and keeps z, for a 2D scene. A 3x3 matrix maps all
 * three axes, for a `ThreeDScene`. Mesh vertices are mapped in scene space, so
 * a mesh away from the origin moves as the matrix says. Geometry that a mesh
 * rebuilds after binding (for example `Sphere.setRadius`) is not tracked; bind
 * again after such a change.
 *
 * The one-shot `applyMatrix` is untouched; this is the additive live mode.
 *
 * @param target - The grid/plane/mobject to morph (e.g. a `NumberPlane` or a `Cube`).
 * @param matrix - The driving matrix, getter, or {@link MatrixTracker}.
 * @param options - Pivot, dependent points and an `onChange` render hook.
 * @returns A {@link LiveMatrixBinding} controlling the binding.
 *
 * @example
 * ```typescript
 * const tracker = MatrixTracker.fromBasisVectors(iPoint, jPoint);
 * applyMatrixLive(plane, tracker, {
 *   dependents: [{ mobject: vector, base: [2, 1, 0] }],
 *   onChange: () => scene.render(),
 * });
 *
 * // 3D: shear a cube along x by its height.
 * applyMatrixLive(cube, [[1, 0, 1], [0, 1, 0], [0, 0, 1]]);
 * ```
 */
export function applyMatrixLive<M extends LiveMatrix = Matrix2x2>(
  target: Mobject,
  matrix: MatrixSource<M>,
  options: DynamicMatrixOptions<M> = {},
): LiveMatrixBinding<M> {
  const tracker = toTracker(matrix);
  const aboutPoint: Vector3Tuple = options.aboutPoint ?? [0, 0, 0];
  const onChange = options.onChange;
  const dependents: DependentPoint[] = options.dependents ? [...options.dependents] : [];

  // Snapshot the pristine geometry of every leaf that owns points, so each
  // frame re-maps from the identity grid instead of composing frame on frame.
  const snapshots: PointSnapshot[] = [];
  for (const node of target.getFamily()) {
    if (node instanceof VMobject && node.hasOwnPoints()) {
      snapshots.push({ node, points: node.getLocalPoints() });
    }
  }
  const meshSnapshots = snapshotMeshes(target);

  const remap = (): void => {
    const m = tracker.getMatrix();
    for (const snap of snapshots) {
      snap.node.setPoints(snap.points.map((p) => transformPointByMatrix(p, m, aboutPoint)));
    }
    for (const snap of meshSnapshots) remapMesh(snap, m, aboutPoint);
    for (const dep of dependents) {
      const mapped = transformPointByMatrix([...dep.base], m, aboutPoint);
      dep.mobject.moveTo([mapped[0], mapped[1], mapped[2]]);
    }
    onChange?.(m);
  };

  const updater: UpdaterFunction = () => remap();
  target.addUpdater(updater);
  remap();

  const binding: LiveMatrixBinding<M> = {
    tracker,
    getMatrix: () => tracker.getMatrix(),
    setMatrix: (m: M) => {
      tracker.setMatrix(m);
      remap();
      return binding;
    },
    addDependentPoint: (mobject: Mobject, base: Vector3Tuple) => {
      dependents.push({ mobject, base });
      return binding;
    },
    update: () => {
      remap();
      return binding;
    },
    remove: () => {
      target.removeUpdater(updater);
    },
  };
  return binding;
}
