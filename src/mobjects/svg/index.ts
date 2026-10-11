/**
 * SVG-based mobjects for manimweb
 *
 * This module provides mobjects that are traditionally SVG-based in Manim,
 * but are implemented using Bezier curves for consistency with the rest
 * of the manimweb rendering pipeline.
 */

// Brace - Curly brace shapes
export {
  Brace,
  BraceBetweenPoints,
  ArcBrace,
  BraceLabel,
  BraceText,
  type BraceOptions,
  type BraceBetweenPointsOptions,
  type ArcBraceOptions,
  type BraceLabelOptions,
} from './Brace';

// SVGMobject - Parse and display SVG
export {
  SVGMobject,
  svgMobject,
  VMobjectFromSVGPath,
  type SVGMobjectOptions,
  type VMobjectFromSVGPathOptions,
  type SVGMobjectFromUrlOptions,
} from './SVGMobject';

// --- svg enhancements (best-manim) ---
// Gradient fills: parse <linearGradient>/<radialGradient> and apply as fills.
export {
  GradientVMobject,
  type GradientVMobjectOptions,
  type SvgGradient,
  type SvgGradientStop,
  type SvgGradientType,
} from './svgGradients';
// URL loading: SVGMobject.fromUrl's injectable fetcher contract.
export { type SvgFetcher, type SvgFetchResponse } from './svgLoader';
// --- end svg enhancements ---
