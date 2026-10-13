/**
 * fetchPdb - an opt-in PDB fetch-by-id helper that never calls the network itself.
 *
 * The manim-web library is no-network by policy: {@link parsePdb} and
 * parseMolfile take local strings, and {@link ModelMobject} loads models through
 * an injected loader seam. This helper follows the same rule. It builds the
 * standard RCSB / PDBe download URL for a 4-char PDB id and parses the text,
 * but the caller supplies the fetcher that actually touches the network. The
 * library never imports or calls `fetch` or node http.
 *
 * Provide a fetcher per call with `options.fetcher`, or once for the module with
 * {@link setPdbFetcher} (the dependency-injection seam, mirroring
 * `setModelLoaderFactory` in ModelMobject). With no fetcher available, fetchPdb
 * throws a clear Error that names setPdbFetcher.
 */

import { parsePdb, type ParsedStructure } from './pdb';

/**
 * A text fetcher the CALLER provides (for example a wrapper around
 * `window.fetch` that returns `response.text()`). The library never calls the
 * network itself; it only awaits this function.
 */
export type PdbTextFetcher = (url: string) => Promise<string>;

/** The known PDB download sources whose URL template {@link pdbUrl} builds. */
export type PdbSource = 'rcsb' | 'pdbe';

/** Options for {@link fetchPdb}. */
export interface FetchPdbOptions {
  /**
   * The fetcher to use. When omitted, the module-level default set via
   * {@link setPdbFetcher} is used; if none is set, {@link fetchPdb} throws.
   */
  fetcher?: PdbTextFetcher;
  /** Which URL template to build. Default: 'rcsb'. */
  source?: PdbSource;
  /** Override the URL entirely. Wins over `source` and {@link pdbUrl}. */
  urlFor?: (id: string) => string;
}

/** A valid PDB id: exactly four alphanumeric characters (for example '1CRN'). */
const PDB_ID_PATTERN = /^[A-Za-z0-9]{4}$/;

/** The module-level default fetcher, set via {@link setPdbFetcher}. */
let defaultFetcher: PdbTextFetcher | null = null;

/**
 * Set the module-level default PDB fetcher, or pass `null` to clear it. This is
 * the dependency-injection seam, like `setModelLoaderFactory` in ModelMobject.
 * When set, {@link fetchPdb} uses it whenever `options.fetcher` is omitted.
 */
export function setPdbFetcher(fetcher: PdbTextFetcher | null): void {
  defaultFetcher = fetcher;
}

/**
 * Build the standard download URL for a PDB id. Pure: it builds the URL only and
 * never fetches.
 *
 * - 'rcsb': `https://files.rcsb.org/download/<ID>.pdb` (id uppercased).
 * - 'pdbe': `https://www.ebi.ac.uk/pdbe/entry-files/download/pdb<id>.ent`
 *   (id lowercased).
 *
 * Throws a clear Error if the id is not a 4-char alphanumeric PDB id.
 */
export function pdbUrl(id: string, source: PdbSource = 'rcsb'): string {
  const validId = assertPdbId(id);
  if (source === 'pdbe') {
    return `https://www.ebi.ac.uk/pdbe/entry-files/download/pdb${validId.toLowerCase()}.ent`;
  }
  return `https://files.rcsb.org/download/${validId.toUpperCase()}.pdb`;
}

/**
 * Fetch a PDB entry by id and parse it into a {@link ParsedStructure}.
 *
 * The helper validates the id, resolves the fetcher
 * (`options.fetcher` ?? the module default from {@link setPdbFetcher}), builds
 * the URL (`options.urlFor` ?? {@link pdbUrl}), awaits the fetcher, then parses
 * the returned text with {@link parsePdb}. It never calls the network itself.
 *
 * Throws a clear Error if the id is invalid or no fetcher is available. A
 * rejection from the fetcher propagates to the caller.
 */
export async function fetchPdb(
  id: string,
  options: FetchPdbOptions = {},
): Promise<ParsedStructure> {
  const validId = assertPdbId(id);
  const fetcher = options.fetcher ?? defaultFetcher;
  if (!fetcher) {
    throw new Error(
      'fetchPdb needs a fetcher, because manim-web never calls the network itself. ' +
        'Pass options.fetcher, or set a module default once with ' +
        'setPdbFetcher((url) => fetch(url).then((r) => r.text())).',
    );
  }
  const url = options.urlFor ? options.urlFor(validId) : pdbUrl(validId, options.source);
  const text = await fetcher(url);
  return parsePdb(text);
}

/** Validate a PDB id and return it, or throw a clear Error. */
function assertPdbId(id: string): string {
  if (!PDB_ID_PATTERN.test(id)) {
    throw new Error(
      `Invalid PDB id "${id}". A PDB id is exactly four alphanumeric characters, for example "1CRN".`,
    );
  }
  return id;
}
