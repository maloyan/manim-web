import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { type BlendMode, BLEND_MODES, blendModeToThree, applyBlendMode } from './blendModes';

describe('blendModeToThree', () => {
  it('maps each mode to the expected three.js blending constant', () => {
    expect(blendModeToThree('normal')).toBe(THREE.NormalBlending);
    expect(blendModeToThree('additive')).toBe(THREE.AdditiveBlending);
    expect(blendModeToThree('multiply')).toBe(THREE.MultiplyBlending);
    expect(blendModeToThree('subtractive')).toBe(THREE.SubtractiveBlending);
    expect(blendModeToThree('screen')).toBe(THREE.CustomBlending);
  });

  it('lists every supported mode in BLEND_MODES', () => {
    expect([...BLEND_MODES].sort()).toEqual(
      ['additive', 'multiply', 'normal', 'screen', 'subtractive'].sort(),
    );
  });
});

describe('applyBlendMode', () => {
  it('sets NormalBlending for normal (matches three default)', () => {
    const material = new THREE.MeshBasicMaterial();
    expect(material.blending).toBe(THREE.NormalBlending); // three default
    applyBlendMode(material, 'normal');
    expect(material.blending).toBe(THREE.NormalBlending);
  });

  it('sets the constant for additive / multiply / subtractive', () => {
    const cases: Array<[BlendMode, THREE.Blending]> = [
      ['additive', THREE.AdditiveBlending],
      ['multiply', THREE.MultiplyBlending],
      ['subtractive', THREE.SubtractiveBlending],
    ];
    for (const [mode, expected] of cases) {
      const material = new THREE.MeshBasicMaterial();
      applyBlendMode(material, mode);
      expect(material.blending).toBe(expected);
    }
  });

  it('configures CustomBlending with screen equation/factors for screen', () => {
    const material = new THREE.MeshBasicMaterial();
    applyBlendMode(material, 'screen');
    expect(material.blending).toBe(THREE.CustomBlending);
    expect(material.blendEquation).toBe(THREE.AddEquation);
    expect(material.blendSrc).toBe(THREE.OneFactor);
    expect(material.blendDst).toBe(THREE.OneMinusSrcColorFactor);
  });

  it('bumps the material version only when the blending constant changes', () => {
    const material = new THREE.MeshBasicMaterial();
    const baseVersion = material.version;

    applyBlendMode(material, 'normal'); // unchanged from default
    expect(material.version).toBe(baseVersion);

    applyBlendMode(material, 'additive'); // changed
    expect(material.version).toBeGreaterThan(baseVersion);
  });
});
