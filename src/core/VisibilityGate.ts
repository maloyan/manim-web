/**
 * Tracks whether a scene's canvas can be seen, so the animation loop can skip
 * drawing frames nobody will see.
 *
 * A canvas is hidden when its container is scrolled out of the viewport
 * (IntersectionObserver) or its tab is in the background (Page Visibility).
 * A docs page or slide deck with many embedded scenes otherwise keeps every
 * one of them drawing at full frame rate, which on low-end hardware starves
 * the scene the user is actually looking at.
 *
 * The gate only reports visibility. The caller keeps advancing the timeline
 * and updaters while hidden, so state stays correct, and calls
 * {@link VisibilityGate.markStale} for each skipped frame. When the canvas
 * becomes visible again the gate invokes `onShow` once so the current state
 * is drawn immediately.
 */
export class VisibilityGate {
  private _onScreen = true;
  private _stale = false;
  private _observer: IntersectionObserver | null = null;
  private _onVisibilityChange: (() => void) | null = null;

  /**
   * @param element - The element whose visibility decides the canvas's.
   * @param onShow - Called when the canvas becomes visible after a skipped frame.
   */
  constructor(
    element: HTMLElement,
    private readonly _onShow: () => void,
  ) {
    if (typeof IntersectionObserver !== 'undefined') {
      this._observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        this._onScreen = entry.isIntersecting;
        this._flushIfVisible();
      });
      this._observer.observe(element);
    }
    if (typeof document !== 'undefined') {
      this._onVisibilityChange = () => this._flushIfVisible();
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }
  }

  /** Whether the canvas is on screen in a visible tab. */
  get isVisible(): boolean {
    const tabHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    return this._onScreen && !tabHidden;
  }

  /**
   * Record that a frame was skipped while hidden.
   * @post this.isVisible becoming true => onShow is called once
   */
  markStale(): void {
    this._stale = true;
  }

  /** Stop observing. Safe to call more than once. */
  dispose(): void {
    this._observer?.disconnect();
    this._observer = null;
    if (this._onVisibilityChange && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
    }
    this._onVisibilityChange = null;
  }

  private _flushIfVisible(): void {
    if (!this._stale || !this.isVisible) return;
    this._stale = false;
    this._onShow();
  }
}
