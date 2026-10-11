// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PlayerUI, PlayerUICallbacks } from './PlayerUI';

function createCallbacks(): PlayerUICallbacks {
  return {
    onPlayPause: vi.fn(),
    onSeek: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onSpeedChange: vi.fn(),
    onFullscreen: vi.fn(),
    onExport: vi.fn(),
    onSlidesToggle: vi.fn(),
    getExportDefaults: vi.fn(() => ({ width: 800, height: 450, fps: 60 })),
  };
}

function createContainer(): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function findExportBtn(container: HTMLElement): HTMLButtonElement {
  const bar = container.querySelector('[data-player-bar]') as HTMLElement;
  for (const btn of bar.querySelectorAll('button')) {
    if (btn.title.includes('Export')) return btn;
  }
  throw new Error('export button not found');
}

function bodyMenu(): HTMLElement {
  const bars = document.body.querySelectorAll(':scope > [data-player-bar]');
  return bars[bars.length - 1] as HTMLElement;
}

describe('PlayerUI export controls', () => {
  let ui: PlayerUI;

  afterEach(() => {
    ui?.dispose();
    document.body.querySelectorAll(':scope > [data-player-bar]').forEach((el) => el.remove());
    document.body.querySelectorAll('div').forEach((el) => {
      if (el.parentElement === document.body) el.remove();
    });
  });

  it('does NOT add a settings panel when exportControls is off (default)', () => {
    const container = createContainer();
    const callbacks = createCallbacks();
    ui = new PlayerUI(container, callbacks);
    findExportBtn(container).click();

    const menu = bodyMenu();
    // Default menu is exactly the three format rows — no settings panel.
    expect(menu.children.length).toBe(3);
    expect(menu.querySelectorAll('select').length).toBe(0);
  });

  it('calls onExport with a single format argument when controls are off', () => {
    const container = createContainer();
    const callbacks = createCallbacks();
    ui = new PlayerUI(container, callbacks);
    findExportBtn(container).click();

    const menu = bodyMenu();
    (menu.children[0] as HTMLElement).click(); // gif
    expect(callbacks.onExport).toHaveBeenCalledWith('gif');
    expect((callbacks.onExport as ReturnType<typeof vi.fn>).mock.calls[0].length).toBe(1);
  });

  it('adds fps/resolution/quality selects to the menu when exportControls is on', () => {
    const container = createContainer();
    const callbacks = createCallbacks();
    ui = new PlayerUI(container, callbacks, { exportControls: true });
    findExportBtn(container).click();

    const menu = bodyMenu();
    expect(menu.querySelectorAll('select').length).toBe(3);
  });

  it('passes the chosen export settings to onExport when controls are on', () => {
    const container = createContainer();
    const callbacks = createCallbacks();
    ui = new PlayerUI(container, callbacks, { exportControls: true });
    findExportBtn(container).click();

    const menu = bodyMenu();
    const selects = menu.querySelectorAll('select');
    const [fpsSelect, resolutionSelect] = Array.from(selects);
    fpsSelect.value = '30';
    resolutionSelect.value = '1080p';

    // The format rows follow the settings panel; find the mp4 row by text.
    const rows = Array.from(menu.querySelectorAll('div')).filter((d) =>
      d.textContent?.includes('MP4'),
    );
    (rows[rows.length - 1] as HTMLElement).click();

    expect(callbacks.onExport).toHaveBeenCalledTimes(1);
    const [format, settings] = (callbacks.onExport as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(format).toBe('mp4');
    expect(settings).toMatchObject({ fps: 30, width: 1920, height: 1080 });
    expect(typeof settings.quality).toBe('number');
  });

  it('uses getExportDefaults for the current resolution default', () => {
    const container = createContainer();
    const callbacks = createCallbacks();
    ui = new PlayerUI(container, callbacks, { exportControls: true });
    findExportBtn(container).click();

    const menu = bodyMenu();
    const rows = Array.from(menu.querySelectorAll('div')).filter((d) =>
      d.textContent?.includes('WebM'),
    );
    (rows[rows.length - 1] as HTMLElement).click();

    const [, settings] = (callbacks.onExport as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(settings).toMatchObject({ width: 800, height: 450, fps: 60 });
  });
});
