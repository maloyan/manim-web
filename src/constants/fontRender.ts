/**
 * LaTeX / Font Rendering Constants
 *
 * Unified text scaling model:
 * - user-facing font size is in points,
 * - all renderers map their internal units to points,
 * - points map to world space with a single baseline.
 *
 * Design notes and context:
 * https://github.com/ManimCommunity/manim/issues/4690
 */

/** Default font size for Manim text objects. */
export const DEFAULT_FONT_SIZE_PT = 48;

/**
 * Length occupied by an 'EM' character in world space when DEFAULT_FONT_SIZE_PT is used.
 *
 * An 'EM' character is the em dash: '—'. This is an arbitrary convention:
 * at fontSize=48pt, the em dash occupies 0.5 world units.
 *
 * This constant defines the baseline for all font-to-world scaling.
 */
export const DEFAULT_FONT_SIZE_IN_WORLD_SPACE = 0.5;
