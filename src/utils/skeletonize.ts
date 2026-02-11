/**
 * Glyph Skeletonization — Medial Axis Extraction via Zhang-Suen Thinning
 *
 * Converts a glyph's cubic Bezier outline into center-line paths that
 * represent the natural pen strokes of the character. The algorithm:
 *
 * 1. Rasterizes the glyph outline to a binary grid (filled / empty)
 * 2. Applies the Zhang-Suen thinning algorithm to extract a 1-pixel skeleton
 * 3. Traces skeleton pixels into ordered path chains
 * 4. Smooths the paths using Catmull-Rom interpolation
 * 5. Fits cubic Bezier curves to the smooth paths
 *
 * The output format matches VMobject's control point convention:
 *   [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SkeletonizeOptions {
  /** Grid resolution (pixels along the longest glyph dimension). Default: 100 */
  gridResolution?: number;
  /** Smoothing subdivisions per traced segment (Catmull-Rom). Default: 4 */
  smoothSubdivisions?: number;
  /** Minimum chain length in pixels to keep. Default: 3 */
  minChainLength?: number;
}

/**
 * Extract the medial-axis (skeleton) of a glyph outline as cubic Bezier
 * control points compatible with VMobject.
 *
 * @param outlinePoints Cubic Bezier control points from GlyphVMobject:
 *   [anchor1, handle1, handle2, anchor2, ...]  where each point is [x, y, z].
 * @param options  Tuning parameters.
 * @returns Array of cubic Bezier control points tracing the skeleton center-line,
 *   or an empty array if the glyph has no interior (e.g. a dot or very thin glyph).
 */
export function skeletonizeGlyph(
  outlinePoints: number[][],
  options: SkeletonizeOptions = {},
): number[][] {
  const gridRes = options.gridResolution ?? 100;
  const smoothSubs = options.smoothSubdivisions ?? 4;
  const minChain = options.minChainLength ?? 3;

  if (outlinePoints.length < 4) return [];

  // 1. Compute bounding box in world space
  const bbox = computeBBox(outlinePoints);
  if (bbox.width === 0 || bbox.height === 0) return [];

  // Determine grid dimensions preserving aspect ratio
  const aspect = bbox.width / bbox.height;
  let cols: number;
  let rows: number;
  if (aspect >= 1) {
    cols = gridRes;
    rows = Math.max(1, Math.round(gridRes / aspect));
  } else {
    rows = gridRes;
    cols = Math.max(1, Math.round(gridRes * aspect));
  }

  // 2. Rasterize outline to binary grid
  const grid = rasterizeOutline(outlinePoints, bbox, cols, rows);

  // 3. Zhang-Suen thinning
  zhangSuenThin(grid, cols, rows);

  // 4. Trace skeleton into ordered chains
  const chains = traceChains(grid, cols, rows, minChain);
  if (chains.length === 0) return [];

  // 5. Convert pixel chains back to world coordinates, smooth, and fit Beziers
  const allPoints: number[][] = [];
  let firstChain = true;

  for (const chain of chains) {
    // Convert pixel coords to world coords
    const worldChain = chain.map(([px, py]) => pixelToWorld(px, py, bbox, cols, rows));

    // Smooth with Catmull-Rom subdivision
    const smooth = catmullRomSmooth(worldChain, smoothSubs);
    if (smooth.length < 2) continue;

    // Fit cubic Beziers
    const beziers = fitCubicBeziers(smooth);
    if (beziers.length === 0) continue;

    if (!firstChain && allPoints.length > 0) {
      // Join chains with a degenerate zero-length segment
      const lastPt = allPoints[allPoints.length - 1];
      const newPt = beziers[0];
      allPoints.push([...lastPt]);
      allPoints.push([...newPt]);
      allPoints.push([...newPt]);
    } else {
      // First anchor of first chain
      allPoints.push(beziers[0]);
      firstChain = false;
    }

    // Append remaining Bezier points (handle1, handle2, anchor per segment)
    for (let i = 1; i < beziers.length; i++) {
      allPoints.push(beziers[i]);
    }
  }

  return allPoints;
}

// ---------------------------------------------------------------------------
// Bounding Box
// ---------------------------------------------------------------------------

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

function computeBBox(points: number[][]): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

// ---------------------------------------------------------------------------
// Rasterization: outline -> binary grid using even-odd winding rule
// ---------------------------------------------------------------------------

/**
 * Rasterize the cubic Bezier outline into a binary grid.
 * Uses the even-odd fill rule with scanline intersection counting.
 */
function rasterizeOutline(points: number[][], bbox: BBox, cols: number, rows: number): Uint8Array {
  const grid = new Uint8Array(cols * rows);

  // Small margin to avoid edge aliasing
  const margin = 0.5;

  // Flatten the cubic Beziers into line segments for scanline testing.
  // Each cubic is subdivided into small straight segments.
  const segments = flattenCubicsToSegments(points, bbox, cols, rows, margin);

  // For each scanline row, count crossings using even-odd rule
  for (let row = 0; row < rows; row++) {
    const scanY = row + 0.5; // center of pixel row

    // Collect x-intersections of the scanline with all segments
    const intersections: number[] = [];

    for (const seg of segments) {
      const [x0, y0, x1, y1] = seg;

      // Check if scanline crosses this segment
      if ((y0 <= scanY && y1 > scanY) || (y1 <= scanY && y0 > scanY)) {
        // Linear interpolation to find x at scanY
        const t = (scanY - y0) / (y1 - y0);
        const xIntersect = x0 + t * (x1 - x0);
        intersections.push(xIntersect);
      }
    }

    // Sort intersections left-to-right
    intersections.sort((a, b) => a - b);

    // Fill between pairs (even-odd rule)
    for (let i = 0; i < intersections.length - 1; i += 2) {
      const xStart = Math.max(0, Math.ceil(intersections[i]));
      const xEnd = Math.min(cols - 1, Math.floor(intersections[i + 1]));
      for (let col = xStart; col <= xEnd; col++) {
        grid[row * cols + col] = 1;
      }
    }
  }

  return grid;
}

/**
 * Convert the cubic Bezier point array into flattened line segments
 * in pixel coordinates. Each segment is [x0, y0, x1, y1].
 */
function flattenCubicsToSegments(
  points: number[][],
  bbox: BBox,
  cols: number,
  rows: number,
  _margin: number,
): number[][] {
  const segments: number[][] = [];

  // Helper: world coord -> pixel coord
  const toPixelX = (wx: number) => ((wx - bbox.minX) / bbox.width) * cols;
  const toPixelY = (wy: number) => ((wy - bbox.minY) / bbox.height) * rows;

  // Points format: [anchor, handle, handle, anchor, handle, handle, anchor, ...]
  // Each cubic segment: points[i], points[i+1], points[i+2], points[i+3]
  // where i steps by 3 (shared anchors)
  const numCubics = Math.floor((points.length - 1) / 3);

  for (let c = 0; c < numCubics; c++) {
    const i = c * 3;
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    if (!p0 || !p1 || !p2 || !p3) continue;

    // Subdivide the cubic into ~8 straight segments
    const steps = 8;
    let prevX = toPixelX(p0[0]);
    let prevY = toPixelY(p0[1]);

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const mt = 1 - t;
      // De Casteljau
      const x =
        mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
      const y =
        mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];

      const px = toPixelX(x);
      const py = toPixelY(y);
      segments.push([prevX, prevY, px, py]);
      prevX = px;
      prevY = py;
    }
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Zhang-Suen Thinning Algorithm
// ---------------------------------------------------------------------------

/**
 * In-place Zhang-Suen thinning on a binary grid.
 * Produces a 1-pixel-wide skeleton.
 *
 * Neighborhood labelling (3x3 around pixel P):
 *   P9 P2 P3
 *   P8 P1 P4
 *   P7 P6 P5
 *
 * where P1 is the center pixel.
 */
function zhangSuenThin(grid: Uint8Array, cols: number, rows: number): void {
  let changed = true;

  // Temporary flags: 0 = background, 1 = foreground, 2 = marked for removal
  while (changed) {
    changed = false;

    // --- Sub-iteration 1 ---
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r * cols + c] !== 1) continue;

        const p2 = grid[(r - 1) * cols + c];
        const p3 = grid[(r - 1) * cols + c + 1];
        const p4 = grid[r * cols + c + 1];
        const p5 = grid[(r + 1) * cols + c + 1];
        const p6 = grid[(r + 1) * cols + c];
        const p7 = grid[(r + 1) * cols + c - 1];
        const p8 = grid[r * cols + c - 1];
        const p9 = grid[(r - 1) * cols + c - 1];

        const B = neighborCount(p2, p3, p4, p5, p6, p7, p8, p9);
        if (B < 2 || B > 6) continue;

        const A = transitions(p2, p3, p4, p5, p6, p7, p8, p9);
        if (A !== 1) continue;

        // At least one of P2, P4, P6 is background
        if (p2 && p4 && p6) continue;

        // At least one of P4, P6, P8 is background
        if (p4 && p6 && p8) continue;

        grid[r * cols + c] = 2; // mark for removal
        changed = true;
      }
    }
    // Remove marked pixels
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] === 2) grid[i] = 0;
    }

    // --- Sub-iteration 2 ---
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (grid[r * cols + c] !== 1) continue;

        const p2 = grid[(r - 1) * cols + c];
        const p3 = grid[(r - 1) * cols + c + 1];
        const p4 = grid[r * cols + c + 1];
        const p5 = grid[(r + 1) * cols + c + 1];
        const p6 = grid[(r + 1) * cols + c];
        const p7 = grid[(r + 1) * cols + c - 1];
        const p8 = grid[r * cols + c - 1];
        const p9 = grid[(r - 1) * cols + c - 1];

        const B = neighborCount(p2, p3, p4, p5, p6, p7, p8, p9);
        if (B < 2 || B > 6) continue;

        const A = transitions(p2, p3, p4, p5, p6, p7, p8, p9);
        if (A !== 1) continue;

        // At least one of P2, P4, P8 is background
        if (p2 && p4 && p8) continue;

        // At least one of P2, P6, P8 is background
        if (p2 && p6 && p8) continue;

        grid[r * cols + c] = 2;
        changed = true;
      }
    }
    // Remove marked pixels
    for (let i = 0; i < grid.length; i++) {
      if (grid[i] === 2) grid[i] = 0;
    }
  }
}

/** Count the number of non-zero neighbors (B in Zhang-Suen). */
function neighborCount(
  p2: number,
  p3: number,
  p4: number,
  p5: number,
  p6: number,
  p7: number,
  p8: number,
  p9: number,
): number {
  return (
    (p2 ? 1 : 0) +
    (p3 ? 1 : 0) +
    (p4 ? 1 : 0) +
    (p5 ? 1 : 0) +
    (p6 ? 1 : 0) +
    (p7 ? 1 : 0) +
    (p8 ? 1 : 0) +
    (p9 ? 1 : 0)
  );
}

/**
 * Count 0->1 transitions in the ordered sequence P2,P3,...P9,P2.
 * (A in Zhang-Suen.)
 */
function transitions(
  p2: number,
  p3: number,
  p4: number,
  p5: number,
  p6: number,
  p7: number,
  p8: number,
  p9: number,
): number {
  const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
  let count = 0;
  for (let i = 0; i < 8; i++) {
    if (!seq[i] && seq[i + 1]) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Chain Tracing — walk skeleton pixels into ordered chains
// ---------------------------------------------------------------------------

/**
 * 8-connected neighbor offsets (row, col):
 *   (-1,-1) (-1,0) (-1,1)
 *   ( 0,-1)        ( 0,1)
 *   ( 1,-1) ( 1,0) ( 1,1)
 */
const N8_DR = [-1, -1, -1, 0, 0, 1, 1, 1];
const N8_DC = [-1, 0, 1, -1, 1, -1, 0, 1];

/**
 * Trace skeleton pixels into ordered chain paths.
 * Starts tracing from endpoints (degree-1 pixels) and junctions;
 * remaining loops are traced by picking an unvisited pixel.
 */
function traceChains(
  grid: Uint8Array,
  cols: number,
  rows: number,
  minLength: number,
): number[][][] {
  // Build a visited map
  const visited = new Uint8Array(cols * rows);
  const chains: number[][][] = [];

  /**
   * Count how many skeleton neighbors a pixel has.
   */
  function degree(r: number, c: number): number {
    let d = 0;
    for (let n = 0; n < 8; n++) {
      const nr = r + N8_DR[n];
      const nc = c + N8_DC[n];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr * cols + nc]) {
        d++;
      }
    }
    return d;
  }

  /**
   * Walk from (startR, startC) following unvisited skeleton neighbors.
   * Returns the chain as [[col0, row0], [col1, row1], ...].
   */
  function walk(startR: number, startC: number): number[][] {
    const chain: number[][] = [];
    let r = startR;
    let c = startC;

    while (true) {
      visited[r * cols + c] = 1;
      chain.push([c, r]);

      // Find unvisited neighbor
      let foundNext = false;
      for (let n = 0; n < 8; n++) {
        const nr = r + N8_DR[n];
        const nc = c + N8_DC[n];
        if (
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          grid[nr * cols + nc] &&
          !visited[nr * cols + nc]
        ) {
          r = nr;
          c = nc;
          foundNext = true;
          break;
        }
      }
      if (!foundNext) break;
    }
    return chain;
  }

  // First pass: start from endpoints (degree 1) for natural writing order
  // (top-left to bottom-right bias via row-major scan)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r * cols + c] || visited[r * cols + c]) continue;
      if (degree(r, c) === 1) {
        const chain = walk(r, c);
        if (chain.length >= minLength) {
          chains.push(chain);
        }
      }
    }
  }

  // Second pass: pick up remaining unvisited skeleton pixels (loops)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r * cols + c] || visited[r * cols + c]) continue;
      const chain = walk(r, c);
      if (chain.length >= minLength) {
        chains.push(chain);
      }
    }
  }

  // Sort chains by their starting position (top-to-bottom, left-to-right)
  // to approximate natural writing order
  chains.sort((a, b) => {
    // Compare by starting Y (row), then X (col)
    const ay = a[0][1];
    const ax = a[0][0];
    const by = b[0][1];
    const bx = b[0][0];
    if (ay !== by) return ay - by;
    return ax - bx;
  });

  return chains;
}

// ---------------------------------------------------------------------------
// Coordinate Conversion
// ---------------------------------------------------------------------------

/** Convert pixel coordinates back to world coordinates (3D with z=0). */
function pixelToWorld(px: number, py: number, bbox: BBox, cols: number, rows: number): number[] {
  const wx = bbox.minX + (px / cols) * bbox.width;
  const wy = bbox.minY + (py / rows) * bbox.height;
  return [wx, wy, 0];
}

// ---------------------------------------------------------------------------
// Catmull-Rom Smoothing
// ---------------------------------------------------------------------------

/**
 * Smooth a chain of 3D points using Catmull-Rom subdivision.
 * Removes the pixel staircasing from the traced skeleton.
 *
 * @param points Array of [x, y, z] points
 * @param subdivisions Number of interpolated points per input segment
 * @returns Smoothed array of [x, y, z] points
 */
function catmullRomSmooth(points: number[][], subdivisions: number): number[][] {
  if (points.length < 2) return points;
  if (points.length === 2) return points;

  const result: number[][] = [];
  const n = points.length;

  // Tau (tension parameter): 0.5 = standard Catmull-Rom
  const tau = 0.5;

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(n - 1, i + 1)];
    const p3 = points[Math.min(n - 1, i + 2)];

    // Add the start point of this segment
    if (i === 0) result.push(p1);

    // Add subdivided points
    for (let s = 1; s <= subdivisions; s++) {
      const t = s / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;

      // Catmull-Rom basis functions
      const h1 = -tau * t3 + 2 * tau * t2 - tau * t;
      const h2 = (2 - tau) * t3 + (tau - 3) * t2 + 1;
      const h3 = (tau - 2) * t3 + (3 - 2 * tau) * t2 + tau * t;
      const h4 = tau * t3 - tau * t2;

      const x = h1 * p0[0] + h2 * p1[0] + h3 * p2[0] + h4 * p3[0];
      const y = h1 * p0[1] + h2 * p1[1] + h3 * p2[1] + h4 * p3[1];
      const z = h1 * p0[2] + h2 * p1[2] + h3 * p2[2] + h4 * p3[2];

      result.push([x, y, z]);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Cubic Bezier Fitting
// ---------------------------------------------------------------------------

/**
 * Fit a smooth polyline into cubic Bezier segments.
 * Uses every 3rd point as an anchor and derives handles from tangent direction.
 *
 * Returns points in VMobject format:
 *   [anchor0, handle0_out, handle1_in, anchor1, handle1_out, handle2_in, anchor2, ...]
 *
 * That is: [A0, H0, H1, A1, H2, H3, A2, ...] where each cubic segment
 * is (A_i, H_2i, H_2i+1, A_i+1).
 */
function fitCubicBeziers(smoothPoints: number[][]): number[][] {
  const n = smoothPoints.length;
  if (n < 2) return [];

  // Choose anchor indices: first, every ~segLen-th point, last
  const segLen = Math.max(3, Math.floor(n / Math.ceil(n / 6)));
  const anchorIndices: number[] = [0];
  for (let i = segLen; i < n - 1; i += segLen) {
    anchorIndices.push(i);
  }
  if (anchorIndices[anchorIndices.length - 1] !== n - 1) {
    anchorIndices.push(n - 1);
  }

  if (anchorIndices.length < 2) return [];

  const result: number[][] = [];

  // First anchor
  result.push([...smoothPoints[anchorIndices[0]]]);

  for (let seg = 0; seg < anchorIndices.length - 1; seg++) {
    const ai = anchorIndices[seg];
    const bi = anchorIndices[seg + 1];
    const pa = smoothPoints[ai];
    const pb = smoothPoints[bi];

    // Estimate tangent at anchor points from neighbors
    const tangentA = estimateTangent(smoothPoints, ai);
    const tangentB = estimateTangent(smoothPoints, bi);

    // Chord length for handle scaling
    const dx = pb[0] - pa[0];
    const dy = pb[1] - pa[1];
    const dz = pb[2] - pa[2];
    const chordLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const handleScale = chordLen / 3;

    // Handle out from pa
    const h1: number[] = [
      pa[0] + tangentA[0] * handleScale,
      pa[1] + tangentA[1] * handleScale,
      pa[2] + tangentA[2] * handleScale,
    ];

    // Handle in to pb
    const h2: number[] = [
      pb[0] - tangentB[0] * handleScale,
      pb[1] - tangentB[1] * handleScale,
      pb[2] + tangentB[2] * handleScale,
    ];

    result.push(h1, h2, [...smoothPoints[bi]]);
  }

  return result;
}

/**
 * Estimate unit tangent at a point in a polyline using finite differences.
 */
function estimateTangent(points: number[][], index: number): number[] {
  const n = points.length;
  let dx: number, dy: number, dz: number;

  if (index === 0) {
    // Forward difference
    dx = points[1][0] - points[0][0];
    dy = points[1][1] - points[0][1];
    dz = points[1][2] - points[0][2];
  } else if (index === n - 1) {
    // Backward difference
    dx = points[n - 1][0] - points[n - 2][0];
    dy = points[n - 1][1] - points[n - 2][1];
    dz = points[n - 1][2] - points[n - 2][2];
  } else {
    // Central difference
    dx = points[index + 1][0] - points[index - 1][0];
    dy = points[index + 1][1] - points[index - 1][1];
    dz = points[index + 1][2] - points[index - 1][2];
  }

  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 1e-10) return [1, 0, 0]; // degenerate: arbitrary direction
  return [dx / len, dy / len, dz / len];
}
