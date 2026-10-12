import { describe, it, expect } from 'vitest';
import { AminoAcidChain } from './AminoAcidChain';
import { VGroup } from '../../core/VGroup';
import { Circle } from '../geometry/Circle';
import { Line } from '../geometry/Line';
import { residueColor } from './biologyColors';

describe('AminoAcidChain', () => {
  it('is a VGroup so animations apply directly', () => {
    expect(new AminoAcidChain({ residues: ['M', 'A'] })).toBeInstanceOf(VGroup);
  });

  it('builds one bead per residue', () => {
    const chain = new AminoAcidChain({ residues: ['M', 'A', 'G', 'K', 'D'] });
    expect(chain.numResidues).toBe(5);
    expect(chain.getResidues()).toHaveLength(5);
    expect(chain.beadsGroup.children).toHaveLength(5);
    expect(chain.getResidue(0)?.bead).toBeInstanceOf(Circle);
  });

  it('joins adjacent residues with one peptide bond each', () => {
    const chain = new AminoAcidChain({ residues: ['M', 'A', 'G', 'K'] });
    // 4 residues give 3 bonds.
    expect(chain.getBonds()).toHaveLength(3);
    expect(chain.getBonds()[0]).toBeInstanceOf(Line);
  });

  it('labels each bead with its code by default', () => {
    const chain = new AminoAcidChain({ residues: ['M', 'A'] });
    expect(chain.labelsGroup.children).toHaveLength(2);
    expect(chain.getResidue(0)?.label?.getText()).toBe('M');
  });

  it('draws no labels when labels is false', () => {
    const chain = new AminoAcidChain({ residues: ['M', 'A'], labels: false });
    expect(chain.labelsGroup.children).toHaveLength(0);
    expect(chain.getResidue(0)?.label).toBeNull();
  });

  it('applies the residue palette color', () => {
    const chain = new AminoAcidChain({ residues: ['D', 'K'] });
    expect(chain.getResidue(0)?.color).toBe(residueColor('D'));
    expect(chain.getResidue(1)?.color).toBe(residueColor('K'));
    // An acidic and a basic residue differ in color.
    expect(chain.getResidue(0)?.color).not.toBe(chain.getResidue(1)?.color);
  });

  it('spaces beads evenly and centers the chain', () => {
    const chain = new AminoAcidChain({ residues: ['A', 'B', 'C'], spacing: 1, zigzag: false });
    expect(chain.getResidue(0)?.position[0]).toBeCloseTo(-1, 9);
    expect(chain.getResidue(1)?.position[0]).toBeCloseTo(0, 9);
    expect(chain.getResidue(2)?.position[0]).toBeCloseTo(1, 9);
  });

  it('is deterministic across builds with the same options', () => {
    const a = new AminoAcidChain({ residues: ['M', 'A', 'G'] });
    const b = new AminoAcidChain({ residues: ['M', 'A', 'G'] });
    for (let i = 0; i < a.numResidues; i++) {
      expect(a.getResidue(i)?.position).toEqual(b.getResidue(i)?.position);
      expect(a.getResidue(i)?.color).toBe(b.getResidue(i)?.color);
    }
  });

  // ===== Edge cases =====

  it('does not throw with an empty residue list', () => {
    expect(() => new AminoAcidChain({ residues: [] })).not.toThrow();
    const chain = new AminoAcidChain({ residues: [] });
    expect(chain.numResidues).toBe(0);
    expect(chain.getBonds()).toHaveLength(0);
  });

  it('builds no bond for a single residue', () => {
    const chain = new AminoAcidChain({ residues: ['M'] });
    expect(chain.numResidues).toBe(1);
    expect(chain.getBonds()).toHaveLength(0);
  });

  it('returns undefined for an out-of-range residue', () => {
    const chain = new AminoAcidChain({ residues: ['M', 'A'] });
    expect(chain.getResidue(99)).toBeUndefined();
  });

  it('copy() preserves the residue and bond counts', () => {
    const chain = new AminoAcidChain({ residues: ['M', 'A', 'G', 'K'] });
    const clone = chain.copy();
    expect(clone).toBeInstanceOf(AminoAcidChain);
    expect(clone.numResidues).toBe(chain.numResidues);
    expect(clone.getBonds()).toHaveLength(chain.getBonds().length);
  });
});
