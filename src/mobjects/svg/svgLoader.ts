/**
 * URL loading for SVGMobject (best-manim enhancement).
 *
 * `SVGMobject.fromUrl` fetches SVG text and parses it through the existing
 * string path. The fetcher is injected (default `globalThis.fetch`) so tests
 * can supply a mock and never touch the network.
 */

/** Minimal response shape `fromUrl` needs — satisfied by the DOM `Response`. */
export interface SvgFetchResponse {
  /** Whether the HTTP status is in the 2xx range. */
  ok: boolean;
  /** HTTP status code. */
  status: number;
  /** Resolve to the response body as text. */
  text(): Promise<string>;
}

/** A function that fetches a URL, compatible with `globalThis.fetch`. */
export type SvgFetcher = (url: string) => Promise<SvgFetchResponse>;

/**
 * Default fetcher: delegates to `globalThis.fetch`.
 *
 * Rejects with a clear error when no global fetch exists, so the caller can
 * record it via `getLoadError()` instead of throwing a cryptic ReferenceError.
 */
export const defaultSvgFetcher: SvgFetcher = (url) => {
  if (typeof globalThis.fetch !== 'function') {
    return Promise.reject(
      new Error('SVGMobject.fromUrl: global fetch is unavailable; pass options.fetcher'),
    );
  }
  return globalThis.fetch(url);
};

/**
 * Fetch SVG text from a URL using the injected fetcher.
 *
 * @param url - The SVG resource URL.
 * @param fetcher - The fetch implementation (defaults to {@link defaultSvgFetcher}).
 * @returns The response body as text.
 * @throws When the fetch rejects or the response status is not ok.
 */
export async function fetchSvgText(
  url: string,
  fetcher: SvgFetcher = defaultSvgFetcher,
): Promise<string> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`SVGMobject.fromUrl: failed to fetch ${url} (status ${response.status})`);
  }
  return response.text();
}
