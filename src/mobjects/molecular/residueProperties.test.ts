/**
 * Tests for residueProperties: the Kyte-Doolittle hydropathy scale and the
 * formal side-chain charge classification used for property-based coloring.
 */
import { describe, it, expect } from 'vitest';
import {
  residueHydropathy,
  residueCharge,
  HYDROPATHY_MIN,
  HYDROPATHY_MAX,
} from './residueProperties';

describe('residueHydropathy (Kyte-Doolittle)', () => {
  it('scores hydrophobic residues high and hydrophilic residues low', () => {
    // ILE (+4.5) and VAL (+4.2) are the most hydrophobic; ARG (-4.5) the least.
    expect(residueHydropathy('I')).toBeCloseTo(4.5, 3);
    expect(residueHydropathy('V')).toBeCloseTo(4.2, 3);
    expect(residueHydropathy('R')).toBeCloseTo(-4.5, 3);
    expect(residueHydropathy('D')).toBeCloseTo(-3.5, 3);
    expect(residueHydropathy('I')).toBeGreaterThan(residueHydropathy('R'));
  });

  it('accepts 3-letter names and is case-insensitive', () => {
    expect(residueHydropathy('ile')).toBeCloseTo(4.5, 3);
    expect(residueHydropathy('ARG')).toBeCloseTo(-4.5, 3);
  });

  it('returns 0 for an unknown residue', () => {
    expect(residueHydropathy('???')).toBe(0);
  });

  it('exposes the scale range', () => {
    expect(HYDROPATHY_MIN).toBe(-4.5);
    expect(HYDROPATHY_MAX).toBe(4.5);
  });
});

describe('residueCharge', () => {
  it('classifies basic residues as +1', () => {
    expect(residueCharge('R')).toBe(1);
    expect(residueCharge('K')).toBe(1);
    expect(residueCharge('H')).toBe(1);
  });

  it('classifies acidic residues as -1', () => {
    expect(residueCharge('D')).toBe(-1);
    expect(residueCharge('E')).toBe(-1);
  });

  it('classifies everything else as neutral (0)', () => {
    expect(residueCharge('A')).toBe(0);
    expect(residueCharge('G')).toBe(0);
  });

  it('accepts 3-letter names', () => {
    expect(residueCharge('ARG')).toBe(1);
    expect(residueCharge('ASP')).toBe(-1);
    expect(residueCharge('ALA')).toBe(0);
  });
});
