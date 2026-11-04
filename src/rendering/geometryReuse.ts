/**
 * In-place GPU buffer reuse for geometry that is rebuilt every frame.
 *
 * A Transform, `.animate`, or updater rewrites a VMobject's points every frame,
 * but almost always keeps the same point count. Swapping in a brand-new
 * geometry each frame makes three.js delete and re-create the GL buffers and
 * vertex array object, and recompute bounds, for every mobject on every frame.
 * Writing into the existing typed arrays instead lets three.js re-upload with
 * `bufferSubData` and keep its VAO.
 *
 * Each helper returns `false` when the layout does not match (a different
 * point count, a missing attribute); the caller then falls back to building a
 * new geometry, so behavior is unchanged in every case.
 */
import * as THREE from 'three';
import type { InterleavedBufferAttribute } from 'three';
import type { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

const tmpStart = new THREE.Vector3();
const tmpEnd = new THREE.Vector3();

/**
 * Copy every attribute of `source` into the matching attribute of `target`.
 *
 * Both geometries must be non-indexed and have the same attribute names, item
 * sizes, and array lengths. `source` is left untouched; the caller disposes it.
 *
 * @returns true when `target` now holds `source`'s data; false (and `target`
 * unchanged) when the layouts differ.
 * @post result => target.getAttribute(k).array equals source.getAttribute(k).array for every k
 */
export function copyGeometryInPlace(
  target: THREE.BufferGeometry,
  source: THREE.BufferGeometry,
): boolean {
  if (target.index !== null || source.index !== null) return false;
  const names = Object.keys(source.attributes);
  if (names.length !== Object.keys(target.attributes).length) return false;

  for (const name of names) {
    const src = source.attributes[name];
    const dst = target.attributes[name];
    if (!(src instanceof THREE.BufferAttribute) || !(dst instanceof THREE.BufferAttribute)) {
      return false;
    }
    if (src.itemSize !== dst.itemSize || src.array.length !== dst.array.length) return false;
    if (src.array.constructor !== dst.array.constructor) return false;
  }

  for (const name of names) {
    const dst = target.attributes[name] as THREE.BufferAttribute;
    (dst.array as Float32Array).set(source.attributes[name].array);
    dst.needsUpdate = true;
  }
  // Bounds are recomputed lazily by the code that reads them (raycast, Box3).
  target.boundingBox = null;
  target.boundingSphere = null;
  return true;
}

/**
 * Write a polyline into an existing Line2 `LineGeometry` without reallocating.
 *
 * Equivalent to `geometry.setPositions(positions)` followed by
 * `line.computeLineDistances()`, but reuses the instance and line-distance
 * buffers. Requires the geometry to already hold a polyline with the same
 * number of points and to have line distances computed.
 *
 * @pre positions.length % 3 === 0
 * @returns true when updated in place; false (geometry unchanged) otherwise.
 */
export function setLinePositionsInPlace(
  geometry: LineGeometry,
  positions: ArrayLike<number>,
): boolean {
  const start = geometry.attributes.instanceStart as InterleavedBufferAttribute | undefined;
  const distStart = geometry.attributes.instanceDistanceStart as
    InterleavedBufferAttribute | undefined;
  if (!start || !distStart) return false;

  const segments = positions.length / 3 - 1;
  const segData = start.data.array as Float32Array;
  const distData = distStart.data.array as Float32Array;
  if (segments < 1 || segData.length !== segments * 6 || distData.length !== segments * 2) {
    return false;
  }

  // Same pairs layout as LineGeometry.setPositions: [x0 y0 z0 x1 y1 z1] per segment.
  for (let i = 0, j = 0; i < segments * 3; i += 3, j += 6) {
    segData[j] = positions[i];
    segData[j + 1] = positions[i + 1];
    segData[j + 2] = positions[i + 2];
    segData[j + 3] = positions[i + 3];
    segData[j + 4] = positions[i + 4];
    segData[j + 5] = positions[i + 5];
  }
  start.data.needsUpdate = true;

  // Same cumulative distances as LineSegments2.computeLineDistances.
  const end = geometry.attributes.instanceEnd as InterleavedBufferAttribute;
  for (let i = 0, j = 0; i < segments; i++, j += 2) {
    tmpStart.fromBufferAttribute(start, i);
    tmpEnd.fromBufferAttribute(end, i);
    distData[j] = j === 0 ? 0 : distData[j - 1];
    distData[j + 1] = distData[j] + tmpStart.distanceTo(tmpEnd);
  }
  distStart.data.needsUpdate = true;

  geometry.boundingBox = null;
  geometry.boundingSphere = null;
  return true;
}
