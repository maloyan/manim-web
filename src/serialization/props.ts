/**
 * Runtime narrowing helpers for reading untrusted JSON `props` without `any`.
 *
 * Every reader takes `unknown` and a fallback, and returns a value of the
 * expected type. This keeps the deserialization code total: a malformed or
 * missing field falls back instead of throwing.
 */

import type { Vec3 } from './types';

/** Read a number, or `fallback` when the value is not a finite number. */
export function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Read a string, or `fallback` when the value is not a string. */
export function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/** Read a boolean, or `fallback` when the value is not a boolean. */
export function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Read an optional string: a string, or `undefined`. */
export function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** True when `value` is a 3-element array of finite numbers. */
function isVec3(value: unknown): value is Vec3 {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

/** Read a `[x, y, z]` triple, or `fallback` when the value is not one. */
export function readVec3(value: unknown, fallback: Vec3): Vec3 {
  return isVec3(value) ? [value[0], value[1], value[2]] : fallback;
}

/** Read an array of `[x, y, z]` triples, dropping any malformed entries. */
export function readVec3Array(value: unknown): Vec3[] {
  if (!Array.isArray(value)) return [];
  const result: Vec3[] = [];
  for (const entry of value) {
    if (isVec3(entry)) result.push([entry[0], entry[1], entry[2]]);
  }
  return result;
}

/** True when `value` is a non-null, non-array object (a props/record bag). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
