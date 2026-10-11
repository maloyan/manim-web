import { describe, it, expect, afterEach } from 'vitest';
import * as THREE from 'three';
import { Circle } from '../mobjects/geometry/Circle';
import { Square } from '../mobjects/geometry/Rectangle';
import { VGroup } from './VGroup';
import { VMobject } from './VMobject';
import { Scene } from './Scene';
import { setTheme, resetThemes, getActiveTheme } from '../utils/ThemeManager';
import { WHITE, BLACK } from '../constants/colors';

/** Collect every three.js material in a mobject's rendered subtree. */
function collectMaterials(mob: { getThreeObject(): THREE.Object3D }): THREE.Material[] {
  const materials: THREE.Material[] = [];
  mob.getThreeObject().traverse((object) => {
    const material = (object as Partial<THREE.Mesh>).material;
    if (!material) return;
    if (Array.isArray(material)) {
      materials.push(...material);
    } else {
      materials.push(material);
    }
  });
  return materials;
}

describe('Mobject.setBlendMode', () => {
  it('defaults to normal blending and leaves materials at NormalBlending', () => {
    const circle = new Circle();
    expect(circle.getBlendMode()).toBe('normal');
    const materials = collectMaterials(circle);
    expect(materials.length).toBeGreaterThan(0);
    for (const material of materials) {
      expect(material.blending).toBe(THREE.NormalBlending);
    }
  });

  it('maps each mode to the right THREE blending constant on the materials', () => {
    const cases: Array<[Parameters<Circle['setBlendMode']>[0], THREE.Blending]> = [
      ['additive', THREE.AdditiveBlending],
      ['multiply', THREE.MultiplyBlending],
      ['subtractive', THREE.SubtractiveBlending],
      ['screen', THREE.CustomBlending],
      ['normal', THREE.NormalBlending],
    ];
    for (const [mode, expected] of cases) {
      const circle = new Circle();
      const returned = circle.setBlendMode(mode);
      expect(returned).toBe(circle); // chainable
      expect(circle.getBlendMode()).toBe(mode);
      const materials = collectMaterials(circle);
      expect(materials.length).toBeGreaterThan(0);
      for (const material of materials) {
        expect(material.blending).toBe(expected);
      }
    }
  });

  it('propagates the blend mode to submobjects', () => {
    const group = new VGroup(new Circle(), new Square());
    group.setBlendMode('additive');

    // every family member reports the mode
    for (const member of group.getFamily()) {
      expect(member.getBlendMode()).toBe('additive');
    }

    // every material across the whole subtree is additive
    const materials = collectMaterials(group);
    expect(materials.length).toBeGreaterThan(0);
    for (const material of materials) {
      expect(material.blending).toBe(THREE.AdditiveBlending);
    }
  });

  it('can switch back to normal after a non-default mode', () => {
    const circle = new Circle();
    circle.setBlendMode('additive');
    circle.setBlendMode('normal');
    for (const material of collectMaterials(circle)) {
      expect(material.blending).toBe(THREE.NormalBlending);
    }
  });

  it('carries the blend mode through copy()', () => {
    const circle = new Circle();
    circle.setBlendMode('multiply');
    const clone = circle.copy();
    expect(clone.getBlendMode()).toBe('multiply');
    for (const material of collectMaterials(clone)) {
      expect(material.blending).toBe(THREE.MultiplyBlending);
    }
  });
});

describe('ThemeManager integration with mobjects and scenes', () => {
  afterEach(() => {
    resetThemes();
  });

  it('new mobjects pick up the active theme colors (base default path)', () => {
    // A bare VMobject relies on the base-class default color, so it reflects
    // the theme. (Shapes like Circle set their own default and are unaffected.)
    setTheme('light');
    const mob = new VMobject();
    expect(mob.color).toBe(BLACK);
    expect(mob.strokeColor).toBe(BLACK);
    expect(mob.fillColor).toBe(BLACK);
  });

  it('default theme leaves new mobjects white', () => {
    const mob = new VMobject();
    expect(mob.color).toBe(WHITE);
    expect(mob.fillColor).toBe(WHITE);
  });

  it('new headless scene uses the active theme background', () => {
    setTheme('light');
    const scene = Scene.createHeadless();
    expect(scene.backgroundColor.getHexString()).toBe(new THREE.Color(WHITE).getHexString());
    scene.dispose();
  });

  it('re-skins an existing scene background and mobjects', () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);

    setTheme('light', { scene });

    expect(scene.backgroundColor.getHexString()).toBe(new THREE.Color(WHITE).getHexString());
    expect(circle.color).toBe(BLACK);
    expect(getActiveTheme().background).toBe(WHITE);
    scene.dispose();
  });
});
