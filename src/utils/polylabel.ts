/**
 * Polylabel - finds the pole of inaccessibility of a polygon.
 *
 * The pole of inaccessibility is the point inside the polygon that is
 * farthest from any edge. Uses a quadtree-based approach for efficiency.
 *
 * Based on the mapbox/polylabel algorithm.
 */

interface Cell {
  x: number;
  y: number;
  h: number; // half cell size
  d: number; // distance from center to nearest edge
  max: number; // max possible distance within cell
}

function createCell(x: number, y: number, h: number, polygon: number[][][]): Cell {
  const d = pointToPolygonDist(x, y, polygon);
  return {
    x,
    y,
    h,
    d,
    max: d + h * Math.SQRT2,
  };
}

function pointToPolygonDist(x: number, y: number, polygon: number[][][]): number {
  let inside = false;
  let minDistSq = Infinity;

  for (const ring of polygon) {
    for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
      const a = ring[i];
      const b = ring[j];

      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside;
      }

      minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
    }
  }

  return (inside ? 1 : -1) * Math.sqrt(minDistSq);
}

function getSegDistSq(px: number, py: number, a: number[], b: number[]): number {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = px - x;
  dy = py - y;

  return dx * dx + dy * dy;
}

function getCentroidCell(polygon: number[][][]): Cell {
  let area = 0;
  let x = 0;
  let y = 0;
  const ring = polygon[0];

  for (let i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
    const a = ring[i];
    const b = ring[j];
    const f = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * f;
    y += (a[1] + b[1]) * f;
    area += f * 3;
  }

  if (area === 0) {
    return createCell(ring[0][0], ring[0][1], 0, polygon);
  }

  return createCell(x / area, y / area, 0, polygon);
}

export interface PolylabelResult {
  point: [number, number];
  distance: number;
}

/**
 * Find the pole of inaccessibility of a polygon.
 *
 * @param rings - Array of rings. First ring is the outer boundary,
 *                subsequent rings are holes. Each ring is an array of
 *                [x, y] or [x, y, z] points.
 * @param precision - Precision of the result. Default: 1.0
 * @returns The pole point and its distance to the nearest edge.
 */
export function polylabel(rings: number[][][], precision = 1.0): PolylabelResult {
  // Find bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of rings[0]) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = Math.min(width, height);

  let h = cellSize / 2;

  if (cellSize === 0) {
    return {
      point: [minX, minY],
      distance: 0,
    };
  }

  // Priority queue (sorted by max potential distance, descending)
  const cellQueue: Cell[] = [];

  const insertCell = (cell: Cell) => {
    // Binary insert to keep sorted by max descending
    let lo = 0;
    let hi = cellQueue.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (cellQueue[mid].max > cell.max) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    cellQueue.splice(lo, 0, cell);
  };

  // Cover polygon with initial cells
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      insertCell(createCell(x + h, y + h, h, rings));
    }
  }

  // Take centroid as the first best guess
  let bestCell = getCentroidCell(rings);

  // Special case for degenerate polygons
  const bboxCell = createCell(minX + width / 2, minY + height / 2, 0, rings);
  if (bboxCell.d > bestCell.d) {
    bestCell = bboxCell;
  }

  while (cellQueue.length > 0) {
    // Pick the most promising cell from the queue
    const cell = cellQueue.shift()!;

    // Update the best cell if this cell's center is better
    if (cell.d > bestCell.d) {
      bestCell = cell;
    }

    // Do not drill down further if there's no chance of improvement
    if (cell.max - bestCell.d <= precision) continue;

    // Split the cell into 4 children
    h = cell.h / 2;
    insertCell(createCell(cell.x - h, cell.y - h, h, rings));
    insertCell(createCell(cell.x + h, cell.y - h, h, rings));
    insertCell(createCell(cell.x - h, cell.y + h, h, rings));
    insertCell(createCell(cell.x + h, cell.y + h, h, rings));
  }

  return {
    point: [bestCell.x, bestCell.y],
    distance: bestCell.d,
  };
}
