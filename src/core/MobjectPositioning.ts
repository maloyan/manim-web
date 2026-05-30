import * as THREE from 'three';
import type { MobjectLike, Vector3Tuple } from './MobjectTypes';

// Performance optimization: Object pooling for temporary vectors
// These are shared to avoid allocation in hot paths
const tempVec3: THREE.Vector3 = new THREE.Vector3();
const tempBox3: THREE.Box3 = new THREE.Box3();

/**
 * Get the center point of a mobject.
 */
export function getCenterImpl(mob: MobjectLike): Vector3Tuple {
  const b = mob.getBounds();
  return [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2];
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
  // Same world-matrix sync as getBounds() (unlike getBounds, returns zero size
  // for empty mobjects rather than throwing).
  const obj = mob._syncWorldMatrices();
  tempBox3.setFromObject(obj);
  tempBox3.getSize(tempVec3);
  return { width: tempVec3.x, height: tempVec3.y, depth: tempVec3.z };
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
