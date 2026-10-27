/**
 * The exact-value editor of makeTangle: a small text input placed over (or
 * below) a TangleTex parameter's glyphs. Enter commits, Escape or leaving
 * the field cancels, and an unparsable entry is flagged and kept open.
 */

/** A rectangle in page coordinates (client + scroll), in CSS pixels. */
export interface PageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TangleEditorOptions {
  /** `'popover'` below the glyphs, or `'inline'` covering them. */
  style: 'popover' | 'inline';
  /** Where the parameter's glyphs are. */
  box: PageBox;
  /** Text shown when the editor opens. */
  initial: string;
  /** Accessible name of the field. */
  label: string;
  /** Border color. */
  color: string;
  /** Called with the parsed number on Enter. */
  onCommit: (value: number) => void;
  /** Called on Escape or blur. */
  onCancel: () => void;
}

/** An open editor. close() removes it without calling either callback. */
export interface TangleEditor {
  readonly input: HTMLInputElement;
  close(): void;
}

/** Open an editor in `document.body`. */
export function openTangleEditor(options: TangleEditorOptions): TangleEditor {
  const { box, style } = options;
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal';
  input.value = options.initial;
  input.setAttribute('aria-label', options.label);
  input.className = `manim-tangle-editor manim-tangle-editor--${style}`;
  const centerX = box.left + box.width / 2;
  Object.assign(input.style, {
    position: 'absolute',
    zIndex: '1000',
    boxSizing: 'border-box',
    font: '16px ui-monospace, monospace',
    textAlign: 'center',
    color: 'CanvasText',
    background: 'Canvas',
    border: `2px solid ${options.color}`,
    borderRadius: '6px',
    padding: '2px 6px',
    outline: 'none',
    transform: 'translateX(-50%)',
    left: `${centerX}px`,
    width: `${Math.max(box.width + 16, 64)}px`,
  });
  if (style === 'inline') {
    input.style.top = `${box.top - 4}px`;
    input.style.height = `${Math.max(box.height + 8, 30)}px`;
  } else {
    input.style.top = `${box.top + box.height + 8}px`;
  }

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    input.removeEventListener('keydown', onKeyDown);
    input.removeEventListener('blur', onBlur);
    input.remove();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      options.onCancel();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const text = input.value.trim();
      const value = Number(text);
      if (text === '' || !Number.isFinite(value)) {
        input.setAttribute('aria-invalid', 'true');
        input.style.borderColor = '#e5484d';
        input.select();
        return;
      }
      close();
      options.onCommit(value);
    }
  };
  const onBlur = () => {
    if (closed) return;
    close();
    options.onCancel();
  };
  input.addEventListener('keydown', onKeyDown);
  input.addEventListener('blur', onBlur);
  document.body.appendChild(input);
  input.focus();
  input.select();
  return { input, close };
}
