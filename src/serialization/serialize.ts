/**
 * The framework layer: capture a mobject's generic state (transform, style,
 * children) around the type-specific `props` that a registered serializer
 * provides, and restore it the same way.
 *
 * STATE serialization only. The scene's visible mobjects and their properties
 * are captured; animation timelines are out of scope for this version (see
 * `README` in this folder for what is and is not covered).
 */

import type { Mobject } from '../core/Mobject';
import { getSerializer } from './registry';
import {
  SCENE_FORMAT,
  SCENE_VERSION,
  type ContainerLike,
  type SceneLike,
  type SerializedMobject,
  type SerializedScene,
  type SerializedStyle,
  type SerializedTransform,
} from './types';
import { isRecord, readOptionalString, readVec3 } from './props';

const IDENTITY_TRANSFORM: SerializedTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

function captureTransform(mob: Mobject): SerializedTransform {
  return {
    position: [mob.position.x, mob.position.y, mob.position.z],
    rotation: [mob.rotation.x, mob.rotation.y, mob.rotation.z],
    scale: [mob.scaleVector.x, mob.scaleVector.y, mob.scaleVector.z],
  };
}

function captureStyle(mob: Mobject): SerializedStyle {
  const style: SerializedStyle = {};
  if (mob.strokeColor !== undefined) style.strokeColor = mob.strokeColor;
  if (mob.fillColor !== undefined) style.fillColor = mob.fillColor;
  if (typeof mob.opacity === 'number') style.strokeOpacity = mob.opacity;
  if (typeof mob.fillOpacity === 'number') style.fillOpacity = mob.fillOpacity;
  if (typeof mob.strokeWidth === 'number') style.strokeWidth = mob.strokeWidth;
  return style;
}

function applyTransform(mob: Mobject, transform: unknown): void {
  const source = isRecord(transform) ? transform : {};
  const position = readVec3(source.position, IDENTITY_TRANSFORM.position);
  const rotation = readVec3(source.rotation, IDENTITY_TRANSFORM.rotation);
  const scale = readVec3(source.scale, IDENTITY_TRANSFORM.scale);
  mob.position.set(position[0], position[1], position[2]);
  mob.rotation.set(rotation[0], rotation[1], rotation[2]);
  mob.scaleVector.set(scale[0], scale[1], scale[2]);
}

function applyStyle(mob: Mobject, style: unknown): void {
  const source = isRecord(style) ? style : {};
  if (typeof source.strokeWidth === 'number') mob.setStrokeWidth(source.strokeWidth);
  if (typeof source.strokeOpacity === 'number') mob.setStrokeOpacity(source.strokeOpacity);
  if (typeof source.fillOpacity === 'number') mob.setFillOpacity(source.fillOpacity);
  const strokeColor = readOptionalString(source.strokeColor);
  const fillColor = readOptionalString(source.fillColor);
  // `color` sets the backing `_color` plus both stroke and fill; set it first,
  // then override each side so distinct stroke/fill colors are preserved.
  if (strokeColor !== undefined) mob.color = strokeColor;
  if (strokeColor !== undefined) mob.strokeColor = strokeColor;
  if (fillColor !== undefined) mob.fillColor = fillColor;
}

/**
 * Capture a single mobject (and its submobject tree) as a JSON-safe object.
 *
 * An unregistered type is captured with `unknown: true` and empty `props`, so
 * the document still records its position in the tree for debugging, while a
 * restore skips it.
 */
export function serializeMobject(mob: Mobject): SerializedMobject {
  const type = mob.constructor.name;
  const serializer = getSerializer(type);
  const node: SerializedMobject = {
    type,
    props: serializer ? serializer.serialize(mob) : {},
    transform: captureTransform(mob),
    style: captureStyle(mob),
    children: mob.children.map(serializeMobject),
  };
  if (!serializer) node.unknown = true;
  return node;
}

/**
 * Reconstruct a single mobject from a serialized node, or `null` when the type
 * is unknown (unregistered or marked `unknown`). Known children are attached;
 * unknown children are dropped.
 */
export function deserializeMobject(json: unknown): Mobject | null {
  if (!isRecord(json)) return null;
  if (json.unknown === true) return null;

  const type = readOptionalString(json.type);
  if (type === undefined) return null;
  const serializer = getSerializer(type);
  if (!serializer) return null;

  const props = isRecord(json.props) ? json.props : {};
  const mob = serializer.deserialize(props);
  applyTransform(mob, json.transform);
  applyStyle(mob, json.style);

  if (Array.isArray(json.children)) {
    for (const childJson of json.children) {
      const child = deserializeMobject(childJson);
      if (child) mob.add(child);
    }
  }
  return mob;
}

/** Capture a whole scene (its top-level mobjects) as a JSON document. */
export function serializeScene(scene: SceneLike): SerializedScene {
  const mobjects: SerializedMobject[] = [];
  for (const mob of scene.mobjects) mobjects.push(serializeMobject(mob));
  return { format: SCENE_FORMAT, version: SCENE_VERSION, mobjects };
}

/**
 * Reconstruct the mobjects of a document and add each one to `container`.
 * Returns the created top-level mobjects. A malformed document yields `[]`.
 */
export function deserializeScene(json: unknown, container: ContainerLike): Mobject[] {
  if (!isRecord(json) || !Array.isArray(json.mobjects)) return [];
  const created: Mobject[] = [];
  for (const node of json.mobjects) {
    const mob = deserializeMobject(node);
    if (mob) {
      container.add(mob);
      created.push(mob);
    }
  }
  return created;
}
