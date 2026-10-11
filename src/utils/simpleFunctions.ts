/**
 * Port of ManimCE `manim/utils/simple_functions.py` (0.22.0) public API.
 */

/**
 * Numerical binary search for the input to `fn`, between `lowerBound` and
 * `upperBound`, whose output is `target` to within `tolerance`
 * (ManimCE `binary_search`). Returns `undefined` if no such input exists in
 * the bounds.
 */
function binarySearch(
  fn: (x: number) => number,
  target: number,
  lowerBound: number,
  upperBound: number,
  tolerance = 1e-4,
): number | undefined {
  let lh = lowerBound;
  let rh = upperBound;
  let mh = (lh + rh) / 2;
  while (Math.abs(rh - lh) > tolerance) {
    mh = (lh + rh) / 2;
    const lx = fn(lh);
    const mx = fn(mh);
    const rx = fn(rh);
    if (lx === target) return lh;
    if (rx === target) return rh;
    if (lx <= target && target <= rx) {
      if (mx > target) rh = mh;
      else lh = mh;
    } else if (lx > target && target > rx) {
      [lh, rh] = [rh, lh];
    } else {
      return undefined;
    }
  }
  return mh;
}

/**
 * The binomial coefficient "n choose k" (ManimCE `choose`). Returns 0 when
 * `k < 0` or `k > n`.
 */
export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let kk = k;
  if (kk > n - kk) kk = n - kk;
  let result = 1;
  for (let i = 0; i < kk; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

/**
 * Clip `a` to the interval `[minA, maxA]` (ManimCE `clip`). Returns `a` when it
 * is already inside the interval, otherwise the nearer bound.
 */
export function clip(a: number, minA: number, maxA: number): number {
  if (a < minA) return minA;
  if (a > maxA) return maxA;
  return a;
}

/**
 * The logistic function `1 / (1 + e^-x)` (ManimCE `sigmoid`).
 */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// --- public API (camelCase; ManimCE simple_functions parity) -----------------

export { binarySearch };
