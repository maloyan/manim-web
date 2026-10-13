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
  /** The chain identifier, if present. */
  chain?: string;
  /** The residue sequence number, if present. */
  resSeq?: number;
  /** The secondary structure class (default 'coil'). */
  ss?: SecondaryStructure;
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
    spec: { element, position: [x, y, z] },
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

/** Build one residue per CA atom (ATOM records), deduped by chain + resSeq. */
function buildResidues(atomRecords: ParsedAtom[], ssRanges: SSRange[]): ResidueCA[] {
  const residues: ResidueCA[] = [];
  const seen = new Set<string>();
  for (const a of atomRecords) {
    if (a.atomName !== 'CA') {
      continue;
    }
    const key = `${a.chain}:${a.resSeq}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    residues.push({
      code: threeToOneLetter(a.resName),
      ca: a.spec.position,
      chain: a.chain === '' ? undefined : a.chain,
      resSeq: a.resSeq >= 0 ? a.resSeq : undefined,
      ss: secondaryStructureFor(a.chain, a.resSeq, ssRanges),
    });
  }
  return residues;
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

  // Keep ATOM atoms, and HETATM atoms that are not water (unless includeWater).
  const kept = parsedAtoms.filter(
    (a) => !a.isHet || includeWater || !WATER_RESIDUES.has(a.resName.toUpperCase()),
  );
  const atomRecords = kept.filter((a) => !a.isHet);
  const hetRecords = kept.filter((a) => a.isHet);

  // Combined order = ATOM atoms first, then HETATM atoms. Map serial -> index.
  const serialToIndex = new Map<number, number>();
  const combined = [...atomRecords, ...hetRecords];
  combined.forEach((a, index) => {
    if (a.serial >= 0) {
      serialToIndex.set(a.serial, index);
    }
  });

  return {
    atoms: atomRecords.map((a) => a.spec),
    hetatms: hetRecords.map((a) => a.spec),
    bonds: buildBonds(conectRecords, serialToIndex),
    residues: buildResidues(atomRecords, ssRanges),
  };
}
