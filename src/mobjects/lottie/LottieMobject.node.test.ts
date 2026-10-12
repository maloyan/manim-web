/**
 * Node/SSR safety for LottieMobject.
 *
 * This file runs in the default vitest 'node' environment (no happy-dom), so
 * there is no `document`. Importing and constructing a LottieMobject must not
 * throw; the load failure is captured instead of crashing the module.
 */

import { describe, it, expect } from 'vitest';
import { LottieMobject } from './index';

describe('LottieMobject Node safety', () => {
  it('imports without a DOM present', () => {
    expect(typeof document).toBe('undefined');
    expect(LottieMobject).toBeTruthy();
  });

  it('construction without a DOM fails gracefully', async () => {
    const mob = new LottieMobject({ animationData: { w: 100, h: 100, fr: 30 } });
    await expect(mob.waitForLoad()).rejects.toThrow('no DOM');
    expect(mob.getLoadError()).toBeInstanceOf(Error);
    expect(mob.isLoaded()).toBe(false);
  });
});
