import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerTheme,
  setTheme,
  getTheme,
  getActiveTheme,
  getThemeNames,
  resetThemes,
  type ReskinnableScene,
  type ReskinnableMobject,
} from './ThemeManager';
import { MANIM_BACKGROUND, WHITE, BLACK } from '../constants/colors';

describe('ThemeManager', () => {
  beforeEach(() => {
    resetThemes();
  });

  it('registers the built-in themes', () => {
    const names = getThemeNames();
    expect(names).toContain('default');
    expect(names).toContain('dark');
    expect(names).toContain('light');
    expect(names).toContain('3b1b');
  });

  it('defaults to the historical manim-web palette', () => {
    const theme = getActiveTheme();
    expect(theme.strokeColor).toBe(WHITE);
    expect(theme.fillColor).toBe(WHITE);
    expect(theme.background).toBe(MANIM_BACKGROUND);
    expect(getTheme().name).toBe('default');
  });

  it('setTheme switches the active defaults for new mobjects + background', () => {
    setTheme('light');
    const theme = getActiveTheme();
    expect(theme.strokeColor).toBe(BLACK);
    expect(theme.fillColor).toBe(BLACK);
    expect(theme.background).toBe(WHITE);
    expect(getTheme().name).toBe('light');
  });

  it('dark theme uses a black background and white stroke', () => {
    setTheme('dark');
    expect(getActiveTheme().background).toBe(BLACK);
    expect(getActiveTheme().strokeColor).toBe(WHITE);
  });

  it('registerTheme adds a custom theme that setTheme can select', () => {
    registerTheme('neon', { strokeColor: '#39FF14', fillColor: '#FF00FF', background: '#101010' });
    expect(getThemeNames()).toContain('neon');
    setTheme('neon');
    expect(getActiveTheme().strokeColor).toBe('#39FF14');
    expect(getActiveTheme().fillColor).toBe('#FF00FF');
    expect(getActiveTheme().background).toBe('#101010');
  });

  it('throws on an unknown theme name', () => {
    expect(() => setTheme('does-not-exist')).toThrow(/Unknown theme/);
  });

  it('getActiveTheme / getTheme return copies, not the internal palette', () => {
    const a = getActiveTheme();
    a.strokeColor = '#123456';
    expect(getActiveTheme().strokeColor).toBe(WHITE);
  });

  it('re-skins an existing scene: background + every mobject family member', () => {
    const colored: Array<{ color: string; fill: string }> = [];
    const makeMobject = (): ReskinnableMobject => {
      const record = { color: '', fill: '' };
      const mob: ReskinnableMobject = {
        setColor(c: string) {
          record.color = c;
          return mob;
        },
        setFill(c?: string) {
          record.fill = c ?? '';
          return mob;
        },
        getFamily() {
          return [mob];
        },
      };
      colored.push(record);
      return mob;
    };

    const parent = makeMobject();
    const child = makeMobject();
    // parent family includes the child
    parent.getFamily = () => [parent, child];

    const scene: ReskinnableScene = {
      backgroundColor: MANIM_BACKGROUND,
      mobjects: new Set<ReskinnableMobject>([parent]),
    };

    setTheme('light', { scene });

    expect(scene.backgroundColor).toBe(WHITE);
    for (const rec of colored) {
      expect(rec.color).toBe(BLACK);
      expect(rec.fill).toBe(BLACK);
    }
  });

  it('does not re-skin when reskin is false', () => {
    const scene: ReskinnableScene = {
      backgroundColor: MANIM_BACKGROUND,
      mobjects: new Set<ReskinnableMobject>(),
    };
    setTheme('dark', { scene, reskin: false });
    expect(scene.backgroundColor).toBe(MANIM_BACKGROUND);
    // defaults still switched
    expect(getActiveTheme().background).toBe(BLACK);
  });
});
