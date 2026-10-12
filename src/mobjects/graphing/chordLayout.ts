/**
 * Chord diagram layout.
 *
 * The layout turns a square flow matrix into arcs around a circle (one arc per
 * group, sized by the group's total flow) and ribbons between the arcs (one
 * ribbon per non-zero pair of groups, sized by the flow). The functions here
 * are pure. The {@link ChordDiagram} mobject renders the result.
 */

/** Full turn in radians. */
const TAU = Math.PI * 2;

/** A directed flow from one group to another, used as link-list input. */
export interface ChordFlow {
  /** Source group index. */
  source: number;
  /** Target group index. */
  target: number;
  /** Flow magnitude. */
  value: number;
}

/** The arc placement for one group. */
export interface ChordGroupArc {
  /** Group index. */
  index: number;
  /** Start angle of the arc, in radians. */
  startAngle: number;
  /** End angle of the arc, in radians. */
  endAngle: number;
  /** Total flow of the group (sum of its matrix row). */
  value: number;
}

/** The placement of one ribbon between two groups. */
export interface ChordRibbonSpan {
  /** Source group index. */
  source: number;
  /** Target group index. */
  target: number;
  /** Flow on the source side (`matrix[source][target]`). */
  sourceValue: number;
  /** Flow on the target side (`matrix[target][source]`). */
  targetValue: number;
  /** Start angle of the source span, in radians. */
  sourceStart: number;
  /** End angle of the source span, in radians. */
  sourceEnd: number;
  /** Start angle of the target span, in radians. */
  targetStart: number;
  /** End angle of the target span, in radians. */
  targetEnd: number;
}

/** The full chord layout. */
export interface ChordLayout {
  /** One arc per group, in group order. */
  groups: ChordGroupArc[];
  /** One ribbon per non-zero flow pair. */
  ribbons: ChordRibbonSpan[];
  /** Sum of all matrix entries. */
  total: number;
}

/** Tunable angles for {@link computeChordLayout}. */
export interface ChordLayoutOptions {
  /** Angular gap between adjacent groups, in radians. Default: 0.05. */
  gap?: number;
  /** Angle of the first group's start edge, in radians. Default: Math.PI / 2. */
  startAngle?: number;
}

/**
 * Build a square, non-negative matrix from a link list.
 *
 * @param flows - Directed flows between group indices.
 * @param groupCount - Number of groups (matrix size).
 * @returns A `groupCount x groupCount` matrix of non-negative flows.
 */
export function chordMatrixFromFlows(flows: ChordFlow[], groupCount: number): number[][] {
  const matrix: number[][] = Array.from({ length: groupCount }, () =>
    new Array<number>(groupCount).fill(0),
  );
  for (const flow of flows) {
    if (flow.source < 0 || flow.source >= groupCount) continue;
    if (flow.target < 0 || flow.target >= groupCount) continue;
    matrix[flow.source][flow.target] += Math.max(0, flow.value);
  }
  return matrix;
}

/** Make the input matrix square and non-negative without mutating it. */
function normalizeMatrix(matrix: number[][]): number[][] {
  const size = matrix.length;
  return matrix.map((row) => {
    const next = new Array<number>(size).fill(0);
    for (let j = 0; j < size && j < row.length; j++) {
      next[j] = Math.max(0, row[j] ?? 0);
    }
    return next;
  });
}

/**
 * Compute the arcs and ribbons of a chord diagram.
 *
 * Group `i`'s arc angle is proportional to the sum of row `i`. The cell
 * `matrix[i][j]` is a sub-span on arc `i`; a ribbon joins the span `(i, j)` on
 * arc `i` to the span `(j, i)` on arc `j`. One ribbon is produced per unordered
 * pair whose combined flow is positive, including a self-ribbon when the
 * diagonal is positive.
 *
 * The function never throws. An empty matrix returns empty arrays, and an
 * all-zero matrix returns zero-angle arcs and no ribbons.
 *
 * @param matrix - The square flow matrix.
 * @param options - Gap and start angle.
 * @returns The computed layout.
 */
export function computeChordLayout(
  matrix: number[][],
  options: ChordLayoutOptions = {},
): ChordLayout {
  const { gap = 0.05, startAngle = Math.PI / 2 } = options;
  const size = matrix.length;
  if (size === 0) {
    return { groups: [], ribbons: [], total: 0 };
  }

  const square = normalizeMatrix(matrix);
  const rowTotals = square.map((row) => row.reduce((sum, value) => sum + value, 0));
  const total = rowTotals.reduce((sum, value) => sum + value, 0);

  const available = Math.max(0, TAU - gap * size);
  const scale = total > 0 ? available / total : 0;

  const groups: ChordGroupArc[] = [];
  const subStart: number[][] = [];
  const subEnd: number[][] = [];

  let angle = startAngle;
  for (let i = 0; i < size; i++) {
    const groupStart = angle;
    const starts = new Array<number>(size).fill(angle);
    const ends = new Array<number>(size).fill(angle);
    for (let j = 0; j < size; j++) {
      const width = square[i][j] * scale;
      starts[j] = angle;
      ends[j] = angle + width;
      angle += width;
    }
    groups.push({ index: i, startAngle: groupStart, endAngle: angle, value: rowTotals[i] });
    subStart.push(starts);
    subEnd.push(ends);
    angle += gap;
  }

  const ribbons: ChordRibbonSpan[] = [];
  for (let i = 0; i < size; i++) {
    for (let j = i; j < size; j++) {
      const sourceValue = square[i][j];
      const targetValue = square[j][i];
      if (sourceValue <= 0 && targetValue <= 0) continue;
      ribbons.push({
        source: i,
        target: j,
        sourceValue,
        targetValue,
        sourceStart: subStart[i][j],
        sourceEnd: subEnd[i][j],
        targetStart: subStart[j][i],
        targetEnd: subEnd[j][i],
      });
    }
  }

  return { groups, ribbons, total };
}
