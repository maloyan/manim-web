import { describe, it, expect } from 'vitest';
import { selectScatteredPoints, extractVectorsFrom3Points } from './math';

describe('selectScatteredPoints', () => {
  it('returns [] for empty', () => {
    expect(selectScatteredPoints([])).toEqual([]);
  });

  it('returns [0] for single point', () => {
    expect(selectScatteredPoints([[1, 2]])).toEqual([0]);
  });

  it('returns [0, 1] for two points', () => {
    expect(
      selectScatteredPoints([
        [0, 0],
        [1, 1],
      ]),
    ).toEqual([0, 1]);
  });

  it('selects opposite corners of square', () => {
    const square = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const indices = selectScatteredPoints(square);
    expect(indices[0]).toBe(0);
    expect(indices[1]).toBe(2); // opposite corner
  });
});

describe('extractVectorsFrom3Points', () => {
  it('returns null for < 3 points', () => {
    expect(extractVectorsFrom3Points([])).toBeNull();
    expect(extractVectorsFrom3Points([[0, 0]])).toBeNull();
  });

  it('extracts vectors from 3 points', () => {
    const result = extractVectorsFrom3Points([
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ]);
    expect(result!.v1).toEqual([1, 0, 0]);
    expect(result!.v2).toEqual([0, 1, 0]);
  });

  it('handles 2D points', () => {
    const result = extractVectorsFrom3Points([
      [0, 0],
      [2, 0],
      [0, 3],
    ]);
    expect(result!.v1).toEqual([2, 0, 0]);
    expect(result!.v2).toEqual([0, 3, 0]);
  });
});
