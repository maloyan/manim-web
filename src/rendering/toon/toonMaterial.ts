/**
 * One shader patch on a built-in mesh material, for two features:
 *
 * 1. Toon shading (lit materials only). The patch keeps the material type
 *    (MeshStandardMaterial, MeshPhongMaterial, MeshLambertMaterial,
 *    MeshToonMaterial, MeshPhysicalMaterial). It replaces only the final
 *    `outgoingLight` value. So every mobject keeps its own colour sync
 *    (`material.color.set`), opacity, vertex colours, instance colours and
 *    textures, and `setColor()` reaches the toon look with no extra work.
 * 2. A reveal clip (any mesh material). Fragments with
 *    `dot(worldPosition, axis) > threshold` are discarded. The 3D creation
 *    animations sweep the threshold.
 *
 * The bands depend only on light directions, not on light intensity. By
 * default one key light is fixed in view space (upper left, toward the
 * viewer), as in a drawn illustration, so the look is the same from every
 * camera angle. With `uToonSceneLights` the scene's directional, point and
 * spot lights give the directions instead. The lit band is the base colour
 * times `uToonBrightness`.
 */

import * as THREE from 'three';

/** The live uniforms of one patched material. Write `.value` to retune. */
export interface ToonUniforms {
  uToonSteps: { value: number };
  uToonThreshold: { value: number };
  uToonSoftness: { value: number };
  uToonBrightness: { value: number };
  uToonShadowColor: { value: THREE.Color };
  uToonHasShadowColor: { value: number };
  uToonShadowStrength: { value: number };
  uToonHighlightColor: { value: THREE.Color };
  uToonHasHighlightColor: { value: number };
  uToonHighlightSize: { value: number };
  uToonHighlightSoftness: { value: number };
  uToonHighlightIntensity: { value: number };
  uToonSceneLights: { value: number };
  uToonViewLight: { value: THREE.Vector3 };
}

/**
 * Patch state of one material. It lives in {@link PATCHES}, not in
 * `material.userData`: three.js JSON-clones `userData` on `material.clone()`,
 * which would turn the uniform vectors into plain objects and leave the clone
 * with no shader callback. A clone has no entry and gets a fresh patch.
 */
interface PatchState {
  toon: ToonUniforms;
  reveal: RevealUniforms;
  toonEnabled: boolean;
  previousOnBeforeCompile: THREE.Material['onBeforeCompile'];
  previousCacheKey: THREE.Material['customProgramCacheKey'];
}

/** A reveal plane that keeps every fragment (0·p <= 1). */
export const REVEAL_ALL = new THREE.Vector4(0, 0, 0, 1);

/** A reveal-attribute range that keeps every fragment (`reveal` is in 0..1). */
export const REVEAL_ATTR_ALL: Readonly<THREE.Vector2> = new THREE.Vector2(-1, 2);

/** The two reveal clips of one material. */
export interface RevealUniforms {
  /** Plane clip `(axis.xyz, threshold)` in world space: keep `dot(p, axis) <= threshold`. */
  plane: { value: THREE.Vector4 };
  /**
   * Attribute clip: keep `value.x <= reveal <= value.y`, for a geometry with a
   * `reveal` attribute in 0..1. A forward reveal moves `y` up, a reverse one
   * moves `x` down. A geometry without the attribute reads `reveal = 0`, so
   * keep `x <= 0 <= y` on such a mesh.
   */
  attr: { value: THREE.Vector2 };
}

/** GLSL vertex declarations for the reveal clips, shared with the outline shader. */
export const REVEAL_PARS_VERTEX = /* glsl */ `
attribute float reveal;
varying vec3 vMwWorld;
varying float vMwReveal;
`;

/** GLSL fragment declarations for the reveal clips. */
export const REVEAL_PARS_FRAGMENT = /* glsl */ `
uniform vec4 uMwReveal;
uniform vec2 uMwRevealT;
varying vec3 vMwWorld;
varying float vMwReveal;
`;

/** GLSL vertex statement: world position of `transformed` (with instancing) and the reveal value. */
export const REVEAL_VERTEX = /* glsl */ `
{
  vec4 mwP = vec4( transformed, 1.0 );
  #ifdef USE_INSTANCING
    mwP = instanceMatrix * mwP;
  #endif
  vMwWorld = ( modelMatrix * mwP ).xyz;
  vMwReveal = reveal;
}
`;

/** GLSL fragment statement: drop the fragments past either reveal clip. */
export const REVEAL_FRAGMENT = /* glsl */ `
if ( dot( vMwWorld, uMwReveal.xyz ) > uMwReveal.w || vMwReveal < uMwRevealT.x || vMwReveal > uMwRevealT.y ) discard;
`;

/** Light accumulation helpers and uniforms, placed before `main()`. */
const TOON_PARS = /* glsl */ `
uniform float uToonSteps;
uniform float uToonThreshold;
uniform float uToonSoftness;
uniform float uToonBrightness;
uniform vec3 uToonShadowColor;
uniform float uToonHasShadowColor;
uniform float uToonShadowStrength;
uniform vec3 uToonHighlightColor;
uniform float uToonHasHighlightColor;
uniform float uToonHighlightSize;
uniform float uToonHighlightSoftness;
uniform float uToonHighlightIntensity;
uniform float uToonSceneLights;
uniform vec3 uToonViewLight;

void mwToonAccum( vec3 lightDir, vec3 lightColor, vec3 n, inout float sum, inout float weight, inout vec3 keyDir, inout float keyWeight ) {
  float w = dot( lightColor, vec3( 0.2126, 0.7152, 0.0722 ) );
  sum += w * ( 0.5 * dot( n, lightDir ) + 0.5 );
  weight += w;
  if ( w > keyWeight ) {
    keyWeight = w;
    keyDir = lightDir;
  }
}

vec3 mwToonShade( vec3 base, float strength ) {
  vec3 shade = base * mix( 1.0, 0.5, strength );
  float luma = dot( shade, vec3( 0.2126, 0.7152, 0.0722 ) );
  return max( mix( vec3( luma ), shade, 1.0 + 0.3 * strength ), vec3( 0.0 ) );
}

float mwToonBand( float t, float steps, float softness ) {
  float count = max( steps - 1.0, 1.0 );
  float aa = max( fwidth( t ), 1e-4 );
  float hard = 0.0;
  for ( int k = 0; k < 4; k ++ ) {
    if ( float( k ) < count ) {
      float edge = uToonThreshold + ( float( k ) - 0.5 * ( count - 1.0 ) ) * 0.16;
      hard += smoothstep( edge - aa, edge + aa, t );
    }
  }
  hard /= count;
  float smoothBand = smoothstep( 0.15, 0.95, t );
  return mix( hard, smoothBand, softness );
}
`;

/** Replaces `outgoingLight` right before the opaque fragment chunk. */
const TOON_MAIN = /* glsl */ `
{
  vec3 mwN = normalize( normal );
  vec3 mwV = normalize( vViewPosition );
  float mwSum = 0.0;
  float mwWeight = 0.0;
  vec3 mwKeyDir = normalize( uToonViewLight );
  float mwKeyWeight = 0.0;
  if ( uToonSceneLights > 0.5 ) {
  #if NUM_DIR_LIGHTS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
    mwToonAccum( directionalLights[ i ].direction, directionalLights[ i ].color, mwN, mwSum, mwWeight, mwKeyDir, mwKeyWeight );
  }
  #pragma unroll_loop_end
  #endif
  #if NUM_POINT_LIGHTS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
    mwToonAccum( normalize( pointLights[ i ].position + vViewPosition ), pointLights[ i ].color, mwN, mwSum, mwWeight, mwKeyDir, mwKeyWeight );
  }
  #pragma unroll_loop_end
  #endif
  #if NUM_SPOT_LIGHTS > 0
  #pragma unroll_loop_start
  for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
    mwToonAccum( normalize( spotLights[ i ].position + vViewPosition ), spotLights[ i ].color, mwN, mwSum, mwWeight, mwKeyDir, mwKeyWeight );
  }
  #pragma unroll_loop_end
  #endif
  }
  float mwT = mwWeight > 0.0 ? mwSum / mwWeight : 0.5 * dot( mwN, mwKeyDir ) + 0.5;
  vec3 mwBase = diffuseColor.rgb * uToonBrightness;
  vec3 mwShadow = uToonHasShadowColor > 0.5 ? uToonShadowColor : mwToonShade( mwBase, uToonShadowStrength );
  vec3 mwColor = mix( mwShadow, mwBase, mwToonBand( mwT, uToonSteps, uToonSoftness ) );
  if ( uToonHighlightIntensity > 0.0 ) {
    vec3 mwH = normalize( mwKeyDir + mwV );
    float mwSpec = dot( mwN, mwH );
    float mwEdge = 1.0 - 0.035 * uToonHighlightSize;
    float mwSoft = max( fwidth( mwSpec ) * 1.5, 0.004 ) + uToonHighlightSoftness * 0.035 * uToonHighlightSize;
    float mwMask = smoothstep( mwEdge - mwSoft, mwEdge + mwSoft, mwSpec );
    vec3 mwHi = uToonHasHighlightColor > 0.5 ? uToonHighlightColor : mix( diffuseColor.rgb, vec3( 1.0 ), 0.6 );
    mwColor = mix( mwColor, mwHi, mwMask * uToonHighlightIntensity );
  }
  outgoingLight = mwColor + totalEmissiveRadiance;
}
#include <opaque_fragment>
`;

type LitFlag =
  'isMeshStandardMaterial' | 'isMeshPhongMaterial' | 'isMeshLambertMaterial' | 'isMeshToonMaterial';

/**
 * Whether the toon shading part can apply to this material.
 * It needs the lit fragment shader (lights, `normal`, `vViewPosition`).
 */
function isToonPatchable(material: THREE.Material): boolean {
  const flags = material as Partial<Record<LitFlag, boolean>>;
  return !!(
    flags.isMeshStandardMaterial ||
    flags.isMeshPhongMaterial ||
    flags.isMeshLambertMaterial ||
    flags.isMeshToonMaterial
  );
}

/** Whether the patch can apply at all: a built-in material, not a shader material. */
function isPatchable(material: THREE.Material): boolean {
  const flags = material as { isShaderMaterial?: boolean; isMeshBasicMaterial?: boolean };
  return !flags.isShaderMaterial && (isToonPatchable(material) || !!flags.isMeshBasicMaterial);
}

/** Create a fresh toon uniform set with neutral values. */
function createToonUniforms(): ToonUniforms {
  return {
    uToonSteps: { value: 2 },
    uToonThreshold: { value: 0.5 },
    uToonSoftness: { value: 0 },
    uToonBrightness: { value: 1 },
    uToonShadowColor: { value: new THREE.Color() },
    uToonHasShadowColor: { value: 0 },
    uToonShadowStrength: { value: 1 },
    uToonHighlightColor: { value: new THREE.Color(1, 1, 1) },
    uToonHasHighlightColor: { value: 0 },
    uToonHighlightSize: { value: 1 },
    uToonHighlightSoftness: { value: 0 },
    uToonHighlightIntensity: { value: 1 },
    uToonSceneLights: { value: 0 },
    uToonViewLight: { value: new THREE.Vector3(-0.45, 0.6, 0.65) },
  };
}

const PATCHES = new WeakMap<THREE.Material, PatchState>();

function stateOf(material: THREE.Material): PatchState | null {
  return PATCHES.get(material) ?? null;
}

/**
 * Install the shader patch on a material. Idempotent. The patch is inert
 * (no toon, reveal keeps all) until a caller turns a feature on.
 *
 * @returns The patch state, or null for a material the patch does not support.
 */
function ensurePatch(material: THREE.Material): PatchState | null {
  const existing = stateOf(material);
  if (existing) return existing;
  if (!isPatchable(material)) return null;

  const state: PatchState = {
    toon: createToonUniforms(),
    reveal: { plane: { value: REVEAL_ALL.clone() }, attr: { value: REVEAL_ATTR_ALL.clone() } },
    toonEnabled: false,
    previousOnBeforeCompile: material.onBeforeCompile,
    previousCacheKey: material.customProgramCacheKey,
  };
  const lit = isToonPatchable(material);

  material.onBeforeCompile = (shader, renderer) => {
    state.previousOnBeforeCompile.call(material, shader, renderer);
    shader.uniforms.uMwReveal = state.reveal.plane;
    shader.uniforms.uMwRevealT = state.reveal.attr;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', `${REVEAL_PARS_VERTEX}\nvoid main() {`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${REVEAL_VERTEX}`);
    const toon = lit && state.toonEnabled;
    if (toon) Object.assign(shader.uniforms, state.toon);
    let fragment = shader.fragmentShader.replace(
      'void main() {',
      `${REVEAL_PARS_FRAGMENT}\n${toon ? TOON_PARS : ''}\nvoid main() {\n${REVEAL_FRAGMENT}`,
    );
    if (toon) fragment = fragment.replace('#include <opaque_fragment>', TOON_MAIN);
    shader.fragmentShader = fragment;
  };
  material.customProgramCacheKey = () =>
    `${state.previousCacheKey.call(material)}|mw-patch-v3-${state.toonEnabled ? 'toon' : 'plain'}`;
  PATCHES.set(material, state);
  material.needsUpdate = true;
  return state;
}

/**
 * Whether a material carries the toon/reveal patch. Its uniforms hold the
 * state of one mobject, so a copy must not share such a material.
 */
export function hasMaterialPatch(material: THREE.Material): boolean {
  return PATCHES.has(material);
}

/** The toon uniforms of a material with toon shading on, or null. */
export function getToonUniforms(material: THREE.Material): ToonUniforms | null {
  const state = stateOf(material);
  return state && state.toonEnabled ? state.toon : null;
}

/**
 * Turn toon shading on for a lit material. Idempotent.
 *
 * @returns The live uniforms, or null when the material is not lit.
 * @post isToonPatchable(material) => getToonUniforms(material) !== null
 */
export function patchToonMaterial(material: THREE.Material): ToonUniforms | null {
  if (!isToonPatchable(material)) return null;
  const state = ensurePatch(material);
  if (!state) return null;
  if (!state.toonEnabled) {
    state.toonEnabled = true;
    material.needsUpdate = true;
  }
  return state.toon;
}

/**
 * Turn toon shading off. The reveal part stays installed and inert. Idempotent.
 *
 * @post getToonUniforms(material) === null
 */
export function unpatchToonMaterial(material: THREE.Material): void {
  const state = stateOf(material);
  if (!state || !state.toonEnabled) return;
  state.toonEnabled = false;
  material.needsUpdate = true;
}

/**
 * The reveal clip uniforms of a material. Installs the patch on first use.
 *
 * @returns The live uniforms, or null for an unsupported material.
 */
export function getRevealUniforms(material: THREE.Material): RevealUniforms | null {
  const state = ensurePatch(material);
  return state ? state.reveal : null;
}
