/**
 * Base Animation class for all animations in manimweb.
 * Animations transform mobjects over time.
 */

import { Mobject } from '../core/Mobject';
import { VMobject } from '../core/VMobject';
import { RateFunction, smooth } from '../rate-functions';
import { logger } from '../utils/logger';
import typia from 'typia';

export type { RateFunction };

export interface AnimationOptions {
  /** Duration of the animation in seconds (default: 1) */
  duration?: number;
  /** Rate function controlling the animation's pacing (default: smooth) */
  rateFunc?: RateFunction;
  /** Shift direction for fade animations */
  shift?: [number, number, number];
}

/**
 * Minimal scene surface needed by Animation.cleanUpFromScene().
 * Declared here (not imported from core/Scene) to avoid a core→animation cycle.
 */
export interface AnimationScene {
  add(...mobjects: Mobject[]): void;
  remove(...mobjects: Mobject[]): void;
}

/**
 * Capture the VMobject child list of every node in `root`'s subtree,
 * keyed by node. Animation.begin() records this alongside the point
 * snapshot so reset() knows exactly which children existed when the
 * animation began: anything else present at reset time was fabricated
 * during the animation (morph alignment padding) and is removed, and
 * the recorded children are restored pairwise against the snapshot.
 * The record lives on the ANIMATION, not the mobject — each animation
 * prunes only its own additions, so two morphs of the same mobject
 * cannot corrupt each other's bookkeeping.
 */
function captureChildIdentities(root: VMobject): Map<VMobject, VMobject[]> {
  const map = new Map<VMobject, VMobject[]>();
  const walk = (node: VMobject): void => {
    const kids = node.children.filter((c): c is VMobject => c instanceof VMobject);
    map.set(node, kids);
    for (const kid of kids) walk(kid);
  };
  walk(root);
  return map;
}

/**
 * Restore `live`'s points from its pre-animation snapshot `saved`,
 * structure-aware. A flat `live.setPoints(saved.getLocalPoints())` only
 * works when the animation left the mobject's point counts untouched:
 * a VGroup partitions a flat array across its children by their CURRENT
 * counts, and morph animations (Transform/FadeTransform on a group)
 * legitimately change those counts during begin() — resampling leaves
 * to the aligned counts and padding the child list with fabricated
 * duplicates. The flat restore then throws "VGroup.setPoints: expected
 * <aligned total>, got <original total>".
 *
 * Restore per node instead, using the begin() child records: leaves
 * (nodes that own points) take the snapshot's points directly. For a
 * container, the begin() record distinguishes the ways the child list
 * can differ from the snapshot at reset time, per node:
 *
 * - Some recorded children are present: identity bookkeeping is
 *   meaningful. Drop every child begin() did not record -- exactly the
 *   fabricated padding/restructure the animation installed, wherever
 *   it sits -- and pair the present recorded children with the
 *   snapshot's children by their recorded index. A recorded child
 *   already missing was itself padding an EARLIER animation added,
 *   which that animation's reset (resets run in segment order) has
 *   already pruned: skip it -- playback re-begins the earlier
 *   animation and rebuilds it if needed.
 * - No recorded child is present but the count matches: the mobject
 *   rebuilt its own children with fresh identities during the
 *   animation (DashedLine's dashes, #906). Pair by index (a snapshot
 *   copy preserves child order, so index i on both sides is the same
 *   logical child) and recurse; a rebuilt subtree root has no begin()
 *   record of its own, so its subtree restores by index pairing all
 *   the way down.
 * - No recorded child is present and the count differs: no sound
 *   restore exists for this subtree (upstream's family walk no-ops
 *   here too); leave it as it is.
 *
 * If the snapshot's child count disagrees with the record, the two
 * describe different trees and there is no sound restore: fail loudly
 * instead of installing copies.
 */
function restorePointsFromSnapshot(
  live: VMobject,
  saved: VMobject,
  beginChildren: Map<VMobject, VMobject[]> | null,
): void {
  if (saved.hasOwnPoints() || live.hasOwnPoints()) {
    const pts = saved.getLocalPoints();
    if (pts.length > 0) {
      live.setPoints(pts);
    }
    return;
  }

  const savedChildren = saved.children.filter((c): c is VMobject => c instanceof VMobject);
  const expected = beginChildren?.get(live);
  if (!expected) {
    if (!beginChildren) {
      throw new Error(
        'Animation reset: no begin() child record for a container mobject; cannot restore points safely.',
      );
    }
    // A subtree the mobject rebuilt with fresh identities (DashedLine,
    // #906): no begin() record exists for this node. Restore by pure
    // index pairing against the snapshot subtree.
    const liveKids = live.children.filter((c): c is VMobject => c instanceof VMobject);
    const n = Math.min(liveKids.length, savedChildren.length);
    for (let i = 0; i < n; i++) {
      restorePointsFromSnapshot(liveKids[i], savedChildren[i], beginChildren);
    }
    return;
  }
  if (savedChildren.length !== expected.length) {
    throw new Error(
      `Animation reset: snapshot has ${savedChildren.length} children where begin() recorded ` +
        `${expected.length}; cannot restore points safely.`,
    );
  }

  const liveChildren = live.children.filter((c): c is VMobject => c instanceof VMobject);
  const recordedPresent = liveChildren.filter((c) => expected.includes(c));
  if (recordedPresent.length > 0) {
    // Identity bookkeeping is meaningful at this node: drop every
    // child begin() did not record (fabricated padding/restructure),
    // then pair the present recorded children by their recorded index.
    for (const child of liveChildren) {
      if (!expected.includes(child)) {
        live.remove(child);
      }
    }
    for (let i = 0; i < expected.length; i++) {
      const child = expected[i];
      if (!live.children.includes(child)) continue;
      restorePointsFromSnapshot(child, savedChildren[i], beginChildren);
    }
  } else if (liveChildren.length === expected.length) {
    // The mobject rebuilt its children wholesale with fresh
    // identities, same shape (DashedLine's dashes, #906): pair by
    // index and recurse (the record-free fallback above takes over
    // below this node).
    for (let i = 0; i < expected.length; i++) {
      restorePointsFromSnapshot(liveChildren[i], savedChildren[i], beginChildren);
    }
  }
  // Otherwise the subtree was rebuilt with a different shape: no
  // sound restore exists here; leave the children as they are.
}
export abstract class Animation<M extends Mobject = Mobject> {
  /** The mobject being animated */
  readonly mobject: M;

  /** Duration of the animation in seconds */
  readonly duration: number;

  /** Rate function controlling the animation's pacing */
  readonly rateFunc: RateFunction;

  /** Time when the animation started (set by Timeline) */
  protected _startTime: number | null = null;

  /** Whether the animation has finished */
  protected _isFinished: boolean = false;

  /** Track if begin() has been called */
  protected _hasBegun: boolean = false;

  /**
   * If true, the scene will remove this mobject after the animation finishes.
   * Used by FadeOut (like Python manim's remover=True).
   */
  remover: boolean = false;

  /**
   * Snapshot of the mobject's state before this animation first ran.
   * Captured on the first begin() call and used by reset() to restore
   * the mobject to its pre-animation visual state for clean re-seeking.
   */
  private _preAnimationState: Mobject | null = null;

  /**
   * The mobject's VMobject child lists at begin() time, keyed by node
   * (see captureChildIdentities). reset()'s point restore uses them to
   * remove exactly the children this animation added.
   */
  private _preAnimationChildren: Map<VMobject, VMobject[]> | null = null;

  constructor(mobject: M, options: AnimationOptions = {}) {
    // Validate options via typia to generate runtime assertions.
    typia.assert<AnimationOptions>(options);
    this.mobject = mobject;
    this.duration = options.duration ?? 1;
    this.rateFunc = options.rateFunc ?? smooth;
  }

  /**
   * Called when the animation starts.
   * Subclasses can override to set up initial state.
   * On the very first call, captures a snapshot of the mobject so that
   * reset() can restore it for clean backward seeking.
   */
  begin(): void {
    if (!this._preAnimationState) {
      // `copy()` is abstract on Mobject, so a bare `new Mobject()` (no concrete
      // subclass) has no `copy` on its prototype at runtime. Such bare mobjects
      // only ever come from animation tests; detect them by prototype lookup and
      // fall back to a minimal snapshot silently. Errors thrown from _inside_ a
      // real subclass's copy() are still surfaced loudly below.
      //
      // Cleanup owed: several animation tests construct bare Mobjects and
      // animate them. They should be migrated to concrete mobjects, after which
      // this prototype check and the _captureMinimalState fallback can go.
      const hasCopy = typeof (this.mobject as { copy?: () => Mobject }).copy === 'function';
      if (!hasCopy) {
        this._preAnimationState = this._captureMinimalState();
      } else {
        try {
          this._preAnimationState = this.mobject.copy();
        } catch (err) {
          logger.warn(
            'Animation.begin(): mobject.copy() failed, using minimal state snapshot. ' +
              'Backward seeking may not fully restore this mobject.',
            err,
          );
          this._preAnimationState = this._captureMinimalState();
        }
      }
      if (this.mobject instanceof VMobject && this._preAnimationState instanceof VMobject) {
        this._preAnimationChildren = captureChildIdentities(this.mobject);
      }
    }
    this._hasBegun = true;
    this._isFinished = false;
  }

  /**
   * Capture a minimal snapshot when copy() is unavailable.
   * Creates a plain object that looks enough like a Mobject for reset() to use.
   */
  private _captureMinimalState(): Mobject {
    const m = this.mobject;
    // Create a minimal object with the properties reset() needs
    const snapshot = Object.create(null) as Record<string, unknown>;
    snapshot.position = m.position.clone();
    snapshot.rotation = m.rotation.clone();
    snapshot.scaleVector = m.scaleVector.clone();
    snapshot.color = m.color;
    snapshot.opacity = m.opacity;
    snapshot.strokeWidth = m.strokeWidth;
    snapshot.fillOpacity = m.fillOpacity;
    return snapshot as unknown as Mobject;
  }

  /**
   * Called when the animation ends.
   * Subclasses can override to clean up or finalize state.
   */
  finish(): void {
    this._isFinished = true;
  }

  /**
   * Hook called by Scene after the animation finishes, before the next play().
   * Default: removes `mobject` if `remover` is set (FadeOut, Write({remover:true})).
   * Override for animations that need to mutate scene membership — e.g.
   * ReplacementTransform swaps source for target.
   */
  cleanUpFromScene(scene: AnimationScene): void {
    if (this.remover) {
      scene.remove(this.mobject);
    }
  }

  /**
   * Apply the animation at a given progress value.
   * @param alpha Progress from 0 (start) to 1 (end)
   */
  abstract interpolate(alpha: number): void;

  /** Linear progress of the running {@link interpolateAt} call, else null. */
  private _linearAlpha: number | null = null;

  /**
   * Apply the animation at linear progress `linearAlpha` (elapsed / duration).
   * Applies the rate function like {@link update}, and lets staggered
   * subclasses apply it per family member (see {@link getRatedSubAlpha}).
   * @param linearAlpha Linear progress from 0 (start) to 1 (end)
   */
  interpolateAt(linearAlpha: number): void {
    this._linearAlpha = linearAlpha;
    try {
      this.interpolate(this.rateFunc(linearAlpha));
    } finally {
      this._linearAlpha = null;
    }
  }

  /**
   * Manim CE's `get_sub_alpha`: remaps a global progress `alpha` into the
   * local progress of family member `index` (of `count`) under a `lagRatio`
   * stagger. With `lagRatio <= 0` (or a single member), every member tracks
   * `alpha` directly. Subclasses that stagger across a mobject's family
   * (e.g. Create) should index this by `familyMembersWithPoints()`, never by
   * rendering-layer primitives.
   */
  protected getSubAlpha(alpha: number, index: number, count: number, lagRatio: number): number {
    if (lagRatio <= 0 || count <= 1) return alpha;
    const fullLength = (count - 1) * lagRatio + 1;
    const value = alpha * fullLength;
    const lower = index * lagRatio;
    return Math.max(0, Math.min(1, value - lower));
  }

  /**
   * Like {@link getSubAlpha}, but with the rate function applied inside each
   * member's lag window, as Manim CE's `get_sub_alpha` does: the window is cut
   * from linear progress and eased on its own. Applying the rate function to
   * the whole animation and then splitting it linearly makes the first and
   * last members crawl and the middle ones rush.
   *
   * Only an {@link interpolateAt} call knows the linear progress; a direct
   * `interpolate(alpha)` call falls back to splitting `alpha` linearly.
   */
  protected getRatedSubAlpha(
    alpha: number,
    index: number,
    count: number,
    lagRatio: number,
  ): number {
    const linear = this._linearAlpha;
    if (linear === null || lagRatio <= 0 || count <= 1) {
      return this.getSubAlpha(alpha, index, count, lagRatio);
    }
    return this.rateFunc(this.getSubAlpha(linear, index, count, lagRatio));
  }

  /**
   * Update the animation for the current frame.
   * @param _dt Time delta since last frame (unused, but available for subclasses)
   * @param currentTime Current time in the timeline
   */
  update(_dt: number, currentTime: number): void {
    if (this._startTime === null) {
      this._startTime = currentTime;
    }

    if (!this._hasBegun) {
      this.begin();
    }

    const elapsed = currentTime - this._startTime;
    const rawAlpha = this.duration > 0 ? Math.min(1, Math.max(0, elapsed / this.duration)) : 1;
    this.interpolateAt(rawAlpha);

    // Check if finished
    if (rawAlpha >= 1 && !this._isFinished) {
      this.finish();
    }
  }

  /**
   * Check if the animation has finished
   */
  isFinished(): boolean {
    return this._isFinished;
  }

  /**
   * Reset the animation to its initial state.
   * Restores the mobject to its pre-animation visual state so that
   * re-seeking (especially backward) produces correct results.
   */
  reset(): void {
    if (this._preAnimationState) {
      // Restore the mobject's visual properties from the snapshot
      const saved = this._preAnimationState;
      this.mobject.position.copy(saved.position);
      this.mobject.rotation.copy(saved.rotation);
      this.mobject.scaleVector.copy(saved.scaleVector);
      this._restoreFamilyColors(saved);
      this.mobject.opacity = saved.opacity;
      this.mobject.strokeWidth = saved.strokeWidth;
      this.mobject.fillOpacity = saved.fillOpacity;

      // Restore VMobject points if applicable. Structure-aware: morph
      // animations may have padded/resampled a container's children
      // during begin(), so a flat setPoints of the snapshot's combined
      // points would partition against the wrong child counts.
      if (this.mobject instanceof VMobject && saved instanceof VMobject) {
        restorePointsFromSnapshot(this.mobject, saved, this._preAnimationChildren);
        if (saved.getLocalPoints().length === 0) {
          // Point-less container (DashedLine, #906): upstream's pairwise
          // walk also restores each descendant's transform from the
          // snapshot. It applies only when the family shapes agree --
          // the structural restore above has already pruned any children
          // the animation fabricated, so the shapes agree here.
          this._restoreLeafGeometry(saved);
        }
      }

      this.mobject._markDirty();
    }
    this._startTime = null;
    this._isFinished = false;
    this._hasBegun = false;
  }

  /**
   * Restore the points and transforms of every descendant from the snapshot.
   * Used for a VMobject that owns no points and draws through its children
   * (DashedLine, a multi-part RegularPolygram). A Transform moves those
   * children, and the root-only restore in reset() left them where the
   * last seek put them (#906). Skipped when the family changed shape.
   *
   * @pre  saved.getLocalPoints().length === 0
   * @post live.length === snap.length => live[i].getLocalPoints() === snap[i].getLocalPoints()  // for i >= 1
   */
  private _restoreLeafGeometry(saved: VMobject): void {
    const live = this.mobject.getFamily();
    const snap = saved.getFamily();
    if (live.length !== snap.length) return;
    for (let i = 1; i < live.length; i++) {
      const m = live[i];
      const s = snap[i];
      m.position.copy(s.position);
      m.rotation.copy(s.rotation);
      m.scaleVector.copy(s.scaleVector);
      if (m instanceof VMobject && s instanceof VMobject) {
        const pts = s.getLocalPoints();
        if (pts.length > 0) m.setPoints(pts);
      }
      m._markDirty();
    }
  }

  /**
   * Restore the colors of the mobject and of every descendant from the
   * snapshot. Each node gets its own color back, without the cascade of
   * `setColor()` on a group, which would recolor every child to the group
   * color (#856).
   */
  private _restoreFamilyColors(saved: Mobject): void {
    if (typeof (saved as { getFamily?: unknown }).getFamily !== 'function') {
      // Minimal snapshot (see _captureMinimalState): own color only.
      this.mobject.color = saved.color;
      return;
    }
    const live = this.mobject.getFamily();
    const snap = saved.getFamily();
    if (live.length !== snap.length) {
      // The family changed after the snapshot: restore the root node only.
      this.mobject._setColorState(saved._getColorState());
      return;
    }
    for (let i = 0; i < live.length; i++) {
      live[i]._setColorState(snap[i]._getColorState());
    }
  }

  /**
   * Get the start time of this animation (set by Timeline)
   */
  get startTime(): number | null {
    return this._startTime;
  }

  /**
   * Set the start time of this animation (used by Timeline)
   */
  set startTime(time: number | null) {
    this._startTime = time;
  }
}
