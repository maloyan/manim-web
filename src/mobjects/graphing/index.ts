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
} from "./NumberLine";

// Axes
export { Axes, type AxesOptions } from "./Axes";

// NumberPlane
export {
  type BackgroundLineStyle,
  NumberPlane,
  type NumberPlaneOptions,
} from "./NumberPlane";

// FunctionGraph
export { FunctionGraph, type FunctionGraphOptions } from "./FunctionGraph";

// ImplicitFunction
export {
  ImplicitFunction,
  type ImplicitFunctionOptions,
} from "./ImplicitFunction";

// ParametricFunction
export {
  ParametricFunction,
  type ParametricFunctionOptions,
} from "./ParametricFunction";

// Vector
export { VectorFieldVector, type VectorFieldVectorOptions } from "./Vector";

// ComplexPlane
export {
  type Complex,
  ComplexPlane,
  type ComplexPlaneOptions,
} from "./ComplexPlane";

// PolarPlane
export { PolarPlane, type PolarPlaneOptions } from "./ComplexPlane";

// BarChart
export { BarChart, type BarChartOptions } from "./BarChart";

// VectorField
export {
  ArrowVectorField,
  type ArrowVectorFieldOptions,
  type ColorFunction,
  type ContinuousMotionOptions,
  StreamLines,
  type StreamLinesOptions,
  VectorField,
  type VectorFieldBaseOptions,
  type VectorFunction,
} from "./VectorField";
