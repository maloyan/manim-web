import { describe, it, expect, vi } from 'vitest';
import { DNAHelix } from './DNAHelix';
import { logger } from '../../utils/logger';
import { VGroup } from '../../core/VGroup';
import { Line } from '../geometry/Line';
import { Circle } from '../geometry/Circle';
import { Sphere } from '../three-d/Sphere';
import { TubeFromPoints } from '../three-d/TubeFromPoints';
import { Bond3D } from '../three-d/Bond3D';
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

  it('builds the requested number of base pairs, each as two halves', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 10 });
    expect(dna.numBasePairs).toBe(10);
    expect(dna.getBasePairs()).toHaveLength(10);
    expect(dna.getBasePair(0)?.startBase).toBeInstanceOf(Line);
    expect(dna.getBasePair(0)?.endBase).toBeInstanceOf(Line);
    expect(dna.getBasePair(0)?.hBond).toBeInstanceOf(VGroup);
  });

  it('adds two halves and a hydrogen-bond group per pair (3D full-length rungs)', () => {
    // In 3D every rung is full length, so each pair contributes its two halves
    // plus one hydrogen-bond group: 3 children per pair.
    const dna = new DNAHelix({ turns: 3, basePairs: 10, threeD: true });
    expect(dna.rungsGroup.children).toHaveLength(30);
    for (const pair of dna.getBasePairs()) {
      expect(pair.hBond).toBeInstanceOf(VGroup);
    }
  });

  it('draws each base pair as two halves meeting at the axis center', () => {
    const dna = new DNAHelix({ turns: 3, radius: 0.6, pitch: 1.2, basePairs: 9, threeD: true });
    for (const pair of dna.getBasePairs()) {
      // The two halves start on their own backbone and run inward.
      expectClose(pair.startBase.getStart(), pair.start, 1e-6);
      expectClose(pair.endBase.getStart(), pair.end, 1e-6);
      // Their inner ends flank the center; the center is the start/end midpoint
      // and sits on the helix axis (x = y = 0 in 3D).
      const inner = [
        (pair.startBase.getEnd()[0] + pair.endBase.getEnd()[0]) / 2,
        (pair.startBase.getEnd()[1] + pair.endBase.getEnd()[1]) / 2,
        (pair.startBase.getEnd()[2] + pair.endBase.getEnd()[2]) / 2,
      ] as Vector3Tuple;
      expectClose(inner, pair.center, 1e-6);
      expect(Math.hypot(pair.center[0], pair.center[1])).toBeLessThan(1e-9);
    }
  });

  it('colors the two halves of a pair by complementary bases', () => {
    const dna = new DNAHelix({ basePairs: 4, sequence: ['A', 'T', 'G', 'C'] });
    const pair = dna.getBasePair(0)!;
    // A-half uses baseColor(A), the complementary T-half uses baseColor(T).
    expect(pair.base).toBe('A');
    expect(pair.complement).toBe('T');
    expect(pair.startBase.color).toBe(baseColor('A'));
    expect(pair.endBase.color).toBe(baseColor('T'));
    expect(pair.startBase.color).not.toBe(pair.endBase.color);
  });

  it('produces valid complementary pairs for the default sequence', () => {
    const dna = new DNAHelix({ basePairs: 8 });
    const valid = new Set(['A-T', 'T-A', 'G-C', 'C-G']);
    for (const pair of dna.getBasePairs()) {
      expect(pair.complement).toBe(complementOf(pair.base));
      expect(valid.has(`${pair.base}-${pair.complement}`)).toBe(true);
    }
  });

  it('gives a G-C pair three hydrogen bonds and an A-T pair two', () => {
    const dna = new DNAHelix({ basePairs: 4, sequence: ['A', 'T', 'G', 'C'] });
    const pairs = dna.getBasePairs();
    expect(pairs[0].base).toBe('A');
    expect(pairs[0].hBond?.children).toHaveLength(2);
    expect(pairs[2].base).toBe('G');
    expect(pairs[2].hBond?.children).toHaveLength(3);
    expect(pairs[3].base).toBe('C');
    expect(pairs[3].hBond?.children).toHaveLength(3);
  });

  it('omits the hydrogen-bond gap when baseGap is 0', () => {
    const dna = new DNAHelix({ basePairs: 4, baseGap: 0 });
    for (const pair of dna.getBasePairs()) {
      expect(pair.hBond).toBeNull();
    }
    // Only the two halves remain in the group, no hydrogen bonds.
    expect(dna.rungsGroup.children).toHaveLength(8);
  });

  it('builds both 2D and 3D base pairs without throwing', () => {
    expect(() => new DNAHelix({ basePairs: 6, threeD: false })).not.toThrow();
    expect(() => new DNAHelix({ basePairs: 6, threeD: true })).not.toThrow();
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

  it('in 2D the helix axis is Y and Z stays flat', () => {
    const dna = new DNAHelix({ turns: 2, radius: 0.7, pitch: 1, basePairs: 8 });
    const samples = [0, 0.5, 1, 1.5, 2].map((t) => dna.pointOnStrand(0, t));
    for (const point of samples) {
      expect(point[2]).toBe(0);
    }
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i][1]).toBeGreaterThan(samples[i - 1][1]);
    }
  });

  it('in 3D the helix axis is Z and the strands wind in X and Y', () => {
    const radius = 0.7;
    const dna = new DNAHelix({ turns: 2, radius, pitch: 1, basePairs: 8, threeD: true });
    const samples = [0, 0.5, 1, 1.5, 2].map((t) => dna.pointOnStrand(0, t));
    // The axis rises monotonically in Z (a ThreeDScene is Z-up).
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i][2]).toBeGreaterThan(samples[i - 1][2]);
    }
    // The winding stays on the radius circle in the XY plane.
    for (const point of samples) {
      expect(Math.hypot(point[0], point[1])).toBeCloseTo(radius, 9);
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

  it('warns and returns the origin for an out-of-range strand index', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    const dna = new DNAHelix({ basePairs: 2 });
    expect(dna.pointOnStrand(5, 0.5)).toEqual([0, 0, 0]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/strand index 5 is out of range/i);
    // A valid strand index neither warns nor returns the origin.
    const point = dna.pointOnStrand(0, 0.5);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(point).not.toEqual([0, 0, 0]);
    warn.mockRestore();
  });

  it('copy() preserves strand and base-pair counts', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 8, threeD: true });
    const clone = dna.copy();
    expect(clone).toBeInstanceOf(DNAHelix);
    expect(clone.numBasePairs).toBe(dna.numBasePairs);
    expect(clone.getStrands()).toHaveLength(2);
    expect(clone.getHelixHeight()).toBe(dna.getHelixHeight());
  });

  // ===== Nucleotide beads =====

  it('builds two nucleotide beads per base pair by default', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 10 });
    expect(dna.nucleotidesGroup.children).toHaveLength(20);
    const pair = dna.getBasePair(0);
    expect(pair?.startBead).toBeInstanceOf(Circle);
    expect(pair?.endBead).toBeInstanceOf(Circle);
  });

  it('in 3D the nucleotide beads are spheres', () => {
    const dna = new DNAHelix({ basePairs: 5, threeD: true });
    const pair = dna.getBasePair(0);
    expect(pair?.startBead).toBeInstanceOf(Sphere);
    expect(pair?.endBead).toBeInstanceOf(Sphere);
  });

  it('in 3D the backbone strands are solid tubes, not flat curves', () => {
    const dna = new DNAHelix({ turns: 2, basePairs: 6, threeD: true });
    const strands = dna.getStrands();
    expect(strands[0]).toBeInstanceOf(TubeFromPoints);
    expect(strands[1]).toBeInstanceOf(TubeFromPoints);
    // A flat ParametricFunction stroke would read as tape next to the spheres.
    expect(strands[0]).not.toBeInstanceOf(ParametricFunction);
  });

  it('in 3D the nucleobase halves are solid cylinders, not flat lines', () => {
    const dna = new DNAHelix({ turns: 2, basePairs: 6, threeD: true });
    for (const pair of dna.getBasePairs()) {
      expect(pair.startBase).toBeInstanceOf(Bond3D);
      expect(pair.endBase).toBeInstanceOf(Bond3D);
      expect(pair.startBase).not.toBeInstanceOf(Line);
      // The hydrogen bonds in 3D are thin cylinders too.
      for (const bond of pair.hBond!.children) {
        expect(bond).toBeInstanceOf(Bond3D);
      }
    }
  });

  it('places each bead on its backbone strand', () => {
    const dna = new DNAHelix({ turns: 2, basePairs: 6, threeD: true });
    for (const pair of dna.getBasePairs()) {
      expect(pair.startBead?.getCenter()[0]).toBeCloseTo(pair.start[0], 6);
      expect(pair.startBead?.getCenter()[1]).toBeCloseTo(pair.start[1], 6);
      expect(pair.endBead?.getCenter()[0]).toBeCloseTo(pair.end[0], 6);
      expect(pair.endBead?.getCenter()[1]).toBeCloseTo(pair.end[1], 6);
    }
  });

  it('colors the two beads of a pair by their own base', () => {
    const dna = new DNAHelix({ basePairs: 4, sequence: ['A', 'T', 'G', 'C'] });
    const pair = dna.getBasePair(0)!;
    expect(pair.startBead?.fillColor).toBe(baseColor('A'));
    expect(pair.endBead?.fillColor).toBe(baseColor('T'));
  });

  it('omits beads when showNucleotides is false', () => {
    const dna = new DNAHelix({ basePairs: 6, showNucleotides: false });
    expect(dna.nucleotidesGroup.children).toHaveLength(0);
    expect(dna.getBasePair(0)?.startBead).toBeNull();
    expect(dna.getBasePair(0)?.endBead).toBeNull();
  });

  // ===== Depth cue =====

  it('gives every rung a frontness in [0, 1]', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 12 });
    for (const pair of dna.getBasePairs()) {
      expect(pair.frontness).toBeGreaterThanOrEqual(0);
      expect(pair.frontness).toBeLessThanOrEqual(1);
    }
  });

  it('draws front rungs thicker and brighter than back rungs', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 12 });
    const pairs = dna.getBasePairs();
    const front = pairs.reduce((a, b) => (b.frontness > a.frontness ? b : a));
    const back = pairs.reduce((a, b) => (b.frontness < a.frontness ? b : a));
    expect(front.frontness).toBeGreaterThan(back.frontness);
    // 2D halves are flat Lines carrying the depth cue in stroke width + opacity.
    expect(front.startBase).toBeInstanceOf(Line);
    expect(back.startBase).toBeInstanceOf(Line);
    const frontLine = front.startBase as Line;
    const backLine = back.startBase as Line;
    expect(frontLine.strokeWidth).toBeGreaterThan(backLine.strokeWidth);
    expect(frontLine.opacity).toBeGreaterThan(backLine.opacity);
  });

  it('draws a bead at the front larger than its paired bead at the back', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 12 });
    const pair = dna.getBasePairs().reduce((a, b) => (b.frontness > a.frontness ? b : a));
    // The two beads of a pair are half a turn apart, so one leads the other.
    expect(pair.startBead!.getRadius()).toBeGreaterThan(pair.endBead!.getRadius());
    expect(pair.startBead!.opacity).toBeGreaterThan(pair.endBead!.opacity);
  });

  it('applies no depth variation when depthCue is false', () => {
    const dna = new DNAHelix({ turns: 3, basePairs: 12, depthCue: false });
    const widths = dna.getBasePairs().map((p) => (p.startBase as Line).strokeWidth);
    for (const pair of dna.getBasePairs()) {
      expect(pair.frontness).toBe(0.5);
      expect((pair.startBase as Line).opacity).toBe(1);
    }
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1e-9);
  });
});
