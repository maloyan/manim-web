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

// Arrow and variants
export {
  Arrow,
  DoubleArrow,
  Vector,
  type ArrowOptions,
} from './Arrow';

// Arc and variants
export { Arc, type ArcOptions } from './Arc';
export { ArcBetweenPoints, type ArcBetweenPointsOptions } from './ArcBetweenPoints';

// Arc-based shapes
export {
  Ellipse,
  type EllipseOptions,
  Annulus,
  type AnnulusOptions,
  AnnularSector,
  type AnnularSectorOptions,
  Sector,
  type SectorOptions,
  ArcPolygon,
  type ArcPolygonOptions,
  type ArcConfig,
  CurvedArrow,
  CurvedDoubleArrow,
  type CurvedArrowOptions,
  TangentialArc,
  type TangentialArcOptions,
} from './ArcShapes';

// Dashed shapes
export { DashedLine, type DashedLineOptions } from './DashedLine';
export { DashedVMobject, type DashedVMobjectOptions } from './DashedVMobject';

// Cubic Bezier
export {
  CubicBezier,
  type CubicBezierOptions,
  type CubicBezierPoints,
} from './CubicBezier';

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
  type LabeledLineOptions,
  type LabeledArrowOptions,
  type LabeledDotOptions,
  type AnnotationDotOptions,
  type LabelDirection,
  type LabelOrientation,
} from './LabeledGeometry';
