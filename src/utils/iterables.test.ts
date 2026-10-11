import { describe, it, expect } from 'vitest';
import {
  adjacentNTuples,
  adjacentPairs,
  removeListRedundancies,
  listDifferenceUpdate,
  listUpdate,
  tuplify,
  makeEven,
  stretchArrayToLength,
  uniqChain,
  powerset,
  hashObj,
  allElementsAreInstances,
  concatenateLists,
  listify,
  removeNones,
  makeEvenByCycling,
} from './iterables';

describe('iterables (ManimCE parity)', () => {
  it('adjacentPairs cycles back to the first element', () => {
    expect(adjacentPairs([1, 2, 3])).toEqual([
      [1, 2],
      [2, 3],
      [3, 1],
    ]);
  });

  it('adjacentNTuples builds cyclic n-length tuples', () => {
    expect(adjacentNTuples([1, 2, 3, 4], 3)).toEqual([
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 1],
      [4, 1, 2],
    ]);
    expect(adjacentNTuples([], 2)).toEqual([]);
  });

  it('removeListRedundancies keeps the last occurrence, preserving order', () => {
    expect(removeListRedundancies([1, 2, 1, 3, 2])).toEqual([1, 3, 2]);
  });

  it('listDifferenceUpdate removes elements present in the second list', () => {
    expect(listDifferenceUpdate([1, 2, 3, 4, 1], [2, 4])).toEqual([1, 3, 1]);
  });

  it('listDifferenceUpdate honours a key function', () => {
    expect(listDifferenceUpdate(['a', 'b', 'A', 'C'], ['A', 'D'], (s) => s.toLowerCase())).toEqual([
      'b',
      'C',
    ]);
  });

  it('listUpdate appends the second list after the trimmed first', () => {
    expect(listUpdate([1, 2, 3], [2, 4, 4])).toEqual([1, 3, 2, 4, 4]);
  });

  it('tuplify converts intelligently', () => {
    expect(tuplify('str')).toEqual(['str']);
    expect(tuplify([1, 2])).toEqual([1, 2]);
    expect(tuplify(5)).toEqual([5]);
  });

  it('makeEven extends the shorter list favouring earlier elements', () => {
    expect(makeEven([1, 2], [3, 4, 5, 6])).toEqual([
      [1, 1, 2, 2],
      [3, 4, 5, 6],
    ]);
  });

  it('stretchArrayToLength resamples up and rejects shrinking', () => {
    expect(stretchArrayToLength([1, 2], 4)).toEqual([1, 1, 2, 2]);
    expect(() => stretchArrayToLength([1, 2, 3], 2)).toThrow();
  });

  it('uniqChain yields unique elements in order', () => {
    expect([...uniqChain([1, 2], [2, 3], [1, 4, 4])]).toEqual([1, 2, 3, 4]);
  });

  it('powerset returns 2^n subsets', () => {
    for (const n of [0, 1, 2, 3, 4]) {
      const items = Array.from({ length: n }, (_, i) => i);
      expect(powerset(items).length).toBe(2 ** n);
    }
    expect(powerset([1, 2])).toEqual([[], [1], [2], [1, 2]]);
  });

  it('hashObj is deterministic and order-independent for objects/sets', () => {
    expect(hashObj({ a: 1, b: 2 })).toBe(hashObj({ b: 2, a: 1 }));
    expect(hashObj(new Set([1, 2, 3]))).toBe(hashObj(new Set([3, 2, 1])));
    expect(hashObj([1, 2])).not.toBe(hashObj([2, 1]));
    expect(typeof hashObj('x')).toBe('number');
  });
});

describe('allElementsAreInstances', () => {
  it('is true when every element is an instance of the class', () => {
    expect(allElementsAreInstances([new Map(), new Map()], Map)).toBe(true);
  });

  it('is false when any element is not an instance', () => {
    expect(allElementsAreInstances([new Map(), new Set()], Map)).toBe(false);
  });

  it('is true for an empty iterable', () => {
    expect(allElementsAreInstances([], Map)).toBe(true);
  });
});

describe('concatenateLists', () => {
  it('combines iterables into one flat list', () => {
    expect(concatenateLists([1, 2], [3, 4], [5])).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns an empty list when given nothing', () => {
    expect(concatenateLists<number>()).toEqual([]);
  });
});

describe('listify', () => {
  it('wraps a string in a single-element array', () => {
    expect(listify('str')).toEqual(['str']);
  });

  it('spreads an iterable', () => {
    expect(listify([1, 2])).toEqual([1, 2]);
  });

  it('wraps a non-iterable value', () => {
    expect(listify(5)).toEqual([5]);
  });
});

describe('removeNones', () => {
  it('drops falsy values and keeps truthy ones', () => {
    expect(removeNones(['m', '', 'l', 0, 42, false, true])).toEqual(['m', 'l', 42, true]);
  });
});

describe('makeEvenByCycling', () => {
  it('cycles the shorter iterable to match the longer one', () => {
    expect(makeEvenByCycling([1, 2], [3, 4, 5, 6])).toEqual([
      [1, 2, 1, 2],
      [3, 4, 5, 6],
    ]);
  });

  it('cycles with an odd target length', () => {
    expect(makeEvenByCycling([1, 2], [3, 4, 5, 6, 7])).toEqual([
      [1, 2, 1, 2, 1],
      [3, 4, 5, 6, 7],
    ]);
  });
});
