// Colors
export * from './constants/colors';
export * from './constants';

// Core
export { Mobject, type MobjectStyle, type Vector3Tuple, type UpdaterFunction } from './core/Mobject';
export { UP, DOWN, LEFT, RIGHT, IN, OUT, ORIGIN, UL, UR, DL, DR } from './core/Mobject';
export { VMobject, type Point } from './core/VMobject';
export { VGroup } from './core/VGroup';
export { VDict, VectorizedPoint } from './core/VDict';
export { Group } from './core/Group';
export { Scene, type SceneOptions } from './core/Scene';
export { Renderer, type RendererOptions } from './core/Renderer';
export { Camera2D, type CameraOptions, Camera3D, type Camera3DOptions } from './core/Camera';
export {
  Lighting,
  type AmbientLightOptions,
  type DirectionalLightOptions,
  type PointLightOptions,
  type SpotLightOptions,
} from './core/Lighting';

// Geometry
export {
  Circle,
  type CircleOptions,
  Line,
  type LineOptions,
  Rectangle,
  Square,
  type RectangleOptions,
  Polygon,
  Triangle,
  RegularPolygon,
  Hexagon,
  Pentagon,
  type PolygonOptions,
  Arrow,
  DoubleArrow,
  Vector,
  type ArrowOptions,
  Arc,
  type ArcOptions,
  ArcBetweenPoints,
  type ArcBetweenPointsOptions,
  // Arc-based shapes
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
  DashedLine,
  type DashedLineOptions,
  DashedVMobject,
  type DashedVMobjectOptions,
  CubicBezier,
  type CubicBezierOptions,
  Dot,
  SmallDot,
  LargeDot,
  type DotOptions,
  BackgroundRectangle,
  SurroundingRectangle,
  Underline,
  Cross,
  type BackgroundRectangleOptions,
  type SurroundingRectangleOptions,
  type UnderlineOptions,
  type CrossOptions,
  // Extended polygon shapes
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
  // Angle shapes
  Angle,
  RightAngle,
  Elbow,
  TangentLine,
  type AngleOptions,
  type AngleInput,
  type RightAngleOptions,
  type ElbowOptions,
  type TangentLineOptions,
} from './mobjects/geometry';

// Graphing
export {
  NumberLine,
  type NumberLineOptions,
  Axes,
  type AxesOptions,
  NumberPlane,
  type NumberPlaneOptions,
  type BackgroundLineStyle,
  FunctionGraph,
  type FunctionGraphOptions,
  ParametricFunction,
  type ParametricFunctionOptions,
  VectorFieldVector,
  type VectorFieldVectorOptions,
} from './mobjects/graphing';

// Text and LaTeX
export {
  Text,
  type TextOptions,
  Paragraph,
  type ParagraphOptions,
  MarkupText,
  type MarkupTextOptions,
  MathTex,
  type MathTexOptions,
  Tex,
  type TexOptions,
  ensureKatexStyles,
  areKatexStylesLoaded,
  DecimalNumber,
  Integer,
  type DecimalNumberOptions,
  Variable,
  type VariableOptions,
  GlyphVMobject,
  type GlyphVMobjectOptions,
  TextGlyphGroup,
  type TextGlyphGroupOptions,
} from './mobjects/text';

// 3D Mobjects
export {
  // Basic 3D primitives
  Sphere,
  type SphereOptions,
  Cube,
  Box3D,
  type CubeOptions,
  type Box3DOptions,
  Cylinder,
  Cone,
  type CylinderOptions,
  type ConeOptions,
  Torus,
  type TorusOptions,
  // Lines and arrows
  Line3D,
  type Line3DOptions,
  Arrow3D,
  Vector3D,
  type Arrow3DOptions,
  // Surfaces
  Surface3D,
  type Surface3DOptions,
  ParametricSurface,
  SurfacePresets,
  type ParametricSurfaceOptions,
  // Coordinate systems
  ThreeDAxes,
  type ThreeDAxesOptions,
} from './mobjects/three-d';

// Value Trackers
export {
  ValueTracker,
  valueTracker,
  ComplexValueTracker,
  complexValueTracker,
  type ValueTrackerOptions,
  type ComplexValueTrackerOptions,
  type Complex,
} from './mobjects/value-tracker';

// Matrix
export {
  Matrix,
  IntegerMatrix,
  DecimalMatrix,
  MobjectMatrix,
  type MatrixOptions,
  type IntegerMatrixOptions,
  type DecimalMatrixOptions,
  type MobjectMatrixOptions,
  type BracketType,
  type ElementAlignment,
} from './mobjects/matrix';

// Table
export {
  Table,
  MathTable,
  MobjectTable,
  IntegerTable,
  DecimalTable,
  type TableOptions,
  type MathTableOptions,
  type MobjectTableOptions,
  type IntegerTableOptions,
  type DecimalTableOptions,
} from './mobjects/table';

// SVG-based mobjects (Braces)
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
  // SVG parsing
  SVGMobject,
  svgMobject,
  VMobjectFromSVGPath,
  type SVGMobjectOptions,
  type VMobjectFromSVGPathOptions,
} from './mobjects/svg';

// Graph mobjects for network visualization
export {
  // Core graph classes
  GenericGraph,
  Graph,
  DiGraph,
  // Types
  type VertexId,
  type EdgeTuple,
  type LayoutType,
  type VertexStyleOptions,
  type EdgeStyleOptions,
  type VertexConfig,
  type EdgeConfig,
  type LayoutConfig,
  type GenericGraphOptions,
  type DiGraphOptions,
  // Helper functions for common graph types
  completeGraph,
  cycleGraph,
  pathGraph,
  starGraph,
  binaryTree,
  gridGraph,
  bipartiteGraph,
} from './mobjects/graph';

// Image mobjects
export {
  ImageMobject,
  type ImageMobjectOptions,
  type ImageFilterOptions,
} from './mobjects/image';

// Frame/Screen mobjects
export {
  ScreenRectangle,
  type ScreenRectangleOptions,
  FullScreenRectangle,
  type FullScreenRectangleOptions,
  FullScreenFadeRectangle,
  type FullScreenFadeRectangleOptions,
  createFadeToBlack,
  createFadeToWhite,
  DEFAULT_ASPECT_RATIO,
} from './mobjects/frame';

// Point-based mobjects (particles)
export {
  PMobject,
  PGroup,
  PointMobject,
  PointCloudDot,
  type PMobjectOptions,
  type PGroupOptions,
  type PointMobjectOptions,
  type PointCloudDotOptions,
  type PointData,
} from './mobjects/point';

// Animations
export {
  Animation,
  type AnimationOptions,
  type RateFunction,
} from './animation/Animation';
export { Timeline, type PositionParam } from './animation/Timeline';

// Animation types
export { FadeIn, fadeIn, FadeOut, fadeOut } from './animation/fading';
export {
  Create,
  create,
  DrawBorderThenFill,
  drawBorderThenFill,
  Uncreate,
  uncreate,
  Write,
  write,
  Unwrite,
  unwrite,
  AddTextLetterByLetter,
  addTextLetterByLetter,
  RemoveTextLetterByLetter,
  removeTextLetterByLetter,
  type WriteOptions,
  type AddTextLetterByLetterOptions,
} from './animation/creation';
export { Transform, transform, ReplacementTransform, replacementTransform, MoveToTarget, moveToTarget } from './animation/transform';
export { ApplyPointwiseFunction, applyPointwiseFunction } from './animation/transform';

// Movement animations
export {
  Rotate,
  rotate,
  type RotateOptions,
  Scale,
  scale,
  GrowFromCenter,
  growFromCenter,
  type ScaleOptions,
  Shift,
  shift,
  MoveToTargetPosition,
  moveToTargetPosition,
  type ShiftOptions,
  MoveAlongPath,
  moveAlongPath,
  type MoveAlongPathOptions,
} from './animation/movement';

// Animation utilities
export { AnimationGroup, animationGroup, type AnimationGroupOptions } from './animation/AnimationGroup';
export { LaggedStart, laggedStart, type LaggedStartOptions } from './animation/LaggedStart';
export { Succession, succession, type SuccessionOptions } from './animation/Succession';

// Updater animations
export { UpdateFromFunc, updateFromFunc } from './animation/UpdateFromFunc';
export { UpdateFromAlphaFunc, updateFromAlphaFunc } from './animation/UpdateFromAlphaFunc';
export { maintainPositionRelativeTo } from './animation/MaintainPositionRelativeTo';

// Rate functions
export {
  linear,
  smooth,
  easeIn,
  easeOut,
  easeInOut,
  easeInQuad,
  easeOutQuad,
  easeInExpo,
  easeOutExpo,
  easeInBounce,
  easeOutBounce,
  thereAndBack,
  rushInto,
  rushFrom,
  doubleSmooth,
  stepFunction,
  reverse,
  compose,
} from './rate-functions';

// Interaction - UI Controls
export {
  Controls,
  type ControlsOptions,
  type ControlsPosition,
  type ControlsTheme,
  type SliderConfig,
  type ButtonConfig,
  type CheckboxConfig,
  type ColorPickerConfig,
  PlaybackControls,
  type PlaybackControlsOptions,
  type TimeUpdateCallback,
} from './interaction';

// Interaction - Mobject Behaviors
export {
  Draggable,
  makeDraggable,
  type DraggableOptions,
  Hoverable,
  makeHoverable,
  type HoverableOptions,
  Clickable,
  makeClickable,
  type ClickableOptions,
} from './interaction';

// Interaction - Camera Controls
export { OrbitControls, type OrbitControlsOptions } from './interaction';

// Export
export {
  GifExporter,
  createGifExporter,
  type GifExportOptions,
  VideoExporter,
  createVideoExporter,
  type VideoExportOptions,
} from './export';

// Performance utilities
export {
  PerformanceMonitor,
  createPerformanceMonitor,
  FrameTimeTracker,
  createFrameTimeTracker,
} from './utils/Performance';
