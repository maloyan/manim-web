/**
 * Squarified treemap layout.
 *
 * The layout maps a value hierarchy to nested rectangles. A node's area is
 * proportional to its value, and the children of a node tile the node's
 * rectangle without gaps or overlap. The squarify strategy keeps each tile's
 * aspect ratio near 1.
 *
 * The functions here are pure. The {@link Treemap} mobject renders the result.
 */

/**
 * One node in the input hierarchy.
 *
 * A leaf sets `value`. An internal node sets `children`; its value is the sum
 * of its children, so an explicit `value` on an internal node is ignored.
 * Negative values are clamped to 0, because an area cannot be negative.
 */
export interface TreemapNode {
  /** Display name of the node. */
  name: string;
  /** Value of a leaf node. Ignored when `children` is present. */
  value?: number;
  /** Child nodes. Present on internal nodes. */
  children?: TreemapNode[];
}

/** An axis-aligned rectangle. `(x, y)` is the lower-left (minimum) corner. */
export interface TreemapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The computed placement of one node in the hierarchy. */
export interface TreemapTile {
  /** Index path from the root. The root itself has an empty path. */
  path: number[];
  /** Node name. */
  name: string;
  /** Resolved value (sum of descendants for an internal node). */
  value: number;
  /** Depth in the tree. The root is depth 0. */
  depth: number;
  /** The node's rectangle. */
  rect: TreemapRect;
}

/**
 * Resolve the value of a node.
 *
 * A leaf returns its own value, clamped to be non-negative. An internal node
 * returns the sum of its children's resolved values.
 *
 * @param node - The node to measure.
 * @returns The non-negative value of the node.
 */
export function treemapNodeValue(node: TreemapNode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + treemapNodeValue(child), 0);
  }
  return Math.max(0, node.value ?? 0);
}

/**
 * The worst (largest) aspect ratio produced by one row of areas.
 *
 * `side` is the length of the fixed edge the row is laid along. The formula is
 * the standard squarified-treemap bound. A zero or missing area returns
 * Infinity, so a zero tile never joins a row.
 */
function worstRatio(areas: number[], start: number, end: number, side: number): number {
  let sum = 0;
  let max = -Infinity;
  let min = Infinity;
  for (let k = start; k < end; k++) {
    const value = areas[k];
    sum += value;
    if (value > max) max = value;
    if (value < min) min = value;
  }
  if (sum <= 0 || side <= 0 || min <= 0) return Infinity;
  const sum2 = sum * sum;
  const side2 = side * side;
  return Math.max((side2 * max) / sum2, sum2 / (side2 * min));
}

/** Sum a slice `[start, end)` of an array. */
function sumSlice(areas: number[], start: number, end: number): number {
  let sum = 0;
  for (let k = start; k < end; k++) sum += areas[k];
  return sum;
}

/**
 * Partition `region` into one rectangle per area, in input order.
 *
 * The areas must already be scaled so their sum equals the region area. The
 * result tiles the region exactly (no gaps, no overlap) when the areas are
 * positive. A zero area yields a zero-size rectangle at the current corner.
 *
 * @param areas - Target areas, best supplied in descending order.
 * @param region - The rectangle to fill.
 * @returns One rectangle per area, aligned to the `areas` index.
 */
export function squarify(areas: number[], region: TreemapRect): TreemapRect[] {
  const rects: TreemapRect[] = new Array(areas.length);
  const free: TreemapRect = { ...region };
  let i = 0;

  while (i < areas.length) {
    const side = Math.min(free.width, free.height);

    // Grow the current row while the worst aspect ratio keeps improving.
    let end = i + 1;
    while (end < areas.length) {
      const current = worstRatio(areas, i, end, side);
      const extended = worstRatio(areas, i, end + 1, side);
      if (extended <= current) end++;
      else break;
    }

    const rowSum = sumSlice(areas, i, end);
    const thickness = side > 0 ? rowSum / side : 0;

    if (free.width >= free.height) {
      // The row is a column along the left edge; tiles stack upward in y.
      let cursorY = free.y;
      for (let k = i; k < end; k++) {
        const tileHeight = thickness > 0 ? areas[k] / thickness : 0;
        rects[k] = { x: free.x, y: cursorY, width: thickness, height: tileHeight };
        cursorY += tileHeight;
      }
      free.x += thickness;
      free.width -= thickness;
    } else {
      // The row sits along the bottom edge; tiles advance rightward in x.
      let cursorX = free.x;
      for (let k = i; k < end; k++) {
        const tileWidth = thickness > 0 ? areas[k] / thickness : 0;
        rects[k] = { x: cursorX, y: free.y, width: tileWidth, height: thickness };
        cursorX += tileWidth;
      }
      free.y += thickness;
      free.height -= thickness;
    }

    i = end;
  }

  return rects;
}

/** Shrink a rectangle inward on every side by `padding`, keeping its center. */
function insetRect(rect: TreemapRect, padding: number): TreemapRect {
  const pad = Math.max(0, Math.min(padding, rect.width / 2, rect.height / 2));
  return {
    x: rect.x + pad,
    y: rect.y + pad,
    width: Math.max(0, rect.width - 2 * pad),
    height: Math.max(0, rect.height - 2 * pad),
  };
}

/** Lay out the children of a node into `region` and recurse. */
function layoutChildren(
  children: TreemapNode[],
  region: TreemapRect,
  padding: number,
  basePath: number[],
  depth: number,
  out: TreemapTile[],
): void {
  const values = children.map(treemapNodeValue);
  const total = values.reduce((sum, value) => sum + value, 0);
  const area = region.width * region.height;

  // Squarify works best on descending areas, so sort by value, lay out, then
  // map each rectangle back to its original child index.
  const order = values.map((_, index) => index).sort((a, b) => values[b] - values[a]);
  const areasSorted = order.map((index) => (total > 0 ? (values[index] / total) * area : 0));
  const rectsSorted = squarify(areasSorted, region);

  const rects: TreemapRect[] = new Array(children.length);
  order.forEach((index, slot) => {
    rects[index] = rectsSorted[slot];
  });

  children.forEach((child, index) => {
    const path = [...basePath, index];
    out.push({ path, name: child.name, value: values[index], depth, rect: rects[index] });
    if (child.children && child.children.length > 0) {
      layoutChildren(
        child.children,
        insetRect(rects[index], padding),
        padding,
        path,
        depth + 1,
        out,
      );
    }
  });
}

/**
 * Compute the full treemap layout for a hierarchy.
 *
 * The root fills `region`. Each internal node's children tile the node's
 * rectangle, inset by `padding` so a parent border stays visible. With
 * `padding` 0 the leaves partition the region exactly.
 *
 * The function never throws. An empty hierarchy still returns the root tile.
 *
 * @param root - The root node.
 * @param region - The rectangle the root fills.
 * @param padding - Inset applied before laying out each node's children.
 * @returns Tiles in pre-order (root first), one per node.
 */
export function computeTreemapLayout(
  root: TreemapNode,
  region: TreemapRect,
  padding = 0,
): TreemapTile[] {
  const out: TreemapTile[] = [];
  out.push({ path: [], name: root.name, value: treemapNodeValue(root), depth: 0, rect: region });
  if (root.children && root.children.length > 0) {
    layoutChildren(root.children, insetRect(region, padding), padding, [], 1, out);
  }
  return out;
}
