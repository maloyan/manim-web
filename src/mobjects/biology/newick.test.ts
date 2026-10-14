import { describe, it, expect } from 'vitest';
import { parseNewick } from './newick';

/** Count the leaves (nodes with no children) in a parsed tree. */
function countLeaves(
  node: { children: { length: number }[] } | import('./newick').PhyloNode,
): number {
  const n = node as import('./newick').PhyloNode;
  if (n.children.length === 0) return 1;
  return n.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

describe('parseNewick', () => {
  it('parses a flat three-leaf tree with a nested clade', () => {
    const root = parseNewick('(A,B,(C,D));');
    expect(root.children).toHaveLength(3);
    expect(root.children[0].name).toBe('A');
    expect(root.children[1].name).toBe('B');
    // The third child is an internal clade of C and D.
    const clade = root.children[2];
    expect(clade.name).toBeUndefined();
    expect(clade.children).toHaveLength(2);
    expect(clade.children[0].name).toBe('C');
    expect(clade.children[1].name).toBe('D');
    expect(countLeaves(root)).toBe(4);
  });

  it('parses branch lengths after a colon', () => {
    const root = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
    expect(root.children).toHaveLength(2);
    const clade = root.children[0];
    expect(clade.branchLength).toBeCloseTo(0.3, 9);
    expect(clade.children[0].name).toBe('A');
    expect(clade.children[0].branchLength).toBeCloseTo(0.1, 9);
    expect(clade.children[1].name).toBe('B');
    expect(clade.children[1].branchLength).toBeCloseTo(0.2, 9);
    expect(root.children[1].name).toBe('C');
    expect(root.children[1].branchLength).toBeCloseTo(0.4, 9);
  });

  it('parses a single leaf', () => {
    const root = parseNewick('A;');
    expect(root.children).toHaveLength(0);
    expect(root.name).toBe('A');
    expect(countLeaves(root)).toBe(1);
  });

  it('parses an unnamed single leaf tree', () => {
    const root = parseNewick(';');
    expect(root.children).toHaveLength(0);
    expect(root.name).toBeUndefined();
  });

  it('keeps underscores in names', () => {
    const root = parseNewick('(Homo_sapiens,Pan_troglodytes);');
    expect(root.children[0].name).toBe('Homo_sapiens');
    expect(root.children[1].name).toBe('Pan_troglodytes');
  });

  it('parses quoted names with commas and parens inside', () => {
    const root = parseNewick("('Genus species (strain, 1)',B);");
    expect(root.children[0].name).toBe('Genus species (strain, 1)');
    expect(root.children[1].name).toBe('B');
  });

  it('unescapes a doubled quote inside a quoted name', () => {
    const root = parseNewick("('O''Brien',B);");
    expect(root.children[0].name).toBe("O'Brien");
  });

  it('parses a named internal node after the closing paren', () => {
    const root = parseNewick('(A,B)Clade1;');
    expect(root.name).toBe('Clade1');
    expect(root.children).toHaveLength(2);
  });

  it('tolerates surrounding whitespace and newlines', () => {
    const root = parseNewick('\n  (A, B) ; \n');
    expect(root.children).toHaveLength(2);
    expect(root.children[0].name).toBe('A');
    expect(root.children[1].name).toBe('B');
  });

  it('parses scientific-notation branch lengths', () => {
    const root = parseNewick('(A:1.5e-2,B:2E-1);');
    expect(root.children[0].branchLength).toBeCloseTo(0.015, 9);
    expect(root.children[1].branchLength).toBeCloseTo(0.2, 9);
  });

  // ===== Malformed input =====

  it('throws on an empty string', () => {
    expect(() => parseNewick('')).toThrow();
    expect(() => parseNewick('   ')).toThrow();
  });

  it('throws on unbalanced opening parentheses', () => {
    expect(() => parseNewick('((A,B);')).toThrow();
  });

  it('throws on unbalanced closing parentheses', () => {
    expect(() => parseNewick('(A,B));')).toThrow();
  });

  it('throws when the terminating semicolon is missing', () => {
    expect(() => parseNewick('(A,B)')).toThrow();
  });

  it('throws on an unterminated quoted name', () => {
    expect(() => parseNewick("('A,B);")).toThrow();
  });

  it('throws on a missing branch-length number', () => {
    expect(() => parseNewick('(A:,B);')).toThrow();
  });
});
