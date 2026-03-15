/** Resolution multiplier for crisp text on the current display. */
export function getTextResolutionScale(): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.max(2, Math.ceil(dpr) * 2);
}
