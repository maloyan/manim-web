/**
 * DNAHelix - a double helix of DNA.
 *
 * The helix is two phosphate backbone strands (parametric helices, half a turn
 * out of phase) plus base-pair "rungs" that connect them at even intervals.
 * The rungs can be colored by base with the A/T/G/C palette, and a nucleotide
 * bead sits where each rung meets a backbone.
 *
 * The helix axis is vertical (the Y axis). A full turn rises by `pitch`, so a
 * helix of `turns` turns has height `turns * pitch`. In 2D schematic mode the
 * strands are two sine waves in the XY plane; in 3D mode they wind around the
 * axis in the Z direction too.
 *
 * Depth cue: even in 2D the helix fakes depth. Each rung and bead gets a
 * "frontness" from the helix angle, so the ones at the back of a turn are
 * thinner and dimmer than the ones at the front. The eye reads the twist as 3D.
 *
 * The helix is a VGroup, so Create and FadeIn animate it directly.
 *
 * @example
 * ```typescript
 * const dna = new DNAHelix({ turns: 3, basePairs: 12 });
 * scene.play(new Create(dna));
 *
 * // A short 3D helix with an explicit sequence.
 * const gene = new DNAHelix({
 *   turns: 2,
 *   basePairs: 8,
 *   threeD: true,
 *   sequence: ['A', 'T', 'G', 'C'],
 * });
 * ```
 */

import { VGroup } from '../../core/VGroup';
import { Vector3Tuple } from '../../core/Mobject';
import { Line } from '../geometry/Line';
import { Circle } from '../geometry/Circle';
import { ParametricFunction } from '../graphing/ParametricFunction';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { baseColor, complementOf, normalizeBase } from './biologyColors';
import { BaseSymbol, DNAHelixOptions, BasePairRender, StrandPair } from './biologyTypes';

/** Default order the bases repeat in when no sequence is given. */
const DEFAULT_SEQUENCE: readonly BaseSymbol[] = ['A', 'T', 'G', 'C'];

/** Default colors of the two backbone strands (a cyan and an orange). */
const DEFAULT_BACKBONE_COLORS: [string, string] = ['#29B6F6', '#FF7043'];

/** Default rung color used when colorByBase is false. */
const DEFAULT_RUNG_COLOR = '#CCCCCC';

/** Opacity of a rung or bead at the back of a turn (frontness 0). */
const BACK_OPACITY = 0.28;
/** Stroke-width multiplier of a rung at the back of a turn (frontness 0). */
const BACK_RUNG_WIDTH_SCALE = 0.5;
/** Stroke-width multiplier of a rung at the front of a turn (frontness 1). */
const FRONT_RUNG_WIDTH_SCALE = 1.35;
/** Radius multiplier of a bead at the back of a turn (frontness 0). */
const BACK_BEAD_RADIUS_SCALE = 0.6;
/** Radius multiplier of a bead at the front of a turn (frontness 1). */
const FRONT_BEAD_RADIUS_SCALE = 1.1;

/** Linear interpolation from a (at 0) to b (at 1). */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class DNAHelix extends VGroup {
  protected _turns: number;
  protected _radius: number;
  protected _pitch: number;
  protected _basePairs: number;
  protected _threeD: boolean;
  protected _colorByBase: boolean;
  protected _sequence: BaseSymbol[];
  protected _backboneColors: [string, string];
  protected _baseColors: Partial<Record<BaseSymbol, string>>;
  protected _rungColor: string;
  protected _strokeWidth: number;
  protected _numSamplesPerTurn: number;
  protected _depthCue: boolean;
  protected _showNucleotides: boolean;
  protected _nucleotideRadius: number;
  protected _backboneStrokeWidth: number;
  protected _rungStrokeWidth: number;

  /** The two strand functions, built once and shared by strands and rungs. */
  protected _strandFuncs: [(t: number) => Vector3Tuple, (t: number) => Vector3Tuple];
  /** The two resolved strands. */
  protected _strands: StrandPair;
  /** The resolved base pairs, from bottom to top. */
  protected _pairs: BasePairRender[] = [];

  /** The base-pair rung mobjects, drawn behind the strands. */
  readonly rungsGroup: VGroup;
  /** The backbone strand mobjects, drawn in front of the rungs. */
  readonly strandsGroup: VGroup;
  /** The nucleotide bead mobjects, drawn on top of the strands. */
  readonly nucleotidesGroup: VGroup;

  constructor(options: DNAHelixOptions = {}) {
    super();

    const {
      turns = 3,
      radius = 0.5,
      pitch = 1,
      basePairs = 12,
      threeD = false,
      colorByBase = true,
      sequence = [],
      backboneColors = DEFAULT_BACKBONE_COLORS,
      baseColors = {},
      rungColor = DEFAULT_RUNG_COLOR,
      strokeWidth = DEFAULT_STROKE_WIDTH,
      numSamplesPerTurn = 48,
      depthCue = true,
      nucleotideRadius,
      backboneStrokeWidth,
      rungStrokeWidth,
    } = options;
    // Flat-disc beads turn edge-on in a rotating 3D view and read as stray
    // ticks, so a 3D helix hides them by default. A 2D helix keeps them.
    const showNucleotides = options.showNucleotides ?? !threeD;

    this._turns = Math.max(0, turns);
    this._radius = radius;
    this._pitch = pitch;
    this._basePairs = Math.max(0, Math.floor(basePairs));
    this._threeD = threeD;
    this._colorByBase = colorByBase;
    this._sequence = sequence.map((b) => normalizeBase(b));
    this._backboneColors = [backboneColors[0], backboneColors[1]];
    this._baseColors = { ...baseColors };
    this._rungColor = rungColor;
    this._strokeWidth = strokeWidth;
    this._numSamplesPerTurn = Math.max(2, numSamplesPerTurn);
    this._depthCue = depthCue;
    this._showNucleotides = showNucleotides;
    this._nucleotideRadius = nucleotideRadius ?? Math.max(0.04, 0.14 * Math.abs(radius));
    // Bold backbone tubes read as the two strands; rungs sit a little thinner.
    this._backboneStrokeWidth = backboneStrokeWidth ?? 1.4 * strokeWidth;
    this._rungStrokeWidth = rungStrokeWidth ?? 0.95 * strokeWidth;

    this._strandFuncs = [this._makeStrandFunc(0), this._makeStrandFunc(Math.PI)];

    this.rungsGroup = new VGroup();
    this.strandsGroup = new VGroup();
    this.nucleotidesGroup = new VGroup();

    this._strands = this._buildStrands();
    this._buildBasePairs();

    // Rungs render behind the backbone strands; beads sit on top of the joins.
    this.add(this.rungsGroup);
    this.add(this.strandsGroup);
    this.add(this.nucleotidesGroup);
  }

  /** Build the parametric position function for one strand at the given phase. */
  protected _makeStrandFunc(phase: number): (t: number) => Vector3Tuple {
    const r = this._radius;
    const p = this._pitch;
    const halfH = (this._turns * p) / 2;
    const threeD = this._threeD;
    return (t: number): Vector3Tuple => {
      const angle = 2 * Math.PI * t + phase;
      const x = r * Math.cos(angle);
      const y = p * t - halfH;
      const z = threeD ? r * Math.sin(angle) : 0;
      return [x, y, z];
    };
  }

  /** Build the two backbone strands as parametric curves and add them. */
  protected _buildStrands(): StrandPair {
    const numSamples = Math.max(2, Math.ceil(this._turns * this._numSamplesPerTurn));
    const tRange: [number, number] = [0, this._turns];
    const strands = this._strandFuncs.map((func, i) => {
      const strand = new ParametricFunction({
        func,
        tRange,
        numSamples,
        color: this._backboneColors[i],
        strokeWidth: this._backboneStrokeWidth,
      });
      this.strandsGroup.add(strand);
      return strand;
    });
    return [strands[0], strands[1]];
  }

  /** The base on the first strand at a base-pair index (sequence or default). */
  protected _baseAt(index: number): BaseSymbol {
    if (this._sequence.length > 0) {
      return this._sequence[index % this._sequence.length];
    }
    return DEFAULT_SEQUENCE[index % DEFAULT_SEQUENCE.length];
  }

  /** The helix parameter (in turns) at a base-pair index, centered in its slot. */
  protected _paramAt(index: number): number {
    if (this._basePairs === 0) {
      return 0;
    }
    return (this._turns * (index + 0.5)) / this._basePairs;
  }

  /**
   * How far toward the viewer the first strand sits at helix parameter t, from
   * 0 (back of a turn) to 1 (front). 0.5 when the depth cue is off, so nothing
   * is dimmed or thinned.
   */
  protected _frontnessAt(t: number): number {
    if (!this._depthCue) {
      return 0.5;
    }
    return (Math.sin(2 * Math.PI * t) + 1) / 2;
  }

  /**
   * The weight (0 at the back of a turn, 1 at the front) that sets a rung's
   * opacity and stroke width.
   *
   * In 3D the renderer already foreshortens a rung that points at the camera
   * and the view can rotate, so a baked front/back cue would fight the real
   * geometry. 3D rungs therefore keep a uniform weight of 1 and let perspective
   * do the work. In 2D, where there is no real depth, the weight follows the
   * frontness so the front rungs read bolder than the back ones.
   */
  protected _rungWeightAt(t: number): number {
    if (this._threeD || !this._depthCue) {
      return 1;
    }
    return this._frontnessAt(t);
  }

  /** Build every base-pair rung and bead, and add them to their groups. */
  protected _buildBasePairs(): void {
    for (let i = 0; i < this._basePairs; i++) {
      const t = this._paramAt(i);
      const base = this._baseAt(i);
      const complement = complementOf(base);
      const start = this._strandFuncs[0](t);
      const end = this._strandFuncs[1](t);
      const color = this._colorByBase ? baseColor(base, this._baseColors) : this._rungColor;
      const frontness = this._frontnessAt(t);
      const rungWeight = this._rungWeightAt(t);

      const line = this._buildRung(start, end, color, rungWeight);
      this.rungsGroup.add(line);

      // The first strand's end has the rung's frontness; the second strand's
      // end is half a turn away, so it has the opposite frontness.
      const startColor = this._colorByBase ? baseColor(base, this._baseColors) : color;
      const endColor = this._colorByBase ? baseColor(complement, this._baseColors) : color;
      const startBead = this._buildBead(start, startColor, frontness);
      const endBead = this._buildBead(end, endColor, 1 - frontness);

      this._pairs.push({
        index: i,
        t,
        base,
        complement,
        start,
        end,
        line,
        color,
        frontness,
        startBead,
        endBead,
      });
    }
  }

  /**
   * Build one rung line at the given weight (0 back, 1 front). A 3D rung always
   * has weight 1 and lets perspective foreshorten it; a 2D rung is thinned and
   * dimmed toward the back so the flat ladder still reads as a twist.
   */
  protected _buildRung(
    start: Vector3Tuple,
    end: Vector3Tuple,
    color: string,
    weight: number,
  ): Line {
    const widthScale = lerp(BACK_RUNG_WIDTH_SCALE, FRONT_RUNG_WIDTH_SCALE, weight);
    const line = new Line({
      start,
      end,
      color,
      strokeWidth: this._rungStrokeWidth * widthScale,
    });
    if (this._depthCue && !this._threeD) {
      line.setStrokeOpacity(lerp(BACK_OPACITY, 1, weight));
    }
    return line;
  }

  /** Build one nucleotide bead at a strand join, sized and dimmed by frontness. */
  protected _buildBead(center: Vector3Tuple, color: string, frontness: number): Circle | null {
    if (!this._showNucleotides) {
      return null;
    }
    const radiusScale = lerp(BACK_BEAD_RADIUS_SCALE, FRONT_BEAD_RADIUS_SCALE, frontness);
    const opacity = this._depthCue ? lerp(BACK_OPACITY, 1, frontness) : 1;
    const bead = new Circle({
      radius: this._nucleotideRadius * radiusScale,
      color,
      fillOpacity: opacity,
      strokeWidth: 0,
    });
    bead.setStrokeOpacity(opacity);
    bead.moveTo(center);
    this.nucleotidesGroup.add(bead);
    return bead;
  }

  // ========== Accessors ==========

  /** Get the two backbone strands, first and second. */
  getStrands(): StrandPair {
    return [this._strands[0], this._strands[1]];
  }

  /** Get one backbone strand by index (0 or 1), or undefined. */
  getStrand(index: number): ParametricFunction | undefined {
    return this._strands[index];
  }

  /** Get all resolved base pairs, from bottom to top. */
  getBasePairs(): BasePairRender[] {
    return [...this._pairs];
  }

  /** Get the resolved base pair at an index, or undefined. */
  getBasePair(index: number): BasePairRender | undefined {
    return this._pairs[index];
  }

  /** The point on a strand (0 or 1) at helix parameter t, in turns. */
  pointOnStrand(strandIndex: number, t: number): Vector3Tuple {
    const func = this._strandFuncs[strandIndex];
    if (!func) {
      return [0, 0, 0];
    }
    return func(t);
  }

  /** The total height of the helix along its axis: turns * pitch. */
  getHelixHeight(): number {
    return this._turns * this._pitch;
  }

  /** The number of base pairs. */
  get numBasePairs(): number {
    return this._pairs.length;
  }

  override copy(): DNAHelix {
    const clone = new DNAHelix({
      turns: this._turns,
      radius: this._radius,
      pitch: this._pitch,
      basePairs: this._basePairs,
      threeD: this._threeD,
      colorByBase: this._colorByBase,
      sequence: [...this._sequence],
      backboneColors: [this._backboneColors[0], this._backboneColors[1]],
      baseColors: { ...this._baseColors },
      rungColor: this._rungColor,
      strokeWidth: this._strokeWidth,
      numSamplesPerTurn: this._numSamplesPerTurn,
      depthCue: this._depthCue,
      showNucleotides: this._showNucleotides,
      nucleotideRadius: this._nucleotideRadius,
      backboneStrokeWidth: this._backboneStrokeWidth,
      rungStrokeWidth: this._rungStrokeWidth,
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
