import * as THREE from 'three';

/**
 * Vector3 type as a tuple for external API
 */
export type Vector3Tuple = [number, number, number];

// Direction constants (matching Manim's coordinate system)
export const UP: Vector3Tuple = [0, 1, 0];
export const DOWN: Vector3Tuple = [0, -1, 0];
export const LEFT: Vector3Tuple = [-1, 0, 0];
export const RIGHT: Vector3Tuple = [1, 0, 0];
export const OUT: Vector3Tuple = [0, 0, 1];
export const IN: Vector3Tuple = [0, 0, -1];
export const ORIGIN: Vector3Tuple = [0, 0, 0];

// Diagonal direction constants
export const UL: Vector3Tuple = [-1, 1, 0];  // UP + LEFT
export const UR: Vector3Tuple = [1, 1, 0];   // UP + RIGHT
export const DL: Vector3Tuple = [-1, -1, 0]; // DOWN + LEFT
export const DR: Vector3Tuple = [1, -1, 0];  // DOWN + RIGHT

/**
 * Updater function type that runs every frame
 * @param mobject - The mobject being updated
 * @param dt - Delta time in seconds since last frame
 */
export type UpdaterFunction = (mobject: Mobject, dt: number) => void;

/**
 * Style properties for mobjects
 */
export interface MobjectStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

/**
 * Base mathematical object class.
 * All visible objects in manimweb inherit from this class.
 */
export abstract class Mobject {
  /** Unique identifier for this mobject */
  readonly id: string;

  /** Parent mobject in hierarchy */
  parent: Mobject | null = null;

  /** Child mobjects */
  children: Mobject[] = [];

  /** Position in 3D space */
  position: THREE.Vector3;

  /** Rotation as Euler angles */
  rotation: THREE.Euler;

  /** Scale factors (named scaleVector to avoid conflict with scale method) */
  scaleVector: THREE.Vector3;

  /** Color as CSS color string */
  color: string = '#ffffff';

  /** Overall opacity (0-1) - protected for backward compatibility */
  protected _opacity: number = 1;

  /** Stroke width for outlines (default 4, matching Manim's thicker strokes) */
  strokeWidth: number = 4;

  /** Fill opacity (0-1) */
  fillOpacity: number = 0;

  /** Style properties for backward compatibility */
  protected _style: MobjectStyle;

  /** Submobjects alias for backward compatibility */
  protected _submobjects: Mobject[] = [];

  /** Parent alias for backward compatibility */
  protected _parent: Mobject | null = null;

  /** Three.js backing object */
  _threeObject: THREE.Object3D | null = null;

  /** Dirty flag indicating transforms need sync */
  _dirty: boolean = true;

  /** Updater functions that run every frame */
  private _updaters: UpdaterFunction[] = [];

  private static _idCounter: number = 0;

  // Performance optimization: Object pooling for temporary vectors
  // These are shared across all Mobject instances to avoid allocation in hot paths
  private static _tempVec3: THREE.Vector3 = new THREE.Vector3();
  private static _tempBox3: THREE.Box3 = new THREE.Box3();
  private static _tempQuaternion: THREE.Quaternion = new THREE.Quaternion();

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

  /**
   * Get the overall opacity of the mobject
   */
  get opacity(): number {
    return this._opacity;
  }

  /**
   * Set the overall opacity of the mobject
   */
  set opacity(value: number) {
    this._opacity = Math.max(0, Math.min(1, value));
    this._markDirty();
  }

  /**
   * Get the style properties
   */
  get style(): MobjectStyle {
    return { ...this._style };
  }

  /**
   * Set style properties
   */
  setStyle(style: Partial<MobjectStyle>): this {
    this._style = { ...this._style, ...style };
    // Sync style to direct properties
    if (style.strokeColor !== undefined) {
      this.color = style.strokeColor;
    }
    if (style.fillColor !== undefined) {
      // fillColor used separately
    }
    if (style.fillOpacity !== undefined) {
      this.fillOpacity = style.fillOpacity;
    }
    if (style.strokeOpacity !== undefined) {
      this._opacity = style.strokeOpacity;
    }
    if (style.strokeWidth !== undefined) {
      this.strokeWidth = style.strokeWidth;
    }
    this._markDirty();
    return this;
  }

  /**
   * Get all submobjects (alias for children)
   */
  get submobjects(): Mobject[] {
    return [...this.children];
  }

  /**
   * Translate the mobject by a delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  shift(delta: Vector3Tuple): this {
    this.position.x += delta[0];
    this.position.y += delta[1];
    this.position.z += delta[2];
    this._markDirty();
    return this;
  }

  /**
   * Move the mobject to an absolute position, or align with another Mobject.
   * @param target - Target position [x, y, z] or Mobject to align with
   * @param alignedEdge - Optional edge direction to align (e.g., UL aligns upper-left edges)
   * @returns this for chaining
   */
  moveTo(target: Vector3Tuple | Mobject, alignedEdge?: Vector3Tuple): this {
    if (Array.isArray(target)) {
      // Simple point-based move
      this.position.set(target[0], target[1], target[2]);
      this._markDirty();
      return this;
    }
    // Mobject target: align edges or centers
    if (alignedEdge) {
      const targetEdge = target._getEdgeInDirection(alignedEdge);
      const thisEdge = this._getEdgeInDirection(alignedEdge);
      return this.shift([
        targetEdge[0] - thisEdge[0],
        targetEdge[1] - thisEdge[1],
        targetEdge[2] - thisEdge[2]
      ]);
    }
    const targetCenter = target.getCenter();
    this.position.set(targetCenter[0], targetCenter[1], targetCenter[2]);
    this._markDirty();
    return this;
  }

  /**
   * Rotate the mobject around an axis
   * Uses object pooling to avoid allocations in hot paths (performance optimization).
   * @param angle - Rotation angle in radians
   * @param axis - Axis of rotation [x, y, z], defaults to Z axis
   * @returns this for chaining
   */
  rotate(angle: number, axis: Vector3Tuple = [0, 0, 1]): this {
    // Use pooled vector and quaternion to avoid allocation
    Mobject._tempVec3.set(axis[0], axis[1], axis[2]).normalize();
    Mobject._tempQuaternion.setFromAxisAngle(Mobject._tempVec3, angle);
    const currentQuat = new THREE.Quaternion().setFromEuler(this.rotation);
    currentQuat.multiply(Mobject._tempQuaternion);
    this.rotation.setFromQuaternion(currentQuat);
    this._markDirty();
    return this;
  }

  /**
   * Flip the mobject along an axis (mirror reflection).
   * @param axis - Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip
   * @returns this for chaining
   */
  flip(axis: Vector3Tuple = [1, 0, 0]): this {
    // Flip by scaling -1 along the specified axis
    if (axis[0] !== 0) this.scaleVector.x *= -1;
    if (axis[1] !== 0) this.scaleVector.y *= -1;
    if (axis[2] !== 0) this.scaleVector.z *= -1;
    this._markDirty();
    return this;
  }

  /**
   * Scale the mobject uniformly or non-uniformly
   * @param factor - Scale factor (number for uniform, tuple for non-uniform)
   * @returns this for chaining
   */
  scale(factor: number | Vector3Tuple): this {
    if (typeof factor === 'number') {
      this.scaleVector.multiplyScalar(factor);
    } else {
      this.scaleVector.x *= factor[0];
      this.scaleVector.y *= factor[1];
      this.scaleVector.z *= factor[2];
    }
    this._markDirty();
    return this;
  }

  /**
   * Set the mobject's color
   * Only marks dirty if value actually changed (performance optimization).
   * @param color - CSS color string
   * @returns this for chaining
   */
  setColor(color: string): this {
    if (this.color !== color) {
      this.color = color;
      this._style.strokeColor = color;
      this._style.fillColor = color;
      this._markDirty();
    }
    return this;
  }

  /**
   * Set the mobject's overall opacity
   * Only marks dirty if value actually changed (performance optimization).
   * @param opacity - Opacity value (0-1)
   * @returns this for chaining
   */
  setOpacity(opacity: number): this {
    const newOpacity = Math.max(0, Math.min(1, opacity));
    if (this._opacity !== newOpacity) {
      this._opacity = newOpacity;
      this._style.strokeOpacity = this._opacity;
      this._markDirty();
    }
    return this;
  }

  /**
   * Set the stroke width for outlines
   * Only marks dirty if value actually changed (performance optimization).
   * @param width - Stroke width in pixels
   * @returns this for chaining
   */
  setStrokeWidth(width: number): this {
    const newWidth = Math.max(0, width);
    if (this.strokeWidth !== newWidth) {
      this.strokeWidth = newWidth;
      this._style.strokeWidth = this.strokeWidth;
      this._markDirty();
    }
    return this;
  }

  /**
   * Set the fill opacity
   * Only marks dirty if value actually changed (performance optimization).
   * @param opacity - Fill opacity (0-1)
   * @returns this for chaining
   */
  setFillOpacity(opacity: number): this {
    const newOpacity = Math.max(0, Math.min(1, opacity));
    if (this.fillOpacity !== newOpacity) {
      this.fillOpacity = newOpacity;
      this._style.fillOpacity = this.fillOpacity;
      this._markDirty();
    }
    return this;
  }

  /**
   * Get the fill color
   */
  get fillColor(): string | undefined {
    return this._style.fillColor;
  }

  /**
   * Set the fill color
   */
  set fillColor(color: string) {
    if (this._style.fillColor !== color) {
      this._style.fillColor = color;
      this._markDirty();
    }
  }

  /**
   * Add a child mobject (supports multiple arguments for backward compatibility)
   * @param mobjects - Child mobjects to add
   * @returns this for chaining
   */
  add(...mobjects: Mobject[]): this {
    for (const child of mobjects) {
      if (child.parent) {
        child.parent.remove(child);
      }
      child.parent = this;
      child._parent = this;
      this.children.push(child);
      this._submobjects.push(child);

      // Sync Three.js hierarchy if objects exist
      if (this._threeObject) {
        const childThree = child.getThreeObject();
        if (!this._threeObject.children.includes(childThree)) {
          this._threeObject.add(childThree);
        }
      }
    }

    return this;
  }

  /**
   * Remove a child mobject (supports multiple arguments for backward compatibility)
   * @param mobjects - Child mobjects to remove
   * @returns this for chaining
   */
  remove(...mobjects: Mobject[]): this {
    for (const child of mobjects) {
      const index = this.children.indexOf(child);
      if (index !== -1) {
        this.children.splice(index, 1);
        child.parent = null;
        child._parent = null;

        const subIndex = this._submobjects.indexOf(child);
        if (subIndex !== -1) {
          this._submobjects.splice(subIndex, 1);
        }

        if (this._threeObject && child._threeObject) {
          this._threeObject.remove(child._threeObject);
        }
      }
    }
    return this;
  }

  /**
   * Create a deep copy of this mobject
   * @returns New mobject with copied properties
   */
  copy(): Mobject {
    const clone = this._createCopy();

    clone.position.copy(this.position);
    clone.rotation.copy(this.rotation);
    clone.scaleVector.copy(this.scaleVector);
    clone.color = this.color;
    clone._opacity = this._opacity;
    clone.strokeWidth = this.strokeWidth;
    clone.fillOpacity = this.fillOpacity;
    clone._style = { ...this._style };

    // Deep copy children
    for (const child of this.children) {
      clone.add(child.copy());
    }

    clone._markDirty();
    return clone;
  }

  /**
   * Create a new instance for copying. Subclasses must implement this.
   */
  protected abstract _createCopy(): Mobject;

  /**
   * Get the center point of this mobject
   * @returns Center position as [x, y, z]
   */
  getCenter(): Vector3Tuple {
    if (this.children.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    // Calculate average center of all children
    let sumX = 0, sumY = 0, sumZ = 0;
    for (const child of this.children) {
      const center = child.getCenter();
      sumX += center[0];
      sumY += center[1];
      sumZ += center[2];
    }
    const count = this.children.length;
    return [
      this.position.x + sumX / count,
      this.position.y + sumY / count,
      this.position.z + sumZ / count
    ];
  }

  /**
   * Get the bounding box of this mobject in world coordinates.
   * @returns Object with min and max Vector3Tuple
   */
  getBounds(): { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } {
    if (this._threeObject) {
      const box = new THREE.Box3().setFromObject(this._threeObject);
      return {
        min: { x: box.min.x, y: box.min.y, z: box.min.z },
        max: { x: box.max.x, y: box.max.y, z: box.max.z }
      };
    }

    // Fallback: use position
    const center = this.getCenter();
    return {
      min: { x: center[0] - 0.5, y: center[1] - 0.5, z: center[2] - 0.5 },
      max: { x: center[0] + 0.5, y: center[1] + 0.5, z: center[2] + 0.5 }
    };
  }

  /**
   * Position this mobject next to another mobject
   * @param target The mobject to position next to
   * @param direction Direction from target (e.g., RIGHT, UP)
   * @param buff Buffer distance between mobjects, default 0.25
   * @returns this for chaining
   */
  nextTo(target: Mobject | Vector3Tuple, direction: Vector3Tuple = RIGHT, buff: number = 0.25): this {
    // If target is a mobject, get its center
    const targetPoint = Array.isArray(target) ? target : target.getCenter();

    // Get the edge of this mobject in the opposite direction
    const thisEdge = this._getEdgeInDirection([-direction[0], -direction[1], -direction[2]]);

    // Get the edge of target in the direction
    const targetEdge = Array.isArray(target)
      ? targetPoint
      : target._getEdgeInDirection(direction);

    // Calculate offset needed
    const offset: Vector3Tuple = [
      targetEdge[0] + direction[0] * buff - thisEdge[0],
      targetEdge[1] + direction[1] * buff - thisEdge[1],
      targetEdge[2] + direction[2] * buff - thisEdge[2]
    ];

    return this.shift(offset);
  }

  /**
   * Align this mobject with another along an edge
   * @param target The mobject or point to align with
   * @param direction The direction/edge to align (e.g., LEFT aligns left edges)
   * @returns this for chaining
   */
  alignTo(target: Mobject | Vector3Tuple, direction: Vector3Tuple): this {
    const targetPoint = Array.isArray(target)
      ? target
      : target._getEdgeInDirection(direction);
    const thisPoint = this._getEdgeInDirection(direction);

    // Only move in the direction's non-zero components
    const offset: Vector3Tuple = [
      direction[0] !== 0 ? targetPoint[0] - thisPoint[0] : 0,
      direction[1] !== 0 ? targetPoint[1] - thisPoint[1] : 0,
      direction[2] !== 0 ? targetPoint[2] - thisPoint[2] : 0
    ];

    return this.shift(offset);
  }

  /**
   * Move this mobject to align its center with a point or mobject center
   * @param target Target mobject or point to align with
   * @param alignedEdge Optional edge to align instead of centers
   * @returns this for chaining
   */
  moveToAligned(target: Mobject | Vector3Tuple, alignedEdge?: Vector3Tuple): this {
    if (alignedEdge) {
      return this.alignTo(target, alignedEdge);
    }
    const targetPoint = Array.isArray(target) ? target : target.getCenter();
    return this.moveTo(targetPoint);
  }

  /**
   * Get the edge point of the bounding box in a direction
   * @param direction Direction to get edge in
   * @returns Edge point as [x, y, z]
   */
  protected _getEdgeInDirection(direction: Vector3Tuple): Vector3Tuple {
    const center = this.getCenter();
    const bounds = this._getBoundingBox();

    return [
      center[0] + direction[0] * bounds.width / 2,
      center[1] + direction[1] * bounds.height / 2,
      center[2] + direction[2] * bounds.depth / 2
    ];
  }

  /**
   * Get bounding box dimensions
   * Uses object pooling to avoid allocations in hot paths (performance optimization).
   * @returns Object with width, height, and depth
   */
  protected _getBoundingBox(): { width: number; height: number; depth: number } {
    // Trigger lazy Three.js object creation if needed
    const obj = this.getThreeObject();
    // Use pooled objects to avoid allocation
    Mobject._tempBox3.setFromObject(obj);
    Mobject._tempBox3.getSize(Mobject._tempVec3);
    return { width: Mobject._tempVec3.x, height: Mobject._tempVec3.y, depth: Mobject._tempVec3.z };
  }

  /**
   * Get a specific edge point of the bounding box in a direction
   * @param direction Direction to the edge point
   * @returns Edge point as [x, y, z]
   */
  getEdge(direction: Vector3Tuple): Vector3Tuple {
    return this._getEdgeInDirection(direction);
  }

  /**
   * Get the top edge center
   * @returns Top edge center as [x, y, z]
   */
  getTop(): Vector3Tuple {
    return this._getEdgeInDirection(UP);
  }

  /**
   * Get the bottom edge center
   * @returns Bottom edge center as [x, y, z]
   */
  getBottom(): Vector3Tuple {
    return this._getEdgeInDirection(DOWN);
  }

  /**
   * Get the left edge center
   * @returns Left edge center as [x, y, z]
   */
  getLeft(): Vector3Tuple {
    return this._getEdgeInDirection(LEFT);
  }

  /**
   * Get the right edge center
   * @returns Right edge center as [x, y, z]
   */
  getRight(): Vector3Tuple {
    return this._getEdgeInDirection(RIGHT);
  }

  /**
   * Center this mobject at origin
   * @returns this for chaining
   */
  center(): this {
    return this.moveTo([0, 0, 0]);
  }

  /**
   * Move to the edge of the frame
   * @param direction Direction to move towards
   * @param buff Buffer from edge
   * @returns this for chaining
   */
  toEdge(direction: Vector3Tuple, buff: number = 0.5): this {
    // Assuming standard Manim frame: 14 wide, 8 tall
    const frameWidth = 14;
    const frameHeight = 8;
    const bbox = this._getBoundingBox();

    const targetX = direction[0] !== 0
      ? direction[0] * (frameWidth / 2 - buff - bbox.width / 2)
      : this.position.x;
    const targetY = direction[1] !== 0
      ? direction[1] * (frameHeight / 2 - buff - bbox.height / 2)
      : this.position.y;

    return this.moveTo([targetX, targetY, this.position.z]);
  }

  /**
   * Move to a corner of the frame
   * @param direction Corner direction (e.g., UR for upper right)
   * @param buff Buffer from edges
   * @returns this for chaining
   */
  toCorner(direction: Vector3Tuple = UR, buff: number = 0.5): this {
    return this.toEdge(direction, buff);
  }

  /**
   * Sync transform properties to the Three.js object
   */
  _syncToThree(): void {
    if (!this._dirty) return;

    if (!this._threeObject) {
      this._threeObject = this._createThreeObject();
    }

    this._threeObject.position.copy(this.position);
    this._threeObject.rotation.copy(this.rotation);
    this._threeObject.scale.copy(this.scaleVector);

    // Sync material properties if applicable
    this._syncMaterialToThree();

    // Sync children
    for (const child of this.children) {
      child._syncToThree();
      if (child._threeObject && !this._threeObject.children.includes(child._threeObject)) {
        this._threeObject.add(child._threeObject);
      }
    }

    this._dirty = false;
  }

  /**
   * Sync material-specific properties. Override in subclasses.
   */
  protected _syncMaterialToThree(): void {
    // Default implementation does nothing
    // Subclasses with materials should override
  }

  /**
   * Mark this mobject as needing sync
   */
  _markDirty(): void {
    this._dirty = true;
  }

  /**
   * Mark this mobject and all ancestors as needing sync.
   * Use when a deep child's geometry changes and the parent tree must re-traverse.
   * Short-circuits if this node is already dirty (ancestors must be dirty too).
   */
  _markDirtyUpward(): void {
    if (this._dirty) return; // already dirty → parents are too
    this._dirty = true;
    if (this.parent) {
      this.parent._markDirtyUpward();
    }
  }

  /**
   * Check if this mobject needs sync
   */
  get isDirty(): boolean {
    return this._dirty;
  }

  /**
   * Get the Three.js object, creating it if necessary
   */
  getThreeObject(): THREE.Object3D {
    if (!this._threeObject) {
      this._threeObject = this._createThreeObject();
    }
    this._syncToThree();
    return this._threeObject;
  }

  /**
   * Create the Three.js backing object. Subclasses must implement.
   */
  protected abstract _createThreeObject(): THREE.Object3D;

  /**
   * Apply a function to this mobject and all descendants
   */
  applyToFamily(func: (mobject: Mobject) => void): this {
    func(this);
    for (const child of this.children) {
      child.applyToFamily(func);
    }
    return this;
  }

  /**
   * Get all mobjects in the family (this mobject and all descendants)
   */
  getFamily(): Mobject[] {
    const family: Mobject[] = [this];
    for (const child of this.children) {
      family.push(...child.getFamily());
    }
    return family;
  }

  /**
   * Add an updater function that runs every frame
   * @param updater Function called with (mobject, dt) each frame
   * @param callOnAdd Whether to call immediately, default false
   * @returns this for chaining
   */
  addUpdater(updater: UpdaterFunction, callOnAdd: boolean = false): this {
    this._updaters.push(updater);
    if (callOnAdd) {
      updater(this, 0);
    }
    return this;
  }

  /**
   * Remove an updater function
   * @param updater The updater function to remove
   * @returns this for chaining
   */
  removeUpdater(updater: UpdaterFunction): this {
    const index = this._updaters.indexOf(updater);
    if (index !== -1) {
      this._updaters.splice(index, 1);
    }
    return this;
  }

  /**
   * Remove all updaters
   * @returns this for chaining
   */
  clearUpdaters(): this {
    this._updaters = [];
    return this;
  }

  /**
   * Check if this mobject has any updaters
   * @returns true if the mobject has updaters
   */
  hasUpdaters(): boolean {
    return this._updaters.length > 0;
  }

  /**
   * Get all updaters (for internal use)
   * @returns A copy of the updaters array
   */
  getUpdaters(): UpdaterFunction[] {
    return [...this._updaters];
  }

  /**
   * Run all updaters with given dt
   * Called by Scene during render loop
   * @param dt Delta time in seconds since last frame
   */
  update(dt: number): void {
    for (const updater of this._updaters) {
      updater(this, dt);
    }
    // Also update children
    for (const child of this.children) {
      child.update(dt);
    }
  }

  /**
   * Apply a point-wise function to every VMobject descendant's control points.
   * Uses duck-type check for getPoints/setPoints to avoid circular imports.
   * @param fn - Function mapping [x, y, z] to [x', y', z']
   * @returns this for chaining
   */
  applyFunction(fn: (point: number[]) => number[]): this {
    for (const mob of this.getFamily()) {
      const asAny = mob as unknown as { getPoints?: () => number[][]; setPoints?: (pts: number[][]) => void };
      if (typeof asAny.getPoints === 'function' && typeof asAny.setPoints === 'function') {
        const pts = asAny.getPoints();
        if (pts.length > 0) {
          asAny.setPoints(pts.map(p => fn([...p])));
        }
      }
    }
    return this;
  }

  /**
   * Subdivide every VMobject descendant's cubic Bezier curves so that non-linear
   * transforms produce smooth results. Each cubic segment is split into n sub-segments
   * via de Casteljau evaluation.
   * @param numPieces - Number of sub-segments per original cubic segment (default 50)
   * @returns this for chaining
   */
  prepareForNonlinearTransform(numPieces: number = 50): this {
    for (const mob of this.getFamily()) {
      const asAny = mob as unknown as { getPoints?: () => number[][]; setPoints?: (pts: number[][]) => void };
      if (typeof asAny.getPoints === 'function' && typeof asAny.setPoints === 'function') {
        const pts = asAny.getPoints();
        if (pts.length < 4) continue;
        const newPoints: number[][] = [];
        // Process each cubic Bezier segment (groups of 4 points: anchor, handle, handle, anchor)
        for (let i = 0; i + 3 < pts.length; i += 3) {
          const p0 = pts[i], p1 = pts[i + 1], p2 = pts[i + 2], p3 = pts[i + 3];
          for (let j = 0; j < numPieces; j++) {
            const tStart = j / numPieces;
            const tEnd = (j + 1) / numPieces;
            // Evaluate de Casteljau at tStart and tEnd for sub-curve anchors
            const start = _evalBezier(p0, p1, p2, p3, tStart);
            const end = _evalBezier(p0, p1, p2, p3, tEnd);
            // Approximate sub-curve handles by evaluating at 1/3 and 2/3 within sub-interval
            const t1 = tStart + (tEnd - tStart) / 3;
            const t2 = tStart + 2 * (tEnd - tStart) / 3;
            const h1 = _evalBezier(p0, p1, p2, p3, t1);
            const h2 = _evalBezier(p0, p1, p2, p3, t2);
            if (j === 0 && i === 0) {
              newPoints.push(start);
            }
            newPoints.push(h1, h2, end);
          }
        }
        asAny.setPoints(newPoints);
      }
    }
    return this;
  }

  /**
   * Clean up Three.js resources.
   */
  dispose(): void {
    for (const child of this.children) {
      child.dispose();
    }

    // Dispose Three.js resources
    if (this._threeObject) {
      this._threeObject.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
    }
  }
}

/**
 * Evaluate a cubic Bezier curve at parameter t using de Casteljau's algorithm.
 */
function _evalBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const s = 1 - t;
  const result: number[] = [];
  for (let k = 0; k < p0.length; k++) {
    // B(t) = (1-t)^3 * P0 + 3(1-t)^2*t * P1 + 3(1-t)*t^2 * P2 + t^3 * P3
    result.push(
      s * s * s * p0[k] +
      3 * s * s * t * p1[k] +
      3 * s * t * t * p2[k] +
      t * t * t * p3[k]
    );
  }
  return result;
}

export default Mobject;
