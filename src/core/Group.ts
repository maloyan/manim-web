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

    if (!this.isEmpty()) {
      this.normalizeTransform();
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

  override isEmpty(): boolean {
    return this.children.length === 0 || this.children.every((child) => child.isEmpty());
  }

  /**
   * Center in world coordinates (bbox midpoint of descendant geometry).
   *
   * @post this.isEmpty() => result === this._parentLocalToWorld([position.x, position.y, position.z])
   * @post !this.isEmpty() => result[i] === (worldBbox.min[i] + worldBbox.max[i]) / 2
   */
  override getCenter(): Vector3Tuple {
    // isEmpty() (not children.length): a group with only empty children (async
    // Text/MathTex glyph containers, nested empty VGroups) has no geometry, so
    // getBounds() would throw "empty Three.js bounds". position is parent-local,
    // so lift it to world to stay consistent with the bbox branch.
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
   * Set the stroke opacity of all children.
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

  override getDisplayMeshLength(): number {
    return this.children.reduce((sum, child) => sum + child.getDisplayMeshLength(), 0);
  }

  override getDisplayMeshes(): THREE.Mesh[] {
    return this.children.flatMap((child) => child.getDisplayMeshes());
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
    return new Group(...filtered.map((m) => m.copy()));
  }
}
