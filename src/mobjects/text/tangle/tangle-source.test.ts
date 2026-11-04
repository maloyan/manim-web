import { describe, it, expect } from 'vitest';
import {
  expandTangle,
  matrixKey,
  resolveTangleSpec,
  snapTangleValue,
  type TangleDisplayState,
} from './tangleSource';

const state = (
  values: Record<string, number> = {},
  revealed: string[] = [],
  expanded: string[] = [],
): TangleDisplayState => ({
  values: new Map(Object.entries(values)),
  revealed: new Set(revealed),
  expanded: new Set(expanded),
});

describe('resolveTangleSpec', () => {
  it('rejects configurations that do not match the markers', () => {
    const p = { a: { value: 1 } };
    expect(() => resolveTangleSpec('x', p, {})).toThrow(/at least one/);
    expect(() => resolveTangleSpec('\\tangle{b}', p, {})).toThrow(/missing configuration.*b/);
    expect(() =>
      resolveTangleSpec('\\tangle{a} + \\tangle{b}', { ...p, b: { value: 1 } }, {}),
    ).not.toThrow();
    expect(() => resolveTangleSpec('\\tangle{a}', { ...p, c: { value: 1 } }, {})).toThrow(
      /not referenced.*c/,
    );
    expect(() => resolveTangleSpec('\\tanglematrix{M}', {}, {})).toThrow(/matrix 'M'/);
  });

  it('rejects invalid parameter and matrix settings', () => {
    const one = (param: object) => () =>
      resolveTangleSpec('\\tangle{a}', { a: { value: 0, ...param } }, {});
    expect(one({ min: 1, max: 0 })).toThrow(/min must be less than max/);
    expect(one({ step: 0 })).toThrow(/step must be positive/);
    expect(one({ min: 1 })).toThrow(/value must lie/);
    expect(() =>
      resolveTangleSpec('\\tanglematrix{M}', {}, { M: { entries: [[1, 2], [3]] } }),
    ).toThrow(/rows must all have 2/);
  });

  it('creates a parameter per number cell, counted as used by the matrix', () => {
    const spec = resolveTangleSpec(
      '\\tanglematrix{M}',
      { k: { value: 2 } },
      { M: { entries: [[1, '\\tangle{k}x']], cell: { step: 0.5 } } },
    );
    expect([...spec.params.keys()].sort()).toEqual(['M_1_1', 'k']);
    expect(spec.params.get('M_1_1')).toMatchObject({ value: 1, step: 0.5, digits: 1 });
    expect(spec.matrices.get('M')?.cellParams).toEqual([['M_1_1', null]]);
  });
});

describe('expandTangle', () => {
  const spec = resolveTangleSpec(
    'y = \\tangle{a} + \\tanglematrix{M}\\tangle{a}',
    { a: { value: -0.04, step: 0.1, display: 'symbol', symbol: '\\alpha' }, b: { value: 3 } },
    { M: { entries: [['\\tangle{b}', '\\tangle{a}']] } },
  );

  it('shows symbols until revealed, and never prints -0', () => {
    expect(expandTangle(spec, state()).latex).toContain('{{\\alpha}}');
    const revealed = expandTangle(spec, state({}, ['a'])).latex;
    expect(revealed).toContain('{{0.0}}');
    expect(revealed).not.toContain('-0.0');
  });

  // MIGRATION: example for the property
  //   ∀ spec, states s1, s2 differing only in `expanded`: every tag present
  //   in both expansions has the same occurrence number.
  // Replace with a property test once the suite lands.
  it('numbers occurrences in template order, whether or not a matrix is expanded', () => {
    const collapsed = expandTangle(spec, state());
    const expanded = expandTangle(spec, state({}, [], [matrixKey('M', 0)]));

    // a#0 before the matrix, a#1 inside it (hidden while collapsed), a#2 after.
    expect([...collapsed.tags.keys()]).toEqual(['tangle-p-a-0', 'tangle-m-M-0', 'tangle-p-a-2']);
    expect([...expanded.tags.keys()].sort()).toEqual(
      ['tangle-m-M-0', 'tangle-p-a-0', 'tangle-p-a-1', 'tangle-p-a-2', 'tangle-p-b-0'].sort(),
    );
    expect(collapsed.latex).toContain('\\class{tangle-m-M-0}{{M}}');
    expect(expanded.latex).toContain('\\begin{bmatrix}');
  });
});

describe('snapTangleValue', () => {
  // MIGRATION: example for the property
  //   ∀ param p, value v: p.min <= snap(v) <= p.max and
  //   (snap(v) - p.min) / p.step is an integer (to display precision).
  // Replace with a property test once the suite lands.
  it('snaps to the step grid from min and clamps to the range', () => {
    const spec = resolveTangleSpec(
      '\\tangle{a}',
      { a: { value: 0.1, min: 0.1, max: 1, step: 0.2 } },
      {},
    );
    const a = spec.params.get('a')!;
    expect(snapTangleValue(0.42, a)).toBe(0.5);
    expect(snapTangleValue(7, a)).toBe(1);
    expect(snapTangleValue(-7, a)).toBe(0.1);
  });
});
