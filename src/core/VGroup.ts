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
   * Get the center of the group (average of all children centers).
   * @returns Center position as [x, y, z]
   */
  override getCenter(): Vector3Tuple {
    if (this.children.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

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
   * Shift all children by the given delta.
   * Only shifts children's internal positions, not the group's own position,
   * to avoid double-counting in THREE.js hierarchy.
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    for (const child of this.children) {
      child.shift(delta);
    }
    this._markDirty();
    return this;
  }

  /**
   * Move the group center to the given point, or align with another Mobject.
   * @param target - Target position [x, y, z] or Mobject to align with
   * @param alignedEdge - Optional edge direction to align (e.g., UL aligns upper-left edges)
   * @returns this for chaining
   */
  override moveTo(target: Vector3Tuple | Mobject, alignedEdge?: Vector3Tuple): this {
    if (!Array.isArray(target)) {
      // Mobject target: delegate to base which uses shift
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
      return this.moveTo(targetCenter);
    }
    const currentCenter = this.getCenter();
    const delta: Vector3Tuple = [
      target[0] - currentCenter[0],
      target[1] - currentCenter[1],
      target[2] - currentCenter[2]
    ];
    return this.shift(delta);
  }

  /**
   * Rotate all children around an axis.
   * @param angle - Rotation angle in radians
   * @param axis - Axis of rotation [x, y, z], defaults to Z axis
   * @returns this for chaining
   */
  override rotate(angle: number, axis: Vector3Tuple = [0, 0, 1]): this {
    // Apply to group's own rotation
    super.rotate(angle, axis);

    // Also rotate each child
    for (const child of this.children) {
      child.rotate(angle, axis);
    }

    return this;
  }

  /**
   * Scale all children about the group's center.
   * Each child's size is scaled, and their positions are repositioned
   * relative to the group center — matching Manim Python behavior.
   * Does not change the group's own scaleVector.
   * @param factor - Scale factor (number for uniform, tuple for non-uniform)
   * @returns this for chaining
   */
  override scale(factor: number | Vector3Tuple): this {
    const center = this.getCenter();
    const fx = typeof factor === 'number' ? factor : factor[0];
    const fy = typeof factor === 'number' ? factor : factor[1];
    const fz = typeof factor === 'number' ? factor : factor[2];

    for (const child of this.children) {
      const cc = child.getCenter();
      // Scale child's own size (about its own center)
      child.scale(factor);
      // Reposition child about the group center
      child.moveTo([
        center[0] + (cc[0] - center[0]) * fx,
        center[1] + (cc[1] - center[1]) * fy,
        center[2] + (cc[2] - center[2]) * fz,
      ]);
    }

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
  override setOpacity(opacity: number): this {
    super.setOpacity(opacity);
    for (const child of this.children) {
      child.setOpacity(opacity);
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
          child.setOpacity(opacity);
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

    // Arrange subsequent children next to the previous one
    for (let i = 1; i < this.children.length; i++) {
      const child = this.children[i];
      child.nextTo(prevChild, direction, buff);
      prevChild = child;
    }

    // Recenter if requested
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
   * Arrange children in a submobject grid (alias for arrangeInGrid).
   */
  arrangeSubmobjects(rows?: number, cols?: number, buffX?: number, buffY?: number): this {
    return this.arrangeInGrid(rows, cols, buffX, buffY);
  }

  /**
   * Get combined path points from all children.
   * @returns Combined array of points from all children
   */
  getCombinedPoints(): number[][] {
    const allPoints: number[][] = [];
    for (const child of this.children) {
      if (child instanceof VMobject) {
        allPoints.push(...child.getPoints());
      }
    }
    return allPoints;
  }

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
   * Copy this VGroup.
   */
  override copy(): VMobject {
    return super.copy();
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
    return new VGroup(...filtered.map(m => m.copy() as VMobject));
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
  override getPoints(): number[][] {
    return this.getCombinedPoints();
  }
}

export default VGroup;
