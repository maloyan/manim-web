/**
 * Shared types of the 3D cell kit.
 */

import type { Vector3Tuple } from '../../../core/Mobject';
import type { ToonPreset, ToonShadingOptions } from '../../../rendering/toon/toonShading';

/** How much geometry to build: segment counts and instance counts. */
export type CellDetail = 'low' | 'medium' | 'high';

/** The look applied to every part: a toon preset, toon options, or false for plain shading. */
export type CellLook = ToonShadingOptions | ToonPreset | false;

/** Caption text of an organelle: a title, one short sentence, an optional footnote. */
export interface OrganelleInfo {
  title: string;
  body: string;
  footnote?: string;
}

/** Options shared by every organelle class. */
export interface Organelle3DOptions {
  /** Centre of the organelle in its parent frame. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Main color. Default: the organelle palette color. */
  color?: string;
  /**
   * Per-name color overrides, by part name or palette name (for example
   * `{ cristae: '#ff8a80', ribosome: '#e040fb' }`).
   */
  colors?: Record<string, string>;
  /** Seed for the random layout of the parts. Default: 1 */
  seed?: number;
  /** Segment and instance counts. Default: 'medium' */
  detail?: CellDetail;
  /**
   * The look of every part: 'manim' (bright rim stroke over a soft body),
   * 'cartoon', toon options, or false for plain shading. Default: 'manim'
   */
  style?: CellLook;
  /** Caption overrides, merged over `ORGANELLE_INFO`. */
  info?: Partial<OrganelleInfo>;
}

/** Options of {@link Organelle3D.buildAnimation}. */
export interface BuildAnimationOptions {
  /** Total run time in seconds. Default: depends on the organelle (about 2 to 3 s). */
  duration?: number;
  /** Lag between the parts, 0 (together) to 1 (one after the other). Default: 0.45 */
  lagRatio?: number;
}

/** One named organelle in the input of a {@link Cell3D}. */
export interface OrganelleSpec3D {
  /**
   * Organelle kind: 'nucleus', 'rough er', 'smooth er', 'golgi apparatus',
   * 'mitochondrion', 'lysosome', 'peroxisome', 'vesicle', 'centrosome',
   * 'cytoskeleton' (aliases: 'golgi', 'mitochondria', 'er').
   */
  name: string;
  /** Unique name for getOrganelle(). Default: the name, then 'name 2', 'name 3', ... */
  id?: string;
  /** Centre relative to the cell centre. Default: auto layout. */
  position?: Vector3Tuple;
  /** Size scale relative to the default size for this cell radius. Default: 1 */
  size?: number;
  /** How many copies to auto-place (mitochondria, vesicles). Default: 1 */
  count?: number;
  /** Main color override. */
  color?: string;
  /** Extra options passed to the organelle class (for example `{ cutaway: true }`). */
  options?: Record<string, unknown>;
}

/** A placed organelle of a {@link Cell3D}: the layout sphere used to avoid overlap. */
export interface CellLayoutEntry {
  id: string;
  kind: string;
  center: Vector3Tuple;
  radius: number;
  /** Id of the organelle this one wraps by design (rough ER wraps the nucleus). */
  wraps?: string;
}
