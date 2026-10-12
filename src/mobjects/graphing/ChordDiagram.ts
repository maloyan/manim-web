import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { AnnularSector } from '../geometry/AnnularSector';
import { Text } from '../text/Text';
import {
  BLUE,
  GREEN,
  RED,
  YELLOW,
  ORANGE,
  PURPLE,
  TEAL,
  GOLD,
  WHITE,
} from '../../constants/colors';
import {
  chordMatrixFromFlows,
  computeChordLayout,
  type ChordFlow,
  type ChordGroupArc,
  type ChordLayout,
  type ChordRibbonSpan,
} from './chordLayout';

/** Default color cycle for chord groups. */
const DEFAULT_CHORD_COLORS = [BLUE, GREEN, RED, YELLOW, ORANGE, PURPLE, TEAL, GOLD];

/** Points on a circle, for sampling arcs as cubic beziers. */
function polar(radius: number, angle: number): number[] {
  return [radius * Math.cos(angle), radius * Math.sin(angle), 0];
}

/**
 * Append cubic-bezier segments tracing an arc of `radius` from `startAngle` to
 * `endAngle` onto `points`. The last point already in `points` must be the arc
 * start. Each segment adds two control points and one anchor.
 */
function appendArc(points: number[][], radius: number, startAngle: number, endAngle: number): void {
  const sweep = endAngle - startAngle;
  const segments = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 4)));
  const segmentAngle = sweep / segments;
  const kappa = (4 / 3) * Math.tan(segmentAngle / 4);

  for (let i = 0; i < segments; i++) {
    const theta1 = startAngle + i * segmentAngle;
    const theta2 = startAngle + (i + 1) * segmentAngle;
    const x0 = radius * Math.cos(theta1);
    const y0 = radius * Math.sin(theta1);
    const x3 = radius * Math.cos(theta2);
    const y3 = radius * Math.sin(theta2);
    points.push([
      x0 - kappa * radius * Math.sin(theta1),
      y0 + kappa * radius * Math.cos(theta1),
      0,
    ]);
    points.push([
      x3 + kappa * radius * Math.sin(theta2),
      y3 - kappa * radius * Math.cos(theta2),
      0,
    ]);
    points.push([x3, y3, 0]);
  }
}

/** Build the closed ribbon control points for a chord at the given radius. */
function buildChordPoints(ribbon: ChordRibbonSpan, radius: number): number[][] {
  const { sourceStart, sourceEnd, targetStart, targetEnd } = ribbon;
  const points: number[][] = [];
  const center = [0, 0, 0];

  // Start anchor at the source span start.
  points.push(polar(radius, sourceStart));
  // Arc along the source span.
  appendArc(points, radius, sourceStart, sourceEnd);
  // Bezier across the circle to the target span start (bows through the center).
  points.push([...center], [...center], polar(radius, targetStart));
  // Arc along the target span.
  appendArc(points, radius, targetStart, targetEnd);
  // Bezier back to the source span start, closing the ribbon.
  points.push([...center], [...center], polar(radius, sourceStart));

  return points;
}

/**
 * A single group arc of a {@link ChordDiagram}.
 */
export class ChordArc extends AnnularSector {
  /** Group index. */
  readonly groupIndex: number;
  /** Total flow of the group. */
  readonly total: number;

  constructor(
    options: ConstructorParameters<typeof AnnularSector>[0] & {
      groupIndex: number;
      total: number;
    },
  ) {
    const { groupIndex, total, ...sectorOptions } = options;
    super(sectorOptions);
    this.groupIndex = groupIndex;
    this.total = total;
  }
}

/**
 * A single flow ribbon of a {@link ChordDiagram}.
 *
 * The ribbon is a closed filled VMobject: an arc along the source span, a
 * bezier through the center to the target span, an arc along it, and a bezier
 * back. The source and target span angles are proportional to the flow values.
 */
export class ChordRibbon extends VMobject {
  /** Source group index. */
  readonly source: number;
  /** Target group index. */
  readonly target: number;
  /** Flow on the source side. */
  readonly sourceValue: number;
  /** Flow on the target side. */
  readonly targetValue: number;

  private readonly _sourceSpanAngle: number;
  private readonly _targetSpanAngle: number;

  constructor(span: ChordRibbonSpan, radius: number, color: string, fillOpacity: number) {
    super();
    this.source = span.source;
    this.target = span.target;
    this.sourceValue = span.sourceValue;
    this.targetValue = span.targetValue;
    this._sourceSpanAngle = span.sourceEnd - span.sourceStart;
    this._targetSpanAngle = span.targetEnd - span.targetStart;

    this.color = color;
    this.fillColor = color;
    this.fillOpacity = fillOpacity;
    this.strokeWidth = 0;

    this.setPoints3D(buildChordPoints(span, radius));
  }

  /** Angular width of the source span, proportional to {@link sourceValue}. */
  getSourceSpanAngle(): number {
    return this._sourceSpanAngle;
  }

  /** Angular width of the target span, proportional to {@link targetValue}. */
  getTargetSpanAngle(): number {
    return this._targetSpanAngle;
  }
}

/**
 * Options for {@link ChordDiagram}.
 */
export interface ChordDiagramOptions {
  /** Square flow matrix. `matrix[i][j]` is the flow from group i to group j. */
  matrix?: number[][];
  /** Link-list input, used with `groupCount` when `matrix` is omitted. */
  flows?: ChordFlow[];
  /** Number of groups, required with `flows`. */
  groupCount?: number;
  /** Group labels, by index. Default: []. */
  labels?: string[];
  /** Inner radius of the ring (ribbons are drawn inside it). Default: 2.5. */
  radius?: number;
  /** Thickness of the group ring. Default: 0.25. */
  ringWidth?: number;
  /** Angular gap between groups, in radians. Default: 0.05. */
  gap?: number;
  /** Angle of the first group's start edge, in radians. Default: Math.PI / 2. */
  startAngle?: number;
  /** Group colors. Single color applies to all, array cycles. Default: Manim palette. */
  colors?: string | string[];
  /** Fill opacity of the group arcs. Default: 1. */
  arcOpacity?: number;
  /** Fill opacity of the ribbons. Default: 0.6. */
  ribbonOpacity?: number;
  /** Whether to draw group labels. Default: true when labels are given. */
  showLabels?: boolean;
  /** Font size for group labels. Default: 20. */
  labelFontSize?: number;
  /** Gap between the ring and a label. Default: 0.3. */
  labelBuff?: number;
}

/**
 * ChordDiagram - arcs around a circle linked by proportional ribbons.
 *
 * Each group becomes an {@link ChordArc} whose angle is proportional to the
 * group's total flow. Each non-zero flow pair becomes a {@link ChordRibbon}
 * whose span angles are proportional to the flow values. Empty, single-group,
 * and zero-value inputs produce no error.
 *
 * @example
 * ```typescript
 * const chord = new ChordDiagram({
 *   matrix: [
 *     [0, 3, 1],
 *     [3, 0, 2],
 *     [1, 2, 0],
 *   ],
 *   labels: ['A', 'B', 'C'],
 * });
 * chord.getArc(0); // the first group arc
 * ```
 */
export class ChordDiagram extends VGroup {
  /** The group arcs. */
  arcs: VGroup;
  /** The flow ribbons. */
  chords: VGroup;
  /** The group labels. */
  labelGroup: VGroup;

  protected _options: ChordDiagramOptions;
  protected _layout: ChordLayout;
  protected _arcs: ChordArc[] = [];
  protected _chords: ChordRibbon[] = [];

  constructor(options: ChordDiagramOptions) {
    super();

    const {
      matrix,
      flows = [],
      groupCount = 0,
      labels = [],
      radius = 2.5,
      ringWidth = 0.25,
      gap = 0.05,
      startAngle = Math.PI / 2,
      colors = DEFAULT_CHORD_COLORS,
      arcOpacity = 1,
      ribbonOpacity = 0.6,
      showLabels = labels.length > 0,
      labelFontSize = 20,
      labelBuff = 0.3,
    } = options;

    this._options = options;

    const square = matrix ?? chordMatrixFromFlows(flows, groupCount);
    this._layout = computeChordLayout(square, { gap, startAngle });

    const palette = Array.isArray(colors) ? colors : [colors];
    const colorFor = (index: number): string => palette[index % palette.length];

    this.arcs = new VGroup();
    this.chords = new VGroup();
    this.labelGroup = new VGroup();

    // Ribbons draw first so the arcs sit on top of them.
    for (const span of this._layout.ribbons) {
      const ribbon = new ChordRibbon(span, radius, colorFor(span.source), ribbonOpacity);
      this._chords.push(ribbon);
      this.chords.add(ribbon);
    }

    for (const group of this._layout.groups) {
      const arc = new ChordArc({
        groupIndex: group.index,
        total: group.value,
        innerRadius: radius,
        outerRadius: radius + ringWidth,
        startAngle: group.startAngle,
        angle: group.endAngle - group.startAngle,
        color: colorFor(group.index),
        fillOpacity: arcOpacity,
        strokeWidth: 0,
      });
      this._arcs.push(arc);
      this.arcs.add(arc);
    }

    this.add(this.chords);
    this.add(this.arcs);

    if (showLabels) {
      this._buildLabels(this._layout.groups, labels, radius + ringWidth + labelBuff, labelFontSize);
      this.add(this.labelGroup);
    }
  }

  /** Build a label for each group at its mid-angle, outside the ring. */
  protected _buildLabels(
    groups: ChordGroupArc[],
    labels: string[],
    labelRadius: number,
    fontSize: number,
  ): void {
    this.labelGroup = new VGroup();
    for (const group of groups) {
      const name = labels[group.index];
      if (name === undefined || name.length === 0) continue;
      const midAngle = (group.startAngle + group.endAngle) / 2;
      const label = new Text({ text: name, fontSize, color: WHITE });
      label.moveTo([labelRadius * Math.cos(midAngle), labelRadius * Math.sin(midAngle), 0]);
      this.labelGroup.add(label);
    }
  }

  /** All group arcs, in group order. */
  getArcs(): ChordArc[] {
    return [...this._arcs];
  }

  /** The arc for a group index, or undefined when out of range. */
  getArc(index: number): ChordArc | undefined {
    return this._arcs[index];
  }

  /** All flow ribbons, in layout order. */
  getChords(): ChordRibbon[] {
    return [...this._chords];
  }

  /** The ribbon at the given index, or undefined when out of range. */
  getChord(index: number): ChordRibbon | undefined {
    return this._chords[index];
  }

  /** The computed layout (arcs and ribbon spans). */
  getLayout(): ChordLayout {
    return {
      total: this._layout.total,
      groups: this._layout.groups.map((group) => ({ ...group })),
      ribbons: this._layout.ribbons.map((ribbon) => ({ ...ribbon })),
    };
  }

  override copy(): ChordDiagram {
    const clone = new ChordDiagram(this._options);
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
