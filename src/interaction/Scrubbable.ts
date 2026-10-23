import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../core/Mobject';
import { Scene } from '../core/Scene';
import { DecimalNumber } from '../mobjects/text/DecimalNumber';
import { ValueTracker } from '../mobjects/value-tracker/ValueTracker';

/**
 * Options for {@link Scrubbable} / {@link makeScrubbable}.
 */
export interface ScrubbableOptions {
  /**
   * Drag axis. 'horizontal' (default): drag right to increase. 'vertical':
   * drag up to increase.
   */
  direction?: 'horizontal' | 'vertical';
  /**
   * Snap increment for the value. 0 means continuous.
   * Default: 10^-numDecimalPlaces, the smallest change the number displays.
   */
  step?: number;
  /** Value change per screen pixel of drag. Default: `step` (0.01 when step is 0). */
  sensitivity?: number;
  /** Lower bound for the value. Default: -Infinity. */
  min?: number;
  /** Upper bound for the value. Default: +Infinity. */
  max?: number;
  /** ValueTracker to write each new value into. */
  tracker?: ValueTracker;
  /** Called with the new value (and the number) each time the value changes. */
  onChange?: (value: number, decimal: DecimalNumber) => void;
  /** Called once when a scrub gesture ends, with the final value. */
  onScrubEnd?: (value: number, decimal: DecimalNumber) => void;
  /** Extra world-unit margin around the number that still starts a scrub. Default: 0.1. */
  hitPadding?: number;
  /** CSS cursor on hover and while scrubbing. Default: 'ew-resize' / 'ns-resize'. */
  cursor?: string;
  /**
   * Render the scene after each value change. Default: true. Set false when a
   * render loop (play(), wait() with updaters) is already running.
   */
  autoRender?: boolean;
}

/**
 * Scrubbables that currently own the cursor, per canvas. Several numbers can
 * share one canvas (e.g. the cells of a DecimalTable); the cursor resets only
 * when none of them is hovered, so one number leaving cannot clear the cursor
 * another number just set.
 */
const cursorOwners = new WeakMap<HTMLCanvasElement, Set<Scrubbable>>();

/**
 * Scrubbable: drag a {@link DecimalNumber} to change its value, in place.
 *
 * Like a Tangle / wigglystuff `TangleLatex` number: the number does not move;
 * the drag distance along one axis maps to a value change. The value is
 * snapped to `step`, clamped to `[min, max]`, written with `setValue()` and
 * reported through `onChange`.
 *
 * Uses Pointer Events, so mouse, pen and touch all work.
 *
 * @example
 * ```typescript
 * const a = new DecimalNumber({ value: 1, numDecimalPlaces: 1 });
 * scene.add(a);
 * makeScrubbable(a, scene, { min: -5, max: 5, step: 0.1, onChange: (v) => redraw(v) });
 * ```
 */
export class Scrubbable {
  private _decimal: DecimalNumber;
  private _scene: Scene;
  private _options: ScrubbableOptions;
  private _step: number;
  private _sensitivity: number;
  private _cursor: string;
  private _enabled = true;
  private _isScrubbing = false;
  private _pointerId: number | null = null;
  private _startClient = 0;
  private _startValue = 0;

  private _onPointerDown: (e: PointerEvent) => void;
  private _onPointerMove: (e: PointerEvent) => void;
  private _onPointerUp: (e: PointerEvent) => void;
  private _onHoverMove: (e: PointerEvent) => void;
  private _onPointerLeave: () => void;

  /**
   * @param decimal - The number to scrub. Its position never changes.
   * @param scene - The scene whose canvas receives the pointer events.
   * @param options - Scrub configuration.
   */
  constructor(decimal: DecimalNumber, scene: Scene, options: ScrubbableOptions = {}) {
    this._decimal = decimal;
    this._scene = scene;
    this._options = options;
    this._step = options.step ?? Math.pow(10, -decimal.getNumDecimalPlaces());
    this._sensitivity = options.sensitivity ?? (this._step > 0 ? this._step : 0.01);
    this._cursor = options.cursor ?? (options.direction === 'vertical' ? 'ns-resize' : 'ew-resize');

    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onHoverMove = this._handleHoverMove.bind(this);
    this._onPointerLeave = this._handlePointerLeave.bind(this);

    const canvas = scene.getCanvas();
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointermove', this._onHoverMove);
    canvas.addEventListener('pointerleave', this._onPointerLeave);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
  }

  /** The number this behavior scrubs. */
  get decimal(): DecimalNumber {
    return this._decimal;
  }

  /** Whether a scrub gesture is in progress. */
  get isScrubbing(): boolean {
    return this._isScrubbing;
  }

  /** Whether scrubbing is enabled. */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /** Enable scrubbing. */
  enable(): void {
    this._enabled = true;
  }

  /** Disable scrubbing. A scrub in progress ends at once. */
  disable(): void {
    this._enabled = false;
    if (this._isScrubbing) this._endScrub();
    this._setHover(false);
  }

  /** Remove all event listeners and release the cursor. */
  dispose(): void {
    const canvas = this._scene.getCanvas();
    canvas.removeEventListener('pointerdown', this._onPointerDown);
    canvas.removeEventListener('pointermove', this._onHoverMove);
    canvas.removeEventListener('pointerleave', this._onPointerLeave);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    this._isScrubbing = false;
    this._setHover(false);
  }

  /**
   * The value for a drag of `deltaPixels` from the press point.
   *
   * @post this._step > 0 => result is a multiple of step (to display precision)
   * @post min <= result <= max
   */
  private _valueFor(deltaPixels: number): number {
    let value = this._startValue + deltaPixels * this._sensitivity;
    if (this._step > 0) {
      value = Math.round(value / this._step) * this._step;
      // Remove float noise such as 0.30000000000000004 from the snap.
      value = Number(value.toFixed(Math.max(0, this._decimal.getNumDecimalPlaces()) + 6));
    }
    const min = this._options.min ?? -Infinity;
    const max = this._options.max ?? Infinity;
    return Math.min(max, Math.max(min, value));
  }

  private _handlePointerDown(e: PointerEvent): void {
    if (!this._enabled || this._isScrubbing) return;
    if (e.button !== undefined && e.button > 0) return;
    if (!this._hitTest(e.clientX, e.clientY)) return;

    this._isScrubbing = true;
    this._pointerId = e.pointerId ?? null;
    this._startClient = this._axisCoord(e);
    this._startValue = this._decimal.getValue();
    this._setHover(true);
    e.preventDefault();
    e.stopPropagation();
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (!this._isScrubbing || !this._isOwnPointer(e)) return;
    const delta = this._axisCoord(e) - this._startClient;
    // Screen y grows downward; dragging up must increase the value.
    const signed = this._options.direction === 'vertical' ? -delta : delta;
    const value = this._valueFor(signed);
    if (value === this._decimal.getValue()) return;

    this._decimal.setValue(value);
    this._options.tracker?.setValue(value);
    this._options.onChange?.(value, this._decimal);
    this._requestRender();
    e.preventDefault();
  }

  private _handlePointerUp(e: PointerEvent): void {
    if (!this._isScrubbing || !this._isOwnPointer(e)) return;
    this._endScrub();
    this._setHover(this._hitTest(e.clientX, e.clientY));
  }

  private _handleHoverMove(e: PointerEvent): void {
    if (!this._enabled || this._isScrubbing) return;
    this._setHover(this._hitTest(e.clientX, e.clientY));
  }

  private _handlePointerLeave(): void {
    if (!this._isScrubbing) this._setHover(false);
  }

  private _endScrub(): void {
    this._isScrubbing = false;
    this._pointerId = null;
    this._options.onScrubEnd?.(this._decimal.getValue(), this._decimal);
  }

  private _isOwnPointer(e: PointerEvent): boolean {
    return this._pointerId === null || e.pointerId === undefined || e.pointerId === this._pointerId;
  }

  private _axisCoord(e: PointerEvent): number {
    return this._options.direction === 'vertical' ? e.clientY : e.clientX;
  }

  private _setHover(hovered: boolean): void {
    const canvas = this._scene.getCanvas();
    let owners = cursorOwners.get(canvas);
    if (!owners) {
      owners = new Set();
      cursorOwners.set(canvas, owners);
    }
    if (hovered) {
      owners.add(this);
      canvas.style.cursor = this._cursor;
    } else if (owners.delete(this) && owners.size === 0) {
      canvas.style.cursor = '';
    }
  }

  /** Canvas client point -> 2D world point (same mapping as Draggable). */
  private _screenToWorld(clientX: number, clientY: number): [number, number] {
    const rect = this._scene.getCanvas().getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    const camera = this._scene.camera;
    return [(ndcX * camera.frameWidth) / 2, (ndcY * camera.frameHeight) / 2];
  }

  /**
   * Hit test against the number's world-space box. The box comes from the
   * text size and the full world matrix, so a number inside a moved, scaled
   * DecimalTable or MobjectMatrix is hit where it is drawn.
   */
  private _hitTest(clientX: number, clientY: number): boolean {
    const [x, y] = this._screenToWorld(clientX, clientY);
    // The text size is measured when the backing object is built.
    if (this._decimal.getWidth() === 0) this._decimal.getThreeObject();
    const hw = this._decimal.getWidth() / 2;
    const hh = this._decimal.getHeight() / 2;
    const m = this._decimal._worldMatrix();
    const box = new THREE.Box3();
    const corners: Vector3Tuple[] = [
      [-hw, -hh, 0],
      [hw, -hh, 0],
      [hw, hh, 0],
      [-hw, hh, 0],
    ];
    for (const c of corners) box.expandByPoint(new THREE.Vector3(...c).applyMatrix4(m));
    const pad = this._options.hitPadding ?? 0.1;
    return (
      x >= box.min.x - pad && x <= box.max.x + pad && y >= box.min.y - pad && y <= box.max.y + pad
    );
  }

  private _requestRender(): void {
    if (this._options.autoRender === false) return;
    if (this._scene.isRenderLoopActive) return;
    this._scene.render();
  }
}

/**
 * Make a {@link DecimalNumber} scrubbable: drag it to change its value.
 *
 * @param decimal - The number to scrub (also works for `Integer`).
 * @param scene - The scene that displays the number.
 * @param options - Direction, step, sensitivity, bounds and callbacks.
 * @returns The Scrubbable behavior. Call `dispose()` to remove it.
 */
export function makeScrubbable(
  decimal: DecimalNumber,
  scene: Scene,
  options?: ScrubbableOptions,
): Scrubbable {
  return new Scrubbable(decimal, scene, options);
}

/**
 * Make every {@link DecimalNumber} inside a mobject scrubbable, for example
 * the cells of a `DecimalTable` or a `MobjectMatrix` built from DecimalNumbers.
 * Each number gets its own {@link Scrubbable} with the same options; use the
 * `decimal` argument of `onChange` to tell the cells apart.
 *
 * @param container - Any mobject. Its whole family is searched.
 * @param scene - The scene that displays the container.
 * @param options - Options shared by every number.
 * @returns One Scrubbable per DecimalNumber, in family order.
 *
 * @post result.length === container.getFamily().filter(m => m instanceof DecimalNumber).length
 */
export function makeScrubbableEntries(
  container: Mobject,
  scene: Scene,
  options?: ScrubbableOptions,
): Scrubbable[] {
  return container
    .getFamily()
    .filter((m): m is DecimalNumber => m instanceof DecimalNumber)
    .map((d) => new Scrubbable(d, scene, options));
}
