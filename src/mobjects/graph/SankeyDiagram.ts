import * as THREE from 'three';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import { BLUE, TEAL, GREEN, YELLOW, GOLD, RED, ORANGE, WHITE } from '../../constants';
import {
  computeSankeyLayout,
  orientPoint,
  type LinkLayout,
  type NodeLayout,
  type SankeyLayoutOptions,
  type SankeyLinkInput,
  type SankeyNodeInput,
  type SankeyOrientation,
} from './sankeyLayout';

/** Default color cycle used when a node sets no color. */
const DEFAULT_NODE_PALETTE = [BLUE, TEAL, GREEN, YELLOW, GOLD, RED, ORANGE];

/** How a link derives its color from its endpoints. */
export type SankeyLinkColorMode = 'source' | 'target' | 'blend';

/** A span (top and bottom y) along a node edge. */
export interface SankeySpan {
  top: number;
  bottom: number;
}

/**
 * Options for {@link SankeyDiagram}.
 */
export interface SankeyDiagramOptions {
  /** Nodes keyed by id. */
  nodes: SankeyNodeInput[];
  /** Directed flows between nodes. */
  links: SankeyLinkInput[];
  /** Node thickness along the flow axis. Default: 0.3 */
  nodeWidth?: number;
  /** Gap between stacked nodes in one column. Default: 0.4 */
  nodePadding?: number;
  /** Distance between adjacent columns. Default: 3 */
  layerSpacing?: number;
  /** Target length of the tallest column. Default: 4 */
  height?: number;
  /** Minimum node length along the stacking axis. Default: 0.05 */
  minNodeLength?: number;
  /** Flow direction. Default: 'horizontal' */
  orientation?: SankeyOrientation;
  /** Whether to render node labels. Default: true */
  showLabels?: boolean;
  /** Label font size. Default: 24 */
  labelFontSize?: number;
  /** Gap between a node and its label. Default: 0.15 */
  labelBuff?: number;
  /** Node fill opacity. Default: 1 */
  nodeFillOpacity?: number;
  /** Link (ribbon) fill opacity. Default: 0.5 */
  linkOpacity?: number;
  /** How a link colors itself from its endpoints. Default: 'source' */
  linkColorMode?: SankeyLinkColorMode;
}

/**
 * A node rectangle inside a {@link SankeyDiagram}.
 */
export class SankeyNode extends Rectangle {
  /** Node identifier. */
  readonly id: string;
  /** Column index (0 = left-most for a horizontal diagram). */
  readonly layer: number;
  /** `max(incoming total, outgoing total)`. */
  readonly throughput: number;

  constructor(
    options: ConstructorParameters<typeof Rectangle>[0] & {
      id: string;
      layer: number;
      throughput: number;
    },
  ) {
    const { id, layer, throughput, ...rectOptions } = options;
    super(rectOptions);
    this.id = id;
    this.layer = layer;
    this.throughput = throughput;
  }
}

/**
 * A flow ribbon inside a {@link SankeyDiagram}.
 *
 * The ribbon is a closed filled VMobject built from two cubic-bezier edges (a
 * top and a bottom S-curve) joined by the straight source and target spans. Its
 * thickness is proportional to {@link value}.
 */
export class SankeyLink extends VMobject {
  /** Source node id. */
  readonly source: string;
  /** Target node id. */
  readonly target: string;
  /** Flow magnitude. */
  readonly value: number;

  private readonly _width: number;
  private readonly _sourceSpan: SankeySpan;
  private readonly _targetSpan: SankeySpan;

  constructor(
    layout: LinkLayout,
    orientation: SankeyOrientation,
    color: string,
    fillOpacity: number,
  ) {
    super();
    this.source = layout.source;
    this.target = layout.target;
    this.value = layout.value;
    this._width = layout.width;
    this._sourceSpan = { top: layout.sourceYTop, bottom: layout.sourceYBottom };
    this._targetSpan = { top: layout.targetYTop, bottom: layout.targetYBottom };

    this.color = color;
    this.fillColor = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = 0;

    this.setPoints3D(buildRibbonPoints(layout, orientation));
  }

  /** Ribbon thickness (proportional to {@link value}). */
  getLinkWidth(): number {
    return this._width;
  }

  /** Span occupied on the source node's edge, in horizontal layout space. */
  getSourceSpan(): SankeySpan {
    return { ...this._sourceSpan };
  }

  /** Span occupied on the target node's edge, in horizontal layout space. */
  getTargetSpan(): SankeySpan {
    return { ...this._targetSpan };
  }
}

/** Build the closed ribbon control points in `setPoints3D` form. */
function buildRibbonPoints(layout: LinkLayout, orientation: SankeyOrientation): number[][] {
  const { sourceX, sourceYTop, sourceYBottom, targetX, targetYTop, targetYBottom } = layout;
  const midX = (sourceX + targetX) / 2;

  const sTop: Vector3Tuple = [sourceX, sourceYTop, 0];
  const tTop: Vector3Tuple = [targetX, targetYTop, 0];
  const tBottom: Vector3Tuple = [targetX, targetYBottom, 0];
  const sBottom: Vector3Tuple = [sourceX, sourceYBottom, 0];

  const points: Vector3Tuple[] = [];

  // Start anchor: source top.
  points.push(sTop);
  // Top S-curve: source top -> target top.
  points.push([midX, sourceYTop, 0], [midX, targetYTop, 0], tTop);
  // Straight down the target edge: target top -> target bottom.
  points.push(...straightControls(tTop, tBottom));
  // Bottom S-curve back: target bottom -> source bottom.
  points.push([midX, targetYBottom, 0], [midX, sourceYBottom, 0], sBottom);
  // Straight up the source edge: source bottom -> source top (closes the path).
  points.push(...straightControls(sBottom, sTop));

  return points.map((point) => orientPoint(point, orientation));
}

/** The two interior control points plus the end anchor of a straight cubic. */
function straightControls(start: Vector3Tuple, end: Vector3Tuple): Vector3Tuple[] {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  return [
    [start[0] + dx / 3, start[1] + dy / 3, 0],
    [start[0] + (2 * dx) / 3, start[1] + (2 * dy) / 3, 0],
    [end[0], end[1], 0],
  ];
}

/** Average two CSS colors in linear RGB and return a hex string. */
function blendColors(a: string, b: string): string {
  const colorA = new THREE.Color(a);
  const colorB = new THREE.Color(b);
  return new THREE.Color(
    (colorA.r + colorB.r) / 2,
    (colorA.g + colorB.g) / 2,
    (colorA.b + colorB.b) / 2,
  ).getHexString();
}

/**
 * SankeyDiagram - a layered flow diagram of nodes and proportional-width links.
 *
 * Nodes are placed in columns from sources to sinks. Each link is a filled
 * cubic-bezier ribbon whose thickness is proportional to its value, stacked
 * along each node's edge so sibling links do not overlap. A node with unequal
 * incoming and outgoing totals is sized by the larger of the two.
 *
 * @example
 * ```typescript
 * const sankey = new SankeyDiagram({
 *   nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
 *   links: [
 *     { source: 'a', target: 'b', value: 3 },
 *     { source: 'a', target: 'c', value: 1 },
 *   ],
 * });
 * ```
 */
export class SankeyDiagram extends VGroup {
  private readonly _nodes: SankeyNode[] = [];
  private readonly _links: SankeyLink[] = [];
  private readonly _nodeById = new Map<string, SankeyNode>();

  constructor(options: SankeyDiagramOptions) {
    super();

    const {
      nodes,
      links,
      nodeWidth = 0.3,
      nodePadding = 0.4,
      layerSpacing = 3,
      height = 4,
      minNodeLength = 0.05,
      orientation = 'horizontal',
      showLabels = true,
      labelFontSize = 24,
      labelBuff = 0.15,
      nodeFillOpacity = 1,
      linkOpacity = 0.5,
      linkColorMode = 'source',
    } = options;

    const layoutOptions: SankeyLayoutOptions = {
      nodeWidth,
      nodePadding,
      layerSpacing,
      height,
      minNodeLength,
    };
    const layout = computeSankeyLayout(nodes, links, layoutOptions);

    const colorOf = new Map<string, string>();
    nodes.forEach((node, index) => {
      colorOf.set(node.id, node.color ?? DEFAULT_NODE_PALETTE[index % DEFAULT_NODE_PALETTE.length]);
    });

    const layoutById = new Map<string, NodeLayout>();
    for (const nodeLayout of layout.nodes) {
      layoutById.set(nodeLayout.id, nodeLayout);
    }

    // Render links first so nodes draw on top of the ribbons.
    for (const linkLayout of layout.links) {
      const color = this._linkColor(linkLayout, colorOf, linkColorMode);
      const link = new SankeyLink(linkLayout, orientation, color, linkOpacity);
      this._links.push(link);
      this.add(link);
    }

    for (const nodeMeta of nodes) {
      const nodeLayout = layoutById.get(nodeMeta.id);
      if (!nodeLayout) continue;
      const color = colorOf.get(nodeMeta.id) ?? BLUE;
      const centerY = (nodeLayout.yTop + nodeLayout.yBottom) / 2;
      const center = orientPoint([nodeLayout.x, centerY, 0], orientation);

      const node = new SankeyNode({
        id: nodeMeta.id,
        layer: nodeLayout.layer,
        throughput: nodeLayout.throughput,
        width: orientation === 'vertical' ? nodeLayout.length : nodeWidth,
        height: orientation === 'vertical' ? nodeWidth : nodeLayout.length,
        center,
        color,
        fillOpacity: nodeFillOpacity,
      });
      this._nodes.push(node);
      this._nodeById.set(nodeMeta.id, node);
      this.add(node);

      if (showLabels) {
        this.add(this._makeLabel(nodeMeta, labelFontSize, center, orientation, labelBuff));
      }
    }

    if (!this.isEmpty()) {
      this.normalizeTransform();
    }
  }

  private _linkColor(
    linkLayout: LinkLayout,
    colorOf: Map<string, string>,
    mode: SankeyLinkColorMode,
  ): string {
    const sourceColor = colorOf.get(linkLayout.source) ?? BLUE;
    const targetColor = colorOf.get(linkLayout.target) ?? BLUE;
    if (mode === 'target') return targetColor;
    if (mode === 'blend') return `#${blendColors(sourceColor, targetColor)}`;
    return sourceColor;
  }

  private _makeLabel(
    nodeMeta: SankeyNodeInput,
    fontSize: number,
    center: Vector3Tuple,
    orientation: SankeyOrientation,
    buff: number,
  ): Text {
    // Labels stay white so they remain readable over any node color.
    const label = new Text({
      text: nodeMeta.label ?? nodeMeta.id,
      fontSize,
      color: WHITE,
    });
    const offset: Vector3Tuple = orientation === 'vertical' ? [0, -buff, 0] : [-buff, 0, 0];
    label.moveTo([center[0] + offset[0], center[1] + offset[1], center[2]]);
    return label;
  }

  /** All node rectangles, in input order. */
  getNodes(): SankeyNode[] {
    return [...this._nodes];
  }

  /** All link ribbons, in input order. */
  getLinks(): SankeyLink[] {
    return [...this._links];
  }

  /** The node with the given id, or `undefined`. */
  getNode(id: string): SankeyNode | undefined {
    return this._nodeById.get(id);
  }

  /** The link at the given index, or `undefined`. */
  getLink(index: number): SankeyLink | undefined {
    return this._links[index];
  }

  override copy(): SankeyDiagram {
    const clone = new SankeyDiagram({ nodes: [], links: [] });
    this._copyBaseAttributesInto(clone);
    return clone;
  }
}
