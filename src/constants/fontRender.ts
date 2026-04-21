/**
 * LaTeX / Text font Rendering Constants
 *
 * Design notes and context:
 * https://github.com/ManimCommunity/manim/issues/4690
 */

/** Default font size for Manim text objects. */
export const DEFAULT_FONT_SIZE_PT = 48;

/**
 * Length occupied by an 'EM' character in world space when DEFAULT_FONT_SIZE_PT is used.
 *
 * An exact 'EM' character is usually the em dash: '—'.
 *
 * Text, MathTex amd MathTexImage should all have this property at default settings.
 *
 * Note that his is an arbitrary convention, but the same one as python manim.
 */
export const DEFAULT_FONT_SIZE_IN_WORLD_SPACE = 0.5;
