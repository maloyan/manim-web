/**
 * Tests for the RamachandranPlot mobject.
 *
 * Covers construction from explicit points and from residues, the empty-input
 * guard (axes only), the color modes (uniform / residue / region), the
 * allowed-region outlines, and the invalid-input error.
 */
import { describe, it, expect } from 'vitest';
import { RamachandranPlot } from './RamachandranPlot';
import { Polygon } from '../geometry/Polygon';
import { Dot } from '../geometry/Dot';
import { Axes } from '../graphing/Axes';
import { ResidueCA } from './pdb';
import { RAMACHANDRAN_REGIONS } from './ramachandran';

/** A planar extended three-residue backbone (middle residue has φ = ψ = 180). */
function extendedBackbone(code = 'A'): ResidueCA[] {
  return [
    { code, chain: 'A', resSeq: 1, ca: [1, 1, 0], n: [0, 0, 0], c: [2, 0, 0] },
    { code, chain: 'A', resSeq: 2, ca: [4, 0, 0], n: [3, 1, 0], c: [5, 1, 0] },
    { code, chain: 'A', resSeq: 3, ca: [7, 1, 0], n: [6, 0, 0], c: [8, 0, 0] },
  ];
}

describe('RamachandranPlot', () => {
  it('plots one dot per explicit point on [-180, 180] axes', () => {
    const plot = new RamachandranPlot({
      points: [
        { phi: -63, psi: -43 },
        { phi: -120, psi: 130 },
      ],
    });
    expect(plot.getPointCount()).toBe(2);
    expect(plot.getDots().length).toBe(2);
    expect(plot.getAxes()).toBeInstanceOf(Axes);
    expect(plot.getDot(0)).toBeInstanceOf(Dot);
  });

  it('computes φ/ψ from residues with backbone atoms', () => {
    const plot = new RamachandranPlot({ residues: extendedBackbone() });
    expect(plot.getPointCount()).toBe(1);
    expect(Math.abs(plot.getPlotPoints()[0].phi)).toBeCloseTo(180, 4);
  });

  it('renders an empty plot (axes only) for empty input, with no throw', () => {
    const fromNothing = new RamachandranPlot();
    expect(fromNothing.getPointCount()).toBe(0);
    expect(fromNothing.getDots().length).toBe(0);
    expect(fromNothing.getAxes()).toBeInstanceOf(Axes);

    expect(new RamachandranPlot({ points: [] }).getPointCount()).toBe(0);
    expect(new RamachandranPlot({ residues: [] }).getPointCount()).toBe(0);
  });

  it('throws a clear error for an invalid point', () => {
    expect(() => new RamachandranPlot({ points: [{ phi: Number.NaN, psi: 0 }] })).toThrow(
      /non-finite/,
    );
  });

  it('colorBy "uniform" uses the dot color for every dot', () => {
    const plot = new RamachandranPlot({
      points: [
        { phi: -63, psi: -43, residue: 'G' },
        { phi: -63, psi: -43, residue: 'A' },
      ],
      colorBy: 'uniform',
      dotColor: '#123456',
    });
    expect(plot.colorForPoint(0)).toBe('#123456');
    expect(plot.colorForPoint(1)).toBe('#123456');
  });

  it('colorBy "residue" gives glycine a distinct color', () => {
    const plot = new RamachandranPlot({
      points: [
        { phi: -63, psi: -43, residue: 'G' },
        { phi: -63, psi: -43, residue: 'A' },
      ],
      colorBy: 'residue',
    });
    const glycine = plot.colorForPoint(0);
    const alanine = plot.colorForPoint(1);
    expect(glycine).not.toBe(alanine);
  });

  it('colorBy "region" colors by the containing region and marks outliers', () => {
    const plot = new RamachandranPlot({
      points: [
        { phi: -63, psi: -43 }, // alpha-right
        { phi: 0, psi: 0 }, // outlier
      ],
      colorBy: 'region',
      outlierColor: '#000000',
    });
    const alphaRight = RAMACHANDRAN_REGIONS.find((r) => r.name === 'alpha-right');
    expect(plot.colorForPoint(0)).toBe(alphaRight?.color);
    expect(plot.colorForPoint(1)).toBe('#000000');
  });

  it('showAllowedRegions adds one polygon per region behind the dots', () => {
    const withRegions = new RamachandranPlot({
      points: [{ phi: -63, psi: -43 }],
      showAllowedRegions: true,
    });
    expect(withRegions.getRegions().length).toBe(RAMACHANDRAN_REGIONS.length);
    expect(withRegions.getRegions().get(0)).toBeInstanceOf(Polygon);

    const withoutRegions = new RamachandranPlot({ points: [{ phi: -63, psi: -43 }] });
    expect(withoutRegions.getRegions().length).toBe(0);
  });

  it('places dots at the axis coordinate for their (φ, ψ)', () => {
    const plot = new RamachandranPlot({ points: [{ phi: 90, psi: -90 }] });
    const expected = plot.getAxes().coordsToPoint(90, -90);
    const dot = plot.getDot(0);
    expect(dot).toBeDefined();
    const pos = dot!.getCenter();
    expect(pos[0]).toBeCloseTo(expected[0], 5);
    expect(pos[1]).toBeCloseTo(expected[1], 5);
  });
});
