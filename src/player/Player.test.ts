// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Player, PlayerOptions } from './Player';
import { PlayerController, PlayerControllerCallbacks } from './PlayerController';

// ---------------------------------------------------------------------------
// Mock Scene — avoids WebGL / Three.js renderer instantiation
// ---------------------------------------------------------------------------

function createMockSceneMethods() {
  return {
    render: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn().mockReturnThis(),
    getWidth: vi.fn(() => 800),
    getHeight: vi.fn(() => 450),
    add: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    mobjects: new Set() as Set<unknown>,
    camera: {},
    batch: vi.fn((cb: () => void) => cb()),
    export: vi.fn(async () => new Blob()),
    _timeline: null as unknown,
  };
}

let mockScene: ReturnType<typeof createMockSceneMethods>;

vi.mock('../core/Scene', () => ({
  Scene: vi.fn(function MockScene() {
    Object.assign(this, mockScene);
    return this;
  }),
}));

// ---------------------------------------------------------------------------
// Helper: create a container and Player
// ---------------------------------------------------------------------------

function createContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function createPlayer(opts: PlayerOptions = {}): { player: Player; container: HTMLElement } {
  const container = createContainer();
  const player = new Player(container, { width: 800, height: 450, ...opts });
  return { player, container };
}

// ---------------------------------------------------------------------------
// Player tests
// ---------------------------------------------------------------------------

describe('Player', () => {
  let player: Player;
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockSceneMethods();
    const result = createPlayer();
    player = result.player;
    container = result.container;
  });

  afterEach(() => {
    player.dispose();
    container.remove();
  });

  // ---- Construction ----

  it('creates a Player and exposes scene and timeline', () => {
    expect(player.scene).toBeDefined();
    expect(player.timeline).toBeDefined();
    expect(player.isPlaying).toBe(false);
  });

  it('stores original dimensions from scene', () => {
    expect(mockScene.getWidth).toHaveBeenCalled();
    expect(mockScene.getHeight).toHaveBeenCalled();
  });

  // ---- Disposal ----

  it('dispose cleans up scene and stops loop', () => {
    player.dispose();
    expect(mockScene.dispose).toHaveBeenCalled();
  });

  it('dispose can be called multiple times without error', () => {
    player.dispose();
    player.dispose();
  });

  // ---- sequence() ----

  it('sequence records animations via RecordingScene and resets timeline', async () => {
    let recorderReceived = false;
    await player.sequence(async (scene) => {
      recorderReceived = true;
      expect(typeof scene.add).toBe('function');
      expect(typeof scene.remove).toBe('function');
      expect(scene.camera).toBeDefined();
      expect(typeof scene.batch).toBe('function');
    });
    expect(recorderReceived).toBe(true);
  });

  it('sequence calls render and seeks to 0 after recording', async () => {
    await player.sequence(async () => {
      // No-op builder
    });
    expect(mockScene.render).toHaveBeenCalled();
  });

  it('sequence with autoPlay starts playback', async () => {
    player.dispose();
    container.remove();

    mockScene = createMockSceneMethods();
    const result = createPlayer({ autoPlay: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.wait(0.5);
    });

    expect(player.isPlaying).toBe(true);
  });

  it('sequence with wait() records a wait segment', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1.5);
    });

    expect(player.timeline.getDuration()).toBeCloseTo(1.5);
    expect(player.timeline.segmentCount).toBe(1);
  });

  // ---- play / pause / toggle ----

  it('play sets isPlaying to true', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
    });
    player.play();
    expect(player.isPlaying).toBe(true);
  });

  it('pause sets isPlaying to false', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
    });
    player.play();
    player.pause();
    expect(player.isPlaying).toBe(false);
  });

  it('togglePlayPause toggles state', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
    });
    expect(player.isPlaying).toBe(false);

    player.togglePlayPause();
    expect(player.isPlaying).toBe(true);

    player.togglePlayPause();
    expect(player.isPlaying).toBe(false);
  });

  it('play resets to 0 when timeline is finished', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(0.5);
    });

    // Force timeline to finished state
    player.timeline.seek(player.timeline.getDuration());
    expect(player.timeline.isFinished()).toBe(true);

    player.play();
    expect(player.isPlaying).toBe(true);
    expect(player.timeline.getCurrentTime()).toBe(0);
  });

  // ---- seek ----

  it('seek updates timeline position and renders', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    mockScene.render.mockClear();
    player.seek(1.0);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(1.0);
    expect(mockScene.render).toHaveBeenCalled();
  });

  // ---- nextSegment / prevSegment ----

  it('nextSegment advances to next segment and pauses', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.wait(1);
    });

    player.play();
    expect(player.isPlaying).toBe(true);

    player.nextSegment();
    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(1.0);
  });

  it('prevSegment goes to start of current segment when >0.5s in', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.wait(1);
    });

    // Go 0.8s into the second segment (which starts at 1.0)
    player.seek(1.8);
    player.play();
    expect(player.isPlaying).toBe(true);

    // prevSegment should pause and go to start of current segment (0.8 > 0.5 threshold)
    player.prevSegment();
    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(1.0);
  });

  it('prevSegment goes to previous segment when <=0.5s into current', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.wait(1);
    });

    // Go 0.3s into the second segment (which starts at 1.0)
    player.seek(1.3);
    player.play();

    // prevSegment should pause and go to start of previous segment (0.3 <= 0.5)
    player.prevSegment();
    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0);
  });

  it('nextSegment does nothing significant at end of timeline', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
    });

    player.nextSegment();
    expect(player.isPlaying).toBe(false);
  });

  it('prevSegment at beginning seeks to 0', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(1);
    });

    player.prevSegment();
    expect(player.timeline.getCurrentTime()).toBe(0);
  });

  // ---- setPlaybackRate ----

  it('setPlaybackRate stores the new rate', () => {
    player.setPlaybackRate(2);
    expect((player as unknown as { _playbackRate: number })._playbackRate).toBe(2);
  });

  it('setPlaybackRate accepts fractional values', () => {
    player.setPlaybackRate(0.5);
    expect((player as unknown as { _playbackRate: number })._playbackRate).toBe(0.5);
  });

  // ---- toggleFullscreen ----

  it('toggleFullscreen calls requestFullscreen when not in fullscreen', () => {
    const requestSpy = vi.fn(() => Promise.resolve());
    container.requestFullscreen = requestSpy;

    player.toggleFullscreen();
    expect(requestSpy).toHaveBeenCalled();
  });

  it('toggleFullscreen calls exitFullscreen when already in fullscreen', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: container,
      writable: true,
      configurable: true,
    });

    const exitSpy = vi.fn(() => Promise.resolve());
    document.exitFullscreen = exitSpy;

    player.toggleFullscreen();
    expect(exitSpy).toHaveBeenCalled();

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  it('toggleFullscreen handles requestFullscreen rejection gracefully', () => {
    container.requestFullscreen = vi.fn(() => Promise.reject(new Error('blocked')));
    expect(() => player.toggleFullscreen()).not.toThrow();
  });

  // ---- exportAs ----

  it('exportAs pauses playback, exports, then restores position', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.seek(0.5);
    player.play();
    expect(player.isPlaying).toBe(true);

    mockScene.export.mockResolvedValueOnce(new Blob());

    await player.exportAs('gif');

    expect(player.isPlaying).toBe(true);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.5);
  });

  it('exportAs restores state even on export error', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.seek(1.0);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockScene.export.mockRejectedValueOnce(new Error('export failed'));

    await player.exportAs('webm');

    expect(player.timeline.getCurrentTime()).toBeCloseTo(1.0);
    consoleSpy.mockRestore();
  });

  it('exportAs when not playing does not resume playback', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.seek(0.5);
    expect(player.isPlaying).toBe(false);

    mockScene.export.mockResolvedValueOnce(new Blob());

    await player.exportAs('mp4');

    expect(player.isPlaying).toBe(false);
  });

  // ---- loop option ----

  it('accepts loop option without error', () => {
    player.dispose();
    container.remove();
    mockScene = createMockSceneMethods();
    const { player: p, container: c } = createPlayer({ loop: true });
    expect((p as unknown as { _loop: boolean })._loop).toBe(true);
    p.dispose();
    c.remove();
    // Re-create for afterEach
    mockScene = createMockSceneMethods();
    const result = createPlayer();
    player = result.player;
    container = result.container;
  });

  // ---- fullscreenchange event ----

  it('responds to fullscreenchange by resizing scene', async () => {
    await player.sequence(async () => {});

    // Simulate entering fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      value: container,
      writable: true,
      configurable: true,
    });

    document.dispatchEvent(new Event('fullscreenchange'));
    expect(mockScene.resize).toHaveBeenCalled();
    expect(mockScene.render).toHaveBeenCalled();

    // Simulate exiting fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });

    mockScene.resize.mockClear();
    mockScene.render.mockClear();
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(mockScene.resize).toHaveBeenCalledWith(800, 450);
    expect(mockScene.render).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// _startLoop render-loop tests
// ---------------------------------------------------------------------------

describe('Player _startLoop render loop', () => {
  let player: Player;
  let container: HTMLElement;
  let rafCallbacks: Array<(time: number) => void>;
  let originalRaf: typeof requestAnimationFrame;
  let originalCaf: typeof cancelAnimationFrame;
  let originalPerfNow: typeof performance.now;
  let rafIdCounter: number;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockSceneMethods();

    // Mock requestAnimationFrame to capture callbacks
    rafCallbacks = [];
    rafIdCounter = 1;
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;
    originalPerfNow = performance.now;

    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb as (time: number) => void);
        return rafIdCounter++;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(performance, 'now').mockReturnValue(0);

    const result = createPlayer();
    player = result.player;
    container = result.container;
  });

  afterEach(() => {
    player.dispose();
    container.remove();
    vi.unstubAllGlobals();
  });

  /** Flush all pending rAF callbacks at the given timestamp */
  function flushRaf(time: number) {
    const cbs = rafCallbacks.splice(0);
    for (const cb of cbs) cb(time);
  }

  it('_startLoop schedules requestAnimationFrame and loop calls update/render/UI', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    mockScene.render.mockClear();
    player.play();

    // The first rAF is scheduled; flush it with enough elapsed time (> 14ms)
    flushRaf(20);

    expect(mockScene.render).toHaveBeenCalled();
    // Timeline should have advanced
    expect(player.timeline.getCurrentTime()).toBeGreaterThan(0);
  });

  it('_startLoop skips frame when elapsed < 14ms', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.play();
    mockScene.render.mockClear();

    // Flush with only 5ms elapsed — too fast, should skip
    flushRaf(5);

    // Render should NOT have been called because elapsed < 14
    expect(mockScene.render).not.toHaveBeenCalled();
    // Timeline should still be at 0
    expect(player.timeline.getCurrentTime()).toBe(0);
  });

  it('_startLoop stops when not playing', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.play();
    player.pause();
    mockScene.render.mockClear();

    // Flush — loop should exit early because _isPlaying is false
    flushRaf(20);

    expect(mockScene.render).not.toHaveBeenCalled();
  });

  it('_startLoop handles finished + loop: seeks to 0 and continues', async () => {
    player.dispose();
    container.remove();
    mockScene = createMockSceneMethods();
    const result = createPlayer({ loop: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.wait(0.5);
    });

    player.play();
    mockScene.render.mockClear();

    // Flush with enough time to finish the timeline (500ms + more)
    flushRaf(600);

    // With loop=true, timeline should have been reset to 0 and still playing
    expect(player.isPlaying).toBe(true);
    expect(player.timeline.getCurrentTime()).toBe(0);
  });

  it('_startLoop handles finished + no loop: shows replay and stops', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(0.5);
    });

    player.play();

    // Flush with enough time to finish the timeline
    flushRaf(600);

    // With loop=false (default), playback should stop
    expect(player.isPlaying).toBe(false);
  });

  it('_startLoop does not double-start when called while already running', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.play();
    const rafCountAfterPlay = rafCallbacks.length;

    // Calling play again should not add more rAF callbacks
    // because _animFrameId is already set
    (player as unknown as { _startLoop: () => void })._startLoop();
    expect(rafCallbacks.length).toBe(rafCountAfterPlay);
  });

  it('_startLoop updates mobject updaters', async () => {
    const mockMob = { update: vi.fn() };
    mockScene.mobjects.add(mockMob);

    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.play();

    // Flush with sufficient elapsed time
    flushRaf(20);

    expect(mockMob.update).toHaveBeenCalled();
  });

  it('_startLoop applies playback rate to dt', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(10);
    });

    player.setPlaybackRate(2);
    player.play();
    mockScene.render.mockClear();

    // Flush at 100ms elapsed
    flushRaf(100);

    // With rate=2, dt should be (100/1000)*2 = 0.2s
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.2, 1);
  });
});

// ---------------------------------------------------------------------------
// RecordingScene pass-through methods
// ---------------------------------------------------------------------------

describe('RecordingScene pass-through methods', () => {
  let player: Player;
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScene = createMockSceneMethods();
    const result = createPlayer();
    player = result.player;
    container = result.container;
  });

  afterEach(() => {
    player.dispose();
    container.remove();
  });

  it('add delegates to scene.add', async () => {
    await player.sequence(async (scene) => {
      scene.add('fake-mobject' as never);
    });
    expect(mockScene.add).toHaveBeenCalledWith('fake-mobject');
  });

  it('remove delegates to scene.remove', async () => {
    await player.sequence(async (scene) => {
      scene.remove('fake-mobject' as never);
    });
    expect(mockScene.remove).toHaveBeenCalledWith('fake-mobject');
  });

  it('camera passes through to scene.camera', async () => {
    await player.sequence(async (scene) => {
      expect(scene.camera).toBe(mockScene.camera);
    });
  });

  it('batch delegates to scene.batch', async () => {
    const callback = vi.fn();
    await player.sequence(async (scene) => {
      scene.batch(callback);
    });
    expect(mockScene.batch).toHaveBeenCalled();
    expect(callback).toHaveBeenCalled();
  });

  it('play with no animations is a no-op', async () => {
    await player.sequence(async (scene) => {
      await scene.play();
    });
    // No segments should be added since play() with 0 animations returns early
    expect(player.timeline.segmentCount).toBe(0);
  });

  it('play records animation segments into the timeline', async () => {
    const mockMobject = {
      _dirty: false,
      _syncToThree: vi.fn(),
      opacity: 1,
    };
    const mockAnimation = {
      mobject: mockMobject,
      duration: 1,
      begin: vi.fn(),
      reset: vi.fn(),
      update: vi.fn(),
      isFinished: vi.fn(() => false),
      startTime: null as number | null,
    };

    await player.sequence(async (scene) => {
      await scene.play(mockAnimation as never);
    });

    expect(mockAnimation.begin).toHaveBeenCalled();
    expect(mockScene.add).toHaveBeenCalledWith(mockMobject);
    expect(player.timeline.segmentCount).toBe(1);
    expect(player.timeline.getDuration()).toBeCloseTo(1.0);
  });

  it('play syncs dirty mobjects before begin', async () => {
    const mockMobject = {
      _dirty: true,
      _syncToThree: vi.fn(),
      opacity: 1,
    };
    const mockAnimation = {
      mobject: mockMobject,
      duration: 0.5,
      begin: vi.fn(),
      reset: vi.fn(),
      update: vi.fn(),
      isFinished: vi.fn(() => false),
      startTime: null as number | null,
    };

    await player.sequence(async (scene) => {
      await scene.play(mockAnimation as never);
    });

    expect(mockMobject._syncToThree).toHaveBeenCalled();
    expect(mockMobject._dirty).toBe(false);
  });

  it('play does not re-add mobjects already in scene', async () => {
    const mockMobject = {
      _dirty: false,
      _syncToThree: vi.fn(),
      opacity: 1,
    };
    const mockAnimation = {
      mobject: mockMobject,
      duration: 1,
      begin: vi.fn(),
      reset: vi.fn(),
      update: vi.fn(),
      isFinished: vi.fn(() => false),
      startTime: null as number | null,
    };

    // Pre-add the mobject to the scene's mobjects set
    mockScene.mobjects.add(mockMobject);

    await player.sequence(async (scene) => {
      await scene.play(mockAnimation as never);
    });

    // add should NOT be called for this mobject since it's already present
    expect(mockScene.add).not.toHaveBeenCalledWith(mockMobject);
  });

  it('wait with default duration records 1s segment', async () => {
    await player.sequence(async (scene) => {
      await scene.wait();
    });

    expect(player.timeline.getDuration()).toBeCloseTo(1.0);
    expect(player.timeline.segmentCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// PlayerController tests
// ---------------------------------------------------------------------------

describe('PlayerController', () => {
  let container: HTMLElement;
  let callbacks: PlayerControllerCallbacks;
  let controller: PlayerController;

  beforeEach(() => {
    container = createContainer();
    callbacks = {
      onPlayPause: vi.fn(),
      onPrev: vi.fn(),
      onNext: vi.fn(),
      onSeek: vi.fn(),
      onFullscreen: vi.fn(),
      getCurrentTime: vi.fn(() => 5),
      getDuration: vi.fn(() => 10),
    };
    controller = new PlayerController(container, callbacks);
  });

  afterEach(() => {
    controller.dispose();
    container.remove();
  });

  // ---- Setup ----

  it('sets tabindex on container if not present', () => {
    expect(container.getAttribute('tabindex')).toBe('0');
    // happy-dom may expand shorthand; just check it contains 'none'
    expect(container.style.outline).toContain('none');
  });

  it('does not override existing tabindex', () => {
    const c2 = document.createElement('div');
    c2.setAttribute('tabindex', '-1');
    document.body.appendChild(c2);

    const ctrl2 = new PlayerController(c2, callbacks);
    expect(c2.getAttribute('tabindex')).toBe('-1');

    ctrl2.dispose();
    c2.remove();
  });

  // ---- Key: Space ----

  it('Space key triggers onPlayPause', () => {
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('k key triggers onPlayPause', () => {
    const event = new KeyboardEvent('keydown', { key: 'k', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1);
  });

  // ---- Key: ArrowLeft ----

  it('ArrowLeft triggers onPrev', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onPrev).toHaveBeenCalledTimes(1);
  });

  it('Shift+ArrowLeft triggers onSeek with -1s', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      shiftKey: true,
      bubbles: true,
    });
    container.dispatchEvent(event);
    expect(callbacks.onSeek).toHaveBeenCalledWith(4); // 5 - 1 = 4
    expect(callbacks.onPrev).not.toHaveBeenCalled();
  });

  it('Shift+ArrowLeft clamps to 0', () => {
    (callbacks.getCurrentTime as ReturnType<typeof vi.fn>).mockReturnValue(0.3);
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      shiftKey: true,
      bubbles: true,
    });
    container.dispatchEvent(event);
    expect(callbacks.onSeek).toHaveBeenCalledWith(0);
  });

  // ---- Key: ArrowRight ----

  it('ArrowRight triggers onNext', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onNext).toHaveBeenCalledTimes(1);
  });

  it('Shift+ArrowRight triggers onSeek with +1s', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      shiftKey: true,
      bubbles: true,
    });
    container.dispatchEvent(event);
    expect(callbacks.onSeek).toHaveBeenCalledWith(6); // 5 + 1 = 6
    expect(callbacks.onNext).not.toHaveBeenCalled();
  });

  it('Shift+ArrowRight clamps to duration', () => {
    (callbacks.getCurrentTime as ReturnType<typeof vi.fn>).mockReturnValue(9.5);
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      shiftKey: true,
      bubbles: true,
    });
    container.dispatchEvent(event);
    expect(callbacks.onSeek).toHaveBeenCalledWith(10);
  });

  // ---- Key: f ----

  it('f key triggers onFullscreen', () => {
    const event = new KeyboardEvent('keydown', { key: 'f', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onFullscreen).toHaveBeenCalledTimes(1);
  });

  it('F key triggers onFullscreen', () => {
    const event = new KeyboardEvent('keydown', { key: 'F', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onFullscreen).toHaveBeenCalledTimes(1);
  });

  // ---- Key: Home / End ----

  it('Home key seeks to 0', () => {
    const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onSeek).toHaveBeenCalledWith(0);
  });

  it('End key seeks to duration', () => {
    const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onSeek).toHaveBeenCalledWith(10);
  });

  // ---- Ignores input elements ----

  it('ignores keydown events on INPUT elements', () => {
    const input = document.createElement('input');
    container.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    Object.defineProperty(event, 'target', { value: input });
    container.dispatchEvent(event);

    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('ignores keydown events on TEXTAREA elements', () => {
    const textarea = document.createElement('textarea');
    container.appendChild(textarea);

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea });
    container.dispatchEvent(event);

    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('ignores keydown events on SELECT elements', () => {
    const select = document.createElement('select');
    container.appendChild(select);

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    Object.defineProperty(event, 'target', { value: select });
    container.dispatchEvent(event);

    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  // ---- Click on canvas ----

  it('click on container triggers onPlayPause', () => {
    container.click();
    expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('click on player-bar element does NOT trigger onPlayPause', () => {
    const barElement = document.createElement('div');
    barElement.setAttribute('data-player-bar', '');
    container.appendChild(barElement);

    barElement.click();
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  it('click inside nested player-bar element does NOT trigger onPlayPause', () => {
    const barElement = document.createElement('div');
    barElement.setAttribute('data-player-bar', '');
    const button = document.createElement('button');
    barElement.appendChild(button);
    container.appendChild(barElement);

    button.click();
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  // ---- Focus on mousedown ----

  it('mousedown focuses the container', () => {
    const focusSpy = vi.spyOn(container, 'focus');
    container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(focusSpy).toHaveBeenCalled();
  });

  // ---- Dispose ----

  it('dispose removes keydown listener', () => {
    controller.dispose();

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    container.dispatchEvent(event);
    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
  });

  // ---- Unknown keys do nothing ----

  it('unrecognized key does not trigger any callback', () => {
    const event = new KeyboardEvent('keydown', { key: 'q', bubbles: true });
    container.dispatchEvent(event);

    expect(callbacks.onPlayPause).not.toHaveBeenCalled();
    expect(callbacks.onPrev).not.toHaveBeenCalled();
    expect(callbacks.onNext).not.toHaveBeenCalled();
    expect(callbacks.onSeek).not.toHaveBeenCalled();
    expect(callbacks.onFullscreen).not.toHaveBeenCalled();
  });
});
