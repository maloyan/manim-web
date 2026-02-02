# Class: MarkupText

Defined in: [mobjects/text/MarkupText.ts:625](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L625)

MarkupText - A text mobject with Pango-like XML markup support

Supports rich inline formatting via XML tags modelled after Pango markup
(the same format used by Python manim's MarkupText).

## Example

```typescript
// Bold and italic
const text = new MarkupText({
  text: '<b>Bold</b> and <i>Italic</i> text'
});

// Colored text with span
const colored = new MarkupText({
  text: '<span foreground="red">Red</span> and <span color="#00ff00">Green</span>'
});

// Nested formatting
const nested = new MarkupText({
  text: '<b><i>Bold Italic</i></b> with <u>underline</u>'
});

// Complex span attributes
const complex = new MarkupText({
  text: '<span font_family="Courier" font_size="24" color="yellow" weight="bold">Custom</span> text'
});

// Superscript and subscript
const math = new MarkupText({
  text: 'x<sup>2</sup> + y<sub>i</sub>'
});

// Size variations
const sizes = new MarkupText({
  text: '<big>Big</big> Normal <small>Small</small>'
});

// Strikethrough
const strike = new MarkupText({
  text: '<s>deleted</s> replaced'
});
```

Also supports the legacy Markdown-style syntax (**bold**, *italic*, `code`)
for backward compatibility when no XML tags are detected.

## Extends

- [`Text`](Text.md)

## Constructors

### Constructor

> **new MarkupText**(`options`): `MarkupText`

Defined in: [mobjects/text/MarkupText.ts:632](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L632)

#### Parameters

##### options

[`MarkupTextOptions`](../interfaces/MarkupTextOptions.md)

#### Returns

`MarkupText`

#### Overrides

[`Text`](Text.md).[`constructor`](Text.md#constructor)

## Properties

### \_\_savedMobjectState

> **\_\_savedMobjectState**: `unknown` = `null`

Defined in: [core/Mobject.ts:118](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L118)

JSON-serializable saved state (used by restoreState()).
Set by saveState() -- typed as `unknown` here to avoid circular import;
actual type is MobjectState from StateManager.ts.

#### Inherited from

[`Text`](Text.md).[`__savedMobjectState`](Text.md#__savedmobjectstate)

***

### \_canvas

> `protected` **\_canvas**: `HTMLCanvasElement` = `null`

Defined in: [mobjects/text/Text.ts:116](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L116)

Off-screen canvas for text rendering

#### Inherited from

[`Text`](Text.md).[`_canvas`](Text.md#_canvas)

***

### \_canvasDirty

> `protected` **\_canvasDirty**: `boolean` = `true`

Defined in: [mobjects/text/Text.ts:105](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L105)

Flag to track when canvas content needs re-rendering (text/color/font changes)

#### Inherited from

[`Text`](Text.md).[`_canvasDirty`](Text.md#_canvasdirty)

***

### \_codeFontFamily

> `protected` **\_codeFontFamily**: `string` = `'monospace'`

Defined in: [mobjects/text/MarkupText.ts:630](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L630)

Code / monospace font family

***

### \_ctx

> `protected` **\_ctx**: `CanvasRenderingContext2D` = `null`

Defined in: [mobjects/text/Text.ts:117](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L117)

#### Inherited from

[`Text`](Text.md).[`_ctx`](Text.md#_ctx)

***

### \_dirty

> **\_dirty**: `boolean` = `true`

Defined in: [core/Mobject.ts:95](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L95)

Dirty flag indicating transforms need sync

#### Inherited from

[`Text`](Text.md).[`_dirty`](Text.md#_dirty)

***

### \_fillMaterial

> `protected` **\_fillMaterial**: `MeshBasicMaterial` = `null`

Defined in: [core/VMobject.ts:47](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L47)

Three.js fill material

#### Inherited from

[`Text`](Text.md).[`_fillMaterial`](Text.md#_fillmaterial)

***

### \_fontFamily

> `protected` **\_fontFamily**: `string`

Defined in: [mobjects/text/Text.ts:101](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L101)

#### Inherited from

[`Text`](Text.md).[`_fontFamily`](Text.md#_fontfamily)

***

### \_fontSize

> `protected` **\_fontSize**: `number`

Defined in: [mobjects/text/Text.ts:100](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L100)

#### Inherited from

[`Text`](Text.md).[`_fontSize`](Text.md#_fontsize)

***

### \_fontStyle

> `protected` **\_fontStyle**: `string`

Defined in: [mobjects/text/Text.ts:103](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L103)

#### Inherited from

[`Text`](Text.md).[`_fontStyle`](Text.md#_fontstyle)

***

### \_fontUrl?

> `protected` `optional` **\_fontUrl**: `string`

Defined in: [mobjects/text/Text.ts:111](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L111)

Optional font URL for glyph vector extraction

#### Inherited from

[`Text`](Text.md).[`_fontUrl`](Text.md#_fonturl)

***

### \_fontWeight

> `protected` **\_fontWeight**: `string` \| `number`

Defined in: [mobjects/text/Text.ts:102](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L102)

#### Inherited from

[`Text`](Text.md).[`_fontWeight`](Text.md#_fontweight)

***

### \_geometryDirty

> `protected` **\_geometryDirty**: `boolean` = `true`

Defined in: [core/VMobject.ts:50](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L50)

Whether geometry needs rebuild (separate from material dirty)

#### Inherited from

[`Text`](Text.md).[`_geometryDirty`](Text.md#_geometrydirty)

***

### \_glyphGroup

> `protected` **\_glyphGroup**: [`TextGlyphGroup`](TextGlyphGroup.md) = `null`

Defined in: [mobjects/text/Text.ts:113](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L113)

Cached glyph group (created lazily by loadGlyphs)

#### Inherited from

[`Text`](Text.md).[`_glyphGroup`](Text.md#_glyphgroup)

***

### \_letterSpacing

> `protected` **\_letterSpacing**: `number`

Defined in: [mobjects/text/Text.ts:107](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L107)

#### Inherited from

[`Text`](Text.md).[`_letterSpacing`](Text.md#_letterspacing)

***

### \_lineHeight

> `protected` **\_lineHeight**: `number`

Defined in: [mobjects/text/Text.ts:106](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L106)

#### Inherited from

[`Text`](Text.md).[`_lineHeight`](Text.md#_lineheight)

***

### \_mesh

> `protected` **\_mesh**: `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>, `Material` \| `Material`[], `Object3DEventMap`\> = `null`

Defined in: [mobjects/text/Text.ts:123](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L123)

Plane mesh for displaying the texture

#### Inherited from

[`Text`](Text.md).[`_mesh`](Text.md#_mesh)

***

### \_opacity

> `protected` **\_opacity**: `number` = `1`

Defined in: [core/Mobject.ts:80](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L80)

Overall opacity (0-1) - protected for backward compatibility

#### Inherited from

[`Text`](Text.md).[`_opacity`](Text.md#_opacity)

***

### \_points3D

> `protected` **\_points3D**: `number`[][] = `[]`

Defined in: [core/VMobject.ts:38](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L38)

Array of cubic Bezier control points in 3D.
Each point is [x, y, z].
Stored as: [anchor1, handle1, handle2, anchor2, handle3, handle4, anchor3, ...]

#### Inherited from

[`Text`](Text.md).[`_points3D`](Text.md#_points3d)

***

### \_strokeMaterial

> `protected` **\_strokeMaterial**: `LineMaterial` = `null`

Defined in: [core/VMobject.ts:44](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L44)

Three.js stroke material (Line2 LineMaterial for thick strokes)

#### Inherited from

[`Text`](Text.md).[`_strokeMaterial`](Text.md#_strokematerial)

***

### \_style

> `protected` **\_style**: [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:89](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L89)

Style properties for backward compatibility

#### Inherited from

[`Text`](Text.md).[`_style`](Text.md#_style)

***

### \_styledSegments

> `protected` **\_styledSegments**: `StyledTextSegment`[] = `[]`

Defined in: [mobjects/text/MarkupText.ts:627](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L627)

Parsed styled text segments

***

### \_text

> `protected` **\_text**: `string`

Defined in: [mobjects/text/Text.ts:99](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L99)

#### Inherited from

[`Text`](Text.md).[`_text`](Text.md#_text)

***

### \_textAlign

> `protected` **\_textAlign**: `"center"` \| `"left"` \| `"right"`

Defined in: [mobjects/text/Text.ts:108](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L108)

#### Inherited from

[`Text`](Text.md).[`_textAlign`](Text.md#_textalign)

***

### \_texture

> `protected` **\_texture**: `CanvasTexture`\<`HTMLCanvasElement`\> = `null`

Defined in: [mobjects/text/Text.ts:120](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L120)

Three.js texture from canvas

#### Inherited from

[`Text`](Text.md).[`_texture`](Text.md#_texture)

***

### \_threeObject

> **\_threeObject**: `Object3D`\<`Object3DEventMap`\> = `null`

Defined in: [core/Mobject.ts:92](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L92)

Three.js backing object

#### Inherited from

[`Text`](Text.md).[`_threeObject`](Text.md#_threeobject)

***

### \_visiblePointCount

> `protected` **\_visiblePointCount**: `number` = `null`

Defined in: [core/VMobject.ts:41](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L41)

Number of points visible (for Create animation)

#### Inherited from

[`Text`](Text.md).[`_visiblePointCount`](Text.md#_visiblepointcount)

***

### \_worldHeight

> `protected` **\_worldHeight**: `number` = `0`

Defined in: [mobjects/text/Text.ts:127](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L127)

#### Inherited from

[`Text`](Text.md).[`_worldHeight`](Text.md#_worldheight)

***

### \_worldWidth

> `protected` **\_worldWidth**: `number` = `0`

Defined in: [mobjects/text/Text.ts:126](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L126)

Cached dimensions in world units

#### Inherited from

[`Text`](Text.md).[`_worldWidth`](Text.md#_worldwidth)

***

### children

> **children**: [`Mobject`](Mobject.md)[] = `[]`

Defined in: [core/Mobject.ts:53](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L53)

Child mobjects

#### Inherited from

[`Text`](Text.md).[`children`](Text.md#children)

***

### fillOpacity

> **fillOpacity**: `number` = `0`

Defined in: [core/Mobject.ts:86](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L86)

Fill opacity (0-1)

#### Inherited from

[`Text`](Text.md).[`fillOpacity`](Text.md#fillopacity)

***

### id

> `readonly` **id**: `string`

Defined in: [core/Mobject.ts:47](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L47)

Unique identifier for this mobject

#### Inherited from

[`Text`](Text.md).[`id`](Text.md#id)

***

### parent

> **parent**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:50](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L50)

Parent mobject in hierarchy

#### Inherited from

[`Text`](Text.md).[`parent`](Text.md#parent)

***

### position

> **position**: `Vector3`

Defined in: [core/Mobject.ts:56](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L56)

Position in 3D space

#### Inherited from

[`Text`](Text.md).[`position`](Text.md#position)

***

### rotation

> **rotation**: `Euler`

Defined in: [core/Mobject.ts:59](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L59)

Rotation as Euler angles

#### Inherited from

[`Text`](Text.md).[`rotation`](Text.md#rotation)

***

### savedState

> **savedState**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:104](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L104)

Saved mobject copy (used by Restore animation in TransformExtensions).
Set by saveState().

#### Inherited from

[`Text`](Text.md).[`savedState`](Text.md#savedstate)

***

### scaleVector

> **scaleVector**: `Vector3`

Defined in: [core/Mobject.ts:62](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L62)

Scale factors (named scaleVector to avoid conflict with scale method)

#### Inherited from

[`Text`](Text.md).[`scaleVector`](Text.md#scalevector)

***

### strokeWidth

> **strokeWidth**: `number` = `4`

Defined in: [core/Mobject.ts:83](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L83)

Stroke width for outlines (default 4, matching Manim's thicker strokes)

#### Inherited from

[`Text`](Text.md).[`strokeWidth`](Text.md#strokewidth)

***

### targetCopy

> **targetCopy**: [`Mobject`](Mobject.md) = `null`

Defined in: [core/Mobject.ts:111](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L111)

Target copy used by generateTarget() / MoveToTarget animation.
Call generateTarget() to create a copy, modify targetCopy, then
play MoveToTarget to interpolate from current to target state.

#### Inherited from

[`Text`](Text.md).[`targetCopy`](Text.md#targetcopy)

***

### \_rendererHeight

> `static` **\_rendererHeight**: `number` = `450`

Defined in: [core/VMobject.ts:63](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L63)

#### Inherited from

[`Text`](Text.md).[`_rendererHeight`](Text.md#_rendererheight)

***

### \_rendererWidth

> `static` **\_rendererWidth**: `number` = `800`

Defined in: [core/VMobject.ts:62](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L62)

Renderer resolution for LineMaterial (set by Scene)

#### Inherited from

[`Text`](Text.md).[`_rendererWidth`](Text.md#_rendererwidth)

***

### useShaderCurves

> `static` **useShaderCurves**: `boolean` = `false`

Defined in: [core/VMobject.ts:71](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L71)

When true, VMobjects use GPU Bezier SDF shaders for stroke rendering
instead of the default Line2/LineMaterial approach. This produces
ManimGL-quality anti-aliased curves with variable stroke width and
round caps. Default: false (opt-in).

#### Inherited from

[`Text`](Text.md).[`useShaderCurves`](Text.md#useshadercurves)

## Accessors

### color

#### Get Signature

> **get** **color**(): `string`

Defined in: [core/Mobject.ts:67](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L67)

##### Returns

`string`

#### Set Signature

> **set** **color**(`value`): `void`

Defined in: [core/Mobject.ts:71](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L71)

##### Parameters

###### value

`string`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`color`](Text.md#color)

***

### fillColor

#### Get Signature

> **get** **fillColor**(): `string`

Defined in: [core/Mobject.ts:471](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L471)

Get the fill color

##### Returns

`string`

#### Set Signature

> **set** **fillColor**(`color`): `void`

Defined in: [core/Mobject.ts:478](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L478)

Set the fill color

##### Parameters

###### color

`string`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`fillColor`](Text.md#fillcolor)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Defined in: [core/Mobject.ts:902](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L902)

Check if this mobject needs sync

##### Returns

`boolean`

#### Inherited from

[`Text`](Text.md).[`isDirty`](Text.md#isdirty)

***

### numPoints

#### Get Signature

> **get** **numPoints**(): `number`

Defined in: [core/VMobject.ts:174](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L174)

Get the number of points

##### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`numPoints`](Text.md#numpoints)

***

### opacity

#### Get Signature

> **get** **opacity**(): `number`

Defined in: [core/Mobject.ts:145](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L145)

Get the overall opacity of the mobject

##### Returns

`number`

#### Set Signature

> **set** **opacity**(`value`): `void`

Defined in: [core/Mobject.ts:152](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L152)

Set the overall opacity of the mobject

##### Parameters

###### value

`number`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`opacity`](Text.md#opacity)

***

### points

#### Get Signature

> **get** **points**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:124](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L124)

Get all points as 2D Point objects (derived from _points3D)

##### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`Text`](Text.md).[`points`](Text.md#points)

***

### shaderCurves

#### Get Signature

> **get** **shaderCurves**(): `boolean`

Defined in: [core/VMobject.ts:107](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L107)

Check whether this instance should use shader-based Bezier curve rendering.
Returns the per-instance override if set, otherwise the class-level default.

##### Returns

`boolean`

#### Set Signature

> **set** **shaderCurves**(`value`): `void`

Defined in: [core/VMobject.ts:115](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L115)

Enable or disable shader-based Bezier curve rendering for this instance.
Pass `null` to revert to the class-level VMobject.useShaderCurves default.

##### Parameters

###### value

`boolean`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`shaderCurves`](Text.md#shadercurves)

***

### style

#### Get Signature

> **get** **style**(): [`MobjectStyle`](../interfaces/MobjectStyle.md)

Defined in: [core/Mobject.ts:160](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L160)

Get the style properties

##### Returns

[`MobjectStyle`](../interfaces/MobjectStyle.md)

#### Inherited from

[`Text`](Text.md).[`style`](Text.md#style)

***

### submobjects

#### Get Signature

> **get** **submobjects**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:192](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L192)

Get all submobjects (alias for children)

##### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Text`](Text.md).[`submobjects`](Text.md#submobjects)

***

### visiblePointCount

#### Get Signature

> **get** **visiblePointCount**(): `number`

Defined in: [core/VMobject.ts:181](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L181)

Get the number of visible points (for Create animation)

##### Returns

`number`

#### Set Signature

> **set** **visiblePointCount**(`count`): `void`

Defined in: [core/VMobject.ts:188](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L188)

Set the number of visible points (for Create animation)

##### Parameters

###### count

`number`

##### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`visiblePointCount`](Text.md#visiblepointcount)

## Methods

### \_buildEarcutFillGeometry()

> `protected` **\_buildEarcutFillGeometry**(`points3D`): `BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>

Defined in: [core/VMobject.ts:502](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L502)

Build a THREE.BufferGeometry for the filled region using earcut triangulation.

Earcut handles concave polygons, self-intersecting paths, and holes far
more robustly than Three.js' built-in ShapeGeometry triangulator, which
is a simple ear-clipping implementation that struggles with complex SVG
outlines.

If earcut returns zero triangles (completely degenerate input) we fall
back to THREE.ShapeGeometry so existing simple shapes still render.

#### Parameters

##### points3D

`number`[][]

The visible Bezier control points

#### Returns

`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>

A BufferGeometry ready for use as a fill mesh, or null if the
         polygon is too degenerate even for fallback.

#### Inherited from

[`Text`](Text.md).[`_buildEarcutFillGeometry`](Text.md#_buildearcutfillgeometry)

***

### \_buildFontString()

> `protected` **\_buildFontString**(): `string`

Defined in: [mobjects/text/Text.ts:257](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L257)

Build the CSS font string

#### Returns

`string`

#### Inherited from

[`Text`](Text.md).[`_buildFontString`](Text.md#_buildfontstring)

***

### \_buildStyledFontString()

> `protected` **\_buildStyledFontString**(`seg`): `string`

Defined in: [mobjects/text/MarkupText.ts:829](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L829)

Build a CSS font string for a styled segment.

#### Parameters

##### seg

`StyledTextSegment`

#### Returns

`string`

***

### \_createCopy()

> `protected` **\_createCopy**(): `MarkupText`

Defined in: [mobjects/text/MarkupText.ts:1077](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L1077)

Create a copy of this Text mobject

#### Returns

`MarkupText`

#### Overrides

[`Text`](Text.md).[`_createCopy`](Text.md#_createcopy)

***

### \_createThreeObject()

> `protected` **\_createThreeObject**(): `Object3D`

Defined in: [mobjects/text/Text.ts:440](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L440)

Create the Three.js backing object

#### Returns

`Object3D`

#### Inherited from

[`Text`](Text.md).[`_createThreeObject`](Text.md#_createthreeobject)

***

### \_drawTextWithLetterSpacing()

> `protected` **\_drawTextWithLetterSpacing**(`text`, `startX`, `y`, `_fontSize`): `void`

Defined in: [mobjects/text/Text.ts:379](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L379)

Draw text with custom letter spacing

#### Parameters

##### text

`string`

##### startX

`number`

##### y

`number`

##### \_fontSize

`number`

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_drawTextWithLetterSpacing`](Text.md#_drawtextwithletterspacing)

***

### \_getBoundingBox()

> `protected` **\_getBoundingBox**(): `object`

Defined in: [core/Mobject.ts:716](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L716)

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

[`Text`](Text.md).[`_getBoundingBox`](Text.md#_getboundingbox)

***

### \_getEdgeInDirection()

> `protected` **\_getEdgeInDirection**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:699](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L699)

Get the edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to get edge in

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`_getEdgeInDirection`](Text.md#_getedgeindirection)

***

### \_getPlainText()

> `protected` **\_getPlainText**(): `string`

Defined in: [mobjects/text/MarkupText.ts:848](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L848)

Get plain text without markup for compatibility

#### Returns

`string`

***

### \_initCanvas()

> `protected` **\_initCanvas**(): `void`

Defined in: [mobjects/text/Text.ts:169](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L169)

Initialize the off-screen canvas

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_initCanvas`](Text.md#_initcanvas)

***

### \_interpolatePointList3D()

> `protected` **\_interpolatePointList3D**(`points`, `targetCount`): `number`[][]

Defined in: [core/VMobject.ts:379](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L379)

Interpolate a 3D point list to have a specific number of points.

#### Parameters

##### points

`number`[][]

##### targetCount

`number`

#### Returns

`number`[][]

#### Inherited from

[`Text`](Text.md).[`_interpolatePointList3D`](Text.md#_interpolatepointlist3d)

***

### \_markDirty()

> **\_markDirty**(): `void`

Defined in: [core/Mobject.ts:882](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L882)

Mark this mobject as needing sync

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_markDirty`](Text.md#_markdirty)

***

### \_markDirtyUpward()

> **\_markDirtyUpward**(): `void`

Defined in: [core/Mobject.ts:891](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L891)

Mark this mobject and all ancestors as needing sync.
Use when a deep child's geometry changes and the parent tree must re-traverse.
Short-circuits if this node is already dirty (ancestors must be dirty too).

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_markDirtyUpward`](Text.md#_markdirtyupward)

***

### \_maxFontSizeInLine()

> `protected` **\_maxFontSizeInLine**(`segments`): `number`

Defined in: [mobjects/text/MarkupText.ts:893](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L893)

Get the maximum effective font size in a line (for line height calculation).

#### Parameters

##### segments

`StyledTextSegment`[]

#### Returns

`number`

***

### \_measureStyledLineWidth()

> `protected` **\_measureStyledLineWidth**(`segments`): `number`

Defined in: [mobjects/text/MarkupText.ts:878](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L878)

Measure the pixel width of a line of styled segments (after RESOLUTION_SCALE).

#### Parameters

##### segments

`StyledTextSegment`[]

#### Returns

`number`

***

### \_measureText()

> `protected` **\_measureText**(): `object`

Defined in: [mobjects/text/MarkupText.ts:906](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L906)

Split text into lines and measure dimensions

#### Returns

`object`

Object with lines array and canvas dimensions

##### height

> **height**: `number`

##### lines

> **lines**: `string`[]

##### width

> **width**: `number`

#### Overrides

[`Text`](Text.md).[`_measureText`](Text.md#_measuretext)

***

### \_parseLegacyMarkup()

> `protected` **\_parseLegacyMarkup**(`text`): `void`

Defined in: [mobjects/text/MarkupText.ts:731](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L731)

Legacy Markdown-style parsing (**bold**, *italic*, `code`)
for backward compatibility.

#### Parameters

##### text

`string`

#### Returns

`void`

***

### \_parseMarkup()

> `protected` **\_parseMarkup**(): `void`

Defined in: [mobjects/text/MarkupText.ts:689](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L689)

Parse the markup text into styled segments.

If the text contains Pango-like XML tags, use the XML parser.
Otherwise fall back to legacy Markdown-style parsing for backward compat.

#### Returns

`void`

***

### \_parsePangoMarkup()

> `protected` **\_parsePangoMarkup**(`text`): `void`

Defined in: [mobjects/text/MarkupText.ts:707](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L707)

Parse Pango-like XML markup

#### Parameters

##### text

`string`

#### Returns

`void`

***

### \_pointsToCurvePath()

> `protected` **\_pointsToCurvePath**(): `CurvePath`\<`Vector3`\>

Defined in: [core/VMobject.ts:456](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L456)

Convert points to a THREE.CurvePath for stroke rendering

#### Returns

`CurvePath`\<`Vector3`\>

#### Inherited from

[`Text`](Text.md).[`_pointsToCurvePath`](Text.md#_pointstocurvepath)

***

### \_pointsToShape()

> `protected` **\_pointsToShape**(): `Shape`

Defined in: [core/VMobject.ts:414](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L414)

Convert Bezier control points to a Three.js Shape for filled rendering.

#### Returns

`Shape`

THREE.Shape representing the path

#### Inherited from

[`Text`](Text.md).[`_pointsToShape`](Text.md#_pointstoshape)

***

### \_renderToCanvas()

> `protected` **\_renderToCanvas**(): `void`

Defined in: [mobjects/text/MarkupText.ts:944](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L944)

Render text to the off-screen canvas

#### Returns

`void`

#### Overrides

[`Text`](Text.md).[`_renderToCanvas`](Text.md#_rendertocanvas)

***

### \_resolveSegmentFontSize()

> `protected` **\_resolveSegmentFontSize**(`seg`): `number`

Defined in: [mobjects/text/MarkupText.ts:821](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L821)

Resolve a styled segment's effective font size (in CSS pixels, before RESOLUTION_SCALE).

#### Parameters

##### seg

`StyledTextSegment`

#### Returns

`number`

***

### \_splitStyledSegmentsByLine()

> `protected` **\_splitStyledSegmentsByLine**(): `StyledTextSegment`[][]

Defined in: [mobjects/text/MarkupText.ts:855](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L855)

Split styled segments by newlines into lines of segments.

#### Returns

`StyledTextSegment`[][]

***

### \_syncMaterialToThree()

> `protected` **\_syncMaterialToThree**(): `void`

Defined in: [mobjects/text/Text.ts:476](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L476)

Sync material properties to Three.js

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_syncMaterialToThree`](Text.md#_syncmaterialtothree)

***

### \_syncToThree()

> **\_syncToThree**(): `void`

Defined in: [core/Mobject.ts:836](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L836)

Sync transform properties to the Three.js object

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_syncToThree`](Text.md#_synctothree)

***

### \_updateGeometry()

> `protected` **\_updateGeometry**(`group`): `void`

Defined in: [core/VMobject.ts:705](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L705)

Update the geometry within the Three.js group.
Reuses existing Line2 / Mesh objects when possible to avoid expensive
dispose-and-recreate cycles during per-frame animation updates.

When `shaderCurves` is enabled, stroke rendering uses GPU Bezier SDF
shaders via BezierRenderer instead of the Line2 polyline approach.

#### Parameters

##### group

`Group`

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_updateGeometry`](Text.md#_updategeometry)

***

### \_updateMesh()

> `protected` **\_updateMesh**(): `void`

Defined in: [mobjects/text/Text.ts:426](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L426)

Update the mesh geometry to match new dimensions

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`_updateMesh`](Text.md#_updatemesh)

***

### add()

> **add**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:490](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L490)

Add a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to add

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`add`](Text.md#add)

***

### addPoints()

> **addPoints**(...`points`): `this`

Defined in: [core/VMobject.ts:213](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L213)

Add points to this VMobject using 2D Point objects

#### Parameters

##### points

...[`Point`](../interfaces/Point.md)[]

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`addPoints`](Text.md#addpoints)

***

### addPointsAsCorners()

> **addPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:268](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L268)

Add straight line segments from the last point to each corner.
Each corner creates a new cubic Bezier segment with linear handles.
Matches Manim's add_points_as_corners.

#### Parameters

##### corners

`number`[][]

Array of [x, y, z] corner points to connect to

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`addPointsAsCorners`](Text.md#addpointsascorners)

***

### addUpdater()

> **addUpdater**(`updater`, `callOnAdd`): `this`

Defined in: [core/Mobject.ts:950](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L950)

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

[`Text`](Text.md).[`addUpdater`](Text.md#addupdater)

***

### alignPoints()

> **alignPoints**(`target`): `void`

Defined in: [core/VMobject.ts:359](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L359)

Align points between this VMobject and a target so they have the same count.
This is necessary for smooth morphing animations.

#### Parameters

##### target

[`VMobject`](VMobject.md)

The target VMobject to align with

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`alignPoints`](Text.md#alignpoints)

***

### alignTo()

> **alignTo**(`target`, `direction`): `this`

Defined in: [core/Mobject.ts:664](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L664)

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

[`Text`](Text.md).[`alignTo`](Text.md#alignto)

***

### applyFunction()

> **applyFunction**(`fn`): `this`

Defined in: [core/Mobject.ts:1017](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1017)

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

[`Text`](Text.md).[`applyFunction`](Text.md#applyfunction)

***

### applyToFamily()

> **applyToFamily**(`func`): `this`

Defined in: [core/Mobject.ts:925](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L925)

Apply a function to this mobject and all descendants

#### Parameters

##### func

(`mobject`) => `void`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`applyToFamily`](Text.md#applytofamily)

***

### become()

> **become**(`other`): `this`

Defined in: [core/Mobject.ts:561](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L561)

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

[`Text`](Text.md).[`become`](Text.md#become)

***

### center()

> **center**(): `this`

Defined in: [core/Mobject.ts:797](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L797)

Center this mobject at origin

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`center`](Text.md#center)

***

### clearPoints()

> **clearPoints**(): `this`

Defined in: [core/VMobject.ts:302](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L302)

Clear all points

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`clearPoints`](Text.md#clearpoints)

***

### clearUpdaters()

> **clearUpdaters**(): `this`

Defined in: [core/Mobject.ts:975](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L975)

Remove all updaters

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`clearUpdaters`](Text.md#clearupdaters)

***

### copy()

> **copy**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:534](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L534)

Create a deep copy of this mobject

#### Returns

[`Mobject`](Mobject.md)

New mobject with copied properties

#### Inherited from

[`Text`](Text.md).[`copy`](Text.md#copy)

***

### dispose()

> **dispose**(): `void`

Defined in: [mobjects/text/Text.ts:571](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L571)

Clean up Three.js and canvas resources

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`dispose`](Text.md#dispose)

***

### flip()

> **flip**(`axis`): `this`

Defined in: [core/Mobject.ts:364](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L364)

Flip the mobject along an axis (mirror reflection).

#### Parameters

##### axis

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md) = `...`

Axis to flip across, defaults to RIGHT ([1,0,0]) for horizontal flip

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`flip`](Text.md#flip)

***

### generateTarget()

> **generateTarget**(): [`Mobject`](Mobject.md)

Defined in: [core/Mobject.ts:1085](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1085)

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

[`Text`](Text.md).[`generateTarget`](Text.md#generatetarget)

***

### getBottom()

> **getBottom**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:746](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L746)

Get the bottom edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Bottom edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getBottom`](Text.md#getbottom)

***

### getBounds()

> **getBounds**(): `object`

Defined in: [core/Mobject.ts:608](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L608)

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

[`Text`](Text.md).[`getBounds`](Text.md#getbounds)

***

### getCenter()

> **getCenter**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [mobjects/text/Text.ts:544](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L544)

Get the center of this text mobject

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Text`](Text.md).[`getCenter`](Text.md#getcenter)

***

### getCodeFontFamily()

> **getCodeFontFamily**(): `string`

Defined in: [mobjects/text/MarkupText.ts:654](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L654)

Get the code font family

#### Returns

`string`

***

### getEdge()

> **getEdge**(`direction`): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:730](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L730)

Get a specific edge point of the bounding box in a direction

#### Parameters

##### direction

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Direction to the edge point

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Edge point as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getEdge`](Text.md#getedge)

***

### getFamily()

> **getFamily**(): [`Mobject`](Mobject.md)[]

Defined in: [core/Mobject.ts:936](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L936)

Get all mobjects in the family (this mobject and all descendants)

#### Returns

[`Mobject`](Mobject.md)[]

#### Inherited from

[`Text`](Text.md).[`getFamily`](Text.md#getfamily)

***

### getFontFamily()

> **getFontFamily**(): `string`

Defined in: [mobjects/text/Text.ts:222](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L222)

Get the current font family

#### Returns

`string`

#### Inherited from

[`Text`](Text.md).[`getFontFamily`](Text.md#getfontfamily)

***

### getFontSize()

> **getFontSize**(): `number`

Defined in: [mobjects/text/Text.ts:201](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L201)

Get the current font size

#### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`getFontSize`](Text.md#getfontsize)

***

### getGlyphGroup()

> **getGlyphGroup**(): [`TextGlyphGroup`](TextGlyphGroup.md)

Defined in: [mobjects/text/Text.ts:493](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L493)

Get the cached TextGlyphGroup (null until loadGlyphs() resolves).

#### Returns

[`TextGlyphGroup`](TextGlyphGroup.md)

#### Inherited from

[`Text`](Text.md).[`getGlyphGroup`](Text.md#getglyphgroup)

***

### getHeight()

> **getHeight**(): `number`

Defined in: [mobjects/text/Text.ts:250](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L250)

Get text height in world units

#### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`getHeight`](Text.md#getheight)

***

### getLeft()

> **getLeft**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:754](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L754)

Get the left edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Left edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getLeft`](Text.md#getleft)

***

### getPoints()

> **getPoints**(): `number`[][]

Defined in: [core/VMobject.ts:167](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L167)

Get all points defining this VMobject as 3D arrays

#### Returns

`number`[][]

Copy of the points array

#### Inherited from

[`Text`](Text.md).[`getPoints`](Text.md#getpoints)

***

### getRight()

> **getRight**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:762](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L762)

Get the right edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Right edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getRight`](Text.md#getright)

***

### getStyledSegments()

> **getStyledSegments**(): readonly `StyledTextSegment`[]

Defined in: [mobjects/text/MarkupText.ts:675](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L675)

Get the parsed styled segments (useful for inspection / testing)

#### Returns

readonly `StyledTextSegment`[]

***

### getText()

> **getText**(): `string`

Defined in: [mobjects/text/Text.ts:180](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L180)

Get the current text content

#### Returns

`string`

#### Inherited from

[`Text`](Text.md).[`getText`](Text.md#gettext)

***

### getTextureMesh()

> **getTextureMesh**(): `Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>, `Material` \| `Material`[], `Object3DEventMap`\>

Defined in: [mobjects/text/Text.ts:537](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L537)

Get the texture mesh (for animation cross-fade access).

#### Returns

`Mesh`\<`BufferGeometry`\<`NormalBufferAttributes`, `BufferGeometryEventMap`\>, `Material` \| `Material`[], `Object3DEventMap`\>

#### Inherited from

[`Text`](Text.md).[`getTextureMesh`](Text.md#gettexturemesh)

***

### getThreeObject()

> **getThreeObject**(): `Object3D`

Defined in: [core/Mobject.ts:909](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L909)

Get the Three.js object, creating it if necessary

#### Returns

`Object3D`

#### Inherited from

[`Text`](Text.md).[`getThreeObject`](Text.md#getthreeobject)

***

### getTop()

> **getTop**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/Mobject.ts:738](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L738)

Get the top edge center

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Top edge center as [x, y, z]

#### Inherited from

[`Text`](Text.md).[`getTop`](Text.md#gettop)

***

### getUnitVector()

> **getUnitVector**(): [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Defined in: [core/VMobject.ts:1059](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L1059)

Get the unit vector from the first to the last point of this VMobject,
accounting for the object's current rotation transform.

#### Returns

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Inherited from

[`Text`](Text.md).[`getUnitVector`](Text.md#getunitvector)

***

### getUpdaters()

> **getUpdaters**(): [`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

Defined in: [core/Mobject.ts:992](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L992)

Get all updaters (for internal use)

#### Returns

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)[]

A copy of the updaters array

#### Inherited from

[`Text`](Text.md).[`getUpdaters`](Text.md#getupdaters)

***

### getVisiblePoints()

> **getVisiblePoints**(): [`Point`](../interfaces/Point.md)[]

Defined in: [core/VMobject.ts:197](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L197)

Get points that should be visible (for rendering) as 2D Points

#### Returns

[`Point`](../interfaces/Point.md)[]

#### Inherited from

[`Text`](Text.md).[`getVisiblePoints`](Text.md#getvisiblepoints)

***

### getVisiblePoints3D()

> **getVisiblePoints3D**(): `number`[][]

Defined in: [core/VMobject.ts:205](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L205)

Get points that should be visible (for rendering) as 3D arrays

#### Returns

`number`[][]

#### Inherited from

[`Text`](Text.md).[`getVisiblePoints3D`](Text.md#getvisiblepoints3d)

***

### getWidth()

> **getWidth**(): `number`

Defined in: [mobjects/text/Text.ts:243](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L243)

Get text width in world units

#### Returns

`number`

#### Inherited from

[`Text`](Text.md).[`getWidth`](Text.md#getwidth)

***

### hasUpdaters()

> **hasUpdaters**(): `boolean`

Defined in: [core/Mobject.ts:984](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L984)

Check if this mobject has any updaters

#### Returns

`boolean`

true if the mobject has updaters

#### Inherited from

[`Text`](Text.md).[`hasUpdaters`](Text.md#hasupdaters)

***

### interpolate()

> **interpolate**(`target`, `alpha`): `this`

Defined in: [core/VMobject.ts:316](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L316)

Interpolate this VMobject towards a target VMobject

#### Parameters

##### target

[`VMobject`](VMobject.md)

The target VMobject to interpolate towards

##### alpha

`number`

Progress from 0 (this) to 1 (target)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`interpolate`](Text.md#interpolate)

***

### loadGlyphs()

> **loadGlyphs**(`options?`): `Promise`\<[`TextGlyphGroup`](TextGlyphGroup.md)\>

Defined in: [mobjects/text/Text.ts:506](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L506)

Lazily create a TextGlyphGroup from the font file at _fontUrl.
Returns null if no fontUrl was provided.

#### Parameters

##### options?

###### skeletonOptions?

[`SkeletonizeOptions`](../interfaces/SkeletonizeOptions.md)

Fine-tuning options for the skeletonization
  algorithm (grid resolution, smoothing, etc.).

###### useSkeletonStroke?

`boolean`

When true, each glyph computes its
  skeleton (medial axis) for center-line stroke animation. Default: false.

#### Returns

`Promise`\<[`TextGlyphGroup`](TextGlyphGroup.md)\>

#### Inherited from

[`Text`](Text.md).[`loadGlyphs`](Text.md#loadglyphs)

***

### moveTo()

> **moveTo**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:215](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L215)

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

[`Text`](Text.md).[`moveTo`](Text.md#moveto)

***

### moveToAligned()

> **moveToAligned**(`target`, `alignedEdge?`): `this`

Defined in: [core/Mobject.ts:686](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L686)

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

[`Text`](Text.md).[`moveToAligned`](Text.md#movetoaligned)

***

### nextTo()

> **nextTo**(`target`, `direction`, `buff`): `this`

Defined in: [core/Mobject.ts:632](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L632)

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

[`Text`](Text.md).[`nextTo`](Text.md#nextto)

***

### prepareForNonlinearTransform()

> **prepareForNonlinearTransform**(`numPieces`): `this`

Defined in: [core/Mobject.ts:1037](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1037)

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

[`Text`](Text.md).[`prepareForNonlinearTransform`](Text.md#preparefornonlineartransform)

***

### remove()

> **remove**(...`mobjects`): `this`

Defined in: [core/Mobject.ts:515](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L515)

Remove a child mobject (supports multiple arguments for backward compatibility)

#### Parameters

##### mobjects

...[`Mobject`](Mobject.md)[]

Child mobjects to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`remove`](Text.md#remove)

***

### removeUpdater()

> **removeUpdater**(`updater`): `this`

Defined in: [core/Mobject.ts:963](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L963)

Remove an updater function

#### Parameters

##### updater

[`UpdaterFunction`](../type-aliases/UpdaterFunction.md)

The updater function to remove

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`removeUpdater`](Text.md#removeupdater)

***

### restoreState()

> **restoreState**(): `boolean`

Defined in: [core/Mobject.ts:1131](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1131)

Restore this mobject to its previously saved state (from saveState).
Uses the deep copy stored on `this.savedState` to restore all properties.

#### Returns

`boolean`

true if state was restored, false if no saved state exists

#### Inherited from

[`Text`](Text.md).[`restoreState`](Text.md#restorestate)

***

### rotate()

> **rotate**(`angle`, `axisOrOptions?`): `this`

Defined in: [core/Mobject.ts:245](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L245)

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

[`Text`](Text.md).[`rotate`](Text.md#rotate)

***

### rotateAboutOrigin()

> **rotateAboutOrigin**(`angle`, `axis`): `this`

Defined in: [core/Mobject.ts:355](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L355)

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

[`Text`](Text.md).[`rotateAboutOrigin`](Text.md#rotateaboutorigin)

***

### saveState()

> **saveState**(): `this`

Defined in: [core/Mobject.ts:1106](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1106)

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

[`Text`](Text.md).[`saveState`](Text.md#savestate)

***

### scale()

> **scale**(`factor`): `this`

Defined in: [core/Mobject.ts:378](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L378)

Scale the mobject uniformly or non-uniformly

#### Parameters

##### factor

Scale factor (number for uniform, tuple for non-uniform)

`number` | [`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`scale`](Text.md#scale)

***

### setCodeFontFamily()

> **setCodeFontFamily**(`family`): `this`

Defined in: [mobjects/text/MarkupText.ts:663](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L663)

Set the code font family

#### Parameters

##### family

`string`

CSS font family for code / tt text

#### Returns

`this`

this for chaining

***

### setColor()

> **setColor**(`color`): `this`

Defined in: [core/Mobject.ts:396](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L396)

Set the mobject's color
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### color

`string`

CSS color string

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setColor`](Text.md#setcolor)

***

### setFill()

> **setFill**(`color?`, `opacity?`): `this`

Defined in: [core/Mobject.ts:458](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L458)

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

[`Text`](Text.md).[`setFill`](Text.md#setfill)

***

### setFillOpacity()

> **setFillOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:442](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L442)

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

[`Text`](Text.md).[`setFillOpacity`](Text.md#setfillopacity)

***

### setFontFamily()

> **setFontFamily**(`family`): `this`

Defined in: [mobjects/text/Text.ts:231](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L231)

Set font family and re-render

#### Parameters

##### family

`string`

CSS font family string

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setFontFamily`](Text.md#setfontfamily)

***

### setFontSize()

> **setFontSize**(`size`): `this`

Defined in: [mobjects/text/Text.ts:210](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/Text.ts#L210)

Set font size and re-render

#### Parameters

##### size

`number`

Font size in pixels

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setFontSize`](Text.md#setfontsize)

***

### setOpacity()

> **setOpacity**(`opacity`): `this`

Defined in: [core/Mobject.ts:410](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L410)

Set the mobject's overall opacity
Only marks dirty if value actually changed (performance optimization).

#### Parameters

##### opacity

`number`

Opacity value (0-1)

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setOpacity`](Text.md#setopacity)

***

### setPoints()

> **setPoints**(`points`): `this`

Defined in: [core/VMobject.ts:134](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L134)

Set the points defining this VMobject.
Accepts either Point[] ({x, y} objects) or number[][] ([x, y, z] arrays).

#### Parameters

##### points

Array of points in either format

`number`[][] | [`Point`](../interfaces/Point.md)[]

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setPoints`](Text.md#setpoints)

***

### setPoints3D()

> **setPoints3D**(`points`): `this`

Defined in: [core/VMobject.ts:159](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L159)

Set the points defining this VMobject using 3D arrays (alias for setPoints with number[][])

#### Parameters

##### points

`number`[][]

Array of [x, y, z] control points for cubic Bezier curves

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setPoints3D`](Text.md#setpoints3d)

***

### setPointsAsCorners()

> **setPointsAsCorners**(`corners`): `this`

Defined in: [core/VMobject.ts:227](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/VMobject.ts#L227)

Set the points to form straight line segments between corner points.
Each pair of consecutive corners becomes a cubic Bezier with linear handles.
Matches Manim's set_points_as_corners.

#### Parameters

##### corners

`number`[][]

Array of [x, y, z] corner points

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`setPointsAsCorners`](Text.md#setpointsascorners)

***

### setStrokeWidth()

> **setStrokeWidth**(`width`): `this`

Defined in: [core/Mobject.ts:426](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L426)

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

[`Text`](Text.md).[`setStrokeWidth`](Text.md#setstrokewidth)

***

### setStyle()

> **setStyle**(`style`): `this`

Defined in: [core/Mobject.ts:167](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L167)

Set style properties

#### Parameters

##### style

`Partial`\<[`MobjectStyle`](../interfaces/MobjectStyle.md)\>

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setStyle`](Text.md#setstyle)

***

### setText()

> **setText**(`text`): `this`

Defined in: [mobjects/text/MarkupText.ts:642](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/mobjects/text/MarkupText.ts#L642)

Set new text content and re-parse markup

#### Parameters

##### text

`string`

#### Returns

`this`

#### Overrides

[`Text`](Text.md).[`setText`](Text.md#settext)

***

### setX()

> **setX**(`x`): `this`

Defined in: [core/Mobject.ts:770](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L770)

Set the x-coordinate of this mobject's center, preserving y and z.
Matches Manim Python's set_x() behavior.

#### Parameters

##### x

`number`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setX`](Text.md#setx)

***

### setY()

> **setY**(`y`): `this`

Defined in: [core/Mobject.ts:779](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L779)

Set the y-coordinate of this mobject's center, preserving x and z.
Matches Manim Python's set_y() behavior.

#### Parameters

##### y

`number`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setY`](Text.md#sety)

***

### setZ()

> **setZ**(`z`): `this`

Defined in: [core/Mobject.ts:788](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L788)

Set the z-coordinate of this mobject's center, preserving x and y.
Matches Manim Python's set_z() behavior.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Inherited from

[`Text`](Text.md).[`setZ`](Text.md#setz)

***

### shift()

> **shift**(`delta`): `this`

Defined in: [core/Mobject.ts:201](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L201)

Translate the mobject by a delta

#### Parameters

##### delta

[`Vector3Tuple`](../type-aliases/Vector3Tuple.md)

Translation vector [x, y, z]

#### Returns

`this`

this for chaining

#### Inherited from

[`Text`](Text.md).[`shift`](Text.md#shift)

***

### toCorner()

> **toCorner**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:829](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L829)

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

[`Text`](Text.md).[`toCorner`](Text.md#tocorner)

***

### toEdge()

> **toEdge**(`direction`, `buff`): `this`

Defined in: [core/Mobject.ts:807](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L807)

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

[`Text`](Text.md).[`toEdge`](Text.md#toedge)

***

### update()

> **update**(`dt`): `void`

Defined in: [core/Mobject.ts:1001](https://github.com/maloyan/manim-js/blob/f77403d9d2350b95d57aff0649ec7fe97066a5b8/src/core/Mobject.ts#L1001)

Run all updaters with given dt
Called by Scene during render loop

#### Parameters

##### dt

`number`

Delta time in seconds since last frame

#### Returns

`void`

#### Inherited from

[`Text`](Text.md).[`update`](Text.md#update)
