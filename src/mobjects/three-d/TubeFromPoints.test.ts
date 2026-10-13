/**
 * Tests for TubeFromPoints (a smooth 3D tube through a list of points).
 *
 * TubeFromPoints fits a CatmullRomCurve3 through the given points and sweeps a
 * circular cross-section along it with TubeGeometry. It is the backbone / ribbon
 * primitive a later Protein module draws its chains with.
 */
import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { TubeFromPoints } from './TubeFromPoints';

function tubeGeometry(tube: TubeFromPoints): THREE.TubeGeometry {
  const mesh = tube.getThreeObject() as THREE.Mesh;
  return mesh.geometry as THREE.TubeGeometry;
}

describe('TubeFromPoints', () => {
  it('builds a mesh from two or more points without throwing', () => {
    expect(() => {
      const tube = new TubeFromPoints({
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      });
      tube.getThreeObject();
    }).not.toThrow();
  });

  it('builds a mesh from several points', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0],
        [3, 1, 0],
      ],
    });
    const obj = tube.getThreeObject();
    expect(obj).toBeInstanceOf(THREE.Mesh);
  });

  it('throws a clear Error with fewer than two points', () => {
    expect(() => new TubeFromPoints({ points: [[0, 0, 0]] })).toThrow(/at least two points/i);
    expect(() => new TubeFromPoints({ points: [] })).toThrow(/at least two points/i);
  });

  it('starts at the first point', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [2, 0, 0],
        [4, 0, 0],
      ],
    });
    const p = tube.pointAt(0);
    expect(p[0]).toBeCloseTo(0, 5);
    expect(p[1]).toBeCloseTo(0, 5);
    expect(p[2]).toBeCloseTo(0, 5);
  });

  it('ends at the last point', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [2, 0, 0],
        [4, 0, 0],
      ],
    });
    const p = tube.pointAt(1);
    expect(p[0]).toBeCloseTo(4, 5);
    expect(p[1]).toBeCloseTo(0, 5);
    expect(p[2]).toBeCloseTo(0, 5);
  });

  it('honors the radius option', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 0, 0],
      ],
      radius: 0.25,
    });
    expect(tube.getRadius()).toBeCloseTo(0.25, 6);
    expect(tubeGeometry(tube).parameters.radius).toBeCloseTo(0.25, 6);
  });

  it('respects the closed option', () => {
    const open = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0],
      ],
    });
    const closed = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0],
      ],
      closed: true,
    });
    expect(tubeGeometry(open).parameters.closed).toBe(false);
    expect(tubeGeometry(closed).parameters.closed).toBe(true);
  });

  it('defaults tubularSegments to smoothing * (points - 1)', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
      ],
      smoothing: 8,
    });
    // smoothing 8 * (3 - 1) = 16 segments.
    expect(tubeGeometry(tube).parameters.tubularSegments).toBe(16);
  });

  it('honors an explicit tubularSegments override', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
      ],
      tubularSegments: 40,
    });
    expect(tubeGeometry(tube).parameters.tubularSegments).toBe(40);
  });

  it('floors an explicit tubularSegments of 0 to a non-empty tube', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [2, 0, 0],
      ],
      tubularSegments: 0,
    });
    const geometry = tubeGeometry(tube);
    // Floored to 1 segment, so the mesh carries vertices (not an empty mesh).
    expect(geometry.parameters.tubularSegments).toBe(1);
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0);
  });

  it('drops a duplicated consecutive point and builds finite geometry', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 0], // duplicate of the previous point
        [2, 0, 0],
      ],
    });
    // The duplicate is removed, so three distinct control points remain.
    expect(tube.getPoints()).toEqual([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
    ]);
    const mid = tube.pointAt(0.5);
    expect(mid.every((c) => Number.isFinite(c))).toBe(true);
    const position = tubeGeometry(tube).getAttribute('position').array;
    expect(Array.from(position).every((c) => Number.isFinite(c))).toBe(true);
  });

  it('throws when all points are identical', () => {
    expect(
      () =>
        new TubeFromPoints({
          points: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
          ],
        }),
    ).toThrow(/at least two distinct points/i);
  });

  it('returns a copy of the input points', () => {
    const tube = new TubeFromPoints({
      points: [
        [0, 0, 0],
        [1, 0, 0],
      ],
    });
    const pts = tube.getPoints();
    expect(pts).toEqual([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    pts[0][0] = 99;
    expect(tube.getPoints()[0][0]).toBe(0);
  });
});
