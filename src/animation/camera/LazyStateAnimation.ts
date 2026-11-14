/**
 * Base for animations that drive scene state (camera pose, colour wash)
 * rather than one mobject's own transform.
 *
 * The start state is captured lazily, on the first frame with progress > 0,
 * not in begin(). The Player calls begin() for every segment at record time,
 * long before an earlier segment has moved the camera; a begin()-time
 * snapshot would make every chained camera move start from the initial pose.
 * A lazy capture reads the state the earlier segments really left.
 *
 * reset() puts the captured start state back and forgets it. The
 * MasterTimeline resets animations last to first before a seek, so the
 * earliest capture wins and a seek replays the exact same frames.
 */

import { Group } from '../../core/Group';
import { Animation, AnimationOptions } from '../Animation';

export abstract class LazyStateAnimation<S> extends Animation {
  private _from: S | null = null;
  private _to: S | null = null;

  constructor(options: AnimationOptions = {}) {
    // A driver mobject: empty, never drawn. play() adds it to the scene like
    // the dummy mobject of an AnimationGroup.
    super(new Group(), options);
  }

  /** Read the live state this animation drives. */
  protected abstract captureState(): S;

  /** The end state, computed once from the captured start state. */
  protected abstract targetState(from: S): S;

  /** Write the state at progress `alpha` between `from` and `to`. */
  protected abstract applyState(from: S, to: S, alpha: number): void;

  /** The captured start state, or null before the first frame. */
  protected get startState(): S | null {
    return this._from;
  }

  override begin(): void {
    // No mobject snapshot: the driver mobject has no visual state, and the
    // scene state is captured lazily (see the class comment).
    this._hasBegun = true;
    this._isFinished = false;
  }

  interpolate(alpha: number): void {
    if (this._from === null) {
      // Not started yet (an AnimationGroup feeds 0 before a child's window).
      // Writing a stale start state here would fight the animation that runs.
      if (alpha <= 0) return;
      this._from = this.captureState();
      this._to = this.targetState(this._from);
    }
    this.applyState(this._from, this._to as S, alpha);
  }

  override reset(): void {
    if (this._from !== null) {
      this.applyState(this._from, this._to as S, 0);
    }
    this._from = null;
    this._to = null;
    super.reset();
  }
}
