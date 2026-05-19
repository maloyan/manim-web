// @vitest-environment happy-dom
// happy-dom is needed for DOM manipulation (Player creates PlayerUI elements,
// PlayerController attaches keyboard/mouse listeners to container elements).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Player, PlayerOptions } from './Player';
import { PlayerController, PlayerControllerCallbacks } from './PlayerController';

// ---------------------------------------------------------------------------
// Helper: create a container and Player (headless Scene, no WebGL needed)
// ---------------------------------------------------------------------------

function createContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function createPlayer(opts: PlayerOptions = {}): { player: Player; container: HTMLElement } {
  const container = createContainer();
  const player = new Player(container, { width: 800, height: 450, headless: true, ...opts });
  return { player, container };
}

function createMockAnimation(overrides: { dirty?: boolean; duration?: number } = {}) {
  const mockMobject = {
    _dirty: overrides.dirty ?? false,
    _syncToThree: vi.fn(),
    opacity: 1,
    dispose: vi.fn(),
  };
  const mockAnimation = {
    mobject: mockMobject,
    duration: overrides.duration ?? 1,
    begin: vi.fn(),
    reset: vi.fn(),
    update: vi.fn(),
    isFinished: vi.fn(() => false),
    startTime: null as number | null,
  };
  return { mockMobject, mockAnimation };
}

// ---------------------------------------------------------------------------
// Player tests
// ---------------------------------------------------------------------------

describe('Player', () => {
  let player: Player;
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('captures original dimensions when toggleFullscreen is called (issue #360)', () => {
    // Pre-toggle: _orig stays at construction default (0) — captured lazily
    // so any auto-resize before fullscreen is not snapshotted.
    expect((player as any)._origWidth).toBe(0);
    expect((player as any)._origHeight).toBe(0);

    // happy-dom does not implement requestFullscreen; stub it to a no-op so
    // toggleFullscreen() runs to completion.
    (container as any).requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      configurable: true,
    });

    player.toggleFullscreen();

    expect((player as any)._origWidth).toBe(800);
    expect((player as any)._origHeight).toBe(450);
  });

  // ---- Disposal ----

  it('dispose cleans up scene and stops loop', () => {
    const disposeSpy = vi.spyOn(player.scene, 'dispose');
    player.dispose();
    expect(disposeSpy).toHaveBeenCalled();
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
    const renderSpy = vi.spyOn(player.scene, 'render');
    await player.sequence(async () => {
      // No-op builder
    });
    expect(renderSpy).toHaveBeenCalled();
  });

  it('sequence with autoPlay starts playback', async () => {
    player.dispose();
    container.remove();

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

    const renderSpy = vi.spyOn(player.scene, 'render');
    player.seek(1.0);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(1.0);
    expect(renderSpy).toHaveBeenCalled();
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

    vi.spyOn(player.scene, 'export').mockResolvedValueOnce(new Blob());

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
    vi.spyOn(player.scene, 'export').mockRejectedValueOnce(new Error('export failed'));

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

    vi.spyOn(player.scene, 'export').mockResolvedValueOnce(new Blob());

    await player.exportAs('mp4');

    expect(player.isPlaying).toBe(false);
  });

  // ---- slidesMode option ----

  it('accepts slidesMode option', () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    expect((p as unknown as { _slidesMode: boolean })._slidesMode).toBe(true);
    p.dispose();
    c.remove();
    const result = createPlayer();
    player = result.player;
    container = result.container;
  });

  it('slidesMode defaults to false', () => {
    expect((player as unknown as { _slidesMode: boolean })._slidesMode).toBe(false);
  });

  it('nextSegment in slidesMode plays from current position instead of jumping', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.wait(1);
      await scene.wait(1);
    });

    // In slides mode, nextSegment should start playing (not jump)
    player.nextSegment();
    expect(player.isPlaying).toBe(true);
    // Should still be at 0 (playing, not jumped)
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0);
  });

  it('nextSegment in slidesMode does nothing at end of timeline', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    await player.sequence(async (scene) => {
      await scene.wait(1);
    });

    // Seek to end
    player.seek(1);
    player.nextSegment();
    expect(player.isPlaying).toBe(false);
  });

  it('prevSegment in slidesMode seeks to previous segment and pauses', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.wait(1);
    });

    // Seek 0.8s into second segment (>0.5 threshold -> goes to start of current)
    player.seek(1.8);
    player.prevSegment();
    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(1.0);
  });

  // ---- per-slide loop ----

  it('public seek clears _activeLoopSlideIndex', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.wait(1);
    });

    const internal = player as unknown as { _activeLoopSlideIndex: number | null };
    internal._activeLoopSlideIndex = 0;
    player.seek(0.5);
    expect(internal._activeLoopSlideIndex).toBeNull();
  });

  it('setSlidesMode(false) clears active loop state', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    await player.sequence(async (scene) => {
      await scene.wait(1);
    });

    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    internal._activeLoopSlideIndex = 0;
    internal._slidesTargetSlideIndex = 0;
    player.setSlidesMode(false);
    expect(internal._activeLoopSlideIndex).toBeNull();
    expect(internal._slidesTargetSlideIndex).toBe(-1);
  });

  it('prevSegment from inside an active loop always exits to previous slide', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.nextSlide({ loop: true });
      await scene.wait(1);
    });

    // Test the phase-independent behavior: even >0.5s into the loop cycle,
    // ← should go to the previous slide (not restart the loop).
    player.seek(1.6);
    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    internal._activeLoopSlideIndex = 1;

    player.prevSegment();
    expect(internal._activeLoopSlideIndex).toBeNull();
    expect(internal._slidesTargetSlideIndex).toBe(-1);
    // Lands at slide 0's start regardless of where we were in the loop.
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0);
  });

  it('public seek out of an active loop clears both loop and target state', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    await player.sequence(async (scene) => {
      await scene.wait(1);
      await scene.wait(1);
    });

    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    internal._activeLoopSlideIndex = 0;
    internal._slidesTargetSlideIndex = 0;
    // Seek FAR past the loop segment — if the target stayed at 0, the next
    // render tick would snap back into the old loop.
    player.seek(1.5);
    expect(internal._activeLoopSlideIndex).toBeNull();
    expect(internal._slidesTargetSlideIndex).toBe(-1);
  });

  it('sequence() resets active loop state', async () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ slidesMode: true });
    player = p;
    container = c;

    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    internal._activeLoopSlideIndex = 0;
    internal._slidesTargetSlideIndex = 0;

    await player.sequence(async (scene) => {
      await scene.wait(1);
    });

    expect(internal._activeLoopSlideIndex).toBeNull();
    expect(internal._slidesTargetSlideIndex).toBe(-1);
  });

  // ---- loop option ----

  it('accepts loop option without error', () => {
    player.dispose();
    container.remove();
    const { player: p, container: c } = createPlayer({ loop: true });
    expect((p as unknown as { _loop: boolean })._loop).toBe(true);
    p.dispose();
    c.remove();
    // Re-create for afterEach
    const result = createPlayer();
    player = result.player;
    container = result.container;
  });

  // ---- fullscreenchange event ----

  it('responds to fullscreenchange by resizing scene', async () => {
    await player.sequence(async () => {});

    const resizeSpy = vi.spyOn(player.scene, 'resize');
    const renderSpy = vi.spyOn(player.scene, 'render');

    // toggleFullscreen() snapshots the pre-fullscreen size before the request.
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });
    (container as any).requestFullscreen = vi.fn().mockResolvedValue(undefined);
    player.toggleFullscreen();

    // Simulate entering fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      value: container,
      writable: true,
      configurable: true,
    });

    document.dispatchEvent(new Event('fullscreenchange'));
    expect(resizeSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();

    // Simulate exiting fullscreen
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });

    resizeSpy.mockClear();
    renderSpy.mockClear();
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(resizeSpy).toHaveBeenCalledWith(800, 450);
    expect(renderSpy).toHaveBeenCalled();
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

    const renderSpy = vi.spyOn(player.scene, 'render');
    player.play();

    // The first rAF is scheduled; flush it with enough elapsed time (> 14ms)
    flushRaf(20);

    expect(renderSpy).toHaveBeenCalled();
    // Timeline should have advanced
    expect(player.timeline.getCurrentTime()).toBeGreaterThan(0);
  });

  it('_startLoop skips frame when elapsed < 14ms', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.play();
    const renderSpy = vi.spyOn(player.scene, 'render');

    // Flush with only 5ms elapsed — too fast, should skip
    flushRaf(5);

    // Render should NOT have been called because elapsed < 14
    expect(renderSpy).not.toHaveBeenCalled();
    // Timeline should still be at 0
    expect(player.timeline.getCurrentTime()).toBe(0);
  });

  it('_startLoop stops when not playing', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.play();
    player.pause();
    const renderSpy = vi.spyOn(player.scene, 'render');

    // Flush — loop should exit early because _isPlaying is false
    flushRaf(20);

    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('_startLoop handles finished + loop: seeks to 0 and continues', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ loop: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.wait(0.5);
    });

    player.play();

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
    const mockMob = { update: vi.fn(), dispose: vi.fn() };
    (player.scene.mobjects as Set<unknown>).add(mockMob);

    await player.sequence(async (scene) => {
      await scene.wait(2);
    });

    player.play();

    // Flush with sufficient elapsed time
    flushRaf(20);

    expect(mockMob.update).toHaveBeenCalled();
  });

  it('_startLoop auto-pauses at segment boundary in slidesMode', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.wait(0.5);
      await scene.wait(0.5);
    });

    player.play();

    // Flush past the first segment boundary (500ms + buffer)
    flushRaf(600);

    // In slides mode, should auto-pause at the segment boundary
    expect(player.isPlaying).toBe(false);
    // Time should be clamped to the end of the first segment
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.5);
  });

  it('_startLoop rewinds and keeps playing on looped slide boundary in slidesMode', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true });
      await scene.wait(0.5);
      await scene.nextSlide();
      await scene.wait(0.5);
    });

    player.play();
    flushRaf(600); // past slide 0's endTime

    // Loop should have rewound, NOT paused
    expect(player.isPlaying).toBe(true);
    const t = player.timeline.getCurrentTime();
    expect(t).toBeGreaterThanOrEqual(0);
    expect(t).toBeLessThan(0.5);
    const internal = player as unknown as { _activeLoopSlideIndex: number | null };
    expect(internal._activeLoopSlideIndex).toBe(0);
  });

  it('_startLoop rewinds when loop is the final slide (re-plays the underlying timeline)', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true });
      await scene.wait(0.3);
    });

    player.play();
    flushRaf(400); // past timeline duration

    expect(player.isPlaying).toBe(true);
    // The masterTimeline must be playing again after seek-back, otherwise
    // currentTime would freeze at 0 and the next update would no-op.
    expect(player.timeline.isPlaying()).toBe(true);

    // Advance another frame: time should keep moving forward from the rewind.
    const before = player.timeline.getCurrentTime();
    flushRaf(420);
    // Strictly greater: a frozen-time bug (timeline left paused) would pass `>=`.
    expect(player.timeline.getCurrentTime()).toBeGreaterThan(before);
  });

  it('nextSegment from active loop advances to next slide and keeps playing', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true });
      await scene.wait(0.5);
      await scene.nextSlide();
      await scene.wait(0.5);
    });

    player.play();
    flushRaf(600); // triggers rewind: _activeLoopSlideIndex = 0

    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    expect(internal._activeLoopSlideIndex).toBe(0);

    player.nextSegment();
    expect(internal._activeLoopSlideIndex).toBeNull();
    expect(internal._slidesTargetSlideIndex).toBe(1);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.5);
    expect(player.isPlaying).toBe(true);
  });

  it('nextSegment on a final loop slide seeks to endTime and pauses', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true });
      await scene.wait(0.3);
    });

    player.play();
    flushRaf(400);

    const internal = player as unknown as { _activeLoopSlideIndex: number | null };
    expect(internal._activeLoopSlideIndex).toBe(0);

    player.nextSegment();
    expect(internal._activeLoopSlideIndex).toBeNull();
    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.3);
  });

  it('_startLoop ignores loop flag when slidesMode is OFF', async () => {
    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true });
      await scene.wait(0.3);
      await scene.nextSlide();
      await scene.wait(0.5);
    });

    player.play();
    flushRaf(400);

    // Without slides mode, the loop flag is a no-op: playback advances past
    // slide 0 normally.
    expect(player.isPlaying).toBe(true);
    expect(player.timeline.getCurrentTime()).toBeGreaterThan(0.3);
    const internal = player as unknown as { _activeLoopSlideIndex: number | null };
    expect(internal._activeLoopSlideIndex).toBeNull();
  });

  it('_startLoop auto-advances to next slide when current slide has autoNext', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ autoNext: true });
      await scene.wait(0.3);
      await scene.nextSlide();
      await scene.wait(0.3);
    });

    player.play();
    // Past slide 0's endTime — autoNext should seek to slide 1 start and keep playing.
    flushRaf(400);

    expect(player.isPlaying).toBe(true);
    const internal = player as unknown as { _slidesTargetSlideIndex: number };
    expect(internal._slidesTargetSlideIndex).toBe(1);
    // Time should be inside slide 1's range (slide 0 was 0..0.3, slide 1 is 0.3..0.6)
    const t = player.timeline.getCurrentTime();
    expect(t).toBeGreaterThanOrEqual(0.3);
    expect(t).toBeLessThanOrEqual(0.6);
  });

  it('_startLoop pauses normally when autoNext is on the final slide', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ autoNext: true });
      await scene.wait(0.3);
    });

    player.play();
    flushRaf(400);

    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.3);
  });

  it('loop wins over autoNext when both are set on a slide', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true, autoNext: true });
      await scene.wait(0.3);
      await scene.nextSlide();
      await scene.wait(0.3);
    });

    player.play();
    flushRaf(400);

    // Loop rewound, did not advance to slide 1.
    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    expect(internal._activeLoopSlideIndex).toBe(0);
    expect(internal._slidesTargetSlideIndex).toBe(0);
    expect(player.isPlaying).toBe(true);
  });

  it('chained autoNext slides advance through the whole chain', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ autoNext: true });
      await scene.wait(0.2);
      await scene.nextSlide({ autoNext: true });
      await scene.wait(0.2);
      await scene.nextSlide();
      await scene.wait(0.2);
    });

    player.play();
    // Play long enough for slide 0 → slide 1 → slide 2; each is 0.2s.
    for (let i = 0; i < 100; i++) flushRaf(100 + i * 20);

    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.6);
  });

  it('autoNext into a looping slide rewinds rather than pausing', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ autoNext: true });
      await scene.wait(0.2);
      await scene.nextSlide({ loop: true });
      await scene.wait(0.3);
    });

    player.play();
    // Slide 0 autoNexts into slide 1, then slide 1 should loop.
    for (let i = 0; i < 100; i++) flushRaf(100 + i * 20);

    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    expect(internal._activeLoopSlideIndex).toBe(1);
    expect(internal._slidesTargetSlideIndex).toBe(1);
    expect(player.isPlaying).toBe(true);
    // Time stays bounded inside slide 1 [0.2, 0.5]
    const t = player.timeline.getCurrentTime();
    expect(t).toBeGreaterThanOrEqual(0.2);
    expect(t).toBeLessThanOrEqual(0.5);
  });

  it('public seek inside the current target slide preserves loop+target state', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true });
      await scene.wait(1);
      await scene.nextSlide();
      await scene.wait(0.5);
    });

    const internal = player as unknown as {
      _activeLoopSlideIndex: number | null;
      _slidesTargetSlideIndex: number;
    };
    internal._activeLoopSlideIndex = 0;
    internal._slidesTargetSlideIndex = 0;

    // Scrub within slide 0's range (0..1) — must NOT silently kill the loop.
    player.seek(0.4);
    expect(internal._activeLoopSlideIndex).toBe(0);
    expect(internal._slidesTargetSlideIndex).toBe(0);

    // Scrub outside the target slide — clears state.
    player.seek(1.2);
    expect(internal._activeLoopSlideIndex).toBeNull();
    expect(internal._slidesTargetSlideIndex).toBe(-1);
  });

  it('autoPlay + slidesMode + autoNext walks through the whole deck', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true, autoPlay: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide({ autoNext: true });
      await scene.wait(0.2);
      await scene.nextSlide({ autoNext: true });
      await scene.wait(0.2);
      await scene.nextSlide();
      await scene.wait(0.2);
    });

    // autoPlay armed the player; flush enough to traverse 0.6s.
    for (let i = 0; i < 100; i++) flushRaf(100 + i * 20);

    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.6);
  });

  it('non-slidesMode navigation steps by segment, not by slide', async () => {
    // No slidesMode → nextSegment/prevSegment must move one segment at a time
    // even when the timeline has multi-play slides.
    await player.sequence(async (scene) => {
      await scene.nextSlide();
      await scene.wait(0.5);
      await scene.wait(0.5); // same multi-play slide as the wait above
      await scene.nextSlide();
      await scene.wait(0.5);
    });

    // Should have 2 slides, 3 segments.
    expect(player.timeline.slideCount).toBe(2);
    expect(player.timeline.segmentCount).toBe(3);

    player.nextSegment();
    // Advanced to segment 1's start (0.5s) — within slide 0, not slide 1.
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.5);
    player.nextSegment();
    // Advanced to segment 2's start (1.0s) — start of slide 1.
    expect(player.timeline.getCurrentTime()).toBeCloseTo(1.0);
  });

  it('_startLoop disarms stale _slidesTargetSlideIndex instead of asserting', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.wait(0.3);
    });
    const internal = player as unknown as { _slidesTargetSlideIndex: number };
    // Point at a slide that does not exist.
    internal._slidesTargetSlideIndex = 99;
    player.play();
    flushRaf(400);

    // Should have self-healed rather than throwing or freezing playback.
    expect(internal._slidesTargetSlideIndex).toBe(-1);
  });

  it('multi-play slide is treated as a single slide for navigation', async () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ slidesMode: true });
    player = result.player;
    container = result.container;

    await player.sequence(async (scene) => {
      await scene.nextSlide();
      await scene.wait(0.2);
      await scene.wait(0.2); // same slide
      await scene.nextSlide();
      await scene.wait(0.2);
    });

    expect(player.timeline.slideCount).toBe(2);
    const [s0, s1] = player.timeline.getSlides();
    expect(s0.startSegmentIndex).toBe(0);
    expect(s0.endSegmentIndex).toBe(1);
    expect(s0.endTime).toBeCloseTo(0.4);
    expect(s1.startSegmentIndex).toBe(2);

    // Play through slide 0 — should pause at endTime of slide 0 (= 0.4)
    player.play();
    flushRaf(500);
    expect(player.isPlaying).toBe(false);
    expect(player.timeline.getCurrentTime()).toBeCloseTo(0.4);
  });

  it('_startLoop does NOT auto-pause at segment boundary without slidesMode', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(0.5);
      await scene.wait(0.5);
    });

    player.play();

    // Flush past the first segment boundary
    flushRaf(600);

    // Without slides mode, should keep playing (or finish naturally)
    // The timeline total is 1s, 600ms elapsed means it's still going
    expect(player.isPlaying).toBe(true);
  });

  it('_startLoop applies playback rate to dt', async () => {
    await player.sequence(async (scene) => {
      await scene.wait(10);
    });

    player.setPlaybackRate(2);
    player.play();

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
    const result = createPlayer();
    player = result.player;
    container = result.container;
  });

  afterEach(() => {
    player.dispose();
    container.remove();
  });

  it('add delegates to scene.add', async () => {
    const addSpy = vi.spyOn(player.scene, 'add').mockReturnThis();
    await player.sequence(async (scene) => {
      scene.add('fake-mobject' as never);
    });
    expect(addSpy).toHaveBeenCalledWith('fake-mobject');
    addSpy.mockRestore();
  });

  it('remove delegates to scene.remove', async () => {
    const removeSpy = vi.spyOn(player.scene, 'remove').mockReturnThis();
    await player.sequence(async (scene) => {
      scene.remove('fake-mobject' as never);
    });
    expect(removeSpy).toHaveBeenCalledWith('fake-mobject');
    removeSpy.mockRestore();
  });

  it('camera passes through to scene.camera', async () => {
    await player.sequence(async (scene) => {
      expect(scene.camera).toBe(player.scene.camera);
    });
  });

  it('batch delegates to scene.batch', async () => {
    const batchSpy = vi.spyOn(player.scene, 'batch');
    const callback = vi.fn();
    await player.sequence(async (scene) => {
      scene.batch(callback);
    });
    expect(batchSpy).toHaveBeenCalled();
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
    const { mockMobject, mockAnimation } = createMockAnimation();
    const addSpy = vi.spyOn(player.scene, 'add').mockReturnThis();

    await player.sequence(async (scene) => {
      await scene.play(mockAnimation as never);
    });

    expect(mockAnimation.begin).toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledWith(mockMobject);
    expect(player.timeline.segmentCount).toBe(1);
    expect(player.timeline.getDuration()).toBeCloseTo(1.0);
    addSpy.mockRestore();
  });

  it('play syncs dirty mobjects before begin', async () => {
    const { mockMobject, mockAnimation } = createMockAnimation({ dirty: true, duration: 0.5 });
    const addSpy = vi.spyOn(player.scene, 'add').mockReturnThis();

    await player.sequence(async (scene) => {
      await scene.play(mockAnimation as never);
    });

    expect(mockMobject._syncToThree).toHaveBeenCalled();
    expect(mockMobject._dirty).toBe(false);
    addSpy.mockRestore();
  });

  it('play does not re-add mobjects already in scene', async () => {
    const { mockMobject, mockAnimation } = createMockAnimation();

    // Pre-add the mobject to the scene's mobjects set
    (player.scene.mobjects as Set<unknown>).add(mockMobject);

    const addSpy = vi.spyOn(player.scene, 'add').mockReturnThis();

    await player.sequence(async (scene) => {
      await scene.play(mockAnimation as never);
    });

    // add should NOT be called for this mobject since it's already present
    expect(addSpy).not.toHaveBeenCalledWith(mockMobject);
    addSpy.mockRestore();
  });

  it('wait with default duration records 1s segment', async () => {
    await player.sequence(async (scene) => {
      await scene.wait();
    });

    expect(player.timeline.getDuration()).toBeCloseTo(1.0);
    expect(player.timeline.segmentCount).toBe(1);
  });

  it('nextSlide({loop:true}) before play() produces a looping slide', async () => {
    const { mockAnimation } = createMockAnimation();
    const addSpy = vi.spyOn(player.scene, 'add').mockReturnThis();

    await player.sequence(async (scene) => {
      await scene.nextSlide({ loop: true });
      await scene.play(mockAnimation as never);
    });

    expect(player.timeline.slideCount).toBe(1);
    expect(player.timeline.getSlides()[0].loop).toBe(true);
    addSpy.mockRestore();
  });

  it('default play() produces a slide with loop=false, autoNext=false', async () => {
    const { mockAnimation } = createMockAnimation();
    const addSpy = vi.spyOn(player.scene, 'add').mockReturnThis();

    await player.sequence(async (scene) => {
      await scene.play(mockAnimation as never);
    });

    const slide = player.timeline.getSlides()[0];
    expect(slide.loop).toBe(false);
    expect(slide.autoNext).toBe(false);
    addSpy.mockRestore();
  });

  it('nextSlide() inside sequence groups subsequent plays into one slide', async () => {
    const a1 = createMockAnimation();
    const a2 = createMockAnimation();
    const a3 = createMockAnimation();
    const addSpy = vi.spyOn(player.scene, 'add').mockReturnThis();

    await player.sequence(async (scene) => {
      await scene.nextSlide();
      await scene.play(a1.mockAnimation as never);
      await scene.play(a2.mockAnimation as never);
      await scene.nextSlide();
      await scene.play(a3.mockAnimation as never);
    });

    expect(player.timeline.slideCount).toBe(2);
    expect(player.timeline.segmentCount).toBe(3);
    const [s0, s1] = player.timeline.getSlides();
    expect(s0.endSegmentIndex - s0.startSegmentIndex).toBe(1); // 2 segments
    expect(s1.endSegmentIndex - s1.startSegmentIndex).toBe(0); // 1 segment
    addSpy.mockRestore();
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
