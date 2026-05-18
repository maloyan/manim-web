import { describe, it, expect, beforeEach, vi } from 'vitest';

// Regression test for #344: importing Scene (e.g. via Scene.createHeadless)
// without any other reference to AnimateProxy used to leave the animate
// proxy factory unregistered, so `mobject.animate` threw. Each case below
// resets the module graph and dynamically imports only Scene + a Mobject
// subclass via direct module paths, mirroring a minimal user setup.
describe('AnimateProxy registration via Scene import (issue #344)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // 30s timeout: vi.resetModules forces a cold reload of the project's module
  // graph (Scene pulls in animations, geometry, three.js), which can exceed
  // the default 5s timer on slower CI workers.
  const TIMEOUT_MS = 30_000;

  it(
    'Scene.createHeadless registers AnimateProxy so mobject.animate works',
    async () => {
      const { Scene } = await import('./Scene');
      const { Circle } = await import('../mobjects/geometry/Circle');

      const scene = Scene.createHeadless();
      const circle = new Circle();
      scene.add(circle);

      expect(() => circle.animate.shift([1, 0, 0])).not.toThrow();
      scene.dispose();
    },
    TIMEOUT_MS,
  );

  it(
    'new Scene(null, { headless: true }) also registers AnimateProxy',
    async () => {
      const { Scene } = await import('./Scene');
      const { Circle } = await import('../mobjects/geometry/Circle');

      const scene = new Scene(null, { headless: true });
      const circle = new Circle();
      scene.add(circle);

      expect(() => circle.animate.scale(2)).not.toThrow();
      scene.dispose();
    },
    TIMEOUT_MS,
  );
});
