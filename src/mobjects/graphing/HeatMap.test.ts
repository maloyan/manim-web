import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { HeatMap } from './HeatMap';
import { VIRIDIS } from './colormap';

const BW = ['#000000', '#ffffff'];

/**
 * Read the sRGB bytes that a vertex of a HeatMap mesh shows on screen.
 *
 * three.js color management holds a vertex color buffer in the linear working
 * space and encodes it back to sRGB for the display. A correct HeatMap writes
 * the working-space color, so reading it back as sRGB returns the palette color.
 */
function vertexDisplaySrgb(heat: HeatMap, vertexIndex: number): [number, number, number] {
  const mesh = heat.getThreeObject() as THREE.Mesh;
  const color = mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
  const working = new THREE.Color().setRGB(
    color.getX(vertexIndex),
    color.getY(vertexIndex),
    color.getZ(vertexIndex),
  );
  const srgb = { r: 0, g: 0, b: 0 };
  working.getRGB(srgb, THREE.SRGBColorSpace);
  return [Math.round(srgb.r * 255), Math.round(srgb.g * 255), Math.round(srgb.b * 255)];
}

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

  it('shows the viridis low end as dark indigo, not bright magenta', () => {
    const heat = new HeatMap({
      func: (x) => x,
      xRange: [0, 1],
      yRange: [0, 1],
      domain: [0, 1],
      palette: VIRIDIS,
      resolution: 4,
    });
    // Vertex 0 sits at x = 0 -> value 0 -> viridis(0) -> #440154 = rgb(68, 1, 84).
    const [r, g, b] = vertexDisplaySrgb(heat, 0);
    expect(r).toBeGreaterThanOrEqual(64);
    expect(r).toBeLessThanOrEqual(72);
    expect(g).toBeLessThanOrEqual(6);
    expect(b).toBeGreaterThanOrEqual(80);
    expect(b).toBeLessThanOrEqual(88);
    // Dark: well below mid brightness. The magenta bug drives this past 120.
    expect(Math.max(r, g, b)).toBeLessThan(110);
  });

  it('shows the viridis high end as yellow', () => {
    const heat = new HeatMap({
      func: (x) => x,
      xRange: [0, 1],
      yRange: [0, 1],
      domain: [0, 1],
      palette: VIRIDIS,
      resolution: 4,
    });
    // The top-right vertex sits at x = 1 -> value 1 -> viridis(1) -> #FDE725.
    const mesh = heat.getThreeObject() as THREE.Mesh;
    const lastVertex = (mesh.geometry.getAttribute('color') as THREE.BufferAttribute).count - 1;
    const [r, g, b] = vertexDisplaySrgb(heat, lastVertex);
    expect(r).toBeGreaterThanOrEqual(249);
    expect(g).toBeGreaterThanOrEqual(227);
    expect(b).toBeLessThanOrEqual(45);
  });

  it('copies into an independent instance', () => {
    const heat = new HeatMap({ func: (x) => x, domain: [0, 1], palette: BW, resolution: 4 });
    const copy = heat.copy();
    expect(copy).toBeInstanceOf(HeatMap);
    expect(copy.colorAt(0.5, 0)).toBe('#7F7F7F');
    expect(copy.getDomain()).toEqual([0, 1]);
  });
});
