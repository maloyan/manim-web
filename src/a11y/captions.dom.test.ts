// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';

import { attachCaptionTrack } from './captions';

describe('attachCaptionTrack (DOM)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a captions <track> child on the video with a blob src', () => {
    const video = document.createElement('video');
    document.body.appendChild(video);

    const handle = attachCaptionTrack(video, 'WEBVTT\n', { label: 'English', language: 'en' });

    expect(handle).not.toBeNull();
    const track = video.querySelector('track');
    expect(track).not.toBeNull();
    expect(track?.getAttribute('kind')).toBe('captions');
    expect(track?.getAttribute('label')).toBe('English');
    expect(track?.getAttribute('srclang')).toBe('en');
    expect(handle?.url).toMatch(/^blob:/);
  });

  it('remove() detaches the track element and is safe to call twice', () => {
    const video = document.createElement('video');
    document.body.appendChild(video);

    const handle = attachCaptionTrack(video, 'WEBVTT\n');
    expect(video.querySelector('track')).not.toBeNull();

    handle?.remove();
    expect(video.querySelector('track')).toBeNull();
    expect(() => handle?.remove()).not.toThrow();
  });
});
