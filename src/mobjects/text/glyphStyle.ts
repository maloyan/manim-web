import type { Mobject, MobjectStyle } from '../../core/Mobject';

/** A Mobject whose internal style record is reachable by the restyle code. */
type WithStyleRecord = Mobject & { _style: MobjectStyle };

/**
 * Narrow a Mobject to one that exposes its internal `_style` record.
 *
 * `_style` is a protected field on Mobject. The MathTex or Typst group that
 * restyles its glyphs reads it on a sibling instance, which TypeScript blocks
 * through the base Mobject type. This guard runs the real `'_style' in mob`
 * check (always true for a built Mobject) and narrows the type, so the caller
 * reads `mob._style` without a double cast.
 * @param mob - The Mobject to test.
 * @returns True if the internal style record is present.
 */
export function hasStyleRecord(mob: Mobject): mob is WithStyleRecord {
  return '_style' in mob;
}
