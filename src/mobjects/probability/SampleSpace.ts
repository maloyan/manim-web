import { VMobject } from '../../core/VMobject';
import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { Rectangle } from '../geometry/Rectangle';
import { Line } from '../geometry/Line';
import { Text } from '../text/Text';
import { Brace } from '../svg/Brace';
import {
  BLUE,
  GREEN,
  YELLOW,
  RED,
  PURPLE,
  TEAL,
  GOLD,
  WHITE,
  GRAY,
  DEFAULT_STROKE_WIDTH,
} from '../../constants';

/**
 * Default color cycle used when no colors are specified for divisions.
 */
const DEFAULT_PARTITION_COLORS = [BLUE, GREEN, YELLOW, RED, PURPLE, TEAL, GOLD];

/**
 * Options for creating a SampleSpace
 */
export interface SampleSpaceOptions {
  /** Width of the sample space rectangle. Default: 3 */
  width?: number;
  /** Height of the sample space rectangle. Default: 3 */
  height?: number;
  /** Stroke color for the outline. Default: WHITE */
  color?: string;
  /** Fill opacity for partitions. Default: 1 */
  fillOpacity?: number;
  /** Stroke width for the outline. Default: 2 */
  strokeWidth?: number;
  /** Center position. Default: [0, 0, 0] */
  center?: Vector3Tuple;
  /** Default font size for labels. Default: 24 */
  fontSize?: number;
}

/**
 * Represents a single partition (sub-rectangle) within the sample space.
 */
export interface Partition {
  /** The rectangle mobject for this partition */
  rectangle: Rectangle;
  /** The proportion (0-1) of the parent dimension this partition occupies */
  proportion: number;
  /** Optional label for this partition */
  label?: Text;
}

/**
 * Options for dividing the sample space
 */
export interface DivideOptions {
  /** Colors for each partition. If not provided, uses default cycle. */
  colors?: string[];
  /** Fill opacity for partitions. Default: 1 */
  fillOpacity?: number;
  /** Labels for each partition (probability strings like "0.3", "P(A)", etc.) */
  labels?: string[];
  /** Font size for labels. Default: 24 */
  labelFontSize?: number;
  /** Color for label text. Default: WHITE */
  labelColor?: string;
}

/**
 * Options for adding braces and labels to the sample space
 */
export interface BraceAnnotationOptions {
  /** Direction for the brace. Default: DOWN */
  direction?: Vector3Tuple;
  /** Font size for brace labels. Default: 24 */
  fontSize?: number;
  /** Color for the braces. Default: WHITE */
  braceColor?: string;
  /** Color for the labels. Default: WHITE */
  labelColor?: string;
  /** Buffer distance from the partition edge. Default: 0.15 */
  buff?: number;
}

/**
 * SampleSpace - A rectangle that can be divided into colored sub-rectangles
 * representing probability events.
 *
 * This mobject is used for probability visualizations. It starts as a single
 * rectangle and can be divided vertically or horizontally into partitions
 * proportional to given probabilities. Partitions can be further subdivided
 * to show conditional probabilities, and annotated with braces and labels.
 *
 * Follows the Python manim SampleSpace pattern.
 *
 * @example
 * ```typescript
 * // Create a sample space
 * const sampleSpace = new SampleSpace();
 *
 * // Divide into 30% blue and 70% green
 * sampleSpace.divideVertically([0.3, 0.7], { colors: [BLUE, GREEN] });
 *
 * // Add a title
 * sampleSpace.addTitle("Sample Space");
 *
 * // Get a specific partition
 * const first = sampleSpace.getDivision(0);
 * ```
 */
export class SampleSpace extends VGroup {
  private _ssWidth: number;
  private _ssHeight: number;
  private _ssCenter: Vector3Tuple;
  private _fontSize: number;
  private _defaultFillOpacity: number;

  /** The outer rectangle representing the full sample space */
  private _outline: Rectangle;

  /** Vertical partitions (first-level divisions) */
  private _verticalPartitions: Partition[] = [];

  /** Horizontal partitions (first-level divisions) */
  private _horizontalPartitions: Partition[] = [];

  /** Sub-divisions within partitions (for conditional probabilities) */
  private _subdivisions: Map<number, Partition[]> = new Map();

  /** Title label above the sample space */
  private _title: Text | null = null;

  /** Brace annotations */
  private _braces: VGroup = new VGroup();

  constructor(options: SampleSpaceOptions = {}) {
    super();

    const {
      width = 3,
      height = 3,
      color = WHITE,
      fillOpacity = 1,
      strokeWidth = 2,
      center = [0, 0, 0],
      fontSize = 24,
    } = options;

    this._ssWidth = width;
    this._ssHeight = height;
    this._ssCenter = [...center];
    this._fontSize = fontSize;
    this._defaultFillOpacity = fillOpacity;

    // Create the outline rectangle
    this._outline = new Rectangle({
      width,
      height,
      color,
      fillOpacity: 0,
      strokeWidth,
      center,
    });

    this.add(this._outline);
  }

  /**
   * Get the outline rectangle.
   */
  getOutline(): Rectangle {
    return this._outline;
  }

  /**
   * Divide the sample space into vertical strips (columns) based on proportions.
   *
   * The proportions should sum to 1.0. Each strip's width is proportional
   * to its value.
   *
   * @param proportions - Array of proportions (must sum to ~1.0)
   * @param options - Colors, labels, and styling for the partitions
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * sampleSpace.divideVertically([0.3, 0.7], {
   *   colors: [BLUE, GREEN],
   *   labels: ["P(A) = 0.3", "P(B) = 0.7"],
   * });
   * ```
   */
  divideVertically(proportions: number[], options: DivideOptions = {}): this {
    const {
      colors,
      fillOpacity = this._defaultFillOpacity,
      labels,
      labelFontSize = this._fontSize,
      labelColor = WHITE,
    } = options;

    // Remove any existing vertical partitions
    this._removeVerticalPartitions();

    const totalWidth = this._ssWidth;
    const height = this._ssHeight;
    const [cx, cy, cz] = this._ssCenter;
    const left = cx - totalWidth / 2;
    const top = cy + height / 2;

    let currentX = left;

    for (let i = 0; i < proportions.length; i++) {
      const proportion = proportions[i];
      const partWidth = totalWidth * proportion;
      const partCenterX = currentX + partWidth / 2;
      const partCenterY = cy;
      const color = colors
        ? colors[i % colors.length]
        : DEFAULT_PARTITION_COLORS[i % DEFAULT_PARTITION_COLORS.length];

      const rect = new Rectangle({
        width: partWidth,
        height,
        color,
        fillOpacity,
        strokeWidth: this._outline.strokeWidth,
        center: [partCenterX, partCenterY, cz],
      });

      const partition: Partition = {
        rectangle: rect,
        proportion,
      };

      // Add label if provided
      if (labels && labels[i]) {
        const label = new Text(labels[i], {
          fontSize: labelFontSize,
          color: labelColor,
        });
        label.moveTo([partCenterX, partCenterY, cz + 0.01]);
        partition.label = label;
        this.add(label);
      }

      this._verticalPartitions.push(partition);
      this.add(rect);
      currentX += partWidth;
    }

    return this;
  }

  /**
   * Divide the sample space into horizontal strips (rows) based on proportions.
   *
   * The proportions should sum to 1.0. Each strip's height is proportional
   * to its value.
   *
   * @param proportions - Array of proportions (must sum to ~1.0)
   * @param options - Colors, labels, and styling for the partitions
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * sampleSpace.divideHorizontally([0.5, 0.5], {
   *   colors: [BLUE, RED],
   *   labels: ["Top Half", "Bottom Half"],
   * });
   * ```
   */
  divideHorizontally(proportions: number[], options: DivideOptions = {}): this {
    const {
      colors,
      fillOpacity = this._defaultFillOpacity,
      labels,
      labelFontSize = this._fontSize,
      labelColor = WHITE,
    } = options;

    // Remove any existing horizontal partitions
    this._removeHorizontalPartitions();

    const width = this._ssWidth;
    const totalHeight = this._ssHeight;
    const [cx, cy, cz] = this._ssCenter;
    const top = cy + totalHeight / 2;

    let currentY = top;

    for (let i = 0; i < proportions.length; i++) {
      const proportion = proportions[i];
      const partHeight = totalHeight * proportion;
      const partCenterX = cx;
      const partCenterY = currentY - partHeight / 2;
      const color = colors
        ? colors[i % colors.length]
        : DEFAULT_PARTITION_COLORS[i % DEFAULT_PARTITION_COLORS.length];

      const rect = new Rectangle({
        width,
        height: partHeight,
        color,
        fillOpacity,
        strokeWidth: this._outline.strokeWidth,
        center: [partCenterX, partCenterY, cz],
      });

      const partition: Partition = {
        rectangle: rect,
        proportion,
      };

      // Add label if provided
      if (labels && labels[i]) {
        const label = new Text(labels[i], {
          fontSize: labelFontSize,
          color: labelColor,
        });
        label.moveTo([partCenterX, partCenterY, cz + 0.01]);
        partition.label = label;
        this.add(label);
      }

      this._horizontalPartitions.push(partition);
      this.add(rect);
      currentY -= partHeight;
    }

    return this;
  }

  /**
   * Subdivide a vertical partition horizontally to show conditional probabilities.
   *
   * @param partitionIndex - Index of the vertical partition to subdivide
   * @param proportions - Array of proportions within the partition
   * @param options - Colors, labels, and styling
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * // First divide vertically into A and B
   * sampleSpace.divideVertically([0.3, 0.7]);
   *
   * // Then subdivide partition 0 (A) into sub-events
   * sampleSpace.subdividePartition(0, [0.6, 0.4], {
   *   colors: [YELLOW, RED],
   *   labels: ["P(C|A)", "P(D|A)"],
   * });
   * ```
   */
  subdividePartition(
    partitionIndex: number,
    proportions: number[],
    options: DivideOptions = {},
  ): this {
    if (partitionIndex >= this._verticalPartitions.length) {
      throw new Error(
        `Partition index ${partitionIndex} out of range. ` +
        `Only ${this._verticalPartitions.length} vertical partitions exist.`,
      );
    }

    const {
      colors,
      fillOpacity = this._defaultFillOpacity,
      labels,
      labelFontSize = this._fontSize * 0.8,
      labelColor = WHITE,
    } = options;

    // Remove any existing subdivisions for this partition
    this._removeSubdivisions(partitionIndex);

    const parentPartition = this._verticalPartitions[partitionIndex];
    const parentRect = parentPartition.rectangle;
    const parentWidth = parentRect.getWidth();
    const parentHeight = parentRect.getHeight();
    const parentCenter = parentRect.getRectCenter();
    const [pcx, pcy, pcz] = parentCenter;

    const top = pcy + parentHeight / 2;
    let currentY = top;
    const subdivisions: Partition[] = [];

    for (let i = 0; i < proportions.length; i++) {
      const proportion = proportions[i];
      const subHeight = parentHeight * proportion;
      const subCenterX = pcx;
      const subCenterY = currentY - subHeight / 2;
      const color = colors
        ? colors[i % colors.length]
        : DEFAULT_PARTITION_COLORS[(partitionIndex + i + 2) % DEFAULT_PARTITION_COLORS.length];

      const rect = new Rectangle({
        width: parentWidth,
        height: subHeight,
        color,
        fillOpacity,
        strokeWidth: this._outline.strokeWidth * 0.5,
        center: [subCenterX, subCenterY, pcz + 0.001],
      });

      const subPartition: Partition = {
        rectangle: rect,
        proportion,
      };

      if (labels && labels[i]) {
        const label = new Text(labels[i], {
          fontSize: labelFontSize,
          color: labelColor,
        });
        label.moveTo([subCenterX, subCenterY, pcz + 0.02]);
        subPartition.label = label;
        this.add(label);
      }

      subdivisions.push(subPartition);
      this.add(rect);
      currentY -= subHeight;
    }

    this._subdivisions.set(partitionIndex, subdivisions);
    return this;
  }

  /**
   * Get a specific vertical partition (division) by index.
   * @param index - The partition index (0-based)
   * @returns The partition object with its rectangle, proportion, and optional label
   */
  getDivision(index: number): Partition {
    if (index < 0 || index >= this._verticalPartitions.length) {
      throw new Error(
        `Division index ${index} out of range. ` +
        `Only ${this._verticalPartitions.length} vertical partitions exist.`,
      );
    }
    return this._verticalPartitions[index];
  }

  /**
   * Get a specific horizontal partition by index.
   * @param index - The partition index (0-based)
   * @returns The partition object
   */
  getHorizontalDivision(index: number): Partition {
    if (index < 0 || index >= this._horizontalPartitions.length) {
      throw new Error(
        `Horizontal division index ${index} out of range. ` +
        `Only ${this._horizontalPartitions.length} horizontal partitions exist.`,
      );
    }
    return this._horizontalPartitions[index];
  }

  /**
   * Get a subdivision of a vertical partition.
   * @param partitionIndex - Index of the parent vertical partition
   * @param subIndex - Index within the subdivision
   * @returns The sub-partition object
   */
  getSubdivision(partitionIndex: number, subIndex: number): Partition {
    const subs = this._subdivisions.get(partitionIndex);
    if (!subs) {
      throw new Error(`No subdivisions exist for partition ${partitionIndex}.`);
    }
    if (subIndex < 0 || subIndex >= subs.length) {
      throw new Error(
        `Subdivision index ${subIndex} out of range for partition ${partitionIndex}. ` +
        `Only ${subs.length} subdivisions exist.`,
      );
    }
    return subs[subIndex];
  }

  /**
   * Get all vertical partitions.
   */
  getVerticalPartitions(): Partition[] {
    return [...this._verticalPartitions];
  }

  /**
   * Get all horizontal partitions.
   */
  getHorizontalPartitions(): Partition[] {
    return [...this._horizontalPartitions];
  }

  /**
   * Get the rectangle mobject for a specific division.
   * @param index - The partition index (0-based)
   * @returns The Rectangle VMobject
   */
  getDivisionRectangle(index: number): Rectangle {
    return this.getDivision(index).rectangle;
  }

  /**
   * Add a title label above the sample space.
   * @param text - Title text
   * @param options - Font size and color overrides
   * @returns The created Text mobject
   */
  addTitle(
    text: string,
    options: { fontSize?: number; color?: string; buff?: number } = {},
  ): Text {
    const { fontSize = this._fontSize * 1.2, color = WHITE, buff = 0.25 } = options;

    // Remove existing title
    if (this._title) {
      this.remove(this._title);
    }

    const [cx, cy, cz] = this._ssCenter;
    this._title = new Text(text, { fontSize, color });
    this._title.moveTo([cx, cy + this._ssHeight / 2 + buff + 0.2, cz]);
    this.add(this._title);

    return this._title;
  }

  /**
   * Get the title mobject, if set.
   */
  getTitle(): Text | null {
    return this._title;
  }

  /**
   * Add brace annotations along the vertical partitions with labels.
   *
   * Places a brace under each vertical partition, with an optional label
   * below the brace indicating the probability.
   *
   * @param labels - Text labels for each partition brace
   * @param options - Styling for braces and labels
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * sampleSpace.divideVertically([0.3, 0.7], { colors: [BLUE, GREEN] });
   * sampleSpace.addBracesAndLabels(["0.3", "0.7"]);
   * ```
   */
  addBracesAndLabels(
    labels: string[],
    options: BraceAnnotationOptions = {},
  ): this {
    const {
      direction = [0, -1, 0] as Vector3Tuple,
      fontSize = this._fontSize,
      braceColor = WHITE,
      labelColor = WHITE,
      buff = 0.15,
    } = options;

    // Remove existing braces
    if (this._braces.children.length > 0) {
      this.remove(this._braces);
      this._braces = new VGroup();
    }

    const partitions = this._verticalPartitions.length > 0
      ? this._verticalPartitions
      : this._horizontalPartitions;

    for (let i = 0; i < partitions.length; i++) {
      const partition = partitions[i];
      const rect = partition.rectangle;

      const brace = new Brace(rect, {
        direction,
        buff,
        color: braceColor,
      });
      this._braces.add(brace);

      if (labels[i]) {
        const label = new Text(labels[i], {
          fontSize,
          color: labelColor,
        });
        // Position below the brace
        const braceCenter = brace.getCenter();
        label.moveTo([
          braceCenter[0] + direction[0] * 0.35,
          braceCenter[1] + direction[1] * 0.35,
          braceCenter[2],
        ]);
        this._braces.add(label);
      }
    }

    this.add(this._braces);
    return this;
  }

  /**
   * Get the width of the sample space.
   */
  getSampleSpaceWidth(): number {
    return this._ssWidth;
  }

  /**
   * Get the height of the sample space.
   */
  getSampleSpaceHeight(): number {
    return this._ssHeight;
  }

  /**
   * Get the center of the sample space.
   */
  getSampleSpaceCenter(): Vector3Tuple {
    return [...this._ssCenter];
  }

  /**
   * Get the number of vertical partitions.
   */
  get numVerticalPartitions(): number {
    return this._verticalPartitions.length;
  }

  /**
   * Get the number of horizontal partitions.
   */
  get numHorizontalPartitions(): number {
    return this._horizontalPartitions.length;
  }

  // --- Private helpers ---

  private _removeVerticalPartitions(): void {
    for (const partition of this._verticalPartitions) {
      this.remove(partition.rectangle);
      if (partition.label) {
        this.remove(partition.label);
      }
    }
    // Also remove all subdivisions
    for (const [index] of this._subdivisions) {
      this._removeSubdivisions(index);
    }
    this._verticalPartitions = [];
    this._subdivisions.clear();
  }

  private _removeHorizontalPartitions(): void {
    for (const partition of this._horizontalPartitions) {
      this.remove(partition.rectangle);
      if (partition.label) {
        this.remove(partition.label);
      }
    }
    this._horizontalPartitions = [];
  }

  private _removeSubdivisions(partitionIndex: number): void {
    const subs = this._subdivisions.get(partitionIndex);
    if (subs) {
      for (const sub of subs) {
        this.remove(sub.rectangle);
        if (sub.label) {
          this.remove(sub.label);
        }
      }
      this._subdivisions.delete(partitionIndex);
    }
  }

  /**
   * Create a copy of this SampleSpace.
   */
  protected override _createCopy(): VMobject {
    return new SampleSpace({
      width: this._ssWidth,
      height: this._ssHeight,
      color: this._outline.color,
      fillOpacity: this._defaultFillOpacity,
      strokeWidth: this._outline.strokeWidth,
      center: this._ssCenter,
      fontSize: this._fontSize,
    });
  }
}
