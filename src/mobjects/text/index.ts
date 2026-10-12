/**
 * Text mobjects for manimweb
 *
 * This module provides text rendering capabilities using Canvas 2D textures
 * applied to Three.js plane meshes, as well as LaTeX rendering using KaTeX.
 */

// Text - Basic text rendering
export { Text, type TextOptions } from './Text';

// Per-substring style runs (t2c/t2w/t2s layout model for Text)
export { type TextStyleMaps, type TextStyleRun, buildStyledTextLines } from './textStyleRuns';

// Glyph vector extraction (for stroke-draw animation)
export { GlyphVMobject, type GlyphVMobjectOptions } from './GlyphVMobject';
export { TextGlyphGroup, type TextGlyphGroupOptions } from './TextGlyphGroup';

// Text-on-a-path: lay out glyphs along an arbitrary curve.
export {
  TextOnPath,
  type TextOnPathOptions,
  type TextOnPathGlyph,
  type TextOnPathSource,
} from './TextOnPath';
export {
  computeGlyphPlacements,
  sampledPathFromPoints,
  sampledPathFromFunction,
  visibleGlyphChars,
  alignmentToOffset,
  type SampledPath,
  type GlyphLayoutEntry,
  type GlyphLayoutOptions,
  type GlyphPlacement,
  type TextOnPathAlignment,
  type TextOnPathOverflow,
  type PathPoint,
} from './textOnPathLayout';

// Paragraph - Text with word wrapping
export { Paragraph, type ParagraphOptions } from './Paragraph';

// MarkupText - Text with Pango-like XML markup (bold, italic, colors, spans, etc.)
export { MarkupText, type MarkupTextOptions, type StyledTextSegment } from './MarkupText';

// KaTeX styles helper
export { ensureKatexStyles, areKatexStylesLoaded, setKatexStylesheetUrl } from './katexStyles';

// MathTex - SVG vector-based LaTeX rendering (default, like Python Manim)
export { MathTex, type MathTexOptions, MathTexSVG, type MathTexSVGOptions } from './MathTex';

// MathTexImage - Rasterized LaTeX rendering (KaTeX default, MathJax fallback)
export { MathTexImage, type MathTexImageOptions, type TexRenderer } from './MathTexImage';

// MathJax renderer (dynamic import, full LaTeX support)
export {
  renderLatexToSVG,
  preloadMathJax,
  isMathJaxLoaded,
  katexCanRender,
  setMathJaxScriptUrl,
  type MathJaxRenderOptions,
  type MathJaxRenderResult,
} from './MathJaxRenderer';

// SVG path parser (SVG d-attribute -> VMobject conversion)
export { parseSVGPathData, svgToVMobjects, type SVGToVMobjectOptions } from './svgPathParser';

// Tex - Manim compatibility alias
export { Tex, type TexOptions } from './Tex';

// --- typst parity ---
// Typst - SVG vector-based Typst rendering via lazy-loaded WASM compiler
export { Typst, MathTypst, type TypstOptions, type MathTypstOptions } from './Typst';
export {
  renderTypstToSVG,
  preloadTypst,
  isTypstLoaded,
  setTypstCompiler,
  type TypstRenderOptions,
  type TypstRenderResult,
  type TypstSvgCompiler,
} from './TypstRenderer';
// --- end typst parity ---

// DecimalNumber - Animatable number display
export { DecimalNumber, Integer, type DecimalNumberOptions } from './DecimalNumber';

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
export { type CodeToken, type CodeTokenLayoutParams } from './CodeTokenLayout';

// MathTexParts - Single-string MathTex and partitioned MathTex
export {
  SingleStringMathTex,
  type SingleStringMathTexOptions,
  MathTexPart,
  type MathTexPartOptions,
} from './MathTexParts';

// TextExtensions - Additional text mobjects
export {
  BulletedList,
  Title,
  MarkdownText,
  type BulletedListOptions,
  type TitleOptions,
  type MarkdownTextOptions,
} from './TextExtensions';
