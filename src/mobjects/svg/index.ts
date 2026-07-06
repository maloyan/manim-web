/**
 * SVG-based mobjects for manimweb
 *
 * This module provides mobjects that are traditionally SVG-based in Manim,
 * but are implemented using Bezier curves for consistency with the rest
 * of the manimweb rendering pipeline.
 */

// Brace - Curly brace shapes
export {
  ArcBrace,
  type ArcBraceOptions,
  Brace,
  BraceBetweenPoints,
  type BraceBetweenPointsOptions,
  BraceLabel,
  type BraceLabelOptions,
  type BraceOptions,
  BraceText,
} from "./Brace";

// SVGMobject - Parse and display SVG
export {
  SVGMobject,
  svgMobject,
  type SVGMobjectOptions,
  VMobjectFromSVGPath,
  type VMobjectFromSVGPathOptions,
} from "./SVGMobject";
