/**
 * PhylogeneticTree - an animatable phylogenetic tree from a Newick string.
 *
 * The tree is drawn as a rectangular cladogram or phylogram: leaves are evenly
 * spaced on one axis, and node depth (a cladogram) or cumulative branch length
 * (a phylogram) sets the other axis. Each edge is an elbow of a vertical then a
 * horizontal {@link Line}, the standard bioinformatics convention. A radial
 * layout is also supported.
 *
 * The tree is a VGroup, so {@link Create} and FadeIn animate it directly. The
 * branch lines are added before the leaf dots and labels, and Create reveals
 * family members in order, so `new Create(tree)` grows the tree from the root
 * out to the leaves.
 *
 * @example
 * ```typescript
 * const tree = new PhylogeneticTree({ newick: '((A:0.1,B:0.2):0.3,C:0.4);' });
 * scene.play(new Create(tree)); // grows root-to-leaves
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { Line } from '../geometry/Line';
import { Dot } from '../geometry/Dot';
import { Text } from '../text/Text';
import { WHITE, BLUE } from '../../constants/colors';
import { parseNewick, PhyloNode } from './newick';
import {
  PhylogeneticTreeOptions,
  PhyloLayout,
  PhyloOrientation,
  PhyloLeafRender,
  PhyloBranchRender,
  PhyloNodeRender,
} from './biologyTypes';

/** A node with its computed layout, mirroring the parsed tree. */
interface LayoutNode {
  source: PhyloNode;
  children: LayoutNode[];
  depth: number;
  cumulativeLength: number;
  isLeaf: boolean;
  /** Leaf index in left-to-right order, or -1 for an internal node. */
  leafIndex: number;
  position: Vector3Tuple;
}

/** Every option resolved to a concrete value, with the root already parsed. */
interface ResolvedOptions {
  root: PhyloNode;
  layout: PhyloLayout;
  orientation: PhyloOrientation;
  /** Undefined means use the default (true). */
  useBranchLengths?: boolean;
  width: number;
  height: number;
  labelFontSize: number;
  labels: boolean;
  lineColor: string;
  leafColor: string;
  showLeafDots: boolean;
  leafDotRadius: number;
  strokeWidth: number;
}

/** Apply the defaults and parse the Newick string, or throw on bad input. */
function resolveOptions(options: PhylogeneticTreeOptions): ResolvedOptions {
  if (options.root === undefined && options.newick === undefined) {
    throw new Error('PhylogeneticTree: supply either a newick string or a parsed root');
  }
  const root = options.root ?? parseNewick(options.newick as string);
  return {
    root,
    layout: options.layout ?? 'rectangular',
    orientation: options.orientation ?? 'left-to-right',
    useBranchLengths: options.useBranchLengths,
    width: options.width ?? 6,
    height: options.height ?? 4,
    labelFontSize: options.labelFontSize ?? 20,
    labels: options.labels ?? true,
    lineColor: options.lineColor ?? WHITE,
    leafColor: options.leafColor ?? BLUE,
    showLeafDots: options.showLeafDots ?? true,
    leafDotRadius: options.leafDotRadius ?? 0.06,
    strokeWidth: options.strokeWidth ?? 3,
  };
}

export class PhylogeneticTree extends VGroup {
  protected readonly _phyloRoot: PhyloNode;
  protected readonly _layout: PhyloLayout;
  protected readonly _orientation: PhyloOrientation;
  protected readonly _useBranchLengths: boolean;
  protected readonly _width: number;
  protected readonly _height: number;
  protected readonly _labelFontSize: number;
  protected readonly _labels: boolean;
  protected readonly _lineColor: string;
  protected readonly _leafColor: string;
  protected readonly _showLeafDots: boolean;
  protected readonly _leafDotRadius: number;
  protected readonly _strokeWidth: number;

  protected readonly _leaves: PhyloLeafRender[] = [];
  protected readonly _branches: PhyloBranchRender[] = [];
  protected readonly _nodes: PhyloNodeRender[] = [];

  /** The branch (edge) lines, drawn behind and revealed first. */
  readonly branchesGroup: VGroup;
  /** The leaf dot mobjects. */
  readonly leavesGroup: VGroup;
  /** The leaf label mobjects. */
  readonly labelsGroup: VGroup;

  constructor(options: PhylogeneticTreeOptions) {
    super();

    const o = resolveOptions(options);
    this._phyloRoot = o.root;
    this._layout = o.layout;
    this._orientation = o.orientation;
    this._width = o.width;
    this._height = o.height;
    this._labelFontSize = o.labelFontSize;
    this._labels = o.labels;
    this._lineColor = o.lineColor;
    this._leafColor = o.leafColor;
    this._showLeafDots = o.showLeafDots;
    this._leafDotRadius = o.leafDotRadius;
    this._strokeWidth = o.strokeWidth;

    this.branchesGroup = new VGroup();
    this.leavesGroup = new VGroup();
    this.labelsGroup = new VGroup();

    this._useBranchLengths = (o.useBranchLengths ?? true) && this._anyBranchLength(this._phyloRoot);

    const layoutRoot = this._buildLayout();
    this._buildBranches(layoutRoot);
    this._buildLeaves(layoutRoot);

    // Branches draw first so Create grows the tree root-to-leaves.
    this.add(this.branchesGroup);
    this.add(this.leavesGroup);
    this.add(this.labelsGroup);
  }

  /** True when any node in the tree carries a branch length. */
  protected _anyBranchLength(node: PhyloNode): boolean {
    if (node.branchLength !== undefined) return true;
    return node.children.some((c) => this._anyBranchLength(c));
  }

  /** Build the layout tree and set every node position. */
  protected _buildLayout(): LayoutNode {
    const leaves: LayoutNode[] = [];
    const toLayout = (source: PhyloNode, depth: number, cumulative: number): LayoutNode => {
      const isLeaf = source.children.length === 0;
      const node: LayoutNode = {
        source,
        children: [],
        depth,
        cumulativeLength: cumulative,
        isLeaf,
        leafIndex: -1,
        position: [0, 0, 0],
      };
      if (isLeaf) {
        node.leafIndex = leaves.length;
        leaves.push(node);
      } else {
        node.children = source.children.map((c) =>
          toLayout(c, depth + 1, cumulative + (c.branchLength ?? 0)),
        );
      }
      return node;
    };
    const layoutRoot = toLayout(this._phyloRoot, 0, 0);

    const leafCount = leaves.length;
    const metricOf = (n: LayoutNode): number =>
      this._useBranchLengths ? n.cumulativeLength : n.depth;
    let depthExtent = 0;
    const scanExtent = (n: LayoutNode): void => {
      depthExtent = Math.max(depthExtent, metricOf(n));
      n.children.forEach(scanExtent);
    };
    scanExtent(layoutRoot);

    this._assignCrossAxis(layoutRoot, leafCount);
    this._assignPositions(layoutRoot, depthExtent, leafCount, metricOf);
    this._collectNodes(layoutRoot);
    return layoutRoot;
  }

  /**
   * Assign the cross-axis coordinate: a y row for a rectangular leaf, or an
   * angle for a radial leaf. An internal node takes the mean of its children.
   * The value is stashed in position[1] for now and resolved in a later pass.
   */
  protected _assignCrossAxis(node: LayoutNode, leafCount: number): number {
    if (node.isLeaf) {
      const value =
        this._layout === 'radial'
          ? (node.leafIndex / Math.max(leafCount, 1)) * Math.PI * 2
          : this._rowY(node.leafIndex, leafCount);
      node.position[1] = value;
      return value;
    }
    const childValues = node.children.map((c) => this._assignCrossAxis(c, leafCount));
    const mean = childValues.reduce((a, b) => a + b, 0) / childValues.length;
    node.position[1] = mean;
    return mean;
  }

  /** The evenly spaced, centered y for a leaf row. */
  protected _rowY(leafIndex: number, leafCount: number): number {
    if (leafCount <= 1) return 0;
    const spacing = this._height / (leafCount - 1);
    return ((leafCount - 1) / 2 - leafIndex) * spacing;
  }

  /** Resolve each node to a final [x, y, z] from its depth metric and cross axis. */
  protected _assignPositions(
    node: LayoutNode,
    depthExtent: number,
    leafCount: number,
    metricOf: (n: LayoutNode) => number,
  ): void {
    const cross = node.position[1];
    if (this._layout === 'radial') {
      const radius = Math.min(this._width, this._height) / 2;
      const r = depthExtent > 0 ? (metricOf(node) / depthExtent) * radius : 0;
      node.position = [r * Math.cos(cross), r * Math.sin(cross), 0];
    } else {
      const sign = this._orientation === 'right-to-left' ? -1 : 1;
      const x =
        depthExtent > 0
          ? (-this._width / 2 + (metricOf(node) / depthExtent) * this._width) * sign
          : 0;
      node.position = [x, cross, 0];
    }
    node.children.forEach((c) => this._assignPositions(c, depthExtent, leafCount, metricOf));
  }

  /** Record every node render in pre-order. */
  protected _collectNodes(node: LayoutNode): void {
    this._nodes.push({
      node: node.source,
      name: node.source.name,
      position: [...node.position],
      depth: node.depth,
      cumulativeLength: node.cumulativeLength,
      isLeaf: node.isLeaf,
    });
    node.children.forEach((c) => this._collectNodes(c));
  }

  /** Build every parent-to-child branch, in pre-order (root-to-leaves). */
  protected _buildBranches(node: LayoutNode): void {
    for (const child of node.children) {
      const branch = this._makeBranch(node.position, child.position);
      this._branches.push(branch);
      branch.lines.forEach((line) => this.branchesGroup.add(line));
      this._buildBranches(child);
    }
  }

  /** One branch: a rectangular elbow (vertical then horizontal) or a radial line. */
  protected _makeBranch(start: Vector3Tuple, end: Vector3Tuple): PhyloBranchRender {
    if (this._layout === 'radial') {
      const line = new Line({
        start,
        end,
        color: this._lineColor,
        strokeWidth: this._strokeWidth,
      });
      return { start, end, lines: [line] };
    }
    const elbow: Vector3Tuple = [start[0], end[1], 0];
    const vertical = new Line({
      start,
      end: elbow,
      color: this._lineColor,
      strokeWidth: this._strokeWidth,
    });
    const horizontal = new Line({
      start: elbow,
      end,
      color: this._lineColor,
      strokeWidth: this._strokeWidth,
    });
    return { start, end, lines: [vertical, horizontal] };
  }

  /** Build the leaf dots and labels. */
  protected _buildLeaves(node: LayoutNode): void {
    if (node.isLeaf) {
      const name = node.source.name ?? '';
      const position: Vector3Tuple = [...node.position];

      let dot: Dot | null = null;
      if (this._showLeafDots) {
        dot = new Dot({ point: position, radius: this._leafDotRadius, color: this._leafColor });
        this.leavesGroup.add(dot);
      }

      let label: Text | null = null;
      if (this._labels && name.length > 0) {
        label = new Text({ text: name, fontSize: this._labelFontSize });
        label.moveTo(this._labelPosition(position));
        this.labelsGroup.add(label);
      }

      this._leaves.push({ name, position, dot, label });
      return;
    }
    node.children.forEach((c) => this._buildLeaves(c));
  }

  /** The label center, pushed just past the leaf, away from the root. */
  protected _labelPosition(leaf: Vector3Tuple): Vector3Tuple {
    const shift = this._leafDotRadius + 0.35;
    if (this._layout === 'radial') {
      const len = Math.hypot(leaf[0], leaf[1]) || 1;
      return [leaf[0] + (leaf[0] / len) * shift, leaf[1] + (leaf[1] / len) * shift, 0];
    }
    const sign = this._orientation === 'right-to-left' ? -1 : 1;
    return [leaf[0] + shift * sign, leaf[1], 0];
  }

  // ========== Accessors ==========

  /** The parsed Newick root. */
  getRoot(): PhyloNode {
    return this._phyloRoot;
  }

  /** All resolved leaves, in left-to-right order. */
  getLeaves(): PhyloLeafRender[] {
    return [...this._leaves];
  }

  /** All resolved branches (edges), in pre-order. */
  getBranches(): PhyloBranchRender[] {
    return [...this._branches];
  }

  /** All resolved nodes (leaves and internal), in pre-order. */
  getNodes(): PhyloNodeRender[] {
    return [...this._nodes];
  }

  /** The number of leaves. */
  get numLeaves(): number {
    return this._leaves.length;
  }

  override copy(): PhylogeneticTree {
    const clone = new PhylogeneticTree({
      root: this._phyloRoot,
      layout: this._layout,
      useBranchLengths: this._useBranchLengths,
      width: this._width,
      height: this._height,
      labelFontSize: this._labelFontSize,
      labels: this._labels,
      lineColor: this._lineColor,
      leafColor: this._leafColor,
      showLeafDots: this._showLeafDots,
      leafDotRadius: this._leafDotRadius,
      strokeWidth: this._strokeWidth,
      orientation: this._orientation,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
