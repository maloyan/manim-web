# Class: SceneStateManager

Defined in: [core/StateManager.ts:223](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L223)

Manages undo/redo state for a collection of mobjects (typically a Scene).

Usage:
```ts
const mgr = new SceneStateManager(scene.mobjects);
mgr.save();          // push current state onto undo stack
// ... user makes edits ...
mgr.undo();          // restore previous state
mgr.redo();          // re-apply the undone edit
```

The manager does not own the mobjects -- it reads/writes them through
a getter so that additions/removals from the scene are reflected.

## Constructors

### Constructor

> **new SceneStateManager**(`getMobjects`, `maxDepth`): `SceneStateManager`

Defined in: [core/StateManager.ts:244](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L244)

#### Parameters

##### getMobjects

() => [`Mobject`](Mobject.md)[]

Getter returning the current scene mobjects (ordered)

##### maxDepth

`number` = `50`

Maximum undo stack depth (default 50)

#### Returns

`SceneStateManager`

## Properties

### maxDepth

> `readonly` **maxDepth**: `number`

Defined in: [core/StateManager.ts:225](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L225)

Maximum number of undo entries. Oldest are discarded when exceeded.

## Accessors

### canRedo

#### Get Signature

> **get** **canRedo**(): `boolean`

Defined in: [core/StateManager.ts:359](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L359)

Whether redo is available

##### Returns

`boolean`

***

### canUndo

#### Get Signature

> **get** **canUndo**(): `boolean`

Defined in: [core/StateManager.ts:354](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L354)

Whether undo is available

##### Returns

`boolean`

***

### redoCount

#### Get Signature

> **get** **redoCount**(): `number`

Defined in: [core/StateManager.ts:349](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L349)

Number of available redo steps

##### Returns

`number`

***

### redoStack

#### Get Signature

> **get** **redoStack**(): readonly [`SceneSnapshot`](../interfaces/SceneSnapshot.md)[]

Defined in: [core/StateManager.ts:369](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L369)

Read-only view of the redo stack (newest last)

##### Returns

readonly [`SceneSnapshot`](../interfaces/SceneSnapshot.md)[]

***

### undoCount

#### Get Signature

> **get** **undoCount**(): `number`

Defined in: [core/StateManager.ts:344](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L344)

Number of available undo steps

##### Returns

`number`

***

### undoStack

#### Get Signature

> **get** **undoStack**(): readonly [`SceneSnapshot`](../interfaces/SceneSnapshot.md)[]

Defined in: [core/StateManager.ts:364](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L364)

Read-only view of the undo stack (newest last)

##### Returns

readonly [`SceneSnapshot`](../interfaces/SceneSnapshot.md)[]

## Methods

### clearHistory()

> **clearHistory**(): `void`

Defined in: [core/StateManager.ts:338](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L338)

Clear both undo and redo stacks.

#### Returns

`void`

***

### getState()

> **getState**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/StateManager.ts:322](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L322)

Get a snapshot of the current scene state without pushing it
onto any stack.

#### Parameters

##### label?

`string`

#### Returns

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

***

### redo()

> **redo**(): `boolean`

Defined in: [core/StateManager.ts:301](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L301)

Redo: re-apply the last undone state.
Pushes the current state onto the undo stack first.

#### Returns

`boolean`

true if redo was applied, false if nothing to redo

***

### save()

> **save**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/StateManager.ts:260](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L260)

Capture the current scene state and push it onto the undo stack.
Clears the redo stack (new action branch).

#### Parameters

##### label?

`string`

Optional human-readable label for this snapshot

#### Returns

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

The captured SceneSnapshot (for inspection / persistence)

***

### setState()

> **setState**(`snapshot`): `void`

Defined in: [core/StateManager.ts:331](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L331)

Apply a previously captured snapshot, overwriting the current scene
state. Does NOT modify undo/redo stacks -- call save() first if you
want the current state preserved.

#### Parameters

##### snapshot

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

#### Returns

`void`

***

### undo()

> **undo**(): `boolean`

Defined in: [core/StateManager.ts:281](https://github.com/maloyan/manim-js/blob/cbd3b062e7939ad24695e46e2d279c4e033e6a03/src/core/StateManager.ts#L281)

Undo: restore the most recently saved state.
Pushes the current state onto the redo stack first.

#### Returns

`boolean`

true if undo was applied, false if nothing to undo
