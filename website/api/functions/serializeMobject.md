# Function: serializeMobject()

> **serializeMobject**(`mob`): [`MobjectState`](../interfaces/MobjectState.md)

Defined in: [core/StateManager.ts:95](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/StateManager.ts#L95)

Capture a JSON-serializable snapshot of a mobject and its hierarchy.
Non-destructive: does not modify the mobject in any way.

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to serialize

## Returns

[`MobjectState`](../interfaces/MobjectState.md)

A deep, JSON-safe MobjectState
