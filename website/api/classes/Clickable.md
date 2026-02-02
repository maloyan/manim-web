# Class: Clickable

Defined in: [interaction/Clickable.ts:17](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Clickable.ts#L17)

Adds click detection to a mobject.

## Constructors

### Constructor

> **new Clickable**(`mobject`, `scene`, `options`): `Clickable`

Defined in: [interaction/Clickable.ts:43](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Clickable.ts#L43)

Create a new Clickable behavior.

#### Parameters

##### mobject

[`Mobject`](Mobject.md)

The mobject to make clickable

##### scene

[`Scene`](Scene.md)

The scene containing the mobject

##### options

[`ClickableOptions`](../interfaces/ClickableOptions.md)

Clickable configuration options

#### Returns

`Clickable`

## Accessors

### isEnabled

#### Get Signature

> **get** **isEnabled**(): `boolean`

Defined in: [interaction/Clickable.ts:60](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Clickable.ts#L60)

Get whether clicking is enabled.

##### Returns

`boolean`

***

### mobject

#### Get Signature

> **get** **mobject**(): [`Mobject`](Mobject.md)

Defined in: [interaction/Clickable.ts:67](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Clickable.ts#L67)

Get the mobject this clickable is attached to.

##### Returns

[`Mobject`](Mobject.md)

## Methods

### disable()

> **disable**(): `void`

Defined in: [interaction/Clickable.ts:191](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Clickable.ts#L191)

Disable clicking.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [interaction/Clickable.ts:198](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Clickable.ts#L198)

Clean up event listeners.

#### Returns

`void`

***

### enable()

> **enable**(): `void`

Defined in: [interaction/Clickable.ts:184](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/interaction/Clickable.ts#L184)

Enable clicking.

#### Returns

`void`
