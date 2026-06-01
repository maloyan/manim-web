// @vitest-environment happy-dom
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ImageMobject } from './index';

/**
 * Regression tests for the DURABLE fallback bake in TexturedMobject._bakeFallbackScale,
 * as overridden by ImageMobject. Covers the case the size-bake path cannot handle:
 * scaling + normalizing an ImageMobject BEFORE its texture has loaded.
 *
 * Before the fix, the scale went into mesh.scale and was clobbered when the async
 * load ran _updateGeometry() (mesh.scale.set(dims...)), and getBoundingBox() ignored
 * mesh.scale entirely. Now the factor persists in _calculateDimensions().
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

        // Not loaded yet: _currentVisualSize() is null, so this hits the durable fallback.
        expect(image.isLoaded()).toBe(false);
        image.scale(3);
        image.normalizeTransform();

        // Transform folded to identity.
        expect(image.scaleVector.x).toBeCloseTo(1, 6);
        expect(image.scaleVector.y).toBeCloseTo(1, 6);

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

  it('a later applyVisualSize composes (overrides) rather than double-applying the fallback', async () => {
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
        image.scale(3); // -> baked fallback factor 3
        image.normalizeTransform();
        fireLoad!();

        // applyVisualSize sets an explicit size and must DROP the baked factor.
        image.applyVisualSize(5, 5);
        const bb = image.getBoundingBox();
        expect(bb.width).toBeCloseTo(5, 4);
        expect(bb.height).toBeCloseTo(5, 4);

        // A subsequent normalize is a no-op (identity scale) and must not shrink.
        image.normalizeTransform();
        const bb2 = image.getBoundingBox();
        expect(bb2.width).toBeCloseTo(5, 4);
        expect(bb2.height).toBeCloseTo(5, 4);
      });
    } finally {
      loadSpy.mockRestore();
    }
  });
});
