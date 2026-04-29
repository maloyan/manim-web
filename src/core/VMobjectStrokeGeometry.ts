/**
 * Mesh-based stroke geometry construction for VMobject.
 *
 * Extracted from VMobjectGeometry.ts to keep line counts under control.
 */

import * as THREE from 'three';

/**
 * Build mesh-based stroke geometry from a closed sampled path.
 * Uses miter joins at corners for pixel-perfect sharp corners.
 *
 * @param group - The THREE.Group for world matrix computation
 * @param sampledPoints - Sampled path points
 * @param strokeWidth - Stroke width
 * @param opacity - Current opacity
 * @returns BufferGeometry and index data, or null if insufficient points
 */
// eslint-disable-next-line complexity
export function buildMeshStrokeGeometry(
  group: THREE.Group,
  sampledPoints: number[][],
  strokeWidth: number,
  opacity: number,
): { geometry: THREE.BufferGeometry } | null {
  void opacity; // used by caller for material

  if (strokeWidth <= 0 || sampledPoints.length < 3) {
    return null;
  }

  // Remove closing duplicate and consecutive duplicate points
  const deduped: number[][] = [sampledPoints[0]];
  for (let i = 1; i < sampledPoints.length; i++) {
    const prev = deduped[deduped.length - 1];
    const dx = sampledPoints[i][0] - prev[0];
    const dy = sampledPoints[i][1] - prev[1];
    const dz = sampledPoints[i][2] - prev[2];
    if (dx * dx + dy * dy + dz * dz > 1e-8) {
      deduped.push(sampledPoints[i]);
    }
  }
  // Remove closing point if it matches the first
  if (deduped.length >= 2) {
    const f = deduped[0],
      l = deduped[deduped.length - 1];
    const dx = f[0] - l[0],
      dy = f[1] - l[1],
      dz = f[2] - l[2];
    if (dx * dx + dy * dy + dz * dz < 1e-6) {
      deduped.pop();
    }
  }
  const n = deduped.length;
  if (n < 3) {
    return null;
  }

  // Transform points to world space so miter offsets are visually uniform
  group.updateWorldMatrix(true, false);
  const worldMatrix = group.matrixWorld;
  const invWorldMatrix = new THREE.Matrix4().copy(worldMatrix).invert();
  const vec = new THREE.Vector3();

  const pts: number[][] = deduped.map((p) => {
    vec.set(p[0], p[1], p[2]).applyMatrix4(worldMatrix);
    return [vec.x, vec.y, vec.z];
  });

  // Half stroke width in world units
  const halfW = strokeWidth * 0.005;

  // Determine winding direction via signed area (in world space)
  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  const normalSign = signedArea < 0 ? 1 : -1;

  // World-space positions for outer and inner rings
  const worldPositions: number[] = [];

  // Compute outer offset points with miter joins (in world space)
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const d1x = curr[0] - prev[0],
      d1y = curr[1] - prev[1];
    const d2x = next[0] - curr[0],
      d2y = next[1] - curr[1];

    const len1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1;

    const n1x = normalSign * (-d1y / len1);
    const n1y = normalSign * (d1x / len1);
    const n2x = normalSign * (-d2y / len2);
    const n2y = normalSign * (d2x / len2);

    let mx = n1x + n2x,
      my = n1y + n2y;
    const mlen = Math.sqrt(mx * mx + my * my);
    if (mlen > 1e-10) {
      mx /= mlen;
      my /= mlen;
    } else {
      mx = n1x;
      my = n1y;
    }

    // Add sub-pixel epsilon to outer miter to prevent GPU fill-rule gaps
    const cosHalf = n1x * mx + n1y * my;
    const miterLen = (cosHalf > 0.1 ? halfW / cosHalf : halfW * 2) + 0.005;

    worldPositions.push(curr[0] + mx * miterLen, curr[1] + my * miterLen, curr[2]);
  }
  // Compute inner offset points (in world space)
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const d1x = curr[0] - prev[0],
      d1y = curr[1] - prev[1];
    const d2x = next[0] - curr[0],
      d2y = next[1] - curr[1];
    const len1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1;
    const n1x = normalSign * (-d1y / len1);
    const n1y = normalSign * (d1x / len1);
    const n2x = normalSign * (-d2y / len2);
    const n2y = normalSign * (d2x / len2);

    let mx = n1x + n2x,
      my = n1y + n2y;
    const mlen = Math.sqrt(mx * mx + my * my);
    if (mlen > 1e-10) {
      mx /= mlen;
      my /= mlen;
    } else {
      mx = n1x;
      my = n1y;
    }

    const cosHalf = n1x * mx + n1y * my;
    const miterLen = cosHalf > 0.1 ? halfW / cosHalf : halfW * 2;

    worldPositions.push(curr[0] - mx * miterLen, curr[1] - my * miterLen, curr[2]);
  }

  // Transform world-space positions back to local space
  const positions: number[] = [];
  for (let i = 0; i < worldPositions.length; i += 3) {
    vec
      .set(worldPositions[i], worldPositions[i + 1], worldPositions[i + 2])
      .applyMatrix4(invWorldMatrix);
    positions.push(vec.x, vec.y, vec.z);
  }

  // Triangles: for each edge, two triangles forming a quad
  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    indices.push(i, j, n + j);
    indices.push(i, n + j, n + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);

  return { geometry };
}
