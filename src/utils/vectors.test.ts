import { describe, it, expect } from 'vitest';
import { scaleVec, addVec, subVec, linspace } from './vectors';

describe('scaleVec', () => {
  it('scales a vector by a positive scalar', () => {
    expect(scaleVec(2, [1, 0, 0])).toEqual([2, 0, 0]);
    expect(scaleVec(3, [1, 2, 3])).toEqual([3, 6, 9]);
  });

  it('scales by zero', () => {
    expect(scaleVec(0, [5, 10, 15])).toEqual([0, 0, 0]);
  });

  it('scales by negative scalar', () => {
    expect(scaleVec(-1, [1, 2, 3])).toEqual([-1, -2, -3]);
  });

  it('scales by fractional scalar', () => {
    expect(scaleVec(0.5, [4, 6, 8])).toEqual([2, 3, 4]);
  });

  it('preserves the zero vector', () => {
    expect(scaleVec(100, [0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('addVec', () => {
  it('adds two vectors', () => {
    expect(addVec([1, 0, 0], [0, 1, 0])).toEqual([1, 1, 0]);
  });

  it('adds three vectors', () => {
    expect(addVec([1, 0, 0], [0, 1, 0], [0, 0, 1])).toEqual([1, 1, 1]);
  });

  it('returns [0,0,0] for no arguments', () => {
    expect(addVec()).toEqual([0, 0, 0]);
  });

  it('identity with single vector', () => {
    expect(addVec([3, 4, 5])).toEqual([3, 4, 5]);
  });

  it('handles negative components', () => {
    expect(addVec([1, -1, 0], [-1, 1, 0])).toEqual([0, 0, 0]);
  });
});

describe('subVec', () => {
  it('subtracts two vectors', () => {
    expect(subVec([3, 5, 7], [1, 2, 3])).toEqual([2, 3, 4]);
  });

  it('a - a = zero vector', () => {
    expect(subVec([4, 5, 6], [4, 5, 6])).toEqual([0, 0, 0]);
  });

  it('a - zero = a', () => {
    expect(subVec([1, 2, 3], [0, 0, 0])).toEqual([1, 2, 3]);
  });

  it('zero - a = -a', () => {
    expect(subVec([0, 0, 0], [1, 2, 3])).toEqual([-1, -2, -3]);
  });
});

describe('linspace', () => {
  it('generates evenly spaced values', () => {
    const result = linspace(0, 10, 5);
    expect(result).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it('generates 3 points from 0 to 1', () => {
    expect(linspace(0, 1, 3)).toEqual([0, 0.5, 1]);
  });

  it('single point returns start', () => {
    expect(linspace(5, 10, 1)).toEqual([5]);
  });

  it('zero points returns empty array', () => {
    expect(linspace(0, 10, 0)).toEqual([]);
  });

  it('handles start > stop', () => {
    const result = linspace(10, 0, 3);
    expect(result).toEqual([10, 5, 0]);
  });

  it('handles negative range', () => {
    const result = linspace(-5, 5, 3);
    expect(result).toEqual([-5, 0, 5]);
  });

  it('two points returns start and stop', () => {
    expect(linspace(0, 1, 2)).toEqual([0, 1]);
  });
});
