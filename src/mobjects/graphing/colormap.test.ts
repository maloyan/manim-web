import { describe, it, expect } from 'vitest';
import { sampleColormap, valueToColor, VIRIDIS, INFERNO, COOLWARM } from './colormap';

const BW = ['#000000', '#ffffff'];

describe('sampleColormap', () => {
  it('returns palette endpoints at t = 0 and t = 1', () => {
    expect(sampleColormap(BW, 0)).toBe('#000000');
    expect(sampleColormap(BW, 1)).toBe('#FFFFFF');
  });

  it('blends to the midpoint at t = 0.5', () => {
    expect(sampleColormap(BW, 0.5)).toBe('#7F7F7F');
  });

  it('clamps t into 0..1', () => {
    expect(sampleColormap(BW, -5)).toBe('#000000');
    expect(sampleColormap(BW, 5)).toBe('#FFFFFF');
  });

  it('returns the single stop of a one-color palette', () => {
    expect(sampleColormap(['#123456'], 0.42)).toBe('#123456');
  });

  it('returns the first and last stop of a multi-stop palette', () => {
    expect(sampleColormap(VIRIDIS, 0)).toBe(VIRIDIS[0].toUpperCase());
    expect(sampleColormap(VIRIDIS, 1)).toBe(VIRIDIS[VIRIDIS.length - 1].toUpperCase());
    expect(sampleColormap(INFERNO, 0)).toBe(INFERNO[0].toUpperCase());
    expect(sampleColormap(COOLWARM, 0.5)).toBe('#FFFFFF');
  });

  it('throws on an empty palette', () => {
    expect(() => sampleColormap([], 0.5)).toThrow();
  });

  it('is deterministic', () => {
    expect(sampleColormap(VIRIDIS, 0.37)).toBe(sampleColormap(VIRIDIS, 0.37));
  });
});

describe('valueToColor', () => {
  it('maps a value through its domain', () => {
    expect(valueToColor(0, 0, 10, BW)).toBe('#000000');
    expect(valueToColor(10, 0, 10, BW)).toBe('#FFFFFF');
    expect(valueToColor(5, 0, 10, BW)).toBe('#7F7F7F');
  });

  it('clamps values outside the domain', () => {
    expect(valueToColor(-100, 0, 10, BW)).toBe('#000000');
    expect(valueToColor(100, 0, 10, BW)).toBe('#FFFFFF');
  });

  it('maps every value to the first stop for a zero-width domain', () => {
    expect(valueToColor(7, 3, 3, BW)).toBe('#000000');
  });
});
