// Core animation classes
export { Animation, type AnimationOptions } from './Animation';
export { Timeline, type PositionParam } from './Timeline';

// Animation utilities
export {
  AnimationGroup,
  animationGroup,
  type AnimationGroupOptions
} from './AnimationGroup';
export {
  LaggedStart,
  laggedStart,
  type LaggedStartOptions
} from './LaggedStart';
export {
  Succession,
  succession,
  type SuccessionOptions
} from './Succession';

// Composition animations
export {
  LaggedStartMap,
  laggedStartMap,
  type LaggedStartMapOptions,
  type AnimationClass
} from './composition';

// Fading animations
export { FadeIn, fadeIn, FadeOut, fadeOut } from './fading';

// Creation animations
export {
  Create,
  create,
  DrawBorderThenFill,
  drawBorderThenFill,
  Uncreate,
  uncreate,
  // Write animations for text
  Write,
  write,
  Unwrite,
  unwrite,
  // Letter-by-letter animations
  AddTextLetterByLetter,
  addTextLetterByLetter,
  RemoveTextLetterByLetter,
  removeTextLetterByLetter,
  // Extended creation animations
  AddTextWordByWord,
  addTextWordByWord,
  type AddTextWordByWordOptions,
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
  // Types
  type WriteOptions,
  type AddTextLetterByLetterOptions,
} from './creation';

// Transform animations
export {
  Transform,
  transform,
  ReplacementTransform,
  replacementTransform,
  MoveToTarget,
  moveToTarget,
  type MobjectWithTarget,
  // Extended transform animations
  ApplyFunction,
  applyFunction,
  type ApplyFunctionOptions,
  ApplyMethod,
  applyMethod,
  type ApplyMethodOptions,
  ApplyMatrix,
  applyMatrix,
  type ApplyMatrixOptions,
  FadeTransform,
  fadeTransform,
  type FadeTransformOptions,
  FadeTransformPieces,
  fadeTransformPieces,
  type FadeTransformPiecesOptions,
  TransformFromCopy,
  transformFromCopy,
  type TransformFromCopyOptions,
  ClockwiseTransform,
  clockwiseTransform,
  type ClockwiseTransformOptions,
  CounterclockwiseTransform,
  counterclockwiseTransform,
  type CounterclockwiseTransformOptions,
  Swap,
  swap,
  type SwapOptions,
  CyclicReplace,
  cyclicReplace,
  type CyclicReplaceOptions,
  ScaleInPlace,
  scaleInPlace,
  type ScaleInPlaceOptions,
  ShrinkToCenter,
  shrinkToCenter,
  type ShrinkToCenterOptions,
  Restore,
  restore,
  type MobjectWithSavedState,
  type RestoreOptions,
  FadeToColor,
  fadeToColor,
  type FadeToColorOptions,
  // ApplyPointwiseFunction (for Groups)
  ApplyPointwiseFunction,
  applyPointwiseFunction,
  type ApplyPointwiseFunctionOptions,
} from './transform';

// Movement animations
export {
  Rotate,
  rotate,
  type RotateOptions,
  Scale,
  scale,
  // GrowFromCenter exported from growing module
  type ScaleOptions,
  Shift,
  shift,
  MoveToTargetPosition,
  moveToTargetPosition,
  type ShiftOptions,
  type MoveToTargetPositionOptions,
  type MobjectWithTargetPosition,
  MoveAlongPath,
  moveAlongPath,
  type MoveAlongPathOptions,
} from './movement';

// Updater animations
export { UpdateFromFunc, updateFromFunc } from './UpdateFromFunc';
export { UpdateFromAlphaFunc, updateFromAlphaFunc } from './UpdateFromAlphaFunc';
export { maintainPositionRelativeTo } from './MaintainPositionRelativeTo';

// Indication animations
export {
  // Indicate - scale up/down with color change
  Indicate,
  indicate,
  type IndicateOptions,
  // Flash - radiating flash lines
  Flash,
  flash,
  type FlashOptions,
  // Circumscribe - draw shape around object
  Circumscribe,
  circumscribe,
  type CircumscribeOptions,
  type CircumscribeShape,
  // Wiggle - wiggle back and forth
  Wiggle,
  wiggle,
  type WiggleOptions,
  // ShowPassingFlash - flash traveling along path
  ShowPassingFlash,
  showPassingFlash,
  type ShowPassingFlashOptions,
  // ApplyWave - wave distortion
  ApplyWave,
  applyWave,
  type ApplyWaveOptions,
  type WaveDirection,
  // FocusOn - converging rings focus effect
  FocusOn,
  focusOn,
  type FocusOnOptions,
  // Pulse - simple scale pulse
  Pulse,
  pulse,
  type PulseOptions,
} from './indication';

// Growing animations
export {
  // GrowFromCenter is also in movement, re-exported for convenience
  GrowFromCenter,
  growFromCenter,
  type GrowFromCenterOptions,
  // GrowArrow - arrow extends from start
  GrowArrow,
  growArrow,
  type GrowArrowOptions,
  // GrowFromEdge - grow from specific edge
  GrowFromEdge,
  growFromEdge,
  type GrowFromEdgeOptions,
  // GrowFromPoint - grow from specific point
  GrowFromPoint,
  growFromPoint,
  type GrowFromPointOptions,
  // SpinInFromNothing - spin + scale from nothing
  SpinInFromNothing,
  spinInFromNothing,
  type SpinInFromNothingOptions,
} from './growing';

// Number animations
export {
  // ChangingDecimal - animate value from start to end
  ChangingDecimal,
  changingDecimal,
  type ChangingDecimalOptions,
  // ChangeDecimalToValue - animate to target value
  ChangeDecimalToValue,
  changeDecimalToValue,
  type ChangeDecimalToValueOptions,
} from './numbers';

// Changing animations (path tracing, animated boundaries)
export {
  // TracedPath - creates a trail behind a moving mobject
  TracedPath,
  tracedPath,
  type TracedPathOptions,
  // AnimatedBoundary - marching ants boundary effect
  AnimatedBoundary,
  animatedBoundary,
  type AnimatedBoundaryOptions,
} from './changing';

// Utility animations (sequencing, control flow)
export {
  // Add - instantly adds a mobject
  Add,
  add,
  type AddOptions,
  // Remove - instantly removes/hides a mobject
  Remove,
  remove,
  type RemoveOptions,
  // Wait - pause/delay
  Wait,
  wait,
  type WaitOptions,
  // Rotating - continuous rotation updater
  Rotating,
  rotating,
  type RotatingOptions,
  // Broadcast - ripple/broadcast effect
  Broadcast,
  broadcast,
  type BroadcastOptions,
} from './utility';

// Speed-related animations (playback speed control)
export {
  // ChangeSpeed - modify animation speed during playback
  ChangeSpeed,
  changeSpeed,
  type ChangeSpeedOptions,
  type SpeedFunction,
  // Predefined speed functions
  linearSpeedRamp,
  emphasizeRegion,
  rushRegion,
  smoothSpeedCurve,
} from './speed';
