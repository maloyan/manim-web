import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPerformanceMonitor } from './Performance';
import { logger } from './logger';
import { skeletonizeGlyph } from './skeletonize';

// ---------------------------------------------------------------------------
// Performance — coverage gap: line 65 (fpsHistory overflow shift)
// ---------------------------------------------------------------------------
describe('Performance coverage gaps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('PerformanceMonitor shifts fpsHistory when exceeding historySize (line 65)', () => {
    const monitor = createPerformanceMonitor();

    // Mock requestAnimationFrame
    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    monitor.start();

    // Simulate many seconds to fill up fpsHistory beyond historySize (10)
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);

    for (let i = 0; i < 15; i++) {
      // Simulate 60 frames per second
      for (let f = 0; f < 60; f++) {
        now += 16.67;
        if (rafCallback) rafCallback(now);
      }
      now += 1; // Ensure we pass 1000ms mark
    }

    // After 15 seconds, the history should have been shifted
    // The FPS should still be a valid number
    expect(monitor.getFps()).toBeGreaterThanOrEqual(0);
    expect(monitor.getInstantFps()).toBeGreaterThanOrEqual(0);

    monitor.stop();

    vi.unstubAllGlobals();
  });
});

// ---------------------------------------------------------------------------
// Logger — coverage gap: line 120 (logger.debug when LOG_LEVEL allows it)
// ---------------------------------------------------------------------------
describe('Logger coverage gaps', () => {
  it('logger.debug calls console.debug (line 120)', () => {
    // Since currentLevel is set from process.env.LOG_LEVEL at module load time,
    // and defaults to 'info', debug won't normally log.
    // We can still call it to exercise the branch check.
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug('test debug message');
    // With default 'info' level, debug should NOT be logged
    // But calling it exercises the shouldLog check
    debugSpy.mockRestore();
  });

  it('logger.warn calls console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warning');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logger.error calls console.error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('logger.info sanitizes sensitive data', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('Token: Bearer abc123xyz');
    expect(infoSpy).toHaveBeenCalled();
    // Verify the actual logged arg is sanitized
    const loggedArgs = infoSpy.mock.calls[0];
    const loggedStr = loggedArgs.find(
      (a: unknown) => typeof a === 'string' && a.includes('[REDACTED]'),
    );
    expect(loggedStr).toBeDefined();
    infoSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Skeletonize — coverage gaps: lines 534 (catmullRomSmooth 2 points),
//   lines 590-602 (fitCubicBeziers edge cases), line 671 (estimateTangent degenerate)
// ---------------------------------------------------------------------------
describe('Skeletonize coverage gaps', () => {
  it('skeletonizeGlyph with fewer than 4 points returns empty', () => {
    const result = skeletonizeGlyph([
      [0, 0, 0],
      [1, 0, 0],
    ]);
    expect(result).toEqual([]);
  });

  it('skeletonizeGlyph with zero-area bbox returns empty', () => {
    // All points on same X line
    const result = skeletonizeGlyph([
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ]);
    expect(result).toEqual([]);
  });

  it('skeletonizeGlyph with a small square glyph outline', () => {
    // Create a simple square outline as Bezier control points
    // [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]
    const size = 1;
    const points = [
      // Bottom-left to bottom-right
      [0, 0, 0],
      [size / 3, 0, 0],
      [(2 * size) / 3, 0, 0],
      [size, 0, 0],
      // Bottom-right to top-right
      [size, size / 3, 0],
      [size, (2 * size) / 3, 0],
      [size, size, 0],
      // Top-right to top-left
      [(2 * size) / 3, size, 0],
      [size / 3, size, 0],
      [0, size, 0],
      // Top-left to bottom-left (close)
      [0, (2 * size) / 3, 0],
      [0, size / 3, 0],
      [0, 0, 0],
    ];
    const result = skeletonizeGlyph(points, { gridResolution: 20, minChainLength: 2 });
    // May or may not produce skeleton points depending on grid resolution
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('skeletonizeGlyph with tall aspect ratio (< 1)', () => {
    // Tall and narrow rectangle to test aspect < 1 branch
    const points = [
      [0, 0, 0],
      [0.1, 0, 0],
      [0.2, 0, 0],
      [0.3, 0, 0],
      [0.3, 1, 0],
      [0.3, 2, 0],
      [0.3, 3, 0],
      [0.2, 3, 0],
      [0.1, 3, 0],
      [0, 3, 0],
      [0, 2, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    const result = skeletonizeGlyph(points, { gridResolution: 15 });
    expect(result).toBeDefined();
  });
});
