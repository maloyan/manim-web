/**
 * LaTeX / Font Rendering Constants
 *
 * Unified text scaling model:
 * - user-facing font size is in points,
 * - all renderers map their internal units to points,
 * - points map to world space with a single baseline.
 *
 * Baselines:
 * - CSS defines 1pt = 4/3 px.
 * - TeX's default font size is 10pt.
 * - KaTeX reference: 10pt -> 13.33px.
 * - MathJax SVG paths: ~1000 font units per em.
 *
 * Design notes and context:
 * https://github.com/ManimCommunity/manim/issues/4690
 */

const PT_TO_PX = 4 / 3;
const LATEX_DEFAULT_FONT_SIZE_PT = 10;
export const DEFAULT_FONT_SIZE_PT = 48;
export const KATEX_REFERENCE_FONT_SIZE_PX = LATEX_DEFAULT_FONT_SIZE_PT * PT_TO_PX;
export const MATHJAX_SVG_UNITS_PER_EM = 1000;

/**
 * The convention taken by Manim:
 * How many world units a font of DEFAULT_FONT_SIZE_PT should occupy.
 */
export const DEFAULT_FONTSIZE_TO_WORLD_SPACE = 0.5 * PT_TO_PX;

/**
 * World units per typographic point.
 *
 * This makes the baseline explicit:
 * fontSize = DEFAULT_FONT_SIZE_PT occupies DEFAULT_FONTSIZE_TO_WORLD_SPACE.
 */
export const FONT_PT_TO_WORLD =
  DEFAULT_FONTSIZE_TO_WORLD_SPACE / KATEX_REFERENCE_FONT_SIZE_PX / DEFAULT_FONT_SIZE_PT;
