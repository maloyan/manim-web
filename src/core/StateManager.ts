/**
 * StateManager - Scene state serialization, save/restore, and undo/redo.
 *
 * Provides:
 * - MobjectState: JSON-serializable snapshot of a single mobject
 * - serializeMobject / deserializeMobject: capture and restore mobject properties
 * - SceneStateManager: undo/redo stacks for full scene snapshots
 *
 * Compatible with the existing Restore animation (TransformExtensions)
 * which expects `mobject.savedState` to be a VMobject copy.
 */

import { Mobject, MobjectStyle } from './Mobject';
import { VMobject, Point } from './VMobject';

// ---------------------------------------------------------------------------
// Serializable state interfaces
// ---------------------------------------------------------------------------

/**
 * JSON-serializable snapshot of a single mobject's visual state.
 * Captures position, rotation, scale, style, and VMobject-specific data.
 */
export interface MobjectState {
  /** Mobject id at time of capture (used for lookup during restore) */
  id: string;

  /** Position [x, y, z] */
  position: [number, number, number];

  /** Euler rotation [x, y, z, order] */
  rotation: [number, number, number, string];

  /** Scale [x, y, z] */
  scale: [number, number, number];

  /** CSS color string */
  color: string;

  /** Overall stroke opacity 0-1 */
  opacity: number;

  /** Stroke width */
  strokeWidth: number;

  /** Fill opacity 0-1 */
  fillOpacity: number;

  /** Full style object */
  style: MobjectStyle;

  // VMobject-specific (only present for VMobject instances)

  /** 2D points [{x,y}, ...] */
  points2D?: Point[];

  /** 3D Bezier control points [[x,y,z], ...] */
  points3D?: number[][];

  /** Visible point count (null means all) */
  visiblePointCount?: number | null;

  /** Recursively captured child states */
  children: MobjectState[];

  /** Optional user-supplied custom data */
  custom?: Record<string, unknown>;
}

/**
 * A full scene snapshot: an ordered array of top-level mobject states.
 */
export interface SceneSnapshot {
  /** Human-readable label (optional) */
  label?: string;

  /** Timestamp (ms) when snapshot was taken */
  timestamp: number;

  /** Ordered array of top-level mobject states (one per scene mobject) */
  mobjects: MobjectState[];
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

/**
 * Capture a JSON-serializable snapshot of a mobject and its hierarchy.
 * Non-destructive: does not modify the mobject in any way.
 *
 * @param mob - The mobject to serialize
 * @returns A deep, JSON-safe MobjectState
 */
export function serializeMobject(mob: Mobject): MobjectState {
  const state: MobjectState = {
    id: mob.id,
    position: [mob.position.x, mob.position.y, mob.position.z],
    rotation: [mob.rotation.x, mob.rotation.y, mob.rotation.z, mob.rotation.order],
    scale: [mob.scaleVector.x, mob.scaleVector.y, mob.scaleVector.z],
    color: mob.color,
    opacity: mob.opacity,
    strokeWidth: mob.strokeWidth,
    fillOpacity: mob.fillOpacity,
    style: { ...mob.style },
    children: [],
  };

  // VMobject-specific properties
  if (mob instanceof VMobject) {
    state.points2D = mob.points.map(p => ({ x: p.x, y: p.y }));
    state.points3D = mob.getPoints().map(p => [...p]);
    state.visiblePointCount = (mob as any)._visiblePointCount ?? null;
  }

  // Recursively capture children
  for (const child of mob.children) {
    state.children.push(serializeMobject(child));
  }

  return state;
}

/**
 * Restore a mobject's properties from a previously captured state.
 * Applies position, rotation, scale, style, and VMobject points.
 * Does NOT add/remove children -- it restores properties of existing children
 * matched by array index (same order as when serialized).
 *
 * @param mob - The mobject to restore
 * @param state - The state to apply
 */
export function deserializeMobject(mob: Mobject, state: MobjectState): void {
  // Position
  mob.position.set(state.position[0], state.position[1], state.position[2]);

  // Rotation
  mob.rotation.set(state.rotation[0], state.rotation[1], state.rotation[2], state.rotation[3] as any);

  // Scale
  mob.scaleVector.set(state.scale[0], state.scale[1], state.scale[2]);

  // Visual properties
  mob.color = state.color;
  mob.setOpacity(state.opacity);
  mob.strokeWidth = state.strokeWidth;
  mob.fillOpacity = state.fillOpacity;

  // Style
  mob.setStyle(state.style);

  // VMobject-specific
  if (mob instanceof VMobject) {
    if (state.points3D && state.points3D.length > 0) {
      mob.setPoints(state.points3D);
    } else if (state.points2D && state.points2D.length > 0) {
      mob.setPoints(state.points2D);
    }
    if (state.visiblePointCount !== undefined) {
      (mob as any)._visiblePointCount = state.visiblePointCount;
      (mob as any)._geometryDirty = true;
    }
  }

  // Recursively restore children by index
  const minLen = Math.min(mob.children.length, state.children.length);
  for (let i = 0; i < minLen; i++) {
    deserializeMobject(mob.children[i], state.children[i]);
  }

  // Mark dirty so Three.js syncs
  mob._markDirty();
}

/**
 * Convert a MobjectState to a plain JSON string.
 * Useful for persisting to localStorage or sending over the network.
 */
export function stateToJSON(state: MobjectState): string {
  return JSON.stringify(state);
}

/**
 * Parse a JSON string back into a MobjectState.
 */
export function stateFromJSON(json: string): MobjectState {
  return JSON.parse(json) as MobjectState;
}

/**
 * Convert a SceneSnapshot to a plain JSON string.
 */
export function snapshotToJSON(snapshot: SceneSnapshot): string {
  return JSON.stringify(snapshot);
}

/**
 * Parse a JSON string back into a SceneSnapshot.
 */
export function snapshotFromJSON(json: string): SceneSnapshot {
  return JSON.parse(json) as SceneSnapshot;
}

// ---------------------------------------------------------------------------
// SceneStateManager - undo / redo stacks
// ---------------------------------------------------------------------------

/**
 * Manages undo/redo state for a collection of mobjects (typically a Scene).
 *
 * Usage:
 * ```ts
 * const mgr = new SceneStateManager(scene.mobjects);
 * mgr.save();          // push current state onto undo stack
 * // ... user makes edits ...
 * mgr.undo();          // restore previous state
 * mgr.redo();          // re-apply the undone edit
 * ```
 *
 * The manager does not own the mobjects -- it reads/writes them through
 * a getter so that additions/removals from the scene are reflected.
 */
export class SceneStateManager {
  /** Maximum number of undo entries. Oldest are discarded when exceeded. */
  readonly maxDepth: number;

  /** Undo stack (newest on top) */
  private _undoStack: SceneSnapshot[] = [];

  /** Redo stack (newest on top, cleared on new save) */
  private _redoStack: SceneSnapshot[] = [];

  /**
   * Function that returns the current ordered set of scene mobjects.
   * We store a getter rather than a static list so the manager always
   * reflects the live scene contents.
   */
  private _getMobjects: () => Mobject[];

  /**
   * @param getMobjects - Getter returning the current scene mobjects (ordered)
   * @param maxDepth - Maximum undo stack depth (default 50)
   */
  constructor(getMobjects: () => Mobject[], maxDepth: number = 50) {
    this._getMobjects = getMobjects;
    this.maxDepth = maxDepth;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Capture the current scene state and push it onto the undo stack.
   * Clears the redo stack (new action branch).
   *
   * @param label - Optional human-readable label for this snapshot
   * @returns The captured SceneSnapshot (for inspection / persistence)
   */
  save(label?: string): SceneSnapshot {
    const snapshot = this._captureSnapshot(label);
    this._undoStack.push(snapshot);

    // Enforce max depth
    if (this._undoStack.length > this.maxDepth) {
      this._undoStack.shift(); // discard oldest
    }

    // New save clears the redo stack (new timeline branch)
    this._redoStack = [];

    return snapshot;
  }

  /**
   * Undo: restore the most recently saved state.
   * Pushes the current state onto the redo stack first.
   *
   * @returns true if undo was applied, false if nothing to undo
   */
  undo(): boolean {
    if (this._undoStack.length === 0) return false;

    // Save current state for redo before overwriting
    const currentSnapshot = this._captureSnapshot('(pre-undo)');
    this._redoStack.push(currentSnapshot);

    // Pop and apply
    const snapshot = this._undoStack.pop()!;
    this._applySnapshot(snapshot);

    return true;
  }

  /**
   * Redo: re-apply the last undone state.
   * Pushes the current state onto the undo stack first.
   *
   * @returns true if redo was applied, false if nothing to redo
   */
  redo(): boolean {
    if (this._redoStack.length === 0) return false;

    // Save current state for undo before overwriting
    const currentSnapshot = this._captureSnapshot('(pre-redo)');
    this._undoStack.push(currentSnapshot);
    if (this._undoStack.length > this.maxDepth) {
      this._undoStack.shift();
    }

    // Pop and apply
    const snapshot = this._redoStack.pop()!;
    this._applySnapshot(snapshot);

    return true;
  }

  /**
   * Get a snapshot of the current scene state without pushing it
   * onto any stack.
   */
  getState(label?: string): SceneSnapshot {
    return this._captureSnapshot(label);
  }

  /**
   * Apply a previously captured snapshot, overwriting the current scene
   * state. Does NOT modify undo/redo stacks -- call save() first if you
   * want the current state preserved.
   */
  setState(snapshot: SceneSnapshot): void {
    this._applySnapshot(snapshot);
  }

  /**
   * Clear both undo and redo stacks.
   */
  clearHistory(): void {
    this._undoStack = [];
    this._redoStack = [];
  }

  /** Number of available undo steps */
  get undoCount(): number {
    return this._undoStack.length;
  }

  /** Number of available redo steps */
  get redoCount(): number {
    return this._redoStack.length;
  }

  /** Whether undo is available */
  get canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /** Whether redo is available */
  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  /** Read-only view of the undo stack (newest last) */
  get undoStack(): ReadonlyArray<SceneSnapshot> {
    return this._undoStack;
  }

  /** Read-only view of the redo stack (newest last) */
  get redoStack(): ReadonlyArray<SceneSnapshot> {
    return this._redoStack;
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private _captureSnapshot(label?: string): SceneSnapshot {
    const mobjects = this._getMobjects();
    return {
      label,
      timestamp: Date.now(),
      mobjects: mobjects.map(m => serializeMobject(m)),
    };
  }

  private _applySnapshot(snapshot: SceneSnapshot): void {
    const mobjects = this._getMobjects();
    const minLen = Math.min(mobjects.length, snapshot.mobjects.length);
    for (let i = 0; i < minLen; i++) {
      deserializeMobject(mobjects[i], snapshot.mobjects[i]);
    }
  }
}

// ---------------------------------------------------------------------------
// Mobject-level saveState / restoreState helpers
// ---------------------------------------------------------------------------

/**
 * Save the current state of a mobject using JSON-serializable snapshots.
 * Stores:
 * - A JSON-serializable MobjectState on `mob.__savedMobjectState`
 * - A deep copy on `mob.savedState` (for Restore animation compatibility)
 *
 * This is the functional counterpart to `mob.saveState()`. Both produce
 * identical results; use whichever API style you prefer.
 *
 * @param mob - The mobject to save
 * @returns The captured MobjectState
 */
export function saveMobjectState(mob: Mobject): MobjectState {
  const state = serializeMobject(mob);

  // Store serializable state
  mob.__savedMobjectState = state;

  // Store deep copy for Restore animation (TransformExtensions expects
  // mobject.savedState to be a Mobject copy)
  mob.savedState = mob.copy();

  return state;
}

/**
 * Restore a mobject from its JSON-serializable saved state
 * (from saveMobjectState or serializeMobject).
 *
 * This is the functional counterpart to `mob.restoreState()`.
 * Unlike the class method which uses the deep-copy path,
 * this function uses the JSON-serializable MobjectState.
 *
 * @param mob - The mobject to restore
 * @returns true if state was restored, false if no saved state exists
 */
export function restoreMobjectState(mob: Mobject): boolean {
  const state = mob.__savedMobjectState as MobjectState | undefined;
  if (!state) return false;

  deserializeMobject(mob, state);
  return true;
}
