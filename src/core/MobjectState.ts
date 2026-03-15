import type { MobjectLike, MobjectStyle } from './MobjectTypes';
import { isVMobjectLike } from './MobjectTypes';

/** Helper to access protected/private members on MobjectLike at runtime. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asInternal(m: MobjectLike): any {
  return m;
}

/**
 * Copy the core visual/transform properties from `src` onto `dst`.
 * Used by both becomeMobjectImpl and restoreMobjectStateImpl.
 */
function copyMobjectProperties(dst: MobjectLike, src: MobjectLike): void {
  dst.position.copy(src.position);
  dst.rotation.copy(src.rotation);
  dst.scaleVector.copy(src.scaleVector);
  dst.color = src.color;
  // Access protected members via runtime helper (bypasses TS access checks)
  asInternal(dst)._opacity = asInternal(src)._opacity;
  dst.strokeWidth = src.strokeWidth;
  dst.fillOpacity = src.fillOpacity;
  asInternal(dst)._style = { ...asInternal(src)._style } as MobjectStyle;
}

/**
 * Save the current state of a mobject so it can be restored later.
 * Stores a deep copy on `mob.savedState` and a serializable snapshot
 * on `mob.__savedMobjectState`.
 */
export function saveMobjectStateImpl(mob: MobjectLike): void {
  // Store a deep copy for Restore animation and for restoreState()
  mob.savedState = mob.copy();

  // Also store a plain-object snapshot for JSON serialization
  mob.__savedMobjectState = {
    position: [mob.position.x, mob.position.y, mob.position.z],
    rotation: [mob.rotation.x, mob.rotation.y, mob.rotation.z, mob.rotation.order],
    scale: [mob.scaleVector.x, mob.scaleVector.y, mob.scaleVector.z],
    color: mob.color,
    opacity: mob.opacity,
    strokeWidth: mob.strokeWidth,
    fillOpacity: mob.fillOpacity,
    style: { ...asInternal(mob)._style },
  };
}

/**
 * Restore a mobject to its previously saved state (from saveState).
 * Uses the deep copy stored on `mob.savedState` to restore all properties.
 *
 * @returns true if state was restored, false if no saved state exists
 */
export function restoreMobjectStateImpl(mob: MobjectLike): boolean {
  const saved = mob.savedState;
  if (!saved) return false;

  // Restore transform and visual properties
  copyMobjectProperties(mob, saved);

  // Restore VMobject points if applicable (type-safe duck-typing)
  if (isVMobjectLike(mob) && isVMobjectLike(saved)) {
    const pts = saved.getPoints();
    if (pts && pts.length > 0) {
      mob.setPoints(pts);
    }
    if (saved._visiblePointCount !== undefined) {
      mob._visiblePointCount = saved._visiblePointCount;
      mob._geometryDirty = true;
    }
  }

  // Recursively restore children by index
  const minLen = Math.min(mob.children.length, saved.children.length);
  for (let i = 0; i < minLen; i++) {
    // Temporarily set the child's savedState for recursive restore
    mob.children[i].savedState = saved.children[i];
    mob.children[i].restoreState();
  }

  mob._markDirty();
  return true;
}

/**
 * Replace a mobject's visual properties with those of another mobject.
 * Preserves identity (updaters, scene membership) but copies appearance.
 */
export function becomeMobjectImpl(mob: MobjectLike, other: MobjectLike): void {
  copyMobjectProperties(mob, other);

  // If both are VMobjects, copy points
  if (isVMobjectLike(mob) && isVMobjectLike(other)) {
    mob._points3D = other._points3D.map((p: number[]) => [...p]);
    mob._visiblePointCount = other._visiblePointCount;
    mob._geometryDirty = true;
  }

  mob._markDirty();
}

/**
 * Scale and reposition a mobject to match another mobject's bounding box.
 * Matches Manim Python's replace() behavior.
 */
export function replaceMobjectImpl(mob: MobjectLike, target: MobjectLike, stretch: boolean): void {
  const targetBounds = target.getBoundingBox();
  const selfBounds = mob.getBoundingBox();

  if (stretch) {
    const sx = selfBounds.width > 0.0001 ? targetBounds.width / selfBounds.width : 1;
    const sy = selfBounds.height > 0.0001 ? targetBounds.height / selfBounds.height : 1;
    mob.scaleVector.x *= sx;
    mob.scaleVector.y *= sy;
  } else {
    const factor = selfBounds.width > 0.0001 ? targetBounds.width / selfBounds.width : 1;
    mob.scaleVector.multiplyScalar(factor);
  }

  // Center on target
  const targetCenter = target.getCenter();
  mob.position.set(targetCenter[0], targetCenter[1], targetCenter[2]);
  mob._markDirty();
}

/**
 * Apply a point-wise function to every VMobject descendant's control points.
 * Uses duck-type check for getPoints/setPoints to avoid circular imports.
 */
export function applyFunctionImpl(mob: MobjectLike, fn: (point: number[]) => number[]): void {
  for (const m of mob.getFamily()) {
    const asAny = m as unknown as {
      getPoints?: () => number[][];
      setPoints?: (pts: number[][]) => void;
    };
    if (typeof asAny.getPoints === 'function' && typeof asAny.setPoints === 'function') {
      const pts = asAny.getPoints();
      if (pts.length > 0) {
        asAny.setPoints(pts.map((p) => fn([...p])));
      }
    }
  }
}

/**
 * Evaluate a cubic Bezier curve at parameter t using de Casteljau's algorithm.
 */
function evalBezier(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const s = 1 - t;
  const result: number[] = [];
  for (let k = 0; k < p0.length; k++) {
    // B(t) = (1-t)^3 * P0 + 3(1-t)^2*t * P1 + 3(1-t)*t^2 * P2 + t^3 * P3
    result.push(
      s * s * s * p0[k] + 3 * s * s * t * p1[k] + 3 * s * t * t * p2[k] + t * t * t * p3[k],
    );
  }
  return result;
}

/**
 * Subdivide every VMobject descendant's cubic Bezier curves so that non-linear
 * transforms produce smooth results. Each cubic segment is split into n sub-segments
 * via de Casteljau evaluation.
 */
export function prepareForNonlinearTransformImpl(mob: MobjectLike, numPieces: number): void {
  for (const m of mob.getFamily()) {
    const asAny = m as unknown as {
      getPoints?: () => number[][];
      setPoints?: (pts: number[][]) => void;
    };
    if (typeof asAny.getPoints === 'function' && typeof asAny.setPoints === 'function') {
      const pts = asAny.getPoints();
      if (pts.length < 4) continue;
      const newPoints: number[][] = [];
      // Process each cubic Bezier segment (groups of 4 points: anchor, handle, handle, anchor)
      for (let i = 0; i + 3 < pts.length; i += 3) {
        const p0 = pts[i],
          p1 = pts[i + 1],
          p2 = pts[i + 2],
          p3 = pts[i + 3];
        for (let j = 0; j < numPieces; j++) {
          const tStart = j / numPieces;
          const tEnd = (j + 1) / numPieces;
          // Evaluate de Casteljau at tStart and tEnd for sub-curve anchors
          const start = evalBezier(p0, p1, p2, p3, tStart);
          const end = evalBezier(p0, p1, p2, p3, tEnd);
          // Approximate sub-curve handles by evaluating at 1/3 and 2/3 within sub-interval
          const t1 = tStart + (tEnd - tStart) / 3;
          const t2 = tStart + (2 * (tEnd - tStart)) / 3;
          const h1 = evalBezier(p0, p1, p2, p3, t1);
          const h2 = evalBezier(p0, p1, p2, p3, t2);
          if (j === 0 && i === 0) {
            newPoints.push(start);
          }
          newPoints.push(h1, h2, end);
        }
      }
      asAny.setPoints(newPoints);
    }
  }
}
