/**
 * CPU-side bounding-box utilities for VMobject geometry.
 *
 * Mobjects use two different strategies to compute bounding boxes.
 *
 * Most mobjects (Sphere, Cube, Image, PMobject, ...) delegate to Three.js
 * via Box3.setFromObject(). Their geometries are standard BufferGeometry
 * subclasses, so computeBoundingBox() can read vertex positions from the
 * 'position' attribute on the CPU.
 *
 * VMobjects use the point-math utilities in this file instead. Their stroke
 * rendering relies on Line2 (three/examples/jsm/lines), whose LineGeometry
 * stores endpoints in instanceStart/instanceEnd rather than 'position'.
 * computeBoundingBox() therefore finds no position data and leaves
 * boundingBox null.
 *
 * The control points are available on the CPU; this is a gap in the Line2
 * extras as of three.js 0.184, not a fundamental constraint. If a future
 * release fixes this, VMobject.getBounds() can be removed and
 * Mobject.getBounds() will work uniformly for all types.
 */

export interface PointBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

/**
 * Compute axis-aligned bounds for a list of 3D points.
 * Returns null when input is empty.
 */
export function computePointBounds(points: number[][]): PointBounds | null {
  if (points.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const p of points) {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
    if (p[2] < minZ) minZ = p[2];
    if (p[2] > maxZ) maxZ = p[2];
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}
