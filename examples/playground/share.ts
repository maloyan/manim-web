// Share-link helpers for the playground.
//
// The editor code is compressed with lz-string and stored in the URL hash as
// `#code=<encoded>`. lz-string's URI-safe alphabet contains `+`, which
// `URLSearchParams` would turn into a space, so the hash is parsed by hand
// instead of through `URLSearchParams`.
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

const HASH_KEY = 'code';

/** Compress source code into a URL-safe string. */
export function encodeCode(code: string): string {
  return compressToEncodedURIComponent(code);
}

/**
 * Decompress a URL-safe string back into source code.
 * Returns null when the input is empty or cannot be decoded.
 */
export function decodeCode(encoded: string): string | null {
  if (!encoded) return null;
  const decoded = decompressFromEncodedURIComponent(encoded);
  if (decoded === null || decoded === '') return null;
  return decoded;
}

/** Build the location hash (including the leading `#`) for a share link. */
export function codeToHash(code: string): string {
  return `#${HASH_KEY}=${encodeCode(code)}`;
}

/**
 * Read the code stored in a location hash.
 * Accepts the hash with or without the leading `#`. Returns null when no code
 * segment is present or the value cannot be decoded.
 */
export function codeFromHash(hash: string): string | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const prefix = `${HASH_KEY}=`;
  const segment = raw.split('&').find((part) => part.startsWith(prefix));
  if (!segment) return null;
  return decodeCode(segment.slice(prefix.length));
}
