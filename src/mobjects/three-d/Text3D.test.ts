/**
 * Tests for Text3D (extruded / beveled 3D text).
 *
 * ManimCE has only flat Text / MathTex. manim-web adds true 3D depth+bevel text
 * through Three.js TextGeometry. TextGeometry needs a parsed typeface.json font,
 * which loads asynchronously, so the real path mirrors ModelMobject: the async
 * work (font load + example-module import) happens in the static factories, and
 * the mesh is built synchronously from injected dependencies.
 *
 * Every test injects a stub FontLoader and a recording geometry factory, so no
 * test fetches a real font or touches WebGL. The suite runs in the default Node
 * environment to prove the code is headless / SSR safe.
 */
import * as THREE from 'three';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { ThreeDScene } from '../../core/ThreeDScene';
import {
  Text3D,
  setFontLoaderFactory,
  setTextGeometryFactory,
  DEFAULT_FONT_URL,
  type ParsedFont,
  type Text3DGeometryParams,
  type TextGeometryFactory,
  type FontLoaderLike,
} from './Text3D';

/** A stand-in for a parsed typeface. Text3D treats the font as opaque. */
const FAKE_FONT: ParsedFont = { isFont: true, familyName: 'stub' };

/**
 * A geometry factory that records every (text, params) it is asked to build and
 * returns a plain BoxGeometry. The box stands in for the extruded geometry: it
 * is a real THREE.BufferGeometry but needs no font parsing and no GPU.
 */
function makeRecordingFactory(): {
  calls: Array<{ text: string; params: Text3DGeometryParams }>;
  built: THREE.BufferGeometry[];
  factory: TextGeometryFactory;
} {
  const calls: Array<{ text: string; params: Text3DGeometryParams }> = [];
  const built: THREE.BufferGeometry[] = [];
  const factory: TextGeometryFactory = (text, params) => {
    calls.push({ text, params });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    built.push(geometry);
    return geometry;
  };
  return { calls, built, factory };
}

/** A FontLoader stub that records the URLs it is asked for and never hits a network. */
class StubFontLoader implements FontLoaderLike {
  urls: string[] = [];

  constructor(private readonly font: ParsedFont = FAKE_FONT) {}

  async loadAsync(url: string): Promise<ParsedFont> {
    this.urls.push(url);
    return this.font;
  }
}

afterEach(() => {
  setFontLoaderFactory(null);
  setTextGeometryFactory(null);
});

describe('Text3D construction (headless-safe)', () => {
  it('constructs and builds its three object without a font, without throwing', () => {
    const text = new Text3D('Hi');
    let object: THREE.Object3D | undefined;
    expect(() => {
      object = text.getThreeObject();
    }).not.toThrow();
    expect(object).toBeInstanceOf(THREE.Object3D);
    // No font + no factory: a placeholder group, no mesh, no geometry build.
    expect(object).not.toBeInstanceOf(THREE.Mesh);
  });

  it('builds a mesh from the text once a font and factory are present', () => {
    const { calls, factory } = makeRecordingFactory();
    const text = new Text3D('Hello', { font: FAKE_FONT, geometryFactory: factory });
    const object = text.getThreeObject();
    expect(object).toBeInstanceOf(THREE.Mesh);
    expect(calls).toHaveLength(1);
    expect(calls[0].text).toBe('Hello');
    expect(calls[0].params.font).toBe(FAKE_FONT);
  });

  it('builds only buffer geometry and never a WebGL context', () => {
    const { factory } = makeRecordingFactory();
    const text = new Text3D('No GPU', { font: FAKE_FONT, geometryFactory: factory });
    const mesh = text.getThreeObject() as THREE.Mesh;
    expect(mesh.geometry).toBeInstanceOf(THREE.BufferGeometry);
  });
});

describe('Text3D extrude parameters', () => {
  it('passes depth, size, curveSegments and bevel options through to the factory', () => {
    const { calls, factory } = makeRecordingFactory();
    const text = new Text3D('Params', {
      font: FAKE_FONT,
      geometryFactory: factory,
      size: 2,
      depth: 0.5,
      curveSegments: 7,
      bevel: { enabled: true, thickness: 0.09, size: 0.04, segments: 5, offset: 0.01 },
    });
    text.getThreeObject();
    const params = calls[0].params;
    expect(params.size).toBe(2);
    expect(params.depth).toBe(0.5);
    expect(params.curveSegments).toBe(7);
    expect(params.bevelEnabled).toBe(true);
    expect(params.bevelThickness).toBe(0.09);
    expect(params.bevelSize).toBe(0.04);
    expect(params.bevelSegments).toBe(5);
    expect(params.bevelOffset).toBe(0.01);
  });

  it('defaults to a disabled bevel and a positive depth', () => {
    const { calls, factory } = makeRecordingFactory();
    const text = new Text3D('Defaults', { font: FAKE_FONT, geometryFactory: factory });
    text.getThreeObject();
    expect(calls[0].params.bevelEnabled).toBe(false);
    expect(calls[0].params.depth).toBeGreaterThan(0);
  });
});

describe('Text3D setters rebuild geometry', () => {
  it('setText rebuilds the geometry from the new text and disposes the old one', () => {
    const { calls, built, factory } = makeRecordingFactory();
    const text = new Text3D('Before', { font: FAKE_FONT, geometryFactory: factory });
    const mesh = text.getThreeObject() as THREE.Mesh;
    const firstGeometry = mesh.geometry;
    const disposeSpy = vi.spyOn(firstGeometry, 'dispose');

    text.setText('After');
    expect(calls).toHaveLength(2);
    expect(calls[1].text).toBe('After');
    expect(disposeSpy).toHaveBeenCalledTimes(1);
    expect(mesh.geometry).toBe(built[1]);
    expect(text.getText()).toBe('After');
  });

  it('setDepth and setSize rebuild with the new values', () => {
    const { calls, factory } = makeRecordingFactory();
    const text = new Text3D('Resize', { font: FAKE_FONT, geometryFactory: factory, depth: 0.2 });
    text.getThreeObject();
    text.setDepth(0.9);
    text.setSize(3);
    expect(calls).toHaveLength(3);
    expect(calls[1].params.depth).toBe(0.9);
    expect(calls[2].params.size).toBe(3);
    expect(text.getDepth()).toBe(0.9);
    expect(text.getSize()).toBe(3);
  });

  it('setText before the mesh exists still applies on first build', () => {
    const { calls, factory } = makeRecordingFactory();
    const text = new Text3D('Initial', { font: FAKE_FONT, geometryFactory: factory });
    text.setText('Changed');
    expect(calls).toHaveLength(0);
    text.getThreeObject();
    expect(calls).toHaveLength(1);
    expect(calls[0].text).toBe('Changed');
  });
});

describe('Text3D material', () => {
  it('applies the color to the mesh material', () => {
    const { factory } = makeRecordingFactory();
    const text = new Text3D('Red', {
      font: FAKE_FONT,
      geometryFactory: factory,
      color: '#ff0000',
    });
    const mesh = text.getThreeObject() as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.color.getHexString()).toBe('ff0000');
  });

  it('marks the material transparent when opacity is below one', () => {
    const { factory } = makeRecordingFactory();
    const text = new Text3D('Faded', {
      font: FAKE_FONT,
      geometryFactory: factory,
      opacity: 0.4,
    });
    const mesh = text.getThreeObject() as THREE.Mesh;
    const material = mesh.material as THREE.MeshStandardMaterial;
    expect(material.opacity).toBeCloseTo(0.4);
    expect(material.transparent).toBe(true);
  });
});

describe('Text3D disposal', () => {
  it('frees both the geometry and the material', () => {
    const { factory } = makeRecordingFactory();
    const text = new Text3D('Dispose', { font: FAKE_FONT, geometryFactory: factory });
    const mesh = text.getThreeObject() as THREE.Mesh;
    const geometrySpy = vi.spyOn(mesh.geometry, 'dispose');
    const material = mesh.material as THREE.MeshStandardMaterial;
    const materialSpy = vi.spyOn(material, 'dispose');

    text.dispose();
    expect(geometrySpy).toHaveBeenCalledTimes(1);
    expect(materialSpy).toHaveBeenCalledTimes(1);
  });
});

describe('Text3D.fromUrl (async font load)', () => {
  it('loads the default font URL and builds through the injected loader', async () => {
    const { calls, factory } = makeRecordingFactory();
    const loader = new StubFontLoader();
    const text = await Text3D.fromUrl('Loaded', { fontLoader: loader, geometryFactory: factory });
    expect(text).toBeInstanceOf(Text3D);
    expect(loader.urls).toEqual([DEFAULT_FONT_URL]);
    text.getThreeObject();
    expect(calls[0].params.font).toBe(FAKE_FONT);
  });

  it('honors an explicit fontUrl', async () => {
    const { factory } = makeRecordingFactory();
    const loader = new StubFontLoader();
    await Text3D.fromUrl('Custom', {
      fontUrl: 'https://x/fonts/myfont.typeface.json',
      fontLoader: loader,
      geometryFactory: factory,
    });
    expect(loader.urls).toEqual(['https://x/fonts/myfont.typeface.json']);
  });

  it('resolves the FontLoader through setFontLoaderFactory', async () => {
    const { factory } = makeRecordingFactory();
    const loader = new StubFontLoader();
    let factoryCalls = 0;
    setFontLoaderFactory(() => {
      factoryCalls += 1;
      return loader;
    });
    const text = await Text3D.fromUrl('Seam', { geometryFactory: factory });
    expect(factoryCalls).toBe(1);
    expect(text.getThreeObject()).toBeInstanceOf(THREE.Mesh);
  });

  it('resolves the geometry factory through setTextGeometryFactory', async () => {
    const { calls, factory } = makeRecordingFactory();
    setTextGeometryFactory(factory);
    const loader = new StubFontLoader();
    const text = await Text3D.fromUrl('GeomSeam', { fontLoader: loader });
    text.getThreeObject();
    expect(calls).toHaveLength(1);
    expect(calls[0].text).toBe('GeomSeam');
  });
});

describe('Text3D.fromFont (parsed font injection)', () => {
  it('builds from an already-parsed font using the injected geometry factory', async () => {
    const { calls, factory } = makeRecordingFactory();
    const text = await Text3D.fromFont('Parsed', FAKE_FONT, { geometryFactory: factory });
    text.getThreeObject();
    expect(calls[0].params.font).toBe(FAKE_FONT);
    expect(calls[0].text).toBe('Parsed');
  });
});

describe('Text3D scene integration', () => {
  it('can be added to a headless ThreeDScene', () => {
    const { factory } = makeRecordingFactory();
    const scene = new ThreeDScene(null, { headless: true });
    const text = new Text3D('Scene', { font: FAKE_FONT, geometryFactory: factory });
    expect(() => scene.add(text)).not.toThrow();
    expect(text.getThreeObject()).toBeInstanceOf(THREE.Object3D);
  });

  it('propagates a shift to the three object world transform', () => {
    const { factory } = makeRecordingFactory();
    const text = new Text3D('Shift', { font: FAKE_FONT, geometryFactory: factory });
    text.shift([1, 2, 3]);
    const root = text.getThreeObject();
    expect(root.position.x).toBeCloseTo(1);
    expect(root.position.y).toBeCloseTo(2);
    expect(root.position.z).toBeCloseTo(3);
  });
});

describe('Text3D.copy', () => {
  it('copies into an independent instance that rebuilds its own geometry', () => {
    const { calls, factory } = makeRecordingFactory();
    const text = new Text3D('Copy', {
      font: FAKE_FONT,
      geometryFactory: factory,
      depth: 0.5,
      color: '#00ff00',
    });
    text.shift([1, 0, 0]);
    const copy = text.copy();
    expect(copy).toBeInstanceOf(Text3D);
    expect(copy).not.toBe(text);
    expect(copy.position.x).toBeCloseTo(1);
    expect(copy.getDepth()).toBe(0.5);
    copy.getThreeObject();
    expect(calls).toHaveLength(1);
    expect(calls[0].text).toBe('Copy');
  });
});
