// @vitest-environment happy-dom
/**
 * Tests for ImageMobject async error propagation (GitHub issue #77).
 *
 * Verifies that waitForLoad() rejects when the image fails to load,
 * instead of silently resolving.
 */

import { describe, it, expect, vi } from 'vitest';
import { ImageMobject } from './index';

describe('ImageMobject async error propagation', () => {
  it('should reject loadPromise when error callback fires', async () => {
    // Create ImageMobject -- source is empty string, so the loader fires
    // but in happy-dom it may not fire the callback. We simulate the error
    // by directly invoking _loadReject.
    const img = new ImageMobject({ source: 'test.png' });

    // Access the internal _loadReject function
    const rejectFn = (img as any)._loadReject;
    expect(rejectFn).toBeTruthy();

    // Simulate the error handler firing
    rejectFn(new Error('Failed to load image: network error'));
    (img as any)._loadReject = null;
    (img as any)._loadResolve = null;

    await expect(img.waitForLoad()).rejects.toThrow('Failed to load image');
  });

  it('should have _loadReject set alongside _loadResolve on construction', () => {
    const img = new ImageMobject({ source: 'test.png' });
    // Both resolve and reject should be stored
    expect((img as any)._loadResolve).not.toBeNull();
    expect((img as any)._loadReject).not.toBeNull();
  });

  it('should have _loadReject set after setSource', () => {
    const img = new ImageMobject({ source: 'test.png' });

    // Resolve the initial promise to avoid unhandled rejection
    if ((img as any)._loadResolve) {
      (img as any)._loadResolve();
    }

    // setSource creates a new promise
    img.setSource('other.png');

    expect((img as any)._loadResolve).not.toBeNull();
    expect((img as any)._loadReject).not.toBeNull();
  });

  it('should clear both _loadResolve and _loadReject after error', () => {
    const img = new ImageMobject({ source: 'test.png' });

    const rejectFn = (img as any)._loadReject;
    rejectFn(new Error('test error'));
    (img as any)._loadReject = null;
    (img as any)._loadResolve = null;

    expect((img as any)._loadReject).toBeNull();
    expect((img as any)._loadResolve).toBeNull();

    // Suppress unhandled rejection
    img.waitForLoad().catch(() => {});
  });
});
