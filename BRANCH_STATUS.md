# Branch Status Report

## Current State

Two divergent branches exist, both ahead of `main`:

### `font-size-constant` (30 commits ahead of main)
Font rendering fixes including:
- `DEFAULT_FONT_SIZE_PT = 48` constant
- `DEFAULT_FONT_SIZE_IN_WORLD_SPACE = 0.5` constant
- Proper MathTex scaling via `_scaleToTarget()`
- MathTexImage world dimension fixes
- Text CSS `pt` vs `px` fixes
- KaTeX font-size CSS injection

### `issue-251-mathtex-animation-tests` (3 commits ahead of main)
Transform and animation tests:
- `8e2e794` test: add MathTex animation tests for issue #251
- `1ebc523` fix: capture and interpolate child positions in VGroup transforms
- `c0547f6` fix(transform): leaf world snapshots for VGroup shift

## The Problem

The `issue-251-mathtex-animation-tests` branch was created **before** merging `font-size-constant`. 

Its tests use the **old font sizing** (no `DEFAULT_FONT_SIZE_*` constants, no proper `_scaleToTarget()` logic). Any size assertions in those tests would be based on incorrect assumptions.

## Resolution Needed

1. **Option A**: Merge `font-size-constant` into `issue-251-mathtex-animation-tests`, then update test expectations
2. **Option B**: Merge both into `main` separately (font-size first), then rebase the test branch

## Recommendation

Merge `font-size-constant` → `main` first (it's the foundational fix), then rebase or merge the animation test branch on top.
