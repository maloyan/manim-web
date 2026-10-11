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
});

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

describe('ModelMobject node-safety', () => {
  it('loads with no DOM globals present', async () => {
    const mobject = await ModelMobject.fromUrl('m.obj', { loader: new MockLoader(makeModel) });
    expect(mobject.getObject()).toBeDefined();
    expect(mobject.getFormat()).toBe('obj');
  });
});
