# Class: Scene

Defined in: [core/Scene.ts:40](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L40)

Scene orchestrator for manimweb.
Manages the renderer, camera, mobjects, and animation playback.
Works like Manim's Scene class - add mobjects, play animations.

## Extended by

- [`InteractiveScene`](InteractiveScene.md)
- [`ThreeDScene`](ThreeDScene.md)
- [`ZoomedScene`](ZoomedScene.md)

## Constructors

### Constructor

> **new Scene**(`container`, `options`): `Scene`

Defined in: [core/Scene.ts:82](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L82)

Create a new Scene.

#### Parameters

##### container

`HTMLElement`

DOM element to render into

##### options

[`SceneOptions`](../interfaces/SceneOptions.md) = `{}`

Scene configuration options

#### Returns

`Scene`

## Properties

### \_autoRender

> `protected` **\_autoRender**: `boolean` = `true`

Defined in: [core/Scene.ts:66](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L66)

## Accessors

### audioManager

#### Get Signature

> **get** **audioManager**(): [`AudioManager`](AudioManager.md)

Defined in: [core/Scene.ts:198](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L198)

Get the audio manager (lazily created on first access).
Use this to access lower-level audio controls.

##### Returns

[`AudioManager`](AudioManager.md)

***

### camera

#### Get Signature

> **get** **camera**(): [`Camera2D`](Camera2D.md)

Defined in: [core/Scene.ts:151](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L151)

Get the camera.

##### Returns

[`Camera2D`](Camera2D.md)

***

### currentTime

#### Get Signature

> **get** **currentTime**(): `number`

Defined in: [core/Scene.ts:179](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L179)

Get the current playback time.

##### Returns

`number`

***

### isPlaying

#### Get Signature

> **get** **isPlaying**(): `boolean`

Defined in: [core/Scene.ts:172](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L172)

Get whether animations are currently playing.

##### Returns

`boolean`

***

### mobjects

#### Get Signature

> **get** **mobjects**(): `ReadonlySet`\<[`Mobject`](Mobject.md)\>

Defined in: [core/Scene.ts:186](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L186)

Get all mobjects in the scene.

##### Returns

`ReadonlySet`\<[`Mobject`](Mobject.md)\>

***

### renderer

#### Get Signature

> **get** **renderer**(): [`Renderer`](Renderer.md)

Defined in: [core/Scene.ts:158](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L158)

Get the renderer.

##### Returns

[`Renderer`](Renderer.md)

***

### stateManager

#### Get Signature

> **get** **stateManager**(): [`SceneStateManager`](SceneStateManager.md)

Defined in: [core/Scene.ts:891](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L891)

Get the scene's state manager for advanced undo/redo control.

##### Returns

[`SceneStateManager`](SceneStateManager.md)

***

### threeScene

#### Get Signature

> **get** **threeScene**(): `Scene`

Defined in: [core/Scene.ts:144](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L144)

Get the Three.js scene.

##### Returns

`Scene`

***

### timeline

#### Get Signature

> **get** **timeline**(): [`Timeline`](Timeline.md)

Defined in: [core/Scene.ts:165](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L165)

Get the current timeline.

##### Returns

[`Timeline`](Timeline.md)

## Methods

### \_render()

> `protected` **\_render**(): `void`

Defined in: [core/Scene.ts:592](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L592)

Render a single frame.
Syncs only dirty mobjects before rendering for performance.
Protected so subclasses (e.g. ZoomedScene) can override for multi-pass rendering.

#### Returns

`void`

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Scene.ts:270](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L270)

Add mobjects to the scene.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to add

#### Returns

`this`

***

### addForegroundMobject()

> **addForegroundMobject**(...`mobjects`): `this`

Defined in: [core/Scene.ts:251](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L251)

Add mobjects as foreground objects that render on top of everything.
Matches Manim Python's add_foreground_mobject().

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to add in the foreground

#### Returns

`this`

***

### addSound()

> **addSound**(`url`, `options?`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/Scene.ts:219](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L219)

Add a sound to play at a specific time on the timeline.
Mirrors Python manim's `self.add_sound("file.wav", time_offset=0.5)`.

#### Parameters

##### url

`string`

URL of the audio file

##### options?

[`AddSoundOptions`](../interfaces/AddSoundOptions.md)

Scheduling and playback options

#### Returns

`Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Promise resolving to the created AudioTrack

#### Example

```ts
await scene.addSound('/sounds/click.wav', { time: 0.5 });
await scene.addSound('/sounds/whoosh.wav');  // plays at time 0
```

***

### addSoundAtAnimation()

> **addSoundAtAnimation**(`animation`, `url`, `options?`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/Scene.ts:238](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L238)

Add a sound that starts when a given animation begins.

#### Parameters

##### animation

[`Animation`](Animation.md)

The animation to sync with

##### url

`string`

URL of the audio file

##### options?

`Omit`\<[`AddSoundOptions`](../interfaces/AddSoundOptions.md), `"time"`\> & `object`

Additional options (timeOffset shifts relative to animation start)

#### Returns

`Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Promise resolving to the created AudioTrack

#### Example

```ts
const fadeIn = new FadeIn(circle);
await scene.addSoundAtAnimation(fadeIn, '/sounds/appear.wav');
await scene.play(fadeIn);
```

***

### batch()

> **batch**(`callback`): `void`

Defined in: [core/Scene.ts:785](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L785)

Batch multiple mobject updates without re-rendering between each.
Useful for performance when making many changes at once.

#### Parameters

##### callback

() => `void`

Function containing multiple mobject operations

#### Returns

`void`

#### Example

```ts
scene.batch(() => {
  circle.setColor('red');
  circle.shift([1, 0, 0]);
  square.setOpacity(0.5);
});
```

***

### clear()

> **clear**(): `this`

Defined in: [core/Scene.ts:340](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L340)

Clear all mobjects from the scene.

#### Returns

`this`

***

### dispose()

> **dispose**(): `void`

Defined in: [core/Scene.ts:971](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L971)

Clean up all resources (renderer, mobjects, audio).

#### Returns

`void`

***

### getCanvas()

> **getCanvas**(): `HTMLCanvasElement`

Defined in: [core/Scene.ts:843](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L843)

Get the canvas element.

#### Returns

`HTMLCanvasElement`

The HTMLCanvasElement used for rendering

***

### getContainer()

> **getContainer**(): `HTMLElement`

Defined in: [core/Scene.ts:852](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L852)

Get the container element the scene is rendered into.
Returns the parent element of the canvas.

#### Returns

`HTMLElement`

The container HTMLElement

***

### getHeight()

> **getHeight**(): `number`

Defined in: [core/Scene.ts:872](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L872)

Get the height of the canvas in pixels.

#### Returns

`number`

Canvas height in pixels

***

### getState()

> **getState**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/Scene.ts:945](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L945)

Get a snapshot of the current scene state without modifying stacks.

#### Parameters

##### label?

`string`

#### Returns

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

***

### getTargetFps()

> **getTargetFps**(): `number`

Defined in: [core/Scene.ts:811](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L811)

Get the current target frame rate.

#### Returns

`number`

Target fps

***

### getTimelineDuration()

> **getTimelineDuration**(): `number`

Defined in: [core/Scene.ts:880](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L880)

Get the total duration of the current timeline.

#### Returns

`number`

Duration in seconds, or 0 if no timeline

***

### getWidth()

> **getWidth**(): `number`

Defined in: [core/Scene.ts:864](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L864)

Get the width of the canvas in pixels.

#### Returns

`number`

Canvas width in pixels

***

### isInView()

> **isInView**(`object`): `boolean`

Defined in: [core/Scene.ts:634](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L634)

Check if an object is within the camera's view frustum.
Useful for manual culling checks or debugging.

#### Parameters

##### object

`Object3D`

Three.js object to check

#### Returns

`boolean`

true if object is in view or if culling is disabled

***

### pause()

> **pause**(): `this`

Defined in: [core/Scene.ts:528](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L528)

Pause playback (video and audio).

#### Returns

`this`

***

### play()

> **play**(...`animations`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:380](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L380)

Play animations in parallel (all at once).
Matches Manim's scene.play() behavior where multiple animations run simultaneously.
Automatically adds mobjects to the scene if not already present.

#### Parameters

##### animations

...[`Animation`](Animation.md)[]

Animations to play

#### Returns

`Promise`\<`void`\>

Promise that resolves when all animations complete

***

### playAll()

> **playAll**(...`animations`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:436](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L436)

Play multiple animations in parallel (all at once).
Alias for play() - delegates to play() to avoid duplicated logic.

#### Parameters

##### animations

...[`Animation`](Animation.md)[]

Animations to play simultaneously

#### Returns

`Promise`\<`void`\>

Promise that resolves when all animations complete

***

### redo()

> **redo**(): `boolean`

Defined in: [core/Scene.ts:934](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L934)

Redo the last undone change.
The current state is pushed to the undo stack.

#### Returns

`boolean`

true if redo was applied, false if nothing to redo

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Scene.ts:307](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L307)

Remove mobjects from the scene.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to remove

#### Returns

`this`

***

### render()

> **render**(): `void`

Defined in: [core/Scene.ts:964](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L964)

Force render a single frame.
Useful for video export where frames need to be captured at specific times.

#### Returns

`void`

***

### resize()

> **resize**(`width`, `height`): `this`

Defined in: [core/Scene.ts:829](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L829)

Handle window resize.

#### Parameters

##### width

`number`

New width in pixels

##### height

`number`

New height in pixels

#### Returns

`this`

***

### resume()

> **resume**(): `this`

Defined in: [core/Scene.ts:542](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L542)

Resume playback (video and audio).

#### Returns

`this`

***

### saveState()

> **saveState**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/Scene.ts:910](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L910)

Save the current state of all scene mobjects.
Pushes onto the undo stack and clears the redo stack.

#### Parameters

##### label?

`string`

Optional human-readable label

#### Returns

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

The captured SceneSnapshot

#### Example

```ts
scene.add(circle, square);
scene.saveState();
circle.shift([2, 0, 0]);
scene.undo(); // circle returns to original position
```

***

### seek()

> **seek**(`time`): `this`

Defined in: [core/Scene.ts:513](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L513)

Seek to a specific time in the timeline.
Also seeks the audio manager if audio has been used.

#### Parameters

##### time

`number`

Time in seconds

#### Returns

`this`

***

### setFrustumCulling()

> **setFrustumCulling**(`enabled`): `this`

Defined in: [core/Scene.ts:819](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L819)

Enable or disable frustum culling.

#### Parameters

##### enabled

`boolean`

Whether frustum culling should be enabled

#### Returns

`this`

***

### setState()

> **setState**(`snapshot`): `void`

Defined in: [core/Scene.ts:953](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L953)

Apply a previously captured snapshot, overwriting all mobject states.
Does NOT modify undo/redo stacks. Call saveState() first to preserve.

#### Parameters

##### snapshot

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

#### Returns

`void`

***

### setTargetFps()

> **setTargetFps**(`fps`): `this`

Defined in: [core/Scene.ts:801](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L801)

Set the target frame rate.

#### Parameters

##### fps

`number`

Target frames per second (1-120)

#### Returns

`this`

***

### stop()

> **stop**(): `this`

Defined in: [core/Scene.ts:557](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L557)

Stop playback and reset timeline (video and audio).

#### Returns

`this`

***

### undo()

> **undo**(): `boolean`

Defined in: [core/Scene.ts:920](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L920)

Undo the last change (restore the most recently saved state).
The current state is pushed to the redo stack.

#### Returns

`boolean`

true if undo was applied, false if nothing to undo

***

### wait()

> **wait**(`duration`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:446](https://github.com/maloyan/manim-js/blob/9c9bee74d35f8b24042f1a9c73cb07c40c986b6e/src/core/Scene.ts#L446)

Wait for a duration (pause between animations).
Runs a render loop during the wait so that updaters keep ticking.

#### Parameters

##### duration

`number` = `1`

Duration in seconds

#### Returns

`Promise`\<`void`\>

Promise that resolves after the duration
