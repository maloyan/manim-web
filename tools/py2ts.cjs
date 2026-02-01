#!/usr/bin/env node
/**
 * py2ts.cjs — Convert Python Manim scripts to ManimWeb TypeScript
 *
 * Usage:
 *   node tools/py2ts.cjs <input.py> [output.ts]
 *   cat script.py | node tools/py2ts.cjs
 *
 * Examples:
 *   node tools/py2ts.cjs examples/my_scene.py
 *   node tools/py2ts.cjs examples/my_scene.py src/scenes/my_scene.ts
 */

const fs = require('fs');
const path = require('path');

// ─── Snake → camelCase ───────────────────────────────────────────────
function snakeToCamel(s) {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// ─── Known Manim class name mapping (Python → TS) ───────────────────
const CLASS_MAP = {
  // Core
  'Scene': 'Scene',
  'Mobject': 'Mobject',
  'VMobject': 'VMobject',
  'VGroup': 'VGroup',
  'Group': 'Group',

  // Geometry
  'Circle': 'Circle',
  'Square': 'Square',
  'Rectangle': 'Rectangle',
  'Line': 'Line',
  'Arrow': 'Arrow',
  'DoubleArrow': 'DoubleArrow',
  'Vector': 'Vector',
  'Dot': 'Dot',
  'SmallDot': 'SmallDot',
  'Polygon': 'Polygon',
  'RegularPolygon': 'RegularPolygon',
  'Triangle': 'Triangle',
  'Arc': 'Arc',
  'ArcBetweenPoints': 'ArcBetweenPoints',
  'Ellipse': 'Ellipse',
  'Annulus': 'Annulus',
  'Sector': 'Sector',
  'DashedLine': 'DashedLine',
  'DashedVMobject': 'DashedVMobject',
  'CubicBezier': 'CubicBezier',
  'RoundedRectangle': 'RoundedRectangle',
  'Star': 'Star',
  'Angle': 'Angle',
  'RightAngle': 'RightAngle',
  'BackgroundRectangle': 'BackgroundRectangle',
  'SurroundingRectangle': 'SurroundingRectangle',
  'Brace': 'Brace',
  'BraceBetweenPoints': 'BraceBetweenPoints',
  'Cross': 'Cross',
  'Underline': 'Underline',

  // Boolean operations
  'Intersection': 'Intersection',
  'Union': 'Union',
  'Difference': 'Difference',
  'Exclusion': 'Exclusion',

  // Text
  'Text': 'Text',
  'MathTex': 'MathTex',
  'Tex': 'Tex',
  'DecimalNumber': 'DecimalNumber',
  'Integer': 'Integer',
  'Variable': 'Variable',
  'Code': 'Code',
  'BulletedList': 'BulletedList',
  'Title': 'Title',
  'Paragraph': 'Paragraph',
  'MarkupText': 'MarkupText',

  // Graphing
  'Axes': 'Axes',
  'NumberPlane': 'NumberPlane',
  'NumberLine': 'NumberLine',
  'FunctionGraph': 'FunctionGraph',
  'ParametricFunction': 'ParametricFunction',
  'BarChart': 'BarChart',
  'ComplexPlane': 'ComplexPlane',

  // 3D
  'ThreeDScene': 'Scene',
  'Surface': 'ParametricSurface',
  'Sphere': 'Sphere',
  'Cube': 'Cube',
  'Cylinder': 'Cylinder',
  'Cone': 'Cone',
  'Torus': 'Torus',
  'Prism': 'Prism',
  'Arrow3D': 'Arrow3D',
  'Line3D': 'Line3D',
  'Dot3D': 'Dot3D',
  'ThreeDAxes': 'ThreeDAxes',

  // Tables / Matrix
  'Matrix': 'Matrix',
  'IntegerMatrix': 'IntegerMatrix',
  'DecimalMatrix': 'DecimalMatrix',
  'Table': 'Table',
  'MathTable': 'MathTable',

  // Animations — Creation
  'Create': 'Create',
  'Uncreate': 'Uncreate',
  'DrawBorderThenFill': 'DrawBorderThenFill',
  'Write': 'Write',
  'Unwrite': 'Unwrite',
  'AddTextLetterByLetter': 'AddTextLetterByLetter',
  'RemoveTextLetterByLetter': 'RemoveTextLetterByLetter',
  'ShowCreation': 'Create',

  // Animations — Fading
  'FadeIn': 'FadeIn',
  'FadeOut': 'FadeOut',

  // Animations — Transform
  'Transform': 'Transform',
  'ReplacementTransform': 'ReplacementTransform',
  'TransformFromCopy': 'TransformFromCopy',
  'ClockwiseTransform': 'ClockwiseTransform',
  'CounterclockwiseTransform': 'CounterclockwiseTransform',
  'MoveToTarget': 'MoveToTarget',
  'ApplyMethod': 'ApplyMethod',
  'ApplyFunction': 'ApplyFunction',
  'FadeTransform': 'FadeTransform',
  'Swap': 'Swap',
  'CyclicReplace': 'CyclicReplace',
  'Restore': 'Restore',
  'ScaleInPlace': 'ScaleInPlace',
  'ShrinkToCenter': 'ShrinkToCenter',

  // Animations — Movement
  'Shift': 'Shift',
  'Rotate': 'Rotate',
  'GrowFromCenter': 'GrowFromCenter',
  'GrowArrow': 'GrowArrow',
  'GrowFromEdge': 'GrowFromEdge',
  'GrowFromPoint': 'GrowFromPoint',
  'SpinInFromNothing': 'SpinInFromNothing',
  'MoveAlongPath': 'MoveAlongPath',

  // Animations — Indication
  'Indicate': 'Indicate',
  'Flash': 'Flash',
  'Circumscribe': 'Circumscribe',
  'Wiggle': 'Wiggle',
  'ShowPassingFlash': 'ShowPassingFlash',
  'ApplyWave': 'ApplyWave',
  'FocusOn': 'FocusOn',
  'Pulse': 'Pulse',

  // Animations — Composition
  'AnimationGroup': 'AnimationGroup',
  'LaggedStart': 'LaggedStart',
  'LaggedStartMap': 'LaggedStartMap',
  'Succession': 'Succession',

  // Animations — Updater
  'UpdateFromFunc': 'UpdateFromFunc',
  'UpdateFromAlphaFunc': 'UpdateFromAlphaFunc',

  // Animations — Color
  'FadeToColor': 'FadeToColor',

  // Animations — Utility
  'Rotating': 'Rotating',

  // Misc
  'ValueTracker': 'ValueTracker',
  'ImageMobject': 'ImageMobject',
  'SVGMobject': 'SVGMobject',
};

// Animation classes (need `new` keyword when called)
const ANIMATION_CLASSES = new Set([
  'Create','Uncreate','DrawBorderThenFill','Write','Unwrite',
  'AddTextLetterByLetter','RemoveTextLetterByLetter','ShowCreation',
  'FadeIn','FadeOut',
  'Transform','ReplacementTransform','TransformFromCopy','ClockwiseTransform',
  'CounterclockwiseTransform','MoveToTarget','ApplyMethod','ApplyFunction',
  'FadeTransform','Swap','CyclicReplace','Restore','ScaleInPlace','ShrinkToCenter',
  'Shift','Rotate','GrowFromCenter','GrowArrow','GrowFromEdge','GrowFromPoint',
  'SpinInFromNothing','MoveAlongPath',
  'Indicate','Flash','Circumscribe','Wiggle','ShowPassingFlash','ApplyWave',
  'FocusOn','Pulse',
  'AnimationGroup','LaggedStart','LaggedStartMap','Succession',
  'UpdateFromFunc','UpdateFromAlphaFunc',
  'FadeToColor',
  'Rotating',
]);

// Mobject classes (also need `new`)
const MOBJECT_CLASSES = new Set(Object.keys(CLASS_MAP).filter(k => !ANIMATION_CLASSES.has(k)));

// All classes that need `new`
const ALL_CLASSES = new Set([...ANIMATION_CLASSES, ...MOBJECT_CLASSES]);

// ─── Known kwarg renames ─────────────────────────────────────────────
const KWARG_MAP = {
  'run_time': 'duration',
  'rate_func': 'rateFunc',
  'fill_opacity': 'fillOpacity',
  'fill_color': 'fillColor',
  'stroke_width': 'strokeWidth',
  'stroke_color': 'strokeColor',
  'stroke_opacity': 'strokeOpacity',
  'font_size': 'fontSize',
  'font_family': 'fontFamily',
  'font_weight': 'fontWeight',
  'side_length': 'sideLength',
  'arc_center': 'arcCenter',
  'tip_length': 'tipLength',
  'tip_width': 'tipWidth',
  'num_points': 'numPoints',
  'x_range': 'xRange',
  'y_range': 'yRange',
  'z_range': 'zRange',
  'x_length': 'xLength',
  'y_length': 'yLength',
  'z_length': 'zLength',
  'axis_config': 'axisConfig',
  'x_axis_config': 'xAxisConfig',
  'y_axis_config': 'yAxisConfig',
  'include_ticks': 'includeTicks',
  'include_numbers': 'includeNumbers',
  'tick_size': 'tickSize',
  'numbers_to_exclude': 'numbersToExclude',
  'decimal_places': 'decimalPlaces',
  'include_sign': 'includeSign',
  'lag_ratio': 'lagRatio',
  'about_point': 'aboutPoint',
  'about_edge': 'aboutEdge',
  'buff': 'buff',
  'display_mode': 'displayMode',
  'background_line_style': 'backgroundLineStyle',
  'number_scale_value': 'numberScaleValue',
  'include_tip': 'includeTip',
  'line_to_number_buff': 'lineToNumberBuff',
  'bar_width': 'barWidth',
  'bar_separation': 'barSeparation',
  'num_decimal_places': 'decimalPlaces',
  'other_angle': 'otherAngle',
};

// ─── Method name remap (snake → camel + special cases) ───────────────
const METHOD_MAP = {
  'set_color': 'setColor',
  'set_fill': 'setFill',
  'set_stroke': 'setStroke',
  'set_opacity': 'setOpacity',
  'set_style': 'setStyle',
  'get_center': 'getCenter',
  'get_top': 'getTop',
  'get_bottom': 'getBottom',
  'get_left': 'getLeft',
  'get_right': 'getRight',
  'get_start': 'getStart',
  'get_end': 'getEnd',
  'get_width': 'getWidth',
  'get_height': 'getHeight',
  'move_to': 'moveTo',
  'next_to': 'nextTo',
  'shift': 'shift',
  'scale': 'scale',
  'rotate': 'rotate',
  'flip': 'flip',
  'stretch': 'stretch',
  'to_edge': 'toEdge',
  'to_corner': 'toCorner',
  'align_to': 'alignTo',
  'add_updater': 'addUpdater',
  'remove_updater': 'removeUpdater',
  'become': 'become',
  'copy': 'copy',
  'get_graph': 'getGraph',
  'get_graph_label': 'getGraphLabel',
  'coords_to_point': 'coordsToPoint',
  'point_to_coords': 'pointToCoords',
  'get_origin': 'getOrigin',
  'get_area': 'getArea',
  'get_riemann_rectangles': 'getRiemannRectangles',
  'input_to_graph_point': 'inputToGraphPoint',
  'number_to_point': 'numberToPoint',
  'point_to_number': 'pointToNumber',
  'arrange': 'arrange',
  'arrange_in_grid': 'arrangeInGrid',
  'set_z_index': 'setZIndex',
  'set_value': 'setValue',
  'get_value': 'getValue',
  'wait_for_render': 'waitForRender',
  'generate_target': 'generateTarget',
  'save_state': 'saveState',
  'restore': 'restore',
  'become': 'become',
  'point_from_proportion': 'pointFromProportion',
  'get_angle': 'getAngle',
  'set_value': 'setValue',
  'get_value': 'getValue',
  'increment_value': 'incrementValue',
  'set_x': 'setX',
  'set_y': 'setY',
  'set_z': 'setZ',
};

// ─── Color constant map ──────────────────────────────────────────────
const COLOR_MAP = {
  'WHITE': 'WHITE', 'BLACK': 'BLACK',
  'BLUE': 'BLUE', 'BLUE_A': 'BLUE_A', 'BLUE_B': 'BLUE_B', 'BLUE_C': 'BLUE_C',
  'BLUE_D': 'BLUE_D', 'BLUE_E': 'BLUE_E', 'PURE_BLUE': 'PURE_BLUE',
  'RED': 'RED', 'RED_A': 'RED_A', 'RED_B': 'RED_B', 'RED_C': 'RED_C',
  'RED_D': 'RED_D', 'RED_E': 'RED_E', 'PURE_RED': 'PURE_RED',
  'GREEN': 'GREEN', 'GREEN_A': 'GREEN_A', 'GREEN_B': 'GREEN_B', 'GREEN_C': 'GREEN_C',
  'GREEN_D': 'GREEN_D', 'GREEN_E': 'GREEN_E', 'PURE_GREEN': 'PURE_GREEN',
  'YELLOW': 'YELLOW', 'YELLOW_A': 'YELLOW_A', 'YELLOW_B': 'YELLOW_B', 'YELLOW_C': 'YELLOW_C',
  'YELLOW_D': 'YELLOW_D', 'YELLOW_E': 'YELLOW_E',
  'ORANGE': 'ORANGE', 'PINK': 'PINK',
  'PURPLE': 'PURPLE', 'PURPLE_A': 'PURPLE_A', 'PURPLE_B': 'PURPLE_B', 'PURPLE_C': 'PURPLE_C',
  'PURPLE_D': 'PURPLE_D', 'PURPLE_E': 'PURPLE_E',
  'TEAL': 'TEAL', 'TEAL_A': 'TEAL_A', 'TEAL_B': 'TEAL_B', 'TEAL_C': 'TEAL_C',
  'TEAL_D': 'TEAL_D', 'TEAL_E': 'TEAL_E',
  'GOLD': 'GOLD', 'GOLD_A': 'GOLD_A', 'GOLD_B': 'GOLD_B', 'GOLD_C': 'GOLD_C',
  'GOLD_D': 'GOLD_D', 'GOLD_E': 'GOLD_E',
  'MAROON': 'MAROON', 'MAROON_A': 'MAROON_A', 'MAROON_B': 'MAROON_B', 'MAROON_C': 'MAROON_C',
  'MAROON_D': 'MAROON_D', 'MAROON_E': 'MAROON_E',
  'GRAY': 'GRAY', 'GRAY_A': 'GRAY_A', 'GRAY_B': 'GRAY_B', 'GRAY_C': 'GRAY_C',
  'GRAY_D': 'GRAY_D', 'GRAY_E': 'GRAY_E',
  'GREY': 'GRAY', 'GREY_A': 'GRAY_A', 'GREY_B': 'GRAY_B',
  'LIGHT_GRAY': 'LIGHT_GRAY', 'DARK_GRAY': 'DARK_GRAY',
  'LIGHTER_GREY': 'LIGHTER_GRAY', 'DARKER_GREY': 'DARKER_GRAY',
};

const DIRECTION_MAP = {
  'UP': 'UP', 'DOWN': 'DOWN', 'LEFT': 'LEFT', 'RIGHT': 'RIGHT',
  'ORIGIN': 'ORIGIN', 'OUT': 'OUT', 'IN': 'IN',
  'UL': 'UL', 'UR': 'UR', 'DL': 'DL', 'DR': 'DR',
};

// Manim spacing/buffer constants
const BUFF_CONSTANTS = {
  'SMALL_BUFF': 'SMALL_BUFF',
  'MED_SMALL_BUFF': 'MED_SMALL_BUFF',
  'MED_LARGE_BUFF': 'MED_LARGE_BUFF',
  'LARGE_BUFF': 'LARGE_BUFF',
};

const RATE_FUNC_MAP = {
  'smooth': 'smooth',
  'linear': 'linear',
  'rush_into': 'rushInto',
  'rush_from': 'rushFrom',
  'there_and_back': 'thereAndBack',
  'double_smooth': 'doubleSmooth',
  'ease_in_out': 'easeInOut',
  'ease_in': 'easeIn',
  'ease_out': 'easeOut',
};

// ─── Join multi-line continuations ───────────────────────────────────
// Joins lines where parens/brackets aren't balanced, or explicit \ continuations.
function joinContinuationLines(lines) {
  const result = [];
  let buffer = '';
  let parenDepth = 0;

  for (const line of lines) {
    // Count paren depth, ignoring chars inside strings and comments
    let inStr = false;
    let strChar = '';
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '#' && !inStr) break;
      if (inStr) {
        if (ch === strChar && line[j - 1] !== '\\') inStr = false;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inStr = true;
        strChar = ch;
        continue;
      }
      if (ch === '(' || ch === '[' || ch === '{') parenDepth++;
      if (ch === ')' || ch === ']' || ch === '}') parenDepth--;
    }

    if (buffer) {
      buffer += ' ' + line.trim();
    } else {
      buffer = line;
    }

    // Explicit backslash continuation
    if (buffer.trimEnd().endsWith('\\')) {
      buffer = buffer.replace(/\\\s*$/, ' ');
      continue;
    }

    if (parenDepth <= 0) {
      result.push(buffer);
      buffer = '';
      parenDepth = 0;
    }
  }
  if (buffer) result.push(buffer);
  return result;
}

// ─── Find matching close paren/bracket ───────────────────────────────
function findMatchingParen(s, openIndex) {
  const openCh = s[openIndex];
  const closeCh = openCh === '(' ? ')' : openCh === '[' ? ']' : '}';
  let depth = 0;
  let inStr = false;
  let strChar = '';
  for (let i = openIndex; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === strChar && s[i - 1] !== '\\') inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; continue; }
    if (ch === openCh) depth++;
    if (ch === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// ─── Expand tuple unpacking: a,b = x,y → separate assignments ────────
function expandTupleUnpacking(lines) {
  const result = [];
  for (const line of lines) {
    // Match: indent var1, var2 [, var3 ...] = expr1, expr2 [, expr3 ...]
    // But not inside for loops, function defs, or lines with ==
    const m = line.match(/^(\s*)([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)+)\s*=\s*(.+)$/);
    if (m && !/^\s*(for|if|while|def|return)\b/.test(line) && !line.includes('==')) {
      const indent = m[1];
      const varNames = m[2].split(',').map(v => v.trim());
      const rhsStr = m[3];
      // Split RHS by top-level commas (respecting parens/brackets/strings)
      const rhsParts = smartSplit(rhsStr);
      if (rhsParts.length === varNames.length) {
        for (let i = 0; i < varNames.length; i++) {
          result.push(`${indent}${varNames[i]} = ${rhsParts[i].trim()}`);
        }
        continue;
      }
    }
    result.push(line);
  }
  return result;
}

// ─── Main converter ──────────────────────────────────────────────────
function convertPythonToTypeScript(pythonCode) {
  const rawLines = pythonCode.split('\n');
  const lines = expandTupleUnpacking(joinContinuationLines(rawLines));

  // ── Phase 1: Parse into scene blocks ──
  const scenes = [];
  let currentScene = null;
  let inConstruct = false;
  let baseIndent = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip imports
    if (/^\s*(from\s+manim|import\s+manim|import\s+numpy|from\s+numpy)/.test(line)) continue;
    if (/^\s*import\s+/.test(line) && !line.includes('=')) continue;

    // Skip if __name__ block
    if (/^\s*if\s+__name__/.test(line)) { inConstruct = false; continue; }

    // Scene class definition
    const classMatch = line.match(/^class\s+(\w+)\s*\(\s*(\w+)\s*\)\s*:/);
    if (classMatch) {
      currentScene = { name: classMatch[1], base: classMatch[2], lines: [] };
      scenes.push(currentScene);
      inConstruct = false;
      continue;
    }

    // construct method
    const constructMatch = line.match(/^(\s*)def\s+construct\s*\(\s*self\s*\)\s*:/);
    if (constructMatch && currentScene) {
      inConstruct = true;
      baseIndent = constructMatch[1].length + 4;
      continue;
    }

    // Other methods → stop collecting construct body
    if (/^\s*def\s+\w+\s*\(/.test(line) && !/def\s+construct/.test(line)) {
      inConstruct = false;
      continue;
    }

    if (!currentScene || !inConstruct) continue;

    // Check if we've dedented out of construct
    if (line.length > 0 && !/^\s*$/.test(line)) {
      const currentIndent = line.match(/^(\s*)/)[1].length;
      if (currentIndent < baseIndent && currentIndent > 0 && !/^\s*#/.test(line)) {
        inConstruct = false;
        continue;
      }
    }

    // Add to scene (strip base indent)
    if (/^\s*$/.test(line)) {
      currentScene.lines.push('');
    } else {
      const ci = line.match(/^(\s*)/)[1].length;
      currentScene.lines.push(ci >= baseIndent ? '  ' + line.slice(baseIndent) : line);
    }
  }

  // Fallback: if no scenes found, treat whole file as one
  if (scenes.length === 0) {
    scenes.push({ name: 'MyScene', base: 'Scene', lines: lines.map(l => '  ' + l) });
  }

  // ── Phase 2: Convert each scene ──
  const tracking = {
    usedClasses: new Set(['Scene']),
    usedColors: new Set(),
    usedDirections: new Set(),
    usedRateFuncs: new Set(),
    usedBuffConstants: new Set(),
  };

  const convertedScenes = scenes.map(scene => {
    const declaredVars = new Set();
    const converted = [];
    for (const line of scene.lines) {
      converted.push(convertLine(line, tracking, declaredVars));
    }
    // PascalCase → camelCase, remove "Scene" suffix
    let funcName = scene.name.replace(/Scene$/, '');
    if (!funcName) funcName = scene.name;
    funcName = funcName[0].toLowerCase() + funcName.slice(1);
    return { name: scene.name, funcName, lines: converted };
  });

  // ── Phase 3: Build output ──
  const imports = new Set();
  tracking.usedClasses.forEach(c => imports.add(c));
  tracking.usedColors.forEach(c => imports.add(COLOR_MAP[c] || c));
  tracking.usedDirections.forEach(d => imports.add(d));
  tracking.usedRateFuncs.forEach(r => imports.add(r));
  tracking.usedBuffConstants.forEach(b => imports.add(b));
  const uniqueImports = [...imports].sort();

  const output = [];
  output.push('// Converted from Python Manim → ManimWeb TypeScript');
  output.push('// Review and adjust as needed — automated conversion is approximate.');
  output.push('');
  if (uniqueImports.length > 0) {
    output.push('import {');
    output.push(`  ${uniqueImports.join(',\n  ')}`);
    output.push("} from '../src';");
    output.push('');
  }

  for (const scene of convertedScenes) {
    output.push(`export async function ${scene.funcName}(scene: Scene) {`);
    let lastBlank = false;
    for (const line of scene.lines) {
      if (line.trim() === '') {
        if (lastBlank) continue;
        lastBlank = true;
      } else {
        lastBlank = false;
      }
      output.push(line);
    }
    output.push('}');
    output.push('');
  }

  return output.join('\n');
}

// ─── Convert a single line of Python → TypeScript ────────────────────
function convertLine(rawLine, tracking, declaredVars) {
  if (rawLine.trim() === '') return rawLine;
  let line = rawLine;

  // Comments: # → // (skip # inside strings)
  line = line.replace(/^([^"']*?)#(.*)$/, (match, before, after) => {
    // Count unescaped quotes in 'before' to check if # is inside a string
    let inStr = false, strChar = '';
    for (let j = 0; j < before.length; j++) {
      const ch = before[j];
      if (inStr) { if (ch === strChar && before[j - 1] !== '\\') inStr = false; continue; }
      if (ch === '"' || ch === "'") { inStr = true; strChar = ch; }
    }
    if (inStr) return match; // # is inside a string, don't convert
    return before + '//' + after;
  });

  // Booleans / None
  line = line.replace(/\bTrue\b/g, 'true');
  line = line.replace(/\bFalse\b/g, 'false');
  line = line.replace(/\bNone\b/g, 'null');

  // self.camera.background_color = "..." → scene.setBackgroundColor("...")
  line = line.replace(/self\.camera\.background_color\s*=\s*(.+)/, 'scene.setBackgroundColor($1)');

  // self.play/wait/add/remove/clear → scene.*
  line = line.replace(/self\.play\s*\(/g, 'await scene.play(');
  line = line.replace(/self\.wait\s*\(/g, 'await scene.wait(');
  line = line.replace(/self\.add\s*\(/g, 'scene.add(');
  line = line.replace(/self\.remove\s*\(/g, 'scene.remove(');
  line = line.replace(/self\.clear\s*\(/g, 'scene.clear(');
  line = line.replace(/self\.camera/g, 'scene.camera');

  // .animate.method() handling
  // Special case: ValueTracker.animate.set_value(x) → tracker.animateTo(x)
  // Special case: ValueTracker.animate.increment_value(x) → tracker.animateTo(tracker.getValue() + x)
  // General case: obj.animate.method() → generateTarget + MoveToTarget pattern
  const animatePlayMatch = line.match(/^(\s*)(await\s+scene\.play\s*\()(\w+)\.animate\.([\s\S]+?)\)\s*;?\s*$/);
  if (animatePlayMatch) {
    const indent = animatePlayMatch[1];
    const objName = animatePlayMatch[3];
    let chainedCalls = animatePlayMatch[4];

    // Extract play-level kwargs (e.g., run_time=0.5) from after the animate call
    // Note: kwargs still use Python syntax (=) at this point in the pipeline
    let playOpts = '';
    const callParts = smartSplit(chainedCalls);
    const animCall = callParts[0] ? callParts[0].trim() : chainedCalls;
    const extraKwargs = callParts.slice(1).filter(p => /^\s*\w+=/.test(p.trim()));
    if (extraKwargs.length > 0) {
      const convertedKwargs = extraKwargs.map(k => {
        const kv = k.trim().match(/^(\w+)\s*=\s*(.+)$/);
        if (kv) {
          const tsKey = KWARG_MAP[kv[1]] || snakeToCamel(kv[1]);
          return `${tsKey}: ${kv[2]}`;
        }
        return k.trim();
      });
      playOpts = `{ ${convertedKwargs.join(', ')} }`;
    }

    // Check for specific patterns (still snake_case since this runs before method renames)
    const setValueMatch = animCall.match(/^set_value\s*\(\s*(.+)\s*\)$/);
    const incrementMatch = animCall.match(/^increment_value\s*\(\s*(.+)\s*\)$/);
    const setColorMatch = animCall.match(/^set_color\s*\(\s*(.+)\s*\)$/);

    if (setValueMatch) {
      const opts = playOpts ? `, ${playOpts}` : '';
      line = `${indent}await scene.play(${objName}.animateTo(${setValueMatch[1]}${opts}));`;
    } else if (incrementMatch) {
      const opts = playOpts ? `, ${playOpts}` : '';
      line = `${indent}await scene.play(${objName}.animateTo(${objName}.getValue() + ${incrementMatch[1]}${opts}));`;
    } else if (setColorMatch) {
      // obj.animate.set_color(X) → use FadeToColor for smooth color interpolation
      tracking.usedClasses.add('FadeToColor');
      const targetColor = setColorMatch[1].trim();
      const playOptsObj = playOpts ? playOpts.slice(2, -2).trim() : ''; // strip "{ " and " }"
      const optsStr = playOptsObj ? `{ color: ${targetColor}, ${playOptsObj} }` : `{ color: ${targetColor} }`;
      line = `${indent}await scene.play(new FadeToColor(${objName}, ${optsStr}));`;
    } else {
      tracking.usedClasses.add('MoveToTarget');
      const opts = playOpts ? `, ${playOpts}` : '';
      line = `${indent}${objName}.generateTarget();\n${indent}${objName}.targetCopy!.${animCall};\n${indent}await scene.play(new MoveToTarget(${objName}${opts}));`;
    }
  } else {
    // Fallback: strip .animate for non-play contexts
    line = line.replace(/\.animate\.(\w+)\s*\(/g, '.$1(');
  }

  // Remaining self. → strip
  line = line.replace(/self\./g, '');

  // **kwargs spread — require non-word char before ** (so x**2 is NOT matched)
  line = line.replace(/(?<!\w)\*\*(\w+)/g, '...$1');

  // * splat: *[list] → ...[list] (not multiply)
  line = line.replace(/(?<![a-zA-Z0-9_])\*(?!\*)\[/g, '...[');
  // * splat: *var in function args → ...var
  line = line.replace(/(?<=[(,]\s*)\*(?!\*)(\w+)/g, '...$1');

  // Lambda → arrow function (2-arg first, then 1-arg)
  line = line.replace(/lambda\s+(\w+)\s*,\s*(\w+)\s*:\s*(.+?)(?=[,)\]])/g, '($1, $2) => $3');
  line = line.replace(/lambda\s+(\w+)\s*:\s*(.+?)(?=[,)\]])/g, '($1) => $2');

  // Math functions
  line = line.replace(/\bmath\.pi\b/gi, 'Math.PI');
  line = line.replace(/\bPI\b/g, 'Math.PI');
  line = line.replace(/\bTAU\b/g, '2 * Math.PI');
  line = line.replace(/\bDEGREES\b/g, '(Math.PI / 180)');
  line = line.replace(/\bmath\.(sqrt|sin|cos|tan|exp|log|abs|ceil|floor)\b/g, 'Math.$1');
  line = line.replace(/\bnp\.(sin|cos|sqrt|tan|exp|log)\b/g, 'Math.$1');
  line = line.replace(/\bnp\.array\s*\(\s*\[/g, '[');
  line = line.replace(/\bnp\.pi\b/g, 'Math.PI');

  // Strip numpy type wrappers: np.uint8(...) → inner content
  line = stripFunctionWrapper(line, 'np.uint8');

  // ** power → Math.pow (AFTER **kwargs conversion, so x**2 is still intact)
  line = line.replace(/(\w+)\s*\*\*\s*(\w+)/g, 'Math.pow($1, $2)');

  // Vector math: scalar * DIRECTION → scaleVec(scalar, DIRECTION)
  // Handles: 2.25 * LEFT, -1.5 * UP, etc.
  const DIRS = Object.keys(DIRECTION_MAP).join('|');
  const scaleVecRe = new RegExp(`(-?[\\d.]+)\\s*\\*\\s*(${DIRS})\\b`, 'g');
  if (scaleVecRe.test(line)) {
    tracking.usedClasses.add('scaleVec');
    line = line.replace(new RegExp(`(-?[\\d.]+)\\s*\\*\\s*(${DIRS})\\b`, 'g'), 'scaleVec($1, $2)');
  }

  // Also handle DIRECTION * scalar (e.g., UP * 3, LEFT * 2.5)
  const dirScalarRe = new RegExp(`(${DIRS})\\s*\\*\\s*(-?[\\d.]+)`, 'g');
  if (dirScalarRe.test(line)) {
    tracking.usedClasses.add('scaleVec');
    line = line.replace(new RegExp(`(${DIRS})\\s*\\*\\s*(-?[\\d.]+)`, 'g'), 'scaleVec($2, $1)');
  }

  // Vector addition: scaleVec(...) + scaleVec(...) or DIR + DIR → addVec(a, b)
  // Handles: scaleVec(2.25, LEFT) + scaleVec(1.5, UP) and LEFT + UP
  const vecTermPattern = `(?:scaleVec\\([^)]+\\)|${DIRS})`;
  const addVecRe = new RegExp(`(${vecTermPattern})\\s*\\+\\s*(${vecTermPattern})`);
  if (addVecRe.test(line)) {
    tracking.usedClasses.add('addVec');
    // Handle chains: A + B + C → addVec(A, B, C)
    const chainRe = new RegExp(`(${vecTermPattern}(?:\\s*\\+\\s*${vecTermPattern})+)`);
    line = line.replace(chainRe, (match) => {
      const parts = match.split(/\s*\+\s*/);
      return `addVec(${parts.join(', ')})`;
    });
  }

  // List comprehension: [expr for x in iterable]
  // Must run BEFORE range() conversion to avoid Array.from(...) breaking comprehension parsing
  line = convertListComprehensions(line);

  // range() — accept any expression (variables, numbers, etc.)
  line = line.replace(/\brange\(([^,)]+),\s*([^,)]+)\)/g,
    'Array.from({length: $2 - $1}, (_, i) => i + $1)');
  line = line.replace(/\brange\(([^,)]+)\)/g,
    'Array.from({length: $1}, (_, i) => i)');

  // f-strings
  line = line.replace(/f"([^"]*?)"/g, (_, inner) =>
    '`' + inner.replace(/\{([^}]+)\}/g, '${$1}') + '`');
  line = line.replace(/f'([^']*?)'/g, (_, inner) =>
    '`' + inner.replace(/\{([^}]+)\}/g, '${$1}') + '`');

  // Raw strings — escape backslashes since JS doesn't have raw strings
  line = line.replace(/r"([^"]*?)"/g, (_, inner) => '"' + inner.replace(/\\/g, '\\\\') + '"');
  line = line.replace(/r'([^']*?)'/g, (_, inner) => "'" + inner.replace(/\\/g, '\\\\') + "'");

  // Track colors, directions, and buffer constants
  for (const c of Object.keys(COLOR_MAP)) {
    if (new RegExp(`\\b${c}\\b`).test(line)) tracking.usedColors.add(c);
  }
  for (const d of Object.keys(DIRECTION_MAP)) {
    if (new RegExp(`\\b${d}\\b`).test(line)) tracking.usedDirections.add(d);
  }
  for (const b of Object.keys(BUFF_CONSTANTS)) {
    if (new RegExp(`\\b${b}\\b`).test(line)) tracking.usedBuffConstants.add(b);
  }

  // Rate functions
  for (const [pyName, tsName] of Object.entries(RATE_FUNC_MAP)) {
    if (line.includes(pyName)) {
      line = line.replace(new RegExp(`\\b${pyName}\\b`, 'g'), tsName);
      tracking.usedRateFuncs.add(tsName);
    }
  }

  // Known kwargs: key=value → tsKey: value (only inside function calls: after ( or ,)
  for (const [pyKey, tsKey] of Object.entries(KWARG_MAP)) {
    line = line.replace(new RegExp(`([(,]\\s*)${pyKey}\\s*=`, 'g'), `$1${tsKey}: `);
  }

  // Remaining snake_case kwargs: key=value → camelKey: value (only inside function calls)
  line = line.replace(/([(,]\s*)([a-z_][a-z_0-9]*)=/g, (match, before, key) => {
    if (match.endsWith('==')) return match;
    return `${before}${KWARG_MAP[key] || snakeToCamel(key)}: `;
  });

  // Known method renames
  for (const [pyMethod, tsMethod] of Object.entries(METHOD_MAP)) {
    line = line.replace(new RegExp(`\\.${pyMethod}\\b`, 'g'), `.${tsMethod}`);
  }

  // Property access: obj.height → obj.getHeight(), obj.width → obj.getWidth()
  line = line.replace(/\.height\b(?!\s*\()/g, '.getHeight()');
  line = line.replace(/\.width\b(?!\s*\()/g, '.getWidth()');

  // Remaining snake_case method names
  line = line.replace(/\.([a-z_][a-z_0-9]*)\s*\(/g, (_, method) =>
    `.${snakeToCamel(method)}(`);

  // Class instantiation → new ClassName()
  for (const cls of Object.keys(CLASS_MAP)) {
    const tsClass = CLASS_MAP[cls];
    const re = new RegExp(`(?<!\\.|new\\s)\\b${cls}\\s*\\(`, 'g');
    if (re.test(line)) {
      tracking.usedClasses.add(tsClass);
      line = line.replace(new RegExp(`(?<!\\.|new\\s)\\b${cls}\\s*\\(`, 'g'), `new ${tsClass}(`);
    }
  }

  // Constructor args → options object (uses findMatchingParen for accuracy)
  line = convertConstructorArgs(line);

  // Method call kwargs → options object
  line = convertMethodCallArgs(line);

  // Merge scene.play() kwargs into animation constructors
  // Python: self.play(Anim(args), run_time=2) → TS: scene.play(new Anim(args, {duration: 2}))
  line = mergePlayOptions(line);

  // Fix setColor kwargs: .setColor({ color: X }) → .setColor(X)
  line = line.replace(/\.setColor\(\s*\{\s*color:\s*([^}]+)\}\s*\)/g, '.setColor($1)');

  // GREY → GRAY
  line = line.replace(/\bGREY\b/g, 'GRAY');

  // Python string methods
  line = line.replace(/\.upper\(\)/g, '.toUpperCase()');
  line = line.replace(/\.lower\(\)/g, '.toLowerCase()');
  line = line.replace(/\.strip\(\)/g, '.trim()');
  line = line.replace(/\blen\((\w+)\)/g, '$1.length');

  // Control flow: trailing colon → { (only for control flow keywords)
  if (/^\s*(if|elif|else|for|while|try|except|finally|with)\b/.test(rawLine)) {
    line = line.replace(/:\s*$/, ' {');
  }

  line = line.replace(/\belif\b/g, 'else if');

  // for loops
  line = line.replace(
    /for\s+(\w+)\s+in\s+Array\.from\(\{length:\s*(\w+)\},\s*\(_, i\) => i\)/g,
    'for (let $1 = 0; $1 < $2; $1++)'
  );
  line = line.replace(/for\s+(\w+)\s+in\s+(.+?)\s*\{/g, 'for (const $1 of $2) {');

  // Wrap conditions in parens
  line = line.replace(/^(\s*)(if|else if)\s+(.+?)\s*\{/g, '$1$2 ($3) {');
  line = line.replace(/^(\s*)while\s+(.+?)\s*\{/g, '$1while ($2) {');

  // Variable declarations: first assignment → const
  const varMatch = line.match(/^(\s*)([a-zA-Z_]\w*)\s*=\s*(.+)/);
  if (varMatch) {
    const [, indent, varName, value] = varMatch;
    if (!/\b(const|let|var)\s/.test(line) &&
        !/^\s*(for|if|while|return|export)\b/.test(line.trim()) &&
        !declaredVars.has(varName)) {
      declaredVars.add(varName);
      line = `${indent}const ${varName} = ${value}`;
    }
  }

  // Semicolons
  if (shouldAddSemicolon(line)) {
    line = line.replace(/\s*$/, ';');
  }

  return line;
}

// ─── Strip a function wrapper using paren matching ───────────────────
function stripFunctionWrapper(line, funcName) {
  const re = new RegExp(`\\b${funcName.replace('.', '\\.')}\\s*\\(`);
  let m;
  while ((m = re.exec(line)) !== null) {
    const openIdx = m.index + m[0].length - 1;
    const closeIdx = findMatchingParen(line, openIdx);
    if (closeIdx === -1) break;
    const inner = line.slice(openIdx + 1, closeIdx).trim();
    line = line.slice(0, m.index) + inner + line.slice(closeIdx + 1);
  }
  return line;
}

// ─── Convert list comprehensions (handles nesting) ───────────────────
function convertListComprehensions(line) {
  // Repeatedly convert innermost list comprehension until none remain.
  // An innermost comprehension has no [ ] inside its expr part.
  const MAX_ITERS = 10;
  for (let iter = 0; iter < MAX_ITERS; iter++) {
    // Find a bracket-delimited comprehension: [ expr for var in iterable ]
    // We need to find matching [ ] pairs that contain "for ... in ..."
    let found = false;
    // Scan for '[' chars that start a comprehension
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== '[') continue;
      const closeIdx = findMatchingParen(line, i);
      if (closeIdx === -1) continue;
      const inner = line.slice(i + 1, closeIdx);
      // Match: expr for var in iterable (at top level of this bracket)
      const forMatch = matchComprehension(inner);
      if (!forMatch) continue;
      const { expr, varName, iterable } = forMatch;
      const replacement = `${iterable.trim()}.map((${varName}) => ${expr.trim()})`;
      line = line.slice(0, i) + replacement + line.slice(closeIdx + 1);
      found = true;
      break; // restart scan since indices changed
    }
    if (!found) break;
  }
  return line;
}

// Match "expr for var in iterable" at the top nesting level of a string.
// Returns { expr, varName, iterable } or null.
function matchComprehension(s) {
  // Find ' for ' at top level (not inside parens/brackets/braces)
  let depth = 0;
  let inStr = false;
  let strChar = '';
  for (let i = 0; i < s.length - 4; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === strChar && s[i - 1] !== '\\') inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') { depth++; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth--; continue; }
    if (depth === 0 && s.slice(i).match(/^\s+for\s+/)) {
      const expr = s.slice(0, i);
      const rest = s.slice(i).replace(/^\s+for\s+/, '');
      // rest should be: varName in iterable
      const inMatch = rest.match(/^(\w+)\s+in\s+([\s\S]+)$/);
      if (inMatch) {
        return { expr, varName: inMatch[1], iterable: inMatch[2] };
      }
    }
  }
  return null;
}

// ─── Convert constructor args to options object ──────────────────────
// Uses findMatchingParen for accurate paren matching.
function convertConstructorArgs(line) {
  const regex = /new\s+(\w+)\s*\(/g;
  const matches = [];
  let m;
  while ((m = regex.exec(line)) !== null) {
    matches.push({ index: m.index, className: m[1], parenIndex: m.index + m[0].length - 1 });
  }

  // Process right-to-left to preserve string offsets
  for (let i = matches.length - 1; i >= 0; i--) {
    const { className, parenIndex } = matches[i];
    const closeIndex = findMatchingParen(line, parenIndex);
    if (closeIndex === -1) continue;

    const args = line.slice(parenIndex + 1, closeIndex);
    if (!args.trim()) continue;
    if (args.trim().startsWith('{')) continue;

    // For Text/MathTex classes, always wrap positional args even without kwargs
    const needsWrapping = ['Text', 'Title', 'Paragraph', 'MarkupText', 'MathTex', 'Tex',
      'Dot', 'SmallDot', 'LargeDot',
      'Line', 'Arrow', 'DoubleArrow', 'Vector', 'Line3D', 'Arrow3D',
      'ImageMobject', 'MoveAlongPath',
      'Angle', 'RightAngle'].includes(className);
    if (!args.includes(':') && !needsWrapping) continue;

    const parts = smartSplit(args);
    const positional = [];
    const kwargs = [];

    for (const part of parts) {
      if (/^\s*\w+\s*:/.test(part) && !part.trim().startsWith('"') && !part.trim().startsWith("'") && !part.trim().startsWith('`')) {
        kwargs.push(part.trim());
      } else {
        positional.push(part.trim());
      }
    }

    if (kwargs.length === 0 && !needsWrapping) continue;

    let newArgs;

    if (className === 'ImageMobject') {
      if (positional.length > 0) {
        const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
        newArgs = `{ pixelData: ${positional[0]}${kw} }`;
      } else {
        newArgs = `{ ${kwargs.join(', ')} }`;
      }
    } else if (className === 'Text' || className === 'Title' || className === 'Paragraph' || className === 'MarkupText') {
      if (positional.length > 0) {
        const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
        newArgs = `{ text: ${positional[0]}${kw} }`;
      } else {
        newArgs = `{ ${kwargs.join(', ')} }`;
      }
    } else if (className === 'MathTex' || className === 'Tex') {
      // For MathTex/Tex, fill_color maps to 'color' not 'fillColor'
      const fixedKwargs = kwargs.map(k => k.replace(/^fillColor:/, 'color:'));
      if (positional.length > 0) {
        const kw = fixedKwargs.length > 0 ? ', ' + fixedKwargs.join(', ') : '';
        newArgs = `{ latex: ${positional[0]}${kw} }`;
      } else {
        newArgs = `{ ${fixedKwargs.join(', ')} }`;
      }
    } else if (className === 'Dot' || className === 'SmallDot' || className === 'LargeDot') {
      if (positional.length > 0) {
        const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
        newArgs = `{ point: ${positional[0]}${kw} }`;
      } else {
        newArgs = `{ ${kwargs.join(', ')} }`;
      }
    } else if (className === 'Angle' || className === 'RightAngle') {
      // Angle(line1, line2, kwargs) → new Angle({ line1: line1, line2: line2 }, { kwargs })
      if (positional.length >= 2) {
        const inputObj = `{ line1: ${positional[0]}, line2: ${positional[1]} }`;
        const opts = kwargs.length > 0 ? `, { ${kwargs.join(', ')} }` : '';
        newArgs = `${inputObj}${opts}`;
      } else {
        continue;
      }
    } else if (className === 'Line' || className === 'Arrow' || className === 'DoubleArrow' ||
               className === 'Line3D' || className === 'Arrow3D') {
      if (positional.length >= 2) {
        newArgs = `{ start: ${positional[0]}, end: ${positional[1]}`;
        if (kwargs.length > 0) newArgs += ', ' + kwargs.join(', ');
        newArgs += ' }';
      } else if (positional.length === 1) {
        newArgs = `{ start: ORIGIN, end: ${positional[0]}`;
        if (kwargs.length > 0) newArgs += ', ' + kwargs.join(', ');
        newArgs += ' }';
      } else {
        newArgs = `{ ${kwargs.join(', ')} }`;
      }
    } else if (['Intersection', 'Union', 'Difference', 'Exclusion',
                'Transform', 'ReplacementTransform', 'TransformFromCopy',
                'ClockwiseTransform', 'CounterclockwiseTransform'].includes(className)) {
      if (positional.length >= 2) {
        const opts = kwargs.length > 0 ? `, { ${kwargs.join(', ')} }` : '';
        newArgs = `${positional[0]}, ${positional[1]}${opts}`;
      } else {
        continue; // can't convert
      }
    } else if (className === 'MoveAlongPath') {
      // MoveAlongPath(mobject, path) → new MoveAlongPath(mobject, { path: pathMobject, ...opts })
      if (positional.length >= 2) {
        const kw = kwargs.length > 0 ? ', ' + kwargs.join(', ') : '';
        newArgs = `${positional[0]}, { path: ${positional[1]}${kw} }`;
      } else if (positional.length === 1 && kwargs.length > 0) {
        newArgs = `${positional[0]}, { ${kwargs.join(', ')} }`;
      } else {
        continue;
      }
    } else if (ANIMATION_CLASSES.has(className)) {
      if (positional.length > 0) {
        const opts = kwargs.length > 0 ? `, { ${kwargs.join(', ')} }` : '';
        newArgs = `${positional.join(', ')}${opts}`;
      } else {
        continue;
      }
    } else {
      // General mobject: wrap kwargs in options object
      if (positional.length > 0) {
        newArgs = `${positional.join(', ')}, { ${kwargs.join(', ')} }`;
      } else {
        newArgs = `{ ${kwargs.join(', ')} }`;
      }
    }

    line = line.slice(0, parenIndex + 1) + newArgs + line.slice(closeIndex);
  }

  return line;
}

// ─── Convert method call kwargs to options object ────────────────────
// Handles: obj.setFill(PINK, fillOpacity: 0.5) → obj.setFill(PINK, { fillOpacity: 0.5 })
function convertMethodCallArgs(line) {
  const regex = /\.(\w+)\s*\(/g;
  const matches = [];
  let m;
  while ((m = regex.exec(line)) !== null) {
    // Find the open paren position
    const parenIndex = line.indexOf('(', m.index + m[1].length);
    if (parenIndex === -1) continue;
    matches.push({ method: m[1], parenIndex });
  }

  // Methods where kwargs should be inlined as positional args, not wrapped in {}
  // These methods take positional parameters, not an options object
  const POSITIONAL_KWARGS_METHODS = new Set([
    'arrange', 'setFill', 'setStroke', 'nextTo',
  ]);

  // Process right-to-left
  for (let i = matches.length - 1; i >= 0; i--) {
    const { method, parenIndex } = matches[i];
    const closeIndex = findMatchingParen(line, parenIndex);
    if (closeIndex === -1) continue;

    const args = line.slice(parenIndex + 1, closeIndex);
    if (!args.trim()) continue;
    if (!args.includes(':')) continue;
    if (args.trim().startsWith('{')) continue;

    const parts = smartSplit(args);
    const positional = [];
    const kwargs = [];

    for (const part of parts) {
      if (/^\s*\w+\s*:/.test(part) && !part.trim().startsWith('"') && !part.trim().startsWith("'") && !part.trim().startsWith('`')) {
        kwargs.push(part.trim());
      } else {
        positional.push(part.trim());
      }
    }

    if (kwargs.length === 0) continue;

    // For methods that take positional args, inline kwargs as values (strip key names)
    if (POSITIONAL_KWARGS_METHODS.has(method)) {
      const allArgs = [...positional, ...kwargs.map(kw => kw.replace(/^\w+:\s*/, ''))];
      const newArgs = allArgs.join(', ');
      line = line.slice(0, parenIndex + 1) + newArgs + line.slice(closeIndex);
    } else {
      const posStr = positional.length > 0 ? positional.join(', ') + ', ' : '';
      const newArgs = `${posStr}{ ${kwargs.join(', ')} }`;
      line = line.slice(0, parenIndex + 1) + newArgs + line.slice(closeIndex);
    }
  }

  return line;
}

// ─── Merge scene.play() trailing options into animation constructors ─
// Python: self.play(Anim(x), run_time=2) becomes TS: scene.play(new Anim(x, {duration: 2}))
// because scene.play() only takes Animation[] — no options parameter.
function mergePlayOptions(line) {
  const playIdx = line.indexOf('scene.play(');
  if (playIdx === -1) return line;

  const openParen = playIdx + 'scene.play'.length;
  const closeParen = findMatchingParen(line, openParen);
  if (closeParen === -1) return line;

  const playArgs = line.slice(openParen + 1, closeParen);
  const parts = smartSplit(playArgs);
  if (parts.length < 2) return line;

  // Check if last part is a standalone options object { ... }
  const lastPart = parts[parts.length - 1].trim();
  if (!lastPart.startsWith('{') || !lastPart.endsWith('}')) return line;
  if (/^new\s/.test(lastPart)) return line;

  const optionsContent = lastPart.slice(1, -1).trim();
  if (!optionsContent) return line;

  // Merge options into each animation constructor
  const animParts = parts.slice(0, -1);
  const mergedParts = animParts.map(part => {
    part = part.trim();
    if (!part.startsWith('new ')) return part;

    const firstParen = part.indexOf('(');
    if (firstParen === -1) return part;
    const lastClose = findMatchingParen(part, firstParen);
    if (lastClose === -1 || lastClose !== part.length - 1) return part;

    const ctorArgs = part.slice(firstParen + 1, lastClose);
    const ctorParts = smartSplit(ctorArgs);

    if (ctorParts.length > 0) {
      const lastCtorPart = ctorParts[ctorParts.length - 1].trim();
      if (lastCtorPart.startsWith('{') && lastCtorPart.endsWith('}')) {
        // Merge into existing options object
        const existing = lastCtorPart.slice(1, -1).trim();
        const merged = existing ? `{ ${existing}, ${optionsContent} }` : `{ ${optionsContent} }`;
        ctorParts[ctorParts.length - 1] = merged;
        return part.slice(0, firstParen + 1) + ctorParts.join(', ') + ')';
      }
    }

    // No existing options — add one
    if (ctorArgs.trim()) {
      return part.slice(0, firstParen + 1) + ctorArgs + ', { ' + optionsContent + ' })';
    }
    return part.slice(0, firstParen + 1) + '{ ' + optionsContent + ' })';
  });

  return line.slice(0, openParen + 1) + mergedParts.join(', ') + line.slice(closeParen);
}

// ─── Smart split by commas (respects nesting) ────────────────────────
function smartSplit(s) {
  const parts = [];
  let depth = 0;
  let current = '';
  let inStr = false;
  let strChar = '';

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inStr) {
      current += ch;
      if (ch === strChar && s[i - 1] !== '\\') inStr = false;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = true;
      strChar = ch;
      current += ch;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') { depth++; current += ch; continue; }
    if (ch === ')' || ch === ']' || ch === '}') { depth--; current += ch; continue; }

    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }

    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

// ─── Should we add a semicolon? ──────────────────────────────────────
function shouldAddSemicolon(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return false;
  if (trimmed.endsWith('{') || trimmed.endsWith('}')) return false;
  if (trimmed.endsWith(',')) return false;
  if (trimmed.endsWith(';')) return false;
  if (trimmed.startsWith('import') || trimmed.startsWith('export')) return false;
  if (trimmed.startsWith('function') || trimmed.startsWith('async function')) return false;
  if (trimmed.startsWith('class')) return false;
  if (/^(if|else|for|while|switch|try|catch|finally)\b/.test(trimmed)) return false;
  return true;
}

// ─── Convert Python function params to TypeScript ────────────────────
function convertParams(params) {
  if (!params) return '';
  return params
    .split(',')
    .map(p => p.trim())
    .filter(p => p && p !== 'self')
    .map(p => {
      const [name, ...rest] = p.split('=');
      if (rest.length > 0) {
        return `${snakeToCamel(name.trim())} = ${rest.join('=')}`;
      }
      return snakeToCamel(name.trim());
    })
    .join(', ');
}

// ─── CLI ─────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
py2ts — Convert Python Manim scripts to ManimWeb TypeScript

Usage:
  node tools/py2ts.cjs <input.py> [output.ts]
  cat script.py | node tools/py2ts.cjs > output.ts

Options:
  --help, -h    Show this help
  --test        Run built-in test with sample Python Manim code
`);
    return;
  }

  if (args.includes('--test')) {
    runTest();
    return;
  }

  let input;
  if (args[0] && !args[0].startsWith('-')) {
    input = fs.readFileSync(args[0], 'utf-8');
  } else {
    // Read from stdin
    input = fs.readFileSync(0, 'utf-8');
  }

  const output = convertPythonToTypeScript(input);

  if (args[1]) {
    fs.writeFileSync(args[1], output, 'utf-8');
    console.error(`Written to ${args[1]}`);
  } else {
    console.log(output);
  }
}

// ─── Built-in test ───────────────────────────────────────────────────
function runTest() {
  const testPython = `
from manim import *

class SquareToCircle(Scene):
    def construct(self):
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)

        square = Square()
        square.rotate(PI / 4)

        self.play(Create(square))
        self.play(Transform(square, circle))
        self.play(FadeOut(square))

class MathEquation(Scene):
    def construct(self):
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-2, 2, 1],
            x_length=8,
            y_length=6,
            axis_config={"include_numbers": True}
        )

        graph = axes.get_graph(lambda x: x**2, color=BLUE)
        graph_label = axes.get_graph_label(graph, label="x^2")

        self.play(Create(axes))
        self.play(Create(graph), Write(graph_label))
        self.wait(2)

class TextScene(Scene):
    def construct(self):
        text = Text("Hello, Manim!", font_size=72, color=YELLOW)
        equation = MathTex(r"e^{i\\\\pi} + 1 = 0")

        self.play(Write(text))
        self.wait(1)
        self.play(ReplacementTransform(text, equation))
        self.wait(2)

class FancyAnimation(Scene):
    def construct(self):
        dots = VGroup(*[
            Dot(radius=0.1, color=BLUE).shift(RIGHT * i * 0.5)
            for i in range(10)
        ])

        self.play(LaggedStart(*[
            FadeIn(dot, shift=UP * 0.3)
            for dot in dots
        ], lag_ratio=0.1))

        self.play(dots.animate.shift(UP * 2))
        self.wait(1)
`;

  console.log('═══ Python Input ═══');
  console.log(testPython);
  console.log('\n═══ TypeScript Output ═══');
  console.log(convertPythonToTypeScript(testPython));
}

main();
