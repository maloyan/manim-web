// @vitest-environment happy-dom
/**
 * Tests for VideoMobject (best-manim feature: video as a movable mobject).
 *
 * The video element is mocked through a spy on document.createElement so the
 * tests stay deterministic and never touch a real network or media decoder.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { VideoMobject } from './index';

interface FakeVideo extends Record<string, unknown> {
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  addEventListener: (type: string, cb: (ev?: unknown) => void) => void;
  removeEventListener: (type: string, cb: (ev?: unknown) => void) => void;
  __fire: (type: string, ev?: unknown) => void;
  __listeners: Map<string, Set<(ev?: unknown) => void>>;
  src: string;
  loop: boolean;
  muted: boolean;
  autoplay: boolean;
  playsInline: boolean;
  crossOrigin: string | null;
  playbackRate: number;
  currentTime: number;
  duration: number;
  readyState: number;
  videoWidth: number;
  videoHeight: number;
}

function makeFakeVideo(): FakeVideo {
  const listeners = new Map<string, Set<(ev?: unknown) => void>>();
  const video: FakeVideo = {
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: (type, cb) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(cb);
    },
    removeEventListener: (type, cb) => {
      listeners.get(type)?.delete(cb);
    },
    __fire: (type, ev) => {
      listeners.get(type)?.forEach((cb) => cb(ev));
    },
    __listeners: listeners,
    src: '',
    loop: false,
    muted: false,
    autoplay: false,
    playsInline: false,
    crossOrigin: null,
    playbackRate: 1,
    currentTime: 0,
    duration: 12,
    readyState: 2,
    videoWidth: 1920,
    videoHeight: 1080,
  };
  return video;
}

/** Spy document.createElement so that 'video' returns our fake element. */
function mockVideoElement(video: FakeVideo): ReturnType<typeof vi.spyOn> {
  const orig = document.createElement.bind(document);
  return vi.spyOn(document, 'createElement').mockImplementation((tag: string): HTMLElement => {
    if (tag.toLowerCase() === 'video') {
      return video as unknown as HTMLElement;
    }
    return orig(tag);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VideoMobject construction', () => {
  it('constructs and applies options to the video element', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({
        src: 'movie.mp4',
        loop: true,
        muted: false,
        autoplay: true,
        playbackRate: 1.5,
      });
      expect(vid).toBeInstanceOf(VideoMobject);
      expect(video.src).toBe('movie.mp4');
      expect(video.loop).toBe(true);
      expect(video.muted).toBe(false);
      expect(video.autoplay).toBe(true);
      expect(video.playbackRate).toBe(1.5);
      expect(vid.getSource()).toBe('movie.mp4');
    } finally {
      spy.mockRestore();
    }
  });

  it('defaults muted to true for autoplay policies', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      new VideoMobject({ src: 'movie.mp4' });
      expect(video.muted).toBe(true);
      expect(video.loop).toBe(false);
      expect(video.autoplay).toBe(false);
      expect(video.playbackRate).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('VideoMobject playback controls', () => {
  it('play() calls through to the element', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      vid.play();
      expect(video.play).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('pause() calls through to the element', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      vid.pause();
      expect(video.pause).toHaveBeenCalledTimes(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('seek() sets the element currentTime clamped to [0, duration]', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      vid.seek(5);
      expect(video.currentTime).toBe(5);
      vid.seek(-3);
      expect(video.currentTime).toBe(0);
      vid.seek(999);
      expect(video.currentTime).toBe(12);
    } finally {
      spy.mockRestore();
    }
  });

  it('setPlaybackRate() sets the element playbackRate', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      vid.setPlaybackRate(2);
      expect(video.playbackRate).toBe(2);
    } finally {
      spy.mockRestore();
    }
  });

  it('duration getter reads the element duration', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      expect(vid.duration).toBe(12);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('VideoMobject load lifecycle', () => {
  it('waitForLoad() resolves on loadeddata', async () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      expect(vid.isLoaded()).toBe(false);
      const promise = vid.waitForLoad();
      video.videoWidth = 640;
      video.videoHeight = 480;
      video.__fire('loadeddata');
      await expect(promise).resolves.toBeUndefined();
      expect(vid.isLoaded()).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('captures a load error and rejects waitForLoad()', async () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'bad.mp4' });
      const promise = vid.waitForLoad();
      video.__fire('error');
      await expect(promise).rejects.toThrow('Failed to load video');
      expect(vid.getLoadError()).toBeInstanceOf(Error);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('VideoMobject timeline sync', () => {
  it('syncToTime() seeks the element to the scene time', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      vid.syncToTime(3.5);
      expect(video.currentTime).toBe(3.5);
      // beyond duration clamps
      vid.syncToTime(100);
      expect(video.currentTime).toBe(12);
    } finally {
      spy.mockRestore();
    }
  });

  it('registers an updater that keeps the video texture fresh', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4' });
      expect(vid.hasUpdaters()).toBe(true);
      // Driving the updater must not throw.
      expect(() => vid.update(0.016)).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('VideoMobject transform participation', () => {
  it('uses a THREE.VideoTexture and exposes a single display mesh', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4', width: 4 });
      const meshes = vid.getDisplayMeshes();
      expect(meshes).toHaveLength(1);
      expect(vid.getDisplayMeshLength()).toBe(1);
      const material = meshes[0].material as THREE.MeshBasicMaterial;
      expect(material.map).toBeInstanceOf(THREE.VideoTexture);
    } finally {
      spy.mockRestore();
    }
  });

  it('shift() moves the mobject and copy() preserves the position', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4', width: 4 });
      vid.shift([3, 0, 0]);
      expect(vid.position.x).toBeCloseTo(3, 6);
      const copy = vid.copy();
      expect(copy).toBeInstanceOf(VideoMobject);
      expect(copy.position.x).toBeCloseTo(3, 6);
      expect(copy.getSource()).toBe('movie.mp4');
    } finally {
      spy.mockRestore();
    }
  });

  it('applies opacity to the material', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4', opacity: 0.5 });
      const material = vid.getDisplayMeshes()[0].material as THREE.MeshBasicMaterial;
      expect(material.opacity).toBeCloseTo(0.5, 6);
    } finally {
      spy.mockRestore();
    }
  });

  it('getBoundingBox reflects width and scale', () => {
    const video = makeFakeVideo();
    const spy = mockVideoElement(video);
    try {
      const vid = new VideoMobject({ src: 'movie.mp4', width: 4 });
      const box = vid.getBoundingBox();
      // 1920x1080 -> aspect 16:9, width 4 => height 2.25
      expect(box.width).toBeCloseTo(4, 6);
      expect(box.height).toBeCloseTo(2.25, 6);
    } finally {
      spy.mockRestore();
    }
  });
});
