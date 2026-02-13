import { describe, it, expect } from 'vitest';
import { Mobject, UP, DOWN, LEFT, RIGHT, ORIGIN } from './Mobject';
import { VMobject } from './VMobject';
import { VGroup } from './VGroup';
import { BLUE, WHITE, RED, DEFAULT_STROKE_WIDTH } from '../constants';

describe('Mobject', () => {
  it('constructs with default position at origin', () => {
    const m = new Mobject();
    // position is a THREE.Vector3
    expect(m.position.x).toBe(0);
    expect(m.position.y).toBe(0);
    expect(m.position.z).toBe(0);
  });

  it('color defaults to lowercase white', () => {
    const m = new Mobject();
    // THREE.js stores colors in lowercase
    expect(m.color.toLowerCase()).toBe('#ffffff');
  });

  it('setColor updates color', () => {
    const m = new Mobject();
    m.setColor('#FF0000');
    expect(m.color.toLowerCase()).toBe('#ff0000');
  });

  it('opacity defaults to 1', () => {
    const m = new Mobject();
    expect(m.opacity).toBe(1);
  });

  it('opacity can be set', () => {
    const m = new Mobject();
    m.opacity = 0.5;
    expect(m.opacity).toBe(0.5);
  });

  it('submobjects is initially empty', () => {
    const m = new Mobject();
    expect(m.submobjects).toEqual([]);
  });

  it('add/remove children', () => {
    const parent = new Mobject();
    const child = new Mobject();
    parent.add(child);
    expect(parent.submobjects).toContain(child);

    parent.remove(child);
    expect(parent.submobjects).not.toContain(child);
  });

  it('shift moves position', () => {
    const m = new Mobject();
    m.shift([1, 2, 0]);
    expect(m.position.x).toBe(1);
    expect(m.position.y).toBe(2);
    expect(m.position.z).toBe(0);
  });

  it('shift is cumulative', () => {
    const m = new Mobject();
    m.shift([1, 0, 0]);
    m.shift([0, 1, 0]);
    expect(m.position.x).toBe(1);
    expect(m.position.y).toBe(1);
  });

  it('moveTo sets absolute position', () => {
    const m = new Mobject();
    m.shift([5, 5, 0]);
    m.moveTo([0, 0, 0]);
    expect(m.position.x).toBe(0);
    expect(m.position.y).toBe(0);
    expect(m.position.z).toBe(0);
  });

  it('scale applies to scaleVector', () => {
    const m = new Mobject();
    m.scale(2);
    expect(m.scaleVector.x).toBe(2);
    expect(m.scaleVector.y).toBe(2);
    expect(m.scaleVector.z).toBe(2);
  });

  it('strokeWidth defaults to 4', () => {
    const m = new Mobject();
    expect(m.strokeWidth).toBe(4);
  });

  it('fillOpacity defaults to 0', () => {
    const m = new Mobject();
    expect(m.fillOpacity).toBe(0);
  });
});

describe('VMobject', () => {
  it('constructs with default stroke properties', () => {
    const v = new VMobject();
    expect(v.strokeWidth).toBe(DEFAULT_STROKE_WIDTH);
    // VMobject defaults fillOpacity to 0.5 (unlike Mobject's 0)
    expect(v.fillOpacity).toBe(0.5);
  });

  it('setColor updates color', () => {
    const v = new VMobject();
    v.setColor(RED);
    expect(v.color.toLowerCase()).toBe(RED.toLowerCase());
  });

  it('points array is initially empty', () => {
    const v = new VMobject();
    expect(v.points).toHaveLength(0);
  });

  it('setPoints3D stores points', () => {
    const v = new VMobject();
    const pts = [
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
    ];
    v.setPoints3D(pts);
    expect(v.numPoints).toBe(4);
  });

  it('fillOpacity can be set', () => {
    const v = new VMobject();
    v.fillOpacity = 0.8;
    expect(v.fillOpacity).toBe(0.8);
  });

  it('strokeWidth can be set', () => {
    const v = new VMobject();
    v.strokeWidth = 10;
    expect(v.strokeWidth).toBe(10);
  });
});

describe('VGroup', () => {
  it('constructs empty', () => {
    const g = new VGroup();
    expect(g.length).toBe(0);
  });

  it('constructs with initial mobjects', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new VGroup(a, b);
    expect(g.length).toBe(2);
  });

  it('add adds VMobjects', () => {
    const g = new VGroup();
    const v = new VMobject();
    g.add(v);
    expect(g.length).toBe(1);
  });

  it('addVMobjects adds multiple', () => {
    const g = new VGroup();
    const a = new VMobject();
    const b = new VMobject();
    g.addVMobjects(a, b);
    expect(g.length).toBe(2);
  });

  it('addVMobjects accepts arrays', () => {
    const g = new VGroup();
    const items = [new VMobject(), new VMobject()];
    g.addVMobjects(items);
    expect(g.length).toBe(2);
  });

  it('removeVMobjects removes specified VMobjects', () => {
    const a = new VMobject();
    const b = new VMobject();
    const g = new VGroup(a, b);
    g.removeVMobjects(a);
    expect(g.length).toBe(1);
  });

  it('removing non-member is a no-op', () => {
    const a = new VMobject();
    const outsider = new VMobject();
    const g = new VGroup(a);
    g.removeVMobjects(outsider);
    expect(g.length).toBe(1);
  });

  it('fillOpacity defaults to 0', () => {
    const g = new VGroup();
    expect(g.fillOpacity).toBe(0);
  });

  it('setFill applies to children', () => {
    const child = new VMobject();
    const g = new VGroup(child);
    g.setFill('#FF0000', 0.5);
    expect(child.fillOpacity).toBe(0.5);
  });

  it('setStroke applies to children', () => {
    const child = new VMobject();
    const g = new VGroup(child);
    g.setStroke('#00FF00', 8);
    expect(child.strokeWidth).toBe(8);
  });
});
