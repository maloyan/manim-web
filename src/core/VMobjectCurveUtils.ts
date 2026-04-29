/**
 * Curve utility functions and classes that create VMobject instances.
 *
 * These are separated from VMobject.ts to keep line counts under control,
 * and from VMobjectCurves.ts which only contains pure helpers (no VMobject construction).
 */

import { VMobject } from './VMobject';
import { getNumCurvesFromPoints } from './VMobjectCurves';

/**
 * Get the number of curve segments in a VMobject.
 * Each cubic Bezier segment uses 4 points (anchor, handle, handle, anchor),
 * with consecutive segments sharing anchors.
 * @param vmobject - The VMobject to count curves from
 * @returns Number of curve segments
 */
export function getNumCurves(vmobject: VMobject): number {
  return getNumCurvesFromPoints(vmobject.getPoints());
}

/**
 * Get the nth curve segment from a VMobject as a new VMobject.
 * @param vmobject - The source VMobject
 * @param n - Index of the curve segment (0-based)
 * @returns A new VMobject containing just that curve segment
 */
export function getNthCurve(vmobject: VMobject, n: number): VMobject {
  const points = vmobject.getPoints();
  const numCurves = getNumCurvesFromPoints(points);

  if (n < 0 || n >= numCurves) {
    throw new Error(`Curve index ${n} out of range. VMobject has ${numCurves} curves.`);
  }

  const startIndex = n * 3;
  const curvePoints = points.slice(startIndex, startIndex + 4);

  const curve = new VMobject();
  curve.setPoints(curvePoints);

  curve.setColor(vmobject.color);
  curve.setStrokeOpacity(vmobject.opacity);
  curve.setStrokeWidth(vmobject.strokeWidth);
  curve.setFillOpacity(vmobject.fillOpacity);

  return curve;
}

/**
 * Split a VMobject's curves into separate VMobject submobjects.
 * Each cubic Bezier curve segment becomes its own VMobject child.
 * Useful for animating parts of a path independently (e.g., staggered animations).
 *
 * @param vmobject - The VMobject to split
 * @returns A new VMobject with each curve as a child submobject
 *
 * @example
 * ```typescript
 * const path = new VMobject();
 * path.setPoints([...complex path with multiple curves...]);
 *
 * // Split into individual curves for staggered animation
 * const curves = curvesAsSubmobjects(path);
 *
 * // Now animate each curve independently
 * for (const curve of curves.children) {
 *   scene.play(Create(curve));
 * }
 * ```
 */
export function curvesAsSubmobjects(vmobject: VMobject): VMobject {
  const numCurves = getNumCurvesFromPoints(vmobject.getPoints());

  const parent = new VMobject();

  parent.position.copy(vmobject.position);
  parent.rotation.copy(vmobject.rotation);
  parent.scaleVector.copy(vmobject.scaleVector);

  parent.clearPoints();
  parent.setFillOpacity(0);

  for (let i = 0; i < numCurves; i++) {
    const curve = getNthCurve(vmobject, i);
    parent.add(curve);
  }

  return parent;
}

/**
 * CurvesAsSubmobjects class - Splits a VMobject's curves into separate submobjects.
 *
 * This class extends VMobject and creates children where each child is a single
 * cubic Bezier curve segment from the source VMobject. This is useful for:
 * - Staggered animations (animate each curve segment with delay)
 * - Per-curve styling (color each segment differently)
 * - Selective curve manipulation
 *
 * @example
 * ```typescript
 * const path = new VMobject();
 * path.setPoints([...]);
 *
 * const curves = new CurvesAsSubmobjects(path);
 *
 * // Access individual curves
 * curves.children[0].setColor('red');
 * curves.children[1].setColor('blue');
 * ```
 */
export class CurvesAsSubmobjects extends VMobject {
  /** The source VMobject this was created from */
  protected _source: VMobject | null = null;

  /**
   * Create a CurvesAsSubmobjects from a VMobject.
   * @param vmobject - The VMobject to split into curve submobjects
   */
  constructor(vmobject?: VMobject) {
    super();

    // No fill for the container
    this.fillOpacity = 0;
    this._style.fillOpacity = 0;

    if (vmobject) {
      this.setFromVMobject(vmobject);
    }
  }

  /**
   * Set up this object from a VMobject, splitting its curves into children.
   * @param vmobject - The source VMobject
   * @returns this for chaining
   */
  setFromVMobject(vmobject: VMobject): this {
    this._source = vmobject;

    // Clear existing children
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }

    // Clear own points
    this.clearPoints();

    // Copy transform properties
    this.position.copy(vmobject.position);
    this.rotation.copy(vmobject.rotation);
    this.scaleVector.copy(vmobject.scaleVector);

    // Extract each curve as a child
    const numCurves = getNumCurvesFromPoints(vmobject.getPoints());
    for (let i = 0; i < numCurves; i++) {
      const curve = getNthCurve(vmobject, i);
      this.add(curve);
    }

    this._markDirty();
    return this;
  }

  /**
   * Get the number of curve segments (same as number of children).
   */
  get numCurves(): number {
    return this.children.length;
  }

  /**
   * Get the nth curve as a VMobject.
   * @param n - Index of the curve (0-based)
   * @returns The curve VMobject at that index
   */
  getCurve(n: number): VMobject {
    if (n < 0 || n >= this.children.length) {
      throw new Error(`Curve index ${n} out of range. Has ${this.children.length} curves.`);
    }
    return this.children[n] as VMobject;
  }

  /**
   * Iterate over all curves.
   */
  [Symbol.iterator](): Iterator<VMobject> {
    return (this.children as VMobject[])[Symbol.iterator]();
  }

  /**
   * Apply a function to each curve.
   * @param fn - Function to apply
   * @returns this for chaining
   */
  forEach(fn: (curve: VMobject, index: number) => void): this {
    (this.children as VMobject[]).forEach(fn);
    return this;
  }

  /**
   * Map over all curves.
   * @param fn - Mapping function
   * @returns Array of mapped values
   */
  map<T>(fn: (curve: VMobject, index: number) => T): T[] {
    return (this.children as VMobject[]).map(fn);
  }

  /**
   * Create a copy of this CurvesAsSubmobjects.
   */
  protected override _createCopy(): VMobject {
    const copy = new CurvesAsSubmobjects();
    copy._source = this._source;
    return copy;
  }
}
