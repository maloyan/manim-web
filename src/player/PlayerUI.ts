/**
 * PlayerUI - Video-player-style bottom bar overlay for the Player.
 * Pure DOM/CSS, positioned absolutely over the canvas container.
 */

import type { MasterTimeline } from '../animation/MasterTimeline';

export interface PlayerUICallbacks {
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeedChange: (rate: number) => void;
  onFullscreen: () => void;
  onExport: (format: string) => void;
}

export interface PlayerUIOptions {
  /** Auto-hide controls after this many ms of inactivity. 0 = never hide. Default 2500. */
  autoHideMs?: number;
}

export class PlayerUI {
  private _container: HTMLElement;
  private _bar: HTMLElement;
  private _playBtn: HTMLButtonElement;
  private _prevBtn: HTMLButtonElement;
  private _nextBtn: HTMLButtonElement;
  private _progressWrap: HTMLElement;
  private _progressFill: HTMLElement;
  private _segmentMarkers: HTMLElement;
  private _timeDisplay: HTMLElement;
  private _speedSelect: HTMLSelectElement;
  private _fullscreenBtn: HTMLButtonElement;
  private _exportBtn: HTMLButtonElement;
  private _exportMenu: HTMLElement | null = null;
  private _exportMenuBackdrop: HTMLElement | null = null;
  private _exportBtnWrapper: HTMLElement | null = null;
  private _callbacks: PlayerUICallbacks;
  private _autoHideMs: number;
  private _hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private _isVisible: boolean = true;
  private _isDragging: boolean = false;
  private _duration: number = 0;
  private _isPlaying: boolean = false;

  // Bound handlers for cleanup
  private _onMouseMove: () => void;
  private _onMouseLeave: () => void;
  private _onProgressDown: (e: MouseEvent) => void;
  private _onProgressMove: (e: MouseEvent) => void;
  private _onProgressUp: () => void;

  constructor(container: HTMLElement, callbacks: PlayerUICallbacks, options: PlayerUIOptions = {}) {
    this._container = container;
    this._callbacks = callbacks;
    this._autoHideMs = options.autoHideMs ?? 2500;

    // Ensure container has relative positioning for absolute overlay
    const pos = getComputedStyle(container).position;
    if (pos === 'static') {
      container.style.position = 'relative';
    }
    container.style.overflow = 'hidden';

    // Build the UI
    this._bar = this._createBar();
    this._playBtn = this._createPlayBtn();
    this._prevBtn = this._createNavBtn('prev');
    this._nextBtn = this._createNavBtn('next');
    const progressResult = this._createProgressBar();
    this._progressWrap = progressResult.wrap;
    this._progressFill = progressResult.fill;
    this._segmentMarkers = progressResult.markers;
    this._timeDisplay = this._createTimeDisplay();
    this._speedSelect = this._createSpeedSelect();
    this._fullscreenBtn = this._createFullscreenBtn();
    this._exportBtn = this._createExportBtn();

    // Assemble
    const leftGroup = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    });
    leftGroup.appendChild(this._prevBtn);
    leftGroup.appendChild(this._playBtn);
    leftGroup.appendChild(this._nextBtn);

    const rightGroup = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    });
    rightGroup.appendChild(this._timeDisplay);
    rightGroup.appendChild(this._speedSelect);
    // Export button is wrapped in a positioned container for the dropdown menu
    rightGroup.appendChild(this._exportBtnWrapper!);
    rightGroup.appendChild(this._fullscreenBtn);

    // Top row: progress bar spanning full width
    this._bar.appendChild(this._progressWrap);

    // Bottom row: controls
    const controlsRow = el('div', {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 12px 8px',
    });
    controlsRow.appendChild(leftGroup);
    controlsRow.appendChild(rightGroup);
    this._bar.appendChild(controlsRow);

    container.appendChild(this._bar);

    // Auto-hide logic
    this._onMouseMove = () => this._showControls();
    this._onMouseLeave = () => this._scheduleHide();

    container.addEventListener('mousemove', this._onMouseMove);
    container.addEventListener('mouseleave', this._onMouseLeave);

    // Click on canvas area to toggle play/pause (skip if clicking controls)
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-player-bar]')) return;
      this._callbacks.onPlayPause();
    });

    // Progress bar drag
    this._onProgressDown = (e) => this._startDrag(e);
    this._onProgressMove = (e) => this._moveDrag(e);
    this._onProgressUp = () => this._endDrag();

    this._progressWrap.addEventListener('mousedown', this._onProgressDown);
    document.addEventListener('mousemove', this._onProgressMove);
    document.addEventListener('mouseup', this._onProgressUp);
  }

  // ---------------------------------------------------------------------------
  // Public update methods (called by Player on every frame)
  // ---------------------------------------------------------------------------

  updateTime(currentTime: number, duration: number): void {
    this._duration = duration;
    if (!this._isDragging && duration > 0) {
      const pct = (currentTime / duration) * 100;
      this._progressFill.style.width = `${pct}%`;
    }
    this._timeDisplay.textContent = `${fmt(currentTime)} / ${fmt(duration)}`;
  }

  setPlaying(playing: boolean, finished: boolean = false): void {
    this._isPlaying = playing;
    if (finished) {
      this._playBtn.innerHTML = REPLAY_ICON;
      this._playBtn.title = 'Replay (Space)';
    } else {
      this._playBtn.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
      this._playBtn.title = playing ? 'Pause (Space)' : 'Play (Space)';
    }
    if (playing) {
      this._scheduleHide();
    }
  }

  setSegments(timeline: MasterTimeline): void {
    this._segmentMarkers.innerHTML = '';
    const segments = timeline.getSegments();
    const duration = timeline.getDuration();
    if (duration <= 0) return;

    for (const seg of segments) {
      if (seg.index === 0) continue; // no marker at 0
      const pct = (seg.startTime / duration) * 100;
      const marker = el('div', {
        position: 'absolute',
        left: `${pct}%`,
        top: '50%',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.45)',
        pointerEvents: 'none',
        transform: 'translate(-2px, -2px)',
      });
      this._segmentMarkers.appendChild(marker);
    }
  }

  // ---------------------------------------------------------------------------
  // Internal: build UI elements
  // ---------------------------------------------------------------------------

  private _createBar(): HTMLElement {
    const bar = el('div', {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
      zIndex: '1000',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      userSelect: 'none',
      cursor: 'default',
    });
    bar.setAttribute('data-player-bar', '');
    return bar;
  }

  private _createPlayBtn(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = PLAY_ICON;
    btn.title = 'Play (Space)';
    applyBtnStyle(btn, '36px', '36px');
    btn.addEventListener('click', () => this._callbacks.onPlayPause());
    return btn;
  }

  private _createNavBtn(dir: 'prev' | 'next'): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = dir === 'prev' ? PREV_ICON : NEXT_ICON;
    btn.title = dir === 'prev' ? 'Previous (Left arrow)' : 'Next (Right arrow)';
    applyBtnStyle(btn, '28px', '28px');
    btn.addEventListener('click', () => {
      if (dir === 'prev') this._callbacks.onPrev();
      else this._callbacks.onNext();
    });
    return btn;
  }

  private _createProgressBar() {
    const wrap = el('div', {
      position: 'relative',
      height: '16px',
      padding: '6px 12px',
      cursor: 'pointer',
    });

    const track = el('div', {
      position: 'absolute',
      left: '12px',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      height: '4px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '2px',
      overflow: 'visible',
    });

    const fill = el('div', {
      width: '0%',
      height: '100%',
      background: '#4a9eff',
      borderRadius: '2px',
      transition: 'none',
      position: 'relative',
    });

    // Playhead dot
    const dot = el('div', {
      position: 'absolute',
      right: '-5px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: '#4a9eff',
      boxShadow: '0 0 4px rgba(74,158,255,0.5)',
      transition: 'transform 0.1s',
    });
    fill.appendChild(dot);

    const hover = el('div', {
      width: '0%',
      height: '100%',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '2px',
      position: 'absolute',
      top: '0',
      left: '0',
      pointerEvents: 'none',
    });

    const markers = el('div', {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });

    track.appendChild(hover);
    track.appendChild(fill);
    track.appendChild(markers);
    wrap.appendChild(track);

    // Hover preview
    wrap.addEventListener('mousemove', (e) => {
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      hover.style.width = `${x * 100}%`;
    });
    wrap.addEventListener('mouseleave', () => {
      hover.style.width = '0%';
    });

    // Expand on hover
    wrap.addEventListener('mouseenter', () => {
      track.style.height = '6px';
      dot.style.transform = 'translateY(-50%) scale(1.3)';
    });
    wrap.addEventListener('mouseleave', () => {
      track.style.height = '4px';
      dot.style.transform = 'translateY(-50%) scale(1)';
    });

    return { wrap, fill, hover, markers };
  }

  private _createTimeDisplay(): HTMLElement {
    const d = el('span', {
      fontFamily: '"SF Mono", Monaco, Consolas, monospace',
      fontSize: '12px',
      opacity: '0.8',
      whiteSpace: 'nowrap',
      minWidth: '90px',
      textAlign: 'center',
    });
    d.textContent = '0:00 / 0:00';
    return d;
  }

  private _createSpeedSelect(): HTMLSelectElement {
    const select = document.createElement('select');
    select.title = 'Playback speed';
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
      appearance: 'none',
      webkitAppearance: 'none',
    } satisfies Partial<CSSStyleDeclaration>);

    for (const rate of [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]) {
      const opt = document.createElement('option');
      opt.value = String(rate);
      opt.textContent = `${rate}x`;
      opt.style.background = '#222';
      opt.style.color = '#fff';
      if (rate === 1) opt.selected = true;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      this._callbacks.onSpeedChange(parseFloat(select.value));
    });
    return select;
  }

  private _createExportBtn(): HTMLButtonElement {
    const wrapper = el('div', { position: 'relative', display: 'inline-block' });
    const btn = document.createElement('button');
    btn.innerHTML = EXPORT_ICON;
    btn.title = 'Export animation';
    applyBtnStyle(btn, '28px', '28px');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._exportMenu) {
        this._closeExportMenu();
      } else {
        this._showExportMenu();
      }
    });

    wrapper.appendChild(btn);
    this._exportBtnWrapper = wrapper;
    return btn;
  }

  private _showExportMenu(): void {
    const btnRect = this._exportBtn.getBoundingClientRect();

    // Invisible backdrop that catches all clicks outside the menu
    const backdrop = el('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '9999',
    });
    backdrop.setAttribute('data-player-bar', '');
    backdrop.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this._closeExportMenu();
    });

    const menu = el('div', {
      position: 'fixed',
      bottom: `${window.innerHeight - btnRect.top + 6}px`,
      left: `${btnRect.left - 60}px`,
      background: 'rgba(30,30,30,0.95)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '6px',
      padding: '4px 0',
      minWidth: '140px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      zIndex: '10000',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
    });
    menu.setAttribute('data-player-bar', '');

    const formats = [
      { ext: 'gif', label: 'GIF', desc: 'Animated image' },
      { ext: 'webm', label: 'WebM', desc: 'Web video' },
      { ext: 'mp4', label: 'MP4', desc: 'Video file' },
    ];

    for (const f of formats) {
      const item = el('div', {
        padding: '8px 14px',
        cursor: 'pointer',
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background 0.1s',
      });
      item.innerHTML = `<span>${f.label}</span><span style="opacity:0.5;font-size:11px">${f.desc}</span>`;
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255,255,255,0.1)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'none';
      });
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this._closeExportMenu();
        this._callbacks.onExport(f.ext);
      });
      menu.appendChild(item);
    }

    this._exportMenu = menu;
    this._exportMenuBackdrop = backdrop;
    document.body.appendChild(backdrop);
    document.body.appendChild(menu);
  }

  private _closeExportMenu(): void {
    if (this._exportMenu) {
      this._exportMenuBackdrop?.remove();
      this._exportMenuBackdrop = null;
      this._exportMenu.remove();
      this._exportMenu = null;
    }
  }

  /** Update the export button to show progress. */
  setExportProgress(progress: number | null): void {
    if (progress === null) {
      this._exportBtn.innerHTML = EXPORT_ICON;
      this._exportBtn.disabled = false;
      this._exportBtn.title = 'Export animation';
    } else {
      const pct = Math.round(progress * 100);
      this._exportBtn.innerHTML = `<span style="font-size:10px;font-weight:600">${pct}%</span>`;
      this._exportBtn.disabled = true;
      this._exportBtn.title = `Exporting... ${pct}%`;
    }
  }

  private _createFullscreenBtn(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerHTML = FULLSCREEN_ICON;
    btn.title = 'Fullscreen (F)';
    applyBtnStyle(btn, '28px', '28px');
    btn.addEventListener('click', () => this._callbacks.onFullscreen());
    return btn;
  }

  // ---------------------------------------------------------------------------
  // Auto-hide
  // ---------------------------------------------------------------------------

  private _showControls(): void {
    if (!this._isVisible) {
      this._bar.style.opacity = '1';
      this._bar.style.transform = 'translateY(0)';
      this._isVisible = true;
    }
    this._scheduleHide();
  }

  private _scheduleHide(): void {
    if (this._hideTimeout) clearTimeout(this._hideTimeout);
    if (!this._isPlaying || this._autoHideMs <= 0 || this._isDragging) return;

    this._hideTimeout = setTimeout(() => {
      if (this._isPlaying && !this._isDragging) {
        this._bar.style.opacity = '0';
        this._bar.style.transform = 'translateY(8px)';
        this._isVisible = false;
      }
    }, this._autoHideMs);
  }

  // ---------------------------------------------------------------------------
  // Drag-to-scrub on progress bar
  // ---------------------------------------------------------------------------

  private _startDrag(e: MouseEvent): void {
    this._isDragging = true;
    this._seekFromMouse(e);
  }

  private _moveDrag(e: MouseEvent): void {
    if (!this._isDragging) return;
    this._seekFromMouse(e);
  }

  private _endDrag(): void {
    this._isDragging = false;
  }

  private _seekFromMouse(e: MouseEvent): void {
    // The track is inside progressWrap with 12px padding on each side
    const track = this._progressWrap.firstElementChild as HTMLElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = x * this._duration;
    this._progressFill.style.width = `${x * 100}%`;
    this._callbacks.onSeek(time);
  }

  // ---------------------------------------------------------------------------
  // Scroll-to-scrub on progress bar
  // ---------------------------------------------------------------------------

  enableScrollScrub(getTime: () => number): void {
    this._progressWrap.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.1 : -0.1; // 100ms per scroll tick
        const newTime = Math.max(0, Math.min(this._duration, getTime() + delta));
        this._callbacks.onSeek(newTime);
      },
      { passive: false },
    );
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  dispose(): void {
    if (this._hideTimeout) clearTimeout(this._hideTimeout);
    this._container.removeEventListener('mousemove', this._onMouseMove);
    this._container.removeEventListener('mouseleave', this._onMouseLeave);
    this._progressWrap.removeEventListener('mousedown', this._onProgressDown);
    document.removeEventListener('mousemove', this._onProgressMove);
    document.removeEventListener('mouseup', this._onProgressUp);
    this._bar.remove();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function el(tag: string, styles: Partial<CSSStyleDeclaration>): HTMLElement {
  const e = document.createElement(tag);
  Object.assign(e.style, styles);
  return e;
}

function applyBtnStyle(btn: HTMLButtonElement, w: string, h: string): void {
  Object.assign(btn.style, {
    width: w,
    height: h,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '0',
    borderRadius: '4px',
    outline: 'none',
    transition: 'background 0.15s',
  } satisfies Partial<CSSStyleDeclaration>);
  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(255,255,255,0.15)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'none';
  });
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// SVG Icons (inline, small)
// ---------------------------------------------------------------------------

const PLAY_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M5 3l10 6-10 6V3z"/></svg>`;

const PAUSE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><rect x="4" y="3" width="3.5" height="12" rx="0.5"/><rect x="10.5" y="3" width="3.5" height="12" rx="0.5"/></svg>`;

const REPLAY_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M9 3a6 6 0 1 0 6 6h-2a4 4 0 1 1-4-4v3l4-3.5L9 1v2z"/></svg>`;

const PREV_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="2" height="10"/><path d="M14 3L6 8l8 5V3z"/></svg>`;

const NEXT_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="12" y="3" width="2" height="10"/><path d="M2 3l8 5-8 5V3z"/></svg>`;

const EXPORT_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L8 10M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12v1h10v-1" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;

const FULLSCREEN_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h4v2H4v2H2V2zm8 0h4v4h-2V4h-2V2zM2 10h2v2h2v2H2v-4zm10 2h-2v2h4v-4h-2v2z"/></svg>`;
