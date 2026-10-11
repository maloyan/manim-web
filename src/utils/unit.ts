/**
 * Sizing-unit helpers, ported from ManimCE `manim/utils/unit.py`.
 *
 * ManimCE uses operator overloading (`3 * Pixels`, `val * Percent(X_AXIS)`) and
 * reads the live `config` at multiply time. manim-web has no mutable global
 * config, so each unit is exposed as a function that converts a value and the
 * frame/pixel dimensions are grounded in the default-config constants
 * (`DEFAULT_FRAME_WIDTH`, `DEFAULT_FRAME_HEIGHT`, `DEFAULT_PIXEL_WIDTH`).
 */

import { DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_PIXEL_WIDTH } from '../constants';
import { RIGHT, UP, OUT, type Vector3Tuple } from '../core/Mobject';

/**
 * Convert a length in pixels to manim scene units, using the default frame
 * width and pixel width. Mirrors ManimCE `Pixels`.
 */
export function Pixels(value: number): number {
  return (value * DEFAULT_FRAME_WIDTH) / DEFAULT_PIXEL_WIDTH;
}

/**
 * Convert an angle in degrees to radians. Mirrors ManimCE `Degrees`
 * (`PI / 180`).
 */
export function Degrees(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Manim units: an identity conversion (1 unit == 1 scene unit). Mirrors
 * ManimCE `Munits`.
 */
export function Munits(value: number): number {
  return value;
}

function isAxis(axis: Vector3Tuple, reference: Vector3Tuple): boolean {
  return axis[0] === reference[0] && axis[1] === reference[1] && axis[2] === reference[2];
}

/**
 * Convert a percentage of the frame size along `axis` to scene units. The X
 * axis (`RIGHT`) uses the frame width, the Y axis (`UP`) uses the frame height.
 * Mirrors ManimCE `Percent`.
 *
 * @throws if `axis` is the Z axis (`OUT`); its length is undefined.
 * @example
 * Percent(RIGHT, 50); // DEFAULT_FRAME_WIDTH / 2
 * Percent(UP, 25);    // DEFAULT_FRAME_HEIGHT / 4
 */
export function Percent(axis: Vector3Tuple, value: number): number {
  let length: number;
  if (isAxis(axis, RIGHT)) {
    length = DEFAULT_FRAME_WIDTH;
  } else if (isAxis(axis, UP)) {
    length = DEFAULT_FRAME_HEIGHT;
  } else if (isAxis(axis, OUT)) {
    throw new Error('length of Z axis is undefined');
  } else {
    throw new Error('Percent axis must be the X axis (RIGHT) or Y axis (UP)');
  }
  return (value / 100) * length;
}
