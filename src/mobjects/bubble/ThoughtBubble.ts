import { Vector3Tuple } from '../../core/Mobject';
import { VGroup } from '../../core/VGroup';
import { VMobject } from '../../core/VMobject';
import { Circle } from '../geometry/Circle';
import { Ellipse } from '../geometry/Ellipse';
import { BubbleBase, BubbleLayout, BubbleOptions, BubbleShapes } from './BubbleBase';

export interface ThoughtBubbleOptions extends BubbleOptions {
  /** Number of bumps around the cloud. Default: chosen from the cloud size. */
  bumpCount?: number;
  /** Number of circles in the tail trail. Default: 3 */
  trailCount?: number;
  /** Radius of the first (largest) trail circle. Default: 0.18 */
  trailRadius?: number;
  /** Distance from the cloud to the last trail circle when no `pointAt` is set. Default: 1.2 */
  trailLength?: number;
}

/** Each trail circle is this much smaller than the one before. */
const TRAIL_SHRINK = 0.6;

/**
 * ThoughtBubble - a cloud body with a trail of shrinking circles.
 *
 * The cloud is an ellipse that encloses the content, ringed with overlapping
 * circles for the bumps. The trail runs from the cloud toward `pointAt` (or
 * along `tailDirection`). With `pointAt`, the last trail circle sits on the target.
 *
 * @example
 * ```typescript
 * const bubble = new ThoughtBubble({
 *   content: new Text({ text: 'Hmm...' }),
 *   pointAt: [-3, -2, 0],
 * });
 * ```
 */
export class ThoughtBubble extends BubbleBase {
  private _bumpCount?: number;
  private _trailCount: number;
  private _trailRadius: number;
  private _trailLength: number;
  private _body!: VGroup;
  private _trail: Circle[] = [];

  constructor(options: ThoughtBubbleOptions) {
    super(options);
    this._bumpCount = options.bumpCount;
    this._trailCount = Math.max(1, Math.floor(options.trailCount ?? 3));
    this._trailRadius = options.trailRadius ?? 0.18;
    this._trailLength = options.trailLength ?? 1.2;
    this._rebuild();
  }

  /** The cloud (a group of the bump circles and the inner ellipse). */
  getBody(): VGroup {
    return this._body;
  }

  /** The trail circles, from the largest (next to the cloud) to the smallest. */
  getTrail(): Circle[] {
    return this._trail;
  }

  protected _buildShapes(layout: BubbleLayout): BubbleShapes {
    const { center, halfWidth, halfHeight, direction, target } = layout;
    // The ellipse through the corners of the padded content box encloses the box.
    const rx = halfWidth * Math.SQRT2;
    const ry = halfHeight * Math.SQRT2;

    // Ramanujan's approximation of the ellipse perimeter.
    const h = ((rx - ry) / (rx + ry)) ** 2;
    const perimeter = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    const count = this._bumpCount ?? Math.min(40, Math.max(8, Math.round(perimeter / 0.7)));
    const bumpRadius = (perimeter / count) * 0.65;

    const bumps: VMobject[] = [];
    for (let i = 0; i < count; i++) {
      const a = (2 * Math.PI * i) / count;
      const bump = new Circle({
        radius: bumpRadius,
        center: [center[0] + rx * Math.cos(a), center[1] + ry * Math.sin(a), center[2]],
      });
      this._styleShape(bump);
      bumps.push(bump);
    }
    // The inner ellipse hides the inward half of each bump outline.
    const inner = new Ellipse({ width: rx * 2, height: ry * 2, center });
    this._styleShape(inner, false);
    const body = new VGroup(...bumps, inner);
    // Keep the cloud shapes coplanar. Otherwise _syncToThree layers each body
    // child by its index (idx*0.01 in z): the inner ellipse (last of ~12 bumps)
    // lands in front of the content, which sits only a few indices deep in the
    // bubble, so the opaque ellipse hides the content. The inner-over-bump draw
    // order still holds from child order. SpeechBubble has a flat body, so it is
    // unaffected.
    body.disableChildZLayering();

    // Point on the cloud edge in the tail direction, past the bumps.
    const [dx, dy] = direction;
    const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
    const edge: Vector3Tuple = [
      center[0] + dx * (t + bumpRadius),
      center[1] + dy * (t + bumpRadius),
      center[2],
    ];
    const end: Vector3Tuple = target
      ? [...target]
      : [edge[0] + dx * this._trailLength, edge[1] + dy * this._trailLength, edge[2]];

    const trail: Circle[] = [];
    for (let i = 0; i < this._trailCount; i++) {
      const f = (i + 1) / this._trailCount;
      const dot = new Circle({
        radius: this._trailRadius * TRAIL_SHRINK ** i,
        center: [
          edge[0] + (end[0] - edge[0]) * f,
          edge[1] + (end[1] - edge[1]) * f,
          edge[2] + (end[2] - edge[2]) * f,
        ],
      });
      this._styleShape(dot);
      trail.push(dot);
    }

    this._body = body;
    this._trail = trail;
    const tip = trail[trail.length - 1].getCenter();
    return { shapes: [body, ...trail], tip };
  }
}
