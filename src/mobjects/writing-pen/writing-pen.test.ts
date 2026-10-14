import { describe, it, expect } from 'vitest';
import { WritingPen, PenFollowStroke, writeWithPen } from './index';
import { Line } from '../geometry/Line';
import { Circle } from '../geometry/Circle';
import { VGroup } from '../../core/VGroup';
import { Mobject } from '../../core/Mobject';
import { Write, Create } from '../../animation/creation/Create';
import { AnimationGroup } from '../../animation/AnimationGroup';
import { linear } from '../../rate-functions';

function expectPoint(actual: number[], expected: number[]): void {
  expect(actual[0]).toBeCloseTo(expected[0], 6);
  expect(actual[1]).toBeCloseTo(expected[1], 6);
  expect(actual[2]).toBeCloseTo(expected[2], 6);
}

describe('WritingPen', () => {
  it('builds a vector pen with its nib tip at the origin by default', () => {
    const pen = new WritingPen();
    expectPoint(pen.getNibPosition(), [0, 0, 0]);
    expect(pen.children.length).toBeGreaterThan(0);
  });

  it('placeNibAt moves the nib to the requested point', () => {
    const pen = new WritingPen();
    pen.placeNibAt([1.5, -2, 0]);
    expectPoint(pen.getNibPosition(), [1.5, -2, 0]);
    pen.placeNibAt([0, 3, 0]);
    expectPoint(pen.getNibPosition(), [0, 3, 0]);
  });

  it('honors a configurable tipOffset', () => {
    const pen = new WritingPen({ tipOffset: [-0.5, -0.25, 0] });
    expectPoint(pen.getNibPosition(), [-0.5, -0.25, 0]);
    pen.placeNibAt([2, 2, 0]);
    expectPoint(pen.getNibPosition(), [2, 2, 0]);
    // The pen origin sits at the nib minus the offset.
    expectPoint([pen.position.x, pen.position.y, pen.position.z], [2.5, 2.25, 0]);
  });

  it('accepts a custom tip mobject instead of the vector pen', () => {
    const custom = new Line({ start: [0, 0, 0], end: [1, 1, 0] });
    const pen = new WritingPen({ tip: custom, tipOffset: [0, 0, 0] });
    expect(pen.children).toContain(custom);
    expect(pen.children.length).toBe(1);
  });
});

describe('PenFollowStroke', () => {
  it('puts the nib on the path point at each alpha (Line)', () => {
    const line = new Line({ start: [-2, 0, 0], end: [2, 2, 0] });
    const pen = new WritingPen();
    const follow = new PenFollowStroke(pen, line, { duration: 1, rateFunc: linear });
    follow.begin();
    for (const a of [0, 0.25, 0.5, 0.8, 1]) {
      follow.interpolate(a);
      expectPoint(pen.getNibPosition(), line.getPointFromProportion(a));
    }
    expectPoint(pen.getNibPosition(), [2, 2, 0]);
  });

  it('puts the nib on the path point at each alpha (Circle)', () => {
    const circle = new Circle({ radius: 1.5 });
    const pen = new WritingPen();
    const follow = new PenFollowStroke(pen, circle, { rateFunc: linear });
    follow.begin();
    for (const a of [0, 0.1, 0.33, 0.5, 0.9, 1]) {
      follow.interpolate(a);
      expectPoint(pen.getNibPosition(), circle.getPointFromProportion(a));
    }
    const end = circle.getPointFromProportion(1);
    expectPoint(pen.getNibPosition(), end);
  });

  it('tracks the world position when the target is shifted', () => {
    const line = new Line({ start: [0, 0, 0], end: [2, 0, 0] });
    line.shift([1, 3, 0]);
    const pen = new WritingPen();
    const follow = new PenFollowStroke(pen, line, { rateFunc: linear });
    follow.begin();
    follow.interpolate(0.5);
    expectPoint(pen.getNibPosition(), [2, 3, 0]);
    follow.interpolate(1);
    expectPoint(pen.getNibPosition(), [3, 3, 0]);
  });

  it('follows family members in sequence for a group (lagRatio 1)', () => {
    const a = new Line({ start: [0, 0, 0], end: [1, 0, 0] });
    const b = new Line({ start: [5, 0, 0], end: [5, 1, 0] });
    const group = new VGroup(a, b);
    const pen = new WritingPen();
    const follow = new PenFollowStroke(pen, group, { rateFunc: linear });
    follow.begin();
    follow.interpolate(0.25); // halfway through a
    expectPoint(pen.getNibPosition(), [0.5, 0, 0]);
    follow.interpolate(0.75); // halfway through b
    expectPoint(pen.getNibPosition(), [5, 0.5, 0]);
    follow.interpolate(1);
    expectPoint(pen.getNibPosition(), [5, 1, 0]);
  });

  it('is removed from the scene at the end by default (remover)', () => {
    const line = new Line();
    const pen = new WritingPen();
    expect(new PenFollowStroke(pen, line).remover).toBe(true);
    expect(new PenFollowStroke(pen, line, { removePen: false }).remover).toBe(false);
  });

  it('throws a clear error for a target with no stroke points', () => {
    const pen = new WritingPen();
    const follow = new PenFollowStroke(pen, new VGroup());
    expect(() => follow.begin()).toThrow(/no stroke/i);
  });
});

describe('writeWithPen', () => {
  it('returns a group of a Write and a pen follower by default', () => {
    const line = new Line();
    const anim = writeWithPen(line, { duration: 2 });
    expect(anim).toBeInstanceOf(AnimationGroup);
    expect(anim.animations[0]).toBeInstanceOf(Write);
    expect(anim.animations[1]).toBeInstanceOf(PenFollowStroke);
    expect(anim.pen).toBeInstanceOf(WritingPen);
    expect(anim.animations[1].mobject).toBe(anim.pen);
    expect(anim.duration).toBe(2);
  });

  it('uses Create when asked', () => {
    const anim = writeWithPen(new Line(), { animation: 'create' });
    expect(anim.animations[0]).toBeInstanceOf(Create);
  });

  it('uses a supplied pen', () => {
    const pen = new WritingPen();
    const anim = writeWithPen(new Line(), { pen });
    expect(anim.pen).toBe(pen);
  });

  it('drives the nib along the path and ends at the path end', () => {
    const circle = new Circle({ radius: 1 });
    const anim = writeWithPen(circle, { duration: 1, rateFunc: linear });
    anim.begin();
    for (const a of [0, 0.3, 0.6, 1]) {
      anim.interpolate(a);
      expectPoint(anim.pen.getNibPosition(), circle.getPointFromProportion(a));
    }
    anim.finish();
    expectPoint(anim.pen.getNibPosition(), circle.getPointFromProportion(1));
  });

  it('applies the rate function to the pen like the Write', () => {
    const line = new Line({ start: [0, 0, 0], end: [4, 0, 0] });
    const anim = writeWithPen(line, { duration: 1, rateFunc: (t) => t * t });
    anim.begin();
    anim.interpolate(0.5); // group alpha 0.5 -> eased 0.25 -> x = 1
    expectPoint(anim.pen.getNibPosition(), [1, 0, 0]);
  });

  it('accepts a bare Mobject type for pen tip', () => {
    const tip: Mobject = new Line();
    const anim = writeWithPen(new Line(), { penOptions: { tip } });
    expect(anim.pen.children).toContain(tip);
  });
});
