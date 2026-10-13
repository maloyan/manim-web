import { describe, it, expect } from 'vitest';
import { cpkColor, normalizeElement, CPK_COLORS, DEFAULT_ELEMENT_COLOR } from './cpkColors';

describe('normalizeElement', () => {
  it('canonicalizes case: cl, CL and Cl all resolve to Cl', () => {
    expect(normalizeElement('cl')).toBe('Cl');
    expect(normalizeElement('CL')).toBe('Cl');
    expect(normalizeElement('Cl')).toBe('Cl');
  });

  it('trims whitespace', () => {
    expect(normalizeElement('  o ')).toBe('O');
  });

  it('returns an empty string unchanged', () => {
    expect(normalizeElement('')).toBe('');
    expect(normalizeElement('   ')).toBe('');
  });
});

describe('cpkColor', () => {
  it('resolves a palette color for a known element (any case)', () => {
    expect(cpkColor('O')).toBe(CPK_COLORS.O);
    expect(cpkColor('cl')).toBe(CPK_COLORS.Cl);
    expect(cpkColor('CL')).toBe(CPK_COLORS.Cl);
  });

  it('falls back to the default color for an unknown element', () => {
    expect(cpkColor('Xx')).toBe(DEFAULT_ELEMENT_COLOR);
  });

  it('honors an override keyed by the canonical symbol', () => {
    expect(cpkColor('O', { O: '#123456' })).toBe('#123456');
  });

  it('applies an override whose key is lower-case against an upper-case raw input', () => {
    // 'CL' normalizes to 'Cl'; the override key 'cl' also normalizes to 'Cl'.
    expect(cpkColor('CL', { cl: '#abc' })).toBe('#abc');
  });

  it('applies an override keyed by the canonical symbol against a lower-case raw input', () => {
    expect(cpkColor('cl', { Cl: '#abc' })).toBe('#abc');
  });

  it('applies an override whose key case differs from both the raw input and the symbol', () => {
    expect(cpkColor('cl', { CL: '#def' })).toBe('#def');
  });

  it('an override wins over the palette color', () => {
    expect(cpkColor('O', { o: '#000000' })).toBe('#000000');
    expect(cpkColor('O', { o: '#000000' })).not.toBe(CPK_COLORS.O);
  });

  it('an exact canonical override wins over a case-variant key', () => {
    // 'Cl' is the exact symbol; 'cl' also matches case-insensitively. The
    // exact match must take precedence for a deterministic result.
    expect(cpkColor('Cl', { Cl: '#111111', cl: '#222222' })).toBe('#111111');
  });

  it('falls back to the palette when no override key matches the element', () => {
    expect(cpkColor('O', { H: '#ffffff' })).toBe(CPK_COLORS.O);
  });
});
