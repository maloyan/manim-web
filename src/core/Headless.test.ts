import { describe, it, expect } from 'vitest';
import { NullRenderer } from './NullRenderer';
import { Scene } from './Scene';
import { ThreeDScene } from './ThreeDScene';
import { ZoomedScene } from './ZoomedScene';
import { Circle } from '../mobjects/geometry/Circle';

describe('NullRenderer', () => {
  it('creates with default dimensions', () => {
    const renderer = new NullRenderer();
    expect(renderer.width).toBe(800);
    expect(renderer.height).toBe(450);
  });

  it('creates with custom dimensions', () => {
    const renderer = new NullRenderer({ width: 1920, height: 1080 });
    expect(renderer.width).toBe(1920);
    expect(renderer.height).toBe(1080);
  });

  it('resize updates dimensions', () => {
    const renderer = new NullRenderer();
    renderer.resize(640, 480);
    expect(renderer.width).toBe(640);
    expect(renderer.height).toBe(480);
  });

  it('render is a no-op', () => {
    const renderer = new NullRenderer();
    // Should not throw
    expect(() => renderer.render(null as never, null as never)).not.toThrow();
  });

  it('dispose is a no-op', () => {
    const renderer = new NullRenderer();
    expect(() => renderer.dispose()).not.toThrow();
  });

  it('getCanvas throws in headless mode', () => {
    const renderer = new NullRenderer();
    expect(() => renderer.getCanvas()).toThrow('not available in headless mode');
  });

  it('getThreeRenderer throws in headless mode', () => {
    const renderer = new NullRenderer();
    expect(() => renderer.getThreeRenderer()).toThrow('not available in headless mode');
  });

  it('isContextLost is always false', () => {
    const renderer = new NullRenderer();
    expect(renderer.isContextLost).toBe(false);
  });

  it('backgroundColor can be get/set', () => {
    const renderer = new NullRenderer({ backgroundColor: '#ff0000' });
    expect(renderer.backgroundColor.getHexString()).toBe('ff0000');
    renderer.backgroundColor = '#00ff00';
    expect(renderer.backgroundColor.getHexString()).toBe('00ff00');
  });

  it('backgroundOpacity clamps to [0, 1]', () => {
    const renderer = new NullRenderer();
    renderer.backgroundOpacity = 2;
    expect(renderer.backgroundOpacity).toBe(1);
    renderer.backgroundOpacity = -1;
    expect(renderer.backgroundOpacity).toBe(0);
  });
});

describe('Scene headless mode', () => {
  it('creates via createHeadless()', () => {
    const scene = Scene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it('creates via constructor with headless option', () => {
    const scene = new Scene(null, { headless: true });
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it('throws when container is null without headless flag', () => {
    expect(() => new Scene(null)).toThrow('container is required');
  });

  it('can add and remove mobjects', () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects).toContain(circle);
    scene.remove(circle);
    expect(scene.mobjects).not.toContain(circle);
    scene.dispose();
  });

  it('getCanvas throws in headless mode', () => {
    const scene = Scene.createHeadless();
    expect(() => scene.getCanvas()).toThrow('not available in headless mode');
    scene.dispose();
  });

  it('getWidth and getHeight work', () => {
    const scene = Scene.createHeadless({ width: 1920, height: 1080 });
    expect(scene.getWidth()).toBe(1920);
    expect(scene.getHeight()).toBe(1080);
    scene.dispose();
  });

  it('resize works', () => {
    const scene = Scene.createHeadless();
    scene.resize(640, 480);
    expect(scene.getWidth()).toBe(640);
    expect(scene.getHeight()).toBe(480);
    scene.dispose();
  });

  it('clear does not throw', () => {
    const scene = Scene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(() => scene.clear()).not.toThrow();
    scene.dispose();
  });

  it('dispose does not throw', () => {
    const scene = Scene.createHeadless();
    expect(() => scene.dispose()).not.toThrow();
  });
});

describe('ThreeDScene headless mode', () => {
  it('creates via createHeadless()', () => {
    const scene = ThreeDScene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it('does not create orbit controls in headless mode', () => {
    const scene = ThreeDScene.createHeadless();
    expect(scene.orbitControls).toBeNull();
    scene.dispose();
  });

  it('camera3D is accessible', () => {
    const scene = ThreeDScene.createHeadless();
    expect(scene.camera3D).toBeDefined();
    scene.dispose();
  });

  it('setCameraOrientation works', () => {
    const scene = ThreeDScene.createHeadless();
    expect(() => scene.setCameraOrientation(Math.PI / 3, Math.PI / 6)).not.toThrow();
    scene.dispose();
  });

  it('can add mobjects', () => {
    const scene = ThreeDScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });
});

describe('ZoomedScene headless mode', () => {
  it('creates via createHeadless()', () => {
    const scene = ZoomedScene.createHeadless();
    expect(scene.isHeadless).toBe(true);
    scene.dispose();
  });

  it('activateZooming does not throw', () => {
    const scene = ZoomedScene.createHeadless();
    expect(() => scene.activateZooming()).not.toThrow();
    scene.dispose();
  });

  it('can add mobjects', () => {
    const scene = ZoomedScene.createHeadless();
    const circle = new Circle();
    scene.add(circle);
    expect(scene.mobjects).toContain(circle);
    scene.dispose();
  });
});
