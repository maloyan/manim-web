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
  onSlidesToggle: () => void;
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

    const handler = this._getKeyHandler(e.key, e.shiftKey);
    if (handler) {
      e.preventDefault();
      handler();
    }
  }

  private _getKeyHandler(key: string, shift: boolean): (() => void) | undefined {
    const c = this._callbacks;
    const lower = key.toLowerCase();

    if (key === ' ' || lower === 'k') return () => c.onPlayPause();
    if (lower === 'f') return () => c.onFullscreen();
    if (lower === 's') return () => c.onSlidesToggle();
    if (key === 'Home') return () => c.onSeek(0);
    if (key === 'End') return () => c.onSeek(c.getDuration());

    if (key === 'ArrowLeft') {
      return shift ? () => c.onSeek(Math.max(0, c.getCurrentTime() - 1)) : () => c.onPrev();
    }
    if (key === 'ArrowRight') {
      return shift
        ? () => c.onSeek(Math.min(c.getDuration(), c.getCurrentTime() + 1))
        : () => c.onNext();
    }
    return undefined;
  }

  dispose(): void {
    this._container.removeEventListener('keydown', this._onKeyDown);
  }
}
