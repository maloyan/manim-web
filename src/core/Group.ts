/**
 * Group class for grouping multiple mobjects together.
 * Transformations applied to the group cascade to all children.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from './Mobject';

/**
 * A Group is a Mobject that contains other Mobjects.
 * Operations on the group apply to all children.
 */
export class Group extends Mobject {
  /**
   * Create a new Group containing the given mobjects.
   * @param mobjects - Mobjects to add to the group
   */
  constructor(...mobjects: Mobject[]) {
    super();

    for (const mobject of mobjects) {
      this.add(mobject);
    }
  }

  /**
   * Add a mobject to this group.
   * @param mobject - Mobject to add
   * @returns this for chaining
   */
  override add(mobject: Mobject): this {
    // Remove from previous parent if any
    if (mobject.parent) {
      mobject.parent.remove(mobject);
    }

    mobject.parent = this;
    this.children.push(mobject);

    // Sync Three.js hierarchy
    if (this._threeObject) {
      const childThree = mobject.getThreeObject();
      if (!this._threeObject.children.includes(childThree)) {
        this._threeObject.add(childThree);
      }
    }

    return this;
  }

  /**
   * Remove a mobject from this group.
   * @param mobject - Mobject to remove
   * @returns this for chaining
   */
  override remove(mobject: Mobject): this {
    const index = this.children.indexOf(mobject);
    if (index !== -1) {
      this.children.splice(index, 1);
      mobject.parent = null;

      if (this._threeObject && mobject._threeObject) {
        this._threeObject.remove(mobject._threeObject);
      }
    }
    return this;
  }

  /**
   * Remove all children from this group.
   * @returns this for chaining
   */
  clear(): this {
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }
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
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    // Apply to group's own position
    super.shift(delta);

    // Also shift children in local space
    for (const child of this.children) {
      child.shift(delta);
    }

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
   * Scale all children.
   * @param factor - Scale factor (number for uniform, tuple for non-uniform)
   * @returns this for chaining
   */
  override scale(factor: number | Vector3Tuple): this {
    // Apply to group's own scale
    super.scale(factor);

    // Also scale each child
    for (const child of this.children) {
      child.scale(factor);
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
      child.setFillOpacity(opacity);
    }
    return this;
  }

  /**
   * Create the Three.js backing object for this Group.
   * A group is simply a THREE.Group that contains children.
   */
  protected _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Add all children's Three.js objects
    for (const child of this.children) {
      group.add(child.getThreeObject());
    }

    return group;
  }

  /**
   * Create a copy of this Group.
   */
  protected override _createCopy(): Group {
    // Create an empty group; children are copied in Mobject.copy()
    return new Group();
  }

  /**
   * Get the number of mobjects in this group.
   */
  get length(): number {
    return this.children.length;
  }

  /**
   * Get a mobject by index.
   * @param index - Index of the mobject
   * @returns The mobject at the given index, or undefined
   */
  get(index: number): Mobject | undefined {
    return this.children[index];
  }

  /**
   * Iterate over all mobjects in the group.
   */
  [Symbol.iterator](): Iterator<Mobject> {
    return this.children[Symbol.iterator]();
  }

  /**
   * Apply a function to each mobject in the group.
   * @param fn - Function to apply
   * @returns this for chaining
   */
  forEach(fn: (mobject: Mobject, index: number) => void): this {
    this.children.forEach(fn);
    return this;
  }

  /**
   * Map over all mobjects in the group.
   * @param fn - Mapping function
   * @returns Array of mapped values
   */
  map<T>(fn: (mobject: Mobject, index: number) => T): T[] {
    return this.children.map(fn);
  }

  /**
   * Filter mobjects in the group.
   * @param fn - Filter predicate
   * @returns New Group with filtered mobjects
   */
  filter(fn: (mobject: Mobject, index: number) => boolean): Group {
    const filtered = this.children.filter(fn);
    return new Group(...filtered.map(m => m.copy()));
  }
}

export default Group;
