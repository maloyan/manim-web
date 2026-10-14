/**
 * Molecule3D - a 3D molecule renderer.
 *
 * A molecule is a node-link structure: atoms are spheres at explicit 3D
 * coordinates, bonds are sticks between atom indices. Molecule3D is a
 * {@link Group} that holds a {@link Sphere} per atom (in {@link atomsGroup})
 * and {@link Bond3D} sticks per bond (in {@link bondsGroup}).
 *
 * Three render styles are supported:
 *  - `ball-and-stick`: small spheres plus split-colored bond sticks (default).
 *  - `space-filling`: large van der Waals spheres, no bonds.
 *  - `wireframe`: tiny spheres plus thin bond sticks.
 *
 * @example
 * ```typescript
 * const water = new Molecule3D({
 *   atoms: [
 *     { element: 'O', position: [0, 0, 0] },
 *     { element: 'H', position: [0.76, 0.59, 0] },
 *     { element: 'H', position: [-0.76, 0.59, 0] },
 *   ],
 *   bonds: [
 *     { from: 0, to: 1 },
 *     { from: 0, to: 2 },
 *   ],
 * });
 * scene.add(water);
 * ```
 */

import { Group } from '../../core/Group';
import { Vector3Tuple } from '../../core/Mobject';
import { Sphere } from '../three-d/Sphere';
import { Bond3D } from '../three-d/Bond3D';
import { cpkColor } from '../chemistry/cpkColors';
import { covalentRadius, vdwRadius } from './elementRadii';
import { logger } from '../../utils/logger';

/** A single atom: an element symbol and its 3D position (before the world scale). */
export interface Atom3DSpec {
  /** Element symbol, any case (e.g. 'C', 'o', 'Cl'). */
  element: string;
  /** Position `[x, y, z]`, in the molecule's own coordinates. */
  position: Vector3Tuple;
  /**
   * The chain identifier this atom belongs to, if known (from a PDB parse).
   * Optional and ignored by rendering; it exists for selection and grouping.
   */
  chain?: string;
  /**
   * The residue sequence number this atom belongs to, if known.
   * Optional and ignored by rendering; it exists for selection and grouping.
   */
  resSeq?: number;
  /**
   * The residue name this atom belongs to, if known (3-letter, e.g. 'ALA').
   * Optional and ignored by rendering; it exists for selection and grouping.
   */
  resName?: string;
}

/** A single bond between two atoms, by their index in the atoms array. */
export interface Bond3DSpec {
  /** Index of the first atom. */
  from: number;
  /** Index of the second atom. */
  to: number;
  /** Bond order: 1 (single), 2 (double) or 3 (triple). Default: 1. */
  order?: 1 | 2 | 3;
}

/** A render style for a {@link Molecule3D}. */
export type MoleculeStyle = 'ball-and-stick' | 'space-filling' | 'wireframe';

/** A rendered atom: the resolved color, radius and the {@link Sphere} mobject. */
export interface Atom3DRender {
  /** The element symbol as given in the spec. */
  element: string;
  /** The world position `[x, y, z]` (after the world scale). */
  position: Vector3Tuple;
  /** The resolved CPK color. */
  color: string;
  /** The resolved sphere radius in scene units. */
  radius: number;
  /** The sphere mobject for this atom. */
  sphere: Sphere;
}

/** A rendered bond: its atom indices, order and the {@link Bond3D} sticks. */
export interface Bond3DRender {
  /** Index of the first atom. */
  from: number;
  /** Index of the second atom. */
  to: number;
  /** The bond order. */
  order: 1 | 2 | 3;
  /** The one, two or three parallel sticks that draw this bond. */
  sticks: Bond3D[];
}

/** Options for a {@link Molecule3D}. */
export interface Molecule3DOptions {
  /** The atoms. */
  atoms: Atom3DSpec[];
  /** The bonds. Default: `[]`. */
  bonds?: Bond3DSpec[];
  /** The render style. Default: `'ball-and-stick'`. */
  style?: MoleculeStyle;
  /** Per-element CPK color overrides. */
  colors?: Record<string, string>;
  /** Radius scheme. Default: `'covalent'` (`'vdw'` for space-filling). */
  radiusScheme?: 'uniform' | 'vdw' | 'covalent';
  /** Radius used by the `'uniform'` scheme. Default: 0.3. */
  atomRadius?: number;
  /**
   * Multiplier on the table radius for the `'covalent'` / `'vdw'` schemes.
   * Default: 0.25 (ball-and-stick), 1.0 (space-filling), 0.18 (wireframe).
   */
  radiusScale?: number;
  /** Bond stick radius. Default: 0.08 (0.02 for wireframe). */
  bondRadius?: number;
  /** When set, every bond uses this color; otherwise bonds split per atom. */
  bondColor?: string;
  /** Sphere mesh resolution. Default: 24. */
  sphereResolution?: number;
  /** World scale applied to every atom coordinate. Default: 1. */
  scale?: number;
}

/** The default radius used by the `'uniform'` scheme. */
const DEFAULT_ATOM_RADIUS = 0.3;
/** The default sphere mesh resolution. */
const DEFAULT_SPHERE_RESOLUTION = 24;

/** The default radius scale per style. */
function defaultRadiusScale(style: MoleculeStyle): number {
  if (style === 'space-filling') {
    return 1.0;
  }
  if (style === 'wireframe') {
    return 0.18;
  }
  return 0.25; // ball-and-stick
}

/** The default bond radius per style. */
function defaultBondRadius(style: MoleculeStyle): number {
  return style === 'wireframe' ? 0.02 : 0.08;
}

/**
 * A unit vector perpendicular to the direction from `start` to `end`.
 *
 * Used to offset the parallel sticks of a double or triple bond. The reference
 * axis is chosen so it is never parallel to the bond direction. A zero-length
 * bond returns the zero vector.
 */
function perpendicular3D(start: Vector3Tuple, end: Vector3Tuple): Vector3Tuple {
  const dir: Vector3Tuple = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len === 0) {
    return [0, 0, 0];
  }
  const d: Vector3Tuple = [dir[0] / len, dir[1] / len, dir[2] / len];
  // Pick a reference axis that is not parallel to the bond direction.
  const ref: Vector3Tuple = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  // perp = normalize(d x ref)
  const perp: Vector3Tuple = [
    d[1] * ref[2] - d[2] * ref[1],
    d[2] * ref[0] - d[0] * ref[2],
    d[0] * ref[1] - d[1] * ref[0],
  ];
  const plen = Math.hypot(perp[0], perp[1], perp[2]) || 1;
  return [perp[0] / plen, perp[1] / plen, perp[2] / plen];
}

export class Molecule3D extends Group {
  /** The atom specs as given. */
  private readonly _atomSpecs: Atom3DSpec[];
  /** The bond specs as given. */
  private readonly _bondSpecs: Bond3DSpec[];
  private readonly _moleculeStyle: MoleculeStyle;
  private readonly _colors: Record<string, string>;
  private readonly _radiusScheme: 'uniform' | 'vdw' | 'covalent';
  private readonly _atomRadius: number;
  private readonly _radiusScale: number;
  private readonly _bondRadius: number;
  private readonly _bondColor?: string;
  private readonly _sphereResolution: number;
  private readonly _worldScale: number;

  /** Resolved atoms, parallel to the atom specs. */
  private readonly _atoms: Atom3DRender[] = [];
  /** Resolved bonds, in input order, with out-of-range bonds skipped. */
  private readonly _bonds: Bond3DRender[] = [];

  /** The sphere mobjects, one per atom. */
  readonly atomsGroup: Group;
  /** The bond stick mobjects. */
  readonly bondsGroup: Group;

  constructor(options: Molecule3DOptions) {
    super();

    const style = options.style ?? 'ball-and-stick';
    this._moleculeStyle = style;
    this._atomSpecs = options.atoms.map((a) => ({ element: a.element, position: [...a.position] }));
    this._bondSpecs = (options.bonds ?? []).map((b) => ({ ...b }));
    this._colors = { ...(options.colors ?? {}) };
    // Space-filling defaults to van der Waals radii; other styles to covalent.
    this._radiusScheme = options.radiusScheme ?? (style === 'space-filling' ? 'vdw' : 'covalent');
    this._atomRadius = options.atomRadius ?? DEFAULT_ATOM_RADIUS;
    this._radiusScale = options.radiusScale ?? defaultRadiusScale(style);
    this._bondRadius = options.bondRadius ?? defaultBondRadius(style);
    this._bondColor = options.bondColor;
    this._sphereResolution = options.sphereResolution ?? DEFAULT_SPHERE_RESOLUTION;
    this._worldScale = options.scale ?? 1;

    this.atomsGroup = new Group();
    this.bondsGroup = new Group();

    this._buildAtoms();
    this._buildBonds();

    this.add(this.bondsGroup);
    this.add(this.atomsGroup);
  }

  /** The resolved radius for an element, per the active radius scheme. */
  private _atomRadiusFor(element: string): number {
    switch (this._radiusScheme) {
      case 'uniform':
        return this._atomRadius;
      case 'vdw':
        return vdwRadius(element) * this._radiusScale;
      case 'covalent':
      default:
        return covalentRadius(element) * this._radiusScale;
    }
  }

  /** Build a sphere for every atom and add it to {@link atomsGroup}. */
  private _buildAtoms(): void {
    const s = this._worldScale;
    for (const spec of this._atomSpecs) {
      const position: Vector3Tuple = [
        spec.position[0] * s,
        spec.position[1] * s,
        spec.position[2] * s,
      ];
      const color = cpkColor(spec.element, this._colors);
      const radius = this._atomRadiusFor(spec.element);
      const sphere = new Sphere({
        radius,
        center: position,
        color,
        resolution: this._sphereResolution,
      });
      this.atomsGroup.add(sphere);
      this._atoms.push({ element: spec.element, position, color, radius, sphere });
    }
  }

  /**
   * Build every bond and add its sticks to {@link bondsGroup}.
   *
   * Space-filling draws no bonds. A bond that references an out-of-range atom
   * index is skipped and logged via {@link logger}.
   */
  private _buildBonds(): void {
    if (this._moleculeStyle === 'space-filling') {
      return;
    }
    for (const spec of this._bondSpecs) {
      const fromAtom = this._atoms[spec.from];
      const toAtom = this._atoms[spec.to];
      if (!fromAtom || !toAtom) {
        logger.warn(
          `Molecule3D: bond references out-of-range atom index (from=${spec.from}, to=${spec.to}); skipping.`,
        );
        continue;
      }
      const order = spec.order ?? 1;
      const sticks = this._buildBondSticks(fromAtom, toAtom, order);
      for (const stick of sticks) {
        this.bondsGroup.add(stick);
      }
      this._bonds.push({ from: spec.from, to: spec.to, order, sticks });
    }
  }

  /**
   * Build the one, two or three parallel sticks for a bond.
   *
   * A single bond is one stick on the bond axis. A double/triple bond is two or
   * three sticks offset symmetrically about the axis along a perpendicular.
   */
  private _buildBondSticks(
    fromAtom: Atom3DRender,
    toAtom: Atom3DRender,
    order: 1 | 2 | 3,
  ): Bond3D[] {
    const start = fromAtom.position;
    const end = toAtom.position;
    const spacing = this._bondRadius * 2.5;
    let offsets: number[];
    if (order === 2) {
      offsets = [-spacing / 2, spacing / 2];
    } else if (order === 3) {
      offsets = [-spacing, 0, spacing];
    } else {
      offsets = [0];
    }
    const perp = offsets.length > 1 ? perpendicular3D(start, end) : ([0, 0, 0] as Vector3Tuple);

    return offsets.map((offset) => {
      const s: Vector3Tuple = [
        start[0] + perp[0] * offset,
        start[1] + perp[1] * offset,
        start[2] + perp[2] * offset,
      ];
      const e: Vector3Tuple = [
        end[0] + perp[0] * offset,
        end[1] + perp[1] * offset,
        end[2] + perp[2] * offset,
      ];
      if (this._bondColor !== undefined) {
        return new Bond3D({ start: s, end: e, radius: this._bondRadius, color: this._bondColor });
      }
      return new Bond3D({
        start: s,
        end: e,
        radius: this._bondRadius,
        split: true,
        color: fromAtom.color,
        endColor: toAtom.color,
      });
    });
  }

  // ========== Accessors ==========

  /** Get all resolved atoms, in input order. */
  getAtoms(): Atom3DRender[] {
    return [...this._atoms];
  }

  /** Get all resolved bonds, in input order (out-of-range bonds excluded). */
  getBonds(): Bond3DRender[] {
    return [...this._bonds];
  }

  /** Get the resolved atom at an index, or undefined. */
  getAtom(index: number): Atom3DRender | undefined {
    return this._atoms[index];
  }

  /** Get the resolved bond at an index, or undefined. */
  getBond(index: number): Bond3DRender | undefined {
    return this._bonds[index];
  }

  /** The number of atoms. */
  get numAtoms(): number {
    return this._atoms.length;
  }

  /** The number of rendered bonds (out-of-range bonds excluded). */
  get numBonds(): number {
    return this._bonds.length;
  }

  // ========== Mutation ==========

  /**
   * Move every atom to a new position and rebuild the bonds to follow.
   *
   * The positions are in the molecule's rendered coordinate space, the same
   * space as {@link getAtoms}`()[i].position` (the atom spec coordinates times
   * the world scale; for the default scale of 1 they are the spec coordinates).
   * Each sphere moves to its new position. The bonds are rebuilt from the new
   * positions, so the sticks follow the atoms and keep their split colors and
   * double/triple offsets. Space-filling molecules have no bonds to rebuild.
   *
   * This drives {@link MorphMolecule} but is also useful on its own to set a
   * conformation directly.
   *
   * @param positions One `[x, y, z]` per atom, in atom order.
   * @throws If `positions.length` is not equal to {@link numAtoms}.
   */
  setAtomPositions(positions: Vector3Tuple[]): this {
    if (positions.length !== this._atoms.length) {
      throw new Error(
        `Molecule3D.setAtomPositions: expected ${this._atoms.length} positions ` +
          `(one per atom), got ${positions.length}.`,
      );
    }
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const atom = this._atoms[i];
      atom.sphere.position.set(p[0], p[1], p[2]);
      atom.sphere._markDirty();
      atom.position = [p[0], p[1], p[2]];
    }
    this._rebuildBonds();
    return this;
  }

  /** Clear the bond sticks and rebuild them from the current atom positions. */
  private _rebuildBonds(): void {
    // Dispose each old stick first. Group.clear only detaches children, so
    // without this the per-frame rebuild leaks every stick's GPU geometry and
    // material.
    for (const stick of this.bondsGroup.children) {
      stick.dispose();
    }
    this.bondsGroup.clear();
    this._bonds.length = 0;
    this._buildBonds();
  }

  override copy(): Molecule3D {
    const copy = new Molecule3D({
      atoms: this._atomSpecs.map((a) => ({ element: a.element, position: [...a.position] })),
      bonds: this._bondSpecs.map((b) => ({ ...b })),
      style: this._moleculeStyle,
      colors: { ...this._colors },
      radiusScheme: this._radiusScheme,
      atomRadius: this._atomRadius,
      radiusScale: this._radiusScale,
      bondRadius: this._bondRadius,
      bondColor: this._bondColor,
      sphereResolution: this._sphereResolution,
      scale: this._worldScale,
    });
    this._copyBaseAttributesInto(copy, { copyChildren: false });
    return copy;
  }
}
