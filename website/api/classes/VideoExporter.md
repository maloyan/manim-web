# Class: VideoExporter

Defined in: [export/VideoExporter.ts:58](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L58)

Video exporter for manimweb scenes.
Uses the MediaRecorder API for browser-native recording.

WebM with VP9 has the best browser support.
MP4 encoding requires browser support (limited availability).

Frame-by-frame export gives consistent results vs real-time recording.

When `includeAudio` is true (default when audio tracks exist), the exported
video includes the mixed-down audio from the scene's AudioManager.

## Constructors

### Constructor

> **new VideoExporter**(`scene`, `options?`): `VideoExporter`

Defined in: [export/VideoExporter.ts:70](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L70)

Create a new VideoExporter.

#### Parameters

##### scene

[`Scene`](Scene.md)

The scene to export

##### options?

[`VideoExportOptions`](../interfaces/VideoExportOptions.md)

Export options

#### Returns

`VideoExporter`

## Methods

### exportAndDownload()

> **exportAndDownload**(`filename?`, `duration?`): `Promise`\<`void`\>

Defined in: [export/VideoExporter.ts:267](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L267)

Convenience method: export timeline and download the result.

#### Parameters

##### filename?

`string`

Optional filename (extension auto-added based on format)

##### duration?

`number`

Optional duration override

#### Returns

`Promise`\<`void`\>

***

### exportAudio()

> **exportAudio**(`duration?`): `Promise`\<`Blob`\>

Defined in: [export/VideoExporter.ts:238](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L238)

Export audio-only as a WAV Blob.
Useful when you need the audio track separately (e.g., for external muxing).

#### Parameters

##### duration?

`number`

Duration in seconds (defaults to timeline duration)

#### Returns

`Promise`\<`Blob`\>

WAV Blob, or null if no audio is available

***

### exportTimeline()

> **exportTimeline**(`duration?`): `Promise`\<`Blob`\>

Defined in: [export/VideoExporter.ts:192](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L192)

Export a specific duration of the timeline.
Renders frame-by-frame for consistent results.

If the scene has audio and `includeAudio` is true, audio is included
in the exported video file.

#### Parameters

##### duration?

`number`

Duration to export in seconds (auto-detects from timeline if not specified)

#### Returns

`Promise`\<`Blob`\>

Promise resolving to the video Blob

***

### getOptions()

> **getOptions**(): `Readonly`\<`ResolvedVideoExportOptions`\>

Defined in: [export/VideoExporter.ts:285](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L285)

Get the export options.

#### Returns

`Readonly`\<`ResolvedVideoExportOptions`\>

The resolved export options

***

### isRecording()

> **isRecording**(): `boolean`

Defined in: [export/VideoExporter.ts:277](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L277)

Check if currently recording.

#### Returns

`boolean`

true if recording is in progress

***

### startRecording()

> **startRecording**(): `Promise`\<`void`\>

Defined in: [export/VideoExporter.ts:108](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L108)

Start recording the scene.
If audio is available and `includeAudio` is true, the audio stream
is merged into the recording.

#### Returns

`Promise`\<`void`\>

#### Throws

Error if already recording or format not supported

***

### stopRecording()

> **stopRecording**(): `Promise`\<`Blob`\>

Defined in: [export/VideoExporter.ts:162](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L162)

Stop recording and return the video blob.

#### Returns

`Promise`\<`Blob`\>

Promise resolving to the video Blob

#### Throws

Error if not recording

***

### download()

> `static` **download**(`blob`, `filename`): `void`

Defined in: [export/VideoExporter.ts:251](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/export/VideoExporter.ts#L251)

Download a video blob as a file.

#### Parameters

##### blob

`Blob`

The video blob to download

##### filename

`string` = `'animation.webm'`

The filename (defaults to 'animation.webm')

#### Returns

`void`
