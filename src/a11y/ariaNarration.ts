/**
 * ARIA live-region narration for manim-web — an opt-in accessibility
 * capability.
 *
 * Screen-reader users cannot see a scene change. A visually hidden
 * `aria-live` region lets the app announce what just appeared ("Scene one",
 * "A blue square") as text the screen reader speaks.
 *
 * The region is hidden with a clipped 1px box, not `display:none`, because a
 * `display:none` element is not announced. Every DOM access is guarded, so an
 * {@link AriaNarrator} built in Node / SSR / tests is simply `available`
 * `false` and every method is a safe no-op.
 */

const DEFAULT_REGION_ID = 'manim-web-aria-live';

/**
 * Inline style that hides the region from sight while keeping it in the
 * accessibility tree. This is the standard "visually hidden" / sr-only recipe.
 */
const HIDDEN_STYLE = [
  'position:absolute',
  'width:1px',
  'height:1px',
  'margin:-1px',
  'padding:0',
  'border:0',
  'overflow:hidden',
  'clip:rect(0 0 0 0)',
  'clip-path:inset(50%)',
  'white-space:nowrap',
].join(';');

/** Options for a live region. */
export interface LiveRegionOptions {
  /** Element id for the region. Default `manim-web-aria-live`. */
  id?: string;
  /** Use `aria-live="assertive"` instead of the default `polite`. */
  assertive?: boolean;
}

/**
 * Anything carrying optional accessibility text. A mobject or scene can expose
 * `ariaLabel` / `ariaDescription` without this module importing its type.
 */
export interface AriaDescribable {
  /** Short name of the object, e.g. `Circle`. */
  ariaLabel?: string;
  /** Longer description, e.g. `radius 2, centered`. */
  ariaDescription?: string;
}

function hasDocumentBody(): boolean {
  return typeof document !== 'undefined' && !!document.body;
}

/**
 * Create (or reuse) a visually hidden `aria-live` region on `document.body`.
 *
 * A region with the same id is reused rather than duplicated, so repeated
 * calls do not stack elements.
 *
 * @returns The region element, or `null` when there is no document.
 */
export function createLiveRegion(options: LiveRegionOptions = {}): HTMLElement | null {
  if (!hasDocumentBody()) {
    return null;
  }
  const id = options.id ?? DEFAULT_REGION_ID;
  let region = document.getElementById(id);
  if (!region) {
    region = document.createElement('div');
    region.id = id;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = HIDDEN_STYLE;
    document.body.appendChild(region);
  }
  region.setAttribute('aria-live', options.assertive ? 'assertive' : 'polite');
  return region;
}

/**
 * Build the spoken description for a describable object, joining its label and
 * description with a period.
 *
 * @returns The text, or `null` when neither field is a non-empty string.
 */
export function describeMobject(target: AriaDescribable): string | null {
  const label = typeof target.ariaLabel === 'string' ? target.ariaLabel.trim() : '';
  const description =
    typeof target.ariaDescription === 'string' ? target.ariaDescription.trim() : '';
  const text = [label, description].filter((part) => part.length > 0).join('. ');
  return text.length > 0 ? text : null;
}

/** Announces scene and mobject descriptions through an ARIA live region. */
export class AriaNarrator {
  private _region: HTMLElement | null;

  constructor(options: LiveRegionOptions = {}) {
    this._region = createLiveRegion(options);
  }

  /** Whether a live region exists (false in a non-DOM environment). */
  get available(): boolean {
    return this._region !== null;
  }

  /**
   * Announce `message` to screen readers. Clears the region first so an
   * identical consecutive message is still re-announced. No-op when
   * unavailable.
   */
  announce(message: string): void {
    if (!this._region) return;
    this._region.textContent = '';
    this._region.textContent = message;
  }

  /** Clear the region text. No-op when unavailable. */
  clear(): void {
    if (this._region) {
      this._region.textContent = '';
    }
  }

  /** Remove the region from the document. The narrator becomes unavailable. */
  destroy(): void {
    this._region?.parentNode?.removeChild(this._region);
    this._region = null;
  }
}

/**
 * Announce a describable object's description through `narrator`.
 *
 * @returns `true` if there was something to announce, `false` otherwise.
 */
export function announceMobject(narrator: AriaNarrator, target: AriaDescribable): boolean {
  const text = describeMobject(target);
  if (text === null) {
    return false;
  }
  narrator.announce(text);
  return true;
}
