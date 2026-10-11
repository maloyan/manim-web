import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { colorGradient } from './VMobjectColorGradient';

function line(a: number[], b: number[]): VMobject {
  const v = new VMobject();
  v.setPointsAsCorners([a, b]);
  return v;
}

describe('colorGradient', () => {
  it('returns the endpoints unchanged', () => {
    const g = colorGradient(['#ff0000', '#0000ff'], 3);
    expect(g).toHaveLength(3);
    expect(g[0].toLowerCase()).toBe('#ff0000');
    expect(g[2].toLowerCase()).toBe('#0000ff');
  });

  it('produces a middle color between the endpoints', () => {
    const g = colorGradient(['#000000', '#ffffff'], 3);
    const mid = new THREE.Color(g[1]);
    // Gray: all channels equal, strictly between black and white.
    expect(mid.r).toBeCloseTo(mid.g, 6);
    expect(mid.g).toBeCloseTo(mid.b, 6);
    expect(mid.r).toBeGreaterThan(0);
    expect(mid.r).toBeLessThan(1);
  });

  it('repeats a single reference color', () => {
    const g = colorGradient(['#123456'], 4);
    expect(g).toHaveLength(4);
    for (const c of g) expect(c.toLowerCase()).toBe('#123456');
  });

  it('returns an empty array for zero count', () => {
    expect(colorGradient(['#ff0000', '#00ff00'], 0)).toEqual([]);
  });
});

describe('VMobject.setColorByGradient', () => {
  it('distributes colors across a VGroup family', () => {
    const group = new VGroup(
      line([0, 0, 0], [1, 0, 0]),
      line([1, 0, 0], [2, 0, 0]),
      line([2, 0, 0], [3, 0, 0]),
    );
    group.setColorByGradient('#ff0000', '#0000ff');
    const kids = group.submobjects as VMobject[];
    expect(kids[0].color.toLowerCase()).toBe('#ff0000');
    expect(kids[2].color.toLowerCase()).toBe('#0000ff');
    expect(kids[1].color.toLowerCase()).not.toBe('#ff0000');
    expect(kids[1].color.toLowerCase()).not.toBe('#0000ff');
  });

  it('falls back to setColor for a single color', () => {
    const v = line([0, 0, 0], [1, 0, 0]);
    v.setColorByGradient('#00ff00');
    expect(v.color.toLowerCase()).toBe('#00ff00');
  });

  it('returns this for chaining', () => {
    const v = line([0, 0, 0], [1, 0, 0]);
    expect(v.setColorByGradient('#ff0000', '#0000ff')).toBe(v);
  });

  it('is a no-op with no colors', () => {
    const v = line([0, 0, 0], [1, 0, 0]);
    const before = v.color;
    v.setColorByGradient();
    expect(v.color).toBe(before);
  });
});
