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

// Scalar-field color maps
export { sampleColormap, valueToColor, VIRIDIS, INFERNO, COOLWARM } from './colormap';

// Marching squares (iso-contour extraction)
export { marchingSquares, type ContourSegment } from './marchingSquares';

// HeatMap (2D scalar field)
export { HeatMap, type HeatMapOptions, type ScalarField2D } from './HeatMap';

// ContourPlot (iso-contour lines)
export { ContourPlot, type ContourPlotOptions, type ContourField } from './ContourPlot';

// DomainColoring (phase portrait of a complex function f: C -> C)
export {
  DomainColoring,
  phasePortraitColor,
  type DomainColoringOptions,
  type ComplexFunction,
  type BrightnessScheme,
} from './DomainColoring';

// ParametricFunction
export { ParametricFunction, type ParametricFunctionOptions } from './ParametricFunction';

// Vector
export { VectorFieldVector, type VectorFieldVectorOptions } from './Vector';

// Fourier series / epicycle visualization
export {
  fourierCoefficients,
  reconstructSample,
  partialSum,
  orderCoefficients,
  fourierSeriesApproximation,
  type FourierCoefficient,
  type FourierOrder,
  type FourierSeriesApproximationOptions,
} from './fourier';
export {
  FourierEpicycles,
  type FourierEpicyclesOptions,
  type FourierPathInput,
  type ComplexPathFunction,
} from './FourierEpicycles';
export { FourierSeries, type FourierSeriesOptions } from './FourierSeries';

// ComplexPlane
export { ComplexPlane, type ComplexPlaneOptions, type Complex } from './ComplexPlane';

// PolarPlane
export { PolarPlane, type PolarPlaneOptions } from './ComplexPlane';

// BarChart
export { BarChart, type BarChartOptions } from './BarChart';

// Multi-series chart color helpers
export { DEFAULT_SERIES_COLORS, cycleColor, toColorList } from './chartColors';

// StackedBarChart (stacked / grouped multi-series bars)
export { StackedBarChart, type StackedBarChartOptions, type BarChartMode } from './StackedBarChart';

// AreaChart (filled areas under lines, optionally stacked)
export { AreaChart, type AreaChartOptions } from './AreaChart';

// StepChart (step line graph)
export { StepChart, type StepChartOptions, type StepMode } from './StepChart';

// CalendarHeatmap (GitHub-style day-cell grid)
export {
  CalendarHeatmap,
  GITHUB_GREENS,
  type CalendarHeatmapOptions,
  type CalendarDatum,
  type CellPosition,
} from './CalendarHeatmap';

// CandlestickChart (financial OHLC chart)
export { CandlestickChart, type CandlestickChartOptions, type OHLC } from './CandlestickChart';

// PieChart and DonutChart
export {
  PieChart,
  type PieChartOptions,
  DonutChart,
  type DonutChartOptions,
  computeSliceGeometry,
  type SliceGeometry,
  type LabelPosition,
} from './PieChart';

// Statistical plots (histogram, scatter, box, violin) and their stats helpers
export {
  mean,
  stdDev,
  quantile,
  iqr,
  histogramBins,
  kde,
  silvermanBandwidth,
  boxSummary,
  extent,
  niceAxisRange,
  type HistogramBin,
  type HistogramBinsOptions,
  type KdeOptions,
  type BoxSummary,
} from './stats';
export { Histogram, type HistogramOptions } from './Histogram';
export { ScatterPlot, type ScatterPlotOptions } from './ScatterPlot';
export { BoxPlot, type BoxPlotOptions, type PlotOrientation } from './BoxPlot';
export { ViolinPlot, type ViolinPlotOptions, type ViolinDensity } from './ViolinPlot';

// VectorField
export {
  VectorField,
  ArrowVectorField,
  StreamLines,
  stepVectorField,
  type Integrator,
  type VectorFunction,
  type ColorFunction,
  type VectorFieldBaseOptions,
  type ArrowVectorFieldOptions,
  type StreamLinesOptions,
  type ContinuousMotionOptions,
} from './VectorField';
