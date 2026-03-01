/**
 * PlayerController - Keyboard and mouse input handling for the Player.
 * Manages spacebar, arrow keys, scroll-to-scrub, and fullscreen toggle.
 */

export interface PlayerControllerCallbacks {
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onFullscreen: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

export class PlayerController {
  private _container: HTMLElement;
  private _callbacks: PlayerControllerCallbacks;
  private _onKeyDown: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement, callbacks: PlayerControllerCallbacks) {
    this._container = container;
    this._callbacks = callbacks;

    // Make container focusable so it receives key events
    if (!container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '0');
      container.style.outline = 'none';
    }

    this._onKeyDown = (e: KeyboardEvent) => this._handleKey(e);
    container.addEventListener('keydown', this._onKeyDown);

    // Click on canvas (not controls) toggles play/pause
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Ignore clicks inside the player bar overlay
      if (target.closest('[data-player-bar]')) return;
      this._callbacks.onPlayPause();
    });

    // Focus container on click so keyboard works
    container.addEventListener('mousedown', () => {
      container.focus();
    });
  }

  private _handleKey(e: KeyboardEvent): void {
    // Don't intercept if user is typing in an input
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        this._callbacks.onPlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) {
          // Fine scrub: -1s
          const t = Math.max(0, this._callbacks.getCurrentTime() - 1);
          this._callbacks.onSeek(t);
        } else {
          this._callbacks.onPrev();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) {
          // Fine scrub: +1s
          const dur = this._callbacks.getDuration();
          const t = Math.min(dur, this._callbacks.getCurrentTime() + 1);
          this._callbacks.onSeek(t);
        } else {
          this._callbacks.onNext();
        }
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        this._callbacks.onFullscreen();
        break;
      case 'Home':
        e.preventDefault();
        this._callbacks.onSeek(0);
        break;
      case 'End':
        e.preventDefault();
        this._callbacks.onSeek(this._callbacks.getDuration());
        break;
    }
  }

  dispose(): void {
    this._container.removeEventListener('keydown', this._onKeyDown);
  }
}
