// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { ImageMobject } from './index';

describe('ImageMobject bounds after scale', () => {
  it('getBounds width/height scale with scale()', async () => {
    const mockCanvas2DContext = {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low' as const,
      createImageData: (width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }),
      putImageData: () => {},
      drawImage: () => {},
      getImageData: (x: number, y: number, width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }),
    };

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string): HTMLElement => {
        const el = originalCreateElement(tagName);
        if (tagName.toLowerCase() === 'canvas') {
          (el as HTMLCanvasElement).getContext = ((contextType: string) =>
            contextType === '2d' ? mockCanvas2DContext : null) as HTMLCanvasElement['getContext'];
        }
        return el;
      });

    try {
      const image = new ImageMobject({
        pixelData: [
          [0, 255],
          [255, 0],
        ],
        height: 2,
      });

      await image.waitForLoad();

      const b0 = image.getBounds();
      const w0 = b0.max.x - b0.min.x;
      const h0 = b0.max.y - b0.min.y;

      image.scale(2);

      const b1 = image.getBounds();
      const w1 = b1.max.x - b1.min.x;
      const h1 = b1.max.y - b1.min.y;

      expect(w1).toBeCloseTo(w0 * 2, 5);
      expect(h1).toBeCloseTo(h0 * 2, 5);
    } finally {
      createElementSpy.mockRestore();
    }
  });

  // Issue 1 regression: a scaled ImageMobject must survive normalizeTransform().
  // Before the fix, normalize reset scaleVector to 1 without baking the scale
  // into the persistent display size, so the image shrank back to its unscaled
  // dimensions (visible inside a VGroup, which normalizes on construction).
  it('scaled ImageMobject survives normalizeTransform (bounds preserved, scaleVector=1)', async () => {
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
      getImageData: (x: number, y: number, width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }),
    };
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
      const image = new ImageMobject({
        pixelData: [
          [0, 255],
          [255, 0],
        ],
        height: 2,
      });
      await image.waitForLoad();

      image.scale(2);
      const before = image.getBounds();
      const wBefore = before.max.x - before.min.x;
      const hBefore = before.max.y - before.min.y;

      image.normalizeTransform();

      // Scale was folded into the persistent size; the transform is now identity.
      expect(image.scaleVector.x).toBeCloseTo(1, 6);
      expect(image.scaleVector.y).toBeCloseTo(1, 6);

      const after = image.getBounds();
      const wAfter = after.max.x - after.min.x;
      const hAfter = after.max.y - after.min.y;

      // Bounds must NOT change across normalize — no shrink.
      expect(wAfter).toBeCloseTo(wBefore, 5);
      expect(hAfter).toBeCloseTo(hBefore, 5);
    } finally {
      spy.mockRestore();
    }
  });
});
