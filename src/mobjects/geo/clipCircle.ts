/**
 * Clip a GeoJSON polygon ring to the mappable disc of a disc projection (the
 * {@link orthographic} globe silhouette).
 *
 * `orthographic` maps the near hemisphere onto a disc of `clipRadius` and
 * returns `[NaN, NaN]` for the far hemisphere. A naive renderer drops the far
 * vertices and joins the two neighboring near vertices with a straight chord,
 * which cuts a false wedge across the disc. This helper clips each ring to the
 * limb circle instead, following the limb arc across the hidden hemisphere, so
 * the filled land ends cleanly on the globe outline.
 *
 * It is a Weiler-Atherton clip against the circle:
 *  1. Walk the ring, splitting it into the visible runs ("segments"). Each
 *     segment starts and ends on the limb; the crossing points are found by
 *     bisection on the lon/lat edge (the projection is the only visibility
 *     oracle). Longitude is unwrapped across the antimeridian so a ring that
 *     crosses +/-180 degrees still finds the correct crossing.
 *  2. Re-join the segments into closed rings: after a segment's exit, follow the
 *     limb to the entry of the next segment encountered in the ring's winding
 *     direction, inserting an arc. One input ring can yield several output rings
 *     (a landmass cut into separate pieces by the limb).
 *
 * The winding direction is a 3D spherical orientation (the ring's area vector
 * dotted with its centroid direction), which is stable for a thin sliver and for
 * a ring that encircles a pole (Antarctica), where 2D signed areas are not.
 * `orthographic` views the sphere from outside and preserves orientation, so a
 * counter-clockwise ring on the sphere stays counter-clockwise on the disc.
 */

import type { GeoLinearRing, GeoPosition } from './geojson';
import { type GeoProjection, isProjectedPointVisible } from './projections';

const DEG_TO_RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;

/** A projected vertex in the map's local 2D space (z is always 0). */
type Vertex = [number, number, number];

/** A 2D point. */
type Point = [number, number];

/** One visible run of a ring, bounded by two limb crossings. */
interface Segment {
  /** Projected points from the entry crossing, through the visible run, to the exit crossing. */
  points: Point[];
  entry: Point;
  exit: Point;
  entryAngle: number;
  exitAngle: number;
}

/** Unit vector on the sphere for a lon/lat position (degrees). */
function unitVector(position: GeoPosition): [number, number, number] {
  const lambda = position[0] * DEG_TO_RAD;
  const phi = position[1] * DEG_TO_RAD;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.cos(lambda), cosPhi * Math.sin(lambda), Math.sin(phi)];
}

/**
 * Whether a lon/lat ring winds counter-clockwise as seen from outside the
 * sphere. Uses the spherical area vector `sum(w_i x w_{i+1})` dotted with the
 * centroid direction `sum(w_i)`: positive means the area vector points outward,
 * i.e. counter-clockwise from outside. Stable where 2D signed areas are not
 * (thin slivers, pole-encircling rings).
 */
function ringIsCounterClockwise(ring: GeoLinearRing): boolean {
  const w = ring.map(unitVector);
  let ax = 0;
  let ay = 0;
  let az = 0;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let i = 0; i < w.length; i++) {
    const a = w[i];
    const b = w[(i + 1) % w.length];
    ax += a[1] * b[2] - a[2] * b[1];
    ay += a[2] * b[0] - a[0] * b[2];
    az += a[0] * b[1] - a[1] * b[0];
    cx += a[0];
    cy += a[1];
    cz += a[2];
  }
  return ax * cx + ay * cy + az * cz > 0;
}

/**
 * Find the limb crossing on the edge from a visible position to an invisible
 * one, as a projected point snapped onto the circle of `radius`. Bisection
 * narrows the segment parameter until visibility flips. Longitude is unwrapped
 * so the interpolation takes the short way across the antimeridian.
 */
function limbCrossing(
  visible: GeoPosition,
  invisible: GeoPosition,
  project: GeoProjection,
  radius: number,
): Point {
  const lonA = visible[0];
  let lonB = invisible[0];
  while (lonB - lonA > 180) lonB -= 360;
  while (lonB - lonA < -180) lonB += 360;
  const latA = visible[1];
  const latB = invisible[1];
  const at = (t: number): GeoPosition => [lonA + (lonB - lonA) * t, latA + (latB - latA) * t];

  let lo = 0; // at `visible`
  let hi = 1; // at `invisible`
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (isProjectedPointVisible(project(at(mid)))) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const [x, y] = project(at(lo));
  const len = Math.hypot(x, y) || 1;
  return [(x / len) * radius, (y / len) * radius];
}

/**
 * Append arc points along the limb circle from `from` to `to`, counter-clockwise
 * when `ccw` is true (else clockwise). Endpoints are excluded: the caller holds
 * `from` and pushes `to` (the next segment's entry) after the arc.
 */
function appendArc(
  out: Vertex[],
  from: Point,
  to: Point,
  radius: number,
  ccw: boolean,
  stepRad: number,
): void {
  const a1 = Math.atan2(from[1], from[0]);
  const a2 = Math.atan2(to[1], to[0]);
  let delta = ccw ? a2 - a1 : a1 - a2;
  while (delta <= 0) delta += TWO_PI;
  const steps = Math.max(1, Math.ceil(delta / stepRad));
  for (let k = 1; k < steps; k++) {
    const a = ccw ? a1 + (delta * k) / steps : a1 - (delta * k) / steps;
    out.push([radius * Math.cos(a), radius * Math.sin(a), 0]);
  }
}

/** Positive angular distance from `fromAngle` to `toAngle` in the winding direction. */
function angularStep(fromAngle: number, toAngle: number, ccw: boolean): number {
  let d = ccw ? toAngle - fromAngle : fromAngle - toAngle;
  while (d <= 1e-9) d += TWO_PI;
  return d;
}

/**
 * Split the ring into its visible runs. The walk starts at a hidden vertex (one
 * exists, since the ring is neither fully visible nor fully hidden here), so each
 * run lies wholly within the walk and is bounded by an entry and an exit crossing.
 */
function buildSegments(
  ring: GeoLinearRing,
  projected: Point[],
  visible: boolean[],
  project: GeoProjection,
  radius: number,
): Segment[] {
  const n = ring.length;
  const startHidden = visible.indexOf(false);
  const segments: Segment[] = [];
  let current: Segment | null = null;
  let prevIdx = startHidden;
  for (let k = 1; k <= n; k++) {
    const curIdx = (startHidden + k) % n;
    const prevVisible = visible[prevIdx];
    const curVisible = visible[curIdx];
    if (!prevVisible && curVisible) {
      const entry = limbCrossing(ring[curIdx], ring[prevIdx], project, radius);
      current = {
        points: [entry, projected[curIdx]],
        entry,
        exit: entry,
        entryAngle: Math.atan2(entry[1], entry[0]),
        exitAngle: 0,
      };
    } else if (prevVisible && curVisible && current) {
      current.points.push(projected[curIdx]);
    } else if (prevVisible && !curVisible && current) {
      const exit = limbCrossing(ring[prevIdx], ring[curIdx], project, radius);
      current.points.push(exit);
      current.exit = exit;
      current.exitAngle = Math.atan2(exit[1], exit[0]);
      segments.push(current);
      current = null;
    }
    prevIdx = curIdx;
  }
  return segments;
}

/**
 * Re-join the visible segments into closed rings. From each exit, follow the limb
 * in the winding direction to the entry of the next segment, inserting an arc.
 */
function rejoinSegments(
  segments: Segment[],
  ccw: boolean,
  radius: number,
  stepRad: number,
): Vertex[][] {
  const used = new Array<boolean>(segments.length).fill(false);
  const rings: Vertex[][] = [];
  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    const out: Vertex[] = [];
    let cur = i;
    for (;;) {
      used[cur] = true;
      for (const [x, y] of segments[cur].points) out.push([x, y, 0]);
      let next = -1;
      let best = Infinity;
      for (let j = 0; j < segments.length; j++) {
        if (used[j] && j !== i) continue;
        const d = angularStep(segments[cur].exitAngle, segments[j].entryAngle, ccw);
        if (d < best) {
          best = d;
          next = j;
        }
      }
      appendArc(out, segments[cur].exit, segments[next].entry, radius, ccw, stepRad);
      if (next === i) break;
      cur = next;
    }
    rings.push(out);
  }
  return rings;
}

/**
 * Clip a polygon ring to a disc projection's mappable circle.
 *
 * @param ring - The ring's lon/lat positions (a closing duplicate is allowed).
 * @param project - The clipping projection (its `clipRadius` must be set).
 * @param radius - The disc radius (`project.clipRadius`).
 * @param arcStepDegrees - Angular spacing of inserted limb-arc points. Default 2.
 * @returns The clipped geometry as zero or more projected rings. Empty when the
 *   ring is entirely on the hidden hemisphere; one ring when it is fully visible
 *   or cut into a single piece; several when the limb cuts it into pieces.
 */
export function clipRingToCircle(
  ring: GeoLinearRing,
  project: GeoProjection,
  radius: number,
  arcStepDegrees = 2,
): Vertex[][] {
  const n = ring.length;
  if (n === 0) return [];

  const projected: Point[] = ring.map((p) => {
    const [x, y] = project(p);
    return [x, y];
  });
  const visible = projected.map(isProjectedPointVisible);

  if (!visible.some((v) => v)) return [];
  if (visible.every((v) => v)) {
    return [projected.map(([x, y]) => [x, y, 0])];
  }

  const segments = buildSegments(ring, projected, visible, project, radius);
  if (segments.length === 0) return [];

  const ccw = ringIsCounterClockwise(ring);
  return rejoinSegments(segments, ccw, radius, arcStepDegrees * DEG_TO_RAD);
}
