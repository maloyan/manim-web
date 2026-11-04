/**
 * Keyboard access for makeTangle. Canvas glyphs cannot take focus, so each
 * parameter and each matrix marker gets a visually hidden button next to
 * the canvas. A parameter button steps its value with the arrow keys
 * (Shift: 10 steps; Home / End: min / max) and opens the editor on Enter.
 * A matrix button expands or collapses its matrix on Enter or Space.
 * The controller draws a focus ring over the glyphs of the focused item.
 */

import type { PageBox } from './tangleEditor';

/** What a proxy button stands for. */
export interface TangleFocusTarget {
  kind: 'param' | 'matrix';
  name: string;
  occurrence: number;
}

export interface TangleKeyboardHost {
  /** Parameters in tab order, with their accessible text. */
  params(): Array<{ name: string; label: string; valueText: string }>;
  /** Matrix markers in tab order. */
  matrices(): Array<{ name: string; occurrence: number; label: string; expanded: boolean }>;
  /** Change a parameter by `steps` steps. */
  step(name: string, steps: number): void;
  /** Set a parameter to its bound, if it is finite. */
  jump(name: string, to: 'min' | 'max'): void;
  /** Open the exact-value editor. */
  edit(name: string): void;
  /** Expand or collapse a matrix marker. */
  toggle(name: string, occurrence: number): void;
  /** Show the focus ring on a target, or hide it (null). */
  focus(target: TangleFocusTarget | null): void;
}

const VISUALLY_HIDDEN: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

export class TangleKeyboard {
  private readonly _root: HTMLElement;
  private readonly _host: TangleKeyboardHost;
  private readonly _paramButtons = new Map<string, HTMLButtonElement>();
  private readonly _matrixButtons = new Map<string, HTMLButtonElement>();

  constructor(parent: HTMLElement, host: TangleKeyboardHost) {
    this._host = host;
    this._root = document.createElement('div');
    this._root.className = 'manim-tangle-keyboard';
    this._root.setAttribute('role', 'group');
    this._root.setAttribute('aria-label', 'Formula parameters');
    Object.assign(this._root.style, VISUALLY_HIDDEN);

    for (const param of host.params()) {
      const button = this._button({ kind: 'param', name: param.name, occurrence: 0 });
      button.addEventListener('keydown', (e) => this._paramKey(e, param.name));
      this._paramButtons.set(param.name, button);
    }
    for (const matrix of host.matrices()) {
      const target: TangleFocusTarget = {
        kind: 'matrix',
        name: matrix.name,
        occurrence: matrix.occurrence,
      };
      const button = this._button(target);
      button.addEventListener('click', () => host.toggle(matrix.name, matrix.occurrence));
      this._matrixButtons.set(`${matrix.name}#${matrix.occurrence}`, button);
    }
    parent.appendChild(this._root);
    this.update();
  }

  /** Refresh every button's accessible text from the host. */
  update(): void {
    for (const param of this._host.params()) {
      this._paramButtons
        .get(param.name)
        ?.setAttribute(
          'aria-label',
          `${param.label}: ${param.valueText}. Arrow keys change it; Enter types a value.`,
        );
    }
    for (const matrix of this._host.matrices()) {
      const button = this._matrixButtons.get(`${matrix.name}#${matrix.occurrence}`);
      button?.setAttribute('aria-label', matrix.label);
      button?.setAttribute('aria-expanded', String(matrix.expanded));
    }
  }

  dispose(): void {
    this._root.remove();
  }

  private _button(target: TangleFocusTarget): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('focus', () => this._host.focus(target));
    button.addEventListener('blur', () => this._host.focus(null));
    this._root.appendChild(button);
    return button;
  }

  private _paramKey(event: KeyboardEvent, name: string): void {
    const big = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        this._host.step(name, big);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        this._host.step(name, -big);
        break;
      case 'Home':
        this._host.jump(name, 'min');
        break;
      case 'End':
        this._host.jump(name, 'max');
        break;
      case 'Enter':
      case ' ':
        this._host.edit(name);
        break;
      default:
        return;
    }
    event.preventDefault();
    this.update();
  }
}

/**
 * Draw (or move) the focus ring around `box`, or remove it when `box` is
 * null. Returns the ring element to pass back next time.
 */
export function placeFocusRing(
  ring: HTMLDivElement | null,
  box: PageBox | null,
): HTMLDivElement | null {
  if (!box) {
    ring?.remove();
    return null;
  }
  if (!ring) {
    ring = document.createElement('div');
    ring.className = 'manim-tangle-focus';
    Object.assign(ring.style, {
      position: 'absolute',
      pointerEvents: 'none',
      border: '2px solid #58a6ff',
      borderRadius: '4px',
      zIndex: '999',
    });
    document.body.appendChild(ring);
  }
  Object.assign(ring.style, {
    left: `${box.left - 4}px`,
    top: `${box.top - 4}px`,
    width: `${box.width + 8}px`,
    height: `${box.height + 8}px`,
  });
  return ring;
}
