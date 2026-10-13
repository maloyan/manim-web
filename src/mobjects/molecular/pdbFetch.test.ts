/**
 * Tests for fetchPdb / pdbUrl / setPdbFetcher.
 *
 * The helper never touches the network: every test injects a fake fetcher. They
 * cover the pure URL builder, id validation, the injected and module-default
 * fetcher paths, the urlFor override, and fetcher-rejection propagation.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fetchPdb, pdbUrl, setPdbFetcher, type PdbTextFetcher } from './pdbFetch';

/** Build a fixed-column PDB line; each field is `[startColumn (1-indexed), text]`. */
function pdbLine(fields: Array<[number, string]>): string {
  const arr: string[] = Array<string>(80).fill(' ');
  for (const [start, text] of fields) {
    for (let i = 0; i < text.length; i++) {
      arr[start - 1 + i] = text[i];
    }
  }
  return arr.join('').replace(/\s+$/, '');
}

/** A tiny but valid PDB string: one ATOM (nitrogen) and one HETATM (oxygen). */
const TINY_PDB = [
  pdbLine([
    [1, 'ATOM'],
    [7, '    1'],
    [13, ' N  '],
    [18, 'ALA'],
    [22, 'A'],
    [23, '   1'],
    [31, '  11.000'],
    [39, '  13.000'],
    [47, '  10.000'],
    [77, ' N'],
  ]),
  pdbLine([
    [1, 'HETATM'],
    [7, '    2'],
    [13, ' O1 '],
    [18, 'LIG'],
    [22, 'A'],
    [23, ' 101'],
    [31, '  20.000'],
    [39, '  20.000'],
    [47, '  20.000'],
    [77, ' O'],
  ]),
  'END',
].join('\n');

/** Records every URL a fetcher is asked for, and returns the tiny PDB. */
function recordingFetcher(): { calls: string[]; fetcher: PdbTextFetcher } {
  const calls: string[] = [];
  return {
    calls,
    fetcher: (url: string) => {
      calls.push(url);
      return Promise.resolve(TINY_PDB);
    },
  };
}

// The module default is global state; keep tests isolated.
beforeEach(() => setPdbFetcher(null));
afterEach(() => setPdbFetcher(null));

describe('pdbUrl', () => {
  it('builds the rcsb URL by default with an uppercased id', () => {
    expect(pdbUrl('1crn')).toBe('https://files.rcsb.org/download/1CRN.pdb');
    expect(pdbUrl('1CRN', 'rcsb')).toBe('https://files.rcsb.org/download/1CRN.pdb');
  });

  it('builds the pdbe URL with a lowercased id', () => {
    expect(pdbUrl('1CRN', 'pdbe')).toBe(
      'https://www.ebi.ac.uk/pdbe/entry-files/download/pdb1crn.ent',
    );
  });

  it('throws on an invalid id', () => {
    expect(() => pdbUrl('XYZ')).toThrow(/invalid pdb id/i);
    expect(() => pdbUrl('12345')).toThrow(/invalid pdb id/i);
    expect(() => pdbUrl('12-4')).toThrow(/invalid pdb id/i);
  });
});

describe('fetchPdb', () => {
  it('rejects an invalid id', async () => {
    await expect(fetchPdb('nope!', { fetcher: () => Promise.resolve(TINY_PDB) })).rejects.toThrow(
      /invalid pdb id/i,
    );
  });

  it('parses the structure the injected fetcher returns', async () => {
    const { calls, fetcher } = recordingFetcher();
    const s = await fetchPdb('1CRN', { fetcher });
    expect(calls).toEqual(['https://files.rcsb.org/download/1CRN.pdb']);
    expect(s.atoms).toHaveLength(1);
    expect(s.atoms[0].element).toBe('N');
    expect(s.hetatms).toHaveLength(1);
    expect(s.hetatms[0].element).toBe('O');
  });

  it('builds the pdbe URL when source is pdbe', async () => {
    const { calls, fetcher } = recordingFetcher();
    await fetchPdb('1CRN', { fetcher, source: 'pdbe' });
    expect(calls).toEqual(['https://www.ebi.ac.uk/pdbe/entry-files/download/pdb1crn.ent']);
  });

  it('throws a clear error naming setPdbFetcher when no fetcher is available', async () => {
    await expect(fetchPdb('1CRN')).rejects.toThrow(/setPdbFetcher/);
  });

  it('uses the module default fetcher when options.fetcher is omitted', async () => {
    const { calls, fetcher } = recordingFetcher();
    setPdbFetcher(fetcher);
    const s = await fetchPdb('1CRN');
    expect(calls).toEqual(['https://files.rcsb.org/download/1CRN.pdb']);
    expect(s.atoms).toHaveLength(1);
  });

  it('prefers options.fetcher over the module default', async () => {
    const used: string[] = [];
    setPdbFetcher(() => {
      used.push('default');
      return Promise.resolve(TINY_PDB);
    });
    await fetchPdb('1CRN', {
      fetcher: () => {
        used.push('injected');
        return Promise.resolve(TINY_PDB);
      },
    });
    expect(used).toEqual(['injected']);
  });

  it('honors a urlFor override', async () => {
    const { calls, fetcher } = recordingFetcher();
    await fetchPdb('1CRN', { fetcher, source: 'pdbe', urlFor: (id) => `custom://${id}.pdb` });
    expect(calls).toEqual(['custom://1CRN.pdb']);
  });

  it('propagates a fetcher rejection', async () => {
    const boom = new Error('network down');
    await expect(fetchPdb('1CRN', { fetcher: () => Promise.reject(boom) })).rejects.toThrow(
      'network down',
    );
  });
});
