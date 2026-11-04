/**
 * Interaction module for manimweb.
 * Provides UI controls for interactive scene manipulation and playback.
 */

export {
  Controls,
  type ControlsOptions,
  type ControlsPosition,
  type ControlsTheme,
  type SliderConfig,
  type ButtonConfig,
  type CheckboxConfig,
  type ColorPickerConfig,
} from './Controls';

export {
  PlaybackControls,
  type PlaybackControlsOptions,
  type TimeUpdateCallback,
} from './PlaybackControls';

// Mobject interaction behaviors
export { Draggable, makeDraggable, type DraggableOptions } from './Draggable';
export { Hoverable, makeHoverable, type HoverableOptions } from './Hoverable';
export { Clickable, makeClickable, type ClickableOptions } from './Clickable';

// Explorable interactivity
export { MovablePoint, makeMovablePoint, type MovablePointOptions } from './MovablePoint';
export { Slider, makeSlider, type SliderOptions } from './Slider';
export {
  Scrubbable,
  makeScrubbable,
  makeScrubbableEntries,
  type ScrubbableOptions,
} from './Scrubbable';
export { Tangle, makeTangle, type TangleOptions } from './Tangle';

// Dynamic (continuous) matrix transformations
export {
  MatrixTracker,
  makeMatrixTracker,
  applyMatrixLive,
  type Matrix2x2,
  type Matrix3x3,
  type LiveMatrix,
  type MatrixSource,
  type BasisVectorSource,
  type DependentPoint,
  type DynamicMatrixOptions,
  type LiveMatrixBinding,
} from './DynamicMatrix';

// Selection
export { SelectionManager, type SelectionManagerOptions } from './SelectionManager';

// State machine (input-driven, Rive-style)
export {
  StateMachine,
  GuardBuilder,
  when,
  allOf,
  anyOf,
  type InputValue,
  type InputKind,
  type InputsSnapshot,
  type Guard,
  type StateContext,
  type StateAction,
  type StateConfig,
  type TransitionConfig,
  type StateMachineOptions,
} from './StateMachine';

// Keyboard input (general-purpose, for interactive apps and games)
export {
  KeyboardInput,
  makeKeyboardInput,
  normalizeKey,
  type KeyboardInputOptions,
  type KeyCallback,
  type Unsubscribe,
  type StateMachineInputSink,
  type ValueSink,
  type BindValueOptions,
} from './KeyboardInput';

// Gamepad input (Web Gamepad API, for interactive apps and games)
export {
  GamepadInput,
  makeGamepadInput,
  resolveButton,
  isGamepadSupported,
  STANDARD_BUTTONS,
  STANDARD_AXES,
  type GamepadInputOptions,
  type GamepadButtonLike,
  type GamepadLike,
  type GamepadSource,
  type GamepadButtonCallback,
} from './GamepadInput';

// Camera controls
export { OrbitControls, type OrbitControlsOptions } from './OrbitControls';
export {
  PanZoomControls,
  makePanZoomControls,
  type PanZoomControlsOptions,
  type PanZoomCamera,
  type PanZoomBounds,
} from './PanZoomControls';
