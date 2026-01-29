/**
 * Matrix - Display mathematical matrices with brackets
 *
 * This module provides matrix mobject classes for displaying 2D arrays
 * of values with configurable brackets and styling.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { MathTex } from '../text/MathTex';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Bracket type options for matrices
 */
export type BracketType = '[]' | '()' | '||' | '';

/**
 * Alignment options for elements within cells
 */
export type ElementAlignment = 'left' | 'center' | 'right';

/**
 * Options for creating a Matrix mobject
 */
export interface MatrixOptions {
  /** Type of brackets to use. Default: '[]' */
  bracketType?: BracketType;
  /** Vertical buffer between rows. Default: 0.8 */
  vBuff?: number;
  /** Horizontal buffer between columns. Default: 1.3 */
  hBuff?: number;
  /** Alignment of elements within cells. Default: 'center' */
  elementAlignment?: ElementAlignment;
  /** Bracket color. Default: WHITE */
  bracketColor?: string;
  /** Bracket stroke width. Default: DEFAULT_STROKE_WIDTH */
  bracketStrokeWidth?: number;
  /** Element color for auto-generated MathTex. Default: WHITE */
  elementColor?: string;
  /** Font size for elements. Default: 48 */
  fontSize?: number;
  /** Position. Default: [0, 0, 0] */
  position?: Vector3Tuple;
}

/**
 * Matrix - A mobject for displaying mathematical matrices
 *
 * Displays a 2D array of values with configurable brackets.
 * Entries can be strings, numbers, or Mobject instances.
 *
 * @example
 * ```typescript
 * // Create a simple 2x2 matrix
 * const matrix = new Matrix([
 *   [1, 2],
 *   [3, 4]
 * ]);
 *
 * // Create a matrix with parentheses
 * const parenMatrix = new Matrix([
 *   ['a', 'b'],
 *   ['c', 'd']
 * ], { bracketType: '()' });
 *
 * // Create a determinant (vertical bars)
 * const det = new Matrix([
 *   [1, 0],
 *   [0, 1]
 * ], { bracketType: '||' });
 * ```
 */
export class Matrix extends VGroup {
  protected _data: (string | number | Mobject)[][];
  protected _bracketType: BracketType;
  protected _vBuff: number;
  protected _hBuff: number;
  protected _elementAlignment: ElementAlignment;
  protected _bracketColor: string;
  protected _bracketStrokeWidth: number;
  protected _elementColor: string;
  protected _fontSize: number;

  /** Grid of entry mobjects */
  protected _entries: Mobject[][] = [];

  /** Rows as VGroups */
  protected _rows: VGroup[] = [];

  /** Columns as VGroups */
  protected _columns: VGroup[] = [];

  /** Left bracket mobject */
  protected _leftBracket: VMobject | null = null;

  /** Right bracket mobject */
  protected _rightBracket: VMobject | null = null;

  /** The bracket pair as a VGroup */
  protected _brackets: VGroup | null = null;

  /** The matrix content without brackets */
  protected _content: VGroup | null = null;

  constructor(
    data: (string | number | Mobject)[][],
    options: MatrixOptions = {}
  ) {
    super();

    const {
      bracketType = '[]',
      vBuff = 0.8,
      hBuff = 1.3,
      elementAlignment = 'center',
      bracketColor = WHITE,
      bracketStrokeWidth = DEFAULT_STROKE_WIDTH,
      elementColor = WHITE,
      fontSize = 48,
      position = [0, 0, 0],
    } = options;

    this._data = data;
    this._bracketType = bracketType;
    this._vBuff = vBuff;
    this._hBuff = hBuff;
    this._elementAlignment = elementAlignment;
    this._bracketColor = bracketColor;
    this._bracketStrokeWidth = bracketStrokeWidth;
    this._elementColor = elementColor;
    this._fontSize = fontSize;

    this.position.set(position[0], position[1], position[2]);

    this._buildMatrix();
  }

  /**
   * Build the matrix mobject
   */
  protected _buildMatrix(): void {
    const numRows = this._data.length;
    if (numRows === 0) return;

    const numCols = Math.max(...this._data.map(row => row.length));
    if (numCols === 0) return;

    // Create entry mobjects
    this._entries = [];
    this._rows = [];
    this._columns = Array.from({ length: numCols }, () => new VGroup());

    for (let i = 0; i < numRows; i++) {
      const rowEntries: Mobject[] = [];
      const rowGroup = new VGroup();

      for (let j = 0; j < numCols; j++) {
        const value = this._data[i]?.[j] ?? '';
        const entry = this._createEntry(value);

        rowEntries.push(entry);
        rowGroup.add(entry);
        this._columns[j].add(entry);
      }

      this._entries.push(rowEntries);
      this._rows.push(rowGroup);
    }

    // Layout entries in a grid
    this._layoutEntries();

    // Create content group
    this._content = new VGroup();
    for (const row of this._rows) {
      this._content.add(row);
    }

    // Create brackets
    this._createBrackets();

    // Add all to this group
    if (this._content) {
      this.add(this._content);
    }
    if (this._brackets) {
      this.add(this._brackets);
    }
  }

  /**
   * Create a mobject for a single entry
   */
  protected _createEntry(value: string | number | Mobject): Mobject {
    if (value instanceof Mobject) {
      return value;
    }

    // Convert to LaTeX string
    const latex = typeof value === 'number' ? String(value) : value;

    return new MathTex({
      latex,
      color: this._elementColor,
      fontSize: this._fontSize,
    });
  }

  /**
   * Layout entries in a grid pattern
   */
  protected _layoutEntries(): void {
    const numRows = this._entries.length;
    if (numRows === 0) return;

    const numCols = this._entries[0].length;

    // Calculate cell dimensions
    let maxCellWidth = 0;
    let maxCellHeight = 0;

    for (const row of this._entries) {
      for (const entry of row) {
        const bounds = this._getEntryBounds(entry);
        maxCellWidth = Math.max(maxCellWidth, bounds.width);
        maxCellHeight = Math.max(maxCellHeight, bounds.height);
      }
    }

    // Add buffer
    const cellWidth = maxCellWidth + this._hBuff * 0.3;
    const cellHeight = maxCellHeight + this._vBuff * 0.3;

    // Position entries
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        const entry = this._entries[i][j];

        // Calculate position (centered grid)
        const x = (j - (numCols - 1) / 2) * cellWidth;
        const y = ((numRows - 1) / 2 - i) * cellHeight;

        entry.moveTo([x, y, 0]);
      }
    }
  }

  /**
   * Get bounds of an entry mobject
   */
  protected _getEntryBounds(entry: Mobject): { width: number; height: number } {
    // Try to get dimensions from the entry
    const threeObj = entry.getThreeObject();
    const box = new THREE.Box3().setFromObject(threeObj);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Fallback for empty or not-yet-rendered objects
    return {
      width: size.x > 0 ? size.x : 0.5,
      height: size.y > 0 ? size.y : 0.5,
    };
  }

  /**
   * Create the bracket mobjects
   */
  protected _createBrackets(): void {
    if (this._bracketType === '') {
      this._brackets = null;
      return;
    }

    // Calculate content dimensions
    const contentBounds = this._getContentBounds();
    const height = contentBounds.height + this._vBuff * 0.5;
    const width = contentBounds.width;

    // Create bracket group
    this._brackets = new VGroup();

    // Create left bracket
    this._leftBracket = this._createBracketShape(
      this._bracketType,
      'left',
      height
    );
    if (this._leftBracket) {
      this._leftBracket.moveTo([-(width / 2 + this._hBuff * 0.3), 0, 0]);
      this._brackets.add(this._leftBracket);
    }

    // Create right bracket
    this._rightBracket = this._createBracketShape(
      this._bracketType,
      'right',
      height
    );
    if (this._rightBracket) {
      this._rightBracket.moveTo([width / 2 + this._hBuff * 0.3, 0, 0]);
      this._brackets.add(this._rightBracket);
    }
  }

  /**
   * Create a bracket shape as a VMobject
   */
  protected _createBracketShape(
    type: BracketType,
    side: 'left' | 'right',
    height: number
  ): VMobject {
    const bracket = new VMobject();
    bracket.color = this._bracketColor;
    bracket.strokeWidth = this._bracketStrokeWidth;
    bracket.fillOpacity = 0;

    const halfHeight = height / 2;
    const hookSize = height * 0.08; // Size of the horizontal parts
    const points: number[][] = [];

    switch (type) {
      case '[]':
        // Square brackets
        if (side === 'left') {
          // Top hook, vertical line, bottom hook (left side: opens right)
          points.push(
            [hookSize, halfHeight, 0],
            [0, halfHeight, 0],
            [0, -halfHeight, 0],
            [hookSize, -halfHeight, 0]
          );
        } else {
          // Top hook, vertical line, bottom hook (right side: opens left)
          points.push(
            [-hookSize, halfHeight, 0],
            [0, halfHeight, 0],
            [0, -halfHeight, 0],
            [-hookSize, -halfHeight, 0]
          );
        }
        break;

      case '()':
        // Parentheses (curved)
        const curveWidth = hookSize * 1.5;
        const numSegments = 20;

        for (let i = 0; i <= numSegments; i++) {
          const t = i / numSegments;
          const angle = Math.PI * (t - 0.5); // -PI/2 to PI/2
          const y = halfHeight * Math.sin(angle);
          const x = curveWidth * (1 - Math.cos(angle));

          if (side === 'left') {
            points.push([x, y, 0]);
          } else {
            points.push([-x, y, 0]);
          }
        }
        break;

      case '||':
        // Vertical bars (for determinants)
        if (side === 'left') {
          points.push([0, halfHeight, 0], [0, -halfHeight, 0]);
        } else {
          points.push([0, halfHeight, 0], [0, -halfHeight, 0]);
        }
        break;
    }

    // Convert points to Bezier control points
    bracket.setPoints3D(this._pointsToLineBezier(points));

    return bracket;
  }

  /**
   * Convert a list of points to cubic Bezier control points for line segments
   */
  protected _pointsToLineBezier(points: number[][]): number[][] {
    if (points.length < 2) return [];

    const bezierPoints: number[][] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const dz = p1[2] - p0[2];

      if (i === 0) {
        bezierPoints.push([...p0]);
      }

      // Add control points for line segment (1/3 and 2/3 along line)
      bezierPoints.push([p0[0] + dx / 3, p0[1] + dy / 3, p0[2] + dz / 3]);
      bezierPoints.push([
        p0[0] + (2 * dx) / 3,
        p0[1] + (2 * dy) / 3,
        p0[2] + (2 * dz) / 3,
      ]);
      bezierPoints.push([...p1]);
    }

    return bezierPoints;
  }

  /**
   * Get bounds of the content (without brackets)
   */
  protected _getContentBounds(): { width: number; height: number } {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const row of this._entries) {
      for (const entry of row) {
        const center = entry.getCenter();
        const bounds = this._getEntryBounds(entry);

        minX = Math.min(minX, center[0] - bounds.width / 2);
        maxX = Math.max(maxX, center[0] + bounds.width / 2);
        minY = Math.min(minY, center[1] - bounds.height / 2);
        maxY = Math.max(maxY, center[1] + bounds.height / 2);
      }
    }

    return {
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Get all entries as a flat VGroup
   */
  getEntries(): VGroup {
    const entries = new VGroup();
    for (const row of this._entries) {
      for (const entry of row) {
        if (entry instanceof VMobject) {
          entries.add(entry);
        }
      }
    }
    return entries;
  }

  /**
   * Get a specific entry by row and column index
   * @param i Row index (0-based)
   * @param j Column index (0-based)
   * @returns The entry mobject, or undefined if out of bounds
   */
  getEntry(i: number, j: number): Mobject | undefined {
    return this._entries[i]?.[j];
  }

  /**
   * Get all rows as VGroups
   */
  getRows(): VGroup[] {
    return [...this._rows];
  }

  /**
   * Get a specific row as a VGroup
   * @param i Row index (0-based)
   * @returns The row VGroup, or undefined if out of bounds
   */
  getRow(i: number): VGroup | undefined {
    return this._rows[i];
  }

  /**
   * Get all columns as VGroups
   */
  getColumns(): VGroup[] {
    return [...this._columns];
  }

  /**
   * Get a specific column as a VGroup
   * @param j Column index (0-based)
   * @returns The column VGroup, or undefined if out of bounds
   */
  getColumn(j: number): VGroup | undefined {
    return this._columns[j];
  }

  /**
   * Get the bracket mobjects as a VGroup
   * @returns VGroup containing left and right brackets, or null if no brackets
   */
  getBrackets(): VGroup | null {
    return this._brackets;
  }

  /**
   * Get the left bracket mobject
   */
  getLeftBracket(): VMobject | null {
    return this._leftBracket;
  }

  /**
   * Get the right bracket mobject
   */
  getRightBracket(): VMobject | null {
    return this._rightBracket;
  }

  /**
   * Get the number of rows
   */
  get numRows(): number {
    return this._entries.length;
  }

  /**
   * Get the number of columns
   */
  get numCols(): number {
    return this._entries[0]?.length ?? 0;
  }

  /**
   * Create a copy of this Matrix
   */
  protected override _createCopy(): VMobject {
    // Deep copy the data
    const dataCopy = this._data.map(row =>
      row.map(val => (val instanceof Mobject ? val.copy() : val))
    );

    return new Matrix(dataCopy, {
      bracketType: this._bracketType,
      vBuff: this._vBuff,
      hBuff: this._hBuff,
      elementAlignment: this._elementAlignment,
      bracketColor: this._bracketColor,
      bracketStrokeWidth: this._bracketStrokeWidth,
      elementColor: this._elementColor,
      fontSize: this._fontSize,
      position: [this.position.x, this.position.y, this.position.z],
    });
  }
}

/**
 * Options for IntegerMatrix
 */
export interface IntegerMatrixOptions extends Omit<MatrixOptions, never> {}

/**
 * IntegerMatrix - A matrix specialized for integer values
 *
 * @example
 * ```typescript
 * const intMatrix = new IntegerMatrix([
 *   [1, 2, 3],
 *   [4, 5, 6],
 *   [7, 8, 9]
 * ]);
 * ```
 */
export class IntegerMatrix extends Matrix {
  constructor(data: number[][], options: IntegerMatrixOptions = {}) {
    // Round all values to integers
    const intData = data.map(row => row.map(val => Math.round(val)));
    super(intData, options);
  }

  /**
   * Create a copy of this IntegerMatrix
   */
  protected override _createCopy(): VMobject {
    const dataCopy = this._data.map(row =>
      row.map(val => (typeof val === 'number' ? val : 0))
    );

    return new IntegerMatrix(dataCopy as number[][], {
      bracketType: this._bracketType,
      vBuff: this._vBuff,
      hBuff: this._hBuff,
      elementAlignment: this._elementAlignment,
      bracketColor: this._bracketColor,
      bracketStrokeWidth: this._bracketStrokeWidth,
      elementColor: this._elementColor,
      fontSize: this._fontSize,
      position: [this.position.x, this.position.y, this.position.z],
    });
  }
}

/**
 * Options for DecimalMatrix
 */
export interface DecimalMatrixOptions extends MatrixOptions {
  /** Number of decimal places to display. Default: 2 */
  numDecimalPlaces?: number;
}

/**
 * DecimalMatrix - A matrix specialized for decimal values
 *
 * @example
 * ```typescript
 * const decMatrix = new DecimalMatrix([
 *   [1.234, 2.567],
 *   [3.891, 4.012]
 * ], { numDecimalPlaces: 2 });
 * ```
 */
export class DecimalMatrix extends Matrix {
  protected _numDecimalPlaces: number;

  constructor(data: number[][], options: DecimalMatrixOptions = {}) {
    const { numDecimalPlaces = 2, ...matrixOptions } = options;

    // Format all values with specified decimal places
    const formattedData = data.map(row =>
      row.map(val => val.toFixed(numDecimalPlaces))
    );

    super(formattedData, matrixOptions);
    this._numDecimalPlaces = numDecimalPlaces;
  }

  /**
   * Create a copy of this DecimalMatrix
   */
  protected override _createCopy(): VMobject {
    // Parse the formatted strings back to numbers
    const dataCopy = this._data.map(row =>
      row.map(val => (typeof val === 'string' ? parseFloat(val) : val as number))
    );

    return new DecimalMatrix(dataCopy as number[][], {
      bracketType: this._bracketType,
      vBuff: this._vBuff,
      hBuff: this._hBuff,
      elementAlignment: this._elementAlignment,
      bracketColor: this._bracketColor,
      bracketStrokeWidth: this._bracketStrokeWidth,
      elementColor: this._elementColor,
      fontSize: this._fontSize,
      numDecimalPlaces: this._numDecimalPlaces,
      position: [this.position.x, this.position.y, this.position.z],
    });
  }
}

/**
 * Options for MobjectMatrix
 */
export interface MobjectMatrixOptions extends MatrixOptions {}

/**
 * MobjectMatrix - A matrix containing arbitrary Mobjects
 *
 * @example
 * ```typescript
 * const mobjectMatrix = new MobjectMatrix([
 *   [new Circle(), new Square()],
 *   [new Triangle(), new MathTex({ latex: '\\pi' })]
 * ]);
 * ```
 */
export class MobjectMatrix extends Matrix {
  constructor(data: Mobject[][], options: MobjectMatrixOptions = {}) {
    super(data, options);
  }

  /**
   * Create an entry from a Mobject (direct pass-through)
   */
  protected override _createEntry(value: string | number | Mobject): Mobject {
    if (value instanceof Mobject) {
      return value;
    }
    // Fallback for non-Mobject values
    return super._createEntry(value);
  }

  /**
   * Create a copy of this MobjectMatrix
   */
  protected override _createCopy(): VMobject {
    const dataCopy = this._data.map(row =>
      row.map(val => (val instanceof Mobject ? val.copy() : val))
    ) as Mobject[][];

    return new MobjectMatrix(dataCopy, {
      bracketType: this._bracketType,
      vBuff: this._vBuff,
      hBuff: this._hBuff,
      elementAlignment: this._elementAlignment,
      bracketColor: this._bracketColor,
      bracketStrokeWidth: this._bracketStrokeWidth,
      elementColor: this._elementColor,
      fontSize: this._fontSize,
      position: [this.position.x, this.position.y, this.position.z],
    });
  }
}

export default Matrix;
