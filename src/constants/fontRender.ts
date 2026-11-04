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

/**
 * Length of an 'EM' in world space for `Text` (Pango-rendered text in Manim CE)
 * at DEFAULT_FONT_SIZE_PT.
 *
 * Manim CE's `Text` does not follow the 0.5 convention above: at font_size=48
 * its em is 2/3 of a world unit (`Text('—', font='Arial').width` is 0.667, and
 * Arial's 'M' at font_size=72 is 0.716 tall, its cap height of 0.716 em). Using
 * 0.5 made every Text 3/4 the size of Manim CE's. MathTex keeps 0.5, which
 * does match Manim CE.
 */
export const TEXT_FONT_SIZE_IN_WORLD_SPACE = 2 / 3;
