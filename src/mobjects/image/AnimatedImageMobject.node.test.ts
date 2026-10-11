/**
 * Node/SSR safety for AnimatedImageMobject.
 *
 * This file runs in the default vitest 'node' environment (no happy-dom), so
 * there is no `document`. Importing and constructing an AnimatedImageMobject
 * must not throw; the default decoder refuses without a DOM and the error is
 * captured instead of crashing the module.
 */

import { describe, it, expect } from 'vitest';
import { AnimatedImageMobject } from './AnimatedImageMobject';

describe('AnimatedImageMobject Node safety', () => {
  it('imports without a DOM present', () => {
    expect(typeof document).toBe('undefined');
    expect(AnimatedImageMobject).toBeTruthy();
  });

  it('construction without a DOM fails gracefully', async () => {
    const gif = new AnimatedImageMobject({ source: 'anim.gif' });
    await expect(gif.waitForLoad()).rejects.toThrow();
    expect(gif.getLoadError()).toBeInstanceOf(Error);
    expect(gif.isLoaded()).toBe(false);
  });
});
