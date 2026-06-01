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
   * @post this.isEmpty() => result === this._parentLocalToWorld([position.x, position.y, position.z])
   * @post !this.isEmpty() => result[i] === (worldBbox.min[i] + worldBbox.max[i]) / 2
   */
  override getCenter(): Vector3Tuple {
    // position is parent-local; lift to world so the empty fallback matches the
    // world-space bbox branch (and the base Mobject.getCenter convention).
    if (this.isEmpty()) {
      return this._parentLocalToWorld([this.position.x, this.position.y, this.position.z]);
    }
    const b = this.getBounds();
    return [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2];
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
      this.moveTo(originalCenter);
    }

    this._markDirty();
    return this;
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

    // Recenter to original position
    this.moveTo(originalCenter);

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

  /**
   * Create a copy of this VGroup.
   */
  protected override _createCopy(): VMobject {
    // Create an empty group; children are copied in Mobject.copy()
    return new VGroup();
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
   * Get all 3D points from the VGroup.
   */
  override getLocalPoints(): number[][] {
    return this.getCombinedPoints();
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
