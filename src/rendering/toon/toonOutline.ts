/**
 * Outline for a mesh by the inverted-hull method.
 *
 * The outline is a second mesh that shares the geometry of its source mesh.
 * It draws only back faces. The vertex shader pushes each vertex along its
 * projected normal by a fixed number of pixels, so the visible rim has a
 * constant width in screen space at any distance and any zoom.
 *
 * The outline reads its source material on every frame (`onBeforeRender`):
 * colour, opacity and visibility follow `setColor()`, `setOpacity()` and fades
 * with no extra sync code. The colour is a darker shade, a lighter shade, the
 * same colour as the source (per vertex colour and per instance colour when the
 * source has them), or a given colour.
 *
 * The outline material is always transparent, so it draws after every opaque
 * body and right after its own source (same depth, higher id). A transparent
 * source writes no depth, so the hull would show through it as a ghost. For a
 * transparent source the outline first writes the source's front-face depth
 * (one depth-only draw in `onBeforeRender`); the hull then shows only outside
 * the silhouette. The body itself keeps its normal translucent look.
 *
 * It renders in a normal `renderer.render` call. It does not need the
 * post-processing composer, so video export captures it.
 */

import * as THREE from 'three';
import {
  REVEAL_ALL,
  REVEAL_ATTR_ALL,
  REVEAL_FRAGMENT,
  REVEAL_PARS_FRAGMENT,
  REVEAL_PARS_VERTEX,
  REVEAL_VERTEX,
  getRevealUniforms,
  type RevealUniforms,
} from './toonMaterial';

/** Name of every outline mesh, for debugging and scene-graph queries. */
const TOON_OUTLINE_NAME = 'mwToonOutline';

/** Geometry attribute that holds the position-welded normals for the hull. */
const OUTLINE_NORMAL = 'mwOutlineNormal';

/** How the outline colour comes from the source colour. */
export type ToonOutlineColorMode = 'darker' | 'lighter' | 'same' | 'color';

const COLOR_MODE_CODE: Record<ToonOutlineColorMode, number> = {
  color: 0,
  darker: 1,
  lighter: 2,
  same: 3,
};

const OUTLINE_VERTEX = /* glsl */ `
#include <common>
#include <color_pars_vertex>
${REVEAL_PARS_VERTEX}
attribute vec3 ${OUTLINE_NORMAL};
uniform float uOutlineWidth;
uniform vec2 uResolution;

void main() {
  #include <color_vertex>
  vec3 transformedNormal = ${OUTLINE_NORMAL};
  #ifdef USE_INSTANCING
    mat3 im = mat3( instanceMatrix );
    transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
    transformedNormal = im * transformedNormal;
  #endif
  transformedNormal = normalMatrix * transformedNormal;
  vec3 transformed = vec3( position );
  #include <project_vertex>
  ${REVEAL_VERTEX}
  vec4 clipNormal = projectionMatrix * vec4( transformedNormal, 0.0 );
  vec2 pixelDir = clipNormal.xy * uResolution;
  float pixelLen = length( pixelDir );
  if ( pixelLen > 1e-6 ) {
    vec2 offset = ( pixelDir / pixelLen ) * uOutlineWidth * 2.0 / uResolution;
    gl_Position.xy += offset * gl_Position.w;
  }
}
`;

const OUTLINE_FRAGMENT = /* glsl */ `
#include <common>
#include <color_pars_fragment>
${REVEAL_PARS_FRAGMENT}
uniform vec3 uOutlineColor;
uniform vec3 uBaseColor;
uniform float uColorMode;
uniform float uOutlineOpacity;

void main() {
  ${REVEAL_FRAGMENT}
  vec3 ink = uOutlineColor;
  if ( uColorMode > 0.5 ) {
    vec3 base = uBaseColor;
    #ifdef USE_COLOR
      base *= vColor.rgb;
    #endif
    if ( uColorMode < 1.5 ) {
      vec3 shade = base * 0.12;
      float luma = dot( shade, vec3( 0.2126, 0.7152, 0.0722 ) );
      ink = max( mix( vec3( luma ), shade, 1.4 ), vec3( 0.0 ) );
    } else if ( uColorMode < 2.5 ) {
      ink = mix( base, vec3( 1.0 ), 0.35 );
    } else {
      ink = base;
    }
  }
  gl_FragColor = vec4( ink, uOutlineOpacity );
  #include <colorspace_fragment>
}
`;

/** Settings of one outline mesh. */
export interface ToonOutlineSettings {
  /** Colour mode. */
  mode: ToonOutlineColorMode;
  /** Explicit colour (CSS colour) for mode 'color'. */
  color: string | null;
  /** Width of the visible rim in CSS pixels. */
  width: number;
  /** Opacity of the outline, read on every frame. */
  opacity: () => number;
}

interface OutlineUniforms {
  [name: string]: THREE.IUniform;
  uOutlineWidth: { value: number };
  uResolution: { value: THREE.Vector2 };
  uOutlineColor: { value: THREE.Color };
  uBaseColor: { value: THREE.Color };
  uColorMode: { value: number };
  uOutlineOpacity: { value: number };
  uMwReveal: { value: THREE.Vector4 };
  uMwRevealT: { value: THREE.Vector2 };
}

interface ColoredMaterial extends THREE.Material {
  color: THREE.Color;
}

function hasColor(material: THREE.Material): material is ColoredMaterial {
  return (material as Partial<ColoredMaterial>).color instanceof THREE.Color;
}

function firstMaterial(mesh: THREE.Mesh): THREE.Material {
  return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
}

function isWireframe(material: THREE.Material): boolean {
  return !!(material as { wireframe?: boolean }).wireframe;
}

const SCRATCH_SIZE = new THREE.Vector2();
/** A draw group that covers the whole geometry (the draw range still applies). */
const FULL_GROUP = { start: 0, count: Infinity, materialIndex: 0 };

/**
 * +1 when the triangle winding of a geometry faces outward from the centre of
 * its bounding box (the three.js convention), -1 when it faces inward. A
 * parametric surface can come out inward, depending on its (u, v) order.
 */
function windingSign(
  geometry: THREE.BufferGeometry,
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
): number {
  geometry.computeBoundingBox();
  const center = (geometry.boundingBox as THREE.Box3).getCenter(new THREE.Vector3());
  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  let volume = 0;
  for (let t = 0; t + 2 < count; t += 3) {
    a.fromBufferAttribute(position, index ? index.getX(t) : t);
    b.fromBufferAttribute(position, index ? index.getX(t + 1) : t + 1);
    c.fromBufferAttribute(position, index ? index.getX(t + 2) : t + 2);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    ab.cross(ac);
    a.add(b).add(c).divideScalar(3).sub(center);
    volume += a.dot(ab);
  }
  return volume < 0 ? -1 : 1;
}

/**
 * Add the position-welded normal attribute to a geometry, or refresh it when
 * the positions changed. Vertices at the same position share one averaged
 * normal, so a hard-edged mesh (a cube) gets a closed hull with no gaps.
 * A `smoothNormal` attribute, when present, is the input instead of `normal`.
 * The hull normals always point outward; `userData.mwOutlineInward` records
 * an inward winding, so the outline culls the other side.
 *
 * @post geometry.getAttribute('position') !== undefined =>
 *         geometry.getAttribute('mwOutlineNormal').count === geometry.getAttribute('position').count
 */
function ensureOutlineNormals(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position');
  if (!position) return;
  const version =
    position instanceof THREE.InterleavedBufferAttribute ? position.data.version : position.version;
  const stamp = `${version}:${position.count}`;
  if (geometry.userData.mwOutlineNormalStamp === stamp && geometry.getAttribute(OUTLINE_NORMAL)) {
    return;
  }
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  // Shapes with hard edges (organicMesh.ts) carry `smoothNormal` with no split
  // at the creases; it gives a closed hull.
  const normal = geometry.getAttribute('smoothNormal') ?? geometry.getAttribute('normal');
  const sums = new Map<string, THREE.Vector3>();
  const keys: string[] = new Array(position.count);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i);
    const key = `${p.x.toFixed(5)},${p.y.toFixed(5)},${p.z.toFixed(5)}`;
    keys[i] = key;
    n.fromBufferAttribute(normal, i);
    const sum = sums.get(key);
    if (sum) sum.add(n);
    else sums.set(key, n.clone());
  }
  const sign = windingSign(geometry, position);
  const out = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    n.copy(sums.get(keys[i]) as THREE.Vector3);
    if (n.lengthSq() < 1e-12) n.fromBufferAttribute(normal, i);
    n.normalize().multiplyScalar(sign);
    out[i * 3] = n.x;
    out[i * 3 + 1] = n.y;
    out[i * 3 + 2] = n.z;
  }
  geometry.setAttribute(OUTLINE_NORMAL, new THREE.BufferAttribute(out, 3));
  geometry.userData.mwOutlineNormalStamp = stamp;
  geometry.userData.mwOutlineInward = sign < 0;
}

function createOutlineMaterial(): THREE.ShaderMaterial {
  const uniforms: OutlineUniforms = {
    uOutlineWidth: { value: 2 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uOutlineColor: { value: new THREE.Color(0, 0, 0) },
    uBaseColor: { value: new THREE.Color(1, 1, 1) },
    uColorMode: { value: 1 },
    uOutlineOpacity: { value: 1 },
    uMwReveal: { value: REVEAL_ALL.clone() },
    uMwRevealT: { value: REVEAL_ATTR_ALL.clone() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: OUTLINE_VERTEX,
    fragmentShader: OUTLINE_FRAGMENT,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });
  // Keep depth testing in a 2D Scene too (see applyFlatSceneDepth), and keep
  // depthWrite off in ThreeDScene (see its depthPrepass rule).
  material.userData.toonOutline = true;
  material.userData.depthPrepass = true;
  return material;
}

function outlineUniforms(outline: THREE.Mesh): OutlineUniforms {
  return (outline.material as THREE.ShaderMaterial).uniforms as OutlineUniforms;
}

/** Depth-only material that writes the front-face depth of a transparent source. */
function createDepthMaterial(): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.FrontSide });
  material.userData.depthPrepass = true;
  return material;
}

interface OutlineState {
  source: THREE.Mesh;
  settings: ToonOutlineSettings;
  depthMaterial: THREE.MeshBasicMaterial;
  restScale: number;
}

// Runtime links live in WeakMaps, not in `userData`: three.js JSON-clones
// `userData` on `Object3D.clone()`, which would serialise whole meshes and
// leave the clone with dead references. Each entry goes with its mesh.
/** Outline mesh -> its state. */
const OUTLINE_STATE = new WeakMap<THREE.Mesh, OutlineState>();
/** Source mesh -> its outline mesh. */
const OUTLINE_OF = new WeakMap<THREE.Mesh, THREE.Mesh>();

function stateOf(outline: THREE.Mesh): OutlineState {
  return OUTLINE_STATE.get(outline) as OutlineState;
}

/** Copy the per-frame state of the source onto the outline; runs in onBeforeRender. */
function beforeOutlineRender(
  outline: THREE.Mesh,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): void {
  const state = stateOf(outline);
  const { source, settings } = state;
  const uniforms = outlineUniforms(outline);
  const sourceMaterial = firstMaterial(source);

  const target = renderer.getRenderTarget();
  if (target) SCRATCH_SIZE.set(target.width, target.height);
  else renderer.getDrawingBufferSize(SCRATCH_SIZE);
  uniforms.uResolution.value.copy(SCRATCH_SIZE);
  // A mobject that grows from (or shrinks to) a point gets a thin line, not a
  // fixed-size dot.
  const scale = source.matrixWorld.getMaxScaleOnAxis() / state.restScale;
  const grow = THREE.MathUtils.smoothstep(scale, 0, 0.2);
  uniforms.uOutlineWidth.value = settings.width * renderer.getPixelRatio() * grow;
  if (hasColor(sourceMaterial)) uniforms.uBaseColor.value.copy(sourceMaterial.color);
  uniforms.uOutlineOpacity.value = Math.max(0, Math.min(1, settings.opacity()));

  if (source instanceof THREE.InstancedMesh && outline instanceof THREE.InstancedMesh) {
    outline.count = source.count;
  }
  const outlineMaterial = outline.material as THREE.ShaderMaterial;
  if (outlineMaterial.vertexColors !== sourceMaterial.vertexColors) {
    outlineMaterial.vertexColors = sourceMaterial.vertexColors;
    outlineMaterial.needsUpdate = true;
  }

  // The depth draw stands in for the body, so it clips like the body: an
  // unrevealed part must not hide translucent objects drawn after it. (Not
  // like the outline: in Create3D's outline phase the outline sweeps over a
  // full, invisible body, and a clipped depth would open the hull's inside.)
  const sourceReveal = getRevealUniforms(sourceMaterial);
  const depthReveal = getRevealUniforms(state.depthMaterial);
  if (sourceReveal && depthReveal) {
    depthReveal.plane.value.copy(sourceReveal.plane.value);
    depthReveal.attr.value.copy(sourceReveal.attr.value);
  }

  if (sourceMaterial.transparent && sourceMaterial.visible && source.visible) {
    renderer.renderBufferDirect(
      camera,
      scene,
      source.geometry,
      state.depthMaterial,
      source,
      FULL_GROUP,
    );
  }
}

/** Mirror geometry and instancing; runs at mobject sync time. */
function syncOutlineStructure(outline: THREE.Mesh, source: THREE.Mesh): void {
  if (outline.geometry !== source.geometry) outline.geometry = source.geometry;
  ensureOutlineNormals(source.geometry);
  const side = source.geometry.userData.mwOutlineInward ? THREE.FrontSide : THREE.BackSide;
  const material = outline.material as THREE.ShaderMaterial;
  if (material.side !== side) {
    material.side = side;
    material.needsUpdate = true;
  }
  if (source instanceof THREE.InstancedMesh && outline instanceof THREE.InstancedMesh) {
    outline.instanceMatrix = source.instanceMatrix;
    outline.instanceColor = source.instanceColor;
    outline.count = source.count;
  }
  outline.renderOrder = source.renderOrder;
  outline.frustumCulled = source.frustumCulled;
}

/** The outline mesh attached to `source`, or null. */
export function getOutlineMesh(source: THREE.Mesh): THREE.Mesh | null {
  return OUTLINE_OF.get(source) ?? null;
}

/**
 * Remove outline meshes that `Object3D.clone()` copied from another source.
 * They share the other source's outline material and have no per-frame
 * callback. The material belongs to the other source, so it is not disposed.
 */
function dropForeignOutlines(source: THREE.Mesh, own: THREE.Mesh | null): void {
  for (const child of [...source.children]) {
    if (child !== own && child.userData.toonOutline === true) source.remove(child);
  }
}

/**
 * The reveal clip uniforms of an outline mesh, so a creation animation can
 * reveal the outline apart from the body.
 */
export function getOutlineRevealUniforms(outline: THREE.Mesh): RevealUniforms {
  const uniforms = outlineUniforms(outline);
  return { plane: uniforms.uMwReveal, attr: uniforms.uMwRevealT };
}

/**
 * Attach (or update) an inverted-hull outline on `source`. Idempotent: a second
 * call with new settings updates the existing outline mesh.
 *
 * @returns The outline mesh.
 * @post getOutlineMesh(source) !== null && getOutlineMesh(source).parent === source
 */
export function attachOutline(source: THREE.Mesh, settings: ToonOutlineSettings): THREE.Mesh {
  let outline = getOutlineMesh(source);
  dropForeignOutlines(source, outline);
  if (!outline) {
    const material = createOutlineMaterial();
    outline =
      source instanceof THREE.InstancedMesh
        ? new THREE.InstancedMesh(source.geometry, material, source.count)
        : new THREE.Mesh(source.geometry, material);
    outline.name = TOON_OUTLINE_NAME;
    outline.userData.toonOutline = true;
    outline.raycast = () => {};
    const created = outline;
    created.onBeforeRender = (renderer, scene, camera) =>
      beforeOutlineRender(created, renderer, scene, camera);
    // The world scale at attach time is the rest scale. A later sync during a
    // grow animation must not move it, so it is set only here.
    source.updateMatrixWorld();
    const restScale = source.matrixWorld.getMaxScaleOnAxis();
    const state: OutlineState = {
      source,
      settings,
      depthMaterial: createDepthMaterial(),
      restScale: restScale > 1e-6 ? restScale : 1,
    };
    // Code that frees a subtree by disposing every mesh material (Arrow3D
    // rebuild, for example) also frees the depth material, which is never in
    // the tree.
    material.addEventListener('dispose', () => state.depthMaterial.dispose());
    OUTLINE_STATE.set(outline, state);
    OUTLINE_OF.set(source, outline);
    source.add(outline);
  }
  const state = stateOf(outline);
  state.settings = { ...settings };
  const uniforms = outlineUniforms(outline);
  uniforms.uColorMode.value = COLOR_MODE_CODE[settings.mode];
  if (settings.color !== null) uniforms.uOutlineColor.value.set(settings.color);
  syncOutlineStructure(outline, source);
  const sourceMaterial = firstMaterial(source);
  outline.visible = !isWireframe(sourceMaterial) && sourceMaterial.colorWrite;
  return outline;
}

/**
 * Remove the outline from `source` and free its materials. Idempotent.
 *
 * @post getOutlineMesh(source) === null
 */
export function detachOutline(source: THREE.Mesh): void {
  const outline = getOutlineMesh(source);
  if (!outline) return;
  source.remove(outline);
  // Its dispose listener frees the depth material too.
  (outline.material as THREE.Material).dispose();
  OUTLINE_STATE.delete(outline);
  OUTLINE_OF.delete(source);
}

/**
 * Detach and free the outline of every mesh under `root` (the root too).
 * Call it before a subtree leaves its mobject for good (mesh replacement,
 * dispose). Idempotent.
 *
 * @post ∀ mesh m under root: getOutlineMesh(m) === null
 */
export function detachOutlines(root: THREE.Object3D): void {
  const sources: THREE.Mesh[] = [];
  root.traverse((node) => {
    if (node instanceof THREE.Mesh && OUTLINE_OF.has(node)) sources.push(node);
  });
  for (const source of sources) detachOutline(source);
}
