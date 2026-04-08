import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const BROWSER_BUNDLE_PATH = resolve(__dirname, '../../dist/manim-web.browser.js');
const bundleExists = existsSync(BROWSER_BUNDLE_PATH);

describe.skipIf(!bundleExists)('Browser bundle', () => {
  it('should NOT contain bare import specifiers for "three"', () => {
    const content = readFileSync(BROWSER_BUNDLE_PATH, 'utf-8');
    // Match bare specifiers like: from "three" or from 'three'
    const bareThreeImports = content.match(/from\s+["']three["']/g);
    expect(bareThreeImports).toBeNull();
  });

  it('should export key symbols', async () => {
    const mod = await import(BROWSER_BUNDLE_PATH);
    expect(mod.Scene).toBeDefined();
    expect(mod.Circle).toBeDefined();
    expect(mod.Create).toBeDefined();
  });
});
