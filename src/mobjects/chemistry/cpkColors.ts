/**
 * CPK / Jmol color palette for chemical elements.
 *
 * The CPK coloring convention assigns a standard color to each element
 * (oxygen red, nitrogen blue, and so on). These hex values follow the Jmol
 * palette, which is the de-facto standard used by most molecular viewers.
 */

/** Fallback color for an element that is not in the palette. */
export const DEFAULT_ELEMENT_COLOR = '#DDDDDD';

/**
 * Element symbol to hex color (CPK / Jmol convention).
 *
 * Carbon uses a visible mid-gray rather than pure black so it reads on a dark
 * background; callers can override any element through MoleculeOptions.colors.
 */
export const CPK_COLORS: Readonly<Record<string, string>> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
  He: '#D9FFFF',
  Ne: '#B3E3F5',
  Ar: '#80D1E3',
  P: '#FF8000',
  S: '#FFFF30',
  B: '#FFB5B5',
  Li: '#CC80FF',
  Na: '#AB5CF2',
  K: '#8F40D4',
  Mg: '#8AFF00',
  Ca: '#3DFF00',
  Fe: '#E06633',
  Zn: '#7D80B0',
  Cu: '#C88033',
};

/**
 * Normalize an element symbol to its canonical case.
 *
 * A symbol is an uppercase first letter and a lowercase second letter, so
 * 'cl', 'CL' and 'Cl' all resolve to 'Cl'. The input is trimmed first.
 * @param element - The raw element symbol.
 * @returns The canonical symbol.
 */
export function normalizeElement(element: string): string {
  const trimmed = element.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  return trimmed[0].toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Resolve the color for an element.
 *
 * The lookup order is: caller overrides, then the CPK palette, then the
 * default color. Overrides are matched case-insensitively: an override key in
 * any case (e.g. 'cl' or 'CL') resolves to the same element as its canonical
 * symbol ('Cl'), so an override is never silently ignored over a case mismatch.
 * @param element - The element symbol (any case).
 * @param overrides - Optional per-element color overrides.
 * @returns The hex color string.
 */
export function cpkColor(element: string, overrides?: Record<string, string>): string {
  const symbol = normalizeElement(element);
  if (overrides) {
    // Exact matches win first, to keep a deterministic order when a caller
    // supplies both a canonical and a case-variant key.
    if (overrides[symbol] !== undefined) {
      return overrides[symbol];
    }
    if (overrides[element] !== undefined) {
      return overrides[element];
    }
    // Case-insensitive fallback: match any override key that normalizes to the
    // same symbol, so a key whose case differs from the symbol still wins.
    for (const key of Object.keys(overrides)) {
      if (overrides[key] !== undefined && normalizeElement(key) === symbol) {
        return overrides[key];
      }
    }
  }
  return CPK_COLORS[symbol] ?? DEFAULT_ELEMENT_COLOR;
}
