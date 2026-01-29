/**
 * Indication animations module.
 *
 * These animations are used to draw attention to specific mobjects
 * without fundamentally changing them. They include effects like
 * scaling, flashing, circumscribing, wiggling, and focusing.
 */

// Indicate - scale up/down with color change
export { Indicate, indicate, type IndicateOptions } from './Indicate';

// Flash - radiating flash lines from center
export { Flash, flash, type FlashOptions } from './Flash';

// Circumscribe - draw shape around object
export {
  Circumscribe,
  circumscribe,
  type CircumscribeOptions,
  type CircumscribeShape,
} from './Circumscribe';

// Wiggle - wiggle back and forth
export { Wiggle, wiggle, type WiggleOptions } from './Wiggle';

// ShowPassingFlash - flash traveling along path
export {
  ShowPassingFlash,
  showPassingFlash,
  type ShowPassingFlashOptions,
} from './ShowPassingFlash';

// ApplyWave - wave distortion
export {
  ApplyWave,
  applyWave,
  type ApplyWaveOptions,
  type WaveDirection,
} from './ApplyWave';

// FocusOn - zoom/focus effect with converging rings
export { FocusOn, focusOn, type FocusOnOptions } from './FocusOn';

// Pulse - simple scale pulse
export { Pulse, pulse, type PulseOptions } from './FocusOn';

// ShowPassingFlashWithThinningStrokeWidth - flash with tapered stroke width
export {
  ShowPassingFlashWithThinningStrokeWidth,
  showPassingFlashWithThinningStrokeWidth,
  type ShowPassingFlashWithThinningStrokeWidthOptions,
} from './ShowPassingFlashWithThinningStrokeWidth';

// Blink - repeated fade out/in effect
export { Blink, blink, type BlinkOptions } from './Blink';
