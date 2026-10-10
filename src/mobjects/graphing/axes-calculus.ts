/**
 * Tangent, secant, and derivative toolkit for Axes.
 *
 * These are pure helper functions that mirror the Manim CE CoordinateSystem
 * calculus API (slope_of_tangent, angle_of_tangent, get_secant_slope_group,
 * get_vertical_lines_to_graph). The Axes class delegates thin public methods to
 * them, which keeps Axes.ts small while sharing one implementation.
 */
import { Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { FunctionGraph } from './FunctionGraph';
import { Line, LineOptions } from '../../mobjects/geometry/Line';
import { DashedLine } from '../../mobjects/geometry/DashedLine';
import { MathTexImage } from '../../mobjects/text/MathTexImage';
import { WHITE, YELLOW, GREEN } from '../../constants';

/** Default finite-difference step used for tangent estimates (matches CE's small dx). */
const DEFAULT_TANGENT_DX = 0.001;

/**
 * The subset of Axes that the calculus toolkit needs. Declared here to avoid a
 * circular import with Axes.ts.
 */
export interface CalculusAxes {
  coordsToPoint(x: number, y: number): Vector3Tuple;
  getXRange(): [number, number, number];
  i2gp(x: number, graph: FunctionGraph): Vector3Tuple;
  getVerticalLine(
    point: Vector3Tuple,
    options?: { color?: string; strokeWidth?: number; lineFunc?: typeof Line | typeof DashedLine },
  ): VMobject;
}

/** Options for getVerticalLinesToGraph. */
export interface VerticalLinesToGraphOptions extends LineOptions {
  /** X interval [start, end] to span. Default: the full axes x range. */
  xRange?: [number, number];
  /** Number of lines, spaced evenly across the interval. Default: 20. */
  numLines?: number;
}

/** Options for getSecantSlopeGroup. */
export interface SecantSlopeGroupOptions {
  /** Finite-difference step. Default: (xMax - xMin) / 10 (matches CE). */
  dx?: number;
  /** Color of the horizontal dx line. Default: YELLOW. */
  dxLineColor?: string;
  /** Color of the vertical dy line. Default: same as the dx line. */
  dyLineColor?: string;
  /** LaTeX label for the dx line. Omit to add no label. */
  dxLabel?: string;
  /** LaTeX label for the dy line. Omit to add no label. */
  dyLabel?: string;
  /** Color of the secant line. Default: GREEN. */
  secantLineColor?: string;
  /** Length to which the secant line is scaled about its center. Default: 10. */
  secantLineLength?: number;
}

/**
 * Slope of the tangent to a graph at x, in coordinate (graph) space.
 *
 * Uses the forward finite difference (f(x + dx) - f(x)) / dx. The result is
 * exact for a linear function and independent of axis unit scaling.
 */
export function slopeOfTangent(
  x: number,
  graph: FunctionGraph,
  dx: number = DEFAULT_TANGENT_DX,
): number {
  const f = graph.getFunction();
  return (f(x + dx) - f(x)) / dx;
}

/**
 * Angle of the tangent to a graph at x, in points (visual) space.
 *
 * The run and rise are measured as the difference of two points from
 * coordsToPoint, so non-uniform x/y unit scaling is respected. Returns
 * atan2(dyPoints, dxPoints) in radians.
 */
export function angleOfTangent(
  axes: CalculusAxes,
  x: number,
  graph: FunctionGraph,
  dx: number = DEFAULT_TANGENT_DX,
): number {
  const f = graph.getFunction();
  const p0 = axes.coordsToPoint(x, f(x));
  const p1 = axes.coordsToPoint(x + dx, f(x + dx));
  return Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
}

/**
 * Vertical lines from the x-axis up to the graph, sampled across an interval.
 *
 * Returns a VGroup of exactly numLines lines, one per evenly spaced x value.
 * Each line's graph-side endpoint is graph.getPointFromX(x).
 */
export function getVerticalLinesToGraph(
  axes: CalculusAxes,
  graph: FunctionGraph,
  options: VerticalLinesToGraphOptions = {},
): VGroup {
  const { xRange, numLines = 20, color, strokeWidth } = options;
  const [axisMin, axisMax] = axes.getXRange();
  const [xStart, xEnd] = xRange ?? [axisMin, axisMax];

  const group = new VGroup();
  for (const x of linspace(xStart, xEnd, numLines)) {
    const point = axes.i2gp(x, graph);
    group.add(axes.getVerticalLine(point, { color, strokeWidth }));
  }
  return group;
}

/**
 * Group illustrating the secant slope at x over a step dx.
 *
 * Children, in order (matching CE so always-redraw / ValueTracker updaters keep
 * a stable child layout):
 *   0: dx line (horizontal, from (x, f(x)) to (x + dx, f(x)))
 *   1: dy line (vertical, from (x + dx, f(x)) to (x + dx, f(x + dx)))
 *   2: labels VGroup (holds the optional dx/dy labels; empty when none)
 *   3: secant line through (x, f(x)) and (x + dx, f(x + dx)), scaled to
 *      secantLineLength about its center
 */
export function getSecantSlopeGroup(
  axes: CalculusAxes,
  x: number,
  graph: FunctionGraph,
  options: SecantSlopeGroupOptions = {},
): VGroup {
  const [xMin, xMax] = axes.getXRange();
  const {
    dx = (xMax - xMin) / 10,
    dxLineColor = YELLOW,
    dyLineColor,
    dxLabel,
    dyLabel,
    secantLineColor = GREEN,
    secantLineLength = 10,
  } = options;

  const f = graph.getFunction();
  const p1 = axes.coordsToPoint(x, f(x));
  const p2 = axes.coordsToPoint(x + dx, f(x + dx));
  const interim: Vector3Tuple = [p2[0], p1[1], 0];
  const dyColor = dyLineColor ?? dxLineColor;

  const group = new VGroup();
  const dxLine = new Line({ start: p1, end: interim, color: dxLineColor });
  const dyLine = new Line({ start: interim, end: p2, color: dyColor });
  group.add(dxLine, dyLine);

  const labels = new VGroup();
  if (dxLabel !== undefined) {
    labels.add(makeLabel(dxLabel, dxLine.getMidpoint(), [0, -0.3, 0], dxLineColor));
  }
  if (dyLabel !== undefined) {
    labels.add(makeLabel(dyLabel, dyLine.getMidpoint(), [0.3, 0, 0], dyColor));
  }
  group.add(labels);

  const secant = new Line({ start: p1, end: p2, color: secantLineColor });
  const length = secant.getLength();
  if (length > 0) {
    secant.scale(secantLineLength / length);
  }
  group.add(secant);

  return group;
}

/** Build a LaTeX label at an anchor point, offset by a small direction vector. */
function makeLabel(
  latex: string,
  anchor: Vector3Tuple,
  offset: Vector3Tuple,
  color: string = WHITE,
): MathTexImage {
  const label = new MathTexImage({ latex, fontSize: 32, color });
  label.position.set(anchor[0] + offset[0], anchor[1] + offset[1], anchor[2] + offset[2]);
  return label;
}

/** Evenly spaced values from start to end, inclusive. Returns [start] when n <= 1. */
function linspace(start: number, end: number, n: number): number[] {
  if (n <= 1) return [start];
  const step = (end - start) / (n - 1);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(start + i * step);
  return out;
}
