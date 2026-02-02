/**
 * SelectionManager - Mouse-based mobject selection for InteractiveScene.
 *
 * Provides:
 * - Click-to-select (raycasting via Three.js Raycaster)
 * - Shift+click to add/remove from selection
 * - Box/lasso selection (click-drag rectangle)
 * - Visual feedback (highlight outline on selected mobjects)
 * - Select All (Ctrl+A) and Deselect (Escape)
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../core/Mobject';
import { Scene } from '../core/Scene';

/**
 * Options for configuring the SelectionManager.
 */
export interface SelectionManagerOptions {
  /** Color of the selection highlight outline. Defaults to '#FFFF00' (yellow). */
  highlightColor?: string;
  /** Width of the selection highlight outline. Defaults to 2. */
  highlightWidth?: number;
  /** Opacity of the box selection overlay. Defaults to 0.15. */
  boxSelectOpacity?: number;
  /** Color of the box selection overlay. Defaults to '#58C4DD' (manim blue). */
  boxSelectColor?: string;
  /** Callback when selection changes. */
  onSelectionChange?: (selected: ReadonlySet<Mobject>) => void;
}

/**
 * Manages interactive selection of mobjects in a Scene.
 *
 * Attach to a Scene to enable click-to-select, shift-multi-select,
 * and box/lasso selection with visual feedback.
 */
export class SelectionManager {
  private _scene: Scene;
  private _selected: Set<Mobject> = new Set();
  private _options: Required<SelectionManagerOptions>;
  private _enabled: boolean = true;

  // Three.js raycaster for hit-testing
  private _raycaster: THREE.Raycaster = new THREE.Raycaster();
  private _mouse: THREE.Vector2 = new THREE.Vector2();

  // Visual feedback: highlight outlines stored per-mobject
  private _highlights: Map<Mobject, THREE.LineSegments> = new Map();

  // Box-select state
  private _isBoxSelecting: boolean = false;
  private _boxStart: { x: number; y: number } | null = null;
  private _boxOverlay: HTMLDivElement | null = null;

  // Drag threshold to distinguish click from box-select
  private _dragThreshold: number = 5; // pixels

  // Event handler references for cleanup
  private _onMouseDown: (e: MouseEvent) => void;
  private _onMouseMove: (e: MouseEvent) => void;
  private _onMouseUp: (e: MouseEvent) => void;
  private _onKeyDown: (e: KeyboardEvent) => void;

  /**
   * Create a new SelectionManager.
   * @param scene - The Scene whose mobjects can be selected
   * @param options - Configuration options
   */
  constructor(scene: Scene, options: SelectionManagerOptions = {}) {
    this._scene = scene;
    this._options = {
      highlightColor: options.highlightColor ?? '#FFFF00',
      highlightWidth: options.highlightWidth ?? 2,
      boxSelectOpacity: options.boxSelectOpacity ?? 0.15,
      boxSelectColor: options.boxSelectColor ?? '#58C4DD',
      onSelectionChange: options.onSelectionChange ?? (() => {}),
    };

    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);

    this._setupEventListeners();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Currently selected mobjects (read-only view). */
  get selected(): ReadonlySet<Mobject> {
    return this._selected;
  }

  /** Number of currently selected mobjects. */
  get count(): number {
    return this._selected.size;
  }

  /** Whether the manager is enabled. */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /** Enable selection interactions. */
  enable(): void {
    this._enabled = true;
  }

  /** Disable selection interactions. Clears current selection. */
  disable(): void {
    this._enabled = false;
    this.deselectAll();
  }

  /**
   * Programmatically select one or more mobjects.
   * @param mobjects - Mobjects to select
   */
  select(...mobjects: Mobject[]): void {
    for (const mob of mobjects) {
      if (!this._selected.has(mob)) {
        this._selected.add(mob);
        this._addHighlight(mob);
      }
    }
    this._notifyChange();
  }

  /**
   * Programmatically deselect one or more mobjects.
   * @param mobjects - Mobjects to deselect
   */
  deselect(...mobjects: Mobject[]): void {
    for (const mob of mobjects) {
      if (this._selected.has(mob)) {
        this._selected.delete(mob);
        this._removeHighlight(mob);
      }
    }
    this._notifyChange();
  }

  /**
   * Toggle selection state of a mobject.
   * @param mob - Mobject to toggle
   */
  toggleSelect(mob: Mobject): void {
    if (this._selected.has(mob)) {
      this.deselect(mob);
    } else {
      this.select(mob);
    }
  }

  /**
   * Select all mobjects currently in the scene.
   */
  selectAll(): void {
    for (const mob of this._scene.mobjects) {
      if (!this._selected.has(mob)) {
        this._selected.add(mob);
        this._addHighlight(mob);
      }
    }
    this._notifyChange();
  }

  /**
   * Deselect all mobjects, removing all highlights.
   */
  deselectAll(): void {
    for (const mob of this._selected) {
      this._removeHighlight(mob);
    }
    this._selected.clear();
    this._notifyChange();
  }

  /**
   * Check if a specific mobject is selected.
   */
  isSelected(mob: Mobject): boolean {
    return this._selected.has(mob);
  }

  /**
   * Get selected mobjects as an array (ordered by selection time).
   */
  getSelectedArray(): Mobject[] {
    return Array.from(this._selected);
  }

  /**
   * Clean up event listeners and highlights.
   */
  dispose(): void {
    this.deselectAll();
    this._teardownEventListeners();
    if (this._boxOverlay && this._boxOverlay.parentElement) {
      this._boxOverlay.parentElement.removeChild(this._boxOverlay);
    }
  }

  // ---------------------------------------------------------------------------
  // Event setup / teardown
  // ---------------------------------------------------------------------------

  private _setupEventListeners(): void {
    const canvas = this._scene.getCanvas();
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('keydown', this._onKeyDown);
  }

  private _teardownEventListeners(): void {
    const canvas = this._scene.getCanvas();
    canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('keydown', this._onKeyDown);
  }

  // ---------------------------------------------------------------------------
  // Mouse handlers
  // ---------------------------------------------------------------------------

  private _handleMouseDown(e: MouseEvent): void {
    if (!this._enabled) return;
    // Only handle left button
    if (e.button !== 0) return;

    this._boxStart = { x: e.clientX, y: e.clientY };
    this._isBoxSelecting = false;
  }

  private _handleMouseMove(e: MouseEvent): void {
    if (!this._enabled || !this._boxStart) return;

    const dx = e.clientX - this._boxStart.x;
    const dy = e.clientY - this._boxStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Start box selection once we exceed the drag threshold
    if (!this._isBoxSelecting && distance > this._dragThreshold) {
      this._isBoxSelecting = true;
      this._createBoxOverlay();
    }

    if (this._isBoxSelecting && this._boxOverlay) {
      this._updateBoxOverlay(e.clientX, e.clientY);
    }
  }

  private _handleMouseUp(e: MouseEvent): void {
    if (!this._enabled || !this._boxStart) return;

    if (this._isBoxSelecting) {
      // Finish box selection
      this._finishBoxSelect(e);
    } else {
      // It was a click (not a drag) -- point select
      this._handleClick(e);
    }

    this._boxStart = null;
    this._isBoxSelecting = false;
    this._removeBoxOverlay();
  }

  private _handleClick(e: MouseEvent): void {
    const hit = this._pickMobject(e.clientX, e.clientY);

    if (e.shiftKey) {
      // Shift+click: toggle the clicked mobject
      if (hit) {
        this.toggleSelect(hit);
      }
    } else {
      // Plain click: select only the clicked mobject (clear others)
      this.deselectAll();
      if (hit) {
        this.select(hit);
      }
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (!this._enabled) return;

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl/Cmd+A: select all
    if (isCtrlOrMeta && e.key === 'a') {
      e.preventDefault();
      this.selectAll();
      return;
    }

    // Escape: deselect all
    if (e.key === 'Escape') {
      this.deselectAll();
      return;
    }
  }

  // ---------------------------------------------------------------------------
  // Box selection
  // ---------------------------------------------------------------------------

  private _createBoxOverlay(): void {
    if (this._boxOverlay) return;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.border = `1px solid ${this._options.boxSelectColor}`;
    overlay.style.backgroundColor = this._options.boxSelectColor;
    overlay.style.opacity = String(this._options.boxSelectOpacity);
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10000';
    document.body.appendChild(overlay);
    this._boxOverlay = overlay;
  }

  private _updateBoxOverlay(currentX: number, currentY: number): void {
    if (!this._boxOverlay || !this._boxStart) return;

    const left = Math.min(this._boxStart.x, currentX);
    const top = Math.min(this._boxStart.y, currentY);
    const width = Math.abs(currentX - this._boxStart.x);
    const height = Math.abs(currentY - this._boxStart.y);

    this._boxOverlay.style.left = `${left}px`;
    this._boxOverlay.style.top = `${top}px`;
    this._boxOverlay.style.width = `${width}px`;
    this._boxOverlay.style.height = `${height}px`;
  }

  private _removeBoxOverlay(): void {
    if (this._boxOverlay && this._boxOverlay.parentElement) {
      this._boxOverlay.parentElement.removeChild(this._boxOverlay);
    }
    this._boxOverlay = null;
  }

  private _finishBoxSelect(e: MouseEvent): void {
    if (!this._boxStart) return;

    const canvas = this._scene.getCanvas();
    const rect = canvas.getBoundingClientRect();

    // Convert box corners from screen to world coordinates
    const startWorld = this._screenToWorld(this._boxStart.x, this._boxStart.y, rect);
    const endWorld = this._screenToWorld(e.clientX, e.clientY, rect);

    const minX = Math.min(startWorld[0], endWorld[0]);
    const maxX = Math.max(startWorld[0], endWorld[0]);
    const minY = Math.min(startWorld[1], endWorld[1]);
    const maxY = Math.max(startWorld[1], endWorld[1]);

    if (!e.shiftKey) {
      this.deselectAll();
    }

    // Select all mobjects whose centers lie within the box
    for (const mob of this._scene.mobjects) {
      const center = mob.getCenter();
      if (center[0] >= minX && center[0] <= maxX &&
          center[1] >= minY && center[1] <= maxY) {
        this.select(mob);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Hit testing (Raycasting)
  // ---------------------------------------------------------------------------

  /**
   * Pick the topmost scene mobject under the given screen coordinates.
   * Uses Three.js Raycaster for accurate intersection testing.
   */
  private _pickMobject(clientX: number, clientY: number): Mobject | null {
    const canvas = this._scene.getCanvas();
    const rect = canvas.getBoundingClientRect();

    // Normalized device coords (-1 to 1)
    this._mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const camera = this._scene.camera.getCamera();
    this._raycaster.setFromCamera(this._mouse, camera);

    // Collect all Three.js objects from scene mobjects
    const threeObjects: THREE.Object3D[] = [];
    const objToMobject = new Map<THREE.Object3D, Mobject>();

    for (const mob of this._scene.mobjects) {
      const threeObj = mob.getThreeObject();
      // Traverse the Three.js hierarchy to collect all meshes/lines
      threeObj.traverse((child) => {
        threeObjects.push(child);
        objToMobject.set(child, mob);
      });
    }

    const intersects = this._raycaster.intersectObjects(threeObjects, false);

    if (intersects.length > 0) {
      // Walk up to find the scene-level mobject owner
      for (const hit of intersects) {
        const mob = this._findOwnerMobject(hit.object, objToMobject);
        if (mob) return mob;
      }
    }

    // Fallback: bounding-box hit test (for mobjects whose Three.js geometry
    // doesn't register raycaster hits, e.g. line-only VMobjects)
    return this._boundingBoxPick(clientX, clientY, rect);
  }

  /**
   * Find the scene-level Mobject that owns a Three.js object.
   */
  private _findOwnerMobject(
    obj: THREE.Object3D,
    objToMobject: Map<THREE.Object3D, Mobject>
  ): Mobject | null {
    const mob = objToMobject.get(obj);
    if (mob) return mob;

    // Walk up Three.js parent chain
    let current: THREE.Object3D | null = obj.parent;
    while (current) {
      const found = objToMobject.get(current);
      if (found) return found;
      current = current.parent;
    }
    return null;
  }

  /**
   * Fallback bounding-box pick for mobjects that don't register raycaster hits.
   */
  private _boundingBoxPick(
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): Mobject | null {
    const worldPos = this._screenToWorld(clientX, clientY, rect);

    // Check all mobjects, pick the topmost (last added = highest z in scene order)
    let best: Mobject | null = null;
    for (const mob of this._scene.mobjects) {
      const center = mob.getCenter();
      const bounds = (mob as any)._getBoundingBox?.() ?? { width: 1, height: 1 };

      if (
        Math.abs(worldPos[0] - center[0]) <= bounds.width / 2 &&
        Math.abs(worldPos[1] - center[1]) <= bounds.height / 2
      ) {
        best = mob; // later mobjects overwrite = topmost
      }
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // Visual feedback (highlight outlines)
  // ---------------------------------------------------------------------------

  private _addHighlight(mob: Mobject): void {
    if (this._highlights.has(mob)) return;

    const threeObj = mob.getThreeObject();

    // Compute a bounding box around the mobject
    const box = new THREE.Box3().setFromObject(threeObj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Fallback for empty / zero-size bounding boxes
    if (size.x === 0 && size.y === 0) {
      size.set(0.5, 0.5, 0);
    }

    // Create a wireframe rectangle around the bounding box
    const hw = size.x / 2 + 0.08;
    const hh = size.y / 2 + 0.08;

    const vertices = new Float32Array([
      -hw, -hh, 0,
       hw, -hh, 0,
       hw,  hh, 0,
      -hw,  hh, 0,
      -hw, -hh, 0,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(this._options.highlightColor),
      linewidth: this._options.highlightWidth,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
    });

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(hw * 2, hh * 2, 0.001)
      ),
      material
    );

    outline.position.copy(center);
    outline.renderOrder = 999;

    // Add to the Three.js scene directly (not as a child of the mobject)
    this._scene.threeScene.add(outline);
    this._highlights.set(mob, outline);

    // Force a render to show the highlight immediately
    this._scene.render();
  }

  private _removeHighlight(mob: Mobject): void {
    const outline = this._highlights.get(mob);
    if (!outline) return;

    this._scene.threeScene.remove(outline);
    outline.geometry.dispose();
    (outline.material as THREE.Material).dispose();
    this._highlights.delete(mob);

    this._scene.render();
  }

  /**
   * Refresh highlight positions for all selected mobjects.
   * Call this after moving/transforming selected mobjects.
   */
  refreshHighlights(): void {
    for (const mob of this._selected) {
      this._removeHighlight(mob);
      this._addHighlight(mob);
    }
  }

  // ---------------------------------------------------------------------------
  // Coordinate conversion helpers
  // ---------------------------------------------------------------------------

  private _screenToWorld(
    clientX: number,
    clientY: number,
    rect?: DOMRect
  ): Vector3Tuple {
    const canvas = this._scene.getCanvas();
    const r = rect ?? canvas.getBoundingClientRect();

    const ndcX = ((clientX - r.left) / r.width) * 2 - 1;
    const ndcY = -((clientY - r.top) / r.height) * 2 + 1;

    const camera = this._scene.camera;
    const worldX = ndcX * camera.frameWidth / 2;
    const worldY = ndcY * camera.frameHeight / 2;

    return [worldX, worldY, 0];
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private _notifyChange(): void {
    this._options.onSelectionChange(this._selected);
  }
}
