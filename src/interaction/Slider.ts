import { Group } from '../core/Group';
import { Vector3Tuple } from '../core/Mobject';
import { Scene } from '../core/Scene';
import { Dot } from '../mobjects/geometry/Dot';
import { Line } from '../mobjects/geometry/Line';
import { DecimalNumber } from '../mobjects/text/DecimalNumber';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';
import { BLUE, GRAY } from '../constants';
import { Draggable } from './Draggable';

/**
 * Options for creating a {@link Slider}.
 */
export interface SliderOptions {
  /** Minimum value at the left end of the track. Default: 0. */
  min?: number;
  /** Maximum value at the right end of the track. Default: 1. */
  max?: number;
  /** Step to snap values to. 0 means continuous. Default: 0. */
  step?: number;
  /** Initial value. Default: min. */
  value?: number;
  /** Track length in world units. Default: 4. */
  length?: number;
  /** World position of the track center. Default: [0, 0, 0]. */
  center?: Vector3Tuple;
  /** Handle color as a CSS color string. Default: BLUE. */
  color?: string;
  /** Track color as a CSS color string. Default: GRAY. */
  trackColor?: string;
  /** Handle radius. Default: 0.12. */
  handleRadius?: number;
  /** ValueTracker to bind the slider value to. One is created when omitted. */
  tracker?: ValueTracker;
  /** Show a numeric label above the handle. Default: false. */
  showLabel?: boolean;
  /** Decimal places for the label. Default: 2. */
  numDecimalPlaces?: number;
  /** Called with the new value whenever the slider moves. */
  onChange?: (value: number) => void;
  /**
   * Re-render the scene after each drag update. Default: true. Set false when
   * a render loop (play(), wait() with updaters) is already running.
   */
  autoRender?: boolean;
}

const LABEL_FONT_SIZE = 28;
const LABEL_GAP = 0.35;

/**
 * Slider — an in-scene slider mobject bound to a {@link ValueTracker}.
 *
 * Unlike the DOM `Controls.addSlider` widget, this slider is drawn from
 * mobjects (a track {@link Line} and a draggable handle {@link Dot}), so it
 * lives in animation world space and exports and records with the scene.
 * Dragging the handle maps its position to a value with min, max and step,
 * writes the value into the bound tracker and calls `onChange`, so dependent
 * mobjects update live through the normal updater or `alwaysRedraw` path.
 *
 * Position the slider with the `center` option rather than by moving the
 * group, so the drag mapping stays aligned with the track.
 *
 * @example
 * ```typescript
 * const t = new ValueTracker(0);
 * const slider = new Slider(scene, { min: -3, max: 3, step: 0.1, tracker: t });
 * scene.add(slider);
 * // A curve that redraws from the live slider value.
 * scene.add(alwaysRedraw(() => axes.plot((x) => t.getValue() * x * x)));
 * ```
 */
export class Slider extends Group {
  private _min: number;
  private _max: number;
  private _step: number;
  private _length: number;
  private _center: Vector3Tuple;
  private _trackY: number;
  private _value: number;
  private _tracker: ValueTracker;
  private _onChange?: (value: number) => void;

  private _track: Line;
  private _handle: Dot;
  private _label: DecimalNumber | null = null;
  private _draggable: Draggable;

  /**
   * Create a Slider.
   * @param scene - The scene the slider lives in (needed for pointer events).
   * @param options - Range, step, appearance and the bound tracker.
   */
  constructor(scene: Scene, options: SliderOptions = {}) {
    super();

    const config = resolveOptions(options);
    const { center, color } = config;

    this._min = config.min;
    this._max = config.max;
    this._step = config.step;
    this._length = config.length;
    this._center = [...center];
    this._trackY = center[1];
    this._tracker = config.tracker ?? new ValueTracker(config.value);
    this._onChange = config.onChange;
    this._value = this._clampAndStep(config.value);

    const startX = center[0] - config.length / 2;
    this._track = new Line({
      start: [startX, this._trackY, center[2]],
      end: [startX + config.length, this._trackY, center[2]],
      color: config.trackColor,
    });
    this._handle = new Dot({
      point: [this._valueToX(this._value), this._trackY, center[2]],
      color,
      radius: config.handleRadius,
    });

    this.add(this._track);
    this.add(this._handle);

    if (config.showLabel) this._createLabel(config.numDecimalPlaces, color);

    this._tracker.setValue(this._value);

    this._draggable = new Draggable(this._handle, scene, {
      autoRender: config.autoRender,
      onDrag: (_mobject, position) => this.setValue(this._xToValue(position[0])),
    });
  }

  /** Get the current slider value. */
  getValue(): number {
    return this._value;
  }

  /**
   * Set the slider value, clamping to [min, max] and snapping to the step.
   * Updates the handle position, the bound tracker, the label and fires
   * `onChange`.
   * @param value - The requested value.
   * @returns this for chaining.
   */
  setValue(value: number): this {
    const next = this._clampAndStep(value);
    this._value = next;
    this._handle.moveTo([this._valueToX(next), this._trackY, this._center[2]]);
    this._tracker.setValue(next);
    if (this._label) {
      this._label.setValue(next);
      this._positionLabel();
    }
    this._onChange?.(next);
    return this;
  }

  /** Get the bound {@link ValueTracker}. */
  getValueTracker(): ValueTracker {
    return this._tracker;
  }

  /** Get the track {@link Line} mobject. */
  getTrack(): Line {
    return this._track;
  }

  /** Get the draggable handle {@link Dot} mobject. */
  getHandle(): Dot {
    return this._handle;
  }

  /** Get the value label, or null when `showLabel` was not set. */
  getLabel(): DecimalNumber | null {
    return this._label;
  }

  /** Get the underlying {@link Draggable} behavior for the handle. */
  getDraggable(): Draggable {
    return this._draggable;
  }

  /** Remove pointer-event listeners. Call when the slider is no longer used. */
  dispose(): void {
    this._draggable.dispose();
  }

  private _createLabel(numDecimalPlaces: number, color: string): void {
    this._label = new DecimalNumber({
      value: this._value,
      numDecimalPlaces,
      fontSize: LABEL_FONT_SIZE,
      color,
    });
    this.add(this._label);
    this._positionLabel();
  }

  private _positionLabel(): void {
    if (!this._label) return;
    const x = this._valueToX(this._value);
    this._label.moveTo([x, this._trackY + LABEL_GAP, this._center[2]]);
  }

  /** Map a value to the handle's x coordinate along the track. */
  private _valueToX(value: number): number {
    const startX = this._center[0] - this._length / 2;
    const span = this._max - this._min;
    const fraction = span === 0 ? 0 : (value - this._min) / span;
    return startX + fraction * this._length;
  }

  /** Map a handle x coordinate to a clamped, stepped value. */
  private _xToValue(x: number): number {
    const startX = this._center[0] - this._length / 2;
    const fraction = this._length === 0 ? 0 : (x - startX) / this._length;
    const clampedFraction = Math.max(0, Math.min(1, fraction));
    const raw = this._min + clampedFraction * (this._max - this._min);
    return this._clampAndStep(raw);
  }

  /** Clamp a value to [min, max] and snap it to the step. */
  private _clampAndStep(value: number): number {
    let next = value;
    if (this._step > 0) {
      next = this._min + Math.round((value - this._min) / this._step) * this._step;
    }
    return Math.max(this._min, Math.min(this._max, next));
  }
}

/** A SliderOptions with every appearance default filled in. */
interface ResolvedSliderOptions {
  min: number;
  max: number;
  step: number;
  value: number;
  length: number;
  center: Vector3Tuple;
  color: string;
  trackColor: string;
  handleRadius: number;
  tracker?: ValueTracker;
  showLabel: boolean;
  numDecimalPlaces: number;
  onChange?: (value: number) => void;
  autoRender?: boolean;
}

/** Fill in the appearance and range defaults for a Slider. */
function resolveOptions(options: SliderOptions): ResolvedSliderOptions {
  const min = options.min ?? 0;
  return {
    min,
    max: options.max ?? 1,
    step: options.step ?? 0,
    value: options.value ?? min,
    length: options.length ?? 4,
    center: options.center ?? [0, 0, 0],
    color: options.color ?? BLUE,
    trackColor: options.trackColor ?? GRAY,
    handleRadius: options.handleRadius ?? 0.12,
    tracker: options.tracker,
    showLabel: options.showLabel ?? false,
    numDecimalPlaces: options.numDecimalPlaces ?? 2,
    onChange: options.onChange,
    autoRender: options.autoRender,
  };
}

/**
 * Factory function to create a {@link Slider}.
 * @param scene - The scene the slider lives in.
 * @param options - Range, step, appearance and the bound tracker.
 * @returns A new Slider.
 */
export function makeSlider(scene: Scene, options?: SliderOptions): Slider {
  return new Slider(scene, options);
}
