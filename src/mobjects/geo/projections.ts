/**
 * Map projections: functions that turn a `[longitude, latitude]` pair in
 * decimal degrees into a 2D `[x, y]` point in scene units.
 *
 * V1 covers two projections:
 *  - equirectangular (plate carrée), the default, optionally with a standard
 *    parallel so the horizontal scale matches a chosen latitude;
 *  - Web Mercator, clamped near the poles so `y` stays finite.
 *
 * Both are radians-scaled by `radius`, so with the default `radius = 1` a point
 * at the antimeridian/pole projects to `[PI, PI/2]`. Callers scale the whole
 * map afterwards with the usual Mobject transforms.
 */

import type { GeoPosition } from './geojson';

const DEG_TO_RAD = Math.PI / 180;

/**
 * A projection maps a lon/lat position (degrees) to a 2D scene point.
 */
export type GeoProjection = (position: GeoPosition) => [number, number];

/** Options for the equirectangular (plate carrée) projection. */
export interface EquirectangularOptions {
  /** Scene-unit scale applied to the radian coordinates. Default: 1. */
  radius?: number;
  /** Central meridian in degrees; subtracted from each longitude. Default: 0. */
  centerLon?: number;
  /** Central parallel in degrees; subtracted from each latitude. Default: 0. */
  centerLat?: number;
  /**
   * Standard parallel in degrees. Its cosine scales the horizontal axis so the
   * map is undistorted along that latitude. Default: 0 (cosine 1).
   */
  standardParallel?: number;
}

/**
 * Build an equirectangular projection.
 *
 * `x = radius * cos(standardParallel) * (lon - centerLon)` and
 * `y = radius * (lat - centerLat)`, with all angles in radians.
 *
 * @param options - Projection parameters.
 * @returns A projection function.
 */
export function equirectangular(options: EquirectangularOptions = {}): GeoProjection {
  const { radius = 1, centerLon = 0, centerLat = 0, standardParallel = 0 } = options;
  const cosParallel = Math.cos(standardParallel * DEG_TO_RAD);
  return ([lon, lat]) => [
    (lon - centerLon) * DEG_TO_RAD * radius * cosParallel,
    (lat - centerLat) * DEG_TO_RAD * radius,
  ];
}

/** Options for the Web Mercator projection. */
export interface MercatorOptions {
  /** Scene-unit scale applied to the radian coordinates. Default: 1. */
  radius?: number;
  /** Central meridian in degrees; subtracted from each longitude. Default: 0. */
  centerLon?: number;
  /**
   * Latitude cutoff in degrees. Latitudes beyond this are clamped so `y` stays
   * finite. Default: 85.05112878 (the standard Web Mercator limit).
   */
  maxLatitude?: number;
}

/**
 * Build a Web Mercator projection.
 *
 * `x = radius * (lon - centerLon)` and
 * `y = radius * ln(tan(PI/4 + lat/2))`, with angles in radians and latitude
 * clamped to `maxLatitude`.
 *
 * @param options - Projection parameters.
 * @returns A projection function.
 */
export function mercator(options: MercatorOptions = {}): GeoProjection {
  const { radius = 1, centerLon = 0, maxLatitude = 85.05112878 } = options;
  return ([lon, lat]) => {
    const clamped = Math.max(-maxLatitude, Math.min(maxLatitude, lat));
    const latRad = clamped * DEG_TO_RAD;
    return [
      (lon - centerLon) * DEG_TO_RAD * radius,
      radius * Math.log(Math.tan(Math.PI / 4 + latRad / 2)),
    ];
  };
}
