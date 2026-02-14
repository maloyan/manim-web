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
});
