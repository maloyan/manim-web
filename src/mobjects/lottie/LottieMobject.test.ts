// @vitest-environment happy-dom
/**
 * Tests for LottieMobject (best-manim feature: Lottie/Bodymovin import).
 *
 * A stub `lottie-web` player is injected so the tests never load the real
 * library and never touch the network. The stub records every `goToAndStop`
 * and `setSpeed` call, so frame mapping is asserted directly.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import {
  LottieMobject,
  setLottiePlayerFactory,
  type LottieAnimation,
  type LottieLoadParams,
  type LottiePlayer,
  type LottieAnimationData,
} from './index';

interface StubAnimation extends LottieAnimation {
  calls: Array<{ value: number; isFrame: boolean | undefined }>;
  speeds: number[];
  destroyed: boolean;
  lastFrame(): number | undefined;
}

interface StubPlayer extends LottiePlayer {
  params: LottieLoadParams | null;
  anim: StubAnimation;
}

function makeStubPlayer(totalFrames = 60, frameRate = 30): StubPlayer {
  const anim: StubAnimation = {
    totalFrames,
    frameRate,
    calls: [],
    speeds: [],
    destroyed: false,
    goToAndStop(value: number, isFrame?: boolean) {
      this.calls.push({ value, isFrame });
    },
    setSpeed(speed: number) {
      this.speeds.push(speed);
    },
    destroy() {
      this.destroyed = true;
    },
    lastFrame() {
      return this.calls[this.calls.length - 1]?.value;
    },
  };
  return {
    params: null,
    anim,
    loadAnimation(params: LottieLoadParams): LottieAnimation {
      this.params = params;
      return this.anim;
    },
  };
}

const DATA: LottieAnimationData = { w: 200, h: 100, fr: 30, layers: [] };

afterEach(() => {
  setLottiePlayerFactory(null);
  vi.restoreAllMocks();
});

describe('LottieMobject construction', () => {
  it('builds a plane with a CanvasTexture synchronously', () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player, width: 4 });
    const meshes = mob.getDisplayMeshes();
    expect(meshes).toHaveLength(1);
    expect(mob.getDisplayMeshLength()).toBe(1);
    const material = meshes[0].material as THREE.MeshBasicMaterial;
    expect(material.map).toBeInstanceOf(THREE.CanvasTexture);
  });

  it('derives the natural aspect ratio from the composition size', () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player, width: 4 });
    const box = mob.getBoundingBox();
    // 200x100 -> aspect 2:1, width 4 => height 2
    expect(box.width).toBeCloseTo(4, 6);
    expect(box.height).toBeCloseTo(2, 6);
  });

  it('applies opacity to the material', () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player, opacity: 0.5 });
    const material = mob.getDisplayMeshes()[0].material as THREE.MeshBasicMaterial;
    expect(material.opacity).toBeCloseTo(0.5, 6);
  });
});

describe('LottieMobject load lifecycle', () => {
  it('loads the animation and reads totalFrames/frameRate', async () => {
    const player = makeStubPlayer(90, 24);
    const mob = new LottieMobject({ animationData: DATA, player });
    expect(mob.isLoaded()).toBe(false);
    await mob.waitForLoad();
    expect(mob.isLoaded()).toBe(true);
    expect(mob.getTotalFrames()).toBe(90);
    expect(mob.getFrameRate()).toBe(24);
    expect(mob.duration).toBeCloseTo(90 / 24, 6);
  });

  it('passes the canvas renderer config to the player', async () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player, loop: true });
    await mob.waitForLoad();
    expect(player.params).not.toBeNull();
    expect(player.params!.renderer).toBe('canvas');
    expect(player.params!.autoplay).toBe(false);
    expect(player.params!.loop).toBe(true);
    expect(player.params!.animationData).toBe(DATA);
  });

  it('seeks to frame 0 once loaded', async () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player });
    await mob.waitForLoad();
    expect(player.anim.calls[0]).toEqual({ value: 0, isFrame: true });
  });

  it('rejects when no animationData is provided', async () => {
    const mob = new LottieMobject({ player: makeStubPlayer() });
    await expect(mob.waitForLoad()).rejects.toThrow('no animationData');
    expect(mob.getLoadError()).toBeInstanceOf(Error);
  });

  it('wraps a player error', async () => {
    const player: LottiePlayer = {
      loadAnimation() {
        throw new Error('boom');
      },
    };
    const mob = new LottieMobject({ animationData: DATA, player });
    await expect(mob.waitForLoad()).rejects.toThrow('Failed to load Lottie: boom');
  });

  it('honors the injected player factory', async () => {
    const player = makeStubPlayer();
    setLottiePlayerFactory(() => player);
    const mob = new LottieMobject({ animationData: DATA });
    await mob.waitForLoad();
    expect(mob.isLoaded()).toBe(true);
    expect(player.params).not.toBeNull();
  });
});

describe('LottieMobject timeline sync', () => {
  it('maps scene time to a frame via frameRate and calls goToAndStop', async () => {
    const player = makeStubPlayer(60, 30);
    const mob = new LottieMobject({ animationData: DATA, player });
    await mob.waitForLoad();
    mob.syncToTime(1); // 1s * 30fps = frame 30
    const last = player.anim.calls[player.anim.calls.length - 1];
    expect(last).toEqual({ value: 30, isFrame: true });
    expect(mob.getDisplayMeshes()[0]).toBeTruthy();
  });

  it('clamps beyond the end when not looping', async () => {
    const player = makeStubPlayer(60, 30);
    const mob = new LottieMobject({ animationData: DATA, player, loop: false });
    await mob.waitForLoad();
    mob.syncToTime(100); // far beyond 2s duration -> clamp to totalFrames
    expect(player.anim.lastFrame()).toBe(60);
  });

  it('wraps the frame when looping', async () => {
    const player = makeStubPlayer(60, 30);
    const mob = new LottieMobject({ animationData: DATA, player, loop: true });
    await mob.waitForLoad();
    mob.syncToTime(3); // 3s * 30 = 90 -> 90 % 60 = 30
    expect(player.anim.lastFrame()).toBe(30);
  });

  it('respects the speed multiplier in frame mapping', async () => {
    const player = makeStubPlayer(120, 30);
    const mob = new LottieMobject({ animationData: DATA, player, speed: 2 });
    await mob.waitForLoad();
    expect(player.anim.speeds).toContain(2); // setSpeed applied on load
    mob.syncToTime(1); // 1s * 30 * 2 = frame 60
    expect(player.anim.lastFrame()).toBe(60);
  });

  it('seekToProgress maps a fraction to a frame', async () => {
    const player = makeStubPlayer(80, 40);
    const mob = new LottieMobject({ animationData: DATA, player });
    await mob.waitForLoad();
    mob.seekToProgress(0.25); // 0.25 * 80 = frame 20
    expect(player.anim.lastFrame()).toBe(20);
  });

  it('flags the texture for upload on seek', async () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player });
    await mob.waitForLoad();
    const texture = (mob.getDisplayMeshes()[0].material as THREE.MeshBasicMaterial)
      .map as THREE.CanvasTexture;
    // `needsUpdate` is a write-only setter in three.js; it bumps `version`.
    const before = texture.version;
    mob.syncToTime(0.5);
    expect(texture.version).toBeGreaterThan(before);
  });
});

describe('LottieMobject live playback', () => {
  it('advances the frame through the updater when playing', async () => {
    const player = makeStubPlayer(60, 30);
    const mob = new LottieMobject({ animationData: DATA, player });
    await mob.waitForLoad();
    expect(mob.hasUpdaters()).toBe(true);
    mob.play();
    mob.update(1); // 1s elapsed -> frame 30
    expect(player.anim.lastFrame()).toBe(30);
    mob.pause();
    const before = player.anim.calls.length;
    mob.update(1); // paused: no new seek
    expect(player.anim.calls.length).toBe(before);
  });
});

describe('LottieMobject fromUrl', () => {
  it('fetches and parses the JSON then builds a loaded mobject', async () => {
    const player = makeStubPlayer(50, 25);
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => DATA,
    })) as unknown as typeof fetch;
    const mob = await LottieMobject.fromUrl('anim.json', { player, fetchImpl, width: 6 });
    expect(fetchImpl).toHaveBeenCalledWith('anim.json');
    expect(mob.isLoaded()).toBe(true);
    expect(mob.getTotalFrames()).toBe(50);
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({}),
    })) as unknown as typeof fetch;
    await expect(
      LottieMobject.fromUrl('missing.json', { player: makeStubPlayer(), fetchImpl }),
    ).rejects.toThrow('HTTP 404');
  });
});

describe('LottieMobject transform participation', () => {
  it('shift() moves the mobject and copy() preserves the position', () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player, width: 4 });
    mob.shift([3, 0, 0]);
    expect(mob.position.x).toBeCloseTo(3, 6);
    const copy = mob.copy();
    expect(copy).toBeInstanceOf(LottieMobject);
    expect(copy.position.x).toBeCloseTo(3, 6);
  });
});

describe('LottieMobject disposal', () => {
  it('destroys the animation and disposes the texture', async () => {
    const player = makeStubPlayer();
    const mob = new LottieMobject({ animationData: DATA, player });
    await mob.waitForLoad();
    const texture = (mob.getDisplayMeshes()[0].material as THREE.MeshBasicMaterial)
      .map as THREE.CanvasTexture;
    const disposeSpy = vi.spyOn(texture, 'dispose');
    mob.dispose();
    expect(player.anim.destroyed).toBe(true);
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
