import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  normalizeBase,
  baseColor,
  complementOf,
  DNA_BASE_COLORS,
  BASE_COMPLEMENT,
  DEFAULT_BIOLOGY_COLOR,
} from './biologyColors';
import { logger } from '../../utils/logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizeBase', () => {
  it('uppercases and trims a recognized base without warning', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    expect(normalizeBase('a')).toBe('A');
    expect(normalizeBase('  g ')).toBe('G');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns on an unrecognized base but still returns it uppercased', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    // RNA uracil is not a recognized DNA base.
    expect(normalizeBase('u')).toBe('U');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toMatch(/unrecognized DNA base/i);
  });

  it('warns on junk input and returns it uppercased unchanged', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    expect(normalizeBase('xyz')).toBe('XYZ');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('baseColor', () => {
  it('resolves the palette color for each recognized base', () => {
    expect(baseColor('A')).toBe(DNA_BASE_COLORS.A);
    expect(baseColor('t')).toBe(DNA_BASE_COLORS.T);
    expect(baseColor('G')).toBe(DNA_BASE_COLORS.G);
    expect(baseColor('c')).toBe(DNA_BASE_COLORS.C);
  });

  it('the four base colors are all distinct', () => {
    const colors = new Set([baseColor('A'), baseColor('T'), baseColor('G'), baseColor('C')]);
    expect(colors.size).toBe(4);
  });

  it('honors a per-base override', () => {
    expect(baseColor('A', { A: '#abcdef' })).toBe('#abcdef');
  });

  it('warns and falls back to the default color for an unrecognized base', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    expect(baseColor('U')).toBe(DEFAULT_BIOLOGY_COLOR);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('complementOf', () => {
  it('returns the Watson-Crick complement for a recognized base', () => {
    expect(complementOf('A')).toBe(BASE_COMPLEMENT.A);
    expect(complementOf('t')).toBe(BASE_COMPLEMENT.T);
    expect(complementOf('G')).toBe('C');
    expect(complementOf('c')).toBe('G');
  });

  it('warns and returns the input symbol for an unrecognized base', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    expect(complementOf('U')).toBe('U');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
