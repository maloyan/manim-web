import { describe, it, expect, vi } from 'vitest';
import { MatrixTracker, makeMatrixTracker, applyMatrixLive, type Matrix2x2 } from './DynamicMatrix';
import { Line } from '../mobjects/geometry/Line';
import { Group } from '../core/Group';
import { Dot } from '../mobjects/geometry/Dot';
import { NumberPlane } from '../mobjects/graphing/NumberPlane';
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
