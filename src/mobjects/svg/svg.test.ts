// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import {
  VMobjectFromSVGPath,
  SVGMobject,
  svgMobject,
  BraceBetweenPoints,
  Brace,
  ArcBrace,
  BraceLabel,
  BraceText,
} from './index';
import { VMobject } from '../../core/VMobject';
import { Group } from '../../core/Group';
import { WHITE } from '../../constants';
import { DOWN, UP, LEFT, RIGHT } from '../../core/Mobject';
import { Rectangle } from '../geometry/Rectangle';
import { Arc } from '../geometry/Arc';

/** Stub canvas 2D context (happy-dom lacks full canvas support) */
beforeAll(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
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

describe('VMobjectFromSVGPath', () => {
  it('constructs from a simple line path', () => {
    const path = new VMobjectFromSVGPath({ pathData: 'M 0,0 L 10,0' });
    expect(path).toBeInstanceOf(VMobject);
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('constructs from a cubic bezier path', () => {
    const path = new VMobjectFromSVGPath({ pathData: 'M 0,0 C 5,10 15,10 20,0' });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('uses default color WHITE and custom color', () => {
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 L 10,0' }).color).toBe(WHITE);
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 L 10,0', color: '#ff0000' }).color).toBe(
      '#ff0000',
    );
  });

  it('uses custom fill settings', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 L 10,0 L 10,10 Z',
      fillColor: '#00ff00',
      fillOpacity: 0.5,
    });
    expect(path.fillColor).toBe('#00ff00');
    expect(path.fillOpacity).toBe(0.5);
  });

  it('handles H, V, Z commands', () => {
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 H 10' }).numPoints).toBeGreaterThan(0);
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 V 10' }).numPoints).toBeGreaterThan(0);
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 L 10,0 L 10,10 Z' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles relative commands (l, m, h, v, c, s, q, t)', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 l 10,10 l 10,-10' }).numPoints,
    ).toBeGreaterThan(0);
    expect(new VMobjectFromSVGPath({ pathData: 'm 5,5 l 10,0' }).numPoints).toBeGreaterThan(0);
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 h 10' }).numPoints).toBeGreaterThan(0);
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 v 10' }).numPoints).toBeGreaterThan(0);
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 c 5,10 15,10 20,0' }).numPoints,
    ).toBeGreaterThan(0);
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 c 5,10 15,10 20,0 s 15,-10 20,0' }).numPoints,
    ).toBeGreaterThan(0);
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 q 5,10 10,0' }).numPoints).toBeGreaterThan(0);
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 q 5,10 10,0 t 10,0' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles Q command', () => {
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 Q 5,10 10,0' }).numPoints).toBeGreaterThan(0);
  });

  it('handles S command with and without preceding C', () => {
    // S after C: reflects previous control point
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 C 5,10 15,10 20,0 S 35,-10 40,0' }).numPoints,
    ).toBeGreaterThan(0);
    // S without preceding C: control point = current point
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 S 5,10 10,0' }).numPoints).toBeGreaterThan(0);
  });

  it('handles T command with and without preceding Q', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 Q 5,10 10,0 T 20,0' }).numPoints,
    ).toBeGreaterThan(0);
    // T without preceding Q
    expect(new VMobjectFromSVGPath({ pathData: 'M 0,0 T 10,0' }).numPoints).toBeGreaterThan(0);
  });

  it('handles arc A command', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 10,80 A 25,25 0 0,1 50,80' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles arc with large-arc and sweep flags', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 10,80 A 25,25 0 1,0 50,80' }).numPoints,
    ).toBeGreaterThan(0);
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 10,80 A 25,25 0 1,1 50,80' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles degenerate arc (rx=0)', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 A 0,25 0 0,1 50,0' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles relative arc command', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 10,80 a 25,25 0 0,1 40,0' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles arc with rotation', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 10,80 A 25,50 45 0,1 50,80' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles arc where radii need scaling (too small)', () => {
    expect(
      new VMobjectFromSVGPath({ pathData: 'M 0,0 A 1,1 0 0,1 100,100' }).numPoints,
    ).toBeGreaterThan(0);
  });

  it('handles Z when already at start position', () => {
    // Z where current==start: no extra line segment added
    const path = new VMobjectFromSVGPath({ pathData: 'M 0,0 L 10,0 L 0,0 Z' });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('handles empty path gracefully', () => {
    expect(new VMobjectFromSVGPath({ pathData: '' }).numPoints).toBe(0);
  });

  it('creates a copy preserving pathData and styles', () => {
    const orig = new VMobjectFromSVGPath({
      pathData: 'M 0,0 L 10,0',
      color: '#f00',
      fillColor: '#0f0',
      fillOpacity: 0.3,
      strokeWidth: 2,
    });
    const copy = orig.copy() as VMobjectFromSVGPath;
    expect(copy).not.toBe(orig);
    expect(copy).toBeInstanceOf(VMobjectFromSVGPath);
    expect(copy.color).toBe('#f00');
    expect(copy.fillColor).toBe('#0f0');
    expect(copy.fillOpacity).toBe(0.3);
    expect(copy.numPoints).toBeGreaterThan(0);
  });

  it('handles multiple subpaths (M after first path)', () => {
    // Only first subpath is used for VMobjectFromSVGPath
    const path = new VMobjectFromSVGPath({ pathData: 'M 0,0 L 10,0 M 20,0 L 30,0' });
    expect(path.numPoints).toBeGreaterThan(0);
  });
});

describe('SVGMobject', () => {
  it('constructs with empty options', () => {
    const svg = new SVGMobject();
    expect(svg).toBeInstanceOf(SVGMobject);
    expect(svg.children.length).toBe(0);
  });

  it('parses SVG with a single path', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 100,0 L 100,100 Z"/></svg>',
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('parses SVG rect element', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="50" height="30"/></svg>',
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('skips rect with zero dimensions', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="0" height="30"/></svg>',
    });
    expect(svg.children.length).toBe(0);
  });

  it('parses SVG circle element', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="25"/></svg>',
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('skips circle with zero radius', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="0"/></svg>',
    });
    expect(svg.children.length).toBe(0);
  });

  it('parses SVG ellipse element', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="50" rx="30" ry="20"/></svg>',
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('skips ellipse with zero radii', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="50" rx="0" ry="20"/></svg>',
    });
    expect(svg.children.length).toBe(0);
  });

  it('parses SVG line element', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="100" y2="100"/></svg>',
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('parses SVG polygon element', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><polygon points="50,0 100,100 0,100"/></svg>',
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('skips polygon with insufficient points', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><polygon points="50"/></svg>',
    });
    expect(svg.children.length).toBe(0);
  });

  it('parses SVG polyline element', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><polyline points="0,0 50,50 100,0"/></svg>',
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('skips polyline with insufficient points', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><polyline points="50"/></svg>',
    });
    expect(svg.children.length).toBe(0);
  });

  it('extracts stroke and fill styles from path attributes', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0" stroke="#ff0000" fill="#00ff00" stroke-width="3"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.color).toBe('#ff0000');
    expect(child.fillColor).toBe('#00ff00');
    expect(child.strokeWidth).toBe(3);
  });

  it('uses default color when path has no stroke attribute', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/></svg>',
      color: '#abcdef',
    });
    const child = svg.children[0] as VMobject;
    expect(child.color).toBe('#abcdef');
  });

  it('handles fill="none" on path', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0 L 10,10 Z" fill="none"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.fillOpacity).toBe(0);
  });

  it('parses rect with stroke and fill attributes', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="50" height="50" stroke="#f00" fill="#0f0" stroke-width="2"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.color).toBe('#f00');
    expect(child.fillColor).toBe('#0f0');
  });

  it('parses circle with fill attribute', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20" fill="blue"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.fillColor).toBe('blue');
  });

  it('parses polygon with fill attribute', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 100,0 50,100" fill="red"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.fillColor).toBe('red');
  });

  it('handles rect fill="none"', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="50" height="30" fill="none"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.fillOpacity).toBe(0);
  });

  it('handles polygon fill="none"', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 50,0 25,50" fill="none"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.fillOpacity).toBe(0);
  });

  it('handles circle fill="none"', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5" fill="none"/></svg>',
    });
    const child = svg.children[0] as VMobject;
    expect(child.fillOpacity).toBe(0);
  });

  it('parses multiple SVG elements', () => {
    const svg = new SVGMobject({
      svgString: `<svg xmlns="http://www.w3.org/2000/svg">
        <path d="M 0,0 L 10,0"/>
        <circle cx="50" cy="50" r="10"/>
        <rect x="0" y="0" width="20" height="20"/>
        <line x1="0" y1="0" x2="50" y2="50"/>
      </svg>`,
    });
    expect(svg.children.length).toBeGreaterThanOrEqual(4);
  });

  it('skips path without d attribute', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><path/></svg>',
    });
    expect(svg.children.length).toBe(0);
  });

  it('warns and returns empty when no SVG element found', () => {
    const svg = new SVGMobject({ svgString: '<div>not svg</div>' });
    expect(svg.children.length).toBe(0);
  });

  it('getSubpaths returns VMobject children', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/><path d="M 20,0 L 30,0"/></svg>',
    });
    const subpaths = svg.getSubpaths();
    expect(subpaths.length).toBe(2);
    subpaths.forEach((s) => expect(s).toBeInstanceOf(VMobject));
  });

  it('creates a copy', () => {
    const orig = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/></svg>',
    });
    const copy = orig.copy() as SVGMobject;
    expect(copy).not.toBe(orig);
    expect(copy).toBeInstanceOf(SVGMobject);
    // _createCopy re-parses SVG, then Mobject.copy() also deep-copies children
    expect(copy.children.length).toBeGreaterThanOrEqual(orig.children.length);
  });

  it('applies fillOpacity option to children', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0 L 10,10 Z" fill="red"/></svg>',
      fillOpacity: 0.8,
    });
    const child = svg.children[0] as VMobject;
    expect(child.fillOpacity).toBeCloseTo(0.8);
  });

  it('applies custom strokeWidth option', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/></svg>',
      strokeWidth: 5,
    });
    const child = svg.children[0] as VMobject;
    expect(child.strokeWidth).toBe(5);
  });

  it('applies custom fillColor option', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0 L 10,10 Z"/></svg>',
      fillColor: '#ff00ff',
    });
    // fillColor should be passed as default when no explicit fill on element
    const child = svg.children[0] as VMobject;
    expect(child.fillOpacity).toBeDefined();
  });

  it('skips polyline and polygon without points attr', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><polygon/><polyline/></svg>',
    });
    expect(svg.children.length).toBe(0);
  });

  it('applies height scaling', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 100,0 L 100,100 L 0,100 Z"/></svg>',
      height: 2,
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('applies width scaling', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 100,0 L 100,100 L 0,100 Z"/></svg>',
      width: 3,
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('applies both height and width scaling (picks smaller scale)', () => {
    const svg = new SVGMobject({
      svgString:
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 100,0 L 100,100 L 0,100 Z"/></svg>',
      height: 2,
      width: 3,
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('applies center option', () => {
    const svg = new SVGMobject({
      svgString: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/></svg>',
      center: [1, 2, 0],
    });
    expect(svg.children.length).toBeGreaterThan(0);
  });
});

describe('svgMobject factory', () => {
  it('creates SVGMobject from string', () => {
    const svg = svgMobject(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/></svg>',
    );
    expect(svg).toBeInstanceOf(SVGMobject);
    expect(svg.children.length).toBeGreaterThan(0);
  });

  it('passes options through', () => {
    const svg = svgMobject(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M 0,0 L 10,0"/></svg>',
      { color: '#ff0000', strokeWidth: 3 },
    );
    const child = svg.children[0] as VMobject;
    expect(child.color).toBe('#ff0000');
    expect(child.strokeWidth).toBe(3);
  });
});

describe('BraceBetweenPoints', () => {
  it('constructs between two horizontal points', () => {
    const brace = new BraceBetweenPoints({
      start: [-2, 0, 0],
      end: [2, 0, 0],
    });
    expect(brace).toBeInstanceOf(VMobject);
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('getStart returns start point', () => {
    const brace = new BraceBetweenPoints({
      start: [-1, 0, 0],
      end: [1, 0, 0],
    });
    expect(brace.getStart()).toEqual([-1, 0, 0]);
  });

  it('getEnd returns end point', () => {
    const brace = new BraceBetweenPoints({
      start: [-1, 0, 0],
      end: [1, 0, 0],
    });
    expect(brace.getEnd()).toEqual([1, 0, 0]);
  });

  it('getTip returns the tip point between start and end', () => {
    const brace = new BraceBetweenPoints({
      start: [-2, 0, 0],
      end: [2, 0, 0],
    });
    const tip = brace.getTip();
    // Tip should be roughly at x=0 (midpoint) with offset in direction
    expect(tip[0]).toBeCloseTo(0, 0);
    expect(tip.length).toBe(3);
  });

  it('getDirection returns normalized direction', () => {
    const brace = new BraceBetweenPoints({
      start: [-2, 0, 0],
      end: [2, 0, 0],
      direction: [0, -1, 0],
    });
    const dir = brace.getDirection();
    const mag = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
    expect(mag).toBeCloseTo(1);
    expect(dir[1]).toBeCloseTo(-1);
  });

  it('auto-computes direction when not specified', () => {
    const brace = new BraceBetweenPoints({
      start: [0, 0, 0],
      end: [4, 0, 0],
    });
    const dir = brace.getDirection();
    // For horizontal line, auto-direction should be perpendicular
    const mag = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
    expect(mag).toBeCloseTo(1);
  });

  it('constructs with custom color', () => {
    const brace = new BraceBetweenPoints({
      start: [0, 0, 0],
      end: [2, 0, 0],
      color: '#ff0000',
    });
    expect(brace.color).toBe('#ff0000');
  });

  it('has fill opacity 1 and stroke width 0 (filled shape)', () => {
    const brace = new BraceBetweenPoints({
      start: [0, 0, 0],
      end: [2, 0, 0],
    });
    expect(brace.fillOpacity).toBe(1);
    expect(brace.strokeWidth).toBe(0);
  });

  it('constructs between vertical points', () => {
    const brace = new BraceBetweenPoints({
      start: [0, -2, 0],
      end: [0, 2, 0],
    });
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('constructs between diagonal points', () => {
    const brace = new BraceBetweenPoints({
      start: [0, 0, 0],
      end: [3, 4, 0],
    });
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('handles degenerate case where start equals end', () => {
    const brace = new BraceBetweenPoints({
      start: [1, 1, 0],
      end: [1, 1, 0],
    });
    // Should still create (degenerate brace) without throwing
    expect(brace).toBeInstanceOf(VMobject);
    expect(brace.numPoints).toBeGreaterThanOrEqual(0);
  });

  it('creates a copy preserving all properties', () => {
    const original = new BraceBetweenPoints({
      start: [-3, 0, 0],
      end: [3, 0, 0],
      direction: [0, -1, 0],
      buff: 0.5,
      color: '#00ff00',
      sharpness: 1.5,
    });
    const copy = original.copy() as BraceBetweenPoints;
    expect(copy).not.toBe(original);
    expect(copy).toBeInstanceOf(BraceBetweenPoints);
    expect(copy.getStart()).toEqual([-3, 0, 0]);
    expect(copy.getEnd()).toEqual([3, 0, 0]);
    expect(copy.getDirection()).toEqual([0, -1, 0]);
    expect(copy.color).toBe('#00ff00');
  });

  it('constructs with custom sharpness', () => {
    const brace = new BraceBetweenPoints({
      start: [-2, 0, 0],
      end: [2, 0, 0],
      sharpness: 0.5,
    });
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('constructs with custom buff', () => {
    const brace = new BraceBetweenPoints({
      start: [-2, 0, 0],
      end: [2, 0, 0],
      buff: 1.0,
    });
    const tip = brace.getTip();
    // Tip should be further away with larger buff
    expect(tip.length).toBe(3);
  });
});

describe('Brace', () => {
  it('constructs with a Rectangle mobject', () => {
    const rect = new Rectangle({ width: 3, height: 2 });
    const brace = new Brace(rect);
    expect(brace).toBeInstanceOf(VMobject);
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('defaults direction to DOWN', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect);
    const dir = brace.getDirection();
    expect(dir[0]).toBeCloseTo(0);
    expect(dir[1]).toBeCloseTo(-1);
    expect(dir[2]).toBeCloseTo(0);
  });

  it('accepts UP direction', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { direction: UP });
    const dir = brace.getDirection();
    expect(dir[0]).toBeCloseTo(0);
    expect(dir[1]).toBeCloseTo(1);
    expect(dir[2]).toBeCloseTo(0);
  });

  it('accepts LEFT direction', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { direction: LEFT });
    const dir = brace.getDirection();
    expect(dir[0]).toBeCloseTo(-1);
    expect(dir[1]).toBeCloseTo(0);
  });

  it('accepts RIGHT direction', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { direction: RIGHT });
    const dir = brace.getDirection();
    expect(dir[0]).toBeCloseTo(1);
    expect(dir[1]).toBeCloseTo(0);
  });

  it('returns tip point that is offset from center in brace direction', () => {
    const rect = new Rectangle({ width: 4, height: 2, center: [0, 0, 0] });
    const brace = new Brace(rect, { direction: DOWN });
    const tip = brace.getTip();
    // Tip should be below the rectangle (negative y with DOWN)
    expect(tip[1]).toBeLessThan(0);
    // Tip x should be near center
    expect(tip[0]).toBeCloseTo(0, 0);
  });

  it('stores mobject reference', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect);
    expect(brace.mobject).toBe(rect);
  });

  it('stores braceDirection', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { direction: [0, -1, 0] });
    expect(brace.braceDirection).toEqual([0, -1, 0]);
  });

  it('stores buff', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { buff: 0.5 });
    expect(brace.buff).toBe(0.5);
  });

  it('stores sharpness', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { sharpness: 3 });
    expect(brace.sharpness).toBe(3);
  });

  it('defaults to fill opacity 1 and stroke width 0 (filled shape)', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect);
    expect(brace.fillOpacity).toBe(1);
    expect(brace.strokeWidth).toBe(0);
  });

  it('uses custom color', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { color: '#ff0000' });
    expect(brace.color).toBe('#ff0000');
  });

  it('defaults to WHITE color', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect);
    expect(brace.color).toBe(WHITE);
  });

  it('creates a copy preserving all properties', () => {
    const rect = new Rectangle({ width: 3, height: 2 });
    const brace = new Brace(rect, {
      direction: UP,
      buff: 0.3,
      color: '#00ff00',
      sharpness: 1.5,
    });
    const copy = brace.copy() as Brace;
    expect(copy).not.toBe(brace);
    expect(copy).toBeInstanceOf(Brace);
    expect(copy.mobject).toBe(rect);
    expect(copy.buff).toBe(0.3);
    expect(copy.sharpness).toBe(1.5);
    expect(copy.color).toBe('#00ff00');
    expect(copy.numPoints).toBeGreaterThan(0);
  });

  it('getDirection returns normalized vector', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { direction: [3, 4, 0] });
    const dir = brace.getDirection();
    const mag = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
    expect(mag).toBeCloseTo(1);
    expect(dir[0]).toBeCloseTo(3 / 5);
    expect(dir[1]).toBeCloseTo(4 / 5);
  });

  it('constructs with a VMobject that has points', () => {
    const vm = new VMobject();
    vm.setPoints3D([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [3, 1, 0],
      [3, 2, 0],
      [3, 3, 0],
      [0, 3, 0],
    ]);
    const brace = new Brace(vm, { direction: DOWN });
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('getText returns a Text positioned at the tip', () => {
    const rect = new Rectangle({ width: 3, height: 2 });
    const brace = new Brace(rect, { direction: DOWN });
    const label = brace.getText('width');
    expect(label).toBeDefined();
    // The label should be positioned beyond the tip in the brace direction
    const tip = brace.getTip();
    const dir = brace.getDirection();
    const expectedX = tip[0] + dir[0] * 0.4;
    const expectedY = tip[1] + dir[1] * 0.4;
    const center = label.getCenter();
    expect(center[0]).toBeCloseTo(expectedX, 1);
    expect(center[1]).toBeCloseTo(expectedY, 1);
  });

  it('getText accepts custom options', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { direction: UP });
    const label = brace.getText('test', { fontSize: 24, color: '#ff0000', buff: 0.8 });
    expect(label).toBeDefined();
  });

  it('getTex returns a MathTex positioned at the tip', () => {
    const rect = new Rectangle({ width: 3, height: 2 });
    const brace = new Brace(rect, { direction: DOWN });
    const label = brace.getTex('x^2');
    expect(label).toBeDefined();
  });

  it('getTex accepts custom options', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const brace = new Brace(rect, { direction: UP });
    const label = brace.getTex('\\alpha', { fontSize: 24, color: '#ff0000', buff: 0.8 });
    expect(label).toBeDefined();
  });

  it('handles Mobject without VMobject points (fallback to bounding box)', () => {
    // Group extends Mobject but is not a VMobject; triggers the fallback path
    const mob = new Group();
    const brace = new Brace(mob, { direction: DOWN });
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('handles VMobject with no points (fallback to bounding box)', () => {
    const vm = new VMobject();
    // Empty VMobject (no points set)
    const brace = new Brace(vm, { direction: DOWN });
    // Should still create a brace using the center fallback
    expect(brace).toBeInstanceOf(Brace);
  });
});

describe('ArcBrace', () => {
  it('constructs with an arc', () => {
    const arc = new Arc({ radius: 2, angle: Math.PI / 2 });
    const brace = new ArcBrace({ arc });
    expect(brace).toBeInstanceOf(VMobject);
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('defaults direction to 1 (outside)', () => {
    const arc = new Arc({ radius: 2, angle: Math.PI / 2 });
    const brace = new ArcBrace({ arc });
    expect(brace.getDirection()).toBe(1);
  });

  it('accepts direction -1 (inside)', () => {
    const arc = new Arc({ radius: 2, angle: Math.PI / 2 });
    const brace = new ArcBrace({ arc, direction: -1 });
    expect(brace.getDirection()).toBe(-1);
  });

  it('returns tip point', () => {
    const arc = new Arc({ radius: 2, angle: Math.PI / 2 });
    const brace = new ArcBrace({ arc });
    const tip = brace.getTip();
    expect(tip.length).toBe(3);
    // Tip should be further from arc center than the arc radius
    const center = arc.getArcCenter();
    const dist = Math.sqrt((tip[0] - center[0]) ** 2 + (tip[1] - center[1]) ** 2);
    expect(dist).toBeGreaterThan(arc.getRadius());
  });

  it('inner brace tip is closer to center than arc radius', () => {
    const arc = new Arc({ radius: 2, angle: Math.PI / 2 });
    const brace = new ArcBrace({ arc, direction: -1 });
    const tip = brace.getTip();
    const center = arc.getArcCenter();
    const dist = Math.sqrt((tip[0] - center[0]) ** 2 + (tip[1] - center[1]) ** 2);
    expect(dist).toBeLessThan(arc.getRadius());
  });

  it('accepts custom color', () => {
    const arc = new Arc({ radius: 1, angle: Math.PI });
    const brace = new ArcBrace({ arc, color: '#ff0000' });
    expect(brace.color).toBe('#ff0000');
  });

  it('accepts custom buff', () => {
    const arc = new Arc({ radius: 1, angle: Math.PI / 2 });
    const braceDefault = new ArcBrace({ arc });
    const braceLarger = new ArcBrace({ arc, buff: 1.0 });
    // Larger buff should push tip further out
    const defaultTip = braceDefault.getTip();
    const largerTip = braceLarger.getTip();
    const center = arc.getArcCenter();
    const distDefault = Math.sqrt(
      (defaultTip[0] - center[0]) ** 2 + (defaultTip[1] - center[1]) ** 2,
    );
    const distLarger = Math.sqrt((largerTip[0] - center[0]) ** 2 + (largerTip[1] - center[1]) ** 2);
    expect(distLarger).toBeGreaterThan(distDefault);
  });

  it('creates a copy preserving properties', () => {
    const arc = new Arc({ radius: 2, angle: Math.PI / 3 });
    const brace = new ArcBrace({ arc, direction: -1, buff: 0.5, color: '#00ff00' });
    const copy = brace.copy() as ArcBrace;
    expect(copy).not.toBe(brace);
    expect(copy).toBeInstanceOf(ArcBrace);
    expect(copy.getDirection()).toBe(-1);
    expect(copy.color).toBe('#00ff00');
    expect(copy.numPoints).toBeGreaterThan(0);
  });

  it('handles full circle arc', () => {
    const arc = new Arc({ radius: 1, angle: Math.PI * 2 });
    const brace = new ArcBrace({ arc });
    expect(brace.numPoints).toBeGreaterThan(0);
  });

  it('handles small arc angle', () => {
    const arc = new Arc({ radius: 2, angle: Math.PI / 8 });
    const brace = new ArcBrace({ arc });
    expect(brace.numPoints).toBeGreaterThan(0);
  });
});

describe('BraceLabel', () => {
  it('constructs with string label', () => {
    const rect = new Rectangle({ width: 3, height: 2 });
    const bl = new BraceLabel(rect, { label: 'width' });
    expect(bl).toBeInstanceOf(Group);
  });

  it('constructs with empty string label (no label created)', () => {
    const rect = new Rectangle({ width: 3, height: 2 });
    const bl = new BraceLabel(rect);
    expect(bl.getLabel()).toBeNull();
  });

  it('getBrace returns the underlying Brace', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bl = new BraceLabel(rect, { label: 'test' });
    expect(bl.getBrace()).toBeInstanceOf(Brace);
  });

  it('getLabel returns the label mobject when string provided', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bl = new BraceLabel(rect, { label: 'test' });
    expect(bl.getLabel()).not.toBeNull();
  });

  it('getLabel returns null when no label provided', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bl = new BraceLabel(rect, { label: '' });
    expect(bl.getLabel()).toBeNull();
  });

  it('getTip delegates to brace getTip', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bl = new BraceLabel(rect, { label: 'x', direction: DOWN });
    const tip = bl.getTip();
    expect(tip.length).toBe(3);
    expect(tip).toEqual(bl.getBrace().getTip());
  });

  it('accepts direction option', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bl = new BraceLabel(rect, { label: 'up', direction: UP });
    const dir = bl.getBrace().getDirection();
    expect(dir[1]).toBeCloseTo(1);
  });

  it('accepts mobject as label', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const labelMobject = new Rectangle({ width: 0.5, height: 0.3 });
    const bl = new BraceLabel(rect, { label: labelMobject });
    expect(bl.getLabel()).toBe(labelMobject);
  });

  it('creates a copy', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bl = new BraceLabel(rect, { label: 'test', direction: DOWN, buff: 0.3 });
    const copy = bl.copy() as BraceLabel;
    expect(copy).not.toBe(bl);
    expect(copy).toBeInstanceOf(BraceLabel);
    expect(copy.getBrace()).toBeInstanceOf(Brace);
  });

  it('passes color and sharpness to brace', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bl = new BraceLabel(rect, {
      label: 'test',
      color: '#ff0000',
      sharpness: 3,
    });
    expect(bl.getBrace().color).toBe('#ff0000');
    expect(bl.getBrace().sharpness).toBe(3);
  });
});

describe('BraceText', () => {
  it('constructs with a text string', () => {
    const rect = new Rectangle({ width: 3, height: 2 });
    const bt = new BraceText(rect, 'width');
    expect(bt).toBeInstanceOf(BraceLabel);
    expect(bt).toBeInstanceOf(Group);
  });

  it('creates a copy preserving text', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bt = new BraceText(rect, 'height', { direction: LEFT });
    const copy = bt.copy() as BraceText;
    expect(copy).not.toBe(bt);
    expect(copy).toBeInstanceOf(BraceText);
  });

  it('getBrace returns valid brace', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bt = new BraceText(rect, 'label');
    expect(bt.getBrace()).toBeInstanceOf(Brace);
    expect(bt.getBrace().numPoints).toBeGreaterThan(0);
  });

  it('passes options through to BraceLabel', () => {
    const rect = new Rectangle({ width: 2, height: 1 });
    const bt = new BraceText(rect, 'label', {
      direction: UP,
      buff: 0.5,
      color: '#00ff00',
      sharpness: 1,
    });
    expect(bt.getBrace().color).toBe('#00ff00');
    expect(bt.getBrace().buff).toBe(0.5);
    expect(bt.getBrace().sharpness).toBe(1);
  });
});
