import { VGroup } from '../../core/VGroup';
import { Rectangle } from '../geometry/Rectangle';
import { Text } from '../text/Text';
import {
  BLUE,
  GREEN,
  RED,
  YELLOW,
  ORANGE,
  PURPLE,
  TEAL,
  GOLD,
  WHITE,
} from '../../constants/colors';
import { computeTreemapLayout, type TreemapNode, type TreemapTile } from './treemapLayout';

/** Default color cycle for treemap tiles. */
const DEFAULT_TREEMAP_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/** How a tile picks its color. */
export type TreemapColorBy = 'category' | 'depth';

/**
 * Options for {@link Treemap}.
 */
export interface TreemapOptions {
  /** The root of the value hierarchy. */
  data: TreemapNode;
  /** Width of the chart region. Default: 8. */
  width?: number;
  /** Height of the chart region. Default: 4.5. */
  height?: number;
  /** Inset between a parent tile and its children. Default: 0.06. */
  padding?: number;
  /** Tile colors. Single color applies to all, array cycles. Default: Manim palette. */
  colors?: string | string[];
  /** Whether a color is chosen by top-level category or by depth. Default: 'category'. */
  colorBy?: TreemapColorBy;
  /** Fill opacity of the tiles. Default: 0.85. */
  fillOpacity?: number;
  /** Stroke color between tiles. Default: WHITE. */
  strokeColor?: string;
  /** Stroke width between tiles. Default: 1. */
  strokeWidth?: number;
  /** Whether to draw the root rectangle. Default: false. */
  showRoot?: boolean;
  /** Whether to draw a rectangle for internal (non-leaf) nodes. Default: true. */
  showInternalNodes?: boolean;
  /** Whether to label leaf tiles that are large enough. Default: true. */
  showLabels?: boolean;
  /** Font size for tile labels. Default: 18. */
  labelFontSize?: number;
  /** Smallest tile side, in scene units, that still gets a label. Default: 0.6. */
  minLabelSize?: number;
}

/**
 * Treemap - a squarified treemap of nested rectangles.
 *
 * Each node of a value hierarchy becomes a {@link Rectangle} sized in
 * proportion to its value. Children tile their parent's rectangle, so a child
 * always sits inside its parent. Tiles are colored by top-level category or by
 * depth. Empty, single-node, and zero-value inputs produce no error.
 *
 * @example
 * ```typescript
 * const tree = new Treemap({
 *   data: {
 *     name: 'root',
 *     children: [
 *       { name: 'A', value: 6 },
 *       { name: 'B', children: [{ name: 'B1', value: 2 }, { name: 'B2', value: 2 }] },
 *     ],
 *   },
 * });
 * tree.getTile([1, 0]); // the B1 rectangle
 * ```
 */
export class Treemap extends VGroup {
  /** The tile rectangles, root first. */
  tiles: VGroup;
  /** The tile labels. */
  labelGroup: VGroup;

  protected _layout: TreemapTile[];
  protected _options: TreemapOptions;
  protected _colors: string[];
  protected _colorBy: TreemapColorBy;
  protected _fillOpacity: number;
  protected _strokeColor: string;
  protected _strokeWidth: number;
  protected _showRoot: boolean;
  protected _showInternalNodes: boolean;
  protected _showLabels: boolean;
  protected _labelFontSize: number;
  protected _minLabelSize: number;
  protected _tileByPath = new Map<string, Rectangle>();

  constructor(options: TreemapOptions) {
    super();

    const {
      data,
      width = 8,
      height = 4.5,
      padding = 0.06,
      colors = DEFAULT_TREEMAP_COLORS,
      colorBy = 'category',
      fillOpacity = 0.85,
      strokeColor = WHITE,
      strokeWidth = 1,
      showRoot = false,
      showInternalNodes = true,
      showLabels = true,
      labelFontSize = 18,
      minLabelSize = 0.6,
    } = options;

    this._options = options;
    this._colors = Array.isArray(colors) ? [...colors] : [colors];
    this._colorBy = colorBy;
    this._fillOpacity = fillOpacity;
    this._strokeColor = strokeColor;
    this._strokeWidth = strokeWidth;
    this._showRoot = showRoot;
    this._showInternalNodes = showInternalNodes;
    this._showLabels = showLabels;
    this._labelFontSize = labelFontSize;
    this._minLabelSize = minLabelSize;

    const region = { x: -width / 2, y: -height / 2, width, height };
    this._layout = computeTreemapLayout(data, region, padding);

    this.tiles = new VGroup();
    this.labelGroup = new VGroup();

    this._buildTiles();
    this.add(this.tiles);

    if (this._showLabels) {
      this._buildLabels();
      this.add(this.labelGroup);
    }
  }

  /** Whether a tile has a non-leaf (it has a deeper descendant). */
  protected _isLeaf(tile: TreemapTile): boolean {
    return !this._layout.some(
      (other) =>
        other.path.length === tile.path.length + 1 &&
        tile.path.every((value, index) => value === other.path[index]),
    );
  }

  /** The color for a tile, by category (top ancestor) or by depth. */
  protected _colorForTile(tile: TreemapTile): string {
    const key = this._colorBy === 'depth' ? tile.depth : (tile.path[0] ?? 0);
    return this._colors[key % this._colors.length];
  }

  /** Build one rectangle per visible tile. */
  protected _buildTiles(): void {
    this.tiles = new VGroup();
    this._tileByPath = new Map<string, Rectangle>();

    for (const tile of this._layout) {
      const isRoot = tile.path.length === 0;
      if (isRoot && !this._showRoot) continue;
      if (!isRoot && !this._isLeaf(tile) && !this._showInternalNodes) continue;
      if (tile.rect.width <= 0 || tile.rect.height <= 0) continue;

      const rectangle = new Rectangle({
        width: tile.rect.width,
        height: tile.rect.height,
        center: [tile.rect.x + tile.rect.width / 2, tile.rect.y + tile.rect.height / 2, 0],
        color: this._colorForTile(tile),
        fillOpacity: this._fillOpacity,
        strokeWidth: this._strokeWidth,
      });
      rectangle.strokeColor = this._strokeColor;

      this.tiles.add(rectangle);
      this._tileByPath.set(tile.path.join('/'), rectangle);
    }
  }

  /** Build labels for leaf tiles that are large enough to hold text. */
  protected _buildLabels(): void {
    this.labelGroup = new VGroup();

    for (const tile of this._layout) {
      if (tile.path.length === 0) continue;
      if (!this._isLeaf(tile)) continue;
      if (tile.rect.width < this._minLabelSize || tile.rect.height < this._minLabelSize) continue;

      const label = new Text({
        text: tile.name,
        fontSize: this._labelFontSize,
        color: WHITE,
      });
      label.moveTo([tile.rect.x + tile.rect.width / 2, tile.rect.y + tile.rect.height / 2, 0]);
      this.labelGroup.add(label);
    }
  }

  /** All tile rectangles, root first when drawn. */
  getTiles(): Rectangle[] {
    return this.tiles.children as Rectangle[];
  }

  /**
   * The rectangle for a node, addressed by its index path from the root.
   * @param path - Child indices from the root (empty path = root).
   * @returns The rectangle, or undefined when the node is not drawn.
   */
  getTile(path: number[]): Rectangle | undefined {
    return this._tileByPath.get(path.join('/'));
  }

  /** The computed layout (rectangles, values, depths) for every node. */
  getLayout(): TreemapTile[] {
    return this._layout.map((tile) => ({ ...tile, path: [...tile.path], rect: { ...tile.rect } }));
  }

  override copy(): Treemap {
    const clone = new Treemap(this._options);
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
