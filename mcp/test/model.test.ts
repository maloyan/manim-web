import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ApiIndex,
  describeSymbol,
  listSymbols,
  loadModel,
  nearMatches,
  search,
  type ApiModel,
} from '../src/model.js';

// The real, committed, generated model (offline — just a file read).
const realModel = loadModel();
const realIndex = new ApiIndex(realModel);

// A tiny hand-made fixture for pure-logic edge cases.
const fixturePath = fileURLToPath(new URL('./fixture.json', import.meta.url));
const fixtureModel = JSON.parse(readFileSync(fixturePath, 'utf8')) as ApiModel;
const fixtureIndex = new ApiIndex(fixtureModel);

describe('real model is well-formed and grounded', () => {
  it('loads many symbols for manim-web', () => {
    expect(realModel.library).toBe('manim-web');
    expect(realModel.symbols.length).toBeGreaterThan(500);
  });

  it('describe_symbol("Protein") returns its real options fields', () => {
    const r = describeSymbol(realIndex, 'Protein');
    expect(r.found).toBe(true);
    expect(r.symbol?.kind).toBe('class');
    expect(r.symbol?.category).toBe('molecular');
    expect(r.symbol?.construct?.signature).toBe('new Protein(options: ProteinOptions)');
    // Real ProteinOptions fields (exist in src/mobjects/molecular/Protein.ts).
    const opts = realIndex.get('ProteinOptions');
    const fieldNames = (opts?.fields ?? []).map((f) => f.name);
    expect(fieldNames).toContain('residues');
    expect(fieldNames).toContain('representation');
    expect(fieldNames).toContain('colorMode');
    // describe text inlines the options interface fields.
    expect(r.text).toContain('ProteinOptions fields:');
    expect(r.text).toContain('residues');
  });

  it('describe_symbol("ChoroplethMap") returns its real options fields', () => {
    const r = describeSymbol(realIndex, 'ChoroplethMap');
    expect(r.found).toBe(true);
    expect(r.symbol?.category).toBe('geo');
    const opts = realIndex.get('ChoroplethMapOptions');
    const fieldNames = (opts?.fields ?? []).map((f) => f.name);
    expect(fieldNames).toEqual(
      expect.arrayContaining(['geojson', 'value', 'colorScale', 'projection']),
    );
  });

  it('describe_symbol("DNAHelix") returns its real options fields', () => {
    const r = describeSymbol(realIndex, 'DNAHelix');
    expect(r.found).toBe(true);
    expect(r.symbol?.category).toBe('biology');
    const opts = realIndex.get('DNAHelixOptions');
    const fieldNames = (opts?.fields ?? []).map((f) => f.name);
    expect(fieldNames).toContain('basePairs');
    expect(fieldNames).toContain('colorByBase');
  });

  it('list_symbols({category:"molecular"}) includes the core molecular mobjects', () => {
    const names = listSymbols(realIndex, { category: 'molecular' }).map((e) => e.name);
    expect(names).toEqual(
      expect.arrayContaining(['Molecule3D', 'MolecularSurface', 'BindingPocket']),
    );
  });

  it('list_symbols filters by kind', () => {
    const classes = listSymbols(realIndex, { category: 'molecular', kind: 'class' });
    expect(classes.every((e) => e.kind === 'class')).toBe(true);
    expect(classes.map((e) => e.name)).toContain('BindingPocket');
  });

  it('search("binding") finds BindingPocket', () => {
    const hits = search(realIndex, 'binding');
    expect(hits.map((h) => h.name)).toContain('BindingPocket');
    // name match ranks above summary-only match.
    expect(hits[0].name.toLowerCase()).toContain('binding');
  });

  it('unknown symbol is handled gracefully with a near-match suggestion', () => {
    const r = describeSymbol(realIndex, 'Protien');
    expect(r.found).toBe(false);
    expect(r.suggestions).toContain('Protein');
    expect(r.text).toContain('Unknown symbol');
  });

  it('does not invent symbols: a nonsense name returns not found', () => {
    const r = describeSymbol(realIndex, 'TotallyMadeUpThing42');
    expect(r.found).toBe(false);
  });

  it('every category is derived (no empty category)', () => {
    expect(realModel.symbols.every((s) => s.category && s.category.length > 0)).toBe(true);
  });
});

describe('query logic (fixture)', () => {
  it('merges inherited interface fields, own field wins on conflict', () => {
    const fields = fixtureIndex.resolveInterfaceFields('WidgetOptions');
    const byName = new Map(fields.map((f) => [f.name, f]));
    expect(byName.has('size')).toBe(true);
    expect(byName.has('color')).toBe(true);
    // WidgetOptions overrides BaseOptions.color default.
    expect(byName.get('color')?.default).toBe("'blue'");
  });

  it('describe_symbol inlines options interface fields for a class', () => {
    const r = describeSymbol(fixtureIndex, 'Widget');
    expect(r.found).toBe(true);
    expect(r.text).toContain('new Widget(options: WidgetOptions)');
    expect(r.text).toContain('WidgetOptions fields:');
    expect(r.text).toContain('size');
    expect(r.text).toContain('color');
  });

  it('describe_symbol renders a function signature with params and return', () => {
    const r = describeSymbol(fixtureIndex, 'makeWidget');
    expect(r.text).toContain('makeWidget(size: number): Widget');
    expect(r.text).toContain('returns: Widget');
  });

  it('describe_symbol renders a variable with its value', () => {
    const r = describeSymbol(fixtureIndex, 'DEMO_SCALE');
    expect(r.text).toContain('const DEMO_SCALE: number = 2');
  });

  it('search matches option-field names', () => {
    const hits = search(fixtureIndex, 'size');
    expect(hits.map((h) => h.name)).toContain('WidgetOptions');
  });

  it('nearMatches suggests a close name', () => {
    expect(nearMatches(fixtureIndex, 'Widgett')).toContain('Widget');
  });

  it('lookup is case-insensitive as a fallback', () => {
    expect(fixtureIndex.get('widget')?.name).toBe('Widget');
  });
});
