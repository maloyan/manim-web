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

/**
 * Center of the self-loop arc. The loop sits just outside the vertex, above it,
 * so the bottom of the loop touches the top of the vertex circle.
 */
function selfLoopArcCenter(
  vertexCenter: Vector3Tuple,
  vertexRadius: number,
  loopRadius: number,
): Vector3Tuple {
  return [vertexCenter[0], vertexCenter[1] + vertexRadius + loopRadius, vertexCenter[2]];
}

/**
 * Build the loop arc for a self-loop edge. The arc is a near-full circle above
 * the vertex. For a directed graph it carries an arrow tip at its end.
 */
export function createSelfLoopEdge(
  vertexCenter: Vector3Tuple,
  vertexRadius: number,
  style: EdgeStyleOptions,
  directed: boolean,
): Arc {
  const loopRadius = style.selfLoopRadius ?? DEFAULT_SELF_LOOP_RADIUS;
  const arc = new Arc({
    radius: loopRadius,
    center: selfLoopArcCenter(vertexCenter, vertexRadius, loopRadius),
    startAngle: -Math.PI * 0.75,
    angle: Math.PI * 1.5,
    color: style.color ?? WHITE,
    strokeWidth: style.strokeWidth,
  });
  if (directed) {
    arc.addTip({ tipLength: style.tipLength, tipWidth: style.tipWidth });
  }
  return arc;
}

/** Point at which to place the label of a self-loop edge (above the loop). */
export function selfLoopLabelPoint(
  vertexCenter: Vector3Tuple,
  vertexRadius: number,
  style: EdgeStyleOptions,
): Vector3Tuple {
  const loopRadius = style.selfLoopRadius ?? DEFAULT_SELF_LOOP_RADIUS;
  const buff = style.labelBuff ?? DEFAULT_EDGE_LABEL_BUFF;
  const center = selfLoopArcCenter(vertexCenter, vertexRadius, loopRadius);
  return [center[0], center[1] + loopRadius + buff, center[2]];
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
