/**
 * Lightweight feature flag system for manim-js.
 * Enables toggling experimental features without code changes.
 */

type FeatureFlags = Record<string, boolean>;

const DEFAULT_FLAGS: FeatureFlags = {
  EXPERIMENTAL_3D_LIGHTING: false,
  WEBGPU_RENDERER: false,
  ADVANCED_TEXT_LAYOUT: false,
};

let flags: FeatureFlags = { ...DEFAULT_FLAGS };

/** Check if a feature flag is enabled. */
export function isFeatureEnabled(flag: string): boolean {
  return flags[flag] ?? false;
}

/** Override feature flags (e.g., from environment or config). */
export function setFeatureFlags(overrides: Partial<FeatureFlags>): void {
  flags = { ...flags, ...overrides };
}

/** Reset all flags to defaults. */
export function resetFeatureFlags(): void {
  flags = { ...DEFAULT_FLAGS };
}

/** Get all current flag values. */
export function getFeatureFlags(): Readonly<FeatureFlags> {
  return { ...flags };
}
