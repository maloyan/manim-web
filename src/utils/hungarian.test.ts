import { describe, it, expect } from 'vitest';
import { hungarian, hungarianFromSimilarity } from './hungarian';

describe('hungarian', () => {
  it('returns empty result for empty matrix', () => {
    const result = hungarian([]);
    expect(result.assignments).toEqual([]);
    expect(result.totalCost).toBe(0);
    expect(result.assignedRows.size).toBe(0);
    expect(result.assignedCols.size).toBe(0);
  });

  it('returns unassigned rows when cols are empty', () => {
    const result = hungarian([[], [], []]);
    expect(result.assignments).toEqual([-1, -1, -1]);
    expect(result.totalCost).toBe(0);
  });

  it('solves a 1x1 matrix', () => {
    const result = hungarian([[42]]);
    expect(result.assignments).toEqual([0]);
    expect(result.totalCost).toBe(42);
    expect(result.assignedRows).toEqual(new Set([0]));
    expect(result.assignedCols).toEqual(new Set([0]));
  });

  it('solves a 2x2 matrix', () => {
    const result = hungarian([
      [1, 2],
      [3, 0],
    ]);
    // Optimal: row 0 -> col 0 (cost 1), row 1 -> col 1 (cost 0), total = 1
    expect(result.assignments).toEqual([0, 1]);
    expect(result.totalCost).toBe(1);
  });

  it('solves the 3x3 example from docstring', () => {
    const cost = [
      [10, 5, 13],
      [3, 7, 15],
      [8, 12, 11],
    ];
    const result = hungarian(cost);
    // Optimal assignment: row 0->col 1(5), row 1->col 0(3), row 2->col 2(11) = 19
    expect(result.totalCost).toBe(19);
    expect(result.assignments[0]).toBe(1);
    expect(result.assignments[1]).toBe(0);
    expect(result.assignments[2]).toBe(2);
  });

  it('solves a 3x3 identity-cost matrix', () => {
    const cost = [
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ];
    const result = hungarian(cost);
    expect(result.totalCost).toBe(0);
    expect(result.assignments).toEqual([0, 1, 2]);
  });

  it('handles a matrix with all equal costs', () => {
    const cost = [
      [5, 5, 5],
      [5, 5, 5],
      [5, 5, 5],
    ];
    const result = hungarian(cost);
    expect(result.totalCost).toBe(15);
    // Any permutation is valid, just verify one-to-one
    const assignedCols = new Set(result.assignments);
    expect(assignedCols.size).toBe(3);
  });

  it('handles rectangular matrix with more columns than rows', () => {
    const cost = [
      [4, 1, 3, 8],
      [2, 0, 5, 7],
    ];
    const result = hungarian(cost);
    // Optimal: row 0->col 0(4) or col 2(3), row 1->col 1(0)
    // Actually: row 0->col 2(3), row 1->col 1(0) = 3, or row 0->col 0(4), row 1->col 1(0) = 4
    // Best: row 0->col 1(1), row 1->col 0(2) = 3 — wait let's check all
    // row0->col0(4)+row1->col1(0) = 4
    // row0->col1(1)+row1->col0(2) = 3
    // row0->col2(3)+row1->col1(0) = 3
    // row0->col1(1)+row1->col2(5) = 6
    // row0->col1(1)+row1->col3(7) = 8
    // Minimum is 3, achieved by either (0->1,1->0) or (0->2,1->1)
    expect(result.totalCost).toBe(3);
    expect(result.assignedRows.size).toBe(2);
    expect(result.assignedCols.size).toBe(2);
  });

  it('handles rectangular matrix with more rows than columns', () => {
    const cost = [
      [4, 1],
      [2, 0],
      [3, 5],
    ];
    const result = hungarian(cost);
    // Only 2 columns, so one row must be unassigned (-1)
    // Optimal 2-assignment: row 0->col 1(1)+row 1->col 0(2) = 3
    // or row 1->col 1(0)+row 0->col 0(4) = 4
    // or row 1->col 1(0)+row 2->col 0(3) = 3
    // Best is cost 3
    expect(result.totalCost).toBe(3);
    const assigned = result.assignments.filter((a) => a !== -1);
    expect(assigned.length).toBe(2);
    // Verify one-to-one: no duplicate column assignments
    expect(new Set(assigned).size).toBe(2);
  });

  it('assigns all rows and columns for square matrix', () => {
    const cost = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const result = hungarian(cost);
    expect(result.assignedRows.size).toBe(3);
    expect(result.assignedCols.size).toBe(3);
    // Optimal: row 0->col 2(3), row 1->col 1(5), row 2->col 0(7) = 15
    // or row 0->col 0(1)+row 1->col 1(5)+row 2->col 2(9)=15
    // Actually: 0->0(1)+1->1(5)+2->2(9)=15 vs 0->2(3)+1->1(5)+2->0(7)=15
    // vs 0->1(2)+1->0(4)+2->2(9)=15 ... all permutations sum to 15!
    // Actually no: 0->0(1)+1->2(6)+2->1(8)=15, 0->1(2)+1->2(6)+2->0(7)=15
    // This is a magic square-like property. Let's just verify totalCost.
    expect(result.totalCost).toBe(15);
  });

  it('handles zero-cost matrix', () => {
    const cost = [
      [0, 0],
      [0, 0],
    ];
    const result = hungarian(cost);
    expect(result.totalCost).toBe(0);
    expect(result.assignedRows.size).toBe(2);
  });

  it('handles large cost differences', () => {
    const cost = [
      [1, 1000],
      [1000, 1],
    ];
    const result = hungarian(cost);
    expect(result.assignments).toEqual([0, 1]);
    expect(result.totalCost).toBe(2);
  });
});

describe('hungarianFromSimilarity', () => {
  it('returns empty result for empty matrix', () => {
    const result = hungarianFromSimilarity([]);
    expect(result.assignments).toEqual([]);
    expect(result.totalCost).toBe(0);
  });

  it('returns unassigned for empty-column matrix', () => {
    const result = hungarianFromSimilarity([[], []]);
    expect(result.assignments).toEqual([-1, -1]);
    expect(result.totalCost).toBe(0);
  });

  it('matches highest similarities', () => {
    const sim = [
      [10, 1],
      [1, 10],
    ];
    const result = hungarianFromSimilarity(sim);
    // Should assign row 0 -> col 0 (sim 10), row 1 -> col 1 (sim 10)
    expect(result.assignments).toEqual([0, 1]);
  });

  it('filters assignments below threshold', () => {
    const sim = [
      [0.9, 0.1],
      [0.1, 0.2],
    ];
    const result = hungarianFromSimilarity(sim, 0.5);
    // row 0 -> col 0 (0.9 >= 0.5), row 1 -> col 1 (0.2 < 0.5 => unassigned)
    expect(result.assignments[0]).toBe(0);
    expect(result.assignments[1]).toBe(-1);
    expect(result.assignedRows.has(0)).toBe(true);
    expect(result.assignedRows.has(1)).toBe(false);
  });

  it('unassigns all when everything is below threshold', () => {
    const sim = [
      [0.1, 0.2],
      [0.3, 0.4],
    ];
    const result = hungarianFromSimilarity(sim, 1.0);
    expect(result.assignments).toEqual([-1, -1]);
    expect(result.assignedRows.size).toBe(0);
    expect(result.assignedCols.size).toBe(0);
  });

  it('handles 3x3 similarity with default threshold', () => {
    const sim = [
      [9, 2, 1],
      [3, 8, 2],
      [1, 3, 7],
    ];
    const result = hungarianFromSimilarity(sim);
    // Optimal: row 0->col 0(9), row 1->col 1(8), row 2->col 2(7) = 24
    expect(result.assignments).toEqual([0, 1, 2]);
  });

  it('handles rectangular similarity matrix', () => {
    const sim = [
      [10, 1, 5],
      [1, 10, 1],
    ];
    const result = hungarianFromSimilarity(sim);
    expect(result.assignments[0]).toBe(0);
    expect(result.assignments[1]).toBe(1);
  });
});
