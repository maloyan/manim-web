import { describe, it, expect } from 'vitest';
import { VMobjectFromSVGPath, BraceBetweenPoints } from './index';
import { VMobject } from '../../core/VMobject';
import { WHITE } from '../../constants';

describe('VMobjectFromSVGPath', () => {
  it('constructs from a simple line path', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 L 10,0',
    });
    expect(path).toBeInstanceOf(VMobject);
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('constructs from a move-line path', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 L 10,10',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('constructs from a cubic bezier path', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 C 5,10 15,10 20,0',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('uses default color WHITE', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 L 10,0',
    });
    expect(path.color).toBe(WHITE);
  });

  it('uses custom color', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 L 10,0',
      color: '#ff0000',
    });
    expect(path.color).toBe('#ff0000');
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

  it('handles close path Z command', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 L 10,0 L 10,10 Z',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('handles horizontal line H command', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 H 10',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('handles vertical line V command', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 V 10',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('handles relative commands', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 l 10,10 l 10,-10',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('handles quadratic bezier Q command', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 Q 5,10 10,0',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('handles smooth cubic S command', () => {
    const path = new VMobjectFromSVGPath({
      pathData: 'M 0,0 C 5,10 15,10 20,0 S 35,-10 40,0',
    });
    expect(path.numPoints).toBeGreaterThan(0);
  });

  it('handles empty path gracefully', () => {
    const path = new VMobjectFromSVGPath({
      pathData: '',
    });
    expect(path.numPoints).toBe(0);
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
});
