// Load and query the grounded manim-web API model.
//
// The model is produced by scripts/build-api-model.mjs from TypeDoc's JSON
// output (the real exported source of src/index.ts). Every query answers only
// from this file, so the server cannot invent a symbol or an option.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type SymbolKind = 'class' | 'interface' | 'function' | 'typeAlias' | 'variable' | 'enum';

export interface ParamDoc {
  name: string;
  type: string;
  optional: boolean;
  default?: string;
  doc?: string;
}

export interface FieldDoc {
  name: string;
  type: string;
  optional: boolean;
  default?: string;
  doc?: string;
}

export interface FunctionSignature {
  signature: string;
  params: ParamDoc[];
  returns: string;
  summary?: string;
}

export interface ConstructDoc {
  signature: string;
  params: ParamDoc[];
}

export interface EnumMember {
  name: string;
  value: string;
}

export interface ApiSymbol {
  name: string;
  kind: SymbolKind;
  category: string;
  source: string;
  summary: string;
  examples: string[];
  extends?: string[];
  construct?: ConstructDoc;
  signatures?: FunctionSignature[];
  fields?: FieldDoc[];
  type?: string;
  variableType?: string;
  defaultValue?: string;
  members?: EnumMember[];
  aliasOf?: string;
}

export interface ApiModel {
  library: string;
  version: string;
  generatedAt: string;
  typedocVersion: string;
  symbolCount: number;
  symbols: ApiSymbol[];
}

export function defaultModelPath(): string {
  return fileURLToPath(new URL('../api-model.json', import.meta.url));
}

export function loadModel(path: string = defaultModelPath()): ApiModel {
  const raw = readFileSync(path, 'utf8');
  const model = JSON.parse(raw) as ApiModel;
  if (!Array.isArray(model.symbols)) {
    throw new Error(`Invalid API model at ${path}: missing "symbols" array.`);
  }
  return model;
}

// --- Indexing ---

export class ApiIndex {
  private readonly byName = new Map<string, ApiSymbol>();
  private readonly byLowerName = new Map<string, ApiSymbol>();

  constructor(public readonly model: ApiModel) {
    for (const s of model.symbols) {
      this.byName.set(s.name, s);
      this.byLowerName.set(s.name.toLowerCase(), s);
    }
  }

  get(name: string): ApiSymbol | undefined {
    return this.byName.get(name) ?? this.byLowerName.get(name.toLowerCase());
  }

  all(): ApiSymbol[] {
    return this.model.symbols;
  }

  categories(): Array<{ category: string; count: number }> {
    const counts = new Map<string, number>();
    for (const s of this.model.symbols) {
      counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  // Interface fields including those inherited from extended interfaces.
  resolveInterfaceFields(name: string, seen: Set<string> = new Set()): FieldDoc[] {
    if (seen.has(name)) return [];
    seen.add(name);
    const sym = this.get(name);
    if (!sym || sym.kind !== 'interface') return [];
    const inherited: FieldDoc[] = [];
    for (const parent of sym.extends ?? []) {
      const parentName = parent.replace(/<.*$/, '').trim();
      inherited.push(...this.resolveInterfaceFields(parentName, seen));
    }
    const own = sym.fields ?? [];
    const ownNames = new Set(own.map((f) => f.name));
    // Own fields win over inherited ones of the same name.
    return [...inherited.filter((f) => !ownNames.has(f.name)), ...own];
  }
}

// --- list_symbols ---

export interface ListEntry {
  name: string;
  kind: SymbolKind;
  category: string;
  summary: string;
}

export function listSymbols(
  index: ApiIndex,
  opts: { category?: string; kind?: SymbolKind } = {},
): ListEntry[] {
  const category = opts.category?.toLowerCase();
  return index
    .all()
    .filter((s) => (category ? s.category.toLowerCase() === category : true))
    .filter((s) => (opts.kind ? s.kind === opts.kind : true))
    .map((s) => ({
      name: s.name,
      kind: s.kind,
      category: s.category,
      summary: firstLine(s.summary),
    }));
}

// --- search ---

export interface SearchHit {
  name: string;
  kind: SymbolKind;
  category: string;
  summary: string;
  score: number;
}

export function search(index: ApiIndex, query: string, limit = 25): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const s of index.all()) {
    const name = s.name.toLowerCase();
    const summary = s.summary.toLowerCase();
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    if (summary.includes(q)) score = Math.max(score, 30);
    // Also match option/field names so "binding site" style queries surface.
    if (score === 0 && (s.fields ?? []).some((f) => f.name.toLowerCase().includes(q))) {
      score = 20;
    }
    if (score > 0) {
      hits.push({
        name: s.name,
        kind: s.kind,
        category: s.category,
        summary: firstLine(s.summary),
        score,
      });
    }
  }
  hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return hits.slice(0, limit);
}

// --- near matches (for unknown-symbol suggestions) ---

export function nearMatches(index: ApiIndex, name: string, limit = 5): string[] {
  const q = name.toLowerCase();
  const scored = index
    .all()
    .map((s) => ({ name: s.name, d: distance(q, s.name.toLowerCase()) }))
    .filter((x) => x.d <= Math.max(3, Math.floor(q.length / 2)) || x.name.toLowerCase().includes(q))
    .sort((a, b) => a.d - b.d || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map((x) => x.name);
}

// --- describe_symbol ---

export interface DescribeResult {
  found: boolean;
  text: string;
  symbol?: ApiSymbol;
  suggestions?: string[];
}

export function describeSymbol(index: ApiIndex, name: string): DescribeResult {
  const sym = index.get(name);
  if (!sym) {
    const suggestions = nearMatches(index, name);
    const hint = suggestions.length ? ` Did you mean: ${suggestions.join(', ')}?` : '';
    return {
      found: false,
      text: `Unknown symbol "${name}" in manim-web.${hint}`,
      suggestions,
    };
  }
  return { found: true, text: renderSymbol(index, sym), symbol: sym };
}

function renderSymbol(index: ApiIndex, sym: ApiSymbol): string {
  const lines: string[] = [];
  const alias = sym.aliasOf && sym.aliasOf !== sym.name ? ` (alias of ${sym.aliasOf})` : '';
  lines.push(`# ${sym.name}  —  ${sym.kind}, category: ${sym.category}${alias}`);
  lines.push(sym.source);
  if (sym.extends && sym.extends.length) lines.push(`extends ${sym.extends.join(', ')}`);
  lines.push('');
  if (sym.summary) {
    lines.push(sym.summary);
    lines.push('');
  }

  if (sym.kind === 'class' && sym.construct) {
    lines.push('## Constructor');
    lines.push('```typescript');
    lines.push(sym.construct.signature);
    lines.push('```');
    for (const p of sym.construct.params) {
      const expanded = expandParam(index, p);
      lines.push(...expanded);
    }
    lines.push('');
  }

  if (sym.kind === 'function' && sym.signatures) {
    lines.push('## Signatures');
    for (const sig of sym.signatures) {
      lines.push('```typescript');
      lines.push(sig.signature);
      lines.push('```');
      if (sig.summary && sig.summary !== sym.summary) lines.push(sig.summary);
      for (const p of sig.params) lines.push(formatParamLine(p));
      lines.push(`returns: ${sig.returns}`);
      lines.push('');
    }
  }

  if (sym.kind === 'interface') {
    const fields = index.resolveInterfaceFields(sym.name);
    lines.push(`## Fields (${fields.length})`);
    for (const f of fields) lines.push(formatFieldLine(f));
    lines.push('');
  }

  if (sym.kind === 'typeAlias' && sym.type) {
    lines.push('## Type');
    lines.push('```typescript');
    lines.push(`type ${sym.name} = ${sym.type}`);
    lines.push('```');
    lines.push('');
  }

  if (sym.kind === 'variable') {
    lines.push('## Value');
    lines.push('```typescript');
    const def = sym.defaultValue ? ` = ${sym.defaultValue}` : '';
    lines.push(`const ${sym.name}: ${sym.variableType ?? 'unknown'}${def}`);
    lines.push('```');
    lines.push('');
  }

  if (sym.kind === 'enum' && sym.members) {
    lines.push('## Members');
    for (const m of sym.members) lines.push(`- ${m.name} = ${m.value}`);
    lines.push('');
  }

  if (sym.examples.length) {
    lines.push('## Examples');
    for (const ex of sym.examples) {
      lines.push(ex);
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd();
}

function expandParam(index: ApiIndex, p: ParamDoc): string[] {
  const out: string[] = [formatParamLine(p)];
  const typeName = p.type.replace(/\[\]$/, '').replace(/<.*$/, '').trim();
  const ref = index.get(typeName);
  if (ref && ref.kind === 'interface') {
    const fields = index.resolveInterfaceFields(typeName);
    out.push(`  ${typeName} fields:`);
    for (const f of fields) out.push(`  ${formatFieldLine(f)}`);
  }
  return out;
}

function formatParamLine(p: ParamDoc): string {
  const def = p.default ? ` = ${p.default}` : '';
  const doc = p.doc ? `  — ${firstLine(p.doc)}` : '';
  return `- ${p.name}${p.optional ? '?' : ''}: ${p.type}${def}${doc}`;
}

function formatFieldLine(f: FieldDoc): string {
  const def = f.default ? ` = ${f.default}` : '';
  const doc = f.doc ? `  — ${firstLine(f.doc)}` : '';
  return `- ${f.name}${f.optional ? '?' : ''}: ${f.type}${def}${doc}`;
}

function firstLine(text: string): string {
  const line = text.split('\n').find((l) => l.trim().length > 0) ?? '';
  return line.trim();
}

// Levenshtein distance (bounded use, small strings).
function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}
