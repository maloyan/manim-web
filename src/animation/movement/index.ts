// Movement animations

// Rotate
export {
  Rotate,
  rotate,
  type RotateOptions
} from './Rotate';

// Scale
export {
  Scale,
  scale,
  GrowFromCenter,
  growFromCenter,
  type ScaleOptions,
  type GrowFromCenterOptions
} from './Scale';

// Shift
export {
  Shift,
  shift,
  MoveToTargetPosition,
  moveToTargetPosition,
  type ShiftOptions,
  type MoveToTargetPositionOptions,
  type MobjectWithTargetPosition
} from './Shift';

// MoveAlongPath
export {
  MoveAlongPath,
  moveAlongPath,
  type MoveAlongPathOptions
} from './MoveAlongPath';

// Homotopy animations
export {
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
  type Complex,
  type HomotopyOptions,
  type ComplexHomotopyOptions,
  type SmoothedVectorizedHomotopyOptions,
  type PhaseFlowOptions
} from './Homotopy';
