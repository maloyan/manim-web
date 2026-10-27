import type { Scene } from '../core/Scene';
import type { VMobject } from '../core/VMobject';
import type { TangleTex } from '../mobjects/text/tangle/TangleTex';
import { formatTangleValue } from '../mobjects/text/tangle/tangleSource';
import { logger } from '../utils/logger';
import {
  boxContains,
  claimTouch,
  releaseTouch,
  screenToWorld,
  setCanvasCursor,
  worldBoxOf,
  worldToScreen,
  type ScreenFrame,
  type WorldBox,
} from './pointerShared';
import { openTangleEditor, type PageBox, type TangleEditor } from './tangleEditor';
import { TangleKeyboard, placeFocusRing, type TangleFocusTarget } from './tangleKeyboard';

/** Options for {@link Tangle} / {@link makeTangle}. */
export interface TangleOptions {
  /**
   * Exact-value editor opened by clicking a number without dragging it:
   * `'popover'` (below the number), `'inline'` (over it) or `'none'`.
   * Default: `'popover'`.
   */
  editor?: 'popover' | 'inline' | 'none';
  /** While dragging, show every `'symbol'` parameter as a number. Default: false. */
  revealAllOnDrag?: boolean;
  /**
   * How a mouse expands a matrix: `'hover'` (rest the pointer on its symbol;
   * click to keep it open), `'click'`, or `'none'`. Touch and pen always use
   * a tap; a tap outside the formula closes every matrix. Default: `'hover'`.
   */
  expandOn?: 'hover' | 'click' | 'none';
  /** Duration of the expand / collapse animation, in seconds. 0 switches instantly. Default: 0.4. */
  expandDuration?: number;
  /** Milliseconds the pointer rests on a symbol before it expands. Default: 150. */
  openDelay?: number;
  /** Milliseconds after the pointer leaves before a hover-opened matrix collapses. Default: 400. */
  closeDelay?: number;
  /** Extra world-unit margin around glyphs that still counts as a hit. Default: 0.08. */
  hitPadding?: number;
  /** Add hidden, focusable buttons for keyboard and screen-reader users. Default: true. */
  keyboard?: boolean;
  /**
   * Render the scene after each change. Default: true. Set false when a
   * render loop (play(), wait() with updaters) is already running.
   */
  autoRender?: boolean;
  /** Called with each new value of a parameter. */
  onChange?: (name: string, value: number, tex: TangleTex) => void;
  /** Called once when a drag or an edit of a parameter ends. */
  onScrubEnd?: (name: string, value: number, tex: TangleTex) => void;
  /** Called when a matrix marker starts to expand or collapse. */
  onExpandChange?: (name: string, occurrence: number, expanded: boolean) => void;
  /**
   * Called when a matrix marker has finished expanding or collapsing: after
   * its animation, or once its glyphs have landed when it switched instantly.
   */
  onExpandEnd?: (name: string, occurrence: number, expanded: boolean) => void;
  /**
   * Called right before each render Tangle makes (once the new glyphs are
   * in), to sync things that depend on the formula's size, such as a
   * backdrop, without a render of your own.
   */
  onBeforeRender?: (tex: TangleTex) => void;
}

interface Hit extends TangleFocusTarget {
  box: WorldBox;
}

interface Drag {
  name: string;
  occurrence: number;
  pointerId: number | null;
  startX: number;
  startValue: number;
  moved: boolean;
}

interface MatrixHover {
  /** Opened by hovering (collapses when the pointer leaves) rather than pinned. */
  byHover: boolean;
  /** Where the symbol was when hover opened it; the pointer may stay there. */
  keepBox: WorldBox | null;
  openTimer: ReturnType<typeof setTimeout> | null;
  closeTimer: ReturnType<typeof setTimeout> | null;
  /** An expand / collapse animation of ours is playing. */
  busy: boolean;
  /** State requested while busy, applied when the animation ends. */
  want: { expanded: boolean; byHover: boolean } | null;
}

/**
 * Tangle: drag, type and expand the numbers and matrices of a
 * {@link TangleTex}, in place on the canvas.
 *
 * - Drag a number horizontally to change it by whole steps
 *   (`pixelsPerStep` per step); a `'symbol'` parameter shows its number
 *   while dragged.
 * - Click a number without dragging to type an exact value.
 * - Rest the mouse on a matrix symbol to expand it (through
 *   `scene.play(tex.expand(...))`); it collapses after the pointer leaves,
 *   unless it was clicked to stay open. Touch and pen tap to toggle.
 * - Keyboard users tab to hidden buttons: arrow keys step a value, Enter
 *   types one, and Enter on a matrix button toggles it.
 *
 * @example
 * ```typescript
 * const tex = new TangleTex({ latex: 'y = \\tangle{a}x', parameters: { a: { value: 1, step: 0.1 } } });
 * scene.add(tex);
 * makeTangle(tex, scene, { onChange: (name, value) => redraw() });
 * ```
 */
export class Tangle {
  private readonly _tex: TangleTex;
  private readonly _scene: Scene;
  private readonly _options: TangleOptions;
  /** Options with defaults filled in. */
  private readonly _settings: Required<
    Pick<TangleOptions, 'hitPadding' | 'openDelay' | 'closeDelay' | 'expandOn' | 'expandDuration'>
  >;
  private readonly _canvas: HTMLCanvasElement;
  private _enabled = true;
  private _disposed = false;
  private _drag: Drag | null = null;
  private _editor: { name: string; editor: TangleEditor; returnFocus: Element | null } | null =
    null;
  private readonly _revealedByUs = new Set<string>();
  private readonly _matrices = new Map<string, MatrixHover>();
  private readonly _keyboard: TangleKeyboard | null = null;
  private _ring: HTMLDivElement | null = null;

  private readonly _onPointerDown = (e: PointerEvent) => this._pointerDown(e);
  private readonly _onHover = (e: PointerEvent) => this._hover(e);
  private readonly _onLeave = () => this._leave();
  private readonly _onPointerMove = (e: PointerEvent) => this._pointerMove(e);
  private readonly _onPointerUp = (e: PointerEvent) => this._pointerUp(e);

  constructor(tex: TangleTex, scene: Scene, options: TangleOptions = {}) {
    this._tex = tex;
    this._scene = scene;
    this._options = options;
    this._settings = {
      hitPadding: options.hitPadding ?? 0.08,
      openDelay: options.openDelay ?? 150,
      closeDelay: options.closeDelay ?? 400,
      expandOn: options.expandOn ?? 'hover',
      expandDuration: options.expandDuration ?? 0.4,
    };
    this._canvas = scene.getCanvas();
    claimTouch(this._canvas);
    // Capture phase, so a press on a number is taken before other canvas
    // listeners (e.g. a 3D scene's orbit controls), which it then stops.
    this._canvas.addEventListener('pointerdown', this._onPointerDown, { capture: true });
    this._canvas.addEventListener('pointermove', this._onHover);
    this._canvas.addEventListener('pointerleave', this._onLeave);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    if (options.keyboard !== false && !scene.isHeadless) {
      this._keyboard = new TangleKeyboard(scene.getContainer(), {
        params: () =>
          this._interactiveParams().map((name) => ({
            name,
            label: tex.getParameter(name).label,
            valueText: formatTangleValue(tex.getValue(name), tex.getParameter(name).digits),
          })),
        matrices: () =>
          tex.getMatrixNames().flatMap((name) =>
            [...Array(tex.getMatrixOccurrenceCount(name)).keys()].map((occurrence) => ({
              name,
              occurrence,
              label: `matrix ${name}`,
              expanded: tex.isExpanded(name, occurrence),
            })),
          ),
        step: (name, steps) =>
          this._setValue(name, tex.getValue(name) + steps * tex.getParameter(name).step, true),
        jump: (name, to) => {
          const bound = tex.getParameter(name)[to];
          if (Number.isFinite(bound)) this._setValue(name, bound, true);
        },
        edit: (name) => this._openEditor(name, tex.getParameterOccurrences(name)[0] ?? -1),
        toggle: (name, occurrence) => this._toggleMatrix(name, occurrence),
        focus: (target) => this._showRing(target),
      });
    }
  }

  /** The TangleTex this behavior controls. */
  get tex(): TangleTex {
    return this._tex;
  }

  /** Whether a drag is in progress. */
  get isDragging(): boolean {
    return this._drag !== null && this._drag.moved;
  }

  /** Whether interaction is enabled. */
  get isEnabled(): boolean {
    return this._enabled;
  }

  /** Enable interaction. */
  enable(): void {
    this._enabled = true;
  }

  /** Disable interaction. A drag or edit in progress ends at once. */
  disable(): void {
    this._enabled = false;
    this._endDrag(false);
    this._closeEditor();
    setCanvasCursor(this._canvas, this, null);
  }

  /** Remove every listener and DOM element, and release the cursor. */
  dispose(): void {
    if (this._disposed) return;
    this.disable();
    this._disposed = true;
    for (const m of this._matrices.values()) {
      if (m.openTimer) clearTimeout(m.openTimer);
      if (m.closeTimer) clearTimeout(m.closeTimer);
    }
    releaseTouch(this._canvas);
    this._canvas.removeEventListener('pointerdown', this._onPointerDown, { capture: true });
    this._canvas.removeEventListener('pointermove', this._onHover);
    this._canvas.removeEventListener('pointerleave', this._onLeave);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    this._keyboard?.dispose();
    this._ring?.remove();
  }

  // ── Hit testing ──────────────────────────────────────────────────

  /** Parameters the reader may change: all but the `readOnly` ones. */
  private _interactiveParams(): string[] {
    return this._tex.getParameterNames().filter((name) => !this._tex.getParameter(name).readOnly);
  }

  /** Displayed parameter occurrences, then matrix markers, with world boxes. */
  private _targets(): Hit[] {
    const tex = this._tex;
    const hits: Hit[] = [];
    for (const name of this._interactiveParams()) {
      for (const occurrence of tex.getParameterOccurrences(name)) {
        const box = worldBoxOf(tex.getParameterGlyphs(name, occurrence));
        if (box) hits.push({ kind: 'param', name, occurrence, box });
      }
    }
    for (const name of tex.getMatrixNames()) {
      for (let occurrence = 0; occurrence < tex.getMatrixOccurrenceCount(name); occurrence++) {
        const box = worldBoxOf(tex.getMatrixGlyphs(name, occurrence));
        if (box) hits.push({ kind: 'matrix', name, occurrence, box });
      }
    }
    return hits;
  }

  /** The target under a client point; parameters win over the matrix around them. */
  private _hitAt(clientX: number, clientY: number): Hit | null {
    const [x, y] = screenToWorld(this._scene, clientX, clientY, this._frame());
    const pad = this._settings.hitPadding;
    return this._targets().find((t) => boxContains(t.box, x, y, pad)) ?? null;
  }

  /**
   * The world frame to map pointer positions with: a 3D scene's HUD frame
   * when the formula is pinned there (addFixedInFrameMobjects), else the
   * 2D camera's (undefined).
   */
  private _frame(): ScreenFrame | undefined {
    const scene = this._scene as Partial<{
      isFixedInFrame(mobject: TangleTex): boolean;
      fixedInFrameSize: ScreenFrame;
    }>;
    return scene.isFixedInFrame?.(this._tex) ? scene.fixedInFrameSize : undefined;
  }

  /** Page-coordinate box of a world box. */
  private _pageBox(box: WorldBox): PageBox {
    const [left, top] = worldToScreen(this._scene, box.minX, box.maxY, this._frame());
    const [right, bottom] = worldToScreen(this._scene, box.maxX, box.minY, this._frame());
    return {
      left: left + window.scrollX,
      top: top + window.scrollY,
      width: right - left,
      height: bottom - top,
    };
  }

  // ── Pointer ──────────────────────────────────────────────────────

  private _pointerDown(e: PointerEvent): void {
    if (!this._enabled || this._drag) return;
    if (e.button !== undefined && e.button > 0) return;
    const hit = this._hitAt(e.clientX, e.clientY);
    if (!hit) {
      // No hover to leave on touch: a tap outside closes, and passes on.
      if (e.pointerType === 'touch' || e.pointerType === 'pen') this._collapseAll();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    this._closeEditor();
    if (hit.kind === 'matrix') {
      const mouse = e.pointerType === 'mouse' || e.pointerType === undefined;
      if (!mouse || this._settings.expandOn !== 'none') {
        this._toggleMatrix(hit.name, hit.occurrence);
      }
      return;
    }
    this._drag = {
      name: hit.name,
      occurrence: hit.occurrence,
      pointerId: e.pointerId ?? null,
      startX: e.clientX,
      startValue: this._tex.getValue(hit.name),
      moved: false,
    };
    this._reveal(hit.name);
    setCanvasCursor(this._canvas, this, 'ew-resize');
  }

  private _pointerMove(e: PointerEvent): void {
    const drag = this._drag;
    if (!drag || !this._isOwnPointer(e)) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) >= 3) {
      drag.moved = true;
      if (this._options.revealAllOnDrag) {
        for (const name of this._tex.getParameterNames()) this._reveal(name);
      }
    }
    if (!drag.moved) return;
    e.preventDefault();
    const param = this._tex.getParameter(drag.name);
    const steps = Math.trunc(dx / param.pixelsPerStep);
    this._setValue(drag.name, drag.startValue + steps * param.step, false);
  }

  private _pointerUp(e: PointerEvent): void {
    const drag = this._drag;
    if (!drag || !this._isOwnPointer(e)) return;
    if (drag.moved) {
      this._endDrag(true);
    } else {
      this._drag = null;
      this._openEditor(drag.name, drag.occurrence);
    }
  }

  private _isOwnPointer(e: PointerEvent): boolean {
    const id = this._drag?.pointerId ?? null;
    return id === null || e.pointerId === undefined || e.pointerId === id;
  }

  private _endDrag(notify: boolean): void {
    const drag = this._drag;
    if (!drag) return;
    this._drag = null;
    if (notify && drag.moved) {
      this._options.onScrubEnd?.(drag.name, this._tex.getValue(drag.name), this._tex);
    }
    this._unrevealAll();
  }

  private _hover(e: PointerEvent): void {
    if (!this._enabled || this._drag) return;
    const hit = this._hitAt(e.clientX, e.clientY);
    const cursor = hit?.kind === 'param' ? 'ew-resize' : hit ? 'pointer' : null;
    setCanvasCursor(this._canvas, this, cursor);
    if (this._settings.expandOn === 'hover' && e.pointerType !== 'touch') {
      const [x, y] = screenToWorld(this._scene, e.clientX, e.clientY, this._frame());
      this._updateHover(x, y);
    }
  }

  private _leave(): void {
    if (this._drag) return;
    setCanvasCursor(this._canvas, this, null);
    if (this._settings.expandOn === 'hover') this._updateHover(Infinity, Infinity);
  }

  // ── Values ───────────────────────────────────────────────────────

  /** Set a parameter (snapped and clamped by TangleTex) and report a change. */
  private _setValue(name: string, value: number, finished: boolean): void {
    const before = this._tex.getValue(name);
    this._tex.setValue(name, value);
    const after = this._tex.getValue(name);
    if (after !== before) {
      this._options.onChange?.(name, after, this._tex);
      this._keyboard?.update();
      this._requestRender();
    }
    if (finished) this._options.onScrubEnd?.(name, after, this._tex);
  }

  private _reveal(name: string): void {
    if (this._tex.isShowingNumber(name)) return;
    this._tex.setRevealed(name, true);
    this._revealedByUs.add(name);
    this._requestRender();
  }

  private _unrevealAll(): void {
    if (this._revealedByUs.size === 0) return;
    for (const name of this._revealedByUs) this._tex.setRevealed(name, false);
    this._revealedByUs.clear();
    this._requestRender();
  }

  // ── Editor ───────────────────────────────────────────────────────

  /** Open the editor over a displayed occurrence (or, if none, over the canvas). */
  private _openEditor(name: string, occurrence: number): void {
    const style = this._options.editor ?? 'popover';
    if (style === 'none' || this._scene.isHeadless) {
      this._unrevealAll();
      return;
    }
    this._closeEditor();
    const tex = this._tex;
    const param = tex.getParameter(name);
    const glyphBox = occurrence >= 0 ? worldBoxOf(tex.getParameterGlyphs(name, occurrence)) : null;
    const rect = this._canvas.getBoundingClientRect();
    const box = glyphBox
      ? this._pageBox(glyphBox)
      : {
          left: rect.left + window.scrollX + rect.width / 2,
          top: rect.top + window.scrollY + rect.height / 2,
          width: 0,
          height: 0,
        };
    this._reveal(name);
    const returnFocus = document.activeElement;
    const finish = () => {
      this._editor = null;
      this._unrevealAll();
      if (returnFocus instanceof HTMLElement && returnFocus.closest('.manim-tangle-keyboard')) {
        returnFocus.focus();
      }
    };
    const editor = openTangleEditor({
      style,
      box,
      initial: formatTangleValue(tex.getValue(name), param.digits),
      label: `Set ${param.label}`,
      color: param.color ?? '#58a6ff',
      onCommit: (value) => {
        finish();
        this._setValue(name, value, true);
      },
      onCancel: finish,
    });
    this._editor = { name, editor, returnFocus };
  }

  private _closeEditor(): void {
    if (!this._editor) return;
    this._editor.editor.close();
    this._editor = null;
    this._unrevealAll();
  }

  // ── Matrices ─────────────────────────────────────────────────────

  private _matrix(name: string, occurrence: number): MatrixHover {
    const key = `${name}#${occurrence}`;
    let m = this._matrices.get(key);
    if (!m) {
      m = {
        byHover: false,
        keepBox: null,
        openTimer: null,
        closeTimer: null,
        busy: false,
        want: null,
      };
      this._matrices.set(key, m);
    }
    return m;
  }

  /** Expand when the pointer rests on a symbol; collapse hover-opened ones it left. */
  private _updateHover(x: number, y: number): void {
    this._eachMarker((name, occurrence) => this._hoverMatrix(name, occurrence, x, y));
  }

  /** Call `fn` for every matrix marker of the formula. */
  private _eachMarker(fn: (name: string, occurrence: number) => void): void {
    for (const name of this._tex.getMatrixNames()) {
      const count = this._tex.getMatrixOccurrenceCount(name);
      for (let occurrence = 0; occurrence < count; occurrence++) fn(name, occurrence);
    }
  }

  /** Start or cancel the open / close timer of one matrix marker for a pointer at (x, y). */
  private _hoverMatrix(name: string, occurrence: number, x: number, y: number): void {
    const pad = this._settings.hitPadding;
    const m = this._matrix(name, occurrence);
    const box = worldBoxOf(this._tex.getMatrixGlyphs(name, occurrence));
    const inside =
      (box !== null && boxContains(box, x, y, pad)) ||
      (m.keepBox !== null && boxContains(m.keepBox, x, y, pad));
    const expanded = this._tex.isExpanded(name, occurrence);
    if (inside) {
      if (m.closeTimer) clearTimeout(m.closeTimer);
      m.closeTimer = null;
      if (!expanded && !m.openTimer && !m.busy) {
        m.openTimer = setTimeout(() => {
          m.openTimer = null;
          m.keepBox = box;
          this._setMatrix(name, occurrence, true, true);
        }, this._settings.openDelay);
      }
      return;
    }
    if (m.openTimer) clearTimeout(m.openTimer);
    m.openTimer = null;
    if (expanded && m.byHover && !m.closeTimer) {
      m.closeTimer = setTimeout(() => {
        m.closeTimer = null;
        if (this._drag || this._editor) return;
        this._setMatrix(name, occurrence, false, false);
      }, this._settings.closeDelay);
    }
  }

  /** Collapse every expanded matrix marker. */
  private _collapseAll(): void {
    // _setMatrix skips collapsed markers and queues the collapse of animating ones.
    this._eachMarker((name, occurrence) => this._setMatrix(name, occurrence, false, false));
  }

  /** Click / tap / keyboard: pin a hover-opened matrix, else toggle it. */
  private _toggleMatrix(name: string, occurrence: number): void {
    const m = this._matrix(name, occurrence);
    const expanded = m.want?.expanded ?? this._tex.isExpanded(name, occurrence);
    if (expanded && m.byHover) {
      m.byHover = false;
      return;
    }
    this._setMatrix(name, occurrence, !expanded, false);
  }

  /**
   * Expand or collapse one matrix marker: animated with scene.play() when
   * the scene is free, instantly when another play() is running (a second
   * play() would replace its timeline). Requests made while our animation
   * runs are applied after it.
   */
  private _setMatrix(name: string, occurrence: number, expanded: boolean, byHover: boolean): void {
    if (this._disposed) return;
    const m = this._matrix(name, occurrence);
    if (m.busy) {
      m.want = { expanded, byHover };
      return;
    }
    m.byHover = expanded && byHover;
    if (!expanded) m.keepBox = null;
    if (this._tex.isExpanded(name, occurrence) === expanded) return;
    this._options.onExpandChange?.(name, occurrence, expanded);
    const duration = this._settings.expandDuration;
    const ended = () => {
      if (!this._disposed) this._options.onExpandEnd?.(name, occurrence, expanded);
    };
    if (duration <= 0 || this._scene.isPlaying) {
      this._tex.setExpanded(name, expanded, occurrence);
      this._keyboard?.update();
      this._tex.waitForRender().then(ended, ended);
      this._requestRender();
      return;
    }
    m.busy = true;
    const options = { occurrence, duration };
    const animation = expanded
      ? this._tex.expand(name, options)
      : this._tex.collapse(name, options);
    this._scene
      .play(animation)
      .catch((error: unknown) => logger.warn('Tangle: matrix animation failed:', error))
      .finally(() => {
        m.busy = false;
        this._keyboard?.update();
        ended();
        this._requestRender();
        const want = m.want;
        m.want = null;
        if (want) this._setMatrix(name, occurrence, want.expanded, want.byHover);
      });
  }

  // ── Rendering ────────────────────────────────────────────────────

  /** Render once the TangleTex's pending glyphs have landed. */
  private _requestRender(): void {
    if (this._options.autoRender === false || this._renderQueued) return;
    // One render per landing: requests made before it lands share it
    // (waitForRender resolves only once the latest glyphs are in).
    this._renderQueued = true;
    this._tex
      .waitForRender()
      .catch(() => undefined)
      .then(() => {
        this._renderQueued = false;
        if (this._disposed || this._scene.isRenderLoopActive || this._scene.isHeadless) return;
        this._options.onBeforeRender?.(this._tex);
        this._scene.render();
        if (this._ring && this._ringTarget) this._showRing(this._ringTarget);
      })
      .catch((error: unknown) => logger.warn('Tangle: render failed:', error));
  }

  private _ringTarget: TangleFocusTarget | null = null;
  private _renderQueued = false;

  /** Outline the glyphs of the keyboard-focused item (or hide the outline). */
  /**
   * Glyphs the focus ring surrounds: a parameter's first displayed
   * occurrence or, when it shows only inside collapsed matrices, the
   * symbols of those matrices; or a matrix marker.
   */
  private _ringGlyphs(target: TangleFocusTarget): VMobject[] {
    const tex = this._tex;
    if (target.kind === 'matrix') return tex.getMatrixGlyphs(target.name, target.occurrence);
    const [first] = tex.getParameterOccurrences(target.name);
    if (first !== undefined) return tex.getParameterGlyphs(target.name, first);
    return tex.getMatricesUsing(target.name).flatMap((matrix) => tex.getMatrixGlyphs(matrix));
  }

  private _showRing(target: TangleFocusTarget | null): void {
    this._ringTarget = target;
    const glyphs = target ? this._ringGlyphs(target) : [];
    const box = glyphs.length ? worldBoxOf(glyphs) : null;
    this._ring = placeFocusRing(this._ring, box ? this._pageBox(box) : null);
  }
}

/**
 * Make a {@link TangleTex} interactive: drag numbers, click to type them,
 * hover or tap matrices to expand them.
 *
 * @param tex - The formula. Add it to the scene as usual.
 * @param scene - The scene whose canvas receives the pointer events.
 * @param options - Editor, expansion and callback options.
 * @returns The Tangle behavior. Call `dispose()` to remove it.
 */
export function makeTangle(tex: TangleTex, scene: Scene, options?: TangleOptions): Tangle {
  return new Tangle(tex, scene, options);
}
