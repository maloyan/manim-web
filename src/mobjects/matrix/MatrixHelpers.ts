/**
 * Matrix helper functions for manimweb
 *
 * Provides utility functions for working with Matrix mobjects:
 * - getDetText: Creates determinant notation around a Matrix
 * - matrixToMobject: Converts a 2D number array to a Matrix mobject
 * - matrixToTexString: Converts a 2D number array to a LaTeX bmatrix string
 */

import * as THREE from 'three';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { MathTexImage } from '../text/MathTexImage';
import { Matrix, type MatrixOptions } from './Matrix';
import { WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options for getDetText
 */
export interface GetDetTextOptions {
  /** Optional determinant value to display after the bars */
  determinant?: number | string | null;
  /** Scale factor for the text size. Default: 1 */
  initialScaleFactor?: number;
  /** Color for the bars and determinant text. Default: WHITE */
  color?: string;
}

/**
 * Creates a VGroup with determinant notation positioned around a Matrix.
 *
 * In Python Manim, get_det_text places vertical bars around the matrix
 * content (matching the bracket height) and optionally appends "= value".
 *
 * @example
 * ```typescript
 * const matrix = new Matrix([[2, 0], [-1, 1]]);
 * const det = getDetText(matrix, { determinant: 3 });
 * scene.add(matrix);
 * scene.add(det);
 * ```
 */
export function getDetText(matrix: Matrix, options: GetDetTextOptions = {}): VGroup {
  const { determinant = null, initialScaleFactor = 1, color = WHITE } = options;

  const group = new VGroup();

  // Get the matrix content bounds (without brackets) to position bars
  const matrixCenter = matrix.getCenter();

  // Get actual matrix dimensions from Three.js bounding box
  const threeObj = matrix.getThreeObject();
  const box = new THREE.Box3().setFromObject(threeObj);
  const size = new THREE.Vector3();
  box.getSize(size);

  const matrixWidth = size.x > 0 ? size.x : matrix.numCols * 1.3;
  const matrixHeight = size.y > 0 ? size.y : matrix.numRows * 0.8;

  const halfWidth = matrixWidth / 2;
  const halfHeight = matrixHeight / 2;
  const barPadding = 0.15;

  // Create left vertical bar
  const leftBar = new VMobject();
  leftBar.color = color;
  leftBar.strokeWidth = DEFAULT_STROKE_WIDTH * initialScaleFactor;
  leftBar.fillOpacity = 0;
  const leftX = matrixCenter[0] - halfWidth - barPadding;
  leftBar.setPoints3D([
    [leftX, matrixCenter[1] + halfHeight + barPadding, 0],
    [leftX, matrixCenter[1] + halfHeight / 3, 0],
    [leftX, matrixCenter[1] - halfHeight / 3, 0],
    [leftX, matrixCenter[1] - halfHeight - barPadding, 0],
  ]);
  group.add(leftBar);

  // Create right vertical bar
  const rightBar = new VMobject();
  rightBar.color = color;
  rightBar.strokeWidth = DEFAULT_STROKE_WIDTH * initialScaleFactor;
  rightBar.fillOpacity = 0;
  const rightX = matrixCenter[0] + halfWidth + barPadding;
  rightBar.setPoints3D([
    [rightX, matrixCenter[1] + halfHeight + barPadding, 0],
    [rightX, matrixCenter[1] + halfHeight / 3, 0],
    [rightX, matrixCenter[1] - halfHeight / 3, 0],
    [rightX, matrixCenter[1] - halfHeight - barPadding, 0],
  ]);
  group.add(rightBar);

  // Add "= determinant" text if provided
  if (determinant !== null) {
    const detText = new MathTexImage({
      latex: `= ${determinant}`,
      color: color,
      fontSize: Math.round(48 * initialScaleFactor),
    });
    detText.moveTo([rightX + 1.0, matrixCenter[1], matrixCenter[2]]);
    group.add(detText);
  }

  return group;
}

/**
 * Converts a 2D number array to a Matrix mobject.
 *
 * @example
 * ```typescript
 * const matrix = matrixToMobject([[1, 2], [3, 4]]);
 * ```
 */
export function matrixToMobject(data: number[][], options?: MatrixOptions): Matrix {
  return new Matrix(data, options);
}

/**
 * Converts a 2D array of numbers or strings to a LaTeX bmatrix string.
 *
 * @example
 * ```typescript
 * matrixToTexString([[1, 2], [3, 4]])
 * // => "\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}"
 * ```
 */
export function matrixToTexString(data: (string | number)[][]): string {
  const rows = data.map((row) => row.join(' & '));
  return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
}
