/**
 * FlowArc: a 2D curved flow line between two geographic points on a projection.
 *
 * FlowArc is the 2D counterpart of {@link Globe.arc} (which draws a 3D
 * great-circle). It projects two lat/lon endpoints to the plane with a
 * {@link GeoProjection}, then bows a smooth curve outward from the straight
 * chord between them. The curve is a quadratic Bezier, sampled into a polyline
 * and drawn with the same primitive the rest of the 2D geo module uses (an open
 * {@link Polygon} stroke), so {@link Create} reveals it progressively like every
 * other geo line.
 *
 * Use it for migration, trade or route flows laid over a {@link ChoroplethMap}.
 *
 * Coordinate convention: endpoints are `[latitude, longitude]` in degrees, the
 * same {@link LatLon} order {@link Globe} uses. The projection takes
 * `[longitude, latitude]`, so FlowArc swaps the pair before projecting.
 */

import { Polygon } from '../geometry/Polygon';
import { Vector3Tuple } from '../../core/Mobject';
import { equirectangular, type GeoProjection } from './projections';
import type { LatLon } from './Globe';

/** Options for a {@link FlowArc}. */
export interface FlowArcOptions {
  /** Start point `[latitude, longitude]` in degrees. */
  from: LatLon;
  /** End point `[latitude, longitude]` in degrees. */
  to: LatLon;
  /** Projection from lon/lat to 2D. Default: equirectangular(). */
  projection?: GeoProjection;
  /**
   * How far the arc bows out from the straight chord, as a fraction of the
   * chord length. The arc's midpoint sits `bulge * chordLength` away from the
   * chord's midpoint. Default: 0.2. Negative values bow to the other side.
   */
  bulge?: number;
  /** Line color. Default: a warm orange (#ff6b35). */
  color?: string;
  /** Line width in pixels. Default: 2. */
  lineWidth?: number;
  /** Polyline resolution (number of sampled points). Default: 48. */
  samples?: number;
}

/**
 * FlowArc - a 2D curved flow line between two geo points on a projection.
 *
 * @example
 * ```typescript
 * const flow = new FlowArc({
 *   from: [48.85, 2.35], // Paris [lat, lon]
 *   to: [40.71, -74.0],  // New York
 *   projection: equirectangular(),
 *   bulge: 0.2,
 * });
 * scene.play(new Create(flow));
 * ```
 */
export class FlowArc extends Polygon {
  private _arcPoints: Vector3Tuple[];
  private _from2D: Vector3Tuple;
  private _to2D: Vector3Tuple;

  constructor(options: FlowArcOptions) {
    const {
      from,
      to,
      projection = equirectangular(),
      bulge = 0.2,
      color = '#ff6b35',
      lineWidth = 2,
      samples = 48,
    } = options;

    const points = FlowArc._sampleArc(from, to, projection, bulge, samples);

    // An open polygon stroke: the same line primitive ChoroplethMap borders use,
    // so Create animates it the same way. No fill.
    super({ vertices: points, color, strokeWidth: lineWidth, closed: false, fillOpacity: 0 });

    this._arcPoints = points;
    this._from2D = [...points[0]];
    this._to2D = [...points[points.length - 1]];
  }

  /**
   * Sample the quadratic-Bezier arc into scene-space points.
   *
   * The control point sits twice the target offset off the chord midpoint, so
   * the Bezier's own midpoint (t = 0.5) lands exactly `bulge * chordLength` out.
   */
  private static _sampleArc(
    from: LatLon,
    to: LatLon,
    projection: GeoProjection,
    bulge: number,
    samples: number,
  ): Vector3Tuple[] {
    // LatLon is [lat, lon]; the projection takes [lon, lat].
    const [x0, y0] = projection([from[1], from[0]]);
    const [x1, y1] = projection([to[1], to[0]]);

    const dx = x1 - x0;
    const dy = y1 - y0;
    const chord = Math.hypot(dx, dy);

    // Left-hand unit normal to the chord. Zero-length chord (from == to) has no
    // direction, so the normal is zero and every sample collapses onto the point.
    let nx = 0;
    let ny = 0;
    if (chord > 1e-12) {
      nx = -dy / chord;
      ny = dx / chord;
    }

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    const offset = 2 * bulge * chord;
    const ctrlX = midX + nx * offset;
    const ctrlY = midY + ny * offset;

    const count = Math.max(2, Math.floor(samples));
    const points: Vector3Tuple[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const u = 1 - t;
      const x = u * u * x0 + 2 * u * t * ctrlX + t * t * x1;
      const y = u * u * y0 + 2 * u * t * ctrlY + t * t * y1;
      points.push([x, y, 0]);
    }
    return points;
  }

  /** Get the arc's sampled points in scene space (a defensive copy). */
  getProjectedPoints(): Vector3Tuple[] {
    return this._arcPoints.map((p) => [...p] as Vector3Tuple);
  }

  /** Get the projected start and end points in scene space. */
  getEndpoints(): { from: Vector3Tuple; to: Vector3Tuple } {
    return { from: [...this._from2D], to: [...this._to2D] };
  }
}
