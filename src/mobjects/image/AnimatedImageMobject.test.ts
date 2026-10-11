// @vitest-environment happy-dom
/**
 * Tests for AnimatedImageMobject (best-manim feature: animated GIF playback).
 *
 * A mock decoder is injected through `setGifDecoder`, so the tests never fetch
 * or decode a real GIF. Frames are tiny hand-built RGBA buffers. This keeps the
 * tests deterministic and free of any network or `gifuct-js` dependency.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as THREE from 'three';
import { AnimatedImageMobject, setGifDecoder } from './AnimatedImageMobject';
import type { DecodedGif } from './gifDecoder';

/** Build a decoded GIF of `delays.length` frames, each a 2x2 solid RGBA image. */
function makeDecodedGif(delays: number[]): DecodedGif {
  const width = 2;
  const height = 2;
  const frames = delays.map((delay, i) => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let p = 0; p < width * height; p++) {
      data[p * 4] = (i * 40) % 256; // distinct red channel per frame
      data[p * 4 + 3] = 255;
    }
    return { data, delay };
  });
  return { width, height, frames };
}

/** Inject a decoder that resolves to the given decoded GIF. */
function injectFrames(delays: number[]): void {
  const decoded = makeDecodedGif(delays);
  setGifDecoder(() => Promise.resolve(decoded));
}

afterEach(() => {
  setGifDecoder(null);
});

describe('AnimatedImageMobject decoding', () => {
  it('decodes frames and exposes frameCount', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif' });
    await gif.waitForLoad();
    expect(gif.isLoaded()).toBe(true);
    expect(gif.frameCount).toBe(3);
    expect(gif.currentFrame).toBe(0);
    expect(gif.getLoadError()).toBeNull();
  });

  it('captures a decode error and rejects waitForLoad()', async () => {
    setGifDecoder(() => Promise.reject(new Error('decode boom')));
    const gif = new AnimatedImageMobject({ source: 'bad.gif' });
    await expect(gif.waitForLoad()).rejects.toThrow('decode boom');
    expect(gif.getLoadError()).toBeInstanceOf(Error);
    expect(gif.isLoaded()).toBe(false);
  });
});

describe('AnimatedImageMobject playback', () => {
  it('play() + update() advances the frame by elapsed delay', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif' });
    await gif.waitForLoad();
    gif.play();
    gif.update(0.15); // 150 ms: past frame 0 (100 ms), into frame 1
    expect(gif.currentFrame).toBe(1);
  });

  it('pause() stops the frame from advancing', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif' });
    await gif.waitForLoad();
    gif.play();
    gif.pause();
    gif.update(1); // 1000 ms, but paused
    expect(gif.currentFrame).toBe(0);
  });

  it('seek() jumps to a frame index, clamped to range', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif' });
    await gif.waitForLoad();
    gif.seek(2);
    expect(gif.currentFrame).toBe(2);
    gif.seek(99);
    expect(gif.currentFrame).toBe(2);
    gif.seek(-5);
    expect(gif.currentFrame).toBe(0);
  });

  it('loops past the last frame back to the first', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', loop: true });
    await gif.waitForLoad();
    gif.seek(2);
    gif.play();
    gif.update(0.35); // 350 ms, past frame 2 (300 ms) -> wrap to 0
    expect(gif.currentFrame).toBe(0);
  });

  it('stops on the last frame when loop is false', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', loop: false });
    await gif.waitForLoad();
    gif.seek(2);
    gif.play();
    gif.update(5); // way past the end
    expect(gif.currentFrame).toBe(2);
    expect(gif.isPlaying()).toBe(false);
  });

  it('fps override replaces the GIF delays', async () => {
    injectFrames([1000, 1000, 1000]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', fps: 10 });
    await gif.waitForLoad();
    gif.play();
    gif.update(0.1); // 100 ms = one frame at 10 fps
    expect(gif.currentFrame).toBe(1);
  });
});

describe('AnimatedImageMobject timeline sync', () => {
  it('syncToTime() maps a scene time to the matching frame', async () => {
    injectFrames([100, 200, 300]); // cumulative: f0 [0,100) f1 [100,300) f2 [300,600)
    const gif = new AnimatedImageMobject({ source: 'anim.gif', loop: true });
    await gif.waitForLoad();
    gif.syncToTime(0);
    expect(gif.currentFrame).toBe(0);
    gif.syncToTime(0.15);
    expect(gif.currentFrame).toBe(1);
    gif.syncToTime(0.35);
    expect(gif.currentFrame).toBe(2);
    gif.syncToTime(0.65); // 650 ms % 600 = 50 ms -> frame 0 (loop)
    expect(gif.currentFrame).toBe(0);
  });

  it('registers an updater so the Player drives playback', async () => {
    injectFrames([100, 200]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif' });
    await gif.waitForLoad();
    expect(gif.hasUpdaters()).toBe(true);
    expect(() => gif.update(0.016)).not.toThrow();
  });
});

describe('AnimatedImageMobject transform participation', () => {
  it('uses a THREE.DataTexture and exposes a single display mesh', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', width: 4 });
    await gif.waitForLoad();
    const meshes = gif.getDisplayMeshes();
    expect(meshes).toHaveLength(1);
    expect(gif.getDisplayMeshLength()).toBe(1);
    const material = meshes[0].material as THREE.MeshBasicMaterial;
    expect(material.map).toBeInstanceOf(THREE.DataTexture);
  });

  it('swaps the texture map when the frame changes', async () => {
    injectFrames([100, 200, 300]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', width: 4 });
    await gif.waitForLoad();
    const material = gif.getDisplayMeshes()[0].material as THREE.MeshBasicMaterial;
    const first = material.map;
    gif.seek(1);
    expect(material.map).not.toBe(first);
    expect(material.map).toBeInstanceOf(THREE.DataTexture);
  });

  it('applies opacity to the material', async () => {
    injectFrames([100]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', opacity: 0.5 });
    await gif.waitForLoad();
    const material = gif.getDisplayMeshes()[0].material as THREE.MeshBasicMaterial;
    expect(material.opacity).toBeCloseTo(0.5, 6);
  });

  it('shift() moves the mobject and copy() preserves the position', async () => {
    injectFrames([100, 200]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', width: 4 });
    await gif.waitForLoad();
    gif.shift([3, 0, 0]);
    expect(gif.position.x).toBeCloseTo(3, 6);
    const copy = gif.copy();
    expect(copy).toBeInstanceOf(AnimatedImageMobject);
    expect(copy.position.x).toBeCloseTo(3, 6);
    expect(copy.getSource()).toBe('anim.gif');
  });

  it('getBoundingBox reflects width and natural aspect ratio', async () => {
    injectFrames([100]);
    const gif = new AnimatedImageMobject({ source: 'anim.gif', width: 4 });
    await gif.waitForLoad();
    const box = gif.getBoundingBox();
    expect(box.width).toBeCloseTo(4, 6); // 2x2 source -> aspect 1
    expect(box.height).toBeCloseTo(4, 6);
  });
});
