/**
 * Table - Table mobjects for manimweb
 *
 * This module provides table layout capabilities for displaying data in grids,
 * supporting various entry types including text, math, and arbitrary mobjects.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple, ORIGIN } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { Line } from '../geometry/Line';
import { Rectangle } from '../geometry/Rectangle';
import { MathTex } from '../text/MathTex';
import { DecimalNumber } from '../text/DecimalNumber';
import { WHITE, YELLOW } from '../../constants/colors';

/**
 * Options for creating a Table
 */
export interface TableOptions {
  /** 2D array of mobjects to display in the table */
  data: Mobject[][];
  /** Row labels to display on the left side */
  rowLabels?: Mobject[];
  /** Column labels to display on top */
  colLabels?: Mobject[];
  /** Top-left element when both row and column labels exist */
  topLeftEntry?: Mobject;
  /** Whether to include outer lines around the table. Default: true */
  includeOuterLines?: boolean;
  /** Vertical buffer between cells. Default: 0.3 */
  vBuff?: number;
  /** Horizontal buffer between cells. Default: 0.5 */
  hBuff?: number;
  /** Color of the grid lines. Default: WHITE */
  lineColor?: string;
  /** Stroke width of grid lines. Default: 2 */
  lineStrokeWidth?: number;
  /** Whether to arrange entries in rows. Default: true */
  arrangeInRowsFirst?: boolean;
  /** Color for all entries. If set, overrides individual colors */
  entriesColor?: string;
  /** Background color for cells. Default: transparent */
  backgroundStrokeColor?: string;
  /** Background fill opacity. Default: 0 */
  backgroundFillOpacity?: number;
  /** Starting position. Default: ORIGIN */
  position?: Vector3Tuple;
}

/**
 * Table - A grid layout of mobjects with optional labels and lines
 *
 * Creates a table with rows and columns of mobjects, with customizable
 * spacing, labels, and grid lines.
 *
 * @example
 * ```typescript
 * // Create a simple 2x2 table of MathTex
 * const t1 = new MathTex({ latex: '1' });
 * const t2 = new MathTex({ latex: '2' });
 * const t3 = new MathTex({ latex: '3' });
 * const t4 = new MathTex({ latex: '4' });
 * const table = new Table({
 *   data: [[t1, t2], [t3, t4]]
 * });
 *
 * // Create a table with row and column labels
 * const table = new Table({
 *   data: [[entry1, entry2], [entry3, entry4]],
 *   rowLabels: [rowLabel1, rowLabel2],
 *   colLabels: [colLabel1, colLabel2]
 * });
 * ```
 */
export class Table extends VGroup {
  protected _data: Mobject[][];
  protected _rowLabels: Mobject[];
  protected _colLabels: Mobject[];
  protected _topLeftEntry: Mobject | null;
  protected _includeOuterLines: boolean;
  protected _vBuff: number;
  protected _hBuff: number;
  protected _lineColor: string;
  protected _lineStrokeWidth: number;

  /** Number of rows in the table (excluding labels) */
  protected _numRows: number;
  /** Number of columns in the table (excluding labels) */
  protected _numCols: number;

  /** All entries arranged in the table (includes labels) */
  protected _entries: VGroup;
  /** Horizontal lines */
  protected _horizontalLines: VGroup;
  /** Vertical lines */
  protected _verticalLines: VGroup;
  /** Background rectangles for highlighting */
  protected _backgroundRectangles: Map<string, Rectangle> = new Map();

  /** Cell dimensions for each row and column */
  protected _rowHeights: number[] = [];
  protected _colWidths: number[] = [];

  /** Starting positions for rows and columns */
  protected _rowPositions: number[] = [];
  protected _colPositions: number[] = [];

  constructor(options: TableOptions) {
    super();

    const {
      data,
      rowLabels = [],
      colLabels = [],
      topLeftEntry,
      includeOuterLines = true,
      vBuff = 0.3,
      hBuff = 0.5,
      lineColor = WHITE,
      lineStrokeWidth = 2,
      entriesColor,
      position = ORIGIN,
    } = options;

    this._data = data;
    this._rowLabels = rowLabels;
    this._colLabels = colLabels;
    this._topLeftEntry = topLeftEntry || null;
    this._includeOuterLines = includeOuterLines;
    this._vBuff = vBuff;
    this._hBuff = hBuff;
    this._lineColor = lineColor;
    this._lineStrokeWidth = lineStrokeWidth;

    // Calculate dimensions
    this._numRows = data.length;
    this._numCols = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;

    // Initialize groups
    this._entries = new VGroup();
    this._horizontalLines = new VGroup();
    this._verticalLines = new VGroup();

    // Apply entry color if specified
    if (entriesColor) {
      for (const row of data) {
        for (const entry of row) {
          entry.setColor(entriesColor);
        }
      }
      for (const label of rowLabels) {
        label.setColor(entriesColor);
      }
      for (const label of colLabels) {
        label.setColor(entriesColor);
      }
    }

    // Build the table
    this._calculateDimensions();
    this._arrangeEntries();
    this._createLines();

    // Add all components to this VGroup
    this.add(this._entries);
    this.add(this._horizontalLines);
    this.add(this._verticalLines);

    // Move to position
    this.moveTo(position);
  }

  /**
   * Calculate cell dimensions based on entry sizes
   */
  protected _calculateDimensions(): void {
    const hasRowLabels = this._rowLabels.length > 0;
    const hasColLabels = this._colLabels.length > 0;

    // Total rows and columns including labels
    const totalRows = this._numRows + (hasColLabels ? 1 : 0);
    const totalCols = this._numCols + (hasRowLabels ? 1 : 0);

    // Initialize arrays
    this._rowHeights = new Array(totalRows).fill(0);
    this._colWidths = new Array(totalCols).fill(0);

    // Calculate dimensions for column labels
    if (hasColLabels) {
      for (let col = 0; col < this._colLabels.length; col++) {
        const label = this._colLabels[col];
        const bounds = this._getMobjectBounds(label);
        const actualCol = hasRowLabels ? col + 1 : col;
        this._rowHeights[0] = Math.max(this._rowHeights[0], bounds.height);
        this._colWidths[actualCol] = Math.max(this._colWidths[actualCol], bounds.width);
      }
    }

    // Calculate dimensions for row labels
    if (hasRowLabels) {
      for (let row = 0; row < this._rowLabels.length; row++) {
        const label = this._rowLabels[row];
        const bounds = this._getMobjectBounds(label);
        const actualRow = hasColLabels ? row + 1 : row;
        this._rowHeights[actualRow] = Math.max(this._rowHeights[actualRow], bounds.height);
        this._colWidths[0] = Math.max(this._colWidths[0], bounds.width);
      }
    }

    // Calculate dimensions for top-left entry
    if (hasRowLabels && hasColLabels && this._topLeftEntry) {
      const bounds = this._getMobjectBounds(this._topLeftEntry);
      this._rowHeights[0] = Math.max(this._rowHeights[0], bounds.height);
      this._colWidths[0] = Math.max(this._colWidths[0], bounds.width);
    }

    // Calculate dimensions for data cells
    for (let row = 0; row < this._data.length; row++) {
      for (let col = 0; col < this._data[row].length; col++) {
        const entry = this._data[row][col];
        const bounds = this._getMobjectBounds(entry);

        const actualRow = hasColLabels ? row + 1 : row;
        const actualCol = hasRowLabels ? col + 1 : col;

        this._rowHeights[actualRow] = Math.max(this._rowHeights[actualRow], bounds.height);
        this._colWidths[actualCol] = Math.max(this._colWidths[actualCol], bounds.width);
      }
    }

    // Add buffer to dimensions
    this._rowHeights = this._rowHeights.map(h => h + this._vBuff * 2);
    this._colWidths = this._colWidths.map(w => w + this._hBuff * 2);

    // Calculate positions (center-based)
    this._rowPositions = [];
    this._colPositions = [];

    // Calculate total dimensions
    const totalHeight = this._rowHeights.reduce((a, b) => a + b, 0);
    const totalWidth = this._colWidths.reduce((a, b) => a + b, 0);

    // Row positions (from top to bottom, Y decreases)
    let yPos = totalHeight / 2;
    for (const height of this._rowHeights) {
      this._rowPositions.push(yPos - height / 2);
      yPos -= height;
    }

    // Column positions (from left to right, X increases)
    let xPos = -totalWidth / 2;
    for (const width of this._colWidths) {
      this._colPositions.push(xPos + width / 2);
      xPos += width;
    }
  }

  /**
   * Get bounds of a mobject
   */
  protected _getMobjectBounds(mobject: Mobject): { width: number; height: number } {
    // Try to get Three.js bounding box
    const threeObj = mobject.getThreeObject();
    if (threeObj) {
      const box = new THREE.Box3().setFromObject(threeObj);
      const size = new THREE.Vector3();
      box.getSize(size);
      if (size.x > 0 && size.y > 0) {
        return { width: size.x, height: size.y };
      }
    }
    // Default fallback
    return { width: 0.5, height: 0.5 };
  }

  /**
   * Arrange entries in the table grid
   */
  protected _arrangeEntries(): void {
    const hasRowLabels = this._rowLabels.length > 0;
    const hasColLabels = this._colLabels.length > 0;

    // Place top-left entry
    if (hasRowLabels && hasColLabels && this._topLeftEntry) {
      this._topLeftEntry.moveTo([this._colPositions[0], this._rowPositions[0], 0]);
      this._entries.add(this._topLeftEntry as VMobject);
    }

    // Place column labels
    if (hasColLabels) {
      for (let col = 0; col < this._colLabels.length; col++) {
        const actualCol = hasRowLabels ? col + 1 : col;
        this._colLabels[col].moveTo([this._colPositions[actualCol], this._rowPositions[0], 0]);
        this._entries.add(this._colLabels[col] as VMobject);
      }
    }

    // Place row labels
    if (hasRowLabels) {
      for (let row = 0; row < this._rowLabels.length; row++) {
        const actualRow = hasColLabels ? row + 1 : row;
        this._rowLabels[row].moveTo([this._colPositions[0], this._rowPositions[actualRow], 0]);
        this._entries.add(this._rowLabels[row] as VMobject);
      }
    }

    // Place data entries
    for (let row = 0; row < this._data.length; row++) {
      for (let col = 0; col < this._data[row].length; col++) {
        const actualRow = hasColLabels ? row + 1 : row;
        const actualCol = hasRowLabels ? col + 1 : col;

        this._data[row][col].moveTo([
          this._colPositions[actualCol],
          this._rowPositions[actualRow],
          0
        ]);
        this._entries.add(this._data[row][col] as VMobject);
      }
    }
  }

  /**
   * Create grid lines
   */
  protected _createLines(): void {
    const hasRowLabels = this._rowLabels.length > 0;
    const hasColLabels = this._colLabels.length > 0;

    const totalRows = this._numRows + (hasColLabels ? 1 : 0);
    const totalCols = this._numCols + (hasRowLabels ? 1 : 0);

    // Calculate total dimensions
    const totalHeight = this._rowHeights.reduce((a, b) => a + b, 0);
    const totalWidth = this._colWidths.reduce((a, b) => a + b, 0);

    const left = -totalWidth / 2;
    const right = totalWidth / 2;
    const top = totalHeight / 2;
    const bottom = -totalHeight / 2;

    // Create horizontal lines
    let yPos = top;
    for (let i = 0; i <= totalRows; i++) {
      // Skip outer lines if not included
      if (!this._includeOuterLines && (i === 0 || i === totalRows)) {
        if (i < totalRows) {
          yPos -= this._rowHeights[i];
        }
        continue;
      }

      const line = new Line({
        start: [left, yPos, 0],
        end: [right, yPos, 0],
        color: this._lineColor,
        strokeWidth: this._lineStrokeWidth,
      });
      this._horizontalLines.add(line);

      if (i < totalRows) {
        yPos -= this._rowHeights[i];
      }
    }

    // Create vertical lines
    let xPos = left;
    for (let i = 0; i <= totalCols; i++) {
      // Skip outer lines if not included
      if (!this._includeOuterLines && (i === 0 || i === totalCols)) {
        if (i < totalCols) {
          xPos += this._colWidths[i];
        }
        continue;
      }

      const line = new Line({
        start: [xPos, top, 0],
        end: [xPos, bottom, 0],
        color: this._lineColor,
        strokeWidth: this._lineStrokeWidth,
      });
      this._verticalLines.add(line);

      if (i < totalCols) {
        xPos += this._colWidths[i];
      }
    }
  }

  /**
   * Get a specific cell entry by row and column (0-indexed, data only)
   * @param row - Row index (0-based)
   * @param col - Column index (0-based)
   * @returns The mobject at that cell
   */
  getCell(row: number, col: number): Mobject {
    if (row < 0 || row >= this._numRows || col < 0 || col >= this._numCols) {
      throw new Error(`Cell (${row}, ${col}) out of bounds`);
    }
    return this._data[row][col];
  }

  /**
   * Get a row as a VGroup (0-indexed, data only)
   * @param row - Row index (0-based)
   * @returns VGroup containing all entries in the row
   */
  getRow(row: number): VGroup {
    if (row < 0 || row >= this._numRows) {
      throw new Error(`Row ${row} out of bounds`);
    }
    return new VGroup(...this._data[row].map(m => m as VMobject));
  }

  /**
   * Get a column as a VGroup (0-indexed, data only)
   * @param col - Column index (0-based)
   * @returns VGroup containing all entries in the column
   */
  getColumn(col: number): VGroup {
    if (col < 0 || col >= this._numCols) {
      throw new Error(`Column ${col} out of bounds`);
    }
    const entries: VMobject[] = [];
    for (let row = 0; row < this._numRows; row++) {
      if (col < this._data[row].length) {
        entries.push(this._data[row][col] as VMobject);
      }
    }
    return new VGroup(...entries);
  }

  /**
   * Get all data entries as a VGroup
   * @returns VGroup containing all data entries
   */
  getEntries(): VGroup {
    const entries: VMobject[] = [];
    for (const row of this._data) {
      for (const entry of row) {
        entries.push(entry as VMobject);
      }
    }
    return new VGroup(...entries);
  }

  /**
   * Get row labels as a VGroup
   */
  getRowLabels(): VGroup {
    return new VGroup(...this._rowLabels.map(m => m as VMobject));
  }

  /**
   * Get column labels as a VGroup
   */
  getColLabels(): VGroup {
    return new VGroup(...this._colLabels.map(m => m as VMobject));
  }

  /**
   * Get all horizontal lines
   */
  getHorizontalLines(): VGroup {
    return this._horizontalLines;
  }

  /**
   * Get all vertical lines
   */
  getVerticalLines(): VGroup {
    return this._verticalLines;
  }

  /**
   * Add a highlight rectangle behind a cell
   * @param row - Row index (0-based)
   * @param col - Column index (0-based)
   * @param color - Highlight color. Default: YELLOW
   * @param opacity - Fill opacity. Default: 0.3
   * @returns The created Rectangle for further customization
   */
  addHighlight(row: number, col: number, color: string = YELLOW, opacity: number = 0.3): Rectangle {
    const hasRowLabels = this._rowLabels.length > 0;
    const hasColLabels = this._colLabels.length > 0;

    const actualRow = hasColLabels ? row + 1 : row;
    const actualCol = hasRowLabels ? col + 1 : col;

    const key = `${row},${col}`;

    // Remove existing highlight if any
    if (this._backgroundRectangles.has(key)) {
      const existing = this._backgroundRectangles.get(key)!;
      this.remove(existing);
      this._backgroundRectangles.delete(key);
    }

    const rect = new Rectangle({
      width: this._colWidths[actualCol],
      height: this._rowHeights[actualRow],
      center: [this._colPositions[actualCol], this._rowPositions[actualRow], -0.01],
      color: color,
      fillOpacity: opacity,
      strokeWidth: 0,
    });

    this._backgroundRectangles.set(key, rect);

    // Add at the beginning so it's behind entries
    this.children.unshift(rect);
    rect.parent = this;

    this._markDirty();
    return rect;
  }

  /**
   * Remove a highlight from a cell
   * @param row - Row index (0-based)
   * @param col - Column index (0-based)
   */
  removeHighlight(row: number, col: number): this {
    const key = `${row},${col}`;
    if (this._backgroundRectangles.has(key)) {
      const rect = this._backgroundRectangles.get(key)!;
      this.remove(rect);
      this._backgroundRectangles.delete(key);
    }
    return this;
  }

  /**
   * Get the number of rows (data only)
   */
  getNumRows(): number {
    return this._numRows;
  }

  /**
   * Get the number of columns (data only)
   */
  getNumCols(): number {
    return this._numCols;
  }

  /**
   * Set the color of grid lines
   */
  setLineColor(color: string): this {
    this._lineColor = color;
    for (const child of this._horizontalLines.children) {
      child.setColor(color);
    }
    for (const child of this._verticalLines.children) {
      child.setColor(color);
    }
    return this;
  }

  /**
   * Create a copy of this Table
   */
  protected override _createCopy(): VMobject {
    // Deep copy data
    const dataCopy = this._data.map(row =>
      row.map(entry => entry.copy())
    );
    const rowLabelsCopy = this._rowLabels.map(label => label.copy());
    const colLabelsCopy = this._colLabels.map(label => label.copy());

    return new Table({
      data: dataCopy,
      rowLabels: rowLabelsCopy,
      colLabels: colLabelsCopy,
      topLeftEntry: this._topLeftEntry?.copy(),
      includeOuterLines: this._includeOuterLines,
      vBuff: this._vBuff,
      hBuff: this._hBuff,
      lineColor: this._lineColor,
      lineStrokeWidth: this._lineStrokeWidth,
    });
  }
}

/**
 * Options for creating a MathTable
 */
export interface MathTableOptions extends Omit<TableOptions, 'data' | 'rowLabels' | 'colLabels'> {
  /** 2D array of LaTeX strings */
  data: string[][];
  /** Row labels as LaTeX strings */
  rowLabels?: string[];
  /** Column labels as LaTeX strings */
  colLabels?: string[];
  /** Font size for MathTex entries. Default: 36 */
  fontSize?: number;
  /** Color for all entries. Default: WHITE */
  color?: string;
}

/**
 * MathTable - A table where all entries are LaTeX-rendered MathTex
 *
 * Convenience class for creating tables of mathematical expressions.
 *
 * @example
 * ```typescript
 * const table = new MathTable({
 *   data: [
 *     ['x', 'x^2', 'x^3'],
 *     ['1', '1', '1'],
 *     ['2', '4', '8'],
 *     ['3', '9', '27'],
 *   ],
 *   colLabels: ['x', 'x^2', 'x^3'],
 * });
 * ```
 */
export class MathTable extends Table {
  constructor(options: MathTableOptions) {
    const {
      data,
      rowLabels,
      colLabels,
      fontSize = 36,
      color = WHITE,
      ...rest
    } = options;

    // Convert string[][] to MathTex[][]
    const mathData = data.map(row =>
      row.map(latex => new MathTex({ latex, fontSize, color }))
    );

    // Convert row labels
    const mathRowLabels = rowLabels?.map(latex =>
      new MathTex({ latex, fontSize, color })
    );

    // Convert column labels
    const mathColLabels = colLabels?.map(latex =>
      new MathTex({ latex, fontSize, color })
    );

    super({
      data: mathData,
      rowLabels: mathRowLabels,
      colLabels: mathColLabels,
      ...rest,
    });
  }
}

/**
 * Options for creating a MobjectTable
 */
export interface MobjectTableOptions extends TableOptions {
  // Same as TableOptions, just renamed for clarity
}

/**
 * MobjectTable - A table that can contain any type of mobject
 *
 * This is essentially an alias for Table, but with a more descriptive name
 * when you explicitly want to mix different mobject types.
 *
 * @example
 * ```typescript
 * const circle = new Circle();
 * const square = new Square();
 * const text = new Text({ text: 'Hello' });
 *
 * const table = new MobjectTable({
 *   data: [[circle, square, text]]
 * });
 * ```
 */
export class MobjectTable extends Table {
  constructor(options: MobjectTableOptions) {
    super(options);
  }
}

/**
 * Options for creating an IntegerTable
 */
export interface IntegerTableOptions extends Omit<TableOptions, 'data' | 'rowLabels' | 'colLabels'> {
  /** 2D array of integers */
  data: number[][];
  /** Row labels as integers */
  rowLabels?: number[];
  /** Column labels as integers */
  colLabels?: number[];
  /** Font size. Default: 36 */
  fontSize?: number;
  /** Color for all entries. Default: WHITE */
  color?: string;
}

/**
 * IntegerTable - A table of integers
 *
 * Creates a table displaying integer values using DecimalNumber with 0 decimal places.
 *
 * @example
 * ```typescript
 * const table = new IntegerTable({
 *   data: [
 *     [1, 2, 3],
 *     [4, 5, 6],
 *     [7, 8, 9],
 *   ]
 * });
 * ```
 */
export class IntegerTable extends Table {
  constructor(options: IntegerTableOptions) {
    const {
      data,
      rowLabels,
      colLabels,
      fontSize = 36,
      color = WHITE,
      ...rest
    } = options;

    // Convert number[][] to DecimalNumber[][]
    const intData = data.map(row =>
      row.map(value => new DecimalNumber({
        value,
        numDecimalPlaces: 0,
        fontSize,
        color,
      }))
    );

    // Convert row labels
    const intRowLabels = rowLabels?.map(value =>
      new DecimalNumber({
        value,
        numDecimalPlaces: 0,
        fontSize,
        color,
      })
    );

    // Convert column labels
    const intColLabels = colLabels?.map(value =>
      new DecimalNumber({
        value,
        numDecimalPlaces: 0,
        fontSize,
        color,
      })
    );

    super({
      data: intData,
      rowLabels: intRowLabels,
      colLabels: intColLabels,
      ...rest,
    });
  }
}

/**
 * Options for creating a DecimalTable
 */
export interface DecimalTableOptions extends Omit<TableOptions, 'data' | 'rowLabels' | 'colLabels'> {
  /** 2D array of decimal numbers */
  data: number[][];
  /** Row labels as decimal numbers */
  rowLabels?: number[];
  /** Column labels as decimal numbers */
  colLabels?: number[];
  /** Number of decimal places. Default: 2 */
  numDecimalPlaces?: number;
  /** Font size. Default: 36 */
  fontSize?: number;
  /** Color for all entries. Default: WHITE */
  color?: string;
}

/**
 * DecimalTable - A table of decimal numbers
 *
 * Creates a table displaying decimal values with configurable precision.
 *
 * @example
 * ```typescript
 * const table = new DecimalTable({
 *   data: [
 *     [1.234, 2.567, 3.891],
 *     [4.123, 5.456, 6.789],
 *   ],
 *   numDecimalPlaces: 2
 * });
 * ```
 */
export class DecimalTable extends Table {
  constructor(options: DecimalTableOptions) {
    const {
      data,
      rowLabels,
      colLabels,
      numDecimalPlaces = 2,
      fontSize = 36,
      color = WHITE,
      ...rest
    } = options;

    // Convert number[][] to DecimalNumber[][]
    const decData = data.map(row =>
      row.map(value => new DecimalNumber({
        value,
        numDecimalPlaces,
        fontSize,
        color,
      }))
    );

    // Convert row labels
    const decRowLabels = rowLabels?.map(value =>
      new DecimalNumber({
        value,
        numDecimalPlaces,
        fontSize,
        color,
      })
    );

    // Convert column labels
    const decColLabels = colLabels?.map(value =>
      new DecimalNumber({
        value,
        numDecimalPlaces,
        fontSize,
        color,
      })
    );

    super({
      data: decData,
      rowLabels: decRowLabels,
      colLabels: decColLabels,
      ...rest,
    });
  }
}

export default Table;
