/**
 * ExplainerTour: a generic runner for narrated 3D explainer tours.
 *
 * A tour is a list of stops. Per stop the runner composes the building
 * blocks of the direction layer, in this order:
 *   1. dim everything but the stop target (FocusDim),
 *      move the camera (CameraFocus) and swap the caption (CaptionCard),
 *      all three in one parallel play();
 *   2. reveal the rest of the caption rows, one by one;
 *   3. draw the callouts (Callout3D) and the inset (InsetPanel);
 *   4. run the author's `onEnter` hook (build-up, process animation);
 *   5. wait for the narration (seconds or an async callback), then hold;
 *   6. remove the callouts and the inset.
 *
 * Every step is also a public method, so an author can drive a stop by hand
 * and only borrow the parts they need.
 *
 * A target mobject can carry its own defaults through {@link TourTarget}
 * (`getFocusFraming`, `getCaption`, `getAnchor`); a stop's own values win.
 *
 * @example
 * ```ts
 * const tour = new ExplainerTour(scene);
 * await tour.run([
 *   { caption: { title: 'Three solids', style: 'headline' }, hold: 1 },
 *   { target: sphere, caption: { title: 'Sphere', swatch: BLUE, body: 'Round.' } },
 *   { target: torus, callouts: [{ label: 'R', tex: true, anchor: 'rim' }] },
 * ]);
 * await tour.finish();
 * ```
 */

import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import type { ThreeDScene } from '../../core/ThreeDScene';
import { Animation } from '../../animation/Animation';
import { CameraFocus, type CameraFocusOptions } from '../../animation/camera/CameraFocus';
import { FocusDim, restoreFocus, type FocusDimOptions } from '../../animation/camera/FocusDim';
import { Callout3D, type AnchorTarget, type Callout3DOptions } from './Callout3D';
import { CaptionCard, type CaptionCardOptions, type CaptionContent } from './CaptionCard';
import { FocusRing } from './FocusRing';
import { InsetPanel, type InsetPanelOptions } from './InsetPanel';
import { Indicate } from '../../animation/indication/Indicate';
import { logger } from '../../utils/logger';

/**
 * Optional members a tour target can expose to supply its own defaults.
 * A biology kit implements it on each organelle, for example.
 */
export interface TourTarget {
  /** Camera framing used when the stop gives none. */
  getFocusFraming?(): CameraFocusOptions;
  /** Caption used when the stop gives none. */
  getCaption?(): CaptionContent;
  /**
   * A named anchor on the target, for callouts and insets that name it.
   * Return a world point, a mobject, or a mobject plus a local point.
   */
  getAnchor?(
    name: string,
  ): AnchorTarget | { anchor: AnchorTarget; local?: Vector3Tuple } | undefined;
}

/** One callout of a stop. `anchor` may name an anchor of the target. */
export interface TourCallout extends Omit<Callout3DOptions, 'scene' | 'anchor'> {
  /** Anchor point/mobject, or a name the target resolves via getAnchor(). Default: the target */
  anchor?: AnchorTarget | string;
}

/** The inset of a stop. `anchor` may name an anchor of the target. */
export interface TourInset extends Omit<InsetPanelOptions, 'scene' | 'anchor'> {
  /** Anchor point/mobject, or a name the target resolves. Default: the target */
  anchor?: AnchorTarget | string;
}

/** One stop of a tour. */
export interface TourStop {
  /**
   * What the camera frames. No camera move when omitted. A mobject that
   * implements {@link TourTarget} supplies defaults.
   */
  target?: Mobject | Vector3Tuple;
  /** Camera framing; merged over the target's getFocusFraming(). */
  framing?: CameraFocusOptions;
  /** Caption; null hides the card. Default: the target's getCaption(), else unchanged */
  caption?: CaptionContent | null;
  /** 'steps' (default): title with the move, then each row; 'all': every row with the move. */
  reveal?: 'steps' | 'all';
  /** Callouts drawn after the camera arrives. */
  callouts?: TourCallout[];
  /** Close-up inset drawn after the callouts. */
  inset?: TourInset;
  /**
   * Focus dim: true (default when there is a target) dims all but `keep`;
   * false restores everything; an options object tunes it.
   */
  dim?: boolean | FocusDimOptions;
  /** Mobjects kept in full colour. Default: [target] when it is a mobject */
  keep?: Mobject[];
  /**
   * Author hook, after callouts and inset: play your own animations here.
   * Play them through `player` (the scene, or a Player's recording proxy)
   * so they land on the same timeline as the tour.
   */
  onEnter?: (scene: ThreeDScene, stop: TourStop, player: TourPlayer) => Promise<void>;
  /**
   * Narration: a duration in seconds, counted from the stop start (the
   * runner subtracts the time of its own animations; onEnter time is not
   * counted), or an async callback started at the stop start and awaited
   * before the hold.
   */
  narration?: number | (() => Promise<void>);
  /** Extra seconds to hold after the narration. Default: 1 */
  hold?: number;
  /**
   * Emphasis on the target once the camera arrives: 'indicate' (the repo's
   * Indicate, works on 3D meshes), 'ring' (a {@link FocusRing} drawn and
   * un-drawn around it), 'none', or an animation of your own (for example an
   * `Indicate` in the target's own colour). It plays with the callouts.
   * Default: 'none'
   */
  emphasis?: 'indicate' | 'ring' | 'none' | Animation;
  /** Keep this stop's callouts and inset on screen into the next stop. Default: false */
  keepAnnotations?: boolean;
}

/** The play/wait surface the runner drives (a Scene, or a Player's recording proxy). */
export interface TourPlayer {
  play(...animations: Animation[]): Promise<void>;
  wait(duration?: number): Promise<void>;
}

export interface ExplainerTourOptions {
  /** Options of the tour's CaptionCard (its scene is the tour scene). */
  caption?: Omit<CaptionCardOptions, 'scene'>;
  /** Default focus-dim options. */
  dim?: FocusDimOptions;
  /** Default camera framing, under the target's and the stop's. */
  framing?: CameraFocusOptions;
  /** Where play()/wait() go. Default: the scene (use a Player's recording scene to record). */
  player?: TourPlayer;
}

/**
 * Live annotations: the current stop's, plus every earlier stop's kept with
 * `keepAnnotations`.
 */
interface StopAnnotations {
  callouts: Callout3D[];
  insets: InsetPanel[];
  rings: FocusRing[];
}

/** The outcome of a narration, observed from the moment it starts. */
type Settled = { ok: true } | { ok: false; error: unknown };

/**
 * Start a narration callback and observe it at once, so a rejection is never
 * unhandled while the stop's animations run. A synchronous throw counts as a
 * rejection.
 */
function startNarration(fn: () => Promise<void>): Promise<Settled> {
  return new Promise<void>((resolve) => resolve(fn())).then(
    (): Settled => ({ ok: true }),
    (error: unknown): Settled => ({ ok: false, error }),
  );
}

function isMobject(t: TourStop['target']): t is Mobject & TourTarget {
  return t !== undefined && !Array.isArray(t);
}

/** A target's optional TourTarget members (all absent on a plain mobject). */
function tourTargetOf(t: TourStop['target']): TourTarget | null {
  return isMobject(t) ? t : null;
}

export class ExplainerTour {
  readonly scene: ThreeDScene;
  readonly card: CaptionCard;
  private readonly _player: TourPlayer;
  private readonly _o: ExplainerTourOptions;
  private _live: StopAnnotations = { callouts: [], insets: [], rings: [] };
  private _retired: { dispose(): void }[] = [];
  private _cardShown = false;

  constructor(scene: ThreeDScene, options: ExplainerTourOptions = {}) {
    this.scene = scene;
    this._o = options;
    this._player = options.player ?? scene;
    this.card = new CaptionCard({ ...options.caption, scene });
  }

  /** Play every stop in order. */
  async run(stops: TourStop[]): Promise<void> {
    for (const stop of stops) await this.playStop(stop);
  }

  /**
   * Play one stop: the composition described in the class comment.
   *
   * A narration callback runs in parallel with the stop's animations. If it
   * rejects, or an animation or `onEnter` rejects, the returned promise
   * rejects with that error (an animation error first, since it comes first in
   * the stop). A narration error after an animation error is logged.
   */
  async playStop(stop: TourStop): Promise<void> {
    const narration = typeof stop.narration === 'function' ? startNarration(stop.narration) : null;
    let used = 0;
    const play = async (...anims: Animation[]) => {
      const live = anims.filter((a) => a.duration > 0);
      if (live.length === 0) return;
      used += Math.max(...live.map((a) => a.duration));
      await this._player.play(...live);
    };

    try {
      if (!stop.keepAnnotations) await play(...this.exitAnnotations());
      await play(...this.enterAnimations(stop));
      for (const step of this.revealSteps(stop)) await play(step);
      const ann = this.annotationAnimations(stop);
      if (ann.length > 0) await play(...ann);
      if (stop.onEnter) await stop.onEnter(this.scene, stop, this._player);
    } catch (error) {
      void narration?.then((n) => {
        if (!n.ok) logger.warn('ExplainerTour: narration failed after a stop error:', n.error);
      });
      throw error;
    }

    if (narration) {
      const n = await narration;
      if (!n.ok) throw n.error;
    } else if (typeof stop.narration === 'number' && stop.narration > used) {
      await this._player.wait(stop.narration - used);
    }
    const hold = stop.hold ?? 1;
    if (hold > 0) await this._player.wait(hold);
  }

  /** Fade the caption, the annotations and the dim away. */
  async finish(): Promise<void> {
    const anims = [...this.exitAnnotations(), restoreFocus(this.scene, this._o.dim)];
    if (this._cardShown) anims.push(this.card.hide());
    this._cardShown = false;
    await this._player.play(...anims);
  }

  // ── Building blocks ──────────────────────────────────────────────

  /** The camera framing of a stop: tour default < target default < stop. */
  framingFor(stop: TourStop): CameraFocusOptions {
    const fromTarget = tourTargetOf(stop.target)?.getFocusFraming?.();
    return { ...this._o.framing, ...fromTarget, ...stop.framing };
  }

  /** The caption of a stop (undefined = keep the current one). */
  captionFor(stop: TourStop): CaptionContent | null | undefined {
    if (stop.caption !== undefined) return stop.caption;
    return tourTargetOf(stop.target)?.getCaption?.();
  }

  /** Resolve a callout/inset anchor: a name goes through target.getAnchor(). */
  resolveAnchor(
    stop: TourStop,
    anchor: AnchorTarget | string | undefined,
  ): { anchor: AnchorTarget; local?: Vector3Tuple } | null {
    if (anchor === undefined) return stop.target ? { anchor: stop.target } : null;
    if (typeof anchor !== 'string') return { anchor };
    const got = tourTargetOf(stop.target)?.getAnchor?.(anchor);
    if (got === undefined) return stop.target ? { anchor: stop.target } : null;
    if (Array.isArray(got) || !('anchor' in got)) return { anchor: got };
    return got;
  }

  /** Step 1: dim, camera move and caption swap, to play in parallel. */
  enterAnimations(stop: TourStop): Animation[] {
    const anims: Animation[] = [];
    const dim = stop.dim ?? stop.target !== undefined;
    if (dim === false) {
      anims.push(restoreFocus(this.scene, this._o.dim));
    } else {
      const keep = stop.keep ?? (isMobject(stop.target) ? [stop.target] : []);
      const opts = typeof dim === 'object' ? { ...this._o.dim, ...dim } : this._o.dim;
      anims.push(new FocusDim(this.scene, keep, opts));
    }
    if (stop.target !== undefined) {
      anims.push(new CameraFocus(this.scene, stop.target, this.framingFor(stop)));
    }
    const caption = this.captionFor(stop);
    if (caption === null && this._cardShown) {
      anims.push(this.card.hide());
      this._cardShown = false;
    } else if (caption) {
      anims.push(this.card.show(caption, { reveal: stop.reveal === 'all' ? 'all' : 'title' }));
      this._cardShown = true;
    }
    return anims;
  }

  /** Step 2: one animation per remaining caption row. */
  revealSteps(stop: TourStop): Animation[] {
    const caption = this.captionFor(stop);
    if (!caption || stop.reveal === 'all') return [];
    const rows = (caption.body ? 1 : 0) + (caption.footnote ? 1 : 0) + (caption.rows?.length ?? 0);
    return Array.from({ length: rows }, () => this.card.revealNext());
  }

  /** Emphasis on the target ('indicate' or 'ring'), or null. */
  emphasisAnimation(stop: TourStop): Animation | null {
    if (stop.emphasis instanceof Animation) return stop.emphasis;
    if (!isMobject(stop.target) || !stop.emphasis || stop.emphasis === 'none') return null;
    if (stop.emphasis === 'indicate') return new Indicate(stop.target);
    const ring = new FocusRing({ scene: this.scene, target: stop.target });
    this._live.rings.push(ring);
    return ring.flash();
  }

  /** Step 3: build the stop's emphasis, callouts and inset and return their entry animations. */
  annotationAnimations(stop: TourStop): Animation[] {
    const anims: Animation[] = [];
    const emphasis = this.emphasisAnimation(stop);
    if (emphasis) anims.push(emphasis);
    for (const c of stop.callouts ?? []) {
      const a = this.resolveAnchor(stop, c.anchor);
      if (!a) continue;
      const callout = new Callout3D({
        ...c,
        scene: this.scene,
        anchor: a.anchor,
        anchorLocal: c.anchorLocal ?? a.local,
      });
      this._live.callouts.push(callout);
      anims.push(callout.create());
    }
    if (stop.inset) {
      const a = this.resolveAnchor(stop, stop.inset.anchor);
      const inset = new InsetPanel({
        ...stop.inset,
        scene: this.scene,
        anchor: a?.anchor,
        anchorLocal: stop.inset.anchorLocal ?? a?.local,
      });
      this._live.insets.push(inset);
      anims.push(inset.create());
    }
    return anims;
  }

  /**
   * Stop every annotation the tour created from following its anchor.
   * Call it when the scene (and any Player timeline) is done.
   */
  dispose(): void {
    const { callouts, insets, rings } = this._live;
    for (const a of [...this._retired, ...callouts, ...insets, ...rings]) a.dispose();
    this._retired = [];
  }

  /** Step 6: fade the live callouts, inset and rings out. */
  exitAnnotations(): Animation[] {
    const anims: Animation[] = [];
    for (const c of this._live.callouts) {
      anims.push(c.uncreate());
    }
    for (const inset of this._live.insets) {
      anims.push(inset.uncreate());
    }
    for (const r of this._live.rings) {
      // The ring is already un-drawn; the fade clears dash leftovers.
      anims.push(r.uncreate({ duration: 0.2 }));
    }
    // Keep them following their anchors: with a Player the whole tour is
    // recorded first and seeked later, so a stop's annotations must still
    // track the camera when the timeline replays it. dispose() ends that.
    this._retired.push(...this._live.callouts, ...this._live.insets, ...this._live.rings);
    this._live = { callouts: [], insets: [], rings: [] };
    return anims;
  }
}
