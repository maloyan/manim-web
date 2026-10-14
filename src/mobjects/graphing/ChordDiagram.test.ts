import { describe, it, expect } from 'vitest';
import { ChordDiagram, ChordArc, ChordRibbon } from './ChordDiagram';
import { chordMatrixFromFlows, computeChordLayout } from './chordLayout';

const SYMMETRIC = [
  [0, 2, 1],
  [2, 0, 1],
  [1, 1, 0],
];

describe('computeChordLayout', () => {
  it('sizes each group arc in proportion to its row total', () => {
    const layout = computeChordLayout(SYMMETRIC, { gap: 0 });
    const angle = (index: number): number => {
      const group = layout.groups[index];
      return group.endAngle - group.startAngle;
    };
    // Row totals: group0 = 3, group1 = 3, group2 = 2.
    expect(angle(0) / angle(2)).toBeCloseTo(3 / 2, 6);
    expect(angle(0)).toBeCloseTo(angle(1), 6);
  });

  it('creates one ribbon per unordered pair with a positive combined flow', () => {
    const layout = computeChordLayout(SYMMETRIC);
    // Pairs (0,1), (0,2), (1,2) all carry flow; diagonals are zero.
    expect(layout.ribbons).toHaveLength(3);
    const pairs = layout.ribbons.map((ribbon) => `${ribbon.source}-${ribbon.target}`);
    expect(pairs).toEqual(['0-1', '0-2', '1-2']);
  });

  it('omits ribbons for zero-flow pairs', () => {
    const matrix = [
      [0, 4, 0],
      [4, 0, 0],
      [0, 0, 0],
    ];
    const layout = computeChordLayout(matrix);
    expect(layout.ribbons).toHaveLength(1);
    expect(layout.ribbons[0].source).toBe(0);
    expect(layout.ribbons[0].target).toBe(1);
  });

  it('makes the source span angle proportional to the flow value', () => {
    const layout = computeChordLayout(SYMMETRIC, { gap: 0 });
    const r01 = layout.ribbons.find((r) => r.source === 0 && r.target === 1)!;
    const r02 = layout.ribbons.find((r) => r.source === 0 && r.target === 2)!;
    const span01 = r01.sourceEnd - r01.sourceStart; // matrix[0][1] = 2
    const span02 = r02.sourceEnd - r02.sourceStart; // matrix[0][2] = 1
    expect(span01 / span02).toBeCloseTo(2, 6);
  });

  it('builds a matrix from a link list', () => {
    const matrix = chordMatrixFromFlows(
      [
        { source: 0, target: 1, value: 3 },
        { source: 1, target: 0, value: 2 },
      ],
      2,
    );
    expect(matrix).toEqual([
      [0, 3],
      [2, 0],
    ]);
  });

  describe('edge cases', () => {
    it('returns empty arrays for an empty matrix', () => {
      const layout = computeChordLayout([]);
      expect(layout.groups).toHaveLength(0);
      expect(layout.ribbons).toHaveLength(0);
      expect(layout.total).toBe(0);
    });

    it('handles a single group with a self-flow', () => {
      const layout = computeChordLayout([[5]]);
      expect(layout.groups).toHaveLength(1);
      expect(layout.ribbons).toHaveLength(1);
      expect(layout.ribbons[0].source).toBe(0);
      expect(layout.ribbons[0].target).toBe(0);
    });

    it('produces zero-angle arcs and no ribbons for an all-zero matrix', () => {
      const layout = computeChordLayout([
        [0, 0],
        [0, 0],
      ]);
      expect(layout.ribbons).toHaveLength(0);
      for (const group of layout.groups) {
        expect(group.endAngle - group.startAngle).toBeCloseTo(0, 9);
      }
    });
  });
});

describe('ChordDiagram', () => {
  it('builds one arc per group and one chord per non-zero pair', () => {
    const chord = new ChordDiagram({ matrix: SYMMETRIC });
    expect(chord.getArcs()).toHaveLength(3);
    expect(chord.getChords()).toHaveLength(3);
    expect(chord.getArcs()[0]).toBeInstanceOf(ChordArc);
    expect(chord.getChords()[0]).toBeInstanceOf(ChordRibbon);
  });

  it('exposes arc and chord accessors by index', () => {
    const chord = new ChordDiagram({ matrix: SYMMETRIC });
    expect(chord.getArc(0)?.groupIndex).toBe(0);
    expect(chord.getArc(9)).toBeUndefined();
    expect(chord.getChord(0)?.source).toBe(0);
    expect(chord.getChord(9)).toBeUndefined();
  });

  it('makes the arc angle proportional to the group total', () => {
    const chord = new ChordDiagram({ matrix: SYMMETRIC, gap: 0 });
    const a0 = chord.getArc(0)!.getAngle();
    const a2 = chord.getArc(2)!.getAngle();
    expect(a0 / a2).toBeCloseTo(3 / 2, 5);
  });

  it('makes the ribbon source span proportional to its flow', () => {
    const chord = new ChordDiagram({ matrix: SYMMETRIC, gap: 0 });
    const r01 = chord.getChords().find((r) => r.source === 0 && r.target === 1)!;
    const r02 = chord.getChords().find((r) => r.source === 0 && r.target === 2)!;
    expect(r01.getSourceSpanAngle() / r02.getSourceSpanAngle()).toBeCloseTo(2, 5);
  });

  it('does not route ribbon curves through the exact center', () => {
    // Regression: when both connecting-curve control points sat at the origin,
    // every ribbon pinched to the exact center, so all ribbons self-intersected
    // at one point and rendered as bright slivers. The control points must bend
    // toward center without landing on it.
    const radius = 2.5;
    const chord = new ChordDiagram({ matrix: SYMMETRIC, radius });
    for (const ribbon of chord.getChords()) {
      for (const point of ribbon.getLocalPoints()) {
        const distance = Math.hypot(point[0], point[1]);
        expect(distance).toBeGreaterThan(radius * 0.05);
      }
    }
  });

  it('accepts a link list with a group count', () => {
    const chord = new ChordDiagram({
      flows: [
        { source: 0, target: 1, value: 2 },
        { source: 1, target: 0, value: 2 },
      ],
      groupCount: 2,
      showLabels: false,
    });
    expect(chord.getArcs()).toHaveLength(2);
    expect(chord.getChords()).toHaveLength(1);
  });

  describe('edge cases', () => {
    it('treats an empty matrix as an empty group without throwing', () => {
      const chord = new ChordDiagram({ matrix: [] });
      expect(chord.getArcs()).toHaveLength(0);
      expect(chord.getChords()).toHaveLength(0);
      expect(chord.isEmpty()).toBe(true);
    });

    it('handles a single group and an all-zero matrix without throwing', () => {
      expect(() => new ChordDiagram({ matrix: [[0]] })).not.toThrow();
      expect(
        () =>
          new ChordDiagram({
            matrix: [
              [0, 0],
              [0, 0],
            ],
          }),
      ).not.toThrow();
    });
  });
});
