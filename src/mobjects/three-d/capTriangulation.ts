/**
 * Cap triangulation for a bent {@link Extrude3D}: conforming longest-edge
 * bisection of a 2D triangulation, then Delaunay edge flips, so a bend that
 * follows can curve the flat faces without thin or flipped triangles.
 */
import * as THREE from 'three';
import { orientation2D } from '../../utils/vectors';

/** Undirected edge key of two vertex ids. */
export const edgeKey = (a: number, b: number): string => (a < b ? `${a},${b}` : `${b},${a}`);

/**
 * Conforming longest-edge bisection of a 2D triangulation: split the longest
 * edge (and both triangles on it) until no edge is longer than `maxEdge`.
 * Edges in `fixed` (the outline) are never split, so the result still meets
 * the wall without a T-junction. `points` grows with the new midpoints; the
 * triangles keep their winding.
 *
 * Then it flips interior edges to the Delaunay triangulation. Earcut fans
 * thin slivers along a densely resampled rim; a bend moves a straight rim by
 * about the width of such a sliver and turns its winding over.
 * @post every edge e of result: fixed.has(e) || length(e) <= maxEdge
 */
export function refineTriangles(
  points: THREE.Vector2[],
  faces: number[][],
  fixed: ReadonlySet<string>,
  maxEdge: number,
): number[][] {
  const tris = faces.map((f) => [...f]);
  const byEdge = new Map<string, Set<number>>();
  const link = (t: number, on: boolean) => {
    for (let k = 0; k < 3; k++) {
      const key = edgeKey(tris[t][k], tris[t][(k + 1) % 3]);
      let set = byEdge.get(key);
      if (!set) byEdge.set(key, (set = new Set()));
      if (on) set.add(t);
      else set.delete(t);
    }
  };
  tris.forEach((_, t) => link(t, true));
  const length = (key: string) => {
    const [a, b] = key.split(',').map(Number);
    return points[a].distanceTo(points[b]);
  };
  /** Split every triangle on edge `key` at point `m` (which lies on the edge). */
  const split = (key: string, m: number) => {
    for (const t of [...(byEdge.get(key) ?? [])]) {
      const tri = tris[t];
      const i = [0, 1, 2].find((k) => edgeKey(tri[k], tri[(k + 1) % 3]) === key) ?? 0;
      const [p, q, w] = [tri[i], tri[(i + 1) % 3], tri[(i + 2) % 3]];
      link(t, false);
      tris[t] = [p, m, w];
      link(t, true);
      tris.push([m, q, w]);
      link(tris.length - 1, true);
    }
    byEdge.delete(key);
  };
  for (let round = 0; round < 64; round++) {
    const long = [...byEdge.keys()]
      .filter((k) => !fixed.has(k) && (byEdge.get(k)?.size ?? 0) > 0 && length(k) > maxEdge)
      .sort((x, y) => length(y) - length(x));
    if (long.length === 0) break;
    for (const key of long) {
      if ((byEdge.get(key)?.size ?? 0) === 0) continue;
      const [u, v] = key.split(',').map(Number);
      split(key, points.push(points[u].clone().lerp(points[v], 0.5)) - 1);
    }
  }
  delaunayFlips(points, tris, byEdge, link, fixed);
  return tris;
}

/** Interior angle of triangle corner `at` (between the rays to `a` and `b`). */
function cornerAngle(points: THREE.Vector2[], at: number, a: number, b: number): number {
  const u = points[a].clone().sub(points[at]);
  const v = points[b].clone().sub(points[at]);
  return Math.abs(Math.atan2(u.cross(v), u.dot(v)));
}

/**
 * Lawson flips: an interior edge p-q whose opposite corners w1, w2 sum to more
 * than PI is replaced by w1-w2 when p-q-w1-w2 is convex. The winding of the
 * triangles is kept.
 * @post every non-fixed edge: the two opposite angles sum to <= PI + 1e-9
 */
function delaunayFlips(
  points: THREE.Vector2[],
  tris: number[][],
  byEdge: Map<string, Set<number>>,
  link: (t: number, on: boolean) => void,
  fixed: ReadonlySet<string>,
): void {
  const xy = (i: number) => [points[i].x, points[i].y];
  const queue = [...byEdge.keys()];
  for (let budget = 50 * queue.length + 100; queue.length > 0 && budget > 0; budget--) {
    const key = queue.pop() as string;
    const owners = [...(byEdge.get(key) ?? [])];
    if (fixed.has(key) || owners.length !== 2) continue;
    const [t1, t2] = owners;
    const tri = tris[t1];
    const i = [0, 1, 2].find((k) => edgeKey(tri[k], tri[(k + 1) % 3]) === key) ?? 0;
    const [p, q, w1] = [tri[i], tri[(i + 1) % 3], tri[(i + 2) % 3]];
    const w2 = tris[t2].find((v) => v !== p && v !== q) as number;
    const sum = cornerAngle(points, w1, p, q) + cornerAngle(points, w2, p, q);
    const convex = orientation2D(xy(w1), xy(w2), xy(p)) * orientation2D(xy(w1), xy(w2), xy(q)) < 0;
    if (sum <= Math.PI + 1e-9 || !convex) continue;
    link(t1, false);
    link(t2, false);
    // Quad in winding order: p, w2, q, w1; the new diagonal is w1-w2.
    tris[t1] = [p, w2, w1];
    tris[t2] = [w2, q, w1];
    link(t1, true);
    link(t2, true);
    byEdge.delete(key);
    queue.push(edgeKey(p, w2), edgeKey(w2, q), edgeKey(q, w1), edgeKey(w1, p));
  }
}
