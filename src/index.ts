// Colors
export * from "./constants/colors";
export {
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_FONT_SIZE,
  DEFAULT_FPS,
  DEFAULT_FRAME_HEIGHT,
  DEFAULT_FRAME_WIDTH,
  DEFAULT_MOBJECT_TO_EDGE_BUFFER,
  DEFAULT_MOBJECT_TO_MOBJECT_BUFFER,
  DEFAULT_PIXEL_HEIGHT,
  DEFAULT_PIXEL_WIDTH,
  DEFAULT_STROKE_WIDTH,
  LARGE_BUFF,
  MED_LARGE_BUFF,
  MED_SMALL_BUFF,
  SMALL_BUFF,
} from "./constants";

// TeX Templates
export {
  TexFontTemplates,
  TexTemplate,
  TexTemplateLibrary,
  type TexTemplateOptions,
} from "./utils/tex-templates";

// Core
export {
  Mobject,
  type MobjectStyle,
  type UpdaterFunction,
  type Vector3Tuple,
} from "./core/Mobject";
export { AnimateProxy } from "./core/AnimateProxy";
export {
  DL,
  DOWN,
  DR,
  IN,
  LEFT,
  ORIGIN,
  OUT,
  RIGHT,
  UL,
  UP,
  UR,
} from "./core/Mobject";
export { type Point, VMobject } from "./core/VMobject";
export { VGroup } from "./core/VGroup";
export { VDict, VectorizedPoint } from "./core/VDict";
export { Group } from "./core/Group";
export {
  Scene,
  type SceneExportOptions,
  type SceneOptions,
} from "./core/Scene";
export {
  InteractiveScene,
  type InteractiveSceneOptions,
} from "./core/InteractiveScene";
export { ThreeDScene, type ThreeDSceneOptions } from "./core/ThreeDScene";
export {
  ZoomDisplayPopOut,
  ZoomedScene,
  type ZoomedSceneOptions,
} from "./core/ZoomedScene";
export {
  MovingCameraScene,
  type MovingCameraSceneOptions,
} from "./core/MovingCameraScene";
export { VectorScene, type VectorSceneOptions } from "./core/VectorScene";
export {
  LinearTransformationScene,
  type LinearTransformationSceneOptions,
  type Matrix2D,
} from "./core/LinearTransformationScene";
export {
  type AddSoundOptions,
  AudioManager,
  type AudioTrack,
} from "./core/AudioManager";
export {
  type IRenderer,
  Renderer,
  type RendererOptions,
} from "./core/Renderer";
export { NullRenderer } from "./core/NullRenderer";
export {
  deserializeMobject,
  type MobjectState,
  restoreMobjectState,
  saveMobjectState,
  type SceneSnapshot,
  SceneStateManager,
  serializeMobject,
  snapshotFromJSON,
  snapshotToJSON,
  stateFromJSON,
  stateToJSON,
} from "./core/StateManager";
export {
  Camera2D,
  type Camera2DAspectMode,
  Camera3D,
  type Camera3DOptions,
  type CameraOptions,
} from "./core/Camera";
export { Camera2DFrame } from "./core/Camera2DFrame";
export {
  type CameraEntry,
  type CameraViewport,
  MappingCamera,
  type MappingCameraOptions,
  type MappingFunction,
  MovingCamera,
  type MovingCameraOptions,
  MultiCamera,
  type MultiCameraOptions,
  SplitScreenCamera,
  type SplitScreenCameraOptions,
  ThreeDCamera,
  type ThreeDCameraOptions,
} from "./core/CameraExtensions";
export {
  CameraAnimateProxy,
  type CameraAnimationOptions,
  CameraFrame,
  type CameraFrameOptions,
  type CameraFrameState,
} from "./core/CameraFrame";
export {
  type AmbientLightOptions,
  type DirectionalLightOptions,
  Lighting,
  type PointLightOptions,
  type SpotLightOptions,
} from "./core/Lighting";

// Geometry
export {
  // Angle shapes
  Angle,
  type AngleInput,
  type AngleOptions,
  AnnotationDot,
  type AnnotationDotOptions,
  AnnularSector,
  type AnnularSectorOptions,
  Annulus,
  type AnnulusOptions,
  Arc,
  ArcBetweenPoints,
  type ArcBetweenPointsOptions,
  type ArcConfig,
  type ArcOptions,
  ArcPolygon,
  type ArcPolygonOptions,
  Arrow,
  ArrowCircleFilledTip,
  ArrowCircleTip,
  type ArrowOptions,
  ArrowSquareFilledTip,
  ArrowSquareTip,
  // Arrow tips
  ArrowTip,
  type ArrowTipOptions,
  ArrowTriangleFilledTip,
  ArrowTriangleTip,
  BackgroundRectangle,
  type BackgroundRectangleOptions,
  type BooleanOperationOptions,
  BooleanResult,
  Circle,
  type CircleOptions,
  ConvexHull,
  type ConvexHullOptions,
  Cross,
  type CrossOptions,
  CubicBezier,
  type CubicBezierOptions,
  // Cubic bezier points type
  type CubicBezierPoints,
  CurvedArrow,
  type CurvedArrowOptions,
  CurvedDoubleArrow,
  Cutout,
  type CutoutOptions,
  DashedLine,
  type DashedLineOptions,
  DashedVMobject,
  type DashedVMobjectOptions,
  Difference,
  difference,
  Dot,
  type DotOptions,
  DoubleArrow,
  Elbow,
  type ElbowOptions,
  // Arc-based shapes
  Ellipse,
  type EllipseOptions,
  Exclusion,
  exclusion,
  Hexagon,
  Intersection,
  intersection,
  type LabelDirection,
  LabeledArrow,
  type LabeledArrowOptions,
  LabeledDot,
  type LabeledDotOptions,
  LabeledLine,
  type LabeledLineOptions,
  // Labeled geometry
  LabeledPolygram,
  type LabeledPolygramOptions,
  type LabelOrientation,
  LargeDot,
  Line,
  type LineOptions,
  Pentagon,
  Polygon,
  type PolygonOptions,
  Polygram,
  type PolygramOptions,
  Rectangle,
  type RectangleOptions,
  RegularPolygon,
  RegularPolygram,
  type RegularPolygramOptions,
  RightAngle,
  type RightAngleOptions,
  // Extended polygon shapes
  RoundedRectangle,
  type RoundedRectangleOptions,
  Sector,
  type SectorOptions,
  SmallDot,
  Square,
  Star,
  type StarOptions,
  StealthTip,
  SurroundingRectangle,
  type SurroundingRectangleOptions,
  TangentialArc,
  type TangentialArcOptions,
  TangentLine,
  type TangentLineOptions,
  TipableVMobject,
  type TipableVMobjectOptions,
  type TipOptions,
  Triangle,
  Underline,
  type UnderlineOptions,
  // Boolean operations
  Union,
  union,
  Vector,
} from "./mobjects/geometry";

// Graphing
export {
  ArrowVectorField,
  type ArrowVectorFieldOptions,
  Axes,
  type AxesOptions,
  type BackgroundLineStyle,
  BarChart,
  type BarChartOptions,
  type ColorFunction,
  ComplexPlane,
  type ComplexPlaneOptions,
  type ContinuousMotionOptions,
  FunctionGraph,
  type FunctionGraphOptions,
  ImplicitFunction,
  type ImplicitFunctionOptions,
  NumberLine,
  type NumberLineOptions,
  NumberPlane,
  type NumberPlaneOptions,
  ParametricFunction,
  type ParametricFunctionOptions,
  PolarPlane,
  type PolarPlaneOptions,
  StreamLines,
  type StreamLinesOptions,
  UnitInterval,
  type UnitIntervalOptions,
  VectorField,
  type VectorFieldBaseOptions,
  VectorFieldVector,
  type VectorFieldVectorOptions,
  type VectorFunction,
} from "./mobjects/graphing";

// Text and LaTeX
export {
  areKatexStylesLoaded,
  // Extended text
  BulletedList,
  type BulletedListOptions,
  // Code blocks
  Code,
  type CodeColorScheme,
  type CodeOptions,
  DecimalNumber,
  type DecimalNumberOptions,
  DEFAULT_COLOR_SCHEME,
  ensureKatexStyles,
  GlyphVMobject,
  type GlyphVMobjectOptions,
  Integer,
  isMathJaxLoaded,
  katexCanRender,
  MarkdownText,
  type MarkdownTextOptions,
  MarkupText,
  type MarkupTextOptions,
  type MathJaxRenderOptions,
  type MathJaxRenderResult,
  // MathTex - SVG vector-based (default, like Python Manim)
  MathTex,
  // MathTexImage - rasterized texture-based renderer
  MathTexImage,
  type MathTexImageOptions,
  type MathTexOptions,
  MathTexPart,
  type MathTexPartOptions,
  // MathTexSVG - deprecated alias for MathTex (backwards compat)
  MathTexSVG,
  type MathTexSVGOptions,
  MONOKAI_COLOR_SCHEME,
  Paragraph,
  type ParagraphOptions,
  // SVG path parser
  parseSVGPathData,
  preloadMathJax,
  // MathJax renderer (full LaTeX support, dynamic import)
  renderLatexToSVG,
  // MathTexParts
  SingleStringMathTex,
  type SingleStringMathTexOptions,
  type StyledTextSegment,
  type SVGToVMobjectOptions,
  svgToVMobjects,
  Tex,
  type TexOptions,
  type TexRenderer,
  Text,
  TextGlyphGroup,
  type TextGlyphGroupOptions,
  type TextOptions,
  Title,
  type TitleOptions,
  type Token,
  type TokenType,
  Variable,
  type VariableOptions,
} from "./mobjects/text";

// 3D Mobjects
export {
  Arrow3D,
  type Arrow3DOptions,
  Box3D,
  type Box3DOptions,
  Cone,
  type ConeOptions,
  // Convex hull
  ConvexHull3D,
  type ConvexHull3DOptions,
  Cube,
  type CubeOptions,
  Cylinder,
  type CylinderOptions,
  Dodecahedron,
  type DodecahedronOptions,
  Dot3D,
  type Dot3DOptions,
  Icosahedron,
  type IcosahedronOptions,
  // Lines and arrows
  Line3D,
  type Line3DOptions,
  // Shared 3D mesh base class
  Mobject3D,
  Octahedron,
  type OctahedronOptions,
  ParametricSurface,
  type ParametricSurfaceOptions,
  // Platonic solids
  Polyhedron,
  type PolyhedronOptions,
  // Additional 3D primitives
  Prism,
  type PrismOptions,
  // Basic 3D primitives
  Sphere,
  type SphereOptions,
  // Surfaces
  Surface3D,
  type Surface3DOptions,
  SurfacePresets,
  Tetrahedron,
  type TetrahedronOptions,
  texturedSphere,
  type TexturedSphereOptions,
  // Textured surfaces
  TexturedSurface,
  type TexturedSurfaceOptions,
  // Coordinate systems
  ThreeDAxes,
  type ThreeDAxesOptions,
  ThreeDVMobject,
  type ThreeDVMobjectOptions,
  Torus,
  type TorusOptions,
  Vector3D,
} from "./mobjects/three-d";

// Value Trackers
export {
  type Complex,
  ComplexValueTracker,
  complexValueTracker,
  type ComplexValueTrackerOptions,
  ValueTracker,
  valueTracker,
  type ValueTrackerOptions,
} from "./mobjects/value-tracker";

// Matrix
export {
  type BracketType,
  DecimalMatrix,
  type DecimalMatrixOptions,
  type ElementAlignment,
  getDetText,
  type GetDetTextOptions,
  IntegerMatrix,
  type IntegerMatrixOptions,
  Matrix,
  type MatrixOptions,
  matrixToMobject,
  matrixToTexString,
  MobjectMatrix,
  type MobjectMatrixOptions,
} from "./mobjects/matrix";

// Logo
export { ManimBanner, type ManimBannerOptions } from "./mobjects/logo";

// Table
export {
  DecimalTable,
  type DecimalTableOptions,
  IntegerTable,
  type IntegerTableOptions,
  MathTable,
  type MathTableOptions,
  MobjectTable,
  type MobjectTableOptions,
  Table,
  type TableOptions,
} from "./mobjects/table";

// SVG-based mobjects (Braces)
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
  // SVG parsing
  SVGMobject,
  svgMobject,
  type SVGMobjectOptions,
  VMobjectFromSVGPath,
  type VMobjectFromSVGPathOptions,
} from "./mobjects/svg";

// Graph mobjects for network visualization
export {
  binaryTree,
  bipartiteGraph,
  // Helper functions for common graph types
  completeGraph,
  computeCircularLayout,
  // Layout algorithms
  computeLayout,
  cycleGraph,
  DiGraph,
  type DiGraphOptions,
  type EdgeConfig,
  type EdgeStyleOptions,
  type EdgeTuple,
  // Core graph classes
  GenericGraph,
  type GenericGraphOptions,
  Graph,
  gridGraph,
  type LayoutConfig,
  type LayoutType,
  pathGraph,
  starGraph,
  type VertexConfig,
  // Types
  type VertexId,
  type VertexStyleOptions,
} from "./mobjects/graph";

// Image mobjects
export {
  type ImageFilterOptions,
  ImageMobject,
  type ImageMobjectOptions,
} from "./mobjects/image";

// Frame/Screen mobjects
export {
  createFadeToBlack,
  createFadeToWhite,
  DEFAULT_ASPECT_RATIO,
  FullScreenFadeRectangle,
  type FullScreenFadeRectangleOptions,
  FullScreenRectangle,
  type FullScreenRectangleOptions,
  ScreenRectangle,
  type ScreenRectangleOptions,
} from "./mobjects/frame";

// Point-based mobjects (particles)
export {
  type Distribution2D,
  Mobject1D,
  type Mobject1DOptions,
  Mobject2D,
  type Mobject2DOptions,
  PGroup,
  type PGroupOptions,
  PMobject,
  type PMobjectOptions,
  PointCloudDot,
  type PointCloudDotOptions,
  type PointData,
  PointMobject,
  type PointMobjectOptions,
} from "./mobjects/point";

// Fractal mobjects
export {
  MandelbrotSet,
  type MandelbrotSetOptions,
  NewtonFractal,
  type NewtonFractalOptions,
} from "./mobjects/fractals";

// Probability mobjects
export {
  type BraceAnnotationOptions,
  createDiceRow,
  DiceFace,
  type DiceFaceOptions,
  type DivideOptions,
  type Partition,
  SampleSpace,
  type SampleSpaceOptions,
} from "./mobjects/probability";

// Animations
export {
  Animation,
  type AnimationOptions,
  type RateFunction,
} from "./animation/Animation";
export { type PositionParam, Timeline } from "./animation/Timeline";
export {
  MasterTimeline,
  masterTimeline,
  type Segment,
  type Slide,
  type SlideOptions,
} from "./animation/MasterTimeline";

// Animation types
export { FadeIn, fadeIn, FadeOut, fadeOut } from "./animation/fading";
export {
  AddTextLetterByLetter,
  addTextLetterByLetter,
  type AddTextLetterByLetterOptions,
  AddTextWordByWord,
  addTextWordByWord,
  type AddTextWordByWordOptions,
  Create,
  create,
  type CreateOptions,
  DrawBorderThenFill,
  drawBorderThenFill,
  RemoveTextLetterByLetter,
  removeTextLetterByLetter,
  ShowIncreasingSubsets,
  showIncreasingSubsets,
  type ShowIncreasingSubsetsOptions,
  ShowPartial,
  showPartial,
  type ShowPartialOptions,
  ShowSubmobjectsOneByOne,
  showSubmobjectsOneByOne,
  type ShowSubmobjectsOneByOneOptions,
  SpiralIn,
  spiralIn,
  type SpiralInOptions,
  TypeWithCursor,
  typeWithCursor,
  type TypeWithCursorOptions,
  Uncreate,
  uncreate,
  UntypeWithCursor,
  untypeWithCursor,
  type UntypeWithCursorOptions,
  Unwrite,
  unwrite,
  Write,
  write,
  type WriteOptions,
} from "./animation/creation";
export {
  MoveToTarget,
  moveToTarget,
  ReplacementTransform,
  replacementTransform,
  Transform,
  transform,
} from "./animation/transform";
export {
  ApplyPointwiseFunction,
  applyPointwiseFunction,
  type ApplyPointwiseFunctionOptions,
} from "./animation/transform";
export {
  ApplyPointwiseFunctionToCenter,
  applyPointwiseFunctionToCenter,
  type ApplyPointwiseFunctionToCenterOptions,
} from "./animation/transform";
export {
  ApplyFunction,
  applyFunction,
  type ApplyFunctionOptions,
} from "./animation/transform";
export {
  ApplyMethod,
  applyMethod,
  type ApplyMethodOptions,
} from "./animation/transform";
export {
  ApplyMatrix,
  applyMatrix,
  type ApplyMatrixOptions,
} from "./animation/transform";
export {
  ApplyComplexFunction,
  applyComplexFunction,
  type ApplyComplexFunctionOptions,
} from "./animation/transform";
export {
  FadeTransform,
  fadeTransform,
  type FadeTransformOptions,
  FadeTransformPieces,
  fadeTransformPieces,
  type FadeTransformPiecesOptions,
  TransformFromCopy,
  transformFromCopy,
  type TransformFromCopyOptions,
} from "./animation/transform";
export {
  ClockwiseTransform,
  clockwiseTransform,
  type ClockwiseTransformOptions,
  CounterclockwiseTransform,
  counterclockwiseTransform,
  type CounterclockwiseTransformOptions,
  CyclicReplace,
  cyclicReplace,
  type CyclicReplaceOptions,
  Swap,
  swap,
  type SwapOptions,
} from "./animation/transform";
export {
  FadeToColor,
  fadeToColor,
  type FadeToColorOptions,
} from "./animation/transform";
export {
  type MobjectWithSavedState,
  Restore,
  restore,
  type RestoreOptions,
} from "./animation/transform";
export {
  ScaleInPlace,
  scaleInPlace,
  type ScaleInPlaceOptions,
  ShrinkToCenter,
  shrinkToCenter,
  type ShrinkToCenterOptions,
} from "./animation/transform";
export {
  TransformMatchingAbstractBase,
  type TransformMatchingBaseOptions,
} from "./animation/transform";
export {
  TransformMatchingShapes,
  transformMatchingShapes,
  type TransformMatchingShapesOptions,
  TransformMatchingTex,
  transformMatchingTex,
  type TransformMatchingTexOptions,
} from "./animation/transform";
export {
  TransformAnimations,
  transformAnimations,
  type TransformAnimationsOptions,
} from "./animation/transform";
export { type MobjectWithTarget } from "./animation/transform";

// Movement animations
export {
  ComplexHomotopy,
  complexHomotopy,
  type ComplexHomotopyFunction,
  type ComplexHomotopyOptions,
  GrowFromCenter,
  growFromCenter,
  type GrowFromCenterOptions,
  // Homotopy animations
  Homotopy,
  homotopy,
  type HomotopyFunction,
  type HomotopyOptions,
  type MobjectWithTargetPosition,
  MoveAlongPath,
  moveAlongPath,
  type MoveAlongPathOptions,
  MoveToTargetPosition,
  moveToTargetPosition,
  type MoveToTargetPositionOptions,
  PhaseFlow,
  phaseFlow,
  type PhaseFlowOptions,
  Rotate,
  rotate,
  type RotateOptions,
  Scale,
  scale,
  type ScaleOptions,
  Shift,
  shift,
  type ShiftOptions,
  SmoothedVectorizedHomotopy,
  smoothedVectorizedHomotopy,
  type SmoothedVectorizedHomotopyOptions,
  type VectorFieldFunction,
} from "./animation/movement";

// Growing animations
export {
  GrowArrow,
  growArrow,
  type GrowArrowOptions,
  GrowFromEdge,
  growFromEdge,
  type GrowFromEdgeOptions,
  GrowFromPoint,
  growFromPoint,
  type GrowFromPointOptions,
  SpinInFromNothing,
  spinInFromNothing,
  type SpinInFromNothingOptions,
} from "./animation/growing";

// Animation utilities
export {
  AnimationGroup,
  animationGroup,
  type AnimationGroupOptions,
} from "./animation/AnimationGroup";
export {
  LaggedStart,
  laggedStart,
  type LaggedStartOptions,
} from "./animation/LaggedStart";
export {
  Succession,
  succession,
  type SuccessionOptions,
} from "./animation/Succession";
export {
  type AnimationClass,
  LaggedStartMap,
  laggedStartMap,
  type LaggedStartMapOptions,
} from "./animation/composition";

// Animation override & prepare utilities
export {
  type AnimationOverrideFunc,
  clearAnimationOverrides,
  getAnimationOverride,
  hasAnimationOverride,
  overrideAnimation,
  prepareAnimation,
} from "./animation/AnimationUtilities";

// Updater animations
export { UpdateFromFunc, updateFromFunc } from "./animation/UpdateFromFunc";
export {
  UpdateFromAlphaFunc,
  updateFromAlphaFunc,
} from "./animation/UpdateFromAlphaFunc";
export { maintainPositionRelativeTo } from "./animation/MaintainPositionRelativeTo";

// Number animations
export {
  ChangeDecimalToValue,
  changeDecimalToValue,
  type ChangeDecimalToValueOptions,
  ChangingDecimal,
  changingDecimal,
  type ChangingDecimalOptions,
} from "./animation/numbers";

// Changing animations (path tracing, animated boundaries)
export {
  AnimatedBoundary,
  animatedBoundary,
  type AnimatedBoundaryOptions,
  TracedPath,
  tracedPath,
  type TracedPathOptions,
} from "./animation/changing";

// Speed animations
export {
  ChangeSpeed,
  changeSpeed,
  type ChangeSpeedOptions,
  emphasizeRegion,
  linearSpeedRamp,
  rushRegion,
  smoothSpeedCurve,
  type SpeedFunction,
} from "./animation/speed";

// Utility animations
export {
  Add,
  add,
  type AddOptions,
  Broadcast,
  broadcast,
  type BroadcastOptions,
  Remove,
  remove,
  type RemoveOptions,
  Rotating,
  rotating,
  type RotatingOptions,
  Wait,
  wait,
  type WaitOptions,
} from "./animation/utility";

// Indication animations
export {
  ApplyWave,
  applyWave,
  type ApplyWaveOptions,
  // Blink
  Blink,
  blink,
  type BlinkOptions,
  Circumscribe,
  circumscribe,
  type CircumscribeOptions,
  type CircumscribeShape,
  Flash,
  flash,
  type FlashOptions,
  FocusOn,
  focusOn,
  type FocusOnOptions,
  Indicate,
  indicate,
  type IndicateOptions,
  Pulse,
  pulse,
  type PulseOptions,
  ShowCreationThenDestruction,
  showCreationThenDestruction,
  type ShowCreationThenDestructionOptions,
  ShowPassingFlash,
  showPassingFlash,
  type ShowPassingFlashOptions,
  // ShowPassingFlashWithThinningStrokeWidth
  ShowPassingFlashWithThinningStrokeWidth,
  showPassingFlashWithThinningStrokeWidth,
  type ShowPassingFlashWithThinningStrokeWidthOptions,
  type WaveDirection,
  Wiggle,
  wiggle,
  type WiggleOptions,
  WiggleOutThenIn,
  wiggleOutThenIn,
  type WiggleOutThenInOptions,
} from "./animation/indication";

// Rate functions
export {
  compose,
  doubleSmooth,
  easeIn,
  // Back easing
  easeInBack,
  easeInBounce,
  // Circ easing
  easeInCirc,
  // Python Manim-compatible aliases
  easeInCubic,
  // Elastic easing
  easeInElastic,
  easeInExpo,
  easeInOut,
  easeInOutBack,
  // Bounce InOut
  easeInOutBounce,
  easeInOutCirc,
  easeInOutCubic,
  easeInOutElastic,
  // Expo InOut
  easeInOutExpo,
  // Quad InOut
  easeInOutQuad,
  easeInOutQuart,
  easeInOutQuint,
  easeInOutSine,
  easeInQuad,
  // Quart easing
  easeInQuart,
  // Quint easing
  easeInQuint,
  // Sine easing
  easeInSine,
  easeOut,
  easeOutBack,
  easeOutBounce,
  easeOutCirc,
  easeOutCubic,
  easeOutElastic,
  easeOutExpo,
  easeOutQuad,
  easeOutQuart,
  easeOutQuint,
  easeOutSine,
  exponentialDecay,
  linear,
  lingering,
  notQuiteThere,
  reverse,
  runningStart,
  rushFrom,
  rushInto,
  slowInto,
  smooth,
  smoothererstep,
  smootherstep,
  // Smoothstep family
  smoothstep,
  squishRateFunc,
  stepFunction,
  thereAndBack,
  thereAndBackWithPause,
  wiggle as wiggleRate,
} from "./rate-functions";

// Interaction - UI Controls
export {
  type ButtonConfig,
  type CheckboxConfig,
  type ColorPickerConfig,
  Controls,
  type ControlsOptions,
  type ControlsPosition,
  type ControlsTheme,
  PlaybackControls,
  type PlaybackControlsOptions,
  type SliderConfig,
  type TimeUpdateCallback,
} from "./interaction";

// Interaction - Mobject Behaviors
export {
  Clickable,
  type ClickableOptions,
  Draggable,
  type DraggableOptions,
  Hoverable,
  type HoverableOptions,
  makeClickable,
  makeDraggable,
  makeHoverable,
} from "./interaction";

// Interaction - Selection
export { SelectionManager, type SelectionManagerOptions } from "./interaction";

// Interaction - Camera Controls
export { OrbitControls, type OrbitControlsOptions } from "./interaction";

// Export
export {
  createGifExporter,
  createVideoExporter,
  GifExporter,
  type GifExportOptions,
  VideoExporter,
  type VideoExportOptions,
} from "./export";

// Vector math utilities
export {
  addVec,
  crossVec,
  dotVec,
  lengthVec,
  linspace,
  normalizeVec,
  orientation2D,
  orthonormalFrame,
  scaleVec,
  subVec,
  unitPerpendicularTo,
} from "./utils/vectors";

// Player
export { Player, type PlayerOptions } from "./player";
export {
  PlayerUI,
  type PlayerUICallbacks,
  type PlayerUIOptions,
} from "./player";
export { PlayerController, type PlayerControllerCallbacks } from "./player";

// Feature flags
export {
  getFeatureFlags,
  isFeatureEnabled,
  resetFeatureFlags,
  setFeatureFlags,
} from "./utils/featureFlags";

// Logging
export {
  type LogEntry,
  logger,
  type LogLevel,
  type LogListener,
  onLog,
} from "./utils/logger";
