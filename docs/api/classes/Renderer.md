# Class: Renderer

Defined in: [core/Renderer.ts:31](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L31)

Three.js WebGLRenderer wrapper for manimweb.
Handles canvas creation, rendering, and lifecycle management.

## Constructors

### Constructor

> **new Renderer**(`container`, `options`): `Renderer`

Defined in: [core/Renderer.ts:42](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L42)

Create a new Renderer and append it to the container.

#### Parameters

##### container

`HTMLElement`

DOM element to append the canvas to

##### options

[`RendererOptions`](../interfaces/RendererOptions.md) = `{}`

Renderer configuration options

#### Returns

`Renderer`

## Accessors

### backgroundColor

#### Get Signature

> **get** **backgroundColor**(): `Color`

Defined in: [core/Renderer.ts:96](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L96)

Get the background color.

##### Returns

`Color`

#### Set Signature

> **set** **backgroundColor**(`color`): `void`

Defined in: [core/Renderer.ts:103](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L103)

Set the background color.

##### Parameters

###### color

`string` | `Color`

##### Returns

`void`

***

### height

#### Get Signature

> **get** **height**(): `number`

Defined in: [core/Renderer.ts:89](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L89)

Get the current height.

##### Returns

`number`

***

### width

#### Get Signature

> **get** **width**(): `number`

Defined in: [core/Renderer.ts:82](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L82)

Get the current width.

##### Returns

`number`

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [core/Renderer.ts:148](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L148)

Clean up resources.
Removes canvas from DOM and disposes WebGL resources.

#### Returns

`void`

***

### getCanvas()

> **getCanvas**(): `HTMLCanvasElement`

Defined in: [core/Renderer.ts:132](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L132)

Get the underlying canvas element.

#### Returns

`HTMLCanvasElement`

The HTMLCanvasElement used for rendering

***

### getThreeRenderer()

> **getThreeRenderer**(): `WebGLRenderer`

Defined in: [core/Renderer.ts:140](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L140)

Get the underlying Three.js WebGLRenderer.

#### Returns

`WebGLRenderer`

The WebGLRenderer instance

***

### render()

> **render**(`scene`, `camera`): `void`

Defined in: [core/Renderer.ts:113](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L113)

Render a frame.

#### Parameters

##### scene

`Scene`

Three.js scene to render

##### camera

`Camera`

Three.js camera to use

#### Returns

`void`

***

### resize()

> **resize**(`width`, `height`): `void`

Defined in: [core/Renderer.ts:122](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Renderer.ts#L122)

Handle resize events.

#### Parameters

##### width

`number`

New width in pixels

##### height

`number`

New height in pixels

#### Returns

`void`
