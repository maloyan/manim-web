import * as THREE from 'three';
import { VMobject } from '../../core/VMobject';
import { Vector3Tuple } from '../../core/Mobject';

/**
 * Token types for syntax highlighting
 */
export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'function'
  | 'operator'
  | 'punctuation'
  | 'type'
  | 'default';

/**
 * A token with its type and text
 */
export interface Token {
  type: TokenType;
  text: string;
}

/**
 * Color scheme for syntax highlighting
 */
export interface CodeColorScheme {
  keyword: string;
  string: string;
  comment: string;
  number: string;
  function: string;
  operator: string;
  punctuation: string;
  type: string;
  default: string;
  background: string;
  lineNumber: string;
}

/**
 * Default color scheme (VS Code dark theme inspired)
 */
export const DEFAULT_COLOR_SCHEME: CodeColorScheme = {
  keyword: '#569cd6', // Blue
  string: '#6a9955', // Green
  comment: '#6a9955', // Gray-green (comments)
  number: '#b5cea8', // Light green (numbers)
  function: '#dcdcaa', // Yellow
  operator: '#d4d4d4', // Light gray
  punctuation: '#d4d4d4', // Light gray
  type: '#4ec9b0', // Cyan
  default: '#d4d4d4', // White/light gray
  background: '#1e1e1e', // Dark background
  lineNumber: '#858585', // Gray for line numbers
};

/**
 * Monokai color scheme
 */
export const MONOKAI_COLOR_SCHEME: CodeColorScheme = {
  keyword: '#f92672', // Pink
  string: '#e6db74', // Yellow
  comment: '#75715e', // Gray
  number: '#ae81ff', // Purple
  function: '#a6e22e', // Green
  operator: '#f8f8f2', // White
  punctuation: '#f8f8f2', // White
  type: '#66d9ef', // Cyan
  default: '#f8f8f2', // White
  background: '#272822', // Dark background
  lineNumber: '#75715e', // Gray
};

/**
 * Language keywords for tokenization
 */
const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  python: [
    'False',
    'None',
    'True',
    'and',
    'as',
    'assert',
    'async',
    'await',
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'try',
    'while',
    'with',
    'yield',
    'self',
    'cls',
  ],
  javascript: [
    'async',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'null',
    'return',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'undefined',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'of',
    'from',
  ],
  typescript: [
    'abstract',
    'any',
    'as',
    'async',
    'await',
    'boolean',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'constructor',
    'continue',
    'debugger',
    'declare',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'from',
    'function',
    'get',
    'if',
    'implements',
    'import',
    'in',
    'infer',
    'instanceof',
    'interface',
    'is',
    'keyof',
    'let',
    'module',
    'namespace',
    'never',
    'new',
    'null',
    'number',
    'object',
    'of',
    'package',
    'private',
    'protected',
    'public',
    'readonly',
    'return',
    'set',
    'static',
    'string',
    'super',
    'switch',
    'symbol',
    'this',
    'throw',
    'true',
    'try',
    'type',
    'typeof',
    'undefined',
    'unique',
    'unknown',
    'var',
    'void',
    'while',
    'with',
    'yield',
  ],
  java: [
    'abstract',
    'assert',
    'boolean',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'continue',
    'default',
    'do',
    'double',
    'else',
    'enum',
    'extends',
    'final',
    'finally',
    'float',
    'for',
    'goto',
    'if',
    'implements',
    'import',
    'instanceof',
    'int',
    'interface',
    'long',
    'native',
    'new',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'short',
    'static',
    'strictfp',
    'super',
    'switch',
    'synchronized',
    'this',
    'throw',
    'throws',
    'transient',
    'try',
    'void',
    'volatile',
    'while',
    'true',
    'false',
    'null',
  ],
  rust: [
    'as',
    'async',
    'await',
    'break',
    'const',
    'continue',
    'crate',
    'dyn',
    'else',
    'enum',
    'extern',
    'false',
    'fn',
    'for',
    'if',
    'impl',
    'in',
    'let',
    'loop',
    'match',
    'mod',
    'move',
    'mut',
    'pub',
    'ref',
    'return',
    'self',
    'Self',
    'static',
    'struct',
    'super',
    'trait',
    'true',
    'type',
    'unsafe',
    'use',
    'where',
    'while',
  ],
  go: [
    'break',
    'case',
    'chan',
    'const',
    'continue',
    'default',
    'defer',
    'else',
    'fallthrough',
    'for',
    'func',
    'go',
    'goto',
    'if',
    'import',
    'interface',
    'map',
    'package',
    'range',
    'return',
    'select',
    'struct',
    'switch',
    'type',
    'var',
    'true',
    'false',
    'nil',
    'iota',
  ],
  cpp: [
    'alignas',
    'alignof',
    'and',
    'and_eq',
    'asm',
    'auto',
    'bitand',
    'bitor',
    'bool',
    'break',
    'case',
    'catch',
    'char',
    'char8_t',
    'char16_t',
    'char32_t',
    'class',
    'compl',
    'concept',
    'const',
    'consteval',
    'constexpr',
    'const_cast',
    'continue',
    'co_await',
    'co_return',
    'co_yield',
    'decltype',
    'default',
    'delete',
    'do',
    'double',
    'dynamic_cast',
    'else',
    'enum',
    'explicit',
    'export',
    'extern',
    'false',
    'float',
    'for',
    'friend',
    'goto',
    'if',
    'inline',
    'int',
    'long',
    'mutable',
    'namespace',
    'new',
    'noexcept',
    'not',
    'not_eq',
    'nullptr',
    'operator',
    'or',
    'or_eq',
    'private',
    'protected',
    'public',
    'register',
    'reinterpret_cast',
    'requires',
    'return',
    'short',
    'signed',
    'sizeof',
    'static',
    'static_assert',
    'static_cast',
    'struct',
    'switch',
    'template',
    'this',
    'thread_local',
    'throw',
    'true',
    'try',
    'typedef',
    'typeid',
    'typename',
    'union',
    'unsigned',
    'using',
    'virtual',
    'void',
    'volatile',
    'wchar_t',
    'while',
    'xor',
    'xor_eq',
  ],
};

/**
 * Built-in type names for various languages
 */
const BUILTIN_TYPES: Record<string, string[]> = {
  python: ['int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'type', 'object'],
  javascript: [
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Function',
    'Symbol',
    'Promise',
    'Map',
    'Set',
  ],
  typescript: [
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Function',
    'Symbol',
    'Promise',
    'Map',
    'Set',
    'Partial',
    'Required',
    'Pick',
    'Omit',
    'Record',
  ],
  java: [
    'String',
    'Integer',
    'Boolean',
    'Double',
    'Float',
    'Long',
    'Character',
    'Object',
    'List',
    'Map',
    'Set',
    'ArrayList',
    'HashMap',
  ],
  rust: [
    'i8',
    'i16',
    'i32',
    'i64',
    'i128',
    'u8',
    'u16',
    'u32',
    'u64',
    'u128',
    'f32',
    'f64',
    'bool',
    'char',
    'str',
    'String',
    'Vec',
    'Option',
    'Result',
    'Box',
  ],
  go: [
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'uint',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'float32',
    'float64',
    'complex64',
    'complex128',
    'bool',
    'string',
    'byte',
    'rune',
    'error',
  ],
  cpp: [
    'string',
    'vector',
    'map',
    'set',
    'unordered_map',
    'unordered_set',
    'array',
    'list',
    'deque',
    'queue',
    'stack',
    'pair',
    'tuple',
    'unique_ptr',
    'shared_ptr',
  ],
};

/**
 * Comment patterns for various languages
 */
const COMMENT_PATTERNS: Record<string, { single: string; multiStart?: string; multiEnd?: string }> =
  {
    python: { single: '#' },
    javascript: { single: '//', multiStart: '/*', multiEnd: '*/' },
    typescript: { single: '//', multiStart: '/*', multiEnd: '*/' },
    java: { single: '//', multiStart: '/*', multiEnd: '*/' },
    rust: { single: '//', multiStart: '/*', multiEnd: '*/' },
    go: { single: '//', multiStart: '/*', multiEnd: '*/' },
    cpp: { single: '//', multiStart: '/*', multiEnd: '*/' },
  };

/**
 * String delimiters for various languages
 */
const STRING_DELIMITERS: Record<string, string[]> = {
  python: ['"', "'", '"""', "'''", 'f"', "f'", 'r"', "r'"],
  javascript: ['"', "'", '`'],
  typescript: ['"', "'", '`'],
  java: ['"', "'"],
  rust: ['"', "'"],
  go: ['"', "'", '`'],
  cpp: ['"', "'"],
};

/**
 * Options for creating a Code mobject
 */
export interface CodeOptions {
  /** The code string to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Whether to show line numbers. Default: true */
  lineNumbers?: boolean;
  /** Tab width in spaces. Default: 4 */
  tabWidth?: number;
  /** Font size in pixels. Default: 24 */
  fontSize?: number;
  /** Font family. Default: 'monospace' */
  fontFamily?: string;
  /** Color scheme for syntax highlighting */
  colorScheme?: CodeColorScheme;
  /** Whether to show background rectangle. Default: true */
  showBackground?: boolean;
  /** Background padding in pixels. Default: 16 */
  backgroundPadding?: number;
  /** Background corner radius in pixels. Default: 8 */
  backgroundRadius?: number;
  /** Line height multiplier. Default: 1.4 */
  lineHeight?: number;
}

/** Scale factor: pixels to world units (100 pixels = 1 world unit) */
const PIXEL_TO_WORLD = 1 / 100;

/** Resolution multiplier for crisp text on retina displays */
const RESOLUTION_SCALE = 2;

/**
 * Code - A syntax-highlighted code block mobject
 *
 * Renders code with syntax highlighting using Canvas 2D to a texture.
 * Supports multiple programming languages with customizable color schemes.
 *
 * @example
 * ```typescript
 * // Create Python code block
 * const pythonCode = new Code({
 *   code: `def hello():
 *     print("Hello, World!")`,
 *   language: 'python',
 * });
 *
 * // Create TypeScript code without line numbers
 * const tsCode = new Code({
 *   code: 'const x: number = 42;',
 *   language: 'typescript',
 *   lineNumbers: false,
 * });
 *
 * // Use Monokai color scheme
 * const monokaiCode = new Code({
 *   code: 'console.log("Hello");',
 *   language: 'javascript',
 *   colorScheme: MONOKAI_COLOR_SCHEME,
 * });
 * ```
 */
export class Code extends VMobject {
  protected _code: string;
  protected _language: string;
  protected _lineNumbers: boolean;
  protected _tabWidth: number;
  protected _fontSize: number;
  protected _fontFamily: string;
  protected _colorScheme: CodeColorScheme;
  protected _showBackground: boolean;
  protected _backgroundPadding: number;
  protected _backgroundRadius: number;
  protected _lineHeight: number;

  /** Off-screen canvas for code rendering */
  protected _canvas: HTMLCanvasElement | null = null;
  protected _ctx: CanvasRenderingContext2D | null = null;

  /** Three.js texture from canvas */
  protected _texture: THREE.CanvasTexture | null = null;

  /** Plane mesh for displaying the texture */
  protected _mesh: THREE.Mesh | null = null;

  /** Background mesh */
  protected _backgroundMesh: THREE.Mesh | null = null;

  /** Cached dimensions in world units */
  protected _worldWidth: number = 0;
  protected _worldHeight: number = 0;

  /** Parsed lines for later access */
  protected _lines: string[] = [];

  /** Tokenized lines for highlighting specific parts */
  protected _tokenizedLines: Token[][] = [];

  /** Highlight rectangles */
  protected _highlightMeshes: THREE.Mesh[] = [];

  constructor(options: CodeOptions) {
    super();

    const {
      code,
      language = 'text',
      lineNumbers = true,
      tabWidth = 4,
      fontSize = 24,
      fontFamily = 'monospace',
      colorScheme = DEFAULT_COLOR_SCHEME,
      showBackground = true,
      backgroundPadding = 16,
      backgroundRadius = 8,
      lineHeight = 1.4,
    } = options;

    this._code = code;
    this._language = language.toLowerCase();
    this._lineNumbers = lineNumbers;
    this._tabWidth = tabWidth;
    this._fontSize = fontSize;
    this._fontFamily = fontFamily;
    this._colorScheme = colorScheme;
    this._showBackground = showBackground;
    this._backgroundPadding = backgroundPadding;
    this._backgroundRadius = backgroundRadius;
    this._lineHeight = lineHeight;

    // Set default colors
    this.color = colorScheme.default;
    this.fillOpacity = 1;
    this.strokeWidth = 0;

    // Initialize canvas
    this._initCanvas();

    // Parse and tokenize code
    this._parseCode();
  }

  /**
   * Initialize the off-screen canvas
   */
  protected _initCanvas(): void {
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    if (!this._ctx) {
      throw new Error('Failed to get 2D context for code rendering');
    }
  }

  /**
   * Parse code into lines and tokenize
   */
  protected _parseCode(): void {
    // Expand tabs to spaces
    const expandedCode = this._code.replace(/\t/g, ' '.repeat(this._tabWidth));
    this._lines = expandedCode.split('\n');

    // Tokenize each line
    this._tokenizedLines = this._lines.map((line) => this._tokenizeLine(line));
  }

  /**
   * Tokenize a single line of code
   */
  protected _tokenizeLine(line: string): Token[] {
    const tokens: Token[] = [];
    const keywords = LANGUAGE_KEYWORDS[this._language] || [];
    const types = BUILTIN_TYPES[this._language] || [];
    const commentPattern = COMMENT_PATTERNS[this._language] || { single: '#' };
    const stringDelims = STRING_DELIMITERS[this._language] || ['"', "'"];

    let i = 0;
    while (i < line.length) {
      // Check for comments (single-line)
      if (line.substring(i).startsWith(commentPattern.single)) {
        tokens.push({ type: 'comment', text: line.substring(i) });
        break;
      }

      // Check for multi-line comment start (simplified - just highlights to end of line)
      if (commentPattern.multiStart && line.substring(i).startsWith(commentPattern.multiStart)) {
        const endIdx = line.indexOf(commentPattern.multiEnd!, i + commentPattern.multiStart.length);
        if (endIdx !== -1) {
          tokens.push({
            type: 'comment',
            text: line.substring(i, endIdx + commentPattern.multiEnd!.length),
          });
          i = endIdx + commentPattern.multiEnd!.length;
          continue;
        } else {
          tokens.push({ type: 'comment', text: line.substring(i) });
          break;
        }
      }

      // Check for strings
      let foundString = false;
      for (const delim of stringDelims) {
        if (line.substring(i).startsWith(delim)) {
          const actualDelim =
            delim.length > 1 && !delim.startsWith('f') && !delim.startsWith('r')
              ? delim
              : delim.slice(-1);
          const searchStart = i + delim.length;
          let endIdx = searchStart;

          // Find closing delimiter
          while (endIdx < line.length) {
            if (line[endIdx] === '\\' && endIdx + 1 < line.length) {
              endIdx += 2; // Skip escaped character
              continue;
            }
            if (delim.length === 3) {
              // Triple quotes
              if (line.substring(endIdx).startsWith(actualDelim.repeat(3))) {
                endIdx += 3;
                break;
              }
            } else if (line[endIdx] === actualDelim) {
              endIdx += 1;
              break;
            }
            endIdx++;
          }

          tokens.push({ type: 'string', text: line.substring(i, endIdx) });
          i = endIdx;
          foundString = true;
          break;
        }
      }
      if (foundString) continue;

      // Check for numbers
      const numberMatch = line
        .substring(i)
        .match(/^(0x[\da-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:e[+-]?\d+)?)/);
      if (numberMatch && (i === 0 || !/[\w]/.test(line[i - 1]))) {
        tokens.push({ type: 'number', text: numberMatch[0] });
        i += numberMatch[0].length;
        continue;
      }

      // Check for identifiers (keywords, functions, types)
      const identMatch = line.substring(i).match(/^[a-zA-Z_]\w*/);
      if (identMatch) {
        const ident = identMatch[0];
        let tokenType: TokenType = 'default';

        if (keywords.includes(ident)) {
          tokenType = 'keyword';
        } else if (types.includes(ident)) {
          tokenType = 'type';
        } else if (line.substring(i + ident.length).match(/^\s*\(/)) {
          // Function call (followed by parenthesis)
          tokenType = 'function';
        }

        tokens.push({ type: tokenType, text: ident });
        i += ident.length;
        continue;
      }

      // Check for operators
      const operatorMatch = line
        .substring(i)
        .match(/^(===|!==|==|!=|<=|>=|&&|\|\||<<|>>|->|=>|[+\-*/%&|^~<>!=])/);
      if (operatorMatch) {
        tokens.push({ type: 'operator', text: operatorMatch[0] });
        i += operatorMatch[0].length;
        continue;
      }

      // Check for punctuation
      if (/^[(){}[\];:,.]/.test(line[i])) {
        tokens.push({ type: 'punctuation', text: line[i] });
        i++;
        continue;
      }

      // Default: treat as regular text (including whitespace)
      tokens.push({ type: 'default', text: line[i] });
      i++;
    }

    return tokens;
  }

  /**
   * Get the code content
   */
  getCode(): string {
    return this._code;
  }

  /**
   * Set new code and re-render
   * @param code - New code to display
   * @returns this for chaining
   */
  setCode(code: string): this {
    this._code = code;
    this._parseCode();
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the language
   */
  getLanguage(): string {
    return this._language;
  }

  /**
   * Set language and re-render
   * @param language - Programming language
   * @returns this for chaining
   */
  setLanguage(language: string): this {
    this._language = language.toLowerCase();
    this._parseCode();
    this._renderToCanvas();
    this._updateMesh();
    this._markDirty();
    return this;
  }

  /**
   * Get the number of lines
   */
  getLineCount(): number {
    return this._lines.length;
  }

  /**
   * Get code width in world units
   */
  getWidth(): number {
    return this._worldWidth;
  }

  /**
   * Get code height in world units
   */
  getHeight(): number {
    return this._worldHeight;
  }

  /**
   * Get a specific line of code as a Text-like mobject representation
   * Returns position info for the specified line
   * @param lineNumber - 1-based line number
   * @returns Object with line info or null if out of range
   */
  getLineOfCode(
    lineNumber: number,
  ): { text: string; position: Vector3Tuple; tokens: Token[] } | null {
    const index = lineNumber - 1;
    if (index < 0 || index >= this._lines.length) {
      return null;
    }

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;

    // Calculate line position relative to code block
    const lineY = scaledPadding + (index + 0.5) * scaledLineHeight;
    const worldY = this._worldHeight / 2 - (lineY / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

    return {
      text: this._lines[index],
      position: [this.position.x, this.position.y + worldY, this.position.z],
      tokens: this._tokenizedLines[index],
    };
  }

  /**
   * Highlight a range of lines with a background color
   * @param startLine - Starting line number (1-based)
   * @param endLine - Ending line number (1-based, inclusive)
   * @param color - Highlight color. Default: semi-transparent yellow
   * @returns this for chaining
   */
  highlightLines(
    startLine: number,
    endLine: number,
    color: string = 'rgba(255, 255, 0, 0.3)',
  ): this {
    // Clear existing highlights
    this.clearHighlights();

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;

    // Clamp line numbers
    const start = Math.max(1, Math.min(startLine, this._lines.length));
    const end = Math.max(1, Math.min(endLine, this._lines.length));

    // Calculate highlight dimensions
    const highlightHeight =
      (((end - start + 1) * scaledLineHeight) / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    const highlightWidth = this._worldWidth - 2 * (this._backgroundPadding * PIXEL_TO_WORLD);

    // Calculate position
    const topY = this._worldHeight / 2 - (scaledPadding / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    const startY = topY - (((start - 0.5) * scaledLineHeight) / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    const centerY = startY - highlightHeight / 2;

    // Create highlight geometry
    const geometry = new THREE.PlaneGeometry(highlightWidth, highlightHeight);

    // Parse color
    const threeColor = new THREE.Color(color);
    let alpha = 0.3;
    const rgbaMatch = color.match(/rgba?\([\d.]+,\s*[\d.]+,\s*[\d.]+(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch && rgbaMatch[1]) {
      alpha = parseFloat(rgbaMatch[1]);
    }

    const material = new THREE.MeshBasicMaterial({
      color: threeColor,
      transparent: true,
      opacity: alpha,
      depthWrite: false,
    });

    const highlightMesh = new THREE.Mesh(geometry, material);
    highlightMesh.position.set(0, centerY - this._worldHeight / 2 + highlightHeight, 0.001);
    this._highlightMeshes.push(highlightMesh);

    if (this._threeObject) {
      this._threeObject.add(highlightMesh);
    }

    this._markDirty();
    return this;
  }

  /**
   * Clear all line highlights
   * @returns this for chaining
   */
  clearHighlights(): this {
    for (const mesh of this._highlightMeshes) {
      if (this._threeObject) {
        this._threeObject.remove(mesh);
      }
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this._highlightMeshes = [];
    return this;
  }

  /**
   * Build the CSS font string
   */
  protected _buildFontString(): string {
    const size = Math.round(this._fontSize * RESOLUTION_SCALE);
    return `${size}px ${this._fontFamily}`;
  }

  /**
   * Calculate the width needed for line numbers
   */
  protected _getLineNumberWidth(): number {
    if (!this._lineNumbers || !this._ctx) return 0;

    this._ctx.font = this._buildFontString();
    const maxLineNum = this._lines.length.toString();
    const metrics = this._ctx.measureText(maxLineNum);
    return metrics.width + 20 * RESOLUTION_SCALE; // Add padding
  }

  /**
   * Measure canvas dimensions needed
   */
  protected _measureCode(): { width: number; height: number } {
    if (!this._ctx) {
      return { width: 0, height: 0 };
    }

    this._ctx.font = this._buildFontString();

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;
    const lineNumberWidth = this._getLineNumberWidth();

    // Measure max line width
    let maxWidth = 0;
    for (const line of this._lines) {
      const metrics = this._ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }

    // Total dimensions
    const width = Math.ceil(lineNumberWidth + maxWidth + scaledPadding * 2);
    const height = Math.ceil(this._lines.length * scaledLineHeight + scaledPadding * 2);

    return { width, height };
  }

  /**
   * Render code to the off-screen canvas
   */
  protected _renderToCanvas(): void {
    if (!this._canvas || !this._ctx) {
      return;
    }

    const { width, height } = this._measureCode();

    // Resize canvas
    this._canvas.width = width || 1;
    this._canvas.height = height || 1;

    const scaledFontSize = this._fontSize * RESOLUTION_SCALE;
    const scaledLineHeight = scaledFontSize * this._lineHeight;
    const scaledPadding = this._backgroundPadding * RESOLUTION_SCALE;
    const lineNumberWidth = this._getLineNumberWidth();

    // Draw background if enabled
    if (this._showBackground) {
      this._ctx.fillStyle = this._colorScheme.background;
      const scaledRadius = this._backgroundRadius * RESOLUTION_SCALE;
      this._roundRect(0, 0, width, height, scaledRadius);
    } else {
      // Clear canvas (transparent background)
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    // Set font
    this._ctx.font = this._buildFontString();
    this._ctx.textBaseline = 'middle';

    // Draw each line
    for (let i = 0; i < this._lines.length; i++) {
      const y = scaledPadding + (i + 0.5) * scaledLineHeight;

      // Draw line number
      if (this._lineNumbers) {
        this._ctx.fillStyle = this._colorScheme.lineNumber;
        this._ctx.textAlign = 'right';
        const lineNum = (i + 1).toString();
        this._ctx.fillText(lineNum, lineNumberWidth - 10 * RESOLUTION_SCALE, y);
      }

      // Draw tokenized code
      this._ctx.textAlign = 'left';
      let x = lineNumberWidth + scaledPadding / 2;

      for (const token of this._tokenizedLines[i]) {
        this._ctx.fillStyle = this._colorScheme[token.type];
        this._ctx.fillText(token.text, x, y);
        x += this._ctx.measureText(token.text).width;
      }
    }

    // Store world dimensions
    this._worldWidth = (width / RESOLUTION_SCALE) * PIXEL_TO_WORLD;
    this._worldHeight = (height / RESOLUTION_SCALE) * PIXEL_TO_WORLD;

    // Update texture if it exists
    if (this._texture) {
      this._texture.needsUpdate = true;
    }
  }

  /**
   * Draw a rounded rectangle
   */
  protected _roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    if (!this._ctx) return;

    this._ctx.beginPath();
    this._ctx.moveTo(x + radius, y);
    this._ctx.lineTo(x + width - radius, y);
    this._ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this._ctx.lineTo(x + width, y + height - radius);
    this._ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this._ctx.lineTo(x + radius, y + height);
    this._ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this._ctx.lineTo(x, y + radius);
    this._ctx.quadraticCurveTo(x, y, x + radius, y);
    this._ctx.closePath();
    this._ctx.fill();
  }

  /**
   * Update the mesh geometry to match new dimensions
   */
  protected _updateMesh(): void {
    if (!this._mesh) return;

    // Dispose old geometry
    this._mesh.geometry.dispose();

    // Create new geometry with updated dimensions
    const geometry = new THREE.PlaneGeometry(this._worldWidth, this._worldHeight);
    this._mesh.geometry = geometry;
  }

  /**
   * Create the Three.js backing object
   */
  protected override _createThreeObject(): THREE.Object3D {
    const group = new THREE.Group();

    // Render code to canvas
    this._renderToCanvas();

    if (!this._canvas) {
      return group;
    }

    // Create texture from canvas
    this._texture = new THREE.CanvasTexture(this._canvas);
    this._texture.colorSpace = THREE.SRGBColorSpace;
    this._texture.minFilter = THREE.LinearFilter;
    this._texture.magFilter = THREE.LinearFilter;

    // Create material with transparency
    const material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Create plane geometry sized to match code
    const geometry = new THREE.PlaneGeometry(this._worldWidth, this._worldHeight);

    // Create mesh
    this._mesh = new THREE.Mesh(geometry, material);
    group.add(this._mesh);

    // Add existing highlights
    for (const highlightMesh of this._highlightMeshes) {
      group.add(highlightMesh);
    }

    return group;
  }

  /**
   * Sync material properties to Three.js
   */
  protected override _syncMaterialToThree(): void {
    // Re-render canvas with updated colors/opacity
    this._renderToCanvas();

    if (this._mesh) {
      const material = this._mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = this._opacity;
      }
    }
  }

  /**
   * Get the center of this code mobject
   */
  override getCenter(): Vector3Tuple {
    return [this.position.x, this.position.y, this.position.z];
  }

  /**
   * Create a copy of this Code mobject
   */
  protected override _createCopy(): Code {
    return new Code({
      code: this._code,
      language: this._language,
      lineNumbers: this._lineNumbers,
      tabWidth: this._tabWidth,
      fontSize: this._fontSize,
      fontFamily: this._fontFamily,
      colorScheme: { ...this._colorScheme },
      showBackground: this._showBackground,
      backgroundPadding: this._backgroundPadding,
      backgroundRadius: this._backgroundRadius,
      lineHeight: this._lineHeight,
    });
  }

  /**
   * Clean up Three.js and canvas resources
   */
  override dispose(): void {
    this._texture?.dispose();
    if (this._mesh) {
      this._mesh.geometry.dispose();
      (this._mesh.material as THREE.Material).dispose();
    }
    this.clearHighlights();
    this._canvas = null;
    this._ctx = null;
    super.dispose();
  }
}

export default Code;
