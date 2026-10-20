// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { Camera2D } from './Camera';
import { MultiCamera, SplitScreenCamera } from './CameraExtensions';
import { Group } from './Group';
import { Circle } from '../mobjects/geometry/Circle';

// Issue #836: per-camera mobject filters (exclude / include-only).

/**
 * Fake renderer that records, for every render() call, whether each tracked
 * object is effectively visible (it and all its ancestors have visible=true).
 */
function makeRecordingRenderer(tracked: Record<string, THREE.Object3D>) {
  const frames: Array<Record<string, boolean>> = [];
  const isShown = (obj: THREE.Object3D): boolean => {
    for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
      if (!o.visible) return false;
    }
    return true;
  };
  const renderer = {
    setScissorTest: vi.fn(),
    setViewport: vi.fn(),
    setScissor: vi.fn(),
    autoClear: true,
    render: vi.fn((scene: THREE.Scene) => {
      // Border pass renders a separate scene; ignore it.
      if (!scene.userData.isTestScene) return;
      const frame: Record<string, boolean> = {};
      for (const [name, obj] of Object.entries(tracked)) frame[name] = isShown(obj);
      frames.push(frame);
    }),
  };
  return { renderer: renderer as unknown as THREE.WebGLRenderer, frames };
}

function makeScene(...mobs: Array<Circle | Group>): THREE.Scene {
  const scene = new THREE.Scene();
  scene.userData.isTestScene = true;
  for (const m of mobs) scene.add(m.getThreeObject());
  return scene;
}

const fullVp = { x: 0, y: 0, width: 1, height: 1 };

describe('MultiCamera mobject filters (#836)', () => {
  it('excludeMobjects hides a mobject for one camera only', () => {
    const a = new Circle();
    const b = new Circle();
    const scene = makeScene(a, b);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, 'one', { excludeMobjects: [a] });
    mc.addCamera(new Camera2D(), fullVp, 'two');
    const { renderer, frames } = makeRecordingRenderer({
      a: a.getThreeObject(),
      b: b.getThreeObject(),
    });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([
      { a: false, b: true },
      { a: true, b: true },
    ]);
    // Visibility restored after the render.
    expect(a.getThreeObject().visible).toBe(true);
  });

  it('includeMobjects renders only the listed mobjects', () => {
    const a = new Circle();
    const b = new Circle();
    const c = new Circle();
    const scene = makeScene(a, b, c);
    const mc = new MultiCamera({
      cameras: [{ camera: new Camera2D(), viewport: fullVp, includeMobjects: [b] }],
    });
    const { renderer, frames } = makeRecordingRenderer({
      a: a.getThreeObject(),
      b: b.getThreeObject(),
      c: c.getThreeObject(),
    });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ a: false, b: true, c: false }]);
    expect(a.getThreeObject().visible).toBe(true);
    expect(c.getThreeObject().visible).toBe(true);
  });

  it('excluding a group excludes its children', () => {
    const child = new Circle();
    const other = new Circle();
    const group = new Group(child);
    const scene = makeScene(group, other);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { excludeMobjects: [group] });
    const { renderer, frames } = makeRecordingRenderer({
      child: child.getThreeObject(),
      other: other.getThreeObject(),
    });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ child: false, other: true }]);
  });

  it('including a child of a group keeps the child but hides its siblings', () => {
    const kept = new Circle();
    const sibling = new Circle();
    const group = new Group(kept, sibling);
    const scene = makeScene(group);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { includeMobjects: [kept] });
    const { renderer, frames } = makeRecordingRenderer({
      kept: kept.getThreeObject(),
      sibling: sibling.getThreeObject(),
    });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ kept: true, sibling: false }]);
    expect(sibling.getThreeObject().visible).toBe(true);
  });

  it('include-only mode keeps the clip mask of an included mobject', () => {
    const masked = new Circle();
    const mask = new Circle({ radius: 0.5 });
    const other = new Circle();
    const scene = makeScene(masked, other);
    masked.setMask(mask);
    masked._applyMaskToThree();
    // The mask draws as a sibling of the masked mobject, not a child.
    expect(mask.getThreeObject().parent).toBe(scene);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { includeMobjects: [masked] });
    const { renderer, frames } = makeRecordingRenderer({
      masked: masked.getThreeObject(),
      mask: mask.getThreeObject(),
      other: other.getThreeObject(),
    });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ masked: true, mask: true, other: false }]);
  });

  it('include-only mode keeps clip masks of children of an included group', () => {
    const masked = new Circle();
    const mask = new Circle({ radius: 0.5 });
    const group = new Group(masked);
    const scene = makeScene(group);
    masked.setMask(mask);
    masked._applyMaskToThree();
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { includeMobjects: [group] });
    const { renderer, frames } = makeRecordingRenderer({ mask: mask.getThreeObject() });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ mask: true }]);
  });

  it('include-only mode keeps scene lights on', () => {
    const a = new Circle();
    const light = new THREE.AmbientLight();
    const scene = makeScene(a);
    scene.add(light);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { includeMobjects: [a] });
    const { renderer, frames } = makeRecordingRenderer({ light });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ light: true }]);
  });

  it('restores visibility of objects that were already hidden', () => {
    const a = new Circle();
    const b = new Circle();
    b.getThreeObject().visible = false;
    const scene = makeScene(a, b);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { excludeMobjects: [a, b] });
    const { renderer } = makeRecordingRenderer({});

    mc.render(renderer, scene, 800, 450);

    expect(a.getThreeObject().visible).toBe(true);
    expect(b.getThreeObject().visible).toBe(false);
  });

  it('restores visibility when a camera render throws', () => {
    const a = new Circle();
    const scene = makeScene(a);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { excludeMobjects: [a] });
    const { renderer } = makeRecordingRenderer({});
    (renderer.render as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('boom');
    });

    expect(() => mc.render(renderer, scene, 800, 450)).toThrow('boom');
    expect(a.getThreeObject().visible).toBe(true);
  });

  it('runtime add/remove methods update the filters', () => {
    const a = new Circle();
    const b = new Circle();
    const scene = makeScene(a, b);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp);
    const { renderer, frames } = makeRecordingRenderer({
      a: a.getThreeObject(),
      b: b.getThreeObject(),
    });

    expect(mc.excludeMobjects(0, a)).toBe(mc);
    mc.render(renderer, scene, 800, 450);
    mc.removeExcludedMobjects(0, a);
    mc.render(renderer, scene, 800, 450);
    mc.includeMobjects(0, a);
    mc.render(renderer, scene, 800, 450);
    mc.removeIncludedMobjects(0, a);
    mc.render(renderer, scene, 800, 450);
    mc.excludeMobjects(0, a).includeMobjects(0, a, b);
    mc.clearMobjectFilters(0);
    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([
      { a: false, b: true },
      { a: true, b: true },
      { a: true, b: false },
      { a: true, b: true },
      { a: true, b: true },
    ]);
  });

  it('exclude wins over include for the same mobject', () => {
    const a = new Circle();
    const b = new Circle();
    const scene = makeScene(a, b);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, {
      includeMobjects: [a, b],
      excludeMobjects: [b],
    });
    const { renderer, frames } = makeRecordingRenderer({
      a: a.getThreeObject(),
      b: b.getThreeObject(),
    });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ a: true, b: false }]);
  });

  it('accepts raw THREE.Object3D entries', () => {
    const obj = new THREE.Mesh();
    const scene = new THREE.Scene();
    scene.userData.isTestScene = true;
    scene.add(obj);
    const mc = new MultiCamera();
    mc.addCamera(new Camera2D(), fullVp, undefined, { excludeMobjects: [obj] });
    const { renderer, frames } = makeRecordingRenderer({ obj });

    mc.render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ obj: false }]);
  });

  it('ignores out-of-range indices', () => {
    const mc = new MultiCamera();
    const a = new Circle();
    expect(() => mc.excludeMobjects(3, a).includeMobjects(-1, a)).not.toThrow();
  });
});

describe('SplitScreenCamera mobject filters (#836)', () => {
  it('applies per-side filters from options', () => {
    const a = new Circle();
    const b = new Circle();
    const scene = makeScene(a, b);
    const split = new SplitScreenCamera({
      leftExcludeMobjects: [b],
      rightIncludeMobjects: [b],
    });
    const { renderer, frames } = makeRecordingRenderer({
      a: a.getThreeObject(),
      b: b.getThreeObject(),
    });

    split.getMultiCamera().render(renderer, scene, 800, 450);

    expect(frames).toEqual([
      { a: true, b: false },
      { a: false, b: true },
    ]);
  });

  it('keeps filters when the split direction or ratio changes', () => {
    const a = new Circle();
    const scene = makeScene(a);
    const split = new SplitScreenCamera();
    split.getMultiCamera().excludeMobjects(1, a);
    split.setSplit('vertical').setSplitRatio(0.3);
    const { renderer, frames } = makeRecordingRenderer({ a: a.getThreeObject() });

    split.getMultiCamera().render(renderer, scene, 800, 450);

    expect(frames).toEqual([{ a: true }, { a: false }]);
  });
});
