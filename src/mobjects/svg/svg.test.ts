// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import {
  VMobjectFromSVGPath,
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
