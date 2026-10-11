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

/** Ultralight font weight. */
export const ULTRALIGHT = 'ULTRALIGHT';

/** Semilight font weight. */
export const SEMILIGHT = 'SEMILIGHT';

/** Book font weight. */
export const BOOK = 'BOOK';

/** Ultrabold font weight. */
export const ULTRABOLD = 'ULTRABOLD';

// --- Font slants (Pango names) ---

/** Italic font slant. */
export const ITALIC = 'ITALIC';

/** Oblique font slant. */
export const OBLIQUE = 'OBLIQUE';

// --- Simple defaults (verbatim from ManimCE `constants.py`) ---

/** Default run time of a wait animation, in seconds. */
export const DEFAULT_WAIT_TIME = 1.0;

/** Default run time of a pointwise function animation, in seconds. */
export const DEFAULT_POINTWISE_FUNCTION_RUN_TIME = 3.0;

/** Default sample density for a 2D region. */
export const DEFAULT_POINT_DENSITY_2D = 25;

/** Default sample density for a 1D path. */
export const DEFAULT_POINT_DENSITY_1D = 10;

/** World-space scale factor applied per font point. */
export const SCALE_FACTOR_PER_FONT_POINT = 1 / 960;

/** Default horizontal start offset, in pixels. */
export const START_X = 30;

/** Default vertical start offset, in pixels. */
export const START_Y = 20;

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
