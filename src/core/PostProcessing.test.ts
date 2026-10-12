// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { Scene } from './Scene';
import {
  PostProcessingPipeline,
  setPostProcessingModules,
  setPostProcessingModulesLoader,
  type PostProcessingModules,
} from './PostProcessing';

// ---------------------------------------------------------------------------
// Fakes: record what the pipeline does without any real GPU / three example
// modules. Mirrors the stubbing style of Scene-multi-camera.test.ts.
// ---------------------------------------------------------------------------

interface ComposerCalls {
  render: number;
  setSize: Array<[number, number]>;
  setPixelRatio: number[];
  passes: Array<{ kind: string; [k: string]: unknown }>;
  disposed: number;
}

function makeFakeModules(): { modules: PostProcessingModules; calls: ComposerCalls } {
  const calls: ComposerCalls = {
    render: 0,
    setSize: [],
    setPixelRatio: [],
    passes: [],
    disposed: 0,
  };

  class FakeComposer {
    setSize(w: number, h: number): void {
      calls.setSize.push([w, h]);
    }
    setPixelRatio(r: number): void {
      calls.setPixelRatio.push(r);
    }
    addPass(pass: { kind: string }): void {
      calls.passes.push(pass);
    }
    render(): void {
      calls.render++;
    }
    dispose(): void {
      calls.disposed++;
    }
  }

  const modules = {
    EffectComposer: FakeComposer,
    RenderPass: class {
      kind = 'render';
      constructor(
        public scene: unknown,
        public camera: unknown,
      ) {}
    },
    UnrealBloomPass: class {
      kind = 'bloom';
      constructor(
        public resolution: unknown,
        public strength: number,
        public radius: number,
        public threshold: number,
      ) {}
    },
    ShaderPass: class {
      kind = 'shader';
      uniforms: Record<string, { value: unknown }> = {
        tDiffuse: { value: null },
        offset: { value: 0 },
        darkness: { value: 0 },
      };
      constructor(public shader: unknown) {}
    },
    OutputPass: class {
      kind = 'output';
    },
    BokehPass: class {
      kind = 'bokeh';
      constructor(
        public scene: unknown,
        public camera: unknown,
        public params: { focus: number; aperture: number; maxblur: number },
      ) {}
    },
  } as unknown as PostProcessingModules;

  return { modules, calls };
}

function fakeThreeRenderer(contextLost = false): THREE.WebGLRenderer {
  return {
    getPixelRatio: () => 2,
    getContext: () => ({ isContextLost: () => contextLost }),
  } as unknown as THREE.WebGLRenderer;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();

afterEach(() => {
  setPostProcessingModules(null);
  setPostProcessingModulesLoader(null);
});

// ---------------------------------------------------------------------------
// Pass configuration storage
// ---------------------------------------------------------------------------

describe('PostProcessingPipeline pass configuration', () => {
  it('stores a bloom pass with the configured params', () => {
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom({ strength: 2, radius: 0.1, threshold: 0.5 });
    expect(pipeline.getPassConfigs()).toEqual([
      { type: 'bloom', strength: 2, radius: 0.1, threshold: 0.5 },
    ]);
  });

  it('applies bloom defaults for omitted params', () => {
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    expect(pipeline.getPassConfigs()).toEqual([
      { type: 'bloom', strength: 1, radius: 0.4, threshold: 0.85 },
    ]);
  });

  it('stores vignette and dof passes in insertion order', () => {
    const pipeline = new PostProcessingPipeline();
    pipeline.addVignette({ offset: 0.8, darkness: 1.2 }).addDepthOfField({ focus: 5 });
    expect(pipeline.getPassConfigs()).toEqual([
      { type: 'vignette', offset: 0.8, darkness: 1.2 },
      { type: 'dof', focus: 5, aperture: 0.025, maxblur: 0.01 },
    ]);
  });

  it('clear() drops all configured passes', () => {
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom().addVignette();
    pipeline.clear();
    expect(pipeline.getPassConfigs()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Render routing
// ---------------------------------------------------------------------------

describe('PostProcessingPipeline.render', () => {
  it('returns false when no passes are configured (fall back to direct)', () => {
    const { modules } = makeFakeModules();
    setPostProcessingModules(modules);
    const pipeline = new PostProcessingPipeline();
    const drew = pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    expect(drew).toBe(false);
  });

  it('routes through composer.render() when modules are available and enabled', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    const drew = pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    expect(drew).toBe(true);
    expect(calls.render).toBe(1);
    expect(calls.setSize).toContainEqual([800, 450]);
    expect(calls.setPixelRatio).toContain(2);
  });

  it('builds RenderPass first, then configured passes, then OutputPass', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom().addVignette();
    pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    expect(calls.passes.map((p) => p.kind)).toEqual(['render', 'bloom', 'shader', 'output']);
  });

  it('sets vignette uniforms from the configured params', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const pipeline = new PostProcessingPipeline();
    pipeline.addVignette({ offset: 0.7, darkness: 1.5 });
    pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    const shaderPass = calls.passes.find((p) => p.kind === 'shader') as unknown as {
      uniforms: Record<string, { value: unknown }>;
    };
    expect(shaderPass.uniforms.offset.value).toBe(0.7);
    expect(shaderPass.uniforms.darkness.value).toBe(1.5);
  });

  it('returns false when disabled (direct path restored)', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom().setEnabled(false);
    const drew = pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    expect(drew).toBe(false);
    expect(calls.render).toBe(0);
  });

  it('returns false while modules are still loading (no synchronous cache)', () => {
    // A never-resolving loader keeps the cache empty, so the pipeline must
    // report it did not draw and the caller falls back to the direct path.
    setPostProcessingModulesLoader(() => new Promise<PostProcessingModules>(() => {}));
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    const drew = pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    expect(drew).toBe(false);
    expect(pipeline.isReady).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Resize + dispose
// ---------------------------------------------------------------------------

describe('PostProcessingPipeline resize and dispose', () => {
  it('setSize applies to the built composer', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    pipeline.setSize(1920, 1080);
    expect(calls.setSize).toContainEqual([1920, 1080]);
  });

  it('dispose() releases the composer', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    pipeline.render(fakeThreeRenderer(), scene, camera, 800, 450);
    pipeline.dispose();
    expect(calls.disposed).toBe(1);
    expect(pipeline.isReady).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Scene wiring: default path unchanged, opt-in routing, headless no-op
// ---------------------------------------------------------------------------

type SceneInternals = {
  _render(): void;
  _renderer: unknown;
};

function installFakeRenderer(
  target: Scene,
  threeRenderer: THREE.WebGLRenderer,
): ReturnType<typeof vi.fn> {
  const directRender = vi.fn();
  Object.defineProperty(target, '_renderer', {
    value: {
      getThreeRenderer: () => threeRenderer,
      width: 800,
      height: 450,
      render: directRender,
      resize: vi.fn(),
      dispose: vi.fn(),
      getCanvas: () => document.createElement('canvas'),
      backgroundOpacity: 1,
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(target, 'isHeadless', { value: false, configurable: true });
  return directRender;
}

describe('Scene post-processing wiring', () => {
  it('uses the direct render(scene, camera) path when no pipeline is attached', () => {
    const s = Scene.createHeadless();
    const directRender = installFakeRenderer(s, fakeThreeRenderer());
    expect(s.postProcessing).toBeNull();
    (s as unknown as SceneInternals)._render();
    expect(directRender).toHaveBeenCalledTimes(1);
  });

  it('routes through the composer when an enabled pipeline is attached', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const s = Scene.createHeadless();
    const directRender = installFakeRenderer(s, fakeThreeRenderer());
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    s.usePostProcessing(pipeline);
    directRender.mockClear();
    (s as unknown as SceneInternals)._render();
    expect(calls.render).toBeGreaterThanOrEqual(1);
    expect(directRender).not.toHaveBeenCalled();
  });

  it('falls back to the direct path when the pipeline is disabled', () => {
    const { modules } = makeFakeModules();
    setPostProcessingModules(modules);
    const s = Scene.createHeadless();
    const directRender = installFakeRenderer(s, fakeThreeRenderer());
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom().setEnabled(false);
    s.usePostProcessing(pipeline);
    directRender.mockClear();
    (s as unknown as SceneInternals)._render();
    expect(directRender).toHaveBeenCalledTimes(1);
  });

  it('is a no-op in headless mode (no WebGL): pipeline stored but never drawn', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const s = Scene.createHeadless();
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    s.usePostProcessing(pipeline);
    (s as unknown as SceneInternals)._render();
    expect(s.postProcessing).toBe(pipeline);
    expect(calls.render).toBe(0);
  });

  it('does not route when the WebGL context is lost', () => {
    const { modules, calls } = makeFakeModules();
    setPostProcessingModules(modules);
    const s = Scene.createHeadless();
    const directRender = installFakeRenderer(s, fakeThreeRenderer(true));
    const pipeline = new PostProcessingPipeline();
    pipeline.addBloom();
    s.usePostProcessing(pipeline);
    directRender.mockClear();
    (s as unknown as SceneInternals)._render();
    expect(calls.render).toBe(0);
    expect(directRender).toHaveBeenCalledTimes(1);
  });
});
