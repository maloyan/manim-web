/**
 * DNAHelix - a double helix of DNA.
 *
 * The helix is two phosphate backbone strands (parametric helices, half a turn
 * out of phase) plus base-pair "rungs" that connect them at even intervals.
 * The rungs can be colored by base with the A/T/G/C palette, and a nucleotide
 * bead sits where each rung meets a backbone.
 *
 * The helix axis is vertical. A full turn rises by `pitch`, so a helix of
 * `turns` turns has height `turns * pitch`. In 2D schematic mode the axis is Y
 * and the strands are two sine waves in the XY plane. In 3D mode the axis is Z
 * (a ThreeDScene is Z-up), the strands wind around it in the XY plane, and the
 * nucleotide beads are real spheres.
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
import { Sphere } from '../three-d/Sphere';
import { TubeFromPoints } from '../three-d/TubeFromPoints';
import { Bond3D } from '../three-d/Bond3D';
import { ParametricFunction } from '../graphing/ParametricFunction';
import { DEFAULT_STROKE_WIDTH } from '../../constants';
import { logger } from '../../utils/logger';
import { baseColor, complementOf, normalizeBase } from './biologyColors';
import { BaseSymbol, DNAHelixOptions, BasePairRender, StrandPair, Strand } from './biologyTypes';

/** Default order the bases repeat in when no sequence is given. */
const DEFAULT_SEQUENCE: readonly BaseSymbol[] = ['A', 'T', 'G', 'C'];

/** Default colors of the two backbone strands (a cyan and an orange). */
const DEFAULT_BACKBONE_COLORS: [string, string] = ['#29B6F6', '#FF7043'];

/** Default rung color used when colorByBase is false. */
const DEFAULT_RUNG_COLOR = '#CCCCCC';

/** Opacity of a rung or bead at the back of a turn (frontness 0). */
const BACK_OPACITY = 0.4;
/** Stroke-width multiplier of a rung at the back of a turn (frontness 0). */
const BACK_RUNG_WIDTH_SCALE = 0.55;
/** Stroke-width multiplier of a rung at the front of a turn (frontness 1). */
const FRONT_RUNG_WIDTH_SCALE = 1.15;
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
  /** Tube radius of each backbone strand in 3D mode. */
  protected _backboneRadius3D: number;
  /** Cylinder radius of each base-pair rung in 3D mode. */
  protected _rungRadius3D: number;

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
      showNucleotides = true,
      nucleotideRadius,
      backboneStrokeWidth,
    } = options;

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
    this._backboneStrokeWidth = backboneStrokeWidth ?? strokeWidth;
    // Rungs read as a cleaner ladder when a little thinner than the backbone.
    this._rungStrokeWidth = 0.8 * strokeWidth;
    // In 3D the backbone is a solid tube and each rung a solid cylinder, sized
    // relative to the nucleotide beads so the model reads as one molecule.
    this._backboneRadius3D = 0.55 * this._nucleotideRadius;
    this._rungRadius3D = 0.4 * this._nucleotideRadius;

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
      const axis = p * t - halfH;
      if (threeD) {
        // In a ThreeDScene the camera is Z-up, so the helix axis runs along Z
        // and the two strands wind around it in the XY plane. This stands the
        // helix upright on screen instead of laying it on its side.
        return [r * Math.cos(angle), r * Math.sin(angle), axis];
      }
      // 2D schematic: the axis is the vertical Y, the strand is a sine wave in
      // X, and Z stays flat so it reads as a ladder in the XY plane.
      return [r * Math.cos(angle), axis, 0];
    };
  }

  /** Build the two backbone strands and add them. */
  protected _buildStrands(): StrandPair {
    const strands = this._strandFuncs.map((func, i) =>
      this._threeD ? this._buildStrand3D(func, i) : this._buildStrand2D(func, i),
    );
    return [strands[0], strands[1]];
  }

  /** Build one backbone strand as a flat parametric curve (2D schematic mode). */
  protected _buildStrand2D(func: (t: number) => Vector3Tuple, index: number): ParametricFunction {
    const numSamples = Math.max(2, Math.ceil(this._turns * this._numSamplesPerTurn));
    const strand = new ParametricFunction({
      func,
      tRange: [0, this._turns],
      numSamples,
      color: this._backboneColors[index],
      strokeWidth: this._backboneStrokeWidth,
    });
    this.strandsGroup.add(strand);
    return strand;
  }

  /**
   * Build one backbone strand as a solid 3D tube (3D mode). A screen-width
   * stroke looks like flat tape next to the spherical nucleotide beads, so the
   * 3D strand is a real swept tube that catches the light like the beads.
   */
  protected _buildStrand3D(func: (t: number) => Vector3Tuple, index: number): TubeFromPoints {
    const numSamples = Math.max(2, Math.ceil(this._turns * this._numSamplesPerTurn));
    const points: Vector3Tuple[] = [];
    for (let s = 0; s < numSamples; s++) {
      const t = (this._turns * s) / (numSamples - 1);
      points.push(func(t));
    }
    const strand = new TubeFromPoints({
      points,
      radius: this._backboneRadius3D,
      color: this._backboneColors[index],
    });
    this.strandsGroup.add(strand);
    return strand;
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

      const line = this._buildRung(start, end, color, frontness);
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
   * Build one base-pair rung. In 3D it is a solid {@link Bond3D} cylinder with
   * no fake depth cue: real depth testing sorts it, so the sine-of-angle
   * thinning used in 2D would fight the camera instead of helping it. In 2D it
   * is a flat line, dimmed and thinned by its frontness.
   */
  protected _buildRung(
    start: Vector3Tuple,
    end: Vector3Tuple,
    color: string,
    frontness: number,
  ): Line | Bond3D {
    if (this._threeD) {
      return new Bond3D({
        start,
        end,
        color,
        radius: this._rungRadius3D,
      });
    }
    const widthScale = lerp(BACK_RUNG_WIDTH_SCALE, FRONT_RUNG_WIDTH_SCALE, frontness);
    const line = new Line({
      start,
      end,
      color,
      strokeWidth: this._rungStrokeWidth * widthScale,
    });
    if (this._depthCue) {
      line.setStrokeOpacity(lerp(BACK_OPACITY, 1, frontness));
    }
    return line;
  }

  /** Build one nucleotide bead at a strand join, sized and dimmed by frontness. */
  protected _buildBead(
    center: Vector3Tuple,
    color: string,
    frontness: number,
  ): Circle | Sphere | null {
    if (!this._showNucleotides) {
      return null;
    }
    // In 3D the beads are real spheres, so the depth test (not a fake dimming)
    // sorts them. They keep a full size and opacity and read as nucleotides.
    if (this._threeD) {
      const bead = new Sphere({
        radius: this._nucleotideRadius,
        color,
        center,
        resolution: 16,
      });
      this.nucleotidesGroup.add(bead);
      return bead;
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
  getStrand(index: number): Strand | undefined {
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

  /**
   * The point on a strand (0 or 1) at helix parameter t, in turns.
   *
   * A strand index other than 0 or 1 is a caller error: it warns and returns
   * the origin, so a bad index is visible instead of silently feeding a
   * `[0,0,0]` point into downstream geometry.
   */
  pointOnStrand(strandIndex: number, t: number): Vector3Tuple {
    const func = this._strandFuncs[strandIndex];
    if (!func) {
      logger.warn(
        `DNAHelix.pointOnStrand: strand index ${strandIndex} is out of range (expected 0 or 1); returning the origin.`,
      );
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
    });
    this._copyBaseAttributesInto(clone, { copyChildren: false });
    return clone;
  }
}
