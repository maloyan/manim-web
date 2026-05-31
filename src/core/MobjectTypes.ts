import * as THREE from 'three';

/**
 * Vector3 type as a tuple for external API
 */
export type Vector3Tuple = [number, number, number];

/**
 * Options for rotation and other operations that can accept an axis or a full options object
 */
export type AxisOrOptions = {
  axis?: Vector3Tuple;
  aboutPoint?: Vector3Tuple;
  aboutEdge?: Vector3Tuple;
};

// Direction constants (matching Manim's coordinate system)
export const UP: Vector3Tuple = [0, 1, 0];
export const DOWN: Vector3Tuple = [0, -1, 0];
export const LEFT: Vector3Tuple = [-1, 0, 0];
export const RIGHT: Vector3Tuple = [1, 0, 0];
export const OUT: Vector3Tuple = [0, 0, 1];
export const IN: Vector3Tuple = [0, 0, -1];
export const ORIGIN: Vector3Tuple = [0, 0, 0];

// Diagonal direction constants
export const UL: Vector3Tuple = [-1, 1, 0]; // UP + LEFT
export const UR: Vector3Tuple = [1, 1, 0]; // UP + RIGHT
export const DL: Vector3Tuple = [-1, -1, 0]; // DOWN + LEFT
export const DR: Vector3Tuple = [1, -1, 0]; // DOWN + RIGHT

/**
 * Style properties for mobjects
 */
export interface MobjectStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

/**
 * Duck-type interface for Mobject, used to avoid circular imports.
 * MobjectPositioning, MobjectState, and other helper modules use this
 * instead of importing the concrete Mobject class.
 *
 * Only includes public members; protected/private members like _style
 * and _opacity are accessed via bracket notation in helper modules.
 */
export interface MobjectLike {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scaleVector: THREE.Vector3;
  children: MobjectLike[];
  color: string;
  opacity: number;
  strokeWidth: number;
  fillOpacity: number;
  savedState: MobjectLike | null;
  targetCopy: MobjectLike | null;
  __savedMobjectState: unknown;
  _threeObject: THREE.Object3D | null;
  _dirty: boolean;
  _isVMobject: boolean;
  _markDirty(): void;
  getThreeObject(): THREE.Object3D;
  _syncWorldMatrices(): THREE.Object3D;
  getCenter(): Vector3Tuple;
  getBounds(): {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  getBoundingBox(): { width: number; height: number; depth: number };
  moveTo(target: Vector3Tuple | MobjectLike, alignedEdge?: Vector3Tuple): MobjectLike;
  rotate(angle: number, axisOrOptions?: Vector3Tuple | AxisOrOptions): MobjectLike;
  copy(): MobjectLike;
  restoreState(): boolean;
  getFamily(): MobjectLike[];
  applyFunctionAboutPoint(fn: (pts: number[][]) => number[][], aboutPoint?: number[]): MobjectLike;
}

/**
 * Interface for duck-typing VMobject properties from Mobject base class.
 * Avoids circular import of VMobject while maintaining type safety.
 */
export interface VMobjectLike {
  _points3D: number[][];
  _visiblePointCount: number | null;
  _geometryDirty: boolean;
  setPoints(points: number[][] | { x: number; y: number }[]): void;
  getLocalPoints(): number[][];
  getPoints(): number[][];
}

/**
 * Type guard to check if a MobjectLike has VMobject-like point data.
 */
export function isVMobjectLike(m: MobjectLike): m is MobjectLike & VMobjectLike {
  return '_points3D' in m;
}

/**
 * Type guard to check if a MobjectLike is a VMobject (has Bezier curves).
 */
export function isVMobject(m: MobjectLike): m is MobjectLike & VMobjectLike {
  return m._isVMobject;
}
