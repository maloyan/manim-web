import { describe, it, expect } from 'vitest';
import {
  ArrowTriangleTip,
  ArrowTriangleFilledTip,
  ArrowCircleTip,
  ArrowCircleFilledTip,
  ArrowSquareTip,
  ArrowSquareFilledTip,
  StealthTip,
} from './ArrowTips';

// ---------------------------------------------------------------------------
// ArrowTips
// ---------------------------------------------------------------------------

describe('ArrowTriangleTip', () => {
  it('constructs with defaults', () => {
    const tip = new ArrowTriangleTip();
    expect(tip).toBeDefined();
    expect(tip.getPoints().length).toBeGreaterThan(0);
  });

  it('default length is 0.3 and width is 0.1', () => {
    const tip = new ArrowTriangleTip();
    expect(tip.getLength()).toBe(0.3);
    expect(tip.getWidth()).toBe(0.1);
  });

  it('default fillOpacity is 0 (unfilled)', () => {
    const tip = new ArrowTriangleTip();
    expect(tip.fillOpacity).toBe(0);
  });

  it('custom length and width are applied', () => {
    const tip = new ArrowTriangleTip({ length: 0.5, width: 0.3 });
    expect(tip.getLength()).toBe(0.5);
    expect(tip.getWidth()).toBe(0.3);
  });

  it('getPosition returns the tip point', () => {
    const tip = new ArrowTriangleTip({ position: [3, 4, 0] });
    expect(tip.getPosition()).toEqual([3, 4, 0]);
  });

  it('getDirection returns normalized direction', () => {
    const tip = new ArrowTriangleTip({ direction: [2, 0, 0] });
    const dir = tip.getDirection();
    expect(dir[0]).toBeCloseTo(1, 10);
    expect(dir[1]).toBeCloseTo(0, 10);
  });

  it('getBase returns point behind the tip', () => {
    const tip = new ArrowTriangleTip({
      position: [1, 0, 0],
      direction: [1, 0, 0],
      length: 0.5,
    });
    const base = tip.getBase();
    expect(base[0]).toBeCloseTo(0.5, 10);
    expect(base[1]).toBeCloseTo(0, 10);
  });

  it('getAngle returns angle relative to X axis', () => {
    const tip = new ArrowTriangleTip({ direction: [0, 1, 0] });
    expect(tip.getAngle()).toBeCloseTo(Math.PI / 2, 5);
  });

  it('has 10 points (triangle: 3 segments, each 3 controls + 1 anchor)', () => {
    const tip = new ArrowTriangleTip();
    expect(tip.getPoints().length).toBe(10);
  });

  it('setLength regenerates points', () => {
    const tip = new ArrowTriangleTip();
    tip.setLength(0.6);
    expect(tip.getLength()).toBe(0.6);
    expect(tip.getPoints().length).toBeGreaterThan(0);
  });

  it('setWidth regenerates points', () => {
    const tip = new ArrowTriangleTip();
    tip.setWidth(0.4);
    expect(tip.getWidth()).toBe(0.4);
  });

  it('setTipPosition updates position', () => {
    const tip = new ArrowTriangleTip();
    tip.setTipPosition([5, 5, 0]);
    expect(tip.getPosition()).toEqual([5, 5, 0]);
  });

  it('setDirection normalizes and updates', () => {
    const tip = new ArrowTriangleTip();
    tip.setDirection([0, 3, 0]);
    const dir = tip.getDirection();
    expect(dir[0]).toBeCloseTo(0, 10);
    expect(dir[1]).toBeCloseTo(1, 10);
  });

  it('copy creates equivalent tip', () => {
    const tip = new ArrowTriangleTip({ length: 0.4, width: 0.2 });
    const copy = tip.copy();
    expect(copy.getLength()).toBe(0.4);
    expect(copy.getWidth()).toBe(0.2);
  });
});

describe('ArrowTriangleFilledTip', () => {
  it('constructs with fillOpacity 1 by default', () => {
    const tip = new ArrowTriangleFilledTip();
    expect(tip.fillOpacity).toBe(1);
  });

  it('has same point structure as unfilled triangle', () => {
    const tip = new ArrowTriangleFilledTip();
    expect(tip.getPoints().length).toBe(10);
  });

  it('custom fillOpacity overrides default', () => {
    const tip = new ArrowTriangleFilledTip({ fillOpacity: 0.5 });
    expect(tip.fillOpacity).toBe(0.5);
  });
});

describe('ArrowCircleTip', () => {
  it('constructs with defaults', () => {
    const tip = new ArrowCircleTip();
    expect(tip).toBeDefined();
    expect(tip.getPoints().length).toBeGreaterThan(0);
  });

  it('default fillOpacity is 0 (unfilled)', () => {
    const tip = new ArrowCircleTip();
    expect(tip.fillOpacity).toBe(0);
  });

  it('has 8 segments by default (8*3+1 = 25 points)', () => {
    const tip = new ArrowCircleTip();
    expect(tip.getPoints().length).toBe(25);
  });

  it('custom numSegments changes point count', () => {
    const tip = new ArrowCircleTip({ numSegments: 4 });
    expect(tip.getPoints().length).toBe(13);
  });

  it('copy preserves properties', () => {
    const tip = new ArrowCircleTip({ width: 0.3, length: 0.5 });
    const copy = tip.copy();
    expect(copy.getWidth()).toBe(0.3);
    expect(copy.getLength()).toBe(0.5);
  });
});

describe('ArrowCircleFilledTip', () => {
  it('has fillOpacity 1 by default', () => {
    const tip = new ArrowCircleFilledTip();
    expect(tip.fillOpacity).toBe(1);
  });

  it('custom fillOpacity overrides default', () => {
    const tip = new ArrowCircleFilledTip({ fillOpacity: 0.7 });
    expect(tip.fillOpacity).toBe(0.7);
  });
});

describe('ArrowSquareTip', () => {
  it('constructs with defaults', () => {
    const tip = new ArrowSquareTip();
    expect(tip).toBeDefined();
    expect(tip.getPoints().length).toBeGreaterThan(0);
  });

  it('default fillOpacity is 0', () => {
    const tip = new ArrowSquareTip();
    expect(tip.fillOpacity).toBe(0);
  });

  it('has 13 points (4 sides: anchor + 4*3)', () => {
    const tip = new ArrowSquareTip();
    expect(tip.getPoints().length).toBe(13);
  });

  it('custom options are applied', () => {
    const tip = new ArrowSquareTip({
      length: 0.5,
      width: 0.3,
      position: [1, 0, 0],
      direction: [0, 1, 0],
    });
    expect(tip.getLength()).toBe(0.5);
    expect(tip.getWidth()).toBe(0.3);
    expect(tip.getPosition()).toEqual([1, 0, 0]);
  });

  it('copy creates equivalent tip', () => {
    const tip = new ArrowSquareTip({ length: 0.4 });
    const copy = tip.copy();
    expect(copy.getLength()).toBe(0.4);
  });
});

describe('ArrowSquareFilledTip', () => {
  it('has fillOpacity 1 by default', () => {
    const tip = new ArrowSquareFilledTip();
    expect(tip.fillOpacity).toBe(1);
  });
});

describe('StealthTip', () => {
  it('constructs with defaults', () => {
    const tip = new StealthTip();
    expect(tip).toBeDefined();
    expect(tip.getPoints().length).toBeGreaterThan(0);
  });

  it('default fillOpacity is 1 (filled)', () => {
    const tip = new StealthTip();
    expect(tip.fillOpacity).toBe(1);
  });

  it('default backAngle is 0.3', () => {
    const tip = new StealthTip();
    expect(tip.getBackAngle()).toBe(0.3);
  });

  it('custom backAngle is applied', () => {
    const tip = new StealthTip({ backAngle: 0.5 });
    expect(tip.getBackAngle()).toBe(0.5);
  });

  it('setBackAngle clamps to [0, 1]', () => {
    const tip = new StealthTip();
    tip.setBackAngle(-0.2);
    expect(tip.getBackAngle()).toBe(0);
    tip.setBackAngle(1.5);
    expect(tip.getBackAngle()).toBe(1);
  });

  it('has 13 points (4 sides of stealth shape)', () => {
    const tip = new StealthTip();
    expect(tip.getPoints().length).toBe(13);
  });

  it('copy creates equivalent tip', () => {
    const tip = new StealthTip({ backAngle: 0.7, length: 0.5 });
    const copy = tip.copy();
    expect(copy.getBackAngle()).toBe(0.7);
    expect(copy.getLength()).toBe(0.5);
  });
});
