/**
 * VDict and VectorizedPoint classes for dictionary-based VMobject access
 * and single-point VMobjects.
 */

import * as THREE from 'three';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { Vector3Tuple } from './Mobject';

/**
 * VDict provides dictionary-like access to named VMobjects.
 * Useful for creating complex structures with named parts.
 *
 * The submobjects are the dictionary values, allowing iteration
 * and group operations while maintaining named access.
 *
 * @example
 * ```typescript
 * const face = new VDict({
 *   leftEye: new Circle({ radius: 0.2 }),
 *   rightEye: new Circle({ radius: 0.2 }),
 *   mouth: new Arc({ angle: Math.PI }),
 * });
 *
 * // Access by name
 * face.get('leftEye')?.setColor('blue');
 *
 * // Iterate over entries
 * for (const [name, vmobject] of face.entries()) {
 *   console.log(name, vmobject);
 * }
 * ```
 */
export class VDict extends VGroup {
  /**
   * Internal dictionary mapping names to VMobjects.
   */
  private _dict: Map<string, VMobject> = new Map();

  /**
   * Create a VDict from a dictionary of named VMobjects.
   * @param items - Object mapping names to VMobjects
   */
  constructor(items: Record<string, VMobject> = {}) {
    super();

    for (const [name, vmobject] of Object.entries(items)) {
      this.set(name, vmobject);
    }
  }

  /**
   * Get a VMobject by key (string) or index (number).
   * Overrides VGroup.get() to support both access patterns.
   * @param keyOrIndex - Name/key of the VMobject (string) or index (number)
   * @returns The VMobject, or undefined if not found
   */
  override get(keyOrIndex: string | number): VMobject | undefined {
    if (typeof keyOrIndex === 'string') {
      return this._dict.get(keyOrIndex);
    }
    // Numeric index - delegate to parent
    return super.get(keyOrIndex);
  }

  /**
   * Set a VMobject with a name. If a VMobject with this name already exists,
   * it will be replaced.
   * @param key - Name/key for the VMobject
   * @param vmobject - VMobject to add
   * @returns this for chaining
   */
  set(key: string, vmobject: VMobject): this {
    // Remove existing with same name
    if (this._dict.has(key)) {
      this.delete(key);
    }

    this._dict.set(key, vmobject);
    this.addVMobjects(vmobject);
    return this;
  }

  /**
   * Check if a key exists in the VDict.
   * @param key - Name/key to check
   * @returns true if the key exists
   */
  has(key: string): boolean {
    return this._dict.has(key);
  }

  /**
   * Remove a VMobject by key from this VDict.
   * @param key - Name/key of the VMobject to remove
   * @returns true if an element was removed, false otherwise
   */
  delete(key: string): boolean {
    const vmobject = this._dict.get(key);
    if (vmobject) {
      this._dict.delete(key);
      this.removeVMobjects(vmobject);
      return true;
    }
    return false;
  }

  /**
   * Get all keys in the VDict.
   * @returns Iterator of keys
   */
  keys(): IterableIterator<string> {
    return this._dict.keys();
  }

  /**
   * Get all VMobjects in the VDict.
   * @returns Iterator of VMobjects
   */
  values(): IterableIterator<VMobject> {
    return this._dict.values();
  }

  /**
   * Get all entries as [key, VMobject] pairs.
   * @returns Iterator of [key, VMobject] tuples
   */
  entries(): IterableIterator<[string, VMobject]> {
    return this._dict.entries();
  }

  /**
   * Iterate over vmobjects with a callback.
   * Overrides VGroup.forEach() to match parent signature.
   * @param fn - Callback function receiving (vmobject, index)
   * @returns this for chaining
   */
  override forEach(fn: (vmobject: VMobject, index: number) => void): this {
    return super.forEach(fn);
  }

  /**
   * Iterate over entries with a callback (dict-style).
   * @param fn - Callback function receiving (vmobject, key, dict)
   * @returns this for chaining
   */
  forEachEntry(fn: (vmobject: VMobject, key: string, dict: VDict) => void): this {
    this._dict.forEach((vmobject, key) => fn(vmobject, key, this));
    return this;
  }

  /**
   * Clear all entries from the VDict.
   * @returns this for chaining
   */
  clear(): this {
    for (const vmobject of this._dict.values()) {
      this.removeVMobjects(vmobject);
    }
    this._dict.clear();
    return this;
  }

  /**
   * Get the number of named items.
   */
  get size(): number {
    return this._dict.size;
  }

  /**
   * Allow bracket-style access via proxy.
   * Note: This creates a proxy wrapper. For performance-critical code,
   * use the get() method directly.
   * @returns A proxy allowing bracket access like vdict['key']
   */
  asProxy(): VDict & { [key: string]: VMobject | undefined } {
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === 'string' && target._dict.has(prop)) {
          return target._dict.get(prop);
        }
        return (target as any)[prop];
      },
      set(target, prop, value) {
        if (typeof prop === 'string' && value instanceof VMobject) {
          target.set(prop, value);
          return true;
        }
        (target as any)[prop] = value;
        return true;
      },
      has(target, prop) {
        if (typeof prop === 'string') {
          return target._dict.has(prop) || prop in target;
        }
        return prop in target;
      }
    }) as unknown as VDict & { [key: string]: VMobject | undefined };
  }

  /**
   * Create a copy of this VDict.
   */
  protected override _createCopy(): VMobject {
    return new VDict();
  }

  /**
   * Override copy to properly handle the dictionary mapping.
   */
  override copy(): VMobject {
    const clone = new VDict();

    // Copy base properties
    clone.position.copy(this.position);
    clone.rotation.copy(this.rotation);
    clone.scaleVector.copy(this.scaleVector);
    clone.color = this.color;
    clone._opacity = this._opacity;
    clone.strokeWidth = this.strokeWidth;
    clone.fillOpacity = this.fillOpacity;
    clone._style = { ...this._style };

    // Deep copy children with their names
    for (const [name, vmobject] of this._dict.entries()) {
      const vmobjectCopy = vmobject.copy() as VMobject;
      clone.set(name, vmobjectCopy);
    }

    clone._markDirty();
    return clone;
  }

  // ============================================================
  // Backward compatibility aliases (matching the old API in VGroup.ts)
  // ============================================================

  /**
   * Add a named VMobject to this VDict (alias for set).
   * @param name - Name/key for the VMobject
   * @param vmobject - VMobject to add
   * @returns this for chaining
   * @deprecated Use set() instead
   */
  addNamed(name: string, vmobject: VMobject): this {
    return this.set(name, vmobject);
  }

  /**
   * Remove a named VMobject from this VDict (alias for delete).
   * @param name - Name/key of the VMobject to remove
   * @returns this for chaining
   * @deprecated Use delete() instead
   */
  removeNamed(name: string): this {
    this.delete(name);
    return this;
  }

  /**
   * Get a VMobject by name (alias for get with string key).
   * @param name - Name/key of the VMobject
   * @returns The VMobject, or undefined if not found
   * @deprecated Use get() instead
   */
  getItem(name: string): VMobject | undefined {
    return this.get(name);
  }

  /**
   * Alias for get - get a VMobject by name.
   * @param name - Name/key of the VMobject
   * @returns The VMobject, or undefined if not found
   * @deprecated Use get() instead
   */
  getByName(name: string): VMobject | undefined {
    return this.get(name);
  }
}

/**
 * VectorizedPoint represents a single point as a VMobject.
 *
 * Useful as a location marker, invisible anchor, or for
 * tracking positions in animations.
 *
 * Unlike a regular VMobject, VectorizedPoint has no stroke or fill
 * by default - it's invisible but still has a position.
 *
 * @example
 * ```typescript
 * // Create a point at the origin
 * const marker = new VectorizedPoint();
 *
 * // Create a point at a specific location
 * const p = new VectorizedPoint([2, 3, 0]);
 *
 * // Get and set location
 * console.log(p.getLocation()); // [2, 3, 0]
 * p.setLocation([4, 5, 0]);
 * ```
 */
export class VectorizedPoint extends VMobject {
  /**
   * Create a VectorizedPoint at the given location.
   * @param location - The point location as [x, y, z], defaults to [0, 0, 0]
   */
  constructor(location: Vector3Tuple = [0, 0, 0]) {
    super();

    // VectorizedPoint is invisible by default
    this._opacity = 0;
    this.fillOpacity = 0;
    this.strokeWidth = 0;
    this._style.fillOpacity = 0;
    this._style.strokeOpacity = 0;

    // Set the single point
    this.setLocation(location);
  }

  /**
   * Get the location of this point.
   * @returns The location as [x, y, z]
   */
  getLocation(): Vector3Tuple {
    if (this._points3D.length > 0) {
      const p = this._points3D[0];
      return [p[0], p[1], p[2]];
    }
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Set the location of this point.
   * @param point - The new location as [x, y, z]
   * @returns this for chaining
   */
  setLocation(point: Vector3Tuple): this {
    // Store as a single point in the points array
    this._points3D = [[point[0], point[1], point[2]]];
    this._points2D = [{ x: point[0], y: point[1] }];
    this._markDirty();
    return this;
  }

  /**
   * Get the center of this point (same as getLocation).
   * @returns The location as [x, y, z]
   */
  override getCenter(): Vector3Tuple {
    return this.getLocation();
  }

  /**
   * Move this point to a new location.
   * @param point - Target position [x, y, z]
   * @returns this for chaining
   */
  override moveTo(point: Vector3Tuple): this {
    return this.setLocation(point);
  }

  /**
   * Shift this point by a delta.
   * @param delta - Translation vector [x, y, z]
   * @returns this for chaining
   */
  override shift(delta: Vector3Tuple): this {
    const current = this.getLocation();
    return this.setLocation([
      current[0] + delta[0],
      current[1] + delta[1],
      current[2] + delta[2]
    ]);
  }

  /**
   * Create the Three.js backing object.
   * VectorizedPoint is invisible, so we just create an empty group.
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();
    // Position the group at the point location
    const loc = this.getLocation();
    group.position.set(loc[0], loc[1], loc[2]);
    return group;
  }

  /**
   * Sync to Three.js - update position.
   */
  protected override _syncMaterialToThree(): void {
    if (this._threeObject) {
      const loc = this.getLocation();
      this._threeObject.position.set(loc[0], loc[1], loc[2]);
    }
  }

  /**
   * Create a copy of this VectorizedPoint.
   */
  protected override _createCopy(): VMobject {
    return new VectorizedPoint(this.getLocation());
  }

  /**
   * Copy this VectorizedPoint.
   */
  override copy(): VMobject {
    return this._createCopy();
  }
}

export default VDict;
