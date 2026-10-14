import { describe, it, expect } from 'vitest';
import { PhylogeneticTree } from './PhylogeneticTree';
import { VGroup } from '../../core/VGroup';
import { Line } from '../geometry/Line';
import { Dot } from '../geometry/Dot';

describe('PhylogeneticTree', () => {
  it('is a VGroup so animations apply directly', () => {
    const tree = new PhylogeneticTree({ newick: '(A,B,(C,D));' });
    expect(tree).toBeInstanceOf(VGroup);
  });

  it('builds one leaf label and dot per leaf', () => {
    const tree = new PhylogeneticTree({ newick: '(A,B,(C,D));' });
    expect(tree.numLeaves).toBe(4);
    expect(tree.getLeaves()).toHaveLength(4);
    expect(tree.getLeaves().map((l) => l.name)).toEqual(['A', 'B', 'C', 'D']);
    expect(tree.labelsGroup.children).toHaveLength(4);
    expect(tree.leavesGroup.children).toHaveLength(4);
    expect(tree.getLeaves()[0].dot).toBeInstanceOf(Dot);
  });

  it('draws an elbow branch (two lines) per edge', () => {
    // 4 leaves + 1 internal clade = 5 edges from their parents.
    const tree = new PhylogeneticTree({ newick: '(A,B,(C,D));' });
    expect(tree.getBranches()).toHaveLength(5);
    const branchLines = tree.getBranches().flatMap((b) => b.lines);
    // Each rectangular branch is an elbow of two lines.
    expect(branchLines).toHaveLength(10);
    expect(branchLines[0]).toBeInstanceOf(Line);
    expect(tree.branchesGroup.children).toHaveLength(10);
  });

  it('spaces leaves evenly on the leaf axis and centers them', () => {
    const tree = new PhylogeneticTree({ newick: '(A,B,C);', height: 4 });
    const ys = tree.getLeaves().map((l) => l.position[1]);
    // Three leaves: top, middle, bottom, centered on 0.
    expect(ys[0]).toBeCloseTo(2, 9);
    expect(ys[1]).toBeCloseTo(0, 9);
    expect(ys[2]).toBeCloseTo(-2, 9);
  });

  it('places leaves by cumulative branch length in a phylogram', () => {
    const tree = new PhylogeneticTree({
      newick: '((A:0.1,B:0.2):0.3,C:0.4);',
      useBranchLengths: true,
      width: 10,
    });
    const leaves = tree.getLeaves();
    const byName = new Map(leaves.map((l) => [l.name, l.position[0]]));
    const a = byName.get('A') as number;
    const b = byName.get('B') as number;
    const c = byName.get('C') as number;
    // Cumulative lengths: A = 0.4, B = 0.5, C = 0.4. B is deepest (rightmost).
    expect(b).toBeGreaterThan(a);
    expect(b).toBeGreaterThan(c);
    expect(a).toBeCloseTo(c, 9);
  });

  it('ignores branch lengths in a cladogram', () => {
    const tree = new PhylogeneticTree({
      newick: '((A:0.1,B:9.9):0.3,C:0.4);',
      useBranchLengths: false,
      width: 10,
    });
    const byName = new Map(tree.getLeaves().map((l) => [l.name, l.position[0]]));
    // A and B share a depth, so they share an x despite very different lengths.
    expect(byName.get('A')).toBeCloseTo(byName.get('B') as number, 9);
  });

  it('draws branches before leaves so Create grows root-to-leaves', () => {
    const tree = new PhylogeneticTree({ newick: '(A,B);' });
    // The first child group is the branches, so the create animation reveals
    // the branches before the leaf dots and labels.
    expect(tree.children[0]).toBe(tree.branchesGroup);
  });

  it('renders a single-node tree as one leaf with no branches', () => {
    const tree = new PhylogeneticTree({ newick: 'A;' });
    expect(tree.numLeaves).toBe(1);
    expect(tree.getBranches()).toHaveLength(0);
    expect(tree.getLeaves()[0].name).toBe('A');
    expect(tree.getLeaves()[0].position).toEqual([0, 0, 0]);
  });

  it('omits labels when labels is false', () => {
    const tree = new PhylogeneticTree({ newick: '(A,B);', labels: false });
    expect(tree.labelsGroup.children).toHaveLength(0);
    expect(tree.getLeaves()[0].label).toBeNull();
  });

  it('omits leaf dots when showLeafDots is false', () => {
    const tree = new PhylogeneticTree({ newick: '(A,B);', showLeafDots: false });
    expect(tree.leavesGroup.children).toHaveLength(0);
    expect(tree.getLeaves()[0].dot).toBeNull();
  });

  it('mirrors the depth axis for a right-to-left orientation', () => {
    const left = new PhylogeneticTree({ newick: '(A,B);', width: 6 });
    const right = new PhylogeneticTree({
      newick: '(A,B);',
      width: 6,
      orientation: 'right-to-left',
    });
    expect(left.getLeaves()[0].position[0]).toBeCloseTo(-right.getLeaves()[0].position[0], 9);
  });

  it('accepts a radial layout', () => {
    const tree = new PhylogeneticTree({ newick: '(A,B,(C,D));', layout: 'radial' });
    expect(tree.numLeaves).toBe(4);
    expect(tree.getBranches().length).toBeGreaterThan(0);
    // In a radial layout the leaves do not all share one x.
    const xs = tree.getLeaves().map((l) => l.position[0]);
    expect(new Set(xs.map((x) => x.toFixed(3))).size).toBeGreaterThan(1);
  });

  it('throws on an empty or malformed Newick string', () => {
    expect(() => new PhylogeneticTree({ newick: '' })).toThrow();
    expect(() => new PhylogeneticTree({ newick: '((A,B);' })).toThrow();
  });

  it('throws when neither newick nor root is given', () => {
    expect(() => new PhylogeneticTree({})).toThrow();
  });

  it('is deterministic across builds with the same options', () => {
    const a = new PhylogeneticTree({ newick: '((A:0.1,B:0.2):0.3,C:0.4);' });
    const b = new PhylogeneticTree({ newick: '((A:0.1,B:0.2):0.3,C:0.4);' });
    for (let i = 0; i < a.numLeaves; i++) {
      expect(a.getLeaves()[i].position).toEqual(b.getLeaves()[i].position);
    }
  });
});
