import * as THREE from 'three';
import type { MobjectLike, Vector3Tuple } from './MobjectTypes';
import { isVMobjectLike } from './MobjectTypes';

// Performance optimization: Object pooling for temporary vectors
// These are shared to avoid allocation in hot paths
const _tempVec3: THREE.Vector3 = new THREE.Vector3();
const _tempBox3: THREE.Box3 = new THREE.Box3();
const _tempQuaternion: THREE.Quaternion = new THREE.Quaternion();
const _tempQuaternion2: THREE.Quaternion = new THREE.Quaternion();

/**
 * Rotate a mobject around an axis.
 * Uses object pooling to avoid allocations in hot paths.
 */
export function rotateMobject(
  mob: MobjectLike,
  angle: number,
  axisOrOptions?: Vector3Tuple | { axis?: Vector3Tuple; aboutPoint?: Vector3Tuple },
): void {
  let axis: Vector3Tuple = [0, 0, 1];
  let aboutPoint: Vector3Tuple | undefined;

  if (axisOrOptions) {
    if (Array.isArray(axisOrOptions)) {
      axis = axisOrOptions;
    } else {
      axis = axisOrOptions.axis ?? [0, 0, 1];
      aboutPoint = axisOrOptions.aboutPoint;
    }
  }

  // For VMobjects with point data, transform points directly (Manim Python behavior)
  if (isVMobjectLike(mob) && mob._points3D.length > 0) {
    _rotateVMobjectPoints(mob, angle, axis, aboutPoint);
  } else {
    // Non-VMobject fallback: use Three.js transform
    _rotateWithThreeJS(mob, angle, axis, aboutPoint);
  }
}

/**
 * Rotate VMobject points directly (Manim Python behavior).
 */
function _rotateVMobjectPoints(
  mob: MobjectLike,
  angle: number,
  axis: Vector3Tuple,
  aboutPoint: Vector3Tuple | undefined,
): void {
  // Cast is safe here: caller checks isVMobjectLike
  const vmob = mob as MobjectLike & { _points3D: number[][]; _geometryDirty: boolean };
  const points: number[][] = vmob._points3D;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // When no aboutPoint specified, rotate around center of points bounding box
  if (!aboutPoint) {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;
    for (const p of points) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
      if (p[2] < minZ) minZ = p[2];
      if (p[2] > maxZ) maxZ = p[2];
    }
    aboutPoint = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
  }

  const cx = aboutPoint[0];
  const cy = aboutPoint[1];
  const cz = aboutPoint[2];

  // Check if rotating around Z axis (2D case - by far most common)
  if (axis[0] === 0 && axis[1] === 0 && axis[2] !== 0) {
    // 2D rotation: transform each point around center
    for (const point of points) {
      const dx = point[0] - cx;
      const dy = point[1] - cy;
      point[0] = cx + dx * cos - dy * sin;
      point[1] = cy + dx * sin + dy * cos;
    }
  } else {
    // 3D rotation: use quaternion
    _tempVec3.set(axis[0], axis[1], axis[2]).normalize();
    _tempQuaternion.setFromAxisAngle(_tempVec3, angle);

    for (const point of points) {
      _tempVec3.set(point[0] - cx, point[1] - cy, point[2] - cz);
      _tempVec3.applyQuaternion(_tempQuaternion);
      point[0] = cx + _tempVec3.x;
      point[1] = cy + _tempVec3.y;
      point[2] = cz + _tempVec3.z;
    }
  }

  vmob._geometryDirty = true;
  mob._markDirty();

  // Recursively rotate children
  for (const child of mob.children) {
    child.rotate(angle, { axis, aboutPoint });
  }
}

/**
 * Non-VMobject fallback: rotate using Three.js transforms.
 */
function _rotateWithThreeJS(
  mob: MobjectLike,
  angle: number,
  axis: Vector3Tuple,
  aboutPoint: Vector3Tuple | undefined,
): void {
  if (aboutPoint) {
    const dx = mob.position.x - aboutPoint[0];
    const dy = mob.position.y - aboutPoint[1];
    const dz = mob.position.z - aboutPoint[2];

    _tempVec3.set(axis[0], axis[1], axis[2]).normalize();
    _tempQuaternion.setFromAxisAngle(_tempVec3, angle);

    _tempVec3.set(dx, dy, dz);
    _tempVec3.applyQuaternion(_tempQuaternion);

    mob.position.set(
      aboutPoint[0] + _tempVec3.x,
      aboutPoint[1] + _tempVec3.y,
      aboutPoint[2] + _tempVec3.z,
    );

    _tempQuaternion2.setFromEuler(mob.rotation);
    _tempQuaternion2.multiply(_tempQuaternion);
    mob.rotation.setFromQuaternion(_tempQuaternion2);
  } else {
    _tempVec3.set(axis[0], axis[1], axis[2]).normalize();
    _tempQuaternion.setFromAxisAngle(_tempVec3, angle);
    _tempQuaternion2.setFromEuler(mob.rotation);
    _tempQuaternion2.multiply(_tempQuaternion);
    mob.rotation.setFromQuaternion(_tempQuaternion2);
  }
  mob._markDirty();
}

/**
 * Get the center point of a mobject.
 */
export function getCenterImpl(mob: MobjectLike): Vector3Tuple {
  const obj = mob.getThreeObject();
  _tempBox3.setFromObject(obj);
  if (!_tempBox3.isEmpty()) {
    _tempBox3.getCenter(_tempVec3);
    return [_tempVec3.x, _tempVec3.y, _tempVec3.z];
  }
  return [mob.position.x, mob.position.y, mob.position.z];
}

/**
 * Get bounding box dimensions.
 * Uses object pooling to avoid allocations in hot paths.
 */
export function getBoundingBoxImpl(mob: MobjectLike): {
  width: number;
  height: number;
  depth: number;
} {
  const obj = mob.getThreeObject();
  _tempBox3.setFromObject(obj);
  _tempBox3.getSize(_tempVec3);
  return { width: _tempVec3.x, height: _tempVec3.y, depth: _tempVec3.z };
}

/**
 * Get the edge point of the bounding box in a direction.
 */
export function getEdgeInDirectionImpl(mob: MobjectLike, direction: Vector3Tuple): Vector3Tuple {
  const center = mob.getCenter();
  const bounds = mob.getBoundingBox();

  // Use sign only (matches Manim's get_critical_point behavior)
  return [
    center[0] + (Math.sign(direction[0]) * bounds.width) / 2,
    center[1] + (Math.sign(direction[1]) * bounds.height) / 2,
    center[2] + (Math.sign(direction[2]) * bounds.depth) / 2,
  ];
}

/**
 * Move a mobject to the edge of the frame.
 */
export function toEdgeImpl(
  mob: MobjectLike,
  direction: Vector3Tuple,
  buff: number,
  frameDimensions?: [number, number],
): void {
  const frameWidth = frameDimensions?.[0] ?? 14;
  const frameHeight = frameDimensions?.[1] ?? 8;
  const bbox = mob.getBoundingBox();

  const targetX =
    direction[0] !== 0 ? direction[0] * (frameWidth / 2 - buff - bbox.width / 2) : mob.position.x;
  const targetY =
    direction[1] !== 0 ? direction[1] * (frameHeight / 2 - buff - bbox.height / 2) : mob.position.y;

  mob.moveTo([targetX, targetY, mob.position.z]);
}
