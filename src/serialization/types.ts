/**
 * JSON schema types for scene serialization.
 *
 * The format is intentionally flat and self-describing so a document can be
 * stored, deep-linked, and restored in another session. A document is a
 * {@link SerializedScene}; every mobject is a {@link SerializedMobject} whose
 * `type` names the registered factory, `props` holds the constructor-relevant
 * (unscaled) geometry, `transform` holds the position/rotation/scale, `style`
 * holds stroke/fill, and `children` holds the submobject tree.
 */

import type { Mobject } from '../core/Mobject';

/** A plain, JSON-safe triple. */
export type Vec3 = [number, number, number];

/** Position, rotation (Euler XYZ, radians), and scale of a mobject. */
export interface SerializedTransform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

/** Stroke and fill of a mobject. Only defined fields are written. */
export interface SerializedStyle {
  strokeColor?: string;
  fillColor?: string;
  strokeOpacity?: number;
  fillOpacity?: number;
  strokeWidth?: number;
}

/**
 * One serialized mobject.
 *
 * `props` is `Record<string, unknown>` on purpose: each registered type owns
 * the shape of its own props and narrows them on restore, so the schema stays
 * open for new types without a central union to edit.
 */
export interface SerializedMobject {
  /** Registered type name (its class name), e.g. `Circle`. */
  type: string;
  /** Constructor-relevant, unscaled properties for this type. */
  props: Record<string, unknown>;
  /** Position/rotation/scale, applied after construction. */
  transform: SerializedTransform;
  /** Stroke/fill, applied after construction. */
  style: SerializedStyle;
  /** Submobject tree. */
  children: SerializedMobject[];
  /**
   * Present and `true` when the type had no registered serializer at capture
   * time. Such a node is skipped (not reconstructed) on restore.
   */
  unknown?: boolean;
}

/** Current document version. Bump when the schema changes incompatibly. */
export const SCENE_FORMAT = 'manim-web-scene';
export const SCENE_VERSION = 1;

/** A full serialized scene document. */
export interface SerializedScene {
  format: typeof SCENE_FORMAT;
  version: number;
  mobjects: SerializedMobject[];
}

/**
 * A pair of functions that convert between a concrete mobject and its `props`.
 *
 * `serialize` returns only the type-specific, constructor-relevant props. The
 * transform, style, and children are captured generically by the framework, so
 * a serializer never repeats them.
 */
export interface MobjectSerializer<T extends Mobject = Mobject> {
  serialize: (mobject: T) => Record<string, unknown>;
  deserialize: (props: Record<string, unknown>) => T;
}

/** Anything the framework can read top-level mobjects from (e.g. a Scene). */
export interface SceneLike {
  mobjects: Iterable<Mobject>;
}

/** Anything the framework can add reconstructed mobjects to (e.g. a Scene). */
export interface ContainerLike {
  add: (...mobjects: Mobject[]) => unknown;
}
