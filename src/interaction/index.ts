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

// Dynamic (continuous) matrix transformations
export {
  MatrixTracker,
  makeMatrixTracker,
  applyMatrixLive,
  type Matrix2x2,
  type MatrixSource,
  type BasisVectorSource,
  type DependentPoint,
  type DynamicMatrixOptions,
  type LiveMatrixBinding,
} from './DynamicMatrix';

// Selection
export { SelectionManager, type SelectionManagerOptions } from './SelectionManager';

// Camera controls
export { OrbitControls, type OrbitControlsOptions } from './OrbitControls';
export {
  PanZoomControls,
  makePanZoomControls,
  type PanZoomControlsOptions,
  type PanZoomCamera,
  type PanZoomBounds,
} from './PanZoomControls';
