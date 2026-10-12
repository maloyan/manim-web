/**
 * Marching-squares iso-contour extraction for a 2D scalar field.
 *
 * The algorithm walks a regular grid of sampled values and emits the line
 * segments of the iso-contour `value = iso` within each cell. Unlike the
 * adaptive, zero-level marching squares embedded in {@link ImplicitFunction},
 * this is a fixed-grid routine that takes an arbitrary iso level, so one grid
 * can be contoured at many levels. {@link ContourPlot} uses it for that.
 *
 * A cell is classified by whether each of its four corners is above `iso`.
 * The 16 cases map to zero, one, or two segments. Saddle cases (5 and 10) are
 * resolved with the average of the four corners, the common asymptotic decider.
 */

/** A line segment of an iso-contour, in field coordinates. */
export type ContourSegment = [[number, number], [number, number]];

// The four edge crossing points of a cell, ordered left, right, bottom, top.
const LEFT = 0;
const RIGHT = 1;
const BOTTOM = 2;
const TOP = 3;

// Each case index maps to the edge pairs that form its contour segments. The
// saddle cases 5 and 10 are left empty here and resolved separately, because
// their connectivity depends on the cell center value.
const CASE_EDGES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [], // 0
  [[LEFT, BOTTOM]], // 1
  [[BOTTOM, RIGHT]], // 2
  [[LEFT, RIGHT]], // 3
  [[RIGHT, TOP]], // 4
  [], // 5 (saddle)
  [[BOTTOM, TOP]], // 6
  [[LEFT, TOP]], // 7
  [[TOP, LEFT]], // 8
  [[BOTTOM, TOP]], // 9
  [], // 10 (saddle)
  [[RIGHT, TOP]], // 11
  [[LEFT, RIGHT]], // 12
  [[RIGHT, BOTTOM]], // 13
  [[LEFT, BOTTOM]], // 14
  [], // 15
];

/** Linear interpolation of the iso crossing on the edge between two corners. */
function interp(
  x0: number,
  y0: number,
  v0: number,
  x1: number,
  y1: number,
  v1: number,
  iso: number,
): [number, number] {
  const denom = v1 - v0;
  if (Math.abs(denom) < 1e-12) {
    return [(x0 + x1) / 2, (y0 + y1) / 2];
  }
  const t = Math.max(0, Math.min(1, (iso - v0) / denom));
  return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
}

/**
 * Append the two segments of a saddle cell (case 5 or 10).
 *
 * When the cell center is above `iso`, the two set corners join across the
 * center; otherwise the contour separates them. `caseIndex` selects which pair
 * of corners is set, and therefore which diagonal the center connects.
 */
function pushSaddle(
  caseIndex: number,
  centerAbove: boolean,
  edges: [number, number][],
  segments: ContourSegment[],
): void {
  if (caseIndex === 5) {
    // Set corners: bottom-left and top-right.
    if (centerAbove) {
      segments.push([edges[LEFT], edges[TOP]], [edges[BOTTOM], edges[RIGHT]]);
    } else {
      segments.push([edges[LEFT], edges[BOTTOM]], [edges[RIGHT], edges[TOP]]);
    }
    return;
  }
  // caseIndex === 10. Set corners: top-left and bottom-right.
  if (centerAbove) {
    segments.push([edges[LEFT], edges[BOTTOM]], [edges[RIGHT], edges[TOP]]);
  } else {
    segments.push([edges[LEFT], edges[TOP]], [edges[RIGHT], edges[BOTTOM]]);
  }
}

/**
 * Extract the iso-contour segments of a sampled scalar field.
 *
 * @param values Grid values indexed `values[iy][ix]`, dimensions
 *   `(ys.length) x (xs.length)`.
 * @param xs The x coordinate of each grid column, length `nx + 1`.
 * @param ys The y coordinate of each grid row, length `ny + 1`.
 * @param iso The contour level. A corner is "set" when its value is above iso.
 */
export function marchingSquares(
  values: number[][],
  xs: number[],
  ys: number[],
  iso = 0,
): ContourSegment[] {
  const segments: ContourSegment[] = [];
  const ny = ys.length - 1;
  const nx = xs.length - 1;

  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const xL = xs[ix];
      const xR = xs[ix + 1];
      const yB = ys[iy];
      const yT = ys[iy + 1];

      const vBL = values[iy][ix];
      const vBR = values[iy][ix + 1];
      const vTR = values[iy + 1][ix + 1];
      const vTL = values[iy + 1][ix];

      let caseIndex = 0;
      if (vTL > iso) caseIndex |= 8;
      if (vTR > iso) caseIndex |= 4;
      if (vBR > iso) caseIndex |= 2;
      if (vBL > iso) caseIndex |= 1;

      if (caseIndex === 0 || caseIndex === 15) continue;

      const edges: [number, number][] = [
        interp(xL, yT, vTL, xL, yB, vBL, iso), // left
        interp(xR, yT, vTR, xR, yB, vBR, iso), // right
        interp(xL, yB, vBL, xR, yB, vBR, iso), // bottom
        interp(xL, yT, vTL, xR, yT, vTR, iso), // top
      ];

      if (caseIndex === 5 || caseIndex === 10) {
        const centerAbove = (vBL + vBR + vTR + vTL) / 4 > iso;
        pushSaddle(caseIndex, centerAbove, edges, segments);
        continue;
      }

      for (const [a, b] of CASE_EDGES[caseIndex]) {
        segments.push([edges[a], edges[b]]);
      }
    }
  }

  return segments;
}

/** An ordered chain of points tracing one contour piece, in field coordinates. */
export type ContourPolyline = [number, number][];

/**
 * Stitch the unordered segments of {@link marchingSquares} into ordered
 * polylines. Marching squares emits independent 2-point segments in grid-scan
 * order; this chains segments that share an endpoint into one polyline, so each
 * connected contour piece becomes a single stroke and each disjoint piece
 * becomes its own polyline. A closed loop repeats its first point as its last.
 *
 * Endpoints on a shared grid edge are computed by identical arithmetic in both
 * adjacent cells, so they match exactly. `eps` only guards against sign-of-zero
 * fuzz; keep it far below the grid spacing so distinct crossings never merge.
 *
 * @param segments Segments from {@link marchingSquares} (one level).
 * @param eps Coordinate quantization used to match shared endpoints.
 * @returns One polyline per connected contour piece.
 */
export function linkContourSegments(segments: ContourSegment[], eps: number): ContourPolyline[] {
  const step = eps > 0 ? eps : 1e-12;
  const points: [number, number][] = [];
  const keyToId = new Map<string, number>();

  const idOf = (p: [number, number]): number => {
    const key = `${Math.round(p[0] / step)},${Math.round(p[1] / step)}`;
    let id = keyToId.get(key);
    if (id === undefined) {
      id = points.length;
      points.push(p);
      keyToId.set(key, id);
    }
    return id;
  };

  // Each segment becomes a pair of point ids; the adjacency map lists, for every
  // point id, the indices of the segments that touch it.
  const segIds: [number, number][] = [];
  const adjacency = new Map<number, number[]>();
  const attach = (pointId: number, segIndex: number): void => {
    const list = adjacency.get(pointId);
    if (list) list.push(segIndex);
    else adjacency.set(pointId, [segIndex]);
  };

  for (const [a, b] of segments) {
    const ia = idOf(a);
    const ib = idOf(b);
    if (ia === ib) continue; // drop a degenerate zero-length segment
    const index = segIds.length;
    segIds.push([ia, ib]);
    attach(ia, index);
    attach(ib, index);
  }

  const used = new Array<boolean>(segIds.length).fill(false);

  /** Find an unused segment touching `pointId` and return its other endpoint. */
  const nextFrom = (pointId: number): { seg: number; other: number } | null => {
    const list = adjacency.get(pointId);
    if (!list) return null;
    for (const seg of list) {
      if (used[seg]) continue;
      const [ia, ib] = segIds[seg];
      return { seg, other: ia === pointId ? ib : ia };
    }
    return null;
  };

  const polylines: ContourPolyline[] = [];
  for (let i = 0; i < segIds.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const [startId, endId] = segIds[i];
    const chain: number[] = [startId, endId];

    // Grow forward from the current end until the piece ends or closes.
    let cur = endId;
    for (let next = nextFrom(cur); next; next = nextFrom(cur)) {
      used[next.seg] = true;
      cur = next.other;
      chain.push(cur);
      if (cur === startId) break; // closed loop
    }

    // Grow backward from the start, unless the piece already closed.
    if (chain[chain.length - 1] !== chain[0]) {
      cur = startId;
      for (let prev = nextFrom(cur); prev; prev = nextFrom(cur)) {
        used[prev.seg] = true;
        cur = prev.other;
        chain.unshift(cur);
        if (cur === chain[chain.length - 1]) break; // closed loop
      }
    }

    polylines.push(chain.map((id) => [points[id][0], points[id][1]]));
  }

  return polylines;
}
