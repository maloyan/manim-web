import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { Circle } from '../mobjects/geometry/Circle';
import { Square } from '../mobjects/geometry/Rectangle';
import { VGroup } from './VGroup';
import { Scene } from './Scene';
import { MASK_STENCIL_BIT, MASK_RENDER_ORDER } from './Mask';

/** Collect every material in an Object3D subtree. */
function materialsOf(obj: THREE.Object3D): THREE.Material[] {
  const out: THREE.Material[] = [];
  obj.traverse((child) => {
    const m = (child as THREE.Object3D & { material?: THREE.Material | THREE.Material[] }).material;
    if (!m) return;
    if (Array.isArray(m)) out.push(...m);
    else out.push(m);
  });
  return out;
}

describe('clip mask: default path stays untouched', () => {
  it('an unmasked mobject has no stencil flags and writes color (byte-identical default)', () => {
    const circle = new Circle({ radius: 1, fillOpacity: 0.8, strokeWidth: 4 });
    const obj = circle.getThreeObject();
    const materials = materialsOf(obj);
    expect(materials.length).toBeGreaterThan(0);
    // Compare against a fresh material's stencil defaults.
    const ref = new THREE.MeshBasicMaterial();
    for (const m of materials) {
      expect(m.stencilWrite).toBe(ref.stencilWrite); // false
      expect(m.colorWrite).toBe(true);
      expect(m.stencilFunc).toBe(ref.stencilFunc);
      expect(m.stencilWriteMask).toBe(ref.stencilWriteMask); // 0xff
      expect(m.stencilFuncMask).toBe(ref.stencilFuncMask); // 0xff
    }
  });

  it('getMask is null by default', () => {
    expect(new Circle({ radius: 1 }).getMask()).toBeNull();
  });
});

describe('clip mask: setMask wires stencil state', () => {
  it('sets the masked content materials to test the mask bit (inside)', () => {
    const content = new Square({ sideLength: 2, fillOpacity: 1, strokeWidth: 4 });
    const mask = new Circle({ radius: 1 });
    content.setMask(mask);
    content.getThreeObject();

    for (const m of materialsOf(content.getThreeObject())) {
      expect(m.stencilWrite).toBe(true);
      expect(m.stencilFunc).toBe(THREE.EqualStencilFunc);
      expect(m.stencilRef).toBe(MASK_STENCIL_BIT);
      expect(m.stencilFuncMask).toBe(MASK_STENCIL_BIT);
      // Content never modifies the stencil buffer.
      expect(m.stencilWriteMask).toBe(0x00);
      expect(m.colorWrite).toBe(true);
    }
  });

  it('sets the mask shape materials to write the mask bit and draw no color', () => {
    const content = new Square({ sideLength: 2, fillOpacity: 1 });
    const mask = new Circle({ radius: 1 });
    content.setMask(mask);

    const maskObj = mask.getThreeObject();
    const materials = materialsOf(maskObj);
    expect(materials.length).toBeGreaterThan(0);
    for (const m of materials) {
      expect(m.stencilWrite).toBe(true);
      expect(m.stencilFunc).toBe(THREE.AlwaysStencilFunc);
      expect(m.stencilZPass).toBe(THREE.ReplaceStencilOp);
      expect(m.stencilRef).toBe(MASK_STENCIL_BIT);
      expect(m.stencilWriteMask).toBe(MASK_STENCIL_BIT);
      expect(m.colorWrite).toBe(false);
    }
  });

  it('forces the mask shape to have a fill so its region is defined', () => {
    const content = new Square({ sideLength: 2, fillOpacity: 1 });
    const mask = new Circle({ radius: 1, fillOpacity: 0 });
    content.setMask(mask);
    expect(mask.fillOpacity).toBeGreaterThan(0);
  });

  it('inverted mask makes content draw OUTSIDE the mask (NotEqual)', () => {
    const content = new Square({ sideLength: 2, fillOpacity: 1 });
    const mask = new Circle({ radius: 1 });
    content.setMask(mask, { invert: true });
    content.getThreeObject();
    for (const m of materialsOf(content.getThreeObject())) {
      expect(m.stencilFunc).toBe(THREE.NotEqualStencilFunc);
    }
  });

  it('getMask returns the mask shape', () => {
    const content = new Square({ sideLength: 2 });
    const mask = new Circle({ radius: 1 });
    content.setMask(mask);
    expect(content.getMask()).toBe(mask);
  });

  it('masks a VGroup of shapes (all descendants clipped)', () => {
    const group = new VGroup(
      new Square({ sideLength: 1, fillOpacity: 1 }),
      new Circle({ radius: 0.5, fillOpacity: 1 }),
    );
    const mask = new Square({ sideLength: 2 });
    group.setMask(mask);
    const materials = materialsOf(group.getThreeObject());
    expect(materials.length).toBeGreaterThan(0);
    for (const m of materials) {
      expect(m.stencilWrite).toBe(true);
      expect(m.stencilFuncMask).toBe(MASK_STENCIL_BIT);
    }
  });

  it('ignores a self-mask', () => {
    const content = new Circle({ radius: 1 });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    content.setMask(content);
    expect(content.getMask()).toBeNull();
    warn.mockRestore();
  });
});

describe('clip mask: clearMask restores the default path', () => {
  it('resets content materials to defaults and drops the mask', () => {
    const content = new Square({ sideLength: 2, fillOpacity: 1, strokeWidth: 4 });
    const mask = new Circle({ radius: 1, fillOpacity: 0 });
    content.setMask(mask);
    content.getThreeObject();
    content.clearMask();

    expect(content.getMask()).toBeNull();
    const ref = new THREE.MeshBasicMaterial();
    for (const m of materialsOf(content.getThreeObject())) {
      expect(m.stencilWrite).toBe(false);
      expect(m.colorWrite).toBe(true);
      expect(m.stencilWriteMask).toBe(ref.stencilWriteMask);
      expect(m.stencilFuncMask).toBe(ref.stencilFuncMask);
    }
  });

  it('restores the mask shape original fillOpacity', () => {
    const content = new Square({ sideLength: 2 });
    const mask = new Circle({ radius: 1, fillOpacity: 0 });
    content.setMask(mask);
    expect(mask.fillOpacity).toBeGreaterThan(0);
    content.clearMask();
    expect(mask.fillOpacity).toBe(0);
  });

  it('clearMask is a no-op on an unmasked mobject', () => {
    const content = new Circle({ radius: 1 });
    expect(() => content.clearMask()).not.toThrow();
    expect(content.getMask()).toBeNull();
  });
});

describe('clip mask: scene render order', () => {
  it('attaches the mask shape as a scene sibling that draws before content', () => {
    const scene = new Scene(null, { headless: true });
    const content = new Square({ sideLength: 2, fillOpacity: 1 });
    const mask = new Circle({ radius: 1 });
    scene.add(content);
    content.setMask(mask);

    const contentObj = content.getThreeObject();
    const maskObj = mask.getThreeObject();

    // The mask is a sibling of the content in the THREE scene, not its child.
    expect(maskObj.parent).toBe(scene.threeScene);
    expect(contentObj.parent).toBe(scene.threeScene);
    // The mask draws first (lower renderOrder than any content).
    expect(maskObj.renderOrder).toBe(MASK_RENDER_ORDER);
    expect(maskObj.renderOrder).toBeLessThan(contentObj.renderOrder);
    scene.dispose();
  });

  it('removing the masked mobject also removes its mask shape', () => {
    const scene = new Scene(null, { headless: true });
    const content = new Square({ sideLength: 2, fillOpacity: 1 });
    const mask = new Circle({ radius: 1 });
    scene.add(content);
    content.setMask(mask);
    expect(mask.getThreeObject().parent).toBe(scene.threeScene);

    scene.remove(content);
    expect(mask.getThreeObject().parent).not.toBe(scene.threeScene);
    scene.dispose();
  });
});
