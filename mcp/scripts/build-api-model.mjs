#!/usr/bin/env node
// Build the grounded API model that the MCP server serves.
//
// Ground truth: TypeDoc's JSON API model. TypeDoc reads the real TypeScript
// source of `src/index.ts` (the library's full public export surface) and emits
// every exported symbol with its real signature, option fields and JSDoc. This
// script runs `typedoc --json` into a temp file, then distills that large model
// (tens of MB, includes the re-exported three.js types) into the compact
// `mcp/api-model.json` the server loads. The server never invents a symbol: it
// only answers from this file, so a regenerate keeps it truthful against the
// current source.
//
// Usage: node mcp/scripts/build-api-model.mjs
//   (or `npm run build:model` from inside mcp/)

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mcpDir = resolve(scriptDir, '..');
const repoRoot = resolve(mcpDir, '..');

// --- TypeDoc numeric ReflectionKind values (stable across 0.2x). ---
const KIND = {
  ENUM: 8,
  VARIABLE: 32,
  FUNCTION: 64,
  CLASS: 128,
  INTERFACE: 256,
  CONSTRUCTOR: 512,
  PROPERTY: 1024,
  ENUM_MEMBER: 16,
  TYPE_ALIAS: 2097152,
  REFERENCE: 4194304,
};

function findTypedocBin() {
  const candidates = [
    join(
      repoRoot,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'typedoc.cmd' : 'typedoc',
    ),
    join(mcpDir, 'node_modules', '.bin', process.platform === 'win32' ? 'typedoc.cmd' : 'typedoc'),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

function runTypedoc(outFile) {
  const bin = findTypedocBin();
  const args = [
    '--json',
    outFile,
    '--tsconfig',
    'tsconfig.typedoc.json',
    '--entryPointStrategy',
    'resolve',
    '--entryPoints',
    'src/index.ts',
    '--excludeExternals',
    '--excludePrivate',
    '--excludeInternal',
    '--skipErrorChecking',
    '--logLevel',
    'Error',
  ];
  const cmd = bin ? bin : 'npx';
  const finalArgs = bin ? args : ['--yes', 'typedoc', ...args];
  const res = spawnSync(cmd, finalArgs, { cwd: repoRoot, stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`typedoc exited with status ${res.status}`);
  }
}

// --- Render a TypeDoc "type" object into a readable TypeScript type string. ---
function renderType(t, depth = 0) {
  if (!t || depth > 6) return 'unknown';
  switch (t.type) {
    case 'intrinsic':
      return t.name;
    case 'literal':
      return typeof t.value === 'string' ? JSON.stringify(t.value) : String(t.value);
    case 'reference': {
      const name = t.name ?? refName(t.target) ?? 'unknown';
      if (Array.isArray(t.typeArguments) && t.typeArguments.length > 0) {
        return `${name}<${t.typeArguments.map((a) => renderType(a, depth + 1)).join(', ')}>`;
      }
      return name;
    }
    case 'array':
      return `${renderType(t.elementType, depth + 1)}[]`;
    case 'union':
      return t.types.map((x) => renderType(x, depth + 1)).join(' | ');
    case 'intersection':
      return t.types.map((x) => renderType(x, depth + 1)).join(' & ');
    case 'tuple':
      return `[${(t.elements ?? []).map((x) => renderType(x, depth + 1)).join(', ')}]`;
    case 'optional':
      return `${renderType(t.elementType, depth + 1)}?`;
    case 'rest':
      return `...${renderType(t.elementType, depth + 1)}`;
    case 'namedTupleMember':
      return `${t.name}${t.isOptional ? '?' : ''}: ${renderType(t.element, depth + 1)}`;
    case 'typeOperator':
      return `${t.operator} ${renderType(t.target, depth + 1)}`;
    case 'query':
      return `typeof ${renderType(t.queryType, depth + 1)}`;
    case 'indexedAccess':
      return `${renderType(t.objectType, depth + 1)}[${renderType(t.indexType, depth + 1)}]`;
    case 'templateLiteral':
      return 'string';
    case 'predicate':
      return t.targetType ? `${t.name} is ${renderType(t.targetType, depth + 1)}` : 'boolean';
    case 'conditional':
      return `${renderType(t.checkType, depth + 1)} extends ${renderType(t.extendsType, depth + 1)} ? ${renderType(t.trueType, depth + 1)} : ${renderType(t.falseType, depth + 1)}`;
    case 'mapped':
      return 'object';
    case 'inferred':
      return `infer ${t.name}`;
    case 'unknown':
      return t.name ?? 'unknown';
    case 'reflection':
      return renderReflectionType(t.declaration, depth);
    default:
      return 'unknown';
  }
}

function refName(target) {
  if (!target) return undefined;
  if (typeof target === 'object' && 'qualifiedName' in target) return target.qualifiedName;
  return undefined;
}

// A `reflection` type is an inline object or function type literal.
function renderReflectionType(decl, depth) {
  if (!decl) return 'object';
  if (Array.isArray(decl.signatures) && decl.signatures.length > 0) {
    const sig = decl.signatures[0];
    const params = (sig.parameters ?? [])
      .map((p) => `${p.name}: ${renderType(p.type, depth + 1)}`)
      .join(', ');
    return `(${params}) => ${renderType(sig.type, depth + 1)}`;
  }
  if (Array.isArray(decl.children) && decl.children.length > 0) {
    const fields = decl.children
      .map((c) => `${c.name}${c.flags?.isOptional ? '?' : ''}: ${renderType(c.type, depth + 1)}`)
      .join('; ');
    return `{ ${fields} }`;
  }
  return 'object';
}

// --- JSDoc comment helpers. ---
function commentToText(comment) {
  if (!comment || !Array.isArray(comment.summary)) return '';
  return comment.summary
    .map((p) => p.text ?? '')
    .join('')
    .trim();
}

function extractExamples(comment) {
  if (!comment || !Array.isArray(comment.blockTags)) return [];
  return comment.blockTags
    .filter((tag) => tag.tag === '@example')
    .map((tag) =>
      (tag.content ?? [])
        .map((p) => p.text ?? '')
        .join('')
        .trim(),
    )
    .filter(Boolean);
}

// Pull a "Default: X" value out of a doc string (destructuring defaults live in
// the constructor, not the interface, so the JSDoc text is the source of truth).
function extractDefault(doc) {
  if (!doc) return undefined;
  const m = doc.match(/Default:\s*`?([^.`\n]+)`?/i);
  return m ? m[1].trim() : undefined;
}

// --- Category from the source module path. ---
function categoryOf(fileName) {
  if (!fileName) return 'misc';
  if (/^src\/integrations\//.test(fileName)) return 'integrations';
  const m = fileName.match(/^src\/mobjects\/([^/]+)\//) || fileName.match(/^src\/([^/]+)\//);
  if (!m) return fileName.startsWith('src/') ? 'core' : 'misc';
  return m[1];
}

function sourceOf(node) {
  const s = node.sources?.[0];
  return s ? `${s.fileName}:${s.line}` : 'unknown';
}

// Parse the leading `/** ... */` block of a source file. Domain mobjects keep
// their authored description and @example in a file-header JSDoc block that
// TypeDoc does not attach to the class (so the class inherits the base-class
// comment instead). We recover it only for the file's primary export (basename
// === symbol name), reading the real source so the text stays grounded.
const headerDocCache = new Map();
function readSourceHeaderDoc(fileName) {
  if (!fileName) return null;
  if (headerDocCache.has(fileName)) return headerDocCache.get(fileName);
  let result = null;
  try {
    const text = readFileSync(join(repoRoot, fileName), 'utf8');
    const trimmed = text.replace(/^﻿/, '').trimStart();
    if (trimmed.startsWith('/**')) {
      const end = trimmed.indexOf('*/');
      if (end !== -1) {
        const raw = trimmed.slice(3, end);
        const body = raw
          .split('\n')
          .map((line) => line.replace(/^\s*\* ?/, '').replace(/\s+$/, ''))
          .join('\n')
          .trim();
        result = parseJsDocBody(body);
      }
    }
  } catch {
    result = null;
  }
  headerDocCache.set(fileName, result);
  return result;
}

function parseJsDocBody(body) {
  const lines = body.split('\n');
  const summaryLines = [];
  const examples = [];
  let current = null; // null | 'example'
  let buffer = [];
  const flush = () => {
    if (current === 'example') examples.push(buffer.join('\n').trim());
    buffer = [];
  };
  for (const line of lines) {
    const tagMatch = line.match(/^@(\w+)\s?(.*)$/);
    if (tagMatch) {
      flush();
      if (tagMatch[1] === 'example') {
        current = 'example';
        buffer = tagMatch[2] ? [tagMatch[2]] : [];
      } else {
        current = 'other';
        buffer = [];
      }
      continue;
    }
    if (current === null) summaryLines.push(line);
    else if (current === 'example') buffer.push(line);
  }
  flush();
  return {
    summary: stripLinkTags(summaryLines.join('\n').trim()),
    examples: examples.filter(Boolean),
  };
}

// Turn `{@link Target}` / `{@link Target | Display}` into readable text.
function stripLinkTags(text) {
  return text.replace(/\{@link\s+([^}|]+?)(?:\s*\|\s*([^}]+))?\}/g, (_m, target, display) =>
    (display ?? target).trim(),
  );
}

function paramDoc(p) {
  const doc = commentToText(p.comment);
  const out = {
    name: p.name,
    type: renderType(p.type),
    optional: Boolean(p.flags?.isOptional),
  };
  const def = p.defaultValue ?? extractDefault(doc);
  if (def !== undefined) out.default = String(def);
  if (doc) out.doc = doc;
  return out;
}

function fieldDoc(child) {
  const doc = commentToText(child.comment);
  const out = {
    name: child.name,
    type: renderType(child.type),
    optional: Boolean(child.flags?.isOptional),
  };
  const def = extractDefault(doc);
  if (def !== undefined) out.default = def;
  if (doc) out.doc = doc;
  return out;
}

function distill(doc) {
  const byId = new Map();
  for (const c of doc.children ?? []) byId.set(c.id, c);

  const symbols = [];

  // Index class summaries so we can detect comments TypeDoc inherited from a
  // base class (the subclass has no own JSDoc, so its "summary" is really the
  // parent's). These should not be presented as the subclass's description.
  const classSummary = new Map();
  const classParents = new Map();
  for (const c of doc.children ?? []) {
    if (c.kind === KIND.CLASS) {
      classSummary.set(c.name, commentToText(c.comment));
      classParents.set(c.name, (c.extendedTypes ?? []).map((t) => t.name).filter(Boolean));
    }
  }
  const isInheritedSummary = (name, summary) => {
    if (!summary) return false;
    const seen = new Set();
    const stack = [...(classParents.get(name) ?? [])];
    while (stack.length) {
      const parent = stack.pop();
      if (seen.has(parent)) continue;
      seen.add(parent);
      if (classSummary.get(parent) === summary) return true;
      stack.push(...(classParents.get(parent) ?? []));
    }
    return false;
  };

  const build = (node, overrideName) => {
    const name = overrideName ?? node.name;
    const fileName = node.sources?.[0]?.fileName;
    const base = {
      name,
      category: categoryOf(fileName),
      source: sourceOf(node),
      summary: commentToText(node.comment),
      examples: extractExamples(node.comment),
    };

    switch (node.kind) {
      case KIND.CLASS: {
        // Recover the authored description/examples from the source file header
        // when this class is the file's primary export.
        const baseName = fileName ? fileName.replace(/^.*\//, '').replace(/\.tsx?$/, '') : '';
        const header = baseName === node.name ? readSourceHeaderDoc(fileName) : null;
        let summary = base.summary;
        if (header?.summary) summary = header.summary;
        else if (isInheritedSummary(node.name, base.summary)) summary = '';
        const examples = base.examples.length ? base.examples : (header?.examples ?? []);
        const ctor = node.children?.find((c) => c.kind === KIND.CONSTRUCTOR);
        const sig = ctor?.signatures?.[0];
        const params = (sig?.parameters ?? []).map(paramDoc);
        const signature = `new ${name}(${params
          .map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
          .join(', ')})`;
        return {
          kind: 'class',
          ...base,
          summary,
          examples,
          extends: (node.extendedTypes ?? []).map((t) => renderType(t)),
          construct: { signature, params },
        };
      }
      case KIND.INTERFACE:
        return {
          kind: 'interface',
          ...base,
          extends: (node.extendedTypes ?? []).map((t) => renderType(t)),
          fields: (node.children ?? []).filter((c) => c.kind === KIND.PROPERTY).map(fieldDoc),
        };
      case KIND.FUNCTION:
        return {
          kind: 'function',
          ...base,
          signatures: (node.signatures ?? []).map((sig) => {
            const params = (sig.parameters ?? []).map(paramDoc);
            return {
              signature: `${name}(${params
                .map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
                .join(', ')}): ${renderType(sig.type)}`,
              params,
              returns: renderType(sig.type),
              summary: commentToText(sig.comment) || base.summary,
            };
          }),
        };
      case KIND.TYPE_ALIAS:
        return { kind: 'typeAlias', ...base, type: renderType(node.type) };
      case KIND.VARIABLE: {
        const out = { kind: 'variable', ...base, variableType: renderType(node.type) };
        if (node.defaultValue !== undefined) out.defaultValue = String(node.defaultValue);
        return out;
      }
      case KIND.ENUM:
        return {
          kind: 'enum',
          ...base,
          members: (node.children ?? [])
            .filter((c) => c.kind === KIND.ENUM_MEMBER)
            .map((c) => ({
              name: c.name,
              value:
                c.type?.type === 'literal' ? String(c.type.value) : String(c.defaultValue ?? ''),
            })),
        };
      default:
        return null;
    }
  };

  for (const node of doc.children ?? []) {
    if (node.kind === KIND.REFERENCE) {
      // Re-export alias (e.g. `Surface`, `cross`). Resolve its target and emit
      // a symbol under the alias name so the server can still describe it.
      const target = byId.get(node.target);
      if (!target) continue;
      const sym = build(target, node.name);
      if (sym) {
        sym.aliasOf = target.name;
        symbols.push(sym);
      }
      continue;
    }
    const sym = build(node);
    if (sym) symbols.push(sym);
  }

  // Deduplicate by name (keep the first). TypeDoc never duplicates top-level
  // exports, but alias resolution could collide with a real export.
  const seen = new Set();
  const unique = symbols.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
  unique.sort((a, b) => a.name.localeCompare(b.name));
  return unique;
}

function main() {
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  const tmp = mkdtempSync(join(tmpdir(), 'manim-web-typedoc-'));
  const rawFile = join(tmp, 'api.json');
  try {
    console.error('[build-api-model] running typedoc...');
    runTypedoc(rawFile);
    console.error('[build-api-model] distilling...');
    const doc = JSON.parse(readFileSync(rawFile, 'utf8'));
    const symbols = distill(doc);
    const model = {
      library: pkg.name,
      version: pkg.version,
      generatedAt: new Date().toISOString(),
      typedocVersion: doc.packageName ? (doc.schemaVersion ?? 'unknown') : 'unknown',
      symbolCount: symbols.length,
      symbols,
    };
    const outFile = join(mcpDir, 'api-model.json');
    writeFileSync(outFile, `${JSON.stringify(model, null, 2)}\n`, 'utf8');
    console.error(`[build-api-model] wrote ${symbols.length} symbols to ${outFile}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main();
