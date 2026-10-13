/**
 * Protein - a 3D protein backbone trace.
 *
 * A protein chain is drawn from its alpha-carbon (CA) positions, one per
 * residue (see {@link parsePdb} and {@link ResidueCA}). Protein is a
 * {@link Group} that holds either a smooth {@link TubeFromPoints} ribbon or a
 * {@link Line3D} backbone polyline. Each residue span gets its own primitive so
 * the chain can be colored per residue, per secondary structure or as a
 * rainbow, even though a single tube carries one color.
 *
 * @example
 * ```typescript
 * const { residues } = parsePdb(pdbText);
 * const protein = new Protein({ residues, representation: 'tube', colorMode: 'secondary-structure' });
 * scene.add(protein);
 * ```
 */

import * as THREE from 'three';
import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { TubeFromPoints } from '../three-d/TubeFromPoints';
import { Line3D } from '../three-d/Line3D';
import { ResidueCA, SecondaryStructure } from './pdb';
import { residueColor } from '../biology/biologyColors';
import { ColorScale } from '../geo/colorScale';

/** How the protein backbone is drawn. */
export type ProteinRepresentation = 'backbone-line' | 'tube';

/** How the protein backbone is colored. */
export type ProteinColorMode = 'residue' | 'secondary-structure' | 'rainbow' | 'uniform';

/** Options for a {@link Protein}. */
export interface ProteinOptions {
  /** The residues, one CA each, in chain order. At least two. */
  residues: ResidueCA[];
  /** The backbone representation. Default: `'tube'`. */
  representation?: ProteinRepresentation;
  /** The color mode. Default: `'secondary-structure'`. */
  colorMode?: ProteinColorMode;
  /** Color overrides, keyed by residue code (residue mode) or SS name (SS mode). */
  colors?: Record<string, string>;
  /** Tube radius for the `'tube'` representation. Default: 0.3. */
  tubeRadius?: number;
  /** Catmull-Rom subdivisions per residue span. Default: 6. */
  smoothing?: number;
  /** Line width for the `'backbone-line'` representation. Default: 4. */
  lineWidth?: number;
  /** Color for the `'uniform'` mode. Default: `'#4f8ac9'`. */
  uniformColor?: string;
  /** Secondary-structure colors. Missing entries fall back to the defaults. */
  ssColors?: { helix?: string; sheet?: string; coil?: string };
  /** World scale applied to every CA coordinate. Default: 1. */
  scale?: number;
}

/** Default secondary-structure colors: helix red, sheet yellow, coil grey. */
const DEFAULT_SS_COLORS: Record<SecondaryStructure, string> = {
  helix: '#ff5d5d',
  sheet: '#ffd23f',
  coil: '#b0bec5',
};

/** Default color for the `'uniform'` mode. */
const DEFAULT_UNIFORM_COLOR = '#4f8ac9';

/**
 * A spectral rainbow ramp (blue to red), sampled by residue index in rainbow
 * mode so the chain reads N-to-C as a continuous spectrum.
 */
const RAINBOW_COLORS = [
  '#5e4fa2',
  '#3288bd',
  '#66c2a5',
  '#abdda4',
  '#e6f598',
  '#fee08b',
  '#fdae61',
  '#f46d43',
  '#d53e4f',
  '#9e0142',
];

/** The fully resolved {@link ProteinOptions}, with every default applied. */
interface ResolvedProteinOptions {
  residues: ResidueCA[];
  representation: ProteinRepresentation;
  colorMode: ProteinColorMode;
  colors: Record<string, string>;
  tubeRadius: number;
  smoothing: number;
  lineWidth: number;
  uniformColor: string;
  ssColors: Record<SecondaryStructure, string>;
  worldScale: number;
}

/** Apply every default to the raw options so the constructor stays simple. */
function resolveProteinOptions(options: ProteinOptions): ResolvedProteinOptions {
  return {
    residues: options.residues.map((r) => ({ ...r, ca: [...r.ca] as Vector3Tuple })),
    representation: options.representation ?? 'tube',
    colorMode: options.colorMode ?? 'secondary-structure',
    colors: { ...(options.colors ?? {}) },
    tubeRadius: options.tubeRadius ?? 0.3,
    smoothing: Math.max(1, options.smoothing ?? 6),
    lineWidth: options.lineWidth ?? 4,
    uniformColor: options.uniformColor ?? DEFAULT_UNIFORM_COLOR,
    ssColors: {
      helix: options.ssColors?.helix ?? DEFAULT_SS_COLORS.helix,
      sheet: options.ssColors?.sheet ?? DEFAULT_SS_COLORS.sheet,
      coil: options.ssColors?.coil ?? DEFAULT_SS_COLORS.coil,
    },
    worldScale: options.scale ?? 1,
  };
}

export class Protein extends Group {
  private readonly _residues: ResidueCA[];
  private readonly _representation: ProteinRepresentation;
  private readonly _colorMode: ProteinColorMode;
  private readonly _colors: Record<string, string>;
  private readonly _tubeRadius: number;
  private readonly _smoothing: number;
  private readonly _lineWidth: number;
  private readonly _uniformColor: string;
  private readonly _ssColors: Record<SecondaryStructure, string>;
  private readonly _worldScale: number;

  /** The scaled CA positions, one per residue. */
  private readonly _caPoints: Vector3Tuple[];
  /** The rainbow scale over residue index. */
  private readonly _rainbowScale: ColorScale;

  constructor(options: ProteinOptions) {
    super();

    if (!options.residues || options.residues.length < 2) {
      throw new Error(
        `Protein requires at least two residues, received ${options.residues?.length ?? 0}.`,
      );
    }

    const resolved = resolveProteinOptions(options);
    this._residues = resolved.residues;
    this._representation = resolved.representation;
    this._colorMode = resolved.colorMode;
    this._colors = resolved.colors;
    this._tubeRadius = resolved.tubeRadius;
    this._smoothing = resolved.smoothing;
    this._lineWidth = resolved.lineWidth;
    this._uniformColor = resolved.uniformColor;
    this._ssColors = resolved.ssColors;
    this._worldScale = resolved.worldScale;

    const s = this._worldScale;
    this._caPoints = this._residues.map((r) => [r.ca[0] * s, r.ca[1] * s, r.ca[2] * s]);
    this._rainbowScale = new ColorScale({
      colors: RAINBOW_COLORS,
      domain: [0, Math.max(1, this._residues.length - 1)],
    });

    this._build();
  }

  /** Build the backbone primitives, one per residue span. */
  private _build(): void {
    if (this._representation === 'backbone-line') {
      this._buildBackboneLine();
    } else {
      this._buildTube();
    }
  }

  /** One {@link Line3D} per adjacent CA pair, colored by the span's residue. */
  private _buildBackboneLine(): void {
    for (let i = 0; i < this._caPoints.length - 1; i++) {
      this.add(
        new Line3D({
          start: this._caPoints[i],
          end: this._caPoints[i + 1],
          color: this.colorForResidue(i),
          lineWidth: this._lineWidth,
        }),
      );
    }
  }

  /**
   * One {@link TubeFromPoints} per residue span, sampled from a single
   * Catmull-Rom curve fit through every CA point so the spans join smoothly.
   */
  private _buildTube(): void {
    const curve = new THREE.CatmullRomCurve3(
      this._caPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    );
    const n = this._caPoints.length;
    for (let i = 0; i < n - 1; i++) {
      const t0 = i / (n - 1);
      const t1 = (i + 1) / (n - 1);
      const points: Vector3Tuple[] = [];
      for (let k = 0; k <= this._smoothing; k++) {
        const t = t0 + ((t1 - t0) * k) / this._smoothing;
        const p = curve.getPoint(t);
        points.push([p.x, p.y, p.z]);
      }
      this.add(
        new TubeFromPoints({
          points,
          radius: this._tubeRadius,
          color: this.colorForResidue(i),
          smoothing: 1,
        }),
      );
    }
  }

  // ========== Accessors ==========

  /** The number of residues. */
  getResidueCount(): number {
    return this._residues.length;
  }

  /** The scaled CA positions, one per residue. */
  getCAPoints(): Vector3Tuple[] {
    return this._caPoints.map((p) => [...p] as Vector3Tuple);
  }

  /**
   * The resolved color used for a residue, per the active color mode.
   *
   * @param index - The residue index.
   * @returns The hex color string.
   */
  colorForResidue(index: number): string {
    const residue = this._residues[index];
    switch (this._colorMode) {
      case 'residue':
        return residueColor(residue.code, this._colors);
      case 'rainbow':
        return this._rainbowScale.colorFor(index);
      case 'uniform':
        return this._uniformColor;
      case 'secondary-structure':
      default: {
        const ss = residue.ss ?? 'coil';
        return this._colors[ss] ?? this._ssColors[ss];
      }
    }
  }

  override copy(): Protein {
    const copy = new Protein({
      residues: this._residues.map((r) => ({ ...r, ca: [...r.ca] as Vector3Tuple })),
      representation: this._representation,
      colorMode: this._colorMode,
      colors: { ...this._colors },
      tubeRadius: this._tubeRadius,
      smoothing: this._smoothing,
      lineWidth: this._lineWidth,
      uniformColor: this._uniformColor,
      ssColors: { ...this._ssColors },
      scale: this._worldScale,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
