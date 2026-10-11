// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Player } from './Player';
import { WebCodecsExporter } from '../export/WebCodecsExporter';
import type { ExportSettings } from './ExportSettingsUI';

function createPlayer(opts = {}): { player: Player; container: HTMLElement } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const player = new Player(container, { width: 800, height: 450, headless: true, ...opts });
  return { player, container };
}

const SETTINGS: ExportSettings = { fps: 30, width: 1920, height: 1080, quality: 0.5 };

describe('Player export options', () => {
  let player: Player;
  let container: HTMLElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    const result = createPlayer();
    player = result.player;
    container = result.container;
    await player.sequence(async (scene) => {
      await scene.wait(1);
    });
  });

  afterEach(() => {
    player.dispose();
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exposes exportControls option on the Player', () => {
    player.dispose();
    container.remove();
    const result = createPlayer({ exportControls: true });
    player = result.player;
    container = result.container;
    expect((player as unknown as { _exportControls: boolean })._exportControls).toBe(true);
  });

  // ---- Fallback (MediaRecorder / Scene.export) path ----

  it('passes chosen fps, resolution and quality through to the exporter', async () => {
    // No VideoEncoder in happy-dom -> falls back to Scene.export (VideoExporter).
    vi.stubGlobal('VideoEncoder', undefined);
    const exportSpy = vi.spyOn(player.scene, 'export').mockResolvedValue(new Blob());

    await player.exportAs('webm', SETTINGS);

    expect(exportSpy).toHaveBeenCalledTimes(1);
    const [filename, options] = exportSpy.mock.calls[0];
    expect(filename).toBe('animation.webm');
    expect(options).toMatchObject({ fps: 30, quality: 0.5, width: 1920, height: 1080 });
  });

  it('leaves default behavior unchanged when no settings are given', async () => {
    vi.stubGlobal('VideoEncoder', undefined);
    const exportSpy = vi.spyOn(player.scene, 'export').mockResolvedValue(new Blob());

    await player.exportAs('gif');

    const [filename, options] = exportSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(filename).toBe('animation.gif');
    // Default export must not force fps/quality — Scene keeps its format defaults.
    expect(options).not.toHaveProperty('fps');
    expect(options).not.toHaveProperty('quality');
    expect(options).toHaveProperty('duration');
  });

  it('does not force a video quality onto GIF export even with settings', async () => {
    vi.stubGlobal('VideoEncoder', undefined);
    const exportSpy = vi.spyOn(player.scene, 'export').mockResolvedValue(new Blob());

    await player.exportAs('gif', SETTINGS);

    const [, options] = exportSpy.mock.calls[0] as [string, Record<string, unknown>];
    expect(options).toMatchObject({ fps: 30, width: 1920, height: 1080 });
    // 0-1 quality is a video bitrate dial; GIF quality (1-30) must not be set from it.
    expect(options).not.toHaveProperty('quality');
  });

  // ---- WebCodecs path ----

  it('uses WebCodecs for video when supported, not Scene.export', async () => {
    class MockVideoEncoder {}
    vi.stubGlobal('VideoEncoder', MockVideoEncoder);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    // downloadBlob clicks an <a>; stop happy-dom from trying to navigate.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const webCodecsSpy = vi
      .spyOn(WebCodecsExporter.prototype, 'export')
      .mockResolvedValue(new Blob([], { type: 'video/webm' }));
    const exportSpy = vi.spyOn(player.scene, 'export').mockResolvedValue(new Blob());

    await player.exportAs('webm', SETTINGS);

    expect(webCodecsSpy).toHaveBeenCalledTimes(1);
    expect(exportSpy).not.toHaveBeenCalled();
  });

  it('still uses Scene.export for GIF even when WebCodecs is supported', async () => {
    class MockVideoEncoder {}
    vi.stubGlobal('VideoEncoder', MockVideoEncoder);
    const webCodecsSpy = vi.spyOn(WebCodecsExporter.prototype, 'export');
    const exportSpy = vi.spyOn(player.scene, 'export').mockResolvedValue(new Blob());

    await player.exportAs('gif', SETTINGS);

    expect(webCodecsSpy).not.toHaveBeenCalled();
    expect(exportSpy).toHaveBeenCalledTimes(1);
  });
});
