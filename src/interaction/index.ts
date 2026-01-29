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

// Camera controls
export { OrbitControls, type OrbitControlsOptions } from './OrbitControls';
