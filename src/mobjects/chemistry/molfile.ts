/**
 * parseMolfile / parseSdf - a local-string MOL / SDF (V2000) parser.
 *
 * Reads the fixed-column MDL molfile V2000 format from a string and returns the
 * atoms and bonds as the specs a {@link MoleculeMobject} consumes. No network
 * and no file IO: the caller passes the file contents, this mirrors the
 * dependency discipline of the PDB parser in `../molecular/pdb.ts`.
 *
 * V2000 column layout (1-based columns, fixed width):
 *  - Line 1: title.
 *  - Line 2: program / timestamp header.
 *  - Line 3: comment.
 *  - Line 4: counts line. Atom count cols 1-3, bond count cols 4-6.
 *  - Atom block (one line per atom):
 *      x cols 1-10, y cols 11-20, z cols 21-30 (floats),
 *      element symbol cols 32-34 (trimmed).
 *    The z value is read but dropped: the MoleculeMobject is 2D.
 *  - Bond block (one line per bond):
 *      atom 1 cols 1-3, atom 2 cols 4-6 (1-based indices),
 *      bond type cols 7-9 (1=single, 2=double, 3=triple),
 *      stereo cols 10-12 (1=wedge, 6=dash, else normal).
 *
 * An SDF file is one or more MOL records, each terminated by a line that is
 * exactly `$$$$`. The data-item section (`> <tag>` blocks) after a molecule is
 * ignored.
 */

import { logger } from '../../utils/logger';
import { normalizeElement } from './cpkColors';
import { MoleculeMobject } from './MoleculeMobject';
import { AtomSpec, BondSpec, BondOrder, BondStyle, MoleculeOptions } from './chemistryTypes';

/** The parsed contents of one MOL record. */
export interface ParsedMolfile {
  /** The molecule title from line 1 (trimmed, may be empty). */
  title: string;
  /** The atoms, in file order, as `{ element, x, y }`. */
  atoms: AtomSpec[];
  /** The bonds, in file order, with 0-based `from` / `to` indices. */
  bonds: BondSpec[];
}

/** The SDF record separator: a line that is exactly these four characters. */
const SDF_SEPARATOR = '$$$$';

/** Minimum length of a counts line that still holds both count fields. */
const COUNTS_MIN_LENGTH = 6;

/**
 * Read a fixed-width integer field and fail loudly when it is not a number.
 * @param line - The source line.
 * @param start - The 0-based start column.
 * @param end - The 0-based end column (exclusive).
 * @param what - A human name for the field, used in the error message.
 * @returns The parsed integer.
 */
function parseIntField(line: string, start: number, end: number, what: string): number {
  const field = line.slice(start, end);
  const value = Number.parseInt(field, 10);
  if (Number.isNaN(value)) {
    throw new Error(`Molfile: ${what} is not a number (read "${field}").`);
  }
  return value;
}

/**
 * Read a fixed-width float field and fail loudly when it is not a number.
 * @param line - The source line.
 * @param start - The 0-based start column.
 * @param end - The 0-based end column (exclusive).
 * @param what - A human name for the field, used in the error message.
 * @returns The parsed float.
 */
function parseFloatField(line: string, start: number, end: number, what: string): number {
  const field = line.slice(start, end);
  const value = Number.parseFloat(field);
  if (Number.isNaN(value)) {
    throw new Error(`Molfile: ${what} is not a number (read "${field}").`);
  }
  return value;
}

/**
 * Map a V2000 bond-type code to a {@link BondOrder}.
 *
 * Codes 1, 2 and 3 are single, double and triple. Aromatic (4) and the query
 * codes (5-8) have no single-order drawing, so they fall back to a single bond
 * and the substitution is logged rather than left silent.
 * @param code - The raw bond-type code from cols 7-9.
 * @returns The bond order.
 */
function bondOrderFromCode(code: number): BondOrder {
  if (code === 1 || code === 2 || code === 3) {
    return code;
  }
  logger.warn(
    `Molfile: bond type ${code} has no plain order (4 = aromatic, 5-8 = query). ` +
      `Mapped to a single bond.`,
  );
  return 1;
}

/**
 * Map a V2000 bond-stereo code to a {@link BondStyle}.
 * @param code - The raw stereo code from cols 10-12.
 * @returns 'wedge' for 1, 'dash' for 6, otherwise 'normal'.
 */
function bondStyleFromCode(code: number): BondStyle {
  if (code === 1) {
    return 'wedge';
  }
  if (code === 6) {
    return 'dash';
  }
  return 'normal';
}

/** Parse one atom-block line into an {@link AtomSpec} (z is read, then dropped). */
function parseAtomLine(line: string, index: number): AtomSpec {
  const x = parseFloatField(line, 0, 10, `atom ${index + 1} x`);
  const y = parseFloatField(line, 10, 20, `atom ${index + 1} y`);
  // z (cols 21-30) is validated for a clear error, then dropped for the 2D view.
  parseFloatField(line, 20, 30, `atom ${index + 1} z`);
  const element = normalizeElement(line.slice(31, 34).trim());
  if (element === '') {
    throw new Error(`Molfile: atom ${index + 1} has no element symbol (cols 32-34).`);
  }
  return { element, x, y };
}

/** Parse one bond-block line into a {@link BondSpec} with 0-based indices. */
function parseBondLine(line: string, index: number, atomCount: number): BondSpec {
  const atom1 = parseIntField(line, 0, 3, `bond ${index + 1} first atom`);
  const atom2 = parseIntField(line, 3, 6, `bond ${index + 1} second atom`);
  // The stereo field is optional; a short line leaves it as the default 0.
  const typeCode = parseIntField(line, 6, 9, `bond ${index + 1} type`);
  const stereoField = line.slice(9, 12).trim();
  const stereoCode = stereoField === '' ? 0 : Number.parseInt(stereoField, 10);
  if (atom1 < 1 || atom1 > atomCount || atom2 < 1 || atom2 > atomCount) {
    throw new Error(
      `Molfile: bond ${index + 1} references atom ${atom1}/${atom2}, ` + `outside 1..${atomCount}.`,
    );
  }
  return {
    from: atom1 - 1,
    to: atom2 - 1,
    order: bondOrderFromCode(typeCode),
    type: bondStyleFromCode(Number.isNaN(stereoCode) ? 0 : stereoCode),
  };
}

/**
 * Parse one MOL record (an array of lines) into a {@link ParsedMolfile}.
 * @param lines - The record lines, header first, no `$$$$` terminator.
 * @returns The parsed record.
 */
function parseMolRecord(lines: string[]): ParsedMolfile {
  if (lines.length < 4) {
    throw new Error(
      `Molfile: a record needs 4 header lines (title, program, comment, counts), ` +
        `found ${lines.length}.`,
    );
  }
  const title = lines[0].trim();
  const countsLine = lines[3];
  if (countsLine.length < COUNTS_MIN_LENGTH) {
    throw new Error(`Molfile: the counts line is too short (read "${countsLine}").`);
  }
  // The V3000 extended format keeps atoms and bonds in `M V30` blocks, not the
  // fixed-column counts line, so this parser would read zero of each and return
  // a silently empty molecule. Reject it instead.
  if (countsLine.includes('V3000')) {
    throw new Error('V3000 molfile format not supported');
  }
  const atomCount = parseIntField(countsLine, 0, 3, 'atom count');
  const bondCount = parseIntField(countsLine, 3, 6, 'bond count');
  if (atomCount < 0 || bondCount < 0) {
    throw new Error(`Molfile: negative atom (${atomCount}) or bond (${bondCount}) count.`);
  }

  const atomStart = 4;
  const bondStart = atomStart + atomCount;
  if (lines.length < bondStart + bondCount) {
    throw new Error(
      `Molfile: the record declares ${atomCount} atoms and ${bondCount} bonds ` +
        `but has too few lines (${lines.length}).`,
    );
  }

  const atoms: AtomSpec[] = [];
  for (let i = 0; i < atomCount; i++) {
    atoms.push(parseAtomLine(lines[atomStart + i], i));
  }
  const bonds: BondSpec[] = [];
  for (let i = 0; i < bondCount; i++) {
    bonds.push(parseBondLine(lines[bondStart + i], i, atomCount));
  }

  return { title, atoms, bonds };
}

/** Split text into lines, tolerant of CRLF, and drop a trailing empty line. */
function toLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/**
 * Parse a single V2000 MOL block.
 *
 * When the text holds several `$$$$`-separated records, only the first is used.
 * @param text - The MOL file contents.
 * @returns The parsed record.
 */
export function parseMolfile(text: string): ParsedMolfile {
  const lines = toLines(text);
  const end = lines.findIndex((line) => line.trim() === SDF_SEPARATOR);
  const record = end === -1 ? lines : lines.slice(0, end);
  return parseMolRecord(record);
}

/**
 * Parse an SDF file into one {@link ParsedMolfile} per record.
 *
 * Records are separated by a line that is exactly `$$$$`. The data-item section
 * after each molecule is ignored. A trailing separator does not add an empty
 * record.
 * @param text - The SDF file contents.
 * @returns One parsed record per molecule, in file order.
 */
export function parseSdf(text: string): ParsedMolfile[] {
  const lines = toLines(text);
  const records: ParsedMolfile[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.trim() === SDF_SEPARATOR) {
      if (current.some((l) => l.trim() !== '')) {
        records.push(parseMolRecord(current));
      }
      current = [];
      continue;
    }
    current.push(line);
  }
  if (current.some((l) => l.trim() !== '')) {
    records.push(parseMolRecord(current));
  }
  if (records.length === 0) {
    throw new Error('Molfile: the SDF text holds no molecule record.');
  }
  return records;
}

/**
 * Parse a MOL / SDF string and build a {@link MoleculeMobject} from the first
 * record.
 * @param text - The MOL block or SDF file contents.
 * @param options - Extra molecule options (bond length, colors, and so on).
 * @returns The constructed molecule.
 */
export function moleculeFromMolfile(
  text: string,
  options: Omit<MoleculeOptions, 'atoms' | 'bonds'> = {},
): MoleculeMobject {
  const parsed = parseMolfile(text);
  return new MoleculeMobject({ ...options, atoms: parsed.atoms, bonds: parsed.bonds });
}
