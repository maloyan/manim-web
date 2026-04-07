/**
 * Geometry mobjects for manimweb
 *
 * This module provides basic geometric shapes as VMobjects that can be
 * animated and composed in scenes.
 */

// Circle
export { Circle, type CircleOptions } from './Circle';

// Line
export { Line, type LineOptions } from './Line';

// Rectangle and Square
export { Rectangle, Square, type RectangleOptions } from './Rectangle';

// Polygon and variants
export {
  Polygon,
  Triangle,
  RegularPolygon,
  Hexagon,
  Pentagon,
  type PolygonOptions,
} from './Polygon';

// Polygram (generalized polygon with multiple vertex groups)
export { Polygram, type PolygramOptions } from './Polygram';

// TipableVMobject base class
export { TipableVMobject, type TipableVMobjectOptions, type TipOptions } from './TipableVMobject';

// Arrow and variants
export { Arrow, DoubleArrow, Vector, type ArrowOptions } from './Arrow';

// Arc and variants
export { Arc, type ArcOptions } from './Arc';
export { ArcBetweenPoints, type ArcBetweenPointsOptions } from './ArcBetweenPoints';

// Arc-based shapes
export { Ellipse, type EllipseOptions } from './Ellipse';
export { Annulus, type AnnulusOptions } from './Annulus';
export { AnnularSector, type AnnularSectorOptions } from './AnnularSector';
export { Sector, type SectorOptions } from './Sector';
export { ArcPolygon, type ArcPolygonOptions, type ArcConfig } from './ArcPolygon';
export { CurvedArrow, type CurvedArrowOptions } from './CurvedArrow';
export { CurvedDoubleArrow } from './CurvedDoubleArrow';
export { TangentialArc, type TangentialArcOptions } from './TangentialArc';

// Dashed shapes
export { DashedLine, type DashedLineOptions } from './DashedLine';
export { DashedVMobject, type DashedVMobjectOptions } from './DashedVMobject';

// Cubic Bezier
export { CubicBezier, type CubicBezierOptions, type CubicBezierPoints } from './CubicBezier';

// Dot and variants
export { Dot, SmallDot, LargeDot, type DotOptions } from './Dot';

// Shape matchers
export {
  BackgroundRectangle,
  SurroundingRectangle,
  Underline,
  Cross,
  type BackgroundRectangleOptions,
  type SurroundingRectangleOptions,
  type UnderlineOptions,
  type CrossOptions,
} from './ShapeMatchers';

// Extended polygon shapes
export {
  RoundedRectangle,
  type RoundedRectangleOptions,
  Star,
  type StarOptions,
  RegularPolygram,
  type RegularPolygramOptions,
  Cutout,
  type CutoutOptions,
  ConvexHull,
  type ConvexHullOptions,
} from './PolygonExtensions';

// Angle shapes
export {
  Angle,
  RightAngle,
  Elbow,
  TangentLine,
  type AngleOptions,
  type AngleInput,
  type RightAngleOptions,
  type ElbowOptions,
  type TangentLineOptions,
} from './AngleShapes';

// Arrow tips
export {
  ArrowTip,
  ArrowTriangleTip,
  ArrowTriangleFilledTip,
  ArrowCircleTip,
  ArrowCircleFilledTip,
  ArrowSquareTip,
  ArrowSquareFilledTip,
  StealthTip,
  type ArrowTipOptions,
} from './ArrowTips';

// Boolean operations
export {
  Union,
  Intersection,
  Difference,
  Exclusion,
  BooleanResult,
  union,
  intersection,
  difference,
  exclusion,
  type BooleanOperationOptions,
} from './BooleanOperations';

// Labeled geometry
export {
  LabeledLine,
  LabeledArrow,
  LabeledDot,
  AnnotationDot,
  LabeledPolygram,
  type LabeledLineOptions,
  type LabeledArrowOptions,
  type LabeledDotOptions,
  type AnnotationDotOptions,
  type LabeledPolygramOptions,
  type LabelDirection,
  type LabelOrientation,
} from './LabeledGeometry';
