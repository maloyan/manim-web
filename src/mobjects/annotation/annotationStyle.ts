/**
 * Shared helpers for the direction-layer annotations (CaptionCard,
 * Callout3D, InsetPanel): the host-scene surface they need, a palette that
 * derives from the scene background, text measuring and left-aligned
 * placement of canvas Text.
 */

import type { Mobject, Vector3Tuple } from '../../core/Mobject';
import { TEXT_FONT_SIZE_IN_WORLD_SPACE, DEFAULT_FONT_SIZE_PT } from '../../constants/fontRender';
import { colorToRgb, interpolateColor } from '../../utils/color';
import { getActiveTheme } from '../../utils/ThemeManager';
import type { Text } from '../text/Text';

/**
 * The scene surface an annotation uses. A ThreeDScene provides all of it;
 * a plain Scene provides only the background and the 2D frame, and
 * annotations then work in world coordinates with a static camera.
 */
export interface AnnotationScene {
  readonly backgroundColor: { getHexString(): string };
  /** HUD frame size (ThreeDScene). */
  readonly fixedInFrameSize?: { width: number; height: number };
  /** 2D camera frame (plain Scene). */
  readonly camera?: unknown;
  markFixedInFrame?(...mobjects: Mobject[]): unknown;
  projectToFrame?(point: Vector3Tuple): Vector3Tuple;
  addBeforeRenderHook?(hook: () => void): () => void;
}

/** Frame size in the units annotations are laid out in. */
export function frameSizeOf(scene: AnnotationScene | undefined): { width: number; height: number } {
  if (scene?.fixedInFrameSize) return scene.fixedInFrameSize;
  const cam = scene?.camera as { frameWidth?: number; frameHeight?: number } | undefined;
  if (cam && typeof cam.frameWidth === 'number' && typeof cam.frameHeight === 'number') {
    return { width: cam.frameWidth, height: cam.frameHeight };
  }
  return { width: 14, height: 8 };
}

/** Pin mobjects to the frame when the scene supports it (no add). */
export function pinToFrame(scene: AnnotationScene | undefined, ...mobjects: Mobject[]): void {
  scene?.markFixedInFrame?.(...mobjects);
}

/** Project a world point into annotation coordinates (identity in 2D). */
export function projectPoint(
  scene: AnnotationScene | undefined,
  point: Vector3Tuple,
): Vector3Tuple {
  if (scene?.projectToFrame) {
    const p = scene.projectToFrame(point);
    return [p[0], p[1], 0];
  }
  return [point[0], point[1], 0];
}

/** Relative luminance (WCAG) of a CSS colour. */
function luminance(color: string): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = colorToRgb(color);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two colours (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Colours of an annotation, all derived from one background colour. */
export interface AnnotationPalette {
  background: string;
  /** Primary text and stroke colour. */
  text: string;
  /** Body text: the text colour 30% of the way to the background. */
  dim: string;
  /** Footnote text: 50% of the way to the background. */
  faint: string;
  /** Panel fill: the background nudged 8% toward the text colour. */
  panel: string;
}

/**
 * Build a palette from the background. The text colour is the active
 * theme's stroke colour when it reads on the background (contrast >= 4.5),
 * else white on a dark background and near-black on a light one.
 */
export function resolvePalette(background: string, text?: string): AnnotationPalette {
  const theme = getActiveTheme();
  let fg = text;
  if (!fg) {
    fg =
      contrastRatio(theme.strokeColor, background) >= 4.5
        ? theme.strokeColor
        : luminance(background) < 0.4
          ? '#FFFFFF'
          : '#1C1C1C';
  }
  return {
    background,
    text: fg,
    dim: interpolateColor(fg, background, 0.3),
    faint: interpolateColor(fg, background, 0.5),
    panel: interpolateColor(background, fg, 0.08),
  };
}

/** Background of the scene as a CSS hex string (theme default without one). */
export function backgroundOf(scene: AnnotationScene | undefined): string {
  return scene ? `#${scene.backgroundColor.getHexString()}` : getActiveTheme().background;
}

/** World size of one em for a Text font size in points. */
export function emOf(fontSize: number): number {
  return (fontSize / DEFAULT_FONT_SIZE_PT) * TEXT_FONT_SIZE_IN_WORLD_SPACE;
}

let measureCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Width of a single line of text in world units, measured with the same
 * canvas font as Text. Returns null without a DOM (headless tests).
 */
function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string | number = 'normal',
): number | null {
  if (measureCtx === undefined) {
    measureCtx =
      typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  }
  if (!measureCtx) return null;
  // Same scale as Text: size in pt, 1 pt = 4/3 px, then px -> world.
  measureCtx.font = `normal ${fontWeight} ${fontSize}pt ${fontFamily}`;
  const px = measureCtx.measureText(text).width;
  return (px / ((fontSize * 4) / 3)) * emOf(fontSize);
}

/**
 * Greedy word wrap to `maxWidth` world units. Without a DOM, it falls back
 * to an estimate of 0.5 em per character.
 * @post result.join(' ').split(/\s+/) equals text.trim().split(/\s+/)
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: string | number = 'normal',
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const width = (s: string) =>
    measureTextWidth(s, fontSize, fontFamily, fontWeight) ?? s.length * 0.5 * emOf(fontSize);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (line && width(candidate) > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Inner padding Text adds around its glyphs (0.2 em on each side). */
function textPadding(text: Text): number {
  return 0.2 * emOf(text.getFontSize());
}

/**
 * Place a Text so its glyph box starts at `left` and its first line's top
 * sits at `top` (frame units), at depth `z`.
 */
export function placeTextTopLeft(text: Text, left: number, top: number, z = 0): void {
  const pad = textPadding(text);
  const w = text.getWidth();
  const h = text.getHeight();
  text.moveTo([left - pad + w / 2, top + pad - h / 2, z]);
}

/** Height of the glyph box of a Text (without its padding). */
export function textBoxHeight(text: Text): number {
  return Math.max(0, text.getHeight() - 2 * textPadding(text));
}

/** Width of the glyph box of a Text (without its padding). */
export function textBoxWidth(text: Text): number {
  return Math.max(0, text.getWidth() - 2 * textPadding(text));
}

/** Default font of the direction layer: the Text default (manim style). */
export const ANNOTATION_FONT = 'CMU Serif, Georgia, Times New Roman, serif';
