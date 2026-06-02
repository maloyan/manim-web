/**
 * VGroup class for grouping VMobjects.
 * VGroup extends VMobject to provide specialized grouping for vectorized mobjects.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple, RIGHT } from './Mobject';
import { VMobject, Point } from './VMobject';

/**
 * VGroup is a specialized group for VMobjects.
 * Operations apply to all children, and paths can be combined.
 */
export class VGroup extends VMobject {
  /**
   * True when this VGroup (recursively) has no renderable geometry.
   */
  override isEmpty(): boolean {
    return this.children.length === 0 || this.children.every((child) => child.isEmpty());
  }

  /**
   * Create a new VGroup containing the given mobjects.
   * Accepts both VMobjects and general Mobjects (e.g., Axes, Group).
   * @param mobjects - Mobjects to add to the group
   */
  constructor(...mobjects: Mobject[]) {
    super();

    // VGroup should not have its own fill by default
    this.fillOpacity = 0;
    this._style.fillOpacity = 0;

    for (const mobject of mobjects) {
      this.add(mobject);
    }

    if (!this.isEmpty()) {
      this.normalizeTransform();
    }
  }

  /**
   * Add VMobjects to this group.
   * Accepts VMobjects or arrays of VMobjects.
   * @param vmobjects - VMobjects to add
   * @returns this for chaining
   */
  addVMobjects(...vmobjects: (VMobject | VMobject[])[]): this {
    for (const item of vmobjects) {
      if (Array.isArray(item)) {
        for (const vmobject of item) {
          this._addSingleVMobject(vmobject);
        }
      } else {
        this._addSingleVMobject(item);
      }
    }
    return this;
  }

  /**
   * Add mobjects to this group (override from Mobject).
   * @param mobjects - Mobjects to add
   * @returns this for chaining
   */
  override add(...mobjects: Mobject[]): this {
    for (const mobject of mobjects) {
      if (mobject instanceof VMobject) {
        this._addSingleVMobject(mobject);
      } else {
        // For non-VMobjects, use base implementation
        super.add(mobject);
      }
    }
    return this;
  }

  /**
   * Add a single VMobject to this group.
   */
  private _addSingleVMobject(vmobject: VMobject): void {
    // Remove from previous parent if any
    if (vmobject.parent) {
      vmobject.parent.remove(vmobject);
    }

    vmobject.parent = this;
    this.children.push(vmobject);

    // Sync Three.js hierarchy
    if (this._threeObject) {
      const childThree = vmobject.getThreeObject();
      if (!this._threeObject.children.includes(childThree)) {
        this._threeObject.add(childThree);
      }
    }

    this._markDirty();
  }

  /**
   * Remove VMobjects from this group.
   * @param vmobjects - VMobjects to remove
   * @returns this for chaining
   */
  removeVMobjects(...vmobjects: VMobject[]): this {
    for (const vmobject of vmobjects) {
      const index = this.children.indexOf(vmobject);
      if (index !== -1) {
        this.children.splice(index, 1);
        vmobject.parent = null;

        if (this._threeObject && vmobject._threeObject) {
          this._threeObject.remove(vmobject._threeObject);
        }
      }
    }
    this._markDirty();
    return this;
  }

  /**
   * Remove mobjects from this group (override from Mobject).
   * @param mobjects - Mobjects to remove
   * @returns this for chaining
   */
  override remove(...mobjects: Mobject[]): this {
    for (const mobject of mobjects) {
      const index = this.children.indexOf(mobject);
      if (index !== -1) {
        this.children.splice(index, 1);
        mobject.parent = null;

        if (this._threeObject && mobject._threeObject) {
          this._threeObject.remove(mobject._threeObject);
        }
      }
    }
    this._markDirty();
    return this;
  }

  /**
   * Set the color of all children.
   * @param color - CSS color string
   * @returns this for chaining
   */
  override setColor(color: string): this {
    super.setColor(color);
    for (const child of this.children) {
      child.setColor(color);
    }
    return this;
  }

  /**
   * Set the opacity of all children.
   * @param opacity - Opacity value (0-1)
   * @returns this for chaining
   */
  override setStrokeOpacity(opacity: number): this {
    super.setStrokeOpacity(opacity);
    for (const child of this.children) {
      child.setStrokeOpacity(opacity);
    }
    return this;
  }

  /**
   * Set the stroke width of all children.
   * @param width - Stroke width in pixels
   * @returns this for chaining
   */
  override setStrokeWidth(width: number): this {
    super.setStrokeWidth(width);
    for (const child of this.children) {
      child.setStrokeWidth(width);
    }
    return this;
  }

  /**
   * Set the fill opacity of all children.
   * @param opacity - Fill opacity (0-1)
   * @returns this for chaining
   */
  override setFillOpacity(opacity: number): this {
    super.setFillOpacity(opacity);
    for (const child of this.children) {
      if (child instanceof VMobject) {
        child.setFillOpacity(opacity);
      }
    }
    return this;
  }

  /**
   * Set the fill color of all children.
   * @param color - CSS color string
   * @returns this for chaining
   */
  setFill(color?: string, opacity?: number): this {
    for (const child of this.children) {
      if (child instanceof VMobject) {
        if (color !== undefined) {
          child.setColor(color);
        }
        if (opacity !== undefined) {
          child.setFillOpacity(opacity);
        }
      }
    }
    return this;
  }

  /**
   * Set the stroke of all children.
   * @param color - CSS color string
   * @param width - Stroke width in pixels
   * @param opacity - Stroke opacity (0-1)
   * @returns this for chaining
   */
  setStroke(color?: string, width?: number, opacity?: number): this {
    for (const child of this.children) {
      if (child instanceof VMobject) {
        if (color !== undefined) {
          child.setColor(color);
        }
        if (width !== undefined) {
          child.setStrokeWidth(width);
        }
        if (opacity !== undefined) {
          child.setStrokeOpacity(opacity);
        }
      }
    }
    return this;
  }

  /**
   * Arrange children in a row or column with specified spacing.
   * @param direction - Direction to arrange (e.g., RIGHT for row, DOWN for column)
   * @param buff - Buffer/spacing between children, default 0.25
   * @param center - Whether to center the arrangement at the group's position, default true
   * @returns this for chaining
   */
  arrange(direction: Vector3Tuple = RIGHT, buff: number = 0.25, center: boolean = true): this {
    if (this.children.length === 0) return this;

    // Store original center if we want to recenter later
    const originalCenter = center ? this.getCenter() : null;

    // Position first child
    let prevChild = this.children[0];

    for (let i = 1; i < this.children.length; i++) {
      const child = this.children[i];
      child.nextTo(prevChild, direction, buff);
      prevChild = child;
    }

    if (originalCenter) {
      this._recenterChildrenTo(originalCenter);
    }

    this._markDirty();
    return this;
  }

  /**
   * Recenter the arrangement by shifting the CHILDREN so the group's bbox
   * center returns to `originalCenter`, leaving the container's own `position`
   * untouched.
   *
   * Background: #417 removed VGroup's `moveTo`/`shift` child-shifting overrides,
   * so `this.moveTo(...)` now moves only the container's `position` and leaves
   * children in place. Arrange used `moveTo` to recenter, which silently became
   * a no-op on the children — breaking callers that add the children directly
   * (e.g. opening_manim) or rely on the children being physically centered.
   * Shifting the children restores the pre-#417 arrange contract.
   *
   * Frame note: `getCenter()` returns WORLD coordinates, but `child.shift()`
   * applies its delta in the child's PARENT-local frame — which is this VGroup's
   * own local frame. We therefore map both world endpoints into that frame (via a
   * child's world→parent-local conversion, which all children share) before
   * taking the difference. For an identity, parentless VGroup the conversion is
   * the identity, so this matches the previous world-delta behavior; for a
   * transformed/nested VGroup it stays correct (the delta is no longer scaled or
   * rotated by the group's transform).
   */
  private _recenterChildrenTo(originalCenter: Vector3Tuple): void {
    const cur = this.getCenter();
    const worldDelta: Vector3Tuple = [
      originalCenter[0] - cur[0],
      originalCenter[1] - cur[1],
      originalCenter[2] - cur[2],
    ];
    if (worldDelta[0] === 0 && worldDelta[1] === 0 && worldDelta[2] === 0) return;

    // The children's parent-local frame IS this group's local frame, so this
    // group's world matrix maps child-local → world. Invert it and apply to both
    // world endpoints, then difference them: the translation parts cancel,
    // leaving the world delta mapped through this group's inverse linear
    // transform. For an identity, parentless group the inverse is identity, so
    // this reduces to the world delta (matching the prior behavior).
    const invWorld = this._computeWorldMatrix().clone().invert();
    const originalLocal = new THREE.Vector3(...originalCenter).applyMatrix4(invWorld);
    const curLocal = new THREE.Vector3(...cur).applyMatrix4(invWorld);
    const delta: Vector3Tuple = [
      originalLocal.x - curLocal.x,
      originalLocal.y - curLocal.y,
      originalLocal.z - curLocal.z,
    ];
    for (const child of this.children) child.shift(delta);
  }

  /**
   * Arrange children in a grid layout.
   * @param rows - Number of rows (if not specified, auto-calculated)
   * @param cols - Number of columns (if not specified, auto-calculated)
   * @param buffX - Horizontal buffer between elements, default 0.25
   * @param buffY - Vertical buffer between elements, default 0.25
   * @returns this for chaining
   */
  arrangeInGrid(rows?: number, cols?: number, buffX: number = 0.25, buffY: number = 0.25): this {
    const n = this.children.length;
    if (n === 0) return this;

    // Calculate rows and cols if not specified
    if (rows === undefined && cols === undefined) {
      cols = Math.ceil(Math.sqrt(n));
      rows = Math.ceil(n / cols);
    } else if (rows === undefined) {
      rows = Math.ceil(n / cols!);
    } else if (cols === undefined) {
      cols = Math.ceil(n / rows);
    }

    const originalCenter = this.getCenter();

    // Calculate cell dimensions based on largest child
    let maxWidth = 0;
    let maxHeight = 0;
    for (const child of this.children) {
      // Use getThreeObject and bounding box calculation
      const threeObj = child.getThreeObject();
      const box = new THREE.Box3().setFromObject(threeObj);
      const size = new THREE.Vector3();
      box.getSize(size);
      maxWidth = Math.max(maxWidth, size.x || 1);
      maxHeight = Math.max(maxHeight, size.y || 1);
    }

    const cellWidth = maxWidth + buffX;
    const cellHeight = maxHeight + buffY;

    // Position each child in the grid
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols!);
      const col = i % cols!;
      const child = this.children[i];

      const x = col * cellWidth;
      const y = -row * cellHeight; // Negative because Y increases upward

      child.moveTo([x, y, child.position.z]);
    }

    // Recenter to original position by shifting children (not the container).
    this._recenterChildrenTo(originalCenter);

    this._markDirty();
    return this;
  }

  /**
   * Get combined path points from all children.
   * @returns Combined array of points from all children
   */
  getCombinedPoints(): number[][] {
    const allPoints: number[][] = [];
    for (const child of this.children) {
      if (child instanceof VMobject) {
        allPoints.push(...child.getLocalPoints());
      }
    }
    return allPoints;
  }

  /**
   * VGroup is a container — it has no stroke/fill materials of its own.
   * The parent VMobjectRendering._syncMaterialToThree() would attempt to
   * rebuild geometry using null materials, causing a "material is null"
   * crash (#206). Children sync their own materials independently.
   */
  protected override _syncMaterialToThree(): void {}

  /**
   * Create the Three.js backing object for this VGroup.
   * A VGroup is simply a THREE.Group that contains children.
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Add all children's Three.js objects
    for (const child of this.children) {
      group.add(child.getThreeObject());
    }

    return group;
  }

  override copy(): VGroup {
    const copy = new VGroup();
    this._copyBaseAttributesInto(copy);
    return copy;
  }

  /**
   * Get the number of vmobjects in this group.
   */
  get length(): number {
    return this.children.length;
  }

  /**
   * Get a vmobject by index.
   * @param index - Index of the vmobject
   * @returns The vmobject at the given index, or undefined
   */
  get(index: number): VMobject | undefined {
    return this.children[index] as VMobject | undefined;
  }

  /**
   * Iterate over all vmobjects in the group.
   */
  [Symbol.iterator](): Iterator<VMobject> {
    return (this.children as VMobject[])[Symbol.iterator]();
  }

  /**
   * Apply a function to each vmobject in the group.
   * @param fn - Function to apply
   * @returns this for chaining
   */
  forEach(fn: (vmobject: VMobject, index: number) => void): this {
    (this.children as VMobject[]).forEach(fn);
    return this;
  }

  /**
   * Map over all vmobjects in the group.
   * @param fn - Mapping function
   * @returns Array of mapped values
   */
  map<T>(fn: (vmobject: VMobject, index: number) => T): T[] {
    return (this.children as VMobject[]).map(fn);
  }

  /**
   * Filter vmobjects in the group.
   * @param fn - Filter predicate
   * @returns New VGroup with filtered vmobjects
   */
  filter(fn: (vmobject: VMobject, index: number) => boolean): VGroup {
    const filtered = (this.children as VMobject[]).filter(fn);
    return new VGroup(...filtered.map((m) => m.copy() as VMobject));
  }

  /**
   * Get all points from the VGroup as a flat array (override VMobject).
   * Returns combined points from all children.
   */
  override get points(): Point[] {
    const allPoints: Point[] = [];
    for (const child of this.children) {
      if (child instanceof VMobject) {
        allPoints.push(...child.points);
      }
    }
    return allPoints;
  }

  /**
   * Local-space points aggregated from all VMobject children.
   *
   * @post result === flatMap(vmobjectChildren, c => c.getLocalPoints())
   */
  override getLocalPoints(): number[][] {
    return this.getCombinedPoints();
  }

  /**
   * World-space points from this VGroup and all VMobject descendants.
   *
   * @post result === flatMap(allVMobjectDescendants, c => c.getPoints())
   */
  override getAllPoints(): number[][] {
    const result: number[][] = [];
    const collect = (mob: Mobject) => {
      if (mob instanceof VMobject && !(mob instanceof VGroup)) {
        result.push(...mob.getPoints());
      }
      for (const child of mob.children) collect(child);
    };
    for (const child of this.children) collect(child);
    return result;
  }

  /**
   * Distribute a flat point array back onto the children.
   *
   * A VGroup stores no geometry of its own — {@link getLocalPoints} aggregates the
   * children. The inherited VMobject.setPoints would write to the container's
   * unused `_points3D`, so a read-modify-write (Homotopy, ApplyPointwiseFunction,
   * ApplyWave, …) on a VGroup would be a silent no-op. This override partitions the
   * array in the same order getCombinedPoints concatenated it and assigns each slice
   * to its child, so the round-trip actually moves the children.
   *
   * @pre  points.length === sum over VMobject children of child.getLocalPoints().length
   * @post for each child i: child.getLocalPoints() === the i-th slice of points
   */
  override setPoints(points: Point[] | number[][]): this {
    const pts3D: number[][] =
      points.length === 0
        ? []
        : Array.isArray(points[0])
          ? (points as number[][]).map((p) => [p[0], p[1], p[2] ?? 0])
          : (points as Point[]).map((p) => [p.x, p.y, 0]);

    const vChildren = this.children.filter((c) => c instanceof VMobject) as VMobject[];
    const counts = vChildren.map((c) => c.getLocalPoints().length);
    const total = counts.reduce((n, c) => n + c, 0);
    if (pts3D.length !== total) {
      throw new Error(
        `VGroup.setPoints: expected ${total} points (sum of children's point counts), got ${pts3D.length}. ` +
          `A VGroup holds no points of its own; the array must partition across its children.`,
      );
    }

    let offset = 0;
    for (let i = 0; i < vChildren.length; i++) {
      vChildren[i].setPoints(pts3D.slice(offset, offset + counts[i]));
      offset += counts[i];
    }
    this._markDirtyUpward();
    return this;
  }
}
