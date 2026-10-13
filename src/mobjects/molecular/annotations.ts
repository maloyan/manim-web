/**
 * Binding-story annotations for a 3D molecule scene.
 *
 * These builders make the binding interaction legible: dashed lines for
 * hydrogen bonds and contacts, a measured line with a distance label, and a
 * residue name tag. Each returns a plain mobject (a {@link Group} of
 * {@link Line3D} segments, or a {@link Text}), never an animation, so the caller
 * places it and plays whatever it wants.
 *
 * Dashed lines are built as a series of short {@link Line3D} segments with gaps,
 * not a flat 2D DashedLine, so the dashes keep a crisp pixel width and a correct
 * depth between two arbitrary 3D atoms.
 *
 * Labels use the 2D {@link Text} mobject. Text faces its local +Z, so to make a
 * label face the camera the caller registers it with
 * `scene.addFixedOrientationMobjects(label)`. {@link residueLabel} returns the
 * Text directly; {@link distanceLabel} returns a Group whose last child is the
 * Text (its first child is the measured line).
 *
 * @example
 * ```typescript
 * const hb = hydrogenBond(donor, acceptor);
 * const d = distanceLabel(donor, acceptor, { decimals: 1 });
 * scene.add(hb, d);
 * scene.addFixedOrientationMobjects(d.children[d.children.length - 1]); // the label
 * ```
 */

import { Group } from '../../core/Group';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Line3D } from '../three-d/Line3D';
import { Text } from '../text/Text';

/** Options shared by the dashed-line annotations. */
export interface DashedAnnotationOptions {
  /** The dash color. */
  color?: string;
  /** The length of each dash. Default: 0.2. */
  dashLength?: number;
  /** The gap between dashes. Default: 0.15. */
  gapLength?: number;
  /** The dash line width in pixels. Default: 3. */
  lineWidth?: number;
  /** The dash opacity from 0 to 1. Default: 1. */
  opacity?: number;
}

/** Options for {@link hydrogenBond}. */
export type HydrogenBondOptions = DashedAnnotationOptions;

/** Options for {@link contact}. */
export type ContactOptions = DashedAnnotationOptions;

/** Options for {@link distanceLabel}. */
export interface DistanceLabelOptions {
  /** The line and label color. Default: `'#ffffff'`. */
  color?: string;
  /** Override text; when set, replaces the computed distance. */
  label?: string;
  /** Decimal places in the computed distance. Default: 1. */
  decimals?: number;
  /** The distance unit appended to the computed distance. Default: `'Å'`. */
  unit?: string;
  /** The label font size. Default: 28. */
  fontSize?: number;
  /** The measured line width in pixels. Default: 2. */
  lineWidth?: number;
}

/** Options for {@link residueLabel}. */
export interface ResidueLabelOptions {
  /** The text color. Default: `'#ffffff'`. */
  color?: string;
  /** The font size. Default: 28. */
  fontSize?: number;
}

/** The distance between two points. */
function distanceBetween(from: Vector3Tuple, to: Vector3Tuple): number {
  return Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
}

/**
 * Build a dashed line between two 3D points as a {@link Group} of short
 * {@link Line3D} segments. An empty group is returned for a zero-length span.
 */
function buildDashedLine(
  from: Vector3Tuple,
  to: Vector3Tuple,
  color: string,
  dashLength: number,
  gapLength: number,
  lineWidth: number,
  opacity: number,
): Group {
  const group = new Group();
  const length = distanceBetween(from, to);
  const cycle = dashLength + gapLength;
  if (length < 1e-9 || cycle < 1e-9 || dashLength <= 0) {
    return group;
  }
  const dir: Vector3Tuple = [
    (to[0] - from[0]) / length,
    (to[1] - from[1]) / length,
    (to[2] - from[2]) / length,
  ];
  for (let start = 0; start < length - 1e-9; start += cycle) {
    const end = Math.min(start + dashLength, length);
    group.add(
      new Line3D({
        start: [from[0] + dir[0] * start, from[1] + dir[1] * start, from[2] + dir[2] * start],
        end: [from[0] + dir[0] * end, from[1] + dir[1] * end, from[2] + dir[2] * end],
        color,
        lineWidth,
        opacity,
      }),
    );
  }
  return group;
}

/**
 * A hydrogen bond as a dashed line between a donor and an acceptor atom.
 *
 * @param from - The first atom position.
 * @param to - The second atom position.
 * @param options - Dash styling.
 * @returns A {@link Group} of {@link Line3D} dash segments.
 */
export function hydrogenBond(
  from: Vector3Tuple,
  to: Vector3Tuple,
  options: HydrogenBondOptions = {},
): Group {
  return buildDashedLine(
    from,
    to,
    options.color ?? '#9fe2bf',
    options.dashLength ?? 0.2,
    options.gapLength ?? 0.15,
    options.lineWidth ?? 3,
    options.opacity ?? 1,
  );
}

/**
 * A non-bonded contact as a thin dashed line. Same shape as
 * {@link hydrogenBond}, with a warmer default color and shorter dashes.
 *
 * @param from - The first atom position.
 * @param to - The second atom position.
 * @param options - Dash styling.
 * @returns A {@link Group} of {@link Line3D} dash segments.
 */
export function contact(from: Vector3Tuple, to: Vector3Tuple, options: ContactOptions = {}): Group {
  return buildDashedLine(
    from,
    to,
    options.color ?? '#ffd27f',
    options.dashLength ?? 0.12,
    options.gapLength ?? 0.12,
    options.lineWidth ?? 2,
    options.opacity ?? 1,
  );
}

/**
 * A measured line between two points plus a billboarded distance label.
 *
 * The label text is the computed distance `|to - from|`, formatted with
 * `decimals` places and the `unit`, unless `label` overrides it. The returned
 * group's first child is the line and its last child is the {@link Text} label,
 * which the caller billboards with `scene.addFixedOrientationMobjects(...)`.
 *
 * @param from - The first point.
 * @param to - The second point.
 * @param options - Label and line styling.
 * @returns A {@link Group} of `[line, label]`.
 */
export function distanceLabel(
  from: Vector3Tuple,
  to: Vector3Tuple,
  options: DistanceLabelOptions = {},
): Group {
  const color = options.color ?? '#ffffff';
  const decimals = options.decimals ?? 1;
  const unit = options.unit ?? 'Å';
  const fontSize = options.fontSize ?? 28;
  const lineWidth = options.lineWidth ?? 2;

  const text = options.label ?? `${distanceBetween(from, to).toFixed(decimals)} ${unit}`;

  const group = new Group();
  group.add(new Line3D({ start: from, end: to, color, lineWidth }));

  const label = new Text({ text, fontSize, color });
  label.moveTo([(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]);
  group.add(label);

  return group;
}

/**
 * A billboarded residue name tag at a position.
 *
 * The caller billboards it with `scene.addFixedOrientationMobjects(...)`.
 *
 * @param position - The label position `[x, y, z]`.
 * @param text - The label text (e.g. a residue name).
 * @param options - Text styling.
 * @returns A {@link Text} mobject.
 */
export function residueLabel(
  position: Vector3Tuple,
  text: string,
  options: ResidueLabelOptions = {},
): Mobject {
  const label = new Text({
    text,
    fontSize: options.fontSize ?? 28,
    color: options.color ?? '#ffffff',
  });
  label.moveTo(position);
  return label;
}
