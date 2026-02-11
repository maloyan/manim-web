# Function: restoreMobjectState()

> **restoreMobjectState**(`mob`): `boolean`

Defined in: [core/StateManager.ts:435](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/StateManager.ts#L435)

Restore a mobject from its JSON-serializable saved state
(from saveMobjectState or serializeMobject).

This is the functional counterpart to `mob.restoreState()`.
Unlike the class method which uses the deep-copy path,
this function uses the JSON-serializable MobjectState.

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to restore

## Returns

`boolean`

true if state was restored, false if no saved state exists
