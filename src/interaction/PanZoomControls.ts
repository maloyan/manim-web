import * as THREE from 'three';

/**
 * Duck-typed 2D camera that PanZoomControls drives. Both `Camera2D` and the
 * `Camera2DFrame`-backed scene camera satisfy this shape, so the controller
 * never imports the concrete camera class (avoids a circular import and keeps
 * it testable with a plain stub).
 */
export interface PanZoomCamera {
  /** Visible frame width in world units. Smaller = zoomed in. */
  frameWidth: number;
  /** Visible frame height in world units. Smaller = zoomed in. */
  frameHeight: number;
  /** Live camera position. Its x/y are the frame center; z is left untouched. */
  position: THREE.Vector3;
  /** Move the camera center to a world point. */
  moveTo(point: [number, number, number]): void;
}

/** Optional min/max world bounds for the camera center. */
export interface PanZoomBounds {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

/**
 * Options for {@link PanZoomControls}.
 */
export interface PanZoomControlsOptions {
  /**
   * Wheel sensitivity. The frame is scaled by `exp(deltaY * zoomSpeed)` per
   * wheel event, so a larger value zooms faster. Defaults to 0.0015.
   */
  zoomSpeed?: number;
  /**
   * Maximum zoom-in factor relative to the frame size at construction
   * (`zoom = baseFrameWidth / frameWidth`). Defaults to 10.
   */
  maxZoom?: number;
  /**
   * Maximum zoom-out factor relative to the frame size at construction.
   * Defaults to 0.1.
   */
  minZoom?: number;
  /** Mouse button that starts a pan drag (0 = left, 1 = middle, 2 = right). Defaults to 0. */
  panButton?: number;
  /** Invert the wheel zoom direction. Defaults to false. */
  invertZoom?: boolean;
  /** Allow panning along the x axis. Defaults to true. */
  enablePanX?: boolean;
  /** Allow panning along the y axis. Defaults to true. */
  enablePanY?: boolean;
  /** Allow wheel zoom. Defaults to true. */
  enableZoom?: boolean;
  /** Clamp the camera center to these world bounds. Defaults to null (no bounds). */
  bounds?: PanZoomBounds | null;
  /** Attach listeners immediately. Defaults to true. Set false to attach later with enable(). */
  enabled?: boolean;
  /**
   * Called after each pan or zoom change. Use it to re-render the scene, e.g.
   * `{ onChange: () => scene.render() }`.
   */
  onChange?: () => void;
}

interface NormalizedOptions {
  zoomSpeed: number;
  maxZoom: number;
  minZoom: number;
  panButton: number;
  invertZoom: boolean;
  enablePanX: boolean;
  enablePanY: boolean;
  enableZoom: boolean;
  bounds: PanZoomBounds | null;
  onChange: (() => void) | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Desmos-style mouse pan and zoom for a 2D (orthographic) manim camera.
 *
 * Wheel zooms the frame about the world point under the cursor (zoom to
 * cursor, not to center); a pointer drag pans the frame. The controller only
 * reads/writes the camera through {@link PanZoomCamera}; it never touches the
 * core render path, so it is a pure opt-in input controller.
 *
 * Lifecycle mirrors {@link OrbitControls}: listeners are attached while the
 * controller is enabled and removed on `disable()` / `dispose()`.
 *
 * @example
 * ```ts
 * const controls = new PanZoomControls(scene.camera, scene.getCanvas(), {
 *   onChange: () => scene.render(),
 * });
 * // later
 * controls.dispose();
 * ```
 */
export class PanZoomControls {
  private readonly _camera: PanZoomCamera;
  private readonly _domElement: HTMLElement;
  private readonly _options: NormalizedOptions;
  private readonly _baseFrameWidth: number;

  private _enabled = false;
  private _disposed = false;
  private _panning = false;
  private _lastClientX = 0;
  private _lastClientY = 0;

  private readonly _window: Window | null;

  private readonly _onWheel: (e: WheelEvent) => void;
  private readonly _onMouseDown: (e: MouseEvent) => void;
  private readonly _onMouseMove: (e: MouseEvent) => void;
  private readonly _onMouseUp: () => void;

  /**
   * @param camera     The 2D camera to drive (e.g. `scene.camera`).
   * @param domElement The element that receives wheel/pointer events (e.g. the canvas).
   * @param options    Pan/zoom configuration.
   */
  constructor(camera: PanZoomCamera, domElement: HTMLElement, options?: PanZoomControlsOptions) {
    this._camera = camera;
    this._domElement = domElement;
    this._baseFrameWidth = camera.frameWidth;

    this._options = {
      zoomSpeed: options?.zoomSpeed ?? 0.0015,
      maxZoom: options?.maxZoom ?? 10,
      minZoom: options?.minZoom ?? 0.1,
      panButton: options?.panButton ?? 0,
      invertZoom: options?.invertZoom ?? false,
      enablePanX: options?.enablePanX ?? true,
      enablePanY: options?.enablePanY ?? true,
      enableZoom: options?.enableZoom ?? true,
      bounds: options?.bounds ?? null,
      onChange: options?.onChange ?? null,
    };

    // Resolve the window that mousemove/mouseup listen on. Prefer the element's
    // own document view so the controller works inside iframes; fall back to
    // the global window, and to null when headless (no DOM).
    const view = domElement?.ownerDocument?.defaultView ?? null;
    this._window = view ?? (typeof window !== 'undefined' ? window : null);

    this._onWheel = this._handleWheel.bind(this);
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);

    if ((options?.enabled ?? true) === true) {
      this.enable();
    }
  }

  /** Whether the controller is currently enabled (listeners attached). */
  isEnabled(): boolean {
    return this._enabled;
  }

  /** Attach listeners and start responding to the mouse. */
  enable(): void {
    if (this._enabled || this._disposed) return;
    const el = this._domElement;
    if (!el || typeof el.addEventListener !== 'function') return;
    this._enabled = true;
    el.addEventListener('wheel', this._onWheel, { passive: false });
    el.addEventListener('mousedown', this._onMouseDown);
    if (this._window) {
      this._window.addEventListener('mousemove', this._onMouseMove);
      this._window.addEventListener('mouseup', this._onMouseUp);
    }
  }

  /** Detach listeners. The controller stops responding until enable() is called. */
  disable(): void {
    if (!this._enabled) return;
    this._enabled = false;
    this._panning = false;
    const el = this._domElement;
    if (el && typeof el.removeEventListener === 'function') {
      el.removeEventListener('wheel', this._onWheel);
      el.removeEventListener('mousedown', this._onMouseDown);
    }
    if (this._window) {
      this._window.removeEventListener('mousemove', this._onMouseMove);
      this._window.removeEventListener('mouseup', this._onMouseUp);
    }
  }

  /** Permanently detach listeners. The controller cannot be re-enabled. */
  dispose(): void {
    this.disable();
    this._disposed = true;
  }

  // ── Event handlers ──────────────────────────────────────────────

  private _handleWheel(e: WheelEvent): void {
    if (!this._enabled || !this._options.enableZoom) return;
    const ndc = this._eventToNdc(e.clientX, e.clientY);
    if (!ndc) return;

    const worldBefore = this._worldAt(ndc.x, ndc.y);

    const dir = this._options.invertZoom ? -e.deltaY : e.deltaY;
    const requestedFactor = Math.exp(dir * this._options.zoomSpeed);

    // Clamp the resulting frame width to the configured zoom range.
    // zoom = baseFrameWidth / frameWidth, so a wider frame is a smaller zoom.
    const minWidth = this._baseFrameWidth / this._options.maxZoom;
    const maxWidth = this._baseFrameWidth / this._options.minZoom;
    const targetWidth = this._camera.frameWidth * requestedFactor;
    const clampedWidth = clamp(targetWidth, minWidth, maxWidth);
    const factor = clampedWidth / this._camera.frameWidth;
    if (factor === 1) return; // already at a limit — nothing to do

    this._camera.frameWidth = this._camera.frameWidth * factor;
    this._camera.frameHeight = this._camera.frameHeight * factor;

    // Re-anchor the center so the same world point stays under the cursor.
    const centerX = worldBefore.x - (ndc.x * this._camera.frameWidth) / 2;
    const centerY = worldBefore.y - (ndc.y * this._camera.frameHeight) / 2;
    this._applyCenter(centerX, centerY);

    e.preventDefault();
    this._emitChange();
  }

  private _handleMouseDown(e: MouseEvent): void {
    if (!this._enabled) return;
    if (!this._options.enablePanX && !this._options.enablePanY) return;
    if (e.button !== this._options.panButton) return;
    this._panning = true;
    this._lastClientX = e.clientX;
    this._lastClientY = e.clientY;
    e.preventDefault();
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (!this._panning) return;
    const rect = this._domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      this._lastClientX = e.clientX;
      this._lastClientY = e.clientY;
      return;
    }

    const dxPx = e.clientX - this._lastClientX;
    const dyPx = e.clientY - this._lastClientY;
    this._lastClientX = e.clientX;
    this._lastClientY = e.clientY;

    // Grab-and-move: the world point under the cursor follows the cursor, so
    // the center moves opposite in x and along screen-y (world-y is flipped).
    const worldDx = (dxPx * this._camera.frameWidth) / rect.width;
    const worldDy = (dyPx * this._camera.frameHeight) / rect.height;

    let centerX = this._camera.position.x;
    let centerY = this._camera.position.y;
    if (this._options.enablePanX) centerX -= worldDx;
    if (this._options.enablePanY) centerY += worldDy;

    this._applyCenter(centerX, centerY);
    this._emitChange();
  }

  private _handleMouseUp(): void {
    if (this._panning) this._panning = false;
  }

  // ── Helpers ─────────────────────────────────────────────────────

  /** Screen pixel → normalized device coordinates (-1..1), or null if unusable. */
  private _eventToNdc(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this._domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -((clientY - rect.top) / rect.height) * 2 + 1,
    };
  }

  /** World point currently shown at the given NDC coordinates. */
  private _worldAt(ndcX: number, ndcY: number): { x: number; y: number } {
    return {
      x: this._camera.position.x + (ndcX * this._camera.frameWidth) / 2,
      y: this._camera.position.y + (ndcY * this._camera.frameHeight) / 2,
    };
  }

  /** Clamp to bounds (if any) and push the new center to the camera. */
  private _applyCenter(x: number, y: number): void {
    let cx = x;
    let cy = y;
    const b = this._options.bounds;
    if (b) {
      if (b.minX !== undefined) cx = Math.max(b.minX, cx);
      if (b.maxX !== undefined) cx = Math.min(b.maxX, cx);
      if (b.minY !== undefined) cy = Math.max(b.minY, cy);
      if (b.maxY !== undefined) cy = Math.min(b.maxY, cy);
    }
    this._camera.moveTo([cx, cy, this._camera.position.z]);
  }

  private _emitChange(): void {
    this._options.onChange?.();
  }
}

/**
 * Factory for {@link PanZoomControls}.
 * @param camera     The 2D camera to drive.
 * @param domElement The element that receives wheel/pointer events.
 * @param options    Pan/zoom configuration.
 * @returns A new PanZoomControls instance.
 */
export function makePanZoomControls(
  camera: PanZoomCamera,
  domElement: HTMLElement,
  options?: PanZoomControlsOptions,
): PanZoomControls {
  return new PanZoomControls(camera, domElement, options);
}
