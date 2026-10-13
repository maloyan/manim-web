import { describe, it, expect, afterEach } from 'vitest';
import { renderAspects, type AspectTarget } from './renderAspects';
import { Scene } from './Scene';
import { Dot } from '../mobjects/geometry/Dot';
import { resetThemes } from '../utils/ThemeManager';

/**
 * Tests for the renderAspects multi-output convenience helper.
 *
 * Given a scene factory, a build function and a list of targets, it produces
 * the same authored content at each aspect (and optional theme) so a caller
 * can drive the existing exporters once per target.
 */
describe('renderAspects', () => {
  afterEach(() => {
    resetThemes();
  });

  it('builds one scene per target with the matching frame aspect', async () => {
    const targets: AspectTarget[] = [
      { width: 1920, height: 1080, name: 'youtube' },
      { width: 1080, height: 1920, name: 'reels' },
      { width: 1080, height: 1080, name: 'square' },
    ];

    const results = await renderAspects(
      () => Scene.createHeadless(),
      (scene) => {
        scene.add(new Dot());
      },
      targets,
    );

    expect(results).toHaveLength(3);
    for (const { target, scene } of results) {
      const expectedAspect = target.width / target.height;
      expect(scene.camera.frameWidth / scene.camera.frameHeight).toBeCloseTo(expectedAspect, 6);
      expect(scene.mobjects.size).toBe(1);
    }
    expect(results.map((r) => r.target.name)).toEqual(['youtube', 'reels', 'square']);
  });

  it('awaits an async build function', async () => {
    let built = 0;
    const results = await renderAspects(
      () => Scene.createHeadless(),
      async (scene) => {
        await Promise.resolve();
        scene.add(new Dot());
        built += 1;
      },
      [{ width: 1920, height: 1080 }],
    );
    expect(built).toBe(1);
    expect(results[0].scene.mobjects.size).toBe(1);
  });

  it('applies an optional per-target theme to the scene background', async () => {
    const results = await renderAspects(
      () => Scene.createHeadless(),
      () => {},
      [
        { width: 1920, height: 1080, theme: 'dark' },
        { width: 1080, height: 1920, theme: 'light' },
      ],
    );

    // dark theme background is black, light theme background is white.
    expect(results[0].scene.backgroundColor.getHexString()).toBe('000000');
    expect(results[1].scene.backgroundColor.getHexString()).toBe('ffffff');
  });

  it('returns an empty array for no targets', async () => {
    const results = await renderAspects(
      () => Scene.createHeadless(),
      () => {},
      [],
    );
    expect(results).toEqual([]);
  });
});
