import * as THREE from 'three';
import {
  type Vector3Tuple,
  type UpdaterFunction,
  type MobjectStyle,
  UP,
  DOWN,
  LEFT,
  RIGHT,
} from './MobjectTypes';
import {
  rotateMobject,
  getCenterImpl,
  getBoundingBoxImpl,
  getEdgeInDirectionImpl,
  toEdgeImpl,
} from './MobjectPositioning';
import {
  saveMobjectStateImpl,
  restoreMobjectStateImpl,
  becomeMobjectImpl,
  replaceMobjectImpl,
  applyFunctionImpl,
  prepareForNonlinearTransformImpl,
} from './MobjectState';

// Re-export everything from MobjectTypes so existing imports from './Mobject' continue to work
export {
  type Vector3Tuple,
  type UpdaterFunction,
  type MobjectStyle,
  type VMobjectLike,
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
  _dirty: boolean = true;
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
    this._opacity = Math.max(0, Math.min(1, value));
    this._markDirty();
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

  setOpacity(opacity: number): this {
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

  // ── Transform Methods ────────────────────────────────────────────

  shift(delta: Vector3Tuple): this {
    this.position.x += delta[0];
    this.position.y += delta[1];
    this.position.z += delta[2];
    this._markDirty();
    return this;
  }

  moveTo(target: Vector3Tuple | Mobject, alignedEdge?: Vector3Tuple): this {
    if (Array.isArray(target)) {
      this.position.set(target[0], target[1], target[2]);
      this._markDirty();
      return this;
    }
    if (alignedEdge) {
      const te = target._getEdgeInDirection(alignedEdge);
      const se = this._getEdgeInDirection(alignedEdge);
      return this.shift([te[0] - se[0], te[1] - se[1], te[2] - se[2]]);
    }
    const c = target.getCenter();
    this.position.set(c[0], c[1], c[2]);
    this._markDirty();
    return this;
  }

  /**
   * Rotate the mobject around an axis.
   * Delegates to rotateMobject for the heavy lifting.
   */
  rotate(
    angle: number,
    axisOrOptions?: Vector3Tuple | { axis?: Vector3Tuple; aboutPoint?: Vector3Tuple },
  ): this {
    rotateMobject(this, angle, axisOrOptions);
    return this;
  }

  rotateAboutOrigin(angle: number, axis: Vector3Tuple = [0, 0, 1]): this {
    return this.rotate(angle, { axis, aboutPoint: [0, 0, 0] });
  }

  flip(axis: Vector3Tuple = [1, 0, 0]): this {
    if (axis[0] !== 0) this.scaleVector.x *= -1;
    if (axis[1] !== 0) this.scaleVector.y *= -1;
    if (axis[2] !== 0) this.scaleVector.z *= -1;
    this._markDirty();
    return this;
  }

  scale(factor: number | Vector3Tuple): this {
    if (typeof factor === 'number') {
      this.scaleVector.multiplyScalar(factor);
    } else {
      this.scaleVector.x *= factor[0];
      this.scaleVector.y *= factor[1];
      this.scaleVector.z *= factor[2] === 0 ? 1 : factor[2];
    }
    this._markDirty();
    return this;
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
    return this;
  }

  // ── Copy / Become / Replace ──────────────────────────────────────

  copy(): Mobject {
    const clone = this._createCopy();
    if (clone === this) return clone;
    clone.position.copy(this.position);
    clone.rotation.copy(this.rotation);
    clone.scaleVector.copy(this.scaleVector);
    clone.color = this.color;
    clone._opacity = this._opacity;
    clone.strokeWidth = this.strokeWidth;
    clone.fillOpacity = this.fillOpacity;
    clone._style = { ...this._style };
    for (const child of this.children) clone.add(child.copy());
    clone._markDirty();
    return clone;
  }

  protected abstract _createCopy(): Mobject;

  become(other: Mobject): this {
    becomeMobjectImpl(this, other);
    return this;
  }

  replace(target: Mobject, stretch: boolean = false): this {
    replaceMobjectImpl(this, target, stretch);
    return this;
  }

  // ── Positioning & Bounding Box ───────────────────────────────────

  getCenter(): Vector3Tuple {
    return getCenterImpl(this);
  }

  getBounds(): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  } {
    if (this._threeObject) {
      const box = new THREE.Box3().setFromObject(this._threeObject);
      return {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z },
      };
    }
    const c = this.getCenter();
    return {
      min: { x: c[0] - 0.5, y: c[1] - 0.5, z: c[2] - 0.5 },
      max: { x: c[0] + 0.5, y: c[1] + 0.5, z: c[2] + 0.5 },
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

  _getEdgeInDirection(direction: Vector3Tuple): Vector3Tuple {
    return getEdgeInDirectionImpl(this, direction);
  }
  getBoundingBox(): { width: number; height: number; depth: number } {
    return getBoundingBoxImpl(this);
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

  _syncToThree(): void {
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

  _markDirty(): void {
    this._dirty = true;
  }

  _markDirtyUpward(): void {
    if (this._dirty) return;
    this._dirty = true;
    if (this.parent) this.parent._markDirtyUpward();
  }

  get isDirty(): boolean {
    return this._dirty;
  }

  getThreeObject(): THREE.Object3D {
    if (!this._threeObject) this._threeObject = this._createThreeObject();
    this._syncToThree();
    return this._threeObject;
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

  applyFunction(fn: (point: number[]) => number[]): this {
    applyFunctionImpl(this, fn);
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

export default Mobject;
