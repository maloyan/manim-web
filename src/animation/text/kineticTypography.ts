/**
 * Kinetic-typography preset animations.
 *
 * A pack of ready-made per-glyph text animations. Each preset is a pure
 * factory that returns an Animation, so `scene.play(fadeInByLetter(text))`
 * works directly. Presets stagger an effect across a Text's glyph
 * submobjects, reusing the existing FadeIn, GrowFromCenter and LaggedStart
 * animations where possible.
 *
 * Glyph resolution: a Text is a single textured mobject and has no glyph
 * children until `loadGlyphs()` builds a TextGlyphGroup. The presets read the
 * mobject's `submobjects`; when there are none, they fall back to animating
 * the whole mobject as one glyph. So a plain or empty Text animates as a unit
 * without throwing, and a glyph group (or any VGroup) animates per child.
 */

import * as THREE from 'three';
import { Mobject, Vector3Tuple } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';
import { AnimationGroup } from '../AnimationGroup';
import { LaggedStart } from '../LaggedStart';
import { FadeIn } from '../fading/FadeIn';
import { GrowFromCenter } from '../movement/Scale';
import type { RateFunction } from '../../rate-functions';

/** Options shared by the staggered entrance presets. */
export interface KineticTypographyOptions {
  /** Stagger between consecutive glyphs. 0 = all together, 1 = sequential. */
  lagRatio?: number;
  /** Duration of each glyph's sub-animation, in seconds. */
  runTime?: number;
  /** Rate function for each glyph's sub-animation. */
  rateFunc?: RateFunction;
}

/**
 * Resolve the glyphs to animate.
 * Returns the mobject's submobjects when present, otherwise the mobject
 * itself as a single glyph. This keeps every preset safe for a plain or
 * empty Text (one glyph, no throw).
 */
export function resolveGlyphs(target: Mobject): Mobject[] {
  const subs = target.submobjects;
  return subs.length > 0 ? subs : [target];
}

/** Build AnimationOptions for one glyph's sub-animation. */
function glyphOptions(options: KineticTypographyOptions, defaultRunTime: number): AnimationOptions {
  const result: AnimationOptions = { duration: options.runTime ?? defaultRunTime };
  if (options.rateFunc) {
    result.rateFunc = options.rateFunc;
  }
  return result;
}

/**
 * typeOn - reveal glyphs one after another (typewriter style).
 * Each glyph fades in; the default lagRatio is 1 (fully sequential).
 */
export function typeOn(text: Mobject, options: KineticTypographyOptions = {}): LaggedStart {
  const glyphs = resolveGlyphs(text);
  const anims = glyphs.map((glyph) => new FadeIn(glyph, glyphOptions(options, 0.15)));
  return new LaggedStart(anims, { lagRatio: options.lagRatio ?? 1 });
}

/**
 * fadeInByLetter - fade each glyph in with an overlapping stagger.
 */
export function fadeInByLetter(text: Mobject, options: KineticTypographyOptions = {}): LaggedStart {
  const glyphs = resolveGlyphs(text);
  const anims = glyphs.map((glyph) => new FadeIn(glyph, glyphOptions(options, 0.5)));
  return new LaggedStart(anims, { lagRatio: options.lagRatio ?? 0.1 });
}

/** Count the glyphs (non-space characters) in each whitespace-delimited word. */
function wordGlyphCounts(text: string): number[] {
  return text
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.length);
}

/** A mobject that exposes its source string. */
interface TextLike {
  getText(): string;
}

/** Type guard for mobjects that expose getText(). */
function hasGetText(target: Mobject): target is Mobject & TextLike {
  return (
    'getText' in target && typeof (target as Mobject & Partial<TextLike>).getText === 'function'
  );
}

/**
 * Group glyphs into words using the source string when the glyph count
 * matches the non-space character count; otherwise treat all glyphs as one
 * word. This keeps the preset safe for a plain Text (one group, no throw).
 */
function groupGlyphsByWord(text: Mobject, glyphs: Mobject[]): Mobject[][] {
  if (!hasGetText(text)) {
    return [glyphs];
  }
  const counts = wordGlyphCounts(text.getText());
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (counts.length === 0 || total !== glyphs.length) {
    return [glyphs];
  }
  const groups: Mobject[][] = [];
  let index = 0;
  for (const count of counts) {
    groups.push(glyphs.slice(index, index + count));
    index += count;
  }
  return groups;
}

/**
 * fadeInByWord - fade glyphs in word by word. Glyphs of a word fade together;
 * consecutive words are staggered by lagRatio.
 */
export function fadeInByWord(text: Mobject, options: KineticTypographyOptions = {}): LaggedStart {
  const glyphs = resolveGlyphs(text);
  const words = groupGlyphsByWord(text, glyphs);
  const wordAnims = words.map(
    (word) =>
      new AnimationGroup(
        word.map((glyph) => new FadeIn(glyph, glyphOptions(options, 0.4))),
        { lagRatio: 0 },
      ),
  );
  return new LaggedStart(wordAnims, { lagRatio: options.lagRatio ?? 0.3 });
}

/** Options for riseByLetter. */
export interface RiseByLetterOptions extends KineticTypographyOptions {
  /** Distance each glyph travels while fading in. Default: 0.5. */
  distance?: number;
  /** Unit direction of travel. Default: up [0, 1, 0]. */
  direction?: Vector3Tuple;
}

/**
 * riseByLetter - each glyph slides in along a direction while fading in.
 * Reuses FadeIn's shift option, so glyphs start displaced opposite to the
 * direction and settle at their base position.
 */
export function riseByLetter(text: Mobject, options: RiseByLetterOptions = {}): LaggedStart {
  const glyphs = resolveGlyphs(text);
  const distance = options.distance ?? 0.5;
  const direction = options.direction ?? [0, 1, 0];
  const shift: [number, number, number] = [
    direction[0] * distance,
    direction[1] * distance,
    direction[2] * distance,
  ];
  const anims = glyphs.map((glyph) => new FadeIn(glyph, { ...glyphOptions(options, 0.5), shift }));
  return new LaggedStart(anims, { lagRatio: options.lagRatio ?? 0.1 });
}

/** easeOutBack - overshoots past 1 then settles, giving a "pop". */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * scalePopByLetter - each glyph grows from zero scale with an overshoot and
 * fades in, giving a springy "pop".
 */
export function scalePopByLetter(
  text: Mobject,
  options: KineticTypographyOptions = {},
): LaggedStart {
  const glyphs = resolveGlyphs(text);
  const runTime = options.runTime ?? 0.5;
  const rateFunc = options.rateFunc ?? easeOutBack;
  const anims = glyphs.map(
    (glyph) =>
      new AnimationGroup(
        [
          new GrowFromCenter(glyph, { duration: runTime, rateFunc }),
          new FadeIn(glyph, { duration: runTime }),
        ],
        { lagRatio: 0 },
      ),
  );
  return new LaggedStart(anims, { lagRatio: options.lagRatio ?? 0.1 });
}

/** Options for waveLetters. */
export interface WaveLettersOptions extends AnimationOptions {
  /** Peak displacement of the wave. Default: 0.2. */
  amplitude?: number;
  /** Number of full oscillation cycles over the run. Default: 2. */
  waves?: number;
  /** Phase offset between consecutive glyphs, in radians. Default: PI/3. */
  phase?: number;
  /** Unit direction of displacement. Default: up [0, 1, 0]. */
  direction?: Vector3Tuple;
}

/**
 * WaveLetters - an emphasis effect. Each glyph oscillates along a direction
 * with a per-glyph phase offset, so the group ripples like a wave. An
 * envelope brings every glyph back to its base position at both ends, so
 * interpolate(0) and interpolate(1) leave the glyphs unmoved.
 */
export class WaveLetters extends Animation {
  private readonly amplitude: number;
  private readonly waves: number;
  private readonly phase: number;
  private readonly direction: Vector3Tuple;
  private _glyphs: Mobject[] = [];
  private _basePositions: THREE.Vector3[] = [];

  constructor(mobject: Mobject, options: WaveLettersOptions = {}) {
    super(mobject, options);
    this.amplitude = options.amplitude ?? 0.2;
    this.waves = options.waves ?? 2;
    this.phase = options.phase ?? Math.PI / 3;
    this.direction = options.direction ?? [0, 1, 0];
  }

  override begin(): void {
    super.begin();
    this._glyphs = resolveGlyphs(this.mobject);
    this._basePositions = this._glyphs.map((glyph) => glyph.position.clone());
  }

  interpolate(alpha: number): void {
    const envelope = Math.sin(Math.PI * alpha);
    for (let i = 0; i < this._glyphs.length; i++) {
      const wave = Math.sin(2 * Math.PI * this.waves * alpha + i * this.phase);
      const offset = this.amplitude * envelope * wave;
      const base = this._basePositions[i];
      this._glyphs[i].position.set(
        base.x + this.direction[0] * offset,
        base.y + this.direction[1] * offset,
        base.z + this.direction[2] * offset,
      );
      this._glyphs[i]._markDirty();
    }
  }
}

/**
 * waveLetters - create a WaveLetters emphasis animation.
 */
export function waveLetters(text: Mobject, options?: WaveLettersOptions): WaveLetters {
  return new WaveLetters(text, options);
}

/** Options for tracking / spreadOut. */
export interface LetterSpacingOptions extends AnimationOptions {
  /** Target extra spacing per step from the center glyph. Default: 0.3. */
  spacing?: number;
  /** Start spacing per step. Default: 0. */
  from?: number;
  /** Unit direction glyphs spread along. Default: right [1, 0, 0]. */
  direction?: Vector3Tuple;
}

/**
 * LetterSpacing - animate the tracking (letter spacing) of the glyphs. Glyphs
 * move symmetrically about the center index, so the center glyph stays put and
 * the edges move furthest. Interpolates the per-step spacing from `from` to
 * `spacing`.
 */
export class LetterSpacing extends Animation {
  private readonly fromSpacing: number;
  private readonly toSpacing: number;
  private readonly direction: Vector3Tuple;
  private _glyphs: Mobject[] = [];
  private _basePositions: THREE.Vector3[] = [];

  constructor(mobject: Mobject, options: LetterSpacingOptions = {}) {
    super(mobject, options);
    this.fromSpacing = options.from ?? 0;
    this.toSpacing = options.spacing ?? 0.3;
    this.direction = options.direction ?? [1, 0, 0];
  }

  override begin(): void {
    super.begin();
    this._glyphs = resolveGlyphs(this.mobject);
    this._basePositions = this._glyphs.map((glyph) => glyph.position.clone());
  }

  interpolate(alpha: number): void {
    const count = this._glyphs.length;
    const center = (count - 1) / 2;
    const spacing = this.fromSpacing + (this.toSpacing - this.fromSpacing) * alpha;
    for (let i = 0; i < count; i++) {
      const offset = spacing * (i - center);
      const base = this._basePositions[i];
      this._glyphs[i].position.set(
        base.x + this.direction[0] * offset,
        base.y + this.direction[1] * offset,
        base.z + this.direction[2] * offset,
      );
      this._glyphs[i]._markDirty();
    }
  }
}

/**
 * tracking - animate the glyphs' letter spacing from `from` to `spacing`.
 */
export function tracking(text: Mobject, options?: LetterSpacingOptions): LetterSpacing {
  return new LetterSpacing(text, options);
}

/**
 * spreadOut - spread the glyphs apart from their base positions.
 */
export function spreadOut(text: Mobject, options: LetterSpacingOptions = {}): LetterSpacing {
  return new LetterSpacing(text, { ...options, from: options.from ?? 0 });
}

/** Options for glitchIn. */
export interface GlitchInOptions extends AnimationOptions {
  /** Peak position jitter at the start of each glyph's reveal. Default: 0.15. */
  amplitude?: number;
  /** Per-glyph stagger. 0 = all together, 1 = sequential. Default: 0.1. */
  lagRatio?: number;
}

/** Deterministic pseudo-random value in [0, 1) from an integer seed. */
function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * GlitchIn - a glitchy entrance. Each glyph starts invisible and jittered,
 * then flickers into place. The jitter is deterministic (seeded by glyph
 * index), decays to zero, and the opacity reaches 1 exactly at the end. Glyphs
 * are staggered by lagRatio via getSubAlpha.
 */
export class GlitchIn extends Animation {
  private readonly amplitude: number;
  private readonly lagRatio: number;
  private _glyphs: Mobject[] = [];
  private _basePositions: THREE.Vector3[] = [];

  constructor(mobject: Mobject, options: GlitchInOptions = {}) {
    super(mobject, options);
    this.amplitude = options.amplitude ?? 0.15;
    this.lagRatio = options.lagRatio ?? 0.1;
  }

  override begin(): void {
    super.begin();
    this._glyphs = resolveGlyphs(this.mobject);
    this._basePositions = this._glyphs.map((glyph) => glyph.position.clone());
    for (const glyph of this._glyphs) {
      glyph.opacity = 0;
    }
  }

  interpolate(alpha: number): void {
    const count = this._glyphs.length;
    for (let i = 0; i < count; i++) {
      const local = this.getSubAlpha(alpha, i, count, this.lagRatio);
      const base = this._basePositions[i];
      const amount = this.amplitude * (1 - local);
      const jitterX = (pseudoRandom(i * 3 + 1) * 2 - 1) * amount;
      const jitterY = (pseudoRandom(i * 3 + 2) * 2 - 1) * amount;
      this._glyphs[i].position.set(base.x + jitterX, base.y + jitterY, base.z);
      const flicker = pseudoRandom(i * 7 + Math.floor(local * 17));
      this._glyphs[i].opacity = local >= 1 ? 1 : Math.min(1, local * (0.5 + flicker));
      this._glyphs[i]._markDirty();
    }
  }
}

/**
 * glitchIn - create a GlitchIn entrance animation.
 */
export function glitchIn(text: Mobject, options?: GlitchInOptions): GlitchIn {
  return new GlitchIn(text, options);
}
