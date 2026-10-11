/**
 * ThemeManager - named themes for default stroke/fill colors and scene background.
 *
 * Themes are opt-in. The active theme is `default` until {@link setTheme} is
 * called, and the `default` theme reproduces manim-web's historical defaults
 * (white stroke, white fill, `MANIM_BACKGROUND`). So nothing changes visually
 * unless a theme is explicitly selected.
 *
 * A theme influences:
 * - New mobjects: {@link getActiveTheme} is read in the `Mobject` constructor to
 *   seed the default stroke and fill colors.
 * - New scenes: `Scene` reads the active theme's `background` as its default
 *   background color when none is passed.
 * - Existing scenes: {@link setTheme} can optionally re-skin a scene passed in
 *   its options (background plus every mobject's stroke/fill color).
 */

import type { Color } from 'three';
import { MANIM_BACKGROUND, WHITE, BLACK, BLUE } from '../constants/colors';

/** 3Blue1Brown's signature near-black background. */
const THREE_B1B_BACKGROUND = '#000000';

/** A theme palette: default stroke/fill colors plus the scene background. */
export interface Theme {
  /** Default stroke color for new mobjects. */
  strokeColor: string;
  /** Default fill color for new mobjects. */
  fillColor: string;
  /** Scene background color. */
  background: string;
}

/** The active theme palette together with its registered name. */
export interface ActiveTheme extends Theme {
  /** The registered name of the active theme. */
  name: string;
}

/**
 * A mobject that {@link setTheme} can re-skin. Structural, so `Mobject`
 * satisfies it without ThemeManager importing core (which would be a cycle).
 */
export interface ReskinnableMobject {
  setColor(color: string): unknown;
  setFill(color?: string, opacity?: number): unknown;
  getFamily(): ReskinnableMobject[];
}

/**
 * A scene that {@link setTheme} can re-skin. Structural, so `Scene` satisfies it
 * without ThemeManager importing core.
 */
export interface ReskinnableScene {
  backgroundColor: Color | string;
  readonly mobjects: ReadonlySet<ReskinnableMobject>;
}

/** Options for {@link setTheme}. */
export interface SetThemeOptions {
  /**
   * An existing scene to re-skin (background plus every mobject's colors).
   * When omitted, {@link setTheme} only changes the defaults for new mobjects
   * and scenes.
   */
  scene?: ReskinnableScene;
  /**
   * Whether to re-skin the given `scene`. Defaults to `true` when a `scene` is
   * provided. Set to `false` to change defaults without touching the scene.
   */
  reskin?: boolean;
}

const BUILTIN_THEMES: Record<string, Theme> = {
  default: { strokeColor: WHITE, fillColor: WHITE, background: MANIM_BACKGROUND },
  dark: { strokeColor: WHITE, fillColor: WHITE, background: BLACK },
  light: { strokeColor: BLACK, fillColor: BLACK, background: WHITE },
  '3b1b': { strokeColor: WHITE, fillColor: BLUE, background: THREE_B1B_BACKGROUND },
};

const themes = new Map<string, Theme>();
let activeName = 'default';

function resetBuiltins(): void {
  themes.clear();
  for (const [name, palette] of Object.entries(BUILTIN_THEMES)) {
    themes.set(name, { ...palette });
  }
  activeName = 'default';
}
resetBuiltins();

/**
 * Register (or overwrite) a named theme.
 * @param name - The theme name used by {@link setTheme}.
 * @param palette - The stroke/fill/background colors for the theme.
 */
export function registerTheme(name: string, palette: Theme): void {
  themes.set(name, { ...palette });
}

/**
 * Select the active theme by name.
 *
 * Changes the defaults read by new mobjects and new scenes. When `options.scene`
 * is given (and `options.reskin` is not `false`), the scene's background and
 * every mobject's stroke/fill color are updated immediately.
 *
 * @param name - A registered theme name.
 * @param options - Optional scene to re-skin and re-skin toggle.
 * @throws If `name` is not a registered theme.
 */
export function setTheme(name: string, options: SetThemeOptions = {}): void {
  const palette = themes.get(name);
  if (!palette) {
    throw new Error(`Unknown theme: "${name}". Register it with registerTheme() first.`);
  }
  activeName = name;

  const { scene, reskin = true } = options;
  if (scene && reskin) {
    scene.backgroundColor = palette.background;
    for (const mobject of scene.mobjects) {
      for (const member of mobject.getFamily()) {
        member.setColor(palette.strokeColor);
        member.setFill(palette.fillColor);
      }
    }
  }
}

/** The active theme palette together with its name. Returns a fresh copy. */
export function getTheme(): ActiveTheme {
  const palette = themes.get(activeName) ?? BUILTIN_THEMES.default;
  return { name: activeName, ...palette };
}

/**
 * The active theme palette, read by the `Mobject` constructor and `Scene`.
 * Returns a fresh copy so callers cannot mutate the registry.
 */
export function getActiveTheme(): Theme {
  const palette = themes.get(activeName) ?? BUILTIN_THEMES.default;
  return { ...palette };
}

/** The names of every registered theme. */
export function getThemeNames(): string[] {
  return [...themes.keys()];
}

/**
 * Reset the registry to only the built-in themes and select `default`.
 * Primarily for tests so one test's registrations do not leak into another.
 */
export function resetThemes(): void {
  resetBuiltins();
}
