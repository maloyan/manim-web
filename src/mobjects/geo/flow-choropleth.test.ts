/**
 * Tests for the two data-journalism map features:
 *  - FlowArc: a 2D curved flow line between two geo points on a projection.
 *  - animated choropleth: ChoroplethMap.setValues + animateChoropleth.
 *
 * Fixtures are tiny inline GeoJSON, so the tests need no network, no map data
 * and no WebGL scene. Animations are driven deterministically via
 * begin()/interpolate()/finish().
 */
import { describe, it, expect } from 'vitest';
import { Polygon } from '../geometry/Polygon';
import { Create } from '../../animation/creation/Create';
import { colorToRgb } from '../../utils/color';
import { equirectangular, mercator } from './projections';
import { ChoroplethMap } from './ChoroplethMap';
import { FlowArc } from './FlowArc';
import { AnimateChoropleth, animateChoropleth } from './AnimateChoropleth';
import type { GeoFeatureCollection } from './geojson';
import type { LatLon } from './Globe';

const DEG = Math.PI / 180;

/** Euclidean distance between two 2D points. */
function dist2D(a: number[], b: number[]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

describe('FlowArc', () => {
  const from: LatLon = [0, 0]; // [lat, lon]
  const to: LatLon = [0, 40];

  it('projects its endpoints onto projection(from)/projection(to)', () => {
    const projection = equirectangular();
    const arc = new FlowArc({ from, to, projection });
    const ends = arc.getEndpoints();
    // LatLon [lat, lon] -> projection([lon, lat]).
    expect(ends.from[0]).toBeCloseTo(projection([from[1], from[0]])[0], 10);
    expect(ends.from[1]).toBeCloseTo(projection([from[1], from[0]])[1], 10);
    expect(ends.to[0]).toBeCloseTo(projection([to[1], to[0]])[0], 10);
    expect(ends.to[1]).toBeCloseTo(projection([to[1], to[0]])[1], 10);
  });

  it('bows out so the arc midpoint is ~bulge*chordLength off the chord midpoint', () => {
    const projection = equirectangular();
    const bulge = 0.25;
    // Odd sample count: the middle index is exactly t = 0.5.
    const arc = new FlowArc({ from, to, projection, bulge, samples: 101 });
    const points = arc.getProjectedPoints();
    const p0 = points[0];
    const p1 = points[points.length - 1];
    const chord = dist2D(p0, p1);
    const chordMid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    const arcMid = points[Math.floor(points.length / 2)];
    expect(dist2D(arcMid, chordMid)).toBeCloseTo(bulge * chord, 6);
  });

  it('honors the samples count', () => {
    const arc = new FlowArc({ from, to, samples: 24 });
    expect(arc.getProjectedPoints()).toHaveLength(24);
  });

  it('is a Polygon stroke (the 2D geo line primitive) and is Create-able', () => {
    const arc = new FlowArc({ from, to });
    expect(arc).toBeInstanceOf(Polygon);
    // Create accepts the arc exactly like any other VMobject stroke.
    expect(() => new Create(arc)).not.toThrow();
  });

  it('does not throw for a zero-distance arc (from == to)', () => {
    const projection = equirectangular();
    const same: LatLon = [10, 20];
    let arc: FlowArc | undefined;
    expect(() => {
      arc = new FlowArc({ from: same, to: same, projection });
    }).not.toThrow();
    const points = arc!.getProjectedPoints();
    expect(points).toHaveLength(48); // default samples
    // Every sample collapses onto the single projected point.
    const expected = projection([same[1], same[0]]);
    for (const point of points) {
      expect(point[0]).toBeCloseTo(expected[0], 10);
      expect(point[1]).toBeCloseTo(expected[1], 10);
    }
  });

  it('respects the projection it is given', () => {
    const arc = new FlowArc({ from, to, projection: mercator() });
    const ends = arc.getEndpoints();
    expect(ends.from[0]).toBeCloseTo(0, 10);
    // 40 deg lon under mercator -> 40*DEG on x.
    expect(ends.to[0]).toBeCloseTo(40 * DEG, 10);
  });
});

/** Two square features A and B with per-feature values. */
const geo: GeoFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'A' },
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
      properties: { name: 'B' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [20, 20],
            [30, 20],
            [30, 30],
            [20, 30],
            [20, 20],
          ],
        ],
      },
    },
  ],
};

const oldValues = { A: 10, B: 20 };
const newValues = { A: 20, B: 10 };
const accessor =
  (table: Record<string, number>) =>
  (feature: { properties?: Record<string, unknown> | null }): number =>
    table[feature.properties?.name as string];

describe('ChoroplethMap.setValues', () => {
  it('recolors each region to the new mapped color', () => {
    const map = new ChoroplethMap({
      geojson: geo,
      value: accessor(oldValues),
      colorScale: ['#000000', '#ffffff'],
      domain: [10, 20],
    });
    expect(map.getRegionColor(0)).toBe('#000000'); // A = 10 -> min
    expect(map.getRegionColor(1)).toBe('#ffffff'); // B = 20 -> max

    map.setValues(accessor(newValues));
    expect(map.getRegionColor(0)).toBe('#ffffff'); // A = 20 -> max
    expect(map.getRegionColor(1)).toBe('#000000'); // B = 10 -> min
    // The region polygon fill is updated in place.
    expect(map.getRegionPolygons(0)[0].fillColor).toBe('#ffffff');
  });

  it('keeps the region count unchanged', () => {
    const map = new ChoroplethMap({ geojson: geo, value: accessor(oldValues) });
    const before = map.getRegionCount();
    map.setValues(accessor(newValues));
    expect(map.getRegionCount()).toBe(before);
  });

  it('re-derives a data-driven domain from the new values', () => {
    const map = new ChoroplethMap({
      geojson: geo,
      value: accessor(oldValues),
      colorScale: ['#000000', '#ffffff'],
    });
    // Domain was [10, 20] from the old data.
    map.setValues(accessor({ A: 100, B: 300 }));
    expect(map.getColorScale().getDomain()).toEqual([100, 300]);
  });
});

describe('animateChoropleth', () => {
  function build(): ChoroplethMap {
    return new ChoroplethMap({
      geojson: geo,
      value: accessor(oldValues),
      colorScale: ['#000000', '#ffffff'],
      domain: [10, 20],
    });
  }

  it('is driven by begin/interpolate/finish: alpha 0 ~ old, alpha 1 ~ new', () => {
    const map = build();
    const startA = colorToRgb(map.getRegionColor(0)!); // black
    const startB = colorToRgb(map.getRegionColor(1)!); // white
    const anim = animateChoropleth(map, accessor(newValues), { runTime: 2 });
    expect(anim).toBeInstanceOf(AnimateChoropleth);
    expect(anim.duration).toBe(2);

    anim.begin();

    // At alpha 0 the fills match the old colors.
    anim.interpolate(0);
    expect(colorToRgb(map.getRegionPolygons(0)[0].fillColor!)).toEqual(startA);
    expect(colorToRgb(map.getRegionPolygons(1)[0].fillColor!)).toEqual(startB);

    // Midway each region is partway between old and new (black -> white).
    anim.interpolate(0.5);
    const midA = colorToRgb(map.getRegionPolygons(0)[0].fillColor!);
    expect(midA[0]).toBeGreaterThan(0.4);
    expect(midA[0]).toBeLessThan(0.6);

    // At alpha 1 the fills match the new colors (A -> white, B -> black).
    anim.interpolate(1);
    expect(colorToRgb(map.getRegionPolygons(0)[0].fillColor!)).toEqual(startB);
    expect(colorToRgb(map.getRegionPolygons(1)[0].fillColor!)).toEqual(startA);

    anim.finish();
    expect(map.getRegionColor(0)).toBe('#ffffff');
    expect(map.getRegionColor(1)).toBe('#000000');
  });

  it('leaves the region count unchanged', () => {
    const map = build();
    const anim = animateChoropleth(map, accessor(newValues));
    anim.begin();
    anim.interpolate(0.5);
    anim.finish();
    expect(map.getRegionCount()).toBe(2);
  });

  it('defaults the run time to 1 second', () => {
    const map = build();
    expect(animateChoropleth(map, accessor(newValues)).duration).toBe(1);
  });
});
