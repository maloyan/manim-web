/**
 * Scene serialization (best-manim).
 *
 * Serialize a scene or a single mobject to a plain, JSON-safe document, store
 * or deep-link it, and reload it in another session. The format is open: new
 * mobject types register their own serializer, so the schema grows without a
 * central union to edit.
 *
 * Importing this module registers the default serializers (common geometry,
 * groups, and text) as a side effect.
 */

import { registerDefaultSerializers } from './defaults';

registerDefaultSerializers();

export {
  serializeScene,
  deserializeScene,
  serializeMobject,
  deserializeMobject,
} from './serialize';

export {
  registerSerializableMobject,
  unregisterSerializableMobject,
  getSerializer,
  getSerializableTypes,
} from './registry';

export type {
  SerializedScene,
  SerializedMobject,
  SerializedTransform,
  SerializedStyle,
  MobjectSerializer,
  SceneLike,
  ContainerLike,
  Vec3,
} from './types';

export {
  encodeStateToHash,
  decodeStateFromHash,
  writeStateToUrl,
  readStateFromUrl,
  onUrlStateChange,
  bindStateToUrl,
} from './urlState';

export type {
  WriteStateOptions,
  BindUrlStateOptions,
  UrlStateBinding,
  UrlStateController,
} from './urlState';
