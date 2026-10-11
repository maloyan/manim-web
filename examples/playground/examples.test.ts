import { describe, it, expect } from 'vitest';
import { examples, getExampleById, defaultCode, DEFAULT_EXAMPLE_ID } from './examples';

describe('example registry', () => {
  it('has at least three snippets', () => {
    expect(examples.length).toBeGreaterThanOrEqual(3);
  });

  it('has unique ids', () => {
    const ids = examples.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every snippet a title and non-empty code', () => {
    for (const example of examples) {
      expect(example.title.length).toBeGreaterThan(0);
      expect(example.code.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes at least one snippet that showcases a new feature', () => {
    expect(examples.some((e) => e.isNew)).toBe(true);
  });

  it('looks up a snippet by id', () => {
    const first = examples[0];
    expect(getExampleById(first.id)).toBe(first);
    expect(getExampleById('does-not-exist')).toBeUndefined();
  });

  it('resolves a default snippet', () => {
    expect(getExampleById(DEFAULT_EXAMPLE_ID)).toBeDefined();
    expect(defaultCode()).toBe(getExampleById(DEFAULT_EXAMPLE_ID)?.code);
  });
});
