import { describe, it, expect } from 'vitest';
import { stripImports, stripExports, prepareCode } from './prepare';

describe('stripImports', () => {
  it('removes a single-line named import', () => {
    const out = stripImports(`import { Scene, Circle } from 'manim-web';\nconst x = 1;`);
    expect(out).not.toContain('import');
    expect(out).toContain('const x = 1;');
  });

  it('removes a multi-line named import', () => {
    const src = `import {\n  Scene,\n  Circle,\n} from 'manim-web';\nconst x = 1;`;
    const out = stripImports(src);
    expect(out).not.toContain('import');
    expect(out).toContain('const x = 1;');
  });

  it('removes namespace, default and side-effect imports', () => {
    const src = [
      `import * as manim from 'manim-web';`,
      `import Scene from 'manim-web';`,
      `import './styles.css';`,
      `const x = 1;`,
    ].join('\n');
    const out = stripImports(src);
    expect(out).not.toContain('import');
    expect(out).toContain('const x = 1;');
  });
});

describe('stripExports', () => {
  it('removes a leading export modifier', () => {
    expect(stripExports('export const x = 1;').trim()).toBe('const x = 1;');
    expect(stripExports('export function f() {}').trim()).toBe('function f() {}');
  });
});

describe('prepareCode', () => {
  it('strips imports and TypeScript types, keeping runnable JS', () => {
    const src = `import { Scene } from 'manim-web';\nconst f = (x: number): number => x * 2;\nconst s: string = 'a';`;
    const out = prepareCode(src);
    expect(out).not.toContain('import');
    expect(out).not.toContain(': number');
    expect(out).not.toContain(': string');
    expect(out).toContain('const f = (x) => x * 2;');
  });

  it('keeps await and plain JavaScript intact', () => {
    const out = prepareCode(`await scene.play(new Create(c));`);
    expect(out).toContain('await scene.play(new Create(c));');
  });

  it('transpiles to code that runs inside an async function body', async () => {
    const asyncFn = Object.getPrototypeOf(async () => {}).constructor;
    const body = prepareCode(
      `import { x } from 'y';\nconst add = (a: number, b: number): number => a + b;\nreturn add(2, 3);`,
    );
    const fn = new asyncFn(body);
    await expect(fn()).resolves.toBe(5);
  });
});
