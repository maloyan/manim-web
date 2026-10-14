import { VGroup } from '../../core/VGroup';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { BLACK, WHITE } from '../../constants/colors';
import { DEFAULT_STROKE_WIDTH } from '../../constants';

/**
 * Options shared by every bubble.
 */
export interface BubbleOptions {
  /** The mobject shown inside the bubble (Text, MathTex, any Mobject). Required. */
  content: Mobject;
  /** Space between the content and the body edge. Default: 0.3 */
  padding?: number;
  /** Stroke color of the outline. Default: white */
  color?: string;
  /** Fill color of the body and tail. Default: black */
  fillColor?: string;
  /** Fill opacity from 0 to 1. Default: 1 */
  fillOpacity?: number;
  /** Stroke width in pixels. Default: 4 */
  strokeWidth?: number;
  /**
   * World-space point the tail aims at. The tail tip lands on this point.
   * Takes priority over `tailDirection`.
   */
  pointAt?: Vector3Tuple;
  /** Direction the tail leaves the body. Default: [-1, -1, 0] (down left) */
  tailDirection?: Vector3Tuple;
}

/** Geometry handed to a subclass when it builds its shapes. All values are group-local. */
export interface BubbleLayout {
  center: Vector3Tuple;
  /** Half width of the content plus padding. */
  halfWidth: number;
  /** Half height of the content plus padding. */
  halfHeight: number;
  /** Unit direction in the XY plane from the body center toward the tail. */
  direction: Vector3Tuple;
  /** Group-local tail target, or null when only a direction is set. */
  target: Vector3Tuple | null;
}

export interface BubbleShapes {
  /** Shapes added below the content, in draw order. */
  shapes: VMobject[];
  /** Group-local position of the tail tip. */
  tip: Vector3Tuple;
}

const DEFAULT_DIRECTION: Vector3Tuple = [-1, -1, 0];

/**
 * Shared base for SpeechBubble and ThoughtBubble.
 * It owns the content, the style and the rebuild logic.
 * A subclass builds the shapes in `_buildShapes` and calls `_rebuild()` at the end of its constructor.
 * Group-local math assumes the group has a translation only (no scale or rotation).
 */
export abstract class BubbleBase extends VGroup {
  protected _content: Mobject;
  protected _padding: number;
  protected _bubbleColor: string;
  protected _bubbleFillColor: string;
  protected _bubbleFillOpacity: number;
  protected _bubbleStrokeWidth: number;
  protected _tailTarget: Vector3Tuple | null;
  protected _tailDirection: Vector3Tuple;
  protected _shapes: VMobject[] = [];
  protected _tip: Vector3Tuple = [0, 0, 0];

  constructor(options: BubbleOptions) {
    super();
    this._content = options.content;
    this._padding = options.padding ?? 0.3;
    this._bubbleColor = options.color ?? WHITE;
    this._bubbleFillColor = options.fillColor ?? BLACK;
    this._bubbleFillOpacity = options.fillOpacity ?? 1;
    this._bubbleStrokeWidth = options.strokeWidth ?? DEFAULT_STROKE_WIDTH;
    this._tailTarget = options.pointAt ? [...options.pointAt] : null;
    this._tailDirection = options.tailDirection ? [...options.tailDirection] : DEFAULT_DIRECTION;
    this.add(this._content);
  }

  /** Build the body and tail shapes for the given layout. */
  protected abstract _buildShapes(layout: BubbleLayout): BubbleShapes;

  /** The content mobject. */
  getContent(): Mobject {
    return this._content;
  }

  /** Replace the content. The body and tail resize to fit it. */
  setContent(content: Mobject): this {
    if (content === this._content) return this._rebuild();
    this.remove(this._content);
    this._content = content;
    this.add(content);
    return this._rebuild();
  }

  /** Aim the tail at a world-space point. The tail tip lands on it. */
  pointTailAt(target: Vector3Tuple): this {
    this._tailTarget = [...target];
    return this._rebuild();
  }

  /** Aim the tail along a direction. This clears any `pointAt` target. */
  setTailDirection(direction: Vector3Tuple): this {
    this._tailDirection = [...direction];
    this._tailTarget = null;
    return this._rebuild();
  }

  /** World-space position of the tail tip. */
  getTailTip(): Vector3Tuple {
    const o = this.position;
    return [this._tip[0] + o.x, this._tip[1] + o.y, this._tip[2] + o.z];
  }

  /** Rebuild the body and tail from the current content, style and tail aim. */
  protected _rebuild(): this {
    const o = this.position;
    const [cx, cy, cz] = this._content.getCenter();
    const center: Vector3Tuple = [cx - o.x, cy - o.y, cz - o.z];
    const halfWidth = this._content.getWidth() / 2 + this._padding;
    const halfHeight = this._content.getHeight() / 2 + this._padding;

    const target: Vector3Tuple | null = this._tailTarget
      ? [this._tailTarget[0] - o.x, this._tailTarget[1] - o.y, this._tailTarget[2] - o.z]
      : null;
    const raw: Vector3Tuple = target
      ? [target[0] - center[0], target[1] - center[1], 0]
      : [this._tailDirection[0], this._tailDirection[1], 0];
    const len = Math.hypot(raw[0], raw[1]);
    const direction: Vector3Tuple =
      len > 1e-9 ? [raw[0] / len, raw[1] / len, 0] : [-1 / Math.SQRT2, -1 / Math.SQRT2, 0];

    const built = this._buildShapes({ center, halfWidth, halfHeight, direction, target });

    this.remove(this._content, ...this._shapes);
    this._shapes = built.shapes;
    this._tip = built.tip;
    this.add(...this._shapes, this._content);
    return this;
  }

  /** Apply the shared style to a shape. */
  protected _styleShape(shape: VMobject, stroke = true): void {
    shape.color = this._bubbleColor;
    shape.setFill(this._bubbleFillColor, this._bubbleFillOpacity);
    shape.strokeWidth = stroke ? this._bubbleStrokeWidth : 0;
  }
}
