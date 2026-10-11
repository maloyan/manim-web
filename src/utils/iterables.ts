/**
 * Operations on iterables, ported from ManimCE `manim/utils/iterables.py`.
 *
 * Some helpers are thin wrappers over native `Array` operations. They are
 * ported anyway to keep name-parity with ManimCE's public API:
 *  - `concatenateLists`       (CE `concatenate_lists`)
 *  - `listify`                (CE `listify`)
 *  - `removeNones`            (CE `remove_nones`)
 *  - `allElementsAreInstances` (CE `all_elements_are_instances`)
 *  - `makeEvenByCycling`      (CE `make_even_by_cycling`)
 *
 * `powerset` is not part of ManimCE 0.22.0 `iterables.py`; it is added here as
 * a genuinely useful combinatorial helper (present in older manim variants).
 *
 * Public names are camelCased to match the rest of manim-web (ManimCE's
 * snake_case originals are noted in each "Mirrors ManimCE" reference).
 */

/** A key function that maps an element to a value used for equality checks. */
type KeyFn<T> = (item: T) => unknown;

/**
 * Return the sequence split cyclically into `n`-length tuples.
 *
 * Mirrors ManimCE `adjacent_n_tuples`.
 *
 * @example
 * adjacentNTuples([1, 2, 3, 4], 2); // [[1,2],[2,3],[3,4],[4,1]]
 * adjacentNTuples([1, 2, 3, 4], 3); // [[1,2,3],[2,3,4],[3,4,1],[4,1,2]]
 */
export function adjacentNTuples<T>(objects: readonly T[], n: number): T[][] {
  const len = objects.length;
  if (len === 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < len; i++) {
    const tuple: T[] = [];
    for (let j = 0; j < n; j++) {
      tuple.push(objects[(i + j) % len]);
    }
    result.push(tuple);
  }
  return result;
}

/**
 * Alias for `adjacentNTuples(objects, 2)`. Mirrors ManimCE `adjacent_pairs`.
 *
 * @example
 * adjacentPairs([1, 2, 3]); // [[1,2],[2,3],[3,1]]
 */
export function adjacentPairs<T>(objects: readonly T[]): T[][] {
  return adjacentNTuples(objects, 2);
}

/**
 * Remove duplicate elements while preserving order, keeping the LAST
 * occurrence of each element. Used instead of `[...new Set(l)]` when the
 * last-occurrence ordering matters (mirrors ManimCE `remove_list_redundancies`).
 *
 * @example
 * removeListRedundancies([1, 2, 1, 3, 2]); // [1, 3, 2]
 */
export function removeListRedundancies<T>(lst: readonly T[]): T[] {
  const reversedResult: T[] = [];
  const used = new Set<T>();
  for (let i = lst.length - 1; i >= 0; i--) {
    const x = lst[i];
    if (!used.has(x)) {
      reversedResult.push(x);
      used.add(x);
    }
  }
  reversedResult.reverse();
  return reversedResult;
}

/**
 * Return the elements of `l1` that are not present in `l2`.
 *
 * An optional `key` function determines which elements count as equal.
 * Mirrors ManimCE `list_difference_update`.
 *
 * @example
 * listDifferenceUpdate([1, 2, 3, 4, 1], [2, 4]); // [1, 3, 1]
 */
export function listDifferenceUpdate<T, U>(
  l1: readonly T[],
  l2: readonly U[],
  key?: KeyFn<T | U>,
): T[] {
  if (key === undefined) {
    const removal = new Set<T | U>(l2);
    return l1.filter((e) => !removal.has(e));
  }
  const l2Keys = new Set<unknown>(l2.map((e) => key(e)));
  return l1.filter((e) => !l2Keys.has(key(e)));
}

/**
 * Return a new list of the elements of `l1` not present in `l2`, followed by
 * every element of `l2`. Order is preserved. Mirrors ManimCE `list_update`.
 *
 * @example
 * listUpdate([1, 2, 3], [2, 4, 4]); // [1, 3, 2, 4, 4]
 */
export function listUpdate<T, U>(
  l1: readonly T[],
  l2: readonly U[],
  key?: KeyFn<T | U>,
): (T | U)[] {
  const kept: (T | U)[] = listDifferenceUpdate<T, U>(l1, l2, key);
  return kept.concat(l2);
}

/**
 * Convert a value to an array intelligently. A string becomes a single-element
 * array; any other iterable is spread; anything else is wrapped.
 *
 * ManimCE `tuplify` returns a tuple; JavaScript has no distinct tuple type, so
 * this returns an array.
 *
 * @example
 * tuplify("str");  // ["str"]
 * tuplify([1, 2]); // [1, 2]
 * tuplify(5);      // [5]
 */
export function tuplify<T>(obj: T | readonly T[] | string): (T | string)[] {
  if (typeof obj === 'string') return [obj];
  if (obj !== null && typeof obj === 'object' && Symbol.iterator in obj) {
    return [...(obj as Iterable<T>)];
  }
  return [obj as T];
}

/**
 * Extend the shorter of two iterables with duplicate values until both have
 * the same length (favours earlier elements). Mirrors ManimCE `make_even`.
 *
 * @example
 * makeEven([1, 2], [3, 4, 5, 6]); // [[1,1,2,2], [3,4,5,6]]
 */
export function makeEven<T, U>(iterable1: readonly T[], iterable2: readonly U[]): [T[], U[]] {
  const len1 = iterable1.length;
  const len2 = iterable2.length;
  const length = Math.max(len1, len2);
  const out1: T[] = [];
  const out2: U[] = [];
  for (let n = 0; n < length; n++) {
    out1.push(iterable1[Math.floor((n * len1) / length)]);
    out2.push(iterable2[Math.floor((n * len2) / length)]);
  }
  return [out1, out2];
}

/**
 * Resample a numeric array up to `length` by index duplication (favours earlier
 * elements). Mirrors ManimCE `stretch_array_to_length`.
 *
 * @throws if `length` is shorter than the input (matches ManimCE, which raises).
 * @example
 * stretchArrayToLength([1, 2], 4); // [1, 1, 2, 2]
 */
export function stretchArrayToLength<T>(array: readonly T[], length: number): T[] {
  const currLen = array.length;
  if (currLen > length) {
    throw new Error('Trying to stretch array to a length shorter than its own');
  }
  const result: T[] = [];
  for (let i = 0; i < length; i++) {
    result.push(array[Math.floor((i / length) * currLen)]);
  }
  return result;
}

/**
 * Yield every unique element from the given iterables, in order of first
 * appearance. Mirrors ManimCE `uniq_chain` (a lazy generator).
 *
 * @example
 * [...uniqChain([1, 2], [2, 3], [1, 4, 4])]; // [1, 2, 3, 4]
 */
export function* uniqChain<T>(...args: Iterable<T>[]): Generator<T, void, undefined> {
  const seen = new Set<T>();
  for (const iterable of args) {
    for (const x of iterable) {
      if (seen.has(x)) continue;
      seen.add(x);
      yield x;
    }
  }
}

/**
 * Return every subset of `items` (the power set), as an array of arrays.
 * The result has `2 ** items.length` entries.
 *
 * Not in ManimCE 0.22.0; added as a useful combinatorial helper.
 *
 * @example
 * powerset([1, 2]); // [[], [1], [2], [1, 2]]
 */
export function powerset<T>(items: readonly T[]): T[][] {
  const result: T[][] = [[]];
  for (const item of items) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i], item]);
    }
  }
  return result;
}

/**
 * Return `true` when every element of `iterable` is an instance of `Class`.
 * Mirrors ManimCE `all_elements_are_instances`.
 */
export function allElementsAreInstances<T>(
  iterable: Iterable<unknown>,
  ctor: abstract new (...args: never[]) => T,
): boolean {
  for (const e of iterable) {
    if (!(e instanceof ctor)) return false;
  }
  return true;
}

/**
 * Combine the given iterables into one flat list (one level deep).
 * Mirrors ManimCE `concatenate_lists`.
 *
 * @example
 * concatenateLists([1, 2], [3, 4], [5]); // [1, 2, 3, 4, 5]
 */
export function concatenateLists<T>(...listOfLists: Iterable<T>[]): T[] {
  const result: T[] = [];
  for (const lst of listOfLists) {
    for (const item of lst) result.push(item);
  }
  return result;
}

/**
 * Convert a value to a list intelligently. A string becomes a single-element
 * array; any other iterable is spread; anything else is wrapped.
 *
 * Mirrors ManimCE `listify` (equivalent to `tuplify`, kept for name-parity).
 *
 * @example
 * listify("str");  // ["str"]
 * listify([1, 2]); // [1, 2]
 * listify(5);      // [5]
 */
export function listify<T>(obj: T | readonly T[] | string): (T | string)[] {
  if (typeof obj === 'string') return [obj];
  if (obj !== null && typeof obj === 'object' && Symbol.iterator in obj) {
    return [...(obj as Iterable<T>)];
  }
  return [obj as T];
}

/**
 * Return the elements of `sequence` that are truthy (drops values where
 * `Boolean(x)` is `false`). Mirrors ManimCE `remove_nones`.
 *
 * @example
 * removeNones(["m", "", "l", 0, 42, false, true]); // ["m", "l", 42, true]
 */
export function removeNones<T>(sequence: Iterable<T>): NonNullable<T>[] {
  const result: NonNullable<T>[] = [];
  for (const x of sequence) {
    if (x) result.push(x as NonNullable<T>);
  }
  return result;
}

/**
 * Extend the shorter of two iterables by cycling its values until both have
 * the same length. Mirrors ManimCE `make_even_by_cycling`.
 *
 * @example
 * makeEvenByCycling([1, 2], [3, 4, 5, 6]); // [[1,2,1,2], [3,4,5,6]]
 */
export function makeEvenByCycling<T, U>(
  iterable1: readonly T[],
  iterable2: readonly U[],
): [T[], U[]] {
  const length = Math.max(iterable1.length, iterable2.length);
  const out1: T[] = [];
  const out2: U[] = [];
  for (let n = 0; n < length; n++) {
    out1.push(iterable1[n % iterable1.length]);
    out2.push(iterable2[n % iterable2.length]);
  }
  return [out1, out2];
}

/**
 * Determine a deterministic numeric hash, even for mutable objects.
 *
 * ManimCE `hash_obj` relies on Python's `hash`; JavaScript has none, so this
 * builds a canonical string for the value (object keys sorted, sets sorted)
 * and folds it with a 32-bit FNV-1a hash.
 */
export function hashObj(obj: unknown): number {
  return fnv1a(canonicalize(obj));
}

function canonicalize(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  const type = typeof obj;
  if (type === 'string') return `s:${obj as string}`;
  if (type === 'number' || type === 'boolean' || type === 'bigint') {
    return `${type[0]}:${String(obj)}`;
  }
  if (obj instanceof Set) {
    const parts = [...obj].map(canonicalize).sort();
    return `set:[${parts.join(',')}]`;
  }
  if (obj instanceof Map) {
    const parts = [...obj.entries()]
      .map(([k, v]) => `${canonicalize(k)}=${canonicalize(v)}`)
      .sort();
    return `map:{${parts.join(',')}}`;
  }
  if (Array.isArray(obj)) {
    return `arr:[${obj.map(canonicalize).join(',')}]`;
  }
  if (type === 'object') {
    const record = obj as Record<string, unknown>;
    const parts = Object.keys(record)
      .sort()
      .map((k) => `${k}=${canonicalize(record[k])}`);
    return `obj:{${parts.join(',')}}`;
  }
  return `${type}:${String(obj)}`;
}

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
