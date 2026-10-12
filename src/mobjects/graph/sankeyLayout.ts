import { Vector3Tuple } from '../../core/Mobject';

/**
 * A node in a {@link SankeyDiagram}.
 *
 * `layer` fixes the column (0 = left-most for a horizontal diagram). When it is
 * omitted for every node, the layout derives columns from the link direction.
 */
export interface SankeyNodeInput {
  /** Unique node identifier, referenced by links. */
  id: string;
  /** Optional display label. Falls back to `id` when labels are shown. */
  label?: string;
  /** Optional explicit column index. */
  layer?: number;
  /** Optional CSS color for the node (and, by default, its outgoing links). */
  color?: string;
}

/**
 * A directed flow between two nodes. `value` sets the link (ribbon) thickness.
 */
export interface SankeyLinkInput {
  /** Source node id. */
  source: string;
  /** Target node id. */
  target: string;
  /** Flow magnitude. The ribbon thickness is proportional to this value. */
  value: number;
}

/** Flow direction of the diagram. */
export type SankeyOrientation = 'horizontal' | 'vertical';

/** Tunable sizes used by {@link computeSankeyLayout}. */
export interface SankeyLayoutOptions {
  /** Node thickness along the flow axis. */
  nodeWidth: number;
  /** Gap between stacked nodes in one column. */
  nodePadding: number;
  /** Distance between adjacent column centers. */
  layerSpacing: number;
  /** Target length of the tallest column (sum of its node lengths). */
  height: number;
  /** Minimum node length along the stacking axis. */
  minNodeLength: number;
}

/** Computed geometry for one node, in horizontal (flow along +x) space. */
export interface NodeLayout {
  id: string;
  layer: number;
  /** Center x of the node. */
  x: number;
  /** Top edge y (the larger y value). */
  yTop: number;
  /** Bottom edge y (the smaller y value). */
  yBottom: number;
  /** Node length along the stacking axis (`yTop - yBottom`). */
  length: number;
  /** `max(incoming total, outgoing total)`. */
  throughput: number;
}

/** Computed geometry for one link, in horizontal (flow along +x) space. */
export interface LinkLayout {
  index: number;
  source: string;
  target: string;
  value: number;
  /** Ribbon thickness. */
  width: number;
  /** Right edge x of the source node. */
  sourceX: number;
  sourceYTop: number;
  sourceYBottom: number;
  /** Left edge x of the target node. */
  targetX: number;
  targetYTop: number;
  targetYBottom: number;
}

/** Full layout result. */
export interface SankeyLayout {
  nodes: NodeLayout[];
  links: LinkLayout[];
}

/**
 * Map a horizontal-space point to the requested orientation.
 *
 * Horizontal keeps the point. Vertical rotates it so columns run top to bottom,
 * by the map `(x, y) -> (y, -x)`.
 */
export function orientPoint(point: Vector3Tuple, orientation: SankeyOrientation): Vector3Tuple {
  if (orientation === 'vertical') {
    return [point[1], -point[0], point[2]];
  }
  return [point[0], point[1], point[2]];
}

/** Assign a column index to each node id. */
function assignLayers(nodes: SankeyNodeInput[], links: SankeyLinkInput[]): Map<string, number> {
  const layers = new Map<string, number>();
  const fixed = new Set<string>();

  for (const node of nodes) {
    if (node.layer !== undefined) {
      layers.set(node.id, node.layer);
      fixed.add(node.id);
    } else {
      layers.set(node.id, 0);
    }
  }

  // Relax target layers downstream of their sources. Bound the passes by the
  // node count so a cyclic graph terminates instead of looping forever.
  const maxPasses = nodes.length + 1;
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    for (const link of links) {
      if (!layers.has(link.source) || !layers.has(link.target)) continue;
      if (fixed.has(link.target)) continue;
      const wanted = (layers.get(link.source) ?? 0) + 1;
      if (wanted > (layers.get(link.target) ?? 0)) {
        layers.set(link.target, wanted);
        changed = true;
      }
    }
    if (!changed) break;
  }

  return layers;
}

/**
 * Compute a layered left-to-right Sankey layout in horizontal space.
 *
 * The caller maps the result to the final orientation with {@link orientPoint}.
 * Node lengths and link widths share one scale, so a link width is proportional
 * to its value. A node with unequal in and out totals is sized by the larger of
 * the two. The function never throws for empty, single, or unlinked input.
 */
export function computeSankeyLayout(
  nodes: SankeyNodeInput[],
  links: SankeyLinkInput[],
  options: SankeyLayoutOptions,
): SankeyLayout {
  const { nodeWidth, nodePadding, layerSpacing, height, minNodeLength } = options;

  if (nodes.length === 0) {
    return { nodes: [], links: [] };
  }

  const layerOf = assignLayers(nodes, links);

  // Sum incoming and outgoing values per node.
  const inTotal = new Map<string, number>();
  const outTotal = new Map<string, number>();
  for (const node of nodes) {
    inTotal.set(node.id, 0);
    outTotal.set(node.id, 0);
  }
  for (const link of links) {
    const value = Math.max(0, link.value);
    if (outTotal.has(link.source)) {
      outTotal.set(link.source, (outTotal.get(link.source) ?? 0) + value);
    }
    if (inTotal.has(link.target)) {
      inTotal.set(link.target, (inTotal.get(link.target) ?? 0) + value);
    }
  }

  const throughputOf = new Map<string, number>();
  for (const node of nodes) {
    throughputOf.set(node.id, Math.max(inTotal.get(node.id) ?? 0, outTotal.get(node.id) ?? 0));
  }

  // One shared scale from value to world length.
  const layerTotals = new Map<number, number>();
  for (const node of nodes) {
    const layer = layerOf.get(node.id) ?? 0;
    layerTotals.set(layer, (layerTotals.get(layer) ?? 0) + (throughputOf.get(node.id) ?? 0));
  }
  let maxLayerTotal = 0;
  for (const total of layerTotals.values()) {
    maxLayerTotal = Math.max(maxLayerTotal, total);
  }
  const valueScale = maxLayerTotal > 0 ? height / maxLayerTotal : 0;

  const lengthOf = new Map<string, number>();
  for (const node of nodes) {
    const raw = (throughputOf.get(node.id) ?? 0) * valueScale;
    lengthOf.set(node.id, Math.max(raw, minNodeLength));
  }

  // Group node ids by column, keeping input order within a column.
  const columns = new Map<number, string[]>();
  let maxLayer = 0;
  for (const node of nodes) {
    const layer = layerOf.get(node.id) ?? 0;
    maxLayer = Math.max(maxLayer, layer);
    const column = columns.get(layer) ?? [];
    column.push(node.id);
    columns.set(layer, column);
  }

  const nodeLayouts = new Map<string, NodeLayout>();
  const xOffset = (maxLayer * layerSpacing) / 2;

  for (const [layer, ids] of columns) {
    const columnLength =
      ids.reduce((sum, id) => sum + (lengthOf.get(id) ?? 0), 0) +
      nodePadding * Math.max(0, ids.length - 1);
    let cursor = columnLength / 2;
    const x = layer * layerSpacing - xOffset;
    for (const id of ids) {
      const length = lengthOf.get(id) ?? 0;
      const yTop = cursor;
      const yBottom = cursor - length;
      nodeLayouts.set(id, {
        id,
        layer,
        x,
        yTop,
        yBottom,
        length,
        throughput: throughputOf.get(id) ?? 0,
      });
      cursor = yBottom - nodePadding;
    }
  }

  // Stack links along each node's edges, top down, in link order.
  const outCursor = new Map<string, number>();
  const inCursor = new Map<string, number>();
  for (const node of nodes) {
    const layout = nodeLayouts.get(node.id);
    outCursor.set(node.id, layout ? layout.yTop : 0);
    inCursor.set(node.id, layout ? layout.yTop : 0);
  }

  const halfWidth = nodeWidth / 2;
  const linkLayouts: LinkLayout[] = links.map((link, index) => {
    const source = nodeLayouts.get(link.source);
    const target = nodeLayouts.get(link.target);
    const width = Math.max(0, link.value) * valueScale;

    if (!source || !target) {
      return {
        index,
        source: link.source,
        target: link.target,
        value: link.value,
        width,
        sourceX: 0,
        sourceYTop: 0,
        sourceYBottom: 0,
        targetX: 0,
        targetYTop: 0,
        targetYBottom: 0,
      };
    }

    const sTop = outCursor.get(link.source) ?? source.yTop;
    const sBottom = sTop - width;
    outCursor.set(link.source, sBottom);

    const tTop = inCursor.get(link.target) ?? target.yTop;
    const tBottom = tTop - width;
    inCursor.set(link.target, tBottom);

    return {
      index,
      source: link.source,
      target: link.target,
      value: link.value,
      width,
      sourceX: source.x + halfWidth,
      sourceYTop: sTop,
      sourceYBottom: sBottom,
      targetX: target.x - halfWidth,
      targetYTop: tTop,
      targetYBottom: tBottom,
    };
  });

  return { nodes: Array.from(nodeLayouts.values()), links: linkLayouts };
}
