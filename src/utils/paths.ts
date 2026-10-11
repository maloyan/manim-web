/**
 * Port of ManimCE `manim/utils/paths.py` (0.22.0) public API.
 *
 * A path function maps a set of start points and a set of end points, together
 * with an interpolation parameter `alpha` in `[0, 1]`, to an intermediate set
 * of points. These drive the `pathArc` behavior of Transform animations.
 *
 * Points are `number[][]` (each point `[x, y, z]`). The two input arrays must
 * have equal length. Function declarations use the repository's camelCase
 * convention; the public ManimCE names (snake_case) are exposed through the
 * alias export block at the end of the file.
 */

import { OUT } from '../core/MobjectTypes';
import { normalize, rotationMatrix } from './spaceOps';

/** A transformation path function (ManimCE `PathFuncType`). */
export type PathFunc = (
  startPoints: number[][],
  endPoints: number[][],
  alpha: number,
) => number[][];

const STRAIGHT_PATH_THRESHOLD = 0.01;

function interpolate(start: number[][], end: number[][], alpha: number): number[][] {
  return start.map((p, i) => p.map((val, j) => val + alpha * (end[i][j] - val)));
}

/** Apply `matrix @ point` for a row-major matrix and a column vector. */
function applyMatrix(point: number[], matrix: number[][]): number[] {
  return matrix.map((row) => row.reduce((acc, val, i) => acc + val * point[i], 0));
}

/**
 * Simplest path: each point moves in a straight line toward its destination
 * (ManimCE `straight_path`).
 */
function straightPath(): PathFunc {
  return interpolate;
}

/**
 * Each point moves roughly along a circle with its own center
 * (ManimCE `path_along_circles`).
 */
function pathAlongCircles(
  arcAngle: number,
  circlesCenters: number[][],
  axis: number[] = OUT,
): PathFunc {
  const unitAxis = normalize(axis, OUT);
  const center = (i: number): number[] => circlesCenters[i] ?? circlesCenters[0];
  return (startPoints, endPoints, alpha) => {
    const detransform = rotationMatrix(-arcAngle, unitAxis);
    const rotMatrix = rotationMatrix(alpha * arcAngle, unitAxis);
    return startPoints.map((start, i) => {
      const c = center(i);
      const endRel = endPoints[i].map((val, j) => val - c[j]);
      const detransformedEnd = applyMatrix(endRel, detransform).map((val, j) => val + c[j]);
      const interpolated = start.map((val, j) => val + alpha * (detransformedEnd[j] - val));
      const rel = interpolated.map((val, j) => val - c[j]);
      return applyMatrix(rel, rotMatrix).map((val, j) => val + c[j]);
    });
  };
}

/**
 * Each point moves along a circular arc of angle `arcAngle` about `axis`
 * (ManimCE `path_along_arc`).
 */
function pathAlongArc(arcAngle: number, axis: number[] = OUT): PathFunc {
  if (Math.abs(arcAngle) < STRAIGHT_PATH_THRESHOLD) return straightPath();
  const unitAxis = normalize(axis, OUT);
  return (startPoints, endPoints, alpha) => {
    const rotMatrix = rotationMatrix(alpha * arcAngle, unitAxis);
    return startPoints.map((start, i) => {
      const vect = endPoints[i].map((val, j) => val - start[j]);
      const center = start.map((val, j) => val + 0.5 * vect[j]);
      if (arcAngle !== Math.PI) {
        const halfVect = vect.map((v) => v / 2);
        const cp = [
          unitAxis[1] * halfVect[2] - unitAxis[2] * halfVect[1],
          unitAxis[2] * halfVect[0] - unitAxis[0] * halfVect[2],
          unitAxis[0] * halfVect[1] - unitAxis[1] * halfVect[0],
        ];
        const scale = 1 / Math.tan(arcAngle / 2);
        for (let j = 0; j < center.length; j++) center[j] += cp[j] * scale;
      }
      const rel = start.map((val, j) => val - center[j]);
      return applyMatrix(rel, rotMatrix).map((val, j) => val + center[j]);
    });
  };
}

/** Each point moves clockwise around a half circle (ManimCE `clockwise_path`). */
function clockwisePath(): PathFunc {
  return pathAlongArc(-Math.PI);
}

/**
 * Each point moves counterclockwise around a half circle
 * (ManimCE `counterclockwise_path`).
 */
function counterclockwisePath(): PathFunc {
  return pathAlongArc(Math.PI);
}

// --- public API (camelCase; ManimCE paths parity) ---------------------------

export { straightPath, pathAlongArc, pathAlongCircles, clockwisePath, counterclockwisePath };
