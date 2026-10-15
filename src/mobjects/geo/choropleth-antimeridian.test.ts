/**
 * Regression: a whole-world projection (mollweide/robinson/equirectangular) is
 * point-wise and cannot split a ring that crosses the antimeridian (longitude
 * +/-180). Without a split, two consecutive vertices at lon ~+180 and lon ~-180
 * project to opposite edges of the map, so ChoroplethMap draws one polygon edge
 * straight across the whole map: a stray horizontal line. Fiji (lat ~ -16.5,
 * astride the 180 meridian) produces exactly this line near the equator.
 *
 * The map must split such a ring into pieces so that no single polygon edge
 * spans more than the map's half-width.
 */
import { describe, it, expect } from 'vitest';
import { ChoroplethMap } from './ChoroplethMap';
import { mollweide } from './projections';
import type { GeoFeatureCollection } from './geojson';

const RADIUS = 1.3;
// mollweide half-width at the equator: x = (2*sqrt(2)*R/PI) * (PI) = 2*sqrt(2)*R.
const MAP_HALF_WIDTH = 2 * Math.SQRT2 * RADIUS;

/** A Fiji-like quad straddling the antimeridian (lon 178 -> -178 and back). */
const fijiLike: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [178, -16],
            [-178, -16],
            [-178, -18],
            [178, -18],
            [178, -16],
          ],
        ],
      },
    },
  ],
};

/** A small ordinary box far from the antimeridian. */
const ordinaryBox: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [10, 10],
            [20, 10],
            [20, 20],
            [10, 20],
            [10, 10],
          ],
        ],
      },
    },
  ],
};

function widestEdgeX(map: ChoroplethMap): number {
  let widest = 0;
  const count = map.getRegionCount();
  for (let r = 0; r < count; r++) {
    for (const polygon of map.getRegionPolygons(r)) {
      const v = polygon.getVertices();
      for (let i = 0; i < v.length - 1; i++) {
        widest = Math.max(widest, Math.abs(v[i + 1][0] - v[i][0]));
      }
    }
  }
  return widest;
}

describe('ChoroplethMap antimeridian handling (whole-world projection)', () => {
  it('does not draw a full-width horizontal edge for an antimeridian-crossing ring', () => {
    const map = new ChoroplethMap({
      geojson: fijiLike,
      value: () => 1,
      colorScale: ['#3a9f5a', '#3a9f5a'],
      domain: [0, 1],
      projection: mollweide({ radius: RADIUS }),
      borderWidth: 0.5,
    });

    // The stray chord spans the whole map (~2 * MAP_HALF_WIDTH). No real edge of
    // a split piece comes close to even the half-width.
    expect(widestEdgeX(map)).toBeLessThan(MAP_HALF_WIDTH);
  });

  it('leaves an ordinary ring as a single polygon piece', () => {
    const map = new ChoroplethMap({
      geojson: ordinaryBox,
      value: () => 1,
      colorScale: ['#3a9f5a', '#3a9f5a'],
      domain: [0, 1],
      projection: mollweide({ radius: RADIUS }),
      borderWidth: 0.5,
    });
    expect(map.getRegionPolygons(0)).toHaveLength(1);
  });
});
