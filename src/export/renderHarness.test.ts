// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./WebCodecsExporter', () => ({
  WebCodecsExporter: class {
    static isSupported() {
      return true;
    }
    startCapture() {
      return Promise.resolve({
        hasAudio: false,
        frameCount: 0,
        captureFrame: () => Promise.resolve(),
        finish: () => Promise.resolve(new Blob()),
      });
    }
  },
  avcCodecString: () => 'avc1.640028',
}));

import { registerRender, type RenderableScene } from './renderHarness';

function mockScene(): RenderableScene {
  return {
    getCanvas: () => document.createElement('canvas'),
    getWidth: () => 320,
    getHeight: () => 240,
    seek: () => {},
    getTimelineDuration: () => null,
    render: () => {},
    setFrameAspect: () => {},
    audioManager: { startTimelineClock: () => {}, pendingLoads: 0, tracks: [] },
  } as unknown as RenderableScene;
}

const START = { width: 320, height: 240, fps: 30, format: 'mp4' as const };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('registerRender failure reporting', () => {
  // MIGRATION: example for the property
  //   ∀ uncaught error or unhandled rejection in the page after start(),
  //   isDone() === true and error() names it, even when the #playBtn
  //   handler re-enables its button.
  // Replace with a property test once the suite lands.
  it('turns a window error and an unhandled rejection into a failed render', async () => {
    document.body.innerHTML = '<button id="playBtn"></button>';
    const button = document.getElementById('playBtn') as HTMLButtonElement;
    button.addEventListener('click', () => {
      button.disabled = true;
    });

    const byError = registerRender(mockScene());
    await byError.start(START);
    expect(byError.isDone()).toBe(false);
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('scene threw') }));
    button.disabled = false; // a `finally` re-enables the button
    expect(byError.isDone()).toBe(true);
    expect(byError.error()).toBe('scene threw');

    const byRejection = registerRender(mockScene());
    await byRejection.start(START);
    window.dispatchEvent(
      Object.assign(new Event('unhandledrejection'), { reason: new Error('async handler failed') }),
    );
    expect(byRejection.error()).toBe('async handler failed');
  });
});
