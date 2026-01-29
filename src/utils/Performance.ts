/**
 * Performance monitoring utilities for manimweb.
 * Provides FPS tracking and performance metrics.
 */

/**
 * Performance monitor for tracking frame rate and other metrics.
 * Useful for debugging and optimizing animations.
 */
export class PerformanceMonitor {
  private _frameCount: number = 0;
  private _lastTime: number = 0;
  private _fps: number = 0;
  private _callback: ((fps: number) => void) | null = null;
  private _animationFrameId: number | null = null;
  private _isRunning: boolean = false;

  // Rolling average for smoother FPS display
  private _fpsHistory: number[] = [];
  private _historySize: number = 10;

  /**
   * Start monitoring performance.
   * @param callback - Optional callback called each second with current FPS
   */
  start(callback?: (fps: number) => void): void {
    if (this._isRunning) return;

    this._callback = callback ?? null;
    this._lastTime = performance.now();
    this._frameCount = 0;
    this._fpsHistory = [];
    this._isRunning = true;
    this._update();
  }

  /**
   * Stop monitoring performance.
   */
  stop(): void {
    this._isRunning = false;
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * Internal update loop.
   */
  private _update = (): void => {
    if (!this._isRunning) return;

    this._frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this._lastTime;

    if (elapsed >= 1000) {
      // Calculate FPS for this second
      const instantFps = Math.round((this._frameCount * 1000) / elapsed);

      // Add to history for rolling average
      this._fpsHistory.push(instantFps);
      if (this._fpsHistory.length > this._historySize) {
        this._fpsHistory.shift();
      }

      // Calculate rolling average
      this._fps = Math.round(
        this._fpsHistory.reduce((sum, fps) => sum + fps, 0) / this._fpsHistory.length
      );

      this._callback?.(this._fps);
      this._frameCount = 0;
      this._lastTime = currentTime;
    }

    this._animationFrameId = requestAnimationFrame(this._update);
  };

  /**
   * Get the current FPS (rolling average).
   * @returns Current frames per second
   */
  getFps(): number {
    return this._fps;
  }

  /**
   * Get the instant FPS (last measured value before averaging).
   * @returns Instant frames per second
   */
  getInstantFps(): number {
    return this._fpsHistory.length > 0
      ? this._fpsHistory[this._fpsHistory.length - 1]
      : 0;
  }

  /**
   * Check if the monitor is currently running.
   * @returns true if monitoring is active
   */
  isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Reset the monitor statistics.
   */
  reset(): void {
    this._frameCount = 0;
    this._fps = 0;
    this._fpsHistory = [];
    this._lastTime = performance.now();
  }
}

/**
 * Create a new PerformanceMonitor instance.
 * @returns A new PerformanceMonitor
 */
export function createPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor();
}

/**
 * Simple frame time tracker for measuring render performance.
 */
export class FrameTimeTracker {
  private _frameTimes: number[] = [];
  private _maxSamples: number;
  private _lastFrameStart: number = 0;

  /**
   * Create a new FrameTimeTracker.
   * @param maxSamples - Maximum number of samples to keep (default: 60)
   */
  constructor(maxSamples: number = 60) {
    this._maxSamples = maxSamples;
  }

  /**
   * Mark the start of a frame.
   */
  startFrame(): void {
    this._lastFrameStart = performance.now();
  }

  /**
   * Mark the end of a frame and record the time.
   */
  endFrame(): void {
    const frameTime = performance.now() - this._lastFrameStart;
    this._frameTimes.push(frameTime);
    if (this._frameTimes.length > this._maxSamples) {
      this._frameTimes.shift();
    }
  }

  /**
   * Get the average frame time in milliseconds.
   * @returns Average frame time in ms
   */
  getAverageFrameTime(): number {
    if (this._frameTimes.length === 0) return 0;
    return this._frameTimes.reduce((sum, t) => sum + t, 0) / this._frameTimes.length;
  }

  /**
   * Get the maximum frame time in milliseconds.
   * @returns Max frame time in ms
   */
  getMaxFrameTime(): number {
    if (this._frameTimes.length === 0) return 0;
    return Math.max(...this._frameTimes);
  }

  /**
   * Get the minimum frame time in milliseconds.
   * @returns Min frame time in ms
   */
  getMinFrameTime(): number {
    if (this._frameTimes.length === 0) return 0;
    return Math.min(...this._frameTimes);
  }

  /**
   * Get the 95th percentile frame time.
   * Useful for identifying stutter/jank.
   * @returns 95th percentile frame time in ms
   */
  get95thPercentile(): number {
    if (this._frameTimes.length === 0) return 0;
    const sorted = [...this._frameTimes].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] ?? sorted[sorted.length - 1];
  }

  /**
   * Reset all recorded frame times.
   */
  reset(): void {
    this._frameTimes = [];
  }

  /**
   * Get a summary of frame time statistics.
   * @returns Object with avg, min, max, and p95 frame times
   */
  getSummary(): { avg: number; min: number; max: number; p95: number } {
    return {
      avg: this.getAverageFrameTime(),
      min: this.getMinFrameTime(),
      max: this.getMaxFrameTime(),
      p95: this.get95thPercentile(),
    };
  }
}

/**
 * Create a new FrameTimeTracker instance.
 * @param maxSamples - Maximum number of samples to keep
 * @returns A new FrameTimeTracker
 */
export function createFrameTimeTracker(maxSamples?: number): FrameTimeTracker {
  return new FrameTimeTracker(maxSamples);
}
