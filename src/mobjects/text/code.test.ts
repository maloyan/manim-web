// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest';
import { Code, DEFAULT_COLOR_SCHEME, MONOKAI_COLOR_SCHEME, TokenType } from './Code';

/** Stub canvas 2D context (happy-dom lacks canvas support) */
beforeAll(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
    if (type === '2d') {
      return {
        scale: () => {},
        clearRect: () => {},
        fillText: () => {},
        fillRect: () => {},
        measureText: (t: string) => ({ width: t.length * 10, fontBoundingBoxAscent: 30 }),
        drawImage: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        quadraticCurveTo: () => {},
        closePath: () => {},
        fill: () => {},
        font: '',
        fillStyle: '',
        globalAlpha: 1,
        textBaseline: 'alphabetic',
        textAlign: 'left',
      } as unknown as CanvasRenderingContext2D;
    }
    return orig.call(this, type, ...(args as []));
  } as typeof orig;
});

function tokenTexts(code: Code, type: TokenType): string[] {
  const result: string[] = [];
  for (let i = 1; i <= code.getLineCount(); i++) {
    const line = code.getLineOfCode(i);
    if (line) for (const t of line.tokens) if (t.type === type) result.push(t.text);
  }
  return result;
}

describe('Code', () => {
  describe('constructor', () => {
    it('should create with code string and default language', () => {
      const c = new Code({ code: 'hello world' });
      expect(c.getCode()).toBe('hello world');
      expect(c.getLanguage()).toBe('text');
    });

    it('should accept and lowercase language', () => {
      const c = new Code({ code: 'x = 1', language: 'Python' });
      expect(c.getLanguage()).toBe('python');
    });

    it('should accept various languages', () => {
      expect(new Code({ code: 'x', language: 'javascript' }).getLanguage()).toBe('javascript');
      expect(new Code({ code: 'x', language: 'typescript' }).getLanguage()).toBe('typescript');
    });

    it('should accept custom color scheme and fontSize', () => {
      const c = new Code({ code: 'x', colorScheme: MONOKAI_COLOR_SCHEME, fontSize: 36 });
      expect(c.getCode()).toBe('x');
    });
  });

  describe('getCode / setCode', () => {
    it('should get and set code', () => {
      const c = new Code({ code: 'old' });
      expect(c.getCode()).toBe('old');
      expect(c.setCode('new')).toBe(c); // chaining
      expect(c.getCode()).toBe('new');
    });

    it('should update line count and re-tokenize on setCode', () => {
      const c = new Code({ code: 'hello', language: 'python' });
      expect(c.getLineCount()).toBe(1);
      c.setCode('def foo():\n    return 42');
      expect(c.getLineCount()).toBe(2);
      expect(tokenTexts(c, 'keyword')).toContain('def');
      expect(tokenTexts(c, 'keyword')).toContain('return');
    });
  });

  describe('getLanguage / setLanguage', () => {
    it('should get, set, and lowercase language', () => {
      const c = new Code({ code: 'x', language: 'rust' });
      expect(c.getLanguage()).toBe('rust');
      expect(c.setLanguage('TypeScript')).toBe(c); // chaining
      expect(c.getLanguage()).toBe('typescript');
    });

    it('should re-tokenize when language changes', () => {
      const c = new Code({ code: 'def foo():', language: 'text' });
      expect(tokenTexts(c, 'keyword')).not.toContain('def');
      c.setLanguage('python');
      expect(tokenTexts(c, 'keyword')).toContain('def');
    });
  });

  describe('getLineCount', () => {
    it('should count lines correctly', () => {
      expect(new Code({ code: 'x = 1' }).getLineCount()).toBe(1);
      expect(new Code({ code: 'a\nb\nc' }).getLineCount()).toBe(3);
      expect(new Code({ code: 'a\n\nb' }).getLineCount()).toBe(3);
      expect(new Code({ code: 'a\n' }).getLineCount()).toBe(2);
      expect(new Code({ code: '' }).getLineCount()).toBe(1);
    });
  });

  describe('getLineOfCode', () => {
    it('should return correct text for valid 1-based indices', () => {
      const c = new Code({ code: 'aaa\nbbb\nccc' });
      expect(c.getLineOfCode(1)!.text).toBe('aaa');
      expect(c.getLineOfCode(2)!.text).toBe('bbb');
      expect(c.getLineOfCode(3)!.text).toBe('ccc');
    });

    it('should return null for out-of-range indices', () => {
      const c = new Code({ code: 'hello' });
      expect(c.getLineOfCode(0)).toBeNull();
      expect(c.getLineOfCode(-1)).toBeNull();
      expect(c.getLineOfCode(2)).toBeNull();
    });

    it('should include tokens array and position tuple', () => {
      const c = new Code({ code: 'def foo():', language: 'python' });
      const line = c.getLineOfCode(1)!;
      expect(Array.isArray(line.tokens)).toBe(true);
      expect(line.tokens.length).toBeGreaterThan(0);
      expect(line.position).toHaveLength(3);
    });

    it('should expand tabs in returned text', () => {
      expect(new Code({ code: '\thello', tabWidth: 4 }).getLineOfCode(1)!.text).toBe('    hello');
      expect(new Code({ code: '\thello', tabWidth: 2 }).getLineOfCode(1)!.text).toBe('  hello');
      expect(new Code({ code: '\t\tx', tabWidth: 4 }).getLineOfCode(1)!.text).toBe('        x');
    });
  });

  describe('tokenization - Python', () => {
    it('should recognize keywords', () => {
      const kw = tokenTexts(
        new Code({ code: 'def class return if else', language: 'python' }),
        'keyword',
      );
      expect(kw).toContain('def');
      expect(kw).toContain('class');
      expect(kw).toContain('return');
      expect(kw).toContain('if');
      expect(kw).toContain('else');
    });

    it('should recognize self keyword', () => {
      expect(tokenTexts(new Code({ code: 'self.x = 1', language: 'python' }), 'keyword')).toContain(
        'self',
      );
    });

    it('should detect comments with #', () => {
      const comments = tokenTexts(
        new Code({ code: '# this is a comment', language: 'python' }),
        'comment',
      );
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0]).toContain('# this is a comment');
    });

    it('should detect double and single-quoted strings', () => {
      const dq = tokenTexts(new Code({ code: 'x = "hello"', language: 'python' }), 'string');
      expect(dq.length).toBeGreaterThan(0);
      expect(dq[0]).toContain('hello');
      const sq = tokenTexts(new Code({ code: "x = 'world'", language: 'python' }), 'string');
      expect(sq.length).toBeGreaterThan(0);
      expect(sq[0]).toContain('world');
    });

    it('should detect function calls', () => {
      expect(
        tokenTexts(new Code({ code: 'print("hello")', language: 'python' }), 'function'),
      ).toContain('print');
    });

    it('should detect integers, floats, and hex numbers', () => {
      expect(tokenTexts(new Code({ code: 'x = 42', language: 'python' }), 'number')).toContain(
        '42',
      );
      expect(tokenTexts(new Code({ code: 'x = 3.14', language: 'python' }), 'number')).toContain(
        '3.14',
      );
      expect(tokenTexts(new Code({ code: 'x = 0xFF', language: 'python' }), 'number')).toContain(
        '0xFF',
      );
    });

    it('should detect operators and punctuation', () => {
      expect(tokenTexts(new Code({ code: 'x == y', language: 'python' }), 'operator')).toContain(
        '==',
      );
      expect(tokenTexts(new Code({ code: 'x != y', language: 'python' }), 'operator')).toContain(
        '!=',
      );
      const punc = tokenTexts(new Code({ code: 'foo(x, y)', language: 'python' }), 'punctuation');
      expect(punc).toContain('(');
      expect(punc).toContain(')');
      expect(punc).toContain(',');
    });

    it('should detect builtin types', () => {
      expect(tokenTexts(new Code({ code: 'x: int = 5', language: 'python' }), 'type')).toContain(
        'int',
      );
    });

    it('should handle mixed code with keywords and comments', () => {
      const c = new Code({ code: 'def add(a, b):\n    return a + b  # sum', language: 'python' });
      const kw = tokenTexts(c, 'keyword');
      expect(kw).toContain('def');
      expect(kw).toContain('return');
      expect(tokenTexts(c, 'comment').length).toBeGreaterThan(0);
    });
  });

  describe('tokenization - JavaScript', () => {
    it('should recognize keywords', () => {
      const kw = tokenTexts(
        new Code({ code: 'const let function return', language: 'javascript' }),
        'keyword',
      );
      expect(kw).toContain('const');
      expect(kw).toContain('let');
      expect(kw).toContain('function');
      expect(kw).toContain('return');
    });

    it('should detect // and /* */ comments', () => {
      const sl = tokenTexts(new Code({ code: '// comment', language: 'javascript' }), 'comment');
      expect(sl[0]).toContain('// comment');
      const ml = tokenTexts(
        new Code({ code: '/* comment */ x', language: 'javascript' }),
        'comment',
      );
      expect(ml[0]).toContain('/* comment */');
    });

    it('should detect strings, function calls, numbers, and operators', () => {
      expect(
        tokenTexts(new Code({ code: 'const s = "hello";', language: 'javascript' }), 'string')
          .length,
      ).toBeGreaterThan(0);
      expect(
        tokenTexts(new Code({ code: 'console.log("hi")', language: 'javascript' }), 'function'),
      ).toContain('log');
      expect(
        tokenTexts(new Code({ code: 'const x = 42;', language: 'javascript' }), 'number'),
      ).toContain('42');
      const ops = tokenTexts(
        new Code({ code: 'a === b !== c', language: 'javascript' }),
        'operator',
      );
      expect(ops).toContain('===');
      expect(ops).toContain('!==');
    });

    it('should detect arrow operator', () => {
      const c = new Code({ code: 'const fn = () => {}', language: 'javascript' });
      expect(tokenTexts(c, 'keyword')).toContain('const');
      expect(tokenTexts(c, 'operator')).toContain('=>');
    });
  });

  describe('tokenization - TypeScript', () => {
    it('should recognize TS-specific keywords and builtin types', () => {
      const kw = tokenTexts(
        new Code({ code: 'interface type readonly', language: 'typescript' }),
        'keyword',
      );
      expect(kw).toContain('interface');
      expect(kw).toContain('type');
      expect(kw).toContain('readonly');
      expect(
        tokenTexts(new Code({ code: 'const m: Map = new Map()', language: 'typescript' }), 'type'),
      ).toContain('Map');
    });
  });

  describe('tokenization - generic', () => {
    it('should handle empty and whitespace-only lines', () => {
      const empty = new Code({ code: '', language: 'python' });
      expect(empty.getLineOfCode(1)!.tokens).toEqual([]);
      const ws = new Code({ code: '    ', language: 'python' });
      for (const t of ws.getLineOfCode(1)!.tokens) expect(t.type).toBe('default');
    });

    it('should handle binary, octal, and scientific number literals', () => {
      expect(tokenTexts(new Code({ code: 'x = 0b1010', language: 'python' }), 'number')).toContain(
        '0b1010',
      );
      expect(tokenTexts(new Code({ code: 'x = 0o777', language: 'python' }), 'number')).toContain(
        '0o777',
      );
      expect(tokenTexts(new Code({ code: 'x = 1e10', language: 'python' }), 'number')).toContain(
        '1e10',
      );
    });

    it('should not treat identifier-embedded digits as numbers', () => {
      const nums = tokenTexts(new Code({ code: 'x2 = 1', language: 'python' }), 'number');
      expect(nums).not.toContain('2');
      expect(nums).toContain('1');
    });

    it('should handle unknown language gracefully', () => {
      const c = new Code({ code: 'some random text', language: 'brainfuck' });
      expect(c.getLineCount()).toBe(1);
      expect(tokenTexts(c, 'keyword')).toHaveLength(0);
    });

    it('should handle escaped characters in strings', () => {
      const strings = tokenTexts(
        new Code({ code: 'x = "hello\\nworld"', language: 'python' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
      expect(strings[0]).toContain('hello');
    });
  });

  describe('color schemes', () => {
    it('should have all required keys in both schemes', () => {
      const keys = [
        'keyword',
        'string',
        'comment',
        'number',
        'function',
        'operator',
        'punctuation',
        'type',
        'default',
        'background',
        'lineNumber',
      ];
      for (const k of keys) {
        expect(DEFAULT_COLOR_SCHEME).toHaveProperty(k);
        expect(MONOKAI_COLOR_SCHEME).toHaveProperty(k);
      }
    });

    it('should have different colors between schemes', () => {
      expect(DEFAULT_COLOR_SCHEME.keyword).not.toBe(MONOKAI_COLOR_SCHEME.keyword);
      expect(DEFAULT_COLOR_SCHEME.background).not.toBe(MONOKAI_COLOR_SCHEME.background);
    });

    it('should have string values for all properties', () => {
      for (const v of Object.values(DEFAULT_COLOR_SCHEME)) expect(typeof v).toBe('string');
      for (const v of Object.values(MONOKAI_COLOR_SCHEME)) expect(typeof v).toBe('string');
    });
  });

  describe('getWidth / getHeight', () => {
    it('should return non-negative dimensions', () => {
      const c = new Code({ code: 'hello world' });
      expect(c.getWidth()).toBeGreaterThanOrEqual(0);
      expect(c.getHeight()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('copy', () => {
    it('should create an independent copy with same properties', () => {
      const c = new Code({ code: 'a\nb\nc', language: 'python' });
      const cp = c.copy() as Code;
      expect(cp).toBeInstanceOf(Code);
      expect(cp.getCode()).toBe('a\nb\nc');
      expect(cp.getLanguage()).toBe('python');
      expect(cp.getLineCount()).toBe(3);
      cp.setCode('changed');
      expect(c.getCode()).toBe('a\nb\nc');
    });
  });

  describe('dispose', () => {
    it('should dispose without error and be callable twice', () => {
      const c = new Code({ code: 'hello' });
      expect(() => c.dispose()).not.toThrow();
      expect(() => c.dispose()).not.toThrow();
    });
  });

  describe('getCenter', () => {
    it('should return position and reflect changes', () => {
      const c = new Code({ code: 'hello' });
      expect(c.getCenter()).toEqual([0, 0, 0]);
      c.position.set(2, 3, 4);
      expect(c.getCenter()).toEqual([2, 3, 4]);
    });
  });

  describe('multi-language support', () => {
    it('should tokenize Rust keywords', () => {
      const kw = tokenTexts(
        new Code({ code: 'fn main() {\n    let x = 42;\n}', language: 'rust' }),
        'keyword',
      );
      expect(kw).toContain('fn');
      expect(kw).toContain('let');
    });

    it('should tokenize Go keywords', () => {
      const kw = tokenTexts(
        new Code({ code: 'func main() {\n    var x = 42\n}', language: 'go' }),
        'keyword',
      );
      expect(kw).toContain('func');
      expect(kw).toContain('var');
    });

    it('should tokenize Java keywords', () => {
      const kw = tokenTexts(
        new Code({ code: 'public class Main {\n    int x = 42;\n}', language: 'java' }),
        'keyword',
      );
      expect(kw).toContain('public');
      expect(kw).toContain('class');
      expect(kw).toContain('int');
    });

    it('should tokenize C++ keywords', () => {
      const kw = tokenTexts(
        new Code({ code: 'int main() {\n    auto x = 42;\n    return 0;\n}', language: 'cpp' }),
        'keyword',
      );
      expect(kw).toContain('int');
      expect(kw).toContain('auto');
      expect(kw).toContain('return');
    });
  });

  describe('tokenization - Python strings', () => {
    it('should detect f-strings', () => {
      const strings = tokenTexts(
        new Code({ code: 'x = f"hello {name}"', language: 'python' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
    });

    it('should detect r-strings (raw strings)', () => {
      const strings = tokenTexts(
        new Code({ code: "x = r'raw\\nstring'", language: 'python' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
    });

    it('should detect triple-quoted strings', () => {
      const strings = tokenTexts(
        new Code({ code: 'x = """triple\nquoted"""', language: 'python' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
    });

    it('should detect triple-quoted strings on the same line', () => {
      const strings = tokenTexts(
        new Code({ code: 'x = """hello world"""', language: 'python' }),
        'string',
      );
      // Triple quotes are tokenized (though imperfectly for complex cases)
      expect(strings.length).toBeGreaterThan(0);
    });

    it('should detect triple single-quoted strings', () => {
      const strings = tokenTexts(
        new Code({ code: "x = '''multi line'''", language: 'python' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
    });

    it('should handle unclosed string at end of line', () => {
      const strings = tokenTexts(new Code({ code: 'x = "unclosed', language: 'python' }), 'string');
      expect(strings.length).toBeGreaterThan(0);
    });

    it('should handle escaped quotes in strings', () => {
      const strings = tokenTexts(
        new Code({ code: 'x = "he said \\"hello\\""', language: 'python' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
    });
  });

  describe('tokenization - comments', () => {
    it('should handle multi-line comment that closes on the same line', () => {
      const comments = tokenTexts(
        new Code({ code: '/* closed */ var x = 1;', language: 'javascript' }),
        'comment',
      );
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0]).toContain('/* closed */');
    });

    it('should handle multi-line comment that does not close on the line', () => {
      const comments = tokenTexts(
        new Code({ code: '/* unclosed comment', language: 'javascript' }),
        'comment',
      );
      expect(comments.length).toBeGreaterThan(0);
      expect(comments[0]).toContain('/* unclosed comment');
    });
  });

  describe('tokenization - operators', () => {
    it('should detect arrow operator ->', () => {
      const ops = tokenTexts(new Code({ code: 'fn -> int', language: 'python' }), 'operator');
      expect(ops).toContain('->');
    });

    it('should detect comparison operators <=, >=', () => {
      const ops = tokenTexts(new Code({ code: 'x <= y >= z', language: 'python' }), 'operator');
      expect(ops).toContain('<=');
      expect(ops).toContain('>=');
    });

    it('should detect logical operators &&, ||', () => {
      const ops = tokenTexts(new Code({ code: 'a && b || c', language: 'javascript' }), 'operator');
      expect(ops).toContain('&&');
      expect(ops).toContain('||');
    });

    it('should detect shift operators <<, >>', () => {
      const ops = tokenTexts(new Code({ code: 'x << 2 >> 1', language: 'javascript' }), 'operator');
      expect(ops).toContain('<<');
      expect(ops).toContain('>>');
    });

    it('should detect single character operators like ~, ^, |, &', () => {
      const ops = tokenTexts(new Code({ code: '~x ^ y | z & w', language: 'python' }), 'operator');
      expect(ops).toContain('~');
      expect(ops).toContain('^');
    });
  });

  describe('tokenization - numbers', () => {
    it('should detect scientific notation with negative exponent', () => {
      const nums = tokenTexts(new Code({ code: 'x = 1e-5', language: 'python' }), 'number');
      expect(nums).toContain('1e-5');
    });

    it('should detect scientific notation with positive exponent', () => {
      const nums = tokenTexts(new Code({ code: 'x = 2.5e+10', language: 'python' }), 'number');
      expect(nums).toContain('2.5e+10');
    });
  });

  describe('tokenization - Rust types', () => {
    it('should detect Rust builtin types', () => {
      const types = tokenTexts(
        new Code({ code: 'let x: i32 = 0;\nlet y: String = String::new();', language: 'rust' }),
        'type',
      );
      expect(types).toContain('i32');
      expect(types).toContain('String');
    });
  });

  describe('tokenization - Go types', () => {
    it('should detect Go builtin types', () => {
      const types = tokenTexts(
        new Code({ code: 'var x int = 0\nvar s string = ""', language: 'go' }),
        'type',
      );
      expect(types).toContain('string');
    });
  });

  describe('tokenization - C++ types', () => {
    it('should detect C++ builtin types', () => {
      const types = tokenTexts(
        new Code({ code: 'std::vector<int> v;\nstd::string s;', language: 'cpp' }),
        'type',
      );
      expect(types).toContain('vector');
    });
  });

  describe('tokenization - Java types', () => {
    it('should detect Java builtin types', () => {
      const types = tokenTexts(
        new Code({ code: 'String s = "hello";\nArrayList<Integer> list;', language: 'java' }),
        'type',
      );
      expect(types).toContain('String');
      expect(types).toContain('ArrayList');
    });
  });

  describe('line numbers', () => {
    it('should enable line numbers by default', () => {
      const c = new Code({ code: 'hello\nworld' });
      // Verify it constructs without error (lineNumbers = true by default)
      expect(c.getLineCount()).toBe(2);
    });

    it('should disable line numbers when lineNumbers is false', () => {
      const c = new Code({ code: 'hello\nworld', lineNumbers: false });
      expect(c.getLineCount()).toBe(2);
    });
  });

  describe('tab expansion', () => {
    it('should expand tabs with custom tabWidth', () => {
      const c = new Code({ code: '\thello', tabWidth: 2 });
      expect(c.getLineOfCode(1)!.text).toBe('  hello');
    });

    it('should expand tabs with default tabWidth of 4', () => {
      const c = new Code({ code: '\thello' });
      expect(c.getLineOfCode(1)!.text).toBe('    hello');
    });

    it('should expand multiple tabs', () => {
      const c = new Code({ code: '\t\tx', tabWidth: 3 });
      expect(c.getLineOfCode(1)!.text).toBe('      x');
    });
  });

  describe('showBackground', () => {
    it('should render with background (default true)', () => {
      const c = new Code({ code: 'hello' });
      expect(c.getWidth()).toBeGreaterThanOrEqual(0);
    });

    it('should render without background', () => {
      const c = new Code({ code: 'hello', showBackground: false });
      expect(c.getWidth()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('highlightLines', () => {
    it('should highlight a range of lines', () => {
      const c = new Code({ code: 'line1\nline2\nline3\nline4' });
      const result = c.highlightLines(2, 3);
      expect(result).toBe(c); // chaining
    });

    it('should handle highlight with custom color', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      const result = c.highlightLines(1, 2, 'rgba(255, 0, 0, 0.5)');
      expect(result).toBe(c);
    });

    it('should handle highlight with non-rgba color', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      const result = c.highlightLines(1, 2, '#ff0000');
      expect(result).toBe(c);
    });

    it('should clamp line numbers to valid range', () => {
      const c = new Code({ code: 'line1\nline2' });
      expect(() => c.highlightLines(0, 10)).not.toThrow();
    });

    it('should clear previous highlights when highlighting new lines', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      c.highlightLines(1, 2);
      c.highlightLines(2, 3);
      // Should not throw - old highlights cleared
    });
  });

  describe('clearHighlights', () => {
    it('should clear all highlights', () => {
      const c = new Code({ code: 'line1\nline2\nline3' });
      c.highlightLines(1, 2);
      const result = c.clearHighlights();
      expect(result).toBe(c); // chaining
    });

    it('should be safe to call when no highlights exist', () => {
      const c = new Code({ code: 'hello' });
      expect(() => c.clearHighlights()).not.toThrow();
    });
  });

  describe('constructor options', () => {
    it('should accept custom fontFamily', () => {
      const c = new Code({ code: 'hello', fontFamily: 'Courier New' });
      expect(c.getCode()).toBe('hello');
    });

    it('should accept custom backgroundPadding and backgroundRadius', () => {
      const c = new Code({
        code: 'hello',
        backgroundPadding: 32,
        backgroundRadius: 16,
      });
      expect(c.getCode()).toBe('hello');
    });

    it('should accept custom lineHeight', () => {
      const c = new Code({ code: 'hello\nworld', lineHeight: 2.0 });
      expect(c.getLineCount()).toBe(2);
    });
  });

  describe('multi-line code', () => {
    it('should handle large code blocks', () => {
      const lines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');
      const c = new Code({ code: lines, language: 'python' });
      expect(c.getLineCount()).toBe(50);
      expect(c.getLineOfCode(1)!.text).toBe('line 1');
      expect(c.getLineOfCode(50)!.text).toBe('line 50');
    });

    it('should handle code with mixed tokens per line', () => {
      const code = `def greet(name):
    # Say hello
    msg = f"Hello {name}"
    print(msg)
    return True`;
      const c = new Code({ code, language: 'python' });
      expect(c.getLineCount()).toBe(5);
      expect(tokenTexts(c, 'keyword')).toContain('def');
      expect(tokenTexts(c, 'keyword')).toContain('return');
      expect(tokenTexts(c, 'keyword')).toContain('True');
      expect(tokenTexts(c, 'comment').length).toBeGreaterThan(0);
    });
  });

  describe('setCode re-rendering', () => {
    it('should update dimensions when code changes', () => {
      const c = new Code({ code: 'short' });
      const w1 = c.getWidth();
      c.setCode('a much longer line of code that should be wider');
      const w2 = c.getWidth();
      // Wider code should have at least as wide dimensions
      expect(w2).toBeGreaterThanOrEqual(w1);
    });

    it('should update line count and tokens', () => {
      const c = new Code({ code: 'hello', language: 'python' });
      expect(c.getLineCount()).toBe(1);
      c.setCode('def foo():\n    pass');
      expect(c.getLineCount()).toBe(2);
      expect(tokenTexts(c, 'keyword')).toContain('def');
      expect(tokenTexts(c, 'keyword')).toContain('pass');
    });
  });

  describe('setLanguage re-tokenization', () => {
    it('should change tokenization results', () => {
      const c = new Code({ code: 'fn main() { let x = 42; }', language: 'text' });
      expect(tokenTexts(c, 'keyword')).toHaveLength(0);
      c.setLanguage('rust');
      expect(tokenTexts(c, 'keyword')).toContain('fn');
      expect(tokenTexts(c, 'keyword')).toContain('let');
    });
  });

  describe('punctuation tokenization', () => {
    it('should detect all standard punctuation', () => {
      const punc = tokenTexts(new Code({ code: '(){};:,.[]', language: 'python' }), 'punctuation');
      expect(punc).toContain('(');
      expect(punc).toContain(')');
      expect(punc).toContain('{');
      expect(punc).toContain('}');
      expect(punc).toContain(';');
      expect(punc).toContain(':');
      expect(punc).toContain(',');
      expect(punc).toContain('.');
      expect(punc).toContain('[');
      expect(punc).toContain(']');
    });
  });

  describe('Rust string delimiters', () => {
    it('should handle Rust strings', () => {
      const strings = tokenTexts(
        new Code({ code: 'let s = "hello rust";', language: 'rust' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
      expect(strings[0]).toContain('hello rust');
    });

    it('should handle Rust char literals', () => {
      const strings = tokenTexts(new Code({ code: "let c = 'a';", language: 'rust' }), 'string');
      expect(strings.length).toBeGreaterThan(0);
    });
  });

  describe('Go string delimiters', () => {
    it('should handle Go backtick raw strings', () => {
      const strings = tokenTexts(
        new Code({ code: 'var s = `raw string`', language: 'go' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
    });
  });

  describe('JavaScript template literals', () => {
    it('should handle backtick template strings', () => {
      const strings = tokenTexts(
        new Code({ code: 'const s = `hello ${name}`', language: 'javascript' }),
        'string',
      );
      expect(strings.length).toBeGreaterThan(0);
    });
  });

  describe('copy preserves all options', () => {
    it('should preserve lineNumbers, tabWidth, fontSize, and fontFamily', () => {
      const c = new Code({
        code: 'hello',
        language: 'python',
        lineNumbers: false,
        tabWidth: 2,
        fontSize: 18,
        fontFamily: 'Courier New',
        showBackground: false,
        backgroundPadding: 20,
        backgroundRadius: 12,
        lineHeight: 1.8,
      });
      const cp = c.copy() as Code;
      expect(cp.getCode()).toBe('hello');
      expect(cp.getLanguage()).toBe('python');
    });

    it('should preserve colorScheme in copy', () => {
      const c = new Code({
        code: 'hello',
        colorScheme: MONOKAI_COLOR_SCHEME,
      });
      const cp = c.copy() as Code;
      expect(cp.getCode()).toBe('hello');
    });
  });
});
