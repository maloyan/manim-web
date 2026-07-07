/**
 * Geometry mobjects for manimweb
 *
 * This module provides basic geometric shapes as VMobjects that can be
 * animated and composed in scenes.
 */

// Circle
export { Circle, type CircleOptions } from "./Circle";

// Line
export { Line, type LineOptions } from "./Line";

// Rectangle and Square
export { Rectangle, type RectangleOptions, Square } from "./Rectangle";

// Polygon and variants
export {
  Hexagon,
  Pentagon,
  Polygon,
  type PolygonOptions,
  RegularPolygon,
  Triangle,
} from "./Polygon";

// Polygram (generalized polygon with multiple vertex groups)
export { Polygram, type PolygramOptions } from "./Polygram";

// TipableVMobject base class
export {
  TipableVMobject,
  type TipableVMobjectOptions,
  type TipOptions,
} from "./TipableVMobject";

// Arrow and variants
export { Arrow, type ArrowOptions, DoubleArrow, Vector } from "./Arrow";

// Arc and variants
export { Arc, type ArcOptions } from "./Arc";
export {
  ArcBetweenPoints,
  type ArcBetweenPointsOptions,
} from "./ArcBetweenPoints";

// Arc-based shapes
export { Ellipse, type EllipseOptions } from "./Ellipse";
export { Annulus, type AnnulusOptions } from "./Annulus";
export { AnnularSector, type AnnularSectorOptions } from "./AnnularSector";
export { Sector, type SectorOptions } from "./Sector";
export {
  type ArcConfig,
  ArcPolygon,
  type ArcPolygonOptions,
} from "./ArcPolygon";
export { CurvedArrow, type CurvedArrowOptions } from "./CurvedArrow";
export { CurvedDoubleArrow } from "./CurvedDoubleArrow";
export { TangentialArc, type TangentialArcOptions } from "./TangentialArc";

// Dashed shapes
export { DashedLine, type DashedLineOptions } from "./DashedLine";
export { DashedVMobject, type DashedVMobjectOptions } from "./DashedVMobject";

// Cubic Bezier
export {
  CubicBezier,
  type CubicBezierOptions,
  type CubicBezierPoints,
} from "./CubicBezier";

// Dot and variants
export { Dot, type DotOptions, LargeDot, SmallDot } from "./Dot";

// Shape matchers
export {
  BackgroundRectangle,
  type BackgroundRectangleOptions,
  Cross,
  type CrossOptions,
  SurroundingRectangle,
  type SurroundingRectangleOptions,
  Underline,
  type UnderlineOptions,
} from "./ShapeMatchers";

// Extended polygon shapes
export {
  ConvexHull,
  type ConvexHullOptions,
  Cutout,
  type CutoutOptions,
  RegularPolygram,
  type RegularPolygramOptions,
  RoundedRectangle,
  type RoundedRectangleOptions,
  Star,
  type StarOptions,
} from "./PolygonExtensions";

// Angle shapes
export {
  Angle,
  type AngleInput,
  type AngleOptions,
  Elbow,
  type ElbowOptions,
  RightAngle,
  type RightAngleOptions,
  TangentLine,
  type TangentLineOptions,
} from "./AngleShapes";

// Arrow tips
export {
  ArrowCircleFilledTip,
  ArrowCircleTip,
  ArrowSquareFilledTip,
  ArrowSquareTip,
  ArrowTip,
  type ArrowTipOptions,
  ArrowTriangleFilledTip,
  ArrowTriangleTip,
  StealthTip,
} from "./ArrowTips";

// Boolean operations
export {
  type BooleanOperationOptions,
  BooleanResult,
  Difference,
  difference,
  Exclusion,
  exclusion,
  Intersection,
  intersection,
  Union,
  union,
} from "./BooleanOperations";

// Labeled geometry
export {
  AnnotationDot,
  type AnnotationDotOptions,
  type LabelDirection,
  LabeledArrow,
  type LabeledArrowOptions,
  LabeledDot,
  type LabeledDotOptions,
  LabeledLine,
  type LabeledLineOptions,
  LabeledPolygram,
  type LabeledPolygramOptions,
  type LabelOrientation,
} from "./LabeledGeometry";
