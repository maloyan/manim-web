/**
 * Hungarian (Kuhn-Munkres) Algorithm for Optimal Assignment
 *
 * Solves the assignment problem: given an n x m cost matrix, find the
 * assignment of rows to columns that minimizes the total cost.
 *
 * Time complexity: O(n^3) where n = max(rows, cols)
 * Space complexity: O(n^2)
 *
 * Handles rectangular matrices (different number of source vs target parts)
 * by padding to square with zero-cost dummy entries.
 */

/**
 * Result of the Hungarian algorithm.
 */
export interface HungarianResult {
  /**
   * Optimal row-to-column assignments.
   * assignments[i] = j means row i is assigned to column j.
   * assignments[i] = -1 means row i is unassigned (when cols < rows after filtering dummies).
   */
  assignments: number[];

  /** Total cost of the optimal assignment */
  totalCost: number;

  /** Set of row indices that are assigned (not dummy) */
  assignedRows: Set<number>;

  /** Set of column indices that are assigned (not dummy) */
  assignedCols: Set<number>;
}

/**
 * Solve the assignment problem using the Hungarian (Kuhn-Munkres) algorithm.
 *
 * Given an n x m cost matrix, finds the optimal one-to-one assignment of
 * rows to columns that minimizes total cost.
 *
 * Implementation uses the successive shortest path formulation with
 * potential functions (Jonker-Volgenant style) for O(n^3) performance.
 *
 * @param costMatrix - n x m matrix where costMatrix[i][j] is the cost
 *                     of assigning row i to column j
 * @returns HungarianResult with optimal assignments and metadata
 *
 * @example
 * ```typescript
 * const cost = [
 *   [10, 5, 13],
 *   [3, 7, 15],
 *   [8, 12, 11],
 * ];
 * const result = hungarian(cost);
 * // result.assignments might be [1, 0, 2] with totalCost = 5+3+11 = 19
 * ```
 */
export function hungarian(costMatrix: number[][]): HungarianResult {
  const origRows = costMatrix.length;
  if (origRows === 0) {
    return { assignments: [], totalCost: 0, assignedRows: new Set(), assignedCols: new Set() };
  }
  const origCols = costMatrix[0].length;
  if (origCols === 0) {
    return {
      assignments: new Array(origRows).fill(-1),
      totalCost: 0,
      assignedRows: new Set(),
      assignedCols: new Set(),
    };
  }

  // Pad to square matrix if needed.
  // Use a large sentinel cost for dummy entries so they are avoided
  // unless necessary. We find the max real cost to scale the sentinel.
  let maxCost = 0;
  for (let i = 0; i < origRows; i++) {
    for (let j = 0; j < origCols; j++) {
      if (costMatrix[i][j] > maxCost) {
        maxCost = costMatrix[i][j];
      }
    }
  }
  const DUMMY_COST = maxCost * 10 + 1;

  const n = Math.max(origRows, origCols);
  const cost: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i < origRows && j < origCols) {
        return costMatrix[i][j];
      }
      return DUMMY_COST;
    })
  );

  // Hungarian algorithm (Kuhn-Munkres) using the potential method.
  // This is the classic O(n^3) implementation.
  //
  // u[i] = potential for row i (worker)
  // v[j] = potential for column j (job)
  // rowAssign[i] = column assigned to row i (-1 if unassigned)
  // colAssign[j] = row assigned to column j (-1 if unassigned)

  const u = new Float64Array(n + 1);  // row potentials (1-indexed, 0 unused)
  const v = new Float64Array(n + 1);  // col potentials (1-indexed, 0 unused)
  const rowAssign = new Int32Array(n + 1).fill(0);  // p[j] = row assigned to col j
  const way = new Int32Array(n + 1).fill(0);         // way[j] = previous col in augmenting path

  // Process each row one at a time
  for (let i = 1; i <= n; i++) {
    // Start a new augmenting path from row i.
    // We use column 0 as a virtual "starting" column.
    rowAssign[0] = i;
    let j0 = 0; // current column in the path

    const minv = new Float64Array(n + 1).fill(Infinity);
    const used = new Uint8Array(n + 1); // boolean flags

    // Find augmenting path using Dijkstra-like shortest path
    do {
      used[j0] = 1;
      const i0 = rowAssign[j0];
      let delta = Infinity;
      let j1 = -1;

      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;

        // Reduced cost
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];

        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }

        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }

      // Update potentials along the path
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[rowAssign[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (rowAssign[j0] !== 0);

    // Trace back the augmenting path and update assignments
    do {
      const j1 = way[j0];
      rowAssign[j0] = rowAssign[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  // Extract results (convert from 1-indexed to 0-indexed)
  // rowAssign[j] = row assigned to column j (1-indexed)
  // We need assignments[row] = col (0-indexed)
  const assignments = new Array<number>(origRows).fill(-1);
  const assignedRows = new Set<number>();
  const assignedCols = new Set<number>();
  let totalCost = 0;

  for (let j = 1; j <= n; j++) {
    const row = rowAssign[j] - 1; // convert to 0-indexed
    const col = j - 1;

    // Only include real (non-dummy) assignments
    if (row >= 0 && row < origRows && col < origCols) {
      assignments[row] = col;
      assignedRows.add(row);
      assignedCols.add(col);
      totalCost += costMatrix[row][col];
    }
  }

  return { assignments, totalCost, assignedRows, assignedCols };
}

/**
 * Convenience function to find the optimal matching given a similarity matrix.
 * Converts similarities (higher = better) to costs (lower = better) and
 * runs the Hungarian algorithm.
 *
 * @param similarityMatrix - n x m matrix where higher values mean better matches
 * @param threshold - Minimum similarity to consider a valid match (default: 0).
 *                    Pairs below this threshold are treated as unmatched.
 * @returns HungarianResult with optimal assignments
 */
export function hungarianFromSimilarity(
  similarityMatrix: number[][],
  threshold: number = 0
): HungarianResult {
  const rows = similarityMatrix.length;
  if (rows === 0) {
    return { assignments: [], totalCost: 0, assignedRows: new Set(), assignedCols: new Set() };
  }
  const cols = similarityMatrix[0].length;
  if (cols === 0) {
    return {
      assignments: new Array(rows).fill(-1),
      totalCost: 0,
      assignedRows: new Set(),
      assignedCols: new Set(),
    };
  }

  // Find the maximum similarity to invert properly
  let maxSim = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (similarityMatrix[i][j] > maxSim) {
        maxSim = similarityMatrix[i][j];
      }
    }
  }

  // Convert similarity to cost: cost = maxSim - similarity
  // Pairs below threshold get a high penalty cost
  const penaltyCost = maxSim * 10 + 1;
  const costMatrix: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      if (similarityMatrix[i][j] >= threshold) {
        return maxSim - similarityMatrix[i][j];
      }
      return penaltyCost;
    })
  );

  const result = hungarian(costMatrix);

  // Filter out assignments where the original similarity was below threshold
  for (let i = 0; i < rows; i++) {
    const j = result.assignments[i];
    if (j >= 0 && similarityMatrix[i][j] < threshold) {
      result.assignments[i] = -1;
      result.assignedRows.delete(i);
      result.assignedCols.delete(j);
    }
  }

  return result;
}
