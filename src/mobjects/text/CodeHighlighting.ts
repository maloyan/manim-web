/**
 * Syntax highlighting types, color schemes, and tokenizer for the Code mobject.
 *
 * Language-specific data (keywords, types, comment patterns, string delimiters)
 * is defined in CodeLanguageData.ts.
 */

import {
  LANGUAGE_KEYWORDS,
  BUILTIN_TYPES,
  COMMENT_PATTERNS,
  STRING_DELIMITERS,
} from './CodeLanguageData';

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
 * Tokenize a single line of code for a given language.
 *
 * @param line - The source line to tokenize
 * @param language - The programming language (lowercase)
 * @returns Array of tokens with type and text
 */
export function tokenizeLine(line: string, language: string): Token[] {
  const tokens: Token[] = [];
  const keywords = LANGUAGE_KEYWORDS[language] || [];
  const types = BUILTIN_TYPES[language] || [];
  const commentPattern = COMMENT_PATTERNS[language] || { single: '#' };
  const stringDelims = STRING_DELIMITERS[language] || ['"', "'"];

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
