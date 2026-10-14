/**
 * Map projections: functions that turn a `[longitude, latitude]` pair in
 * decimal degrees into a 2D `[x, y]` point in scene units.
 *
 * The module covers the projections a data-journalism or cartography scene
 * needs:
 *  - `equirectangular` (plate carrée), the default, optionally with a standard
 *    parallel so the horizontal scale matches a chosen latitude;
 *  - `mercator` (Web Mercator), clamped near the poles so `y` stays finite;
 *  - `orthographic` with a `rotate` parameter: the flat "view of a globe" look,
 *    the one to animate for a spinning-globe effect;
 *  - `albers` (conic equal-area) and `albersUsa` (the composite US layout with
 *    Alaska and Hawaii insets): the correct choropleth choice for US maps;
 *  - `robinson` and `mollweide`: whole-world maps (compromise and equal-area).
 *
 * Scale convention: every projection multiplies its natural (unit-sphere or
 * radian) output by `radius`, so with the default `radius = 1` the cylindrical
 * projections send a point at the antimeridian/pole to `[PI, PI/2]`. Callers
 * scale the whole map afterwards with the usual Mobject transforms.
 *
 * Unmappable points: a projection that cannot place a point (the back
 * hemisphere under `orthographic`) returns `[NaN, NaN]`. Callers skip
 * non-finite results; use {@link isProjectedPointVisible} to test one. This is
 * the single documented convention across the module.
 */

import type { GeoPosition } from './geojson';

const DEG_TO_RAD = Math.PI / 180;

/**
 * A projection maps a lon/lat position (degrees) to a 2D scene point. An
 * unmappable point (for example the far hemisphere of an {@link orthographic}
 * projection) comes back as `[NaN, NaN]`; see {@link isProjectedPointVisible}.
 */
export type GeoProjection = (position: GeoPosition) => [number, number];

/**
 * Test whether a projected point is mappable (both coordinates finite).
 *
 * Projections return `[NaN, NaN]` for a point they cannot place, so callers use
 * this to skip back-facing vertices instead of letting NaN leak into geometry.
 *
 * @param point - A projected `[x, y]` point.
 * @returns `true` when both coordinates are finite.
 */
export function isProjectedPointVisible(point: [number, number]): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

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

/** Options for the orthographic (view-of-a-globe) projection. */
export interface OrthographicOptions {
  /** Scene-unit radius of the projected disc. Default: 1. */
  radius?: number;
  /**
   * The geographic point placed at the center of the disc, facing the viewer,
   * as `[centerLon, centerLat]` in degrees. Animate `centerLon` to spin the
   * globe about its axis. Default: `[0, 0]`.
   */
  rotate?: [number, number];
}

/**
 * Build an orthographic projection: the view of a globe from infinitely far
 * away. Only the near hemisphere is mappable; a point on the far hemisphere
 * (angular distance greater than 90 degrees from the view center) comes back as
 * `[NaN, NaN]`, so callers drop it (see {@link isProjectedPointVisible}).
 *
 * Spinning-globe pattern: build one projection per frame with a growing
 * `rotate[0]`, for example `orthographic({ rotate: [frame * 2, 0] })`, and the
 * globe turns eastward. Two different `rotate` values give two still frames of
 * that spin.
 *
 * `x = radius * cos(lat) * sin(lon - centerLon)` and
 * `y = radius * (cos(centerLat) sin(lat) - sin(centerLat) cos(lat) cos(lon - centerLon))`.
 *
 * @param options - Projection parameters.
 * @returns A projection function.
 */
export function orthographic(options: OrthographicOptions = {}): GeoProjection {
  const { radius = 1, rotate = [0, 0] } = options;
  const lambda0 = rotate[0] * DEG_TO_RAD;
  const phi0 = rotate[1] * DEG_TO_RAD;
  const sinPhi0 = Math.sin(phi0);
  const cosPhi0 = Math.cos(phi0);
  return ([lon, lat]) => {
    const lambda = lon * DEG_TO_RAD - lambda0;
    const phi = lat * DEG_TO_RAD;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    // Cosine of the angular distance from the view center. Negative means the
    // point is on the far hemisphere and must not be drawn.
    const cosC = sinPhi0 * sinPhi + cosPhi0 * cosPhi * Math.cos(lambda);
    if (cosC < 0) return [NaN, NaN];
    return [
      radius * cosPhi * Math.sin(lambda),
      radius * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * Math.cos(lambda)),
    ];
  };
}

/** Options for the Albers (conic equal-area) projection. */
export interface AlbersOptions {
  /** Scene-unit scale applied to the conic coordinates. Default: 1. */
  radius?: number;
  /**
   * The two standard parallels in degrees. Equal-area is exact along these.
   * Default: `[29.5, 45.5]` (the US National Atlas / EPSG:5070 parallels).
   */
  parallels?: [number, number];
  /** Reference longitude (central meridian) in degrees. Default: -96. */
  centerLon?: number;
  /** Reference latitude (origin of y) in degrees. Default: 23. */
  centerLat?: number;
}

/**
 * The raw conic equal-area transform shared by {@link albers} and
 * {@link albersUsa}. Returns a projection in `radius` units with the reference
 * point `[centerLon, centerLat]` at the origin.
 *
 * `rho = sqrt(C - 2 n sin(lat)) / n`, `theta = n (lon - centerLon)`,
 * `x = rho sin(theta)`, `y = rho0 - rho cos(theta)`.
 */
function conicEqualArea(
  parallels: [number, number],
  centerLon: number,
  centerLat: number,
  radius: number,
): GeoProjection {
  const phi1 = parallels[0] * DEG_TO_RAD;
  const phi2 = parallels[1] * DEG_TO_RAD;
  const n = (Math.sin(phi1) + Math.sin(phi2)) / 2;
  if (Math.abs(n) < 1e-9) {
    throw new Error(
      `conic equal-area: standard parallels ${parallels[0]} and ${parallels[1]} are degenerate ` +
        `(their sines cancel, n = 0). Use two parallels with a non-zero mean sine.`,
    );
  }
  const c = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
  const rho0 = (Math.sqrt(c - 2 * n * Math.sin(centerLat * DEG_TO_RAD)) / n) * radius;
  return ([lon, lat]) => {
    const rho = (Math.sqrt(Math.max(0, c - 2 * n * Math.sin(lat * DEG_TO_RAD))) / n) * radius;
    const theta = n * (lon - centerLon) * DEG_TO_RAD;
    return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
  };
}

/**
 * Build an Albers conic equal-area projection. Equal-area projections keep
 * region sizes true, so this is the right default for a choropleth where area
 * should not mislead (the US map especially).
 *
 * @param options - Projection parameters.
 * @returns A projection function.
 */
export function albers(options: AlbersOptions = {}): GeoProjection {
  const { radius = 1, parallels = [29.5, 45.5], centerLon = -96, centerLat = 23 } = options;
  return conicEqualArea(parallels, centerLon, centerLat, radius);
}

/** Options for the composite {@link albersUsa} projection. */
export interface AlbersUsaOptions {
  /** Scene-unit scale of the composite layout. Default: 1. */
  radius?: number;
}

/**
 * Build the composite "Albers USA" projection: the continental US via
 * {@link albers}, with Alaska and Hawaii drawn as scaled insets in the
 * lower-left, the standard US thematic-map layout. Each region uses its own
 * conic equal-area projection, then a fixed scale and translation places it in
 * the composite frame, so the three regions never overlap.
 *
 * A point is routed by its longitude/latitude: the Alaska box, else the Hawaii
 * box, else the continental projection. The continental US is centered on the
 * origin.
 *
 * @param options - Projection parameters.
 * @returns A projection function.
 */
export function albersUsa(options: AlbersUsaOptions = {}): GeoProjection {
  const { radius = 1 } = options;

  const lower48 = conicEqualArea([29.5, 45.5], -96, 37.5, radius);
  // Alaska and Hawaii: own conics, shrunk and shifted into the lower-left.
  const alaskaRaw = conicEqualArea([55, 65], -154, 50, radius * 0.35);
  const hawaiiRaw = conicEqualArea([8, 18], -157, 20, radius);
  const alaskaOffset: [number, number] = [-0.35 * radius, -0.33 * radius];
  const hawaiiOffset: [number, number] = [-0.13 * radius, -0.26 * radius];

  const inAlaska = (lon: number, lat: number): boolean => lat >= 50 && (lon < -128 || lon > 170);
  const inHawaii = (lon: number, lat: number): boolean =>
    lat >= 18 && lat < 29 && lon >= -162 && lon <= -152;

  return ([lon, lat]) => {
    if (inAlaska(lon, lat)) {
      const [x, y] = alaskaRaw([lon, lat]);
      return [x + alaskaOffset[0], y + alaskaOffset[1]];
    }
    if (inHawaii(lon, lat)) {
      const [x, y] = hawaiiRaw([lon, lat]);
      return [x + hawaiiOffset[0], y + hawaiiOffset[1]];
    }
    return lower48([lon, lat]);
  };
}

/** Options for the Robinson projection. */
export interface RobinsonOptions {
  /** Scene-unit scale applied to the projection. Default: 1. */
  radius?: number;
  /** Central meridian in degrees; subtracted from each longitude. Default: 0. */
  centerLon?: number;
}

// Robinson lookup table at 5-degree latitude steps (0..90). `AA` scales
// longitude (meridian spacing), `BB` scales the parallel's height. Source: the
// standard published Robinson coefficients.
const ROBINSON_AA = [
  1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986,
  0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322,
];
const ROBINSON_BB = [
  0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903,
  0.8435, 0.8936, 0.9394, 0.9761, 1,
];

/** Linear interpolation of a Robinson table at an absolute latitude (degrees). */
function robinsonLookup(table: number[], absLatDeg: number): number {
  const clamped = Math.min(90, Math.max(0, absLatDeg));
  const pos = clamped / 5;
  const i = Math.min(table.length - 2, Math.floor(pos));
  const frac = pos - i;
  return table[i] + (table[i + 1] - table[i]) * frac;
}

/**
 * Build a Robinson projection: the compromise whole-world map with a flat top
 * and curved meridians, widely used for world choropleths. Values come from the
 * standard lookup table, interpolated linearly between 5-degree steps.
 *
 * `x = 0.8487 R AA(|lat|) (lon - centerLon)` (lon in radians) and
 * `y = 1.3523 R BB(|lat|) sign(lat)`.
 *
 * @param options - Projection parameters.
 * @returns A projection function.
 */
export function robinson(options: RobinsonOptions = {}): GeoProjection {
  const { radius = 1, centerLon = 0 } = options;
  return ([lon, lat]) => {
    const absLat = Math.abs(lat);
    const aa = robinsonLookup(ROBINSON_AA, absLat);
    const bb = robinsonLookup(ROBINSON_BB, absLat);
    const x = 0.8487 * radius * aa * (lon - centerLon) * DEG_TO_RAD;
    const y = 1.3523 * radius * bb * Math.sign(lat);
    return [x, y];
  };
}

/** Options for the Mollweide projection. */
export interface MollweideOptions {
  /** Scene-unit scale applied to the projection. Default: 1. */
  radius?: number;
  /** Central meridian in degrees; subtracted from each longitude. Default: 0. */
  centerLon?: number;
}

/**
 * Build a Mollweide projection: the elliptical equal-area whole-world map. The
 * auxiliary angle `theta` solves `2 theta + sin(2 theta) = PI sin(lat)` by
 * Newton iteration, then
 * `x = R (2 sqrt(2) / PI) (lon - centerLon) cos(theta)` (lon in radians) and
 * `y = R sqrt(2) sin(theta)`.
 *
 * @param options - Projection parameters.
 * @returns A projection function.
 */
export function mollweide(options: MollweideOptions = {}): GeoProjection {
  const { radius = 1, centerLon = 0 } = options;
  const kx = (radius * 2 * Math.SQRT2) / Math.PI;
  const ky = radius * Math.SQRT2;
  return ([lon, lat]) => {
    const phi = lat * DEG_TO_RAD;
    let theta: number;
    if (Math.abs(Math.abs(phi) - Math.PI / 2) < 1e-9) {
      // At a pole the Newton step divides by zero; theta is +/- PI/2 exactly.
      theta = Math.sign(phi) * (Math.PI / 2);
    } else {
      const piSinPhi = Math.PI * Math.sin(phi);
      theta = phi;
      for (let i = 0; i < 20; i++) {
        const delta = (2 * theta + Math.sin(2 * theta) - piSinPhi) / (2 + 2 * Math.cos(2 * theta));
        theta -= delta;
        if (Math.abs(delta) < 1e-12) break;
      }
    }
    return [kx * (lon - centerLon) * DEG_TO_RAD * Math.cos(theta), ky * Math.sin(theta)];
  };
}
