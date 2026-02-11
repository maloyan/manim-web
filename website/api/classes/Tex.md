# Class: Tex

Defined in: [mobjects/text/Tex.ts:46](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Tex.ts#L46)

Tex - LaTeX rendering for manimweb

This is an alias for MathTex to provide Manim API compatibility.
Use this class when porting code from the original Manim library.

## Example

```typescript
// Create a formula (Manim-style API)
const formula = new Tex({ latex: 'x^2 + y^2 = r^2' });

// Create with options
const colored = new Tex({
  latex: '\\frac{d}{dx}\\sin(x) = \\cos(x)',
  color: '#ffff00',
  fontSize: 56
});

// Use MathJax for advanced LaTeX
const chem = new Tex({
  latex: '\\ce{H2O -> H+ + OH-}',
  renderer: 'mathjax'
});
```

## Extends

- [`MathTex`](MathTex.md)

## Constructors

### Constructor

> **new Tex**(`options`): `Tex`

Defined in: [mobjects/text/Tex.ts:47](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Tex.ts#L47)

#### Parameters

##### options

[`MathTexOptions`](../interfaces/MathTexOptions.md)

#### Returns

`Tex`

#### Overrides

[`MathTex`](MathTex.md).[`constructor`](MathTex.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`MathTex`](MathTex.md).[`__savedMobjectState`](MathTex.md#__savedmobjectstate)

***

### \_activeRenderer

> `protected` **\_activeRenderer**: `"katex"` \| `"mathjax"` = `null`

Defined in: [mobjects/text/MathTex.ts:100](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L100)

Which renderer was actually used for the last successful render

#### Inherited from

[`MathTex`](MathTex.md).[`_activeRenderer`](MathTex.md#_activerenderer)

***

### \_arrangePromise

> `protected` **\_arrangePromise**: `Promise`\<`void`\> = `null`

Defined in: [mobjects/text/MathTex.ts:106](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L106)

Promise that resolves when parts are arranged (multi-part only)

#### Inherited from

[`MathTex`](MathTex.md).[`_arrangePromise`](MathTex.md#_arrangepromise)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`MathTex`](MathTex.md).[`_dirty`](MathTex.md#_dirty)

***

### \_displayMode

> `protected` **\_displayMode**: `boolean`

Defined in: [mobjects/text/MathTex.ts:95](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L95)

#### Inherited from

[`MathTex`](MathTex.md).[`_displayMode`](MathTex.md#_displaymode)

***

### \_fontSize

> `protected` **\_fontSize**: `number`

Defined in: [mobjects/text/MathTex.ts:94](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L94)

#### Inherited from

[`MathTex`](MathTex.md).[`_fontSize`](MathTex.md#_fontsize)

***

### \_isMultiPart

> `protected` **\_isMultiPart**: `boolean` = `false`

Defined in: [mobjects/text/MathTex.ts:102](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L102)

Whether this is a multi-part MathTex (created from string[])

#### Inherited from

[`MathTex`](MathTex.md).[`_isMultiPart`](MathTex.md#_ismultipart)

***

### \_latex

> `protected` **\_latex**: `string`

Defined in: [mobjects/text/MathTex.ts:93](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L93)

#### Inherited from

[`MathTex`](MathTex.md).[`_latex`](MathTex.md#_latex)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`MathTex`](MathTex.md).[`_opacity`](MathTex.md#_opacity)

***

### \_padding

> `protected` **\_padding**: `number`

Defined in: [mobjects/text/MathTex.ts:108](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L108)

Padding in pixels around rendered content

#### Inherited from

[`MathTex`](MathTex.md).[`_padding`](MathTex.md#_padding)

***

### \_parts

> `protected` **\_parts**: [`MathTex`](MathTex.md)[] = `[]`

Defined in: [mobjects/text/MathTex.ts:104](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L104)

Child MathTex parts (only when _isMultiPart is true)

#### Inherited from

[`MathTex`](MathTex.md).[`_parts`](MathTex.md#_parts)

***

### \_renderer

> `protected` **\_renderer**: [`TexRenderer`](../type-aliases/TexRenderer.md)

Defined in: [mobjects/text/MathTex.ts:98](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L98)

User-requested renderer mode

#### Inherited from

[`MathTex`](MathTex.md).[`_renderer`](MathTex.md#_renderer)

***

### \_renderState

> `protected` **\_renderState**: `RenderState`

Defined in: [mobjects/text/MathTex.ts:96](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L96)

#### Inherited from

[`MathTex`](MathTex.md).[`_renderState`](MathTex.md#_renderstate)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`MathTex`](MathTex.md).[`_style`](MathTex.md#_style)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`MathTex`](MathTex.md).[`_threeObject`](MathTex.md#_threeobject)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`MathTex`](MathTex.md).[`children`](MathTex.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`MathTex`](MathTex.md).[`fillOpacity`](MathTex.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`MathTex`](MathTex.md).[`id`](MathTex.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`MathTex`](MathTex.md).[`parent`](MathTex.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`MathTex`](MathTex.md).[`position`](MathTex.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`MathTex`](MathTex.md).[`rotation`](MathTex.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`MathTex`](MathTex.md).[`savedState`](MathTex.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`MathTex`](MathTex.md).[`scaleVector`](MathTex.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`MathTex`](MathTex.md).[`strokeWidth`](MathTex.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`MathTex`](MathTex.md).[`targetCopy`](MathTex.md#targetcopy)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`color`](MathTex.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:473](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L473)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:480](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L480)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`fillColor`](MathTex.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:933](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L933)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`MathTex`](MathTex.md).[`isDirty`](MathTex.md#isdirty)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:145](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L145)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:152](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L152)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`opacity`](MathTex.md#opacity)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`MathTex`](MathTex.md).[`style`](MathTex.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`MathTex`](MathTex.md).[`submobjects`](MathTex.md#submobjects)

## Methods

### \_createCopy()

> `protected` **\_createCopy**(): `Tex`

Defined in: [mobjects/text/Tex.ts:58](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/Tex.ts#L58)

Create a copy of this Tex

#### Returns

`Tex`

#### Overrides

[`MathTex`](MathTex.md).[`_createCopy`](MathTex.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/text/MathTex.ts:868](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L868)

Create the Three.js backing object

#### Returns

`Object3D`

#### Inherited from

[`MathTex`](MathTex.md).[`_createThreeObject`](MathTex.md#_createthreeobject)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:748](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L748)

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

[`MathTex`](MathTex.md).[`_getBoundingBox`](MathTex.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:731](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L731)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`MathTex`](MathTex.md).[`_getEdgeInDirection`](MathTex.md#_getedgeindirection)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:913](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L913)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`_markDirty`](MathTex.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:922](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L922)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`_markDirtyUpward`](MathTex.md#_markdirtyupward)

***

### \_renderDomToCanvas()

> `protected` **\_renderDomToCanvas**(`container`, `containerRect`, `width`, `height`, `padding`): `Promise`\<`HTMLCanvasElement`\>

Defined in: [mobjects/text/MathTex.ts:626](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L626)

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

#### Inherited from

[`MathTex`](MathTex.md).[`_renderDomToCanvas`](MathTex.md#_renderdomtocanvas)

***

### \_renderLatex()

> `protected` **\_renderLatex**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:398](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L398)

Render the LaTeX to a canvas using the selected renderer.

Renderer selection logic:
- 'katex'  : Use KaTeX directly (throwOnError: false)
- 'mathjax': Use MathJax SVG output, rendered to canvas via Image
- 'auto'   : Try KaTeX with throwOnError: true. If it throws,
             fall back to MathJax.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MathTex`](MathTex.md).[`_renderLatex`](MathTex.md#_renderlatex)

***

### \_renderLatexViaKaTeX()

> `protected` **\_renderLatexViaKaTeX**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:531](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L531)

Render the LaTeX to a canvas by walking the KaTeX DOM
and drawing each text element at its computed CSS position.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MathTex`](MathTex.md).[`_renderLatexViaKaTeX`](MathTex.md#_renderlatexviakatex)

***

### \_renderLatexViaMathJax()

> `protected` **\_renderLatexViaMathJax**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:428](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L428)

Render using MathJax SVG output.  The SVG is painted onto a canvas
texture in the same way the KaTeX path works, keeping the visual
pipeline consistent.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`MathTex`](MathTex.md).[`_renderLatexViaMathJax`](MathTex.md#_renderlatexviamathjax)

***

### \_startRender()

> `protected` **\_startRender**(): `void`

Defined in: [mobjects/text/MathTex.ts:376](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L376)

Start the async rendering process

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`_startRender`](MathTex.md#_startrender)

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [mobjects/text/MathTex.ts:901](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L901)

Sync material properties to Three.js

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`_syncMaterialToThree`](MathTex.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:867](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L867)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`_syncToThree`](MathTex.md#_synctothree)

***

### \_updateMeshGeometry()

> `protected` **\_updateMeshGeometry**(): `void`

Defined in: [mobjects/text/MathTex.ts:854](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L854)

Update the mesh geometry to match current dimensions

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`_updateMeshGeometry`](MathTex.md#_updatemeshgeometry)

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:492](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L492)

Add a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`add`](MathTex.md#add)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:981](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L981)

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

[`MathTex`](MathTex.md).[`addUpdater`](MathTex.md#addupdater)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:696](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L696)

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

[`MathTex`](MathTex.md).[`alignTo`](MathTex.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1048](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1048)

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

[`MathTex`](MathTex.md).[`applyFunction`](MathTex.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:956](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L956)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`MathTex`](MathTex.md).[`applyToFamily`](MathTex.md#applytofamily)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:563](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L563)

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

[`MathTex`](MathTex.md).[`become`](MathTex.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:828](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L828)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`center`](MathTex.md#center)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:1006](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1006)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`clearUpdaters`](MathTex.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:536](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L536)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`MathTex`](MathTex.md).[`copy`](MathTex.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [mobjects/text/MathTex.ts:989](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L989)

Clean up Three.js resources

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`dispose`](MathTex.md#dispose)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:364](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L364)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`flip`](MathTex.md#flip)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1116](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1116)

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

[`MathTex`](MathTex.md).[`generateTarget`](MathTex.md#generatetarget)

***

### getActiveRenderer()

> **getActiveRenderer**(): `"katex"` \| `"mathjax"`

Defined in: [mobjects/text/MathTex.ts:190](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L190)

Get which renderer was actually used for the current render.
Returns null if not yet rendered.

#### Returns

`"katex"` \| `"mathjax"`

#### Inherited from

[`MathTex`](MathTex.md).[`getActiveRenderer`](MathTex.md#getactiverenderer)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:777](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L777)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`MathTex`](MathTex.md).[`getBottom`](MathTex.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:640](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L640)

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

[`MathTex`](MathTex.md).[`getBounds`](MathTex.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/text/MathTex.ts:982](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L982)

Get the center of this MathTex

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`MathTex`](MathTex.md).[`getCenter`](MathTex.md#getcenter)

***

### getDimensions()

> **getDimensions**(): \[`number`, `number`\]

Defined in: [mobjects/text/MathTex.ts:364](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L364)

Get the rendered dimensions in world units

#### Returns

\[`number`, `number`\]

[width, height] or [0, 0] if not yet rendered

#### Inherited from

[`MathTex`](MathTex.md).[`getDimensions`](MathTex.md#getdimensions)

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:761](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L761)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`MathTex`](MathTex.md).[`getEdge`](MathTex.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:967](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L967)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`MathTex`](MathTex.md).[`getFamily`](MathTex.md#getfamily)

***

### getFontSize()

> **getFontSize**(): `number`

Defined in: [mobjects/text/MathTex.ts:228](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L228)

Get the font size

#### Returns

`number`

#### Inherited from

[`MathTex`](MathTex.md).[`getFontSize`](MathTex.md#getfontsize)

***

### getLatex()

> **getLatex**(): `string`

Defined in: [mobjects/text/MathTex.ts:209](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L209)

Get the LaTeX string

#### Returns

`string`

#### Inherited from

[`MathTex`](MathTex.md).[`getLatex`](MathTex.md#getlatex)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:785](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L785)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`MathTex`](MathTex.md).[`getLeft`](MathTex.md#getleft)

***

### getPart()

> **getPart**(`index`): [`MathTex`](MathTex.md)

Defined in: [mobjects/text/MathTex.ts:296](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L296)

Get a sub-part of a multi-part MathTex expression.
Only available when the MathTex was created with a string array.

#### Parameters

##### index

`number`

Zero-based index of the part

#### Returns

[`MathTex`](MathTex.md)

The MathTex sub-part at the given index

#### Inherited from

[`MathTex`](MathTex.md).[`getPart`](MathTex.md#getpart)

***

### getPartCount()

> **getPartCount**(): `number`

Defined in: [mobjects/text/MathTex.ts:309](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L309)

Get the number of parts (1 for single-string, N for multi-part).

#### Returns

`number`

#### Inherited from

[`MathTex`](MathTex.md).[`getPartCount`](MathTex.md#getpartcount)

***

### getRenderer()

> **getRenderer**(): [`TexRenderer`](../type-aliases/TexRenderer.md)

Defined in: [mobjects/text/MathTex.ts:182](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L182)

Get the renderer mode

#### Returns

[`TexRenderer`](../type-aliases/TexRenderer.md)

#### Inherited from

[`MathTex`](MathTex.md).[`getRenderer`](MathTex.md#getrenderer)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:793](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L793)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`MathTex`](MathTex.md).[`getRight`](MathTex.md#getright)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:940](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L940)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`MathTex`](MathTex.md).[`getThreeObject`](MathTex.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:769](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L769)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`MathTex`](MathTex.md).[`getTop`](MathTex.md#gettop)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:1023](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1023)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`MathTex`](MathTex.md).[`getUpdaters`](MathTex.md#getupdaters)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:1015](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1015)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`MathTex`](MathTex.md).[`hasUpdaters`](MathTex.md#hasupdaters)

***

### isRendering()

> **isRendering**(): `boolean`

Defined in: [mobjects/text/MathTex.ts:356](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L356)

Check if rendering is in progress

#### Returns

`boolean`

#### Inherited from

[`MathTex`](MathTex.md).[`isRendering`](MathTex.md#isrendering)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:215](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L215)

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

[`MathTex`](MathTex.md).[`moveTo`](MathTex.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:718](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L718)

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

[`MathTex`](MathTex.md).[`moveToAligned`](MathTex.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:664](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L664)

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

[`MathTex`](MathTex.md).[`nextTo`](MathTex.md#nextto)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1068](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1068)

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

[`MathTex`](MathTex.md).[`prepareForNonlinearTransform`](MathTex.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:517](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L517)

Remove a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`remove`](MathTex.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:994](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L994)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`removeUpdater`](MathTex.md#removeupdater)

***

### replace()

> **replace**(`target`, `stretch`): `this`

Defined in: [core/Mobject.ts:593](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L593)

Scale and reposition this mobject to match another mobject's bounding box.
Matches Manim Python's replace() behavior.

#### Parameters

##### target

[`Mobject`](Mobject.md)

The mobject whose bounding box to match

##### stretch

`boolean` = `false`

If true, stretch per-axis to match exactly; if false (default), uniform scale to match width

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`replace`](MathTex.md#replace)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1162](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1162)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`MathTex`](MathTex.md).[`restoreState`](MathTex.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axisOrOptions?`): `this`

Defined in: [core/Mobject.ts:245](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L245)

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

[`MathTex`](MathTex.md).[`rotate`](MathTex.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:355](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L355)

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

[`MathTex`](MathTex.md).[`rotateAboutOrigin`](MathTex.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1137](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1137)

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

[`MathTex`](MathTex.md).[`saveState`](MathTex.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Mobject.ts:378](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L378)

Scale the mobject uniformly or non-uniformly

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`scale`](MathTex.md#scale)

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [mobjects/text/MathTex.ts:248](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L248)

Override setColor — texture is always rendered white, so we only need
to update the material tint via _syncMaterialToThree (no re-render).

#### Parameters

##### color

`string`

#### Returns

`this`

#### Inherited from

[`MathTex`](MathTex.md).[`setColor`](MathTex.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:460](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L460)

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

[`MathTex`](MathTex.md).[`setFill`](MathTex.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:444](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L444)

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

[`MathTex`](MathTex.md).[`setFillOpacity`](MathTex.md#setfillopacity)

***

### setFontSize()

> **setFontSize**(`size`): `this`

Defined in: [mobjects/text/MathTex.ts:237](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L237)

Set the font size and re-render

#### Parameters

##### size

`number`

New font size in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`setFontSize`](MathTex.md#setfontsize)

***

### setLatex()

> **setLatex**(`latex`): `this`

Defined in: [mobjects/text/MathTex.ts:218](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L218)

Set the LaTeX string and re-render

#### Parameters

##### latex

`string`

New LaTeX string

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`setLatex`](MathTex.md#setlatex)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [mobjects/text/MathTex.ts:262](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L262)

Override setOpacity to propagate to multi-part children.

#### Parameters

##### opacity

`number`

#### Returns

`this`

#### Inherited from

[`MathTex`](MathTex.md).[`setOpacity`](MathTex.md#setopacity)

***

### setRenderer()

> **setRenderer**(`renderer`): `this`

Defined in: [mobjects/text/MathTex.ts:199](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L199)

Set the renderer mode and re-render.

#### Parameters

##### renderer

[`TexRenderer`](../type-aliases/TexRenderer.md)

The renderer to use

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`setRenderer`](MathTex.md#setrenderer)

***

### setRevealProgress()

> **setRevealProgress**(`alpha`): `void`

Defined in: [mobjects/text/MathTex.ts:946](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L946)

Set reveal progress for Write animation (left-to-right wipe).

#### Parameters

##### alpha

`number`

Progress from 0 (hidden) to 1 (fully visible)

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`setRevealProgress`](MathTex.md#setrevealprogress)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Mobject.ts:428](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L428)

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

[`MathTex`](MathTex.md).[`setStrokeWidth`](MathTex.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:167](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L167)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`MathTex`](MathTex.md).[`setStyle`](MathTex.md#setstyle)

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:801](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L801)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`MathTex`](MathTex.md).[`setX`](MathTex.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:810](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L810)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`MathTex`](MathTex.md).[`setY`](MathTex.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:819](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L819)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`MathTex`](MathTex.md).[`setZ`](MathTex.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Mobject.ts:201](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L201)

Translate the mobject by a delta

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`MathTex`](MathTex.md).[`shift`](MathTex.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:860](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L860)

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

[`MathTex`](MathTex.md).[`toCorner`](MathTex.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:838](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L838)

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

[`MathTex`](MathTex.md).[`toEdge`](MathTex.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1032](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/core/Mobject.ts#L1032)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`MathTex`](MathTex.md).[`update`](MathTex.md#update)

***

### waitForRender()

> **waitForRender**(): `Promise`\<`void`\>

Defined in: [mobjects/text/MathTex.ts:277](https://github.com/maloyan/manim-js/blob/c05b6757c237b624c0c3a6b2afda7111f378c148/src/mobjects/text/MathTex.ts#L277)

Wait for the LaTeX to finish rendering.
For multi-part MathTex, waits for all parts to render and be arranged.

#### Returns

`Promise`\<`void`\>

Promise that resolves when rendering is complete

#### Inherited from

[`MathTex`](MathTex.md).[`waitForRender`](MathTex.md#waitforrender)
