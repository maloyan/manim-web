/**
 * Node/SSR safety for VideoMobject.
 *
 * This file runs in the default vitest 'node' environment (no happy-dom), so
 * there is no `document`. Importing and constructing a VideoMobject must not
 * throw; the load failure is captured instead of crashing the module.
 */

import { describe, it, expect } from 'vitest';
import { VideoMobject } from './index';

describe('VideoMobject Node safety', () => {
  it('imports without a DOM present', () => {
    expect(typeof document).toBe('undefined');
    expect(VideoMobject).toBeTruthy();
  });

  it('construction without a DOM fails gracefully', async () => {
    const vid = new VideoMobject({ src: 'movie.mp4' });
    expect(vid.getLoadError()).toBeInstanceOf(Error);
    expect(vid.isLoaded()).toBe(false);
    await expect(vid.waitForLoad()).rejects.toThrow();
  });
});
