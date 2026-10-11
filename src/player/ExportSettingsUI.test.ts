// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ExportSettingsPanel,
  resolveResolution,
  qualityToBitrate,
  RESOLUTION_PRESETS,
  FPS_PRESETS,
  QUALITY_PRESETS,
} from './ExportSettingsUI';

// ---------------------------------------------------------------------------
// resolveResolution
// ---------------------------------------------------------------------------

describe('resolveResolution', () => {
  it('maps 720p preset to 1280x720', () => {
    expect(resolveResolution('720p', 800, 450)).toEqual({ width: 1280, height: 720 });
  });

  it('maps 1080p preset to 1920x1080', () => {
    expect(resolveResolution('1080p', 800, 450)).toEqual({ width: 1920, height: 1080 });
  });

  it('maps 4k preset to 3840x2160', () => {
    expect(resolveResolution('4k', 800, 450)).toEqual({ width: 3840, height: 2160 });
  });

  it('uses the current size for the "current" preset', () => {
    expect(resolveResolution('current', 640, 360)).toEqual({ width: 640, height: 360 });
  });

  it('falls back to the current size for an unknown preset', () => {
    expect(resolveResolution('nope', 123, 456)).toEqual({ width: 123, height: 456 });
  });

  it('every non-current preset has concrete dimensions', () => {
    for (const preset of RESOLUTION_PRESETS) {
      if (preset.id === 'current') {
        expect(preset.width).toBeNull();
        expect(preset.height).toBeNull();
      } else {
        expect(typeof preset.width).toBe('number');
        expect(typeof preset.height).toBe('number');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// qualityToBitrate
// ---------------------------------------------------------------------------

describe('qualityToBitrate', () => {
  it('maps quality 1 to the maximum bitrate', () => {
    expect(qualityToBitrate(1)).toBe(10_000_000);
  });

  it('maps quality 0.5 to half the maximum bitrate', () => {
    expect(qualityToBitrate(0.5)).toBe(5_000_000);
  });

  it('clamps out-of-range values', () => {
    expect(qualityToBitrate(2)).toBe(10_000_000);
    expect(qualityToBitrate(-1)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ExportSettingsPanel
// ---------------------------------------------------------------------------

describe('ExportSettingsPanel', () => {
  let panel: ExportSettingsPanel;

  beforeEach(() => {
    panel = new ExportSettingsPanel({ width: 800, height: 450, fps: 60 });
    document.body.appendChild(panel.element);
  });

  afterEach(() => {
    panel.element.remove();
  });

  it('renders three select controls (fps, resolution, quality)', () => {
    const selects = panel.element.querySelectorAll('select');
    expect(selects.length).toBe(3);
  });

  it('exposes fps, resolution and quality presets as options', () => {
    const selects = panel.element.querySelectorAll('select');
    const optionCounts = Array.from(selects).map((s) => s.querySelectorAll('option').length);
    expect(optionCounts).toContain(FPS_PRESETS.length);
    expect(optionCounts).toContain(RESOLUTION_PRESETS.length);
    expect(optionCounts).toContain(QUALITY_PRESETS.length);
  });

  it('defaults to the current resolution and provided fps', () => {
    const settings = panel.getSettings();
    expect(settings.width).toBe(800);
    expect(settings.height).toBe(450);
    expect(settings.fps).toBe(60);
  });

  it('getSettings reflects the chosen fps, resolution and quality', () => {
    const selects = panel.element.querySelectorAll('select');
    const [fpsSelect, resolutionSelect, qualitySelect] = Array.from(selects);

    fpsSelect.value = '30';
    resolutionSelect.value = '1080p';
    qualitySelect.value = String(QUALITY_PRESETS[0].value);

    const settings = panel.getSettings();
    expect(settings.fps).toBe(30);
    expect(settings.width).toBe(1920);
    expect(settings.height).toBe(1080);
    expect(settings.quality).toBe(QUALITY_PRESETS[0].value);
  });
});
