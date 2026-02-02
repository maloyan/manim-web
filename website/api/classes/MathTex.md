# Class: MathTex

Defined in: [mobjects/text/MathTex.ts:92](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L92)

MathTex - A mobject for rendering LaTeX mathematical expressions

Uses KaTeX for LaTeX parsing and renders to a textured plane in Three.js.
The rendering is asynchronous but the constructor is synchronous.

## Example

```typescript
// Create a simple equation
const equation = new MathTex({ latex: 'E = mc^2' });

// Create a colored integral
const integral = new MathTex({
  latex: '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
  color: '#00ff00',
  fontSize: 64
});

// Wait for rendering to complete before animating
await integral.waitForRender();
```

## Extends

- [`Mobject`](Mobject.md)

## Extended by

- [`Tex`](Tex.md)

## Constructors

### Constructor

> **new MathTex**(`options`): `MathTex`

Defined in: [mobjects/text/MathTex.ts:110](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L110)

#### Parameters

##### options

[`MathTexOptions`](../interfaces/MathTexOptions.md)

#### Returns

`MathTex`

#### Overrides

[`Mobject`](Mobject.md).[`constructor`](Mobject.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Mobject`](Mobject.md).[`__savedMobjectState`](Mobject.md#__savedmobjectstate)

***

### \_activeRenderer

> `protected` **\_activeRenderer**: `"katex"` \| `"mathjax"` = `null`

Defined in: [mobjects/text/MathTex.ts:100](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L100)

Which renderer was actually used for the last successful render

***

### \_arrangePromise

> `protected` **\_arrangePromise**: `Promise`\<`void`\> = `null`

Defined in: [mobjects/text/MathTex.ts:106](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L106)

Promise that resolves when parts are arranged (multi-part only)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`Mobject`](Mobject.md).[`_dirty`](Mobject.md#_dirty)

***

### \_displayMode

> `protected` **\_displayMode**: `boolean`

Defined in: [mobjects/text/MathTex.ts:95](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L95)

***

### \_fontSize

> `protected` **\_fontSize**: `number`

Defined in: [mobjects/text/MathTex.ts:94](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L94)

***

### \_isMultiPart

> `protected` **\_isMultiPart**: `boolean` = `false`

Defined in: [mobjects/text/MathTex.ts:102](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L102)

Whether this is a multi-part MathTex (created from string[])

***

### \_latex

> `protected` **\_latex**: `string`

Defined in: [mobjects/text/MathTex.ts:93](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L93)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Mobject`](Mobject.md).[`_opacity`](Mobject.md#_opacity)

***

### \_padding

> `protected` **\_padding**: `number`

Defined in: [mobjects/text/MathTex.ts:108](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L108)

Padding in pixels around rendered content

***

### \_parts

> `protected` **\_parts**: `MathTex`[] = `[]`

Defined in: [mobjects/text/MathTex.ts:104](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L104)

Child MathTex parts (only when _isMultiPart is true)

***

### \_renderer

> `protected` **\_renderer**: [`TexRenderer`](../type-aliases/TexRenderer.md)

Defined in: [mobjects/text/MathTex.ts:98](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L98)

User-requested renderer mode

***

### \_renderState

> `protected` **\_renderState**: `RenderState`

Defined in: [mobjects/text/MathTex.ts:96](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L96)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`Mobject`](Mobject.md).[`_style`](Mobject.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`Mobject`](Mobject.md).[`_threeObject`](Mobject.md#_threeobject)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Mobject`](Mobject.md).[`children`](Mobject.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Mobject`](Mobject.md).[`fillOpacity`](Mobject.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Mobject`](Mobject.md).[`id`](Mobject.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Mobject`](Mobject.md).[`parent`](Mobject.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Mobject`](Mobject.md).[`position`](Mobject.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Mobject`](Mobject.md).[`rotation`](Mobject.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Mobject`](Mobject.md).[`savedState`](Mobject.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Mobject`](Mobject.md).[`scaleVector`](Mobject.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Mobject`](Mobject.md).[`strokeWidth`](Mobject.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Mobject`](Mobject.md).[`targetCopy`](Mobject.md#targetcopy)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`color`](Mobject.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:471](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L471)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:478](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L478)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`fillColor`](Mobject.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:902](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L902)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Mobject`](Mobject.md).[`isDirty`](Mobject.md#isdirty)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:145](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L145)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:152](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L152)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`opacity`](Mobject.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Mobject`](Mobject.md).[`style`](Mobject.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Mobject`](Mobject.md).[`submobjects`](Mobject.md#submobjects)

## Methods

### \_createCopy()

> `protected` **\_createCopy**(): `MathTex`

Defined in: [mobjects/text/MathTex.ts:928](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L928)

Create a copy of this MathTex

#### Returns

`MathTex`

#### Overrides

[`Mobject`](Mobject.md).[`_createCopy`](Mobject.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/text/MathTex.ts:868](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L868)

Create the Three.js backing object

#### Returns

`Object3D`

#### Overrides

[`Mobject`](Mobject.md).[`_createThreeObject`](Mobject.md#_createthreeobject)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:716](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L716)

Get bounding box dimensions
Uses object pooling to avoid allocations in hot paths (performance optimization).

#### Returns

`object`

Object with width, height, and depth

##### depth

> **depth**: `number`

##### height

> **height**: `number`

##### width

> **width**: `number`

#### Inherited from

[`Mobject`](Mobject.md).[`_getBoundingBox`](Mobject.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:699](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L699)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`_getEdgeInDirection`](Mobject.md#_getedgeindirection)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:882](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L882)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`_markDirty`](Mobject.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:891](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L891)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`_markDirtyUpward`](Mobject.md#_markdirtyupward)

***

### \_renderDomToCanvas()

> `protected` **\_renderDomToCanvas**(`container`, `containerRect`, `width`, `height`, `padding`): `Promise`\<`HTMLCanvasElement`\>

Defined in: [mobjects/text/MathTex.ts:626](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L626)

Walk the KaTeX DOM tree and render text nodes + SVG elements
at their computed CSS positions onto a canvas.

#### Parameters

##### container

`HTMLElement`

##### containerRect

`DOMRect`

##### width

`number`

##### height

`number`

##### padding

`number`

#### Returns

`Promise`\<`HTMLCanvasElement`\>

***

### \_renderLatex()

> `protected` **\_renderLatex**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:398](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L398)

Render the LaTeX to a canvas using the selected renderer.

Renderer selection logic:
- 'katex'  : Use KaTeX directly (throwOnError: false)
- 'mathjax': Use MathJax SVG output, rendered to canvas via Image
- 'auto'   : Try KaTeX with throwOnError: true. If it throws,
             fall back to MathJax.

#### Returns

`Promise`\<`void`\>

***

### \_renderLatexViaKaTeX()

> `protected` **\_renderLatexViaKaTeX**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:531](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L531)

Render the LaTeX to a canvas by walking the KaTeX DOM
and drawing each text element at its computed CSS position.

#### Returns

`Promise`\<`void`\>

***

### \_renderLatexViaMathJax()

> `protected` **\_renderLatexViaMathJax**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:428](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L428)

Render using MathJax SVG output.  The SVG is painted onto a canvas
texture in the same way the KaTeX path works, keeping the visual
pipeline consistent.

#### Returns

`Promise`\<`void`\>

***

### \_startRender()

> `protected` **\_startRender**(): `void`

Defined in: [mobjects/text/MathTex.ts:376](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L376)

Start the async rendering process

#### Returns

`void`

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [mobjects/text/MathTex.ts:901](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L901)

Sync material properties to Three.js

#### Returns

`void`

#### Overrides

[`Mobject`](Mobject.md).[`_syncMaterialToThree`](Mobject.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:836](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L836)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`_syncToThree`](Mobject.md#_synctothree)

***

### \_updateMeshGeometry()

> `protected` **\_updateMeshGeometry**(): `void`

Defined in: [mobjects/text/MathTex.ts:854](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L854)

Update the mesh geometry to match current dimensions

#### Returns

`void`

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:490](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L490)

Add a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`add`](Mobject.md#add)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:950](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L950)

Add an updater function that runs every frame

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

Function called with (mobject, dt) each frame

##### callOnAdd

`boolean` = `false`

Whether to call immediately, default false

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`addUpdater`](Mobject.md#addupdater)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:664](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L664)

Align this mobject with another along an edge

#### Parameters

##### target

The mobject or point to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

The direction/edge to align (e.g., LEFT aligns left edges)

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`alignTo`](Mobject.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1017](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L1017)

Apply a point-wise function to every VMobject descendant's control points.
Uses duck-type check for getPoints/setPoints to avoid circular imports.

#### Parameters

##### fn

(`point`) => `number`[]

Function mapping [x, y, z] to [x', y', z']

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`applyFunction`](Mobject.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:925](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L925)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`Mobject`](Mobject.md).[`applyToFamily`](Mobject.md#applytofamily)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:561](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L561)

Replace this mobject's visual properties with those of another mobject.
Preserves identity (updaters, scene membership) but copies appearance.

#### Parameters

##### other

[`Mobject`](Mobject.md)

The mobject to copy appearance from

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`become`](Mobject.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:797](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L797)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`center`](Mobject.md#center)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:975](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L975)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`clearUpdaters`](Mobject.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:534](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L534)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Mobject`](Mobject.md).[`copy`](Mobject.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [mobjects/text/MathTex.ts:989](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L989)

Clean up Three.js resources

#### Returns

`void`

#### Overrides

[`Mobject`](Mobject.md).[`dispose`](Mobject.md#dispose)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:364](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L364)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`flip`](Mobject.md#flip)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1085](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L1085)

Create a copy of this mobject as a target for MoveToTarget animation.
Modify the returned copy, then play `new MoveToTarget(this)` to
smoothly interpolate from the current state to the target.

#### Returns

[`Mobject`](Mobject.md)

The target copy for modification

#### Example

```ts
mob.generateTarget();
mob.targetCopy!.shift([2, 0, 0]);
mob.targetCopy!.setColor('red');
await scene.play(new MoveToTarget(mob));
```

#### Inherited from

[`Mobject`](Mobject.md).[`generateTarget`](Mobject.md#generatetarget)

***

### getActiveRenderer()

> **getActiveRenderer**(): `"katex"` \| `"mathjax"`

Defined in: [mobjects/text/MathTex.ts:190](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L190)

Get which renderer was actually used for the current render.
Returns null if not yet rendered.

#### Returns

`"katex"` \| `"mathjax"`

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:746](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L746)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getBottom`](Mobject.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:608](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L608)

Get the bounding box of this mobject in world coordinates.

#### Returns

`object`

Object with min and max Vector3Tuple

##### max

> **max**: `object`

###### max.x

> **x**: `number`

###### max.y

> **y**: `number`

###### max.z

> **z**: `number`

##### min

> **min**: `object`

###### min.x

> **x**: `number`

###### min.y

> **y**: `number`

###### min.z

> **z**: `number`

#### Inherited from

[`Mobject`](Mobject.md).[`getBounds`](Mobject.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/text/MathTex.ts:982](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L982)

Get the center of this MathTex

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Overrides

[`Mobject`](Mobject.md).[`getCenter`](Mobject.md#getcenter)

***

### getDimensions()

> **getDimensions**(): \[`number`, `number`\]

Defined in: [mobjects/text/MathTex.ts:364](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L364)

Get the rendered dimensions in world units

#### Returns

\[`number`, `number`\]

[width, height] or [0, 0] if not yet rendered

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:730](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L730)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getEdge`](Mobject.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:936](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L936)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Mobject`](Mobject.md).[`getFamily`](Mobject.md#getfamily)

***

### getFontSize()

> **getFontSize**(): `number`

Defined in: [mobjects/text/MathTex.ts:228](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L228)

Get the font size

#### Returns

`number`

***

### getLatex()

> **getLatex**(): `string`

Defined in: [mobjects/text/MathTex.ts:209](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L209)

Get the LaTeX string

#### Returns

`string`

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:754](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L754)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getLeft`](Mobject.md#getleft)

***

### getPart()

> **getPart**(`index`): `MathTex`

Defined in: [mobjects/text/MathTex.ts:296](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L296)

Get a sub-part of a multi-part MathTex expression.
Only available when the MathTex was created with a string array.

#### Parameters

##### index

`number`

Zero-based index of the part

#### Returns

`MathTex`

The MathTex sub-part at the given index

***

### getPartCount()

> **getPartCount**(): `number`

Defined in: [mobjects/text/MathTex.ts:309](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L309)

Get the number of parts (1 for single-string, N for multi-part).

#### Returns

`number`

***

### getRenderer()

> **getRenderer**(): [`TexRenderer`](../type-aliases/TexRenderer.md)

Defined in: [mobjects/text/MathTex.ts:182](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L182)

Get the renderer mode

#### Returns

[`TexRenderer`](../type-aliases/TexRenderer.md)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:762](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L762)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getRight`](Mobject.md#getright)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:909](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L909)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Mobject`](Mobject.md).[`getThreeObject`](Mobject.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:738](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L738)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Mobject`](Mobject.md).[`getTop`](Mobject.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:992](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L992)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Mobject`](Mobject.md).[`getUpdaters`](Mobject.md#getupdaters)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:984](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L984)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Mobject`](Mobject.md).[`hasUpdaters`](Mobject.md#hasupdaters)

***

### isRendering()

> **isRendering**(): `boolean`

Defined in: [mobjects/text/MathTex.ts:356](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L356)

Check if rendering is in progress

#### Returns

`boolean`

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:215](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L215)

Move the mobject to an absolute position, or align with another Mobject.

#### Parameters

##### target

Target position [x, y, z] or Mobject to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### alignedEdge?

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Optional edge direction to align (e.g., UL aligns upper-left edges)

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`moveTo`](Mobject.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:686](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L686)

Move this mobject to align its center with a point or mobject center

#### Parameters

##### target

Target mobject or point to align with

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### alignedEdge?

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Optional edge to align instead of centers

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`moveToAligned`](Mobject.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:632](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L632)

Position this mobject next to another mobject

#### Parameters

##### target

The mobject to position next to

[`Mobject`](Mobject.md) | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `RIGHT`

Direction from target (e.g., RIGHT, UP)

##### buff

`number` = `0.25`

Buffer distance between mobjects, default 0.25

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`nextTo`](Mobject.md#nextto)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1037](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L1037)

Subdivide every VMobject descendant's cubic Bezier curves so that non-linear
transforms produce smooth results. Each cubic segment is split into n sub-segments
via de Casteljau evaluation.

#### Parameters

##### numPieces

`number` = `50`

Number of sub-segments per original cubic segment (default 50)

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`prepareForNonlinearTransform`](Mobject.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:515](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L515)

Remove a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`remove`](Mobject.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:963](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L963)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`removeUpdater`](Mobject.md#removeupdater)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1131](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L1131)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`Mobject`](Mobject.md).[`restoreState`](Mobject.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axisOrOptions?`): `this`

Defined in: [core/Mobject.ts:245](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L245)

Rotate the mobject around an axis
Uses object pooling to avoid allocations in hot paths (performance optimization).

#### Parameters

##### angle

`number`

Rotation angle in radians

##### axisOrOptions?

Axis of rotation [x, y, z] (defaults to Z axis), or options object

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) | \{ `aboutPoint?`: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md); `axis?`: [`Vector3Tuple`](../type-aliases/Vector3Tuple.md); \}

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`rotate`](Mobject.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:355](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L355)

Rotate the mobject about the coordinate origin [0, 0, 0].

#### Parameters

##### angle

`number`

Rotation angle in radians

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis of rotation (defaults to Z axis [0, 0, 1])

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`rotateAboutOrigin`](Mobject.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1106](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L1106)

Save the current state of this mobject so it can be restored later.
Stores a deep copy on `this.savedState` (for Restore animation
compatibility) and a serializable snapshot on `this.__savedMobjectState`
(for restoreState).

#### Returns

`this`

this for chaining

#### Example

```ts
mob.saveState();
mob.shift([2, 0, 0]);
mob.setColor('red');
mob.restoreState(); // back to original position and color
```

#### Inherited from

[`Mobject`](Mobject.md).[`saveState`](Mobject.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Mobject.ts:378](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L378)

Scale the mobject uniformly or non-uniformly

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`scale`](Mobject.md#scale)

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [mobjects/text/MathTex.ts:248](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L248)

Override setColor — texture is always rendered white, so we only need
to update the material tint via _syncMaterialToThree (no re-render).

#### Parameters

##### color

`string`

#### Returns

`this`

#### Overrides

[`Mobject`](Mobject.md).[`setColor`](Mobject.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:458](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L458)

Set the fill color and/or opacity (Manim Python parity: set_fill)

#### Parameters

##### color?

`string`

CSS color string (optional)

##### opacity?

`number`

Fill opacity 0-1 (optional)

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`setFill`](Mobject.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:442](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L442)

Set the fill opacity
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### opacity

`number`

Fill opacity (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`setFillOpacity`](Mobject.md#setfillopacity)

***

### setFontSize()

> **setFontSize**(`size`): `this`

Defined in: [mobjects/text/MathTex.ts:237](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L237)

Set the font size and re-render

#### Parameters

##### size

`number`

New font size in pixels

#### Returns

`this`

this for chaining

***

### setLatex()

> **setLatex**(`latex`): `this`

Defined in: [mobjects/text/MathTex.ts:218](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L218)

Set the LaTeX string and re-render

#### Parameters

##### latex

`string`

New LaTeX string

#### Returns

`this`

this for chaining

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [mobjects/text/MathTex.ts:262](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L262)

Override setOpacity to propagate to multi-part children.

#### Parameters

##### opacity

`number`

#### Returns

`this`

#### Overrides

[`Mobject`](Mobject.md).[`setOpacity`](Mobject.md#setopacity)

***

### setRenderer()

> **setRenderer**(`renderer`): `this`

Defined in: [mobjects/text/MathTex.ts:199](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L199)

Set the renderer mode and re-render.

#### Parameters

##### renderer

[`TexRenderer`](../type-aliases/TexRenderer.md)

The renderer to use

#### Returns

`this`

this for chaining

***

### setRevealProgress()

> **setRevealProgress**(`alpha`): `void`

Defined in: [mobjects/text/MathTex.ts:946](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L946)

Set reveal progress for Write animation (left-to-right wipe).

#### Parameters

##### alpha

`number`

Progress from 0 (hidden) to 1 (fully visible)

#### Returns

`void`

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Mobject.ts:426](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L426)

Set the stroke width for outlines
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### width

`number`

Stroke width in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`setStrokeWidth`](Mobject.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:167](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L167)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`Mobject`](Mobject.md).[`setStyle`](Mobject.md#setstyle)

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:770](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L770)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`Mobject`](Mobject.md).[`setX`](Mobject.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:779](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L779)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`Mobject`](Mobject.md).[`setY`](Mobject.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:788](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L788)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`Mobject`](Mobject.md).[`setZ`](Mobject.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Mobject.ts:201](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L201)

Translate the mobject by a delta

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`shift`](Mobject.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:829](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L829)

Move to a corner of the frame

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `UR`

Corner direction (e.g., UR for upper right)

##### buff

`number` = `0.5`

Buffer from edges

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`toCorner`](Mobject.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:807](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L807)

Move to the edge of the frame

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to move towards

##### buff

`number` = `0.5`

Buffer from edge

#### Returns

`this`

this for chaining

#### Inherited from

[`Mobject`](Mobject.md).[`toEdge`](Mobject.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1001](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/core/Mobject.ts#L1001)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`Mobject`](Mobject.md).[`update`](Mobject.md#update)

***

### waitForRender()

> **waitForRender**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:277](https://github.com/maloyan/manim-js/blob/aaf5f7fed77e6558d37f7196101e49e89a6e93e9/src/mobjects/text/MathTex.ts#L277)

Wait for the LaTeX to finish rendering.
For multi-part MathTex, waits for all parts to render and be arranged.

#### Returns

`Promise`\<`void`\>

Promise that resolves when rendering is complete
