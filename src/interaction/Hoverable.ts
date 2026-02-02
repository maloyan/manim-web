import { Mobject, Vector3Tuple } from '../core/Mobject';
import { Scene } from '../core/Scene';

/**
 * Options for configuring hoverable behavior.
 */
export interface HoverableOptions {
  /** Callback when hover starts */
  onHoverStart?: (mobject: Mobject) => void;
  /** Callback when hover ends */
  onHoverEnd?: (mobject: Mobject) => void;
  /** Scale factor on hover, default 1.1 */
  hoverScale?: number;
  /** Color change on hover, or null for no change */
  hoverColor?: string | null;
  /** Opacity change on hover, or null for no change */
  hoverOpacity?: number | null;
  /** CSS cursor on hover, default 'pointer' */
  cursor?: string;
}

/**
 * Adds hover effects to a mobject.
 */
export class Hoverable {
  private _mobject: Mobject;
  private _scene: Scene;
  private _options: HoverableOptions;
  private _isHovering: boolean = false;
  private _originalScale: Vector3Tuple;
  private _originalColor: string;
  private _originalOpacity: number;
  private _enabled: boolean = true;

  // Event handler references for cleanup
  private _onMouseMove: (e: MouseEvent) => void;
  private _onMouseLeave: (e: MouseEvent) => void;

  /**
   * Create a new Hoverable behavior.
   * @param mobject - The mobject to add hover effects to
   * @param scene - The scene containing the mobject
   * @param options - Hoverable configuration options
   */
  constructor(mobject: Mobject, scene: Scene, options?: HoverableOptions) {
    this._mobject = mobject;
    this._scene = scene;
    this._options = { hoverScale: 1.1, cursor: 'pointer', ...options };

    this._originalScale = [
      this._mobject.scaleVector.x,
      this._mobject.scaleVector.y,
      this._mobject.scaleVector.z
    ];
    this._originalColor = this._mobject.color;
    this._originalOpacity = this._mobject.opacity;

    // Initialize event handlers
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseLeave = this._handleMouseLeave.bind(this);

    this._setupEventListeners();
  }

  /**
   * Get whether the mobject is currently being hovered.
   */
  get isHovering(): boolean {
    return this._isHovering;
  }

  /**
   * Get whether hovering is enabled.
   */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Get the mobject this hoverable is attached to.
   */
  get mobject(): Mobject {
    return this._mobject;
  }

  private _storeOriginalValues(): void {
    this._originalScale = [
      this._mobject.scaleVector.x,
      this._mobject.scaleVector.y,
      this._mobject.scaleVector.z
    ];
    this._originalColor = this._mobject.color;
    this._originalOpacity = this._mobject.opacity;
  }

  private _setupEventListeners(): void {
    const canvas = this._scene.getCanvas();

    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mouseleave', this._onMouseLeave);
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (!this._enabled) return;

    const worldPos = this._screenToWorld(e.clientX, e.clientY);
    const isOver = this._hitTest(worldPos);

    if (isOver && !this._isHovering) {
      this._startHover();
    } else if (!isOver && this._isHovering) {
      this._endHover();
    }
  }

  private _handleMouseLeave(): void {
    if (this._isHovering) {
      this._endHover();
    }
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

  private _startHover(): void {
    this._isHovering = true;
    this._storeOriginalValues();
    const canvas = this._scene.getCanvas();
    canvas.style.cursor = this._options.cursor ?? 'pointer';

    // Apply hover effects
    if (this._options.hoverScale !== undefined && this._options.hoverScale !== 1) {
      this._mobject.scale(this._options.hoverScale);
    }
    if (this._options.hoverColor) {
      this._mobject.setColor(this._options.hoverColor);
    }
    if (this._options.hoverOpacity !== undefined && this._options.hoverOpacity !== null) {
      this._mobject.setOpacity(this._options.hoverOpacity);
    }

    this._options.onHoverStart?.(this._mobject);
  }

  private _endHover(): void {
    this._isHovering = false;
    const canvas = this._scene.getCanvas();
    canvas.style.cursor = 'default';

    // Restore original values
    this._mobject.scaleVector.set(
      this._originalScale[0],
      this._originalScale[1],
      this._originalScale[2]
    );
    this._mobject.setColor(this._originalColor);
    this._mobject.setOpacity(this._originalOpacity);
    this._mobject._markDirty();

    this._options.onHoverEnd?.(this._mobject);
  }

  /**
   * Enable hovering.
   */
  enable(): void {
    this._enabled = true;
  }

  /**
   * Disable hovering and reset to original state.
   */
  disable(): void {
    this._enabled = false;
    if (this._isHovering) {
      this._endHover();
    }
  }

  /**
   * Clean up event listeners.
   */
  dispose(): void {
    const canvas = this._scene.getCanvas();
    canvas.removeEventListener('mousemove', this._onMouseMove);
    canvas.removeEventListener('mouseleave', this._onMouseLeave);

    // Restore original state if currently hovering
    if (this._isHovering) {
      this._endHover();
    }
  }
}

/**
 * Factory function to make a mobject hoverable.
 * @param mobject - The mobject to add hover effects to
 * @param scene - The scene containing the mobject
 * @param options - Hoverable configuration options
 * @returns A new Hoverable instance
 */
export function makeHoverable(mobject: Mobject, scene: Scene, options?: HoverableOptions): Hoverable {
  return new Hoverable(mobject, scene, options);
}
