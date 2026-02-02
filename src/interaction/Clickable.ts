import { Mobject, Vector3Tuple } from '../core/Mobject';
import { Scene } from '../core/Scene';

/**
 * Options for configuring clickable behavior.
 */
export interface ClickableOptions {
  /** Callback when the mobject is clicked */
  onClick: (mobject: Mobject, event: MouseEvent) => void;
  /** Callback when the mobject is double-clicked */
  onDoubleClick?: (mobject: Mobject, event: MouseEvent) => void;
}

/**
 * Adds click detection to a mobject.
 */
export class Clickable {
  private _mobject: Mobject;
  private _scene: Scene;
  private _options: ClickableOptions;
  private _enabled: boolean = true;

  // Event handler references for cleanup
  private _onClick: (e: MouseEvent) => void;
  private _onDblClick: (e: MouseEvent) => void;
  private _onTouchEnd: (e: TouchEvent) => void;

  // Touch tracking for tap detection
  private _touchStartTime: number = 0;
  private _touchStartPos: { x: number; y: number } | null = null;
  private _onTouchStart: (e: TouchEvent) => void;

  // Double tap tracking
  private _lastTapTime: number = 0;
  private _doubleTapDelay: number = 300;

  /**
   * Create a new Clickable behavior.
   * @param mobject - The mobject to make clickable
   * @param scene - The scene containing the mobject
   * @param options - Clickable configuration options
   */
  constructor(mobject: Mobject, scene: Scene, options: ClickableOptions) {
    this._mobject = mobject;
    this._scene = scene;
    this._options = options;

    // Initialize event handlers
    this._onClick = this._handleClick.bind(this);
    this._onDblClick = this._handleDblClick.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);

    this._setupEventListeners();
  }

  /**
   * Get whether clicking is enabled.
   */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Get the mobject this clickable is attached to.
   */
  get mobject(): Mobject {
    return this._mobject;
  }

  private _setupEventListeners(): void {
    const canvas = this._scene.getCanvas();

    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('dblclick', this._onDblClick);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
  }

  private _handleClick(e: MouseEvent): void {
    if (!this._enabled) return;

    const worldPos = this._screenToWorld(e.clientX, e.clientY);
    if (this._hitTest(worldPos)) {
      this._options.onClick(this._mobject, e);
    }
  }

  private _handleDblClick(e: MouseEvent): void {
    if (!this._enabled) return;
    if (!this._options.onDoubleClick) return;

    const worldPos = this._screenToWorld(e.clientX, e.clientY);
    if (this._hitTest(worldPos)) {
      this._options.onDoubleClick(this._mobject, e);
    }
  }

  private _handleTouchStart(e: TouchEvent): void {
    if (!this._enabled) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this._touchStartTime = Date.now();
    this._touchStartPos = { x: touch.clientX, y: touch.clientY };
  }

  private _handleTouchEnd(e: TouchEvent): void {
    if (!this._enabled) return;
    if (!this._touchStartPos) return;

    // Only handle single touch
    if (e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const elapsed = Date.now() - this._touchStartTime;

    // Check if it was a tap (short duration, minimal movement)
    const dx = touch.clientX - this._touchStartPos.x;
    const dy = touch.clientY - this._touchStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (elapsed < 300 && distance < 10) {
      const worldPos = this._screenToWorld(touch.clientX, touch.clientY);
      if (this._hitTest(worldPos)) {
        // Check for double tap
        const now = Date.now();
        if (this._options.onDoubleClick && now - this._lastTapTime < this._doubleTapDelay) {
          // Create a synthetic mouse event for the callback
          const syntheticEvent = new MouseEvent('dblclick', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true,
            cancelable: true
          });
          this._options.onDoubleClick(this._mobject, syntheticEvent);
          this._lastTapTime = 0; // Reset to prevent triple-tap
        } else {
          // Single tap - create a synthetic mouse event
          const syntheticEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true,
            cancelable: true
          });
          this._options.onClick(this._mobject, syntheticEvent);
          this._lastTapTime = now;
        }
        e.preventDefault();
      }
    }

    this._touchStartPos = null;
  }

  private _screenToWorld(clientX: number, clientY: number): Vector3Tuple {
    const canvas = this._scene.getCanvas();
    const rect = canvas.getBoundingClientRect();

    // Normalize to -1 to 1
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Use camera's frame dimensions
    const camera = this._scene.camera;
    const worldX = x * camera.frameWidth / 2;
    const worldY = y * camera.frameHeight / 2;

    return [worldX, worldY, 0];
  }

  private _hitTest(worldPos: Vector3Tuple): boolean {
    // Check if point is within mobject's bounding box
    const center = this._mobject.getCenter();
    const bounds = (this._mobject as any)._getBoundingBox?.() ?? { width: 1, height: 1 };

    return Math.abs(worldPos[0] - center[0]) <= bounds.width / 2 &&
           Math.abs(worldPos[1] - center[1]) <= bounds.height / 2;
  }

  /**
   * Enable clicking.
   */
  enable(): void {
    this._enabled = true;
  }

  /**
   * Disable clicking.
   */
  disable(): void {
    this._enabled = false;
  }

  /**
   * Clean up event listeners.
   */
  dispose(): void {
    const canvas = this._scene.getCanvas();
    canvas.removeEventListener('click', this._onClick);
    canvas.removeEventListener('dblclick', this._onDblClick);
    canvas.removeEventListener('touchstart', this._onTouchStart);
    canvas.removeEventListener('touchend', this._onTouchEnd);
  }
}

/**
 * Factory function to make a mobject clickable.
 * @param mobject - The mobject to make clickable
 * @param scene - The scene containing the mobject
 * @param options - Clickable configuration options
 * @returns A new Clickable instance
 */
export function makeClickable(mobject: Mobject, scene: Scene, options: ClickableOptions): Clickable {
  return new Clickable(mobject, scene, options);
}
