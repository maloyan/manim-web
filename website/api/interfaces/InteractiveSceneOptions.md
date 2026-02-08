# Interface: InteractiveSceneOptions

Defined in: [core/InteractiveScene.ts:36](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/InteractiveScene.ts#L36)

Options for configuring an InteractiveScene.

## Extends

- [`SceneOptions`](SceneOptions.md)

## Properties

### autoRender?

> `optional` **autoRender**: `boolean`

Defined in: [core/Scene.ts:32](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L32)

Enable auto-render on add/remove. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`autoRender`](SceneOptions.md#autorender)

***

### backgroundColor?

> `optional` **backgroundColor**: `string`

Defined in: [core/Scene.ts:22](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L22)

Background color as CSS color string. Defaults to Manim's dark gray (#1C1C1C).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`backgroundColor`](SceneOptions.md#backgroundcolor)

***

### colorPaletteToggleKey?

> `optional` **colorPaletteToggleKey**: `string`

Defined in: [core/InteractiveScene.ts:42](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/InteractiveScene.ts#L42)

Hotkey to toggle color palette. Defaults to 'c'.

***

### enableDragMove?

> `optional` **enableDragMove**: `boolean`

Defined in: [core/InteractiveScene.ts:44](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/InteractiveScene.ts#L44)

Whether drag-to-reposition is enabled. Defaults to true.

***

### enableKeyboardShortcuts?

> `optional` **enableKeyboardShortcuts**: `boolean`

Defined in: [core/InteractiveScene.ts:46](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/InteractiveScene.ts#L46)

Whether keyboard shortcuts are enabled. Defaults to true.

***

### frameHeight?

> `optional` **frameHeight**: `number`

Defined in: [core/Scene.ts:26](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L26)

Frame height in world units. Defaults to 8 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameHeight`](SceneOptions.md#frameheight)

***

### frameWidth?

> `optional` **frameWidth**: `number`

Defined in: [core/Scene.ts:24](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L24)

Frame width in world units. Defaults to 14 (Manim standard).

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frameWidth`](SceneOptions.md#framewidth)

***

### frustumCulling?

> `optional` **frustumCulling**: `boolean`

Defined in: [core/Scene.ts:30](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L30)

Enable frustum culling optimization. Defaults to true.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`frustumCulling`](SceneOptions.md#frustumculling)

***

### height?

> `optional` **height**: `number`

Defined in: [core/Scene.ts:20](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L20)

Canvas height in pixels. Defaults to container height.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`height`](SceneOptions.md#height)

***

### selection?

> `optional` **selection**: [`SelectionManagerOptions`](SelectionManagerOptions.md)

Defined in: [core/InteractiveScene.ts:38](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/InteractiveScene.ts#L38)

SelectionManager configuration.

***

### showColorPalette?

> `optional` **showColorPalette**: `boolean`

Defined in: [core/InteractiveScene.ts:40](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/InteractiveScene.ts#L40)

Whether to show the color palette HUD on launch. Defaults to false.

***

### targetFps?

> `optional` **targetFps**: `number`

Defined in: [core/Scene.ts:28](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L28)

Target frame rate in fps. Defaults to 60.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`targetFps`](SceneOptions.md#targetfps)

***

### width?

> `optional` **width**: `number`

Defined in: [core/Scene.ts:18](https://github.com/maloyan/manim-js/blob/bb3df540431462df8cb4b68d80f4f748b060aefb/src/core/Scene.ts#L18)

Canvas width in pixels. Defaults to container width.

#### Inherited from

[`SceneOptions`](SceneOptions.md).[`width`](SceneOptions.md#width)
