/**
 * ImageLayer - an input layer drawn as a grid of square pixels (the manim-ml
 * ImageLayer analogue).
 *
 * The whole grid is a single connection anchor at its center, so an image layer
 * connects to a following layer of M nodes with M lines. An empty grid (zero
 * rows or columns) exposes no anchor and draws no connections.
 */

import { Rectangle } from '../geometry/Rectangle';
import { VGroup } from '../../core/VGroup';
import { NeuralNetworkLayer } from './NeuralNetworkLayer';
import {
  NodeStyleOptions,
  ResolvedNodeStyle,
  DEFAULT_NODE_STYLE,
  resolveNodeStyle,
} from './mlStyles';

export interface ImageLayerOptions {
  /** Number of pixel rows. Default: 3. Must be >= 0. */
  rows?: number;
  /** Number of pixel columns. Default: 3. Must be >= 0. */
  cols?: number;
  /** Side length of each pixel cell. Default: 0.25. */
  cellSize?: number;
  /** Cell style overrides. */
  nodeStyle?: NodeStyleOptions;
}

export class ImageLayer extends NeuralNetworkLayer {
  private readonly _cols: number;
  private readonly _cellSize: number;
  private readonly _grid: VGroup;

  constructor(options: ImageLayerOptions = {}) {
    super();

    const rows = Math.max(0, Math.floor(options.rows ?? 3));
    this._cols = Math.max(0, Math.floor(options.cols ?? 3));
    this._cellSize = options.cellSize ?? 0.25;
    const style: ResolvedNodeStyle = resolveNodeStyle(DEFAULT_NODE_STYLE, options.nodeStyle);

    this._grid = this._buildGrid(rows, this._cols, style);
    this.add(this._grid);

    // The grid is one connection anchor. An empty grid exposes none.
    if (rows > 0 && this._cols > 0) {
      this._nodes.push(this._grid);
    }
  }

  /**
   * Build the pixel grid centered on the local origin.
   * @param rows - Number of rows.
   * @param cols - Number of columns.
   * @param style - Resolved cell style.
   * @returns A VGroup of cell rectangles (empty when rows or cols is 0).
   */
  private _buildGrid(rows: number, cols: number, style: ResolvedNodeStyle): VGroup {
    const grid = new VGroup();
    const size = this._cellSize;
    const totalWidth = (cols - 1) * size;
    const totalHeight = (rows - 1) * size;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = -totalWidth / 2 + c * size;
        const y = totalHeight / 2 - r * size;
        const cell = new Rectangle({
          width: size,
          height: size,
          color: style.color,
          fillOpacity: style.fillOpacity,
          strokeWidth: style.strokeWidth,
          center: [x, y, 0],
        });
        cell.setFillOpacity(style.fillOpacity);
        grid.add(cell);
      }
    }
    return grid;
  }

  /** Horizontal extent of the grid, always positive for spacing. */
  override layerWidth(): number {
    return Math.max(this._cols, 1) * this._cellSize;
  }
}
