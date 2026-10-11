// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';

import { announceMobject, AriaNarrator, createLiveRegion } from './ariaNarration';

describe('createLiveRegion (DOM)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a visually hidden polite live region on the body', () => {
    const region = createLiveRegion();
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.parentElement).toBe(document.body);
    // Visually hidden: collapsed to a 1px clipped box, not display:none
    // (display:none regions are not announced by screen readers).
    expect(region?.style.position).toBe('absolute');
    expect(region?.style.width).toBe('1px');
  });

  it('reuses the same region id instead of stacking duplicates', () => {
    const first = createLiveRegion();
    const second = createLiveRegion();
    expect(first).toBe(second);
    expect(document.querySelectorAll('#manim-web-aria-live').length).toBe(1);
  });

  it('honors an assertive politeness setting', () => {
    const region = createLiveRegion({ id: 'assertive-region', assertive: true });
    expect(region?.getAttribute('aria-live')).toBe('assertive');
  });
});

describe('AriaNarrator (DOM)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('announces a message into the region text', () => {
    const narrator = new AriaNarrator({ id: 'narrator-region' });
    expect(narrator.available).toBe(true);
    narrator.announce('Scene one');
    expect(document.getElementById('narrator-region')?.textContent).toBe('Scene one');
  });

  it('announceMobject speaks the composed description and reports true', () => {
    const narrator = new AriaNarrator({ id: 'mob-region' });
    const spoke = announceMobject(narrator, { ariaLabel: 'Square', ariaDescription: 'blue' });
    expect(spoke).toBe(true);
    expect(document.getElementById('mob-region')?.textContent).toBe('Square. blue');
  });

  it('destroy() removes the region from the document', () => {
    const narrator = new AriaNarrator({ id: 'temp-region' });
    expect(document.getElementById('temp-region')).not.toBeNull();
    narrator.destroy();
    expect(document.getElementById('temp-region')).toBeNull();
    expect(narrator.available).toBe(false);
  });
});
