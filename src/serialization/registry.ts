/**
 * The serializable-mobject registry: a map from a type name to the pair of
 * functions that convert that type to and from `props`.
 *
 * New types register through {@link registerSerializableMobject}; the default
 * registrations live in `defaults.ts` and run as a side effect of importing
 * the serialization entry point.
 */

import type { Mobject } from '../core/Mobject';
import type { MobjectSerializer } from './types';

const registry = new Map<string, MobjectSerializer>();

/**
 * Register a serializer for a mobject type.
 *
 * @param name - The type name, which must match the mobject's class name
 *   (`mobject.constructor.name`) so instances can be looked up at capture time.
 * @param serializer - The serialize/deserialize pair for this type.
 */
export function registerSerializableMobject<T extends Mobject>(
  name: string,
  serializer: MobjectSerializer<T>,
): void {
  // A serializer for a subtype is sound where a base-typed one is expected, so
  // the store is widened to the base type. `unknown` keeps `any` out of the API.
  registry.set(name, serializer as unknown as MobjectSerializer);
}

/** Remove a registration. Mainly for tests and hot-swapping. */
export function unregisterSerializableMobject(name: string): void {
  registry.delete(name);
}

/** Look up a serializer by type name, or `undefined` when none is registered. */
export function getSerializer(name: string): MobjectSerializer | undefined {
  return registry.get(name);
}

/** The names of every registered type, sorted for stable output. */
export function getSerializableTypes(): string[] {
  return [...registry.keys()].sort();
}
