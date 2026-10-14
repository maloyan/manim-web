import { Vector3Tuple } from '../../core/Mobject';
import { VMobject } from '../../core/VMobject';
import { RoundedRectangle } from '../geometry/PolygonExtensions';
import { Polygon } from '../geometry/Polygon';
import { BubbleBase, BubbleLayout, BubbleOptions, BubbleShapes } from './BubbleBase';

export interface SpeechBubbleOptions extends BubbleOptions {
  /** Corner radius of the body. Default: 0.25 */
  cornerRadius?: number;
  /** Distance from the body edge to the tail tip when no `pointAt` is set. Default: 0.7 */
  tailLength?: number;
  /** Width of the tail where it meets the body. Default: 0.4 */
  tailWidth?: number;
}

/** How far the tail base reaches into the body, to hide the body outline at the tail mouth. */
const TAIL_OVERLAP = 0.04;

/**
 * SpeechBubble - a rounded rectangle with a triangular tail.
 *
 * The body is sized to the content plus padding. The tail leaves the side of
 * the body that faces the target, and its tip lands on `pointAt` (or at
 * `tailLength` along `tailDirection`).
 *
 * @example
 * ```typescript
 * const bubble = new SpeechBubble({
 *   content: new Text({ text: 'Hello!' }),
 *   pointAt: [-3, -2, 0],
 * });
 * scene.add(bubble);
 * ```
 */
export class SpeechBubble extends BubbleBase {
  private _cornerRadius: number;
  private _tailLength: number;
  private _tailWidth: number;
  private _body!: RoundedRectangle;
  private _tail!: Polygon;

  constructor(options: SpeechBubbleOptions) {
    super(options);
    this._cornerRadius = options.cornerRadius ?? 0.25;
    this._tailLength = options.tailLength ?? 0.7;
    this._tailWidth = options.tailWidth ?? 0.4;
    this._rebuild();
  }

  /** The rounded rectangle body. */
  getBody(): RoundedRectangle {
    return this._body;
  }

  /** The tail polygon. */
  getTail(): Polygon {
    return this._tail;
  }

  protected _buildShapes(layout: BubbleLayout): BubbleShapes {
    const { center, halfWidth, halfHeight, direction, target } = layout;
    const [dx, dy] = direction;
    const r = Math.min(this._cornerRadius, halfWidth, halfHeight);
    const half = this._tailWidth / 2;

    const body = new RoundedRectangle({
      width: halfWidth * 2,
      height: halfHeight * 2,
      cornerRadius: this._cornerRadius,
      center,
    });
    this._styleShape(body);

    // Pick the side that faces the tail, then slide the base along it (clear of the corners).
    const horizontalSide = Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth;
    const clamp = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));
    let baseCenter: Vector3Tuple;
    let alongEdge: Vector3Tuple;
    if (horizontalSide) {
      const side = Math.sign(dx);
      const y = clamp((dy / Math.abs(dx)) * halfWidth, Math.max(0, halfHeight - r - half));
      baseCenter = [center[0] + side * halfWidth, center[1] + y, center[2]];
      alongEdge = [0, 1, 0];
    } else {
      const side = Math.sign(dy);
      const x = clamp((dx / Math.abs(dy)) * halfHeight, Math.max(0, halfWidth - r - half));
      baseCenter = [center[0] + x, center[1] + side * halfHeight, center[2]];
      alongEdge = [1, 0, 0];
    }

    const tip: Vector3Tuple = target
      ? [...target]
      : [
          baseCenter[0] + dx * this._tailLength,
          baseCenter[1] + dy * this._tailLength,
          baseCenter[2],
        ];

    const b1: Vector3Tuple = [
      baseCenter[0] - alongEdge[0] * half,
      baseCenter[1] - alongEdge[1] * half,
      baseCenter[2],
    ];
    const b2: Vector3Tuple = [
      baseCenter[0] + alongEdge[0] * half,
      baseCenter[1] + alongEdge[1] * half,
      baseCenter[2],
    ];
    const inset = (b: Vector3Tuple): Vector3Tuple => {
      const vx = b[0] - tip[0];
      const vy = b[1] - tip[1];
      const l = Math.hypot(vx, vy) || 1;
      return [b[0] + (vx / l) * TAIL_OVERLAP, b[1] + (vy / l) * TAIL_OVERLAP, b[2]];
    };

    // Open path: the stroke skips the base, the fill closes it inside the body.
    const tail = new Polygon({ vertices: [inset(b1), tip, inset(b2)], closed: false });
    this._styleShape(tail);

    this._body = body;
    this._tail = tail;
    const shapes: VMobject[] = [body, tail];
    return { shapes, tip };
  }
}
