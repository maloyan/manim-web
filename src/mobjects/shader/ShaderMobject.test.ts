import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ShaderMobject } from './ShaderMobject';

const FRAG = /* glsl */ `
  precision highp float;
  uniform float iTime;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(vUv, 0.5 + 0.5 * sin(iTime), 1.0);
  }
`;

function material(m: ShaderMobject): THREE.ShaderMaterial {
  const mesh = m.getThreeObject() as THREE.Mesh;
  return mesh.material as THREE.ShaderMaterial;
}

describe('ShaderMobject', () => {
  describe('construction', () => {
    it('has correct default values', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      expect(m.getWidth()).toBe(8);
      expect(m.getHeight()).toBe(4.5);
      expect(m.getFragmentShader()).toBe(FRAG);
      expect(m.opacity).toBe(1);
    });

    it('accepts custom size and opacity', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG, width: 10, height: 6, opacity: 0.5 });
      expect(m.getWidth()).toBe(10);
      expect(m.getHeight()).toBe(6);
      expect(m.opacity).toBe(0.5);
    });

    it('is headless-safe: constructs without touching WebGL or throwing', () => {
      expect(() => new ShaderMobject({ fragmentShader: FRAG })).not.toThrow();
    });
  });

  describe('mesh and material', () => {
    it('builds a Mesh with a ShaderMaterial carrying the fragment shader source', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      const mesh = m.getThreeObject();
      expect(mesh).toBeInstanceOf(THREE.Mesh);
      const mat = material(m);
      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      expect(mat.fragmentShader).toBe(FRAG);
    });

    it('builds a PlaneGeometry sized from width/height', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG, width: 10, height: 6 });
      const mesh = m.getThreeObject() as THREE.Mesh;
      const geo = mesh.geometry as THREE.PlaneGeometry;
      expect(geo).toBeInstanceOf(THREE.PlaneGeometry);
      expect(geo.parameters.width).toBe(10);
      expect(geo.parameters.height).toBe(6);
    });

    it('uses a built-in pass-through vertex shader by default', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      const mat = material(m);
      expect(typeof mat.vertexShader).toBe('string');
      expect(mat.vertexShader).toContain('gl_Position');
      expect(mat.vertexShader).toContain('vUv');
    });

    it('uses a supplied custom vertex shader', () => {
      const vert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`;
      const m = new ShaderMobject({ fragmentShader: FRAG, vertexShader: vert });
      expect(material(m).vertexShader).toBe(vert);
    });

    it('passes the blending mode to the material', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG, blending: THREE.AdditiveBlending });
      expect(material(m).blending).toBe(THREE.AdditiveBlending);
    });
  });

  describe('built-in uniforms', () => {
    it('exposes iTime starting at 0', () => {
      const mat = material(new ShaderMobject({ fragmentShader: FRAG }));
      expect(mat.uniforms.iTime.value).toBe(0);
    });

    it('sets iResolution from the plane size', () => {
      const mat = material(new ShaderMobject({ fragmentShader: FRAG, width: 10, height: 6 }));
      const res = mat.uniforms.iResolution.value as THREE.Vector3;
      expect(res.x).toBe(10);
      expect(res.y).toBe(6);
    });

    it('omits iMouse unless enabled', () => {
      const mat = material(new ShaderMobject({ fragmentShader: FRAG }));
      expect(mat.uniforms.iMouse).toBeUndefined();
    });

    it('adds iMouse when mouse is enabled', () => {
      const mat = material(new ShaderMobject({ fragmentShader: FRAG, mouse: true }));
      expect(mat.uniforms.iMouse.value).toBeInstanceOf(THREE.Vector4);
    });
  });

  describe('custom uniforms', () => {
    it('passes declared uniforms through to the material', () => {
      const color = new THREE.Vector3(1, 0, 0);
      const m = new ShaderMobject({
        fragmentShader: FRAG,
        uniforms: { uColor: color, uScale: 2.5 },
      });
      const mat = material(m);
      expect(mat.uniforms.uColor.value).toBe(color);
      expect(mat.uniforms.uScale.value).toBe(2.5);
    });

    it('accepts a texture as a uniform value', () => {
      const tex = new THREE.DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
      const m = new ShaderMobject({ fragmentShader: FRAG, uniforms: { uTex: tex } });
      expect(material(m).uniforms.uTex.value).toBe(tex);
    });
  });

  describe('setUniform', () => {
    it('updates an existing uniform value and returns this', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG, uniforms: { uScale: 1 } });
      expect(m.setUniform('uScale', 9)).toBe(m);
      expect(material(m).uniforms.uScale.value).toBe(9);
    });

    it('creates a uniform that was not declared', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      m.setUniform('uNew', 3);
      expect(material(m).uniforms.uNew.value).toBe(3);
    });

    it('applies values set before the material is built', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      m.setUniform('uEarly', 7); // no getThreeObject() yet
      expect(m.getUniform('uEarly')).toBe(7);
      expect(material(m).uniforms.uEarly.value).toBe(7);
    });
  });

  describe('time', () => {
    it('syncToTime sets iTime and getTime, returns this', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      expect(m.syncToTime(1.25)).toBe(m);
      expect(m.getTime()).toBe(1.25);
      expect(material(m).uniforms.iTime.value).toBe(1.25);
    });

    it('syncToTime before material build is reflected after build', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      m.syncToTime(2);
      expect(material(m).uniforms.iTime.value).toBe(2);
    });

    it('advances iTime via its frame updater', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      expect(m.hasUpdaters()).toBe(true);
      m.update(0.5);
      m.update(0.5);
      expect(m.getTime()).toBeCloseTo(1.0);
      expect(material(m).uniforms.iTime.value).toBeCloseTo(1.0);
    });
  });

  describe('resolution', () => {
    it('setResolution updates iResolution and returns this', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      expect(m.setResolution(320, 240)).toBe(m);
      const res = material(m).uniforms.iResolution.value as THREE.Vector3;
      expect(res.x).toBe(320);
      expect(res.y).toBe(240);
    });
  });

  describe('copy', () => {
    it('preserves shader, size and uniforms', () => {
      const m = new ShaderMobject({
        fragmentShader: FRAG,
        width: 10,
        height: 6,
        uniforms: { uScale: 3 },
        opacity: 0.7,
      });
      const clone = m.copy();
      expect(clone).toBeInstanceOf(ShaderMobject);
      expect(clone).not.toBe(m);
      expect(clone.getFragmentShader()).toBe(FRAG);
      expect(clone.getWidth()).toBe(10);
      expect(clone.getHeight()).toBe(6);
      expect(clone.getUniform('uScale')).toBe(3);
      expect(clone.opacity).toBe(0.7);
    });

    it('copy is independent from the original', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG, uniforms: { uScale: 1 } });
      const clone = m.copy();
      m.setUniform('uScale', 99);
      m.syncToTime(5);
      expect(clone.getUniform('uScale')).toBe(1);
      expect(clone.getTime()).toBe(0);
    });
  });

  describe('dispose', () => {
    it('frees the material without throwing', () => {
      const m = new ShaderMobject({ fragmentShader: FRAG });
      m.getThreeObject();
      expect(() => m.dispose()).not.toThrow();
    });
  });
});
