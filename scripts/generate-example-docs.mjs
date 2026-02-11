#!/usr/bin/env node

/**
 * generate-example-docs.mjs
 *
 * Reads all examples/*.ts files and generates a single Docusaurus-compatible
 * examples.mdx page in website/docs/ with clean source code blocks.
 *
 * Usage:
 *   node scripts/generate-example-docs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const EXAMPLES_DIR = join(ROOT, 'examples');
const DOCS_DIR = join(ROOT, 'website', 'docs');

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const CATEGORIES = {
  'Basic Concepts': ['manim_ce_logo', 'brace_annotation', 'vector_arrow', 'boolean_operations'],
  'Animations': ['point_moving_on_shapes', 'moving_around', 'moving_angle', 'moving_dots', 'moving_group_to_destination', 'moving_frame_box', 'rotation_updater', 'point_with_trace'],
  'Plotting': ['sin_cos_plot', 'arg_min', 'graph_area_plot', 'polygon_on_axes', 'heat_diagram_plot'],
  'Special Camera Settings': ['following_graph_camera', 'moving_zoomed_scene_around', 'fixed_in_frame_mobject_test', 'three_d_light_source_position', 'three_d_surface_plot', 'three_d_camera_rotation', 'three_d_camera_illusion_rotation'],
  'Advanced Projects': ['opening_manim'],
};

// Build reverse lookup: filename (no ext) -> category
const fileToCategory = {};
for (const [category, files] of Object.entries(CATEGORIES)) {
  for (const f of files) {
    fileToCategory[f] = category;
  }
}

// ---------------------------------------------------------------------------
// Example metadata: descriptions and "Learn More" links
// ---------------------------------------------------------------------------

const EXAMPLE_META = {
  manim_ce_logo: {
    description:
      'Creates the Manim Community Edition logo using a large blackboard-bold M, a circle, square, and triangle in signature colors, all composed into a VGroup.',
    learnMore: ['MathTex', 'Circle', 'Square', 'Triangle', 'VGroup'],
  },
  brace_annotation: {
    description:
      'Shows how to annotate lines with curly braces and labels. Creates a diagonal line between two dots, then adds horizontal and perpendicular braces with text and LaTeX labels.',
    learnMore: ['Brace', 'Dot', 'Line'],
  },
  vector_arrow: {
    description:
      'Displays a vector arrow on a coordinate plane with labeled origin and tip points. Demonstrates combining NumberPlane, Arrow, Dot, and Text for basic vector visualization.',
    learnMore: ['Arrow', 'NumberPlane', 'Dot', 'Text'],
  },
  boolean_operations: {
    description:
      'Demonstrates the four boolean set operations (union, intersection, difference, exclusion) applied to overlapping ellipses. Each result is scaled down and labeled with animated transitions.',
    learnMore: ['Union', 'Intersection', 'Difference', 'Exclusion', 'Ellipse', 'FadeIn', 'MoveToTarget'],
  },
  point_moving_on_shapes: {
    description:
      'Grows a circle from its center, transforms a dot to a new position, moves it along the circle path with MoveAlongPath, and rotates it around an external point with Rotating.',
    learnMore: ['Circle', 'Dot', 'GrowFromCenter', 'Transform', 'MoveAlongPath', 'Rotating'],
  },
  moving_around: {
    description:
      'Demonstrates the MoveToTarget pattern for animating a square through a sequence of transformations: shifting, changing fill color, scaling, and rotating.',
    learnMore: ['Square', 'MoveToTarget'],
  },
  moving_angle: {
    description:
      'Creates two lines forming an angle with a LaTeX theta label, then animates the angle changing using a ValueTracker. The angle arc and label update reactively via addUpdater.',
    learnMore: ['Angle', 'Line', 'MathTex', 'ValueTracker', 'FadeToColor'],
  },
  moving_dots: {
    description:
      'Creates two dots connected by a line, then animates them independently using ValueTrackers. The connecting line updates reactively via addUpdater and the become() method.',
    learnMore: ['Dot', 'Line', 'VGroup', 'ValueTracker'],
  },
  moving_group_to_destination: {
    description:
      'Arranges a group of dots in a row, then shifts the entire group so a specific dot aligns with a target position. Shows vector math with subVec for computing shift direction.',
    learnMore: ['VGroup', 'Dot', 'Shift'],
  },
  moving_frame_box: {
    description:
      'Renders a multi-part LaTeX equation (the product rule), then highlights individual terms with a SurroundingRectangle that animates between terms using ReplacementTransform.',
    learnMore: ['MathTex', 'SurroundingRectangle', 'Create', 'ReplacementTransform'],
  },
  rotation_updater: {
    description:
      'Shows a reference line alongside a rotating line driven by a time-based updater function. The updater is swapped mid-animation to reverse the rotation direction.',
    learnMore: ['Line'],
  },
  point_with_trace: {
    description:
      'Creates a dot that leaves a visible trail as it moves. Uses a VMobject with addUpdater to continuously extend the path, then rotates and shifts the dot to draw a pattern.',
    learnMore: ['VMobject', 'Dot', 'Rotating', 'Shift'],
  },
  sin_cos_plot: {
    description:
      'Plots sine and cosine functions on labeled coordinate axes with color-coded graphs. Adds a vertical reference line at x=2\u03C0 with a label. Demonstrates Axes.plot() and getGraphLabel().',
    learnMore: ['Axes', 'Line', 'VGroup'],
  },
  arg_min: {
    description:
      'Plots a quadratic function on coordinate axes and animates a dot that slides along the curve to find the minimum value. Uses a ValueTracker to drive the animation and addUpdater for reactive positioning.',
    learnMore: ['Axes', 'Dot', 'ValueTracker'],
  },
  graph_area_plot: {
    description:
      'Draws two curves on coordinate axes with vertical reference lines, a shaded area between the curves, and Riemann sum rectangles. Demonstrates the Axes area and Riemann integration visualization methods.',
    learnMore: ['Axes'],
  },
  polygon_on_axes: {
    description:
      'Draws a dynamic rectangle under a hyperbola curve on coordinate axes. Uses a ValueTracker and always_redraw pattern to animate the rectangle width while keeping it constrained to the curve.',
    learnMore: ['Axes', 'Polygon', 'ValueTracker'],
  },
  heat_diagram_plot: {
    description:
      'Creates a line graph showing temperature change over time using plotLineGraph. Demonstrates the Axes line graph plotting and axis label methods.',
    learnMore: ['Axes', 'Tex'],
  },
  following_graph_camera: {
    description:
      'Animates a camera that follows a dot moving along a sine curve. Zooms in, tracks with an updater, then restores to the original view. Demonstrates camera frame manipulation with saveState, generateTarget, and MoveToTarget.',
    learnMore: ['Axes', 'Dot', 'MoveAlongPath', 'MoveToTarget', 'Restore'],
  },
  moving_zoomed_scene_around: {
    description:
      'Demonstrates ZoomedScene with a camera frame that magnifies part of a grayscale image. Shows the zoomed display popping out, non-uniform scaling, shifting, and the reverse pop-out animation.',
    learnMore: ['ZoomedScene', 'ImageMobject', 'BackgroundRectangle', 'Create', 'FadeIn', 'Scale', 'Shift'],
  },
  opening_manim: {
    description:
      'A multi-part showcase: writes text and a LaTeX equation, transforms the title, creates a NumberPlane grid, and applies a non-linear sine warp using ApplyPointwiseFunction.',
    learnMore: ['Text', 'MathTex', 'NumberPlane', 'Write', 'Transform', 'ApplyPointwiseFunction', 'Create'],
  },
  fixed_in_frame_mobject_test: {
    description:
      'Demonstrates how to pin 2D text to the screen while the 3D camera is rotated, using addFixedInFrameMobjects. The text stays in the upper-left corner as a HUD overlay on top of ThreeDAxes.',
    learnMore: ['ThreeDScene', 'ThreeDAxes', 'Text'],
  },
  three_d_light_source_position: {
    description:
      'Shows a parametric sphere with checkerboard colors (RED_D, RED_E) on ThreeDAxes with custom point light positioning. Demonstrates Surface3D checkerboardColors and the Lighting system.',
    learnMore: ['ThreeDScene', 'ThreeDAxes', 'Surface3D', 'Lighting'],
  },
  three_d_surface_plot: {
    description:
      'Renders a 3D Gaussian surface plot on ThreeDAxes with checkerboard coloring (ORANGE, BLUE). The parametric surface maps (u,v) to a bell-shaped Gaussian peak, scaled by 2 and displayed with semi-transparent faces.',
    learnMore: ['ThreeDScene', 'ThreeDAxes', 'Surface3D'],
  },
  three_d_camera_rotation: {
    description:
      'Demonstrates ambient camera rotation around 3D axes with a circle, then animates the camera back to its original orientation. Shows beginAmbientCameraRotation, stopAmbientCameraRotation, and moveCamera methods.',
    learnMore: ['ThreeDScene', 'ThreeDAxes', 'Circle'],
  },
  three_d_camera_illusion_rotation: {
    description:
      'Demonstrates the 3D illusion camera rotation that wobbles the camera by oscillating phi sinusoidally while rotating theta continuously. Creates a convincing 3D parallax effect around ThreeDAxes with a circle.',
    learnMore: ['ThreeDScene', 'ThreeDAxes', 'Circle'],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a filename stem like "sin_cos_plot" to a title "Sin Cos Plot". */
function toTitle(stem) {
  return stem
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Code extraction: strip boilerplate from .ts example files
// ---------------------------------------------------------------------------

/**
 * Find the index of the closing brace that matches the opening brace at
 * position `openIndex` in `text`. Handles string literals (single, double,
 * backtick) and comments so braces inside them are not counted.
 * Returns -1 if no match is found.
 */
function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let i = openIndex;
  while (i < text.length) {
    const ch = text[i];

    // Skip string literals
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }

    // Skip single-line comments
    if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }

    // Skip multi-line comments
    if (ch === '/' && i + 1 < text.length && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && i + 1 < text.length && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

/**
 * Find the matching closing paren for an opening paren at `openIndex`.
 * Handles strings and comments.
 */
function findMatchingParen(text, openIndex) {
  let depth = 0;
  let i = openIndex;
  while (i < text.length) {
    const ch = text[i];

    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }

    if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }

    if (ch === '/' && i + 1 < text.length && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && i + 1 < text.length && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (ch === '(') depth++;
    if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

/**
 * De-indent a block of lines: find the minimum leading whitespace across
 * non-empty lines and remove that many characters from the start of each line.
 */
function deindent(lines) {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return lines;
  const minIndent = Math.min(...nonEmpty.map((l) => l.match(/^(\s*)/)[1].length));
  if (minIndent === 0) return lines;
  return lines.map((l) => l.slice(minIndent));
}

/**
 * Remove boilerplate lines from a set of body lines (already split).
 * These are lines that belong to the HTML harness, not the animation logic.
 */
function removeBoilerplateLines(lines) {
  return lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === '') return true; // keep blank lines

    // Animation-state boilerplate
    if (trimmed === 'if (isAnimating) return;') return false;
    if (/^isAnimating\s*=\s*(true|false);?$/.test(trimmed)) return false;
    if (/^document\.getElementById\(['"]playBtn['"]\)\.disabled\s*=/.test(trimmed)) return false;
    if (/^setAnimating\(/.test(trimmed)) return false;
    if (trimmed === 'scene.clear();') return false;

    // try/catch wrapper lines
    if (trimmed === 'try {') return false;
    if (/^\}\s*catch\s*\(/.test(trimmed)) return false;
    if (/^console\.error\(/.test(trimmed)) return false;

    // status / log boilerplate
    if (/^status\.textContent\s*=/.test(trimmed)) return false;
    if (/^log\(/.test(trimmed)) return false;

    return true;
  });
}

/**
 * Remove trailing lone closing braces that were left over from stripped
 * try/catch blocks. We walk from the end and remove lines that are just `}`.
 */
function removeTrailingBraces(lines) {
  const result = [...lines];
  while (result.length > 0 && result[result.length - 1].trim() === '}') {
    result.pop();
  }
  return result;
}

/**
 * Remove consecutive blank lines, keeping at most one blank line in a row.
 * Also trim leading/trailing blank lines from the whole block.
 */
function collapseBlankLines(lines) {
  const result = [];
  let prevBlank = false;
  for (const line of lines) {
    const blank = line.trim().length === 0;
    if (blank && prevBlank) continue;
    result.push(line);
    prevBlank = blank;
  }
  // Trim leading/trailing blanks
  while (result.length > 0 && result[0].trim() === '') result.shift();
  while (result.length > 0 && result[result.length - 1].trim() === '') result.pop();
  return result;
}

/**
 * Clean a body extracted from inside a function or handler:
 * de-indent, remove boilerplate lines, de-indent again (in case boilerplate
 * lines were at a lower indent level than the real content), remove trailing
 * braces, collapse blanks.
 */
function cleanBody(bodyStr) {
  let lines = bodyStr.split('\n');
  lines = deindent(lines);
  lines = removeBoilerplateLines(lines);
  // Strip trailing blank lines so removeTrailingBraces can see the `}`
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  lines = removeTrailingBraces(lines);
  lines = deindent(lines);           // second pass after boilerplate/brace removal
  lines = collapseBlankLines(lines);
  return lines.join('\n');
}

/**
 * Remove a region from `start` to `end` in `code`, also consuming
 * whitespace/newlines immediately before `start`.
 */
function removeRegion(code, start, end) {
  let cutStart = start;
  while (cutStart > 0 && (code[cutStart - 1] === '\n' || code[cutStart - 1] === ' ')) cutStart--;
  // Keep at most one newline after end
  let cutEnd = end;
  while (cutEnd < code.length && code[cutEnd] === '\n') cutEnd++;
  return code.slice(0, cutStart) + '\n' + code.slice(cutEnd);
}

/**
 * Extract clean animation code from a .ts example file, stripping all HTML
 * harness boilerplate. The result is suitable for documentation display.
 */
function extractCleanCode(tsContent) {
  let code = tsContent;

  // 1. Replace import path '../src/index.ts' -> 'manim-js'
  code = code.replace(/from\s+['"]\.\.\/src\/index\.ts['"]/g, "from 'manim-js'");

  // 2. Remove "// Converted from Python..." comment lines at top
  code = code.replace(/^\/\/\s*Converted from Python[^\n]*\n/gm, '');
  code = code.replace(/^\/\/\s*Review and adjust[^\n]*\n/gm, '');
  code = code.replace(/^\/\/\s*Original:[^\n]*\n/gm, '');

  // 3. Remove embed mode block: from "// Embed mode:" to end of file
  const embedIdx = code.indexOf('// Embed mode:');
  if (embedIdx !== -1) {
    let cutStart = embedIdx;
    while (cutStart > 0 && code[cutStart - 1] === '\n') cutStart--;
    code = code.slice(0, cutStart);
  }

  // 4. Remove boilerplate variable declarations
  code = code.replace(/^const container = document\.getElementById\(['"]container['"]\);?\s*\n/gm, '');
  code = code.replace(/^const status = document\.getElementById\(['"]status['"]\);?\s*\n/gm, '');
  code = code.replace(/^let isAnimating = false;?\s*\n/gm, '');
  code = code.replace(/^const buttons = document\.querySelectorAll\(['"]button['"]\);?\s*\n/gm, '');

  // 5. Remove `function setAnimating(state) { ... }` helper
  const setAnimMatch = code.match(/function setAnimating\s*\([^)]*\)\s*\{/);
  if (setAnimMatch) {
    const braceIdx = code.indexOf('{', setAnimMatch.index);
    const endIdx = findMatchingBrace(code, braceIdx);
    if (endIdx !== -1) {
      code = removeRegion(code, setAnimMatch.index, endIdx + 1);
    }
  }

  // 6. Remove `function log(msg) { ... }` helper
  const logMatch = code.match(/function log\s*\([^)]*\)\s*\{/);
  if (logMatch) {
    const braceIdx = code.indexOf('{', logMatch.index);
    const endIdx = findMatchingBrace(code, braceIdx);
    if (endIdx !== -1) {
      code = removeRegion(code, logMatch.index, endIdx + 1);
    }
  }

  // 7. Remove resetBtn event listener block
  const resetMatch = code.match(/document\.getElementById\(['"]resetBtn['"]\)\.addEventListener\(/);
  if (resetMatch) {
    const parenIdx = code.indexOf('(', resetMatch.index + 'document.getElementById'.length);
    // Find the opening paren of addEventListener(
    const addEventParenIdx = code.indexOf('(', code.indexOf('.addEventListener', resetMatch.index));
    const endParenIdx = findMatchingParen(code, addEventParenIdx);
    if (endParenIdx !== -1) {
      let afterEnd = endParenIdx + 1;
      if (afterEnd < code.length && code[afterEnd] === ';') afterEnd++;
      code = removeRegion(code, resetMatch.index, afterEnd);
    }
  }

  // 8. Remove `// Auto-play on load` + next line
  code = code.replace(/\/\/\s*Auto-play on load\s*\n[^\n]*\n?/g, '');
  // Remove `// Run first demo on load` + next line
  code = code.replace(/\/\/\s*Run first demo on load\s*\n[^\n]*\n?/g, '');

  // 9. Remove `run().catch(...)` blocks
  const runCatchMatch = code.match(/run\(\)\s*\.catch\s*\(/);
  if (runCatchMatch) {
    const catchParenIdx = code.indexOf('(', code.indexOf('.catch', runCatchMatch.index));
    const endParenIdx = findMatchingParen(code, catchParenIdx);
    if (endParenIdx !== -1) {
      let afterEnd = endParenIdx + 1;
      if (afterEnd < code.length && code[afterEnd] === ';') afterEnd++;
      code = removeRegion(code, runCatchMatch.index, afterEnd);
    }
  }

  // 10. Inline container in Scene constructor (handles Scene and subclasses like ZoomedScene)
  code = code.replace(
    /new (\w*Scene)\(\s*container\s*,/g,
    "new $1(document.getElementById('container'),"
  );

  // 11. Collect named async functions that take `scene` param
  //     Store their cleaned bodies and remove them from code.
  //     Also matches `export async function ...`
  const namedFunctions = {}; // name -> cleaned body
  let namedFuncRe = /(?:export\s+)?async\s+function\s+(\w+)\s*\(\s*scene\s*(?::\s*\w+)?\s*\)\s*\{/g;
  let match;
  // Collect all matches first, then process from end to start to preserve indices
  const namedMatches = [];
  while ((match = namedFuncRe.exec(code)) !== null) {
    namedMatches.push({ name: match[1], index: match.index, matchLength: match[0].length });
  }
  // Process from end to start
  for (let i = namedMatches.length - 1; i >= 0; i--) {
    const m = namedMatches[i];
    const braceIdx = code.indexOf('{', m.index + m.matchLength - 1);
    const closeIdx = findMatchingBrace(code, braceIdx);
    if (closeIdx !== -1) {
      const body = code.slice(braceIdx + 1, closeIdx);
      namedFunctions[m.name] = cleanBody(body);
      code = removeRegion(code, m.index, closeIdx + 1);
    }
  }

  // 12. Remove `async function run() { ... }` wrapper (test_write pattern)
  const runFuncMatch = code.match(/async\s+function\s+run\s*\(\s*\)\s*\{/);
  if (runFuncMatch) {
    const braceIdx = code.indexOf('{', runFuncMatch.index);
    const closeIdx = findMatchingBrace(code, braceIdx);
    if (closeIdx !== -1) {
      const body = code.slice(braceIdx + 1, closeIdx);
      const cleanedBody = cleanBody(body);
      code = code.slice(0, runFuncMatch.index) + cleanedBody + code.slice(closeIdx + 1);
    }
  }

  // 13. Process event handler blocks
  //     For each `document.getElementById('...').addEventListener('click', async () => { ... });`
  //     - If the body just calls a named function, replace entire handler with the function body
  //     - Otherwise, extract and clean the handler body
  //     Preserve "// Demo N: ..." comments before handlers

  let handlerRe = /document\.getElementById\(['"](\w+)['"]\)\.addEventListener\(\s*['"]click['"]\s*,\s*async\s*\(\s*\)\s*=>\s*\{/g;
  // Collect all handler matches
  const handlerMatches = [];
  while ((match = handlerRe.exec(code)) !== null) {
    handlerMatches.push({ id: match[1], index: match.index, matchEnd: match.index + match[0].length });
  }

  // Process from end to start
  for (let i = handlerMatches.length - 1; i >= 0; i--) {
    const h = handlerMatches[i];
    const braceIdx = code.lastIndexOf('{', h.matchEnd);
    const closeIdx = findMatchingBrace(code, braceIdx);
    if (closeIdx === -1) continue;

    const body = code.slice(braceIdx + 1, closeIdx);

    // Find the end of the addEventListener call: after `});`
    // The closing brace is at closeIdx, then we expect `});`
    let afterClose = closeIdx + 1;
    // Skip whitespace
    while (afterClose < code.length && /\s/.test(code[afterClose])) afterClose++;
    // Should see `)` then possibly `;`
    if (afterClose < code.length && code[afterClose] === ')') afterClose++;
    if (afterClose < code.length && code[afterClose] === ';') afterClose++;

    // Check for "// Demo N: ..." comment right before the handler
    let handlerStart = h.index;
    // Look backward for a comment line
    const beforeHandler = code.slice(0, handlerStart);
    const demoCommentMatch = beforeHandler.match(/(\/\/\s*Demo\s+\d+[^\n]*)\n\s*$/);
    let demoComment = '';
    if (demoCommentMatch) {
      demoComment = demoCommentMatch[1];
      handlerStart = demoCommentMatch.index;
    }

    // Check if handler body just calls a named function
    const bodyStripped = body.trim()
      .replace(/^if\s*\(isAnimating\)\s*return;?\s*/m, '')
      .replace(/^setAnimating\(true\);?\s*/m, '')
      .replace(/^isAnimating\s*=\s*true;?\s*/gm, '')
      .replace(/^document\.getElementById\(['"]playBtn['"]\)\.disabled\s*=[^;]*;?\s*/gm, '')
      .replace(/^scene\.clear\(\);?\s*/m, '')
      .replace(/setAnimating\(false\);?\s*/gm, '')
      .replace(/isAnimating\s*=\s*false;?\s*/gm, '')
      .replace(/document\.getElementById\(['"]playBtn['"]\)\.disabled\s*=[^;]*;?\s*/gm, '')
      .trim();

    const funcCallMatch = bodyStripped.match(/^(?:await\s+)?(\w+)\s*\(\s*scene\s*(?::\s*\w+)?\s*\)\s*;?\s*$/);

    if (funcCallMatch && namedFunctions[funcCallMatch[1]]) {
      // Body just calls a named function whose body we already have -> remove handler entirely
      code = removeRegion(code, handlerStart, afterClose);
    } else {
      // Extract and clean the handler body, keep demo comment
      const cleaned = cleanBody(body);
      let replacement = '';
      if (demoComment) {
        replacement = demoComment + '\n' + cleaned;
      } else {
        replacement = cleaned;
      }
      code = code.slice(0, handlerStart) + replacement + code.slice(afterClose);
    }
  }

  // 14. Remove any remaining bare function calls like `await funcName(scene);` or `funcName(scene);`
  //     that reference named functions we already extracted
  for (const name of Object.keys(namedFunctions)) {
    const callRe = new RegExp(`^\\s*(?:await\\s+)?${name}\\s*\\(\\s*scene\\s*(?::\\s*\\w+)?\\s*\\)\\s*;?\\s*$`, 'gm');
    code = code.replace(callRe, '');
  }

  // 15. Now insert named function bodies where we removed them
  //     They were already removed from the code. If the handler that called them
  //     was also removed (and the bare call too), we need to re-insert the body.
  //     Strategy: for each named function, check if any reference still exists.
  //     If not, insert the body after the Scene creation block.
  for (const [name, body] of Object.entries(namedFunctions)) {
    const refPattern = new RegExp(`\\b${name}\\b`);
    if (!refPattern.test(code)) {
      // Find the end of the Scene creation block (constructor may be multi-line)
      const sceneStart = code.match(/const scene = new \w*Scene\(/);
      if (sceneStart) {
        const parenIdx = code.indexOf('(', sceneStart.index);
        const closeParenIdx = findMatchingParen(code, parenIdx);
        if (closeParenIdx !== -1) {
          let insertIdx = closeParenIdx + 1;
          if (insertIdx < code.length && code[insertIdx] === ';') insertIdx++;
          code = code.slice(0, insertIdx) + '\n\n' + body + '\n' + code.slice(insertIdx);
        }
      } else {
        // Append at end
        code = code + '\n\n' + body;
      }
    }
  }

  // 16. Final cleanup
  let finalLines = code.split('\n');

  // Remove any remaining status/log lines
  finalLines = finalLines.filter((line) => {
    const trimmed = line.trim();
    if (/^status\.textContent\s*=/.test(trimmed)) return false;
    if (/^log\(/.test(trimmed)) return false;
    return true;
  });

  finalLines = collapseBlankLines(finalLines);

  return finalLines.join('\n');
}

// ---------------------------------------------------------------------------
// Component generation: split clean code into imports, constants, and body
// ---------------------------------------------------------------------------

const COMPONENTS_DIR = join(ROOT, 'website', 'src', 'components', 'examples');

/** Convert a filename stem like "sin_cos_plot" to PascalCase "SinCosPlot". */
function toPascalCase(stem) {
  return stem
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Parse clean code into parts for component generation:
 * - imports: the full import block (may span multiple lines)
 * - constants: non-import, non-scene top-level declarations before animation body
 * - body: the animation logic (everything after scene creation)
 */
function parseCleanCode(cleanCode) {
  const lines = cleanCode.split('\n');
  const importLines = [];
  const constantLines = [];
  const bodyLines = [];
  const sceneCreationLines = [];

  let phase = 'imports'; // imports -> constants -> body
  let inImportBlock = false; // tracking multi-line import { ... } from '...'
  let inSceneCreation = false;
  let parenDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle multi-line import blocks
    if (inImportBlock) {
      importLines.push(line);
      if (trimmed.includes("from '") || trimmed.includes('from "')) {
        inImportBlock = false;
      }
      continue;
    }

    if (phase === 'imports') {
      if (trimmed === '') {
        if (importLines.length > 0 && !inImportBlock) {
          // Blank line after imports - move to constants phase
          phase = 'constants';
        }
        continue;
      }
      if (trimmed.startsWith('import ')) {
        importLines.push(line);
        // Check if this is a multi-line import (has { but no closing })
        if (trimmed.includes('{') && !trimmed.includes('}')) {
          inImportBlock = true;
        }
        continue;
      }
      // Not an import line - move to constants phase
      phase = 'constants';
    }

    // Handle scene creation line(s) - can be multi-line
    if (!inSceneCreation && /^const scene = new \w*Scene\(/.test(trimmed)) {
      inSceneCreation = true;
      parenDepth = 0;
      sceneCreationLines.push(line);
      // Count parens to handle multi-line
      for (const ch of line) {
        if (ch === '(') parenDepth++;
        if (ch === ')') parenDepth--;
      }
      if (parenDepth <= 0) {
        inSceneCreation = false;
        parenDepth = 0;
        phase = 'body';
      }
      continue;
    }

    if (inSceneCreation) {
      sceneCreationLines.push(line);
      for (const ch of line) {
        if (ch === '(') parenDepth++;
        if (ch === ')') parenDepth--;
      }
      if (parenDepth <= 0) {
        inSceneCreation = false;
        parenDepth = 0;
        phase = 'body';
      }
      continue;
    }

    if (phase === 'constants') {
      // Lines before scene creation that are not imports are constants
      // e.g., `const TAU = Math.PI * 2;`, `const FONT_URL = '...'`
      // But once we hit `await`, `scene.`, or an animation call, we're in body
      if (trimmed.startsWith('await ') || trimmed.startsWith('scene.') ||
          /^(const|let)\s+\w+\s*=\s*new\s+(Axes|Circle|Square|Dot|Line|Text|MathTex|Tex|VGroup|Group|NumberPlane|Ellipse|MarkupText)\b/.test(trimmed) ||
          /^(const|let)\s+\w+\s*=\s*\w+\.(plot|copy|getAxis)/.test(trimmed) ||
          /^\/\/\s*(Demo|Part)\s+\d+/.test(trimmed)) {
        phase = 'body';
        bodyLines.push(line);
      } else {
        constantLines.push(line);
      }
      continue;
    }

    // phase === 'body'
    bodyLines.push(line);
  }

  // Clean up: remove leading/trailing blank lines from each section
  const cleanSection = (arr) => {
    while (arr.length > 0 && arr[0].trim() === '') arr.shift();
    while (arr.length > 0 && arr[arr.length - 1].trim() === '') arr.pop();
    return arr;
  };

  cleanSection(importLines);
  cleanSection(constantLines);
  cleanSection(bodyLines);
  cleanSection(sceneCreationLines);

  return {
    imports: importLines.join('\n'),
    constants: constantLines.join('\n'),
    body: bodyLines.join('\n'),
    sceneCreation: sceneCreationLines.join('\n'),
  };
}

/**
 * Extract all manim-js import specifiers from the import lines string.
 * Returns array of specifier names.
 */
function extractImportSpecifiers(importStr) {
  const specifiers = [];
  // Match everything inside { ... } from 'manim-js' imports
  const re = /import\s*\{([^}]+)\}\s*from\s*['"]manim-js['"]/g;
  let m;
  while ((m = re.exec(importStr)) !== null) {
    const inner = m[1];
    for (const spec of inner.split(',')) {
      const name = spec.trim();
      if (name) specifiers.push(name);
    }
  }
  return specifiers;
}

/**
 * Wrap demo sections in block scopes to avoid duplicate `const` declarations.
 * Detects `// Demo N: ...` comment patterns and wraps each section in `{ }`.
 * Also adds `scene.clear();` between demo sections.
 */
function wrapDemoSectionsInBlockScopes(bodyStr) {
  const lines = bodyStr.split('\n');
  const demoStarts = [];

  // Find all demo comment lines
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\/\/\s*Demo\s+\d+/.test(lines[i])) {
      demoStarts.push(i);
    }
  }

  // If fewer than 2 demo sections, no wrapping needed
  if (demoStarts.length < 2) return bodyStr;

  const result = [];
  for (let d = 0; d < demoStarts.length; d++) {
    const start = demoStarts[d];
    const end = d + 1 < demoStarts.length ? demoStarts[d + 1] : lines.length;

    // Add scene.clear() before each demo except the first
    if (d > 0) {
      result.push('scene.clear();');
    }

    // Open block scope
    result.push('{');

    // Add demo lines (indented)
    for (let i = start; i < end; i++) {
      const line = lines[i];
      // Remove trailing blank lines at the end of each section
      if (i === end - 1 && line.trim() === '') continue;
      result.push('  ' + line);
    }

    // Close block scope
    result.push('}');
    result.push('');
  }

  return result.join('\n');
}

/**
 * Generate a React component file for an example.
 * The component dynamically imports manim-js and renders a ManimExample.
 */
function generateComponentFile(stem, cleanCode) {
  const componentName = toPascalCase(stem) + 'Example';
  const parsed = parseCleanCode(cleanCode);

  // Check if body has multiple demo sections that need block scoping
  let body = parsed.body;
  if (/\/\/\s*Demo\s+\d+/.test(body)) {
    body = wrapDemoSectionsInBlockScopes(body);
  }

  // Detect custom scene type (e.g. ZoomedScene) from the scene creation line
  const sceneClassMatch = parsed.sceneCreation.match(/new (\w+Scene)\(/);
  const sceneClassName = sceneClassMatch ? sceneClassMatch[1] : 'Scene';
  const isCustomScene = sceneClassName !== 'Scene';

  // Extract scene options from creation block (everything between first { and last })
  let sceneOptions = '';
  if (isCustomScene && parsed.sceneCreation) {
    const braceStart = parsed.sceneCreation.indexOf('{');
    if (braceStart !== -1) {
      const braceEnd = parsed.sceneCreation.lastIndexOf('}');
      if (braceEnd !== -1) {
        sceneOptions = parsed.sceneCreation.slice(braceStart, braceEnd + 1);
      }
    }
  }

  // Build the component file
  const lines = [
    '// Auto-generated by generate-example-docs.mjs - do not edit',
    "import React from 'react';",
    "import ManimExample from '../ManimExample';",
    '',
  ];

  // The animate function will use dynamic imports to avoid SSR issues
  lines.push(`async function animate(scene: any) {`);

  // Dynamically import manim-js at the start of the animation function
  const specifiers = extractImportSpecifiers(parsed.imports);
  // For the createScene factory, the scene class import is handled there, not in animate
  const animateSpecifiers = isCustomScene
    ? specifiers.filter(s => s !== sceneClassName)
    : specifiers;
  if (animateSpecifiers.length > 0) {
    lines.push(`  const { ${animateSpecifiers.join(', ')} } = await import('manim-js');`);
  }

  // Handle namespace imports from non-manim-js packages (e.g. `import * as THREE from 'three'`)
  // Convert to destructured dynamic imports and replace namespace references in body/constants
  const nsImportRe = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let nsMatch;
  while ((nsMatch = nsImportRe.exec(parsed.imports)) !== null) {
    const nsName = nsMatch[1];
    const pkg = nsMatch[2];
    // Find all NS.X usages in body and constants
    const usageRe = new RegExp(`\\b${nsName}\\.(\\w+)\\b`, 'g');
    const usedExports = new Set();
    let usageMatch;
    const allCode = (parsed.constants || '') + '\n' + (body || '');
    while ((usageMatch = usageRe.exec(allCode)) !== null) {
      usedExports.add(usageMatch[1]);
    }
    if (usedExports.size > 0) {
      const sorted = [...usedExports].sort();
      lines.push(`  const {`);
      lines.push(`    ${sorted.join(',\n    ')},`);
      lines.push(`  } = await import('${pkg}');`);
      // Replace NS.X -> X in body and constants
      const replaceRe = new RegExp(`\\b${nsName}\\.(\\w+)\\b`, 'g');
      body = body.replace(replaceRe, '$1');
      if (parsed.constants) {
        parsed.constants = parsed.constants.replace(replaceRe, '$1');
      }
    }
  }

  // Add constants (indented)
  if (parsed.constants) {
    lines.push('');
    for (const line of parsed.constants.split('\n')) {
      lines.push(line ? `  ${line}` : '');
    }
  }

  // Add body (indented)
  if (body) {
    lines.push('');
    for (const line of body.split('\n')) {
      lines.push(line ? `  ${line}` : '');
    }
  }

  lines.push('}');
  lines.push('');

  // Generate createScene factory for custom scene types.
  // Uses the `manim` module passed by ManimExample (which already imports manim-js)
  // to avoid webpack splitting into separate chunks with different class instances.
  if (isCustomScene) {
    lines.push(`function createScene(container: HTMLElement, manim: any) {`);
    // Replace direct references to imported specifiers with manim.X
    let opts = sceneOptions;
    const optionSpecifiers = specifiers.filter(s => opts.includes(s));
    for (const spec of optionSpecifiers) {
      opts = opts.replace(new RegExp(`\\b${spec}\\b`, 'g'), `manim.${spec}`);
    }
    lines.push(`  return new manim.${sceneClassName}(container, ${opts});`);
    lines.push('}');
    lines.push('');
  }

  lines.push(`export default function ${componentName}() {`);
  if (isCustomScene) {
    lines.push('  return <ManimExample animationFn={animate} createScene={createScene} />;');
  } else {
    lines.push('  return <ManimExample animationFn={animate} />;');
  }
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  mkdirSync(DOCS_DIR, { recursive: true });
  mkdirSync(COMPONENTS_DIR, { recursive: true });

  const tsFiles = readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith('.ts'))
    .sort();

  const examples = [];

  for (const file of tsFiles) {
    const stem = basename(file, '.ts');
    const htmlFile = `${stem}.html`;

    // Only include examples that have a matching HTML file
    if (!existsSync(join(EXAMPLES_DIR, htmlFile))) {
      console.warn(`  Skipping ${file}: no matching ${htmlFile}`);
      continue;
    }

    // Only include examples that are in a defined category
    if (!fileToCategory[stem]) {
      continue;
    }

    const title = toTitle(stem);
    const tsContent = readFileSync(join(EXAMPLES_DIR, file), 'utf-8');
    const meta = EXAMPLE_META[stem] || {};
    const description = meta.description || `Example demonstrating ${title}.`;
    const learnMore = meta.learnMore || [];
    const category = fileToCategory[stem] || 'Other';

    // Extract clean code for documentation
    const codeBlock = extractCleanCode(tsContent);

    // Generate component file
    const componentName = toPascalCase(stem) + 'Example';
    const componentCode = generateComponentFile(stem, codeBlock);
    const componentPath = join(COMPONENTS_DIR, `${componentName}.tsx`);
    writeFileSync(componentPath, componentCode, 'utf-8');
    console.log(`  Generated component: ${componentName}.tsx`);

    examples.push({ stem, htmlFile, title, category, description, learnMore, codeBlock, componentName });
  }

  // -------------------------------------------------------------------------
  // Generate single examples.mdx page with inline components
  // -------------------------------------------------------------------------

  const lines = [
    '---',
    'title: Examples',
    'sidebar_label: Examples',
    '---',
    '',
  ];

  // Add all component imports at the top
  for (const ex of examples) {
    lines.push(`import ${ex.componentName} from '@site/src/components/examples/${ex.componentName}';`);
  }

  lines.push('');
  lines.push('# Examples');
  lines.push('');
  lines.push('Interactive examples showing what you can build with manim-js. Each example includes a live animation and source code.');
  lines.push('');

  // Group examples by category, preserving CATEGORIES definition order
  const exampleByStem = {};
  for (const ex of examples) exampleByStem[ex.stem] = ex;
  const grouped = {};
  for (const [cat, stems] of Object.entries(CATEGORIES)) {
    grouped[cat] = stems.filter(s => exampleByStem[s]).map(s => exampleByStem[s]);
  }

  let isFirst = true;
  for (const [category, entries] of Object.entries(grouped)) {
    if (entries.length === 0) continue;

    for (const ex of entries) {
      if (!isFirst) {
        lines.push('---');
        lines.push('');
      }
      isFirst = false;

      lines.push(`## ${ex.title}`);
      lines.push('');
      lines.push(ex.description);
      lines.push('');
      lines.push(`<${ex.componentName} />`);
      lines.push('');
      lines.push('<details>');
      lines.push('<summary>Source Code</summary>');
      lines.push('');
      lines.push('```typescript');
      lines.push(ex.codeBlock);
      lines.push('```');
      lines.push('');
      lines.push('</details>');
      lines.push('');

      if (ex.learnMore.length > 0) {
        const learnMoreInline = ex.learnMore.map((name) => `**${name}**`).join(' \u00B7 ');
        lines.push(`**Learn More:** ${learnMoreInline}`);
        lines.push('');
      }
    }
  }

  const outPath = join(DOCS_DIR, 'examples.mdx');
  writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`  Generated: website/docs/examples.mdx`);

  console.log(`\nDone! Generated ${examples.length} example components and examples page.`);
}

main();
