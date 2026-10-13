import { describe, it, expect } from 'vitest';
import {
  ElectronPushingArrow,
  arrowBetweenAtoms,
  DEFAULT_ELECTRON_ARROW_COLOR,
} from './ElectronPushingArrow';
import { MoleculeMobject } from './MoleculeMobject';
import { Create } from '../../animation/creation/Create';
import type { Vector3Tuple } from '../../core/Mobject';

/** Chord midpoint of the straight line from `from` to `to`. */
function chordMidpoint(from: Vector3Tuple, to: Vector3Tuple): Vector3Tuple {
  return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
}

/** Signed offset of the arc apex from the chord midpoint, along the chord's left normal. */
function apexOffset(arrow: ElectronPushingArrow): { signed: number; magnitude: number } {
  const from = arrow.getStart();
  const to = arrow.getEnd();
  const apex = arrow.getPointFromProportion(0.5);
  const mid = chordMidpoint(from, to);
  const ox = apex[0] - mid[0];
  const oy = apex[1] - mid[1];
  const magnitude = Math.hypot(ox, oy);
  // Left normal of the chord direction (+90 degrees).
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const signed = ox * nx + oy * ny;
  return { signed, magnitude };
}

describe('ElectronPushingArrow', () => {
  const from: Vector3Tuple = [0, 0, 0];
  const to: Vector3Tuple = [2, 0, 0];

  it('start and end land at from and to', () => {
    const arrow = new ElectronPushingArrow({ from, to });
    expect(arrow.getStart()).toEqual(from);
    expect(arrow.getEnd()).toEqual(to);
    // The shaft path really begins and ends there.
    const pts = arrow.getLocalPoints();
    expect(pts[0][0]).toBeCloseTo(from[0], 6);
    expect(pts[0][1]).toBeCloseTo(from[1], 6);
    expect(pts[pts.length - 1][0]).toBeCloseTo(to[0], 6);
    expect(pts[pts.length - 1][1]).toBeCloseTo(to[1], 6);
  });

  it('arc apex is offset from the chord midpoint by ~bulge*chordLength', () => {
    const bulge = 0.3;
    const arrow = new ElectronPushingArrow({ from, to, bulge });
    const chordLength = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const { magnitude } = apexOffset(arrow);
    expect(magnitude).toBeCloseTo(bulge * chordLength, 4);
  });

  it('scales the apex offset with bulge', () => {
    const chordLength = Math.hypot(to[0] - from[0], to[1] - from[1]);
    for (const bulge of [0.1, 0.25, 0.5]) {
      const arrow = new ElectronPushingArrow({ from, to, bulge });
      expect(apexOffset(arrow).magnitude).toBeCloseTo(bulge * chordLength, 4);
    }
  });

  it('direction flips which side the arc bows to', () => {
    const ccw = new ElectronPushingArrow({ from, to, direction: 'ccw' });
    const cw = new ElectronPushingArrow({ from, to, direction: 'cw' });
    const ccwOff = apexOffset(ccw).signed;
    const cwOff = apexOffset(cw).signed;
    // ccw bows to the positive (left) normal, cw to the negative side.
    expect(ccwOff).toBeGreaterThan(0);
    expect(cwOff).toBeLessThan(0);
    expect(ccwOff).toBeCloseTo(-cwOff, 6);
  });

  it('defaults to a pair arrow and stores the electrons mode', () => {
    expect(new ElectronPushingArrow({ from, to }).getElectrons()).toBe('pair');
    expect(new ElectronPushingArrow({ from, to, electrons: 'single' }).getElectrons()).toBe(
      'single',
    );
  });

  it('has an arrow tip submobject with geometry (pair)', () => {
    const arrow = new ElectronPushingArrow({ from, to, electrons: 'pair' });
    const tip = arrow.getTip();
    expect(tip).not.toBeNull();
    expect(tip!.getLocalPoints().length).toBeGreaterThan(0);
    // The tip is a tracked child of the arrow.
    expect(arrow.children).toContain(tip);
  });

  it('has a single-barbed fishhook tip with geometry (single)', () => {
    const arrow = new ElectronPushingArrow({ from, to, electrons: 'single' });
    const tip = arrow.getTip();
    expect(tip).not.toBeNull();
    expect(tip!.getLocalPoints().length).toBeGreaterThan(0);
  });

  it('uses the default distinct arrow color', () => {
    const arrow = new ElectronPushingArrow({ from, to });
    expect(arrow.color).toBe(DEFAULT_ELECTRON_ARROW_COLOR);
  });

  it('honors a custom color and stroke width', () => {
    const arrow = new ElectronPushingArrow({
      from,
      to,
      color: '#123456',
      strokeWidth: 7,
    });
    expect(arrow.color).toBe('#123456');
    expect(arrow.strokeWidth).toBe(7);
    expect(arrow.getTip()!.color).toBe('#123456');
  });

  it('keeps the shaft unfilled so Create does not fill the arc', () => {
    const arrow = new ElectronPushingArrow({ from, to });
    expect(arrow.fillOpacity).toBe(0);
  });

  it('is Create-able (stroke reveal over family members)', () => {
    const arrow = new ElectronPushingArrow({ from, to });
    const anim = new Create(arrow);
    expect(() => {
      anim.begin();
      anim.interpolate(0);
      anim.interpolate(0.5);
      anim.interpolate(1);
      anim.finish();
    }).not.toThrow();
    // Shaft and head are both family members with points.
    expect(arrow.familyMembersWithPoints().length).toBeGreaterThanOrEqual(2);
  });

  it('does not throw for a zero-length arrow (from == to)', () => {
    let arrow: ElectronPushingArrow | undefined;
    expect(() => {
      arrow = new ElectronPushingArrow({ from: [1, 1, 0], to: [1, 1, 0] });
    }).not.toThrow();
    expect(arrow!.getStart()).toEqual([1, 1, 0]);
    expect(arrow!.getEnd()).toEqual([1, 1, 0]);
    expect(arrow!.getTip()).toBeNull();
    expect(arrow!.getLocalPoints().length).toBe(0);
  });

  it('is positionable and copyable', () => {
    const arrow = new ElectronPushingArrow({ from, to });
    expect(() => arrow.shift([1, 1, 0])).not.toThrow();
    const clone = arrow.copy();
    expect(clone).not.toBe(arrow);
    expect(clone.getElectrons()).toBe('pair');
    expect(clone.getTip()).not.toBeNull();
  });

  describe('arrowBetweenAtoms', () => {
    const molecule = new MoleculeMobject({
      atoms: [
        { element: 'O', x: 0, y: 0 },
        { element: 'C', x: 1.5, y: 0 },
      ],
      bonds: [{ from: 0, to: 1 }],
    });

    it('builds an arrow from atom i to atom j positions', () => {
      const arrow = arrowBetweenAtoms(molecule, 0, 1, { bulge: 0.2 });
      expect(arrow.getStart()).toEqual(molecule.getAtom(0)!.position);
      expect(arrow.getEnd()).toEqual(molecule.getAtom(1)!.position);
    });

    it('throws on an out-of-range atom index', () => {
      expect(() => arrowBetweenAtoms(molecule, 0, 9)).toThrow();
    });
  });
});
