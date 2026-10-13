/**
 * Shared helpers for chart series input.
 *
 * A chart accepts values as a single series (number[]) or many series
 * (number[][]). These helpers narrow that union with a real runtime check
 * instead of a type assertion.
 */

/**
 * Test whether a series argument is a single flat series.
 *
 * The runtime check is identical to the inline `typeof values[0] === 'number'`
 * test the charts used before. As a type guard it lets TypeScript narrow the
 * union to number[] in the true branch and number[][] in the false branch, so
 * callers need no `as number[]` or `as number[][]` assertion.
 *
 * Call it only on a non-empty argument. An empty array has no element 0, so the
 * guard reports false (many-series) for it.
 * @param values - One series (number[]) or many series (number[][]).
 * @returns True if values is a single flat series.
 */
export function isFlatSeries(values: number[] | number[][]): values is number[] {
  return typeof values[0] === 'number';
}
