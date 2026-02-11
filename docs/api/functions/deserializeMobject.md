# Function: deserializeMobject()

> **deserializeMobject**(`mob`, `state`): `void`

Defined in: [core/StateManager.ts:133](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/StateManager.ts#L133)

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
