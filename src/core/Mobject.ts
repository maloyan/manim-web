/* eslint-disable max-lines */
import * as THREE from 'three';
import {
  type Vector3Tuple,
  type MobjectStyle,
  type AxisOrOptions,
  UP,
  DOWN,
  LEFT,
  RIGHT,
} from './MobjectTypes';
import {
  getCenterImpl,
  getBoundingBoxImpl,
  getEdgeInDirectionImpl,
  toEdgeImpl,
} from './MobjectPositioning';
import typia from 'typia';
import {
  saveMobjectStateImpl,
  restoreMobjectStateImpl,
  becomeMobjectImpl,
  replaceMobjectImpl,
  applyFunctionImpl,
  applyMatrixImpl,
  prepareForNonlinearTransformImpl,
  resolveExtremalPoint,
} from './MobjectState';
// AnimateProxy registers itself here to break the circular dependency:
// Mobject -> AnimateProxy -> Transform -> VGroup -> Mobject
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let animateProxyFactory: ((mobject: Mobject) => any) | null = null;

const SCRATCH_QUAT = new THREE.Quaternion();

/** @internal Called by AnimateProxy module to register the factory. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAnimateProxy(factory: (mobject: Mobject) => any): void {
  animateProxyFactory = factory;
}

// Re-export everything from MobjectTypes so existing imports from './Mobject' continue to work
export {
  type Vector3Tuple,
  type MobjectStyle,
  type MobjectLike,
  type VMobjectLike,
  type AxisOrOptions,
  isVMobjectLike,
  UP,
  DOWN,
  LEFT,
  RIGHT,
  OUT,
  IN,
  ORIGIN,
  UL,
  UR,
  DL,
  DR,
} from './MobjectTypes';

/**
 * Updater function type that runs every frame.
 * Defined here (not in MobjectTypes) to reference the concrete Mobject class
 * without introducing a circular import.
 * @param mobject - The mobject being updated
 * @param dt - Delta time in seconds since last frame
 */
export type UpdaterFunction = (mobject: Mobject, dt: number) => void;

/** Base mathematical object class. All visible objects in manimweb inherit from this class. */
export abstract class Mobject {
  readonly id: string;
  parent: Mobject | null = null;
  children: Mobject[] = [];
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scaleVector: THREE.Vector3;
  createdAtBeginning: boolean = false;
  protected _color: string = '#ffffff';
  get color(): string {
    return this._color;
  }
  set color(value: string) {
    this._color = value;
    if (this._style) {
      this._style.strokeColor = value;
      this._style.fillColor = value;
    }
  }
  protected _opacity: number = 1;
  strokeWidth: number = 4;
  fillOpacity: number = 0;
  /** When true, children skip the 2D z-layering offset in _syncToThree. */
  protected _disableChildZLayering: boolean = false;
  protected _style: MobjectStyle;
  _threeObject: THREE.Object3D | null = null;
  /**
   * THREE backing object needs re-sync from this node's transform/state.
   * @inv this._dirty || child._dirty === false  // a clean node has a clean subtree
   *
   * This invariant is what makes the early-return in _syncToThree() and the
   * root-sync in _syncWorldMatrices() correct. It holds because _markDirty()
   * always propagates upward. Marking a node dirty WITHOUT marking its ancestors
   * (e.g. reverting _markDirty to self-only) silently breaks it: a clean ancestor
   * will short-circuit the sync and never reach the dirty descendant, leaving
   * stale world coordinates (issue #251).
   */
  _dirty: boolean = true;
  _isVMobject: boolean = false;
  private _updaters: UpdaterFunction[] = [];
  /** Saved mobject copy (used by Restore animation). Set by saveState(). */
  savedState: Mobject | null = null;
  /** Target copy used by generateTarget() / MoveToTarget animation. */
  targetCopy: Mobject | null = null;
  /** JSON-serializable saved state (used by restoreState()). */
  __savedMobjectState: unknown = null;
  private static _idCounter: number = 0;

  constructor() {
    this.id = `mobject_${Mobject._idCounter++}`;
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'XYZ');
    this.scaleVector = new THREE.Vector3(1, 1, 1);
    this._style = {
      fillColor: '#ffffff',
      fillOpacity: 0,
      strokeColor: '#ffffff',
      strokeOpacity: 1,
      strokeWidth: 4,
    };
  }

  // ── Opacity & Style ──────────────────────────────────────────────

  get opacity(): number {
    return this._opacity;
  }

  set opacity(value: number) {
    this.setStrokeOpacity(value);
  }

  get style(): MobjectStyle {
    return { ...this._style };
  }

  setStyle(style: Partial<MobjectStyle>): this {
    this._style = { ...this._style, ...style };
    if (style.strokeColor !== undefined) this.color = style.strokeColor;
    if (style.fillOpacity !== undefined) this.fillOpacity = style.fillOpacity;
    if (style.strokeOpacity !== undefined) this._opacity = style.strokeOpacity;
    if (style.strokeWidth !== undefined) this.strokeWidth = style.strokeWidth;
    this._markDirty();
    return this;
  }

  get submobjects(): Mobject[] {
    return [...this.children];
  }

  setColor(color: string): this {
    if (this._color !== color) {
      this.color = color;
      this._markDirty();
    }
    return this;
  }

  setStrokeOpacity(opacity: number): this {
    const v = Math.max(0, Math.min(1, opacity));
    if (this._opacity !== v) {
      this._opacity = v;
      this._style.strokeOpacity = v;
      this._markDirty();
    }
    return this;
  }

  setStrokeWidth(width: number): this {
    const v = Math.max(0, width);
    if (this.strokeWidth !== v) {
      this.strokeWidth = v;
      this._style.strokeWidth = v;
      this._markDirty();
    }
    return this;
  }

  setFillOpacity(opacity: number): this {
    const v = Math.max(0, Math.min(1, opacity));
    if (this.fillOpacity !== v) {
      this.fillOpacity = v;
      this._style.fillOpacity = v;
      this._markDirty();
    }
    return this;
  }

  setFill(color?: string, opacity?: number): this {
    if (color !== undefined) this.fillColor = color;
    if (opacity !== undefined) this.setFillOpacity(opacity);
    return this;
  }

  get fillColor(): string | undefined {
    return this._style.fillColor;
  }

  set fillColor(color: string) {
    if (this._style.fillColor !== color) {
      this._style.fillColor = color;
      this._markDirty();
    }
  }

  get strokeColor(): string | undefined {
    return this._style.strokeColor;
  }

  set strokeColor(color: string) {
    if (this._style.strokeColor !== color) {
      this._style.strokeColor = color;
      this._markDirty();
    }
  }

  // ── Transform Methods ────────────────────────────────────────────

  shift(delta: Vector3Tuple): this {
    this.position.x += delta[0];
    this.position.y += delta[1];
    this.position.z += delta[2];
    this._markDirty();
    return this;
  }

  /**
   * Move to target position in world space.
   *
   * Computes the delta from the current world-space center, converts it into this
   * node's parent-local frame (the frame `shift()`/`position` live in), and applies
   * it so the world-space center lands on the target. The parent-local conversion
   * is what makes this correct when the node is parented under a scaled/rotated
   * parent — a raw world delta fed to shift() would be scaled/rotated by the parent.
   * For an unparented node the conversion is the identity, so behavior is unchanged.
   *
   * @post result world center === target (within the parent's representable frame)
   * @pre  !this.isEmpty()
   *       if needed (e.g., VGroup).
   */
  moveTo(target: Vector3Tuple | Mobject, alignedEdge?: Vector3Tuple): this {
    // 1. Get current center in WORLD space
    const currentCenter = this.getCenter();

    // 2. Resolve target to world-space position
    let targetPos: Vector3Tuple;
    if (Array.isArray(target)) {
      targetPos = target;
    } else {
      targetPos = target.getCenter();
    }

    // 3. Handle edge alignment (same delta math, world space)
    if (alignedEdge) {
      // A raw point has no extent, so its edge is the point itself.
      const targetEdge = Array.isArray(target) ? target : target._getEdgeInDirection(alignedEdge);
      const thisEdge = this._getEdgeInDirection(alignedEdge);
      targetPos = [
        targetEdge[0] - thisEdge[0] + currentCenter[0],
        targetEdge[1] - thisEdge[1] + currentCenter[1],
        targetEdge[2] - thisEdge[2] + currentCenter[2],
      ];
    }

    // 4. Convert both endpoints into the parent-local frame and take their
    // difference. The translation parts cancel, leaving the world delta mapped
    // through the parent's inverse linear transform — exactly the parent-local
    // delta that shift() must apply for the world center to land on targetPos.
    const targetLocal = this._worldToParentLocal(targetPos);
    const currentLocal = this._worldToParentLocal(currentCenter);
    const delta: Vector3Tuple = [
      targetLocal[0] - currentLocal[0],
      targetLocal[1] - currentLocal[1],
      targetLocal[2] - currentLocal[2],
    ];

    // 5. Apply shift (preserves world-space positions)
    this.shift(delta);

    this._markDirty();
    return this;
  }

  /**
   * Rotate the mobject by angle around an axis.
   * Accepts aboutPoint or aboutEdge to specify the rotation center.
   */
  rotate(angle: number, axisOrOptions?: Vector3Tuple | AxisOrOptions): this {
    if (typeof angle !== 'number') {
      throw new TypeError('Mobject.rotate: angle must be a number');
    }

    if (axisOrOptions !== undefined) {
      if (Array.isArray(axisOrOptions)) {
        typia.assert<Vector3Tuple>(axisOrOptions);
      } else {
        typia.assert<AxisOrOptions>(axisOrOptions);
        const resolved = resolveExtremalPoint(this, axisOrOptions);
        if (resolved) {
          axisOrOptions = { axis: axisOrOptions.axis, aboutPoint: resolved };
        }
      }
    }
    let axis: Vector3Tuple = [0, 0, 1];
    let aboutPoint: Vector3Tuple | undefined;

    if (axisOrOptions) {
      if (Array.isArray(axisOrOptions)) {
        axis = axisOrOptions;
      } else {
        axis = axisOrOptions.axis ?? [0, 0, 1];
        aboutPoint = axisOrOptions.aboutPoint;
      }
    }

    // Deferred-transform semantics: update node transform only.
    // aboutPoint is WORLD-space; default to the object's world-space center.
    const pivotWorld: Vector3Tuple = aboutPoint ?? this.getCenter();
    this._rotateAboutParentLocalPoint(angle, axis, this._worldToParentLocal(pivotWorld));
    return this;
  }

  rotateAboutOrigin(angle: number, axis: Vector3Tuple = [0, 0, 1]): this {
    return this.rotate(angle, { axis, aboutPoint: [0, 0, 0] });
  }

  /**
   * Rotate about a pivot expressed in this node's PARENT-local frame
   * (the same frame as `this.position`). No world-space conversion is done.
   *
   * @pre  pivotLocal is in the same frame as this.position (parent-local)
   * @post the parent-local pivot point is fixed; this.position rotates about it
   * @post this.rotation === old.rotation composed with the requested rotation
   */
  protected _rotateAboutParentLocalPoint(
    angle: number,
    axis: Vector3Tuple,
    pivotLocal: Vector3Tuple,
  ): void {
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(axis[0], axis[1], axis[2]).normalize(),
      angle,
    );

    const rel = new THREE.Vector3(
      this.position.x - pivotLocal[0],
      this.position.y - pivotLocal[1],
      this.position.z - pivotLocal[2],
    ).applyQuaternion(q);

    this.position.set(pivotLocal[0] + rel.x, pivotLocal[1] + rel.y, pivotLocal[2] + rel.z);

    const current = new THREE.Quaternion().setFromEuler(this.rotation);
    current.multiply(q);
    this.rotation.setFromQuaternion(current);

    this._markDirty();
  }

  /**
   * Convert a WORLD-space point into this node's parent-local frame —
   * the frame in which `this.position` is expressed.
   *
   * @post this.parent === null => result === p
   * @post this.parent !== null => result === parent._computeWorldMatrix().invert() * p
   */
  protected _worldToParentLocal(p: Vector3Tuple): Vector3Tuple {
    if (!this.parent) return p;
    const invParent = this.parent._computeWorldMatrix().clone().invert();
    const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(invParent);
    return [v.x, v.y, v.z];
  }

  /**
   * Convert a point expressed in this node's parent-local frame (the frame of
   * `this.position`) into WORLD space — the inverse of {@link _worldToParentLocal}.
   *
   * @post this.parent === null => result === p
   * @post this.parent !== null => result === parent._computeWorldMatrix() * p
   */
  protected _parentLocalToWorld(p: Vector3Tuple): Vector3Tuple {
    if (!this.parent) return p;
    const parentWorld = this.parent._computeWorldMatrix();
    const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(parentWorld);
    return [v.x, v.y, v.z];
  }

  flip(
    axis: Vector3Tuple = [1, 0, 0],
    options?: { aboutPoint?: Vector3Tuple; aboutEdge?: Vector3Tuple },
  ): this {
    const aboutPt = resolveExtremalPoint(this, options);
    if (aboutPt) {
      applyFunctionImpl(
        this,
        (p) => {
          return [
            axis[0] !== 0 ? -p[0] : p[0],
            axis[1] !== 0 ? -p[1] : p[1],
            axis[2] !== 0 ? -p[2] : p[2],
          ];
        },
        { aboutPoint: aboutPt },
      );
      return this;
    }
    if (axis[0] !== 0) this.scaleVector.x *= -1;
    if (axis[1] !== 0) this.scaleVector.y *= -1;
    if (axis[2] !== 0) this.scaleVector.z *= -1;
    this._markDirty();
    return this;
  }

  scale(
    factor: number | Vector3Tuple,
    options?: { aboutPoint?: Vector3Tuple; aboutEdge?: Vector3Tuple },
  ): this {
    const sx = typeof factor === 'number' ? factor : factor[0];
    const sy = typeof factor === 'number' ? factor : factor[1];
    const sz = typeof factor === 'number' ? factor : factor[2] === 0 ? 1 : factor[2];

    // Apply scale in deferred-transform space.
    this.scaleVector.x *= sx;
    this.scaleVector.y *= sy;
    this.scaleVector.z *= sz;

    // aboutPoint/aboutEdge are WORLD-space anchors.
    // position is parent-local, so convert anchor into parent-local space first.
    // When no explicit anchor is given, scale about the current position — this
    // avoids calling getCenter() (which needs a synced Three.js tree) and is
    // correct: scaling about self means position stays unchanged.
    const explicitAnchor = resolveExtremalPoint(this, options);
    const anchorLocal = explicitAnchor
      ? this._worldToParentLocal(explicitAnchor)
      : [this.position.x, this.position.y, this.position.z];

    this.position.x = anchorLocal[0] + sx * (this.position.x - anchorLocal[0]);
    this.position.y = anchorLocal[1] + sy * (this.position.y - anchorLocal[1]);
    this.position.z = anchorLocal[2] + sz * (this.position.z - anchorLocal[2]);

    this._markDirty();
    return this;
  }

  stretch(
    factor: number,
    dim: number,
    options?: { aboutPoint?: Vector3Tuple; aboutEdge?: Vector3Tuple },
  ): this {
    if (dim < 0 || dim > 2 || !Number.isInteger(dim)) {
      throw new Error(`stretch dim must be 0, 1, or 2, got ${dim}`);
    }
    if (options?.aboutPoint || options?.aboutEdge) {
      throw new Error(
        'Mobject.stretch(): aboutPoint/aboutEdge is not supported in deferred-transform mode. Use applyFunction/applyMatrix or normalize first.',
      );
    }
    const scaleFactors: Vector3Tuple = [1, 1, 1];
    scaleFactors[dim] = factor;
    return this.scale(scaleFactors);
  }

  // ── Hierarchy ────────────────────────────────────────────────────

  add(...mobjects: Mobject[]): this {
    for (const child of mobjects) {
      if (child.parent) child.parent.remove(child);
      child.parent = this;
      this.children.push(child);
      if (this._threeObject) {
        const ct = child.getThreeObject();
        if (!this._threeObject.children.includes(ct)) this._threeObject.add(ct);
      }
    }
    // Mark upward: the new child (and its subtree) must be reachable by a root sync.
    this._markDirty();
    return this;
  }

  remove(...mobjects: Mobject[]): this {
    for (const child of mobjects) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parent = null;
        if (this._threeObject && child._threeObject) {
          this._threeObject.remove(child._threeObject);
        }
      }
    }
    this._markDirty();
    return this;
  }

  // ── Copy / Become / Replace ──────────────────────────────────────

  /**
   * Check if this mobject's transform is normalized (rotation=0, scale=1).
   * @post result === (rotation.x==0 && rotation.y==0 && rotation.z==0 && scaleVector===[1,1,1])
   */
  isTransformNormalized(): boolean {
    return (
      this.rotation.x === 0 &&
      this.rotation.y === 0 &&
      this.rotation.z === 0 &&
      this.scaleVector.x === 1 &&
      this.scaleVector.y === 1 &&
      this.scaleVector.z === 1
    );
  }

  /**
   * Copy position, color, standard properties, and optionally children onto `clone`.
   * Every copy() implementation MUST call this to preserve position/color/opacity/style/etc.
   *
   * @post old.getPoints()[i] === this.getPoints()[i]  // reads the source, writes only `clone`
   * @internal Convention: forgetting this call silently loses position/color/style.
   */
  protected _copyBaseAttributesInto(
    clone: Mobject,
    options?: { copyChildren?: boolean; copyPosition?: boolean },
  ): void {
    // `clone` must be a fresh, distinct instance. Passing `this` makes the
    // child-copy loop below iterate this.children while pushing onto it — an
    // infinite loop that allocates until the heap is exhausted. Fail fast.
    if (clone === this) {
      throw new Error(
        `${this.constructor.name}._copyBaseAttributesInto(): clone must be a distinct instance, not the source itself.`,
      );
    }

    const copyPosition = options?.copyPosition ?? true;
    const copyChildren = options?.copyChildren ?? true;
    if (copyPosition) {
      clone.position.copy(this.position);
    }
    clone.rotation.copy(this.rotation);
    clone.scaleVector.copy(this.scaleVector);
    clone.color = this.color;
    clone._opacity = this._opacity;
    clone.strokeWidth = this.strokeWidth;
    clone.fillOpacity = this.fillOpacity;
    clone._style = { ...this._style };

    if (copyChildren) {
      // Snapshot the source list: copying onto `clone` may mutate a shared
      // array in edge cases, and a snapshot guarantees this loop terminates.
      for (const child of [...this.children]) {
        clone.add(child.copy());
      }
    }
  }

  /**
   * Deep-copy this mobject: position, color, and (for composites) children.
   * Every concrete subclass MUST implement copy() with its own return type.
   * Call {@link _copyBaseAttributesInto} to handle standard properties.
   *
   * Leaf classes: construct new instance, call helper, return.
   * Self-building composites: construct new instance (rebuilds children), call helper, return.
   * Point-morphing classes: construct, call helper, overwrite _points3D, return.
   *
   * copy() is a LOCAL structural clone: it reproduces this node's own
   * position/rotation/scale (parent-relative) and deep-copies children. It does
   * NOT fold in ancestor transforms — a clone of a node nested under a
   * transformed group carries only the local transform. To get a world-correct
   * clone, normalizeTransform() the tree first (folding ancestors into absolute
   * geometry) so that local === world, then copy. This is why animations flatten
   * with normalizeTransform() before snapshotting via copy().
   *
   * @post typeof result === typeof this  (strongly typed, no casts)
   * @post old.getPoints()[i] === this.getPoints()[i]  // source is never mutated
   */
  abstract copy(): Mobject;

  become(other: Mobject): this {
    becomeMobjectImpl(this, other);
    return this;
  }

  replace(target: Mobject, stretch: boolean = false): this {
    replaceMobjectImpl(this, target, stretch);
    return this;
  }

  // ── Positioning & Bounding Box ───────────────────────────────────

  // Note: center semantics may evolve as coordinate-frame behavior
  // is unified across mobject families.

  /**
   * Whether this mobject has no renderable geometry.
   * Base default is conservative: non-empty unless specialized subclasses decide otherwise.
   */
  isEmpty(): boolean {
    return false;
  }

  /**
   * Get center in world coordinates.
   *
   * @post this.isEmpty() => result === this._parentLocalToWorld([position.x, position.y, position.z])
   * @post !this.isEmpty() => result[i] === (worldBbox.min[i] + worldBbox.max[i]) / 2
   */
  getCenter(): Vector3Tuple {
    // No geometry to bound: fall back to this node's own world position. position
    // is parent-local, so lift it to world to stay consistent with the bbox branch.
    if (this.isEmpty()) {
      return this._parentLocalToWorld([this.position.x, this.position.y, this.position.z]);
    }
    return getCenterImpl(this);
  }

  /**
   * Get center of mass in world coordinates by averaging all world-space points.
   *
   * Unlike {@link getCenter} (which uses bbox midpoint), this is the true
   * centroid — equal to getCenter() only when points are symmetrically distributed.
   */
  centerOfMass(): Vector3Tuple {
    const pts = (this as unknown as { getPoints?: () => number[][] }).getPoints?.() ?? [];
    if (pts.length === 0) return this.getCenter();
    let sx = 0,
      sy = 0,
      sz = 0;
    for (const p of pts) {
      sx += p[0];
      sy += p[1];
      sz += p[2];
    }
    const n = pts.length;
    return [sx / n, sy / n, sz / n];
  }

  /**
   * Get center in this mobject's parent coordinate frame.
   *
   * Includes this node's own local transform, excludes ancestor transforms.
   *
   * @post this.parent === null => result === this.getCenter()
   * @post this.parent !== null => result === parent._computeWorldMatrix().invert() * this.getCenter()
   */
  getLocalCenter(): Vector3Tuple {
    if (this.isEmpty()) {
      return [this.position.x, this.position.y, this.position.z];
    }

    return this._worldToParentLocal(this.getCenter());
  }

  /**
   * @pre !this.isEmpty()
   * @post result.min <= result.max component-wise
   */
  /**
   * Refresh the THREE world matrices so a geometry query reads current
   * transforms, and return the backing object. World coordinates depend on
   * every ancestor's transform, so we sync from the root (the dirty invariant —
   * see _markDirty — lets the recursion skip clean subtrees). _syncToThree only
   * copies locals onto the THREE objects; setFromObject won't walk up to refresh
   * matrixWorld, so we flush ancestors (true) and descendants (true) here.
   * Shared by getBounds() and getBoundingBox() so both stay consistent.
   */
  _syncWorldMatrices(): THREE.Object3D {
    this._root()._syncToThree();
    const obj = this.getThreeObject();
    obj.updateWorldMatrix(true, true);
    return obj;
  }

  /**
   * World-space axis-aligned bounding box.
   *
   * Uses Box3.setFromObject() via the Three.js subtree. This works for all
   * standard geometry types without a renderer. VMobject overrides this with
   * point math because Line2's LineGeometry is incompatible with
   * Box3.setFromObject() — see PointBounds.ts for the full explanation.
   *
   * @pre !this.isEmpty()
   * @post result.min <= result.max component-wise
   */
  getBounds(): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } {
    const obj = this._syncWorldMatrices();
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) {
      throw new Error(
        `Mobject.getBounds(): ${this.constructor.name} (${this.id}) produced empty Three.js bounds.`,
      );
    }
    return {
      min: { x: box.min.x, y: box.min.y, z: box.min.z },
      max: { x: box.max.x, y: box.max.y, z: box.max.z },
    };
  }

  nextTo(
    target: Mobject | Vector3Tuple,
    direction: Vector3Tuple = RIGHT,
    buff: number = 0.25,
  ): this {
    const tPt = Array.isArray(target) ? target : target.getCenter();
    const sEdge = this._getEdgeInDirection([-direction[0], -direction[1], -direction[2]]);
    const tEdge = Array.isArray(target) ? tPt : target._getEdgeInDirection(direction);
    const len = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2) || 1;
    const n: Vector3Tuple = [direction[0] / len, direction[1] / len, direction[2] / len];
    return this.shift([
      tEdge[0] + n[0] * buff - sEdge[0],
      tEdge[1] + n[1] * buff - sEdge[1],
      tEdge[2] + n[2] * buff - sEdge[2],
    ]);
  }

  alignTo(target: Mobject | Vector3Tuple, direction: Vector3Tuple): this {
    const tp = Array.isArray(target) ? target : target._getEdgeInDirection(direction);
    const sp = this._getEdgeInDirection(direction);
    return this.shift([
      direction[0] !== 0 ? tp[0] - sp[0] : 0,
      direction[1] !== 0 ? tp[1] - sp[1] : 0,
      direction[2] !== 0 ? tp[2] - sp[2] : 0,
    ]);
  }

  moveToAligned(target: Mobject | Vector3Tuple, alignedEdge?: Vector3Tuple): this {
    if (alignedEdge) return this.alignTo(target, alignedEdge);
    return this.moveTo(Array.isArray(target) ? target : target.getCenter());
  }

  /** @returns World-space edge position (center + half-bounding-box offset). */
  _getEdgeInDirection(direction: Vector3Tuple): Vector3Tuple {
    return getEdgeInDirectionImpl(this, direction);
  }
  getBoundingBox(): { width: number; height: number; depth: number } {
    return getBoundingBoxImpl(this);
  }
  getWidth(): number {
    return this.getBoundingBox().width;
  }
  getHeight(): number {
    return this.getBoundingBox().height;
  }
  /** @deprecated Use getBoundingBox() instead. */
  _getBoundingBox(): { width: number; height: number; depth: number } {
    return this.getBoundingBox();
  }
  getEdge(direction: Vector3Tuple): Vector3Tuple {
    return this._getEdgeInDirection(direction);
  }
  getTop(): Vector3Tuple {
    return this._getEdgeInDirection(UP);
  }
  getBottom(): Vector3Tuple {
    return this._getEdgeInDirection(DOWN);
  }
  getLeft(): Vector3Tuple {
    return this._getEdgeInDirection(LEFT);
  }
  getRight(): Vector3Tuple {
    return this._getEdgeInDirection(RIGHT);
  }
  setX(x: number): this {
    const c = this.getCenter();
    return this.shift([x - c[0], 0, 0]);
  }
  setY(y: number): this {
    const c = this.getCenter();
    return this.shift([0, y - c[1], 0]);
  }
  setZ(z: number): this {
    const c = this.getCenter();
    return this.shift([0, 0, z - c[2]]);
  }
  center(): this {
    return this.moveTo([0, 0, 0]);
  }

  // ── Animate Proxy ────────────────────────────────────────────────

  /**
   * Returns an AnimateProxy that records method calls.
   * Pass the proxy to `scene.play()` to animate from the current state
   * to the state after all recorded calls are applied.
   *
   * @example
   * ```typescript
   * scene.play(circle.animate.shift([2, 0, 0]));
   * scene.play(circle.animate.setColor('#ff0000').scale(2));
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get animate(): any {
    if (!animateProxyFactory) {
      throw new Error('AnimateProxy not registered. Ensure AnimateProxy module is imported.');
    }
    return animateProxyFactory(this);
  }

  toEdge(direction: Vector3Tuple, buff: number = 0.5, frameDimensions?: [number, number]): this {
    toEdgeImpl(this, direction, buff, frameDimensions);
    return this;
  }

  toCorner(
    direction: Vector3Tuple = [1, 1, 0],
    buff: number = 0.5,
    frameDimensions?: [number, number],
  ): this {
    return this.toEdge(direction, buff, frameDimensions);
  }

  // ── Three.js Sync ────────────────────────────────────────────────

  /**
   * Flatten this mobject's transform into its canonical, absolute representation.
   *
   * Bakes `worldMatrix` into the node's own geometry, recurses so every
   * descendant is expressed in the same frame, then resets the local transform
   * to identity. Called with no argument it seeds with this node's OWN matrix,
   * so bake-then-reset preserves world appearance whether or not the node has
   * ancestors — the ancestors keep their transforms and still apply. The
   * recursion (and a detached-clone caller) passes an explicit accumulated matrix.
   *
   * Implemented per family rather than via a hook so the compiler forces every
   * geometry-owning subclass to declare how it flattens: containers reset to
   * identity (geometry lives in children), point-based mobjects bake `worldMatrix`
   * into their points, and Three.js meshes — which cannot bake into points —
   * absolutize their local transform instead (see {@link _flattenAsMesh}).
   *
   * @post old.getPoints()[i] === this.getPoints()[i]  // world geometry preserved, every descendant
   * @post this._computeOwnMatrix() === Identity        // container/point nodes; meshes: own === worldMatrix
   */
  abstract normalizeTransform(worldMatrix?: THREE.Matrix4): this;

  /**
   * Recurse `normalizeTransform` into children, composing each child's own
   * matrix onto `worldMatrix` so every descendant flattens into the same frame.
   */
  protected _normalizeChildrenInto(worldMatrix: THREE.Matrix4): void {
    for (const child of this.children) {
      child.normalizeTransform(worldMatrix.clone().multiply(child._computeOwnMatrix()));
    }
  }

  /**
   * Flatten a node whose geometry is fully described by its children (or which
   * has no own geometry): recurse into children, then reset own transform to
   * identity. The transform is not lost — it was folded into the descendants via
   * the composed `worldMatrix`.
   */
  protected _flattenAsContainer(worldMatrix: THREE.Matrix4): this {
    this._normalizeChildrenInto(worldMatrix);
    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.scaleVector.set(1, 1, 1);
    this._markDirty();
    return this;
  }

  /**
   * Flatten a Three.js-mesh node that cannot bake geometry into points:
   * absolutize by setting the local transform equal to `worldMatrix`, so it
   * renders correctly once its (now identity) ancestors collapse. A mesh is a
   * flattening barrier — its descendants stay relative to it.
   */
  protected _flattenAsMesh(worldMatrix: THREE.Matrix4): this {
    worldMatrix.decompose(this.position, SCRATCH_QUAT, this.scaleVector);
    this.rotation.setFromQuaternion(SCRATCH_QUAT);
    this._markDirty();
    return this;
  }

  _syncToThree(): void {
    // Safe to skip the whole subtree only because of the _dirty invariant
    // (clean node ⇒ clean subtree); see the _dirty field doc.
    if (!this._dirty) return;
    if (!this._threeObject) this._threeObject = this._createThreeObject();
    this._threeObject.position.copy(this.position);
    this._threeObject.rotation.copy(this.rotation);
    this._threeObject.scale.copy(this.scaleVector);
    if (this.parent && !this.parent._disableChildZLayering) {
      const idx = this.parent.children.indexOf(this);
      if (idx > 0) this._threeObject.position.z += idx * 0.01;
    }
    this._syncMaterialToThree();
    for (const child of this.children) {
      child._syncToThree();
      if (child._threeObject && !this._threeObject.children.includes(child._threeObject)) {
        this._threeObject.add(child._threeObject);
      }
    }
    this._dirty = false;
  }

  protected _syncMaterialToThree(): void {}

  /**
   * Mark this node's render/transform state stale and propagate the flag to the
   * root. World-space geometry of any node depends on its ancestors' transforms,
   * so a change anywhere must invalidate the whole ancestor chain; the invariant
   * "a clean node has a clean subtree" then lets _syncToThree()/root-sync skip
   * untouched branches safely.
   * @post this._dirty && (this.parent => this.parent._dirty)
   */
  _markDirty(): void {
    if (this._dirty) return;
    this._dirty = true;
    if (this.parent) this.parent._markDirty();
  }

  /**
   * Alias for {@link _markDirty}. Retained as the single override point for
   * subclasses (e.g. VMobject) that must also invalidate baked geometry when a
   * mutation propagates upward; transform-only changes call _markDirty() directly.
   */
  _markDirtyUpward(): void {
    this._markDirty();
  }

  get isDirty(): boolean {
    return this._dirty;
  }

  /** The topmost ancestor (the node with no parent). */
  _root(): Mobject {
    return this.parent ? this.parent._root() : this;
  }

  getThreeObject(): THREE.Object3D {
    if (!this._threeObject) this._threeObject = this._createThreeObject();
    this._syncToThree();
    return this._threeObject;
  }

  /**
   * Compose this mobject's world matrix by walking the parent chain.
   *
   * Each ancestor's local transform is `T · R · S` (translation × rotation × scale),
   * built via `THREE.Matrix4.compose`; the result is `parent.worldMatrix · localMatrix`.
   *
   * The render-only z-layering offset applied in `_syncToThree`
   * (`idx * 0.01` for non-first children) is intentionally **not** included —
   * it's a 2D display hack, not part of the mathematical world coordinate.
   *
   * @returns A fresh `Matrix4` holding the world transform of this mobject.
   */
  /**
   * This node's transform matrix in isolation — position, rotation, and scale
   * composed together, with no ancestor contribution.
   *
   * @post this.parent === null => this._computeWorldMatrix() === this._computeOwnMatrix()
   * @post this.parent !== null => this._computeWorldMatrix() === this.parent._computeWorldMatrix() * this._computeOwnMatrix()
   */
  _computeOwnMatrix(): THREE.Matrix4 {
    const q = new THREE.Quaternion().setFromEuler(this.rotation);
    return new THREE.Matrix4().compose(this.position, q, this.scaleVector);
  }

  _computeWorldMatrix(): THREE.Matrix4 {
    const matrix = this._computeOwnMatrix();
    for (let ancestor: Mobject | null = this.parent; ancestor; ancestor = ancestor.parent) {
      matrix.premultiply(ancestor._computeOwnMatrix());
    }
    return matrix;
  }

  /**
   * Number of visible display meshes this mobject contributes when rendered.
   * Used for Transform eligibility checks without forcing Three.js object creation.
   */
  getDisplayMeshLength(): number {
    return 0;
  }

  getDisplayMeshes(): THREE.Mesh[] {
    return [];
  }

  protected abstract _createThreeObject(): THREE.Object3D;

  // ── Family & Updaters ────────────────────────────────────────────

  applyToFamily(func: (mobject: Mobject) => void): this {
    func(this);
    for (const child of this.children) child.applyToFamily(func);
    return this;
  }

  getFamily(): Mobject[] {
    const family: Mobject[] = [this];
    for (const child of this.children) family.push(...child.getFamily());
    return family;
  }

  addUpdater(updater: UpdaterFunction, callOnAdd: boolean = false): this {
    this._updaters.push(updater);
    if (callOnAdd) updater(this, 0);
    return this;
  }

  removeUpdater(updater: UpdaterFunction): this {
    const idx = this._updaters.indexOf(updater);
    if (idx !== -1) this._updaters.splice(idx, 1);
    return this;
  }

  clearUpdaters(): this {
    this._updaters = [];
    return this;
  }
  hasUpdaters(): boolean {
    return this._updaters.length > 0;
  }
  getUpdaters(): UpdaterFunction[] {
    return [...this._updaters];
  }

  update(dt: number): void {
    for (const updater of this._updaters) updater(this, dt);
    for (const child of this.children) child.update(dt);
  }

  // ── Point-wise Transforms ────────────────────────────────────────

  /**
   * Apply a function to every descendant's world-space points, about a given point.
   * Recurses the family and delegates to `_applyFunctionAboutPoint` on each node.
   *
   * @pre  fn(pts).length === pts.length
   * @post m.getPoints()[i] === old.m.getPoints().map(p => fn([p - aboutPoint]) + aboutPoint)[i]  // for every descendant m
   */
  applyFunctionAboutPoint(
    fn: (pts: number[][]) => number[][],
    aboutPoint: number[] = [0, 0, 0],
  ): this {
    for (const m of this.getFamily()) {
      m._applyFunctionAboutPoint(fn, aboutPoint);
    }
    return this;
  }

  /**
   * Per-node hook called by `applyFunctionAboutPoint`.
   * @pre  fn(pts).length === pts.length
   * @post getPoints()[i] === fn(old.getPoints())[i]
   * @note no-op in base Mobject; override in subclasses with own points
   */
  protected _applyFunctionAboutPoint(
    _fn: (pts: number[][]) => number[][],
    _aboutPoint: number[],
  ): void {}

  applyFunction(
    fn: (point: number[]) => number[],
    options?: { aboutPoint?: Vector3Tuple; aboutEdge?: Vector3Tuple },
  ): this {
    applyFunctionImpl(this, fn, options);
    return this;
  }

  applyMatrix(
    matrix: number[][],
    options?: { aboutPoint?: Vector3Tuple; aboutEdge?: Vector3Tuple },
  ): this {
    applyMatrixImpl(this, matrix, options);
    return this;
  }

  prepareForNonlinearTransform(numPieces: number = 50): this {
    prepareForNonlinearTransformImpl(this, numPieces);
    return this;
  }

  // ── State Management ─────────────────────────────────────────────

  generateTarget(): Mobject {
    this.targetCopy = this.copy();
    return this.targetCopy;
  }

  saveState(): this {
    saveMobjectStateImpl(this);
    return this;
  }

  restoreState(): boolean {
    return restoreMobjectStateImpl(this);
  }

  // ── Scene context ────────────────────────────────────────────────

  /**
   * Hook for the Scene to propagate renderer dimensions and camera frame
   * width to mobjects that need them (e.g. shader-resolution uniforms).
   * Default is a no-op; subclasses override as needed.
   * @internal
   */
  _setSceneContext(_rendererWidth: number, _rendererHeight: number, _frameWidth: number): void {}

  // ── Cleanup ──────────────────────────────────────────────────────

  dispose(): void {
    for (const child of this.children) child.dispose();
    if (this._threeObject) {
      this._threeObject.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
    }
  }
}
