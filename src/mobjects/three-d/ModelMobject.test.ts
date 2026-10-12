/**
 * Tests for ModelMobject (3D model import).
 *
 * ManimCE cannot import external 3D models. manim-web adds this via Three.js
 * loaders. Every test injects a mock loader (through the `loader` option or
 * `setModelLoaderFactory`) so no test touches the network or a real asset, and
 * the suite runs in the default Node environment to prove the code is SSR-safe.
 */
import * as THREE from 'three';
import { describe, it, expect, afterEach } from 'vitest';
import { ThreeDScene } from '../../core/ThreeDScene';
import {
  ModelMobject,
  setModelLoaderFactory,
  detectModelFormat,
  type ModelLoader,
  type ModelFormat,
} from './ModelMobject';
import {
  setMtlLoaderFactory,
  deriveMtlUrl,
  deriveBasePath,
  type MtlLoader,
  type MtlMaterials,
  type ObjMaterialSink,
} from './objMaterials';

/** Build a small fake loaded model: a Group holding one unit-box mesh. */
function makeModel(): THREE.Group {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: '#ffffff' }),
  );
  group.add(mesh);
  return group;
}

/** A loader stub that records the URLs it was asked for and never hits a network. */
class MockLoader implements ModelLoader {
  calls: string[] = [];

  constructor(
    private readonly factory: () => THREE.Object3D | { scene: THREE.Object3D },
    private readonly shouldReject = false,
  ) {}

  async loadAsync(url: string): Promise<THREE.Object3D | { scene: THREE.Object3D }> {
    this.calls.push(url);
    if (this.shouldReject) throw new Error('boom');
    return this.factory();
  }
}

afterEach(() => {
  setModelLoaderFactory(null);
  setMtlLoaderFactory(null);
});

// ── MTL stubs for OBJ material/texture tests ──────────────────────────

/** A preloaded MTL material set holding one representative material. */
class StubMtlMaterials implements MtlMaterials {
  preloaded = false;
  readonly material = new THREE.MeshStandardMaterial({ color: '#123456' });

  preload(): void {
    this.preloaded = true;
  }
}

/** A stub MTLLoader that records path handling and never hits a network. */
class StubMtlLoader implements MtlLoader {
  path = '';
  resourcePath = '';
  loadedUrl: string | null = null;
  readonly materials = new StubMtlMaterials();

  setPath(path: string): MtlLoader {
    this.path = path;
    return this;
  }

  setResourcePath(path: string): MtlLoader {
    this.resourcePath = path;
    return this;
  }

  async loadAsync(url: string): Promise<MtlMaterials> {
    this.loadedUrl = url;
    return this.materials;
  }
}

/** A stub OBJLoader that accepts MTL materials and applies them to its mesh. */
class StubObjLoader implements ModelLoader, ObjMaterialSink {
  calls: string[] = [];
  setMaterialsArg: MtlMaterials | null = null;
  materialsPreloadedAtSet = false;
  setMaterialsBeforeLoad = false;
  private loaded = false;

  setMaterials(materials: MtlMaterials): void {
    this.setMaterialsArg = materials;
    this.materialsPreloadedAtSet = (materials as StubMtlMaterials).preloaded;
    this.setMaterialsBeforeLoad = !this.loaded;
  }

  async loadAsync(url: string): Promise<THREE.Object3D> {
    this.loaded = true;
    this.calls.push(url);
    const group = makeModel();
    const applied = this.setMaterialsArg;
    if (applied instanceof StubMtlMaterials) {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.material = applied.material;
      });
    }
    return group;
  }
}

describe('ModelMobject.detectModelFormat', () => {
  it('maps extensions to loader formats', () => {
    expect(detectModelFormat('a/b/model.glb')).toBe('gltf');
    expect(detectModelFormat('model.gltf')).toBe('gltf');
    expect(detectModelFormat('./scene.obj?v=3#frag')).toBe('obj');
    expect(detectModelFormat('HTTPS://X/MODEL.GLB')).toBe('gltf');
  });

  it('throws on an unsupported extension', () => {
    expect(() => detectModelFormat('model.stl')).toThrow(/unsupported/i);
  });
});

describe('ModelMobject.fromUrl loader selection', () => {
  it('selects the loader by file extension', async () => {
    const formats: ModelFormat[] = [];
    setModelLoaderFactory((format) => {
      formats.push(format);
      return new MockLoader(makeModel);
    });
    await ModelMobject.fromUrl('https://x/model.glb');
    await ModelMobject.fromUrl('/a/b.gltf');
    await ModelMobject.fromUrl('./c.obj?v=2');
    expect(formats).toEqual(['gltf', 'gltf', 'obj']);
  });

  it('uses the injected loader and never hits the network', async () => {
    const loader = new MockLoader(makeModel);
    const mobject = await ModelMobject.fromUrl('model.obj', { loader });
    expect(loader.calls).toEqual(['model.obj']);
    expect(mobject).toBeInstanceOf(ModelMobject);
    expect(mobject.getFormat()).toBe('obj');
  });

  it('unwraps a GLTF-style { scene } result', async () => {
    const scene = makeModel();
    const mobject = await ModelMobject.fromUrl('m.glb', {
      loader: new MockLoader(() => ({ scene })),
    });
    expect(mobject.getObject()).toBe(scene);
  });

  it('rejects an unsupported extension before loading', async () => {
    await expect(ModelMobject.fromUrl('model.stl')).rejects.toThrow(/unsupported/i);
  });
});

describe('ModelMobject hierarchy integration', () => {
  it('wraps the loaded Object3D into the mobject three hierarchy', async () => {
    const model = makeModel();
    const mobject = await ModelMobject.fromUrl('m.obj', { loader: new MockLoader(() => model) });
    const root = mobject.getThreeObject();
    expect(root).toBeInstanceOf(THREE.Object3D);
    let found = false;
    root.traverse((object) => {
      if (object === model) found = true;
    });
    expect(found).toBe(true);
  });

  it('propagates shift to the three object world transform', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', { loader: new MockLoader(makeModel) });
    mobject.shift([1, 2, 3]);
    const root = mobject.getThreeObject();
    expect(root.position.x).toBeCloseTo(1);
    expect(root.position.y).toBeCloseTo(2);
    expect(root.position.z).toBeCloseTo(3);
    root.updateMatrixWorld(true);
    const world = mobject.getObject().localToWorld(new THREE.Vector3(0, 0, 0));
    expect(world.x).toBeCloseTo(1);
    expect(world.y).toBeCloseTo(2);
    expect(world.z).toBeCloseTo(3);
  });

  it('propagates scale of the mobject onto the model', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', { loader: new MockLoader(makeModel) });
    mobject.scale(3);
    const root = mobject.getThreeObject();
    expect(root.scale.x).toBeCloseTo(3);
    expect(root.scale.y).toBeCloseTo(3);
    expect(root.scale.z).toBeCloseTo(3);
  });

  it('can be added to a headless ThreeDScene', async () => {
    const scene = new ThreeDScene(null, { headless: true });
    const mobject = await ModelMobject.fromUrl('m.obj', { loader: new MockLoader(makeModel) });
    expect(() => scene.add(mobject)).not.toThrow();
    expect(mobject.getThreeObject()).toBeInstanceOf(THREE.Object3D);
  });
});

describe('ModelMobject options', () => {
  it('applies a uniform scale option to the content', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(makeModel),
      scale: 2,
    });
    const root = mobject.getThreeObject();
    root.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(mobject.getObject()).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(2);
    expect(size.y).toBeCloseTo(2);
    expect(size.z).toBeCloseTo(2);
  });

  it('rotates a Z-up model onto the scene up (+Y)', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(makeModel),
      upAxis: 'z',
    });
    const root = mobject.getThreeObject();
    root.updateMatrixWorld(true);
    const world = mobject.getObject().localToWorld(new THREE.Vector3(0, 0, 1));
    expect(world.y).toBeCloseTo(1, 5);
    expect(world.z).toBeCloseTo(0, 5);
  });

  it('leaves a Y-up model unrotated', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(makeModel),
      upAxis: 'y',
    });
    const root = mobject.getThreeObject();
    root.updateMatrixWorld(true);
    const world = mobject.getObject().localToWorld(new THREE.Vector3(0, 1, 0));
    expect(world.y).toBeCloseTo(1, 5);
  });

  it('recenters the model to the origin', async () => {
    const offsetModel = (): THREE.Group => {
      const group = makeModel();
      group.position.set(3, 0, 0);
      return group;
    };
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(offsetModel),
      center: true,
    });
    const root = mobject.getThreeObject();
    root.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    expect(center.x).toBeCloseTo(0, 5);
    expect(center.y).toBeCloseTo(0, 5);
    expect(center.z).toBeCloseTo(0, 5);
  });

  it('applies a color to the model materials', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(makeModel),
      color: '#ff0000',
    });
    let checked = false;
    mobject.getObject().traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material as THREE.MeshStandardMaterial;
        expect(material.color.getHexString()).toBe('ff0000');
        checked = true;
      }
    });
    expect(checked).toBe(true);
  });

  it('applies a material override to every mesh', async () => {
    const override = new THREE.MeshBasicMaterial({ color: '#00ff00' });
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(makeModel),
      materialOverride: override,
    });
    let checked = false;
    mobject.getObject().traverse((object) => {
      if (object instanceof THREE.Mesh) {
        expect(object.material).toBe(override);
        checked = true;
      }
    });
    expect(checked).toBe(true);
  });
});

describe('ModelMobject error handling', () => {
  it('rejects when the loader fails', async () => {
    const loader = new MockLoader(makeModel, true);
    await expect(ModelMobject.fromUrl('m.obj', { loader })).rejects.toThrow(/boom/);
  });

  it('getLoadError is null after a successful load', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', { loader: new MockLoader(makeModel) });
    expect(mobject.getLoadError()).toBeNull();
  });

  it('captures the load error when throwOnError is false', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(makeModel, true),
      throwOnError: false,
    });
    expect(mobject.getLoadError()).toBeInstanceOf(Error);
    expect(mobject.getLoadError()?.message).toMatch(/boom/);
    // Still integrates as an (empty) mobject so a scene can hold it.
    expect(mobject.getThreeObject()).toBeInstanceOf(THREE.Object3D);
  });
});

describe('ModelMobject.copy', () => {
  it('copies into an independent instance preserving transform', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', {
      loader: new MockLoader(makeModel),
      scale: 2,
    });
    mobject.shift([1, 0, 0]);
    const copy = mobject.copy();
    expect(copy).toBeInstanceOf(ModelMobject);
    expect(copy).not.toBe(mobject);
    expect(copy.getObject()).not.toBe(mobject.getObject());
    expect(copy.position.x).toBeCloseTo(1);
  });
});

describe('objMaterials URL helpers', () => {
  it('derives the companion .mtl URL from an .obj URL', () => {
    expect(deriveMtlUrl('https://x/models/scene.obj')).toBe('https://x/models/scene.mtl');
    expect(deriveMtlUrl('./c.OBJ?v=2#f')).toBe('./c.mtl');
    expect(deriveMtlUrl('bare.obj')).toBe('bare.mtl');
  });

  it('derives the base directory path from a URL', () => {
    expect(deriveBasePath('https://x/models/scene.mtl')).toBe('https://x/models/');
    expect(deriveBasePath('scene.mtl')).toBe('');
    expect(deriveBasePath('./a/b/c.mtl?q=1')).toBe('./a/b/');
  });
});

describe('ModelMobject OBJ + MTL materials', () => {
  it('loads the derived .mtl and applies it before the OBJ parse', async () => {
    const mtlLoader = new StubMtlLoader();
    const objLoader = new StubObjLoader();
    const mobject = await ModelMobject.fromUrl('https://x/models/scene.obj', {
      loader: objLoader,
      mtlLoader,
      loadMaterials: true,
    });

    expect(mtlLoader.loadedUrl).toBe('scene.mtl');
    expect(mtlLoader.path).toBe('https://x/models/');
    expect(mtlLoader.resourcePath).toBe('https://x/models/');
    expect(objLoader.setMaterialsArg).toBe(mtlLoader.materials);
    expect(objLoader.materialsPreloadedAtSet).toBe(true);
    expect(objLoader.setMaterialsBeforeLoad).toBe(true);

    let checked = false;
    mobject.getObject().traverse((object) => {
      if (object instanceof THREE.Mesh) {
        expect(object.material).toBe(mtlLoader.materials.material);
        checked = true;
      }
    });
    expect(checked).toBe(true);
  });

  it('uses an explicit mtlUrl and derives its own base path', async () => {
    const mtlLoader = new StubMtlLoader();
    const objLoader = new StubObjLoader();
    await ModelMobject.fromUrl('https://x/a/model.obj', {
      loader: objLoader,
      mtlLoader,
      mtlUrl: 'https://x/b/custom.mtl',
    });

    expect(mtlLoader.loadedUrl).toBe('custom.mtl');
    expect(mtlLoader.path).toBe('https://x/b/');
    expect(mtlLoader.resourcePath).toBe('https://x/b/');
  });

  it('resolves the MTLLoader through setMtlLoaderFactory', async () => {
    const mtlLoader = new StubMtlLoader();
    let factoryCalls = 0;
    setMtlLoaderFactory(() => {
      factoryCalls += 1;
      return mtlLoader;
    });
    const objLoader = new StubObjLoader();
    await ModelMobject.fromUrl('scene.obj', {
      loader: objLoader,
      loadMaterials: true,
    });

    expect(factoryCalls).toBe(1);
    expect(mtlLoader.loadedUrl).toBe('scene.mtl');
    expect(objLoader.setMaterialsArg).toBe(mtlLoader.materials);
  });

  it('does not load any MTL without mtlUrl or loadMaterials (backward compat)', async () => {
    let factoryCalls = 0;
    setMtlLoaderFactory(() => {
      factoryCalls += 1;
      return new StubMtlLoader();
    });
    const objLoader = new StubObjLoader();
    await ModelMobject.fromUrl('scene.obj', { loader: objLoader });

    expect(factoryCalls).toBe(0);
    expect(objLoader.setMaterialsArg).toBeNull();
  });

  it('never loads an MTL for a glTF model', async () => {
    const mtlLoader = new StubMtlLoader();
    await ModelMobject.fromUrl('https://x/model.glb', {
      loader: new MockLoader(makeModel),
      mtlLoader,
      loadMaterials: true,
    });
    expect(mtlLoader.loadedUrl).toBeNull();
  });

  it('lets materialOverride win over the MTL materials', async () => {
    const override = new THREE.MeshBasicMaterial({ color: '#00ff00' });
    const mtlLoader = new StubMtlLoader();
    const objLoader = new StubObjLoader();
    const mobject = await ModelMobject.fromUrl('scene.obj', {
      loader: objLoader,
      mtlLoader,
      loadMaterials: true,
      materialOverride: override,
    });

    let checked = false;
    mobject.getObject().traverse((object) => {
      if (object instanceof THREE.Mesh) {
        expect(object.material).toBe(override);
        checked = true;
      }
    });
    expect(checked).toBe(true);
  });

  it('skips MTL loading when the OBJ loader cannot accept materials', async () => {
    const mtlLoader = new StubMtlLoader();
    const mobject = await ModelMobject.fromUrl('scene.obj', {
      loader: new MockLoader(makeModel),
      mtlLoader,
      loadMaterials: true,
    });
    expect(mtlLoader.loadedUrl).toBeNull();
    expect(mobject).toBeInstanceOf(ModelMobject);
  });
});

describe('ModelMobject node-safety', () => {
  it('loads with no DOM globals present', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', { loader: new MockLoader(makeModel) });
    expect(mobject.getObject()).toBeDefined();
    expect(mobject.getFormat()).toBe('obj');
  });
});
