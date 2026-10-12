// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  defineParametrizedScene,
  resolveProps,
  renderParametrized,
  propsFromUrl,
  type DataFetcher,
} from './parametrized';
import type { Scene } from '../core/Scene';

/**
 * Parametrized scenes run headless with an injected fetcher, so these tests
 * never touch a DOM or the network. They cover the props validator (input over
 * defaults, coercion, fallback), the pre-render metadata hook (size/fps/data
 * overrides) and the shareable URL output.
 */

interface BarProps {
  label: string;
  value: number;
  visible: boolean;
  origin: [number, number, number];
  tags: string[];
  options: Record<string, unknown>;
}

const defaultProps: BarProps = {
  label: 'A',
  value: 1,
  visible: true,
  origin: [0, 0, 0],
  tags: ['x'],
  options: { a: 1 },
};

/** A fetcher that fails the test if it is ever called with a real URL. */
const neverFetch: DataFetcher = () => {
  throw new Error('fetch must not be called');
};

describe('resolveProps - validator', () => {
  const def = defineParametrizedScene<BarProps>({ defaultProps, build: () => undefined });

  it('merges input over defaults, input wins', () => {
    const props = resolveProps(def, { label: 'B', value: 42 });
    expect(props.label).toBe('B');
    expect(props.value).toBe(42);
  });

  it('falls back to defaults for missing props', () => {
    const props = resolveProps(def, { value: 7 });
    expect(props.label).toBe('A');
    expect(props.visible).toBe(true);
    expect(props.origin).toEqual([0, 0, 0]);
  });

  it('ignores unknown keys (closed schema)', () => {
    const props = resolveProps(def, { nope: 'x', value: 2 } as Record<string, unknown>);
    expect(props).not.toHaveProperty('nope');
    expect(props.value).toBe(2);
  });

  it('coerces a numeric string to a number', () => {
    expect(resolveProps(def, { value: '5' }).value).toBe(5);
  });

  it('falls back when a number cannot be coerced', () => {
    expect(resolveProps(def, { value: 'not-a-number' }).value).toBe(1);
    expect(resolveProps(def, { value: {} }).value).toBe(1);
  });

  it('coerces boolean-like strings and numbers', () => {
    expect(resolveProps(def, { visible: 'false' }).visible).toBe(false);
    expect(resolveProps(def, { visible: 'true' }).visible).toBe(true);
    expect(resolveProps(def, { visible: 0 }).visible).toBe(false);
  });

  it('coerces a number to a string for a string prop', () => {
    expect(resolveProps(def, { label: 3 }).label).toBe('3');
  });

  it('keeps a valid vec3 and rejects a malformed one', () => {
    expect(resolveProps(def, { origin: [1, 2, 3] }).origin).toEqual([1, 2, 3]);
    expect(resolveProps(def, { origin: [1, 2] }).origin).toEqual([0, 0, 0]);
  });

  it('rejects a non-array for an array prop and a non-object for an object prop', () => {
    expect(resolveProps(def, { tags: 'x' }).tags).toEqual(['x']);
    expect(resolveProps(def, { options: 5 }).options).toEqual({ a: 1 });
  });

  it('honors an explicit schema tag over the inferred one', () => {
    const schemaDef = defineParametrizedScene<{ n: number }>({
      defaultProps: { n: 0 },
      schema: { n: 'string' },
      build: () => undefined,
    });
    // tagged as string, so a number is stringified rather than kept numeric
    expect(resolveProps(schemaDef, { n: 10 }).n).toBe('10');
  });

  it('is deterministic and does not mutate the defaults', () => {
    const before = JSON.stringify(defaultProps);
    resolveProps(def, { value: 99, label: 'Z' });
    expect(JSON.stringify(defaultProps)).toBe(before);
  });
});

describe('renderParametrized - build + metadata', () => {
  it('passes resolved props and undefined data to build when no metadata hook', async () => {
    let seen: { props?: BarProps; data?: unknown; scene?: Scene } = {};
    const def = defineParametrizedScene<BarProps>({
      defaultProps,
      build: (scene, props, data) => {
        seen = { props, data, scene };
      },
    });
    const result = await renderParametrized(def, { value: 9 });
    expect(seen.props?.value).toBe(9);
    expect(seen.props?.label).toBe('A');
    expect(seen.data).toBeUndefined();
    expect(seen.scene).toBe(result.scene);
    expect(result.data).toBeUndefined();
  });

  it('metadata overrides width/height/fps on the scene', async () => {
    const def = defineParametrizedScene<BarProps>({
      defaultProps,
      calculateMetadata: () => ({ width: 1920, height: 1080, fps: 50, duration: 4 }),
      build: () => undefined,
    });
    const result = await renderParametrized(def, {}, { fetch: neverFetch });
    expect(result.scene.renderer.width).toBe(1920);
    expect(result.scene.renderer.height).toBe(1080);
    expect(result.scene.getTargetFps()).toBe(50);
    expect(result.metadata).toEqual({ duration: 4, width: 1920, height: 1080, fps: 50 });
  });

  it('fetched data from the injected fetcher reaches build', async () => {
    const fetchStub = vi.fn<DataFetcher>(async (url) => {
      expect(url).toBe('/api/series/B');
      return { points: [1, 2, 3] };
    });
    let built: unknown;
    const def = defineParametrizedScene<BarProps, { points: number[] }>({
      defaultProps,
      calculateMetadata: async ({ props, fetch }) => {
        const data = (await fetch(`/api/series/${props.label}`)) as { points: number[] };
        return { data };
      },
      build: (_scene, _props, data) => {
        built = data;
      },
    });
    const result = await renderParametrized(def, { label: 'B' }, { fetch: fetchStub });
    expect(fetchStub).toHaveBeenCalledOnce();
    expect(built).toEqual({ points: [1, 2, 3] });
    expect(result.data).toEqual({ points: [1, 2, 3] });
  });

  it('metadata.props override the input props (and are validated)', async () => {
    const def = defineParametrizedScene<BarProps>({
      defaultProps,
      calculateMetadata: ({ props }) => ({ props: { value: props.value + 100 } }),
      build: () => undefined,
    });
    const result = await renderParametrized(def, { value: 5 }, { fetch: neverFetch });
    expect(result.props.value).toBe(105);
  });

  it('builds into a supplied scene instead of a fresh one', async () => {
    const { Scene: SceneClass } = await import('../core/Scene');
    const scene = SceneClass.createHeadless({ width: 640, height: 360 });
    const def = defineParametrizedScene<BarProps>({
      defaultProps,
      calculateMetadata: () => ({ width: 800, height: 600 }),
      build: () => undefined,
    });
    const result = await renderParametrized(def, {}, { scene, fetch: neverFetch });
    expect(result.scene).toBe(scene);
    expect(scene.renderer.width).toBe(800);
    expect(scene.renderer.height).toBe(600);
  });

  it('exposes the resolved props as a shareable URL hash', async () => {
    const def = defineParametrizedScene<BarProps>({ defaultProps, build: () => undefined });
    const result = await renderParametrized(def, { label: 'Q', value: 3 });
    expect(result.url).toMatch(/^[A-Za-z0-9_-]+$/);
    const { decodeStateFromHash } = await import('./urlState');
    expect(decodeStateFromHash(result.url)).toMatchObject({ label: 'Q', value: 3 });
  });

  it('does not touch the network when a fetcher is injected', async () => {
    const def = defineParametrizedScene<BarProps>({
      defaultProps,
      calculateMetadata: async ({ fetch }) => ({ data: await fetch('/x') }),
      build: () => undefined,
    });
    const fetchStub = vi.fn<DataFetcher>(async () => ({ ok: true }));
    await renderParametrized(def, {}, { fetch: fetchStub });
    expect(fetchStub).toHaveBeenCalledOnce();
  });
});

describe('propsFromUrl - headless', () => {
  it('returns the defaults when there is no DOM/URL', () => {
    const def = defineParametrizedScene<BarProps>({ defaultProps, build: () => undefined });
    expect(propsFromUrl(def)).toEqual(defaultProps);
  });
});
