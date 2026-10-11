import { describe, expect, it } from 'vitest';

import { announceMobject, AriaNarrator, createLiveRegion, describeMobject } from './ariaNarration';

describe('describeMobject', () => {
  it('joins label and description with a period', () => {
    expect(describeMobject({ ariaLabel: 'Circle', ariaDescription: 'radius 2' })).toBe(
      'Circle. radius 2',
    );
  });

  it('uses whichever of label or description is present', () => {
    expect(describeMobject({ ariaLabel: 'Circle' })).toBe('Circle');
    expect(describeMobject({ ariaDescription: 'radius 2' })).toBe('radius 2');
  });

  it('returns null when neither is a non-empty string', () => {
    expect(describeMobject({})).toBeNull();
    expect(describeMobject({ ariaLabel: '   ' })).toBeNull();
  });
});

describe('createLiveRegion / AriaNarrator (non-DOM guard)', () => {
  it('createLiveRegion returns null without a document', () => {
    expect(typeof document).toBe('undefined');
    expect(createLiveRegion()).toBeNull();
  });

  it('AriaNarrator is unavailable and announce() is a safe no-op', () => {
    const narrator = new AriaNarrator();
    expect(narrator.available).toBe(false);
    expect(() => narrator.announce('hello')).not.toThrow();
    expect(() => narrator.clear()).not.toThrow();
    expect(() => narrator.destroy()).not.toThrow();
  });

  it('announceMobject returns false when there is nothing to say', () => {
    const narrator = new AriaNarrator();
    expect(announceMobject(narrator, {})).toBe(false);
  });
});
