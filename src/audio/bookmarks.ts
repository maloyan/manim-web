/**
 * Transcript bookmark parsing for voiceover narration.
 *
 * A narration string can carry inline markers that tie an animation beat to a
 * spoken word, for example:
 *
 * ```text
 * The derivative of <bookmark mark="eq"/> the function is its slope.
 * ```
 *
 * `parseBookmarks` strips every marker out of the string and records where each
 * marker sits in the clean (spoken) text. The spoken text is what the
 * synthesizer receives; the recorded character index is what
 * `VoiceoverTracker.waitForMark` compares boundary events against.
 *
 * The parser is pure and has no DOM or browser dependency, so it imports and
 * runs in Node without any guard.
 */

/** A single marker found in a narration string. */
export interface Bookmark {
  /** The `mark` attribute value, e.g. `"eq"`. */
  mark: string;
  /** Character index into the clean (spoken) text where the marker sits. */
  charIndex: number;
}

/** The result of stripping markers out of a narration string. */
export interface ParsedTranscript {
  /** The spoken text with every `<bookmark .../>` marker removed. */
  text: string;
  /** Every marker found, in document order. */
  bookmarks: Bookmark[];
}

/**
 * Matches a `<bookmark mark="name"/>` marker.
 *
 * - Single or double quotes around the value.
 * - Optional whitespace around `=` and before the closing `/>`.
 * - A self-closing `/>` or a plain `>`.
 */
const BOOKMARK_PATTERN = /<bookmark\s+mark\s*=\s*["']([^"']*)["']\s*\/?>/gi;

/**
 * Strip every bookmark marker out of a narration string.
 *
 * @param input - The raw narration string, possibly with markers.
 * @returns The clean spoken text and the list of markers with their positions.
 */
export function parseBookmarks(input: string): ParsedTranscript {
  const bookmarks: Bookmark[] = [];
  let text = '';
  let lastIndex = 0;

  // Reset the stateful (global) regex before use.
  BOOKMARK_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null = BOOKMARK_PATTERN.exec(input);
  while (match !== null) {
    text += input.slice(lastIndex, match.index);
    // The marker sits at the current length of the accumulated clean text.
    bookmarks.push({ mark: match[1], charIndex: text.length });
    lastIndex = match.index + match[0].length;
    match = BOOKMARK_PATTERN.exec(input);
  }
  text += input.slice(lastIndex);

  return { text, bookmarks };
}
