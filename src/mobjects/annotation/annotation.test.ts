// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { ThreeDScene } from '../../core/ThreeDScene';
import { Sphere } from '../three-d/Sphere';
import { Callout3D } from './Callout3D';
import { CaptionCard } from './CaptionCard';
import { ExplainerTour, type TourTarget } from './ExplainerTour';
import { contrastRatio, resolvePalette } from './annotationStyle';

// happy-dom has no 2D canvas: give Text a minimal context.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((id: string) =>
    id === '2d'
      ? ({
          measureText: (t: string) => ({ width: t.length * 10 }),
          fillText: () => {},
          strokeText: () => {},
          clearRect: () => {},
          save: () => {},
          restore: () => {},
        } as unknown as CanvasRenderingContext2D)
      : null) as unknown as HTMLCanvasElement['getContext']);
});

function scene3D(): ThreeDScene {
  return ThreeDScene.createHeadless({ width: 400, height: 400, frameWidth: 8, frameHeight: 8 });
}

describe('direction-layer annotations', () => {
  // MIGRATION: example for the property
  //   ∀ background colour bg: contrastRatio(resolvePalette(bg).text, bg) >= 4.5.
  // Replace with a property test once the suite lands.
  it('derives readable text colours from a dark and a light background', () => {
    for (const bg of ['#0F1115', '#FFFFFF']) {
      expect(contrastRatio(resolvePalette(bg).text, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  // MIGRATION: example for the property
  //   ∀ camera pose, ∀ anchor point p: after a render, callout.dot centre ===
  //   scene.projectToFrame(p) (x, y).
  // Replace with a property test once the suite lands.
  it('keeps the callout dot on the projected anchor after a camera move', () => {
    const scene = scene3D();
    const anchor = new Sphere({ radius: 0.5, center: [1, 2, 0.5] });
    scene.add(anchor);
    const callout = new Callout3D({ scene, anchor, label: 'here' });
    scene.setCameraState({ phi: 0.9, theta: -1.1, distance: 9, lookAt: [0.5, 0.5, 0] });
    scene.render();
    const p = scene.projectToFrame(anchor.getCenter());
    const d = callout.dot.getCenter();
    expect(d[0]).toBeCloseTo(p[0], 5);
    expect(d[1]).toBeCloseTo(p[1], 5);
    callout.dispose();
  });

  // MIGRATION: example for the property
  //   ∀ before-render hook h, ∀ mobject m: after any opacity change of m and a
  //   render, every non-prepass material of m has depthWrite === !transparent,
  //   whether or not h synchronised m before the scene did.
  // Replace with a property test once the suite lands.
  it('updates depth state when a hook synchronised the mobject first', () => {
    const scene = scene3D();
    const sphere = new Sphere({ radius: 1 });
    scene.add(sphere);
    scene.render();
    const callout = new Callout3D({ scene, anchor: sphere, label: 'here' });
    sphere.opacity = 0.5;
    scene.render();
    const mesh = sphere.getThreeObject() as THREE.Mesh;
    const material = mesh.material as THREE.Material;
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
    callout.dispose();
  });

  // MIGRATION: example for the property
  //   ∀ narration n, ∀ stop animations A: if n or A rejects, playStop() rejects
  //   with that error and no rejection is left unhandled.
  // Replace with a property test once the suite lands.
  it('hands a narration or animation failure to the caller of playStop()', async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    try {
      const tick = () => new Promise<void>((r) => setTimeout(r, 5));
      const scene = scene3D();
      const tour = new ExplainerTour(scene, { player: { play: tick, wait: tick } });
      const narration = () => Promise.reject(new Error('missing clip'));
      await expect(tour.playStop({ narration, hold: 0 })).rejects.toThrow('missing clip');

      // An animation error wins; the narration error is logged, not lost.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const failing = new ExplainerTour(scene, {
        player: { play: () => Promise.reject(new Error('bad anim')), wait: tick },
      });
      await expect(failing.playStop({ narration, hold: 0 })).rejects.toThrow('bad anim');
      await tick();
      await tick();
      expect(unhandled).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  // MIGRATION: example for the property
  //   ∀ sequence of stops (with any keepAnnotations), after finish() every inset,
  //   callout and ring the tour created is faded, and after dispose() no render
  //   hook of the tour is still registered.
  // Replace with a property test once the suite lands.
  it('retires every inset kept across stops', async () => {
    const scene = scene3D();
    const hooks = new Set<() => void>();
    const add = scene.addBeforeRenderHook.bind(scene);
    scene.addBeforeRenderHook = (hook) => {
      const off = add(hook);
      hooks.add(hook);
      return () => {
        hooks.delete(hook);
        off();
      };
    };
    const played: unknown[] = [];
    const player = {
      play: async (...anims: unknown[]) => void played.push(...anims),
      wait: async () => {},
    };
    const tour = new ExplainerTour(scene, { player });
    await tour.playStop({ inset: { anchor: [0, 0, 0], title: '' }, hold: 0 });
    await tour.playStop({
      inset: { anchor: [1, 0, 0], title: '' },
      keepAnnotations: true,
      hold: 0,
    });
    expect(hooks.size).toBe(2);
    played.length = 0;
    await tour.finish();
    // Two inset fades plus the focus restore.
    expect(played.length).toBe(3);
    tour.dispose();
    expect(hooks.size).toBe(0);
  });

  it('uses TourTarget defaults when a stop gives none, and builds caption steps', () => {
    const scene = scene3D();
    const target = new Sphere({ radius: 1 }) as Sphere & TourTarget;
    target.getCaption = () => ({ title: 'Ball', body: 'Round.', footnote: 'Small.' });
    target.getFocusFraming = () => ({ fill: 0.3 });
    const tour = new ExplainerTour(scene, { framing: { phi: 1 } });
    const stop = { target, framing: { theta: 2 } };
    expect(tour.framingFor(stop)).toEqual({ phi: 1, fill: 0.3, theta: 2 });
    expect(tour.captionFor(stop)?.title).toBe('Ball');
    expect(tour.enterAnimations(stop).length).toBe(3);
    expect(tour.revealSteps(stop).length).toBe(2);
    expect(new CaptionCard({ scene }).show({ title: 'x' }).duration).toBeGreaterThan(0);
  });
});
