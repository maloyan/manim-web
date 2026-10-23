import * as THREE from 'three';
import {
  type Vector3Tuple,
  type MobjectStyle,
  type MobjectColorState,
  type MobjectOptions,
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
import { logger } from '../utils/logger';
import { meshMaterial } from './threeMaterial';
import { getActiveTheme } from '../utils/ThemeManager';
import { applyBlendMode, type BlendMode } from '../rendering/blendModes';
import {
  type MaskOptions,
  MASK_RENDER_ORDER,
  applyMaskWriteStencil,
  applyMaskedStencil,
  resetMaskStencil,
} from './Mask';
// Type-only import: erased at compile time, so it introduces no runtime
// circular dependency (Mobject -> AnimateProxy -> Transform -> VGroup -> Mobject).
// Used solely to type `Mobject.animate` and the registered factory.
import type { AnimateProxy } from './AnimateProxy';

// AnimateProxy registers itself here to break the circular dependency:
// Mobject -> AnimateProxy -> Transform -> VGroup -> Mobject
let animateProxyFactory: ((mobject: Mobject) => AnimateProxy) | null = null;

const SCRATCH_QUAT = new THREE.Quaternion();

/** @internal Called by AnimateProxy module to register the factory. */
export function registerAnimateProxy(factory: (mobject: Mobject) => AnimateProxy): void {
  animateProxyFactory = factory;
}

// Re-export everything from MobjectTypes so existing imports from './Mobject' continue to work
export {
  type Vector3Tuple,
  type MobjectStyle,
  type MobjectOptions,
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
  /**
   * User-defined string identifier, separate from the internal `id` uuid.
   * Set it via the constructor option `userId` or {@link setUserId}, then look
   * the mobject up with {@link Scene.getMobject}. Undefined unless the user
   * assigns one; not required to be unique.
   */
  private _userId?: string;
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
  /** Current blend mode for this mobject's own materials (default `normal`). */
  protected _blendMode: BlendMode = 'normal';
  /**
   * Whether a blend mode was ever set on this mobject. While false, the blend
   * step in {@link _syncToThree} is skipped entirely, so unthemed/unblended
   * mobjects never touch material blending state (keeps the default path exact).
   */
  protected _blendModeActive: boolean = false;
  /** When true, children skip the 2D z-layering offset in _syncToThree. */
  protected _disableChildZLayering: boolean = false;
  protected _style: MobjectStyle;
  _threeObject: THREE.Object3D | null = null;
  /**
   * Clip mask shape, or null when this mobject is not masked. When set, this
   * mobject's content is drawn only inside the mask shape's filled region (or
   * outside it when {@link _maskInvert} is true) via a stencil clip. Null keeps
   * the default render path untouched.
   */
  private _maskMobject: Mobject | null = null;
  /** Whether the active mask is inverted (show outside the shape). */
  private _maskInvert: boolean = false;
  /** The mask shape's fillOpacity before masking, restored on {@link clearMask}. */
  private _maskSavedFillOpacity: number | null = null;
  /** Per-frame updater that keeps the mask clip current; removed on clear. */
  private _maskUpdater: UpdaterFunction | null = null;
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

  constructor(options: MobjectOptions = {}) {
    this.id = `mobject_${Mobject._idCounter++}`;
    this._userId = options.userId;
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'XYZ');
    this.scaleVector = new THREE.Vector3(1, 1, 1);
    // Seed default colors from the active theme. The `default` theme reproduces
    // the historical white stroke/fill, so unthemed mobjects are unchanged.
    const theme = getActiveTheme();
    this._color = theme.strokeColor;
    this._style = {
      fillColor: theme.fillColor,
      fillOpacity: 0,
      strokeColor: theme.strokeColor,
      strokeOpacity: 1,
      strokeWidth: 4,
    };
  }

  // ── Identity ─────────────────────────────────────────────────────

  /**
   * The user-defined string identifier, or undefined if none was set.
   * Distinct from the internal {@link id} uuid. Look a mobject up by this
   * value with {@link Scene.getMobject}.
   */
  get userId(): string | undefined {
    return this._userId;
  }

  /**
   * Set the user-defined string identifier used by {@link Scene.getMobject}.
   * Chainable, so it fits factory and loop code: `factory().setUserId('row-3')`.
   * The value need not be unique; the lookup returns the first match.
   * @param userId - The identifier to assign
   */
  setUserId(userId: string): this {
    this._userId = userId;
    return this;
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

  /**
   * Own color fields of this node only (no children). Pair with
   * {@link _setColorState} to save and restore a color without the
   * cascade of `setColor()` on groups.
   * @internal
   */
  _getColorState(): MobjectColorState {
    return {
      color: this._color,
      strokeColor: this._style.strokeColor,
      fillColor: this._style.fillColor,
    };
  }

  /**
   * Restore own color fields saved by {@link _getColorState}. Children keep
   * their colors, unlike `setColor()` on a group.
   * @post this.color === state.color
   * @post this.style.strokeColor === state.strokeColor && this.style.fillColor === state.fillColor
   * @internal
   */
  _setColorState(state: MobjectColorState): void {
    // A leaf goes through its own setColor() first: Text overrides it to
    // redraw its canvas texture, which a plain field write would skip.
    if (this.children.length === 0) this.setColor(state.color);
    this._color = state.color;
    this._style.strokeColor = state.strokeColor;
    this._style.fillColor = state.fillColor;
    this._markDirty();
  }

  /**
   * Set the color of this node only. A leaf uses its own `setColor()` (so
   * Text redraws its texture); a node with children sets its own fields and
   * leaves the children alone, unlike `setColor()` on a group.
   * @post this.color === color
   * @internal
   */
  _setOwnColor(color: string): void {
    if (this.children.length === 0) {
      this.setColor(color);
      return;
    }
    this.color = color;
    this._markDirty();
  }

  // ── Blend mode ───────────────────────────────────────────────────

  /**
   * Set the blend mode for this mobject and its whole family.
   *
   * The mode flows through to every three.js material of this mobject and its
   * submobjects on the next sync. The default is `'normal'` (standard alpha
   * blending), which matches three.js's own default, so output is unchanged
   * until a non-default mode is set.
   *
   * @param mode - One of `normal`, `additive`, `multiply`, `subtractive`, `screen`.
   * @returns this for chaining.
   */
  setBlendMode(mode: BlendMode): this {
    for (const member of this.getFamily()) {
      member._blendMode = mode;
      member._blendModeActive = true;
      member._markDirty();
    }
    return this;
  }

  /** The current blend mode of this mobject. */
  getBlendMode(): BlendMode {
    return this._blendMode;
  }

  /**
   * Apply the current blend mode to this node's own three.js materials.
   *
   * Traverses this mobject's backing object but stops at any submobject's
   * backing object, so each family member owns its own materials (a child with
   * a different blend mode is not clobbered by its parent's traversal).
   */
  protected _applyBlendModeToThree(): void {
    const root = this._threeObject;
    if (!root) return;

    const childRoots = new Set<THREE.Object3D>();
    for (const child of this.children) {
      if (child._threeObject) childRoots.add(child._threeObject);
    }

    const mode = this._blendMode;
    const visit = (object: THREE.Object3D): void => {
      const meshLike: THREE.Object3D & { material?: THREE.Material | THREE.Material[] } = object;
      const material = meshLike.material;
      if (material) {
        if (Array.isArray(material)) {
          for (const m of material) applyBlendMode(m, mode);
        } else {
          applyBlendMode(material, mode);
        }
      }
      for (const nested of object.children) {
        if (!childRoots.has(nested)) visit(nested);
      }
    };
    visit(root);
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

  // ── Clip masking ─────────────────────────────────────────────────

  /**
   * Clip this mobject to a mask shape, like an After-Effects track matte.
   *
   * The mask shape (any VMobject, e.g. a Circle or Rectangle) defines a region
   * by its filled area. After this call, this mobject's content is drawn only
   * where it overlaps the mask shape (or only outside it when `invert` is set).
   * The clip uses the WebGL stencil buffer and updates every frame, so moving or
   * animating the mask shape re-clips the content live. The mask shape itself is
   * never drawn (it is consumed as a matte); its fill is forced opaque so its
   * region is well defined.
   *
   * Opt-in: a mobject with no mask renders exactly as before.
   *
   * @param mask - The shape whose filled region defines the visible area.
   * @param options - {@link MaskOptions}; `invert` shows the content outside the
   *   mask instead of inside.
   * @returns this, for chaining.
   */
  setMask(mask: Mobject, options: MaskOptions = {}): this {
    if (mask === this) {
      logger.warn('Mobject.setMask: a mobject cannot mask itself; ignoring.');
      return this;
    }
    // Replacing an existing mask: restore the previous one first.
    if (this._maskMobject && this._maskMobject !== mask) this.clearMask();

    this._maskMobject = mask;
    this._maskInvert = options.invert ?? false;

    // The mask's filled region defines the visible area, so it must have a
    // fill. Force it opaque (invisible anyway via colorWrite) and remember the
    // original so clearMask can restore it.
    this._maskSavedFillOpacity = mask.fillOpacity;
    if (mask.fillOpacity <= 0) mask.setFillOpacity(1);

    // Drive the clip every frame so animating the mask re-clips live, even
    // when this mobject's own state is unchanged.
    const updater: UpdaterFunction = () => this._applyMaskToThree();
    this._maskUpdater = updater;
    this.addUpdater(updater);

    this._markDirty();
    // Apply immediately so a static (non-animated) scene clips on first render.
    this._applyMaskToThree();
    return this;
  }

  /**
   * Remove the clip mask set by {@link setMask}, restoring the default render
   * path. No-op when this mobject is not masked.
   *
   * @returns this, for chaining.
   */
  clearMask(): this {
    const mask = this._maskMobject;
    if (!mask) return this;

    if (this._maskUpdater) {
      this.removeUpdater(this._maskUpdater);
      this._maskUpdater = null;
    }
    // Detach the mask shape from the scene graph and reset both subtrees.
    const maskObject = mask._threeObject;
    if (maskObject) {
      resetMaskStencil(maskObject);
      maskObject.parent?.remove(maskObject);
    }
    if (this._threeObject) resetMaskStencil(this._threeObject);
    if (this._maskSavedFillOpacity !== null) {
      mask.setFillOpacity(this._maskSavedFillOpacity);
    }

    this._maskMobject = null;
    this._maskInvert = false;
    this._maskSavedFillOpacity = null;
    this._markDirty();
    return this;
  }

  /** The current clip mask shape, or null when this mobject is not masked. */
  getMask(): Mobject | null {
    return this._maskMobject;
  }

  /**
   * Re-apply the stencil clip for the current mask: sync the mask shape, attach
   * it as a sibling of this mobject's backing object so it draws first, write
   * the mask stencil, and set this mobject's content to test against it.
   *
   * Called from {@link _syncToThree}, from the per-frame mask updater, and by
   * the Scene right after this mobject is added. A no-op when unmasked, which
   * keeps the default render path byte-identical.
   * @internal
   */
  _applyMaskToThree(): void {
    const mask = this._maskMobject;
    if (!mask) return;

    // The mask-write flags depend only on the mask shape, so apply them even
    // before this mobject's own backing object exists.
    const maskObject = mask.getThreeObject();
    applyMaskWriteStencil(maskObject, MASK_RENDER_ORDER);

    if (!this._threeObject) return;

    // Draw the mask as a sibling (not a child) so it lives in scene space,
    // unaffected by this mobject's transform, and is not swept up by the
    // Scene's per-subtree renderOrder assignment on the content.
    const parent = this._threeObject.parent;
    if (parent && maskObject.parent !== parent) parent.add(maskObject);

    applyMaskedStencil(this._threeObject, this._maskInvert);
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

    // 4. Convert both endpoints into the parent frame (where `position` lives)
    // and take their difference. shift() applies the delta to `position`, so it
    // must be expressed in the parent frame — NOT this node's own local frame,
    // which would divide out this node's own rotation/scale. The translation
    // parts cancel, leaving the world delta mapped through the parent's inverse
    // linear transform.
    const targetParent = this.parent === null ? targetPos : this.parent._worldToLocal(targetPos);
    const currentParent =
      this.parent === null ? currentCenter : this.parent._worldToLocal(currentCenter);
    const delta: Vector3Tuple = [
      targetParent[0] - currentParent[0],
      targetParent[1] - currentParent[1],
      targetParent[2] - currentParent[2],
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
    // _rotateAboutParentLocalPoint works in the parent frame (where `position`
    // lives), so lift the world pivot through the parent's inverse world matrix.
    const pivotWorld: Vector3Tuple = aboutPoint ?? this.getCenter();
    const pivotParent = this.parent === null ? pivotWorld : this.parent._worldToLocal(pivotWorld);
    this._rotateAboutParentLocalPoint(angle, axis, pivotParent);
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
   * LOCAL point -> WORLD (the frame this node's points live in; this node's own
   * transform IS applied).
   *
   * @post result === this._worldMatrix() * p
   */
  protected _localToWorld(p: Vector3Tuple): Vector3Tuple {
    const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(this._worldMatrix());
    return [v.x, v.y, v.z];
  }

  /**
   * WORLD point -> this node's LOCAL frame. Inverse of {@link _localToWorld}.
   *
   * @post result === this._worldMatrix().invert() * p
   */
  protected _worldToLocal(p: Vector3Tuple): Vector3Tuple {
    const inv = this._worldMatrix().invert();
    const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(inv);
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

    // Resolve the world-space anchor to hold fixed from the CURRENT (pre-scale)
    // geometry. With no aboutPoint/aboutEdge, scale about the geometric center
    // (manim semantics); getCenter() is pure point-math, so this stays correct
    // even after normalizeTransform() decouples `position` from the actual center.
    // The position math below runs in the parent frame (where `position` lives),
    // so lift the world anchor through the parent's inverse world matrix.
    const explicitAnchor = resolveExtremalPoint(this, options);
    const anchorWorld = explicitAnchor === undefined ? this.getCenter() : explicitAnchor;
    const anchorLocal = this.parent === null ? anchorWorld : this.parent._worldToLocal(anchorWorld);

    // Fold the new scale into the deferred transform, then move `position` so the
    // anchor's world location is unchanged.
    this.scaleVector.x *= sx;
    this.scaleVector.y *= sy;
    this.scaleVector.z *= sz;

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
    clone._blendMode = this._blendMode;
    clone._blendModeActive = this._blendModeActive;

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
   * @post this.isEmpty() => result === this._localToWorld([0,0,0])
   * @post !this.isEmpty() => result[i] === (worldBbox.min[i] + worldBbox.max[i]) / 2
   */
  getCenter(): Vector3Tuple {
    if (this.isEmpty()) {
      // No geometry to bound. Fall back to this node's own world position
      // (origin lifted through the world matrix), matching the bbox branch's
      // frame. This is a soft default: normalizeTransform() can reset the
      // underlying position, so callers should not rely on it — hence the warn.
      logger.warn(
        'Mobject.getCenter: computing center of an empty mobject (no geometry); falling back to world position. This value is not stable across normalizeTransform().',
      );
      return this._localToWorld([0, 0, 0]);
    }
    return getCenterImpl(this);
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
    if (this.parent === null) {
      return this.getCenter();
    }
    return this.parent._worldToLocal(this.getCenter());
  }

  /**
   * Refresh the THREE world matrices so a geometry query reads current
   * transforms, and return the backing object. World coordinates depend on
   * every ancestor's transform, so we sync from the root (the dirty invariant —
   * see _markDirty — lets the recursion skip clean subtrees). _syncToThree only
   * copies locals onto the THREE objects; setFromObject won't walk up to refresh
   * matrixWorld, so we flush ancestors (true) and descendants (true) here.
   * Shared by getBounds() and getBoundingBox() so both stay consistent.
   * @pre !this.isEmpty()
   * @post result.min <= result.max component-wise
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
  getDepth(): number {
    return this.getBoundingBox().depth;
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

  // ── Size-to-fit / match helpers ──────────────────────────────────
  // Manim CE parity: scale uniformly so one dimension hits a target size,
  // or match another mobject's size or center coordinate. A current size of
  // 0 along the measured axis gives no finite scale factor, so those calls
  // are no-ops (matching CE, which cannot grow a zero-extent dimension).

  /** Scale uniformly so the width becomes `width`. */
  scaleToFitWidth(width: number): this {
    const current = this.getWidth();
    if (current === 0) return this;
    return this.scale(width / current);
  }
  /** Scale uniformly so the height becomes `height`. */
  scaleToFitHeight(height: number): this {
    const current = this.getHeight();
    if (current === 0) return this;
    return this.scale(height / current);
  }
  /** Scale uniformly so the depth becomes `depth`. */
  scaleToFitDepth(depth: number): this {
    const current = this.getDepth();
    if (current === 0) return this;
    return this.scale(depth / current);
  }
  /** CE `set_width` (stretch=false default): alias of {@link scaleToFitWidth}. */
  setWidth(width: number): this {
    return this.scaleToFitWidth(width);
  }
  /** CE `set_height` (stretch=false default): alias of {@link scaleToFitHeight}. */
  setHeight(height: number): this {
    return this.scaleToFitHeight(height);
  }
  /** CE `set_depth` (stretch=false default): alias of {@link scaleToFitDepth}. */
  setDepth(depth: number): this {
    return this.scaleToFitDepth(depth);
  }
  /** Scale uniformly so the width matches `mob`'s width. */
  matchWidth(mob: Mobject): this {
    return this.scaleToFitWidth(mob.getWidth());
  }
  /** Scale uniformly so the height matches `mob`'s height. */
  matchHeight(mob: Mobject): this {
    return this.scaleToFitHeight(mob.getHeight());
  }
  /** Scale uniformly so the depth matches `mob`'s depth. */
  matchDepth(mob: Mobject): this {
    return this.scaleToFitDepth(mob.getDepth());
  }
  /** Shift so the center x-coordinate matches `mob`'s. */
  matchX(mob: Mobject): this {
    return this.setX(mob.getCenter()[0]);
  }
  /** Shift so the center y-coordinate matches `mob`'s. */
  matchY(mob: Mobject): this {
    return this.setY(mob.getCenter()[1]);
  }
  /** Shift so the center z-coordinate matches `mob`'s. */
  matchZ(mob: Mobject): this {
    return this.setZ(mob.getCenter()[2]);
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
  get animate(): AnimateProxy {
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
      child.normalizeTransform(worldMatrix.clone().multiply(child._ownMatrix()));
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
    if (this._blendModeActive) this._applyBlendModeToThree();
    for (const child of this.children) {
      child._syncToThree();
      if (child._threeObject && !this._threeObject.children.includes(child._threeObject)) {
        this._threeObject.add(child._threeObject);
      }
    }
    // Re-apply the clip mask (no-op when unmasked) after materials and the
    // content subtree are current, so the stencil flags are not overwritten.
    this._applyMaskToThree();
    this._dirty = false;
  }

  protected _syncMaterialToThree(): void {}

  /**
   * Disable the 2D draw-order z-layering offset (`idx * 0.01` per non-first
   * child, applied in {@link _syncToThree}) for this node and its whole subtree.
   *
   * The offset is a flat-2D hack that fakes paint order by nudging later
   * siblings toward the camera. Under a 3D perspective camera with real depth
   * sorting it instead corrupts geometry: a group's children drift along world-z
   * proportionally to their index (issue #465). `ThreeDScene` calls this on every
   * added mobject so 3D scenes opt out. Because the offset is gated on the
   * *parent's* flag, setting it on a container also covers children added later.
   */
  disableChildZLayering(): this {
    this._disableChildZLayering = true;
    this._markDirty();
    for (const child of this.children) child.disableChildZLayering();
    return this;
  }

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
   * The backing THREE object as a Mesh, or null when it is not a Mesh.
   *
   * The base `_threeObject` is a polymorphic `THREE.Object3D`: a Group for a
   * container, a Line for a stroked VMobject, a Mesh for a solid. This method
   * does the single `instanceof THREE.Mesh` check in one place, so a subclass
   * that built a Mesh reads it back with a typed result and no assertion.
   *
   * @returns The backing Mesh, or null.
   */
  protected getMesh(): THREE.Mesh | null {
    return this._threeObject instanceof THREE.Mesh ? this._threeObject : null;
  }

  /**
   * The single material of the backing Mesh, typed as T, or null.
   *
   * The result is null when the backing object is not a Mesh. This matches the
   * prior `if (this._threeObject instanceof THREE.Mesh)` guard: a non-Mesh
   * object produces no material and the caller skips the sync.
   *
   * @returns The mesh material as T, or null.
   */
  protected getMeshMaterial<T extends THREE.Material = THREE.Material>(): T | null {
    const mesh = this.getMesh();
    return mesh ? meshMaterial<T>(mesh) : null;
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
  _ownMatrix(): THREE.Matrix4 {
    const q = new THREE.Quaternion().setFromEuler(this.rotation);
    return new THREE.Matrix4().compose(this.position, q, this.scaleVector);
  }

  _worldMatrix(): THREE.Matrix4 {
    const matrix = this._ownMatrix();
    for (let ancestor: Mobject | null = this.parent; ancestor; ancestor = ancestor.parent) {
      matrix.premultiply(ancestor._ownMatrix());
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
    // Detach any clip mask so its shape leaves the scene graph with this node.
    if (this._maskMobject) this.clearMask();
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
