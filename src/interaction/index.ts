/**
 * Interaction module for manimweb.
 * Provides UI controls for interactive scene manipulation and playback.
 */

export {
  type ButtonConfig,
  type CheckboxConfig,
  type ColorPickerConfig,
  Controls,
  type ControlsOptions,
  type ControlsPosition,
  type ControlsTheme,
  type SliderConfig,
} from "./Controls";

export {
  PlaybackControls,
  type PlaybackControlsOptions,
  type TimeUpdateCallback,
} from "./PlaybackControls";

// Mobject interaction behaviors
export { Draggable, type DraggableOptions, makeDraggable } from "./Draggable";
export { Hoverable, type HoverableOptions, makeHoverable } from "./Hoverable";
export { Clickable, type ClickableOptions, makeClickable } from "./Clickable";

// Selection
export {
  SelectionManager,
  type SelectionManagerOptions,
} from "./SelectionManager";

// Camera controls
export { OrbitControls, type OrbitControlsOptions } from "./OrbitControls";
