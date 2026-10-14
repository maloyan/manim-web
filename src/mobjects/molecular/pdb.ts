/**
 * parsePdb - a local-string PDB parser (no network, no file IO).
 *
 * Reads fixed-column PDB records from a string and returns a structure split
 * into ATOM atoms, HETATM atoms, CONECT bonds and CA residues. Column ranges
 * follow the official PDB format:
 *  - record name: cols 1-6
 *  - atom name: cols 13-16
 *  - residue name: cols 18-20
 *  - chain: col 22
 *  - residue sequence number: cols 23-26
 *  - x / y / z: cols 31-38 / 39-46 / 47-54
 *  - element: cols 77-78 (with a fallback derived from the atom name)
 *
 * The parser is robust to blank lines, TER records and trailing junk.
 */

import { Vector3Tuple } from '../../core/Mobject';
import { normalizeElement } from '../chemistry/cpkColors';
import { Atom3DSpec, Bond3DSpec } from './Molecule3D';
import { threeToOneLetter } from './residues';

/** The secondary structure class of a residue. */
export type SecondaryStructure = 'helix' | 'sheet' | 'coil';

/** A residue reduced to its alpha-carbon (CA) position and metadata. */
export interface ResidueCA {
  /** The 1-letter residue code (e.g. 'A' for ALA, 'X' if unknown). */
  code: string;
  /** The CA atom position `[x, y, z]`. */
  ca: Vector3Tuple;
  /** The backbone amide nitrogen (N) position, if the PDB carries it. */
  n?: Vector3Tuple;
  /** The backbone carbonyl carbon (C) position, if the PDB carries it. */
  c?: Vector3Tuple;
  /** The chain identifier, if present. */
  chain?: string;
  /** The residue sequence number, if present. */
  resSeq?: number;
  /** The secondary structure class (default 'coil'). */
  ss?: SecondaryStructure;
  /** The CA atom's temperature factor (B-factor), if present. */
  tempFactor?: number;
}

/** The result of {@link parsePdb}. */
export interface ParsedStructure {
  /** Atoms from ATOM records (protein / nucleic). */
  atoms: Atom3DSpec[];
  /** Atoms from HETATM records (ligand / water candidates). */
  hetatms: Atom3DSpec[];
  /** Bonds from CONECT records, as indices into the combined atoms+hetatms order. */
  bonds: Bond3DSpec[];
  /** One residue per CA atom, in order, with chain, resSeq and ss. */
  residues: ResidueCA[];
}

/** Options for {@link parsePdb}. */
export interface ParsePdbOptions {
  /** Keep HOH / WAT / H2O waters in `hetatms`. Default: false. */
  includeWater?: boolean;
}

/** Residue names treated as water. */
const WATER_RESIDUES = new Set(['HOH', 'WAT', 'H2O', 'DOD']);

/**
 * Two-letter element symbols used to validate an atom-name-derived element.
 *
 * The fallback reads cols 13-14 of the atom name; this set keeps a two-letter
 * read (e.g. 'FE', 'CL', 'CA' for calcium) and rejects an accidental pair such
 * as a hydrogen name, which then falls back to the single leading letter.
 */
const KNOWN_TWO_LETTER = new Set([
  'HE',
  'LI',
  'BE',
  'NE',
  'NA',
  'MG',
  'AL',
  'SI',
  'CL',
  'AR',
  'CA',
  'SC',
  'TI',
  'CR',
  'MN',
  'FE',
  'CO',
  'NI',
  'CU',
  'ZN',
  'GA',
  'GE',
  'AS',
  'SE',
  'BR',
  'KR',
  'RB',
  'SR',
  'ZR',
  'NB',
  'MO',
  'TC',
  'RU',
  'RH',
  'PD',
  'AG',
  'CD',
  'IN',
  'SN',
  'SB',
  'TE',
  'XE',
  'CS',
  'BA',
  'PT',
  'AU',
  'HG',
  'TL',
  'PB',
  'BI',
]);

/** A single secondary-structure range (from a HELIX or SHEET record). */
interface SSRange {
  type: 'helix' | 'sheet';
  chain: string;
  start: number;
  end: number;
}

/** A parsed atom plus the fields needed to assign bonds and residues. */
interface ParsedAtom {
  spec: Atom3DSpec;
  serial: number;
  isHet: boolean;
  resName: string;
  atomName: string;
  chain: string;
  resSeq: number;
}

/**
 * Derive an element symbol from the 4-character atom-name field (cols 13-16).
 *
 * When col 13 holds a letter, the element occupies cols 13-14 (a two-letter
 * symbol such as FE or CL, right-justified for metals). When col 13 is blank,
 * the element is the single letter in col 14 (e.g. ' C  ' -> C). A two-letter
 * read is kept only if it is a known element symbol.
 * @param nameField - The raw cols 13-16 string.
 * @returns The derived element symbol, or '' when none can be found.
 */
function elementFromAtomName(nameField: string): string {
  const c13 = nameField.charAt(0);
  const c14 = nameField.charAt(1);
  if (/[A-Za-z]/.test(c13)) {
    const two = (c13 + c14).trim();
    if (KNOWN_TWO_LETTER.has(two.toUpperCase())) {
      return two;
    }
    return c13;
  }
  return c14.trim();
}

/**
 * Read an optional fixed-column float, or undefined when the field is absent or
 * blank. Used for the occupancy and temperature-factor columns.
 */
function optionalFloat(line: string, start: number, end: number): number | undefined {
  if (line.length < end) {
    return undefined;
  }
  const value = Number.parseFloat(line.slice(start, end));
  return Number.isNaN(value) ? undefined : value;
}

/** Parse one ATOM / HETATM line into a {@link ParsedAtom}, or null if malformed. */
function parseAtomLine(line: string, isHet: boolean): ParsedAtom | null {
  // Coordinates end at col 54; a shorter line cannot hold a full atom.
  if (line.length < 54) {
    return null;
  }
  const x = Number.parseFloat(line.slice(30, 38));
  const y = Number.parseFloat(line.slice(38, 46));
  const z = Number.parseFloat(line.slice(46, 54));
  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
    return null;
  }
  const nameField = line.slice(12, 16);
  const atomName = nameField.trim();
  let element = line.length >= 78 ? line.slice(76, 78).trim() : '';
  if (element === '') {
    element = elementFromAtomName(nameField);
  }
  // Canonical case (e.g. 'FE' -> 'Fe'), matching the CPK / radius tables.
  element = normalizeElement(element);
  const resName = line.slice(17, 20).trim();
  const chain = line.slice(21, 22).trim();
  const serial = Number.parseInt(line.slice(6, 11), 10);
  const resSeq = Number.parseInt(line.slice(22, 26), 10);

  return {
    spec: {
      element,
      position: [x, y, z],
      chain: chain === '' ? undefined : chain,
      resSeq: Number.isNaN(resSeq) ? undefined : resSeq,
      resName: resName === '' ? undefined : resName,
      // Occupancy (cols 55-60) and temperature factor / B-factor (cols 61-66).
      occupancy: optionalFloat(line, 54, 60),
      tempFactor: optionalFloat(line, 60, 66),
    },
    serial: Number.isNaN(serial) ? -1 : serial,
    isHet,
    resName,
    atomName,
    chain,
    resSeq: Number.isNaN(resSeq) ? -1 : resSeq,
  };
}

/** Parse a HELIX record into an {@link SSRange}, or null if malformed. */
function parseHelix(line: string): SSRange | null {
  const chain = line.slice(19, 20).trim();
  const start = Number.parseInt(line.slice(21, 25), 10);
  const end = Number.parseInt(line.slice(33, 37), 10);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return { type: 'helix', chain, start, end };
}

/** Parse a SHEET record into an {@link SSRange}, or null if malformed. */
function parseSheet(line: string): SSRange | null {
  const chain = line.slice(21, 22).trim();
  const start = Number.parseInt(line.slice(22, 26), 10);
  const end = Number.parseInt(line.slice(33, 37), 10);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return { type: 'sheet', chain, start, end };
}

/** Read the up-to-five atom serials from a CONECT line. */
function parseConect(line: string): number[] {
  const serials: number[] = [];
  // Serial fields: cols 7-11, 12-16, 17-21, 22-26, 27-31.
  for (let start = 6; start + 5 <= line.length && start < 31; start += 5) {
    const value = Number.parseInt(line.slice(start, start + 5), 10);
    if (!Number.isNaN(value)) {
      serials.push(value);
    }
  }
  return serials;
}

/** The secondary structure for a residue, from the parsed SS ranges. */
function secondaryStructureFor(
  chain: string,
  resSeq: number,
  ranges: SSRange[],
): SecondaryStructure {
  for (const range of ranges) {
    if (range.chain === chain && resSeq >= range.start && resSeq <= range.end) {
      return range.type;
    }
  }
  return 'coil';
}

/** The raw records collected from a single pass over the PDB lines. */
interface ScannedRecords {
  parsedAtoms: ParsedAtom[];
  ssRanges: SSRange[];
  conectRecords: number[][];
}

/** Scan every line once and sort it into atoms, SS ranges and CONECT records. */
function scanRecords(lines: string[]): ScannedRecords {
  const parsedAtoms: ParsedAtom[] = [];
  const ssRanges: SSRange[] = [];
  const conectRecords: number[][] = [];

  for (const line of lines) {
    const record = line.slice(0, 6).trim();
    if (record === 'ATOM' || record === 'HETATM') {
      const atom = parseAtomLine(line, record === 'HETATM');
      if (atom) {
        parsedAtoms.push(atom);
      }
    } else if (record === 'HELIX' || record === 'SHEET') {
      const range = record === 'HELIX' ? parseHelix(line) : parseSheet(line);
      if (range) {
        ssRanges.push(range);
      }
    } else if (record === 'CONECT') {
      const serials = parseConect(line);
      if (serials.length >= 2) {
        conectRecords.push(serials);
      }
    }
    // Blank lines, headers, TER and trailing junk are ignored.
  }

  return { parsedAtoms, ssRanges, conectRecords };
}

/** Build CONECT bonds as combined indices, deduped (records list both ways). */
function buildBonds(conectRecords: number[][], serialToIndex: Map<number, number>): Bond3DSpec[] {
  const bonds: Bond3DSpec[] = [];
  const seen = new Set<string>();
  for (const serials of conectRecords) {
    const source = serialToIndex.get(serials[0]);
    if (source === undefined) {
      continue;
    }
    for (let i = 1; i < serials.length; i++) {
      const target = serialToIndex.get(serials[i]);
      if (target === undefined || target === source) {
        continue;
      }
      const lo = Math.min(source, target);
      const hi = Math.max(source, target);
      const key = `${lo}-${hi}`;
      if (!seen.has(key)) {
        seen.add(key);
        bonds.push({ from: lo, to: hi });
      }
    }
  }
  return bonds;
}

/** The backbone N and C positions for one residue, keyed by chain + resSeq. */
interface BackboneAtoms {
  n?: Vector3Tuple;
  c?: Vector3Tuple;
}

/**
 * Collect the backbone amide N and carbonyl C positions per residue.
 *
 * A Ramachandran analysis needs N, CA and C of consecutive residues, but a
 * {@link ResidueCA} anchors on CA alone. This map adds the N and C positions so
 * downstream code (for example a Ramachandran plot) can compute the backbone
 * dihedral angles. The first N and first C seen for a residue key win.
 */
function collectBackboneAtoms(atomRecords: ParsedAtom[]): Map<string, BackboneAtoms> {
  const backbone = new Map<string, BackboneAtoms>();
  for (const a of atomRecords) {
    if (a.atomName !== 'N' && a.atomName !== 'C') {
      continue;
    }
    const key = `${a.chain}:${a.resSeq}`;
    const entry = backbone.get(key) ?? {};
    if (a.atomName === 'N' && entry.n === undefined) {
      entry.n = a.spec.position;
    } else if (a.atomName === 'C' && entry.c === undefined) {
      entry.c = a.spec.position;
    }
    backbone.set(key, entry);
  }
  return backbone;
}

/** Build one residue per CA atom (ATOM records), deduped by chain + resSeq. */
function buildResidues(atomRecords: ParsedAtom[], ssRanges: SSRange[]): ResidueCA[] {
  const residues: ResidueCA[] = [];
  const seen = new Set<string>();
  const backbone = collectBackboneAtoms(atomRecords);
  for (const a of atomRecords) {
    if (a.atomName !== 'CA') {
      continue;
    }
    const key = `${a.chain}:${a.resSeq}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const bb = backbone.get(key);
    residues.push({
      code: threeToOneLetter(a.resName),
      ca: a.spec.position,
      n: bb?.n,
      c: bb?.c,
      chain: a.chain === '' ? undefined : a.chain,
      resSeq: a.resSeq >= 0 ? a.resSeq : undefined,
      ss: secondaryStructureFor(a.chain, a.resSeq, ssRanges),
      tempFactor: a.spec.tempFactor,
    });
  }
  return residues;
}

/** ATOM atoms, HETATM atoms and the combined order, after water filtering. */
interface PartitionedAtoms {
  atomRecords: ParsedAtom[];
  hetRecords: ParsedAtom[];
  /** ATOM atoms first, then HETATM atoms. */
  combined: ParsedAtom[];
}

/**
 * Split parsed atoms into ATOM and HETATM records, dropping water unless
 * {@link includeWater}. The combined order is ATOM atoms first, then HETATM, the
 * order CONECT indices and trajectory frames both use.
 */
function partitionAtoms(parsedAtoms: ParsedAtom[], includeWater: boolean): PartitionedAtoms {
  const kept = parsedAtoms.filter(
    (a) => !a.isHet || includeWater || !WATER_RESIDUES.has(a.resName.toUpperCase()),
  );
  const atomRecords = kept.filter((a) => !a.isHet);
  const hetRecords = kept.filter((a) => a.isHet);
  return { atomRecords, hetRecords, combined: [...atomRecords, ...hetRecords] };
}

/** Map each atom serial to its index in the combined order. */
function indexBySerial(combined: ParsedAtom[]): Map<number, number> {
  const serialToIndex = new Map<number, number>();
  combined.forEach((a, index) => {
    if (a.serial >= 0) {
      serialToIndex.set(a.serial, index);
    }
  });
  return serialToIndex;
}

/** Build the {@link ParsedStructure} for one model's atoms, with global bonds. */
function buildStructure(
  partition: PartitionedAtoms,
  ssRanges: SSRange[],
  conectRecords: number[][],
): ParsedStructure {
  return {
    atoms: partition.atomRecords.map((a) => a.spec),
    hetatms: partition.hetRecords.map((a) => a.spec),
    bonds: buildBonds(conectRecords, indexBySerial(partition.combined)),
    residues: buildResidues(partition.atomRecords, ssRanges),
  };
}

/**
 * Parse a PDB structure from a string.
 *
 * @param text - The PDB file contents.
 * @param options - Parse options (e.g. {@link ParsePdbOptions.includeWater}).
 * @returns The parsed structure.
 */
export function parsePdb(text: string, options: ParsePdbOptions = {}): ParsedStructure {
  const includeWater = options.includeWater ?? false;
  const { parsedAtoms, ssRanges, conectRecords } = scanRecords(text.split(/\r?\n/));
  const partition = partitionAtoms(parsedAtoms, includeWater);
  return buildStructure(partition, ssRanges, conectRecords);
}

/** A multi-frame trajectory parsed from a multi-MODEL PDB. */
export interface PdbTrajectory {
  /** The structure of the first model (atoms, hetatms, bonds, residues). */
  structure: ParsedStructure;
  /**
   * One conformation per MODEL, in combined atom order (ATOM atoms first, then
   * HETATM). Every frame has the same length and order as `structure`'s atoms.
   */
  frames: Vector3Tuple[][];
  /** The number of models (frames). */
  numModels: number;
}

/** The atoms split by MODEL, plus global SS ranges and CONECT records. */
interface ScannedModels {
  models: ParsedAtom[][];
  ssRanges: SSRange[];
  conectRecords: number[][];
}

/**
 * Scan every line once, splitting ATOM / HETATM records by MODEL block. HELIX,
 * SHEET and CONECT records are global (they sit outside MODEL blocks). A file
 * with no MODEL records yields a single model from its atoms.
 */
function scanModels(lines: string[]): ScannedModels {
  const models: ParsedAtom[][] = [];
  const ssRanges: SSRange[] = [];
  const conectRecords: number[][] = [];
  let current: ParsedAtom[] | null = null;
  const ensureModel = (): ParsedAtom[] => {
    if (current === null) {
      current = [];
      models.push(current);
    }
    return current;
  };

  for (const line of lines) {
    const record = line.slice(0, 6).trim();
    if (record === 'MODEL') {
      current = [];
      models.push(current);
    } else if (record === 'ENDMDL') {
      current = null;
    } else if (record === 'ATOM' || record === 'HETATM') {
      const atom = parseAtomLine(line, record === 'HETATM');
      if (atom) {
        ensureModel().push(atom);
      }
    } else if (record === 'HELIX' || record === 'SHEET') {
      const range = record === 'HELIX' ? parseHelix(line) : parseSheet(line);
      if (range) {
        ssRanges.push(range);
      }
    } else if (record === 'CONECT') {
      const serials = parseConect(line);
      if (serials.length >= 2) {
        conectRecords.push(serials);
      }
    }
  }

  return { models, ssRanges, conectRecords };
}

/**
 * Parse a multi-MODEL PDB into an MD-style trajectory.
 *
 * Each MODEL...ENDMDL block is one frame; a PDB with no MODEL records parses to
 * a single-frame trajectory (backward compatible with {@link parsePdb}). The
 * frames share the atom ordering of the first model, so a {@link Molecule3D}
 * built from `structure.atoms` can be driven across `frames`.
 *
 * @param text - The PDB file contents.
 * @param options - Parse options (e.g. {@link ParsePdbOptions.includeWater}).
 * @returns The parsed trajectory.
 * @throws If no model has any atoms, or if two models have different atom counts.
 */
export function parsePdbTrajectory(text: string, options: ParsePdbOptions = {}): PdbTrajectory {
  const includeWater = options.includeWater ?? false;
  const { models, ssRanges, conectRecords } = scanModels(text.split(/\r?\n/));
  const nonEmpty = models.filter((m) => m.length > 0);
  if (nonEmpty.length < 1) {
    throw new Error(
      'parsePdbTrajectory: found no ATOM / HETATM records; a trajectory needs at least one model.',
    );
  }

  const partitions = nonEmpty.map((model) => partitionAtoms(model, includeWater));
  const expected = partitions[0].combined.length;
  const frames = partitions.map((partition, i) => {
    if (partition.combined.length !== expected) {
      throw new Error(
        `parsePdbTrajectory: model ${i + 1} has ${partition.combined.length} atoms but model 1 ` +
          `has ${expected}; every model must hold the same atoms in the same order.`,
      );
    }
    return partition.combined.map((a): Vector3Tuple => [...a.spec.position]);
  });

  return {
    structure: buildStructure(partitions[0], ssRanges, conectRecords),
    frames,
    numModels: frames.length,
  };
}
