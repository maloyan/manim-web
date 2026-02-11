# Interface: VideoExportOptions

Defined in: [export/VideoExporter.ts:7](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L7)

Options for configuring video export.

## Properties

### audioManager?

> `optional` **audioManager**: [`AudioManager`](../classes/AudioManager.md)

Defined in: [export/VideoExporter.ts:31](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L31)

Provide an external AudioManager to use for the audio track.
If not specified, the scene's audioManager is used.

***

### duration?

> `optional` **duration**: `number`

Defined in: [export/VideoExporter.ts:19](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L19)

Duration in seconds. Auto-detects from timeline if not specified.

***

### format?

> `optional` **format**: `"webm"` \| `"mp4"`

Defined in: [export/VideoExporter.ts:13](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L13)

Video format. Defaults to 'webm' (mp4 requires additional browser codec support).

***

### fps?

> `optional` **fps**: `number`

Defined in: [export/VideoExporter.ts:9](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L9)

Frames per second. Defaults to 60.

***

### height?

> `optional` **height**: `number`

Defined in: [export/VideoExporter.ts:17](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L17)

Output height in pixels. Defaults to scene height.

***

### includeAudio?

> `optional` **includeAudio**: `boolean`

Defined in: [export/VideoExporter.ts:26](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L26)

Include audio from the scene's AudioManager in the exported video.
Defaults to true when the scene has audio tracks loaded.

***

### onProgress()?

> `optional` **onProgress**: (`progress`) => `void`

Defined in: [export/VideoExporter.ts:21](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L21)

Progress callback (0-1).

#### Parameters

##### progress

`number`

#### Returns

`void`

***

### quality?

> `optional` **quality**: `number`

Defined in: [export/VideoExporter.ts:11](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L11)

Quality from 0-1. Defaults to 0.9.

***

### width?

> `optional` **width**: `number`

Defined in: [export/VideoExporter.ts:15](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/VideoExporter.ts#L15)

Output width in pixels. Defaults to scene width.
