import * as THREE from 'three';
import { describe, it, expect, vi } from 'vitest';
import {
  MatrixTracker,
  makeMatrixTracker,
  applyMatrixLive,
  type Matrix2x2,
  type Matrix3x3,
} from './DynamicMatrix';
import { Line } from '../mobjects/geometry/Line';
import { Group } from '../core/Group';
import { Dot } from '../mobjects/geometry/Dot';
import { NumberPlane } from '../mobjects/graphing/NumberPlane';
import { Sphere } from '../mobjects/three-d/Sphere';
import { Cube } from '../mobjects/three-d/Cube';
import { InstancedMobject } from '../mobjects/three-d/InstancedMobject';
import { Square } from '../mobjects/geometry/Rectangle';
import { transformPointByMatrix } from '../utils/math';

const IDENTITY: Matrix2x2 = [
  [1, 0],
  [0, 1],
];
// 90-degree counter-clockwise rotation: (x, y) -> (-y, x).
const ROTATE90: Matrix2x2 = [
  [0, -1],
  [1, 0],
];
// Horizontal shear: (x, y) -> (x + y, y).
const SHEAR: Matrix2x2 = [
  [1, 1],
  [0, 1],
];

// 3D shear that tilts z into x and stretches y: (x, y, z) -> (x + z, 2y, z).
const SHEAR3D: Matrix3x3 = [
  [1, 0, 1],
  [0, 2, 0],
  [0, 0, 1],
];
// 90-degree rotation about the x axis: (x, y, z) -> (x, -z, y).
const ROTATE_X90: Matrix3x3 = [
  [1, 0, 0],
  [0, 0, -1],
  [0, 1, 0],
];

/** Read a 3-component attribute of a single-mesh 3D mobject, optionally transformed. */
function meshAttribute(
  mob: Sphere | Cube,
  name: 'position' | 'normal',
  matrix?: THREE.Matrix4,
): number[][] {
  const mesh = mob.getThreeObject() as THREE.Mesh;
  const attr = mesh.geometry.getAttribute(name);
  const v = new THREE.Vector3();
  const out: number[][] = [];
  for (let i = 0; i < attr.count; i++) {
    v.fromBufferAttribute(attr, i);
    if (matrix) v.applyMatrix4(matrix);
    out.push([v.x, v.y, v.z]);
  }
  return out;
}

/** Vertex positions of a single-mesh 3D mobject in its own (local) frame. */
const meshLocalVertices = (mob: Sphere | Cube): number[][] => meshAttribute(mob, 'position');
/** World-space vertex positions of a single-mesh 3D mobject. */
const meshWorldVertices = (mob: Sphere | Cube): number[][] =>
  meshAttribute(mob, 'position', mob._worldMatrix());
/** Vertex normals of a single-mesh 3D mobject. */
const meshNormals = (mob: Sphere | Cube): number[][] => meshAttribute(mob, 'normal');

/** True when some vertex normal of `mob` equals `expected` within 1e-6. */
function hasNormal(mob: Sphere | Cube, expected: number[]): boolean {
  return meshNormals(mob).some((n) => n.every((c, k) => Math.abs(c - expected[k]) < 1e-6));
}

/** `[minX, maxX, minY, maxY]` of a point set. */
function xyBounds(points: number[][]): [number, number, number, number] {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
}

/** Assert that two point arrays match element-wise within tolerance. */
function expectPointsClose(actual: number[][], expected: number[][]): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i][0]).toBeCloseTo(expected[i][0], 6);
    expect(actual[i][1]).toBeCloseTo(expected[i][1], 6);
    expect(actual[i][2]).toBeCloseTo(expected[i][2], 6);
  }
}

describe('MatrixTracker', () => {
  it('defaults to the identity matrix', () => {
    const t = new MatrixTracker();
    expect(t.getMatrix()).toEqual(IDENTITY);
  });

  it('stores and returns a matrix, defensively copied', () => {
    const t = new MatrixTracker(ROTATE90);
    const m = t.getMatrix();
    expect(m).toEqual(ROTATE90);
    m[0][0] = 99;
    // Mutating the returned copy must not change the tracker.
    expect(t.getMatrix()[0][0]).toBe(0);
  });

  it('setMatrix replaces the current value', () => {
    const t = new MatrixTracker();
    t.setMatrix(SHEAR);
    expect(t.getMatrix()).toEqual(SHEAR);
  });

  it('exposes columns as the i and j basis vectors', () => {
    // matrix [[a, b], [c, d]] has columns i = (a, c), j = (b, d).
    const t = new MatrixTracker([
      [2, -1],
      [1, 3],
    ]);
    const [i, j] = t.getColumns();
    expect(i).toEqual([2, 1]);
    expect(j).toEqual([-1, 3]);
  });

  it('setColumns builds the matrix from basis vectors', () => {
    const t = new MatrixTracker();
    t.setColumns([2, 1], [-1, 3]);
    expect(t.getMatrix()).toEqual([
      [2, -1],
      [1, 3],
    ]);
  });

  it('transformPoint maps a point by the current matrix', () => {
    const t = new MatrixTracker(ROTATE90);
    expect(t.transformPoint([1, 0])).toEqual([0, 1]);
    expect(t.transformPoint([0, 1])).toEqual([-1, 0]);
  });

  it('fromBasisVectors reads the live basis vectors each call', () => {
    let iVec: [number, number] = [1, 0];
    const jSource = { getPoint: () => [0, 1, 0] as [number, number, number] };
    const t = MatrixTracker.fromBasisVectors(() => iVec, jSource);
    expect(t.getMatrix()).toEqual([
      [1, 0],
      [0, 1],
    ]);
    // Move the i basis vector; the matrix follows live.
    iVec = [2, 3];
    expect(t.getMatrix()).toEqual([
      [2, 0],
      [3, 1],
    ]);
  });

  it('makeMatrixTracker factory returns a MatrixTracker', () => {
    expect(makeMatrixTracker(SHEAR)).toBeInstanceOf(MatrixTracker);
  });
});

describe('applyMatrixLive', () => {
  it('leaves sample points unchanged under the identity matrix', () => {
    const line = new Line({ start: [2, 0, 0], end: [0, 3, 0] });
    const original = line.getLocalPoints();
    applyMatrixLive(line, IDENTITY);
    expectPointsClose(line.getLocalPoints(), original);
  });

  it('re-maps grid sample points for a known rotation matrix', () => {
    const line = new Line({ start: [2, 0, 0], end: [0, 3, 0] });
    const original = line.getLocalPoints();
    applyMatrixLive(line, ROTATE90);
    const expected = original.map((p) => transformPointByMatrix(p, ROTATE90));
    expectPointsClose(line.getLocalPoints(), expected);
  });

  it('re-maps grid sample points for a known shear matrix', () => {
    const line = new Line({ start: [1, 1, 0], end: [-1, 2, 0] });
    const original = line.getLocalPoints();
    applyMatrixLive(line, SHEAR);
    const expected = original.map((p) => transformPointByMatrix(p, SHEAR));
    expectPointsClose(line.getLocalPoints(), expected);
  });

  it('re-maps every line of a grid Group (plane family traversal)', () => {
    const group = new Group();
    const lineA = new Line({ start: [1, 0, 0], end: [1, 1, 0] });
    const lineB = new Line({ start: [0, 1, 0], end: [1, 1, 0] });
    group.add(lineA);
    group.add(lineB);
    const originalA = lineA.getLocalPoints();
    const originalB = lineB.getLocalPoints();

    applyMatrixLive(group, ROTATE90);

    expectPointsClose(
      lineA.getLocalPoints(),
      originalA.map((p) => transformPointByMatrix(p, ROTATE90)),
    );
    expectPointsClose(
      lineB.getLocalPoints(),
      originalB.map((p) => transformPointByMatrix(p, ROTATE90)),
    );
  });

  it('binds a NumberPlane grid to a live matrix', () => {
    const plane = new NumberPlane({ xRange: [-5, 5, 1], yRange: [-5, 5, 1] });
    const lines = plane.getBackgroundLines().children as Line[];
    const originals = lines.map((l) => l.getLocalPoints());

    const binding = applyMatrixLive(plane, SHEAR);

    for (let k = 0; k < lines.length; k++) {
      expectPointsClose(
        lines[k].getLocalPoints(),
        originals[k].map((p) => transformPointByMatrix(p, SHEAR)),
      );
    }
    binding.remove();
  });

  it('runs the updater each frame, following the tracker value', () => {
    const line = new Line({ start: [2, 0, 0], end: [0, 3, 0] });
    const original = line.getLocalPoints();
    const tracker = new MatrixTracker();
    applyMatrixLive(line, tracker);

    // Identity so far.
    expectPointsClose(line.getLocalPoints(), original);

    // Change the bound matrix, then advance one frame.
    tracker.setMatrix(ROTATE90);
    line.update(0.016);
    expectPointsClose(
      line.getLocalPoints(),
      original.map((p) => transformPointByMatrix(p, ROTATE90)),
    );

    // A second frame with a new matrix re-maps from the pristine original,
    // not cumulatively.
    tracker.setMatrix(SHEAR);
    line.update(0.016);
    expectPointsClose(
      line.getLocalPoints(),
      original.map((p) => transformPointByMatrix(p, SHEAR)),
    );
  });

  it('accepts a plain getter function as the matrix source', () => {
    const line = new Line({ start: [1, 0, 0], end: [0, 1, 0] });
    const original = line.getLocalPoints();
    let matrix: Matrix2x2 = IDENTITY;
    applyMatrixLive(line, () => matrix);

    matrix = ROTATE90;
    line.update(0);
    expectPointsClose(
      line.getLocalPoints(),
      original.map((p) => transformPointByMatrix(p, ROTATE90)),
    );
  });

  it('moves dependent points so they follow the transform', () => {
    const line = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const dot = new Dot({ point: [1, 1, 0] });
    const tracker = new MatrixTracker();
    applyMatrixLive(line, tracker, { dependents: [{ mobject: dot, base: [1, 1, 0] }] });

    // Identity: the dependent point stays put.
    expect(dot.getCenter()[0]).toBeCloseTo(1);
    expect(dot.getCenter()[1]).toBeCloseTo(1);

    tracker.setMatrix(ROTATE90);
    line.update(0);
    // (1, 1) rotated 90 CCW -> (-1, 1).
    expect(dot.getCenter()[0]).toBeCloseTo(-1);
    expect(dot.getCenter()[1]).toBeCloseTo(1);
  });

  it('addDependentPoint registers a point after binding', () => {
    const line = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const dot = new Dot({ point: [2, 0, 0] });
    const tracker = new MatrixTracker();
    const binding = applyMatrixLive(line, tracker);
    binding.addDependentPoint(dot, [2, 0, 0]);

    tracker.setMatrix(ROTATE90);
    binding.update();
    // (2, 0) rotated 90 CCW -> (0, 2).
    expect(dot.getCenter()[0]).toBeCloseTo(0);
    expect(dot.getCenter()[1]).toBeCloseTo(2);
  });

  it('respects a custom aboutPoint pivot', () => {
    const line = new Line({ start: [1, 0, 0], end: [2, 0, 0] });
    const original = line.getLocalPoints();
    applyMatrixLive(line, ROTATE90, { aboutPoint: [1, 0, 0] });
    const expected = original.map((p) => transformPointByMatrix(p, ROTATE90, [1, 0, 0]));
    expectPointsClose(line.getLocalPoints(), expected);
  });

  it('remove detaches the updater so later frames do not re-map', () => {
    const line = new Line({ start: [2, 0, 0], end: [0, 3, 0] });
    const tracker = new MatrixTracker();
    const binding = applyMatrixLive(line, tracker);
    binding.remove();

    const snapshot = line.getLocalPoints();
    tracker.setMatrix(ROTATE90);
    line.update(0.016);
    // Updater is gone, so the geometry is frozen at the last mapping.
    expectPointsClose(line.getLocalPoints(), snapshot);
  });

  it('getMatrix and setMatrix on the binding proxy the tracker', () => {
    const line = new Line({ start: [1, 0, 0], end: [0, 1, 0] });
    const binding = applyMatrixLive(line, IDENTITY);
    expect(binding.getMatrix()).toEqual(IDENTITY);

    const original = line.getLocalPoints();
    binding.setMatrix(ROTATE90);
    // setMatrix re-maps immediately.
    expectPointsClose(
      line.getLocalPoints(),
      original.map((p) => transformPointByMatrix(p, ROTATE90)),
    );
  });

  it('calls the render callback on each remap when provided', () => {
    const line = new Line({ start: [1, 0, 0], end: [0, 1, 0] });
    const onChange = vi.fn();
    const binding = applyMatrixLive(line, new MatrixTracker(), { onChange });
    // Called once for the initial remap at bind time.
    expect(onChange).toHaveBeenCalledTimes(1);
    binding.update();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('MatrixTracker (3x3)', () => {
  it('exposes the three columns of a 3x3 matrix as basis vectors', () => {
    const t = new MatrixTracker(SHEAR3D);
    expect(t.getColumns()).toEqual([
      [1, 0, 0],
      [0, 2, 0],
      [1, 0, 1],
    ]);
  });

  it('setColumns and transformPoint work in 3D', () => {
    const t = new MatrixTracker<Matrix3x3>(SHEAR3D);
    t.setColumns([1, 0, 0], [0, 0, 1], [0, -1, 0]);
    expect(t.getMatrix()).toEqual(ROTATE_X90);
    expect(t.transformPoint([0, 1, 0])).toEqual([0, 0, 1]);
  });

  it('fromBasisVectors with three sources builds a live 3x3 matrix', () => {
    let k: [number, number, number] = [0, 0, 1];
    const t = MatrixTracker.fromBasisVectors(
      () => [1, 0, 0] as const,
      { getPoint: () => [0, 1, 0] as [number, number, number] },
      () => k,
    );
    expect(t.getMatrix()).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    // Move the k basis vector; the third column follows live.
    k = [1, 0, 1];
    expect(t.getMatrix()).toEqual([
      [1, 0, 1],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
});

describe('applyMatrixLive (3D)', () => {
  // MIGRATION: examples for the property
  //   ∀ 3x3 M, ∀ VMobject v, applyMatrixLive(v, M) maps every control point p
  //   to transformPointByMatrix(p, M), including its z component.
  // Replace with a property test once the suite lands.
  it('maps a 3D VMobject by a 3x3 matrix, z included', () => {
    const line = new Line({ start: [1, 2, 3], end: [-1, 0, 2] });
    const original = line.getLocalPoints();
    applyMatrixLive(line, SHEAR3D);
    expectPointsClose(
      line.getLocalPoints(),
      original.map((p) => transformPointByMatrix(p, SHEAR3D)),
    );
  });

  // MIGRATION: examples for the property
  //   ∀ 3x3 M, ∀ mesh mobject s with local vertices L, after applyMatrixLive(s, M)
  //   the local vertices equal L.map(p => transformPointByMatrix(p, M)), and each
  //   later frame maps from L again (absolute, never cumulative).
  // Replace with a property test once the suite lands.
  it('re-maps the vertices of a moved mesh (Sphere) in its local frame', () => {
    const sphere = new Sphere({ radius: 1, center: [2, 0, 1], resolution: 8 });
    const original = meshLocalVertices(sphere);
    const tracker = new MatrixTracker<Matrix3x3>(SHEAR3D);
    applyMatrixLive(sphere, tracker);
    expectPointsClose(
      meshLocalVertices(sphere),
      original.map((p) => transformPointByMatrix(p, SHEAR3D)),
    );
    // The mobject's own transform is left alone.
    expect(sphere.position.toArray()).toEqual([2, 0, 1]);

    // The next frame re-maps from the pristine snapshot, not cumulatively.
    tracker.setMatrix(ROTATE_X90);
    sphere.update(0.016);
    expectPointsClose(
      meshLocalVertices(sphere),
      original.map((p) => transformPointByMatrix(p, ROTATE_X90)),
    );
  });

  it('flags the mesh geometry for upload and rotates its normals', () => {
    const cube = new Cube({ sideLength: 2 });
    const mesh = cube.getThreeObject() as THREE.Mesh;
    const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const versionBefore = pos.version;
    applyMatrixLive(cube, ROTATE_X90);
    expect(pos.version).toBeGreaterThan(versionBefore);
    // The +y face normal rotates onto +z under a 90-degree turn about x.
    expect(hasNormal(cube, [0, 0, 1])).toBe(true);
  });

  // MIGRATION: example for the property
  //   ∀ mesh s with normals N, applyMatrixLive(s, I) leaves N unchanged.
  // Replace with a property test once the suite lands.
  it('the identity leaves sphere normals unchanged (no seam artefacts)', () => {
    const sphere = new Sphere({ radius: 1, resolution: 32 });
    const before = meshNormals(sphere);
    applyMatrixLive(sphere, [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ] as Matrix3x3);
    const after = meshNormals(sphere);
    expect(after.length).toBe(before.length);
    for (let i = 0; i < before.length; i++) {
      for (let c = 0; c < 3; c++) expect(Math.abs(after[i][c] - before[i][c])).toBeLessThan(1e-6);
    }
  });

  it('maps normals by the inverse transpose under a shear', () => {
    const cube = new Cube({ sideLength: 2 });
    applyMatrixLive(cube, SHEAR3D);
    // (x, y, z) -> (x + z, 2y, z) tilts the +x face: its normal is (1, 0, -1)/sqrt(2).
    expect(hasNormal(cube, [Math.SQRT1_2, 0, -Math.SQRT1_2])).toBe(true);
    // The +z face stays flat.
    expect(hasNormal(cube, [0, 0, 1])).toBe(true);
  });

  it('a singular 3x3 matrix flattens a mesh and it recovers on the next frame', () => {
    const cube = new Cube({ sideLength: 2 });
    const original = meshLocalVertices(cube);
    const originalNormals = meshNormals(cube);
    const tracker = new MatrixTracker<Matrix3x3>([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]);
    applyMatrixLive(cube, tracker);
    for (const p of meshLocalVertices(cube)) {
      expect(p[2]).toBeCloseTo(0, 9);
      expect(Number.isFinite(p[0])).toBe(true);
    }
    for (const n of meshNormals(cube)) expect(n.every(Number.isFinite)).toBe(true);
    tracker.setMatrix([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
    cube.update(0);
    expectPointsClose(meshLocalVertices(cube), original);
    expectPointsClose(meshNormals(cube), originalNormals);
  });

  it('a 2x2 matrix on a mesh maps x and y and leaves z alone', () => {
    const cube = new Cube({ sideLength: 2 });
    const original = meshLocalVertices(cube);
    applyMatrixLive(cube, ROTATE90);
    expectPointsClose(
      meshLocalVertices(cube),
      original.map((p) => transformPointByMatrix(p, ROTATE90)),
    );
  });

  it('maps each mesh in a Group exactly once', () => {
    const cube = new Cube({ sideLength: 1, center: [-2, 0, 0] });
    const sphere = new Sphere({ radius: 0.5, center: [2, 0, 1], resolution: 8 });
    const group = new Group();
    group.add(cube);
    group.add(sphere);
    const cubeOriginal = meshLocalVertices(cube);
    const sphereOriginal = meshLocalVertices(sphere);
    applyMatrixLive(group, SHEAR3D);
    expectPointsClose(
      meshLocalVertices(cube),
      cubeOriginal.map((p) => transformPointByMatrix(p, SHEAR3D)),
    );
    expectPointsClose(
      meshLocalVertices(sphere),
      sphereOriginal.map((p) => transformPointByMatrix(p, SHEAR3D)),
    );
  });

  // MIGRATION: example for the property
  //   ∀ M, ∀ offset o, a VMobject and a mesh with the same local shape, both
  //   moved by o, have the same world footprint after applyMatrixLive(group, M).
  // Replace with a property test once the suite lands.
  it('a moved Square and a moved Cube in one Group stay together', () => {
    const square = new Square({ sideLength: 2 }).moveTo([3, 1, 0]);
    const cube = new Cube({ sideLength: 2 }).moveTo([3, 1, 0]);
    const group = new Group();
    group.add(square);
    group.add(cube);
    applyMatrixLive(group, SHEAR);
    const squareBox = xyBounds(square.getPoints());
    const cubeBox = xyBounds(meshWorldVertices(cube));
    for (let i = 0; i < 4; i++) expect(cubeBox[i]).toBeCloseTo(squareBox[i], 6);
  });

  it('skips an InstancedMesh: the shared template and instance matrices stay put', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const template = Array.from(geometry.getAttribute('position').array);
    const mob = new InstancedMobject({
      geometry,
      material: new THREE.MeshStandardMaterial(),
      instances: [{ position: [1, 0, 0] }, { position: [0, 2, 0] }],
    });
    const before = new THREE.Matrix4();
    mob.getInstancedMesh().getMatrixAt(1, before);
    applyMatrixLive(mob, SHEAR3D);
    expect(Array.from(geometry.getAttribute('position').array)).toEqual(template);
    const after = new THREE.Matrix4();
    mob.getInstancedMesh().getMatrixAt(1, after);
    expect(after.equals(before)).toBe(true);
  });
});
