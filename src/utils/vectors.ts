/**
 * Vector math utilities for py2ts-generated code.
 *
 * These helper functions are used by the py2ts converter to translate
 * Python vector arithmetic (e.g., `2 * LEFT + 1.5 * UP`) into
 * TypeScript calls (`addVec(scaleVec(2, LEFT), scaleVec(1.5, UP))`).
 */

import type { Vector3Tuple } from '../core/Mobject';

/**
 * Scale a direction vector by a scalar.
 *
 * @param scalar - The scalar multiplier
 * @param vec - The direction vector [x, y, z]
 * @returns Scaled vector as [x * scalar, y * scalar, z * scalar]
 *
 * @example
 * ```ts
 * scaleVec(2, LEFT)  // [-2, 0, 0]
 * scaleVec(1.5, UP)  // [0, 1.5, 0]
 * ```
 */
export function scaleVec(scalar: number, vec: Vector3Tuple): Vector3Tuple {
  return [vec[0] * scalar, vec[1] * scalar, vec[2] * scalar];
}

/**
 * Add two or more vectors component-wise.
 *
 * @param vecs - Two or more vectors to add
 * @returns Sum vector as [sum_x, sum_y, sum_z]
 *
 * @example
 * ```ts
 * addVec(LEFT, UP)       // [-1, 1, 0]
 * addVec(scaleVec(2, RIGHT), scaleVec(3, DOWN))  // [2, -3, 0]
 * ```
 */
export function addVec(...vecs: Vector3Tuple[]): Vector3Tuple {
  let x = 0, y = 0, z = 0;
  for (const v of vecs) {
    x += v[0];
    y += v[1];
    z += v[2];
  }
  return [x, y, z];
}
