import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { Mobject, type MobjectOptions } from './Mobject';
import { Scene } from './Scene';
import { VGroup } from './VGroup';
import { VectorizedPoint } from './VDict';

/**
 * Minimal concrete Mobject that forwards constructor options to the base class.
 * Used to exercise the `userId` constructor-option path, since the abstract
 * base Mobject cannot be instantiated directly.
 */
class TestMobject extends Mobject {
  constructor(options?: MobjectOptions) {
    super(options);
  }
  protected _createThreeObject(): THREE.Object3D {
    return new THREE.Object3D();
  }
  override copy(): Mobject {
    const clone = new TestMobject({ userId: this.userId });
    this._copyBaseAttributesInto(clone);
    return clone;
  }
  override normalizeTransform(): this {
    return this;
  }
}

describe('Mobject user id', () => {
  it('is undefined by default', () => {
    const m = new TestMobject();
    expect(m.userId).toBeUndefined();
  });

  it('is set from the constructor option', () => {
    const m = new TestMobject({ userId: 'hero' });
    expect(m.userId).toBe('hero');
  });

  it('does not collide with the internal uuid id', () => {
    const m = new TestMobject({ userId: 'hero' });
    expect(m.id).toMatch(/^mobject_\d+$/);
    expect(m.id).not.toBe(m.userId);
  });

  it('setUserId assigns the id and returns this for chaining', () => {
    const m = new TestMobject();
    const returned = m.setUserId('tagged');
    expect(returned).toBe(m);
    expect(m.userId).toBe('tagged');
  });
});

describe('Scene.getMobject', () => {
  it('returns a top-level mobject by its user id', () => {
    const scene = Scene.createHeadless();
    const dot = new VectorizedPoint([1, 2, 3]).setUserId('dot-a');
    scene.add(dot);
    expect(scene.getMobject('dot-a')).toBe(dot);
  });

  it('finds a mobject nested inside a VGroup (descendant search)', () => {
    const scene = Scene.createHeadless();
    const inner = new VectorizedPoint([0, 0, 0]).setUserId('inner');
    const group = new VGroup(inner);
    scene.add(group);
    expect(scene.getMobject('inner')).toBe(inner);
  });

  it('returns undefined for an unknown id', () => {
    const scene = Scene.createHeadless();
    scene.add(new VectorizedPoint([0, 0, 0]).setUserId('present'));
    expect(scene.getMobject('absent')).toBeUndefined();
  });

  it('returns undefined when no mobject carries a user id', () => {
    const scene = Scene.createHeadless();
    scene.add(new VectorizedPoint([0, 0, 0]));
    expect(scene.getMobject('anything')).toBeUndefined();
  });

  it('returns the first match when ids are duplicated', () => {
    const scene = Scene.createHeadless();
    const first = new VectorizedPoint([0, 0, 0]).setUserId('dup');
    const second = new VectorizedPoint([1, 0, 0]).setUserId('dup');
    scene.add(first);
    scene.add(second);
    const found = scene.getMobject('dup');
    expect(found).toBe(first);
    expect(found).not.toBe(second);
  });

  it('matches a user id assigned after the mobject was added', () => {
    const scene = Scene.createHeadless();
    const dot = new VectorizedPoint([0, 0, 0]);
    scene.add(dot);
    expect(scene.getMobject('late')).toBeUndefined();
    dot.setUserId('late');
    expect(scene.getMobject('late')).toBe(dot);
  });
});
