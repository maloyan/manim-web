// Colors
export * from './constants/colors';
export {
  DEFAULT_STROKE_WIDTH,
  DEFAULT_FONT_SIZE,
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_FRAME_WIDTH,
  DEFAULT_FRAME_HEIGHT,
  DEFAULT_PIXEL_WIDTH,
  DEFAULT_PIXEL_HEIGHT,
  DEFAULT_FPS,
  SMALL_BUFF,
  MED_SMALL_BUFF,
  MED_LARGE_BUFF,
  LARGE_BUFF,
  DEFAULT_MOBJECT_TO_EDGE_BUFFER,
  DEFAULT_MOBJECT_TO_MOBJECT_BUFFER,
} from './constants';

// Core
export {
  Mobject,
  type MobjectStyle,
  type Vector3Tuple,
  type UpdaterFunction,
} from './core/Mobject';
export { UP, DOWN, LEFT, RIGHT, IN, OUT, ORIGIN, UL, UR, DL, DR } from './core/Mobject';
export { VMobject, type Point } from './core/VMobject';
export { VGroup } from './core/VGroup';
export { VDict, VectorizedPoint } from './core/VDict';
export { Group } from './core/Group';
export { Scene, type SceneOptions } from './core/Scene';
export { InteractiveScene, type InteractiveSceneOptions } from './core/InteractiveScene';
export {
  ThreeDScene,
  type ThreeDSceneOptions,
  ZoomedScene,
  ZoomDisplayPopOut,
  type ZoomedSceneOptions,
} from './core/SceneExtensions';
export { AudioManager, type AudioTrack, type AddSoundOptions } from './core/AudioManager';
export { Renderer, type RendererOptions } from './core/Renderer';
export {
  SceneStateManager,
  serializeMobject,
  deserializeMobject,
  saveMobjectState,
  restoreMobjectState,
  stateToJSON,
  stateFromJSON,
  snapshotToJSON,
  snapshotFromJSON,
  type MobjectState,
  type SceneSnapshot,
} from './core/StateManager';
export { Camera2D, type CameraOptions, Camera3D, type Camera3DOptions } from './core/Camera';
export { Camera2DFrame } from './core/Camera2DFrame';
export {
  CameraFrame,
  CameraAnimateProxy,
  type CameraFrameOptions,
  type CameraFrameState,
  type CameraFrameAnimationOptions,
} from './core/CameraFrame';
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
  // Boolean operations
  Union,
  Intersection,
  Difference,
  Exclusion,
  BooleanResult,
  type BooleanOperationOptions,
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
  ImplicitFunction,
  type ImplicitFunctionOptions,
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
  type TexRenderer,
  Tex,
  type TexOptions,
  ensureKatexStyles,
  areKatexStylesLoaded,
  // MathJax renderer (full LaTeX support, dynamic import)
  renderLatexToSVG,
  preloadMathJax,
  isMathJaxLoaded,
  katexCanRender,
  type MathJaxRenderOptions,
  type MathJaxRenderResult,
  // SVG path parser
  parseSVGPathData,
  svgToVMobjects,
  type SVGToVMobjectOptions,
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
  // Textured surfaces
  TexturedSurface,
  texturedSphere,
  type TexturedSurfaceOptions,
  type TexturedSphereOptions,
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
export { ImageMobject, type ImageMobjectOptions, type ImageFilterOptions } from './mobjects/image';

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

// Fractal mobjects
export {
  MandelbrotSet,
  type MandelbrotSetOptions,
  NewtonFractal,
  type NewtonFractalOptions,
} from './mobjects/fractals';

// Probability mobjects
export {
  SampleSpace,
  type SampleSpaceOptions,
  type Partition,
  type DivideOptions,
  type BraceAnnotationOptions,
  DiceFace,
  createDiceRow,
  type DiceFaceOptions,
} from './mobjects/probability';

// Animations
export { Animation, type AnimationOptions, type RateFunction } from './animation/Animation';
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
export {
  Transform,
  transform,
  ReplacementTransform,
  replacementTransform,
  MoveToTarget,
  moveToTarget,
} from './animation/transform';
export { ApplyPointwiseFunction, applyPointwiseFunction } from './animation/transform';
export { FadeToColor, fadeToColor, type FadeToColorOptions } from './animation/transform';
export { Restore, restore } from './animation/transform';
export { ScaleInPlace, type ScaleInPlaceOptions } from './animation/transform';

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
  // Homotopy animations
  Homotopy,
  homotopy,
  ComplexHomotopy,
  complexHomotopy,
  SmoothedVectorizedHomotopy,
  smoothedVectorizedHomotopy,
  PhaseFlow,
  phaseFlow,
  type HomotopyFunction,
  type ComplexHomotopyFunction,
  type VectorFieldFunction,
  type HomotopyOptions,
  type ComplexHomotopyOptions,
  type SmoothedVectorizedHomotopyOptions,
  type PhaseFlowOptions,
} from './animation/movement';

// Animation utilities
export {
  AnimationGroup,
  animationGroup,
  type AnimationGroupOptions,
} from './animation/AnimationGroup';
export { LaggedStart, laggedStart, type LaggedStartOptions } from './animation/LaggedStart';
export { Succession, succession, type SuccessionOptions } from './animation/Succession';

// Updater animations
export { UpdateFromFunc, updateFromFunc } from './animation/UpdateFromFunc';
export { UpdateFromAlphaFunc, updateFromAlphaFunc } from './animation/UpdateFromAlphaFunc';
export { maintainPositionRelativeTo } from './animation/MaintainPositionRelativeTo';

// Utility animations
export {
  Rotating,
  rotating,
  type RotatingOptions,
  Broadcast,
  broadcast,
  type BroadcastOptions,
} from './animation/utility';

// Indication animations
export {
  Indicate,
  indicate,
  type IndicateOptions,
  Flash,
  flash,
  type FlashOptions,
  Circumscribe,
  circumscribe,
  type CircumscribeOptions,
  type CircumscribeShape,
  Wiggle,
  wiggle,
  type WiggleOptions,
  ShowPassingFlash,
  showPassingFlash,
  type ShowPassingFlashOptions,
  ApplyWave,
  applyWave,
  type ApplyWaveOptions,
  type WaveDirection,
  FocusOn,
  focusOn,
  type FocusOnOptions,
  Pulse,
  pulse,
  type PulseOptions,
  ShowCreationThenDestruction,
  showCreationThenDestruction,
  type ShowCreationThenDestructionOptions,
  WiggleOutThenIn,
  wiggleOutThenIn,
  type WiggleOutThenInOptions,
} from './animation/indication';

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

// Interaction - Selection
export { SelectionManager, type SelectionManagerOptions } from './interaction';

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

// Rendering (GPU Bezier SDF shaders)
export {
  createBezierShaderMaterial,
  updateBezierMaterialResolution,
  type BezierShaderMaterialOptions,
  BezierRenderer,
  type BezierRendererOptions,
  type BezierSegment,
} from './rendering';

// Performance utilities
export {
  PerformanceMonitor,
  createPerformanceMonitor,
  FrameTimeTracker,
  createFrameTimeTracker,
} from './utils/Performance';

// ODE solver utilities
export {
  rk4Step,
  solveIVP,
  flowPoint,
  flowPointTrajectory,
  type ODEFunction,
  type VectorFieldFunction3D,
  type SolveIVPOptions,
  type IVPResult,
} from './utils/ode';

// Hungarian algorithm utilities
export { hungarian, hungarianFromSimilarity, type HungarianResult } from './utils/hungarian';

// Skeletonization utilities (medial axis extraction for glyph stroke animation)
export { skeletonizeGlyph, type SkeletonizeOptions } from './utils/skeletonize';

// Polygon triangulation utilities (earcut-based, for robust SVG fill)
export {
  triangulatePolygon,
  triangulatePolygonPositions,
  signedArea2D,
  ensureCCW,
  ensureCW,
} from './utils/triangulate';

// Vector math utilities
export { scaleVec, addVec, subVec, linspace } from './utils/vectors';

// Feature flags
export {
  isFeatureEnabled,
  setFeatureFlags,
  resetFeatureFlags,
  getFeatureFlags,
} from './utils/featureFlags';
