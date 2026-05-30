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
