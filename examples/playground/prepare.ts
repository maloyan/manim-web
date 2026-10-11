// Code-preparation helpers for the playground.
//
// The playground injects every manim-web export into the scope of the user's
// code, so `import` statements are not needed at runtime. The user may still
// write them (they document what a real project would import) and may use
// TypeScript syntax. `prepareCode` removes the module statements and strips the
// TypeScript types with the lightweight sucrase transpiler, leaving plain
// JavaScript that runs inside an async function body.
import { transform } from 'sucrase';

/** Remove ESM `import` statements (named, default, namespace, side-effect). */
export function stripImports(code: string): string {
  return code
    .replace(/import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*;?/g, '')
    .replace(/import\s+['"][^'"]+['"]\s*;?/g, '');
}

/** Remove a leading `export` modifier so declarations run in a function body. */
export function stripExports(code: string): string {
  return code.replace(
    /^\s*export\s+(?=(?:default\s+)?(?:const|let|var|function|class|async|abstract|interface|type|enum))/gm,
    '',
  );
}

/**
 * Turn playground source (TypeScript or JavaScript, with or without imports)
 * into plain JavaScript ready to run inside an async function body.
 */
export function prepareCode(source: string): string {
  const withoutModules = stripExports(stripImports(source));
  const { code } = transform(withoutModules, { transforms: ['typescript'] });
  return code;
}
