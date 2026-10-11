// No `@vitest-environment` docblock: this file runs in the default Node
// environment, where `HTMLElement` and `customElements` are undefined. It
// proves the module is import-safe for SSR / Node and that registration is a
// no-op there. A thrown error at import would fail the whole file.
import { describe, it, expect } from 'vitest';
import { registerManimElement, ManimSceneElement } from './webcomponent';

describe('webcomponent — Node / SSR safety', () => {
  it('runs in an environment without DOM globals', () => {
    expect(typeof HTMLElement).toBe('undefined');
    expect(typeof customElements).toBe('undefined');
  });

  it('exports are importable without throwing', () => {
    expect(registerManimElement).toBeTypeOf('function');
    expect(ManimSceneElement).toBeTypeOf('function');
  });

  it('registerManimElement is a safe no-op without a custom element registry', () => {
    expect(() => registerManimElement()).not.toThrow();
    expect(() => registerManimElement('manim-scene-node')).not.toThrow();
  });
});
