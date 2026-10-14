/**
 * TopoJSON to GeoJSON conversion.
 *
 * TopoJSON is a compact map format in which shared boundaries are stored once as
 * reusable "arcs" and geometries reference those arcs by index. Coordinates are
 * usually quantized to an integer grid and delta-encoded. This module decodes a
 * TopoJSON topology into a plain {@link GeoFeatureCollection} that the rest of
 * the geo module (for example {@link ChoroplethMap}) consumes directly.
 *
 * The decoder is a pure function over a local object: it does no network access
 * and does not mutate its input. It follows the same arc/transform rules as the
 * reference `topojson-client`, so standard TopoJSON files decode identically.
 *
 * @example
 * ```typescript
 * import { topojsonToGeojson, ChoroplethMap } from 'manim-web';
 * const geojson = topojsonToGeojson(topology, 'states');
 * const map = new ChoroplethMap({ geojson, value: (f) => f.properties?.v as number });
 * ```
 */

import type {
  GeoFeature,
  GeoFeatureCollection,
  GeoGeometry,
  GeoLinearRing,
  GeoLineString,
  GeoMultiLineString,
  GeoMultiPoint,
  GeoMultiPolygon,
  GeoPoint,
  GeoPolygon,
  GeoPosition,
  GeoProperties,
} from './geojson';

/**
 * The quantization transform of a TopoJSON topology. Input coordinates are
 * integers; `scale` and `translate` map them back to real-world units.
 */
export interface TopoTransform {
  /** Per-axis multiplier `[kx, ky]` applied to the integer coordinates. */
  scale: [number, number];
  /** Per-axis offset `[dx, dy]` added after scaling. */
  translate: [number, number];
}

/** Fields shared by every TopoJSON geometry object. */
export interface TopoGeometryBase {
  /** Arbitrary per-geometry properties, carried through to the GeoJSON feature. */
  properties?: GeoProperties;
  /** Optional identifier, carried through to the GeoJSON feature. */
  id?: string | number;
}

/** A TopoJSON Point geometry (coordinates are a single quantized position). */
export interface TopoPoint extends TopoGeometryBase {
  type: 'Point';
  coordinates: number[];
}

/** A TopoJSON MultiPoint geometry (an array of quantized positions). */
export interface TopoMultiPoint extends TopoGeometryBase {
  type: 'MultiPoint';
  coordinates: number[][];
}

/** A TopoJSON LineString geometry (a list of arc indices). */
export interface TopoLineString extends TopoGeometryBase {
  type: 'LineString';
  arcs: number[];
}

/** A TopoJSON MultiLineString geometry (an array of arc-index lists). */
export interface TopoMultiLineString extends TopoGeometryBase {
  type: 'MultiLineString';
  arcs: number[][];
}

/** A TopoJSON Polygon geometry (an array of rings, each a list of arc indices). */
export interface TopoPolygon extends TopoGeometryBase {
  type: 'Polygon';
  arcs: number[][];
}

/** A TopoJSON MultiPolygon geometry (an array of polygons). */
export interface TopoMultiPolygon extends TopoGeometryBase {
  type: 'MultiPolygon';
  arcs: number[][][];
}

/** A TopoJSON GeometryCollection (a group of geometries). */
export interface TopoGeometryCollection extends TopoGeometryBase {
  type: 'GeometryCollection';
  geometries: TopoGeometryObject[];
}

/** A null geometry, allowed by the spec for a feature with no shape. */
export interface TopoNullGeometry extends TopoGeometryBase {
  type: null;
}

/** Any TopoJSON geometry object. */
export type TopoGeometryObject =
  | TopoPoint
  | TopoMultiPoint
  | TopoLineString
  | TopoMultiLineString
  | TopoPolygon
  | TopoMultiPolygon
  | TopoGeometryCollection
  | TopoNullGeometry;

/**
 * A TopoJSON topology: the top-level container with its shared arcs, optional
 * quantization transform, and named objects.
 */
export interface Topology {
  type: 'Topology';
  /** Optional quantization transform. When absent, arcs hold absolute coordinates. */
  transform?: TopoTransform;
  /** The shared arcs. Each arc is a list of positions (delta-encoded if quantized). */
  arcs: number[][][];
  /** The named objects. Each value is a geometry object (often a GeometryCollection). */
  objects: Record<string, TopoGeometryObject>;
}

/**
 * Convert a TopoJSON topology into a {@link GeoFeatureCollection}.
 *
 * One object of the topology is decoded. A GeometryCollection becomes one
 * feature per contained geometry; any other geometry becomes a single feature.
 * Arcs are delta-decoded and de-quantized with the topology transform, shared
 * arcs are stitched, and a negative arc index selects that arc reversed.
 *
 * @param topology - The TopoJSON topology object.
 * @param objectName - Which entry of `topology.objects` to decode. Defaults to
 *   the first entry.
 * @returns A GeoJSON feature collection with Point, LineString and Polygon
 *   geometries (and their Multi variants).
 * @throws If the topology is malformed, an arc index is out of range, or the
 *   requested object is missing.
 */
export function topojsonToGeojson(topology: Topology, objectName?: string): GeoFeatureCollection {
  if (topology === null || typeof topology !== 'object') {
    throw new Error('topojsonToGeojson: topology must be an object.');
  }
  if (!Array.isArray(topology.arcs)) {
    throw new Error('topojsonToGeojson: topology.arcs must be an array.');
  }
  if (topology.objects === null || typeof topology.objects !== 'object') {
    throw new Error('topojsonToGeojson: topology.objects must be an object.');
  }

  const object = selectObject(topology, objectName);
  const arcs = decodeArcs(topology);
  const decodePt = (coordinates: number[]): GeoPosition =>
    decodePoint(coordinates, topology.transform);

  // A TopoJSON null geometry ({type:null}) carries no shape. Skip it so one null
  // member does not abort the decode of the whole collection.
  const members = object.type === 'GeometryCollection' ? object.geometries : [object];
  const features: GeoFeature[] = members
    .filter((geometry) => geometry.type !== null)
    .map((geometry) => geometryToFeature(geometry, arcs, decodePt));

  return { type: 'FeatureCollection', features };
}

/** De-quantizes a stand-alone position (used for Point and MultiPoint). */
type PointDecoder = (coordinates: number[]) => GeoPosition;

/** Pick the requested object, or the first one when no name is given. */
function selectObject(topology: Topology, objectName?: string): TopoGeometryObject {
  if (objectName !== undefined) {
    const object = topology.objects[objectName];
    if (object === undefined) {
      const available = Object.keys(topology.objects).join(', ') || '(none)';
      throw new Error(
        `topojsonToGeojson: object "${objectName}" not found. Available: ${available}.`,
      );
    }
    return object;
  }
  const firstKey = Object.keys(topology.objects)[0];
  if (firstKey === undefined) {
    throw new Error('topojsonToGeojson: topology has no objects to decode.');
  }
  return topology.objects[firstKey];
}

/**
 * Decode every arc to absolute positions.
 *
 * With a transform, each arc is delta-encoded in an integer grid: the running
 * position starts at the arc origin and accumulates per point, then each point
 * is de-quantized as `value * scale + translate`. Without a transform, the arc
 * already holds absolute coordinates.
 */
function decodeArcs(topology: Topology): GeoPosition[][] {
  const { transform, arcs } = topology;
  if (!transform) {
    return arcs.map((arc) => arc.map((point) => [point[0], point[1]] as GeoPosition));
  }
  const [kx, ky] = transform.scale;
  const [dx, dy] = transform.translate;
  return arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map((point) => {
      x += point[0];
      y += point[1];
      return [x * kx + dx, y * ky + dy] as GeoPosition;
    });
  });
}

/** De-quantize a stand-alone position (Point/MultiPoint). */
function decodePoint(coordinates: number[], transform?: TopoTransform): GeoPosition {
  if (!transform) return [coordinates[0], coordinates[1]];
  const [kx, ky] = transform.scale;
  const [dx, dy] = transform.translate;
  return [coordinates[0] * kx + dx, coordinates[1] * ky + dy];
}

/** Resolve one arc index to its positions, reversing it when the index is negative. */
function resolveArc(index: number, arcs: GeoPosition[][]): GeoPosition[] {
  const normalized = index < 0 ? ~index : index;
  const arc = arcs[normalized];
  if (arc === undefined) {
    throw new Error(`topojsonToGeojson: arc index ${index} is out of range.`);
  }
  return index < 0 ? arc.slice().reverse() : arc;
}

/**
 * Stitch a list of arc indices into one line of positions. The first position
 * of each arc after the first duplicates the last of the previous arc, so it is
 * dropped.
 */
function stitchLine(indices: number[], arcs: GeoPosition[][]): GeoPosition[] {
  const points: GeoPosition[] = [];
  for (const index of indices) {
    const arc = resolveArc(index, arcs);
    const start = points.length === 0 ? 0 : 1;
    for (let k = start; k < arc.length; k++) {
      points.push(arc[k]);
    }
  }
  return points;
}

/** Stitch a ring and close it (GeoJSON requires the first and last to match). */
function stitchRing(indices: number[], arcs: GeoPosition[][]): GeoLinearRing {
  const points = stitchLine(indices, arcs);
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    points.push([first[0], first[1]]);
  }
  return points;
}

/** Decode one TopoJSON geometry into a GeoJSON feature. */
function geometryToFeature(
  geometry: TopoGeometryObject,
  arcs: GeoPosition[][],
  decodePt: PointDecoder,
): GeoFeature {
  const feature: GeoFeature = {
    type: 'Feature',
    geometry: geometryToGeoGeometry(geometry, arcs, decodePt),
    properties: geometry.properties ?? null,
  };
  if (geometry.id !== undefined) feature.id = geometry.id;
  return feature;
}

/** Decode a TopoJSON geometry object into a GeoJSON geometry. */
function geometryToGeoGeometry(
  geometry: TopoGeometryObject,
  arcs: GeoPosition[][],
  decodePt: PointDecoder,
): GeoGeometry {
  switch (geometry.type) {
    case 'Point': {
      const out: GeoPoint = { type: 'Point', coordinates: decodePt(geometry.coordinates) };
      return out;
    }
    case 'MultiPoint': {
      const out: GeoMultiPoint = {
        type: 'MultiPoint',
        coordinates: geometry.coordinates.map((point) => decodePt(point)),
      };
      return out;
    }
    case 'LineString': {
      const out: GeoLineString = {
        type: 'LineString',
        coordinates: stitchLine(geometry.arcs, arcs),
      };
      return out;
    }
    case 'MultiLineString': {
      const out: GeoMultiLineString = {
        type: 'MultiLineString',
        coordinates: geometry.arcs.map((line) => stitchLine(line, arcs)),
      };
      return out;
    }
    case 'Polygon': {
      const out: GeoPolygon = {
        type: 'Polygon',
        coordinates: geometry.arcs.map((ring) => stitchRing(ring, arcs)),
      };
      return out;
    }
    case 'MultiPolygon': {
      const out: GeoMultiPolygon = {
        type: 'MultiPolygon',
        coordinates: geometry.arcs.map((polygon) => polygon.map((ring) => stitchRing(ring, arcs))),
      };
      return out;
    }
    case 'GeometryCollection':
      throw new Error(
        'topojsonToGeojson: nested GeometryCollection is not supported; ' +
          'use a top-level GeometryCollection object instead.',
      );
    default:
      throw new Error(
        `topojsonToGeojson: unsupported geometry type "${String(
          (geometry as { type?: unknown }).type,
        )}".`,
      );
  }
}
