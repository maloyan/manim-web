# Class: GifExporter

Defined in: [export/GifExporter.ts:15](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/GifExporter.ts#L15)

## Constructors

### Constructor

> **new GifExporter**(`scene`, `options?`): `GifExporter`

Defined in: [export/GifExporter.ts:19](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/GifExporter.ts#L19)

#### Parameters

##### scene

[`Scene`](Scene.md)

##### options?

[`GifExportOptions`](../interfaces/GifExportOptions.md)

#### Returns

`GifExporter`

## Methods

### exportAndDownload()

> **exportAndDownload**(`filename`, `duration?`): `Promise`\<`void`\>

Defined in: [export/GifExporter.ts:127](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/GifExporter.ts#L127)

Convenience method: export and download

#### Parameters

##### filename

`string` = `'animation.gif'`

##### duration?

`number`

#### Returns

`Promise`\<`void`\>

***

### exportTimeline()

> **exportTimeline**(`duration?`): `Promise`\<`Blob`\>

Defined in: [export/GifExporter.ts:37](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/GifExporter.ts#L37)

Export the timeline as a GIF

#### Parameters

##### duration?

`number`

#### Returns

`Promise`\<`Blob`\>

***

### download()

> `static` **download**(`blob`, `filename`): `void`

Defined in: [export/GifExporter.ts:113](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/export/GifExporter.ts#L113)

Download the GIF

#### Parameters

##### blob

`Blob`

##### filename

`string` = `'animation.gif'`

#### Returns

`void`
