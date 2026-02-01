#!/usr/bin/env node

/**
 * generate-example-docs.mjs
 *
 * Reads all examples/*.html files, extracts the scene function code (not boilerplate),
 * and generates Docusaurus-compatible markdown documentation pages in website/docs/examples/.
 *
 * Usage:
 *   node scripts/generate-example-docs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const EXAMPLES_DIR = join(ROOT, 'examples');
const DOCS_OUT_DIR = join(ROOT, 'website', 'docs', 'examples');

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const CATEGORIES = {
  'Graphing and Plotting': ['arg_min', 'graph_area_plot', 'sin_cos_plot'],
  'Geometry and Shapes': ['boolean_operations', 'moving_angle', 'point_moving_on_shapes'],
  'Text and Equations': ['displaying_equations', 'displaying_text', 'moving_frame_box', 'test_write'],
  'Movement and Animation': ['moving_around', 'moving_dots', 'moving_group_to_destination', 'point_with_trace', 'rotation_updater'],
  'Showcase': ['opening_manim', 'manim_examples'],
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
  arg_min: {
    description:
      'Plots a quadratic function on coordinate axes and animates a dot that slides along the curve to find the minimum value. Uses a ValueTracker to drive the animation and addUpdater for reactive positioning.',
    learnMore: ['Axes', 'Dot', 'ValueTracker'],
  },
  boolean_operations: {
    description:
      'Demonstrates the four boolean set operations (union, intersection, difference, exclusion) applied to overlapping ellipses. Each result is scaled down and labeled with animated transitions.',
    learnMore: ['Union', 'Intersection', 'Difference', 'Exclusion', 'Ellipse', 'FadeIn', 'MoveToTarget'],
  },
  displaying_equations: {
    description:
      'Renders two lines of text with the Write animation, then transforms them into a LaTeX equation using ReplacementTransform. Shows how to combine Text and MathTex for mathematical content.',
    learnMore: ['MathTex', 'Text', 'Write', 'ReplacementTransform', 'FadeOut'],
  },
  displaying_text: {
    description:
      'Animates text creation using the Write animation, then cross-fades between multiple text objects using AnimationGroup with simultaneous FadeIn and FadeOut transitions.',
    learnMore: ['Text', 'Write', 'FadeIn', 'FadeOut', 'AnimationGroup'],
  },
  graph_area_plot: {
    description:
      'Draws two curves on coordinate axes with vertical reference lines, a shaded area between the curves, and Riemann sum rectangles. Demonstrates the Axes area and Riemann integration visualization methods.',
    learnMore: ['Axes'],
  },
  manim_examples: {
    description:
      'A collection of five classic Manim scenes: square-to-circle transform, shape modification, text animation, LaTeX equations, and function graph plotting with Transform animations.',
    learnMore: ['Scene', 'Circle', 'Square', 'Text', 'MathTex', 'Axes', 'FunctionGraph', 'Create', 'Transform'],
  },
  moving_angle: {
    description:
      'Creates two lines forming an angle with a LaTeX theta label, then animates the angle changing using a ValueTracker. The angle arc and label update reactively via addUpdater.',
    learnMore: ['Angle', 'Line', 'MathTex', 'ValueTracker', 'FadeToColor'],
  },
  moving_around: {
    description:
      'Demonstrates the MoveToTarget pattern for animating a square through a sequence of transformations: shifting, changing fill color, scaling, and rotating.',
    learnMore: ['Square', 'MoveToTarget'],
  },
  moving_dots: {
    description:
      'Creates two dots connected by a line, then animates them independently using ValueTrackers. The connecting line updates reactively via addUpdater and the become() method.',
    learnMore: ['Dot', 'Line', 'VGroup', 'ValueTracker'],
  },
  moving_frame_box: {
    description:
      'Renders a multi-part LaTeX equation (the product rule), then highlights individual terms with a SurroundingRectangle that animates between terms using ReplacementTransform.',
    learnMore: ['MathTex', 'SurroundingRectangle', 'Create', 'ReplacementTransform'],
  },
  moving_group_to_destination: {
    description:
      'Arranges a group of dots in a row, then shifts the entire group so a specific dot aligns with a target position. Shows vector math with subVec for computing shift direction.',
    learnMore: ['VGroup', 'Dot', 'Shift'],
  },
  opening_manim: {
    description:
      'A multi-part showcase: writes text and a LaTeX equation, transforms the title, creates a NumberPlane grid, and applies a non-linear sine warp using ApplyPointwiseFunction.',
    learnMore: ['Text', 'MathTex', 'NumberPlane', 'Write', 'Transform', 'ApplyPointwiseFunction', 'Create'],
  },
  point_moving_on_shapes: {
    description:
      'Grows a circle from its center, transforms a dot to a new position, moves it along the circle path with MoveAlongPath, and rotates it around an external point with Rotating.',
    learnMore: ['Circle', 'Dot', 'GrowFromCenter', 'Transform', 'MoveAlongPath', 'Rotating'],
  },
  point_with_trace: {
    description:
      'Creates a dot that leaves a visible trail as it moves. Uses a VMobject with addUpdater to continuously extend the path, then rotates and shifts the dot to draw a pattern.',
    learnMore: ['VMobject', 'Dot', 'Rotating', 'Shift'],
  },
  rotation_updater: {
    description:
      'Shows a reference line alongside a rotating line driven by a time-based updater function. The updater is swapped mid-animation to reverse the rotation direction.',
    learnMore: ['Line'],
  },
  sin_cos_plot: {
    description:
      'Plots sine and cosine functions on labeled coordinate axes with color-coded graphs. Adds a vertical reference line at x=2\u03C0 with a label. Demonstrates Axes.plot() and getGraphLabel().',
    learnMore: ['Axes', 'Line', 'VGroup'],
  },
  test_write: {
    description:
      'A minimal test of the Write animation: loads a custom font, renders a text object, and plays a slow 5-second Write animation to draw each letter stroke by stroke.',
    learnMore: ['Text', 'Write', 'Create', 'Circle'],
  },
};

// Index page descriptions (shorter, for the table)
const INDEX_DESCRIPTIONS = {
  arg_min: 'Animate a dot finding the minimum of a quadratic curve',
  boolean_operations: 'Union, intersection, difference, and exclusion on ellipses',
  displaying_equations: 'Write text and transform it into a LaTeX equation',
  displaying_text: 'Create and cross-fade between animated text objects',
  graph_area_plot: 'Shaded areas and Riemann sum rectangles between curves',
  manim_examples: 'Five classic Manim demos in one scene',
  moving_angle: 'Animate a changing angle with a reactive theta label',
  moving_around: 'Shift, recolor, scale, and rotate a square with MoveToTarget',
  moving_dots: 'Two dots connected by a line, driven by ValueTrackers',
  moving_frame_box: 'Highlight terms in a LaTeX equation with a moving box',
  moving_group_to_destination: 'Shift a dot group so one dot aligns with a target',
  opening_manim: 'Multi-part showcase with text, equations, grid, and warp',
  point_moving_on_shapes: 'Move a dot along a circle path and rotate it',
  point_with_trace: 'A dot that leaves a visible trail as it moves',
  rotation_updater: 'A line that rotates via time-based updater functions',
  sin_cos_plot: 'Sine and cosine plots on labeled coordinate axes',
  test_write: 'Minimal Write animation test on a text object',
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

/** Extract the content between <script type="module"> and </script>. */
function extractScript(html) {
  const startTag = '<script type="module">';
  const endTag = '</script>';
  const startIdx = html.indexOf(startTag);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startTag.length;
  const endIdx = html.indexOf(endTag, contentStart);
  if (endIdx === -1) return null;
  return html.slice(contentStart, endIdx);
}

/** Extract imported names from the code. */
function extractImports(code) {
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"](?:\.\.\/src\/index\.ts|manim-js)['"]/gs;
  const imports = new Set();
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const names = match[1].split(',').map((s) => s.trim()).filter(Boolean);
    for (const name of names) imports.add(name);
  }
  return [...imports].sort();
}

/** Build a clean import statement from imported names. */
function buildImportStatement(imports) {
  if (imports.length <= 4) {
    return `import { ${imports.join(', ')} } from 'manim-js';`;
  }
  const lines = imports.map((name, i) => {
    const comma = i < imports.length - 1 ? ',' : '';
    return `  ${name}${comma}`;
  });
  return `import {\n${lines.join('\n')}\n} from 'manim-js';`;
}

/** Dedent code block: remove common leading whitespace. */
function dedent(code) {
  const lines = code.split('\n');
  // Trim leading/trailing empty lines
  let first = 0;
  while (first < lines.length && lines[first].trim() === '') first++;
  let last = lines.length - 1;
  while (last >= 0 && lines[last].trim() === '') last--;
  const trimmed = lines.slice(first, last + 1);

  let minIndent = Infinity;
  for (const line of trimmed) {
    if (line.trim() === '') continue;
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent === Infinity) minIndent = 0;

  return trimmed.map((line) => (line.trim() === '' ? '' : line.slice(minIndent))).join('\n');
}

/**
 * Extract the scene function code from the script content.
 *
 * Strategy:
 *  1. Look for a named async function like `async function name(scene) { ... }`
 *  2. If not found, look for inline scene code inside the click handler
 *     (between `scene.clear();` and `} catch` or `isAnimating = false`)
 *  3. For special cases (manim_examples), extract all demo functions
 */
function extractSceneCode(scriptContent, stem) {
  // Special case: manim_examples has multiple demos
  if (stem === 'manim_examples') {
    return extractManimExamplesDemos(scriptContent);
  }

  // Special case: test_write has an async function run()
  if (stem === 'test_write') {
    return extractTestWrite(scriptContent);
  }

  // Strategy 1: Named scene function
  const namedFuncMatch = scriptContent.match(
    /(?:export\s+)?async\s+function\s+(\w+)\s*\(\s*scene\s*\)\s*\{/
  );
  if (namedFuncMatch) {
    const funcName = namedFuncMatch[1];
    const funcStart = namedFuncMatch.index;
    const body = extractBalancedBraces(scriptContent, scriptContent.indexOf('{', funcStart));
    if (body) {
      // Return just the inner body of the function, dedented
      return dedent(body);
    }
  }

  // Strategy 2: Inline code in click handler
  return extractInlineSceneCode(scriptContent);
}

/** Extract code between balanced braces (returns inner content, excluding outer braces). */
function extractBalancedBraces(code, openPos) {
  if (code[openPos] !== '{') return null;
  let depth = 1;
  let i = openPos + 1;
  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }
  if (depth !== 0) return null;
  return code.slice(openPos + 1, i - 1);
}

/** Extract inline scene code from a click handler. */
function extractInlineSceneCode(scriptContent) {
  // Find the click handler
  const clickMatch = scriptContent.match(/addEventListener\s*\(\s*['"]click['"]/);
  if (!clickMatch) return null;

  const clickStart = clickMatch.index;
  // Find the arrow function or function body
  const arrowMatch = scriptContent.slice(clickStart).match(/=>\s*\{/);
  if (!arrowMatch) return null;

  const bodyStart = clickStart + arrowMatch.index + arrowMatch[0].length;
  const fullBody = extractBalancedBraces(scriptContent, bodyStart - 1);
  if (!fullBody) return null;

  // Extract the interesting part: from after scene.clear() to before isAnimating/catch
  const lines = fullBody.split('\n');
  let startLine = 0;
  let endLine = lines.length - 1;

  // Find where scene.clear() is (skip past it)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('scene.clear()')) {
      startLine = i + 1;
      break;
    }
  }

  // Skip past the `try {` if it's right before scene.clear
  // (we already skipped scene.clear, so check if the line before was `try {`)

  // Find where the boilerplate resumes at the end
  for (let i = lines.length - 1; i >= startLine; i--) {
    const trimmed = lines[i].trim();
    if (
      trimmed === '' ||
      trimmed.startsWith('isAnimating') ||
      trimmed.startsWith('document.getElementById') ||
      trimmed === '} catch(e) {' ||
      trimmed === '} catch (e) {' ||
      trimmed.startsWith('console.error') ||
      trimmed === '}' ||
      trimmed === '});'
    ) {
      endLine = i - 1;
    } else {
      break;
    }
  }

  if (endLine < startLine) return null;

  const extracted = lines.slice(startLine, endLine + 1).join('\n');
  return dedent(extracted);
}

/** Special extraction for manim_examples.html (multiple demos). */
function extractManimExamplesDemos(scriptContent) {
  const demos = [];
  const demoRegex = /\/\/\s*Demo\s*\d+:\s*(.+)\n\s*document\.getElementById\(['"]demo\d+['"]\)\.addEventListener\(['"]click['"]\s*,\s*async\s*\(\)\s*=>\s*\{/g;

  let match;
  while ((match = demoRegex.exec(scriptContent)) !== null) {
    const demoName = match[1].trim();
    const bodyStart = scriptContent.indexOf('{', match.index + match[0].length - 1);
    const body = extractBalancedBraces(scriptContent, bodyStart);
    if (body) {
      // Extract from after scene.clear() to before setAnimating(false)
      const lines = body.split('\n');
      let start = 0;
      let end = lines.length - 1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('scene.clear()')) { start = i + 1; break; }
      }
      for (let i = lines.length - 1; i >= start; i--) {
        const t = lines[i].trim();
        if (t === '' || t.startsWith('setAnimating') || t === '}' || t === '});') {
          end = i - 1;
        } else break;
      }
      if (end >= start) {
        demos.push({ name: demoName, code: dedent(lines.slice(start, end + 1).join('\n')) });
      }
    }
  }

  if (demos.length === 0) return null;
  return demos.map((d) => `// --- ${d.name} ---\n${d.code}`).join('\n\n');
}

/** Special extraction for test_write.html. */
function extractTestWrite(scriptContent) {
  const funcMatch = scriptContent.match(/async\s+function\s+run\s*\(\s*\)\s*\{/);
  if (!funcMatch) return null;
  const body = extractBalancedBraces(scriptContent, scriptContent.indexOf('{', funcMatch.index));
  if (!body) return null;
  // Remove status.textContent lines
  const lines = body.split('\n').filter((l) => !l.includes('status.textContent'));
  return dedent(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Output is a single file, ensure parent dir exists
  const outDir = join(ROOT, 'website', 'docs');
  mkdirSync(outDir, { recursive: true });

  const files = readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith('.html'))
    .sort();

  // Collect all example data
  const examples = [];

  for (const file of files) {
    const stem = basename(file, '.html');
    const title = toTitle(stem);
    const html = readFileSync(join(EXAMPLES_DIR, file), 'utf-8');
    const scriptContent = extractScript(html);

    if (!scriptContent) {
      console.warn(`  Skipping ${file}: no <script type="module"> found`);
      continue;
    }

    const allImports = extractImports(html);
    const sceneCode = extractSceneCode(scriptContent, stem);
    const meta = EXAMPLE_META[stem] || {};
    const description = meta.description || `Example demonstrating ${title}.`;
    const learnMore = meta.learnMore || [];
    const category = fileToCategory[stem] || 'Other';

    const importStatement = buildImportStatement(allImports);
    const codeBlock = sceneCode
      ? `${importStatement}\n\n${sceneCode}`
      : importStatement;

    examples.push({ stem, file, title, category, description, learnMore, codeBlock });
  }

  // -------------------------------------------------------------------------
  // Generate a single examples.md page with all examples
  // -------------------------------------------------------------------------

  // Group by category, preserving order
  const grouped = {};
  for (const cat of Object.keys(CATEGORIES)) grouped[cat] = [];
  grouped['Other'] = [];
  for (const ex of examples) {
    (grouped[ex.category] || grouped['Other']).push(ex);
  }

  const lines = [
    '---',
    'title: Examples',
    'sidebar_label: Examples',
    '---',
    '',
    '# Examples',
    '',
    'A collection of examples showing what you can build with manim-js.',
    'Each example is a standalone scene you can run in the browser with `npm run dev`.',
    '',
  ];

  for (const [category, entries] of Object.entries(grouped)) {
    if (entries.length === 0) continue;

    lines.push(`## ${category}`);
    lines.push('');

    for (const ex of entries) {
      lines.push(`### ${ex.title}`);
      lines.push('');
      lines.push(ex.description);
      lines.push('');
      lines.push('```typescript');
      lines.push(ex.codeBlock);
      lines.push('```');
      lines.push('');

      // Learn More links
      if (ex.learnMore.length > 0) {
        const items = ex.learnMore.map((name) => `**${name}**`).join(' · ');
        lines.push(`**API:** ${items}`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  // Remove trailing separator
  if (lines[lines.length - 2] === '---') {
    lines.splice(lines.length - 2, 1);
  }

  lines.push('');
  lines.push('See the full [API Reference](/api) for all available classes and animations.');
  lines.push('');

  const outPath = join(outDir, 'examples.md');
  writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`  Generated: website/docs/examples.md`);

  console.log(`\nDone! Generated single examples page with ${examples.length} examples.`);
}

main();
