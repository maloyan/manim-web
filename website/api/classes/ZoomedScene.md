# Class: ZoomedScene

Defined in: [core/SceneExtensions.ts:728](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L728)

Scene with zoom/magnification capability.
Displays a zoomed view of a region in a separate window, using Mobject-based
camera frame and display objects compatible with Manim animations.

## Extends

- [`Scene`](Scene.md)

## Constructors

### Constructor

> **new ZoomedScene**(`container`, `options`): `ZoomedScene`

Defined in: [core/SceneExtensions.ts:744](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L744)

#### Parameters

##### container

`HTMLElement`

##### options

[`ZoomedSceneOptions`](../interfaces/ZoomedSceneOptions.md) = `{}`

#### Returns

`ZoomedScene`

#### Overrides

[`Scene`](Scene.md).[`constructor`](Scene.md#constructor)

## Properties

### \_autoRender

> `protected` **\_autoRender**: `boolean` = `true`

Defined in: [core/Scene.ts:66](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L66)

#### Inherited from

[`Scene`](Scene.md).[`_autoRender`](Scene.md#_autorender)

***

### zoomedCamera

> `readonly` **zoomedCamera**: `ZoomedCamera`

Defined in: [core/SceneExtensions.ts:730](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L730)

The zoomed camera with its frame

***

### zoomedDisplay

> `readonly` **zoomedDisplay**: `ZoomedDisplay`

Defined in: [core/SceneExtensions.ts:733](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L733)

The zoomed display (texture + border)

## Accessors

### audioManager

#### Get Signature

> **get** **audioManager**(): [`AudioManager`](AudioManager.md)

Defined in: [core/Scene.ts:198](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L198)

Get the audio manager (lazily created on first access).
Use this to access lower-level audio controls.

##### Returns

[`AudioManager`](AudioManager.md)

#### Inherited from

[`Scene`](Scene.md).[`audioManager`](Scene.md#audiomanager)

***

### camera

#### Get Signature

> **get** **camera**(): [`Camera2D`](Camera2D.md)

Defined in: [core/Scene.ts:151](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L151)

Get the camera.

##### Returns

[`Camera2D`](Camera2D.md)

#### Inherited from

[`Scene`](Scene.md).[`camera`](Scene.md#camera)

***

### currentTime

#### Get Signature

> **get** **currentTime**(): `number`

Defined in: [core/Scene.ts:179](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L179)

Get the current playback time.

##### Returns

`number`

#### Inherited from

[`Scene`](Scene.md).[`currentTime`](Scene.md#currenttime)

***

### isPlaying

#### Get Signature

> **get** **isPlaying**(): `boolean`

Defined in: [core/Scene.ts:172](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L172)

Get whether animations are currently playing.

##### Returns

`boolean`

#### Inherited from

[`Scene`](Scene.md).[`isPlaying`](Scene.md#isplaying)

***

### isZoomActive

#### Get Signature

> **get** **isZoomActive**(): `boolean`

Defined in: [core/SceneExtensions.ts:793](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L793)

Check if zooming is active

##### Returns

`boolean`

***

### mobjects

#### Get Signature

> **get** **mobjects**(): `ReadonlySet`\<[`Mobject`](Mobject.md)\>

Defined in: [core/Scene.ts:186](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L186)

Get all mobjects in the scene.

##### Returns

`ReadonlySet`\<[`Mobject`](Mobject.md)\>

#### Inherited from

[`Scene`](Scene.md).[`mobjects`](Scene.md#mobjects)

***

### renderer

#### Get Signature

> **get** **renderer**(): [`Renderer`](Renderer.md)

Defined in: [core/Scene.ts:158](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L158)

Get the renderer.

##### Returns

[`Renderer`](Renderer.md)

#### Inherited from

[`Scene`](Scene.md).[`renderer`](Scene.md#renderer)

***

### stateManager

#### Get Signature

> **get** **stateManager**(): [`SceneStateManager`](SceneStateManager.md)

Defined in: [core/Scene.ts:891](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L891)

Get the scene's state manager for advanced undo/redo control.

##### Returns

[`SceneStateManager`](SceneStateManager.md)

#### Inherited from

[`Scene`](Scene.md).[`stateManager`](Scene.md#statemanager)

***

### threeScene

#### Get Signature

> **get** **threeScene**(): `Scene`

Defined in: [core/Scene.ts:144](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L144)

Get the Three.js scene.

##### Returns

`Scene`

#### Inherited from

[`Scene`](Scene.md).[`threeScene`](Scene.md#threescene)

***

### timeline

#### Get Signature

> **get** **timeline**(): [`Timeline`](Timeline.md)

Defined in: [core/Scene.ts:165](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L165)

Get the current timeline.

##### Returns

[`Timeline`](Timeline.md)

#### Inherited from

[`Scene`](Scene.md).[`timeline`](Scene.md#timeline)

## Methods

### \_render()

> `protected` **\_render**(): `void`

Defined in: [core/SceneExtensions.ts:845](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L845)

Override _render to include zoom view on every frame (including animation loop).

#### Returns

`void`

#### Overrides

[`Scene`](Scene.md).[`_render`](Scene.md#_render)

***

### activateZooming()

> **activateZooming**(): `this`

Defined in: [core/SceneExtensions.ts:800](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L800)

Activate zooming: adds camera frame and display to the scene.

#### Returns

`this`

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Scene.ts:270](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L270)

Add mobjects to the scene.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to add

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`add`](Scene.md#add)

***

### addForegroundMobject()

> **addForegroundMobject**(...`mobjects`): `this`

Defined in: [core/Scene.ts:251](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L251)

Add mobjects as foreground objects that render on top of everything.
Matches Manim Python's add_foreground_mobject().

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to add in the foreground

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`addForegroundMobject`](Scene.md#addforegroundmobject)

***

### addSound()

> **addSound**(`url`, `options?`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/Scene.ts:219](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L219)

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

#### Inherited from

[`Scene`](Scene.md).[`addSound`](Scene.md#addsound)

***

### addSoundAtAnimation()

> **addSoundAtAnimation**(`animation`, `url`, `options?`): `Promise`\<[`AudioTrack`](../interfaces/AudioTrack.md)\>

Defined in: [core/Scene.ts:238](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L238)

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

#### Inherited from

[`Scene`](Scene.md).[`addSoundAtAnimation`](Scene.md#addsoundatanimation)

***

### batch()

> **batch**(`callback`): `void`

Defined in: [core/Scene.ts:785](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L785)

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

#### Inherited from

[`Scene`](Scene.md).[`batch`](Scene.md#batch)

***

### clear()

> **clear**(): `this`

Defined in: [core/SceneExtensions.ts:906](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L906)

Override clear to reset zoom state.

#### Returns

`this`

#### Overrides

[`Scene`](Scene.md).[`clear`](Scene.md#clear)

***

### deactivateZooming()

> **deactivateZooming**(): `this`

Defined in: [core/SceneExtensions.ts:819](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L819)

Deactivate zooming: removes camera frame and display from the scene.

#### Returns

`this`

***

### dispose()

> **dispose**(): `void`

Defined in: [core/SceneExtensions.ts:936](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L936)

Clean up all resources.

#### Returns

`void`

#### Overrides

[`Scene`](Scene.md).[`dispose`](Scene.md#dispose)

***

### getCanvas()

> **getCanvas**(): `HTMLCanvasElement`

Defined in: [core/Scene.ts:843](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L843)

Get the canvas element.

#### Returns

`HTMLCanvasElement`

The HTMLCanvasElement used for rendering

#### Inherited from

[`Scene`](Scene.md).[`getCanvas`](Scene.md#getcanvas)

***

### getContainer()

> **getContainer**(): `HTMLElement`

Defined in: [core/Scene.ts:852](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L852)

Get the container element the scene is rendered into.
Returns the parent element of the canvas.

#### Returns

`HTMLElement`

The container HTMLElement

#### Inherited from

[`Scene`](Scene.md).[`getContainer`](Scene.md#getcontainer)

***

### getHeight()

> **getHeight**(): `number`

Defined in: [core/Scene.ts:872](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L872)

Get the height of the canvas in pixels.

#### Returns

`number`

Canvas height in pixels

#### Inherited from

[`Scene`](Scene.md).[`getHeight`](Scene.md#getheight)

***

### getState()

> **getState**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/Scene.ts:945](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L945)

Get a snapshot of the current scene state without modifying stacks.

#### Parameters

##### label?

`string`

#### Returns

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

#### Inherited from

[`Scene`](Scene.md).[`getState`](Scene.md#getstate)

***

### getTargetFps()

> **getTargetFps**(): `number`

Defined in: [core/Scene.ts:811](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L811)

Get the current target frame rate.

#### Returns

`number`

Target fps

#### Inherited from

[`Scene`](Scene.md).[`getTargetFps`](Scene.md#gettargetfps)

***

### getTimelineDuration()

> **getTimelineDuration**(): `number`

Defined in: [core/Scene.ts:880](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L880)

Get the total duration of the current timeline.

#### Returns

`number`

Duration in seconds, or 0 if no timeline

#### Inherited from

[`Scene`](Scene.md).[`getTimelineDuration`](Scene.md#gettimelineduration)

***

### getWidth()

> **getWidth**(): `number`

Defined in: [core/Scene.ts:864](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L864)

Get the width of the canvas in pixels.

#### Returns

`number`

Canvas width in pixels

#### Inherited from

[`Scene`](Scene.md).[`getWidth`](Scene.md#getwidth)

***

### getZoomedDisplayPopOutAnimation()

> **getZoomedDisplayPopOutAnimation**(`options?`): [`Animation`](Animation.md)

Defined in: [core/SceneExtensions.ts:838](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L838)

Get a pop-out animation that moves the zoomed display from the camera
frame to its current position, mimicking Manim's
get_zoomed_display_pop_out_animation().

The animation starts by snapping the display onto the frame, then
interpolates position and scale to the display's original state.
Use { rateFunc: (t) => smooth(1 - t) } for a reverse pop-out.

#### Parameters

##### options?

[`AnimationOptions`](../interfaces/AnimationOptions.md)

#### Returns

[`Animation`](Animation.md)

***

### isInView()

> **isInView**(`object`): `boolean`

Defined in: [core/Scene.ts:634](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L634)

Check if an object is within the camera's view frustum.
Useful for manual culling checks or debugging.

#### Parameters

##### object

`Object3D`

Three.js object to check

#### Returns

`boolean`

true if object is in view or if culling is disabled

#### Inherited from

[`Scene`](Scene.md).[`isInView`](Scene.md#isinview)

***

### pause()

> **pause**(): `this`

Defined in: [core/Scene.ts:528](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L528)

Pause playback (video and audio).

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`pause`](Scene.md#pause)

***

### play()

> **play**(...`animations`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:380](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L380)

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

#### Inherited from

[`Scene`](Scene.md).[`play`](Scene.md#play)

***

### playAll()

> **playAll**(...`animations`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:436](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L436)

Play multiple animations in parallel (all at once).
Alias for play() - delegates to play() to avoid duplicated logic.

#### Parameters

##### animations

...[`Animation`](Animation.md)[]

Animations to play simultaneously

#### Returns

`Promise`\<`void`\>

Promise that resolves when all animations complete

#### Inherited from

[`Scene`](Scene.md).[`playAll`](Scene.md#playall)

***

### redo()

> **redo**(): `boolean`

Defined in: [core/Scene.ts:934](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L934)

Redo the last undone change.
The current state is pushed to the undo stack.

#### Returns

`boolean`

true if redo was applied, false if nothing to redo

#### Inherited from

[`Scene`](Scene.md).[`redo`](Scene.md#redo)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Scene.ts:307](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L307)

Remove mobjects from the scene.

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Mobjects to remove

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`remove`](Scene.md#remove)

***

### render()

> **render**(): `void`

Defined in: [core/Scene.ts:964](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L964)

Force render a single frame.
Useful for video export where frames need to be captured at specific times.

#### Returns

`void`

#### Inherited from

[`Scene`](Scene.md).[`render`](Scene.md#render)

***

### resize()

> **resize**(`width`, `height`): `this`

Defined in: [core/SceneExtensions.ts:928](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/SceneExtensions.ts#L928)

Handle window resize.

#### Parameters

##### width

`number`

##### height

`number`

#### Returns

`this`

#### Overrides

[`Scene`](Scene.md).[`resize`](Scene.md#resize)

***

### resume()

> **resume**(): `this`

Defined in: [core/Scene.ts:542](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L542)

Resume playback (video and audio).

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`resume`](Scene.md#resume)

***

### saveState()

> **saveState**(`label?`): [`SceneSnapshot`](../interfaces/SceneSnapshot.md)

Defined in: [core/Scene.ts:910](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L910)

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

#### Inherited from

[`Scene`](Scene.md).[`saveState`](Scene.md#savestate)

***

### seek()

> **seek**(`time`): `this`

Defined in: [core/Scene.ts:513](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L513)

Seek to a specific time in the timeline.
Also seeks the audio manager if audio has been used.

#### Parameters

##### time

`number`

Time in seconds

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`seek`](Scene.md#seek)

***

### setFrustumCulling()

> **setFrustumCulling**(`enabled`): `this`

Defined in: [core/Scene.ts:819](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L819)

Enable or disable frustum culling.

#### Parameters

##### enabled

`boolean`

Whether frustum culling should be enabled

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`setFrustumCulling`](Scene.md#setfrustumculling)

***

### setState()

> **setState**(`snapshot`): `void`

Defined in: [core/Scene.ts:953](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L953)

Apply a previously captured snapshot, overwriting all mobject states.
Does NOT modify undo/redo stacks. Call saveState() first to preserve.

#### Parameters

##### snapshot

[`SceneSnapshot`](../interfaces/SceneSnapshot.md)

#### Returns

`void`

#### Inherited from

[`Scene`](Scene.md).[`setState`](Scene.md#setstate)

***

### setTargetFps()

> **setTargetFps**(`fps`): `this`

Defined in: [core/Scene.ts:801](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L801)

Set the target frame rate.

#### Parameters

##### fps

`number`

Target frames per second (1-120)

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`setTargetFps`](Scene.md#settargetfps)

***

### stop()

> **stop**(): `this`

Defined in: [core/Scene.ts:557](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L557)

Stop playback and reset timeline (video and audio).

#### Returns

`this`

#### Inherited from

[`Scene`](Scene.md).[`stop`](Scene.md#stop)

***

### undo()

> **undo**(): `boolean`

Defined in: [core/Scene.ts:920](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L920)

Undo the last change (restore the most recently saved state).
The current state is pushed to the redo stack.

#### Returns

`boolean`

true if undo was applied, false if nothing to undo

#### Inherited from

[`Scene`](Scene.md).[`undo`](Scene.md#undo)

***

### wait()

> **wait**(`duration`): `Promise`\<`void`\>

Defined in: [core/Scene.ts:446](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Scene.ts#L446)

Wait for a duration (pause between animations).
Runs a render loop during the wait so that updaters keep ticking.

#### Parameters

##### duration

`number` = `1`

Duration in seconds

#### Returns

`Promise`\<`void`\>

Promise that resolves after the duration

#### Inherited from

[`Scene`](Scene.md).[`wait`](Scene.md#wait)
