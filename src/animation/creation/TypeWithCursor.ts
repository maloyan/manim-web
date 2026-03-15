/**
 * TypeWithCursor animation - Types text character by character with a blinking cursor.
 * UntypeWithCursor animation - Reverse typing with backspace effect.
 *
 * These animations provide a typewriter-style effect with configurable cursor
 * blinking rate, typing speed, and cursor character.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

/** Interface for mobjects that support getText/setText */
interface TextLikeMobject {
  getText(): string;
  setText(text: string): void;
}

/** Interface for mobjects that have a color property */
interface ColorableMobject {
  color: string;
}

/** Interface for mobjects that have _renderToCanvas */
interface RenderableMobject {
  _renderToCanvas(): void;
}

/** Type guard for text-like mobjects */
function hasTextMethods(obj: unknown): obj is TextLikeMobject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'getText' in obj &&
    typeof (obj as TextLikeMobject).getText === 'function' &&
    'setText' in obj &&
    typeof (obj as TextLikeMobject).setText === 'function'
  );
}

/** Type guard for mobjects with setText only */
function hasSetText(obj: unknown): obj is TextLikeMobject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'setText' in obj &&
    typeof (obj as TextLikeMobject).setText === 'function'
  );
}

/** Type guard for colorable mobjects */
function hasColor(obj: unknown): obj is ColorableMobject {
  return typeof obj === 'object' && obj !== null && 'color' in obj;
}

/** Type guard for renderable mobjects */
function hasRenderToCanvas(obj: unknown): obj is RenderableMobject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '_renderToCanvas' in obj &&
    typeof (obj as RenderableMobject)._renderToCanvas === 'function'
  );
}

/**
 * Options for TypeWithCursor animation
 */
export interface TypeWithCursorOptions extends AnimationOptions {
  /** Cursor character to display. Default: '|' */
  cursorChar?: string;
  /** Cursor blink rate in blinks per second. Default: 2 */
  cursorBlinkRate?: number;
  /** Characters typed per second. Default: 10 */
  typingSpeed?: number;
  /** Whether to show cursor blinking during typing. Default: true */
  cursorBlinks?: boolean;
  /** Whether to hide cursor after typing completes. Default: false */
  hideCursorOnComplete?: boolean;
  /** Highlight color for typed text. Default: undefined (no highlight) */
  highlightColor?: string;
}

/**
 * TypeWithCursor - Types text character by character with a blinking cursor
 *
 * Works with Text mobjects that support getText/setText methods.
 * Displays a blinking cursor at the end of the typed text.
 *
 * @example
 * ```typescript
 * const text = new Text({ text: 'Hello World' });
 * scene.play(typeWithCursor(text, { typingSpeed: 15 }));
 * ```
 */
export class TypeWithCursor extends Animation {
  /** Cursor character */
  protected readonly cursorChar: string;
  /** Cursor blink rate in blinks per second */
  protected readonly cursorBlinkRate: number;
  /** Characters per second */
  protected readonly typingSpeed: number;
  /** Whether cursor blinks during typing */
  protected readonly cursorBlinks: boolean;
  /** Whether to hide cursor on complete */
  protected readonly hideCursorOnComplete: boolean;
  /** Highlight color for typed text */
  protected readonly highlightColor?: string;

  /** Full text to type */
  protected _fullText: string = '';
  /** Currently displayed character count (excluding cursor) */
  protected _currentCharCount: number = 0;
  /** Track cursor visibility for blinking */
  protected _cursorVisible: boolean = true;
  /** Last cursor toggle time */
  protected _lastCursorToggleTime: number = 0;
  /** Original text color for highlighting */
  protected _originalColor: string = '';

  constructor(mobject: Mobject, options: TypeWithCursorOptions = {}) {
    // Calculate duration based on text length and typing speed if not provided
    const typingSpeed = options.typingSpeed ?? 10;
    const duration = options.duration; // Will be calculated in begin() if not provided

    super(mobject, { ...options, duration: duration ?? 1 });

    this.cursorChar = options.cursorChar ?? '|';
    this.cursorBlinkRate = options.cursorBlinkRate ?? 2;
    this.typingSpeed = typingSpeed;
    this.cursorBlinks = options.cursorBlinks ?? true;
    this.hideCursorOnComplete = options.hideCursorOnComplete ?? false;
    this.highlightColor = options.highlightColor;
  }

  /**
   * Get the calculated duration based on text length
   */
  protected _calculateDuration(): number {
    return this._fullText.length / this.typingSpeed;
  }

  override begin(): void {
    super.begin();

    // Get the full text to type
    if (hasTextMethods(this.mobject)) {
      this._fullText = this.mobject.getText();
    }

    // Store original color for highlighting
    if (hasColor(this.mobject)) {
      this._originalColor = this.mobject.color || '#ffffff';
    }

    // Start with empty text + cursor
    this._currentCharCount = 0;
    this._cursorVisible = true;
    this._lastCursorToggleTime = 0;

    if (hasSetText(this.mobject)) {
      this.mobject.setText(this.cursorChar);
    }
  }

  interpolate(alpha: number): void {
    if (!hasSetText(this.mobject)) {
      return;
    }

    // Calculate number of characters to show
    const targetCharCount = Math.floor(alpha * this._fullText.length);
    this._currentCharCount = Math.min(targetCharCount, this._fullText.length);

    // Get the partial text
    const partialText = this._fullText.substring(0, this._currentCharCount);

    // Handle cursor blinking
    if (this.cursorBlinks) {
      const blinkPeriod = 1 / this.cursorBlinkRate;
      const timeInAnimation = alpha * this.duration;

      // Toggle cursor based on blink rate
      if (timeInAnimation - this._lastCursorToggleTime >= blinkPeriod / 2) {
        this._cursorVisible = !this._cursorVisible;
        this._lastCursorToggleTime = timeInAnimation;
      }
    } else {
      this._cursorVisible = true;
    }

    // Build display text with cursor
    const displayText = this._cursorVisible ? partialText + this.cursorChar : partialText + ' '; // Space to maintain width when cursor hidden

    this.mobject.setText(displayText);

    // Apply highlight color if specified
    if (this.highlightColor && hasColor(this.mobject)) {
      this.mobject.color = this.highlightColor;
      if (hasRenderToCanvas(this.mobject)) {
        this.mobject._renderToCanvas();
      }
    }
  }

  override finish(): void {
    if (hasSetText(this.mobject)) {
      // Show full text, optionally with or without cursor
      if (this.hideCursorOnComplete) {
        this.mobject.setText(this._fullText);
      } else {
        this.mobject.setText(this._fullText + this.cursorChar);
      }
    }

    // Restore original color if highlighting was used
    if (this.highlightColor && this._originalColor && hasColor(this.mobject)) {
      this.mobject.color = this._originalColor;
      if (hasRenderToCanvas(this.mobject)) {
        this.mobject._renderToCanvas();
      }
    }

    super.finish();
  }
}

/**
 * Create a TypeWithCursor animation.
 * Types text character by character with a blinking cursor.
 * @param mobject The mobject to animate (must support getText/setText)
 * @param options Animation options
 */
export function typeWithCursor(mobject: Mobject, options?: TypeWithCursorOptions): TypeWithCursor {
  return new TypeWithCursor(mobject, options);
}

/**
 * Options for UntypeWithCursor animation
 */
export interface UntypeWithCursorOptions extends AnimationOptions {
  /** Cursor character to display. Default: '|' */
  cursorChar?: string;
  /** Cursor blink rate in blinks per second. Default: 2 */
  cursorBlinkRate?: number;
  /** Characters deleted per second. Default: 15 (faster than typing) */
  deletingSpeed?: number;
  /** Whether to show cursor blinking during deletion. Default: true */
  cursorBlinks?: boolean;
  /** Whether to hide cursor after deletion completes. Default: true */
  hideCursorOnComplete?: boolean;
  /** Highlight color for text being deleted. Default: undefined (no highlight) */
  highlightColor?: string;
}

/**
 * UntypeWithCursor - Reverse typing animation with backspace effect
 *
 * Works with Text mobjects that support getText/setText methods.
 * Displays a blinking cursor that moves backwards as text is deleted.
 *
 * @example
 * ```typescript
 * const text = new Text({ text: 'Hello World' });
 * scene.play(untypeWithCursor(text, { deletingSpeed: 20 }));
 * ```
 */
export class UntypeWithCursor extends Animation {
  /** Cursor character */
  protected readonly cursorChar: string;
  /** Cursor blink rate in blinks per second */
  protected readonly cursorBlinkRate: number;
  /** Characters per second */
  protected readonly deletingSpeed: number;
  /** Whether cursor blinks during deletion */
  protected readonly cursorBlinks: boolean;
  /** Whether to hide cursor on complete */
  protected readonly hideCursorOnComplete: boolean;
  /** Highlight color for text being deleted */
  protected readonly highlightColor?: string;

  /** Full text to untype */
  protected _fullText: string = '';
  /** Track cursor visibility for blinking */
  protected _cursorVisible: boolean = true;
  /** Last cursor toggle time */
  protected _lastCursorToggleTime: number = 0;
  /** Original text color */
  protected _originalColor: string = '';

  constructor(mobject: Mobject, options: UntypeWithCursorOptions = {}) {
    const deletingSpeed = options.deletingSpeed ?? 15;
    const duration = options.duration; // Will use default or provided

    super(mobject, { ...options, duration: duration ?? 1 });

    this.cursorChar = options.cursorChar ?? '|';
    this.cursorBlinkRate = options.cursorBlinkRate ?? 2;
    this.deletingSpeed = deletingSpeed;
    this.cursorBlinks = options.cursorBlinks ?? true;
    this.hideCursorOnComplete = options.hideCursorOnComplete ?? true;
    this.highlightColor = options.highlightColor;
  }

  override begin(): void {
    super.begin();

    // Get the full text to untype
    if (hasTextMethods(this.mobject)) {
      this._fullText = this.mobject.getText();
      // Remove trailing cursor if present
      const cursorLen = this.cursorChar.length;
      if (this._fullText.slice(-cursorLen) === this.cursorChar) {
        this._fullText = this._fullText.slice(0, -cursorLen);
      }
    }

    // Store original color
    if (hasColor(this.mobject)) {
      this._originalColor = this.mobject.color || '#ffffff';
    }

    this._cursorVisible = true;
    this._lastCursorToggleTime = 0;

    // Start with full text + cursor
    if (hasSetText(this.mobject)) {
      this.mobject.setText(this._fullText + this.cursorChar);
    }
  }

  interpolate(alpha: number): void {
    if (!hasSetText(this.mobject)) {
      return;
    }

    // Calculate number of characters remaining (reverse of typing)
    const charsToRemove = Math.floor(alpha * this._fullText.length);
    const remainingChars = Math.max(0, this._fullText.length - charsToRemove);

    // Get the remaining text
    const partialText = this._fullText.substring(0, remainingChars);

    // Handle cursor blinking
    if (this.cursorBlinks) {
      const blinkPeriod = 1 / this.cursorBlinkRate;
      const timeInAnimation = alpha * this.duration;

      // Toggle cursor based on blink rate
      if (timeInAnimation - this._lastCursorToggleTime >= blinkPeriod / 2) {
        this._cursorVisible = !this._cursorVisible;
        this._lastCursorToggleTime = timeInAnimation;
      }
    } else {
      this._cursorVisible = true;
    }

    // Build display text with cursor
    const displayText = this._cursorVisible ? partialText + this.cursorChar : partialText + ' ';

    this.mobject.setText(displayText);

    // Apply highlight color if specified
    if (this.highlightColor && hasColor(this.mobject)) {
      this.mobject.color = this.highlightColor;
      if (hasRenderToCanvas(this.mobject)) {
        this.mobject._renderToCanvas();
      }
    }
  }

  override finish(): void {
    if (hasSetText(this.mobject)) {
      // End with empty text, optionally with or without cursor
      if (this.hideCursorOnComplete) {
        this.mobject.setText('');
      } else {
        this.mobject.setText(this.cursorChar);
      }
    }

    // Restore original color if highlighting was used
    if (this.highlightColor && this._originalColor && hasColor(this.mobject)) {
      this.mobject.color = this._originalColor;
      if (hasRenderToCanvas(this.mobject)) {
        this.mobject._renderToCanvas();
      }
    }

    super.finish();
  }
}

/**
 * Create an UntypeWithCursor animation.
 * Removes text character by character with a backspace-style effect.
 * @param mobject The mobject to animate (must support getText/setText)
 * @param options Animation options
 */
export function untypeWithCursor(
  mobject: Mobject,
  options?: UntypeWithCursorOptions,
): UntypeWithCursor {
  return new UntypeWithCursor(mobject, options);
}
