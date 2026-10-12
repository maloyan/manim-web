/**
 * Table variants for manimweb
 *
 * Specialized Table subclasses that build their entries from simple inputs:
 * LaTeX strings (MathTable), arbitrary mobjects (MobjectTable), and numbers
 * (IntegerTable, DecimalTable).
 */

import { MathTexImage } from '../text/MathTexImage';
import { DecimalNumber } from '../text/DecimalNumber';
import { WHITE } from '../../constants/colors';
import { Table, TableOptions } from './Table';

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
    const { data, rowLabels, colLabels, fontSize = 36, color = WHITE, ...rest } = options;

    // Convert string[][] to MathTexImage[][]
    const mathData = data.map((row) =>
      row.map((latex) => new MathTexImage({ latex, fontSize, color })),
    );

    // Convert row labels
    const mathRowLabels = rowLabels?.map((latex) => new MathTexImage({ latex, fontSize, color }));

    // Convert column labels
    const mathColLabels = colLabels?.map((latex) => new MathTexImage({ latex, fontSize, color }));

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
export type MobjectTableOptions = TableOptions;

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
export interface IntegerTableOptions extends Omit<
  TableOptions,
  'data' | 'rowLabels' | 'colLabels'
> {
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
    const { data, rowLabels, colLabels, fontSize = 36, color = WHITE, ...rest } = options;

    // Convert number[][] to DecimalNumber[][]
    const intData = data.map((row) =>
      row.map(
        (value) =>
          new DecimalNumber({
            value,
            numDecimalPlaces: 0,
            fontSize,
            color,
          }),
      ),
    );

    // Convert row labels
    const intRowLabels = rowLabels?.map(
      (value) =>
        new DecimalNumber({
          value,
          numDecimalPlaces: 0,
          fontSize,
          color,
        }),
    );

    // Convert column labels
    const intColLabels = colLabels?.map(
      (value) =>
        new DecimalNumber({
          value,
          numDecimalPlaces: 0,
          fontSize,
          color,
        }),
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
export interface DecimalTableOptions extends Omit<
  TableOptions,
  'data' | 'rowLabels' | 'colLabels'
> {
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
    const decData = data.map((row) =>
      row.map(
        (value) =>
          new DecimalNumber({
            value,
            numDecimalPlaces,
            fontSize,
            color,
          }),
      ),
    );

    // Convert row labels
    const decRowLabels = rowLabels?.map(
      (value) =>
        new DecimalNumber({
          value,
          numDecimalPlaces,
          fontSize,
          color,
        }),
    );

    // Convert column labels
    const decColLabels = colLabels?.map(
      (value) =>
        new DecimalNumber({
          value,
          numDecimalPlaces,
          fontSize,
          color,
        }),
    );

    super({
      data: decData,
      rowLabels: decRowLabels,
      colLabels: decColLabels,
      ...rest,
    });
  }
}
