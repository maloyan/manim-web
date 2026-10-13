/**
 * Minimal GeoJSON type definitions (RFC 7946 subset) for the geo module.
 *
 * Only the pieces the choropleth map needs are modeled: positions, Polygon and
 * MultiPolygon geometries, features and feature collections. Typing these
 * precisely avoids `any` while keeping the dependency surface at zero (no
 * `@types/geojson` needed).
 */

/**
 * A single coordinate as `[longitude, latitude]` in decimal degrees. A third
 * altitude element is allowed by the spec and ignored by this module.
 */
export type GeoPosition = [number, number] | [number, number, number];

/** A linear ring: an array of positions. The first ring of a polygon is its
 * exterior; any further rings are holes (punched out of the fill). */
export type GeoLinearRing = GeoPosition[];

/** A Polygon geometry: an array of linear rings (exterior first). */
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: GeoLinearRing[];
}

/** A MultiPolygon geometry: an array of polygons. */
export interface GeoMultiPolygon {
  type: 'MultiPolygon';
  coordinates: GeoLinearRing[][];
}

/** The geometry types this module renders. */
export type GeoGeometry = GeoPolygon | GeoMultiPolygon;

/** Arbitrary per-feature properties. */
export type GeoProperties = Record<string, unknown> | null;

/** A GeoJSON Feature carrying a polygonal geometry and properties. */
export interface GeoFeature {
  type: 'Feature';
  geometry: GeoGeometry;
  properties?: GeoProperties;
  id?: string | number;
}

/** A GeoJSON FeatureCollection. */
export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

/**
 * Return the exterior rings of a feature's geometry.
 *
 * A Polygon yields its first ring. A MultiPolygon yields the first ring of each
 * contained polygon. Interior rings (holes) are not included; use
 * {@link polygonRings} to get the exterior together with its holes.
 *
 * @param geometry - The feature geometry.
 * @returns One linear ring per exterior boundary.
 */
export function exteriorRings(geometry: GeoGeometry): GeoLinearRing[] {
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0];
    return ring ? [ring] : [];
  }
  const rings: GeoLinearRing[] = [];
  for (const polygon of geometry.coordinates) {
    const ring = polygon[0];
    if (ring) rings.push(ring);
  }
  return rings;
}

/**
 * One polygon's rings: its exterior boundary and its interior rings (holes).
 */
export interface PolygonRings {
  /** The exterior boundary ring. */
  exterior: GeoLinearRing;
  /** The interior rings (holes). Empty when the polygon has no holes. */
  holes: GeoLinearRing[];
}

/**
 * Return the rings of a feature's geometry, keeping each polygon's exterior
 * boundary together with its interior rings (holes).
 *
 * A Polygon yields one entry. A MultiPolygon yields one entry per contained
 * polygon. In GeoJSON a polygon is `[exterior, ...holes]`, so the first ring is
 * the exterior and the rest are holes.
 *
 * @param geometry - The feature geometry.
 * @returns One entry per polygon, each with its exterior and holes.
 */
export function polygonRings(geometry: GeoGeometry): PolygonRings[] {
  if (geometry.type === 'Polygon') {
    const [exterior, ...holes] = geometry.coordinates;
    return exterior ? [{ exterior, holes }] : [];
  }
  const result: PolygonRings[] = [];
  for (const polygon of geometry.coordinates) {
    const [exterior, ...holes] = polygon;
    if (exterior) result.push({ exterior, holes });
  }
  return result;
}
