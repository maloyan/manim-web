/**
 * Unit tests for the map projections added for data-journalism / cartography
 * parity: orthographic (with rotation), albers, albersUsa, robinson, mollweide.
 *
 * Each projection is checked against reference points derived from the standard
 * published formula, re-derived inline here so the test is an independent
 * oracle (not a copy of the implementation).
 */

import { describe, it, expect } from 'vitest';
import {
  orthographic,
  albers,
  albersUsa,
  robinson,
  mollweide,
  isProjectedPointVisible,
  type GeoProjection,
} from './projections';

const DEG = Math.PI / 180;

/** Max distance between two projected points. */
function dist(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

describe('orthographic projection', () => {
  it('maps the view center to the origin', () => {
    const project = orthographic({ rotate: [0, 0] });
    const [x, y] = project([0, 0]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('places the north pole at the top of the disc (rotate [0,0])', () => {
    const project = orthographic({ radius: 2, rotate: [0, 0] });
    const [x, y] = project([0, 90]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(2, 10); // radius up
  });

  it('places lon 90E on the equator at the right rim', () => {
    const project = orthographic({ radius: 1, rotate: [0, 0] });
    const [x, y] = project([90, 0]);
    expect(x).toBeCloseTo(1, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('hides a far-hemisphere point (returns NaN so callers skip it)', () => {
    const project = orthographic({ rotate: [0, 0] });
    const [x, y] = project([180, 0]); // antipode of the view center
    expect(Number.isNaN(x)).toBe(true);
    expect(Number.isNaN(y)).toBe(true);
    expect(isProjectedPointVisible(project([180, 0]))).toBe(false);
    expect(isProjectedPointVisible(project([0, 0]))).toBe(true);
  });

  it('rotation reveals a point that was on the far side', () => {
    const point: [number, number] = [160, 0];
    const front = orthographic({ rotate: [0, 0] });
    const spun = orthographic({ rotate: [160, 0] }); // look at lon 160
    expect(isProjectedPointVisible(front(point))).toBe(false);
    const spunPoint = spun(point);
    expect(isProjectedPointVisible(spunPoint)).toBe(true);
    // At the new view center it lands at the origin.
    expect(spunPoint[0]).toBeCloseTo(0, 10);
    expect(spunPoint[1]).toBeCloseTo(0, 10);
  });

  it('matches the closed-form orthographic for an off-center point', () => {
    const radius = 3;
    const lambda0 = 20;
    const phi0 = 10;
    const project = orthographic({ radius, rotate: [lambda0, phi0] });
    const lon = 35;
    const lat = 25;
    const dl = (lon - lambda0) * DEG;
    const p = lat * DEG;
    const p0 = phi0 * DEG;
    const expectedX = radius * Math.cos(p) * Math.sin(dl);
    const expectedY =
      radius * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl));
    const [x, y] = project([lon, lat]);
    expect(x).toBeCloseTo(expectedX, 10);
    expect(y).toBeCloseTo(expectedY, 10);
  });
});

describe('albers (conic equal-area) projection', () => {
  const parallels: [number, number] = [29.5, 45.5];
  const centerLon = -96;
  const centerLat = 23;

  /** Independent reference implementation of Albers equal-area conic. */
  function ref(lon: number, lat: number, radius = 1): [number, number] {
    const p1 = parallels[0] * DEG;
    const p2 = parallels[1] * DEG;
    const n = (Math.sin(p1) + Math.sin(p2)) / 2;
    const c = Math.cos(p1) ** 2 + 2 * n * Math.sin(p1);
    const rho = (Math.sqrt(c - 2 * n * Math.sin(lat * DEG)) / n) * radius;
    const rho0 = (Math.sqrt(c - 2 * n * Math.sin(centerLat * DEG)) / n) * radius;
    const theta = n * (lon - centerLon) * DEG;
    return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
  }

  it('maps the reference center to the origin', () => {
    const project = albers({ parallels, centerLon, centerLat });
    const [x, y] = project([centerLon, centerLat]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('places a point north of the center above the center (positive y)', () => {
    const project = albers({ parallels, centerLon, centerLat });
    const [x, y] = project([centerLon, 45.5]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeCloseTo(ref(centerLon, 45.5)[1], 10);
  });

  it('matches the closed-form conic for an off-meridian point, scaled by radius', () => {
    const radius = 2.5;
    const project = albers({ parallels, centerLon, centerLat, radius });
    const [x, y] = project([-80, 40]);
    const [ex, ey] = ref(-80, 40, radius);
    expect(x).toBeCloseTo(ex, 10);
    expect(y).toBeCloseTo(ey, 10);
  });

  it('throws on degenerate parallels (n = 0)', () => {
    expect(() => albers({ parallels: [30, -30] })).toThrow();
    expect(() => albers({ parallels: [0, 0] })).toThrow();
  });
});

describe('albersUsa composite projection', () => {
  const project: GeoProjection = albersUsa();
  const conus = project([-96, 37.5]); // Kansas-ish, center of CONUS
  const nyc = project([-74, 40.7]);
  const alaska = project([-150, 63]); // interior Alaska
  const hawaii = project([-157, 20]); // Hawaii

  it('places a CONUS point near the origin', () => {
    expect(Math.hypot(conus[0], conus[1])).toBeLessThan(0.15);
  });

  it('places Alaska into the lower-left inset', () => {
    expect(alaska[0]).toBeLessThan(-0.15);
    expect(alaska[1]).toBeLessThan(-0.1);
  });

  it('places Hawaii into the lower inset', () => {
    expect(hawaii[1]).toBeLessThan(-0.1);
  });

  it('keeps the three composite regions distinct and non-overlapping', () => {
    expect(dist(conus, alaska)).toBeGreaterThan(0.15);
    expect(dist(conus, hawaii)).toBeGreaterThan(0.15);
    expect(dist(alaska, hawaii)).toBeGreaterThan(0.1);
  });

  it('routes an east-coast CONUS point to the main body (right of center)', () => {
    expect(nyc[0]).toBeGreaterThan(conus[0]);
    expect(Number.isFinite(nyc[0])).toBe(true);
  });
});

describe('robinson projection', () => {
  it('maps the origin to the origin', () => {
    const [x, y] = robinson()([0, 0]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('maps (180E, 0) to the eastern edge at 0.8487*PI*R', () => {
    const radius = 2;
    const [x, y] = robinson({ radius })([180, 0]);
    expect(x).toBeCloseTo(0.8487 * Math.PI * radius, 6);
    expect(y).toBeCloseTo(0, 10);
  });

  it('maps the north pole to 1.3523*R on the y axis', () => {
    const [x, y] = robinson()([0, 90]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(1.3523, 6);
  });

  it('is symmetric north/south', () => {
    const project = robinson();
    const north = project([40, 50]);
    const south = project([40, -50]);
    expect(north[0]).toBeCloseTo(south[0], 10);
    expect(north[1]).toBeCloseTo(-south[1], 10);
  });
});

describe('mollweide projection', () => {
  it('maps the origin to the origin', () => {
    const [x, y] = mollweide()([0, 0]);
    expect(x).toBeCloseTo(0, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it('maps the pole to sqrt(2)*R on the y axis', () => {
    const radius = 2;
    const [x, y] = mollweide({ radius })([0, 90]);
    expect(x).toBeCloseTo(0, 8);
    expect(y).toBeCloseTo(Math.SQRT2 * radius, 8);
  });

  it('maps (180E, 0) to 2*sqrt(2)*R on the x axis', () => {
    const [x, y] = mollweide()([180, 0]);
    expect(x).toBeCloseTo(2 * Math.SQRT2, 8);
    expect(y).toBeCloseTo(0, 10);
  });

  it('satisfies the defining auxiliary-angle equation at mid latitude', () => {
    // At any lat, y = sqrt(2) R sin(theta) with 2 theta + sin 2 theta = pi sin(lat).
    const lat = 40;
    const [, y] = mollweide()([0, lat]);
    const theta = Math.asin(y / Math.SQRT2);
    const residual = 2 * theta + Math.sin(2 * theta) - Math.PI * Math.sin(lat * DEG);
    expect(residual).toBeCloseTo(0, 8);
  });
});
