// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import { SVGMobject } from './SVGMobject';
import { GradientVMobject } from './svgGradients';
import type { SvgFetchResponse, SvgFetcher } from './svgLoader';
import { VMobject } from '../../core/VMobject';
import { Text } from '../text/Text';
import { ImageMobject } from '../image';
import { colorGradient } from '../../core/VMobjectColorGradient';

/** Stub canvas 2D context (happy-dom lacks full canvas support, Text needs it). */
beforeAll(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    ...args: unknown[]
  ) {
    if (type === '2d') {
      return {
        scale: () => {},
        clearRect: () => {},
        fillText: () => {},
        strokeText: () => {},
        fillRect: () => {},
        measureText: (t: string) => ({
          width: t.length * 10,
          fontBoundingBoxAscent: 30,
          actualBoundingBoxAscent: 10,
          actualBoundingBoxDescent: 2,
          fontBoundingBoxDescent: 3,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: t.length * 10,
        }),
        drawImage: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        quadraticCurveTo: () => {},
        closePath: () => {},
        fill: () => {},
        font: '',
        fillStyle: '',
        strokeStyle: '',
        globalAlpha: 1,
        lineWidth: 1,
        textBaseline: 'alphabetic',
        textAlign: 'left',
        save: () => {},
        restore: () => {},
      } as unknown as CanvasRenderingContext2D;
    }
    return orig.call(this, type, ...(args as []));
  } as typeof orig;
});

/** Build a mock fetcher that returns `body` with status 200. */
function okFetcher(body: string): SvgFetcher {
  return () =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(body),
    } satisfies SvgFetchResponse);
}

describe('SVGMobject.fromUrl', () => {
  it('fetches via the injected fetcher and parses the result', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0 L 10,10 Z" fill="#00ff00"/></svg>';
    let requested = '';
    const fetcher: SvgFetcher = (url) => {
      requested = url;
      return okFetcher(svg)(url);
    };

    const mob = await SVGMobject.fromUrl('https://example.com/icon.svg', { fetcher });

    expect(requested).toBe('https://example.com/icon.svg');
    expect(mob.getLoadError()).toBeNull();
    expect(mob.getSubpaths().length).toBeGreaterThan(0);
    expect(mob.getSubpaths()[0].fillColor).toBe('#00ff00');
  });

  it('forwards options (color) to the parsed result', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/></svg>';
    const mob = await SVGMobject.fromUrl('x.svg', { fetcher: okFetcher(svg), color: '#123456' });
    expect(mob.getSubpaths()[0].color).toBe('#123456');
  });

  it('captures a non-ok HTTP response as a load error', async () => {
    const fetcher: SvgFetcher = () =>
      Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') });
    const mob = await SVGMobject.fromUrl('missing.svg', { fetcher });
    expect(mob.getLoadError()).toBeInstanceOf(Error);
    expect(mob.getLoadError()?.message).toContain('404');
    expect(mob.getSubpaths().length).toBe(0);
  });

  it('captures a rejected fetch as a load error', async () => {
    const fetcher: SvgFetcher = () => Promise.reject(new Error('network down'));
    const mob = await SVGMobject.fromUrl('x.svg', { fetcher });
    expect(mob.getLoadError()?.message).toBe('network down');
  });
});

describe('SVGMobject gradients', () => {
  const linearSvg = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1">
          <stop offset="0" stop-color="#ff0000"/>
          <stop offset="1" stop-color="#0000ff"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="10" height="10" fill="url(#grad1)"/>
    </svg>`;

  it('applies linear gradient stops to a rect fill', () => {
    const mob = new SVGMobject({ svgString: linearSvg, fillOpacity: 0.7 });
    const child = mob.getSubpaths()[0];
    expect(child).toBeInstanceOf(GradientVMobject);
    const grad = child as GradientVMobject;
    expect(grad.gradient.type).toBe('linear');
    expect(grad.gradient.stops.map((s) => s.color)).toEqual(['#ff0000', '#0000ff']);
    // The resampled palette comes from the repo colorGradient helper.
    expect(grad.gradientColors).toEqual(colorGradient(['#ff0000', '#0000ff'], 2));
    // Flat fill falls back to the first (offset-0) stop.
    expect(grad.fillColor).toBe('#ff0000');
    // The SVGMobject fillOpacity option flows through to the gradient fill.
    expect(grad.fillOpacity).toBeCloseTo(0.7);
  });

  it('applies a gradient fill on a <path>', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g"><stop offset="0%" stop-color="#010203"/><stop offset="100%" stop-color="#0a0b0c"/></linearGradient></defs>
        <path d="M 0,0 L 10,0 L 10,10 Z" fill="url(#g)"/>
      </svg>`;
    const mob = new SVGMobject({ svgString: svg });
    expect(mob.getSubpaths()[0]).toBeInstanceOf(GradientVMobject);
  });

  it('reads stop color/opacity from an inline style attribute', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g">
          <stop offset="0" style="stop-color:#112233;stop-opacity:0.5"/>
          <stop offset="1" style="stop-color:#445566"/>
        </linearGradient></defs>
        <rect x="0" y="0" width="4" height="4" fill="url(#g)"/>
      </svg>`;
    const grad = new SVGMobject({ svgString: svg }).getSubpaths()[0] as GradientVMobject;
    expect(grad.gradient.stops[0].color).toBe('#112233');
    expect(grad.gradient.stops[0].opacity).toBeCloseTo(0.5);
    expect(grad.gradient.stops[1].color).toBe('#445566');
  });

  it('approximates a radial gradient as a linear stop sequence', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="r"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
        <circle cx="5" cy="5" r="5" fill="url(#r)"/>
      </svg>`;
    const grad = new SVGMobject({ svgString: svg }).getSubpaths()[0] as GradientVMobject;
    expect(grad.gradient.type).toBe('radial');
    expect(grad.gradient.stops).toHaveLength(2);
  });

  it('copy() preserves the gradient and palette', () => {
    const grad = new SVGMobject({ svgString: linearSvg }).getSubpaths()[0] as GradientVMobject;
    const clone = grad.copy();
    expect(clone).toBeInstanceOf(GradientVMobject);
    expect(clone.gradient.stops.map((s) => s.color)).toEqual(['#ff0000', '#0000ff']);
    expect(clone.gradientColors).toEqual(grad.gradientColors);
  });
});

describe('SVGMobject <text> and <image>', () => {
  it('renders a <text> element as a Text submobject', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <text x="5" y="20" font-size="24" fill="#ff8800">Hello</text>
      </svg>`;
    const mob = new SVGMobject({ svgString: svg });
    const texts = mob.children.filter((c) => c instanceof Text) as Text[];
    expect(texts).toHaveLength(1);
    expect(texts[0].getText()).toBe('Hello');
    expect(texts[0].color).toBe('#ff8800');
  });

  it('skips empty <text> nodes', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text x="0" y="0">   </text></svg>';
    const mob = new SVGMobject({ svgString: svg });
    expect(mob.children.filter((c) => c instanceof Text)).toHaveLength(0);
  });

  it('renders an <image> element as an ImageMobject', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <image x="0" y="0" width="8" height="8" href="data:image/png;base64,AAAA"/>
      </svg>`;
    const mob = new SVGMobject({ svgString: svg });
    const images = mob.children.filter((c) => c instanceof ImageMobject) as ImageMobject[];
    expect(images).toHaveLength(1);
    expect(images[0].getSource()).toBe('data:image/png;base64,AAAA');
  });
});

describe('SVGMobject no regression (string path)', () => {
  it('still parses a plain path string into VMobject children', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0 L 10,10 Z" stroke="#ff0000" fill="#00ff00"/></svg>';
    const mob = new SVGMobject({ svgString: svg });
    const child = mob.getSubpaths()[0];
    expect(child).toBeInstanceOf(VMobject);
    expect(child).not.toBeInstanceOf(GradientVMobject);
    expect(child.color).toBe('#ff0000');
    expect(child.fillColor).toBe('#00ff00');
    expect(mob.getLoadError()).toBeNull();
  });

  it('keeps fill="none" flat with zero fill opacity', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="5" fill="none"/></svg>';
    const child = new SVGMobject({ svgString: svg }).getSubpaths()[0];
    expect(child).not.toBeInstanceOf(GradientVMobject);
    expect(child.fillOpacity).toBe(0);
  });
});
