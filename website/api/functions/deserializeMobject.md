# Function: deserializeMobject()

> **deserializeMobject**(`mob`, `state`): `void`

Defined in: [core/StateManager.ts:133](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/StateManager.ts#L133)

Restore a mobject's properties from a previously captured state.
Applies position, rotation, scale, style, and VMobject points.
Does NOT add/remove children -- it restores properties of existing children
matched by array index (same order as when serialized).

## Parameters

### mob

[`Mobject`](../classes/Mobject.md)

The mobject to restore

### state

[`MobjectState`](../interfaces/MobjectState.md)

The state to apply

## Returns

`void`
