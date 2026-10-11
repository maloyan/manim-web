/**
 * Graphing mobjects for manimweb
 *
 * This module provides coordinate systems, function graphs, and vectors
 * for mathematical visualization.
 */

// NumberLine and UnitInterval
export {
  NumberLine,
  type NumberLineOptions,
  UnitInterval,
  type UnitIntervalOptions,
} from './NumberLine';

// Axes
export { Axes, type AxesOptions } from './Axes';

// CoordinateSystem (shared surface of Axes/NumberPlane)
export { type CoordinateSystem } from './CoordinateSystem';

// Scaling strategies (LinearBase/LogBase)
export { ScaleBase, LinearBase, LogBase, type GetCustomLabelsOptions } from './scale';

// Axes calculus toolkit option types (the toolkit is exposed via Axes methods)
export { type VerticalLinesToGraphOptions, type SecantSlopeGroupOptions } from './axes-calculus';

// NumberPlane
export { NumberPlane, type NumberPlaneOptions, type BackgroundLineStyle } from './NumberPlane';

// FunctionGraph
export { FunctionGraph, type FunctionGraphOptions } from './FunctionGraph';

// ImplicitFunction
export { ImplicitFunction, type ImplicitFunctionOptions } from './ImplicitFunction';

// ParametricFunction
export { ParametricFunction, type ParametricFunctionOptions } from './ParametricFunction';

// Vector
export { VectorFieldVector, type VectorFieldVectorOptions } from './Vector';

// ComplexPlane
export { ComplexPlane, type ComplexPlaneOptions, type Complex } from './ComplexPlane';

// PolarPlane
export { PolarPlane, type PolarPlaneOptions } from './ComplexPlane';

// BarChart
export { BarChart, type BarChartOptions } from './BarChart';

// VectorField
export {
  VectorField,
  ArrowVectorField,
  StreamLines,
  type VectorFunction,
  type ColorFunction,
  type VectorFieldBaseOptions,
  type ArrowVectorFieldOptions,
  type StreamLinesOptions,
  type ContinuousMotionOptions,
} from './VectorField';
