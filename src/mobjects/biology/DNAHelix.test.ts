import { describe, it, expect } from 'vitest';
import { DNAHelix } from './DNAHelix';
import { VGroup } from '../../core/VGroup';
import { Line } from '../geometry/Line';
import { ParametricFunction } from '../graphing/ParametricFunction';
import { baseColor, complementOf } from './biologyColors';
import type { Vector3Tuple } from '../../core/Mobject';

/** Assert two points are equal within a tolerance. */
function expectClose(a: Vector3Tuple, b: Vector3Tuple, eps = 1e-9): void {
  expect(Math.abs(a[0] - b[0])).toBeLessThan(eps);
  expect(Math.abs(a[1] - b[1])).toBeLessThan(eps);
  expect(Math.abs(a[2] - b[2])).toBeLessThan(eps);
}

describe('DNAHelix', () => {
  it('is a VGroup so animations apply directly', () => {
    expect(new DNAHelix()).toBeInstanceOf(VGroup);
  });

  it('builds exactly two backbone strands', () => {
    const dna = new DNAHelix({ turns: 2, basePairs: 6 });
    const strands = dna.getStrands();
    expect(strands).toHaveLength(2);
    expect(strands[0]).toBeInstanceOf(ParametricFunction);
    expect(strands[1]).toBeInstanceOf(ParametricFunction);
    expect(dna.strandsGroup.children).toHaveLength(2);
  });

  it('builds the requested number of base-pair rungs', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 10 });
    expect(dna.numBasePairs).toBe(10);
    expect(dna.getBasePairs()).toHaveLength(10);
    expect(dna.rungsGroup.children).toHaveLength(10);
    expect(dna.getBasePair(0)?.line).toBeInstanceOf(Line);
  });

  it('rung endpoints lie on the two helices', () => {
    const dna = new DNAHelix({ turns: 3, radius: 0.6, pitch: 1.2, basePairs: 9, threeD: true });
    for (const pair of dna.getBasePairs()) {
      expectClose(pair.start, dna.pointOnStrand(0, pair.t));
      expectClose(pair.end, dna.pointOnStrand(1, pair.t));
    }
  });

  it('the two strands are half a turn out of phase (opposite in x)', () => {
    const dna = new DNAHelix({ turns: 2, radius: 0.5, pitch: 1, basePairs: 4 });
    for (const pair of dna.getBasePairs()) {
      // Phase pi flips the x component of the 2D schematic strand.
      expect(pair.end[0]).toBeCloseTo(-pair.start[0], 9);
    }
  });

  it('more turns make a taller helix', () => {
    const shortHelix = new DNAHelix({ turns: 2, pitch: 1 });
    const tallHelix = new DNAHelix({ turns: 5, pitch: 1 });
    expect(tallHelix.getHelixHeight()).toBeGreaterThan(shortHelix.getHelixHeight());
    expect(tallHelix.getHelixHeight()).toBe(5);
  });

  it('colors each rung by its base when colorByBase is true', () => {
    const dna = new DNAHelix({ basePairs: 4, sequence: ['A', 'T', 'G', 'C'] });
    const pairs = dna.getBasePairs();
    expect(pairs[0].color).toBe(baseColor('A'));
    expect(pairs[1].color).toBe(baseColor('T'));
    expect(pairs[2].color).toBe(baseColor('G'));
    expect(pairs[3].color).toBe(baseColor('C'));
    // Different bases give different colors.
    expect(pairs[0].color).not.toBe(pairs[2].color);
  });

  it('uses the rung color when colorByBase is false', () => {
    const dna = new DNAHelix({ basePairs: 3, colorByBase: false, rungColor: '#123456' });
    for (const pair of dna.getBasePairs()) {
      expect(pair.color).toBe('#123456');
    }
  });

  it('assigns the Watson-Crick complement to the second strand base', () => {
    const dna = new DNAHelix({ basePairs: 4, sequence: ['A', 'T', 'G', 'C'] });
    const pairs = dna.getBasePairs();
    expect(pairs.map((p) => p.complement)).toEqual(['T', 'A', 'C', 'G']);
    for (const pair of pairs) {
      expect(pair.complement).toBe(complementOf(pair.base));
    }
  });

  it('repeats the default sequence when none is given', () => {
    const dna = new DNAHelix({ basePairs: 5 });
    expect(dna.getBasePairs().map((p) => p.base)).toEqual(['A', 'T', 'G', 'C', 'A']);
  });

  it('honors a per-base color override', () => {
    const dna = new DNAHelix({ basePairs: 1, sequence: ['A'], baseColors: { A: '#abcdef' } });
    expect(dna.getBasePair(0)?.color).toBe('#abcdef');
  });

  it('is deterministic across builds with the same options', () => {
    const options = { turns: 3, radius: 0.4, pitch: 1.1, basePairs: 7, threeD: true } as const;
    const a = new DNAHelix(options);
    const b = new DNAHelix(options);
    for (let i = 0; i < a.numBasePairs; i++) {
      expectClose(a.getBasePair(i)!.start, b.getBasePair(i)!.start);
      expectClose(a.getBasePair(i)!.end, b.getBasePair(i)!.end);
      expect(a.getBasePair(i)!.color).toBe(b.getBasePair(i)!.color);
    }
  });

  // ===== Edge cases =====

  it('does not throw with zero base pairs', () => {
    expect(() => new DNAHelix({ turns: 2, basePairs: 0 })).not.toThrow();
    const dna = new DNAHelix({ turns: 2, basePairs: 0 });
    expect(dna.numBasePairs).toBe(0);
    expect(dna.rungsGroup.children).toHaveLength(0);
    expect(dna.getStrands()).toHaveLength(2);
  });

  it('does not throw with zero turns', () => {
    expect(() => new DNAHelix({ turns: 0, basePairs: 4 })).not.toThrow();
    const dna = new DNAHelix({ turns: 0, basePairs: 4 });
    expect(dna.getHelixHeight()).toBe(0);
    expect(dna.numBasePairs).toBe(4);
  });

  it('does not throw with zero turns and zero base pairs', () => {
    expect(() => new DNAHelix({ turns: 0, basePairs: 0 })).not.toThrow();
  });

  it('returns undefined for an out-of-range base pair', () => {
    const dna = new DNAHelix({ basePairs: 2 });
    expect(dna.getBasePair(99)).toBeUndefined();
    expect(dna.getStrand(5)).toBeUndefined();
  });

  it('copy() preserves strand and base-pair counts', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 8, threeD: true });
    const clone = dna.copy();
    expect(clone).toBeInstanceOf(DNAHelix);
    expect(clone.numBasePairs).toBe(dna.numBasePairs);
    expect(clone.getStrands()).toHaveLength(2);
    expect(clone.getHelixHeight()).toBe(dna.getHelixHeight());
  });
});
