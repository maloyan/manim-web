export {
  Transform,
  transform,
  ReplacementTransform,
  replacementTransform,
  MoveToTarget,
  moveToTarget,
  type MobjectWithTarget,
} from './Transform';

export {
  // ApplyFunction
  ApplyFunction,
  applyFunction,
  type ApplyFunctionOptions,

  // ApplyMethod
  ApplyMethod,
  applyMethod,
  type ApplyMethodOptions,

  // ApplyMatrix
  ApplyMatrix,
  applyMatrix,
  type ApplyMatrixOptions,

  // ApplyComplexFunction
  ApplyComplexFunction,
  applyComplexFunction,
  type ApplyComplexFunctionOptions,
} from './ApplyTransforms';

export {
  // FadeTransform
  FadeTransform,
  fadeTransform,
  type FadeTransformOptions,

  // FadeTransformPieces
  FadeTransformPieces,
  fadeTransformPieces,
  type FadeTransformPiecesOptions,

  // TransformFromCopy
  TransformFromCopy,
  transformFromCopy,
  type TransformFromCopyOptions,
} from './FadeTransforms';

export {
  // ClockwiseTransform
  ClockwiseTransform,
  clockwiseTransform,
  type ClockwiseTransformOptions,

  // CounterclockwiseTransform
  CounterclockwiseTransform,
  counterclockwiseTransform,
  type CounterclockwiseTransformOptions,

  // Swap
  Swap,
  swap,
  type SwapOptions,

  // CyclicReplace
  CyclicReplace,
  cyclicReplace,
  type CyclicReplaceOptions,
} from './MovementTransforms';

export {
  // ScaleInPlace
  ScaleInPlace,
  scaleInPlace,
  type ScaleInPlaceOptions,

  // ShrinkToCenter
  ShrinkToCenter,
  shrinkToCenter,
  type ShrinkToCenterOptions,

  // Restore
  Restore,
  restore,
  type MobjectWithSavedState,
  type RestoreOptions,

  // FadeToColor
  FadeToColor,
  fadeToColor,
  type FadeToColorOptions,

  // TransformAnimations (Meta-Animation)
  TransformAnimations,
  transformAnimations,
  type TransformAnimationsOptions,
} from './SpecialTransforms';

export {
  TransformMatchingAbstractBase,
  type TransformMatchingBaseOptions,
} from './TransformMatchingBase';

export {
  // TransformMatchingShapes
  TransformMatchingShapes,
  transformMatchingShapes,
  type TransformMatchingShapesOptions,

  // TransformMatchingTex
  TransformMatchingTex,
  transformMatchingTex,
  type TransformMatchingTexOptions,
} from './TransformMatching';

export {
  ApplyPointwiseFunction,
  applyPointwiseFunction,
  type ApplyPointwiseFunctionOptions,
} from './ApplyPointwiseFunction';

export {
  ApplyPointwiseFunctionToCenter,
  applyPointwiseFunctionToCenter,
  type ApplyPointwiseFunctionToCenterOptions,
} from './ApplyPointwiseFunctionToCenter';
