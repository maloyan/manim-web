/**
 * Re-export barrel for backward compatibility.
 * The implementations have been split into separate files:
 * - ApplyTransforms.ts: ApplyFunction, ApplyMethod, ApplyMatrix
 * - FadeTransforms.ts: FadeTransform, FadeTransformPieces, TransformFromCopy
 * - MovementTransforms.ts: ClockwiseTransform, CounterclockwiseTransform, Swap, CyclicReplace
 * - SpecialTransforms.ts: ScaleInPlace, ShrinkToCenter, Restore, FadeToColor, TransformAnimations
 */

// ApplyTransforms
export {
  ApplyFunction,
  applyFunction,
  type ApplyFunctionOptions,
  ApplyMatrix,
  applyMatrix,
  type ApplyMatrixOptions,
  ApplyMethod,
  applyMethod,
  type ApplyMethodOptions,
} from "./ApplyTransforms";

// FadeTransforms
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
} from "./FadeTransforms";

// MovementTransforms
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
} from "./MovementTransforms";

// SpecialTransforms
export {
  FadeToColor,
  fadeToColor,
  type FadeToColorOptions,
  type MobjectWithSavedState,
  Restore,
  restore,
  type RestoreOptions,
  ScaleInPlace,
  scaleInPlace,
  type ScaleInPlaceOptions,
  ShrinkToCenter,
  shrinkToCenter,
  type ShrinkToCenterOptions,
  TransformAnimations,
  transformAnimations,
  type TransformAnimationsOptions,
} from "./SpecialTransforms";
