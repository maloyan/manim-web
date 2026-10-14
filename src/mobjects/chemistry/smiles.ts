/**
 * parseSmiles / moleculeFromSmiles - a SMILES parser and 2D skeletal layout.
 *
 * Reads a SMILES string (the organic subset) and returns an atom/bond graph
 * with generated 2D coordinates, the same {@link AtomSpec} / {@link BondSpec}
 * shapes a {@link MoleculeMobject} consumes. This mirrors the dependency
 * discipline of the MOL/SDF parser in `./molfile.ts`: no network and no file IO.
 * The layout lives in `./smilesLayout.ts`.
 *
 * Supported SMILES features:
 *  - Organic-subset atoms with no brackets: B C N O P S F Cl Br I and the
 *    aromatic lowercase forms b c n o p s.
 *  - Bracket atoms `[...]` with an isotope, an element, a charge and an explicit
 *    H count, for example `[NH4+]`, `[O-]`, `[13CH4]`, `[Mg++]`, `[Fe+3]`.
 *  - Bonds: a default single bond between adjacent atoms, `=` double, `#` triple,
 *    `-` explicit single, `:` aromatic (order 1 with an aromatic flag). Two
 *    adjacent aromatic atoms imply an aromatic bond.
 *  - Branches with `(` and `)`, nested to any depth.
 *  - Ring closures with a single digit, or `%nn` for a two-digit label. A bond
 *    symbol before the digit sets the ring-bond order.
 *  - Disconnected components with `.`.
 *
 * Not supported (parsed loosely or ignored, never a hard error):
 *  - Stereochemistry: tetrahedral `@` / `@@` inside brackets is read then
 *    dropped; the cis/trans bond marks `/` and `\` are treated as single bonds.
 *  - Aromaticity perception: only the lowercase SMILES spelling marks an atom or
 *    a bond aromatic. The parser does not infer aromaticity from a ring.
 *  - Atom classes such as `[CH3:1]`: the `:` class suffix inside a bracket is
 *    read then dropped.
 */

import { MoleculeMobject } from './MoleculeMobject';
import { AtomSpec, BondSpec, BondOrder, MoleculeOptions } from './chemistryTypes';
import { layoutGraph } from './smilesLayout';

/**
 * One parsed atom. It extends {@link AtomSpec} (element plus generated x,y) with
 * the extra chemistry a SMILES token can carry.
 */
export interface SmilesAtom extends AtomSpec {
  /** True when the atom was written in the aromatic lowercase form. */
  aromatic: boolean;
  /** Formal charge, 0 when none was written. */
  charge: number;
  /** Explicit hydrogen count from a bracket atom, 0 when none was written. */
  hcount: number;
  /** Isotope mass number from a bracket atom, or null when none was written. */
  isotope: number | null;
}

/**
 * One parsed bond. It extends {@link BondSpec} with an aromatic flag, since an
 * aromatic bond keeps order 1 for geometry but must still be known as aromatic.
 */
export interface SmilesBond extends BondSpec {
  /** True for a `:` bond or a bond between two aromatic atoms. */
  aromatic: boolean;
}

/** The parsed SMILES graph: atoms carry generated 2D x,y, bonds join them. */
export interface ParsedSmiles {
  /** The atoms, in SMILES order, each with generated 2D coordinates. */
  atoms: SmilesAtom[];
  /** The bonds, in the order they were created. */
  bonds: SmilesBond[];
}

/** The organic-subset element symbols allowed without brackets. */
const ORGANIC_ELEMENTS = new Set(['B', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I']);

/** The aromatic lowercase atom letters and the element each maps to. */
const AROMATIC_ELEMENTS: Readonly<Record<string, string>> = {
  b: 'B',
  c: 'C',
  n: 'N',
  o: 'O',
  p: 'P',
  s: 'S',
};

/**
 * Two-letter lowercase aromatic symbols, read before the single-letter table so
 * `[se]` is selenium, not sulfur with a dropped `e`.
 */
const TWO_LETTER_AROMATIC_ELEMENTS: Readonly<Record<string, string>> = {
  se: 'Se',
  te: 'Te',
  as: 'As',
};

/**
 * Known element symbols, used to validate a bracket atom. A symbol outside this
 * set is an error, so a typo such as `[Xx]` fails loudly instead of rendering.
 */
const KNOWN_ELEMENTS = new Set(
  (
    'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni ' +
    'Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I ' +
    'Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt ' +
    'Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr ' +
    'Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'
  ).split(' '),
);

/** Maps a bond symbol to its order. The `:` aromatic bond keeps order 1. */
const BOND_ORDERS: Readonly<Record<string, BondOrder>> = {
  '-': 1,
  '=': 2,
  '#': 3,
  ':': 1,
  '/': 1,
  '\\': 1,
};

/** A pending bond: the order and aromatic flag set by a bond symbol. */
interface PendingBond {
  order: BondOrder;
  aromatic: boolean;
  /** True when a bond symbol was written, false for the implicit default. */
  explicit: boolean;
}

/** The default (implicit) pending bond: a single, non-aromatic bond. */
function defaultBond(): PendingBond {
  return { order: 1, aromatic: false, explicit: false };
}

/** True when a character is an ASCII digit. */
function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

/** Build a plain organic (non-bracket) atom with default chemistry. */
function plainAtom(element: string, aromatic: boolean): SmilesAtom {
  return { element, x: 0, y: 0, aromatic, charge: 0, hcount: 0, isotope: null };
}

/** The raw graph a scan produces, before coordinates are generated. */
interface RawGraph {
  atoms: SmilesAtom[];
  bonds: SmilesBond[];
  /** Parallel to `bonds`: true for a bond made by a ring closure. */
  ringClosure: boolean[];
}

/** A cursor into a string: the text and the current read index. */
interface Cursor {
  text: string;
  i: number;
}

/** Read a run of digits at the cursor and return it (may be empty). */
function readDigits(cur: Cursor): string {
  let out = '';
  while (cur.i < cur.text.length && isDigit(cur.text[cur.i])) {
    out += cur.text[cur.i];
    cur.i++;
  }
  return out;
}

/**
 * Read the element of a bracket atom at the cursor.
 * @param cur - The cursor into the bracket body.
 * @param body - The whole bracket body, for error messages.
 * @returns The canonical element symbol and whether it was aromatic lowercase.
 */
function readBracketElement(cur: Cursor, body: string): { element: string; aromatic: boolean } {
  const ch = cur.text[cur.i];
  if (ch !== undefined && ch >= 'A' && ch <= 'Z') {
    const two = cur.text.slice(cur.i, cur.i + 2);
    if (two.length === 2 && two[1] >= 'a' && two[1] <= 'z' && KNOWN_ELEMENTS.has(two)) {
      cur.i += 2;
      return { element: two, aromatic: false };
    }
    if (!KNOWN_ELEMENTS.has(ch)) {
      throw new Error(`SMILES: unknown element "${ch}" in bracket atom "[${body}]".`);
    }
    cur.i += 1;
    return { element: ch, aromatic: false };
  }
  if (ch !== undefined && ch >= 'a' && ch <= 'z') {
    return readLowercaseAromatic(cur, body);
  }
  throw new Error(`SMILES: bracket atom "[${body}]" has no element symbol.`);
}

/**
 * Read a lowercase aromatic element at the cursor (already known to start with
 * a lowercase letter). A two-letter aromatic (`se`, `te`, `as`) is tried before
 * the single-letter table, so the second letter is not left behind.
 */
function readLowercaseAromatic(cur: Cursor, body: string): { element: string; aromatic: boolean } {
  const two = cur.text.slice(cur.i, cur.i + 2);
  const twoUpper =
    two.length === 2 && two[1] >= 'a' && two[1] <= 'z'
      ? TWO_LETTER_AROMATIC_ELEMENTS[two]
      : undefined;
  if (twoUpper !== undefined) {
    cur.i += 2;
    return { element: twoUpper, aromatic: true };
  }
  const ch = cur.text[cur.i];
  const upper = AROMATIC_ELEMENTS[ch];
  if (upper === undefined) {
    throw new Error(`SMILES: unknown aromatic element "${ch}" in bracket atom "[${body}]".`);
  }
  cur.i += 1;
  return { element: upper, aromatic: true };
}

/** Read an explicit hydrogen count (`H` with an optional digit) at the cursor. */
function readHcount(cur: Cursor): number {
  if (cur.text[cur.i] !== 'H') {
    return 0;
  }
  cur.i++;
  const digits = readDigits(cur);
  return digits === '' ? 1 : Number.parseInt(digits, 10);
}

/** Read a charge (`+`, `-`, `++`, `+2`, and so on) at the cursor. */
function readCharge(cur: Cursor): number {
  const sign = cur.text[cur.i];
  if (sign !== '+' && sign !== '-') {
    return 0;
  }
  const unit = sign === '+' ? 1 : -1;
  cur.i++;
  let same = 1;
  while (cur.text[cur.i] === sign) {
    same++;
    cur.i++;
  }
  const digits = readDigits(cur);
  return digits !== '' ? unit * Number.parseInt(digits, 10) : unit * same;
}

/**
 * Parse the body of a bracket atom (the text between `[` and `]`).
 * @param body - The inner text, for example `NH4+` or `13CH4`.
 * @returns The parsed atom with x,y set to 0 (the layout fills them later).
 */
function parseBracketAtom(body: string): SmilesAtom {
  const cur: Cursor = { text: body, i: 0 };
  const isotopeDigits = readDigits(cur);
  const isotope = isotopeDigits === '' ? null : Number.parseInt(isotopeDigits, 10);
  const { element, aromatic } = readBracketElement(cur, body);
  // Chirality: @ or @@. Read then drop (stereochemistry is not laid out).
  while (cur.text[cur.i] === '@') {
    cur.i++;
  }
  const hcount = readHcount(cur);
  const charge = readCharge(cur);
  // Anything left (an atom class such as `:1`) is dropped.
  return { element, x: 0, y: 0, aromatic, charge, hcount, isotope };
}

/**
 * Read an organic-subset atom at `pos` in the string.
 * @param smiles - The whole SMILES string.
 * @param pos - The index of the first character of the atom.
 * @returns The parsed atom and the number of characters it used.
 */
function readOrganicAtom(smiles: string, pos: number): { atom: SmilesAtom; length: number } {
  const ch = smiles[pos];
  // Two-letter organic elements first, so `Cl` is not read as `C` then `l`.
  const two = smiles.slice(pos, pos + 2);
  if (two === 'Cl' || two === 'Br') {
    return { atom: plainAtom(two, false), length: 2 };
  }
  if (ch >= 'A' && ch <= 'Z') {
    if (!ORGANIC_ELEMENTS.has(ch)) {
      throw new Error(
        `SMILES: element "${ch}" is not in the organic subset; write it in brackets, ` +
          `for example [${ch}].`,
      );
    }
    return { atom: plainAtom(ch, false), length: 1 };
  }
  const upper = AROMATIC_ELEMENTS[ch];
  if (upper === undefined) {
    throw new Error(`SMILES: unexpected character "${ch}" at position ${pos}.`);
  }
  return { atom: plainAtom(upper, true), length: 1 };
}

/** A ring label that has been opened and waits for its closing digit. */
interface OpenRing {
  atom: number;
  pending: PendingBond;
}

/**
 * Add a bond to the graph, resolving its order and aromatic flag.
 * @param graph - The graph being built.
 * @param from - The first atom index.
 * @param to - The second atom index.
 * @param pending - The pending bond set by a bond symbol, or the default.
 * @param ringClosure - True when this bond comes from a ring closure.
 */
function addBond(
  graph: RawGraph,
  from: number,
  to: number,
  pending: PendingBond,
  ringClosure: boolean,
): void {
  // An aromatic bond is one written with `:` or one between two aromatic atoms.
  const bothAromatic = graph.atoms[from].aromatic && graph.atoms[to].aromatic;
  const aromatic = pending.aromatic || (!pending.explicit && bothAromatic);
  graph.bonds.push({ from, to, order: pending.order, aromatic });
  graph.ringClosure.push(ringClosure);
}

/**
 * Read a ring label at `pos`: a single digit, or `%` then two digits.
 * @param smiles - The SMILES string.
 * @param pos - The index of the digit or `%`.
 * @returns The label text and the characters it used.
 */
function readRingLabel(smiles: string, pos: number): { label: string; length: number } {
  if (smiles[pos] === '%') {
    const two = smiles.slice(pos + 1, pos + 3);
    if (two.length !== 2 || !isDigit(two[0]) || !isDigit(two[1])) {
      throw new Error(`SMILES: a "%" ring label at position ${pos} needs two digits.`);
    }
    return { label: `%${two}`, length: 3 };
  }
  return { label: smiles[pos], length: 1 };
}

/**
 * Open a ring label, or close it when it is already open.
 * @param graph - The graph being built.
 * @param openRings - The map of open ring labels.
 * @param label - The ring label text.
 * @param prev - The current atom index (the one bearing the label).
 * @param pending - The pending bond set by a bond symbol, or the default.
 * @param pos - The source position, used in error messages.
 */
function closeOrOpenRing(
  graph: RawGraph,
  openRings: Map<string, OpenRing>,
  label: string,
  prev: number | null,
  pending: PendingBond,
  pos: number,
): void {
  if (prev === null) {
    throw new Error(`SMILES: a ring label "${label}" at position ${pos} has no atom.`);
  }
  const open = openRings.get(label);
  if (open === undefined) {
    openRings.set(label, { atom: prev, pending });
    return;
  }
  // Close the ring. A bond order written at either end wins over the default.
  const bond = open.pending.explicit ? open.pending : pending;
  if (open.atom === prev) {
    throw new Error(`SMILES: ring label "${label}" at position ${pos} bonds an atom to itself.`);
  }
  addBond(graph, open.atom, prev, bond, true);
  openRings.delete(label);
}

/** The mutable state carried through the scan loop. */
interface ScanState {
  prev: number | null;
  pending: PendingBond;
}

/**
 * Handle one control character (branch, dot or bond symbol).
 * @returns True when the character was a control character and was handled.
 */
function handleControlChar(
  ch: string,
  state: ScanState,
  branchStack: number[],
  pos: number,
): boolean {
  if (ch === '(') {
    if (state.prev === null) {
      throw new Error(`SMILES: a branch "(" at position ${pos} has no atom to attach to.`);
    }
    branchStack.push(state.prev);
    return true;
  }
  if (ch === ')') {
    const top = branchStack.pop();
    if (top === undefined) {
      throw new Error(`SMILES: an unmatched ")" parenthesis at position ${pos}.`);
    }
    state.prev = top;
    return true;
  }
  if (ch === '.') {
    state.prev = null;
    state.pending = defaultBond();
    return true;
  }
  if (ch in BOND_ORDERS) {
    if (state.prev === null) {
      throw new Error(`SMILES: a bond symbol "${ch}" at position ${pos} has no preceding atom.`);
    }
    state.pending = { order: BOND_ORDERS[ch], aromatic: ch === ':', explicit: true };
    return true;
  }
  return false;
}

/**
 * Scan a SMILES string into an atom/bond graph, before layout.
 * @param smiles - The SMILES string.
 * @returns The raw graph.
 */
function scanSmiles(smiles: string): RawGraph {
  const graph: RawGraph = { atoms: [], bonds: [], ringClosure: [] };
  const branchStack: number[] = [];
  const openRings = new Map<string, OpenRing>();
  const state: ScanState = { prev: null, pending: defaultBond() };
  let i = 0;

  while (i < smiles.length) {
    const ch = smiles[i];

    if (handleControlChar(ch, state, branchStack, i)) {
      i++;
      continue;
    }
    if (ch === '%' || isDigit(ch)) {
      const { label, length } = readRingLabel(smiles, i);
      closeOrOpenRing(graph, openRings, label, state.prev, state.pending, i);
      state.pending = defaultBond();
      i += length;
      continue;
    }

    // Otherwise this is an atom.
    let atom: SmilesAtom;
    let length: number;
    if (ch === '[') {
      const end = smiles.indexOf(']', i);
      if (end === -1) {
        throw new Error(`SMILES: an unclosed bracket "[" at position ${i}.`);
      }
      atom = parseBracketAtom(smiles.slice(i + 1, end));
      length = end - i + 1;
    } else {
      const read = readOrganicAtom(smiles, i);
      atom = read.atom;
      length = read.length;
    }

    const index = graph.atoms.length;
    graph.atoms.push(atom);
    if (state.prev !== null) {
      addBond(graph, state.prev, index, state.pending, false);
    }
    state.prev = index;
    state.pending = defaultBond();
    i += length;
  }

  if (branchStack.length > 0) {
    const plural = branchStack.length === 1 ? 'is' : 'es';
    throw new Error(`SMILES: ${branchStack.length} unmatched "(" parenthes${plural}.`);
  }
  if (openRings.size > 0) {
    const labels = [...openRings.keys()].join(', ');
    throw new Error(`SMILES: ring label(s) ${labels} opened but never closed.`);
  }
  return graph;
}

/**
 * Parse a SMILES string into an atom/bond graph with 2D coordinates.
 * @param smiles - The SMILES string (organic subset).
 * @returns The parsed atoms and bonds.
 */
export function parseSmiles(smiles: string): ParsedSmiles {
  const graph = scanSmiles(smiles);
  layoutGraph(graph.atoms, graph.bonds, graph.ringClosure);
  return { atoms: graph.atoms, bonds: graph.bonds };
}

/**
 * Parse a SMILES string and build a {@link MoleculeMobject} from it.
 * @param smiles - The SMILES string (organic subset).
 * @param options - Extra molecule options (bond length, colors, and so on).
 * @returns The constructed molecule.
 */
export function moleculeFromSmiles(
  smiles: string,
  options: Omit<MoleculeOptions, 'atoms' | 'bonds'> = {},
): MoleculeMobject {
  const { atoms, bonds } = parseSmiles(smiles);
  return new MoleculeMobject({ ...options, atoms, bonds });
}
