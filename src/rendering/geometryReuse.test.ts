import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { InterleavedBufferAttribute } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { copyGeometryInPlace, setLinePositionsInPlace } from './geometryReuse';

function freshLine(positions: number[]): Line2 {
  const geometry = new LineGeometry();
  geometry.setPositions(positions);
  const line = new Line2(geometry, new LineMaterial());
  line.computeLineDistances();
  return line;
}

function buffers(geometry: LineGeometry) {
  const start = geometry.attributes.instanceStart as InterleavedBufferAttribute;
  const dist = geometry.attributes.instanceDistanceStart as InterleavedBufferAttribute;
  return { segments: Array.from(start.data.array), distances: Array.from(dist.data.array) };
}

describe('setLinePositionsInPlace', () => {
  // MIGRATION: example for the property
  //   ∀ polylines a, b with |a| === |b|: after setLinePositionsInPlace(lineOf(a).geometry, b),
  //   the geometry's segment and distance buffers equal those of freshLine(b).
  // Replace with a property test once the suite lands.
  it('matches setPositions + computeLineDistances and keeps the same buffers', () => {
    const line = freshLine([0, 0, 0, 1, 0, 0, 1, 1, 0]);
    const segBuffer = (line.geometry.attributes.instanceStart as InterleavedBufferAttribute).data;
    const next = [2, 0, 0, 2, 3, 0, 6, 3, 0];

    expect(setLinePositionsInPlace(line.geometry, next)).toBe(true);

    expect(buffers(line.geometry)).toEqual(buffers(freshLine(next).geometry));
    expect((line.geometry.attributes.instanceStart as InterleavedBufferAttribute).data).toBe(
      segBuffer,
    );
    expect(line.geometry.boundingSphere).toBeNull();
  });

  it('refuses a polyline with a different point count', () => {
    const line = freshLine([0, 0, 0, 1, 0, 0, 1, 1, 0]);
    const before = buffers(line.geometry);

    expect(setLinePositionsInPlace(line.geometry, [0, 0, 0, 5, 5, 0])).toBe(false);
    expect(buffers(line.geometry)).toEqual(before);
  });
});

describe('copyGeometryInPlace', () => {
  const tri = (values: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(values), 3));
    return g;
  };

  // MIGRATION: example for the property
  //   ∀ non-indexed geometries t, s with identical attribute layouts:
  //   copyGeometryInPlace(t, s) === true and t's arrays equal s's arrays afterwards;
  //   for differing layouts it returns false and t is unchanged.
  it('copies matching layouts into the existing attribute', () => {
    const target = tri([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const attr = target.getAttribute('position');
    const versionBefore = (attr as THREE.BufferAttribute).version;

    expect(copyGeometryInPlace(target, tri([5, 5, 0, 6, 5, 0, 5, 6, 0]))).toBe(true);
    expect(target.getAttribute('position')).toBe(attr);
    expect(Array.from(attr.array)).toEqual([5, 5, 0, 6, 5, 0, 5, 6, 0]);
    expect((attr as THREE.BufferAttribute).version).toBeGreaterThan(versionBefore);
  });

  it('refuses a different vertex count', () => {
    const target = tri([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    expect(
      copyGeometryInPlace(target, tri([0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 2, 0, 3, 2, 0, 2, 3, 0])),
    ).toBe(false);
    expect(Array.from(target.getAttribute('position').array)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  });
});
