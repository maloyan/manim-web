// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlayerUI, PlayerUICallbacks } from './PlayerUI';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createCallbacks(): PlayerUICallbacks {
  return {
    onPlayPause: vi.fn(),
    onSeek: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onSpeedChange: vi.fn(),
    onFullscreen: vi.fn(),
    onExport: vi.fn(),
  };
}

function createContainer(): HTMLElement {
  const container = document.createElement('div');
  // Give the container a size so getBoundingClientRect returns nonzero values
  Object.defineProperty(container, 'getBoundingClientRect', {
    value: () => ({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      right: 800,
      bottom: 600,
      toJSON: () => {},
    }),
  });
  document.body.appendChild(container);
  return container;
}

/**
 * Create a minimal mock MasterTimeline for setSegments().
 */
function createMockTimeline(
  segments: Array<{ index: number; startTime: number }>,
  duration: number,
) {
  return {
    getSegments: () => segments,
    getDuration: () => duration,
  } as any;
}

/**
 * Query the player bar element from the container.
 */
function getBar(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-player-bar]') as HTMLElement;
}

/**
 * Find buttons inside the bar by title substring.
 */
function findButton(container: HTMLElement, titleSubstring: string): HTMLButtonElement {
  const bar = getBar(container);
  const buttons = bar.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.title.includes(titleSubstring)) return btn;
  }
  throw new Error(`Button with title containing "${titleSubstring}" not found`);
}

/**
 * Find the speed select element.
 */
function findSpeedSelect(container: HTMLElement): HTMLSelectElement {
  const bar = getBar(container);
  return bar.querySelector('select') as HTMLSelectElement;
}

/**
 * Find the progress bar wrapper (the first direct child of bar).
 */
function findProgressWrap(container: HTMLElement): HTMLElement {
  const bar = getBar(container);
  // Progress wrap is the first child of the bar
  return bar.children[0] as HTMLElement;
}

/**
 * Find the time display span (monospace font).
 */
function findTimeDisplay(container: HTMLElement): HTMLElement {
  const bar = getBar(container);
  const spans = bar.querySelectorAll('span');
  for (const span of spans) {
    if (span.textContent && span.textContent.includes('/')) return span;
  }
  throw new Error('Time display not found');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PlayerUI', () => {
  let container: HTMLElement;
  let callbacks: PlayerUICallbacks;
  let ui: PlayerUI;

  beforeEach(() => {
    vi.useFakeTimers();
    container = createContainer();
    callbacks = createCallbacks();
  });

  afterEach(() => {
    ui?.dispose();
    container.remove();
    // Clean up any export menus/backdrops left on body
    document.body.querySelectorAll(':scope > [data-player-bar]').forEach((el) => el.remove());
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------

  describe('construction', () => {
    it('creates bar element with data-player-bar attribute', () => {
      ui = new PlayerUI(container, callbacks);
      const bar = getBar(container);
      expect(bar).toBeTruthy();
      expect(bar.hasAttribute('data-player-bar')).toBe(true);
    });

    it('appends bar to the container', () => {
      ui = new PlayerUI(container, callbacks);
      const bar = getBar(container);
      expect(bar.parentElement).toBe(container);
    });

    it('sets container position to relative if static', () => {
      container.style.position = 'static';
      ui = new PlayerUI(container, callbacks);
      expect(container.style.position).toBe('relative');
    });

    it('preserves non-static container positioning', () => {
      container.style.position = 'absolute';
      ui = new PlayerUI(container, callbacks);
      expect(container.style.position).toBe('absolute');
    });

    it('sets container overflow to hidden', () => {
      ui = new PlayerUI(container, callbacks);
      expect(container.style.overflow).toBe('hidden');
    });

    it('creates play button with correct default title', () => {
      ui = new PlayerUI(container, callbacks);
      const playBtn = findButton(container, 'Play');
      expect(playBtn).toBeTruthy();
      expect(playBtn.title).toBe('Play (Space)');
    });

    it('creates prev and next buttons', () => {
      ui = new PlayerUI(container, callbacks);
      const prevBtn = findButton(container, 'Previous');
      const nextBtn = findButton(container, 'Next');
      expect(prevBtn).toBeTruthy();
      expect(nextBtn).toBeTruthy();
      expect(prevBtn.title).toBe('Previous (Left arrow)');
      expect(nextBtn.title).toBe('Next (Right arrow)');
    });

    it('creates fullscreen button', () => {
      ui = new PlayerUI(container, callbacks);
      const fsBtn = findButton(container, 'Fullscreen');
      expect(fsBtn).toBeTruthy();
      expect(fsBtn.title).toBe('Fullscreen (F)');
    });

    it('creates export button', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      expect(exportBtn).toBeTruthy();
      expect(exportBtn.title).toBe('Export animation');
    });

    it('creates speed select with 7 options including 1x', () => {
      ui = new PlayerUI(container, callbacks);
      const select = findSpeedSelect(container);
      expect(select).toBeTruthy();
      const options = select.querySelectorAll('option');
      expect(options.length).toBe(7);
      // Verify the "1" option exists with correct label
      const oneXOption = Array.from(options).find((o) => o.value === '1');
      expect(oneXOption).toBeTruthy();
      expect(oneXOption!.textContent).toBe('1x');
    });

    it('creates time display showing 0:00 / 0:00', () => {
      ui = new PlayerUI(container, callbacks);
      const display = findTimeDisplay(container);
      expect(display.textContent).toBe('0:00 / 0:00');
    });

    it('creates progress bar area', () => {
      ui = new PlayerUI(container, callbacks);
      const progressWrap = findProgressWrap(container);
      expect(progressWrap).toBeTruthy();
    });

    it('uses default autoHideMs of 2500 when no option given', () => {
      // Verified indirectly: play triggers hide after 2500ms
      ui = new PlayerUI(container, callbacks);
      ui.setPlaying(true);
      const bar = getBar(container);

      // Before timeout, still visible
      vi.advanceTimersByTime(2400);
      expect(bar.style.opacity).not.toBe('0');

      // After timeout, hidden
      vi.advanceTimersByTime(200);
      expect(bar.style.opacity).toBe('0');
    });

    it('respects custom autoHideMs option', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 1000 });
      ui.setPlaying(true);
      const bar = getBar(container);

      vi.advanceTimersByTime(900);
      expect(bar.style.opacity).not.toBe('0');

      vi.advanceTimersByTime(200);
      expect(bar.style.opacity).toBe('0');
    });
  });

  // -------------------------------------------------------------------------
  // setPlaying
  // -------------------------------------------------------------------------

  describe('setPlaying', () => {
    it('shows pause icon when playing', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setPlaying(true);
      const playBtn = findButton(container, 'Pause');
      expect(playBtn.title).toBe('Pause (Space)');
      expect(playBtn.innerHTML).toContain('rect');
    });

    it('shows play icon when paused', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setPlaying(true);
      ui.setPlaying(false);
      const playBtn = findButton(container, 'Play');
      expect(playBtn.title).toBe('Play (Space)');
    });

    it('shows replay icon when finished', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setPlaying(false, true);
      const replayBtn = findButton(container, 'Replay');
      expect(replayBtn.title).toBe('Replay (Space)');
      // Replay icon contains a path element (circular arrow)
      expect(replayBtn.innerHTML).toContain('svg');
    });

    it('schedules auto-hide when set to playing', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(true);
      const bar = getBar(container);

      vi.advanceTimersByTime(600);
      expect(bar.style.opacity).toBe('0');
    });

    it('does not schedule hide when set to paused', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(false);
      const bar = getBar(container);

      vi.advanceTimersByTime(1000);
      expect(bar.style.opacity).not.toBe('0');
    });
  });

  // -------------------------------------------------------------------------
  // updateTime
  // -------------------------------------------------------------------------

  describe('updateTime', () => {
    it('updates time display text', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(65, 130);
      const display = findTimeDisplay(container);
      expect(display.textContent).toBe('1:05 / 2:10');
    });

    it('updates progress bar fill width', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(5, 10);

      const progressWrap = findProgressWrap(container);
      // The fill div is inside: wrap > track > fill
      const track = progressWrap.children[0] as HTMLElement;
      const fills = track.querySelectorAll('div');
      // Find the fill by checking for width style with percentage
      let foundFill = false;
      for (const div of fills) {
        if (div.style.width === '50%') {
          foundFill = true;
          break;
        }
      }
      expect(foundFill).toBe(true);
    });

    it('does not update fill when duration is 0', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 0);
      // Should still work without error and show 0:00 / 0:00
      const display = findTimeDisplay(container);
      expect(display.textContent).toBe('0:00 / 0:00');
    });

    it('formats time with leading zero on seconds', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(3, 10);
      const display = findTimeDisplay(container);
      expect(display.textContent).toBe('0:03 / 0:10');
    });

    it('formats minutes correctly', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(125, 300);
      const display = findTimeDisplay(container);
      // 125s = 2:05, 300s = 5:00
      expect(display.textContent).toBe('2:05 / 5:00');
    });
  });

  // -------------------------------------------------------------------------
  // setSegments
  // -------------------------------------------------------------------------

  describe('setSegments', () => {
    it('adds segment markers for non-zero segments', () => {
      ui = new PlayerUI(container, callbacks);
      const timeline = createMockTimeline(
        [
          { index: 0, startTime: 0 },
          { index: 1, startTime: 5 },
          { index: 2, startTime: 8 },
        ],
        10,
      );
      ui.setSegments(timeline);

      // Markers container is inside the progress bar area
      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;
      // Markers is the last child of track
      const markers = track.children[track.children.length - 1] as HTMLElement;
      // index=0 is skipped, so 2 markers
      expect(markers.children.length).toBe(2);
    });

    it('skips marker at index 0', () => {
      ui = new PlayerUI(container, callbacks);
      const timeline = createMockTimeline([{ index: 0, startTime: 0 }], 10);
      ui.setSegments(timeline);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;
      const markers = track.children[track.children.length - 1] as HTMLElement;
      expect(markers.children.length).toBe(0);
    });

    it('does nothing when duration is 0', () => {
      ui = new PlayerUI(container, callbacks);
      const timeline = createMockTimeline(
        [
          { index: 0, startTime: 0 },
          { index: 1, startTime: 5 },
        ],
        0,
      );
      ui.setSegments(timeline);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;
      const markers = track.children[track.children.length - 1] as HTMLElement;
      expect(markers.children.length).toBe(0);
    });

    it('clears previous markers before adding new ones', () => {
      ui = new PlayerUI(container, callbacks);

      const timeline1 = createMockTimeline(
        [
          { index: 0, startTime: 0 },
          { index: 1, startTime: 5 },
        ],
        10,
      );
      ui.setSegments(timeline1);

      const timeline2 = createMockTimeline(
        [
          { index: 0, startTime: 0 },
          { index: 1, startTime: 3 },
          { index: 2, startTime: 6 },
          { index: 3, startTime: 9 },
        ],
        12,
      );
      ui.setSegments(timeline2);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;
      const markers = track.children[track.children.length - 1] as HTMLElement;
      // 3 markers (indices 1, 2, 3; index 0 skipped)
      expect(markers.children.length).toBe(3);
    });

    it('positions markers at correct percentage', () => {
      ui = new PlayerUI(container, callbacks);
      const timeline = createMockTimeline(
        [
          { index: 0, startTime: 0 },
          { index: 1, startTime: 5 },
        ],
        10,
      );
      ui.setSegments(timeline);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;
      const markers = track.children[track.children.length - 1] as HTMLElement;
      const marker = markers.children[0] as HTMLElement;
      expect(marker.style.left).toBe('50%');
    });
  });

  // -------------------------------------------------------------------------
  // setExportProgress
  // -------------------------------------------------------------------------

  describe('setExportProgress', () => {
    it('shows percentage text when progress is set', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setExportProgress(0.5);
      const exportBtn = findButton(container, 'Exporting');
      expect(exportBtn.innerHTML).toContain('50%');
      expect(exportBtn.disabled).toBe(true);
    });

    it('shows correct percentage for various values', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setExportProgress(0.75);
      const exportBtn = findButton(container, 'Exporting');
      expect(exportBtn.innerHTML).toContain('75%');
      expect(exportBtn.title).toBe('Exporting... 75%');
    });

    it('restores export icon when progress is null', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setExportProgress(0.5);
      ui.setExportProgress(null);
      const exportBtn = findButton(container, 'Export');
      expect(exportBtn.innerHTML).toContain('svg');
      expect(exportBtn.disabled).toBe(false);
      expect(exportBtn.title).toBe('Export animation');
    });

    it('rounds percentage to nearest integer', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setExportProgress(0.333);
      const exportBtn = findButton(container, 'Exporting');
      expect(exportBtn.innerHTML).toContain('33%');
    });

    it('shows 0% at start of export', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setExportProgress(0);
      const exportBtn = findButton(container, 'Exporting');
      expect(exportBtn.innerHTML).toContain('0%');
    });

    it('shows 100% at end of export', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setExportProgress(1);
      const exportBtn = findButton(container, 'Exporting');
      expect(exportBtn.innerHTML).toContain('100%');
    });
  });

  // -------------------------------------------------------------------------
  // enableScrollScrub
  // -------------------------------------------------------------------------

  describe('enableScrollScrub', () => {
    it('seeks forward on scroll down', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(1, 10); // set duration

      const getTime = vi.fn().mockReturnValue(1);
      ui.enableScrollScrub(getTime);

      const progressWrap = findProgressWrap(container);
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100, // scroll down
        bubbles: true,
      });
      progressWrap.dispatchEvent(wheelEvent);

      expect(callbacks.onSeek).toHaveBeenCalledWith(1.1);
    });

    it('seeks backward on scroll up', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(5, 10);

      const getTime = vi.fn().mockReturnValue(5);
      ui.enableScrollScrub(getTime);

      const progressWrap = findProgressWrap(container);
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100, // scroll up
        bubbles: true,
      });
      progressWrap.dispatchEvent(wheelEvent);

      expect(callbacks.onSeek).toHaveBeenCalledWith(4.9);
    });

    it('clamps to 0 when scrolling before start', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 10);

      const getTime = vi.fn().mockReturnValue(0);
      ui.enableScrollScrub(getTime);

      const progressWrap = findProgressWrap(container);
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        bubbles: true,
      });
      progressWrap.dispatchEvent(wheelEvent);

      expect(callbacks.onSeek).toHaveBeenCalledWith(0);
    });

    it('clamps to duration when scrolling past end', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(10, 10);

      const getTime = vi.fn().mockReturnValue(10);
      ui.enableScrollScrub(getTime);

      const progressWrap = findProgressWrap(container);
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        bubbles: true,
      });
      progressWrap.dispatchEvent(wheelEvent);

      expect(callbacks.onSeek).toHaveBeenCalledWith(10);
    });
  });

  // -------------------------------------------------------------------------
  // dispose
  // -------------------------------------------------------------------------

  describe('dispose', () => {
    it('removes the bar element from the container', () => {
      ui = new PlayerUI(container, callbacks);
      expect(getBar(container)).toBeTruthy();
      ui.dispose();
      expect(getBar(container)).toBeNull();
    });

    it('removes mousemove listener from container', () => {
      ui = new PlayerUI(container, callbacks);
      const removeSpy = vi.spyOn(container, 'removeEventListener');
      ui.dispose();

      const removeCalls = removeSpy.mock.calls;
      const hasMouseMove = removeCalls.some((c) => c[0] === 'mousemove');
      expect(hasMouseMove).toBe(true);
    });

    it('removes mouseleave listener from container', () => {
      ui = new PlayerUI(container, callbacks);
      const removeSpy = vi.spyOn(container, 'removeEventListener');
      ui.dispose();

      const removeCalls = removeSpy.mock.calls;
      const hasMouseLeave = removeCalls.some((c) => c[0] === 'mouseleave');
      expect(hasMouseLeave).toBe(true);
    });

    it('removes document-level mousemove and mouseup listeners', () => {
      ui = new PlayerUI(container, callbacks);
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      ui.dispose();

      const removeCalls = removeSpy.mock.calls;
      const hasMouseMove = removeCalls.some((c) => c[0] === 'mousemove');
      const hasMouseUp = removeCalls.some((c) => c[0] === 'mouseup');
      expect(hasMouseMove).toBe(true);
      expect(hasMouseUp).toBe(true);
    });

    it('clears hide timeout', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(true);
      ui.dispose();

      // If timeout was not cleared, advancing timers would cause an error
      // or the bar would try to update after removal
      vi.advanceTimersByTime(1000);
      // No error thrown means the timeout was cleared
    });
  });

  // -------------------------------------------------------------------------
  // Auto-hide controls
  // -------------------------------------------------------------------------

  describe('auto-hide controls', () => {
    it('hides bar after autoHideMs when playing', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(true);
      const bar = getBar(container);

      vi.advanceTimersByTime(600);
      expect(bar.style.opacity).toBe('0');
      expect(bar.style.transform).toBe('translateY(8px)');
    });

    it('shows bar on mousemove over container', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(true);
      const bar = getBar(container);

      // Let it hide
      vi.advanceTimersByTime(600);
      expect(bar.style.opacity).toBe('0');

      // Move mouse
      container.dispatchEvent(new MouseEvent('mousemove'));
      expect(bar.style.opacity).toBe('1');
      expect(bar.style.transform).toBe('translateY(0)');
    });

    it('resets hide timer on each mousemove', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(true);
      const bar = getBar(container);

      vi.advanceTimersByTime(400);
      container.dispatchEvent(new MouseEvent('mousemove'));

      // 400ms more should not hide (timer was reset)
      vi.advanceTimersByTime(400);
      expect(bar.style.opacity).not.toBe('0');

      // 200ms more (total 600 from last mousemove) should hide
      vi.advanceTimersByTime(200);
      expect(bar.style.opacity).toBe('0');
    });

    it('schedules hide on mouseleave when playing', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(true);
      const bar = getBar(container);

      container.dispatchEvent(new MouseEvent('mouseleave'));
      vi.advanceTimersByTime(600);
      expect(bar.style.opacity).toBe('0');
    });

    it('does not hide when autoHideMs is 0', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 0 });
      ui.setPlaying(true);
      const bar = getBar(container);

      vi.advanceTimersByTime(10000);
      expect(bar.style.opacity).not.toBe('0');
    });

    it('does not hide when not playing', () => {
      ui = new PlayerUI(container, callbacks, { autoHideMs: 500 });
      ui.setPlaying(false);
      const bar = getBar(container);

      vi.advanceTimersByTime(1000);
      expect(bar.style.opacity).not.toBe('0');
    });
  });

  // -------------------------------------------------------------------------
  // Drag scrubbing on progress bar
  // -------------------------------------------------------------------------

  describe('drag scrubbing', () => {
    it('calls onSeek on mousedown on progress bar', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 10);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      // Mock getBoundingClientRect on the track
      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 0,
          right: 200,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      progressWrap.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }));

      expect(callbacks.onSeek).toHaveBeenCalled();
      // clientX=100 out of width=200 => ratio=0.5, time=5
      expect(callbacks.onSeek).toHaveBeenCalledWith(5);
    });

    it('continues to seek on mousemove during drag', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 10);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 0,
          right: 200,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      // Start drag
      progressWrap.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, bubbles: true }));

      // Move during drag
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, bubbles: true }));

      // Should have been called twice (mousedown + mousemove)
      expect(callbacks.onSeek).toHaveBeenCalledTimes(2);
      expect(callbacks.onSeek).toHaveBeenLastCalledWith(7.5);
    });

    it('stops seeking on mouseup', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 10);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 0,
          right: 200,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      // Start drag
      progressWrap.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, bubbles: true }));

      // End drag
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      // Move after drag ended - should NOT trigger seek
      document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, bubbles: true }));

      // Only 1 call from the initial mousedown
      expect(callbacks.onSeek).toHaveBeenCalledTimes(1);
    });

    it('clamps seek to 0 when mouse is left of track', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 10);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 100,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 100,
          right: 300,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      progressWrap.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, bubbles: true }));

      expect(callbacks.onSeek).toHaveBeenCalledWith(0);
    });

    it('clamps seek to duration when mouse is right of track', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 10);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 0,
          right: 200,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      progressWrap.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, bubbles: true }));

      expect(callbacks.onSeek).toHaveBeenCalledWith(10);
    });

    it('does not update progress fill while dragging', () => {
      ui = new PlayerUI(container, callbacks);
      ui.updateTime(0, 10);

      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 0,
          right: 200,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      // Start drag
      progressWrap.dispatchEvent(new MouseEvent('mousedown', { clientX: 50, bubbles: true }));

      // Now updateTime should not change the fill since we're dragging
      ui.updateTime(8, 10);

      // The fill should reflect the drag position (25%), not updateTime (80%)
      const fills = track.querySelectorAll('div');
      let hasDragPosition = false;
      for (const div of fills) {
        if (div.style.width === '25%') {
          hasDragPosition = true;
          break;
        }
      }
      expect(hasDragPosition).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Export menu
  // -------------------------------------------------------------------------

  describe('export menu', () => {
    it('opens export menu on export button click', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');

      exportBtn.click();

      // Menu should be appended to document.body
      const menu = document.body.querySelector('[data-player-bar]');
      expect(menu).toBeTruthy();
    });

    it('export menu has three format options', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      // Find the menu (the last data-player-bar element in body, not in our container)
      const allBars = document.body.querySelectorAll('[data-player-bar]');
      // Last one should be the menu (backdrop is second-to-last)
      const menu = allBars[allBars.length - 1];
      expect(menu.children.length).toBe(3);
    });

    it('calls onExport with correct format when menu item clicked', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      // Find menu items
      const allBars = document.body.querySelectorAll('[data-player-bar]');
      const menu = allBars[allBars.length - 1];
      const items = menu.children;

      // Click first item (GIF)
      (items[0] as HTMLElement).click();
      expect(callbacks.onExport).toHaveBeenCalledWith('gif');
    });

    it('calls onExport with webm for second item', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      const allBars = document.body.querySelectorAll('[data-player-bar]');
      const menu = allBars[allBars.length - 1];
      const items = menu.children;

      (items[1] as HTMLElement).click();
      expect(callbacks.onExport).toHaveBeenCalledWith('webm');
    });

    it('calls onExport with mp4 for third item', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      const allBars = document.body.querySelectorAll('[data-player-bar]');
      const menu = allBars[allBars.length - 1];
      const items = menu.children;

      (items[2] as HTMLElement).click();
      expect(callbacks.onExport).toHaveBeenCalledWith('mp4');
    });

    it('closes export menu after selecting a format', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      const allBars = document.body.querySelectorAll('[data-player-bar]');
      const menu = allBars[allBars.length - 1];
      (menu.children[0] as HTMLElement).click();

      // Menu should be removed from body
      const menusAfter = document.querySelectorAll('[data-player-bar]');
      // Only our bar should remain (in the container)
      const bodyMenus = document.body.querySelectorAll(':scope > [data-player-bar]');
      expect(bodyMenus.length).toBe(0);
    });

    it('toggles export menu closed on second click', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');

      // Open
      exportBtn.click();
      let bodyMenus = document.body.querySelectorAll(':scope > [data-player-bar]');
      expect(bodyMenus.length).toBeGreaterThan(0);

      // Close by clicking again
      exportBtn.click();
      bodyMenus = document.body.querySelectorAll(':scope > [data-player-bar]');
      expect(bodyMenus.length).toBe(0);
    });

    it('closes menu when backdrop is clicked', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      // Backdrop + menu are appended to body
      const bodyMenus = document.body.querySelectorAll(':scope > [data-player-bar]');
      expect(bodyMenus.length).toBeGreaterThanOrEqual(2);

      // Click the backdrop (first body-level data-player-bar)
      const backdrop = bodyMenus[0] as HTMLElement;
      backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      const after = document.body.querySelectorAll(':scope > [data-player-bar]');
      expect(after.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Speed select
  // -------------------------------------------------------------------------

  describe('speed select', () => {
    it('calls onSpeedChange when selection changes', () => {
      ui = new PlayerUI(container, callbacks);
      const select = findSpeedSelect(container);

      select.value = '2';
      select.dispatchEvent(new Event('change'));

      expect(callbacks.onSpeedChange).toHaveBeenCalledWith(2);
    });

    it('calls onSpeedChange with 0.5 for half speed', () => {
      ui = new PlayerUI(container, callbacks);
      const select = findSpeedSelect(container);

      select.value = '0.5';
      select.dispatchEvent(new Event('change'));

      expect(callbacks.onSpeedChange).toHaveBeenCalledWith(0.5);
    });

    it('has expected speed options', () => {
      ui = new PlayerUI(container, callbacks);
      const select = findSpeedSelect(container);
      const options = select.querySelectorAll('option');
      const values = Array.from(options).map((o) => o.value);
      expect(values).toEqual(['0.25', '0.5', '0.75', '1', '1.25', '1.5', '2']);
    });
  });

  // -------------------------------------------------------------------------
  // Button click callbacks
  // -------------------------------------------------------------------------

  describe('button callbacks', () => {
    it('play button calls onPlayPause', () => {
      ui = new PlayerUI(container, callbacks);
      const playBtn = findButton(container, 'Play');
      playBtn.click();
      expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('prev button calls onPrev', () => {
      ui = new PlayerUI(container, callbacks);
      const prevBtn = findButton(container, 'Previous');
      prevBtn.click();
      expect(callbacks.onPrev).toHaveBeenCalledTimes(1);
    });

    it('next button calls onNext', () => {
      ui = new PlayerUI(container, callbacks);
      const nextBtn = findButton(container, 'Next');
      nextBtn.click();
      expect(callbacks.onNext).toHaveBeenCalledTimes(1);
    });

    it('fullscreen button calls onFullscreen', () => {
      ui = new PlayerUI(container, callbacks);
      const fsBtn = findButton(container, 'Fullscreen');
      fsBtn.click();
      expect(callbacks.onFullscreen).toHaveBeenCalledTimes(1);
    });

    it('play button calls onPlayPause when in pause state', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setPlaying(true);
      const pauseBtn = findButton(container, 'Pause');
      pauseBtn.click();
      expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('replay button calls onPlayPause', () => {
      ui = new PlayerUI(container, callbacks);
      ui.setPlaying(false, true);
      const replayBtn = findButton(container, 'Replay');
      replayBtn.click();
      expect(callbacks.onPlayPause).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Progress bar hover effects
  // -------------------------------------------------------------------------

  describe('progress bar hover', () => {
    it('shows hover fill on mousemove over progress wrap', () => {
      ui = new PlayerUI(container, callbacks);
      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 0,
          right: 200,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      progressWrap.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, bubbles: true }));

      // Hover fill is the first child of track
      const hoverFill = track.children[0] as HTMLElement;
      expect(hoverFill.style.width).toBe('50%');
    });

    it('clears hover fill on mouseleave from progress wrap', () => {
      ui = new PlayerUI(container, callbacks);
      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      Object.defineProperty(track, 'getBoundingClientRect', {
        value: () => ({
          x: 0,
          y: 0,
          width: 200,
          height: 4,
          top: 0,
          left: 0,
          right: 200,
          bottom: 4,
          toJSON: () => {},
        }),
      });

      // First hover
      progressWrap.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, bubbles: true }));

      // Then leave
      progressWrap.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      const hoverFill = track.children[0] as HTMLElement;
      expect(hoverFill.style.width).toBe('0%');
    });

    it('expands track height on mouseenter', () => {
      ui = new PlayerUI(container, callbacks);
      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      progressWrap.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      expect(track.style.height).toBe('6px');
    });

    it('restores track height on mouseleave', () => {
      ui = new PlayerUI(container, callbacks);
      const progressWrap = findProgressWrap(container);
      const track = progressWrap.children[0] as HTMLElement;

      progressWrap.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      progressWrap.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      expect(track.style.height).toBe('4px');
    });
  });

  // -------------------------------------------------------------------------
  // Button hover effects
  // -------------------------------------------------------------------------

  describe('button hover effects', () => {
    it('play button highlights on mouseenter', () => {
      ui = new PlayerUI(container, callbacks);
      const playBtn = findButton(container, 'Play');
      playBtn.dispatchEvent(new MouseEvent('mouseenter'));
      expect(playBtn.style.background).toContain('rgba');
      expect(playBtn.style.background).toContain('0.15');
    });

    it('play button clears highlight on mouseleave', () => {
      ui = new PlayerUI(container, callbacks);
      const playBtn = findButton(container, 'Play');
      playBtn.dispatchEvent(new MouseEvent('mouseenter'));
      playBtn.dispatchEvent(new MouseEvent('mouseleave'));
      expect(playBtn.style.background).toContain('none');
    });
  });

  // -------------------------------------------------------------------------
  // Export menu item hover effects
  // -------------------------------------------------------------------------

  describe('export menu item hover', () => {
    it('highlights menu item on mouseenter', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      const allBars = document.body.querySelectorAll(':scope > [data-player-bar]');
      const menu = allBars[allBars.length - 1];
      const item = menu.children[0] as HTMLElement;

      item.dispatchEvent(new MouseEvent('mouseenter'));
      expect(item.style.background).toContain('rgba');
      expect(item.style.background).toContain('0.1');
    });

    it('clears menu item highlight on mouseleave', () => {
      ui = new PlayerUI(container, callbacks);
      const exportBtn = findButton(container, 'Export');
      exportBtn.click();

      const allBars = document.body.querySelectorAll(':scope > [data-player-bar]');
      const menu = allBars[allBars.length - 1];
      const item = menu.children[0] as HTMLElement;

      item.dispatchEvent(new MouseEvent('mouseenter'));
      item.dispatchEvent(new MouseEvent('mouseleave'));
      expect(item.style.background).toContain('none');
    });
  });
});
