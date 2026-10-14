import { describe, it, expect } from 'vitest';
import { Membrane } from './Membrane';
import { VGroup } from '../../core/VGroup';
import { Circle } from '../geometry/Circle';
import { Line } from '../geometry/Line';

describe('Membrane', () => {
  it('is a VGroup so animations apply directly', () => {
    expect(new Membrane()).toBeInstanceOf(VGroup);
  });

  it('places numLipids lipids in each row', () => {
    const m = new Membrane({ length: 6, numLipids: 12 });
    expect(m.numLipids).toBe(12);
    expect(m.getLipids('upper')).toHaveLength(12);
    expect(m.getLipids('lower')).toHaveLength(12);
  });

  it('derives the lipid count from length and spacing', () => {
    const m = new Membrane({ length: 6, spacing: 0.5 });
    expect(m.numLipids).toBe(12);
  });

  it('builds a head circle and two tail lines per lipid', () => {
    const m = new Membrane({ numLipids: 4 });
    for (const lipid of [...m.getLipids('upper'), ...m.getLipids('lower')]) {
      expect(lipid.head).toBeInstanceOf(Circle);
      expect(lipid.tails).toHaveLength(2);
      for (const tail of lipid.tails) expect(tail).toBeInstanceOf(Line);
    }
  });

  it('spaces the lipids evenly across the length', () => {
    const m = new Membrane({ length: 4, numLipids: 8 });
    const xs = m.getLipids('upper').map((l) => l.x);
    expect(xs[0]).toBeCloseTo(-2 + 0.25);
    expect(xs[7]).toBeCloseTo(2 - 0.25);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(0.5);
  });

  it('mirrors the two rows about the midline', () => {
    const m = new Membrane({ numLipids: 6 });
    const up = m.getLipids('upper')[0].head.getCenter();
    const lo = m.getLipids('lower')[0].head.getCenter();
    expect(up[0]).toBeCloseTo(lo[0]);
    expect(up[1]).toBeCloseTo(-lo[1]);
    expect(up[1]).toBeGreaterThan(0);
  });

  it('points the heads outward and the tails inward', () => {
    const m = new Membrane({ numLipids: 4 });
    for (const lipid of m.getLipids('upper')) {
      const headY = lipid.head.getCenter()[1];
      for (const tail of lipid.tails) {
        const y0 = tail.getStart()[1];
        const y1 = tail.getEnd()[1];
        expect(y0).toBeLessThanOrEqual(headY);
        expect(y1).toBeLessThan(y0);
        expect(y1).toBeGreaterThan(0);
      }
    }
    for (const lipid of m.getLipids('lower')) {
      const headY = lipid.head.getCenter()[1];
      for (const tail of lipid.tails) {
        expect(tail.getEnd()[1]).toBeGreaterThan(tail.getStart()[1]);
        expect(tail.getStart()[1]).toBeGreaterThanOrEqual(headY);
        expect(tail.getEnd()[1]).toBeLessThan(0);
      }
    }
  });

  it('reports the thickness and the top and bottom edge', () => {
    const m = new Membrane({ headRadius: 0.1, tailLength: 0.3, coreGap: 0.1 });
    expect(m.getTopY()).toBeCloseTo(0.05 + 0.3 + 0.1);
    expect(m.getBottomY()).toBeCloseTo(-(0.05 + 0.3 + 0.1));
    expect(m.getThickness()).toBeCloseTo(2 * (0.05 + 0.3 + 0.1));
  });

  it('shifts every lipid to the center option', () => {
    const m = new Membrane({
      length: 4,
      numLipids: 4,
      center: [3, -1, 0],
      headRadius: 0.1,
      tailLength: 0.3,
      coreGap: 0.1,
    });
    const head = m.getLipids('upper')[0].head.getCenter();
    expect(head[0]).toBeCloseTo(3 - 2 + 0.5);
    expect(head[1]).toBeCloseTo(-1 + 0.05 + 0.3 + 0.1);
  });

  it('applies the head and tail colors', () => {
    const m = new Membrane({ numLipids: 2, headColor: '#ff0000', tailColor: '#00ff00' });
    const lipid = m.getLipids('upper')[0];
    expect((lipid.head.fillColor ?? '').toLowerCase()).toBe('#ff0000');
    expect(lipid.tails[0].color.toLowerCase()).toBe('#00ff00');
  });

  it('exposes both rows as VGroups', () => {
    const m = new Membrane({ numLipids: 5 });
    expect(m.upperRow).toBeInstanceOf(VGroup);
    expect(m.lowerRow).toBeInstanceOf(VGroup);
    expect(m.upperRow.children).toHaveLength(5);
    expect(m.lowerRow.children).toHaveLength(5);
  });

  describe('gaps', () => {
    it('removes the lipids inside a gap in both rows', () => {
      const m = new Membrane({ length: 4, numLipids: 8 });
      m.gapAt(-0.6, 0.6);
      expect(m.getLipids('upper')).toHaveLength(6);
      expect(m.getLipids('lower')).toHaveLength(6);
      expect(m.upperRow.children).toHaveLength(6);
      for (const l of m.getLipids('upper')) expect(Math.abs(l.x)).toBeGreaterThan(0.6);
    });

    it('leaves the span empty of heads', () => {
      const m = new Membrane({ length: 6, numLipids: 24, gaps: [[-1, 1]] });
      for (const row of ['upper', 'lower'] as const) {
        for (const l of m.getLipids(row)) {
          const hx = l.head.getCenter()[0];
          expect(hx < -1 || hx > 1).toBe(true);
        }
      }
    });

    it('accepts gaps in the constructor and records them', () => {
      const m = new Membrane({
        length: 6,
        numLipids: 24,
        gaps: [
          [-2, -1],
          [1, 2],
        ],
      });
      expect(m.getGaps()).toEqual([
        [-2, -1],
        [1, 2],
      ]);
      expect(m.numLipids).toBe(24 - 4 - 4);
    });

    it('keeps the lipids outside the gap untouched', () => {
      const m = new Membrane({ length: 4, numLipids: 8 });
      const before = m.getLipids('upper').map((l) => l.x);
      m.gapAt(-0.6, 0.6);
      const after = m.getLipids('upper').map((l) => l.x);
      expect(after).toEqual(before.filter((x) => Math.abs(x) > 0.6));
    });

    it('is chainable and ignores a repeated gap', () => {
      const m = new Membrane({ length: 4, numLipids: 8 });
      expect(m.gapAt(-0.6, 0.6)).toBe(m);
      m.gapAt(-0.6, 0.6);
      expect(m.numLipids).toBe(6);
    });

    it('normalizes a reversed range', () => {
      const m = new Membrane({ length: 4, numLipids: 8 });
      m.gapAt(0.6, -0.6);
      expect(m.numLipids).toBe(6);
      expect(m.getGaps()[0]).toEqual([-0.6, 0.6]);
    });

    it('measures gap x in membrane coordinates, not world coordinates', () => {
      const m = new Membrane({ length: 4, numLipids: 8, center: [5, 0, 0] });
      m.gapAt(-0.6, 0.6);
      expect(m.numLipids).toBe(6);
    });
  });

  it('rejects a non-positive length, lipid count or spacing', () => {
    expect(() => new Membrane({ length: 0 })).toThrow();
    expect(() => new Membrane({ numLipids: 0 })).toThrow();
    expect(() => new Membrane({ spacing: -1 })).toThrow();
  });
});
