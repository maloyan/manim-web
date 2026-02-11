# Class: SelectionManager

Defined in: [interaction/SelectionManager.ts:38](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L38)

Manages interactive selection of mobjects in a Scene.

Attach to a Scene to enable click-to-select, shift-multi-select,
and box/lasso selection with visual feedback.

## Constructors

### Constructor

> **new SelectionManager**(`scene`, `options`): `SelectionManager`

Defined in: [interaction/SelectionManager.ts:70](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L70)

Create a new SelectionManager.

#### Parameters

##### scene

[`Scene`](Scene.md)

The Scene whose mobjects can be selected

##### options

[`SelectionManagerOptions`](../interfaces/SelectionManagerOptions.md) = `{}`

Configuration options

#### Returns

`SelectionManager`

## Accessors

### count

#### Get Signature

> **get** **count**(): `number`

Defined in: [interaction/SelectionManager.ts:98](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L98)

Number of currently selected mobjects.

##### Returns

`number`

***

### isEnabled

#### Get Signature

> **get** **isEnabled**(): `boolean`

Defined in: [interaction/SelectionManager.ts:103](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L103)

Whether the manager is enabled.

##### Returns

`boolean`

***

### selected

#### Get Signature

> **get** **selected**(): `ReadonlySet`\<[`Mobject`](Mobject.md)\>

Defined in: [interaction/SelectionManager.ts:93](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L93)

Currently selected mobjects (read-only view).

##### Returns

`ReadonlySet`\<[`Mobject`](Mobject.md)\>

## Methods

### deselect()

> **deselect**(...`mobjects`): `void`

Defined in: [interaction/SelectionManager.ts:136](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L136)

Programmatically deselect one or more mobjects.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to deselect

#### Returns

`void`

***

### deselectAll()

> **deselectAll**(): `void`

Defined in: [interaction/SelectionManager.ts:174](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L174)

Deselect all mobjects, removing all highlights.

#### Returns

`void`

***

### disable()

> **disable**(): `void`

Defined in: [interaction/SelectionManager.ts:113](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L113)

Disable selection interactions. Clears current selection.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [interaction/SelectionManager.ts:199](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L199)

Clean up event listeners and highlights.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [interaction/SelectionManager.ts:108](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L108)

Enable selection interactions.

#### Returns

`void`

***

### getSelectedArray()

> **getSelectedArray**(): [`Mobject`](Mobject.md)[]

Defined in: [interaction/SelectionManager.ts:192](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L192)

Get selected mobjects as an array (ordered by selection time).

#### Returns

[`Mobject`](Mobject.md)[]

***

### isSelected()

> **isSelected**(`mob`): `boolean`

Defined in: [interaction/SelectionManager.ts:185](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L185)

Check if a specific mobject is selected.

#### Parameters

##### mob

[`Mobject`](Mobject.md)

#### Returns

`boolean`

***

### refreshHighlights()

> **refreshHighlights**(): `void`

Defined in: [interaction/SelectionManager.ts:549](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L549)

Refresh highlight positions for all selected mobjects.
Call this after moving/transforming selected mobjects.

#### Returns

`void`

***

### select()

> **select**(...`mobjects`): `void`

Defined in: [interaction/SelectionManager.ts:122](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L122)

Programmatically select one or more mobjects.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to select

#### Returns

`void`

***

### selectAll()

> **selectAll**(): `void`

Defined in: [interaction/SelectionManager.ts:161](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L161)

Select all mobjects currently in the scene.

#### Returns

`void`

***

### toggleSelect()

> **toggleSelect**(`mob`): `void`

Defined in: [interaction/SelectionManager.ts:150](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/interaction/SelectionManager.ts#L150)

Toggle selection state of a mobject.

#### Parameters

##### mob

[`Mobject`](Mobject.md)

Mobject to toggle

#### Returns

`void`
