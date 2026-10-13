/**
 * Tests for the binding-story annotations: dashed H-bonds / contacts, a
 * distance label and a residue label.
 */
import { describe, it, expect } from 'vitest';
import { hydrogenBond, contact, distanceLabel, residueLabel } from './annotations';
import { Line3D } from '../three-d/Line3D';
import { Text } from '../text/Text';

describe('hydrogenBond and contact', () => {
  it('builds multiple Line3D dash segments', () => {
    const hb = hydrogenBond([0, 0, 0], [3, 0, 0]);
    expect(hb.children.length).toBeGreaterThan(1);
    expect(hb.children.every((c) => c instanceof Line3D)).toBe(true);
  });

  it('uses the default H-bond color unless overridden', () => {
    const hb = hydrogenBond([0, 0, 0], [2, 0, 0]);
    expect((hb.children[0] as Line3D).color.toLowerCase()).toBe('#9fe2bf');
    const custom = hydrogenBond([0, 0, 0], [2, 0, 0], { color: '#ff0000' });
    expect((custom.children[0] as Line3D).color.toLowerCase()).toBe('#ff0000');
  });

  it('contact shares the dashed impl with a different default color', () => {
    const c = contact([0, 0, 0], [3, 0, 0]);
    expect(c.children.length).toBeGreaterThan(1);
    expect((c.children[0] as Line3D).color.toLowerCase()).toBe('#ffd27f');
  });

  it('returns an empty group for a zero-length span', () => {
    expect(hydrogenBond([1, 1, 1], [1, 1, 1]).children).toHaveLength(0);
  });
});

describe('distanceLabel', () => {
  it('computes the distance text (points 3 apart -> "3.0 Å")', () => {
    const d = distanceLabel([0, 0, 0], [3, 0, 0]);
    const label = d.children.find((c) => c instanceof Text) as Text;
    expect(label).toBeDefined();
    expect(label.getText()).toBe('3.0 Å');
  });

  it('honors decimals and unit', () => {
    const d = distanceLabel([0, 0, 0], [0, 0, 2], { decimals: 2, unit: 'nm' });
    const label = d.children.find((c) => c instanceof Text) as Text;
    expect(label.getText()).toBe('2.00 nm');
  });

  it('uses an override label when given', () => {
    const d = distanceLabel([0, 0, 0], [3, 0, 0], { label: 'ΔG = -9.2' });
    const label = d.children.find((c) => c instanceof Text) as Text;
    expect(label.getText()).toBe('ΔG = -9.2');
  });

  it('includes a measured line as the first child', () => {
    const d = distanceLabel([0, 0, 0], [3, 0, 0]);
    expect(d.children[0]).toBeInstanceOf(Line3D);
  });
});

describe('residueLabel', () => {
  it('returns a Text with the given text', () => {
    const label = residueLabel([1, 2, 3], 'ASP189');
    expect(label).toBeInstanceOf(Text);
    expect((label as Text).getText()).toBe('ASP189');
  });
});
