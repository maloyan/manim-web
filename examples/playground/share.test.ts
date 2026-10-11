import { describe, it, expect } from 'vitest';
import { encodeCode, decodeCode, codeToHash, codeFromHash } from './share';

describe('share link encoding', () => {
  it('round-trips simple code', () => {
    const code = 'const scene = new Scene(container);';
    expect(decodeCode(encodeCode(code))).toBe(code);
  });

  it('round-trips code with unicode, newlines and special characters', () => {
    const code = `// λ test\nconst x = "a+b&c=d";\nawait scene.play(/* ) */);\n`;
    expect(decodeCode(encodeCode(code))).toBe(code);
  });

  it('produces a URL-safe hash and reads it back', () => {
    const code = 'await scene.play(new Create(circle));\n// a + b & c';
    const hash = codeToHash(code);
    expect(hash.startsWith('#code=')).toBe(true);
    expect(hash).not.toContain(' ');
    expect(codeFromHash(hash)).toBe(code);
  });

  it('reads a hash without the leading #', () => {
    const code = 'const s = 1;';
    const hash = codeToHash(code).slice(1);
    expect(codeFromHash(hash)).toBe(code);
  });

  it('finds the code segment among other hash params', () => {
    const code = 'const s = 1;';
    const encoded = encodeCode(code);
    expect(codeFromHash(`#theme=dark&code=${encoded}`)).toBe(code);
  });

  it('returns null for an empty or missing value', () => {
    expect(decodeCode('')).toBeNull();
    expect(codeFromHash('')).toBeNull();
    expect(codeFromHash('#')).toBeNull();
    expect(codeFromHash('#other=1')).toBeNull();
  });
});
