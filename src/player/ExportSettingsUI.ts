/**
 * ExportSettingsUI - opt-in export options for the PlayerUI export menu.
 *
 * Lets the user choose frame rate, output resolution and quality before
 * exporting, instead of subclassing Player/PlayerUI. The panel is pure DOM and
 * lives in this sibling file so PlayerUI.ts stays within its line budget.
 */

/** Concrete, resolved export settings handed to the exporter. */
export interface ExportSettings {
  /** Frames per second. */
  fps: number;
  /** Output width in pixels. */
  width: number;
  /** Output height in pixels. */
  height: number;
  /** 0-1; higher is better quality (maps to a higher video bitrate). */
  quality: number;
}

/** A named output resolution. `null` width/height means "use the current size". */
export interface ResolutionPreset {
  id: string;
  label: string;
  width: number | null;
  height: number | null;
}

/** A named quality level mapped to a 0-1 value. */
export interface QualityPreset {
  id: string;
  label: string;
  value: number;
}

/** The player's current output size and frame rate, used for defaults. */
export interface ExportDefaults {
  width: number;
  height: number;
  fps: number;
}

/** Selectable output resolutions. The first entry tracks the current size. */
export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { id: 'current', label: 'Current', width: null, height: null },
  { id: '480p', label: '480p', width: 854, height: 480 },
  { id: '720p', label: '720p', width: 1280, height: 720 },
  { id: '1080p', label: '1080p', width: 1920, height: 1080 },
  { id: '1440p', label: '1440p', width: 2560, height: 1440 },
  { id: '4k', label: '4K', width: 3840, height: 2160 },
];

/** Selectable frame rates. */
export const FPS_PRESETS: number[] = [24, 30, 60];

/** Selectable quality levels. */
export const QUALITY_PRESETS: QualityPreset[] = [
  { id: 'low', label: 'Low', value: 0.5 },
  { id: 'medium', label: 'Medium', value: 0.75 },
  { id: 'high', label: 'High', value: 0.9 },
];

/** Video bitrate in bits per second at quality 1. */
const MAX_VIDEO_BITRATE = 10_000_000;

/**
 * Convert a 0-1 quality to a WebCodecs bitrate in bits per second.
 * @param quality - Quality from 0 to 1 (clamped).
 * @returns The target bitrate.
 */
export function qualityToBitrate(quality: number): number {
  const clamped = Math.max(0, Math.min(1, quality));
  return Math.round(clamped * MAX_VIDEO_BITRATE);
}

/**
 * Resolve a resolution preset id to concrete pixel dimensions.
 * An unknown id, or the "current" preset, resolves to the current size.
 * @param presetId - The preset id.
 * @param currentWidth - The current output width.
 * @param currentHeight - The current output height.
 * @returns The resolved width and height.
 */
export function resolveResolution(
  presetId: string,
  currentWidth: number,
  currentHeight: number,
): { width: number; height: number } {
  const preset = RESOLUTION_PRESETS.find((p) => p.id === presetId);
  if (!preset || preset.width === null || preset.height === null) {
    return { width: currentWidth, height: currentHeight };
  }
  return { width: preset.width, height: preset.height };
}

/**
 * The settings panel shown inside the export menu when `exportControls` is on.
 * Renders fps, resolution and quality selectors and resolves the current choice
 * to concrete {@link ExportSettings} on demand.
 */
export class ExportSettingsPanel {
  private _element: HTMLElement;
  private _fpsSelect: HTMLSelectElement;
  private _resolutionSelect: HTMLSelectElement;
  private _qualitySelect: HTMLSelectElement;
  private _defaults: ExportDefaults;

  constructor(defaults: ExportDefaults) {
    this._defaults = defaults;

    this._element = document.createElement('div');
    Object.assign(this._element.style, {
      padding: '8px 14px',
      borderBottom: '1px solid rgba(255,255,255,0.12)',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    } satisfies Partial<CSSStyleDeclaration>);
    this._element.setAttribute('data-export-settings', '');

    this._fpsSelect = this._buildSelect(
      'FPS',
      FPS_PRESETS.map((fps) => ({ value: String(fps), label: `${fps} fps` })),
      String(this._nearestFps(defaults.fps)),
    );
    this._resolutionSelect = this._buildSelect(
      'Resolution',
      RESOLUTION_PRESETS.map((p) => ({ value: p.id, label: p.label })),
      'current',
    );
    this._qualitySelect = this._buildSelect(
      'Quality',
      QUALITY_PRESETS.map((q) => ({ value: String(q.value), label: q.label })),
      String(QUALITY_PRESETS[QUALITY_PRESETS.length - 1].value),
    );
  }

  /** The panel's root element, to insert into the export menu. */
  get element(): HTMLElement {
    return this._element;
  }

  /** Resolve the current selection to concrete export settings. */
  getSettings(): ExportSettings {
    const fps = parseInt(this._fpsSelect.value, 10);
    const { width, height } = resolveResolution(
      this._resolutionSelect.value,
      this._defaults.width,
      this._defaults.height,
    );
    const quality = parseFloat(this._qualitySelect.value);
    return { fps, width, height, quality };
  }

  /** Snap an arbitrary fps to the closest available preset. */
  private _nearestFps(fps: number): number {
    return FPS_PRESETS.reduce((best, cur) =>
      Math.abs(cur - fps) < Math.abs(best - fps) ? cur : best,
    );
  }

  private _buildSelect(
    label: string,
    options: Array<{ value: string; label: string }>,
    selected: string,
  ): HTMLSelectElement {
    const row = document.createElement('label');
    Object.assign(row.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '10px',
      fontSize: '12px',
    } satisfies Partial<CSSStyleDeclaration>);

    const text = document.createElement('span');
    text.textContent = label;
    text.style.opacity = '0.7';

    const select = document.createElement('select');
    Object.assign(select.style, {
      background: 'rgba(255,255,255,0.1)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '4px',
      padding: '2px 6px',
      fontSize: '12px',
      fontFamily: 'inherit',
      cursor: 'pointer',
      outline: 'none',
    } satisfies Partial<CSSStyleDeclaration>);

    for (const opt of options) {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      el.style.background = '#222';
      el.style.color = '#fff';
      select.appendChild(el);
    }
    // Set the initial value after all options exist so the selection sticks.
    select.value = selected;
    // Stop clicks inside the panel from closing the menu or toggling playback.
    select.addEventListener('click', (e) => e.stopPropagation());

    row.appendChild(text);
    row.appendChild(select);
    this._element.appendChild(row);
    return select;
  }
}
