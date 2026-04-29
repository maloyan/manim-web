/**
 * Shared types and utilities for matching-based Transform animations.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';

// ============================================================================
// MatchingPart - tracks a matched pair of shapes during animation
// ============================================================================

export interface MatchedPart {
  source: VMobject;
  target: VMobject;
  startPoints: number[][];
  targetPoints: number[][];
  startOpacity: number;
  targetOpacity: number;
  alignedSubpathLengths?: number[];
}

export interface FadingPart {
  mobject: VMobject;
  fadeIn: boolean; // true = fade in, false = fade out
  startOpacity: number;
  targetOpacity: number;
}

// ============================================================================
// Bounding box and similarity utilities
// ============================================================================

/**
 * Compute the bounding box of a VMobject
 */
export function getBoundingBox(vmobject: VMobject): {
  min: Vector3Tuple;
  max: Vector3Tuple;
  center: Vector3Tuple;
  size: Vector3Tuple;
} {
  const points = vmobject.getPoints();
  if (points.length === 0) {
    const pos = vmobject.getCenter();
    return {
      min: pos,
      max: pos,
      center: pos,
      size: [0, 0, 0],
    };
  }

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  for (const p of points) {
    minX = Math.min(minX, p[0]);
    minY = Math.min(minY, p[1]);
    minZ = Math.min(minZ, p[2]);
    maxX = Math.max(maxX, p[0]);
    maxY = Math.max(maxY, p[1]);
    maxZ = Math.max(maxZ, p[2]);
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    size: [maxX - minX, maxY - minY, maxZ - minZ],
  };
}

/**
 * Calculate similarity between two shapes based on bounding box and point count.
 * Returns a value in [0, 1] where 1 means identical shape characteristics.
 */
export function shapeSimilarity(a: VMobject, b: VMobject): number {
  const boxA = getBoundingBox(a);
  const boxB = getBoundingBox(b);

  // Size similarity (0 to 1)
  const sizeA = Math.sqrt(boxA.size[0] ** 2 + boxA.size[1] ** 2);
  const sizeB = Math.sqrt(boxB.size[0] ** 2 + boxB.size[1] ** 2);
  const maxSize = Math.max(sizeA, sizeB, 0.001);
  const sizeSimilarity = 1 - Math.abs(sizeA - sizeB) / maxSize;

  // Aspect ratio similarity
  const aspectA = boxA.size[1] !== 0 ? boxA.size[0] / boxA.size[1] : 1;
  const aspectB = boxB.size[1] !== 0 ? boxB.size[0] / boxB.size[1] : 1;
  const maxAspect = Math.max(aspectA, aspectB, 0.001);
  const aspectSimilarity = 1 - Math.abs(aspectA - aspectB) / maxAspect;

  // Point count similarity
  const pointsA = a.getPoints().length;
  const pointsB = b.getPoints().length;
  const maxPoints = Math.max(pointsA, pointsB, 1);
  const pointSimilarity = 1 - Math.abs(pointsA - pointsB) / maxPoints;

  // Weighted average
  return sizeSimilarity * 0.4 + aspectSimilarity * 0.3 + pointSimilarity * 0.3;
}

/**
 * Calculate Euclidean distance between the centers of two VMobjects.
 * Used as a cost metric for position-based pairing of unmatched parts.
 */
export function centerDistance(a: VMobject, b: VMobject): number {
  const centerA = getBoundingBox(a).center;
  const centerB = getBoundingBox(b).center;
  return Math.sqrt(
    (centerA[0] - centerB[0]) ** 2 +
      (centerA[1] - centerB[1]) ** 2 +
      (centerA[2] - centerB[2]) ** 2,
  );
}
