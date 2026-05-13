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
});
