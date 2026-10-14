import { describe, it, expect } from 'vitest';
import { ReactionScheme } from './ReactionScheme';
import { water, methane, ethanol } from './molecules';
import { Create } from '../../animation/creation/Create';

describe('ReactionScheme', () => {
  it('keeps the given species, in order', () => {
    const a = water();
    const b = methane();
    const scheme = new ReactionScheme({ species: [a, b] });
    expect(scheme.getSpecies()).toEqual([a, b]);
  });

  it('builds N-1 arrows for N species', () => {
    const scheme = new ReactionScheme({ species: [water(), methane(), ethanol()] });
    expect(scheme.getArrows()).toHaveLength(2);
    expect(scheme.getStepCount()).toBe(2);
  });

  it('defaults every arrow to forward when no steps are given', () => {
    const scheme = new ReactionScheme({ species: [water(), methane(), ethanol()] });
    for (const arrow of scheme.getArrows()) {
      expect(arrow.getKind()).toBe('forward');
    }
  });

  it('applies arrowKind and conditions from steps', () => {
    const scheme = new ReactionScheme({
      species: [water(), methane(), ethanol()],
      steps: [
        { arrowKind: 'reversible', conditionsAbove: 'H2SO4, Δ', conditionsBelow: '-H2O' },
        { arrowKind: 'equilibrium' },
      ],
    });
    const arrows = scheme.getArrows();
    expect(arrows[0].getKind()).toBe('reversible');
    expect(arrows[0].getAboveLabel()?.getText()).toBe('H2SO4, Δ');
    expect(arrows[0].getBelowLabel()?.getText()).toBe('-H2O');
    expect(arrows[1].getKind()).toBe('equilibrium');
    expect(arrows[1].getAboveLabel()).toBeNull();
  });

  it('lays species out left to right with increasing center x', () => {
    const species = [water(), methane(), ethanol()];
    const scheme = new ReactionScheme({ species });
    const placed = scheme.getSpecies();
    for (let i = 1; i < placed.length; i++) {
      expect(placed[i].getCenter()[0]).toBeGreaterThan(placed[i - 1].getCenter()[0]);
    }
  });

  it('places species so they do not overlap, arrows sit between them', () => {
    const species = [water(), methane(), ethanol()];
    const scheme = new ReactionScheme({ species, gap: 1, arrowLength: 2 });
    const placed = scheme.getSpecies();
    const arrows = scheme.getArrows();
    for (let i = 0; i < placed.length - 1; i++) {
      const leftSpeciesRight = placed[i].getRight()[0];
      const rightSpeciesLeft = placed[i + 1].getLeft()[0];
      // The next species starts strictly to the right of this one.
      expect(rightSpeciesLeft).toBeGreaterThan(leftSpeciesRight);
      // The arrow sits in the gap between the two species.
      const arrowStart = arrows[i].getStart()[0];
      const arrowEnd = arrows[i].getEnd()[0];
      expect(arrowStart).toBeGreaterThanOrEqual(leftSpeciesRight - 1e-6);
      expect(arrowEnd).toBeLessThanOrEqual(rightSpeciesLeft + 1e-6);
    }
  });

  it('aligns every species and arrow to the same row centerline', () => {
    const scheme = new ReactionScheme({ species: [water(), methane()] });
    const [s0, s1] = scheme.getSpecies();
    expect(s0.getCenter()[1]).toBeCloseTo(s1.getCenter()[1], 6);
    const arrow = scheme.getArrows()[0];
    expect(arrow.getStart()[1]).toBeCloseTo(s0.getCenter()[1], 6);
    expect(arrow.getEnd()[1]).toBeCloseTo(s0.getCenter()[1], 6);
  });

  it('throws when fewer than two species are given', () => {
    expect(() => new ReactionScheme({ species: [] })).toThrow();
    expect(() => new ReactionScheme({ species: [water()] })).toThrow();
  });

  it('throws when steps length does not equal species length minus one', () => {
    expect(
      () =>
        new ReactionScheme({
          species: [water(), methane(), ethanol()],
          steps: [{ arrowKind: 'forward' }],
        }),
    ).toThrow();
  });

  it('accepts steps of exactly species length minus one', () => {
    expect(
      () =>
        new ReactionScheme({
          species: [water(), methane(), ethanol()],
          steps: [{ arrowKind: 'forward' }, { arrowKind: 'reversible' }],
        }),
    ).not.toThrow();
  });

  it('adds species and arrows as children and is Create-able', () => {
    const scheme = new ReactionScheme({ species: [water(), methane()] });
    expect(scheme.children.length).toBe(3); // 2 species + 1 arrow
    expect(() => new Create(scheme)).not.toThrow();
  });
});
