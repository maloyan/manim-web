// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { SVGMobject } from './SVGMobject';
import { PatternVMobject, parsePatternDefs, resolvePatternFill } from './svgPatterns';
import { VMobject } from '../../core/VMobject';

/**
 * Stub the canvas 2D context. happy-dom has no real canvas, so pattern tile
 * rasterization needs a drawing surface. The stub records nothing; it only
 * gives the pattern code the methods it calls without throwing.
 */
beforeAll(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    type: string,
    ...args: unknown[]
  ) {
    if (type === '2d') {
      return {
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        ellipse: () => {},
        fill: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;
    }
    return orig.call(this, type, ...(args as []));
  } as typeof orig;
});

/** Parse an SVG string to its `<svg>` root for the def-level helpers. */
function parseSvgRoot(svg: string): Element {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.querySelector('svg');
  if (!root) throw new Error('no svg root');
  return root;
}

describe('parsePatternDefs', () => {
  it('parses id, tile size and content of a pattern', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="12">
            <circle cx="5" cy="5" r="3" fill="#ff0000"/>
          </pattern>
        </defs>
        <rect x="0" y="0" width="40" height="40" fill="url(#dots)"/>
      </svg>`;
    const defs = parsePatternDefs(parseSvgRoot(svg));
    expect(defs.has('dots')).toBe(true);
    const pat = defs.get('dots')!;
    expect(pat.width).toBe(10);
    expect(pat.height).toBe(12);
    expect(pat.patternUnits).toBe('userSpaceOnUse');
    expect(pat.content.length).toBe(1);
  });

  it('skips a pattern without an id', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><pattern width="4" height="4"><rect width="4" height="4" fill="#000"/></pattern></defs>
      </svg>`;
    expect(parsePatternDefs(parseSvgRoot(svg)).size).toBe(0);
  });

  it('skips an empty pattern (no content children)', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="empty" width="4" height="4"></pattern></defs>
      </svg>`;
    expect(parsePatternDefs(parseSvgRoot(svg)).size).toBe(0);
  });
});

describe('resolvePatternFill', () => {
  it('resolves a url(#id) reference to its pattern', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="p" width="4" height="4"><rect width="4" height="4" fill="#0f0"/></pattern></defs>
      </svg>`;
    const defs = parsePatternDefs(parseSvgRoot(svg));
    expect(resolvePatternFill('url(#p)', defs)?.id).toBe('p');
    expect(resolvePatternFill('url( "#p" )', defs)?.id).toBe('p');
    expect(resolvePatternFill('#f00', defs)).toBeUndefined();
    expect(resolvePatternFill(null, defs)).toBeUndefined();
    expect(resolvePatternFill('url(#missing)', defs)).toBeUndefined();
  });
});

describe('SVGMobject patterns', () => {
  const dotSvg = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="#ffffff"/>
          <circle cx="5" cy="5" r="3" fill="#ff0000"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="40" height="40" fill="url(#dots)"/>
    </svg>`;

  it('resolves a pattern fill to a repeating CanvasTexture', () => {
    const mob = new SVGMobject({ svgString: dotSvg });
    const child = mob.getSubpaths()[0];
    expect(child).toBeInstanceOf(PatternVMobject);
    const pat = child as PatternVMobject;
    expect(pat.pattern.id).toBe('dots');
    expect(pat.patternTexture).toBeInstanceOf(THREE.CanvasTexture);
    expect(pat.patternTexture!.wrapS).toBe(THREE.RepeatWrapping);
    expect(pat.patternTexture!.wrapT).toBe(THREE.RepeatWrapping);
    // A 40-unit shape over a 10-unit tile repeats 4 times on each axis.
    expect(pat.patternTexture!.repeat.x).toBeCloseTo(4);
    expect(pat.patternTexture!.repeat.y).toBeCloseTo(4);
  });

  it('exposes a solid flat-fill approximation for the single-fill pipeline', () => {
    const pat = new SVGMobject({
      svgString: dotSvg,
      fillOpacity: 0.7,
    }).getSubpaths()[0] as PatternVMobject;
    // First solid fill in the tile is the #ffffff background rect.
    expect(pat.fillColor).toBe('#ffffff');
    // The SVGMobject fillOpacity option flows through to the pattern fill.
    expect(pat.fillOpacity).toBeCloseTo(0.7);
  });

  it('resolves a pattern fill on a <path>', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="p" width="5" height="5"><rect width="5" height="5" fill="#123456"/></pattern></defs>
        <path d="M 0,0 L 20,0 L 20,20 Z" fill="url(#p)"/>
      </svg>`;
    expect(new SVGMobject({ svgString: svg }).getSubpaths()[0]).toBeInstanceOf(PatternVMobject);
  });

  it('supports a pattern tile containing an <image> without throwing', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="img" patternUnits="userSpaceOnUse" width="8" height="8">
          <image x="0" y="0" width="8" height="8" href="data:image/png;base64,AAAA"/>
        </pattern></defs>
        <rect x="0" y="0" width="16" height="16" fill="url(#img)"/>
      </svg>`;
    const pat = new SVGMobject({ svgString: svg }).getSubpaths()[0] as PatternVMobject;
    expect(pat).toBeInstanceOf(PatternVMobject);
    expect(pat.patternTexture).toBeInstanceOf(THREE.CanvasTexture);
  });

  it('falls back without throwing for an unsupported-content pattern', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="u" patternUnits="userSpaceOnUse" width="6" height="6">
          <text x="0" y="5">no</text>
        </pattern></defs>
        <rect x="0" y="0" width="12" height="12" fill="url(#u)"/>
      </svg>`;
    let pat: PatternVMobject | undefined;
    expect(() => {
      pat = new SVGMobject({ svgString: svg }).getSubpaths()[0] as PatternVMobject;
    }).not.toThrow();
    expect(pat).toBeInstanceOf(PatternVMobject);
    // Nothing drawable in the tile, so no texture and no flat fill.
    expect(pat!.patternTexture).toBeNull();
    expect(pat!.fillOpacity).toBe(0);
  });

  it('falls back to a plain VMobject for an empty pattern reference', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="empty" width="4" height="4"></pattern></defs>
        <rect x="0" y="0" width="8" height="8" fill="url(#empty)"/>
      </svg>`;
    const child = new SVGMobject({ svgString: svg }).getSubpaths()[0];
    expect(child).not.toBeInstanceOf(PatternVMobject);
    expect(child.fillOpacity).toBe(0);
  });

  it('copy() preserves the pattern and texture', () => {
    const pat = new SVGMobject({ svgString: dotSvg }).getSubpaths()[0] as PatternVMobject;
    const clone = pat.copy();
    expect(clone).toBeInstanceOf(PatternVMobject);
    expect(clone.pattern.id).toBe('dots');
    expect(clone.patternTexture).toBeInstanceOf(THREE.CanvasTexture);
  });

  it('does not change solid/gradient fills', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5" height="5" fill="#00ff00"/></svg>';
    const child = new SVGMobject({ svgString: svg }).getSubpaths()[0];
    expect(child).toBeInstanceOf(VMobject);
    expect(child).not.toBeInstanceOf(PatternVMobject);
    expect(child.fillColor).toBe('#00ff00');
  });
});
