import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../core/Mobject';
import { Scene } from '../core/Scene';
import { ThreeDScene } from '../core/ThreeDScene';

/**
 * Options for configuring draggable behavior.
 */
export interface DraggableOptions {
  /** X-axis constraints as [min, max] or null for no constraint */
  constrainX?: [number, number] | null;
  /** Y-axis constraints as [min, max] or null for no constraint */
  constrainY?: [number, number] | null;
  /** Callback when drag starts */
  onDragStart?: (mobject: Mobject, position: Vector3Tuple) => void;
  /** Callback during drag with position and delta */
  onDrag?: (mobject: Mobject, position: Vector3Tuple, delta: Vector3Tuple) => void;
  /** Callback when drag ends */
  onDragEnd?: (mobject: Mobject, position: Vector3Tuple) => void;
  /** Grid size for snapping, or null for no snapping */
  snapToGrid?: number | null;
}

/**
 * Makes a mobject draggable with mouse and touch support.
 */
export class Draggable {
  private _mobject: Mobject;
  private _scene: Scene;
  private _options: DraggableOptions;
  private _isDragging: boolean = false;
  private _lastPosition: Vector3Tuple | null = null;
  private _enabled: boolean = true;

  // Event handler references for cleanup
  private _onMouseDown: (e: MouseEvent) => void;
  private _onMouseMove: (e: MouseEvent) => void;
  private _onMouseUp: (e: MouseEvent) => void;
  private _onTouchStart: (e: TouchEvent) => void;
  private _onTouchMove: (e: TouchEvent) => void;
  private _onTouchEnd: (e: TouchEvent) => void;

  /**
   * Create a new Draggable behavior.
   * @param mobject - The mobject to make draggable
   * @param scene - The scene containing the mobject
   * @param options - Draggable configuration options
   */
  constructor(mobject: Mobject, scene: Scene, options?: DraggableOptions) {
    this._mobject = mobject;
    this._scene = scene;
    this._options = options ?? {};

    // Initialize event handlers
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);

    this._setupEventListeners();
  }

  /**
   * Get whether the mobject is currently being dragged.
   */
  get isDragging(): boolean {
    return this._isDragging;
  }

  /**
   * Get whether dragging is enabled.
   */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Get the mobject this draggable is attached to.
   */
  get mobject(): Mobject {
    return this._mobject;
  }

  private _setupEventListeners(): void {
    const canvas = this._scene.getCanvas();

    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    window.addEventListener('touchmove', this._onTouchMove, { passive: false });
    window.addEventListener('touchend', this._onTouchEnd);
  }

  private _handleMouseDown(e: MouseEvent): void {
    if (!this._enabled) return;
    const worldPos = this._screenToWorld(e.clientX, e.clientY);
    if (this._hitTest(worldPos)) {
      this._startDrag(worldPos);
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (!this._isDragging) return;
    const worldPos = this._screenToWorld(e.clientX, e.clientY);
    this._updateDrag(worldPos);
  }

  private _handleMouseUp(): void {
    if (this._isDragging) {
      this._endDrag();
    }
  }

  private _handleTouchStart(e: TouchEvent): void {
    if (!this._enabled) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const worldPos = this._screenToWorld(touch.clientX, touch.clientY);
    if (this._hitTest(worldPos)) {
      this._startDrag(worldPos);
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private _handleTouchMove(e: TouchEvent): void {
    if (!this._isDragging) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const worldPos = this._screenToWorld(touch.clientX, touch.clientY);
    this._updateDrag(worldPos);
    e.preventDefault();
  }

  private _handleTouchEnd(): void {
    if (this._isDragging) {
      this._endDrag();
    }
  }

  private _screenToWorld(clientX: number, clientY: number): Vector3Tuple {
    const canvas = this._scene.getCanvas();
    const rect = canvas.getBoundingClientRect();

    // Normalize to -1 to 1 (NDC)
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    if (this._scene instanceof ThreeDScene) {
      // For 3D scenes, raycast onto a plane at the object's depth
      const threeCamera = this._scene.camera3D.getCamera();
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), threeCamera);

      // Build a plane perpendicular to the camera's view direction
      // passing through the object's current position
      const objPos = new THREE.Vector3(...this._mobject.getCenter());
      const camDir = new THREE.Vector3();
      threeCamera.getWorldDirection(camDir);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, objPos);

      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      if (intersection) {
        return [intersection.x, intersection.y, intersection.z];
      }
    }

    // 2D fallback: use camera's frame dimensions
    const camera = this._scene.camera;
    const worldX = (ndcX * camera.frameWidth) / 2;
    const worldY = (ndcY * camera.frameHeight) / 2;

    return [worldX, worldY, 0];
  }

  private _hitTest(worldPos: Vector3Tuple): boolean {
    const center = this._mobject.getCenter();
    const bounds = this._mobject.getBoundingBox();

    if (this._scene instanceof ThreeDScene) {
      // In 3D, check distance from the object center on the camera-facing plane
      const dx = worldPos[0] - center[0];
      const dy = worldPos[1] - center[1];
      const dz = worldPos[2] - center[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const maxDim = Math.max(bounds.width, bounds.height) / 2;
      return dist <= maxDim;
    }

    // 2D: check within bounding box
    return (
      Math.abs(worldPos[0] - center[0]) <= bounds.width / 2 &&
      Math.abs(worldPos[1] - center[1]) <= bounds.height / 2
    );
  }

  private _startDrag(worldPos: Vector3Tuple): void {
    this._isDragging = true;
    this._lastPosition = worldPos;

    // Disable orbit controls while dragging so camera doesn't move
    if (this._scene instanceof ThreeDScene && this._scene.orbitControls) {
      this._scene.orbitControls.disable();
    }

    this._options.onDragStart?.(this._mobject, worldPos);
  }

  private _updateDrag(worldPos: Vector3Tuple): void {
    if (!this._lastPosition) return;

    let newX = worldPos[0];
    let newY = worldPos[1];

    // Apply constraints
    if (this._options.constrainX) {
      newX = Math.max(this._options.constrainX[0], Math.min(this._options.constrainX[1], newX));
    }
    if (this._options.constrainY) {
      newY = Math.max(this._options.constrainY[0], Math.min(this._options.constrainY[1], newY));
    }

    // Apply snap to grid
    if (this._options.snapToGrid) {
      const grid = this._options.snapToGrid;
      newX = Math.round(newX / grid) * grid;
      newY = Math.round(newY / grid) * grid;
    }

    const newZ = this._scene instanceof ThreeDScene ? worldPos[2] : this._mobject.position.z;
    const newPos: Vector3Tuple = [newX, newY, newZ];
    const delta: Vector3Tuple = [
      newPos[0] - this._lastPosition[0],
      newPos[1] - this._lastPosition[1],
      newPos[2] - this._lastPosition[2],
    ];

    this._mobject.moveTo(newPos);
    this._lastPosition = newPos;
    this._options.onDrag?.(this._mobject, newPos, delta);
  }

  private _endDrag(): void {
    this._isDragging = false;
    this._lastPosition = null;

    // Re-enable orbit controls after dragging
    if (this._scene instanceof ThreeDScene && this._scene.orbitControls) {
      this._scene.orbitControls.enable();
    }

    const finalPos = this._mobject.getCenter();
    this._options.onDragEnd?.(this._mobject, finalPos);
  }

  /**
   * Enable dragging.
   */
  enable(): void {
    this._enabled = true;
  }

  /**
   * Disable dragging.
   */
  disable(): void {
    this._enabled = false;
  }

  /**
   * Clean up event listeners.
   */
  dispose(): void {
    const canvas = this._scene.getCanvas();
    canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    canvas.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('touchend', this._onTouchEnd);
  }
}

/**
 * Factory function to make a mobject draggable.
 * @param mobject - The mobject to make draggable
 * @param scene - The scene containing the mobject
 * @param options - Draggable configuration options
 * @returns A new Draggable instance
 */
export function makeDraggable(
  mobject: Mobject,
  scene: Scene,
  options?: DraggableOptions,
): Draggable {
  return new Draggable(mobject, scene, options);
}
