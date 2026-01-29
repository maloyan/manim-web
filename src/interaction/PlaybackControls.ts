/**
 * PlaybackControls - Specialized controls for timeline playback.
 * Provides play/pause, timeline scrubbing, and playback speed controls.
 */

import { Scene } from '../core/Scene';
import { Controls, ControlsOptions } from './Controls';

/**
 * Options for configuring PlaybackControls.
 */
export interface PlaybackControlsOptions extends ControlsOptions {
  /** Show timeline scrubber. Defaults to true. */
  showTimeline?: boolean;
  /** Show play/pause button. Defaults to true. */
  showPlayPause?: boolean;
  /** Show playback speed control. Defaults to true. */
  showSpeed?: boolean;
}

/**
 * Callback for playback time updates.
 */
export type TimeUpdateCallback = (currentTime: number, duration: number) => void;

/**
 * PlaybackControls for timeline manipulation.
 * Extends Controls to add playback-specific UI elements.
 */
export class PlaybackControls extends Controls {
  private _timeline: HTMLInputElement | null = null;
  private _playPauseBtn: HTMLButtonElement | null = null;
  private _speedSelect: HTMLSelectElement | null = null;
  private _timeDisplay: HTMLElement | null = null;
  private _isPlaying: boolean = false;
  private _playbackRate: number = 1;
  private _updateInterval: number | null = null;
  private _onTimeUpdate: TimeUpdateCallback | null = null;

  /**
   * Create new PlaybackControls.
   * @param scene - The scene to control
   * @param options - Configuration options
   */
  constructor(scene: Scene, options: PlaybackControlsOptions = {}) {
    super(scene, options);
    this._createPlaybackUI(options);
    this._startUpdateLoop();
  }

  /**
   * Set callback for time updates.
   * @param callback - Function called when time changes
   */
  onTimeUpdate(callback: TimeUpdateCallback): void {
    this._onTimeUpdate = callback;
  }

  /**
   * Get the current playback rate.
   */
  get playbackRate(): number {
    return this._playbackRate;
  }

  /**
   * Set the playback rate.
   */
  set playbackRate(rate: number) {
    this._playbackRate = rate;
    if (this._speedSelect) {
      this._speedSelect.value = String(rate);
    }
  }

  /**
   * Create the playback-specific UI elements.
   */
  private _createPlaybackUI(options: PlaybackControlsOptions): void {
    // Add section label
    this.addLabel('Playback');

    // Play/Pause button
    if (options.showPlayPause !== false) {
      this._playPauseBtn = this._createPlayPauseButton();
    }

    // Timeline scrubber
    if (options.showTimeline !== false) {
      this._timeline = this._createTimelineScrubber();
    }

    // Speed control
    if (options.showSpeed !== false) {
      this._speedSelect = this._createSpeedControl();
    }
  }

  /**
   * Create the play/pause toggle button.
   */
  private _createPlayPauseButton(): HTMLButtonElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    `;

    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.innerHTML = this._getPlayIcon();

    const accentColor = this._getAccentColor();
    const hoverColor = this._getHoverColor();

    playPauseBtn.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      background: ${accentColor};
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      transition: background-color 0.15s ease;
      outline: none;
      touch-action: manipulation;
    `;

    playPauseBtn.addEventListener('mouseenter', () => {
      playPauseBtn.style.background = hoverColor;
    });
    playPauseBtn.addEventListener('mouseleave', () => {
      playPauseBtn.style.background = accentColor;
    });

    playPauseBtn.addEventListener('click', () => {
      this._togglePlayPause();
    });

    // Stop button
    const stopBtn = document.createElement('button');
    stopBtn.innerHTML = this._getStopIcon();
    stopBtn.style.cssText = `
      padding: 10px 14px;
      border: 2px solid ${this._getBorderColor()};
      border-radius: 6px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      transition: border-color 0.15s ease;
      outline: none;
      touch-action: manipulation;
    `;

    stopBtn.addEventListener('mouseenter', () => {
      stopBtn.style.borderColor = accentColor;
    });
    stopBtn.addEventListener('mouseleave', () => {
      stopBtn.style.borderColor = this._getBorderColor();
    });

    stopBtn.addEventListener('click', () => {
      this._scene.stop();
      this._isPlaying = false;
      this._updatePlayPauseButton();
    });

    wrapper.appendChild(playPauseBtn);
    wrapper.appendChild(stopBtn);
    this._panel.appendChild(wrapper);

    return playPauseBtn;
  }

  /**
   * Toggle between play and pause states.
   */
  private _togglePlayPause(): void {
    if (this._isPlaying) {
      this._scene.pause();
      this._isPlaying = false;
    } else {
      this._scene.resume();
      this._isPlaying = true;
    }
    this._updatePlayPauseButton();
  }

  /**
   * Update the play/pause button icon.
   */
  private _updatePlayPauseButton(): void {
    if (this._playPauseBtn) {
      this._playPauseBtn.innerHTML = this._isPlaying ? this._getPauseIcon() : this._getPlayIcon();
    }
  }

  /**
   * Create the timeline scrubber.
   */
  private _createTimelineScrubber(): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom: 12px;';

    // Time display row
    const timeRow = document.createElement('div');
    timeRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 12px;
    `;

    this._timeDisplay = document.createElement('span');
    this._timeDisplay.textContent = '0:00.00';
    this._timeDisplay.style.opacity = '0.8';

    const durationDisplay = document.createElement('span');
    durationDisplay.textContent = '0:00.00';
    durationDisplay.style.opacity = '0.6';
    durationDisplay.id = 'manimweb-duration-display';

    timeRow.appendChild(this._timeDisplay);
    timeRow.appendChild(durationDisplay);

    // Timeline slider
    const timeline = document.createElement('input');
    timeline.type = 'range';
    timeline.min = '0';
    timeline.max = '100';
    timeline.step = '0.1';
    timeline.value = '0';
    timeline.style.cssText = `
      width: 100%;
      height: 8px;
      appearance: none;
      -webkit-appearance: none;
      background: ${this._getBorderColor()};
      border-radius: 4px;
      outline: none;
      cursor: pointer;
    `;

    timeline.addEventListener('input', () => {
      const timeline_ = this._scene.timeline;
      if (timeline_) {
        const duration = timeline_.getDuration();
        const time = (parseFloat(timeline.value) / 100) * duration;
        this._scene.seek(time);
        this._updateTimeDisplay(time, duration);
      }
    });

    // Store reference to duration display for updates
    (timeline as any)._durationDisplay = durationDisplay;

    wrapper.appendChild(timeRow);
    wrapper.appendChild(timeline);
    this._panel.appendChild(wrapper);

    return timeline;
  }

  /**
   * Create the playback speed control.
   */
  private _createSpeedControl(): HTMLSelectElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    `;

    const label = document.createElement('span');
    label.textContent = 'Speed';
    label.style.cssText = 'font-weight: 500;';

    const select = document.createElement('select');
    select.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 2px solid ${this._getBorderColor()};
      border-radius: 6px;
      background: transparent;
      color: inherit;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M3 4l3 4 3-4H3z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 30px;
    `;

    const speeds = [
      { value: 0.25, label: '0.25x' },
      { value: 0.5, label: '0.5x' },
      { value: 0.75, label: '0.75x' },
      { value: 1, label: '1x' },
      { value: 1.25, label: '1.25x' },
      { value: 1.5, label: '1.5x' },
      { value: 2, label: '2x' },
    ];

    for (const speed of speeds) {
      const option = document.createElement('option');
      option.value = String(speed.value);
      option.textContent = speed.label;
      if (speed.value === 1) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      this._playbackRate = parseFloat(select.value);
      // Note: Actual playback rate adjustment would need to be implemented
      // in the Scene/Timeline to take effect
    });

    select.addEventListener('focus', () => {
      select.style.borderColor = this._getAccentColor();
    });
    select.addEventListener('blur', () => {
      select.style.borderColor = this._getBorderColor();
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    this._panel.appendChild(wrapper);

    return select;
  }

  /**
   * Update the time display.
   * @param currentTime - Current playback time in seconds
   * @param duration - Total duration in seconds
   */
  updateTime(currentTime: number, duration: number): void {
    this._updateTimeDisplay(currentTime, duration);
    this._updateTimelineSlider(currentTime, duration);

    if (this._onTimeUpdate) {
      this._onTimeUpdate(currentTime, duration);
    }
  }

  /**
   * Update the time display text.
   */
  private _updateTimeDisplay(currentTime: number, duration: number): void {
    if (this._timeDisplay) {
      this._timeDisplay.textContent = this._formatTime(currentTime);
    }

    if (this._timeline) {
      const durationDisplay = (this._timeline as any)._durationDisplay as HTMLElement;
      if (durationDisplay) {
        durationDisplay.textContent = this._formatTime(duration);
      }
    }
  }

  /**
   * Update the timeline slider position.
   */
  private _updateTimelineSlider(currentTime: number, duration: number): void {
    if (this._timeline && duration > 0) {
      const percentage = (currentTime / duration) * 100;
      this._timeline.value = String(percentage);
    }
  }

  /**
   * Format time in M:SS.mm format.
   */
  private _formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const secsStr = secs.toFixed(2).padStart(5, '0');
    return `${mins}:${secsStr}`;
  }

  /**
   * Start the update loop to sync UI with scene state.
   */
  private _startUpdateLoop(): void {
    const update = () => {
      const timeline = this._scene.timeline;
      if (timeline) {
        const currentTime = timeline.getCurrentTime();
        const duration = timeline.getDuration();
        this.updateTime(currentTime, duration);
      }

      // Sync playing state
      const wasPlaying = this._isPlaying;
      this._isPlaying = this._scene.isPlaying;
      if (wasPlaying !== this._isPlaying) {
        this._updatePlayPauseButton();
      }

      this._updateInterval = requestAnimationFrame(update) as unknown as number;
    };

    this._updateInterval = requestAnimationFrame(update) as unknown as number;
  }

  /**
   * Get play icon SVG.
   */
  private _getPlayIcon(): string {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2l10 6-10 6V2z"/>
      </svg>
      <span>Play</span>
    `;
  }

  /**
   * Get pause icon SVG.
   */
  private _getPauseIcon(): string {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="3" y="2" width="4" height="12"/>
        <rect x="9" y="2" width="4" height="12"/>
      </svg>
      <span>Pause</span>
    `;
  }

  /**
   * Get stop icon SVG.
   */
  private _getStopIcon(): string {
    return `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <rect x="3" y="3" width="10" height="10"/>
      </svg>
    `;
  }

  /**
   * Clean up resources.
   */
  override dispose(): void {
    if (this._updateInterval !== null) {
      cancelAnimationFrame(this._updateInterval);
      this._updateInterval = null;
    }
    super.dispose();
  }
}
