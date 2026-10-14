/**
 * Unit tests for clipRingToCircle: clipping a polygon ring to the mappable disc
 * of the orthographic projection.
 *
 * The oracle is geometric, not a copy of the implementation: a clipped ring must
 * stay inside the limb circle, bulge out to the limb where it crosses (so it is
 * not a straight chord), enclose the area the ring actually covers inside the
 * disc (small for a sliver, large for a ring that nearly fills the view) rather
 * than its complement, and split into separate rings when the limb cuts the ring
 * into separate pieces.
 */

import { describe, it, expect } from 'vitest';
import { clipRingToCircle } from './clipCircle';
import { orthographic } from './projections';
import type { GeoLinearRing } from './geojson';

const R = 1;
const project = orthographic({ radius: R });
const DISC_AREA = Math.PI * R * R;

/** Shoelace absolute area of a clipped (x, y, z) ring. */
function area(ring: [number, number, number][]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum / 2);
}

/** Signed area (positive = counter-clockwise). */
function signedArea(ring: [number, number, number][]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function maxRadius(ring: [number, number, number][]): number {
  return Math.max(...ring.map(([x, y]) => Math.hypot(x, y)));
}

/** A dense lon/lat ring: `lerp` sampled finely so edges stay short. */
function densify(points: GeoLinearRing, stepDeg = 5): GeoLinearRing {
  const out: GeoLinearRing = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    let dLon = b[0] - a[0];
    while (dLon > 180) dLon -= 360;
    while (dLon < -180) dLon += 360;
    const span = Math.max(Math.abs(dLon), Math.abs(b[1] - a[1]));
    const n = Math.max(1, Math.ceil(span / stepDeg));
    for (let k = 0; k < n; k++) {
      out.push([a[0] + (dLon * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
  }
  return out;
}

describe('clipRingToCircle', () => {
  it('returns a fully visible ring unchanged (one ring, projected)', () => {
    const ring: GeoLinearRing = [
      [-10, -10],
      [10, -10],
      [10, 10],
      [-10, 10],
    ];
    const out = clipRingToCircle(ring, project, R);
    expect(out).toHaveLength(1);
    expect(out[0]).toHaveLength(4);
    out[0].forEach((v, i) => {
      const p = project(ring[i]);
      expect(v[0]).toBeCloseTo(p[0], 10);
      expect(v[1]).toBeCloseTo(p[1], 10);
    });
  });

  it('drops a ring entirely on the far hemisphere', () => {
    const ring: GeoLinearRing = [
      [170, -10],
      [190, -10],
      [190, 10],
      [170, 10],
    ];
    expect(clipRingToCircle(ring, project, R)).toEqual([]);
  });

  it('clips an east-straddling CCW ring to a small lens on the limb', () => {
    const ring = densify([
      [60, -20],
      [120, -20],
      [120, 20],
      [60, 20],
    ]);
    const out = clipRingToCircle(ring, project, R);
    expect(out).toHaveLength(1);
    const lens = out[0];
    expect(maxRadius(lens)).toBeLessThanOrEqual(R + 1e-9);
    expect(maxRadius(lens)).toBeGreaterThan(0.999 * R); // bulges to the limb
    expect(signedArea(lens)).toBeGreaterThan(0); // CCW kept
    expect(area(lens)).toBeLessThan(0.5 * DISC_AREA); // the lens, not its complement
    expect(Math.min(...lens.map(([x]) => x))).toBeGreaterThan(0); // on the east
  });

  it('clips a west-straddling CCW ring to a lens on the west limb', () => {
    const ring = densify([
      [-120, -20],
      [-60, -20],
      [-60, 20],
      [-120, 20],
    ]);
    const out = clipRingToCircle(ring, project, R);
    expect(out).toHaveLength(1);
    const lens = out[0];
    expect(maxRadius(lens)).toBeLessThanOrEqual(R + 1e-9);
    expect(area(lens)).toBeLessThan(0.5 * DISC_AREA);
    expect(Math.max(...lens.map(([x]) => x))).toBeLessThan(0); // on the west
    expect(Math.min(...lens.map(([x]) => x))).toBeLessThan(-0.999 * R);
  });

  it('keeps a ring that nearly fills the view large (not its complement)', () => {
    // A band between lat -30 and 30 over all longitudes: it straddles both the
    // east and the west limb (two gaps). The result fills the middle of the disc.
    const ring: GeoLinearRing = [];
    for (let lon = -180; lon < 180; lon += 10) ring.push([lon, -30]);
    for (let lon = 170; lon >= -180; lon -= 10) ring.push([lon, 30]);
    const out = clipRingToCircle(ring, project, R);
    expect(out).toHaveLength(1);
    expect(maxRadius(out[0])).toBeLessThanOrEqual(R + 1e-9);
    const a = area(out[0]);
    expect(a).toBeGreaterThan(0.3 * DISC_AREA);
    expect(a).toBeLessThan(DISC_AREA);
  });

  it('clips a pole-encircling band to a bottom cap (spherical winding)', () => {
    const ring: GeoLinearRing = [];
    for (let lon = -180; lon < 180; lon += 20) ring.push([lon, -75]);
    for (let lon = 160; lon >= -180; lon -= 20) ring.push([lon, -85]);
    const out = clipRingToCircle(ring, project, R);
    expect(out.length).toBeGreaterThanOrEqual(1);
    const all = out.flat();
    expect(maxRadius(all)).toBeLessThanOrEqual(R + 1e-9);
    const total = out.reduce((s, r) => s + area(r), 0);
    expect(total).toBeLessThan(0.25 * DISC_AREA); // a cap, not most of the disc
    expect(Math.max(...all.map(([, y]) => y))).toBeLessThan(0); // at the bottom
  });

  it('splits a ring into two pieces when the limb cuts it in two', () => {
    // A band over the back 240 degrees of longitude (60 -> 180 -> -60): its
    // visible part is two separate slivers, on the east and the west limb.
    const ring = densify([
      [60, -20],
      [180, -20],
      [-60, -20],
      [-60, 20],
      [180, 20],
      [60, 20],
    ]);
    const out = clipRingToCircle(ring, project, R);
    expect(out).toHaveLength(2);
    for (const piece of out) {
      expect(maxRadius(piece)).toBeLessThanOrEqual(R + 1e-9);
      expect(area(piece)).toBeLessThan(0.5 * DISC_AREA);
    }
    const xs = out.map((piece) => piece.reduce((s, [x]) => s + x, 0) / piece.length);
    // One piece centers east, the other west.
    expect(Math.max(...xs)).toBeGreaterThan(0);
    expect(Math.min(...xs)).toBeLessThan(0);
  });

  it('handles an antimeridian-crossing ring near the limb', () => {
    // A box straddling the antimeridian, viewed with lon 90 at the disc center,
    // so lon 180 sits on the east limb. The clip must stay inside the disc.
    const project90 = orthographic({ radius: R, rotate: [90, 0] });
    const ring = densify([
      [150, -20],
      [210, -20], // 210 == -150, across the antimeridian
      [210, 20],
      [150, 20],
    ]);
    const out = clipRingToCircle(ring, project90, R);
    expect(out.length).toBeGreaterThanOrEqual(1);
    const all = out.flat();
    expect(maxRadius(all)).toBeLessThanOrEqual(R + 1e-9);
    expect(out.reduce((s, r) => s + area(r), 0)).toBeLessThan(0.6 * DISC_AREA);
  });
});
