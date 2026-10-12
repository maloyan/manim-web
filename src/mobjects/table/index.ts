/**
 * Table mobjects for manimweb
 *
 * This module provides table layout capabilities for displaying data in grids,
 * supporting various entry types including text, math, and arbitrary mobjects.
 */

// Table - Base table class
export { Table, type TableOptions } from './Table';

// Table variants - specialized subclasses built from simple inputs
export {
  MathTable,
  MobjectTable,
  IntegerTable,
  DecimalTable,
  type MathTableOptions,
  type MobjectTableOptions,
  type IntegerTableOptions,
  type DecimalTableOptions,
} from './TableVariants';
