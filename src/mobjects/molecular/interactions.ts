/**
 * Protein-ligand interaction detection (a coarse interaction fingerprint).
 *
 * {@link detectInteractions} scans a receptor (protein) atom set and a ligand
 * atom set and reports the non-covalent contacts between them: hydrogen bonds
 * (a polar N/O/S/F atom on each side within a short cutoff) and hydrophobic
 * contacts (carbon-carbon within a longer cutoff). This is the automatic
 * version of placing a {@link hydrogenBond} by hand: give it the two structures
 * and it finds the binding interactions for you, the way a docking report does.
 *
 * It is a HEAVY-ATOM, distance-only heuristic. It does not add or read explicit
 * hydrogens, check donor/acceptor angles, or solve electrostatics, so it over-
 * and under-counts at the margins. It is meant for teaching and figure-making,
 * not for quantitative binding analysis.
 *
 * @example
 * ```typescript
 * const found = detectInteractions(protein.getAtoms(), ligand.getAtoms());
 * for (const it of found) {
 *   scene.add(
 *     it.type === 'hbond'
 *       ? hydrogenBond(it.receptorAtom.position, it.ligandAtom.position)
 *       : contact(it.receptorAtom.position, it.ligandAtom.position),
 *   );
 * }
 * ```
 */

import { Vector3Tuple } from '../../core/Mobject';
import { Group } from '../../core/Group';
import { Atom3DSpec } from './Molecule3D';
import { normalizeElement } from '../chemistry/cpkColors';
import { hydrogenBond, contact } from './annotations';

/** The kind of non-covalent interaction detected between two atoms. */
export type InteractionType = 'hbond' | 'contact';

/** One detected receptor-ligand interaction. */
export interface Interaction {
  /** 'hbond' (polar, short) or 'contact' (hydrophobic C-C, longer). */
  type: InteractionType;
  /** The receptor (protein) atom involved. */
  receptorAtom: Atom3DSpec;
  /** The ligand atom involved. */
  ligandAtom: Atom3DSpec;
  /** The distance between the two atoms, in the structure's units (angstrom). */
  distance: number;
}

/** Options for {@link detectInteractions}. */
export interface DetectInteractionsOptions {
  /**
   * Max heavy-atom distance for a hydrogen bond, in angstrom. Default 3.5.
   * (A donor-acceptor heavy-atom distance; explicit H is not required.)
   */
  hBondCutoff?: number;
  /**
   * Max distance for a hydrophobic carbon-carbon contact, in angstrom.
   * Default 4.0. Set to 0 to skip hydrophobic contacts.
   */
  contactCutoff?: number;
  /**
   * The elements treated as hydrogen-bond donors/acceptors. Default N, O, S, F.
   * Comparison is case-insensitive.
   */
  polarElements?: string[];
}

const DEFAULT_H_BOND_CUTOFF = 3.5;
const DEFAULT_CONTACT_CUTOFF = 4.0;
const DEFAULT_POLAR_ELEMENTS = ['N', 'O', 'S', 'F'];

/** Euclidean distance between two points. */
function distance(a: Vector3Tuple, b: Vector3Tuple): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Detect the non-covalent interactions between a receptor and a ligand.
 *
 * Returns one {@link Interaction} per qualifying atom pair, sorted by distance
 * (closest first). A pair that qualifies as a hydrogen bond is reported as a
 * hydrogen bond and not also as a hydrophobic contact.
 */
export function detectInteractions(
  receptorAtoms: Atom3DSpec[],
  ligandAtoms: Atom3DSpec[],
  options: DetectInteractionsOptions = {},
): Interaction[] {
  const hBondCutoff = options.hBondCutoff ?? DEFAULT_H_BOND_CUTOFF;
  const contactCutoff = options.contactCutoff ?? DEFAULT_CONTACT_CUTOFF;
  const polar = new Set(
    (options.polarElements ?? DEFAULT_POLAR_ELEMENTS).map((e) => normalizeElement(e)),
  );

  const found: Interaction[] = [];
  for (const r of receptorAtoms) {
    const re = normalizeElement(r.element);
    for (const l of ligandAtoms) {
      const le = normalizeElement(l.element);
      const d = distance(r.position, l.position);
      if (polar.has(re) && polar.has(le) && d <= hBondCutoff) {
        found.push({ type: 'hbond', receptorAtom: r, ligandAtom: l, distance: d });
      } else if (contactCutoff > 0 && re === 'C' && le === 'C' && d <= contactCutoff) {
        found.push({ type: 'contact', receptorAtom: r, ligandAtom: l, distance: d });
      }
    }
  }
  found.sort((a, b) => a.distance - b.distance);
  return found;
}

/** Options for {@link drawInteractions}. */
export interface DrawInteractionsOptions {
  /** Color of the hydrogen-bond markers. */
  hBondColor?: string;
  /** Color of the hydrophobic-contact markers. */
  contactColor?: string;
}

/**
 * Draw a group of detected interactions, reusing {@link hydrogenBond} for the
 * polar contacts and {@link contact} for the hydrophobic ones. A convenience
 * over the detection result, so a caller can render a whole fingerprint at once.
 */
export function drawInteractions(
  interactions: Interaction[],
  options: DrawInteractionsOptions = {},
): Group {
  const group = new Group();
  for (const it of interactions) {
    if (it.type === 'hbond') {
      group.add(
        hydrogenBond(it.receptorAtom.position, it.ligandAtom.position, {
          color: options.hBondColor,
        }),
      );
    } else {
      group.add(
        contact(it.receptorAtom.position, it.ligandAtom.position, {
          color: options.contactColor,
        }),
      );
    }
  }
  return group;
}
