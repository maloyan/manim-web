/**
 * Text mobjects for manimweb
 *
 * This module provides text rendering capabilities using Canvas 2D textures
 * applied to Three.js plane meshes, as well as LaTeX rendering using KaTeX.
 */

// Text - Basic text rendering
export { Text, type TextOptions } from './Text';

// Glyph vector extraction (for stroke-draw animation)
export { GlyphVMobject, type GlyphVMobjectOptions } from './GlyphVMobject';
export { TextGlyphGroup, type TextGlyphGroupOptions } from './TextGlyphGroup';

// Paragraph - Text with word wrapping
export { Paragraph, type ParagraphOptions } from './Paragraph';

// MarkupText - Text with Pango-like XML markup (bold, italic, colors, spans, etc.)
export { MarkupText, type MarkupTextOptions, type StyledTextSegment } from './MarkupText';

// KaTeX styles helper
export { ensureKatexStyles, areKatexStylesLoaded } from './katex-styles';

// MathTex - LaTeX rendering (KaTeX default, MathJax fallback)
export { MathTex, type MathTexOptions, type TexRenderer } from './MathTex';

// MathJax renderer (dynamic import, full LaTeX support)
export {
  renderLatexToSVG,
  preloadMathJax,
  isMathJaxLoaded,
  katexCanRender,
  type MathJaxRenderOptions,
  type MathJaxRenderResult,
} from './MathJaxRenderer';

// SVG path parser (SVG d-attribute -> VMobject conversion)
export {
  parseSVGPathData,
  svgToVMobjects,
  type SVGToVMobjectOptions,
} from './svgPathParser';

// Tex - Manim compatibility alias
export { Tex, type TexOptions } from './Tex';

// DecimalNumber - Animatable number display
export {
  DecimalNumber,
  Integer,
  type DecimalNumberOptions,
} from './DecimalNumber';

// Variable - Label with animatable value (e.g., "x = 5")
export { Variable, type VariableOptions } from './Variable';

// Code - Syntax-highlighted code blocks
export {
  Code,
  type CodeOptions,
  type CodeColorScheme,
  type Token,
  type TokenType,
  DEFAULT_COLOR_SCHEME,
  MONOKAI_COLOR_SCHEME,
} from './Code';

// TextExtensions - Additional text mobjects
export {
  BulletedList,
  Title,
  MarkdownText,
  type BulletedListOptions,
  type TitleOptions,
  type MarkdownTextOptions,
} from './TextExtensions';
