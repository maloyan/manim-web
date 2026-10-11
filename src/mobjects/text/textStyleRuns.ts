/**
 * Per-substring style runs for the canvas-raster Text mobject.
 *
 * Manim CE lets `Text` color or restyle sub-strings through `t2c`
 * (text-to-color), `t2w` (text-to-weight) and `t2s` (text-to-slant) maps. This
 * module turns the plain text plus those maps into a layout model: a list of
 * lines, each a list of styled runs. The model is pure and testable; the Text
 * canvas renderer draws each run with its own font and color.
 */

/** Per-substring style maps, as in Manim CE `Text`. */
export interface TextStyleMaps {
  /** Map from a substring to a CSS color. Colors every occurrence. */
  t2c?: Record<string, string>;
  /** Map from a substring to a font weight ('bold', 'normal', 100-900). */
  t2w?: Record<string, string | number>;
  /** Map from a substring to a font style ('italic', 'oblique', 'normal'). */
  t2s?: Record<string, string>;
}

/** One run of characters that share the same resolved style. */
export interface TextStyleRun {
  /** The run text (never contains a newline). */
  text: string;
  /** Resolved color, or null to use the Text base color. */
  color: string | null;
  /** Resolved font weight, or null to use the Text base weight. */
  fontWeight: string | number | null;
  /** Resolved font style, or null to use the Text base style. */
  fontStyle: string | null;
}

/** True when at least one style map has an entry. */
export function hasStyleMaps(maps: TextStyleMaps): boolean {
  return (
    Object.keys(maps.t2c ?? {}).length > 0 ||
    Object.keys(maps.t2w ?? {}).length > 0 ||
    Object.keys(maps.t2s ?? {}).length > 0
  );
}

/**
 * Mark every character index covered by a map key in `line`.
 * Later keys override earlier ones. Occurrences are non-overlapping.
 */
function applyMap<T>(arr: (T | null)[], line: string, map: Record<string, T> | undefined): void {
  if (!map) return;
  for (const [key, val] of Object.entries(map)) {
    if (!key) continue;
    let from = 0;
    for (;;) {
      const idx = line.indexOf(key, from);
      if (idx < 0) break;
      for (let i = idx; i < idx + key.length; i++) {
        arr[i] = val;
      }
      from = idx + key.length;
    }
  }
}

/** Build the styled runs of a single line (no newlines). */
function buildLineRuns(line: string, maps: TextStyleMaps): TextStyleRun[] {
  if (line.length === 0) return [];

  const colors: (string | null)[] = new Array(line.length).fill(null);
  const weights: (string | number | null)[] = new Array(line.length).fill(null);
  const styles: (string | null)[] = new Array(line.length).fill(null);
  applyMap(colors, line, maps.t2c);
  applyMap(weights, line, maps.t2w);
  applyMap(styles, line, maps.t2s);

  const same = (i: number, j: number): boolean =>
    colors[i] === colors[j] && weights[i] === weights[j] && styles[i] === styles[j];

  const runs: TextStyleRun[] = [];
  let start = 0;
  for (let i = 1; i <= line.length; i++) {
    if (i === line.length || !same(i, start)) {
      runs.push({
        text: line.slice(start, i),
        color: colors[start],
        fontWeight: weights[start],
        fontStyle: styles[start],
      });
      start = i;
    }
  }
  return runs;
}

/**
 * Split `text` into lines on '\n', then each line into styled runs.
 * An empty line yields an empty run list.
 */
export function buildStyledTextLines(text: string, maps: TextStyleMaps): TextStyleRun[][] {
  return text.split('\n').map((line) => buildLineRuns(line, maps));
}

/** Base font fields a run falls back to when it has no override. */
export interface RunFontBase {
  fontStyle: string;
  fontWeight: string | number;
  /** The scaled point size, used directly as `<n>pt` in the CSS font string. */
  sizePt: number;
  fontFamily: string;
}

/** Build the CSS canvas font string for one run, with base fallbacks. */
export function runFontString(run: TextStyleRun, base: RunFontBase): string {
  const style = run.fontStyle || base.fontStyle || 'normal';
  const weightRaw = run.fontWeight ?? base.fontWeight;
  const weight = typeof weightRaw === 'number' ? weightRaw.toString() : weightRaw || 'normal';
  return `${style} ${weight} ${base.sizePt}pt ${base.fontFamily}`;
}

// ---------------------------------------------------------------------------
// Canvas measure + render for styled text
// ---------------------------------------------------------------------------

/** Resolution multiplier for crisp text on retina displays (mirrors Text). */
const RESOLUTION_SCALE = 2;

/** Canvas pixels per point at 72 DPI (mirrors Text). */
const SVG_UNITS_PER_PT = 4 / 3;

/** Style and layout fields the styled canvas path needs from a Text instance. */
export interface StyledTextParams {
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  fontWeight: string | number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  fillOpacity: number;
  strokeWidth: number;
}

/** Shared derived layout values for a styled render. */
interface StyledLayout {
  scaledFontSize: number;
  scaledLineHeight: number;
  padding: number;
  base: RunFontBase;
}

function styledLayout(params: StyledTextParams): StyledLayout {
  const scaledFontSize = params.fontSize * RESOLUTION_SCALE;
  return {
    scaledFontSize,
    scaledLineHeight: scaledFontSize * params.lineHeight,
    padding: scaledFontSize * 0.2,
    base: {
      fontStyle: params.fontStyle === 'italic' ? 'italic' : 'normal',
      fontWeight: params.fontWeight,
      sizePt: Math.round(scaledFontSize),
      fontFamily: params.fontFamily,
    },
  };
}

/** Width of one line of runs, each measured with its own font. */
function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  runs: TextStyleRun[],
  base: RunFontBase,
): number {
  let lineWidth = 0;
  for (const run of runs) {
    ctx.font = runFontString(run, base);
    lineWidth += ctx.measureText(run.text).width;
  }
  return lineWidth;
}

/**
 * Measure styled text. Each run is measured with its own font so a bolder or
 * italic run reserves the correct width. Letter spacing is not applied in
 * styled mode so measure and render stay consistent.
 */
export function measureStyledText(
  ctx: CanvasRenderingContext2D,
  styledLines: TextStyleRun[][],
  params: StyledTextParams,
): { lines: string[]; width: number; height: number } {
  const { scaledLineHeight, padding, base } = styledLayout(params);

  let maxWidth = 0;
  for (const runs of styledLines) {
    maxWidth = Math.max(maxWidth, measureLineWidth(ctx, runs, base));
  }

  const totalHeight = styledLines.length * scaledLineHeight;
  const width = Math.ceil(maxWidth + padding * 2);
  const height = Math.ceil(totalHeight + padding * 2);
  const lines = styledLines.map((runs) => runs.map((r) => r.text).join(''));

  return { lines, width, height };
}

/**
 * Draw styled text to the canvas and return its world-space size. Each run is
 * drawn with its own font and color; x advances by the measured width of each
 * run, so mixed-weight and mixed-style runs stay correctly spaced.
 *
 * The world-size conversion matches the plain Text path exactly.
 */
export function renderStyledTextToCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  styledLines: TextStyleRun[][],
  params: StyledTextParams,
  worldPerPt: { defaultFontSizePt: number; defaultFontSizeInWorld: number },
): { width: number; height: number } {
  const { scaledLineHeight, padding, base } = styledLayout(params);
  const { width, height } = measureStyledText(ctx, styledLines, params);

  canvas.width = width || 1;
  canvas.height = height || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  for (let i = 0; i < styledLines.length; i++) {
    const runs = styledLines[i];
    const y = padding + i * scaledLineHeight;
    const lineWidth = measureLineWidth(ctx, runs, base);

    let currentX: number;
    switch (params.textAlign) {
      case 'right':
        currentX = width - padding - lineWidth;
        break;
      case 'center':
        currentX = (width - lineWidth) / 2;
        break;
      case 'left':
      default:
        currentX = padding;
        break;
    }

    for (const run of runs) {
      ctx.font = runFontString(run, base);
      const runColor = run.color || params.color;
      const runWidth = ctx.measureText(run.text).width;

      if (params.strokeWidth > 0) {
        ctx.strokeStyle = runColor;
        ctx.lineWidth = params.strokeWidth * RESOLUTION_SCALE;
        ctx.strokeText(run.text, currentX, y);
      }

      ctx.fillStyle = runColor;
      ctx.globalAlpha = params.fillOpacity;
      ctx.fillText(run.text, currentX, y);

      currentX += runWidth;
    }
  }

  const pxToWorld =
    (1 / SVG_UNITS_PER_PT) * (1 / worldPerPt.defaultFontSizePt) * worldPerPt.defaultFontSizeInWorld;
  const worldWidth = (width / RESOLUTION_SCALE) * pxToWorld;
  const worldHeight = (height / RESOLUTION_SCALE) * pxToWorld;
  return { width: worldWidth, height: worldHeight };
}
