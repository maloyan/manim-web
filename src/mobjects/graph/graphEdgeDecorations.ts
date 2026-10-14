/**
 * Edge decorations for graphs: weight/label text and self-loop arcs.
 *
 * These helpers keep the geometry math and mobject construction for weighted
 * edge labels and self-loop edges out of `GenericGraph`, so the core class
 * stays focused on graph structure. All functions are pure except for the
 * mobject factories, which build a fresh mobject per call.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { Arc } from '../geometry/Arc';
import { Text } from '../text/Text';
import { WHITE } from '../../constants';
import type { EdgeConfig, EdgeStyleOptions } from './graphTypes';

/** Default self-loop arc radius when `style.selfLoopRadius` is unset. */
const DEFAULT_SELF_LOOP_RADIUS = 0.3;
/** Default edge-label font size when `style.labelFontSize` is unset. */
const DEFAULT_EDGE_LABEL_FONT_SIZE = 24;
/** Default gap between a straight edge and its label. */
export const DEFAULT_EDGE_LABEL_BUFF = 0.2;

/**
 * Return the text to render on an edge, or null when there is nothing to show.
 *
 * An explicit `label` wins. Otherwise a numeric `weight` renders as its string.
 */
export function edgeLabelString(cfg?: EdgeConfig): string | null {
  if (!cfg) {
    return null;
  }
  if (cfg.label !== undefined) {
    return cfg.label;
  }
  if (cfg.weight !== undefined) {
    return String(cfg.weight);
  }
  return null;
}

/** Fraction of a full circle the loop arc spans. The remaining gap faces the
 * vertex so the two open ends sit next to it, as in a hand-drawn self-loop. */
const SELF_LOOP_SWEEP = Math.PI * 1.5;

/**
 * Return a unit outward direction for a self-loop. Falls back to straight up
 * (`[0, 1, 0]`) when the given direction is zero-length (a lone vertex), so a
 * single-vertex graph keeps its loop above the vertex.
 */
function unitDirection(direction?: Vector3Tuple): Vector3Tuple {
  if (!direction) {
    return [0, 1, 0];
  }
  const len = Math.hypot(direction[0], direction[1]);
  if (len < 1e-6) {
    return [0, 1, 0];
  }
  return [direction[0] / len, direction[1] / len, 0];
}

/**
 * Center of the self-loop arc. The loop sits just outside the vertex along the
 * outward `direction`, so the near side of the loop touches the vertex circle.
 */
function selfLoopArcCenter(
  vertexCenter: Vector3Tuple,
  vertexRadius: number,
  loopRadius: number,
  dir: Vector3Tuple,
): Vector3Tuple {
  const offset = vertexRadius + loopRadius;
  return [vertexCenter[0] + dir[0] * offset, vertexCenter[1] + dir[1] * offset, vertexCenter[2]];
}

/**
 * Build the loop arc for a self-loop edge. The arc is a near-full circle that
 * bulges outward along `direction` (away from the graph center) so it never
 * crosses the incident edges. For a directed graph it carries an arrow tip.
 */
export function createSelfLoopEdge(
  vertexCenter: Vector3Tuple,
  vertexRadius: number,
  style: EdgeStyleOptions,
  directed: boolean,
  direction?: Vector3Tuple,
): Arc {
  const loopRadius = style.selfLoopRadius ?? DEFAULT_SELF_LOOP_RADIUS;
  const dir = unitDirection(direction);
  const theta = Math.atan2(dir[1], dir[0]);
  // The gap in the arc faces the vertex (inward, theta + PI). Start one half-gap
  // past that inward point and sweep the long way around.
  const gapHalf = (Math.PI * 2 - SELF_LOOP_SWEEP) / 2;
  const startAngle = theta + Math.PI + gapHalf;
  const arc = new Arc({
    radius: loopRadius,
    center: selfLoopArcCenter(vertexCenter, vertexRadius, loopRadius, dir),
    startAngle,
    angle: SELF_LOOP_SWEEP,
    color: style.color ?? WHITE,
    strokeWidth: style.strokeWidth,
  });
  if (directed) {
    arc.addTip({ tipLength: style.tipLength, tipWidth: style.tipWidth });
  }
  return arc;
}

/** Point at which to place the self-loop label: just beyond the loop, outward. */
export function selfLoopLabelPoint(
  vertexCenter: Vector3Tuple,
  vertexRadius: number,
  style: EdgeStyleOptions,
  direction?: Vector3Tuple,
): Vector3Tuple {
  const loopRadius = style.selfLoopRadius ?? DEFAULT_SELF_LOOP_RADIUS;
  const buff = style.labelBuff ?? DEFAULT_EDGE_LABEL_BUFF;
  const dir = unitDirection(direction);
  const center = selfLoopArcCenter(vertexCenter, vertexRadius, loopRadius, dir);
  const out = loopRadius + buff;
  return [center[0] + dir[0] * out, center[1] + dir[1] * out, center[2]];
}

/**
 * Point at which to place the label of a straight edge: the midpoint, pushed
 * perpendicular to the edge by `buff` so the text clears the line.
 */
export function straightEdgeLabelPoint(
  start: Vector3Tuple,
  end: Vector3Tuple,
  buff: number,
): Vector3Tuple {
  const mid: Vector3Tuple = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    return [mid[0], mid[1] + buff, mid[2]];
  }
  const perpX = -dy / length;
  const perpY = dx / length;
  return [mid[0] + perpX * buff, mid[1] + perpY * buff, mid[2]];
}

/** Build the text mobject for an edge label (a weight or an explicit label). */
export function createEdgeLabel(text: string, style: EdgeStyleOptions): Text {
  return new Text({
    text,
    fontSize: style.labelFontSize ?? DEFAULT_EDGE_LABEL_FONT_SIZE,
    color: style.labelColor ?? style.color ?? WHITE,
  });
}
