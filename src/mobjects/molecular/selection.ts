/**
 * selectAtoms - a structure selection language over a parsed PDB structure.
 *
 * This is pure data/logic, not rendering. It takes a {@link ParsedStructure}
 * (from {@link parsePdb}) and returns a new, smaller {@link ParsedStructure}
 * that keeps only the atoms a set of filters select. Use it to isolate part of
 * a structure, e.g. the active site around a bound ligand, and then render the
 * result with a normal {@link Molecule3D}.
 *
 * @example
 * ```typescript
 * const site = bindingSiteSelection(parsePdb(text), 5);
 * const pocket = new Molecule3D({ atoms: site.atoms, bonds: site.bonds });
 * ```
 *
 * Indexing convention (important for bonds):
 *  - A {@link ParsedStructure} numbers bonds in one combined atom space:
 *    all `atoms` first (indices `0 .. atoms.length - 1`), then all `hetatms`
 *    (indices `atoms.length .. atoms.length + hetatms.length - 1`). This
 *    matches {@link parsePdb}.
 *  - The returned structure uses the same convention over its own, filtered
 *    lists: kept atoms keep their original order and are numbered first, kept
 *    hetatms follow. A bond survives only when BOTH endpoints survive, and its
 *    `from` / `to` are re-numbered into the new combined space.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { normalizeElement } from '../chemistry/cpkColors';
import { Atom3DSpec, Bond3DSpec } from './Molecule3D';
import { ParsedStructure, ResidueCA } from './pdb';
import { threeToOneLetter } from './residues';

/** Options for {@link selectAtoms}. All provided filters combine with AND. */
export interface AtomSelectionOptions {
  /** Keep only these elements (compared case-insensitively, normalized). */
  elements?: string[];
  /** Keep only these chains (needs per-atom chain info; see module docs). */
  chains?: string[];
  /** Keep only these residue sequence numbers. */
  resSeqs?: number[];
  /** Keep only these residue codes; each may be a 1- or 3-letter code. */
  residueCodes?: string[];
  /** Keep atoms within `radius` of `point`. A radius <= 0 keeps none. */
  nearPoint?: { point: Vector3Tuple; radius: number };
  /** Keep atoms within `radius` of any hetatm (the ligand). Radius <= 0 keeps none. */
  nearLigand?: { radius: number };
  /** Consider hetatms as candidates too. Default: true. */
  includeHetatms?: boolean;
  /** Keep the complement of the selection (within the candidate set). */
  invert?: boolean;
}

/** The default binding-site radius in angstrom. */
export const DEFAULT_BINDING_SITE_RADIUS = 5;

/** An atom plus the data needed to filter it and to re-number bonds. */
interface Candidate {
  spec: Atom3DSpec;
  isHet: boolean;
  /** The atom's index in the input combined space (atoms first, then hetatms). */
  oldIndex: number;
}

/** The squared distance between two points (no square root; for compares). */
function distanceSquared(a: Vector3Tuple, b: Vector3Tuple): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

/** Build the set of residue codes to match, as upper-case 1- and 3-letter forms. */
function normalizeResidueCodes(codes: string[]): Set<string> {
  const set = new Set<string>();
  for (const code of codes) {
    set.add(code.trim().toUpperCase());
  }
  return set;
}

/** True when the atom's residue matches one of the wanted codes. */
function residueCodeMatches(spec: Atom3DSpec, wanted: Set<string>): boolean {
  const resName = spec.resName;
  if (resName === undefined) {
    return false;
  }
  const upper = resName.toUpperCase();
  if (wanted.has(upper)) {
    return true;
  }
  // Also match the 1-letter form (e.g. 'A' for 'ALA').
  return wanted.has(threeToOneLetter(resName).toUpperCase());
}

/** A single atom predicate; true keeps the atom. */
type AtomPredicate = (spec: Atom3DSpec) => boolean;

/** A predicate for `nearPoint`: within radius of a fixed point (radius <= 0 keeps none). */
function nearPointPredicate(nearPoint: { point: Vector3Tuple; radius: number }): AtomPredicate {
  const r2 = nearPoint.radius * nearPoint.radius;
  return (spec) => nearPoint.radius > 0 && distanceSquared(spec.position, nearPoint.point) <= r2;
}

/** A predicate for `nearLigand`: within radius of any hetatm (radius <= 0 keeps none). */
function nearLigandPredicate(radius: number, hetatms: Atom3DSpec[]): AtomPredicate {
  const r2 = radius * radius;
  return (spec) =>
    radius > 0 && hetatms.some((h) => distanceSquared(spec.position, h.position) <= r2);
}

/** Build the per-atom predicate from the options (all provided filters AND together). */
function buildPredicate(options: AtomSelectionOptions, hetatms: Atom3DSpec[]): AtomPredicate {
  const checks: AtomPredicate[] = [];
  if (options.elements) {
    const set = new Set(options.elements.map((e) => normalizeElement(e)));
    checks.push((spec) => set.has(normalizeElement(spec.element)));
  }
  if (options.chains) {
    const set = new Set(options.chains);
    checks.push((spec) => spec.chain !== undefined && set.has(spec.chain));
  }
  if (options.resSeqs) {
    const set = new Set(options.resSeqs);
    checks.push((spec) => spec.resSeq !== undefined && set.has(spec.resSeq));
  }
  if (options.residueCodes) {
    const set = normalizeResidueCodes(options.residueCodes);
    checks.push((spec) => residueCodeMatches(spec, set));
  }
  if (options.nearPoint) {
    checks.push(nearPointPredicate(options.nearPoint));
  }
  if (options.nearLigand) {
    checks.push(nearLigandPredicate(options.nearLigand.radius, hetatms));
  }
  return (spec) => checks.every((check) => check(spec));
}

/** True when a kept atom shares this residue's chain and resSeq. */
function residueKeyKept(residue: ResidueCA, keptKeys: Set<string>): boolean {
  if (residue.resSeq === undefined) {
    return false;
  }
  return keptKeys.has(`${residue.chain ?? ''}:${residue.resSeq}`);
}

/** A tiny tolerance (angstrom^2) for matching a CA position to a kept atom. */
const CA_MATCH_EPSILON_SQUARED = 1e-6;

/** The kept atoms and hetatms, plus a map from old to new combined index. */
interface Partition {
  keptAtoms: Atom3DSpec[];
  keptHetatms: Atom3DSpec[];
  oldToNew: Map<number, number>;
}

/**
 * Split candidates into kept atoms and kept hetatms, numbering atoms first.
 *
 * `keep` decides each candidate. The new combined space numbers all kept atoms
 * (in order), then all kept hetatms, matching the {@link ParsedStructure} order.
 */
function partition(candidates: Candidate[], keep: (c: Candidate) => boolean): Partition {
  const keptAtoms: Atom3DSpec[] = [];
  const keptHetatms: Atom3DSpec[] = [];
  const atomIndices: number[] = [];
  const hetIndices: number[] = [];
  for (const c of candidates) {
    if (!keep(c)) {
      continue;
    }
    if (c.isHet) {
      keptHetatms.push(c.spec);
      hetIndices.push(c.oldIndex);
    } else {
      keptAtoms.push(c.spec);
      atomIndices.push(c.oldIndex);
    }
  }
  const oldToNew = new Map<number, number>();
  atomIndices.forEach((old, i) => oldToNew.set(old, i));
  hetIndices.forEach((old, i) => oldToNew.set(old, keptAtoms.length + i));
  return { keptAtoms, keptHetatms, oldToNew };
}

/** Re-number the bonds whose both endpoints survived into the new combined space. */
function reindexBonds(bonds: Bond3DSpec[], oldToNew: Map<number, number>): Bond3DSpec[] {
  const result: Bond3DSpec[] = [];
  for (const bond of bonds) {
    const from = oldToNew.get(bond.from);
    const to = oldToNew.get(bond.to);
    if (from === undefined || to === undefined) {
      continue;
    }
    result.push(bond.order === undefined ? { from, to } : { from, to, order: bond.order });
  }
  return result;
}

/** Keep residues whose chain+resSeq matches a kept atom, else by CA proximity. */
function filterResidues(residues: ResidueCA[], keptAtoms: Atom3DSpec[]): ResidueCA[] {
  const keptKeys = new Set<string>();
  for (const spec of keptAtoms) {
    if (spec.resSeq !== undefined) {
      keptKeys.add(`${spec.chain ?? ''}:${spec.resSeq}`);
    }
  }
  return residues.filter((residue) => {
    if (residueKeyKept(residue, keptKeys)) {
      return true;
    }
    if (residue.resSeq !== undefined) {
      return false;
    }
    return keptAtoms.some(
      (spec) => distanceSquared(spec.position, residue.ca) <= CA_MATCH_EPSILON_SQUARED,
    );
  });
}

/**
 * Select a subset of a parsed structure.
 *
 * Builds a candidate list of `atoms` plus (when `includeHetatms`, the default)
 * `hetatms`. It keeps a candidate when every provided filter accepts it, then
 * inverts the result when `invert` is set. The returned structure is fresh and
 * the input is not mutated.
 *
 * Bonds: kept only when both endpoints survive, with `from` / `to` re-numbered
 * into the new combined space (kept atoms first, then kept hetatms).
 *
 * Residues: a residue is kept when a kept atom shares its chain and resSeq. For
 * a residue with no resSeq, it is kept when its CA position coincides with a
 * kept atom's position.
 *
 * Degenerate input: an empty selection returns an empty but valid structure and
 * does not throw. A proximity filter (`nearPoint` / `nearLigand`) with a radius
 * <= 0 selects nothing.
 *
 * @param structure - The structure to filter.
 * @param options - The selection filters.
 * @returns A new {@link ParsedStructure} with the selected atoms, hetatms,
 *   re-numbered bonds and kept residues.
 */
export function selectAtoms(
  structure: ParsedStructure,
  options: AtomSelectionOptions,
): ParsedStructure {
  const includeHet = options.includeHetatms ?? true;
  const invert = options.invert ?? false;

  // The ligand reference set is always the full hetatm list, independent of
  // includeHetatms (which only controls whether hetatms are candidates).
  const predicate = buildPredicate(options, structure.hetatms);

  const candidates: Candidate[] = [];
  structure.atoms.forEach((spec, i) => {
    candidates.push({ spec, isHet: false, oldIndex: i });
  });
  if (includeHet) {
    const offset = structure.atoms.length;
    structure.hetatms.forEach((spec, i) => {
      candidates.push({ spec, isHet: true, oldIndex: offset + i });
    });
  }

  const { keptAtoms, keptHetatms, oldToNew } = partition(
    candidates,
    (c) => predicate(c.spec) !== invert,
  );

  return {
    atoms: keptAtoms,
    hetatms: keptHetatms,
    bonds: reindexBonds(structure.bonds, oldToNew),
    residues: filterResidues(structure.residues, keptAtoms),
  };
}

/**
 * Select the binding site: atoms and residues within `radius` of any hetatm.
 *
 * This isolates the pocket around a bound ligand (the hetatms). Hetatms are the
 * reference, so they are not themselves kept by this convenience function; the
 * result is the protein atoms that line the pocket.
 *
 * @param structure - The structure to filter.
 * @param radius - The pocket radius in angstrom. Default:
 *   {@link DEFAULT_BINDING_SITE_RADIUS}. A radius <= 0 selects nothing.
 * @returns A new {@link ParsedStructure} with the pocket atoms and residues.
 */
export function bindingSiteSelection(
  structure: ParsedStructure,
  radius: number = DEFAULT_BINDING_SITE_RADIUS,
): ParsedStructure {
  return selectAtoms(structure, {
    nearLigand: { radius },
    includeHetatms: false,
  });
}
