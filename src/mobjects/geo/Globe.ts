/**
 * Globe: a 3D sphere for geographic data, with helpers to place lat/long
 * points, draw great-circle arcs, and build a lat/long graticule.
 *
 * The globe is a {@link Group} holding a sphere plus whatever markers, arcs and
 * grid the caller adds. The sphere is a plain {@link Sphere} by default, or a
 * {@link texturedSphere} when a `textureUrl` is given (the existing texture
 * path, so an Earth image maps straight on).
 *
 * Coordinate convention (Z up, matching the rest of the 3D module and the
 * textured-sphere UV mapping): latitude drives Z (north pole at +Z), longitude
 * sweeps the X/Y plane from +X (lon 0) toward +Y (lon 90E):
 *   `x = r cos(lat) cos(lon)`, `y = r cos(lat) sin(lon)`, `z = r sin(lat)`.
 */

import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { Sphere } from '../three-d/Sphere';
import { TexturedSurface, texturedSphere } from '../three-d/TexturedSurface';
import { Dot3D } from '../three-d/ThreeDExtensions';
import { Line3D } from '../three-d/Line3D';

const DEG_TO_RAD = Math.PI / 180;

/** A `[latitude, longitude]` pair in decimal degrees. */
export type LatLon = [number, number];

/** Options for a {@link Globe}. */
export interface GlobeOptions {
  /** Sphere radius. Default: 1. */
  radius?: number;
  /** Center position `[x, y, z]`. Default: `[0, 0, 0]`. */
  center?: Vector3Tuple;
  /** Texture image URL. When set, the globe uses a textured sphere. */
  textureUrl?: string;
  /** Optional dark/night texture URL, blended by light direction. */
  darkTextureUrl?: string;
  /** Sphere color when untextured. Default: '#2a6f97'. */
  color?: string;
  /** Opacity from 0 to 1. Default: 1. */
  opacity?: number;
  /** Sphere mesh resolution. Default: 64. */
  resolution?: number;
}

/** Options for a plotted point marker. */
export interface GlobePointOptions {
  /** Marker radius in scene units. Default: radius * 0.03. */
  size?: number;
  /** Marker color. Default: '#ffd166'. */
  color?: string;
}

/** Options for a great-circle arc. */
export interface GlobeArcOptions {
  /** Number of segments along the arc. Default: 64. */
  segments?: number;
  /** Line color. Default: '#ef476f'. */
  color?: string;
  /** Line width in pixels. Default: 2. */
  lineWidth?: number;
  /** Fraction of the sphere radius to lift the arc off the surface. Default: 0. */
  altitude?: number;
}

/** Options for a graticule (lat/long grid). */
export interface GlobeGraticuleOptions {
  /** Spacing between parallels in degrees. Default: 30. */
  latStep?: number;
  /** Spacing between meridians in degrees. Default: 30. */
  lonStep?: number;
  /** Samples per grid line. Default: 48. */
  segments?: number;
  /** Line color. Default: '#8d99ae'. */
  color?: string;
  /** Line width in pixels. Default: 1. */
  lineWidth?: number;
}

/**
 * Globe - a 3D sphere with geographic plotting helpers.
 *
 * @example
 * ```typescript
 * const globe = new Globe({ radius: 2, textureUrl: '/textures/earth.jpg' });
 * globe.plotPoint(48.85, 2.35); // Paris
 * globe.arc([48.85, 2.35], [40.71, -74.0]); // Paris -> New York
 * globe.graticule({ latStep: 30, lonStep: 30 });
 * scene.add(globe);
 * ```
 */
export class Globe extends Group {
  private _radius: number;
  private _center: Vector3Tuple;
  private _sphere: Sphere | TexturedSurface;
  private _plottedPoints: Dot3D[] = [];

  constructor(options: GlobeOptions = {}) {
    super();

    const {
      radius = 1,
      center = [0, 0, 0],
      textureUrl,
      darkTextureUrl,
      color = '#2a6f97',
      opacity = 1,
      resolution = 64,
    } = options;

    this._radius = radius;
    this._center = [...center];

    if (textureUrl) {
      this._sphere = texturedSphere({
        textureUrl,
        darkTextureUrl,
        radius,
        center,
        resolution,
        opacity,
      });
    } else {
      this._sphere = new Sphere({ radius, center, color, opacity, resolution });
    }
    this.add(this._sphere);
  }

  /** Get the underlying sphere mobject (plain or textured). */
  getSphere(): Sphere | TexturedSurface {
    return this._sphere;
  }

  /** Get the sphere radius. */
  getRadius(): number {
    return this._radius;
  }

  /**
   * Convert a latitude/longitude (degrees) to a point on the sphere surface,
   * in scene coordinates (center offset included).
   *
   * @param lat - Latitude in degrees (north positive).
   * @param lon - Longitude in degrees (east positive).
   * @returns The `[x, y, z]` surface point.
   */
  latLonToPoint(lat: number, lon: number): Vector3Tuple {
    return this._surfacePoint(lat, lon, this._radius);
  }

  /**
   * Plot a marker at a latitude/longitude. The marker is added as a child so it
   * transforms with the globe.
   *
   * @param lat - Latitude in degrees.
   * @param lon - Longitude in degrees.
   * @param options - Marker size and color.
   * @returns The created {@link Dot3D} marker.
   */
  plotPoint(lat: number, lon: number, options: GlobePointOptions = {}): Dot3D {
    const { size = this._radius * 0.03, color = '#ffd166' } = options;
    const dot = new Dot3D({ point: this.latLonToPoint(lat, lon), radius: size, color });
    this.add(dot);
    this._plottedPoints.push(dot);
    return dot;
  }

  /** Get the markers added via {@link plotPoint}. */
  getPlottedPoints(): Dot3D[] {
    return [...this._plottedPoints];
  }

  /**
   * Draw the great-circle (shortest-path) arc between two lat/long points. The
   * arc is sampled with spherical linear interpolation, so every vertex lies on
   * the sphere. The arc is added as a child.
   *
   * @param from - Start `[lat, lon]` in degrees.
   * @param to - End `[lat, lon]` in degrees.
   * @param options - Segment count, color, width and optional altitude.
   * @returns The created {@link Group} of {@link Line3D} segments that form the
   *   polyline.
   */
  arc(from: LatLon, to: LatLon, options: GlobeArcOptions = {}): Group {
    const { segments = 64, color = '#ef476f', lineWidth = 2, altitude = 0 } = options;
    const radius = this._radius * (1 + altitude);
    const start = unitVector(from[0], from[1]);
    const end = unitVector(to[0], to[1]);

    const dot = clamp(start[0] * end[0] + start[1] * end[1] + start[2] * end[2], -1, 1);
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);

    const vertices: Vector3Tuple[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const unit = slerp(start, end, t, omega, sinOmega);
      vertices.push([
        this._center[0] + radius * unit[0],
        this._center[1] + radius * unit[1],
        this._center[2] + radius * unit[2],
      ]);
    }

    const line = this._polyline(vertices, color, lineWidth);
    this.add(line);
    return line;
  }

  /**
   * Build a graticule (lat/long grid) as a group of polylines, added as a
   * child. Meridians run pole to pole; parallels circle the globe.
   *
   * @param options - Grid spacing, resolution and style.
   * @returns The created {@link Group} of grid lines.
   */
  graticule(options: GlobeGraticuleOptions = {}): Group {
    const { latStep = 30, lonStep = 30, segments = 48, color = '#8d99ae', lineWidth = 1 } = options;
    const grid = new Group();

    // Meridians: fixed longitude, latitude from -90 to 90.
    for (let lon = -180; lon < 180; lon += lonStep) {
      grid.add(this._gridLine(sampleLatitudes(lon, segments), color, lineWidth));
    }
    // Parallels: fixed latitude (excluding the poles), longitude around.
    for (let lat = -90 + latStep; lat < 90; lat += latStep) {
      grid.add(this._gridLine(sampleLongitudes(lat, segments), color, lineWidth));
    }

    this.add(grid);
    return grid;
  }

  private _gridLine(samples: LatLon[], color: string, lineWidth: number): Group {
    const vertices = samples.map(([lat, lon]) => this.latLonToPoint(lat, lon));
    return this._polyline(vertices, color, lineWidth);
  }

  /**
   * Build a polyline on the globe from a point list as a {@link Group} of
   * {@link Line3D} segments. Line3D renders with `Line2`/`LineMaterial`, so the
   * line keeps a constant pixel width on every GPU, and its polygon-offset
   * depth bias stops the line from z-fighting the sphere surface it sits on.
   * One Line3D joins each pair of consecutive points, so the segments form a
   * single continuous path.
   */
  private _polyline(points: Vector3Tuple[], color: string, lineWidth: number): Group {
    const line = new Group();
    for (let i = 0; i < points.length - 1; i++) {
      line.add(new Line3D({ start: points[i], end: points[i + 1], color, lineWidth }));
    }
    return line;
  }

  private _surfacePoint(lat: number, lon: number, radius: number): Vector3Tuple {
    const unit = unitVector(lat, lon);
    return [
      this._center[0] + radius * unit[0],
      this._center[1] + radius * unit[1],
      this._center[2] + radius * unit[2],
    ];
  }
}

/** Unit direction vector for a lat/long (degrees), Z-up convention. */
function unitVector(lat: number, lon: number): Vector3Tuple {
  const latRad = lat * DEG_TO_RAD;
  const lonRad = lon * DEG_TO_RAD;
  const cosLat = Math.cos(latRad);
  return [cosLat * Math.cos(lonRad), cosLat * Math.sin(lonRad), Math.sin(latRad)];
}

/** Spherical linear interpolation between two unit vectors. */
function slerp(
  a: Vector3Tuple,
  b: Vector3Tuple,
  t: number,
  omega: number,
  sinOmega: number,
): Vector3Tuple {
  if (sinOmega < 1e-9) {
    // Nearly coincident or antipodal: fall back to linear blend, renormalized.
    return normalize([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ]);
  }
  const wa = Math.sin((1 - t) * omega) / sinOmega;
  const wb = Math.sin(t * omega) / sinOmega;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

function normalize(v: Vector3Tuple): Vector3Tuple {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Sample a meridian (fixed longitude) from south to north pole. */
function sampleLatitudes(lon: number, segments: number): LatLon[] {
  const points: LatLon[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push([-90 + (180 * i) / segments, lon]);
  }
  return points;
}

/** Sample a parallel (fixed latitude) around the full longitude range. */
function sampleLongitudes(lat: number, segments: number): LatLon[] {
  const points: LatLon[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push([lat, -180 + (360 * i) / segments]);
  }
  return points;
}
