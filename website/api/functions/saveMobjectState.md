# Function: saveMobjectState()

> **saveMobjectState**(`mob`): [`MobjectState`](../interfaces/MobjectState.md)

Defined in: [core/StateManager.ts:411](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/StateManager.ts#L411)

Save the current state of a mobject using JSON-serializable snapshots.
Stores:
- A JSON-serializable MobjectState on `mob.__savedMobjectState`
- A deep copy on `mob.savedState` (for Restore animation compatibility)

This is the functional counterpart to `mob.saveState()`. Both produce
identical results; use whichever API style you prefer.

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to save

## Returns

[`MobjectState`](../interfaces/MobjectState.md)

The captured MobjectState
