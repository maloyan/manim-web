/**
 * InteractiveScene - ManimGL-style authoring tools for interactive editing.
 *
 * Extends Scene with:
 * - Mouse-based mobject selection (via SelectionManager)
 * - Keyboard shortcuts: undo/redo, delete, copy/paste, group/ungroup
 * - Color palette HUD for quick color application
 * - Drag-to-reposition for selected mobjects
 *
 * Usage is opt-in: create an InteractiveScene instead of Scene to enable
 * interactive authoring tools. Regular Scene is unaffected.
 */

import * as THREE from 'three';
import { Scene, SceneOptions } from './Scene';
import { Mobject, Vector3Tuple } from './Mobject';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { serializeMobject, deserializeMobject, MobjectState } from './StateManager';
import {
  SelectionManager,
  SelectionManagerOptions,
} from '../interaction/SelectionManager';
import {
  RED, BLUE, GREEN, YELLOW, ORANGE, PURPLE, TEAL, PINK,
  WHITE, GRAY, MAROON, GOLD,
} from '../constants/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options for configuring an InteractiveScene.
 */
export interface InteractiveSceneOptions extends SceneOptions {
  /** SelectionManager configuration. */
  selection?: SelectionManagerOptions;
  /** Whether to show the color palette HUD on launch. Defaults to false. */
  showColorPalette?: boolean;
  /** Hotkey to toggle color palette. Defaults to 'c'. */
  colorPaletteToggleKey?: string;
  /** Whether drag-to-reposition is enabled. Defaults to true. */
  enableDragMove?: boolean;
  /** Whether keyboard shortcuts are enabled. Defaults to true. */
  enableKeyboardShortcuts?: boolean;
}

/**
 * Internal clipboard entry: serialized mobject state + original class info.
 */
interface ClipboardEntry {
  state: MobjectState;
  /** We store a reference to the original mobject so we can call copy(). */
  sourceMobject: Mobject;
}

// ---------------------------------------------------------------------------
// InteractiveScene
// ---------------------------------------------------------------------------

/**
 * A Scene with ManimGL-style interactive authoring tools.
 *
 * Features:
 * - **Selection**: click, shift+click, box-select mobjects
 * - **Undo/Redo**: Ctrl+Z / Ctrl+Shift+Z (uses SceneStateManager)
 * - **Delete**: Delete/Backspace removes selected mobjects
 * - **Copy/Paste**: Ctrl+C / Ctrl+V with slight offset
 * - **Group/Ungroup**: Ctrl+G / Ctrl+Shift+G
 * - **Color Palette**: press 'C' to toggle an overlay with Manim colors
 * - **Drag Move**: drag selected mobjects to reposition them
 *
 * @example
 * ```ts
 * const scene = new InteractiveScene(container, { showColorPalette: true });
 * scene.add(new Circle(), new Square());
 * // Now you can click, drag, Ctrl+Z, etc.
 * ```
 */
export class InteractiveScene extends Scene {
  /** The selection manager handling click/box-select. */
  readonly selection: SelectionManager;

  // Clipboard for copy/paste
  private _clipboard: ClipboardEntry[] = [];

  // Options
  private _interactiveOptions: Required<
    Pick<
      InteractiveSceneOptions,
      'showColorPalette' | 'colorPaletteToggleKey' | 'enableDragMove' | 'enableKeyboardShortcuts'
    >
  >;

  // Color palette HUD
  private _paletteContainer: HTMLDivElement | null = null;
  private _paletteVisible: boolean = false;

  // Drag-move state
  private _isDragging: boolean = false;
  private _dragLastWorld: Vector3Tuple | null = null;

  // Mouse point tracking (like ManimGL's mouse_point)
  private _mousePoint: THREE.Vector3 = new THREE.Vector3();

  // Event handler refs
  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onMouseDownDrag: (e: MouseEvent) => void;
  private _onMouseMoveDrag: (e: MouseEvent) => void;
  private _onMouseUpDrag: (e: MouseEvent) => void;

  /**
   * Create a new InteractiveScene.
   * @param container - DOM element to render into
   * @param options - Interactive scene configuration
   */
  constructor(container: HTMLElement, options: InteractiveSceneOptions = {}) {
    super(container, options);

    this._interactiveOptions = {
      showColorPalette: options.showColorPalette ?? false,
      colorPaletteToggleKey: options.colorPaletteToggleKey ?? 'c',
      enableDragMove: options.enableDragMove ?? true,
      enableKeyboardShortcuts: options.enableKeyboardShortcuts ?? true,
    };

    // Initialize SelectionManager
    this.selection = new SelectionManager(this, options.selection);

    // Bind event handlers
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onMouseDownDrag = this._handleMouseDownDrag.bind(this);
    this._onMouseMoveDrag = this._handleMouseMoveDrag.bind(this);
    this._onMouseUpDrag = this._handleMouseUpDrag.bind(this);

    // Set up keyboard and drag listeners
    if (this._interactiveOptions.enableKeyboardShortcuts) {
      window.addEventListener('keydown', this._onKeyDown);
    }

    if (this._interactiveOptions.enableDragMove) {
      const canvas = this.getCanvas();
      canvas.addEventListener('mousedown', this._onMouseDownDrag);
      window.addEventListener('mousemove', this._onMouseMoveDrag);
      window.addEventListener('mouseup', this._onMouseUpDrag);
    }

    // Show palette if requested
    if (this._interactiveOptions.showColorPalette) {
      this._showColorPalette();
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Get the current mouse position in world coordinates.
   * Updated on every mouse move (like ManimGL's mouse_point).
   */
  get mousePoint(): THREE.Vector3 {
    return this._mousePoint.clone();
  }

  /**
   * Toggle the color palette HUD visibility.
   */
  toggleColorPalette(): void {
    if (this._paletteVisible) {
      this._hideColorPalette();
    } else {
      this._showColorPalette();
    }
  }

  /**
   * Programmatically delete the currently selected mobjects.
   * Saves state for undo before removing.
   */
  deleteSelected(): void {
    if (this.selection.count === 0) return;

    this.saveState();

    const toRemove = this.selection.getSelectedArray();
    this.selection.deselectAll();

    for (const mob of toRemove) {
      this.remove(mob);
    }
  }

  /**
   * Copy selected mobjects to the internal clipboard.
   */
  copySelected(): void {
    this._clipboard = [];
    for (const mob of this.selection.selected) {
      this._clipboard.push({
        state: serializeMobject(mob),
        sourceMobject: mob,
      });
    }
  }

  /**
   * Paste mobjects from the clipboard into the scene.
   * Copies are offset slightly from the originals.
   */
  pasteFromClipboard(): void {
    if (this._clipboard.length === 0) return;

    this.saveState();
    this.selection.deselectAll();

    const offset: Vector3Tuple = [0.3, -0.3, 0];

    for (const entry of this._clipboard) {
      // Create a deep copy via the original mobject's copy() method
      const clone = entry.sourceMobject.copy();
      // Apply saved state to ensure properties match
      deserializeMobject(clone, entry.state);
      // Offset the copy so it doesn't overlap the original
      clone.shift(offset);
      this.add(clone);
      this.selection.select(clone);
    }
  }

  /**
   * Group all selected mobjects into a new VGroup.
   * The individual mobjects are removed from the scene and replaced
   * by the group.
   */
  groupSelected(): void {
    const selected = this.selection.getSelectedArray();
    if (selected.length < 2) return;

    // Only group VMobjects (non-VMobjects are skipped)
    const vmobjects = selected.filter((m): m is VMobject => m instanceof VMobject);
    if (vmobjects.length < 2) return;

    this.saveState();
    this.selection.deselectAll();

    // Remove individuals from the scene
    for (const vm of vmobjects) {
      this.remove(vm);
    }

    // Create and add the group
    const group = new VGroup(...vmobjects);
    this.add(group);
    this.selection.select(group);
  }

  /**
   * Ungroup selected VGroups: replace each group with its children.
   */
  ungroupSelected(): void {
    const selected = this.selection.getSelectedArray();
    const groups = selected.filter((m): m is VGroup => m instanceof VGroup);
    if (groups.length === 0) return;

    this.saveState();
    this.selection.deselectAll();

    for (const group of groups) {
      // Extract children before removing the group
      const children = [...group.children] as VMobject[];
      this.remove(group);

      for (const child of children) {
        // Detach from old parent
        child.parent = null;
        this.add(child);
        this.selection.select(child);
      }
    }
  }

  /**
   * Apply a color to all selected mobjects.
   * @param color - CSS color string
   */
  applyColorToSelected(color: string): void {
    if (this.selection.count === 0) return;

    this.saveState();

    for (const mob of this.selection.selected) {
      mob.setColor(color);
    }

    this.render();
    this.selection.refreshHighlights();
  }

  // ---------------------------------------------------------------------------
  // Keyboard shortcut handling
  // ---------------------------------------------------------------------------

  private _handleKeyDown(e: KeyboardEvent): void {
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // --- Color palette toggle ---
    if (
      e.key.toLowerCase() === this._interactiveOptions.colorPaletteToggleKey &&
      !isCtrlOrMeta && !e.shiftKey && !e.altKey
    ) {
      // Only toggle if no input element is focused
      const active = document.activeElement;
      if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
        this.toggleColorPalette();
        return;
      }
    }

    // --- Undo: Ctrl+Z ---
    if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
      this.selection.refreshHighlights();
      return;
    }

    // --- Redo: Ctrl+Shift+Z or Ctrl+Y ---
    if (isCtrlOrMeta && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault();
      this.redo();
      this.selection.refreshHighlights();
      return;
    }

    // --- Delete/Backspace: remove selected ---
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Only if not focused on an input
      const active = document.activeElement;
      if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        this.deleteSelected();
        return;
      }
    }

    // --- Copy: Ctrl+C ---
    if (isCtrlOrMeta && e.key === 'c' && !e.shiftKey) {
      if (this.selection.count > 0) {
        this.copySelected();
        // Don't preventDefault so system clipboard still works for text
      }
      return;
    }

    // --- Paste: Ctrl+V ---
    if (isCtrlOrMeta && e.key === 'v') {
      if (this._clipboard.length > 0) {
        e.preventDefault();
        this.pasteFromClipboard();
      }
      return;
    }

    // --- Group: Ctrl+G ---
    if (isCtrlOrMeta && e.key === 'g' && !e.shiftKey) {
      e.preventDefault();
      this.groupSelected();
      return;
    }

    // --- Ungroup: Ctrl+Shift+G ---
    if (isCtrlOrMeta && e.key === 'G' && e.shiftKey) {
      e.preventDefault();
      this.ungroupSelected();
      return;
    }
  }

  // ---------------------------------------------------------------------------
  // Drag-move (reposition selected mobjects)
  // ---------------------------------------------------------------------------

  private _handleMouseDownDrag(e: MouseEvent): void {
    if (e.button !== 0) return;
    if (this.selection.count === 0) return;

    // Check if the click is on a selected mobject
    const worldPos = this._screenToWorldIScene(e.clientX, e.clientY);
    for (const mob of this.selection.selected) {
      const center = mob.getCenter();
      const bounds = (mob as any)._getBoundingBox?.() ?? { width: 1, height: 1 };

      if (
        Math.abs(worldPos[0] - center[0]) <= bounds.width / 2 &&
        Math.abs(worldPos[1] - center[1]) <= bounds.height / 2
      ) {
        // Start dragging
        this._isDragging = true;
        this._dragLastWorld = worldPos;
        this.saveState();
        return;
      }
    }
  }

  private _handleMouseMoveDrag(e: MouseEvent): void {
    // Always update mouse point
    const wp = this._screenToWorldIScene(e.clientX, e.clientY);
    this._mousePoint.set(wp[0], wp[1], wp[2]);

    if (!this._isDragging || !this._dragLastWorld) return;

    const currentWorld = wp;
    const delta: Vector3Tuple = [
      currentWorld[0] - this._dragLastWorld[0],
      currentWorld[1] - this._dragLastWorld[1],
      0,
    ];

    // Move all selected mobjects
    for (const mob of this.selection.selected) {
      mob.shift(delta);
    }

    this._dragLastWorld = currentWorld;
    this.render();
    this.selection.refreshHighlights();
  }

  private _handleMouseUpDrag(_e: MouseEvent): void {
    this._isDragging = false;
    this._dragLastWorld = null;
  }

  // ---------------------------------------------------------------------------
  // Color palette HUD
  // ---------------------------------------------------------------------------

  /** Standard Manim colors for the palette. */
  private static readonly PALETTE_COLORS: Array<{ name: string; value: string }> = [
    { name: 'Red', value: RED },
    { name: 'Blue', value: BLUE },
    { name: 'Green', value: GREEN },
    { name: 'Yellow', value: YELLOW },
    { name: 'Orange', value: ORANGE },
    { name: 'Purple', value: PURPLE },
    { name: 'Teal', value: TEAL },
    { name: 'Pink', value: PINK },
    { name: 'White', value: WHITE },
    { name: 'Gray', value: GRAY },
    { name: 'Maroon', value: MAROON },
    { name: 'Gold', value: GOLD },
  ];

  private _showColorPalette(): void {
    if (this._paletteContainer) return;

    const container = this.getContainer();
    const palette = document.createElement('div');
    palette.style.position = 'absolute';
    palette.style.bottom = '10px';
    palette.style.left = '50%';
    palette.style.transform = 'translateX(-50%)';
    palette.style.display = 'flex';
    palette.style.gap = '6px';
    palette.style.padding = '8px 12px';
    palette.style.background = 'rgba(28, 28, 28, 0.85)';
    palette.style.borderRadius = '8px';
    palette.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
    palette.style.zIndex = '9999';
    palette.style.userSelect = 'none';

    for (const { name, value } of InteractiveScene.PALETTE_COLORS) {
      const swatch = document.createElement('div');
      swatch.title = name;
      swatch.style.width = '24px';
      swatch.style.height = '24px';
      swatch.style.borderRadius = '4px';
      swatch.style.backgroundColor = value;
      swatch.style.border = '2px solid rgba(255,255,255,0.3)';
      swatch.style.cursor = 'pointer';
      swatch.style.transition = 'transform 0.1s, border-color 0.1s';

      swatch.addEventListener('mouseenter', () => {
        swatch.style.transform = 'scale(1.2)';
        swatch.style.borderColor = 'rgba(255,255,255,0.8)';
      });
      swatch.addEventListener('mouseleave', () => {
        swatch.style.transform = 'scale(1)';
        swatch.style.borderColor = 'rgba(255,255,255,0.3)';
      });
      swatch.addEventListener('click', () => {
        this.applyColorToSelected(value);
      });

      palette.appendChild(swatch);
    }

    container.style.position = container.style.position || 'relative';
    container.appendChild(palette);
    this._paletteContainer = palette;
    this._paletteVisible = true;
  }

  private _hideColorPalette(): void {
    if (this._paletteContainer && this._paletteContainer.parentElement) {
      this._paletteContainer.parentElement.removeChild(this._paletteContainer);
    }
    this._paletteContainer = null;
    this._paletteVisible = false;
  }

  // ---------------------------------------------------------------------------
  // Coordinate helpers
  // ---------------------------------------------------------------------------

  private _screenToWorldIScene(clientX: number, clientY: number): Vector3Tuple {
    const canvas = this.getCanvas();
    const rect = canvas.getBoundingClientRect();

    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;

    const cam = this.camera;
    const worldX = ndcX * cam.frameWidth / 2;
    const worldY = ndcY * cam.frameHeight / 2;

    return [worldX, worldY, 0];
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Clean up all resources including event listeners and HUD.
   */
  override dispose(): void {
    // Remove keyboard listener
    window.removeEventListener('keydown', this._onKeyDown);

    // Remove drag listeners
    const canvas = this.getCanvas();
    canvas.removeEventListener('mousedown', this._onMouseDownDrag);
    window.removeEventListener('mousemove', this._onMouseMoveDrag);
    window.removeEventListener('mouseup', this._onMouseUpDrag);

    // Dispose selection manager
    this.selection.dispose();

    // Remove palette
    this._hideColorPalette();

    // Base cleanup
    super.dispose();
  }
}
