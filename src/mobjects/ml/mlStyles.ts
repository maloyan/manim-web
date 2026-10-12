/**
 * Shared style options and defaults for the neural-network diagram toolkit.
 *
 * These interfaces describe how nodes (circles, feature maps, grids) and the
 * connection lines between layers look. Every field is optional; the layer and
 * network classes fill the gaps from the DEFAULT_* records below.
 */

import { BLUE, WHITE, GRAY } from '../../constants';

/** Visual style for a single node (a circle, a feature-map square, a grid). */
export interface NodeStyleOptions {
  /** Stroke color as a CSS color string. */
  color?: string;
  /** Fill color as a CSS color string. Defaults to `color`. */
  fillColor?: string;
  /** Fill opacity from 0 to 1. */
  fillOpacity?: number;
  /** Stroke width in pixels. */
  strokeWidth?: number;
}

/** Visual style for a connection line (an edge) between two nodes. */
export interface ConnectionStyleOptions {
  /** Stroke color as a CSS color string. */
  color?: string;
  /** Stroke width in pixels. */
  strokeWidth?: number;
  /** Resting stroke opacity from 0 to 1, before a forward pass activates it. */
  opacity?: number;
}

/** Fully resolved node style (no optional fields). */
export type ResolvedNodeStyle = Required<NodeStyleOptions>;

/** Fully resolved edge style (no optional fields). */
export type ResolvedEdgeStyle = Required<ConnectionStyleOptions>;

/** Default node style: a blue outline with a faint blue fill. */
export const DEFAULT_NODE_STYLE: ResolvedNodeStyle = {
  color: BLUE,
  fillColor: BLUE,
  fillOpacity: 0.3,
  strokeWidth: 2,
};

/** Default edge style: a thin grey line at a low resting opacity. */
export const DEFAULT_EDGE_STYLE: ResolvedEdgeStyle = {
  color: GRAY,
  strokeWidth: 1.5,
  opacity: 0.35,
};

/** Default color a connection takes while a signal flows through it. */
export const DEFAULT_ACTIVATION_COLOR = WHITE;

/**
 * Merge a partial node style over a resolved base style.
 * @param base - The resolved style to start from.
 * @param override - The partial style whose set fields win.
 * @returns A new resolved node style.
 */
export function resolveNodeStyle(
  base: ResolvedNodeStyle,
  override?: NodeStyleOptions,
): ResolvedNodeStyle {
  return { ...base, ...stripUndefined(override) };
}

/**
 * Merge a partial edge style over a resolved base style.
 * @param base - The resolved style to start from.
 * @param override - The partial style whose set fields win.
 * @returns A new resolved edge style.
 */
export function resolveEdgeStyle(
  base: ResolvedEdgeStyle,
  override?: ConnectionStyleOptions,
): ResolvedEdgeStyle {
  return { ...base, ...stripUndefined(override) };
}

/**
 * Drop keys whose value is undefined so a spread does not overwrite a default
 * with undefined.
 * @param obj - The partial record to clean.
 * @returns A copy of `obj` without undefined-valued keys.
 */
function stripUndefined<T extends object>(obj?: T): Partial<T> {
  if (!obj) return {};
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
