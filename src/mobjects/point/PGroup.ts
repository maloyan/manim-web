import * as THREE from 'three';
import { Mobject, Vector3Tuple, RIGHT } from '../../core/Mobject';
import { PMobject } from './PMobject';

/**
 * Options for creating a PGroup
 */
export interface PGroupOptions {
  /** Initial PMobjects to add */
  pmobjects?: PMobject[];
}

/**
 * PGroup - Group of PMobjects
 *
 * Similar to Group but specifically for PMobjects. Operations
 * applied to the group cascade to all children.
 *
 * @example
 * ```typescript
 * const p1 = new PMobject({ points: [{ position: [0, 0, 0] }] });
 * const p2 = new PMobject({ points: [{ position: [1, 1, 0] }] });
 * const group = new PGroup({ pmobjects: [p1, p2] });
 *
 * // Move all PMobjects
 * group.shift([1, 0, 0]);
 * ```
 */
export class PGroup extends Mobject {
  constructor(options: PGroupOptions = {}) {
    super();

    const { pmobjects = [] } = options;

    for (const pmobject of pmobjects) {
      this.add(pmobject);
    }
  }

  /**
   * Add a PMobject to this group
   * @param pmobject - PMobject to add
   * @returns this for chaining
   */
  addPMobject(pmobject: PMobject): this {
    return this.add(pmobject);
  }

  /**
   * Add multiple PMobjects to this group
   * @param pmobjects - PMobjects to add
   * @returns this for chaining
   */
  addPMobjects(...pmobjects: PMobject[]): this {
    for (const pmobject of pmobjects) {
      this.add(pmobject);
    }
    return this;
  }

  /**
   * Remove a PMobject from this group
   * @param pmobject - PMobject to remove
   * @returns this for chaining
   */
  removePMobject(pmobject: PMobject): this {
    return this.remove(pmobject);
  }

  /**
   * Get the center of the group
   * @returns Center position as [x, y, z]
   */
  override getCenter(): Vector3Tuple {
    if (this.children.length === 0) {
      return [this.position.x, this.position.y, this.position.z];
    }

    let sumX = 0,
      sumY = 0,
      sumZ = 0;
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
      this.position.z + sumZ / count,
    ];
  }

  /**
   * Shift all children by the given delta
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    super.shift(delta);
    for (const child of this.children) {
      child.shift(delta);
    }
    return this;
  }

  /**
   * Move the group center to the given point
   * @param point - Target position [x, y, z]
   * @returns this for chaining
   */
  override moveTo(point: Vector3Tuple): this {
    const currentCenter = this.getCenter();
    const delta: Vector3Tuple = [
      point[0] - currentCenter[0],
      point[1] - currentCenter[1],
      point[2] - currentCenter[2],
    ];
    return this.shift(delta);
  }

  /**
   * Set the color of all children
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
   * Set the opacity of all children
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
   * Set the point size of all PMobject children
   * @param size - Size in pixels
   * @returns this for chaining
   */
  setPointSize(size: number): this {
    for (const child of this.children) {
      if (child instanceof PMobject) {
        child.setPointSize(size);
      }
    }
    return this;
  }

  /**
   * Arrange children in a row or column
   * @param direction - Direction to arrange
   * @param buff - Buffer between children
   * @returns this for chaining
   */
  arrange(direction: Vector3Tuple = RIGHT, buff: number = 0.25): this {
    if (this.children.length === 0) return this;

    const originalCenter = this.getCenter();

    let prevChild = this.children[0];
    for (let i = 1; i < this.children.length; i++) {
      const child = this.children[i];
      child.nextTo(prevChild, direction, buff);
      prevChild = child;
    }

    this.moveTo(originalCenter);
    this._markDirty();
    return this;
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    for (const child of this.children) {
      group.add(child.getThreeObject());
    }

    return group;
  }

  /**
   * Create a copy of this PGroup
   */
  protected override _createCopy(): PGroup {
    return new PGroup();
  }

  /**
   * Get the number of PMobjects in this group
   */
  get length(): number {
    return this.children.length;
  }

  /**
   * Get a PMobject by index
   * @param index - Index of the PMobject
   */
  get(index: number): PMobject | undefined {
    return this.children[index] as PMobject | undefined;
  }

  /**
   * Iterate over all PMobjects in the group
   */
  [Symbol.iterator](): Iterator<PMobject> {
    return (this.children as PMobject[])[Symbol.iterator]();
  }
}
