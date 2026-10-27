/**
 * Helpers shared by the in-canvas pointer behaviors (Scrubbable, Tangle):
 * touch-action claims, a shared cursor, and screen <-> world mapping.
 */

import * as THREE from 'three';
import type { Scene } from '../core/Scene';
import type { VMobject } from '../core/VMobject';

/**
 * Behaviors that currently own the cursor, per canvas. Several behaviors can
 * share one canvas (e.g. the cells of a DecimalTable); the cursor resets only
 * when none of them is hovered, so one leaving cannot clear the cursor
 * another just set.
 */
const cursorOwners = new WeakMap<HTMLCanvasElement, Set<object>>();

/**
 * Live claims per canvas, and the canvas touch-action before the first one.
 * On touch, the browser pans the page and sends pointercancel unless the
 * canvas has `touch-action: none`, so a drag would end at once. The last
 * release restores the old value.
 */
const touchClaims = new WeakMap<HTMLCanvasElement, { count: number; previous: string }>();

/** Set `touch-action: none` on the canvas while at least one claim is live. */
export function claimTouch(canvas: HTMLCanvasElement): void {
  const claim = touchClaims.get(canvas);
  if (claim) {
    claim.count++;
    return;
  }
  touchClaims.set(canvas, { count: 1, previous: canvas.style.touchAction });
  canvas.style.touchAction = 'none';
}

/** Release one {@link claimTouch}; the last release restores the old touch-action. */
export function releaseTouch(canvas: HTMLCanvasElement): void {
  const claim = touchClaims.get(canvas);
  if (!claim) return;
  if (--claim.count > 0) return;
  canvas.style.touchAction = claim.previous;
  touchClaims.delete(canvas);
}

/**
 * Show `cursor` on the canvas for `owner`, or (cursor === null) give up
 * `owner`'s claim; the cursor resets once no owner is left.
 */
export function setCanvasCursor(
  canvas: HTMLCanvasElement,
  owner: object,
  cursor: string | null,
): void {
  let owners = cursorOwners.get(canvas);
  if (!owners) {
    owners = new Set();
    cursorOwners.set(canvas, owners);
  }
  if (cursor !== null) {
    owners.add(owner);
    canvas.style.cursor = cursor;
  } else if (owners.delete(owner) && owners.size === 0) {
    canvas.style.cursor = '';
  }
}

/** A world-unit frame centered on the origin that spans the whole canvas. */
export interface ScreenFrame {
  width: number;
  height: number;
}

/** The 2D camera's frame, unless `frame` overrides it (e.g. a 3D scene's HUD frame). */
function frameOf(scene: Scene, frame?: ScreenFrame): ScreenFrame {
  return frame ?? { width: scene.camera.frameWidth, height: scene.camera.frameHeight };
}

/** Canvas client point -> 2D world point (same mapping as Draggable). */
export function screenToWorld(
  scene: Scene,
  clientX: number,
  clientY: number,
  frame?: ScreenFrame,
): [number, number] {
  const rect = scene.getCanvas().getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
  const { width, height } = frameOf(scene, frame);
  return [(ndcX * width) / 2, (ndcY * height) / 2];
}

/**
 * 2D world point -> canvas client point. Inverse of {@link screenToWorld}.
 *
 * @post screenToWorld(scene, ...worldToScreen(scene, x, y, frame), frame) === [x, y]
 */
export function worldToScreen(
  scene: Scene,
  x: number,
  y: number,
  frame?: ScreenFrame,
): [number, number] {
  const rect = scene.getCanvas().getBoundingClientRect();
  const { width, height } = frameOf(scene, frame);
  const ndcX = (x / width) * 2;
  const ndcY = (y / height) * 2;
  return [rect.left + ((ndcX + 1) / 2) * rect.width, rect.top + ((1 - ndcY) / 2) * rect.height];
}

/** An axis-aligned 2D box in world units. */
export interface WorldBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** World-space box around the mobjects' points, or null when they have none. */
export function worldBoxOf(mobjects: VMobject[]): WorldBox | null {
  const box: WorldBox = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const v = new THREE.Vector3();
  for (const mobject of mobjects) {
    const m = mobject._worldMatrix();
    for (const p of mobject.getLocalPoints()) {
      v.set(p[0], p[1], p[2]).applyMatrix4(m);
      box.minX = Math.min(box.minX, v.x);
      box.maxX = Math.max(box.maxX, v.x);
      box.minY = Math.min(box.minY, v.y);
      box.maxY = Math.max(box.maxY, v.y);
    }
  }
  return box.minX <= box.maxX ? box : null;
}

/** Whether (x, y) lies in the box grown by `pad` on every side. */
export function boxContains(box: WorldBox, x: number, y: number, pad: number): boolean {
  return x >= box.minX - pad && x <= box.maxX + pad && y >= box.minY - pad && y <= box.maxY + pad;
}
