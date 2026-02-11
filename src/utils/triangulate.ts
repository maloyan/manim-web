/**
 * Polygon triangulation using earcut.
 *
 * earcut is the JS port of mapbox-earcut -- the same robust library that
 * Python manim relies on for polygon fill.  It handles:
 *   - Simple convex / concave polygons
 *   - Polygons with holes (inner rings)
 *   - Self-intersecting polygons (best-effort)
 *   - Degenerate / zero-area cases (returns empty indices)
 *
 * Usage:
 *   const indices = triangulatePolygon(outerRing);
 *   const indices = triangulatePolygon(outerRing, [hole1, hole2]);
 */

import earcut from 'earcut';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Triangulate a 2D polygon, optionally with holes.
 *
 * @param vertices - Outer ring as an array of [x, y] pairs (or [x, y, z] --
 *                   only the first two components are used).
 * @param holes    - Optional array of hole rings.  Each hole is an array of
 *                   [x, y] (or [x, y, z]) pairs wound in the opposite
 *                   direction of the outer ring.
 * @returns Flat array of triangle vertex indices into the combined vertex
 *          list (outer ring vertices followed by all hole vertices in order).
 *          Length is always a multiple of 3.  Returns [] for degenerate input.
 */
export function triangulatePolygon(
  vertices: number[][],
  holes?: number[][][],
): number[] {
  // ---- Guard: need at least 3 outer-ring vertices ----
  if (!vertices || vertices.length < 3) {
    return [];
  }

  // ---- Flatten vertices into earcut's expected format [x,y, x,y, ...] ----
  const coords: number[] = [];
  const holeIndices: number[] = [];

  for (const v of vertices) {
    coords.push(v[0], v[1]);
  }

  // ---- Append hole vertices ----
  if (holes && holes.length > 0) {
    for (const hole of holes) {
      if (!hole || hole.length < 3) continue; // skip degenerate holes
      holeIndices.push(coords.length / 2); // index of first vertex of this hole
      for (const v of hole) {
        coords.push(v[0], v[1]);
      }
    }
  }

  // ---- Run earcut ----
  const indices = earcut(
    coords,
    holeIndices.length > 0 ? holeIndices : undefined,
    2, // dimensions (2D)
  );

  return indices as number[];
}

/**
 * Triangulate a polygon and return a flat Float32Array of triangle positions
 * suitable for use as a Three.js BufferGeometry position attribute.
 *
 * @param vertices - Outer ring [x, y] pairs
 * @param holes    - Optional hole rings
 * @param z        - Z coordinate to assign to every output vertex (default 0)
 * @returns Float32Array of xyz triplets (length = numTriangles * 9), or an
 *          empty Float32Array for degenerate input.
 */
export function triangulatePolygonPositions(
  vertices: number[][],
  holes?: number[][][],
  z: number = 0,
): Float32Array {
  const indices = triangulatePolygon(vertices, holes);
  if (indices.length === 0) return new Float32Array(0);

  // Build combined vertex list (outer + holes, same order as earcut expects)
  const allVerts: number[][] = [...vertices];
  if (holes) {
    for (const hole of holes) {
      if (hole && hole.length >= 3) {
        allVerts.push(...hole);
      }
    }
  }

  const positions = new Float32Array(indices.length * 3);
  for (let i = 0; i < indices.length; i++) {
    const v = allVerts[indices[i]];
    positions[i * 3] = v[0];
    positions[i * 3 + 1] = v[1];
    positions[i * 3 + 2] = z;
  }

  return positions;
}

/**
 * Compute the signed area of a 2D polygon ring.
 * Positive = counter-clockwise, negative = clockwise.
 */
export function signedArea2D(ring: number[][]): number {
  let area = 0;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    area += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return area / 2;
}

/**
 * Ensure a ring is wound counter-clockwise (positive signed area).
 * Returns the ring unchanged if already CCW, or reversed otherwise.
 */
export function ensureCCW(ring: number[][]): number[][] {
  return signedArea2D(ring) >= 0 ? ring : [...ring].reverse();
}

/**
 * Ensure a ring is wound clockwise (negative signed area).
 * Holes should be CW when the outer ring is CCW.
 */
export function ensureCW(ring: number[][]): number[][] {
  return signedArea2D(ring) <= 0 ? ring : [...ring].reverse();
}
