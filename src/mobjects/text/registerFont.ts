/**
 * `registerFont` — register a custom font in the browser (CE `register_font`).
 *
 * CE's `register_font(path)` registers a font file with the system so Pango can
 * use it when rasterizing text. The browser analog is the CSS Font Loading API:
 * build a `FontFace` and add it to `document.fonts`. The browser then loads the
 * font lazily the first time text uses the family, so adding the face is enough
 * to make the family available — no eager `load()` call is required.
 *
 * The function is guarded for environments without the API (Node, test workers,
 * server-side rendering): it returns `false` and does nothing when `document`,
 * `document.fonts`, or `FontFace` is unavailable, so it is safe to call anywhere.
 */

/**
 * A font source accepted by `registerFont`.
 *
 * - A `string` is a CSS source. A bare URL or path is wrapped as `url("…")`;
 *   a value that already starts with `url(` or `local(` is used verbatim.
 * - A `BufferSource` (an `ArrayBuffer` or typed-array view) is font binary data,
 *   passed straight to the `FontFace` constructor.
 */
export type FontSource = string | BufferSource;

/**
 * Register a custom font so text mobjects can use it by family name.
 *
 * @param family - The font-family name to register the source under.
 * @param source - A CSS source string, a URL/path, or font binary data.
 * @returns `true` when the font was registered, `false` when the CSS Font
 *   Loading API is unavailable (for example in Node or a test worker).
 *
 * @example
 * ```typescript
 * registerFont('Inter', 'https://example.com/Inter.woff2');
 * registerFont('Inter', 'url("/fonts/Inter.woff2")'); // explicit CSS source
 * ```
 */
export function registerFont(family: string, source: FontSource): boolean {
  if (
    typeof document === 'undefined' ||
    typeof FontFace === 'undefined' ||
    typeof document.fonts === 'undefined'
  ) {
    return false;
  }

  const descriptor: FontSource =
    typeof source === 'string' && !/^\s*(url|local)\s*\(/i.test(source)
      ? `url("${source}")`
      : source;

  const fontFace = new FontFace(family, descriptor);
  document.fonts.add(fontFace);
  return true;
}
