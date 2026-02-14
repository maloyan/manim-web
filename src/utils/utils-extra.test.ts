import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isFeatureEnabled,
  setFeatureFlags,
  resetFeatureFlags,
  getFeatureFlags,
} from './featureFlags';
import { logger } from './logger';
import {
  FrameTimeTracker,
  PerformanceMonitor,
  createFrameTimeTracker,
  createPerformanceMonitor,
} from './Performance';

// =========================================================================
// featureFlags
// =========================================================================

describe('featureFlags', () => {
  beforeEach(() => {
    resetFeatureFlags();
  });

  it('isFeatureEnabled returns false for unknown flags', () => {
    expect(isFeatureEnabled('DOES_NOT_EXIST')).toBe(false);
    expect(isFeatureEnabled('')).toBe(false);
    expect(isFeatureEnabled('random_flag_xyz')).toBe(false);
  });

  it('known flags default to false', () => {
    expect(isFeatureEnabled('EXPERIMENTAL_3D_LIGHTING')).toBe(false);
    expect(isFeatureEnabled('WEBGPU_RENDERER')).toBe(false);
    expect(isFeatureEnabled('ADVANCED_TEXT_LAYOUT')).toBe(false);
  });

  it('setFeatureFlags overrides specific flags', () => {
    setFeatureFlags({ EXPERIMENTAL_3D_LIGHTING: true });
    expect(isFeatureEnabled('EXPERIMENTAL_3D_LIGHTING')).toBe(true);
  });

  it('setFeatureFlags preserves other flags when overriding one', () => {
    setFeatureFlags({ WEBGPU_RENDERER: true });
    expect(isFeatureEnabled('WEBGPU_RENDERER')).toBe(true);
    expect(isFeatureEnabled('EXPERIMENTAL_3D_LIGHTING')).toBe(false);
    expect(isFeatureEnabled('ADVANCED_TEXT_LAYOUT')).toBe(false);
  });

  it('resetFeatureFlags restores defaults', () => {
    setFeatureFlags({
      EXPERIMENTAL_3D_LIGHTING: true,
      WEBGPU_RENDERER: true,
      ADVANCED_TEXT_LAYOUT: true,
    });
    resetFeatureFlags();
    expect(isFeatureEnabled('EXPERIMENTAL_3D_LIGHTING')).toBe(false);
    expect(isFeatureEnabled('WEBGPU_RENDERER')).toBe(false);
    expect(isFeatureEnabled('ADVANCED_TEXT_LAYOUT')).toBe(false);
  });

  it('getFeatureFlags returns a copy that does not affect internal state', () => {
    const copy = getFeatureFlags();
    // Mutate the copy
    (copy as Record<string, boolean>)['EXPERIMENTAL_3D_LIGHTING'] = true;
    (copy as Record<string, boolean>)['NEW_FLAG'] = true;
    // Internal state must be unchanged
    expect(isFeatureEnabled('EXPERIMENTAL_3D_LIGHTING')).toBe(false);
    expect(isFeatureEnabled('NEW_FLAG')).toBe(false);
  });

  it('getFeatureFlags reflects current overrides', () => {
    setFeatureFlags({ ADVANCED_TEXT_LAYOUT: true });
    const flags = getFeatureFlags();
    expect(flags['ADVANCED_TEXT_LAYOUT']).toBe(true);
    expect(flags['WEBGPU_RENDERER']).toBe(false);
  });
});

// =========================================================================
// logger
// =========================================================================

describe('logger', () => {
  it('has debug, info, warn, error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  describe('console delegation', () => {
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('logger.info calls console.info', () => {
      logger.info('hello');
      expect(infoSpy).toHaveBeenCalled();
      expect(infoSpy.mock.calls[0][0]).toBe('[manim-web]');
      expect(infoSpy.mock.calls[0][1]).toBe('hello');
    });

    it('logger.error calls console.error', () => {
      logger.error('boom');
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toBe('[manim-web]');
      expect(errorSpy.mock.calls[0][1]).toBe('boom');
    });

    it('logger.warn calls console.warn', () => {
      logger.warn('careful');
      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0][0]).toBe('[manim-web]');
      expect(warnSpy.mock.calls[0][1]).toBe('careful');
    });
  });

  describe('sanitizeString (via logger output)', () => {
    let infoSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('redacts Bearer tokens', () => {
      logger.info('Auth: Bearer eyJtoken1234567890');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('eyJtoken');
    });

    it('redacts JWT tokens', () => {
      logger.info('Token: eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2OTk5OTk5OTl9.somesignaturevalue');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('eyJhbGci');
    });

    it('redacts AWS access key IDs', () => {
      logger.info('Key: AKIA1234567890123456');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('AKIA1234567890123456');
    });

    it('redacts GitHub tokens', () => {
      logger.info('Token: ghp_abc123456789012345678901234567890123');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('ghp_abc');
    });

    it('redacts Stripe keys', () => {
      logger.info('Key: ' + 'sk_live' + '_abcdefghij1234567890abcd');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('sk_live_abc');
    });

    it('redacts email addresses', () => {
      logger.info('Contact: user@example.com for info');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('user@example.com');
    });

    it('redacts generic api_key=value patterns', () => {
      logger.info('Config: api_key=secretvalue123');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('secretvalue123');
    });

    it('leaves non-sensitive strings untouched', () => {
      logger.info('Just a normal log message');
      const logged = infoSpy.mock.calls[0][1];
      expect(logged).toBe('Just a normal log message');
    });
  });
});

// =========================================================================
// FrameTimeTracker
// =========================================================================

describe('FrameTimeTracker', () => {
  let perfNowMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    perfNowMock = vi.spyOn(performance, 'now');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('constructor uses default maxSamples of 60', () => {
    const tracker = new FrameTimeTracker();
    // Fill beyond 60 samples - older ones should be evicted
    let time = 0;
    for (let i = 0; i < 70; i++) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += 10;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    // getSummary should work and avg should be 10
    expect(tracker.getAverageFrameTime()).toBeCloseTo(10, 5);
    // If all samples were kept, we'd have 70 entries, but max is 60
    // The min/max should still be 10 since all frames are the same duration
    expect(tracker.getMinFrameTime()).toBeCloseTo(10, 5);
    expect(tracker.getMaxFrameTime()).toBeCloseTo(10, 5);
  });

  it('constructor with custom maxSamples', () => {
    const tracker = new FrameTimeTracker(3);
    let time = 0;
    const durations = [5, 10, 15, 20, 25];
    for (const d of durations) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += d;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    // Only last 3 should remain: 15, 20, 25
    expect(tracker.getMinFrameTime()).toBeCloseTo(15, 5);
    expect(tracker.getMaxFrameTime()).toBeCloseTo(25, 5);
    expect(tracker.getAverageFrameTime()).toBeCloseTo(20, 5);
  });

  it('getAverageFrameTime returns 0 when no samples', () => {
    const tracker = new FrameTimeTracker();
    expect(tracker.getAverageFrameTime()).toBe(0);
  });

  it('getMaxFrameTime returns 0 when no samples', () => {
    const tracker = new FrameTimeTracker();
    expect(tracker.getMaxFrameTime()).toBe(0);
  });

  it('getMinFrameTime returns 0 when no samples', () => {
    const tracker = new FrameTimeTracker();
    expect(tracker.getMinFrameTime()).toBe(0);
  });

  it('get95thPercentile returns 0 when no samples', () => {
    const tracker = new FrameTimeTracker();
    expect(tracker.get95thPercentile()).toBe(0);
  });

  it('startFrame/endFrame records frame times', () => {
    const tracker = new FrameTimeTracker();
    perfNowMock.mockReturnValueOnce(100);
    tracker.startFrame();
    perfNowMock.mockReturnValueOnce(116.5);
    tracker.endFrame();

    expect(tracker.getAverageFrameTime()).toBeCloseTo(16.5, 5);
    expect(tracker.getMaxFrameTime()).toBeCloseTo(16.5, 5);
    expect(tracker.getMinFrameTime()).toBeCloseTo(16.5, 5);
  });

  it('respects maxSamples limit and shifts old samples', () => {
    const tracker = new FrameTimeTracker(2);
    // Frame 1: 10ms
    perfNowMock.mockReturnValueOnce(0);
    tracker.startFrame();
    perfNowMock.mockReturnValueOnce(10);
    tracker.endFrame();
    // Frame 2: 20ms
    perfNowMock.mockReturnValueOnce(10);
    tracker.startFrame();
    perfNowMock.mockReturnValueOnce(30);
    tracker.endFrame();
    // Frame 3: 30ms  (this should evict the 10ms sample)
    perfNowMock.mockReturnValueOnce(30);
    tracker.startFrame();
    perfNowMock.mockReturnValueOnce(60);
    tracker.endFrame();

    expect(tracker.getMinFrameTime()).toBeCloseTo(20, 5);
    expect(tracker.getMaxFrameTime()).toBeCloseTo(30, 5);
    expect(tracker.getAverageFrameTime()).toBeCloseTo(25, 5);
  });

  it('getAverageFrameTime computes correctly with multiple samples', () => {
    const tracker = new FrameTimeTracker();
    const durations = [10, 20, 30];
    let time = 0;
    for (const d of durations) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += d;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    expect(tracker.getAverageFrameTime()).toBeCloseTo(20, 5);
  });

  it('getMaxFrameTime returns correct max', () => {
    const tracker = new FrameTimeTracker();
    const durations = [5, 50, 15];
    let time = 0;
    for (const d of durations) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += d;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    expect(tracker.getMaxFrameTime()).toBeCloseTo(50, 5);
  });

  it('getMinFrameTime returns correct min', () => {
    const tracker = new FrameTimeTracker();
    const durations = [25, 5, 15];
    let time = 0;
    for (const d of durations) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += d;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    expect(tracker.getMinFrameTime()).toBeCloseTo(5, 5);
  });

  it('get95thPercentile computes correctly', () => {
    const tracker = new FrameTimeTracker(100);
    // Create 20 samples: 1, 2, 3, ..., 20
    let time = 0;
    for (let i = 1; i <= 20; i++) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += i;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    // Sorted: [1,2,...,20], index = floor(20 * 0.95) = 19 => value 20
    expect(tracker.get95thPercentile()).toBeCloseTo(20, 5);
  });

  it('getSummary returns all stats', () => {
    const tracker = new FrameTimeTracker();
    const durations = [10, 20, 30, 40];
    let time = 0;
    for (const d of durations) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += d;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    const summary = tracker.getSummary();
    expect(summary.avg).toBeCloseTo(25, 5);
    expect(summary.min).toBeCloseTo(10, 5);
    expect(summary.max).toBeCloseTo(40, 5);
    // Sorted: [10,20,30,40], index = floor(4*0.95) = 3 => 40
    expect(summary.p95).toBeCloseTo(40, 5);
  });

  it('reset clears all frame times', () => {
    const tracker = new FrameTimeTracker();
    perfNowMock.mockReturnValueOnce(0);
    tracker.startFrame();
    perfNowMock.mockReturnValueOnce(16);
    tracker.endFrame();

    expect(tracker.getAverageFrameTime()).toBeCloseTo(16, 5);

    tracker.reset();

    expect(tracker.getAverageFrameTime()).toBe(0);
    expect(tracker.getMaxFrameTime()).toBe(0);
    expect(tracker.getMinFrameTime()).toBe(0);
    expect(tracker.get95thPercentile()).toBe(0);
  });

  it('createFrameTimeTracker factory returns a FrameTimeTracker', () => {
    const tracker = createFrameTimeTracker();
    expect(tracker).toBeInstanceOf(FrameTimeTracker);
  });

  it('createFrameTimeTracker factory respects maxSamples argument', () => {
    const tracker = createFrameTimeTracker(5);
    let time = 0;
    for (let i = 0; i < 10; i++) {
      perfNowMock.mockReturnValueOnce(time);
      tracker.startFrame();
      time += 10;
      perfNowMock.mockReturnValueOnce(time);
      tracker.endFrame();
    }
    // Only 5 samples kept, all with duration 10
    expect(tracker.getAverageFrameTime()).toBeCloseTo(10, 5);
  });
});

// =========================================================================
// PerformanceMonitor
// =========================================================================

describe('PerformanceMonitor', () => {
  let rafCallbacks: Map<number, FrameRequestCallback>;
  let rafId: number;
  let perfNowMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    rafCallbacks = new Map();
    rafId = 0;

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = ++rafId;
      rafCallbacks.set(id, cb);
      return id;
    });

    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafCallbacks.delete(id);
    });

    perfNowMock = vi.spyOn(performance, 'now');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Flush the most recently scheduled rAF callback. */
  function flushRaf(timestamp: number = 0): void {
    const entries = [...rafCallbacks.entries()];
    if (entries.length === 0) return;
    const [id, cb] = entries[entries.length - 1];
    rafCallbacks.delete(id);
    cb(timestamp);
  }

  it('getFps returns 0 initially', () => {
    const monitor = new PerformanceMonitor();
    expect(monitor.getFps()).toBe(0);
  });

  it('isRunning returns false initially', () => {
    const monitor = new PerformanceMonitor();
    expect(monitor.isRunning()).toBe(false);
  });

  it('start sets isRunning to true', () => {
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValue(0);
    monitor.start();
    expect(monitor.isRunning()).toBe(true);
    monitor.stop();
  });

  it('stop sets isRunning to false', () => {
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValue(0);
    monitor.start();
    monitor.stop();
    expect(monitor.isRunning()).toBe(false);
  });

  it('start prevents double-start (no-op if already running)', () => {
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValue(0);

    monitor.start();
    const firstRafCount = rafCallbacks.size;

    // Second start should be no-op
    monitor.start();
    // Should not have scheduled extra callbacks beyond what the first start did
    expect(rafCallbacks.size).toBe(firstRafCount);
    expect(monitor.isRunning()).toBe(true);

    monitor.stop();
  });

  it('reset clears statistics', () => {
    const monitor = new PerformanceMonitor();
    perfNowMock.mockReturnValue(0);
    monitor.start();

    // Simulate frames over 1 second so FPS is computed
    perfNowMock.mockReturnValue(1001);
    flushRaf();

    monitor.stop();
    monitor.reset();

    expect(monitor.getFps()).toBe(0);
    expect(monitor.getInstantFps()).toBe(0);
  });

  it('createPerformanceMonitor factory returns a PerformanceMonitor', () => {
    const monitor = createPerformanceMonitor();
    expect(monitor).toBeInstanceOf(PerformanceMonitor);
    expect(monitor.isRunning()).toBe(false);
    expect(monitor.getFps()).toBe(0);
  });
});
