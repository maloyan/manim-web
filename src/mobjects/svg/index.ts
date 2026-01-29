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
} from './SVGMobject';
