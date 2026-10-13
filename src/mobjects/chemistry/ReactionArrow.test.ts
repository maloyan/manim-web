import { describe, it, expect } from 'vitest';
import { ReactionArrow } from './ReactionArrow';
import { Create } from '../../animation/creation/Create';
import type { Vector3Tuple } from '../../core/Mobject';

const start: Vector3Tuple = [0, 0, 0];
const end: Vector3Tuple = [2, 0, 0];

describe('ReactionArrow', () => {
  it('stores start and end as given', () => {
    const arrow = new ReactionArrow({ start, end });
    expect(arrow.getStart()).toEqual(start);
    expect(arrow.getEnd()).toEqual(end);
  });

  it('defaults to the forward kind', () => {
    const arrow = new ReactionArrow({ start, end });
    expect(arrow.getKind()).toBe('forward');
  });

  it('stores the requested kind', () => {
    expect(new ReactionArrow({ start, end, kind: 'reversible' }).getKind()).toBe('reversible');
    expect(new ReactionArrow({ start, end, kind: 'equilibrium' }).getKind()).toBe('equilibrium');
    expect(new ReactionArrow({ start, end, kind: 'resonance' }).getKind()).toBe('resonance');
  });

  it('forward has one shaft and one tip', () => {
    const arrow = new ReactionArrow({ start, end, kind: 'forward' });
    expect(arrow.getShafts()).toHaveLength(1);
    expect(arrow.getTips()).toHaveLength(1);
  });

  it('resonance has one shaft and a tip at both ends', () => {
    const arrow = new ReactionArrow({ start, end, kind: 'resonance' });
    expect(arrow.getShafts()).toHaveLength(1);
    expect(arrow.getTips()).toHaveLength(2);
  });

  it('reversible has two shafts and two tips', () => {
    const arrow = new ReactionArrow({ start, end, kind: 'reversible' });
    expect(arrow.getShafts()).toHaveLength(2);
    expect(arrow.getTips()).toHaveLength(2);
  });

  it('equilibrium has two shafts and two half heads (harpoons)', () => {
    const arrow = new ReactionArrow({ start, end, kind: 'equilibrium' });
    expect(arrow.getShafts()).toHaveLength(2);
    expect(arrow.getTips()).toHaveLength(2);
  });

  it('forward shaft runs from start to end', () => {
    const arrow = new ReactionArrow({ start, end, kind: 'forward' });
    const shaft = arrow.getShafts()[0];
    const s = shaft.getStart();
    const e = shaft.getEnd();
    expect(s[0]).toBeCloseTo(start[0], 6);
    expect(s[1]).toBeCloseTo(start[1], 6);
    expect(e[0]).toBeCloseTo(end[0], 6);
    expect(e[1]).toBeCloseTo(end[1], 6);
  });

  it('above and below labels are null when not given', () => {
    const arrow = new ReactionArrow({ start, end });
    expect(arrow.getAboveLabel()).toBeNull();
    expect(arrow.getBelowLabel()).toBeNull();
  });

  it('above label carries the given text', () => {
    const arrow = new ReactionArrow({ start, end, conditionsAbove: 'cat., heat' });
    const label = arrow.getAboveLabel();
    expect(label).not.toBeNull();
    expect(label?.getText()).toBe('cat., heat');
    expect(arrow.getBelowLabel()).toBeNull();
  });

  it('below label carries the given text', () => {
    const arrow = new ReactionArrow({ start, end, conditionsBelow: 'H2O' });
    const label = arrow.getBelowLabel();
    expect(label).not.toBeNull();
    expect(label?.getText()).toBe('H2O');
    expect(arrow.getAboveLabel()).toBeNull();
  });

  it('both labels are present when both are given', () => {
    const arrow = new ReactionArrow({
      start,
      end,
      conditionsAbove: 'Pd/C',
      conditionsBelow: 'EtOH',
    });
    expect(arrow.getAboveLabel()?.getText()).toBe('Pd/C');
    expect(arrow.getBelowLabel()?.getText()).toBe('EtOH');
  });

  it('above label sits above the midpoint, below label below it', () => {
    const arrow = new ReactionArrow({
      start,
      end,
      conditionsAbove: 'A',
      conditionsBelow: 'B',
    });
    const above = arrow.getAboveLabel()!.getCenter();
    const below = arrow.getBelowLabel()!.getCenter();
    // The arrow is horizontal, so the above label has the larger y.
    expect(above[1]).toBeGreaterThan(below[1]);
  });

  it('is addable as a group and Create-able', () => {
    const arrow = new ReactionArrow({ start, end, kind: 'reversible' });
    expect(arrow.children.length).toBeGreaterThan(0);
    expect(() => new Create(arrow)).not.toThrow();
  });

  it('a degenerate start == end arrow does not throw', () => {
    expect(() => new ReactionArrow({ start: [1, 1, 0], end: [1, 1, 0] })).not.toThrow();
    const arrow = new ReactionArrow({ start: [1, 1, 0], end: [1, 1, 0], kind: 'forward' });
    expect(arrow.getShafts()).toHaveLength(1);
    expect(arrow.getTips()).toHaveLength(1);
  });

  it('copy keeps kind, endpoints and labels', () => {
    const arrow = new ReactionArrow({
      start,
      end,
      kind: 'equilibrium',
      conditionsAbove: 'cat.',
    });
    const clone = arrow.copy();
    expect(clone).not.toBe(arrow);
    expect(clone.getKind()).toBe('equilibrium');
    expect(clone.getStart()).toEqual(start);
    expect(clone.getEnd()).toEqual(end);
    expect(clone.getAboveLabel()?.getText()).toBe('cat.');
  });
});
