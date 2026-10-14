/**
 * Tests for TopoJSON -> GeoJSON conversion and ChoroplethMap region bounds.
 *
 * All fixtures are tiny inline TopoJSON objects, so the tests need no network
 * and no real map data. They assert arc delta-decoding with a quantization
 * transform, shared-arc stitching with reversed (negative) indices, point and
 * line decoding, malformed-input errors, composition with ChoroplethMap, and
 * the projected region-bounds API.
 */
import { describe, it, expect } from 'vitest';
import { topojsonToGeojson, type Topology } from './topojson';
import { ChoroplethMap } from './ChoroplethMap';
import { equirectangular } from './projections';
import type { GeoPolygon, GeoLineString, GeoPoint } from './geojson';

/**
 * Two adjacent quantized squares that share one arc (the common edge). This
 * exercises delta decoding, the transform (scale 0.5, translate [10, 20]),
 * multi-arc stitching, and a reversed arc via a negative index.
 *
 * Quantized geometry (pre-transform integer grid):
 *   arc 0: shared edge   (2,0) -> (2,2)
 *   arc 1: rest of A     (2,2) -> (0,2) -> (0,0) -> (2,0)
 *   arc 2: rest of B     (2,0) -> (4,0) -> (4,2) -> (2,2)
 *   A ring = [0, 1]      B ring = [2, ~0]  (~0 === -1, arc 0 reversed)
 */
const sharedArcTopology: Topology = {
  type: 'Topology',
  transform: { scale: [0.5, 0.5], translate: [10, 20] },
  arcs: [
    [
      [2, 0],
      [0, 2],
    ],
    [
      [2, 2],
      [-2, 0],
      [0, -2],
      [2, 0],
    ],
    [
      [2, 0],
      [2, 0],
      [0, 2],
      [-2, 0],
    ],
  ],
  objects: {
    regions: {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Polygon', arcs: [[0, 1]], properties: { name: 'A', value: 10 } },
        { type: 'Polygon', arcs: [[2, -1]], properties: { name: 'B', value: 20 } },
      ],
    },
  },
};

describe('topojsonToGeojson', () => {
  it('decodes a quantized, delta-encoded topology into the right GeoJSON coords', () => {
    const geojson = topojsonToGeojson(sharedArcTopology);
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features).toHaveLength(2);

    const a = geojson.features[0].geometry as GeoPolygon;
    expect(a.type).toBe('Polygon');
    expect(a.coordinates).toEqual([
      [
        [11, 20],
        [11, 21],
        [10, 21],
        [10, 20],
        [11, 20],
      ],
    ]);

    // B stitches arc 2 then arc 0 reversed (negative index), and closes.
    const b = geojson.features[1].geometry as GeoPolygon;
    expect(b.coordinates).toEqual([
      [
        [11, 20],
        [12, 20],
        [12, 21],
        [11, 21],
        [11, 20],
      ],
    ]);
  });

  it('carries properties and ids through to features', () => {
    const geojson = topojsonToGeojson(sharedArcTopology);
    expect(geojson.features[0].properties).toEqual({ name: 'A', value: 10 });
    expect(geojson.features[1].properties).toEqual({ name: 'B', value: 20 });
  });

  it('selects an object by name and defaults to the first object', () => {
    const topo: Topology = {
      type: 'Topology',
      arcs: [],
      objects: {
        first: { type: 'Point', coordinates: [1, 2] },
        second: { type: 'Point', coordinates: [3, 4] },
      },
    };
    const byDefault = topojsonToGeojson(topo);
    expect((byDefault.features[0].geometry as GeoPoint).coordinates).toEqual([1, 2]);

    const byName = topojsonToGeojson(topo, 'second');
    expect((byName.features[0].geometry as GeoPoint).coordinates).toEqual([3, 4]);
  });

  it('decodes a LineString from absolute (un-transformed) arcs', () => {
    const topo: Topology = {
      type: 'Topology',
      arcs: [
        [
          [0, 0],
          [1, 1],
          [2, 0],
        ],
      ],
      objects: {
        lines: {
          type: 'GeometryCollection',
          geometries: [{ type: 'LineString', arcs: [0], properties: { name: 'L' } }],
        },
      },
    };
    const line = topojsonToGeojson(topo).features[0].geometry as GeoLineString;
    expect(line.type).toBe('LineString');
    expect(line.coordinates).toEqual([
      [0, 0],
      [1, 1],
      [2, 0],
    ]);
  });

  it('de-quantizes stand-alone Point coordinates with the transform', () => {
    const topo: Topology = {
      type: 'Topology',
      transform: { scale: [0.5, 0.5], translate: [10, 20] },
      arcs: [],
      objects: { p: { type: 'Point', coordinates: [2, 4] } },
    };
    const point = topojsonToGeojson(topo).features[0].geometry as GeoPoint;
    expect(point.coordinates).toEqual([11, 22]);
  });

  it('throws a clear error for a missing object', () => {
    expect(() => topojsonToGeojson(sharedArcTopology, 'nope')).toThrow(/not found/);
  });

  it('throws when an arc index is out of range', () => {
    const topo: Topology = {
      type: 'Topology',
      arcs: [[[0, 0]]],
      objects: {
        bad: {
          type: 'GeometryCollection',
          geometries: [{ type: 'LineString', arcs: [5] }],
        },
      },
    };
    expect(() => topojsonToGeojson(topo)).toThrow(/out of range/);
  });

  it('throws on malformed topology (missing arcs / objects)', () => {
    expect(() => topojsonToGeojson({ type: 'Topology' } as unknown as Topology)).toThrow(
      /arcs must be an array/,
    );
    expect(() => topojsonToGeojson({ type: 'Topology', arcs: [] } as unknown as Topology)).toThrow(
      /objects must be an object/,
    );
  });

  it('composes with ChoroplethMap: topojson -> map builds one region per feature', () => {
    const geojson = topojsonToGeojson(sharedArcTopology);
    const map = new ChoroplethMap({
      geojson,
      value: (feature) => feature.properties?.value as number,
    });
    expect(map.getRegionCount()).toBe(2);
    expect(map.getRegionPolygons(0)).toHaveLength(1);
  });
});

describe('ChoroplethMap region bounds', () => {
  const geojson = topojsonToGeojson(sharedArcTopology);
  // Project with the identity-ish equirectangular default so projected x/y stay
  // proportional to the decoded lon/lat; good enough for a bounds assertion.
  const projection = equirectangular({ radius: 1 });
  const map = new ChoroplethMap({
    geojson,
    value: (feature) => feature.properties?.value as number,
    projection,
  });

  it('getRegionBounds encloses the region projected vertices', () => {
    const bounds = map.getRegionBounds(0);
    expect(bounds).toBeDefined();
    if (!bounds) return;
    // Region A decoded ring x in [10,11], y in [20,21]; projected monotonically.
    const [minXExp] = projection([10, 20]);
    const [maxXExp] = projection([11, 21]);
    expect(bounds.minX).toBeCloseTo(minXExp, 10);
    expect(bounds.maxX).toBeCloseTo(maxXExp, 10);
    const minYExp = projection([10, 20])[1];
    const maxYExp = projection([11, 21])[1];
    expect(bounds.minY).toBeCloseTo(minYExp, 10);
    expect(bounds.maxY).toBeCloseTo(maxYExp, 10);

    // Every projected vertex of region A lies within the bounds.
    const a = geojson.features[0].geometry as GeoPolygon;
    for (const position of a.coordinates[0]) {
      const [x, y] = projection(position);
      expect(x).toBeGreaterThanOrEqual(bounds.minX - 1e-9);
      expect(x).toBeLessThanOrEqual(bounds.maxX + 1e-9);
      expect(y).toBeGreaterThanOrEqual(bounds.minY - 1e-9);
      expect(y).toBeLessThanOrEqual(bounds.maxY + 1e-9);
    }
  });

  it('boundsOfRegions unions the two regions (wider than either alone)', () => {
    const a = map.getRegionBounds(0);
    const both = map.boundsOfRegions([0, 1]);
    expect(a).toBeDefined();
    expect(both).toBeDefined();
    if (!a || !both) return;
    // A spans x in [10,11]; B extends to x=12, so the union is wider on the right.
    expect(both.maxX).toBeGreaterThan(a.maxX);
    expect(both.minX).toBeCloseTo(a.minX, 10);
  });

  it('getRegionBounds returns undefined for an out-of-range index', () => {
    expect(map.getRegionBounds(99)).toBeUndefined();
    expect(map.getRegionBounds(-1)).toBeUndefined();
  });

  it('boundsOfRegions ignores out-of-range indices, returns undefined when none match', () => {
    expect(map.boundsOfRegions([99, 100])).toBeUndefined();
    const only = map.boundsOfRegions([0, 99]);
    const a = map.getRegionBounds(0);
    expect(only).toEqual(a);
  });

  it('focusOnRegion returns center/width/height and applies padding', () => {
    const focus = map.focusOnRegion(0);
    const bounds = map.getRegionBounds(0);
    expect(focus).toBeDefined();
    if (!focus || !bounds) return;
    expect(focus.center[0]).toBeCloseTo((bounds.minX + bounds.maxX) / 2, 10);
    expect(focus.center[1]).toBeCloseTo((bounds.minY + bounds.maxY) / 2, 10);
    expect(focus.width).toBeCloseTo(bounds.maxX - bounds.minX, 10);

    const padded = map.focusOnRegion(0, { padding: 0.5 });
    if (!padded) return;
    expect(padded.width).toBeCloseTo(focus.width * 2, 10);
    expect(padded.height).toBeCloseTo(focus.height * 2, 10);
  });

  it('focusOnRegion accepts an array of indices (union frame)', () => {
    const focus = map.focusOnRegion([0, 1]);
    const union = map.boundsOfRegions([0, 1]);
    expect(focus).toBeDefined();
    if (!focus || !union) return;
    expect(focus.width).toBeCloseTo(union.maxX - union.minX, 10);
  });
});
