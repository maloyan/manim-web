/**
 * tangleSource - the pure half of TangleTex.
 *
 * Validates parameter and matrix configuration, and expands the
 * `\tangle{name}` and `\tanglematrix{name}` markers of a template into
 * MathJax LaTeX. Every marker becomes a `\class{...}` group, so after
 * rendering each glyph can be traced back to the marker it came from
 * (see getGlyphClasses).
 */

/** Configuration of one draggable number. */
export interface TangleParam {
  /** Initial value. Must lie in [min, max]. */
  value: number;
  /** Lower bound. Default: -Infinity. */
  min?: number;
  /** Upper bound. Default: +Infinity. */
  max?: number;
  /** Snap increment, > 0. Default: 1. */
  step?: number;
  /** Decimal places shown. Default: the number of decimals in `step`. */
  digits?: number;
  /**
   * `'number'` shows the value. `'symbol'` shows `symbol` until the value is
   * revealed (e.g. while it is dragged). Default: `'number'`.
   */
  display?: 'number' | 'symbol';
  /** LaTeX shown when `display` is `'symbol'`. Default: the parameter name. */
  symbol?: string;
  /** Color of this parameter's glyphs. Default: the TangleTex color. */
  color?: string;
  /** Drag distance, in pixels, for one `step`. Default: 7. */
  pixelsPerStep?: number;
  /** Accessible name. Default: `parameter <name>`. */
  label?: string;
  /**
   * Show the value but do not let the reader drag, type or focus it: for
   * results computed from the other parameters. Set it from code with
   * `setValue`. Default: false.
   */
  readOnly?: boolean;
}

/** Matrix delimiters: the amsmath matrix environments. */
export type TangleMatrixBrackets = 'bmatrix' | 'pmatrix' | 'vmatrix' | 'Bmatrix' | 'Vmatrix';

/** Configuration of a matrix that collapses to a symbol. */
export interface TangleMatrix {
  /**
   * Rows of cells. A string cell is LaTeX and may contain any number of
   * `\tangle{name}` markers. A number cell becomes a parameter named
   * `<matrix>_<row>_<col>` (1-based) with that value and the `cell` defaults.
   */
  entries: (string | number)[][];
  /** LaTeX shown while collapsed. Default: the matrix name. */
  symbol?: string;
  /** Delimiters. Default: `'bmatrix'`. */
  brackets?: TangleMatrixBrackets;
  /** Defaults for the parameters that number cells create. */
  cell?: Omit<TangleParam, 'value'>;
  /** Start expanded. Default: false. */
  expanded?: boolean;
  /** Color of the matrix glyphs (parameter colors still apply inside). */
  color?: string;
  /**
   * The matrix's numeric value, for {@link TangleTex.getMatrix}, when its
   * cells are expressions rather than single parameters.
   */
  evaluate?: (values: Record<string, number>) => number[][];
}

/** A parameter with every default filled in. */
export interface ResolvedTangleParam {
  readonly name: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly digits: number;
  readonly display: 'number' | 'symbol';
  readonly symbol: string;
  readonly color: string | undefined;
  readonly pixelsPerStep: number;
  readonly label: string;
  readonly readOnly: boolean;
}

/** A matrix with every default filled in and its cells as LaTeX. */
export interface ResolvedTangleMatrix {
  readonly name: string;
  readonly cells: readonly (readonly string[])[];
  /** Per cell, the parameter it consists of, or null for an expression cell. */
  readonly cellParams: readonly (readonly (string | null)[])[];
  /** Every parameter the cells reference. */
  readonly params: ReadonlySet<string>;
  readonly symbol: string;
  readonly brackets: TangleMatrixBrackets;
  readonly expanded: boolean;
  readonly color: string | undefined;
  readonly evaluate: TangleMatrix['evaluate'];
}

/** Validated configuration of a TangleTex. */
export interface TangleSpec {
  readonly template: string;
  readonly params: ReadonlyMap<string, ResolvedTangleParam>;
  readonly matrices: ReadonlyMap<string, ResolvedTangleMatrix>;
  /** How many `\tanglematrix{name}` markers the template has, per matrix. */
  readonly matrixOccurrences: ReadonlyMap<string, number>;
}

/** What a `\class` tag in the expanded LaTeX stands for. */
export interface TangleTag {
  readonly kind: 'param' | 'matrix';
  readonly name: string;
  /** Index among the markers of this name, in template order. */
  readonly occurrence: number;
}

/** Display state that decides how the template expands. */
export interface TangleDisplayState {
  readonly values: ReadonlyMap<string, number>;
  /** Symbol-display parameters currently shown as numbers. */
  readonly revealed: ReadonlySet<string>;
  /** Expanded matrix occurrences, as {@link matrixKey} strings. */
  readonly expanded: ReadonlySet<string>;
}

/** Expanded LaTeX plus the meaning of each `\class` tag in it. */
export interface TangleExpansion {
  readonly latex: string;
  /** Class name -> tag, for every marker that produces glyphs. */
  readonly tags: ReadonlyMap<string, TangleTag>;
}

const NAME_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;
const MARKER_RE = /\\tangle(matrix)?\{([^{}]*)\}/g;
const BRACKETS: readonly TangleMatrixBrackets[] = [
  'bmatrix',
  'pmatrix',
  'vmatrix',
  'Bmatrix',
  'Vmatrix',
];

/** Key of one matrix occurrence in {@link TangleDisplayState.expanded}. */
export function matrixKey(name: string, occurrence: number): string {
  return `${name}#${occurrence}`;
}

/** `\class` name of a marker occurrence. */
function className(tag: TangleTag): string {
  return `tangle-${tag.kind === 'param' ? 'p' : 'm'}-${tag.name}-${tag.occurrence}`;
}

/** Decimal places of `step`, e.g. 0.05 -> 2, 1 -> 0. */
function decimalsOf(step: number): number {
  const text = String(step);
  const exp = /e-(\d+)$/.exec(text);
  if (exp) return Number(exp[1]);
  return (text.split('.')[1] ?? '').length;
}

/**
 * Format a value with `digits` decimals, without a `-0`.
 *
 * @post Number(result) === Number(value.toFixed(digits)) || Number(result) === 0
 */
export function formatTangleValue(value: number, digits: number): string {
  const text = value.toFixed(digits);
  return Number(text) === 0 ? (0).toFixed(digits) : text;
}

/**
 * Snap a value to the parameter's step grid (anchored at `min` when it is
 * finite, else at 0) and clamp it to [min, max].
 *
 * @post param.min <= result && result <= param.max
 */
export function snapTangleValue(value: number, param: ResolvedTangleParam): number {
  const origin = Number.isFinite(param.min) ? param.min : 0;
  const snapped = origin + Math.round((value - origin) / param.step) * param.step;
  // Remove float noise such as 0.30000000000000004 from the snap.
  const clean = Number(snapped.toFixed(decimalsOf(param.step) + 6));
  return Math.min(param.max, Math.max(param.min, clean));
}

function fail(message: string): never {
  throw new Error(`TangleTex: ${message}`);
}

function checkName(name: string, what: string): void {
  if (!NAME_RE.test(name)) {
    fail(
      `${what} name '${name}' must start with a letter and contain only letters, numbers, underscores, or hyphens.`,
    );
  }
}

function optionalNumber(raw: unknown, fallback: number, name: string, field: string): number {
  if (raw === undefined) return fallback;
  if (typeof raw !== 'number' || Number.isNaN(raw)) {
    fail(`parameter '${name}' ${field} must be a number.`);
  }
  return raw;
}

function optionalString(raw: unknown, fallback: string, owner: string, field: string): string {
  if (raw === undefined) return fallback;
  if (typeof raw !== 'string' || raw === '') fail(`${owner} ${field} must be a non-empty string.`);
  return raw;
}

/** The numeric fields of a parameter config, with defaults, checked. */
function resolveNumbers(
  name: string,
  raw: TangleParam,
): Pick<ResolvedTangleParam, 'value' | 'min' | 'max' | 'step' | 'digits' | 'pixelsPerStep'> {
  const value = raw.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`parameter '${name}' value must be a finite number.`);
  }
  const min = optionalNumber(raw.min, -Infinity, name, 'min');
  const max = optionalNumber(raw.max, Infinity, name, 'max');
  const step = optionalNumber(raw.step, 1, name, 'step');
  if (!(min < max)) fail(`parameter '${name}' min must be less than max.`);
  if (!(step > 0) || !Number.isFinite(step)) fail(`parameter '${name}' step must be positive.`);
  if (value < min || value > max) fail(`parameter '${name}' value must lie in [min, max].`);
  const digits = optionalNumber(raw.digits, decimalsOf(step), name, 'digits');
  if (!Number.isInteger(digits) || digits < 0 || digits > 20) {
    fail(`parameter '${name}' digits must be an integer in [0, 20].`);
  }
  const pixelsPerStep = optionalNumber(raw.pixelsPerStep, 7, name, 'pixelsPerStep');
  if (!(pixelsPerStep > 0)) fail(`parameter '${name}' pixelsPerStep must be positive.`);
  return { value, min, max, step, digits, pixelsPerStep };
}

/** Fill defaults into a parameter config and check it. */
function resolveParam(name: string, raw: TangleParam): ResolvedTangleParam {
  checkName(name, 'parameter');
  const numbers = resolveNumbers(name, raw);
  const display = raw.display ?? 'number';
  if (display !== 'number' && display !== 'symbol') {
    fail(`parameter '${name}' display must be 'number' or 'symbol'.`);
  }
  const owner = `parameter '${name}'`;
  return {
    name,
    ...numbers,
    display,
    symbol: optionalString(raw.symbol, name, owner, 'symbol'),
    color: raw.color === undefined ? undefined : optionalString(raw.color, '', owner, 'color'),
    label: optionalString(raw.label, `parameter ${name}`, owner, 'label'),
    readOnly: raw.readOnly === true,
  };
}

/** Names of the `\tangle` / `\tanglematrix` markers in `latex`, in order. */
function markersIn(latex: string): Array<{ kind: 'param' | 'matrix'; name: string }> {
  return [...latex.matchAll(MARKER_RE)].map((m) => {
    const kind = m[1] ? 'matrix' : 'param';
    checkName(m[2], kind === 'param' ? 'parameter' : 'matrix');
    return { kind, name: m[2] };
  });
}

/** Turn a matrix config into LaTeX cells, creating parameters for number cells. */
function resolveMatrix(
  name: string,
  raw: TangleMatrix,
  params: Map<string, ResolvedTangleParam>,
): ResolvedTangleMatrix {
  checkName(name, 'matrix');
  const rows = raw.entries;
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(rows[0]) || !rows[0].length) {
    fail(`matrix '${name}' entries must be a non-empty array of non-empty rows.`);
  }
  const width = rows[0].length;
  const cells: string[][] = [];
  const cellParams: (string | null)[][] = [];
  rows.forEach((row, r) => {
    if (!Array.isArray(row) || row.length !== width) {
      fail(`matrix '${name}' rows must all have ${width} entries.`);
    }
    cells.push([]);
    cellParams.push([]);
    row.forEach((cell, c) => {
      if (typeof cell === 'number') {
        const cellName = `${name}_${r + 1}_${c + 1}`;
        if (params.has(cellName)) {
          fail(`matrix '${name}' number cell would create parameter '${cellName}', which exists.`);
        }
        params.set(cellName, resolveParam(cellName, { ...raw.cell, value: cell }));
        cells[r].push(`\\tangle{${cellName}}`);
        cellParams[r].push(cellName);
      } else if (typeof cell === 'string') {
        if (markersIn(cell).some((m) => m.kind === 'matrix')) {
          fail(`matrix '${name}' cells cannot contain \\tanglematrix markers.`);
        }
        cells[r].push(cell);
        const single = /^\s*\\tangle\{([^{}]*)\}\s*$/.exec(cell);
        cellParams[r].push(single ? single[1] : null);
      } else {
        fail(`matrix '${name}' cells must be LaTeX strings or numbers.`);
      }
    });
  });
  const brackets = raw.brackets ?? 'bmatrix';
  if (!BRACKETS.includes(brackets)) {
    fail(`matrix '${name}' brackets must be one of ${BRACKETS.join(', ')}.`);
  }
  const owner = `matrix '${name}'`;
  return {
    name,
    cells,
    cellParams,
    params: new Set(cells.flat().flatMap((cell) => markersIn(cell).map((m) => m.name))),
    symbol: optionalString(raw.symbol, name, owner, 'symbol'),
    brackets,
    expanded: raw.expanded ?? false,
    color: raw.color === undefined ? undefined : optionalString(raw.color, '', owner, 'color'),
    evaluate: raw.evaluate,
  };
}

/**
 * Validate a template and its configuration.
 *
 * Every marker must be configured, and every configured parameter and
 * matrix must be used (a parameter counts as used when a used matrix's
 * cells reference it).
 *
 * @throws Error naming the first problem found.
 */
export function resolveTangleSpec(
  template: string,
  parameters: Record<string, TangleParam>,
  matrices: Record<string, TangleMatrix>,
): TangleSpec {
  if (typeof template !== 'string') fail('latex must be a string.');
  const params = new Map<string, ResolvedTangleParam>();
  for (const [name, raw] of Object.entries(parameters)) params.set(name, resolveParam(name, raw));
  const resolvedMatrices = new Map<string, ResolvedTangleMatrix>();
  for (const [name, raw] of Object.entries(matrices)) {
    resolvedMatrices.set(name, resolveMatrix(name, raw, params));
  }

  const top = markersIn(template);
  if (top.length === 0) fail('latex must contain at least one \\tangle or \\tanglematrix marker.');

  const usedParams = new Set<string>();
  const matrixOccurrences = new Map<string, number>();
  for (const marker of top) {
    if (marker.kind === 'param') {
      usedParams.add(marker.name);
      continue;
    }
    const matrix = resolvedMatrices.get(marker.name);
    if (!matrix) fail(`missing configuration for matrix '${marker.name}'.`);
    matrixOccurrences.set(marker.name, (matrixOccurrences.get(marker.name) ?? 0) + 1);
    for (const row of matrix.cells) {
      for (const cell of row) for (const m of markersIn(cell)) usedParams.add(m.name);
    }
  }

  const missing = [...usedParams].filter((name) => !params.has(name)).sort();
  if (missing.length) fail(`missing configuration for parameter(s): ${missing.join(', ')}.`);
  const unusedParams = [...params.keys()].filter((name) => !usedParams.has(name)).sort();
  const unusedMatrices = [...resolvedMatrices.keys()].filter((n) => !matrixOccurrences.has(n));
  const unused = [...unusedParams, ...unusedMatrices.sort()];
  if (unused.length) fail(`configuration not referenced by latex: ${unused.join(', ')}.`);

  return { template, params, matrices: resolvedMatrices, matrixOccurrences };
}

/**
 * Expand the template's markers for the given display state.
 *
 * A parameter becomes `\class{tangle-p-<name>-<i>}{{...}}` around its
 * formatted value (or its symbol); a matrix becomes
 * `\class{tangle-m-<name>-<i>}{...}` around its matrix environment (or its
 * symbol). The inner braces keep a value such as `-2.5` an ordinary atom,
 * so its minus sign is not spaced as a binary operator.
 *
 * Occurrence numbers follow the template order and include the cells of
 * collapsed matrices, so they do not change when a matrix expands.
 * `result.tags` holds only the tags whose glyphs are rendered (not those
 * inside a collapsed matrix).
 */
export function expandTangle(spec: TangleSpec, state: TangleDisplayState): TangleExpansion {
  const tags = new Map<string, TangleTag>();
  const paramCount = new Map<string, number>();
  const matrixCount = new Map<string, number>();

  const next = (counts: Map<string, number>, name: string): number => {
    const occurrence = counts.get(name) ?? 0;
    counts.set(name, occurrence + 1);
    return occurrence;
  };

  // `visible` is false inside a collapsed matrix: the occurrence is counted
  // but produces no glyphs, so it gets no tag.
  const expandParams = (latex: string, visible: boolean): string =>
    latex.replace(MARKER_RE, (_match, _matrix: string | undefined, name: string) => {
      const param = spec.params.get(name) as ResolvedTangleParam;
      const tag: TangleTag = { kind: 'param', name, occurrence: next(paramCount, name) };
      if (visible) tags.set(className(tag), tag);
      const showNumber = param.display === 'number' || state.revealed.has(name);
      const value = state.values.get(name) ?? param.value;
      const content = showNumber ? formatTangleValue(value, param.digits) : param.symbol;
      return `\\class{${className(tag)}}{{${content}}}`;
    });

  const latex = spec.template.replace(
    MARKER_RE,
    (match, isMatrix: string | undefined, name: string) => {
      if (!isMatrix) return expandParams(match, true);
      const matrix = spec.matrices.get(name) as ResolvedTangleMatrix;
      const tag: TangleTag = { kind: 'matrix', name, occurrence: next(matrixCount, name) };
      tags.set(className(tag), tag);
      const expanded = state.expanded.has(matrixKey(name, tag.occurrence));
      const rows = matrix.cells.map((row) =>
        row.map((cell) => expandParams(cell, expanded)).join(' & '),
      );
      const body = expanded
        ? `\\begin{${matrix.brackets}}${rows.join(' \\\\ ')}\\end{${matrix.brackets}}`
        : `{${matrix.symbol}}`;
      return `\\class{${className(tag)}}{${body}}`;
    },
  );
  return { latex, tags };
}
