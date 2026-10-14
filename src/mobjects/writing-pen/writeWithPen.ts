import { AnimationGroup } from '../../animation/AnimationGroup';
import { Create, Write } from '../../animation/creation/Create';
import type { RateFunction } from '../../animation/Animation';
import type { VMobject } from '../../core/VMobject';
import { WritingPen, WritingPenOptions } from './WritingPen';
import { PenFollowStroke } from './PenFollowStroke';

/** Options for {@link writeWithPen}. */
export interface WriteWithPenOptions {
  /** Pen to move. Default: a new vector {@link WritingPen}. */
  pen?: WritingPen;
  /** Options for the default pen. Ignored when `pen` is given. */
  penOptions?: WritingPenOptions;
  /** Reveal animation to pair with the pen. Default `'write'`. */
  animation?: 'write' | 'create';
  /** Duration in seconds. Default 1 for `'write'`, 2 for `'create'`. */
  duration?: number;
  /** Rate function shared by the reveal and the pen. */
  rateFunc?: RateFunction;
  /** Stagger between family members of a group target. Default 1. */
  lagRatio?: number;
  /** Remove the pen from the scene at the end. Default true. */
  removePen?: boolean;
}

/** An {@link AnimationGroup} that exposes the pen it moves. */
export class WriteWithPen extends AnimationGroup {
  constructor(
    readonly pen: WritingPen,
    animations: [Write | Create, PenFollowStroke],
  ) {
    super(animations);
  }
}

/**
 * Write (or Create) a VMobject while a pen follows the tip of the stroke.
 *
 * The reveal and the pen use the same duration and rate function, so the
 * nib is always on the path point at the current alpha. The pen is added to
 * the scene by `scene.play()` and removed at the end unless `removePen` is false.
 *
 * @example
 * await scene.play(writeWithPen(circle, { duration: 2 }));
 */
export function writeWithPen(target: VMobject, options: WriteWithPenOptions = {}): WriteWithPen {
  const { animation = 'write', duration, rateFunc, lagRatio, removePen } = options;
  const pen = options.pen ?? new WritingPen(options.penOptions);
  const timing = {
    duration: duration ?? (animation === 'create' ? 2 : 1),
    ...(rateFunc ? { rateFunc } : {}),
  };
  const reveal =
    animation === 'create'
      ? new Create(target, { ...timing, ...(lagRatio === undefined ? {} : { lagRatio }) })
      : new Write(target, timing);
  const follow = new PenFollowStroke(pen, target, { ...timing, lagRatio, removePen });
  return new WriteWithPen(pen, [reveal, follow]);
}
