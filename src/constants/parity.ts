// ManimCE parity constants.
//
// These mirror symbols from ManimCE 0.22.0 `manim/constants.py` that manim-web
// did not yet export. Values are copied verbatim from that source. Constants
// already provided elsewhere (direction tuples in `core/MobjectTypes`, the
// `*_BUFF`/`DEFAULT_MOBJECT_TO_*_BUFFER` and other `DEFAULT_*` values in
// `constants/index`) are intentionally not duplicated here.

import type { Vector3Tuple } from '../core/MobjectTypes';

// --- Mathematical constants ---

/** The ratio of the circumference of a circle to its diameter. */
export const PI = Math.PI;

/** The ratio of the circumference of a circle to its radius (2 * PI). */
export const TAU = 2 * Math.PI;

/** The exchange rate between radians and degrees (radians per degree). */
export const DEGREES = TAU / 360;

// --- Unit basis axes ---

/** Unit vector along the x axis. */
export const X_AXIS: Vector3Tuple = [1, 0, 0];

/** Unit vector along the y axis. */
export const Y_AXIS: Vector3Tuple = [0, 1, 0];

/** Unit vector along the z axis. */
export const Z_AXIS: Vector3Tuple = [0, 0, 1];

// --- Geometry defaults ---

/** Default radius of a `Dot`. */
export const DEFAULT_DOT_RADIUS = 0.08;

/** Default radius of a `SmallDot`. */
export const DEFAULT_SMALL_DOT_RADIUS = 0.04;

/** Default length of a single dash segment. */
export const DEFAULT_DASH_LENGTH = 0.05;

/** Default length of an arrow tip. */
export const DEFAULT_ARROW_TIP_LENGTH = 0.35;

// --- Font weights (Pango names) ---

/** Normal font weight. */
export const NORMAL = 'NORMAL';

/** Bold font weight. */
export const BOLD = 'BOLD';

/** Thin font weight. */
export const THIN = 'THIN';

/** Light font weight. */
export const LIGHT = 'LIGHT';

/** Medium font weight. */
export const MEDIUM = 'MEDIUM';

/** Semibold font weight. */
export const SEMIBOLD = 'SEMIBOLD';

/** Heavy font weight. */
export const HEAVY = 'HEAVY';

/** Ultraheavy font weight. */
export const ULTRAHEAVY = 'ULTRAHEAVY';

// --- Enums ---

/** Collection of available line joint types. */
export enum LineJointType {
  AUTO = 0,
  ROUND = 1,
  BEVEL = 2,
  MITER = 3,
}

/** Collection of available stroke cap styles. */
export enum CapStyleType {
  AUTO = 0,
  ROUND = 1,
  BUTT = 2,
  SQUARE = 3,
}
