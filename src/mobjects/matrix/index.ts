/**
 * Matrix mobjects for manimweb
 *
 * This module provides matrix display capabilities with configurable brackets,
 * supporting integer, decimal, and arbitrary mobject entries.
 */

// Matrix and variants
export {
  type BracketType,
  DecimalMatrix,
  type DecimalMatrixOptions,
  type ElementAlignment,
  IntegerMatrix,
  type IntegerMatrixOptions,
  Matrix,
  type MatrixOptions,
  MobjectMatrix,
  type MobjectMatrixOptions,
} from "./Matrix";

// Helper functions
export {
  getDetText,
  type GetDetTextOptions,
  matrixToMobject,
  matrixToTexString,
} from "./MatrixHelpers";
