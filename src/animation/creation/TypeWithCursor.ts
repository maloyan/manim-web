/**
 * TypeWithCursor animation - Types text character by character with a blinking cursor.
 * UntypeWithCursor animation - Reverse typing with backspace effect.
 *
 * These animations provide a typewriter-style effect with configurable cursor
 * blinking rate, typing speed, and cursor character.
 */

import { Mobject } from '../../core/Mobject';
import { Animation, AnimationOptions } from '../Animation';

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
    if ('getText' in this.mobject && typeof (this.mobject as any).getText === 'function') {
      this._fullText = (this.mobject as any).getText();
    }

    // Store original color for highlighting
    if ('color' in this.mobject) {
      this._originalColor = (this.mobject as any).color || '#ffffff';
    }

    // Start with empty text + cursor
    this._currentCharCount = 0;
    this._cursorVisible = true;
    this._lastCursorToggleTime = 0;

    if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
      (this.mobject as any).setText(this.cursorChar);
    }
  }

  interpolate(alpha: number): void {
    if (!('setText' in this.mobject) || typeof (this.mobject as any).setText !== 'function') {
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
    const displayText = this._cursorVisible
      ? partialText + this.cursorChar
      : partialText + ' '; // Space to maintain width when cursor hidden

    (this.mobject as any).setText(displayText);

    // Apply highlight color if specified
    if (this.highlightColor && 'color' in this.mobject) {
      (this.mobject as any).color = this.highlightColor;
      if ('_renderToCanvas' in this.mobject) {
        (this.mobject as any)._renderToCanvas();
      }
    }
  }

  override finish(): void {
    if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
      // Show full text, optionally with or without cursor
      if (this.hideCursorOnComplete) {
        (this.mobject as any).setText(this._fullText);
      } else {
        (this.mobject as any).setText(this._fullText + this.cursorChar);
      }
    }

    // Restore original color if highlighting was used
    if (this.highlightColor && this._originalColor && 'color' in this.mobject) {
      (this.mobject as any).color = this._originalColor;
      if ('_renderToCanvas' in this.mobject) {
        (this.mobject as any)._renderToCanvas();
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
export function typeWithCursor(
  mobject: Mobject,
  options?: TypeWithCursorOptions
): TypeWithCursor {
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
    if ('getText' in this.mobject && typeof (this.mobject as any).getText === 'function') {
      this._fullText = (this.mobject as any).getText();
      // Remove trailing cursor if present
      const cursorLen = this.cursorChar.length;
      if (this._fullText.slice(-cursorLen) === this.cursorChar) {
        this._fullText = this._fullText.slice(0, -cursorLen);
      }
    }

    // Store original color
    if ('color' in this.mobject) {
      this._originalColor = (this.mobject as any).color || '#ffffff';
    }

    this._cursorVisible = true;
    this._lastCursorToggleTime = 0;

    // Start with full text + cursor
    if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
      (this.mobject as any).setText(this._fullText + this.cursorChar);
    }
  }

  interpolate(alpha: number): void {
    if (!('setText' in this.mobject) || typeof (this.mobject as any).setText !== 'function') {
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
    const displayText = this._cursorVisible
      ? partialText + this.cursorChar
      : partialText + ' ';

    (this.mobject as any).setText(displayText);

    // Apply highlight color if specified
    if (this.highlightColor && 'color' in this.mobject) {
      (this.mobject as any).color = this.highlightColor;
      if ('_renderToCanvas' in this.mobject) {
        (this.mobject as any)._renderToCanvas();
      }
    }
  }

  override finish(): void {
    if ('setText' in this.mobject && typeof (this.mobject as any).setText === 'function') {
      // End with empty text, optionally with or without cursor
      if (this.hideCursorOnComplete) {
        (this.mobject as any).setText('');
      } else {
        (this.mobject as any).setText(this.cursorChar);
      }
    }

    // Restore original color if highlighting was used
    if (this.highlightColor && this._originalColor && 'color' in this.mobject) {
      (this.mobject as any).color = this._originalColor;
      if ('_renderToCanvas' in this.mobject) {
        (this.mobject as any)._renderToCanvas();
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
  options?: UntypeWithCursorOptions
): UntypeWithCursor {
  return new UntypeWithCursor(mobject, options);
}
