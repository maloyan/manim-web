import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { HeatMap } from './HeatMap';

const BW = ['#000000', '#ffffff'];

describe('HeatMap', () => {
  it('constructs headless and builds a colored mesh', () => {
    expect(() => {
      const heat = new HeatMap({
        func: (x, y) => Math.exp(-(x * x + y * y)),
        resolution: 16,
      });
      heat.getThreeObject();
    }).not.toThrow();

    const heat = new HeatMap({ func: (x, y) => x + y, resolution: 8 });
    const mesh = heat.getThreeObject() as THREE.Mesh;
    expect(mesh.isMesh).toBe(true);
    expect(mesh.geometry.getAttribute('color')).toBeDefined();
    expect(mesh.geometry.getIndex()).not.toBeNull();
  });

  it('maps field values to palette colors at known points', () => {
    const heat = new HeatMap({
      func: (x) => x,
      xRange: [0, 1],
      yRange: [0, 1],
      domain: [0, 1],
      palette: BW,
      resolution: 8,
    });
    expect(heat.colorAt(0, 0)).toBe('#000000');
    expect(heat.colorAt(1, 0)).toBe('#FFFFFF');
    expect(heat.colorAt(0.5, 0)).toBe('#7F7F7F');
  });

  it('clamps values outside the domain to the palette ends', () => {
    const heat = new HeatMap({
      func: (x) => x,
      domain: [0, 1],
      palette: BW,
      resolution: 4,
    });
    expect(heat.colorAt(-10, 0)).toBe('#000000');
    expect(heat.colorAt(10, 0)).toBe('#FFFFFF');
  });

  it('auto-computes the domain from sampled values', () => {
    const heat = new HeatMap({
      func: (x, y) => x + y,
      xRange: [-1, 1],
      yRange: [-1, 1],
      resolution: 8,
    });
    const [min, max] = heat.getDomain();
    expect(min).toBeCloseTo(-2, 6);
    expect(max).toBeCloseTo(2, 6);
  });

  it('produces an index buffer sized for the grid', () => {
    const heat = new HeatMap({ func: (x, y) => x * y, resolution: 10 });
    const index = (heat.getThreeObject() as THREE.Mesh).geometry.getIndex();
    // 10 x 10 cells, 2 triangles each, 3 indices per triangle.
    expect(index?.count).toBe(10 * 10 * 6);
  });

  it('copies into an independent instance', () => {
    const heat = new HeatMap({ func: (x) => x, domain: [0, 1], palette: BW, resolution: 4 });
    const copy = heat.copy();
    expect(copy).toBeInstanceOf(HeatMap);
    expect(copy.colorAt(0.5, 0)).toBe('#7F7F7F');
    expect(copy.getDomain()).toEqual([0, 1]);
  });
});
