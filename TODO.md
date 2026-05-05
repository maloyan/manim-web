# PR #319 Review TODOs

**Status: Phase 0-1 COMPLETE ✓**

---

## Phase 0: Restore triangulation (COMPLETED ✓)

- [x] **[High-1]** `buildEarcutFillGeometryMulti` — Reverted to original ring-containment hierarchy
  - Restored `isHoleOf` logic (outer rings carry their own holes)
  - Removed heuristic "primary outer by perimeter" approach
  - Removed helper functions `buildGeometryFromTriangleIndices` and `ringPerimeter2D`

---

## Phase 1: Easy fixes (COMPLETED ✓)

- [x] **[Low-8]** Leaky re-export removed from `VMobjectGeometry.ts`
  - Updated 4 importers to import directly from `VMobjectTransformAlignment`
  - Removed re-export line from `VMobjectGeometry.ts`

- [x] **[Low-3]** JSDoc updated in `resamplePointList3D`
  - Updated doc to reflect Bezier-aware fast path + piecewise-linear fallback

- [x] **[Low-10]** `getSubpathOrientationSign` now throws `RangeError`
  - Removed wrong fallback to overall shape orientation
  - Throws on out-of-range index

---

## Phase 2: Medium complexity (COMPLETED ✓)

- [x] **[Medium-7]** `resamplePointList3D` empty input now throws
  - Empty point list is a metadata bug → throw instead of silent fill with zeros

- [x] **[Medium-6]** `alignCompoundPathsForTransform` validation before early-return
  - Moved `validateSubpathLengths` before early-return check
  - Added `srcSigns.length === srcLengths.length` parity check
  - Added `tgtSigns.length === tgtLengths.length` parity check

---

## Phase 3: Harder issues (PENDING)

- [ ] **[Medium-5]** Degenerate/near-zero area classified as CCW
  - Both `VMobjectTransformAlignment.ts` and `VMobject.ts` share this issue
  - Both use `area < 0 ? -1 : 1` without epsilon

- [ ] **[Medium-9]** `getSubpathOrientationSigns` silently returns undefined
  - Could throw on inconsistency (same pattern as `validateSubpathLengths`)
  - Or document that undefined is intentional for missing metadata

- [ ] **[Medium-11]** Test `transform.test.ts` removes silent catch
  - Remove `try/catch` in MathTex 1→0 regression test
  - Let test fail loudly on alignment errors

---

## Summary by priority

| # | Priority | Status | Issue | File |
|---|----------|--------|-------|------|
| 1 | High | ✅ Done | Restore triangulation | `VMobjectGeometry.ts` |
| 2 | Low | ✅ Done | leaky re-export | `VMobjectGeometry.ts` |
| 3 | Low | ✅ Done | JSDoc inaccurate | `VMobjectTransformAlignment.ts` |
| 4 | Low | ✅ Done | wrong index fallback | `VMobject.ts` |
| 5 | Medium | ✅ Done | empty input fallback | `VMobjectTransformAlignment.ts` |
| 6 | Medium | ✅ Done | early-return bypass validation | `VMobjectTransformAlignment.ts` |
| 7 | Medium | PENDING | degenerate area → CCW | `VMobjectTransformAlignment.ts` + `VMobject.ts` |
| 8 | Medium | PENDING | silent undefined on bad metadata | `VMobject.ts` |
| 9 | Medium | PENDING | empty catch in test | `transform.test.ts` |