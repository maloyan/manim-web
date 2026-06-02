// @vitest-environment happy-dom
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ImageMobject } from './index';

/**
 * Pre-load scale durability for ImageMobject.
 *
 * MIGRATION (absolutize): normalize no longer folds a pre-load scale into a
 * durable `_bakedScale` fallback + resets scaleVector to 1. The scale is simply
 * retained on `scaleVector`; since `getBoundingBox()` multiplies by `scaleVector`
 * and `getBounds()` is world-matrix based, a scale applied BEFORE the async
 * texture load survives the load automatically (the load rebuilds geometry but
 * never touches the Mobject transform).
 */
describe('ImageMobject pre-load scale survives load + normalize', () => {
  // Mock 2D canvas context so pixelData decoding works headlessly.
  const mockCtx = {
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low' as const,
    createImageData: (width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    }),
    putImageData: () => {},
    drawImage: () => {},
    getImageData: (_x: number, _y: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    }),
  };

  function withCanvasMock<T>(fn: () => T): T {
    const originalCreateElement = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string): HTMLElement => {
        const el = originalCreateElement(tagName);
        if (tagName.toLowerCase() === 'canvas') {
          (el as HTMLCanvasElement).getContext = ((contextType: string) =>
            contextType === '2d' ? mockCtx : null) as HTMLCanvasElement['getContext'];
        }
        return el;
      });
    try {
      return fn();
    } finally {
      spy.mockRestore();
    }
  }

  it('scale before texture load is preserved after async load completes', async () => {
    // Drive the TextureLoader manually so we can scale+normalize BEFORE onLoad.
    let fireLoad: (() => void) | null = null;
    const loadSpy = vi
      .spyOn(THREE.TextureLoader.prototype, 'load')
      .mockImplementation((_url: string, onLoad?: any) => {
        const texture = new THREE.Texture();
        // 4x2 natural pixels -> aspect ratio 2.
        (texture as any).image = { width: 4, height: 2 };
        fireLoad = () => onLoad?.(texture);
        return texture;
      });

    try {
      withCanvasMock(() => {
        const image = new ImageMobject({ source: 'https://example.com/x.png', width: 2 });

        // Not loaded yet: the scale is applied before the texture/natural size exists.
        expect(image.isLoaded()).toBe(false);
        image.scale(3);
        image.normalizeTransform();

        // MIGRATION: scale is retained on scaleVector (absolutized), not reset to 1.
        expect(image.scaleVector.x).toBeCloseTo(3, 6);
        expect(image.scaleVector.y).toBeCloseTo(3, 6);

        // Complete the async load.
        fireLoad!();
        expect(image.isLoaded()).toBe(true);

        // width:2 with aspect 2 -> base 2x1; baked 3x -> 6x3. getBoundingBox honors it.
        const bb = image.getBoundingBox();
        expect(bb.width).toBeCloseTo(6, 4);
        expect(bb.height).toBeCloseTo(3, 4);

        // getBounds (world matrices) must agree.
        const b = image.getBounds();
        expect(b.max.x - b.min.x).toBeCloseTo(6, 3);
        expect(b.max.y - b.min.y).toBeCloseTo(3, 3);
      });
    } finally {
      loadSpy.mockRestore();
    }
  });

  it('a later applyVisualSize composes with the retained scaleVector (no double-apply on re-normalize)', async () => {
    let fireLoad: (() => void) | null = null;
    const loadSpy = vi
      .spyOn(THREE.TextureLoader.prototype, 'load')
      .mockImplementation((_url: string, onLoad?: any) => {
        const texture = new THREE.Texture();
        (texture as any).image = { width: 4, height: 2 };
        fireLoad = () => onLoad?.(texture);
        return texture;
      });

    try {
      withCanvasMock(() => {
        const image = new ImageMobject({ source: 'https://example.com/x.png', width: 2 });
        image.scale(3);
        image.normalizeTransform(); // scaleVector retained at 3
        fireLoad!();

        // MIGRATION (absolutize): applyVisualSize sets the base display size; it no
        // longer drops a baked factor. The retained scaleVector (3) still multiplies
        // it, so the bounding box is 5 * 3 = 15.
        image.applyVisualSize(5, 5);
        expect(image.scaleVector.x).toBeCloseTo(3, 6);
        const bb = image.getBoundingBox();
        expect(bb.width).toBeCloseTo(15, 4);
        expect(bb.height).toBeCloseTo(15, 4);

        // A subsequent normalize is idempotent (root mesh re-absolutizes its own
        // matrix) and must not change the size.
        image.normalizeTransform();
        const bb2 = image.getBoundingBox();
        expect(bb2.width).toBeCloseTo(15, 4);
        expect(bb2.height).toBeCloseTo(15, 4);
      });
    } finally {
      loadSpy.mockRestore();
    }
  });
});
