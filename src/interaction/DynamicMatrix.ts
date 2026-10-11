/**
 * Dynamic (continuous) 2x2 matrix transformations.
 *
 * The one-shot {@link LinearTransformationScene.applyMatrix} and the
 * `applyMatrix` animation play a single tween from the identity to a target
 * matrix. This module adds the live/continuous mode asked for in issue #359: a
 * `NumberPlane`, a grid Group, or any mobject is bound to a *live* 2x2 matrix
 * and re-maps itself every frame as that matrix changes.
 *
 * The matrix can be driven by two draggable basis vectors (for example the
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
 * with no inverse and no drift.
 */

import { Mobject, Vector3Tuple, type UpdaterFunction } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { transformPointByMatrix } from '../utils/math';

/**
 * A 2x2 linear map written row-major as `[[a, b], [c, d]]`, i.e.
 * `| a  b |`
 * `| c  d |`.
 * Its columns are the images of the basis vectors: `i = (a, c)`, `j = (b, d)`.
 */
export type Matrix2x2 = [[number, number], [number, number]];

/**
 * A source of a live 2D basis vector. Either a getter that returns `[x, y]`, or
 * any object with `getPoint()` (such as a {@link MovablePoint}) whose first two
 * components are read.
 */
export type BasisVectorSource = (() => readonly [number, number]) | { getPoint(): Vector3Tuple };

/**
 * Anything that can drive {@link applyMatrixLive}: a fixed matrix, a getter that
 * returns the current matrix, or a {@link MatrixTracker}.
 */
export type MatrixSource = Matrix2x2 | (() => Matrix2x2) | MatrixTracker;

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
export interface DynamicMatrixOptions {
  /** Pivot the transform is applied about. Default `[0, 0, 0]` (the origin). */
  aboutPoint?: Vector3Tuple;
  /** Dependent points/vectors that follow the transform. */
  dependents?: DependentPoint[];
  /** Called with the current matrix after every re-map (e.g. to trigger a render). */
  onChange?: (matrix: Matrix2x2) => void;
}

/**
 * Handle returned by {@link applyMatrixLive}. Controls the live binding without
 * re-reading the mobject.
 */
export interface LiveMatrixBinding {
  /** The tracker driving the transform. */
  readonly tracker: MatrixTracker;
  /** The current matrix. */
  getMatrix(): Matrix2x2;
  /** Set the matrix and re-map immediately. */
  setMatrix(matrix: Matrix2x2): LiveMatrixBinding;
  /** Register a dependent point after binding. */
  addDependentPoint(mobject: Mobject, base: Vector3Tuple): LiveMatrixBinding;
  /** Re-map once from the current matrix (called automatically each frame). */
  update(): LiveMatrixBinding;
  /** Detach the per-frame updater so the geometry stops following the matrix. */
  remove(): void;
}

/** The identity matrix, returned as a fresh array each time. */
function identityMatrix(): Matrix2x2 {
  return [
    [1, 0],
    [0, 1],
  ];
}

/** Deep-copy a 2x2 matrix so callers never alias the tracker's state. */
function cloneMatrix(matrix: Matrix2x2): Matrix2x2 {
  return [
    [matrix[0][0], matrix[0][1]],
    [matrix[1][0], matrix[1][1]],
  ];
}

/** Read a basis vector from a getter or a `getPoint()`-bearing mobject. */
function readBasisVector(source: BasisVectorSource): [number, number] {
  if (typeof source === 'function') {
    const v = source();
    return [v[0], v[1]];
  }
  const p = source.getPoint();
  return [p[0], p[1]];
}

/**
 * MatrixTracker — holds a live 2x2 matrix, the matrix analogue of
 * {@link ValueTracker}.
 *
 * It either stores a matrix directly (via the constructor or {@link setMatrix})
 * or computes one on every read from a getter ({@link fromGetter}) or from two
 * basis-vector sources ({@link fromBasisVectors}). Bind it to a grid with
 * {@link applyMatrixLive}.
 *
 * @example
 * ```typescript
 * const iPoint = new MovablePoint(scene, { point: [1, 0, 0] });
 * const jPoint = new MovablePoint(scene, { point: [0, 1, 0] });
 * const tracker = MatrixTracker.fromBasisVectors(iPoint, jPoint);
 * applyMatrixLive(plane, tracker, { onChange: () => scene.render() });
 * ```
 */
export class MatrixTracker {
  private _matrix: Matrix2x2;
  private _compute: (() => Matrix2x2) | null;

  /**
   * Create a tracker holding a fixed matrix.
   * @param matrix - The initial matrix. Default: the identity.
   */
  constructor(matrix: Matrix2x2 = identityMatrix()) {
    this._matrix = cloneMatrix(matrix);
    this._compute = null;
  }

  /**
   * Get the current matrix as a fresh copy.
   * @returns The current matrix.
   */
  getMatrix(): Matrix2x2 {
    return cloneMatrix(this._compute ? this._compute() : this._matrix);
  }

  /**
   * Set the matrix directly, dropping any getter source.
   * @param matrix - The new matrix.
   * @returns this for chaining.
   */
  setMatrix(matrix: Matrix2x2): this {
    this._compute = null;
    this._matrix = cloneMatrix(matrix);
    return this;
  }

  /**
   * Set the matrix from its two column basis vectors.
   * @param i - The image of the x basis vector, `(a, c)`.
   * @param j - The image of the y basis vector, `(b, d)`.
   * @returns this for chaining.
   */
  setColumns(i: readonly [number, number], j: readonly [number, number]): this {
    return this.setMatrix([
      [i[0], j[0]],
      [i[1], j[1]],
    ]);
  }

  /**
   * Get the two column basis vectors `[i, j]` of the current matrix.
   * @returns `[i, j]` where `i = (a, c)` and `j = (b, d)`.
   */
  getColumns(): [[number, number], [number, number]] {
    const m = this.getMatrix();
    return [
      [m[0][0], m[1][0]],
      [m[0][1], m[1][1]],
    ];
  }

  /**
   * Map a 2D point by the current matrix (about the origin).
   * @param point - The point `[x, y]` to transform.
   * @returns The transformed point `[x', y']`.
   */
  transformPoint(point: readonly [number, number]): [number, number] {
    const m = this.getMatrix();
    return [m[0][0] * point[0] + m[0][1] * point[1], m[1][0] * point[0] + m[1][1] * point[1]];
  }

  /**
   * Create a tracker whose matrix is recomputed from a getter on every read.
   * @param getter - Returns the current matrix.
   * @returns A new MatrixTracker.
   */
  static fromGetter(getter: () => Matrix2x2): MatrixTracker {
    const tracker = new MatrixTracker();
    tracker._compute = getter;
    return tracker;
  }

  /**
   * Create a tracker whose matrix is built live from two basis-vector sources.
   * The columns follow the sources, so dragging a {@link MovablePoint} drives
   * the matrix in real time.
   * @param iSource - Source of the x basis vector image (first column).
   * @param jSource - Source of the y basis vector image (second column).
   * @returns A new MatrixTracker.
   */
  static fromBasisVectors(iSource: BasisVectorSource, jSource: BasisVectorSource): MatrixTracker {
    return MatrixTracker.fromGetter(() => {
      const i = readBasisVector(iSource);
      const j = readBasisVector(jSource);
      return [
        [i[0], j[0]],
        [i[1], j[1]],
      ];
    });
  }
}

/**
 * Factory for a {@link MatrixTracker}.
 * @param matrix - The initial matrix. Default: the identity.
 * @returns A new MatrixTracker.
 */
export function makeMatrixTracker(matrix?: Matrix2x2): MatrixTracker {
  return new MatrixTracker(matrix);
}

/** Normalize any {@link MatrixSource} to a {@link MatrixTracker}. */
function toTracker(source: MatrixSource): MatrixTracker {
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
 * Bind a mobject to a live 2x2 matrix so it morphs continuously.
 *
 * Every VMobject leaf in `target`'s family is snapshotted at bind time. An
 * updater is added to `target`; each frame it re-maps every snapshotted point
 * by the current matrix (about `aboutPoint`) and moves any dependent points.
 * Because the re-map always starts from the snapshot, the transform is absolute
 * and free of per-frame drift — a collapsed (singular) matrix is just a flat
 * grid, with full recovery on the next frame.
 *
 * The one-shot `applyMatrix` is untouched; this is the additive live mode.
 *
 * @param target - The grid/plane/mobject to morph (e.g. a `NumberPlane`).
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
 * ```
 */
export function applyMatrixLive(
  target: Mobject,
  matrix: MatrixSource,
  options: DynamicMatrixOptions = {},
): LiveMatrixBinding {
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

  const remap = (): void => {
    const m = tracker.getMatrix();
    for (const snap of snapshots) {
      snap.node.setPoints(snap.points.map((p) => transformPointByMatrix(p, m, aboutPoint)));
    }
    for (const dep of dependents) {
      const mapped = transformPointByMatrix([...dep.base], m, aboutPoint);
      dep.mobject.moveTo([mapped[0], mapped[1], mapped[2]]);
    }
    onChange?.(m);
  };

  const updater: UpdaterFunction = () => remap();
  target.addUpdater(updater);
  remap();

  const binding: LiveMatrixBinding = {
    tracker,
    getMatrix: () => tracker.getMatrix(),
    setMatrix: (m: Matrix2x2) => {
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
