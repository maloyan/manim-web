/**
 * Tests for the element radius tables (covalent and van der Waals).
 *
 * The tables mirror cpkColors.ts: a canonical lookup with per-element overrides
 * and a default fallback. Radii are in angstrom.
 */
import { describe, it, expect } from 'vitest';
import {
  COVALENT_RADII,
  VDW_RADII,
  DEFAULT_COVALENT_RADIUS,
  DEFAULT_VDW_RADIUS,
  covalentRadius,
  vdwRadius,
} from './elementRadii';

describe('covalentRadius', () => {
  it('returns known element radii', () => {
    expect(covalentRadius('C')).toBe(COVALENT_RADII.C);
    expect(covalentRadius('O')).toBe(COVALENT_RADII.O);
    expect(covalentRadius('H')).toBe(COVALENT_RADII.H);
  });

  it('is case-insensitive', () => {
    expect(covalentRadius('c')).toBe(COVALENT_RADII.C);
    expect(covalentRadius('CL')).toBe(COVALENT_RADII.Cl);
    expect(covalentRadius('cl')).toBe(COVALENT_RADII.Cl);
  });

  it('returns the default radius for an unknown element', () => {
    expect(covalentRadius('Xx')).toBe(DEFAULT_COVALENT_RADIUS);
    expect(covalentRadius('')).toBe(DEFAULT_COVALENT_RADIUS);
  });

  it('applies overrides', () => {
    expect(covalentRadius('C', { C: 0.9 })).toBe(0.9);
    expect(covalentRadius('c', { C: 0.9 })).toBe(0.9);
  });
});

describe('vdwRadius', () => {
  it('returns known element radii', () => {
    expect(vdwRadius('O')).toBe(VDW_RADII.O);
    expect(vdwRadius('N')).toBe(VDW_RADII.N);
  });

  it('is case-insensitive', () => {
    expect(vdwRadius('br')).toBe(VDW_RADII.Br);
  });

  it('returns the default radius for an unknown element', () => {
    expect(vdwRadius('Zz')).toBe(DEFAULT_VDW_RADIUS);
  });

  it('applies overrides', () => {
    expect(vdwRadius('O', { O: 1.6 })).toBe(1.6);
  });
});

describe('radius tables', () => {
  it('cover the common bio / drug elements', () => {
    for (const el of ['H', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I']) {
      expect(COVALENT_RADII[el]).toBeGreaterThan(0);
      expect(VDW_RADII[el]).toBeGreaterThan(0);
    }
  });

  it('cover a few metals', () => {
    for (const el of ['Na', 'K', 'Mg', 'Ca', 'Zn', 'Fe']) {
      expect(COVALENT_RADII[el]).toBeGreaterThan(0);
      expect(VDW_RADII[el]).toBeGreaterThan(0);
    }
  });

  it('give vdW radii larger than covalent radii for the same element', () => {
    for (const el of ['C', 'N', 'O', 'S']) {
      expect(VDW_RADII[el]).toBeGreaterThan(COVALENT_RADII[el]);
    }
  });
});
