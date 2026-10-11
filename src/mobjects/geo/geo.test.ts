/**
 * Tests for the geographical maps module (issue #296).
 *
 * All fixtures are tiny inline GeoJSON objects, so the tests need no network
 * and no real map data. They assert projection math, choropleth region
 * building and value→color mapping, and globe point/arc/graticule geometry.
 */
import { describe, it, expect } from 'vitest';
import { Group } from '../../core/Group';
import { Polygon } from '../geometry/Polygon';
import { Sphere } from '../three-d/Sphere';
import { Dot3D } from '../three-d/ThreeDExtensions';
import { equirectangular, mercator } from './projections';
import { ColorScale } from './colorScale';
import { ChoroplethMap, GeoMap } from './ChoroplethMap';
import { Globe } from './Globe';
import type { GeoFeatureCollection } from './geojson';

const sampleGeo: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'A', value: 10 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'B', value: 20 },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [20, 20],
              [30, 20],
              [30, 30],
              [20, 30],
              [20, 20],
            ],
          ],
        ],
      },
    },
  ],
};

const DEG = Math.PI / 180;

describe('geo projections', () => {
  it('equirectangular maps the origin to the origin', () => {
    const project = equirectangular();
    const [x, y] = project([0, 0]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('equirectangular maps a known point (180E, 90N) to [PI, PI/2]', () => {
    const project = equirectangular();
    const [x, y] = project([180, 90]);
    expect(x).toBeCloseTo(Math.PI, 10);
    expect(y).toBeCloseTo(Math.PI / 2, 10);
  });

  it('equirectangular scales longitude by the standard parallel cosine', () => {
    const project = equirectangular({ standardParallel: 60 });
    const [x] = project([10, 0]);
    expect(x).toBeCloseTo(10 * DEG * Math.cos(60 * DEG), 10);
  });

  it('mercator maps the origin to the origin and is finite at the pole', () => {
    const project = mercator();
    const [x, y] = project([0, 0]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
    const [, yPole] = project([0, 90]);
    expect(Number.isFinite(yPole)).toBe(true);
  });
});

describe('ColorScale', () => {
  it('maps the domain endpoints to the first and last reference color', () => {
    const scale = new ColorScale({ colors: ['#000000', '#ffffff'], domain: [10, 20] });
    expect(scale.colorFor(10)).toBe('#000000');
    expect(scale.colorFor(20)).toBe('#ffffff');
  });

  it('clamps out-of-domain values', () => {
    const scale = new ColorScale({ colors: ['#000000', '#ffffff'], domain: [0, 1] });
    expect(scale.colorFor(-5)).toBe('#000000');
    expect(scale.colorFor(5)).toBe('#ffffff');
  });

  it('derives its domain from a list of values', () => {
    const scale = new ColorScale({ colors: ['#000000', '#ffffff'] });
    scale.setDomainFromValues([10, 20, 15]);
    expect(scale.getDomain()).toEqual([10, 20]);
  });
});

describe('ChoroplethMap', () => {
  it('builds exactly one region per feature', () => {
    const map = new ChoroplethMap({
      geojson: sampleGeo,
      value: (feature) => feature.properties?.value as number,
    });
    expect(map.getRegionCount()).toBe(2);
    expect(map.getRegions()).toHaveLength(2);
  });

  it('projects lon/lat to the expected 2D coordinates (equirectangular)', () => {
    const map = new ChoroplethMap({
      geojson: sampleGeo,
      value: (feature) => feature.properties?.value as number,
    });
    const first = map.getRegionPolygons(0)[0];
    expect(first).toBeInstanceOf(Polygon);
    const vertices = first.getVertices();
    // Ring starts at lon/lat [0, 0] -> [0, 0, 0]
    expect(vertices[0][0]).toBeCloseTo(0, 10);
    expect(vertices[0][1]).toBeCloseTo(0, 10);
    // Second vertex is [10, 0] -> [10deg in rad, 0]
    expect(vertices[1][0]).toBeCloseTo(10 * DEG, 10);
    expect(vertices[1][1]).toBeCloseTo(0, 10);
  });

  it('maps values to colors across the domain', () => {
    const map = new ChoroplethMap({
      geojson: sampleGeo,
      value: (feature) => feature.properties?.value as number,
      colorScale: ['#000000', '#ffffff'],
      domain: [10, 20],
    });
    expect(map.getRegionColor(0)).toBe('#000000');
    expect(map.getRegionColor(1)).toBe('#ffffff');
    // The region polygon carries the value color as its fill.
    expect(map.getRegionPolygons(0)[0].fillColor).toBe('#000000');
  });

  it('uses the no-data color when the accessor returns null', () => {
    const map = new ChoroplethMap({
      geojson: sampleGeo,
      value: (feature) => (feature.properties?.name === 'A' ? null : 20) as number | null,
      colorScale: ['#000000', '#ffffff'],
      domain: [10, 20],
      noDataColor: '#123456',
    });
    expect(map.getRegionColor(0)).toBe('#123456');
  });

  it('draws optional borders with the configured color and width', () => {
    const map = new ChoroplethMap({
      geojson: sampleGeo,
      value: (feature) => feature.properties?.value as number,
      borderColor: '#ff0000',
      borderWidth: 3,
    });
    const poly = map.getRegionPolygons(0)[0];
    expect(poly.strokeWidth).toBe(3);
    expect(poly.color).toBe('#ff0000');
  });

  it('supports a mercator projection and is a scene-graph Group', () => {
    const map = new ChoroplethMap({
      geojson: sampleGeo,
      value: (feature) => feature.properties?.value as number,
      projection: mercator(),
    });
    expect(map).toBeInstanceOf(Group);
    const vertices = map.getRegionPolygons(0)[0].getVertices();
    expect(vertices[0][0]).toBeCloseTo(0, 10);
  });

  it('is also exported under the GeoMap alias', () => {
    expect(GeoMap).toBe(ChoroplethMap);
  });
});

describe('Globe', () => {
  const RADIUS = 2;

  it('wraps a plain Sphere when no texture is given', () => {
    const globe = new Globe({ radius: RADIUS });
    expect(globe).toBeInstanceOf(Group);
    expect(globe.getSphere()).toBeInstanceOf(Sphere);
  });

  it('maps lat/lon 0,0 to the +X point on the sphere', () => {
    const globe = new Globe({ radius: RADIUS });
    const [x, y, z] = globe.latLonToPoint(0, 0);
    expect(x).toBeCloseTo(RADIUS, 10);
    expect(y).toBeCloseTo(0, 10);
    expect(z).toBeCloseTo(0, 10);
  });

  it('maps the north pole to the +Z point on the sphere', () => {
    const globe = new Globe({ radius: RADIUS });
    const [x, y, z] = globe.latLonToPoint(90, 0);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
    expect(z).toBeCloseTo(RADIUS, 10);
  });

  it('honors the center offset when plotting points', () => {
    const globe = new Globe({ radius: RADIUS, center: [1, 2, 3] });
    const point = globe.latLonToPoint(0, 0);
    expect(point).toEqual([1 + RADIUS, 2, 3]);
  });

  it('plotPoint adds a Dot3D marker at the mapped position', () => {
    const globe = new Globe({ radius: RADIUS });
    const dot = globe.plotPoint(0, 90);
    expect(dot).toBeInstanceOf(Dot3D);
    expect(globe.getPlottedPoints()).toContain(dot);
    const expected = globe.latLonToPoint(0, 90);
    const pos = dot.getPoint();
    expect(pos[0]).toBeCloseTo(expected[0], 8);
    expect(pos[1]).toBeCloseTo(expected[1], 8);
    expect(pos[2]).toBeCloseTo(expected[2], 8);
  });

  it('arc interpolates a great circle whose midpoint lies on the sphere', () => {
    const globe = new Globe({ radius: RADIUS });
    const arc = globe.arc([0, 0], [0, 90], { segments: 16 });
    expect(arc).toBeInstanceOf(Polygon);
    const vertices = arc.getVertices();
    // Endpoints sit on the sphere surface.
    expect(vertices[0][0]).toBeCloseTo(RADIUS, 8);
    const last = vertices[vertices.length - 1];
    expect(last[1]).toBeCloseTo(RADIUS, 8);
    // The midpoint of a great circle stays on the sphere (|p| == radius),
    // whereas a straight chord midpoint would fall inside it.
    const mid = vertices[Math.floor(vertices.length / 2)];
    const r = Math.sqrt(mid[0] * mid[0] + mid[1] * mid[1] + mid[2] * mid[2]);
    expect(r).toBeCloseTo(RADIUS, 6);
    // The halfway point between (0,0) and (0,90) is (0,45).
    expect(mid[0]).toBeCloseTo(globe.latLonToPoint(0, 45)[0], 6);
    expect(mid[1]).toBeCloseTo(globe.latLonToPoint(0, 45)[1], 6);
  });

  it('builds a graticule grid of meridians and parallels', () => {
    const globe = new Globe({ radius: RADIUS });
    const grid = globe.graticule({ latStep: 30, lonStep: 30 });
    expect(grid).toBeInstanceOf(Group);
    // 30-degree steps: meridians at lon -180..150 (12), parallels at -60..60 (5).
    expect(grid.submobjects.length).toBeGreaterThan(0);
    const lines = grid.submobjects;
    expect(lines.every((line) => line instanceof Polygon)).toBe(true);
    // Every graticule vertex lies on the sphere surface.
    const first = lines[0] as Polygon;
    const v = first.getVertices()[0];
    const r = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    expect(r).toBeCloseTo(RADIUS, 6);
  });
});
